import { useQuery } from "@tanstack/react-query";

import { getDashboard } from "@/features/dashboard/api/dashboard.service";

export function useDashboard() {
  return useQuery({
    queryFn: getDashboard,
    queryKey: ["dashboard", "me"],
  });
}
