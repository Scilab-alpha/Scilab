"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  CATALOG_INSIGHT_YEAR_FROM,
  CATALOG_INSIGHT_YEAR_TO,
  fetchCatalogSample,
} from "@/features/dashboard/api/fetch-catalog-sample";
import { buildTrendInsights } from "@/features/reports/lib/build-trend-insights";

export type TrendFilters = {
  journalId: string;
  subject: string;
  dateRange: "1y" | "2y" | "5y" | "all";
};

function yearWindowFromRange(dateRange: TrendFilters["dateRange"]) {
  switch (dateRange) {
    case "1y":
      return 1;
    case "2y":
      return 2;
    case "5y":
      return 5;
    default:
      return "all" as const;
  }
}

export function useTrendAnalysis(filters: TrendFilters) {
  const query = useQuery({
    queryKey: [
      "trends",
      "catalog-api",
      100,
      100,
      CATALOG_INSIGHT_YEAR_FROM,
      CATALOG_INSIGHT_YEAR_TO,
    ] as const,
    staleTime: listQueryStaleTimeMs,
    queryFn: fetchCatalogSample,
  });

  const data = useMemo(() => {
    if (!query.data) {
      return null;
    }
    return buildTrendInsights(query.data, {
      journalId: filters.journalId || undefined,
      subject: filters.subject || undefined,
      yearWindow: yearWindowFromRange(filters.dateRange),
      yearFrom: CATALOG_INSIGHT_YEAR_FROM,
      yearTo: CATALOG_INSIGHT_YEAR_TO,
    });
  }, [filters.dateRange, filters.journalId, filters.subject, query.data]);

  return {
    data,
    isLoading: query.isLoading,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
  };
}
