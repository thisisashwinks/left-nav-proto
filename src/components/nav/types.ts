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
  /** The product groups and workspace links. Scrolls. */
  entries: NavEntry[];
  /** Last row in the scroll region, not a pinned footer. */
  settings: NavItem;
}
