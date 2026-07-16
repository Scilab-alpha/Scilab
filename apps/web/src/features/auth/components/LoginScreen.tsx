"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpen, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "@/features/auth/components/AuthShell";
import PasswordInput from "@/features/auth/components/PasswordInput";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { routes } from "@/shared/constants/routes";

const PLATFORM_FEATURES = [
  {
    icon: TrendingUp,
    title: "Trend intelligence",
    description:
      "Monitor emerging keywords and research momentum in your field.",
  },
  {
    icon: BookOpen,
    title: "Journal discovery",
    description:
      "Explore journals and articles with curated, up-to-date insights.",
  },
  {
    icon: BarChart3,
    title: "Role-based analytics",
    description:
      "Students, researchers, and admins each get a tailored workspace.",
  },
] as const;

const PLATFORM_STATS = [
  "50M+ research papers",
  "10K+ active researchers",
  "500+ universities",
] as const;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const result = await login(email, password, rememberMe);

    if (!result.ok) {
      setIsLoading(false);
      toast.error(result.message);
      return;
    }

    setIsLoading(false);
    toast.success(`Signed in as ${result.user.name}`);
    router.push(result.redirectTo);
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    toast.info("Google sign-in is not available yet.");
    setIsGoogleLoading(false);
  };

  const handleForgotPassword = () => {
    toast.info("Password recovery is coming soon.");
  };

  const isBusy = isLoading || isGoogleLoading;

  return (
    <AuthShell
      eyebrow="Research intelligence platform"
      heroTitle="Unlock scientific publication insights"
      heroDescription="Track emerging research trends, discover breakthrough papers, and stay ahead in your field with calm, focused analytics."
      features={PLATFORM_FEATURES}
      footerItems={PLATFORM_STATS}
      formTitle="Welcome back"
      formDescription="Sign in to continue exploring scientific publications and research trends."
    >
      <Card>
        <CardHeader className="border-b border-border/60 px-6 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                className="h-11 bg-input-background/80 hover:border-primary/25 focus-visible:bg-card"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isBusy}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11 bg-input-background/80 hover:border-primary/25 focus-visible:bg-card"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isBusy}
                required
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isBusy}
                />
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-sm text-muted-foreground"
                >
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                className="auth-link text-sm disabled:pointer-events-none disabled:opacity-50"
                onClick={handleForgotPassword}
                disabled={isBusy}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="auth-clickable h-11 w-full"
              disabled={isBusy}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-7 pt-6 sm:px-8 sm:pb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="auth-clickable h-11 w-full"
            onClick={handleGoogleLogin}
            disabled={isBusy}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-1 animate-spin" />
                Connecting...
              </>
            ) : (
              "Continue with Google"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push(routes.auth.register)}
              className="auth-link disabled:pointer-events-none disabled:opacity-50"
              disabled={isBusy}
            >
              Create account
            </button>
          </p>

          <Button
            type="button"
            variant="secondary"
            className="auth-clickable h-11 w-full"
            onClick={() => router.push(routes.student.journals)}
            disabled={isBusy}
          >
            Continue as guest
          </Button>
        </CardContent>
      </Card>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </AuthShell>
  );
}
