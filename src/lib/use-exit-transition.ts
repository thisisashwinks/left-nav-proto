"use client";

import * as React from "react";

export type TransitionPhase = "entering" | "exiting";

interface ExitTransition<T> {
  /** Whether to render at all. Stays true through the exit animation. */
  isMounted: boolean;
  /** Drives the enter/exit animation class. */
  phase: TransitionPhase;
  /**
   * The last non-null value. Keeps content on screen while it animates out,
   * after the caller has already moved on to null.
   */
  value: T | null;
}

/**
 * Keeps a value mounted for `exitMs` after it goes null, so an exit animation
 * has something to animate. Swapping directly between two non-null values skips
 * the exit and re-enters, which is what makes handing off from one flyout to
 * another feel immediate rather than closing and reopening.
 *
 * Values are compared by identity, so pass stable objects (module-level config
 * constants, not freshly built literals).
 */
export function useExitTransition<T>(
  current: T | null,
  exitMs: number,
): ExitTransition<T> {
  const [rendered, setRendered] = React.useState<T | null>(current);

  // Adjusted during render rather than in an effect: the new value has to be on
  // screen in the same commit that starts its entrance, or the panel would flash
  // the previous content for a frame.
  if (current !== null && current !== rendered) {
    setRendered(current);
  }

  React.useEffect(() => {
    if (current !== null) return;
    const timer = setTimeout(() => setRendered(null), exitMs);
    return () => clearTimeout(timer);
  }, [current, exitMs]);

  return {
    isMounted: rendered !== null,
    // Fully derived — no state to keep in sync.
    phase: current !== null ? "entering" : "exiting",
    value: current ?? rendered,
  };
}
