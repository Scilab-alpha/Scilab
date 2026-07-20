"use client";

import PageContainer from "@/shared/components/layout/PageContainer";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

/** Per-route admin header + content (sidebar lives in AdminShell layout). */
export default function AdminPageFrame({
  title,
  subtitle,
  icon,
  headerAction,
  children,
}: AdminPageHeaderProps) {
  return (
    <>
      <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-primary/15 rounded-[var(--radius-card)] flex items-center justify-center flex-shrink-0 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-lg text-foreground truncate">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {headerAction ? (
          <div className="flex-shrink-0">{headerAction}</div>
        ) : null}
      </header>

      <main className="flex-1 overflow-auto py-8">
        <PageContainer>{children}</PageContainer>
      </main>
    </>
  );
}
