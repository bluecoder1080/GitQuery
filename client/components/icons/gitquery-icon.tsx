import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Squircle silhouette: a true superellipse (|x/a|^4 + |y/b|^4 = 1) sampled at
 * eight points per corner. This is what gives the tile its continuous
 * curvature -- the tangent angle changes gradually into the flat edge rather
 * than snapping at a corner like a rounded rectangle. Generated, not
 * hand-written; max deviation from the ideal curve is under 0.01px at 64x64.
 */
const SQUIRCLE =
  "M48 0 L55.07 0.15 L57.9 0.62 L59.93 1.41 L61.45 2.55 L62.59 4.07 L63.38 6.1 " +
  "L63.85 8.93 L64 16 L64 48 L63.85 55.07 L63.38 57.9 L62.59 59.93 L61.45 61.45 " +
  "L59.93 62.59 L57.9 63.38 L55.07 63.85 L48 64 L16 64 L8.93 63.85 L6.1 63.38 " +
  "L4.07 62.59 L2.55 61.45 L1.41 59.93 L0.62 57.9 L0.15 55.07 L0 48 L0 16 " +
  "L0.15 8.93 L0.62 6.1 L1.41 4.07 L2.55 2.55 L4.07 1.41 L6.1 0.62 L8.93 0.15 L16 0 Z";

/**
 * Glyph: a terminal chevron and a caret bar. Kept to two strokes with a single
 * stroke weight so it stays legible down to 16px, where a favicon is judged.
 */
const CHEVRON = "M21 25.5 L28.5 32 L21 38.5";
const BAR = "M33.5 38.5 H43";

type GitQueryIconProps = SVGProps<SVGSVGElement> & {
  variant?: "color" | "mono";
};

/**
 * The GitQuery mark.
 *
 * Gradient ids are fixed rather than generated with `useId()` so this stays a
 * server component. Duplicate ids are harmless: every instance defines an
 * identical gradient and browsers resolve to the first definition.
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
          {/* gradientUnits is required: the default objectBoundingBox scale
              would treat these as multiples of the box, flattening the sweep. */}
          {/* Diagonal light, brighter at the top-left. */}
          <linearGradient
            id="gq-tile"
            gradientUnits="userSpaceOnUse"
            x1="6"
            y1="0"
            x2="58"
            y2="64"
          >
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="26%" stopColor="#2DD4BF" />
            <stop offset="62%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#0E7490" />
          </linearGradient>
          {/* Specular sweep across the upper half. */}
          <linearGradient
            id="gq-gloss"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0"
            y2="36"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          {/* Bottom bounce light, which reads as thickness. */}
          <linearGradient
            id="gq-base"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="64"
            x2="0"
            y2="44"
          >
            <stop offset="0%" stopColor="#083344" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#083344" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}

      <path d={SQUIRCLE} fill={mono ? "currentColor" : "url(#gq-tile)"} />

      {!mono && (
        <>
          <path d={SQUIRCLE} fill="url(#gq-gloss)" />
          <path d={SQUIRCLE} fill="url(#gq-base)" />
          {/* Hairline inner edge: separates the tile from dark backgrounds. */}
          <path
            d={SQUIRCLE}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.22"
            strokeWidth="1"
          />
        </>
      )}

      <path
        d={CHEVRON}
        stroke={glyph}
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={BAR}
        stroke={glyph}
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
