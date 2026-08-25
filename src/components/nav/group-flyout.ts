import { flyouts } from "@/components/flyout/flyout-config";
import type {
  FlyoutChildItem,
  FlyoutConfig,
  FlyoutEntry,
} from "@/components/flyout/types";
import { productById } from "./catalogue";
import type { CatalogueChild } from "./catalogue-types";
import { iconForChildLabel } from "./l3-icons";
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
  kids: readonly CatalogueChild[],
): FlyoutChildItem[] {
  return kids.map((kid) => ({
    ...kid,
    icon: kid.icon ?? iconForChildLabel(kid.label),
    ...(kid.children ? { children: childrenWithIcons(kid.children) } : {}),
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
                children: childrenWithIcons(product.children),
              }
            : {}),
          ...(product?.tabs ? { tabs: true } : {}),
        },
      };
    }),
    // No synthetic CTA. An "Explore {group}" row on the bottom of every generated
    // panel said nothing the rows above it had not already said, and repeated
    // verbatim across all of them.
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
              children: childrenWithIcons(product.children),
            }
          : {}),
      },
    };
  };
}
