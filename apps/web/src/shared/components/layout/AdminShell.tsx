"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Shield, UserRound } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/components/ui/utils";
import { ADMIN_NAV_ITEMS } from "@/shared/constants/admin-nav";
import { ROLE_LABELS } from "@/shared/constants/permissions";
import { routes } from "@/shared/constants/routes";

interface AdminShellProps {
  children: React.ReactNode;
}

interface AdminNavigationProps {
  pathname: string;
  onNavigate?: () => void;
}

function isNavigationItemActive(pathname: string, href: string) {
  if (href === routes.admin.overview) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminBrand() {
  const { user } = useAuth();

  return (
    <div className="flex h-16 items-center gap-3 border-b border-border px-6">
      <div className="flex size-9 items-center justify-center rounded-[var(--radius-button)] bg-primary">
        <Shield className="size-5 text-primary-foreground" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <span className="font-heading text-lg text-foreground">
          SciLab
        </span>
        <p className="truncate text-xs text-muted-foreground">
          {user ? ROLE_LABELS[user.role] : "Admin Panel"}
        </p>
      </div>
    </div>
  );
}

function AdminNavigation({ pathname, onNavigate }: AdminNavigationProps) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin navigation">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = isNavigationItemActive(pathname, item.href);

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-[var(--radius-button)] px-3 py-2.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-5" strokeWidth={1.75} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AdminAccountFooter({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    router.push(routes.auth.adminLogin);
  };

  return (
    <div className="border-t border-border p-4">
      <Link
        href={routes.admin.profile}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-[var(--radius-card)] bg-surface-raised px-3 py-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/20">
          <span className="text-sm font-medium text-tag">
            {user?.initials ?? "AD"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {user?.name ?? "Admin User"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email ?? "Administrator profile"}
          </p>
        </div>
        <UserRound
          className="size-4 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <LogOut className="size-4" strokeWidth={1.75} />
        Logout
      </button>
    </div>
  );
}

export default function AdminShell({
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-background">
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card shadow-ambient lg:flex">
        <AdminBrand />
        <AdminNavigation pathname={pathname} />
        <AdminAccountFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="motion-reduce:transform-none motion-reduce:transition-none"
                aria-label="Open admin navigation"
              >
                <Menu className="size-5" strokeWidth={1.75} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[min(18rem,86vw)] gap-0 border-border bg-card p-0 motion-reduce:animate-none motion-reduce:transition-none"
            >
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate between administration pages.
              </SheetDescription>
              <AdminBrand />
              <AdminNavigation
                pathname={pathname}
                onNavigate={() => setIsMenuOpen(false)}
              />
              <AdminAccountFooter onNavigate={() => setIsMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {children}
      </div>
    </div>
  );
}
