import { describe, expect, it } from "vitest";
import {
  LOCAL_API_ORIGIN,
  PUBLIC_API_ORIGIN,
  resolveApiDataSource,
  resolveUpstreamApiOrigin,
} from "@/core/api/config";

describe("api data source config", () => {
  it("defaults to the public epsilon API", () => {
    expect(resolveApiDataSource(undefined)).toBe("public");
    expect(resolveApiDataSource("")).toBe("public");
    expect(resolveUpstreamApiOrigin({ dataSource: "public" })).toBe(
      PUBLIC_API_ORIGIN,
    );
  });

  it("switches to the local Docker/Nest origin", () => {
    expect(resolveApiDataSource("local")).toBe("local");
    expect(resolveUpstreamApiOrigin({ dataSource: "local" })).toBe(
      LOCAL_API_ORIGIN,
    );
  });

  it("allows overriding the local origin", () => {
    expect(
      resolveUpstreamApiOrigin({
        dataSource: "local",
        localOrigin: " http://127.0.0.1:6003/ ",
      }),
    ).toBe("http://127.0.0.1:6003");
  });

  it("lets SCILAB_API_ORIGIN win for the BFF upstream", () => {
    expect(
      resolveUpstreamApiOrigin({
        dataSource: "local",
        serverOrigin: " https://scilab-api.epsilon.io.vn/ ",
      }),
    ).toBe(PUBLIC_API_ORIGIN);
  });
});
