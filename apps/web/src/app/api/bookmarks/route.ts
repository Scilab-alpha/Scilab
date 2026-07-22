import { NextRequest } from "next/server";
import { proxyAuthenticated } from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const path = query ? `bookmarks?${query}` : "bookmarks";
  return proxyAuthenticated(request, path);
}
