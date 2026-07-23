"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Atom, LogOut } from "lucide-react";
import { APP_NAME } from "@/shared/constants/app";
import { STUDENT_NAV_ITEMS } from "@/shared/constants/student-nav";
import { ROLE_LABELS } from "@/shared/constants/permissions";
import { useAuth } from "@/providers/auth-provider";

interface StudentShellProps {
  children: React.ReactNode;
}

export default function StudentShell({ children }: StudentShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, can, logout } = useAuth();

  const visibleNavItems = STUDENT_NAV_ITEMS.filter(
    (item) => !item.permission || can(item.permission),
  );

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <aside className="w-64 bg-card border-r border-border flex flex-col shadow-ambient shrink-0">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-border shrink-0">
          <div className="w-9 h-9 bg-primary rounded-[var(--radius-button)] flex items-center justify-center">
            <Atom
              className="w-5 h-5 text-primary-foreground"
              strokeWidth={1.75}
            />
          </div>
          <div className="min-w-0">
            <span className="font-heading text-xl text-foreground">
              {APP_NAME}
            </span>
            <p className="text-xs text-muted-foreground truncate">
              {user ? ROLE_LABELS[user.role] : "Guest"}
            </p>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-button)] transition-all ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.75} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2 shrink-0">
          {user ? (
            <>
              <Link
                href="/student/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-card)] hover:bg-accent transition-colors"
              >
                <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-tag">
                    {user.initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-[var(--radius-button)] transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="block w-full text-center px-3 py-2 text-sm font-medium text-primary hover:bg-accent rounded-[var(--radius-button)] transition-colors"
            >
              Sign in to unlock more
            </Link>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
