"use client";

import { AlertTriangle, LoaderCircle, RotateCcw } from "lucide-react";

import { GitQueryIcon } from "@/components/icons/gitquery-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getRepoProgress, useStartIndexing } from "@/hooks/use-repos";
import type { IndexStatusResponse, Repository } from "@/lib/api";

export function IndexingState({
  repo,
  status,
}: {
  repo: Repository;
  status?: IndexStatusResponse;
}) {
  const indexMutation = useStartIndexing();
  const filesProcessed = status?.filesProcessed ?? repo.filesProcessed;
  const filesTotal = status?.filesTotal ?? repo.filesTotal;
  const chunkCount = status?.chunkCount ?? repo.chunkCount;
  const progress = getRepoProgress({ filesProcessed, filesTotal });
  const indexStatus = status?.indexStatus ?? repo.indexStatus;
  const errorMessage = status?.errorMessage ?? repo.errorMessage;

  if (indexStatus === "FAILED") {
    return (
      <div className="animate-fade-in flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md rounded-3xl border border-destructive/25 bg-destructive/5 p-8 text-center backdrop-blur">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <h2 className="mt-5 font-heading text-lg font-semibold tracking-tight">
            Indexing failed
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground break-words">
            {errorMessage ||
              "Something went wrong while indexing this repository."}
          </p>
          <Button
            className="mt-6"
            onClick={() => indexMutation.mutate(repo.id)}
            disabled={indexMutation.isPending}
          >
            <RotateCcw data-icon="inline-start" />
            Retry indexing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto w-fit">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-3xl bg-primary/15 blur-2xl animate-glow"
          />
          <GitQueryIcon className="relative size-14 rounded-2xl shadow-floating" />
          <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-primary">
            <LoaderCircle className="size-3 animate-spin-slow text-primary-foreground" />
          </span>
        </div>

        <h2 className="mt-6 font-heading text-lg font-semibold tracking-tight">
          Indexing <span className="text-primary">{repo.name}</span>
        </h2>

        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {filesTotal > 0
            ? `${filesProcessed} / ${filesTotal} files · ${chunkCount.toLocaleString()} chunks`
            : "Fetching repository files…"}
        </p>

        <div className="mx-auto mt-6 max-w-sm space-y-3">
          <Progress
            value={filesTotal ? Math.max(progress, 3) : 12}
            className="h-1.5"
          />
          <p className="text-xs text-muted-foreground">
            Chunking source and generating embeddings locally. Chat unlocks when
            this finishes — you can leave the page open.
          </p>
        </div>
      </div>
    </div>
  );
}
