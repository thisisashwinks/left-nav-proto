import type { RowMenuOption } from "./row-menu";
import { navTreeFor, type NavLayoutState } from "./grouping";
import { labelForGroup, labelForProduct, iconForGroup, iconForProduct } from "./grouping";

/**
 * The nav's own tree, as options for a menu.
 *
 * Categories are branches you walk into and products are the leaves — the same
 * shape as the nav and as the breadcrumb's menu, which is the whole point: an
 * admin looking for Snippets knows it is under Marketing, and a flat list of
 * ninety rows each ending "— in Marketing" made them read that fact ninety times
 * to find it once.
 *
 * `exclude` drops what is already where the menu is adding to, so the list never
 * offers to put a row where it already is. An emptied branch drops out with it.
 */
export function productTreeOptions(
  state: NavLayoutState,
  exclude: (productId: string) => boolean,
): RowMenuOption[] {
  const { categories, loose } = navTreeFor(state);
  const leaf = (id: string): RowMenuOption => ({
    id,
    label: labelForProduct(state, id),
    icon: iconForProduct(state, id),
  });

  const branches = categories
    .map((c) => ({
      id: c.id,
      label: labelForGroup(state, c.id),
      icon: iconForGroup(state, c.id),
      children: c.productIds.filter((id) => !exclude(id)).map(leaf),
    }))
    .filter((b) => b.children.length > 0);

  // The rows with no category sit at the top level beside the branches, because
  // that is exactly where they sit in the nav.
  return [...branches, ...loose.filter((id) => !exclude(id)).map(leaf)];
}
