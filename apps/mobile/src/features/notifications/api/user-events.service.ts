import { appConfig } from "@/constants/app-config";
import type {
  UserEventPayload,
  UserEventType,
} from "@/features/notifications/types/notification.type";

type UserEventsSubscription = {
  close: () => void;
};

type UserEventsSubscriptionInput = {
  accessToken: string;
  onError: (message: string) => void;
  onEvent: (event: UserEventPayload) => void;
  onOpen: () => void;
};

const eventTypes = new Set<UserEventType>([
  "notification.created",
  "notification.read",
  "notification.read_all",
  "bookmark.toggled",
  "follow.toggled",
  "follow.updated",
  "ping",
]);

export function subscribeToUserEvents({
  accessToken,
  onError,
  onEvent,
  onOpen,
}: UserEventsSubscriptionInput): UserEventsSubscription {
  const xhr = new XMLHttpRequest();
  let buffer = "";
  let closed = false;
  let opened = false;
  let processedLength = 0;

  xhr.open("GET", `${appConfig.apiUrl}/events`);
  xhr.setRequestHeader("Accept", "text/event-stream");
  xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
  xhr.setRequestHeader("Cache-Control", "no-cache");

  xhr.onreadystatechange = () => {
    if (closed) {
      return;
    }

    if (!opened && xhr.readyState >= 2) {
      if (xhr.status >= 200 && xhr.status < 300) {
        opened = true;
        onOpen();
      } else if (xhr.status > 0) {
        closed = true;
        onError(getConnectionErrorMessage(xhr));
        xhr.abort();
      }
    }

    if (xhr.readyState === 4 && !closed) {
      closed = true;
      onError("Realtime notifications disconnected.");
    }
  };

  xhr.onprogress = () => {
    if (closed || !opened) {
      return;
    }

    const responseText = xhr.responseText ?? "";
    const chunk = responseText.slice(processedLength);
    processedLength = responseText.length;
    buffer = consumeSseChunk(buffer + chunk, onEvent);
  };

  xhr.onerror = () => {
    if (closed) {
      return;
    }

    closed = true;
    onError("Unable to connect to realtime notifications.");
  };

  xhr.send();

  return {
    close: () => {
      closed = true;
      xhr.abort();
    },
  };
}

function consumeSseChunk(
  input: string,
  onEvent: (event: UserEventPayload) => void,
) {
  const normalized = input.replace(/\r\n/g, "\n");
  const blocks = normalized.split("\n\n");
  const nextBuffer = blocks.pop() ?? "";

  blocks.forEach((block) => {
    const event = parseSseBlock(block);
    if (event) {
      onEvent(event);
    }
  });

  return nextBuffer;
}

function parseSseBlock(block: string): UserEventPayload | null {
  const fields = block.split("\n").reduce(
    (current, line) => {
      if (!line || line.startsWith(":")) {
        return current;
      }

      const separatorIndex = line.indexOf(":");
      const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
      const rawValue =
        separatorIndex >= 0 ? line.slice(separatorIndex + 1) : "";
      const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

      if (field === "id") {
        current.id = value;
      }

      if (field === "event" || field === "type") {
        current.type = value;
      }

      if (field === "data") {
        current.data.push(value);
      }

      return current;
    },
    { data: [] as string[], id: "", type: "" },
  );

  const dataText = fields.data.join("\n");
  if (!dataText) {
    return null;
  }

  const parsed = parseJsonObject(dataText);
  const parsedType = normalizeEventType(getString(parsed.type));
  const type = normalizeEventType(fields.type) ?? parsedType;

  if (!type) {
    return null;
  }

  return {
    data: parsed.data ?? {},
    eventId:
      getString(parsed.eventId) ||
      fields.id ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    occurredAt: getString(parsed.occurredAt) || new Date().toISOString(),
    type,
  };
}

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function normalizeEventType(value: string | null): UserEventType | null {
  return value && eventTypes.has(value as UserEventType)
    ? (value as UserEventType)
    : null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getConnectionErrorMessage(xhr: XMLHttpRequest) {
  if (xhr.status === 401) {
    return "Please sign in again to receive notifications.";
  }

  if (xhr.status >= 500) {
    return "Notification service is temporarily unavailable.";
  }

  return "Unable to open realtime notifications.";
}
