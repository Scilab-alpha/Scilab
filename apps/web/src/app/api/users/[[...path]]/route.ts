import { NextRequest } from "next/server";
import {
  applyRefreshedCookies,
  clearAuthCookies,
  handleBffError,
  readJsonBody,
  rejectCrossOriginMutation,
  requestAuthenticated,
  upstreamResponse,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ path?: string[] }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forwardAuthenticated(request, context, "GET");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  return forwardAuthenticated(request, context, "PATCH", await readJsonBody(request));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  return forwardAuthenticated(request, context, "DELETE");
}

async function forwardAuthenticated(
  request: NextRequest,
  context: RouteContext,
  method: "GET" | "PATCH" | "DELETE",
  body?: unknown,
) {
  try {
    const path = await getUserPath(context);
    const authenticated = await requestAuthenticated(request, path, {
      method,
      body,
    });
    const response = upstreamResponse(authenticated.result);

    if (authenticated.result.ok) {
      applyRefreshedCookies(response, authenticated);
    } else if (authenticated.result.status === 401) {
      clearAuthCookies(response);
    }

    return response;
  } catch (error) {
    return handleBffError(error);
  }
}

async function getUserPath(context: RouteContext) {
  const { path = [] } = await context.params;
  return ["users", ...path.map(encodeURIComponent)].join("/");
}
