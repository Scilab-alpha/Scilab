import { NextRequest } from "next/server";
import { proxyAuthenticated } from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

/** GET /api/users → GET /users (admin). */
export async function GET(request: NextRequest) {
  return proxyAuthenticated(request, "users");
}
