import { NextRequest } from "next/server";
import { proxyAuthenticated } from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return proxyAuthenticated(request, "notifications/unread-count");
}
