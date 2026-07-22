"use client";

import { useMemo } from "react";
import {
  getCatalogSnapshotError,
  useCatalogSnapshot,
} from "@/features/dashboard/hooks/use-catalog-snapshot";
import { buildAdvancedDashboardInsights } from "@/features/dashboard/lib/build-advanced-dashboard-insights";

export function useAdvancedDashboard() {
  const query = useCatalogSnapshot();

  const data = useMemo(
    () => (query.data ? buildAdvancedDashboardInsights(query.data) : null),
    [query.data],
  );

  return {
    data,
    isLoading: query.isLoading,
    error: getCatalogSnapshotError(query.error),
    reload: () => query.refetch(),
  };
}
