"use client";

import * as React from "react";
import type {
  FlyoutChildItem,
  FlyoutConfig,
  FlyoutItem,
} from "@/components/flyout/types";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * "New" belongs to the thing that launched, and only to it.
 *
 * The rule, which the rest of this file exists to enforce: a badge goes on the
 * CHILD-MOST row — an L2 with nothing under it, or the L3 under one that has.
 * Its ancestors get a dot instead. Nobody launches a category; Engage is not
 * new because Meetings is, and a pill on the parent would still be lying about
 * Engage long after Meetings had stopped being new.
 *
 * Two signals, deliberately unlike each other:
 *
 *   The PILL is a claim about the product — editorial, the same for every
 *   account, and it says which kind of claim it is (New, or Beta).
 *
 *   The DOT is a wayfinder. It makes no claim at all; it means "the thing is
 *   further in", and it exists because the flyout it is in is CLOSED. That is
 *   the whole problem this solves — the old nav was flat, so a badge was always
 *   on screen, and this one puts products a level down behind a door.
 *
 * Which is why only New propagates. A dot is a nudge to go and look, and Beta
 * is not a reason to go and look — it is a caveat you want attached to the
 * thing itself, read at the moment you are deciding whether to click it. A
 * parent dotted for Beta would be sending people toward a warning.
 */

/**
 * Whether this node hands its children to the nav as rows of their own.
 *
 * Mirrors the `hasChildren` and `nested` predicates in flyout-row, and has to
 * keep mirroring them: "child-most" means "the deepest row a reader can
 * actually SEE", so anything that stops the disclosure — a `tabs` parent whose
 * children are tabs on its page, the depth cap — makes the node itself the
 * child-most one, and therefore the one that wears the pill.
 */
function discloses(
  node: FlyoutItem | FlyoutChildItem,
  tabsInNav: boolean,
  depth: number,
): boolean {
  return (
    (node.children?.length ?? 0) > 0 &&
    (tabsInNav || !("tabs" in node && node.tabs)) &&
    depth <= MAX_DISCLOSED_DEPTH
  );
}

/**
 * How deep the panels actually go: L2 discloses L3, L3 discloses L4, L4 stops.
 * `MAX_CHILD_DEPTH` in flyout-row says the same thing counting from L3.
 */
const MAX_DISCLOSED_DEPTH = 1;

/**
 * Does anything under here carry a New badge?
 *
 * Recurses rather than checking one level, because the dot has to survive the
 * whole chain: an L4 marked New dots its L3, which dots its L2, which dots the
 * L1 in the sidebar. A reader standing at the top has to be able to follow it
 * down without ever opening a door on a guess.
 */
function branchCarriesNew(
  nodes: readonly FlyoutChildItem[] | undefined,
  tabsInNav: boolean,
  depth: number,
): boolean {
  return (nodes ?? []).some((node) =>
    discloses(node, tabsInNav, depth)
      ? branchCarriesNew(node.children, tabsInNav, depth + 1)
      : node.badge?.tone === "new",
  );
}

/** The same question asked of an L2 row, for the dot the row itself wears. */
export function itemCarriesNew(item: FlyoutItem, tabsInNav: boolean): boolean {
  return discloses(item, tabsInNav, 0)
    ? branchCarriesNew(item.children, tabsInNav, 0)
    : false;
}

/** And of a nested row, for the dot an L3 wears on behalf of an L4. */
export function childCarriesNew(
  child: FlyoutChildItem,
  tabsInNav: boolean,
  depth: number,
): boolean {
  return discloses(child, tabsInNav, depth)
    ? branchCarriesNew(child.children, tabsInNav, depth + 1)
    : false;
}

/**
 * And of a whole panel, for the dot on the L1 row that opens it.
 *
 * Note the asymmetry with `itemCarriesNew`: a panel is dotted by a badged row
 * sitting directly in it, because that row IS one level in — behind the door.
 * An L2 row is dotted only by its children, since its own badge is already
 * visible on the same line as the dot would be.
 */
export function flyoutCarriesNew(
  config: FlyoutConfig,
  tabsInNav: boolean,
): boolean {
  return config.entries.some(
    (entry) =>
      entry.kind === "item" &&
      (discloses(entry.item, tabsInNav, 0)
        ? branchCarriesNew(entry.item.children, tabsInNav, 0)
        : entry.item.badge?.tone === "new"),
  );
}

/**
 * Which L1 rows are dotted, by row id.
 *
 * A context rather than a prop. The answer is derived from panels the shell
 * already builds, and the rows that need it are scattered down a 2,900-line nav
 * and a collapsed rail besides — threading a boolean through every one of those
 * would touch far more code than the feature is, and every new row would have
 * to remember to pass it on.
 */
const NewFlagContext = React.createContext<ReadonlySet<string>>(new Set());

export function NewFlagProvider({
  ids,
  children,
}: {
  ids: ReadonlySet<string>;
  children: React.ReactNode;
}) {
  return (
    <NewFlagContext.Provider value={ids}>{children}</NewFlagContext.Provider>
  );
}

export function useCarriesNew(id: string | undefined): boolean {
  const ids = React.useContext(NewFlagContext);
  return id === undefined ? false : ids.has(id);
}

/**
 * The whole set, for a caller that asks about many rows in one render.
 *
 * The rail draws its tiles from a loop, and `useCarriesNew` inside that loop
 * would be a hook whose call count changes with the number of rows.
 */
export function useNewFlagIds(): ReadonlySet<string> {
  return React.useContext(NewFlagContext);
}

/**
 * Whether the dot is being shown at all.
 *
 * For callers that announce it in text rather than draw it — the rail, whose
 * tiles carry an `aria-label`. Switching the dot off has to switch off what it
 * SAYS as well, or a screen reader goes on reporting new products in a nav that
 * has stopped showing them.
 */
export function useNewDotShown(): boolean {
  return useTheme().newDotPlacement !== "hidden";
}

/**
 * The dot itself.
 *
 * The New badge's own ink, not a blue of its own — the dot and the pill it
 * leads to are one signal seen at two distances, and a reader who follows a dot
 * into a panel should land on something that visibly answers it. It is themed
 * already, which a hardcoded hex would not be.
 *
 * Beside the text, not on the icon. A corner dot on a glyph is the shape every
 * app uses for an unread COUNT, and this is not a count — there is nothing to
 * clear and no number that would mean anything. It would also collide with the
 * corner glyph a qualified pinned row already wears. Beside the label it sits
 * where the pill sits one level down, so following the signal inward is a
 * matter of the same mark growing into words rather than moving.
 */
export function NewDot({ className }: { className?: string }) {
  const { newDotPlacement } = useTheme();
  if (newDotPlacement === "hidden") return null;
  return (
    <>
      {/*
        The visible dot, only where this placement puts it. On `icon` the mark
        is drawn by NewDotIcon around the glyph instead — but the TEXT below
        stays here either way, because the icon sits before the label in the
        DOM and a reader announcing it there says ", new inside Marketing".
        The words belong after the name they qualify, wherever the dot is.
      */}
      {newDotPlacement === "label" ? (
        <span
          aria-hidden="true"
          className={cn(
            "size-[6px] shrink-0 rounded-full bg-fly-badge-fg",
            className,
          )}
        />
      ) : null}
      {/*
        The dot is the only thing saying this, so it has to say it in text too —
        a screen reader gets no colour and no 6px circle. Inside the row's own
        control so it joins the accessible name: "Marketing, new inside".
      */}
      <span className="sr-only">, new inside</span>
    </>
  );
}

/**
 * The same dot, on the icon's top-right corner.
 *
 * Wraps the glyph rather than overlaying the row, so it travels with the icon
 * through every size the nav can be tuned to — `--t-nav-icon` moves the glyph
 * and the dot moves with it. Outside the glyph's box, not over it: a mark
 * sitting on the one stroke that distinguishes two products from each other is
 * how an icon column stops being scannable.
 *
 * This is the treatment the collapsed rail has to use whatever the axis says,
 * because a rail tile has no label to sit beside — so switching the axis to
 * `icon` makes the two faces of the nav agree, and that is a real argument for
 * it beyond taste.
 */
export function NewDotIcon({
  on,
  children,
}: {
  on: boolean;
  children: React.ReactNode;
}) {
  const { newDotPlacement } = useTheme();
  if (!on || newDotPlacement !== "icon") return <>{children}</>;
  return (
    <span className="relative flex shrink-0 items-center justify-center">
      {children}
      <span
        aria-hidden="true"
        className="absolute -top-[2px] -right-[3px] size-[6px] rounded-full bg-fly-badge-fg ring-[1.5px] ring-nav"
      />
      {/* No text here — NewDot carries it, after the label. See the note there. */}
    </span>
  );
}

/**
 * The rail's version: the same dot, hung off a tile that has no label.
 *
 * A wrapper rather than a second dot component, so the two can never drift in
 * size or colour — it is the same signal, and a reader who collapses the nav
 * should not have to learn a new mark.
 *
 * `on` rather than conditional rendering at the call site, because the tile's
 * content is passed as one node into `railButton`; a fragment there would have
 * no box for the dot to position against.
 */
export function RailNewDot({
  on,
  children,
}: {
  on: boolean;
  children: React.ReactNode;
}) {
  const { newDotPlacement } = useTheme();
  /*
    `label` and `icon` both land here, because a rail tile has no label for the
    first of them to mean anything. Only `hidden` reaches the rail as itself —
    switching the dot off has to switch it off everywhere, or the signal
    survives in the one place nobody thought to check.
  */
  if (!on || newDotPlacement === "hidden") return <>{children}</>;
  return (
    <span className="relative flex items-center justify-center">
      {children}
      <span
        aria-hidden="true"
        className="absolute -top-[1px] -right-[3px] size-[6px] rounded-full bg-fly-badge-fg ring-[1.5px] ring-nav"
      />
      {/*
        No text here: a rail tile carries an `aria-label`, which REPLACES its
        contents for a screen reader, so anything written inside would be
        silently dropped. The rail appends the words to that label instead.
      */}
    </span>
  );
}
