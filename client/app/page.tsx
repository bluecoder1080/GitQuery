import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  FileCode2,
  Layers,
  MessageSquareCode,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { GitQueryIcon } from "@/components/icons/gitquery-icon";
import { GitHubIcon } from "@/components/icons/github-icon";
import { BrandMark } from "@/components/layout/brand-mark";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getGithubLoginUrl } from "@/lib/api";

const FEATURES = [
  {
    icon: Layers,
    title: "Indexed, not guessed",
    body: "Every file is fetched from the GitHub API, split into overlapping chunks, and embedded into Postgres with pgvector — so retrieval works on the real tree, not a memory of it.",
  },
  {
    icon: Search,
    title: "Scoped retrieval",
    body: "Similarity search is filtered by repository id inside the query itself. Answers can never drift into a different project's code.",
  },
  {
    icon: FileCode2,
    title: "Citations you can click",
    body: "Each answer carries the file paths and line ranges it was grounded in, linked straight to GitHub so you can verify the claim.",
  },
  {
    icon: ShieldCheck,
    title: "Your keys, your data",
    body: "GitHub tokens are encrypted at rest with AES. Nothing is proxied through a third-party service, and indexes live in your own database.",
  },
  {
    icon: Sparkles,
    title: "Streams as it thinks",
    body: "Replies arrive token by token over server-sent events, with the indexing pipeline running off the request thread so nothing blocks.",
  },
  {
    icon: Braces,
    title: "Understands source",
    body: "Language-aware filtering skips lockfiles, build output and vendored code, so the index holds the code you actually wrote.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect GitHub",
    body: "OAuth with repo scope. Works for public and private repositories.",
  },
  {
    n: "02",
    title: "Pick a repository",
    body: "Your repos sync automatically and are cached for fast reloads.",
  },
  {
    n: "03",
    title: "Index it",
    body: "Watch progress as files are chunked and embedded into pgvector.",
  },
  {
    n: "04",
    title: "Ask anything",
    body: "Grounded answers with citations, streamed as they're written.",
  },
];

const TECH = [
  "Spring Boot 4",
  "Java 21",
  "Spring AI",
  "PostgreSQL + pgvector",
  "Next.js 16",
  "Claude Haiku 5.5",
];

export default function HomePage() {
  return (
    <div className="relative min-h-svh overflow-hidden">
      {/* Ambient background: drifting mesh + masked grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mesh-bg animate-drift"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-overlay opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px] animate-glow"
      />

      <header className="sticky top-0 z-30 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <BrandMark />
          <nav className="flex items-center gap-1.5">
            <a
              href="#features"
              className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Features
            </a>
            <a
              href="#how"
              className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              How it works
            </a>
            <ModeToggle />
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* ------------------------------------------------------------ hero */}
        <section className="mx-auto w-full max-w-6xl px-5 pt-20 pb-16 sm:pt-28">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 py-1 pr-3.5 pl-1.5 text-xs backdrop-blur">
                <span className="relative flex size-5 items-center justify-center">
                  <span className="absolute size-2 rounded-full bg-primary animate-glow" />
                </span>
                <span className="text-muted-foreground">
                  Retrieval-augmented answers, cited to source
                </span>
              </div>

              <h1
                className="animate-fade-up mt-6 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-[3.4rem]"
                style={{ animationDelay: "80ms" }}
              >
                Ask your codebase
                <br />
                <span className="text-gradient">anything.</span>
              </h1>

              <p
                className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-balance"
                style={{ animationDelay: "160ms" }}
              >
                GitQuery reads a GitHub repository, embeds it into a vector store,
                and answers your questions using the actual source — with citations
                that link back to the exact file.
              </p>

              <div
                className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "240ms" }}
              >
                <a
                  href={getGithubLoginUrl()}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group h-11 gap-2 px-5 shadow-glow transition-shadow hover:shadow-floating",
                  )}
                >
                  <GitHubIcon className="size-4" />
                  Continue with GitHub
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </a>
                <Link
                  href="#how"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 px-5 backdrop-blur",
                  )}
                >
                  See how it works
                </Link>
              </div>

              <div
                className="animate-fade-in mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground"
                style={{ animationDelay: "380ms" }}
              >
                {["Encrypted token storage", "Per-repo vector isolation", "Streaming responses"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-primary" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* Product preview: a real answer shape, not a stock illustration */}
            <div
              className="animate-scale-in relative"
              style={{ animationDelay: "260ms" }}
            >
              <div
                aria-hidden
                className="absolute -inset-4 rounded-[2rem] bg-primary/8 blur-3xl"
              />
              <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-floating backdrop-blur-xl">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                  <span className="size-2.5 rounded-full bg-destructive/60" />
                  <span className="size-2.5 rounded-full bg-amber-400/60" />
                  <span className="size-2.5 rounded-full bg-emerald-400/60" />
                  <span className="ml-2 font-mono text-[0.68rem] text-muted-foreground">
                    index-service.java
                  </span>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground shadow-subtle">
                      How is re-indexing made safe?
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <GitQueryIcon className="mt-0.5 size-7 shrink-0 rounded-lg" />
                    <div className="min-w-0 space-y-3">
                      <p className="text-sm leading-relaxed">
                        Vectors for the repository are deleted by metadata filter
                        before re-inserting, so a re-index is idempotent rather than
                        duplicating rows.
                      </p>
                      <pre className="overflow-hidden rounded-xl border border-border/60 bg-muted/50 p-3 font-mono text-[0.7rem] leading-relaxed">
                        <code>
                          <span className="text-muted-foreground">
                            {"// scoped purge, not a truncate\n"}
                          </span>
                          <span className="text-primary">vectorStore</span>
                          {".delete(filter);"}
                        </code>
                      </pre>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { path: "IndexingService.java", line: "62" },
                          { path: "CodeChunker.java", line: "31" },
                        ].map((c) => (
                          <span
                            key={c.path}
                            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/60 px-2 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
                          >
                            {c.path}:{c.line}
                            <ArrowUpRight className="size-2.5 opacity-60" />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- features */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20">
          <Reveal>
            <p className="font-mono text-xs tracking-widest text-primary uppercase">
              What it does
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Built like a real retrieval system, not a demo
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 70}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/90 hover:shadow-raised">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border/70 bg-muted/60 transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                    <feature.icon className="size-5 text-foreground transition-colors duration-300 group-hover:text-primary" />
                  </span>
                  <h3 className="mt-5 font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ how it works */}
        <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20">
          <Reveal>
            <p className="font-mono text-xs tracking-widest text-primary uppercase">
              The flow
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              From repository to answer in four steps
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 90}>
                <div className="group relative h-full rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-raised">
                  <span className="font-mono text-sm text-primary/70 transition-colors group-hover:text-primary">
                    {step.n}
                  </span>
                  <h3 className="mt-4 font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------- cta */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 px-8 py-14 text-center backdrop-blur-xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 mesh-bg opacity-80"
              />
              <div className="relative">
                <GitQueryIcon className="mx-auto size-12 rounded-2xl animate-float shadow-floating" />
                <h2 className="mt-7 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Point it at a repository
                </h2>
                <p className="mx-auto mt-4 max-w-md text-muted-foreground text-balance">
                  Sign in with GitHub, index a project, and start asking. Free to
                  run on your own keys.
                </p>
                <a
                  href={getGithubLoginUrl()}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group mt-9 h-11 gap-2 px-5 shadow-glow transition-shadow hover:shadow-floating",
                  )}
                >
                  <MessageSquareCode className="size-4" />
                  Get started
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark href={null} />
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {TECH.map((t) => (
              <li
                key={t}
                className="font-mono text-[0.7rem] text-muted-foreground"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}
