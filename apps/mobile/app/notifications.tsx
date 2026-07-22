import { Redirect } from "expo-router";

import { NotificationsScreen } from "@/features/notifications/screens/notifications-screen";
import { useAuthStore } from "@/store/auth.store";

export default function NotificationsRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  if (isHydrated && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <NotificationsScreen />;
}
