"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  CATALOG_INSIGHT_YEAR_FROM,
  CATALOG_INSIGHT_YEAR_TO,
  fetchCatalogSample,
} from "@/features/dashboard/api/fetch-catalog-sample";
import type { CatalogSample } from "@/features/dashboard/api/fetch-catalog-sample";

/** Shared catalog sample for Dashboard / Advanced Dashboard (same cache key). */
export function useCatalogSample() {
  return useQuery({
    queryKey: [
      "dashboard",
      "catalog-api",
      100,
      100,
      CATALOG_INSIGHT_YEAR_FROM,
      CATALOG_INSIGHT_YEAR_TO,
    ] as const,
    staleTime: listQueryStaleTimeMs,
    queryFn: fetchCatalogSample,
  });
}

export function getCatalogSampleError(error: unknown) {
  return error ? getUserFriendlyApiErrorMessage(error) : null;
}

export type { CatalogSample };
