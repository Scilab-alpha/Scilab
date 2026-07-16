import { Atom } from "lucide-react";
import { APP_NAME } from "@/shared/constants/app";
import { cn } from "@/shared/components/ui/utils";

interface AuthBrandProps {
  compact?: boolean;
  className?: string;
}

export default function AuthBrand({
  compact = false,
  className,
}: AuthBrandProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "auth-brand-mark relative flex shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-primary shadow-ambient",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
        aria-hidden="true"
      >
        <span className="auth-brand-orbit" />
        <Atom
          className={cn(
            "relative z-10 text-primary-foreground",
            compact ? "h-5 w-5" : "h-6 w-6",
          )}
          strokeWidth={1.75}
        />
      </div>
      <span
        className={cn(
          "font-heading text-foreground",
          compact ? "text-2xl" : "text-[1.7rem]",
        )}
      >
        {APP_NAME}
      </span>
    </div>
  );
}
