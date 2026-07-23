import { cn } from "@/shared/components/ui/utils";

/**
 * Viewport-filling list page shell: header stays put, list body scrolls.
 * Use inside StudentShell after StudentTopHeader.
 */
export function ListPageMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "flex-1 min-h-0 flex flex-col overflow-hidden",
        className,
      )}
    >
      {children}
    </main>
  );
}

/** Scrollable region for card lists / tables within a list page. */
export function ListScrollArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-contain",
        className,
      )}
    >
      {children}
    </div>
  );
}
