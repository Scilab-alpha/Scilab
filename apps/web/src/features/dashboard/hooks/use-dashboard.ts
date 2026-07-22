"use client";

import { useMemo } from "react";
import {
  getCatalogSnapshotError,
  useCatalogSnapshot,
} from "@/features/dashboard/hooks/use-catalog-snapshot";
import { buildDashboardInsights } from "@/features/dashboard/lib/build-dashboard-insights";

export function useDashboard() {
  const query = useCatalogSnapshot();

  const data = useMemo(
    () => (query.data ? buildDashboardInsights(query.data) : null),
    [query.data],
  );

  return {
    data,
    isLoading: query.isLoading,
    error: getCatalogSnapshotError(query.error),
    reload: () => query.refetch(),
  };
}
