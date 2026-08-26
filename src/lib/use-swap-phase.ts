"use client";

import * as React from "react";

/**
 * `leaving` — the outgoing content is still mounted, playing its exit.
 * `waiting` — it is gone and the skeleton holds the space.
 * `idle` — not switching; content is present and plays its entrance.
 */
export type SwapPhase = "idle" | "leaving" | "waiting";

/**
 * Splits a load into an exit, a wait and an entrance.
 *
 * A bare `loading` boolean cannot express a departure. It flips true in the same
 * commit the switch begins, so anything gated on it unmounts in that frame —
 * which is why the nav's rows used to vanish rather than leave, with the exit
 * animation stranded on the skeleton that replaced them. Holding the outgoing
 * content for `leaveMs` first gives that animation something to play on.
 *
 * The wait is deliberately not animated. It runs 2–4 seconds and the motion is
 * punctuation at each end, not a performance stretched across the middle.
 */
export function useSwapPhase(loading: boolean, leaveMs: number): SwapPhase {
  const [phase, setPhase] = React.useState<SwapPhase>("idle");

  /*
   * Adjusted during render, not in an effect — the same shape useExitTransition
   * uses, and for the same reason.
   *
   * An effect lands a frame after the commit that set `loading`, so the outgoing
   * content would paint once WITHOUT its exit class and the animation would start
   * late — a visible hitch at the moment the switch is meant to feel decisive.
   * State rather than a ref because reading a ref during render is not allowed.
   */
  const [wasLoading, setWasLoading] = React.useState(loading);
  if (wasLoading !== loading) {
    setWasLoading(loading);
    // Arriving skips `waiting` outright: the new content is here, so it enters.
    setPhase(loading ? "leaving" : "idle");
  }

  React.useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("waiting"), leaveMs);
    return () => clearTimeout(timer);
  }, [phase, leaveMs]);

  return phase;
}
