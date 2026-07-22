"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import AdminPageFrame from "@/shared/components/layout/AdminPageFrame";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";
import { routes } from "@/shared/constants/routes";
import {
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
  updateUserRole,
  updateUserStatus,
  USER_QUERY_KEYS,
} from "@/features/users/api/users.api";
import type {
  UpdateUserProfileInput,
  UserProfile,
  UserRole,
  UserStatus,
} from "@/features/users/types/user.types";
import {
  filterUsers,
  getPageCount,
  paginateUsers,
} from "@/features/users/components/user-list.utils";

type ConfirmationAction =
  | {
      kind: "role";
      user: UserProfile;
      value: Exclude<UserRole, "admin">;
    }
  | { kind: "status"; user: UserProfile; value: UserStatus }
  | { kind: "delete"; user: UserProfile };

type CompletedAction =
  | { kind: "role" | "status"; user: UserProfile }
  | { kind: "delete"; userId: string };

interface UserFormState {
  email: string;
  firstName: string;
  lastName: string;
  gender: "" | "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
}

const EMPTY_FORM: UserFormState = {
  email: "",
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
};

export default function UserManagement() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationAction | null>(
    null,
  );

  const usersQuery = useQuery({
    queryKey: USER_QUERY_KEYS.list,
    queryFn: listUsers,
    staleTime: 30_000,
  });
  const { refetch: refetchUsers } = usersQuery;

  const handleForbidden = useCallback(() => {
    setEditingUserId(null);
    setConfirmation(null);
    router.push(routes.forbidden);
  }, [router]);

  const handleMissingUser = useCallback(() => {
    setEditingUserId(null);
    setConfirmation(null);
    void refetchUsers();
  }, [refetchUsers]);

  const filteredUsers = useMemo(
    () =>
      filterUsers(usersQuery.data ?? [], {
        query: searchQuery,
        role: roleFilter,
        status: statusFilter,
      }),
    [usersQuery.data, searchQuery, roleFilter, statusFilter],
  );
  const pageCount = getPageCount(filteredUsers.length);
  const currentPage = Math.min(page, pageCount);
  const visibleUsers = paginateUsers(filteredUsers, currentPage);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const replaceCachedUser = (nextUser: UserProfile) => {
    queryClient.setQueryData<UserProfile[]>(
      USER_QUERY_KEYS.list,
      (current) =>
        current?.map((user) => (user.id === nextUser.id ? nextUser : user)) ?? [
          nextUser,
        ],
    );
    queryClient.setQueryData(USER_QUERY_KEYS.detail(nextUser.id), nextUser);
  };

  const actionMutation = useMutation({
    mutationFn: async (
      action: ConfirmationAction,
    ): Promise<CompletedAction> => {
      if (action.kind === "role") {
        return {
          kind: "role",
          user: await updateUserRole(action.user.id, action.value),
        };
      }
      if (action.kind === "status") {
        return {
          kind: "status",
          user: await updateUserStatus(action.user.id, action.value),
        };
      }

      await deleteUser(action.user.id);
      return { kind: "delete", userId: action.user.id };
    },
    onSuccess: (result) => {
      if (result.kind === "delete") {
        queryClient.setQueryData<UserProfile[]>(
          USER_QUERY_KEYS.list,
          (current) =>
            current?.filter((user) => user.id !== result.userId) ?? [],
        );
        queryClient.removeQueries({
          queryKey: USER_QUERY_KEYS.detail(result.userId),
        });
        toast.success("User deleted.");
      } else {
        replaceCachedUser(result.user);
        toast.success(
          result.kind === "role"
            ? "User role updated."
            : "User status updated.",
        );
      }
      setConfirmation(null);
    },
    onError: (error) =>
      handleAdminError(error, handleForbidden, handleMissingUser),
  });

  const runAction = (action: ConfirmationAction) => {
    const requiresConfirmation =
      action.kind === "delete" ||
      (action.kind === "status" && action.value === "banned") ||
      (action.kind === "role" && action.user.role === "admin");

    if (requiresConfirmation) {
      setConfirmation(action);
    } else {
      actionMutation.mutate(action);
    }
  };

  const resetPageAnd = (update: () => void) => {
    update();
    setPage(1);
  };

  return (
    <AdminPageFrame
      title="User Management"
      subtitle={
        String(filteredUsers.length) +
        " of " +
        String(usersQuery.data?.length ?? 0) +
        " users"
      }
      icon={<Users className="size-5" strokeWidth={1.75} />}
      headerAction={
        <Button
          variant="outline"
          size="sm"
          aria-label="Refresh users"
          onClick={() => void usersQuery.refetch()}
          disabled={usersQuery.isFetching}
        >
          <RefreshCw
            aria-hidden="true"
            className={
              "size-4 motion-reduce:animate-none " +
              (usersQuery.isFetching ? "animate-spin" : "")
            }
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      }
    >
      <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
        <Card className="border-border bg-card p-4 shadow-ambient sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search users"
                placeholder="Search by email or name..."
                className="h-10 pl-10"
                value={searchQuery}
                onChange={(event) =>
                  resetPageAnd(() => setSearchQuery(event.target.value))
                }
              />
            </div>
            <FilterSelect
              label="Filter by role"
              value={roleFilter}
              options={[
                ["all", "All roles"],
                ["admin", "Admin"],
                ["researcher", "Researcher"],
                ["student", "Student"],
              ]}
              onChange={(value) =>
                resetPageAnd(() => setRoleFilter(value as UserRole | "all"))
              }
            />
            <FilterSelect
              label="Filter by status"
              value={statusFilter}
              options={[
                ["all", "All statuses"],
                ["active", "Active"],
                ["inactive", "Inactive"],
                ["banned", "Banned"],
              ]}
              onChange={(value) =>
                resetPageAnd(() => setStatusFilter(value as UserStatus | "all"))
              }
            />
            {searchQuery || roleFilter !== "all" || statusFilter !== "all" ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        </Card>

        {usersQuery.isPending ? (
          <UserListSkeleton />
        ) : usersQuery.isError && !usersQuery.data ? (
          <Card className="border-border bg-card p-10 text-center">
            <AlertTriangle className="mx-auto mb-4 size-8 text-destructive" />
            <h2 className="font-heading text-xl text-foreground">
              We could not load users
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check the connection and try again.
            </p>
            <Button className="mt-5" onClick={() => void usersQuery.refetch()}>
              Try again
            </Button>
          </Card>
        ) : visibleUsers.length === 0 ? (
          <Card className="border-border bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent">
              <Users className="size-6 text-primary" />
            </div>
            <h2 className="font-heading text-xl text-foreground">
              No users found
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Adjust the search or filters to find another account.
            </p>
          </Card>
        ) : (
          <>
            <DesktopTable
              users={visibleUsers}
              currentUserId={currentUser?.id}
              pendingUserId={
                actionMutation.isPending
                  ? actionMutation.variables?.user.id
                  : undefined
              }
              onEdit={setEditingUserId}
              onAction={runAction}
            />
            <MobileCards
              users={visibleUsers}
              currentUserId={currentUser?.id}
              pendingUserId={
                actionMutation.isPending
                  ? actionMutation.variables?.user.id
                  : undefined
              }
              onEdit={setEditingUserId}
              onAction={runAction}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              total={filteredUsers.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <EditUserDialog
        userId={editingUserId}
        open={Boolean(editingUserId)}
        onOpenChange={(open) => {
          if (!open) setEditingUserId(null);
        }}
        onSaved={(user) => {
          replaceCachedUser(user);
          setEditingUserId(null);
        }}
        onForbidden={handleForbidden}
        onMissing={handleMissingUser}
      />

      <ActionConfirmation
        action={confirmation}
        pending={actionMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !actionMutation.isPending) setConfirmation(null);
        }}
        onConfirm={() => {
          if (confirmation) actionMutation.mutate(confirmation);
        }}
      />
    </AdminPageFrame>
  );
}

function DesktopTable({
  users,
  currentUserId,
  pendingUserId,
  onEdit,
  onAction,
}: UserListProps) {
  return (
    <Card className="hidden overflow-hidden border-border bg-card shadow-ambient lg:block">
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Users">
          <thead>
            <tr className="border-b border-border bg-background/70">
              {[
                "User",
                "Role",
                "Status",
                "Gender",
                "Date of birth",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className={
                    "px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground " +
                    (heading === "Actions" ? "text-right" : "text-left")
                  }
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-accent/40"
              >
                <td className="px-6 py-4">
                  <UserIdentity user={user} />
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {formatGender(user.gender)}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {formatDate(user.dateOfBirth)}
                </td>
                <td className="px-6 py-4 text-right">
                  <UserActions
                    user={user}
                    isCurrentUser={user.id === currentUserId}
                    pending={user.id === pendingUserId}
                    onEdit={() => onEdit(user.id)}
                    onAction={onAction}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MobileCards({
  users,
  currentUserId,
  pendingUserId,
  onEdit,
  onAction,
}: UserListProps) {
  return (
    <div className="grid gap-4 lg:hidden">
      {users.map((user) => (
        <Card
          key={user.id}
          className="border-border bg-card p-4 shadow-ambient transition-[transform,box-shadow,border-color] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-ambient-hover"
        >
          <div className="flex items-start justify-between gap-3">
            <UserIdentity user={user} />
            <UserActions
              user={user}
              isCurrentUser={user.id === currentUserId}
              pending={user.id === pendingUserId}
              onEdit={() => onEdit(user.id)}
              onAction={onAction}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Gender</dt>
              <dd className="mt-1 text-foreground">
                {formatGender(user.gender)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Date of birth</dt>
              <dd className="mt-1 text-foreground">
                {formatDate(user.dateOfBirth)}
              </dd>
            </div>
          </dl>
        </Card>
      ))}
    </div>
  );
}

interface UserListProps {
  users: UserProfile[];
  currentUserId?: string;
  pendingUserId?: string;
  onEdit: (userId: string) => void;
  onAction: (action: ConfirmationAction) => void;
}

function UserActions({
  user,
  isCurrentUser,
  pending,
  onEdit,
  onAction,
}: {
  user: UserProfile;
  isCurrentUser: boolean;
  pending: boolean;
  onEdit: () => void;
  onAction: (action: ConfirmationAction) => void;
}) {
  if (pending) {
    return (
      <span
        className="inline-flex size-9 items-center justify-center"
        aria-label="Updating user"
      >
        <Loader2 className="size-4 animate-spin text-primary" />
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={"Actions for " + user.displayName}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          {isCurrentUser ? "Your account" : "Manage account"}
        </DropdownMenuLabel>
        {isCurrentUser ? (
          <DropdownMenuItem asChild>
            <Link href="/admin/profile">
              <ShieldCheck className="size-4" />
              Open my profile
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="size-4" />
            Edit profile
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isCurrentUser}>
            <UserCog className="mr-2 size-4" />
            Change role
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              disabled={user.role === "student"}
              onSelect={() =>
                onAction({ kind: "role", user, value: "student" })
              }
            >
              Student
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={user.role === "researcher"}
              onSelect={() =>
                onAction({ kind: "role", user, value: "researcher" })
              }
            >
              Researcher
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isCurrentUser}>
            <UserCheck className="mr-2 size-4" />
            Change status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              disabled={user.status === "active"}
              onSelect={() =>
                onAction({ kind: "status", user, value: "active" })
              }
            >
              <UserCheck className="size-4 text-teal" /> Active
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={user.status === "inactive"}
              onSelect={() =>
                onAction({ kind: "status", user, value: "inactive" })
              }
            >
              <UserX className="size-4" /> Inactive
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={user.status === "banned"}
              onSelect={() =>
                onAction({ kind: "status", user, value: "banned" })
              }
            >
              <Ban className="size-4 text-destructive" /> Banned
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isCurrentUser}
          className="text-destructive focus:text-destructive"
          onSelect={() => onAction({ kind: "delete", user })}
        >
          <Trash2 className="size-4" /> Delete user
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EditUserDialog({
  userId,
  open,
  onOpenChange,
  onSaved,
  onForbidden,
  onMissing,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (user: UserProfile) => void;
  onForbidden: () => void;
  onMissing: () => void;
}) {
  const [values, setValues] = useState<UserFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [emailError, setEmailError] = useState("");
  const detailQuery = useQuery({
    queryKey: USER_QUERY_KEYS.detail(userId ?? "closed"),
    queryFn: () => getUserById(userId as string),
    enabled: open && Boolean(userId),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    setValues(toFormState(detailQuery.data));
    setFormError("");
    setEmailError("");
  }, [detailQuery.data]);

  useEffect(() => {
    if (!open || !detailQuery.error) return;
    const status = getErrorStatus(detailQuery.error);
    if (status === 403) {
      onForbidden();
    } else if (status === 404) {
      toast.error("This user no longer exists. The list has been refreshed.");
      onMissing();
    }
  }, [detailQuery.error, onForbidden, onMissing, open]);

  const patch = detailQuery.data
    ? buildProfilePatch(detailQuery.data, values)
    : {};
  const isDirty = Object.keys(patch).length > 0;

  const updateMutation = useMutation({
    mutationFn: () => updateUser(userId as string, patch),
    onSuccess: (user) => {
      toast.success("User profile updated.");
      onSaved(user);
    },
    onError: (error) => {
      const status = getErrorStatus(error);
      if (status === 409) {
        setEmailError("This email is already in use.");
      } else if (status === 403) {
        onForbidden();
      } else if (status === 404) {
        toast.error("This user no longer exists. The list has been refreshed.");
        onMissing();
      } else {
        setFormError(
          getErrorMessage(error, "We could not update this profile."),
        );
      }
    },
  });

  const submit = () => {
    setFormError("");
    setEmailError("");
    if (!values.email.trim() || !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (
      (patch.firstName !== undefined && !patch.firstName.trim()) ||
      (patch.lastName !== undefined && !patch.lastName.trim())
    ) {
      setFormError("First name and last name cannot be empty when changed.");
      return;
    }
    if (
      patch.dateOfBirth !== undefined &&
      !isValidDateOnly(patch.dateOfBirth)
    ) {
      setFormError("Enter a valid date of birth when changing it.");
      return;
    }
    if (isDirty) updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit user profile</DialogTitle>
          <DialogDescription>
            Update only the profile fields supported by the Users API.
          </DialogDescription>
        </DialogHeader>
        {detailQuery.isPending ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        ) : detailQuery.isError || !detailQuery.data ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            We could not load this user.{" "}
            <button
              className="font-semibold underline"
              onClick={() => void detailQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-edit-email">Email</Label>
              <Input
                id="admin-edit-email"
                type="email"
                value={values.email}
                aria-invalid={Boolean(emailError)}
                aria-describedby={
                  emailError ? "admin-edit-email-error" : undefined
                }
                onChange={(event) =>
                  setValues({ ...values, email: event.target.value })
                }
              />
              {emailError ? (
                <p
                  id="admin-edit-email-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {emailError}
                </p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                id="admin-edit-firstname"
                label="First name"
                value={values.firstName}
                onChange={(firstName) => setValues({ ...values, firstName })}
              />
              <FormInput
                id="admin-edit-lastname"
                label="Last name"
                value={values.lastName}
                onChange={(lastName) => setValues({ ...values, lastName })}
              />
              <div className="space-y-2">
                <Label htmlFor="admin-edit-gender">Gender</Label>
                <select
                  id="admin-edit-gender"
                  className="h-9 w-full rounded-[var(--radius-input)] border border-input bg-input-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={values.gender}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      gender: event.target.value as UserFormState["gender"],
                    })
                  }
                >
                  <option value="" disabled>
                    Not provided
                  </option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <FormInput
                id="admin-edit-birthdate"
                label="Date of birth"
                type="date"
                value={values.dateOfBirth}
                onChange={(dateOfBirth) =>
                  setValues({ ...values, dateOfBirth })
                }
              />
            </div>
            {formError ? (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                ) : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ActionConfirmation({
  action,
  pending,
  onOpenChange,
  onConfirm,
}: {
  action: ConfirmationAction | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const copy = getConfirmationCopy(action);
  const destructive =
    action?.kind === "delete" ||
    (action?.kind === "status" && action.value === "banned");

  return (
    <AlertDialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            ) : null}
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UserIdentity({ user }: { user: UserProfile }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-10 border border-border">
        {user.imageUrl ? <AvatarImage src={user.imageUrl} alt="" /> : null}
        <AvatarFallback className="bg-primary/15 text-sm font-medium text-tag">
          {user.initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {user.displayName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const labels: Record<UserRole, string> = {
    admin: "Admin",
    researcher: "Researcher",
    student: "Student",
  };
  return (
    <Badge variant={role === "student" ? "secondary" : "default"}>
      {labels[role]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const config: Record<
    UserStatus,
    {
      label: string;
      variant: "teal" | "secondary" | "destructive";
    }
  > = {
    active: { label: "Active", variant: "teal" },
    inactive: { label: "Inactive", variant: "secondary" },
    banned: { label: "Banned", variant: "destructive" },
  };
  return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      className="h-10 w-full rounded-[var(--radius-input)] border border-input bg-input-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:w-48"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </select>
  );
}

function Pagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount} · {total} users
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function UserListSkeleton() {
  return (
    <Card
      className="space-y-3 border-border bg-card p-6"
      aria-label="Loading users"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-border py-3 last:border-0"
        >
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="hidden h-6 w-20 sm:block" />
        </div>
      ))}
    </Card>
  );
}

function toFormState(user: UserProfile): UserFormState {
  return {
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    gender: user.gender ?? "",
    dateOfBirth: user.dateOfBirth?.slice(0, 10) ?? "",
  };
}

function buildProfilePatch(
  user: UserProfile,
  values: UserFormState,
): UpdateUserProfileInput {
  const current = toFormState(user);
  const patch: UpdateUserProfileInput = {};
  if (values.email.trim() !== current.email) {
    patch.email = values.email.trim().toLowerCase();
  }
  if (values.firstName.trim() !== current.firstName) {
    patch.firstName = values.firstName.trim();
  }
  if (values.lastName.trim() !== current.lastName) {
    patch.lastName = values.lastName.trim();
  }
  if (values.gender && values.gender !== current.gender) {
    patch.gender = values.gender;
  }
  if (values.dateOfBirth !== current.dateOfBirth) {
    patch.dateOfBirth = values.dateOfBirth;
  }
  return patch;
}

function getConfirmationCopy(action: ConfirmationAction | null) {
  if (!action) {
    return {
      title: "Confirm action",
      description: "Review this account change before continuing.",
    };
  }
  if (action.kind === "delete") {
    return {
      title: "Delete this user permanently?",
      description:
        action.user.displayName +
        " (" +
        action.user.email +
        ") will be permanently removed. This action cannot be undone.",
    };
  }
  if (action.kind === "role") {
    return {
      title: "Remove admin access?",
      description:
        action.user.displayName +
        " will become " +
        action.value +
        ". The Users API cannot assign the Admin role again from this screen.",
    };
  }
  return {
    title: "Ban this user?",
    description:
      action.user.displayName +
      " will no longer be allowed to use an active account until an administrator reactivates it.",
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return "Not provided";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "Not provided";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function isValidDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function formatGender(value: UserProfile["gender"]) {
  if (!value) return "Not provided";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getErrorStatus(error: unknown): number | undefined {
  return error && typeof error === "object" && "status" in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function handleAdminError(
  error: unknown,
  onForbidden: () => void,
  onMissing: () => void,
) {
  const status = getErrorStatus(error);
  if (status === 403) {
    onForbidden();
    return;
  }
  if (status === 404) {
    toast.error("This user no longer exists. The list has been refreshed.");
    onMissing();
    return;
  }
  toast.error(getErrorMessage(error, "We could not update this user."));
}
