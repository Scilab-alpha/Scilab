import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-[var(--radius-input)] border border-border bg-input-background px-3 py-1 text-sm text-foreground transition-[color,box-shadow,transform] outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
