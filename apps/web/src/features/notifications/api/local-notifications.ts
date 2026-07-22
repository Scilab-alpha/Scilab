import type { NotificationItem } from "@/features/notifications/types/notification.types";
import { listLocalFollows } from "@/features/follows/api/local-follows";
import { publishNotificationPopup } from "@/features/notifications/lib/notification-popup";

export const LOCAL_NOTIFICATIONS_STORAGE_KEY = "scilab_local_notifications";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readAll(): NotificationItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NotificationItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: NotificationItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    LOCAL_NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(items),
  );
}

export function listLocalNotifications(): NotificationItem[] {
  return readAll()
    .map(normalizeLocalNotification)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/** Fix older bookmark alerts that stored the generic phrase as the title. */
function normalizeLocalNotification(item: NotificationItem): NotificationItem {
  if (
    item.notificationId.startsWith("local-bookmark-") &&
    item.title === "Article bookmarked" &&
    item.message.trim()
  ) {
    return {
      ...item,
      title: item.message,
      message: "Saved to your bookmarks.",
    };
  }
  return item;
}

export function getLocalUnreadCount() {
  return readAll().filter((item) => !item.isRead).length;
}

export function upsertLocalNotification(
  item: Omit<NotificationItem, "isRead" | "readAt" | "createdAt"> & {
    createdAt?: string;
  },
  options: { popup?: boolean } = {},
) {
  const existing = readAll();
  if (existing.some((row) => row.notificationId === item.notificationId)) {
    return null;
  }

  const created: NotificationItem = {
    ...item,
    isRead: false,
    readAt: null,
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
  existing.unshift(created);
  writeAll(existing.slice(0, 200));
  if (options.popup) {
    publishNotificationPopup(created, "local");
  }
  return created;
}

export function markLocalNotificationRead(notificationId: string) {
  const existing = readAll();
  const next = existing.map((item) =>
    item.notificationId === notificationId
      ? { ...item, isRead: true, readAt: new Date().toISOString() }
      : item,
  );
  writeAll(next);
  return next.find((item) => item.notificationId === notificationId) ?? null;
}

export function markAllLocalNotificationsRead() {
  const existing = readAll();
  let updatedCount = 0;
  const readAt = new Date().toISOString();
  const next = existing.map((item) => {
    if (item.isRead) return item;
    updatedCount += 1;
    return { ...item, isRead: true, readAt };
  });
  writeAll(next);
  return { updatedCount };
}

/** Create in-app alerts for articles matching locally followed journals/topics/keywords. */
export function syncLocalFollowNotifications(
  articles: Array<{
    article: { id: string; title: string };
    journal?: { id?: string; displayName?: string | null } | null;
    topics?: Array<{ id: string; displayName?: string | null }>;
    keywords?: Array<{ id: string; displayName?: string | null }>;
  }>,
) {
  const follows = listLocalFollows();
  if (follows.length === 0 || articles.length === 0) {
    return 0;
  }

  const followedJournals = new Map(
    follows
      .filter((item) => item.objectType === "JOURNAL")
      .map((item) => [item.objectId, item.target.displayName]),
  );
  const followedTopics = new Set(
    follows
      .filter((item) => item.objectType === "TOPIC")
      .map((item) => item.objectId),
  );
  const followedKeywords = new Set(
    follows
      .filter((item) => item.objectType === "KEYWORD")
      .map((item) => item.objectId),
  );

  let created = 0;
  for (const graph of articles) {
    const journalId = graph.journal?.id;
    const matchedJournal =
      journalId && followedJournals.has(journalId)
        ? followedJournals.get(journalId)
        : null;
    const matchedTopic = graph.topics?.find((topic) =>
      followedTopics.has(topic.id),
    );
    const matchedKeyword = graph.keywords?.find((keyword) =>
      followedKeywords.has(keyword.id),
    );

    if (!matchedJournal && !matchedTopic && !matchedKeyword) {
      continue;
    }

    const sourceLabel =
      matchedJournal ||
      matchedTopic?.displayName ||
      matchedKeyword?.displayName ||
      "your follows";

    const inserted = upsertLocalNotification({
      notificationId: `local-article-${graph.article.id}`,
      title: "New article from your follows",
      message: `${graph.article.title} · ${sourceLabel}`,
      relatedObjectType: "ARTICLE",
      relatedObjectId: graph.article.id,
    });
    if (inserted) created += 1;
  }

  return created;
}

export function notifyFollowStarted(input: {
  objectType: "JOURNAL" | "KEYWORD" | "TOPIC";
  objectId: string;
  displayName: string;
}) {
  return upsertLocalNotification(
    {
      notificationId: `local-follow-${input.objectType}-${input.objectId}`,
      title: `Following ${input.displayName}`,
      message:
        "We'll alert you here when matching new articles appear in your catalog.",
      relatedObjectType: input.objectType,
      relatedObjectId: input.objectId,
    },
    { popup: true },
  );
}

export function notifyBookmarkSaved(input: {
  articleId: string;
  title: string;
}) {
  const articleTitle = input.title.trim() || input.articleId;
  const payload = {
    notificationId: `local-bookmark-${input.articleId}`,
    title: articleTitle,
    message: "Saved to your bookmarks.",
    relatedObjectType: "ARTICLE" as const,
    relatedObjectId: input.articleId,
  };

  const inserted = upsertLocalNotification(payload, { popup: true });

  if (!inserted) {
    publishNotificationPopup(
      {
        ...payload,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      },
      "local",
    );
  }

  return inserted;
}
