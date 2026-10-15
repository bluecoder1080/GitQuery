import { Coins, Mail } from "lucide-react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** Where users ask for a larger allowance. */
export const ALLOWANCE_CONTACT_EMAIL = "work.aditya404@gmail.com";

/** Per-account credit included with a sign-up, in USD. */
export const INCLUDED_CREDIT_USD = 0.05;

/**
 * Reference figures for one exchange, based on Claude Haiku 5.5 list pricing:
 * $0.10 per million input tokens and $0.50 per million output tokens.
 *
 *   500 in  -> 500/1e6 * 0.10 = $0.00005
 *   200 out -> 200/1e6 * 0.50 = $0.00010
 *                     total    = $0.00015
 */
const TOKENS_IN = 500;
const TOKENS_OUT = 200;
const COST_PER_MESSAGE = 0.00015;

const ROWS = [
  { label: "Input tokens", value: TOKENS_IN.toLocaleString() },
  { label: "Output tokens", value: TOKENS_OUT.toLocaleString() },
  { label: "Cost per message", value: `$${COST_PER_MESSAGE.toFixed(5)}` },
  {
    label: `Messages per $${INCLUDED_CREDIT_USD.toFixed(2)}`,
    value: `~${Math.floor(INCLUDED_CREDIT_USD / COST_PER_MESSAGE)}`,
  },
];

const SUBJECT = "GitQuery: request more credits";
const MAILTO = `mailto:${ALLOWANCE_CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}`;

export function UsageAllowance({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      style={style}
      className={cn(
        "rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur",
        className,
      )}
      aria-labelledby="usage-allowance-heading"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg border border-border/60 bg-muted/60">
          <Coins className="size-3.5 text-primary" />
        </span>
        <h2
          id="usage-allowance-heading"
          className="font-heading text-sm font-medium tracking-tight"
        >
          Included usage
        </h2>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
        Every account includes{" "}
        <span className="font-mono text-foreground">
          ${INCLUDED_CREDIT_USD.toFixed(2)}
        </span>{" "}
        of model usage. Typical figures per message:
      </p>

      <table className="mt-3.5 w-full text-xs">
        <tbody>
          {ROWS.map((row) => (
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
        These are averages — actual usage scales with how much code context is
        retrieved and how long the answer runs.
      </p>

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
