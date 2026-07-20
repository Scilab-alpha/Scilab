"use client";

import { useMemo } from "react";
import {
  getCatalogSampleError,
  useCatalogSample,
} from "@/features/dashboard/hooks/use-catalog-sample";
import { buildDashboardInsights } from "@/features/dashboard/lib/build-dashboard-insights";

export function useDashboard() {
  const query = useCatalogSample();

  const data = useMemo(
    () => (query.data ? buildDashboardInsights(query.data) : null),
    [query.data],
  );

  return {
    data,
    isLoading: query.isLoading,
    error: getCatalogSampleError(query.error),
    reload: () => query.refetch(),
  };
}
