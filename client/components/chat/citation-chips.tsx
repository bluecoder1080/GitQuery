"use client";

import { ArrowUpRight } from "lucide-react";

import type { Citation, Repository } from "@/lib/api";

export function citationHref(repo: Repository, citation: Citation) {
  const line =
    citation.startLine != null
      ? `#L${citation.startLine}${
          citation.endLine && citation.endLine !== citation.startLine
            ? `-L${citation.endLine}`
            : ""
        }`
      : "";
  return `https://github.com/${repo.fullName}/blob/${repo.defaultBranch}/${citation.filePath}${line}`;
}

export function CitationChips({
  repo,
  citations,
}: {
  repo: Repository;
  citations: Citation[];
}) {
  if (!citations.length) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <p className="font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
        Sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((citation, index) => {
          const line = citation.startLine != null ? `:${citation.startLine}` : "";
          return (
            <a
              key={`${citation.filePath}-${index}`}
              href={citationHref(repo, citation)}
              target="_blank"
              rel="noreferrer"
              title={`${citation.filePath}${line}`}
              className="group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 py-1 pr-2 pl-1.5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/10"
            >
              <span className="flex size-4 shrink-0 items-center justify-center rounded bg-background/70 font-mono text-[0.6rem] text-muted-foreground transition-colors group-hover:bg-primary/20 group-hover:text-primary">
                {index + 1}
              </span>
              <span className="truncate font-mono text-[0.68rem] text-muted-foreground transition-colors group-hover:text-foreground">
                {citation.filePath}
                {line}
              </span>
              <ArrowUpRight className="size-3 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-primary" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
