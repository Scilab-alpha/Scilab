import { NextRequest } from "next/server";
import {
  handleBffError,
  isTokenPair,
  readJsonBody,
  rejectCrossOriginMutation,
  requestUpstream,
  setAuthCookies,
  upstreamResponse,
} from "@/features/auth/server/auth-bff";

export const runtime = "nodejs";

interface LoginBody {
  email: string;
  password: string;
  rememberMe: boolean;
}

export async function POST(request: NextRequest) {
  const blocked = rejectCrossOriginMutation(request);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<LoginBody>(request);
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
    const response = upstreamResponse(currentUser);
    if (currentUser.ok) {
      setAuthCookies(response, login.envelope.data, body.rememberMe === true);
    }
    return response;
  } catch (error) {
    return handleBffError(error);
  }
}
