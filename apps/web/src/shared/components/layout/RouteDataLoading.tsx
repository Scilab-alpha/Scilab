"use client";

import { Loader2 } from "lucide-react";

/** Inline loading state while a route waits for its first API response. */
export function RouteDataLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}
