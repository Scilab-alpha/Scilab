import { NextRequest } from "next/server";
import { proxyAuthenticated } from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

/** PATCH /api/users/:userId/role */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyAuthenticated(
    request,
    `users/${encodeURIComponent(userId)}/role`,
    { method: "PATCH", body },
  );
}
