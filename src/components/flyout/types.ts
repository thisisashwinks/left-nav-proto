import type { LucideIcon } from "lucide-react";

/**
 * Row shapes, matching the four item variants in left-nav.pen.
 *
 *  product  Engage / Convert / Market / Automate / Analyze — 20px icon,
 *           wrapping description, optional "New" badge, items-start.
 *  compact  Favorites — 19px icon, single-line subtitle, items-center.
 *  recent   Recent — 19px icon, single-line subtitle, trailing timestamp.
 *  action   Quick Actions — 20px icon, wrapping description, no badge.
 */
export type FlyoutItemVariant = "product" | "compact" | "recent" | "action";

/**
 * Gradient pill next to a product label. Both tones share the same geometry
 * and gradient angle in the design and differ only in colour ramp.
 */
export type FlyoutBadgeTone = "new" | "beta";

export interface FlyoutBadge {
  label: string;
  tone: FlyoutBadgeTone;
}

/**
 * An L2 sub-place nested under a product row — the flyout's answer to the
 * header-tab dropdowns the current app hides these in (Invoices & Estimates ▾,
 * Products ▾, Client Portal ▾ …). Aug 13 audit, report §2.
 */
export interface FlyoutChildItem {
  id: string;
  label: string;
  /**
   * An L3 row is a destination like any other, and a destination can be
   * pinned — so it needs a glyph the dock and the collapsed rail can show.
   * Without one a pinned L3 would arrive in the dock as an empty tile.
   */
  icon?: LucideIcon;
  badge?: FlyoutBadge;
  /**
   * One level deeper — L4. Needed because `group-flyout.ts` spreads
   * `product.children` in wholesale; without the field the nesting type-checks
   * by widening and then silently never renders.
   */
  children?: FlyoutChildItem[];
  /** Children are tabs on this row's page, so the row never discloses them. */
  tabs?: boolean;
}

export interface FlyoutItem {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  /** Children are tabs on this row's page, so the row never discloses them. */
  tabs?: boolean;
  /** Renders the filled sparkle instead of a Lucide icon. */
  ai?: boolean;
  /** Trailing timestamp, `recent` variant only. */
  time?: string;
  /** Gradient pill next to the label, `product` variant only. */
  badge?: FlyoutBadge;
  /** L2 sub-places. A row with children expands in place — a nested dropdown. */
  children?: FlyoutChildItem[];
}

export type FlyoutEntry =
  | { kind: "item"; item: FlyoutItem }
  | { kind: "label"; id: string; text: string };

/** The "Explore X" / "Manage favorites" / "View all activity" row. */
export interface FlyoutActionRow {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

/**
 * What can sit in the panel's bottom slot, below the flex spacer.
 *
 * `featured`, `shortLoop`, `contextualHelp` and `whatsNew` are all ported from
 * left-nav.pen. `carousel` holds any mix of the other four and pages between
 * them, which is the "single item or a carousel" split.
 */
export type FlyoutBottomSlot =
  | { kind: "action"; row: FlyoutActionRow }
  | {
      kind: "featured";
      icon: LucideIcon;
      title: string;
      body: string;
      linkLabel: string;
    }
  | {
      kind: "shortLoop";
      label: string;
      duration: string;
      title: string;
      caption: string;
    }
  | {
      kind: "contextualHelp";
      label: string;
      questions: string[];
      askLabel: string;
    }
  | {
      kind: "whatsNew";
      pill: string;
      title: string;
      body: string;
      linkLabel: string;
    }
  | { kind: "carousel"; slides: FlyoutBottomSlot[] };

export interface FlyoutConfig {
  id: string;
  title: string;
  variant: FlyoutItemVariant;
  entries: FlyoutEntry[];
  /** Inline row that sits above the spacer, not in the bottom slot. */
  cta?: FlyoutActionRow;
  bottom?: FlyoutBottomSlot;
  /** Recent uses a slightly taller section label than the other panels. */
  spaciousLabels?: boolean;
}
