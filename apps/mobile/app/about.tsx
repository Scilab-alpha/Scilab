import { Redirect } from "expo-router";

import { AboutScreen } from "@/features/profile/screens/about-screen";
import { useAuthStore } from "@/store/auth.store";

export default function AboutRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  if (isHydrated && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <AboutScreen />;
}
