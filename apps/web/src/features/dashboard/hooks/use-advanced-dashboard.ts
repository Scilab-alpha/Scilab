"use client";

import { useMemo } from "react";
import {
  getCatalogSampleError,
  useCatalogSample,
} from "@/features/dashboard/hooks/use-catalog-sample";
import { buildAdvancedDashboardInsights } from "@/features/dashboard/lib/build-advanced-dashboard-insights";

export function useAdvancedDashboard() {
  const query = useCatalogSample();

  const data = useMemo(
    () => (query.data ? buildAdvancedDashboardInsights(query.data) : null),
    [query.data],
  );

  return {
    data,
    isLoading: query.isLoading,
    error: getCatalogSampleError(query.error),
    reload: () => query.refetch(),
  };
}
