"use client";

import type { Permission } from "@/features/auth/types/auth.types";
import { useAuth } from "@/providers/auth-provider";

interface CanProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
