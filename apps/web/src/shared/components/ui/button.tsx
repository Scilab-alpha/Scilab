import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:ring-destructive/20 aria-invalid:border-destructive hover:-translate-y-px hover:shadow-ambient-hover active:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[var(--button-primary-hover)] shadow-ambient",
        destructive:
          "bg-destructive text-white hover:bg-[var(--button-destructive-hover)] shadow-ambient",
        outline:
          "border border-[var(--button-secondary-border)] bg-transparent text-foreground hover:bg-[var(--button-secondary-hover)] shadow-none hover:shadow-ambient",
        secondary:
          "border border-[var(--button-secondary-border)] bg-transparent text-foreground hover:bg-[var(--button-secondary-hover)]",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground shadow-none hover:shadow-none hover:translate-y-0",
        link: "text-[var(--font-color-link)] underline-offset-4 hover:underline shadow-none hover:shadow-none hover:translate-y-0",
      },
      size: {
        default:
          "h-9 px-[var(--button-padding-x)] py-[var(--button-padding-y)]",
        sm: "h-8 px-[var(--button-padding-x-sm)] py-[var(--button-padding-y-sm)] text-xs",
        lg: "h-10 px-[var(--button-padding-x-lg)] py-[var(--button-padding-y-lg)]",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
