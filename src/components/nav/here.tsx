"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { NAV_SELECTED_WEIGHT_CLASS } from "@/design/theme";
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
 * Which level of the nav a row belongs to.
 *
 * Only the middle one is ever tested, and only by `ends` — but naming all
 * three is what makes a call site say what it is rather than pass a boolean
 * called `isL2` that the next level along would have to negate.
 */
export type NavLevel = "l1" | "l2" | "l3";

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
  /**
   * Which level this row is, for the one axis value that cares.
   *
   * Optional, and absent means "not an L2": the rail and the nav's flat rows
   * are ends of the trail rather than the middle of it, so leaving it out
   * gives them the behaviour they already had.
   */
  level?: NavLevel,
): Marking {
  const { selectedState } = useTheme().effective;
  if (selectedState === "off") return null;
  /*
   * The exact row is marked under every value but `off`, `ends` included.
   *
   * That is the whole of the "but what if the product has no pages" case: a
   * product with nothing under it IS the page when you are on it, so it comes
   * through here rather than through the trail clause below. Same for a
   * product whose own page is open beneath its children.
   */
  if (isHere) return "here";
  if (!isTrail) return null;
  if (selectedState === "trail") return "trail";
  // `ends`: the path is stated by the category and the page, and the product
  // between them is left unpainted. See SELECTED_STATES.
  if (selectedState === "ends") return level === "l2" ? null : "trail";
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
  /** Goes on the row's leading glyph. */
  glyph: string | false;
} {
  const { selectedMark, navSelectedWeight, navSelectedIcon } =
    useTheme().effective;
  if (marking === null)
    return { bar: false, row: false, ink: false, glyph: false };
  const here = marking === "here";
  /*
   * The two axes that cut across every mark. See NAV_SELECTED_BOLD_DEFAULT
   * and NAV_SELECTED_ICON_DEFAULT.
   *
   * Resolved once, here, rather than inside each branch below: they are a
   * property of being the current row, not of which treatment the row is
   * wearing, and a `bar` row and a `fill` row that disagreed about whether
   * the label is bold would be two answers to one question.
   *
   * EVERY marked row, trail included (Ashwin, Oct 6). The first cut gave
   * both to the leaf alone, on the argument that weight and size are how a
   * destination separates itself from the steps leading to it. That reads
   * well and describes an arrangement this nav does not have: in the
   * default flyout the L1 is published as `trail` and never as `here` — see
   * `markFor`, which passes `isHere: false` for it — because the page
   * itself is behind a shut panel. So "leaf only" meant the one row visible
   * in the column got neither treatment, and the options looked broken on
   * the level they were asked for.
   *
   * What separates the trail from the leaf stays what it always was: the
   * fill, or the bar's own length.
   */
  const bold = NAV_SELECTED_WEIGHT_CLASS[navSelectedWeight];
  /*
   * 18px, through the icon's own variable rather than a transform.
   *
   * `--t-nav-icon` is what the inline width and height already read, so
   * overriding it on the element resizes the glyph properly — where a
   * `scale-` class would both thicken the stroke and collide with the
   * hover scale that is already on this icon.
   *
   * Three variables because three surfaces size their glyphs differently:
   * the nav's rows read `--t-nav-icon`, the flyout's read `--t-fly-icon`,
   * and an L3 child had no variable at all until this, so it reads
   * `--here-glyph`. Declaring all three costs nothing where only one is
   * read, and it means a level cannot be left behind by whoever adds the
   * next surface.
   */
  const bigger = navSelectedIcon
    ? "[--t-nav-icon:18px] [--t-fly-icon:18px] [--here-glyph:18px]"
    : false;

  switch (selectedMark) {
    case "fill":
    case "fillBar":
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
        // The only difference between the two cases: `fillBar` keeps the
        // leading rule as well. See SELECTED_MARKS.
        bar: selectedMark === "fillBar",
        /*
          The ring and the lift ride with the fill, and both are invisible
          unless the nav is on the plane — see --nav-selected-ring and
          --nav-selected-shadow. One class rather than a conditional, so every
          surface that marks a row gets the same treatment without knowing
          which arrangement it is in, and the two are independent axes: edge,
          lift, both, or neither.

          One box-shadow list, because there is only one property. The inset
          ring has to come first — shadows paint first-on-top, and a drop
          shadow listed ahead of an inset one is drawn over the row's own
          edge.
        */
        /*
          And the row re-declares the nav's three ink tokens from the
          selected set — see --nav-sel-fg. On the ROW rather than on anything
          above it, which is the only place that works: a custom property
          declared on a closer element wins outright, so everything the row
          contains — label, icon, chevron, count, trail — flips with the fill
          without a single one of them knowing a variant exists. Identical to
          the ambient ink unless a dark variant is on.
        */
        row: "bg-nav-selected shadow-[inset_0_0_0_1px_var(--nav-selected-ring),var(--nav-selected-shadow)] [--nav-fg:var(--nav-sel-fg)] [--nav-fg-muted:var(--nav-sel-fg-muted)] [--nav-fg-subtle:var(--nav-sel-fg-subtle)]",
        /*
         * No weight change. The ground already says which row this is, and
         * bolding the label as well says it twice — on a selected L3 the two
         * signals stack and the row reads as a heading rather than as the page
         * you are on. Colour still separates the lit row from its trail.
         */
        ink: cn(here && "text-nav-fg", bold),
        glyph: bigger,
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
        ink: cn(here && "text-nav-fg", bold),
        glyph: bigger,
      };
    default:
      /*
        The bar's own mark has always bolded the current row — with no
        ground under it, weight is the only thing left to say "this one".
        The axis can only add to that, never take it away.
      */
      return {
        bar: true,
        row: false,
        // The bar has no ground, so weight is the only thing left to say
        // "this one" — it takes the axis like every other mark rather than
        // the semibold it used to hard-code.
        ink: cn(here && "text-nav-fg", bold),
        glyph: bigger,
      };
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
        /*
          One colour for both, from --nav-sel-bar: the platform blue, white
          on the three dark fills. The trail used to be grey, which made it
          a different KIND of mark from the one it leads to rather than less
          of the same one.

          At full strength, both. Fading the trail to 55% was the first cut
          and it put the thing back where it started: #155eef at 55% on a
          white row is a pale blue, so the lead-in looked like a washed-out
          colour rather than a shorter mark, which is exactly the "that is
          not the accent" the grey version drew. Height is the only
          difference now — 24px for the page, 14px for a step on the way to
          it — and one length against another is a comparison the eye makes
          without having to name the colour.

          Taller too, Oct 5. 18px on a 38px row left the rule looking like a
          tick beside the icon rather than a marker down the row's edge, and
          it was sized for standing alone on white rather than competing
          with a painted fill. 24 is most of the icon's own column without
          reaching the row's corners, where a rule that met them would read
          as a border.
        */
        "bg-[var(--nav-sel-bar)]",
        marking === "here" ? "h-[24px]" : "h-[14px]",
      )}
    />
  );
}

