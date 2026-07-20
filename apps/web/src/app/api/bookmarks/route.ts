import { NextRequest } from "next/server";
import {
  handleBffError,
  proxyAuthenticated,
  readJsonBody,
  rejectCrossOriginMutation,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const path = query ? `bookmarks?${query}` : "bookmarks";
  return proxyAuthenticated(request, path);
}

export async function POST(request: NextRequest) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<{ articleId?: string }>(request);
    return proxyAuthenticated(request, "bookmarks", {
      method: "POST",
      body,
    });
  } catch (error) {
    return handleBffError(error);
  }
}
