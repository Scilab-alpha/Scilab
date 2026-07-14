import { describe, expect, it } from "vitest";
import { httpClient, resolveApiBaseUrl } from "@/shared/api/http-client";

describe("http client configuration", () => {
  it("uses the configured public Scilab API origin", () => {
    expect(resolveApiBaseUrl(" https://scilab-api.epsilon.io.vn ")).toBe(
      "https://scilab-api.epsilon.io.vn",
    );
    expect(new URL("https://scilab-api.epsilon.io.vn").origin).toBe(
      "https://scilab-api.epsilon.io.vn",
    );
  });

  it("supports an explicit API origin override", () => {
    expect(resolveApiBaseUrl(" https://api.example.test/ ")).toBe(
      "https://api.example.test/",
    );
  });

  it("does not enable cookie credentials for bearer-token auth", () => {
    expect(httpClient.defaults.withCredentials).not.toBe(true);
  });
});
