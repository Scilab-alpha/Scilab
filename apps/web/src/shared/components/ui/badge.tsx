import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-input)] px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-0 bg-[var(--tag-background)] text-[var(--tag-text-color)]",
        secondary:
          "border-0 bg-surface-raised text-muted-foreground",
        destructive:
          "border-0 bg-destructive/10 text-destructive",
        outline:
          "border border-border text-foreground bg-transparent",
        teal:
          "border-0 bg-teal/10 text-teal",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
