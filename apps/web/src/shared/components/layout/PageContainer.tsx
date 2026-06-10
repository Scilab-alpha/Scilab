import { cn } from "@/shared/components/ui/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
}

const sizeClasses = {
  default: "max-w-[var(--layout-max-width)]",
  wide: "max-w-[1400px]",
  narrow: "max-w-3xl",
};

export default function PageContainer({
  children,
  className,
  size = "default",
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-[var(--layout-gutter)]",
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
