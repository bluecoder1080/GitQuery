import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type GitQueryIconProps = SVGProps<SVGSVGElement> & {
  variant?: "color" | "mono";
};

/**
 * The GitQuery mark: a terminal prompt inside a rounded tile.
 *
 * The gradient uses a fixed id rather than `useId()` so this can stay a
 * server component. Duplicate ids across instances are harmless here because
 * every instance defines an identical gradient, and browsers resolve to the
 * first definition.
 */
export function GitQueryIcon({
  className,
  variant = "color",
  ...props
}: GitQueryIconProps) {
  const mono = variant === "mono";
  const glyph = mono ? "var(--background)" : "#FFFFFF";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      {!mono && (
        <defs>
          <linearGradient id="gq-tile" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="52%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#0E7490" />
          </linearGradient>
          <linearGradient id="gq-sheen" x1="0" y1="0" x2="0" y2="34">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}

      <rect
        width="64"
        height="64"
        rx="16"
        fill={mono ? "currentColor" : "url(#gq-tile)"}
      />
      {!mono && <rect width="64" height="34" rx="16" fill="url(#gq-sheen)" />}

      {/* chevron */}
      <path
        d="M21 25.5l7.5 6.5L21 38.5"
        stroke={glyph}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* underscore */}
      <path
        d="M34 38.5h10.5"
        stroke={glyph}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* cursor block */}
      <rect
        x="46.5"
        y="35.75"
        width="3.4"
        height="5.5"
        rx="0.9"
        fill={glyph}
        opacity="0.85"
      />
    </svg>
  );
}
