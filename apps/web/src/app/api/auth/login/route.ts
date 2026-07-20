import { NextRequest } from "next/server";
import {
  bffErrorResponse,
  handleBffError,
  isTokenPair,
  readJsonBody,
  rejectCrossOriginMutation,
  requestUpstream,
  setAuthCookies,
  upstreamResponse,
} from "@/features/auth/server/auth-bff";
import type { LoginPortal } from "@/features/auth/types/auth-api.types";

export const runtime = "nodejs";

interface LoginBody {
  email: string;
  password: string;
  rememberMe: boolean;
  portal: LoginPortal;
}

export async function POST(request: NextRequest) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<LoginBody>(request);
    if (body.portal !== "admin" && body.portal !== "user") {
      return bffErrorResponse(400, "Login portal is invalid.", {
        code: "INVALID_LOGIN_PORTAL",
      });
    }

    const login = await requestUpstream("auth/login", {
      method: "POST",
      body: { email: body.email, password: body.password },
    });
    if (!login.ok || !isTokenPair(login.envelope.data)) {
      return upstreamResponse(login);
    }

    const currentUser = await requestUpstream("auth/me", {
      accessToken: login.envelope.data.accessToken,
    });
    if (currentUser.ok && !isAllowedPortalRole(currentUser.envelope.data, body.portal)) {
      try {
        await requestUpstream("auth/logout", {
          method: "POST",
          accessToken: login.envelope.data.accessToken,
        });
      } catch {
        // The browser never receives this temporary session; return the role
        // error even if the best-effort server-side cleanup is unavailable.
      }
      return bffErrorResponse(
        403,
        body.portal === "admin"
          ? "This account does not have administrator access."
          : "Administrator accounts must use the admin sign-in page.",
        { code: "PORTAL_NOT_ALLOWED" },
      );
    }

    const response = upstreamResponse(currentUser);
    if (currentUser.ok) {
      setAuthCookies(response, login.envelope.data, body.rememberMe === true);
    }
    return response;
  } catch (error) {
    return handleBffError(error);
  }
}

function isAllowedPortalRole(user: unknown, portal: LoginPortal) {
  const role =
    user && typeof user === "object" && "role" in user
      ? String((user as { role?: unknown }).role).trim().toLowerCase()
      : "";
  const isAdmin = role === "admin" || role === "system_admin";

  return portal === "admin" ? isAdmin : !isAdmin;
}
