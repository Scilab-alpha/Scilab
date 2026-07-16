import type { LucideIcon } from "lucide-react";
import AuthBrand from "@/features/auth/components/AuthBrand";
import { cn } from "@/shared/components/ui/utils";

interface AuthHeroFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface AuthShellProps {
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  features: readonly AuthHeroFeature[];
  footerItems: readonly string[];
  formTitle: string;
  formDescription: string;
  formWidth?: "login" | "register";
  children: React.ReactNode;
}

export default function AuthShell({
  eyebrow,
  heroTitle,
  heroDescription,
  features,
  footerItems,
  formTitle,
  formDescription,
  formWidth = "login",
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-background lg:flex">
      <section className="auth-hero relative hidden min-h-screen w-[52%] overflow-hidden border-r border-border bg-surface-raised lg:flex">
        <div
          className="auth-science-grid absolute inset-0"
          aria-hidden="true"
        />
        <div
          className="auth-orbit-decoration auth-orbit-decoration-one"
          aria-hidden="true"
        />
        <div
          className="auth-orbit-decoration auth-orbit-decoration-two"
          aria-hidden="true"
        />

        <div className="auth-enter-hero relative z-10 flex w-full flex-col justify-between px-12 py-10 xl:px-20 xl:py-12 2xl:px-24">
          <AuthBrand />

          <div className="my-12 max-w-xl space-y-7">
            <span className="inline-flex items-center rounded-[var(--radius-input)] border border-primary/15 bg-accent px-4 py-2 text-sm text-accent-foreground shadow-ambient">
              {eyebrow}
            </span>

            <div className="space-y-5">
              <h1 className="max-w-[11ch] font-heading text-5xl leading-[1.08] text-foreground xl:text-6xl">
                {heroTitle}
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                {heroDescription}
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="auth-feature-item group flex items-start gap-4 rounded-[var(--radius-card)] border border-border/80 bg-card/65 p-4 shadow-ambient"
                  >
                    <div className="auth-feature-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-accent text-tag">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg text-foreground">
                        {feature.title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5 border-t border-border pt-6">
            {footerItems.map((item) => (
              <span key={item} className="text-sm text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
        <div className="auth-mobile-decoration absolute inset-x-0 top-0 h-48 lg:hidden" />
        <div
          className={cn(
            "auth-enter-panel relative z-10 w-full",
            formWidth === "register" ? "max-w-[560px]" : "max-w-[480px]",
          )}
        >
          <AuthBrand compact className="mb-10 justify-center lg:hidden" />

          <header className="mb-8 space-y-2 text-center">
            <h2 className="font-heading text-4xl text-foreground sm:text-[2.65rem]">
              {formTitle}
            </h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              {formDescription}
            </p>
          </header>

          <div className="auth-form-card">{children}</div>
        </div>
      </section>
    </main>
  );
}
