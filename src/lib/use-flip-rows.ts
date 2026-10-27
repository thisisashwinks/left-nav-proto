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
  options?: {
    duration?: number;
    easing?: string;
    enabled?: boolean;
    /**
     * Run the cascade from the bottom of the list instead of the top.
     *
     * Opening and closing are not the same gesture reversed only in
     * direction — they are reversed in ORDER too. A list filling reads from
     * the top down: the row you were looking at settles first and the rest
     * follow it in. A list emptying reads from the bottom up, because the
     * bottom is where the rows that are leaving were, and a collapse that
     * starts at the top leaves the tail hanging below the surface it is
     * folding into. Ashwin, Oct 6.
     */
    reverse?: boolean;
    /**
     * Reverse the cascade on the commit where THIS goes true → false.
     *
     * `reverse` above is a statement about the arrangement; this is one
     * about a single transition, and the caller cannot make it. Telling a
     * close from an ordinary commit means comparing this render's flag with
     * the last one's, and a component that reads its own ref during render
     * to do that is exactly what the compiler's lint forbids — rightly, since
     * the answer would differ between a render and its replay.
     *
     * So the flag is handed over as a value and the comparison happens here,
     * in the layout effect, where a ref is the correct tool. The rail passes
     * `filled`: true while the directory column is up, false the moment it
     * folds, and false for the whole ordinary life of the strip — which is
     * why "is it false" was never the question. "Did it just become false"
     * is. Ashwin, Oct 19.
     */
    reverseOnFall?: boolean;
    /**
     * A membership this list watches, and how a row that joins it should move.
     *
     * The rail's pinned set is the case. Pinning an account re-sorts the
     * strip, and the strip is normally outside this hook's remit — it only
     * animates while the directory is filled — so the row simply WAS in its
     * new place on the next frame. That is the thing FLIP exists to prevent,
     * and it is worse here than in the fill: the row you pressed is the one
     * that moved.
     *
     * Two things are handed over because the caller cannot work out either
     * during render. Whether the set just changed means comparing this
     * render's keys with the last render's, which is a ref read — the same
     * problem `reverseOnFall` solves the same way. And `style` decides what
     * the joining row does:
     *
     *   travel  it slides from wherever it was into its new slot, and the
     *           rows it displaces slide around it. The whole move is one
     *           continuous thing you can follow with your eye.
     *   rise    it is treated as an ARRIVAL: it rises into the slot the way
     *           a row joining the list does, while the displaced rows still
     *           travel. The press reads as "this is now one of these"
     *           rather than as the row sliding up the column.
     *
     * A change in either direction wakes the pass — unpinning is the same
     * move read backwards, and a row that animates in and vanishes out is a
     * list that only tells you half of what it did. Ashwin, Oct 27.
     */
    arrivals?: {
      keys: readonly string[];
      style: "travel" | "rise";
    };
  },
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
  const reverse = options?.reverse ?? false;
  const fallFlag = options?.reverseOnFall ?? false;
  const arrivalKeys = options?.arrivals?.keys;
  const arrivalStyle = options?.arrivals?.style ?? "travel";

  const rows = React.useRef(new Map<string, HTMLElement>());
  const previous = React.useRef(new Map<string, number>());
  const lastSignal = React.useRef(signal);
  const lastFall = React.useRef(fallFlag);
  const lastArrivals = React.useRef<readonly string[] | undefined>(arrivalKeys);

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

    // True only on the commit where the flag goes true → false. See
    // `reverseOnFall`.
    const fell = !fallFlag && lastFall.current;
    lastFall.current = fallFlag;
    const backwards = reverse || fell;

    /*
     * Who just joined the watched set, and whether it moved at all.
     *
     * `joined` is only consulted under `rise`; `touched` is what lets a pin
     * animate while the hook is otherwise off, so the gesture plays on the
     * resting strip without turning the strip into an animating surface for
     * every other commit. See `arrivals`.
     */
    const before = lastArrivals.current;
    const joined =
      arrivalKeys && before
        ? arrivalKeys.filter((k) => !before.includes(k))
        : [];
    const touched =
      arrivalKeys !== undefined &&
      before !== undefined &&
      (joined.length > 0 || before.some((k) => !arrivalKeys.includes(k)));
    lastArrivals.current = arrivalKeys;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    /*
     * Only transitions measure, and that is load-bearing in both directions.
     *
     * This effect runs after EVERY commit, and the rail re-renders constantly
     * while a cascade is playing — a pointer crossing a tile is enough. Two
     * things went wrong when those commits did the full pass: they finished
     * the animations early, so hovering mid-fill snapped the list into place;
     * and they re-snapshotted from transformed boxes, so the next transition
     * computed its deltas against where the rows looked rather than where
     * they were.
     *
     * So the pass runs on a signal change and on the first commit only. The
     * first is the baseline every later delta is measured from; between
     * transitions nothing that moves these rows happens without the signal
     * changing with it.
     */
    const first = previous.current.size === 0;
    if (!moved && !first) return;

    /*
     * Settle anything still running before a single row is measured.
     *
     * This is the fix for "the second time, the pinned rows do not move", and
     * it is a measurement bug rather than an animation one.
     * `getBoundingClientRect` reports the TRANSFORMED box, so a row caught
     * mid-flight measures where it currently appears rather than where the
     * layout puts it — and every one of those readings went into the snapshot
     * the next transition computes its deltas against. Re-open a list while
     * the close is still playing and the pinned rows are asked to travel from
     * where they already are, which is nowhere.
     *
     * Finishing rather than cancelling: both leave the element at its layout
     * position, and `finish` does it by completing the move instead of
     * dropping it, so a fast re-open reads as the first gesture landing
     * rather than snapping back. It also guarantees the retrigger is clean —
     * no row is ever carrying two animations of the same property.
     */
    if (moved) {
      for (const [, el] of rows.current) {
        for (const animation of el.getAnimations()) animation.finish();
      }
    }

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
    // The rank the delays are counted off, which is the reading order of the
    // movement rather than of the DOM. See `reverse`.
    measured.sort((a, b) => (backwards ? b.top - a.top : a.top - b.top));

    if ((enabled || touched) && !reduced && moved) {
      let rank = 0;
      for (const { key, el, top } of measured) {
        const was = previous.current.get(key);
        const delay = Math.min(rank * STAGGER_MS, MAX_STAGGER_MS);
        // A row that just joined the watched set and is asked to arrive
        // rather than travel — see `arrivals`.
        const arriving = arrivalStyle === "rise" && joined.includes(key);

        if (was === undefined || arriving) {
          /*
           * New to the list. Only animated when something else is also
           * moving: on the very first render every row is new, and an app
           * that plays forty entrances on load is announcing its own list.
           */
          /*
             `previous.current.size` is the whole guard, and it used to be
             ANDed with a set of rows the hook had seen before — which is why
             the second open did not animate. Those rows HAD been seen: they
             arrived on the first fill, left when it closed, and came back to
             a hook that remembered them and therefore refused them an
             entrance. A row returning to a list is arriving, however many
             times it has done it before.

             The size test on its own does the job the set was added for: it
             is empty only on the very first measurement, which is the one
             commit where every row is new and none of them is arriving.
             Ashwin, Oct 6.
          */
          if (previous.current.size > 0 || arriving) {
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

        const delta = was - top;
        // Sub-pixel deltas are reflow noise, not movement.
        if (Math.abs(delta) < 0.5) continue;
        el.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: "none" }],
          { duration, easing, delay, fill: "backwards" },
        );
        rank += 1;
      }
    }

    previous.current = next;
  });

  return { register };
}
