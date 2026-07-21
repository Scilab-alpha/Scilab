import { describe, expect, it } from "vitest";
import { buildAdminOverview } from "@/features/users/components/AdminOverview";
import type {
  UserProfile,
  UserRole,
  UserStatus,
} from "@/features/users/types/user.types";

function createUser(
  id: string,
  role: UserRole,
  status: UserStatus,
): UserProfile {
  return {
    id,
    email: `${id}@example.com`,
    firstName: id,
    lastName: "User",
    displayName: `${id} User`,
    initials: id.slice(0, 2).toUpperCase(),
    imageUrl: null,
    gender: null,
    dateOfBirth: null,
    role,
    status,
  };
}

describe("buildAdminOverview", () => {
  it("derives all KPI and distribution values from users", () => {
    const result = buildAdminOverview([
      createUser("student-active", "student", "active"),
      createUser("researcher-active", "researcher", "active"),
      createUser("researcher-inactive", "researcher", "inactive"),
      createUser("admin-banned", "admin", "banned"),
    ]);

    expect(result.total).toBe(4);
    expect(result.active).toBe(2);
    expect(result.researchers).toBe(2);
    expect(result.needsAttention).toBe(2);
    expect(result.roleCounts).toEqual({
      student: 1,
      researcher: 2,
      admin: 1,
    });
    expect(result.statusCounts).toEqual({
      active: 2,
      inactive: 1,
      banned: 1,
    });
  });

  it("limits attention accounts to five and prioritizes banned users", () => {
    const result = buildAdminOverview([
      createUser("inactive-z", "student", "inactive"),
      createUser("inactive-a", "student", "inactive"),
      createUser("banned-c", "researcher", "banned"),
      createUser("banned-a", "researcher", "banned"),
      createUser("inactive-b", "student", "inactive"),
      createUser("banned-b", "admin", "banned"),
      createUser("inactive-c", "student", "inactive"),
    ]);

    expect(result.attentionUsers).toHaveLength(5);
    expect(result.attentionUsers.map((user) => user.id)).toEqual([
      "banned-a",
      "banned-b",
      "banned-c",
      "inactive-a",
      "inactive-b",
    ]);
  });
});
