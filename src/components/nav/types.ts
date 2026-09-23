import type { LucideIcon } from "lucide-react";

/**
 * Row density. The Pencil file uses two paddings: 6px for the compact recent
 * rows and 9px for everything else.
 */
export type NavItemDensity = "compact" | "default";

export interface NavItem {
  id: string;
  label: string;
  /** Omitted for the AI row, which uses the filled sparkle instead. */
  icon?: LucideIcon;
  /** Renders the filled Material sparkle and the AI text colour. */
  ai?: boolean;
  /** Trailing chevron, meaning the row opens a flyout. */
  hasFlyout?: boolean;
  /** Key into the flyout registry. Falls back to `id` when omitted. */
  flyoutId?: string;
  /**
   * The row discloses its children in place instead of opening a flyout: the
   * chevron points down when open, and the children follow it in the same flat
   * entry list, marked `child`.
   *
   * Agency scope is built entirely this way (Aug 25). Mutually exclusive with
   * `hasFlyout` — a row cannot both open a panel and open itself.
   */
  expandable?: boolean;
  /** Only meaningful with `expandable`. */
  expanded?: boolean;
  /** A disclosed child, indented one step under its `expandable` parent. */
  child?: boolean;
  /**
   * How many steps in this row is indented, when one is not enough.
   *
   * `child` is the boolean version and stays the whole answer for the agency
   * tree, which is exactly two levels deep. The product tree (see
   * product-tree.tsx) runs L1 → L2 → L3 → L4 inside one column, and four levels
   * cannot be said with a flag. Absent everywhere else, so the rows that shipped
   * before it draw byte-identically: `child` still means depth 1.
   */
  depth?: number;
  /**
   * A number after the label — how many things are behind this row.
   *
   * Only the product tree sets it, and only on a group: a row that discloses in
   * place rather than opening a panel has to say how much is about to arrive,
   * or every chevron is a blind guess between three rows and fifteen. A flyout
   * row needs no such warning — the panel is a fixed surface whatever is in it.
   */
  count?: number;
  /**
   * Hold a trailing column open for a pin this row does not itself draw.
   *
   * The star cannot live INSIDE the row: the row is a `<button>` and so is the
   * star, and nesting the two is invalid HTML that browsers resolve three
   * different ways — which is why `WithPin` hangs it over the row as a sibling
   * instead. An overlay costs no width, so the label would run underneath it
   * unless the row reserves the column in flow, and that is this flag.
   *
   * The chevron's width is reserved with it, on rows that have no chevron, so
   * the pins land on ONE vertical line whether a row discloses or not — the
   * same arrangement `flyout-row.tsx` makes, for the same reason.
   */
  pinSlot?: boolean;
  /**
   * Draw no glyph, and hold no column open for one.
   *
   * The product tree's `treeIcons` axis (Sep 23) asks what a three-level tree
   * should put beside its rows, and three of its four answers take the glyph
   * away from some or all of them.
   *
   * The first build of this flag emptied the column but kept it in flow, on the
   * argument that the indent is measured in icon-plus-gap steps and a level has
   * to read as a column. On the screen that was 26px of blank gutter beside
   * every glyphless name — the widest thing in a 272px nav that says nothing —
   * so the slot now goes with the glyph. The indent itself is untouched, being
   * padding on the row (the `pl-`/`ml-` literals in nav-item-row.tsx) rather
   * than anything to do with what stands in the row: a glyphless child's label
   * simply lands on its parent's instead of a step right of it, and the levels
   * still read as columns because every row at a level drops the slot together.
   *
   * The rails are absolutely positioned off the same steps, so they do not move
   * either. Nor do the pin slot, the count, the caret or the row's height.
   *
   * Absent everywhere outside the tree, so every row that shipped before the
   * axis draws exactly as it did.
   */
  iconHidden?: boolean;
  /**
   * Indent this row by 16px per level instead of a glyph plus a gap.
   *
   * The 26px step is the width of the thing a level indents PAST: its parent's
   * glyph and the gap after it, which is what makes a child's label land on its
   * parent's. Take every glyph away — `treeIcons: "none"` and `"rails"` — and
   * the step is still paying for a column nothing is standing in, so three
   * levels of names start 78px into a 272px nav with nothing between them and
   * the edge. This is that step with the glyph's share removed.
   *
   * Not set for `hide-l3`, where the glyphs above L3 are still there: the pages
   * indent past a real glyph, and a tighter step would put their labels left of
   * the product's own.
   *
   * `rails` draws its guides off the same number — see `RowRails`, which is
   * only ever rendered on rows that carry this flag.
   */
  tightIndent?: boolean;
  /**
   * How many hairline depth guides stand to the left of this row — one per
   * ancestor level, which is the row's own depth.
   *
   * `treeIcons: "rails"` replaces the glyphs with what a file tree uses: a
   * vertical rule in each ancestor's glyph column, so depth is said by
   * position rather than by a column of pictures competing with the names.
   * Drawn per row and abutting, so a run of rows reads as one continuous line
   * — see `RowRails`, which is also where the innermost rail gets its extra
   * step of ink.
   *
   * A count rather than a description of which ancestors are on the current
   * path. The path version was built first and shown to be unobservable: the
   * tree's accordion opens one node per level and auto-opens the branch you
   * are standing in, so the open chain and the current path are the same chain
   * in every state a reader can reach, and every rail would have been the
   * "current" one. Absent unless the axis is on rails.
   */
  rails?: number;
  density?: NavItemDensity;
}

export type NavEntry =
  | { kind: "item"; item: NavItem }
  | { kind: "label"; id: string; text: string }
  | { kind: "divider"; id: string };

export interface PinnedRailItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /**
   * The row's own glyph, when `icon` is its parent's.
   *
   * Set for a pinned row whose name had to be qualified — "Opportunities ›
   * Settings" — where the base becomes the parent's mark and this drops to a
   * badge on its corner. See `glyphFor`. Absent for everything else, which is
   * most rows.
   */
  badge?: LucideIcon;
}

export interface NavConfig {
  /** Optional logo image. When unset, the built-in placeholder wordmark shows. */
  logoSrc?: string;
  logoAlt: string;
  pinned: PinnedRailItem[];
  /**
   * The fixed cluster under the favourites dock — the Recent block, AI Agents,
   * Quick Actions. Never scrolls, so the entry points stay reachable however
   * long the product list gets.
   *
   * Entries rather than plain items because the Recent block is a section label,
   * three rows and a "More" row, as in left-nav.pen.
   */
  fixed: NavEntry[];
  /**
   * The same cluster for the 64px rail, which has no room for a section label or
   * three recent rows — Recent collapses back to one icon that opens the panel.
   */
  railFixed: NavItem[];
  /**
   * The scrolling middle — the product groups and any custom links — is derived
   * from the active grouping mode rather than authored here. See nav-entries.ts.
   */
  /** Last row in the scroll region, not a pinned footer. */
  settings: NavItem;
}
