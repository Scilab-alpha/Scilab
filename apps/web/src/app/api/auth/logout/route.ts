import { NextRequest } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  clearAuthCookies,
  handleBffError,
  rejectCrossOriginMutation,
  requestUpstream,
  successResponse,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
    if (accessToken) {
      const result = await requestUpstream("auth/logout", {
        method: "POST",
        accessToken,
      });
      if (!result.ok) {
        console.warn("Auth BFF upstream logout failed", {
          status: result.status,
        });
      }
    }

    const response = successResponse({}, "Logout successful");
    clearAuthCookies(response);
    return response;
  } catch (error) {
    const response = handleBffError(error);
    clearAuthCookies(response);
    return response;
  }
}
