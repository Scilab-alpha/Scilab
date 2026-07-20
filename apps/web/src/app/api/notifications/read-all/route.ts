import { NextRequest } from "next/server";
import {
  handleBffError,
  proxyAuthenticated,
  rejectCrossOriginMutation,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    return proxyAuthenticated(request, "notifications/read-all", {
      method: "PATCH",
    });
  } catch (error) {
    return handleBffError(error);
  }
}
