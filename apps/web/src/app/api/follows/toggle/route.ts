import { NextRequest } from "next/server";
import {
  handleBffError,
  proxyAuthenticated,
  readJsonBody,
  rejectCrossOriginMutation,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<{
      objectType?: string;
      objectId?: string;
      notifyMode?: string;
    }>(request);
    return proxyAuthenticated(request, "follows/toggle", {
      method: "POST",
      body,
    });
  } catch (error) {
    return handleBffError(error);
  }
}
