"use client";

import * as React from "react";

/**
 * How long a row must be held before it takes over the panel beside it.
 *
 * Two numbers because there are two intentions and they want opposite things.
 * Crossing rows on the way to an open panel should cost nothing and change
 * nothing, so that dwell has to outlast the crossing — a 30–36px row taken
 * diagonally at a normal hand speed is comfortably over 200ms. Browsing the
 * list wants the panel to keep up, so that one is just long enough to stop a
 * flicker.
 */
export const TOWARD_PANEL_DWELL_MS = 340;
export const BROWSING_DWELL_MS = 140;

/**
 * The dwell that protects a diagonal.
 *
 * Every surface in this nav that opens a panel to its right has the same
 * problem, at every level: the panel is to the right, the rows are in a column,
 * and nobody reaches the panel by travelling perfectly horizontally. They cut
 * the corner — and on the way they pass over two or three siblings, each of
 * which is a hover, each of which used to rewrite the thing they were reaching
 * for. By the time the pointer arrives the panel is showing something else and
 * the last few hundred milliseconds are unexplainable.
 *
 * So a swap is never immediate: the row is held for a beat, and arriving at the
 * panel cancels the hold. Settling deliberately on a row still switches, which
 * is the behaviour worth keeping — the dwell only removes the switches nobody
 * asked for.
 *
 * Shared rather than reimplemented per level, because L1 → L2 and L2 → L3 are
 * the same gesture at different coordinates, and two copies of a timing rule
 * drift into two behaviours nobody chose.
 */
export function useHoverDwell(): {
  /** Hold `key` for the dwell, then run `commit`. Re-entry does not restart. */
  defer: (key: string, commit: () => void) => void;
  /** Drop any pending switch — what arriving at the panel does. */
  cancel: () => void;
} {
  const pending = React.useRef<{
    key: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  /**
   * The pointer's recent travel, sampled globally.
   *
   * A rolling average, not the last event's delta: pointer events fire every
   * few milliseconds and a hand moving in a straight line still produces the
   * odd sideways sample. Deciding "is this person heading for the panel" off
   * one of those meant the answer flipped between frames, so a deliberate
   * diagonal could land on whichever reading happened to be current when it
   * crossed a sibling.
   */
  const motion = React.useRef({ x: 0, y: 0, dx: 0, dy: 0 });

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const m = motion.current;
      const rawX = e.clientX - m.x;
      const rawY = e.clientY - m.y;
      m.dx = m.dx * 0.6 + rawX * 0.4;
      m.dy = m.dy * 0.6 + rawY * 0.4;
      m.x = e.clientX;
      m.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const cancel = React.useCallback(() => {
    if (pending.current === null) return;
    clearTimeout(pending.current.timer);
    pending.current = null;
  }, []);

  React.useEffect(() => cancel, [cancel]);

  const defer = React.useCallback(
    (key: string, commit: () => void) => {
      /*
       * Re-entering the row already pending is a no-op, not a restart.
       *
       * A hand crossing a row wobbles over its boundary, and restarting the
       * clock on each crossing would let a slow diagonal hold one row open
       * indefinitely — the opposite failure to the one this exists to fix.
       */
      if (pending.current?.key === key) return;
      cancel();
      /*
       * Any rightward drift counts as heading for the panel.
       *
       * The panel is a slab running most of the nav's height, so it is not off
       * to the right at one angle — it is off to the right at every angle. A
       * pointer travelling down and right is as plausibly aimed at it as one
       * travelling straight across, and requiring a flat move punished exactly
       * the gesture people make.
       *
       * Pure vertical browsing keeps `dx` near zero, stays under the threshold,
       * and gets the short dwell it wants.
       */
      const towardPanel = motion.current.dx > 0.6;
      pending.current = {
        key,
        timer: setTimeout(
          () => {
            pending.current = null;
            commit();
          },
          towardPanel ? TOWARD_PANEL_DWELL_MS : BROWSING_DWELL_MS,
        ),
      };
    },
    [cancel],
  );

  return { defer, cancel };
}
