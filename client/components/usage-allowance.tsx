import { Coins, Mail } from "lucide-react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** Where users ask for a larger allowance. Mirrors UsageService.CONTACT_EMAIL. */
export const ALLOWANCE_CONTACT_EMAIL = "work.aditya404@gmail.com";

/** Fallback credit figure, used before a signed-in user's real value loads. */
export const INCLUDED_CREDIT_USD = 0.05;

/**
 * Reference figures for one exchange, at Claude Haiku 5.5 list pricing:
 * $0.10 per million input tokens and $0.50 per million output tokens.
 *
 *   500 in  -> 500/1e6 * 0.10 = $0.00005
 *   200 out -> 200/1e6 * 0.50 = $0.00010
 *                     total    = $0.00015
 */
const TOKENS_IN = 500;
const TOKENS_OUT = 200;
const COST_PER_MESSAGE = 0.00015;

/** Trims trailing zeros so $0.00015 reads precisely but $0.05 isn't "$0.05000". */
function usd(value: number, maxDecimals = 5) {
  const trimmed = value
    .toFixed(maxDecimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
  return `$${trimmed}`;
}

const REFERENCE_ROWS = [
  { label: "Input tokens", value: TOKENS_IN.toLocaleString() },
  { label: "Output tokens", value: TOKENS_OUT.toLocaleString() },
  { label: "Cost per message", value: usd(COST_PER_MESSAGE) },
  {
    label: "Messages per $0.05",
    value: `~${Math.floor(INCLUDED_CREDIT_USD / COST_PER_MESSAGE)}`,
  },
];

export type AllowanceUsage = {
  inputTokens: number;
  outputTokens: number;
  usedUsd: number;
  includedUsd: number;
};

const SUBJECT = "GitQuery: request more credits";
const MAILTO = `mailto:${ALLOWANCE_CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}`;

/**
 * Shows the included model allowance. Pass `usage` for a signed-in user to show
 * their actual balance; omit it (as on the sign-in page) and only the reference
 * figures are shown.
 */
export function UsageAllowance({
  className,
  style,
  usage,
}: {
  className?: string;
  style?: CSSProperties;
  usage?: AllowanceUsage;
}) {
  const included = usage?.includedUsd ?? INCLUDED_CREDIT_USD;
  const used = usage?.usedUsd ?? 0;
  const remaining = Math.max(0, included - used);
  const pct = included > 0 ? Math.min(100, (used / included) * 100) : 0;
  const exhausted = usage != null && remaining <= 0;

  return (
    <section
      style={style}
      className={cn(
        "rounded-2xl border bg-card/60 p-4 backdrop-blur transition-colors",
        exhausted ? "border-destructive/30" : "border-border/70",
        className,
      )}
      aria-labelledby="usage-allowance-heading"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-lg border",
            exhausted
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-border/60 bg-muted/60 text-primary",
          )}
        >
          <Coins className="size-3.5" />
        </span>
        <h2
          id="usage-allowance-heading"
          className="font-heading text-sm font-medium tracking-tight"
        >
          {usage ? "Your usage" : "Included usage"}
        </h2>
      </div>

      {usage ? (
        <>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <span className="font-mono text-lg tracking-tight">
              {usd(remaining)}
            </span>
            <span className="font-mono text-[0.7rem] text-muted-foreground">
              of {usd(included)} left
            </span>
          </div>

          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-label="Allowance used"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                exhausted ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${Math.max(pct, used > 0 ? 2 : 0)}%` }}
            />
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <dt className="text-muted-foreground">Spent</dt>
            <dd className="text-right font-mono tabular-nums">{usd(used)}</dd>
            <dt className="text-muted-foreground">Tokens in</dt>
            <dd className="text-right font-mono tabular-nums">
              {usage.inputTokens.toLocaleString()}
            </dd>
            <dt className="text-muted-foreground">Tokens out</dt>
            <dd className="text-right font-mono tabular-nums">
              {usage.outputTokens.toLocaleString()}
            </dd>
          </dl>

          {exhausted && (
            <p className="mt-3 rounded-lg border border-destructive/25 bg-destructive/10 px-2.5 py-2 text-xs leading-relaxed text-destructive">
              Allowance used up, so new questions are blocked. Email below to
              request more.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
            Every account includes{" "}
            <span className="font-mono text-foreground">{usd(included)}</span> of
            model usage. Typical figures per message:
          </p>

          <table className="mt-3.5 w-full text-xs">
            <tbody>
              {REFERENCE_ROWS.map((row) => (
                <tr key={row.label} className="border-t border-border/50">
                  <th
                    scope="row"
                    className="py-1.5 text-left font-normal text-muted-foreground"
                  >
                    {row.label}
                  </th>
                  <td className="py-1.5 text-right font-mono text-foreground tabular-nums">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3.5 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
            Averages — actual usage scales with how much code context is
            retrieved and how long the answer runs.
          </p>
        </>
      )}

      <a
        href={MAILTO}
        className="group mt-3 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5 font-mono text-[0.7rem] transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
      >
        <Mail className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
        {ALLOWANCE_CONTACT_EMAIL}
      </a>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">
        Email to request more credits.
      </p>
    </section>
  );
}
