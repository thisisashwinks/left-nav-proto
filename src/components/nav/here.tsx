"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * Where the workspace currently is, as the nav needs to read it.
 *
 * The shell already knows — it is what fills the canvas and what the breadcrumb
 * is built from — but it knew it in one place and the three levels of the nav
 * each needed it. Passing it as context rather than as props keeps a value that
 * every row wants out of six component signatures that are already long, and
 * means an L3 row four calls deep can answer for itself instead of being told.
 *
 * `productId` is the L1 or L2 destination and `childId` the L3 under it, either
 * of which may be null: on Home there is no product, and on a product's own
 * page there is no child.
 */
export interface Here {
  productId: string | null;
  childId: string | null;
}

const HereContext = React.createContext<Here>({
  productId: null,
  childId: null,
});

export function HereProvider({
  value,
  children,
}: {
  value: Here;
  children: React.ReactNode;
}) {
  return <HereContext value={value}>{children}</HereContext>;
}

export function useHere(): Here {
  return React.useContext(HereContext);
}

/**
 * What marking this row means: the page itself, a step on the way to it, or
 * nothing at all.
 */
export type Marking = "here" | "trail" | null;

/**
 * Whether this row should be marked, given the axis.
 *
 * One function so the three levels cannot disagree about what "on the trail"
 * means — which they would, since each of them asks a slightly different
 * question about a slightly different id.
 */
export function useMarking(
  /** True when this row IS the current page. */
  isHere: boolean,
  /** True when the current page sits somewhere beneath this row. */
  isTrail: boolean,
): Marking {
  const { selectedState } = useTheme().effective;
  if (selectedState === "off") return null;
  if (isHere) return "here";
  if (selectedState === "trail" && isTrail) return "trail";
  return null;
}

/**
 * Whether a parent row should already be open because the page is inside it.
 *
 * Beside `useMarking` because it answers the same question from the other side:
 * that one decides whether to PAINT the row you are in, this one whether to
 * OPEN it. Tied to the same axis, so the two are one feature — switch the
 * marking off and the nav stops volunteering where you are, in both senses.
 *
 * Deliberately NOT `useMarking(...) !== null`, which is the obvious way to
 * write it and the wrong one. On the "row only" setting a parent whose CHILD is
 * the current page is not marked — correctly, the child is — but it still has
 * to open, or the page you are on is hidden inside a collapsed row. The gate is
 * the axis being on, not this row being painted.
 */
export function useAutoOpen(isTrail: boolean): boolean {
  const { selectedState } = useTheme().effective;
  return selectedState !== "off" && isTrail;
}

/**
 * What this row should draw, given the marking and the treatment axis.
 *
 * One hook rather than three exported class strings, because the treatments
 * are not independent of each other: `bar` wants an element and no fill,
 * `outline` wants a ring and no element, and `tint` changes the ink as well as
 * the ground. Deciding all of it in one place is what stops the three levels
 * of the nav from each getting a different two-thirds of it right.
 *
 * Called once per row COMPONENT, never in a loop — see the note in left-nav.
 */
export function useHereStyle(marking: Marking): {
  /** Render the leading-edge element. */
  bar: boolean;
  /** Goes on the row. */
  row: string | false;
  /** Goes on the label. */
  ink: string | false;
} {
  const { selectedMark } = useTheme().effective;
  if (marking === null) return { bar: false, row: false, ink: false };
  const here = marking === "here";

  switch (selectedMark) {
    case "fill":
      /*
       * The press neutral, through the token that names the intent.
       *
       * `--nav-selected` is an alias of `--nav-active` (Sep 15): one ground
       * beyond hover rather than two a few points apart. It stays a token of
       * its own because the rows read it for a different REASON — this is
       * "where you are", not "you are pressing" — so the two can diverge
       * again by editing one line, and every surface follows.
       *
       * The trail wears the SAME fill, not a lighter one.
       *
       * It was the hover grey, one step back — which made a selected L3 read
       * as a different kind of thing from the L1 and L2 that lead to it: three
       * rows in a vertical line, one dark and two light, looking like one
       * selection and two rollovers rather than like one path. The trail is
       * the path TO the page; drawn in one colour it reads as a single mark
       * spanning three levels, and the label weight is what still says which
       * end of it you are on.
       */
      return {
        bar: false,
        row: "bg-nav-selected",
        ink: here && "font-semibold text-nav-fg",
      };
    case "tint":
      return {
        bar: false,
        row: here ? "bg-brand-soft" : "bg-brand-soft-2",
        /*
         * The ground carries the accent; the label stays neutral.
         *
         * Brand ink on a brand ground made the row read as a link or a promo —
         * every other label in the nav is grey, and the one coloured word in
         * the column pulled the eye as something to CLICK rather than as the
         * thing already open. Weight says "this row", colour says "this kind
         * of row", and only the first is true here.
         */
        ink: here && "font-semibold text-nav-fg",
      };
    default:
      return { bar: true, row: false, ink: here && "font-semibold text-nav-fg" };
  }
}

/**
 * The mark itself: a bar on the row's leading edge.
 *
 * Deliberately not a fill. A filled row already means "this row's panel is
 * open", and that is a different fact that changes at a different time — the
 * panel follows the pointer, the page does not. Two states sharing one channel
 * is how the nav ends up showing two filled rows that disagree about what
 * filled means.
 *
 * Positioned against the row rather than laid inside it, so it costs the label
 * no width and lines up down the column whatever each row's padding is. The
 * row it hangs off must be `relative`.
 */
export function HereBar({ marking }: { marking: Marking }) {
  if (marking === null) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-1/2 left-0 w-[3px] -translate-y-1/2 rounded-r-[2px] motion-move",
        // The page is a full-height bar in the accent; a step on the way to it
        // is the same bar, shorter and quieter. Same mark, less of it — so the
        // trail reads as a lead-in to the destination rather than as a second
        // kind of thing.
        marking === "here"
          ? "h-[18px] bg-brand opacity-100"
          : "h-[10px] bg-nav-fg-subtle opacity-70",
      )}
    />
  );
}

