"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  deleteAdminUser,
  listAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "@/features/users/api/users.api";
import type {
  AdminUserRole,
  AdminUserStatus,
  User,
} from "@/features/users/types/user.types";

const usersQueryKey = ["admin", "users"] as const;

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: usersQueryKey,
    staleTime: listQueryStaleTimeMs,
    queryFn: listAdminUsers,
  });

  const setUsersCache = useCallback(
    (updater: (previous: User[]) => User[]) => {
      queryClient.setQueryData<User[]>(usersQueryKey, (previous) =>
        updater(previous ?? []),
      );
    },
    [queryClient],
  );

  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: AdminUserStatus;
    }) => updateAdminUserStatus(userId, status),
    onSuccess: (updated) => {
      setUsersCache((previous) =>
        previous.map((user) => (user.id === updated.id ? updated : user)),
      );
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminUserRole }) =>
      updateAdminUserRole(userId, role),
    onSuccess: (updated) => {
      setUsersCache((previous) =>
        previous.map((user) => (user.id === updated.id ? updated : user)),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteAdminUser(userId),
    onSuccess: (_result, userId) => {
      setUsersCache((previous) =>
        previous.filter((user) => user.id !== userId),
      );
    },
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error
      ? getUserFriendlyApiErrorMessage(query.error)
      : statusMutation.error
        ? getUserFriendlyApiErrorMessage(statusMutation.error)
        : roleMutation.error
          ? getUserFriendlyApiErrorMessage(roleMutation.error)
          : deleteMutation.error
            ? getUserFriendlyApiErrorMessage(deleteMutation.error)
            : null,
    reload: () => query.refetch(),
    setStatus: (userId: string, status: AdminUserStatus) =>
      statusMutation.mutateAsync({ userId, status }),
    setRole: (userId: string, role: AdminUserRole) =>
      roleMutation.mutateAsync({ userId, role }),
    remove: (userId: string) => deleteMutation.mutateAsync(userId),
    isMutating:
      statusMutation.isPending ||
      roleMutation.isPending ||
      deleteMutation.isPending,
  };
}
