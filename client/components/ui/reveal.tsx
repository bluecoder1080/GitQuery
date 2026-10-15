"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  /** Stagger offset in milliseconds. */
  delay?: number;
  className?: string;
  /** Fraction of the element that must be visible before animating in. */
  threshold?: number;
};

/**
 * Fades and lifts its children into view once they enter the viewport.
 *
 * The observer disconnects after the first intersection, so elements animate
 * once rather than replaying on every scroll. The hidden state and the
 * transition both live in globals.css under `[data-reveal]`, which means
 * `prefers-reduced-motion` and no-JS visitors see the content immediately.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  threshold = 0.15,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Fallback for environments without IntersectionObserver. Deferred to a
    // frame callback rather than a direct setState so the effect body stays
    // free of cascading renders.
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      data-reveal=""
      className={cn(visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
