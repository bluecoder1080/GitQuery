import type { IndexStatus, Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

export function indexStatusLabel(status: IndexStatus) {
  switch (status) {
    case "READY":
      return "Ready";
    case "INDEXING":
      return "Indexing";
    case "FAILED":
      return "Failed";
    default:
      return "Not indexed";
  }
}

/** Text + dot colour per index state, kept in one place for consistency. */
const STATUS_STYLES: Record<
  IndexStatus,
  { pill: string; dot: string; pulse?: boolean }
> = {
  READY: {
    pill: "border-primary/30 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  INDEXING: {
    pill: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
    pulse: true,
  },
  FAILED: {
    pill: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  PENDING: {
    pill: "border-border bg-muted/50 text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
};

export function IndexStatusBadge({
  status,
  className,
}: {
  status: IndexStatus;
  className?: string;
}) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        styles.pill,
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          styles.dot,
          styles.pulse && "animate-pulse",
        )}
      />
      {indexStatusLabel(status)}
    </span>
  );
}

export function languageColor(language: string | null) {
  const map: Record<string, string> = {
    TypeScript: "bg-sky-500",
    JavaScript: "bg-amber-400",
    Java: "bg-orange-500",
    Python: "bg-emerald-500",
    Go: "bg-cyan-500",
    Rust: "bg-orange-700",
    Kotlin: "bg-violet-500",
    C: "bg-slate-500",
    "C++": "bg-blue-600",
    "C#": "bg-violet-600",
    Ruby: "bg-red-500",
    PHP: "bg-indigo-400",
    Swift: "bg-orange-400",
    Scala: "bg-red-600",
    Shell: "bg-emerald-700",
    HTML: "bg-orange-600",
    CSS: "bg-blue-500",
    Vue: "bg-emerald-600",
    Svelte: "bg-red-500",
  };
  return map[language ?? ""] ?? "bg-muted-foreground";
}

export function RepoMeta({ repo }: { repo: Repository }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] text-muted-foreground">
      {repo.language && (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn("size-2 rounded-full", languageColor(repo.language))}
          />
          {repo.language.toLowerCase()}
        </span>
      )}
      <span>{repo.defaultBranch}</span>
      {repo.chunkCount > 0 && (
        <span>{repo.chunkCount.toLocaleString()} chunks</span>
      )}
    </div>
  );
}
