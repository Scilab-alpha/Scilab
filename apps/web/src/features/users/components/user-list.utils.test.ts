import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/features/users/types/user.types";
import {
  filterUsers,
  getPageCount,
  paginateUsers,
  USERS_PAGE_SIZE,
} from "@/features/users/components/user-list.utils";

function user(id: string, overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id,
    email: `${id}@example.edu`,
    firstName: id,
    lastName: "Scholar",
    displayName: `${id} Scholar`,
    initials: id.slice(0, 2).toUpperCase(),
    imageUrl: null,
    gender: null,
    dateOfBirth: null,
    role: "student",
    status: "active",
    ...overrides,
  };
}

describe("user list utilities", () => {
  it("searches names and emails while applying role and status filters", () => {
    const users = [
      user("zeta", {
        email: "zeta@example.edu",
        displayName: "Zeta Student",
      }),
      user("alpha", {
        email: "alpha@lab.edu",
        displayName: "Alpha Researcher",
        role: "researcher",
        status: "inactive",
      }),
    ];

    expect(
      filterUsers(users, {
        query: "alpha",
        role: "researcher",
        status: "inactive",
      }).map((entry) => entry.id),
    ).toEqual(["alpha"]);
  });

  it("sorts by email and paginates ten users at a time", () => {
    const users = Array.from({ length: 12 }, (_, index) =>
      user(String(index).padStart(2, "0"), {
        email: `${String(11 - index).padStart(2, "0")}@example.edu`,
      }),
    );
    const filtered = filterUsers(users, {
      query: "",
      role: "all",
      status: "all",
    });

    expect(USERS_PAGE_SIZE).toBe(10);
    expect(getPageCount(filtered.length)).toBe(2);
    expect(paginateUsers(filtered, 1)).toHaveLength(10);
    expect(paginateUsers(filtered, 2)).toHaveLength(2);
    expect(filtered[0]?.email).toBe("00@example.edu");
  });

  it("keeps one empty page for the empty state", () => {
    expect(getPageCount(0)).toBe(1);
    expect(paginateUsers([], 1)).toEqual([]);
  });
});
