import { NextRequest } from "next/server";
import {
  proxyAuthenticated,
  readJsonBody,
  rejectCrossOriginMutation,
  handleBffError,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<{ articleId?: string }>(request);
    return proxyAuthenticated(request, "bookmarks/toggle", {
      method: "POST",
      body,
    });
  } catch (error) {
    return handleBffError(error);
  }
}
