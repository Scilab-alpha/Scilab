import { NextRequest } from "next/server";
import { proxyAuthenticated } from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

/** DELETE /api/users/:userId → DELETE /users/:userId */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;
  return proxyAuthenticated(request, `users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

/** PATCH /api/users/:userId → PATCH /users/:userId */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyAuthenticated(request, `users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body,
  });
}
