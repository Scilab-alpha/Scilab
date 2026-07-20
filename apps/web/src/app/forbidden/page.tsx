"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { getPostLoginPath } from "@/shared/constants/routes";

export default function ForbiddenPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-[var(--radius-card)] flex items-center justify-center mx-auto">
          <ShieldX className="w-8 h-8 text-destructive" strokeWidth={1.75} />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl text-foreground">
            403 — Access Denied
          </h1>
          <p className="text-muted-foreground">
            Your current role does not have permission to view this page.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href={user ? getPostLoginPath(user.role) : "/auth/login"}>
              {user ? "Go to My Dashboard" : "Sign In"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/journals">Browse as Guest</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
