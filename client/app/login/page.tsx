"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { BrandMark } from "@/components/layout/brand-mark";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { UsageAllowance } from "@/components/usage-allowance";
import { cn } from "@/lib/utils";
import { getGithubLoginUrl } from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-auth";

function LoginLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}

const PERMISSIONS = [
  {
    icon: ShieldCheck,
    label: "Read your repositories",
    detail: "Public and private, so private projects can be indexed.",
  },
  {
    icon: Lock,
    label: "Encrypted at rest",
    detail: "The access token is encrypted before it is stored.",
  },
];

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const error = params.get("error");
  const next = params.get("next") || "/dashboard";
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(next.startsWith("/") ? next : "/dashboard");
    }
  }, [user, isLoading, next, router]);

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mesh-bg animate-drift"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-overlay opacity-60"
      />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <BrandMark />
        <ModeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-4">
          <Card
            className="animate-scale-in w-full rounded-3xl border-border/70 bg-card/80 shadow-floating backdrop-blur-xl"
          >
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/60 transition-transform duration-300 hover:scale-105">
              <GitHubIcon className="size-6" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="font-heading text-xl tracking-tight">
                Sign in to GitQuery
              </CardTitle>
              <CardDescription>
                Connect GitHub to index a repository and start asking.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle />
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>
                  {error === "session"
                    ? "The session could not be established. Please try again."
                    : "GitHub rejected the request. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <a
              href={getGithubLoginUrl()}
              className={cn(
                buttonVariants({ size: "lg" }),
                "group h-11 w-full gap-2 shadow-glow transition-shadow hover:shadow-floating",
              )}
            >
              <GitHubIcon className="size-5" />
              Continue with GitHub
            </a>

            <ul className="space-y-3 border-t border-border/60 pt-5">
              {PERMISSIONS.map((p) => (
                <li key={p.label} className="flex gap-3">
                  <p.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium">{p.label}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {p.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

          <UsageAllowance className="animate-fade-up" style={{ animationDelay: "120ms" }} />
        </div>
      </main>

      <footer className="relative z-10 pb-8 text-center">
        <p className="font-mono text-[0.7rem] text-muted-foreground">
          Powered by Claude · vectors stored in PostgreSQL
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
