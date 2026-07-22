import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ApiSourceConfiguration from "@/features/api-sources/components/ApiSourceConfiguration";

describe("backend-unavailable admin features", () => {
  it("keeps API Source Configuration read-only without synthetic data", () => {
    render(<ApiSourceConfiguration />);
    expect(
      screen.getByRole("status", {
        name: "API Source Configuration unavailable",
      }),
    ).toHaveTextContent("API not available");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
