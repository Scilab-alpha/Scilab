"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CheckCircle2,
  FlaskConical,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  TriangleAlert,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { listUsers, USER_QUERY_KEYS } from "@/features/users/api/users.api";
import type {
  UserProfile,
  UserRole,
  UserStatus,
} from "@/features/users/types/user.types";
import AdminPageFrame from "@/shared/components/layout/AdminPageFrame";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { routes } from "@/shared/constants/routes";

const USERS_STALE_TIME = 30_000;

const ROLE_PRESENTATION: Record<UserRole, { label: string; color: string }> = {
  student: { label: "Students", color: "#D3AB9E" },
  researcher: { label: "Researchers", color: "#3AC9C1" },
  admin: { label: "Administrators", color: "#5C534E" },
};

const STATUS_PRESENTATION: Record<
  UserStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "#3AC9C1" },
  inactive: { label: "Inactive", color: "#C4B5A8" },
  banned: { label: "Banned", color: "#B54A4A" },
};

export function buildAdminOverview(users: UserProfile[]) {
  const roleCounts: Record<UserRole, number> = {
    student: 0,
    researcher: 0,
    admin: 0,
  };
  const statusCounts: Record<UserStatus, number> = {
    active: 0,
    inactive: 0,
    banned: 0,
  };

  for (const user of users) {
    roleCounts[user.role] += 1;
    statusCounts[user.status] += 1;
  }

  const attentionUsers = users
    .filter((user) => user.status === "inactive" || user.status === "banned")
    .sort((first, second) => {
      if (first.status !== second.status) {
        return first.status === "banned" ? -1 : 1;
      }
      return first.email.localeCompare(second.email);
    })
    .slice(0, 5);

  return {
    total: users.length,
    active: statusCounts.active,
    researchers: roleCounts.researcher,
    needsAttention: statusCounts.inactive + statusCounts.banned,
    roleCounts,
    statusCounts,
    attentionUsers,
  };
}

function useChartAnimations() {
  const [animationsEnabled, setAnimationsEnabled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setAnimationsEnabled(!mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return animationsEnabled;
}

function formatUpdatedAt(timestamp: number) {
  if (!timestamp) return "Waiting for data";
  return `Updated ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp)}`;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading administration overview">
      <Skeleton className="h-36 w-full rounded-[var(--radius-card)] motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-32 rounded-[var(--radius-card)] motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-96 rounded-[var(--radius-card)] motion-reduce:animate-none" />
        <Skeleton className="h-96 rounded-[var(--radius-card)] motion-reduce:animate-none" />
      </div>
      <span className="sr-only">Loading user metrics</span>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
  delay: number;
}

function MetricCard({
  label,
  value,
  description,
  icon,
  iconClassName,
  delay,
}: MetricCardProps) {
  return (
    <Card
      className="gap-4 border border-transparent p-5 transition-[transform,box-shadow,border-color] duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-border motion-safe:hover:shadow-ambient-hover motion-reduce:transform-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-heading text-3xl text-foreground">
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={`flex size-11 items-center justify-center rounded-[var(--radius-card)] ${iconClassName}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}

interface DistributionDatum {
  name: string;
  value: number;
  color: string;
}

interface DistributionChartProps {
  title: string;
  description: string;
  data: DistributionDatum[];
  total: number;
  animationsEnabled: boolean;
}

function DistributionChart({
  title,
  description,
  data,
  total,
  animationsEnabled,
}: DistributionChartProps) {
  const tooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    boxShadow: "var(--shadow-ambient)",
  };

  return (
    <Card className="gap-5 border border-transparent p-6 transition-[transform,box-shadow,border-color] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-border motion-safe:hover:shadow-ambient-hover motion-reduce:transform-none">
      <div>
        <h2 className="font-heading text-xl text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <div
          className="relative h-56 min-w-0"
          role="img"
          aria-label={`${title}: ${data
            .map((item) => `${item.name} ${item.value}`)
            .join(", ")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={2}
                stroke="transparent"
                isAnimationActive={animationsEnabled}
                animationDuration={650}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
            aria-hidden="true"
          >
            <span className="font-heading text-2xl text-foreground">
              {total.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">users</span>
          </div>
        </div>

        <ul className="space-y-3" aria-label={`${title} legend`}>
          {data.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="text-sm font-medium text-foreground">
                {item.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === "banned") {
    return (
      <Badge variant="destructive">
        <Ban aria-hidden="true" />
        Banned
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <AlertCircle aria-hidden="true" />
      Inactive
    </Badge>
  );
}

function AttentionList({ users }: { users: UserProfile[] }) {
  return (
    <Card className="gap-0 overflow-hidden border border-transparent transition-[transform,box-shadow,border-color] duration-200 motion-safe:hover:border-border motion-safe:hover:shadow-ambient-hover">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-heading text-xl text-foreground">
            Accounts requiring attention
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inactive and banned accounts that may need review.
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="motion-reduce:transform-none motion-reduce:transition-none"
        >
          <Link href={routes.admin.users}>
            View all users
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {users.length > 0 ? (
        <ul className="divide-y divide-border">
          {users.map((user) => (
            <li key={user.id}>
              <Link
                href={routes.admin.users}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 sm:px-6"
              >
                <Avatar className="size-10">
                  {user.imageUrl ? (
                    <AvatarImage src={user.imageUrl} alt="" />
                  ) : null}
                  <AvatarFallback className="bg-primary/15 text-xs font-medium text-tag">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <StatusBadge status={user.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-3 p-6">
          <CheckCircle2 className="size-5 text-teal" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            All accounts are currently active.
          </p>
        </div>
      )}
    </Card>
  );
}

export default function AdminOverview() {
  const animationsEnabled = useChartAnimations();
  const usersQuery = useQuery({
    queryKey: USER_QUERY_KEYS.list,
    queryFn: listUsers,
    staleTime: USERS_STALE_TIME,
  });

  const overview = useMemo(
    () => buildAdminOverview(usersQuery.data ?? []),
    [usersQuery.data],
  );

  const roleData = (Object.keys(ROLE_PRESENTATION) as UserRole[]).map(
    (role) => ({
      name: ROLE_PRESENTATION[role].label,
      value: overview.roleCounts[role],
      color: ROLE_PRESENTATION[role].color,
    }),
  );
  const statusData = (Object.keys(STATUS_PRESENTATION) as UserStatus[]).map(
    (status) => ({
      name: STATUS_PRESENTATION[status].label,
      value: overview.statusCounts[status],
      color: STATUS_PRESENTATION[status].color,
    }),
  );

  const refreshAction = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void usersQuery.refetch()}
      disabled={usersQuery.isFetching}
      className="motion-reduce:transform-none motion-reduce:transition-none"
      aria-label={
        usersQuery.isFetching ? "Refreshing user data" : "Refresh user data"
      }
    >
      {usersQuery.isFetching ? (
        <Loader2
          className="animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        <RefreshCw aria-hidden="true" />
      )}
      <span className="hidden sm:inline">
        {usersQuery.isFetching ? "Refreshing" : "Refresh"}
      </span>
    </Button>
  );

  return (
    <AdminPageFrame
      title="Overview"
      subtitle="User access and account health at a glance"
      icon={<LayoutDashboard className="size-5" strokeWidth={1.75} />}
      headerAction={refreshAction}
    >
      {usersQuery.isPending && usersQuery.data === undefined ? (
        <OverviewSkeleton />
      ) : usersQuery.isError && usersQuery.data === undefined ? (
        <Card className="items-center gap-4 border border-destructive/20 p-8 text-center sm:p-12">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle
              className="size-6 text-destructive"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="font-heading text-xl text-foreground">
              User data is unavailable
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              We couldn&apos;t load the administration overview. Check your
              connection and try again.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => void usersQuery.refetch()}
            className="motion-reduce:transform-none motion-reduce:transition-none"
          >
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {usersQuery.isError ? (
            <Alert
              className="border-destructive/20 bg-destructive/5"
              aria-live="polite"
            >
              <TriangleAlert className="text-destructive" aria-hidden="true" />
              <AlertTitle>Showing previously loaded data</AlertTitle>
              <AlertDescription>
                The latest refresh failed. Existing metrics remain available
                while you retry.
              </AlertDescription>
            </Alert>
          ) : null}

          <section
            className="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-ambient sm:p-8"
            aria-labelledby="admin-overview-heading"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(211,171,158,0.24),transparent_52%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(211,171,158,0.13),transparent_52%)]"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <Badge variant="default">People &amp; access</Badge>
                <h2
                  id="admin-overview-heading"
                  className="mt-4 font-heading text-2xl text-foreground sm:text-3xl"
                >
                  A clear view of your user community
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Review account distribution and focus first on users who need
                  administrative attention.
                </p>
              </div>
              <p
                className="shrink-0 text-xs text-muted-foreground"
                aria-live="polite"
              >
                {formatUpdatedAt(usersQuery.dataUpdatedAt)}
              </p>
            </div>
          </section>

          <section
            aria-label="User account metrics"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              label="Total Users"
              value={overview.total}
              description="All accounts returned by the user service"
              icon={<Users className="size-5" strokeWidth={1.75} />}
              iconClassName="bg-primary/15 text-primary"
              delay={0}
            />
            <MetricCard
              label="Active Users"
              value={overview.active}
              description="Accounts currently able to access the platform"
              icon={<UserCheck className="size-5" strokeWidth={1.75} />}
              iconClassName="bg-teal/10 text-teal"
              delay={60}
            />
            <MetricCard
              label="Researchers"
              value={overview.researchers}
              description="Accounts assigned the researcher role"
              icon={<FlaskConical className="size-5" strokeWidth={1.75} />}
              iconClassName="bg-primary/15 text-tag"
              delay={120}
            />
            <MetricCard
              label="Needs Attention"
              value={overview.needsAttention}
              description="Inactive and banned accounts"
              icon={<TriangleAlert className="size-5" strokeWidth={1.75} />}
              iconClassName="bg-destructive/10 text-destructive"
              delay={180}
            />
          </section>

          {overview.total === 0 ? (
            <Card className="items-center gap-3 border border-border p-8 text-center sm:p-12">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                <UsersRound
                  className="size-6 text-primary"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="font-heading text-xl text-foreground">
                  No user accounts yet
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  User metrics and distributions will appear here when accounts
                  are available.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <section
                aria-label="User distribution charts"
                className="grid gap-6 xl:grid-cols-2"
              >
                <DistributionChart
                  title="Role distribution"
                  description="Current account mix by assigned role"
                  data={roleData}
                  total={overview.total}
                  animationsEnabled={animationsEnabled}
                />
                <DistributionChart
                  title="Status distribution"
                  description="Current account mix by access status"
                  data={statusData}
                  total={overview.total}
                  animationsEnabled={animationsEnabled}
                />
              </section>

              <AttentionList users={overview.attentionUsers} />
            </>
          )}
        </div>
      )}
    </AdminPageFrame>
  );
}
