"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  GitBranch,
  Lock,
  MessageSquare,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { IndexErrorAlert } from "@/components/dashboard/index-error-alert";
import { LanguageBadge } from "@/components/dashboard/language-badge";
import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import { LanguageIcon } from "@/components/icons/language-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { getRepoProgress, useStartIndexing } from "@/hooks/use-repos";
import type { IndexStatus, Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Accent colour per index state, used for the card's top hairline. */
const STATUS_ACCENT: Record<IndexStatus, string> = {
  READY: "from-transparent via-primary/70 to-transparent",
  INDEXING: "from-transparent via-sky-400/70 to-transparent",
  FAILED: "from-transparent via-destructive/70 to-transparent",
  PENDING: "from-transparent via-border to-transparent",
};

function MetaChip({
  icon: Icon,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[0.68rem] text-muted-foreground",
        className,
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}

export function RepoCard({ repo }: { repo: Repository }) {
  const router = useRouter();
  const indexMutation = useStartIndexing();
  const isIndexing = repo.indexStatus === "INDEXING" || indexMutation.isPending;
  const isFailed = repo.indexStatus === "FAILED";
  const isReady = repo.indexStatus === "READY";
  const progress = getRepoProgress(repo);

  function openChat() {
    router.push(`/chat/${repo.id}`);
  }

  function handlePrimary() {
    if (isReady) {
      openChat();
      return;
    }
    indexMutation.mutate(repo.id, {
      onSuccess: () => router.push(`/chat/${repo.id}`),
    });
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card/70 backdrop-blur transition-all duration-300",
        isFailed
          ? "border-destructive/25 hover:border-destructive/40"
          : "border-border/70 hover:-translate-y-1 hover:border-primary/40 hover:shadow-raised",
      )}
    >
      {/* status hairline */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r transition-opacity duration-300",
          STATUS_ACCENT[repo.indexStatus],
          repo.indexStatus === "PENDING" && "opacity-60",
        )}
      />

      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <LanguageBadge language={repo.language} showLabel={false} />
          <div className="min-w-0">
            <p className="truncate font-mono text-[0.7rem] text-muted-foreground">
              {repo.owner}
            </p>
            <h3 className="truncate font-heading font-medium tracking-tight">
              {repo.name}
            </h3>
          </div>
        </div>
        <IndexStatusBadge status={repo.indexStatus} />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <p
          className={cn(
            "text-sm text-muted-foreground",
            isFailed ? "line-clamp-1" : "line-clamp-2 min-h-10",
          )}
        >
          {repo.description || "No description provided."}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {repo.isPrivate && (
            <MetaChip icon={Lock}>
              <span className="sr-only">Visibility: </span>private
            </MetaChip>
          )}
          <MetaChip icon={GitBranch}>{repo.defaultBranch}</MetaChip>
          {repo.language && (
            <MetaChip>
              <LanguageIcon language={repo.language} size="sm" />
              {repo.language.toLowerCase()}
            </MetaChip>
          )}
          {repo.chunkCount > 0 && (
            <MetaChip
              className={cn(isFailed && "border-destructive/25 text-destructive/80")}
            >
              {repo.chunkCount.toLocaleString()} chunks
            </MetaChip>
          )}
        </div>

        {isIndexing && (
          <div className="animate-fade-in space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-sky-500 dark:text-sky-400">
                <span className="size-1.5 animate-pulse rounded-full bg-current" />
                Indexing
              </span>
              <span className="font-mono text-muted-foreground">
                {repo.filesProcessed}/{repo.filesTotal || "?"}
              </span>
            </div>
            <Progress value={progress || 8} className="h-1.5" />
          </div>
        )}

        {isFailed && repo.errorMessage && (
          <IndexErrorAlert message={repo.errorMessage} />
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-4 py-3">
        {repo.htmlUrl ? (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="text-muted-foreground hover:text-foreground"
            render={<a href={repo.htmlUrl} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink data-icon="inline-start" />
            GitHub
          </Button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          {isReady && (
            <Button variant="secondary" size="sm" onClick={openChat}>
              <MessageSquare data-icon="inline-start" />
              Chat
            </Button>
          )}
          <Button
            size="sm"
            variant={isFailed ? "outline" : "default"}
            className={cn(
              "group/btn",
              isFailed &&
                "border-destructive/30 text-destructive hover:bg-destructive/10",
            )}
            disabled={isIndexing}
            onClick={handlePrimary}
          >
            {isIndexing ? (
              <>
                <Spinner data-icon="inline-start" />
                Indexing
              </>
            ) : isReady ? (
              <>
                Open
                <ArrowRight
                  data-icon="inline-end"
                  className="transition-transform duration-300 group-hover/btn:translate-x-0.5"
                />
              </>
            ) : isFailed ? (
              <>
                <RotateCcw data-icon="inline-start" />
                Retry
              </>
            ) : (
              <>
                <Sparkles data-icon="inline-start" />
                Index
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
