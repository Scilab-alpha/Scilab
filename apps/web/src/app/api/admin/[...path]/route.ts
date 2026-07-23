import { NextRequest } from "next/server";
import {
  proxyAuthenticated,
  readJsonBody,
  rejectCrossOriginMutation,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path: string[] }> };

function buildUpstreamPath(pathSegments: string[], request: NextRequest) {
  const joined = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  const query = request.nextUrl.searchParams.toString();
  return query ? `admin/${joined}?${query}` : `admin/${joined}`;
}

/** GET /api/admin/* → GET /admin/* */
export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyAuthenticated(request, buildUpstreamPath(path, request), {
    method: "GET",
  });
}

/** POST /api/admin/* → POST /admin/* (job actions). */
export async function POST(request: NextRequest, context: RouteContext) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  const { path } = await context.params;
  const body = await readJsonBody(request);
  return proxyAuthenticated(request, buildUpstreamPath(path, request), {
    method: "POST",
    body,
  });
}
