import { FolderInput, MoveDown, MoveUp, Pencil, Trash2 } from "lucide-react";
import type { RowMenuAction, RowMenuOption } from "./row-menu";
import {
  navTreeFor,
  UNGROUPED_ID,
  type NavLayoutState,
  type ResolvedGroup,
} from "./grouping";
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

/**
 * The kebab menu for a product row, wherever the row is.
 *
 * One builder for both levels. A product inside a category's panel and the same
 * product sitting at the nav's top level are the same object in two places, and
 * they were offering two different sets of controls: the panel gave a kebab with
 * rename / move / remove, while a top-level row fell back to the bare pencil the
 * pre-edit-mode nav used — so the trailing cluster changed shape depending on
 * where the row happened to live.
 *
 * `currentGroupId` is null for a row at top level, which is also what marks
 * "Top level" as the entry you are already on.
 */
export function productMenuActions({
  productId,
  currentGroupId,
  categories,
  onRename,
  onMoveToGroup,
  onMoveToTopLevel,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  productId: string;
  currentGroupId: string | null;
  categories: readonly ResolvedGroup[];
  onRename: () => void;
  onMoveToGroup: (groupId: string) => void;
  onMoveToTopLevel: () => void;
  onRemove: () => void;
  /**
   * Reorder within the row's own list. Omitted at the ends, exactly as the
   * category rows do it — an offered "Move up" that does nothing is worse than
   * a greyed one that shows the limit.
   *
   * Drag was the only way to do this until the customizer's nudge buttons were
   * removed with it (Aug 25). Those buttons were the keyboard, 200%-zoom and
   * trackpad-averse path; the menu is where that path lives now.
   */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}): RowMenuAction[] {
  void productId;
  return [
    { id: "rename", label: "Rename", icon: Pencil, onSelect: onRename },
    { id: "up", label: "Move up", icon: MoveUp, ...(onMoveUp ? { onSelect: onMoveUp } : {}) },
    { id: "down", label: "Move down", icon: MoveDown, ...(onMoveDown ? { onSelect: onMoveDown } : {}) },
    {
      id: "move",
      label: "Move to",
      icon: FolderInput,
      options: [
        ...categories.map((g) => ({
          id: g.id,
          label: g.label,
          icon: g.icon,
          current: g.id === currentGroupId,
        })),
        // Out of every category, but still in the nav. Offered here because a
        // menu is the only way to reach it without a drag.
        {
          id: UNGROUPED_ID,
          label: "Top level",
          current: currentGroupId === null,
        },
      ],
      onPick: (groupId) =>
        groupId === UNGROUPED_ID ? onMoveToTopLevel() : onMoveToGroup(groupId),
    },
    {
      id: "remove",
      label: "Remove from the nav",
      icon: Trash2,
      danger: true,
      onSelect: onRemove,
    },
  ];
}
