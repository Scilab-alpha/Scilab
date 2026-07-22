"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  fetchCatalogSnapshot,
  type CatalogSnapshot,
} from "@/features/dashboard/api/fetch-catalog-snapshot";

/** Shared live backend snapshot for dashboard analytics. */
export function useCatalogSnapshot() {
  return useQuery({
    queryKey: ["dashboard", "catalog-snapshot"] as const,
    staleTime: listQueryStaleTimeMs,
    queryFn: fetchCatalogSnapshot,
  });
}

export function getCatalogSnapshotError(error: unknown) {
  return error ? getUserFriendlyApiErrorMessage(error) : null;
}

export type { CatalogSnapshot };
