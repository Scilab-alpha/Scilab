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
import type { RegisterApiRequest } from "@/features/auth/types/auth-api.types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<RegisterApiRequest>(request);
    const registration = await requestUpstream("auth/register", {
      method: "POST",
      body,
    });
    if (!registration.ok) return upstreamResponse(registration);

    const login = await requestUpstream("auth/login", {
      method: "POST",
      body: { email: body.email, password: body.password },
    });
    if (!login.ok || !isTokenPair(login.envelope.data)) {
      return bffErrorResponse(
        login.status,
        `Your account (${body.email}) was created, but automatic sign-in failed. Please sign in manually.`,
        { code: "ACCOUNT_CREATED_SIGN_IN_FAILED" },
      );
    }

    const currentUser = await requestUpstream("auth/me", {
      accessToken: login.envelope.data.accessToken,
    });
    const response = upstreamResponse(currentUser);
    if (currentUser.ok) {
      setAuthCookies(response, login.envelope.data, false);
    }
    return response;
  } catch (error) {
    return handleBffError(error);
  }
}
