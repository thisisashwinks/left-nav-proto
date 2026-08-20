import { type LucideIcon } from "lucide-react";

/**
 * The shapes both information architectures share.
 *
 * Split out of catalogue.ts so the proposed IA (proposed-ia.ts) can author
 * products against the same types without importing the shipped catalogue —
 * catalogue.ts imports *it* to build the shared lookup index, and a cycle
 * between the two would be a runtime hazard rather than a type-only one.
 */

export interface CatalogueGroup {
  id: string;
  /** The name we ship. Overrides never replace it — see the label store. */
  defaultLabel: string;
  icon: LucideIcon;
}

/**
 * A sub-place inside a product: an L3 tab, or an L4 beneath one.
 *
 * `children` makes this recursive. The shipped catalogue is one level deep and
 * the proposed IA as received is too — today's real L4s (Payments ▸ Invoices ▾ ▸
 * Estimates) are promoted to L3 siblings by the restructure. The recursion is
 * here so the first genuine L4 is a data change and not a code change.
 */
export interface CatalogueChild {
  id: string;
  label: string;
  badge?: { label: string; tone: "new" | "beta" };
  children?: CatalogueChild[];
  /**
   * My children are TABS on my page, not places of their own.
   *
   * The distinction the Aug 13 audit kept asking for: "views are not places".
   * A saved contact list, an estimate status, a settings section — those are
   * filters and panels on one page, and giving each a nav row and a breadcrumb
   * segment is how a nav ends up eleven levels wide. Marked here, the nav shows
   * one row, the page grows a tab bar, and the tabs never appear in the flyout,
   * the title menu or the trail.
   */
  tabs?: boolean;
}

/**
 * What every navigable product has, whichever IA files it.
 *
 * The shipped catalogue adds `groupId`/`jobId`/`suiteId` on top of this because
 * its four trees are re-projections of one product set. The proposed IA files
 * membership on the bucket instead, so its products carry none of the three —
 * which is why `productById` resolves to this type rather than to
 * `CatalogueProduct`. Nothing outside `resolveGroups`' shipped-tree branches
 * reads those three keys.
 */
export interface CatalogueEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  /** One line of what it is. Feeds the flyout rows for generated panels. */
  blurb: string;
  children?: CatalogueChild[];
  /** My children are tabs on my page. See `CatalogueChild.tabs`. */
  tabs?: boolean;
}

/**
 * Child id → the product that owns it, the child, and the ancestors above it.
 *
 * `path` is what lets the breadcrumb reconstruct depth from an id alone: the
 * flyout hands `onNavigate` nothing but the id it was clicked with, so the trail
 * has to come from the index rather than from the click.
 */
export interface ChildHit {
  product: CatalogueEntry;
  child: CatalogueChild;
  /** Ancestors from the product down, excluding `child`. Empty at L3. */
  path: readonly CatalogueChild[];
}
