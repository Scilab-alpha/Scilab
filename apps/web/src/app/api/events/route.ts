import { NextRequest, NextResponse } from "next/server";
import {
  bffErrorResponse,
  getUpstreamApiOrigin,
  resolveSessionAccessToken,
  setAuthCookies,
} from "@/features/auth/server/auth-bff";
import type { NotificationItem } from "@/features/notifications/types/notification.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One upstream poll (at most one batch of events) every 30 seconds. */
const POLL_INTERVAL_MS = 30_000;
const POLL_PAGE_LIMIT = 20;

function extractNotificationItems(payload: unknown): NotificationItem[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const items = Array.isArray(data.items) ? data.items : [];
  return items.filter(
    (item): item is NotificationItem =>
      !!item &&
      typeof item === "object" &&
      typeof (item as NotificationItem).notificationId === "string",
  );
}

/**
 * SSE endpoint that polls the Nest API every 30s and emits new unread
 * notifications as `notification.created` events. Polling keeps the stream
 * working on serverless hosting where proxying a long-lived upstream SSE
 * connection is unreliable; the browser EventSource reconnects on drop.
 */
export async function GET(request: NextRequest) {
  const session = await resolveSessionAccessToken(request);
  if (!session) {
    return bffErrorResponse(401, "Authentication required.");
  }

  const accessToken =
    session.refreshedSession?.tokens.accessToken ?? session.accessToken;
  const upstreamUrl = new URL(
    `notifications?isRead=false&page=1&limit=${POLL_PAGE_LIMIT}`,
    `${getUpstreamApiOrigin()}/`,
  );

  const encoder = new TextEncoder();
  const seenIds = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const close = () => {
        if (closed) {
          return;
        }
        closed = true;
        if (timer) {
          clearTimeout(timer);
        }
        try {
          controller.close();
        } catch {
          // Stream already closed by the runtime.
        }
      };

      const send = (chunk: string) => {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          close();
        }
      };

      const poll = async (emitEvents: boolean) => {
        let items: NotificationItem[] = [];
        try {
          const upstream = await fetch(upstreamUrl, {
            headers: {
              accept: "application/json",
              authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          });
          if (upstream.status === 401) {
            // Token expired mid-stream; end so the client reconnects
            // and refreshes its session through the normal BFF flow.
            close();
            return;
          }
          if (upstream.ok) {
            items = extractNotificationItems(await upstream.json());
          }
        } catch {
          // Transient upstream failure; retry on the next tick.
        }

        // Oldest first so toasts arrive in chronological order.
        for (const item of [...items].reverse()) {
          if (seenIds.has(item.notificationId)) {
            continue;
          }
          seenIds.add(item.notificationId);
          if (emitEvents) {
            send(
              `event: notification.created\ndata: ${JSON.stringify(item)}\n\n`,
            );
          }
        }
      };

      const tick = async () => {
        if (closed) {
          return;
        }
        await poll(true);
        send(`: ping ${Date.now()}\n\n`);
        if (!closed) {
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      };

      request.signal.addEventListener("abort", close);

      send("retry: 5000\n\n");
      // Seed currently-unread items silently so connects don't replay toasts.
      void poll(false).then(() => {
        if (!closed) {
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      });
    },
    cancel() {
      closed = true;
      if (timer) {
        clearTimeout(timer);
      }
    },
  });

  const response = new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });

  if (session.refreshedSession) {
    setAuthCookies(
      response,
      session.refreshedSession.tokens,
      session.refreshedSession.remember,
    );
  }

  return response;
}
