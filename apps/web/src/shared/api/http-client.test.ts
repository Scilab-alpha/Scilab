import { describe, expect, it } from "vitest";
import { httpClient } from "@/shared/api/http-client";

describe("http client configuration", () => {
  it("uses the same-origin BFF API", () => {
    expect(httpClient.defaults.baseURL).toBe("/api");
  });

  it("does not configure browser bearer-token credentials", () => {
    expect(httpClient.defaults.withCredentials).not.toBe(true);
    expect(httpClient.defaults.headers.common.Authorization).toBeUndefined();
  });
});
