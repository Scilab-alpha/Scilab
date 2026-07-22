"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { canAccessRoute } from "@/shared/constants/route-access";

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * Lets the route mount immediately so pages can show their own API loading UI.
 * Redirects only after the session check finishes.
 */
export default function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const { allowed, reason } = canAccessRoute(pathname, user?.role ?? null);

    if (!allowed && reason === "login") {
      router.replace("/auth/login");
      return;
    }

    if (!allowed && reason === "forbidden") {
      router.replace("/forbidden");
    }
  }, [pathname, user, isLoading, router]);

  // Session still resolving — render the page so it can show API loading.
  if (isLoading) {
    return <>{children}</>;
  }

  const { allowed } = canAccessRoute(pathname, user?.role ?? null);
  if (!allowed) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
