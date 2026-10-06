"use client";

import * as React from "react";

/**
 * Moves a list's rows from where they WERE to where they are.
 *
 * The account rail fills with the whole directory when All accounts is
 * pressed, and the eleven rows already on the strip are in that directory
 * too — they simply land somewhere else in it. Re-rendering the list puts
 * them in their new place instantly, which reads as the column being
 * replaced by a different column that happens to contain some of the same
 * names. What actually happened is that the list grew and the rows you were
 * looking at moved, and that is worth showing: it is the difference between
 * "here is another surface" and "here is the rest of this one".
 *
 * FLIP, in the ordinary way — measure First, let React paint the Last,
 * Invert the delta onto each row and play it to zero. Done with
 * `Element.animate` rather than CSS transitions because the rows are keyed by
 * account and remount freely: a transition needs two committed styles and a
 * frame between them, where a Web Animation takes a start and an end and does
 * not care that the element arrived this tick.
 *
 * Rows the snapshot has never seen are NEW — the thirty accounts that were
 * not on the rail — and they get the entrance instead, staggered down the
 * list so it visibly fills rather than appearing all at once.
 *
 * Vertical only. This list never moves sideways, and animating an axis
 * nothing travels on is how a FLIP ends up fighting a width transition that
 * is already running.
 */
export interface FlipRows {
  /** Give every row this, keyed by whatever makes the row itself. */
  register: (key: string) => (el: HTMLElement | null) => void;
}

/**
 * How far a new row rises as it arrives.
 *
 * 28, not the 10 this shipped with. Ten pixels under a 480ms curve is a row
 * that fades more than it travels — Ashwin read it as appearing rather than
 * arriving, which is fair: at that distance the movement is below the
 * threshold where the eye reads direction, so all that is left is the
 * opacity. The rows have to look like they came from somewhere, and
 * somewhere is below.
 */
const RISE_PX = 28;
/**
 * Between one row and the next, for moves and arrivals alike.
 *
 * ONE counter across the whole list, in visual order, which is the other half
 * of Ashwin's note. The pinned rows used to travel as a block and the rest
 * cascade after them, so the fill read as two events — a group relocating,
 * then a list loading. Giving every row the same per-row delay makes it one
 * movement that starts at the top and runs down: each account follows the one
 * above it, whether it is travelling to a new place or arriving from below.
 */
const STAGGER_MS = 26;
/** Caps the cascade, so a list of forty does not run away with the screen. */
const MAX_STAGGER_MS = 520;

export function useFlipRows(
  /**
   * Bump this when the list's shape changes — the fill flag, the query.
   *
   * The hook measures on every commit; this is what tells it a commit was a
   * MOVE worth playing rather than a re-render that happened to touch the
   * same rows.
   */
  signal: unknown,
  options?: { duration?: number; easing?: string; enabled?: boolean },
): FlipRows {
  /*
   * 480, not the 320 this shipped with.
   *
   * The travel is the whole argument of this arrangement — these are the rows
   * you were already looking at, in a new place — and at 320 it was over
   * before the eye had found the row it was following. A move you are meant to
   * READ is slower than a move you are meant to accept.
   */
  const duration = options?.duration ?? 480;
  const easing = options?.easing ?? "cubic-bezier(0.22, 0.61, 0.36, 1)";
  const enabled = options?.enabled ?? true;

  const rows = React.useRef(new Map<string, HTMLElement>());
  const previous = React.useRef(new Map<string, number>());
  /** Rows measured at least once, so "new" means new to the list. */
  const seen = React.useRef(new Set<string>());
  const lastSignal = React.useRef(signal);

  const register = React.useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) rows.current.set(key, el);
      else rows.current.delete(key);
    },
    [],
  );

  React.useLayoutEffect(() => {
    const moved = lastSignal.current !== signal;
    lastSignal.current = signal;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const next = new Map<string, number>();

    /*
     * Measured first, animated second.
     *
     * Every row's final position has to be known before any of them is given
     * a delay, because the delay IS the row's rank down the column — and the
     * map's own order is registration order, which is whatever React happened
     * to commit. Sorting on the measured top is what makes the cascade run
     * down the list rather than down the DOM.
     */
    const measured: { key: string; el: HTMLElement; top: number }[] = [];
    for (const [key, el] of rows.current) {
      const top = el.getBoundingClientRect().top;
      next.set(key, top);
      measured.push({ key, el, top });
    }
    measured.sort((a, b) => a.top - b.top);

    if (enabled && !reduced && moved) {
      let rank = 0;
      for (const { key, el, top } of measured) {
        const before = previous.current.get(key);
        const delay = Math.min(rank * STAGGER_MS, MAX_STAGGER_MS);

        if (before === undefined) {
          /*
           * New to the list. Only animated when something else is also
           * moving: on the very first render every row is new, and an app
           * that plays forty entrances on load is announcing its own list.
           */
          if (!seen.current.has(key) && previous.current.size > 0) {
            el.animate(
              [
                { transform: `translateY(${RISE_PX}px)`, opacity: 0 },
                { transform: "none", opacity: 1 },
              ],
              { duration, easing, delay, fill: "backwards" },
            );
            rank += 1;
          }
          continue;
        }

        const delta = before - top;
        // Sub-pixel deltas are reflow noise, not movement.
        if (Math.abs(delta) < 0.5) continue;
        el.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: "none" }],
          { duration, easing, delay, fill: "backwards" },
        );
        rank += 1;
      }
    }

    for (const key of rows.current.keys()) seen.current.add(key);
    previous.current = next;
  });

  return { register };
}
