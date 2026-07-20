import { NextRequest } from "next/server";
import { proxyAuthenticated } from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const path = query ? `follows?${query}` : "follows";
  return proxyAuthenticated(request, path);
}
