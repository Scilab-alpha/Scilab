import { NextRequest } from "next/server";
import {
  handleBffError,
  proxyAuthenticated,
  rejectCrossOriginMutation,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    const { id } = await context.params;
    return proxyAuthenticated(
      request,
      `notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH" },
    );
  } catch (error) {
    return handleBffError(error);
  }
}
