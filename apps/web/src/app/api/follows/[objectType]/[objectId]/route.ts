import { NextRequest } from "next/server";
import {
  handleBffError,
  proxyAuthenticated,
  readJsonBody,
  rejectCrossOriginMutation,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ objectType: string; objectId: string }> },
) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    const { objectType, objectId } = await context.params;
    const body = await readJsonBody<{ notifyMode?: string }>(request);
    return proxyAuthenticated(
      request,
      `follows/${encodeURIComponent(objectType)}/${encodeURIComponent(objectId)}`,
      { method: "PATCH", body },
    );
  } catch (error) {
    return handleBffError(error);
  }
}
