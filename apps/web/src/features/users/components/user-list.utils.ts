import type {
  UserProfile,
  UserRole,
  UserStatus,
} from "@/features/users/types/user.types";

export const USERS_PAGE_SIZE = 10;

export interface UserListFilters {
  query: string;
  role: UserRole | "all";
  status: UserStatus | "all";
}

export function filterUsers(
  users: UserProfile[],
  filters: UserListFilters,
): UserProfile[] {
  const query = filters.query.trim().toLowerCase();

  return [...users]
    .sort((left, right) => left.email.localeCompare(right.email))
    .filter((user) => {
      const matchesQuery =
        !query ||
        user.email.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query);
      const matchesRole = filters.role === "all" || user.role === filters.role;
      const matchesStatus =
        filters.status === "all" || user.status === filters.status;

      return matchesQuery && matchesRole && matchesStatus;
    });
}

export function getPageCount(totalUsers: number): number {
  return Math.max(1, Math.ceil(totalUsers / USERS_PAGE_SIZE));
}

export function paginateUsers(
  users: UserProfile[],
  page: number,
): UserProfile[] {
  const start = (page - 1) * USERS_PAGE_SIZE;
  return users.slice(start, start + USERS_PAGE_SIZE);
}
