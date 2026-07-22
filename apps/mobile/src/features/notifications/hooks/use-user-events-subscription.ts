import { useEffect, useState } from "react";

import { subscribeToUserEvents } from "@/features/notifications/api/user-events.service";
import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { useAuthStore } from "@/store/auth.store";

export function useUserEventsSubscription() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const notifications = useNotificationStore.getState();

    if (!isHydrated) {
      return undefined;
    }

    if (!isAuthenticated || !accessToken) {
      notifications.resetNotifications();
      return undefined;
    }

    notifications.setConnectionStatus("connecting");

    const subscription = subscribeToUserEvents({
      accessToken,
      onError: (message) => {
        if (!active) {
          return;
        }

        useNotificationStore.getState().setConnectionError(message);
        retryTimer = setTimeout(
          () => setRetryKey((current) => current + 1),
          getRetryDelay(retryKey),
        );
      },
      onEvent: (event) => {
        useNotificationStore.getState().receiveUserEvent(event);
      },
      onOpen: () => {
        useNotificationStore.getState().setConnectionStatus("connected");
      },
    });

    return () => {
      active = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      subscription.close();
    };
  }, [accessToken, isAuthenticated, isHydrated, retryKey]);
}

function getRetryDelay(retryKey: number) {
  return Math.min(30_000, 2_000 + retryKey * 1_000);
}
