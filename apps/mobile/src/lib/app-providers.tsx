import { useEffect, type PropsWithChildren } from "react";

import { ToastProvider, useToast } from "@/components/ui";
import {
  getCurrentUser,
  refreshTokens,
} from "@/features/auth/api/auth.service";
import { QueryProvider } from "@/lib/query-provider";
import { ApiError, setApiAuthRecoveryHandler } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { useThemeModeStore } from "@/theme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeBootstrap>
      <QueryProvider>
        <ToastProvider>
          <AuthBootstrap>{children}</AuthBootstrap>
        </ToastProvider>
      </QueryProvider>
    </ThemeBootstrap>
  );
}

function ThemeBootstrap({ children }: PropsWithChildren) {
  useEffect(() => {
    void useThemeModeStore.getState().hydrate();
  }, []);

  return children;
}

function AuthBootstrap({ children }: PropsWithChildren) {
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    setApiAuthRecoveryHandler(async () => {
      const { clearSession, refreshToken, replaceTokens } =
        useAuthStore.getState();

      if (!refreshToken) {
        return false;
      }

      try {
        const tokens = await refreshTokens(refreshToken);
        await replaceTokens(tokens);
        return true;
      } catch {
        await clearSession();
        return false;
      }
    });

    async function bootstrapAuth() {
      await useAuthStore.getState().hydrate();

      const { accessToken, clearSession, setUser } = useAuthStore.getState();

      if (!accessToken) {
        return;
      }

      try {
        const user = await getCurrentUser();

        if (active) {
          setUser(user);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearSession();

          if (active) {
            showToast("Your session has expired. Please sign in again.", {
              title: "Session expired",
              tone: "error",
            });
          }
        }
      }
    }

    void bootstrapAuth();

    return () => {
      active = false;
      setApiAuthRecoveryHandler(null);
    };
  }, [showToast]);

  return children;
}
