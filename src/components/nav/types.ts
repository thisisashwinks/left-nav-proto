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
