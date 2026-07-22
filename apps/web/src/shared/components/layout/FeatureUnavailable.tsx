import { CircleSlash2 } from "lucide-react";
import { Card } from "@/shared/components/ui/card";

interface FeatureUnavailableProps {
  feature: string;
  description?: string;
}

export function FeatureUnavailable({
  feature,
  description = "The backend does not currently provide an API for this feature.",
}: FeatureUnavailableProps) {
  return (
    <Card
      role="status"
      aria-label={`${feature} unavailable`}
      className="border-border p-10 text-center"
    >
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-muted-foreground">
        <CircleSlash2 className="size-6" aria-hidden="true" />
      </div>
      <h2 className="font-heading text-xl text-foreground">
        Feature unavailable
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
        {description}
      </p>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        API not available
      </p>
    </Card>
  );
}
