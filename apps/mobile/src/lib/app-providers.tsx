import { useEffect, type PropsWithChildren } from "react";

import { QueryProvider } from "@/lib/query-provider";
import { useAuthStore } from "@/store/auth.store";

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  return <QueryProvider>{children}</QueryProvider>;
}
