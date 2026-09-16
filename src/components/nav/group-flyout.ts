import { AI_BOTTOM_SLOT, flyouts } from "@/components/flyout/flyout-config";
import type {
  FlyoutChildItem,
  FlyoutConfig,
  FlyoutEntry,
} from "@/components/flyout/types";
import { productById } from "./catalogue";
import { PROPOSED_AI_ID } from "./proposed-ia";
import { liftedChildren } from "./nav-entries";
import type { CatalogueChild } from "./catalogue-types";
import {
  iconForProduct,
  labelForProduct,
  type NavLayoutState,
  type ResolvedGroup,
} from "./grouping";

/**
 * The panel a group opens.
 *
 * Two paths, and the difference matters. The five shipped product groups have
 * hand-authored panels ported from left-nav.pen — section labels, badges,
 * featured blocks, the lot — so those are kept and only their renameable parts
 * are re-resolved. Job groups and custom groups have no authored panel, so one
 * is generated from the catalogue.
 *
 * A generated panel is deliberately plainer than an authored one. It has no
 * featured block and no "New in …" section, because those are editorial
 * decisions someone made per area; inventing them for a group the user just
 * created would be fabricating content.
 */
/**
 * L3 rows, each with a glyph of its own.
 *
 * They inherited the parent's icon for one revision, and a panel of six rows
 * all wearing the Sites glyph told you nothing the heading above them had not
 * already said. An L3 is a destination — it can be pinned, and promoted out to
 * L2 or L1 — so it has to mean something on its own, away from the parent it
 * came from.
 *
 * The catalogue's own icon wins where one is authored; otherwise the label
 * decides. Nothing falls through to the parent.
 */
function childrenWithIcons(
  state: NavLayoutState,
  kids: readonly CatalogueChild[],
): FlyoutChildItem[] {
  return kids.map((kid) => ({
    ...kid,
    /*
     * Resolved through the store, not off the catalogue.
     *
     * `iconForProduct` answers for a child id too: an override first, then the
     * authored glyph, then the one the label earns. Reading `kid.icon` directly
     * skipped the first of those — so picking a new icon for an L3 changed the
     * dock and the launcher, and the panel it was picked IN carried on showing
     * the old one.
     */
    icon: iconForProduct(state, kid.id),
    ...(kid.children ? { children: childrenWithIcons(state, kid.children) } : {}),
  }));
}

export function flyoutForGroup(
  state: NavLayoutState,
  group: ResolvedGroup,
): FlyoutConfig {
  const authored = flyouts[group.id];

  if (authored) {
    return {
      ...authored,
      // Follows the rename: the panel's title is the same label as the row that
      // opened it, or the two disagree the moment anyone edits one.
      title: group.label,
      entries: authored.entries
        // An authored panel was written against the full catalogue, so it will
        // happily offer Memberships to a roofer. Rows naming a product this
        // account is not on come out; rows naming something outside the
        // catalogue (headings, editorial rows) stay.
        .filter(
          (entry) =>
            entry.kind !== "item" ||
            productById(entry.item.id) === undefined ||
            state.enabledProducts.includes(entry.item.id),
        )
        .map(resolveAuthoredEntry(state)),
      ...(authored.cta
        ? { cta: { ...authored.cta, title: `Explore ${group.label}` } }
        : {}),
    };
  }

  return {
    id: group.id,
    title: group.label,
    variant: "product",
    entries: group.productIds.map((id): FlyoutEntry => {
      const product = productById(id);
      return {
        kind: "item",
        item: {
          id,
          label: labelForProduct(state, id),
          icon: iconForProduct(state, id),
          ...(product?.blurb ? { description: product.blurb } : {}),
          // The L2 layer: sub-places render as a nested dropdown on the row.
          ...(product?.children
            ? {
                children: childrenWithIcons(state, product.children),
              }
            : {}),
          ...(product?.tabs ? { tabs: true } : {}),
        },
      };
    }),
    // No synthetic CTA. An "Explore {group}" row on the bottom of every generated
    // panel said nothing the rows above it had not already said, and repeated
    // verbatim across all of them.
    /*
     * One exception to "generated panels carry no editorial": the AI bucket.
     *
     * The rule exists so the nav does not invent a featured block for a group
     * somebody just made — it would be fabricating content. This block is not
     * invented: it is the promo the AI Agents row's own panel carried, moved
     * with the row when the row was removed, onto the bucket that now holds
     * every product it was advertising — the carousel entire, so the help
     * slide comes with it. Keyed off the IA's own id, so a custom group a user
     * happens to name "AI" does not inherit a pitch.
     */
    ...(group.id === PROPOSED_AI_ID ? { bottom: AI_BOTTOM_SLOT } : {}),
  };
}

/**
 * The panel behind a row that was lifted out of a category.
 *
 * A promoted L2 keeps the layer beneath it, so it is a door like any category
 * row — but it is not a group, so `flyoutForGroup` never built it one and the
 * open panel came back null. The row drew a chevron that opened nothing.
 *
 * Generated rather than authored, for the same reason a custom group's panel
 * is: which rows get lifted is the account's decision, made after this file
 * was written.
 *
 * Null when the row has nothing under it, which is most of the tail — the
 * caller falls through to the authored registry.
 */
export function flyoutForLifted(
  state: NavLayoutState,
  id: string,
): FlyoutConfig | null {
  const kids = liftedChildren(id);
  if (kids.length === 0) return null;
  return {
    id,
    // The row's own label, overrides included, so renaming the row renames the
    // panel it opens rather than leaving the two a click apart.
    title: labelForProduct(state, id),
    variant: "product",
    entries: childrenWithIcons(state, kids).map(
      (kid): FlyoutEntry => ({ kind: "item", item: kid }),
    ),
  };
}

/**
 * Re-resolves an authored row's label and icon through the override maps.
 *
 * Without this, renaming Contacts would change the nav and the launcher but not
 * the Engage panel, and the same product would carry two names one click apart.
 */
function resolveAuthoredEntry(state: NavLayoutState) {
  return (entry: FlyoutEntry): FlyoutEntry => {
    if (entry.kind !== "item") return entry;
    // Only rows that name a real product can be overridden — an authored row for
    // something outside the catalogue keeps whatever the design gave it.
    const product = productById(entry.item.id);
    if (!product) return entry;
    return {
      kind: "item",
      item: {
        ...entry.item,
        label: labelForProduct(state, entry.item.id),
        icon: iconForProduct(state, entry.item.id),
        // Authored panels inherit the catalogue's L2 layer too, so the SKU
        // comparison view shows the same nested dropdowns as the job view.
        ...(product.children
          ? {
              children: childrenWithIcons(state, product.children),
            }
          : {}),
      },
    };
  };
}
