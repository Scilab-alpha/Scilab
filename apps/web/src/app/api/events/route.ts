import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  bffErrorResponse,
  getUpstreamApiOrigin,
  resolveSessionAccessToken,
  setAuthCookies,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Proxies Nest SSE `/events` with the HttpOnly access cookie as Bearer. */
export async function GET(request: NextRequest) {
  const session = await resolveSessionAccessToken(request);
  if (!session) {
    return bffErrorResponse(401, "Authentication required.");
  }

  const upstreamUrl = new URL("events", `${getUpstreamApiOrigin()}/`);
  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: {
        accept: "text/event-stream",
        authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return bffErrorResponse(502, "Event stream is unavailable.");
  }

  if (!upstream.ok || !upstream.body) {
    if (upstream.status === 401) {
      const response = bffErrorResponse(401, "Authentication required.");
      response.cookies.set(ACCESS_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api",
        maxAge: 0,
      });
      return response;
    }

    return bffErrorResponse(
      upstream.status >= 400 ? upstream.status : 502,
      "Event stream is unavailable.",
    );
  }

  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const response = new NextResponse(upstream.body, {
    status: 200,
    headers,
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
