"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/components/ui/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export default function PasswordInput({
  className,
  disabled,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="group relative">
      <Input
        type={isVisible ? "text" : "password"}
        className={cn("pr-11", className)}
        disabled={disabled}
        {...props}
      />
      <button
        type="button"
        className="auth-password-toggle absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[var(--radius-button)] text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((current) => !current)}
        disabled={disabled}
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <Eye className="h-4 w-4" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}
