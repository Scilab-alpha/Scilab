import { NextRequest } from "next/server";
import {
  applyRefreshedCookies,
  clearAuthCookies,
  handleBffError,
  requestAuthenticated,
  upstreamResponse,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authenticated = await requestAuthenticated(request, "users/me");
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
