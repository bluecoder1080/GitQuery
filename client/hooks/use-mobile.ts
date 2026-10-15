import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/** Always false on the server; the viewport is only knowable on the client. */
function getServerSnapshot() {
  return false;
}

/**
 * Tracks whether the viewport is below the mobile breakpoint.
 *
 * Uses useSyncExternalStore so the media query is treated as the external
 * source of truth it is, rather than mirroring it into state from an effect.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
