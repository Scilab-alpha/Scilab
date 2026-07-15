import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { getAuthErrorMessage } from "./auth-errors";
import { normalizeHttpError, unwrapEnvelope } from "@/shared/api/http-client";
import { AuthApiError } from "@/features/auth/types/auth.types";

describe("auth error normalization", () => {
  it("keeps known user-safe API messages and hides unknown Error messages", () => {
    expect(
      getAuthErrorMessage(
        new AuthApiError({
          code: "HTTP_401",
          message: "Authentication failed",
        }),
      ),
    ).toBe("Authentication failed");
    expect(getAuthErrorMessage(new Error("internal database failure"))).toBe(
      "We could not complete that request. Please try again.",
    );
  });

  it("normalizes timeouts and response field errors", () => {
    const timeout = normalizeHttpError(
      new AxiosError("timeout", "ECONNABORTED"),
    );
    expect(timeout.message).toBe("The request timed out. Please try again.");
    expect(timeout.retryable).toBe(true);

    const duplicate = normalizeHttpError(
      new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409,
        statusText: "Conflict",
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {
          message: "Email is already registered",
          fieldErrors: { email: "Use another email." },
        },
      }),
    );
    expect(duplicate.fieldErrors).toEqual({ email: "Use another email." });
  });

  it("turns malformed envelopes into retryable safe errors", () => {
    expect(() => unwrapEnvelope(undefined as never)).toThrow(AuthApiError);
    try {
      unwrapEnvelope(undefined as never);
    } catch (error) {
      expect(error).toMatchObject({
        code: "UNEXPECTED_RESPONSE",
        retryable: true,
      });
    }
  });
});
