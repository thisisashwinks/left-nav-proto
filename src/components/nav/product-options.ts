import {
  FolderInput,
  Image,
  MoveDown,
  MoveUp,
  Pencil,
  Trash2,
} from "lucide-react";
import type { RowMenuAction, RowMenuOption } from "./row-menu";
import { productById } from "./catalogue";
import {
  stockTreeFor,
  UNGROUPED_ID,
  type NavLayoutState,
  type ResolvedGroup,
} from "./grouping";
import { labelForProduct } from "./grouping";

/**
 * The SHIPPED catalogue, as options for a menu.
 *
 * Categories are branches you walk into and products are the leaves — an admin
 * looking for Snippets knows it is under Marketing, and a flat list of ninety
 * rows each ending "— in Marketing" made them read that fact ninety times to
 * find it once.
 *
 * The tree is the catalogue's, not this nav's. It used to be the nav's, which
 * meant the picker reorganised itself around whatever the account had done:
 * pick a healthcare template and adding a product happened under Front desk,
 * Patients and Get booked, in that template's order, under its renames. The one
 * list an admin uses to find something they do NOT have yet was arranged by the
 * things they already do — and it moved every time the nav did, so nothing
 * about using it was learnable.
 *
 * Stock everywhere, product names included: this is a view of what HighLevel
 * ships, and a shelf whose labels shift per tenant is not a shelf. What the
 * account owns still governs what appears — you cannot add what you were not
 * provisioned — and `exclude` drops what is already where the menu is adding
 * to, so the list never offers to put a row where it already is. An emptied
 * branch drops out with it.
 */
export function productTreeOptions(
  state: NavLayoutState,
  exclude: (productId: string) => boolean,
): RowMenuOption[] {
  const { categories, loose } = stockTreeFor(state);
  const leaf = (id: string): RowMenuOption => {
    const shipped = productById(id);
    return {
      id,
      // The shipped name and glyph, not the account's. See the note above.
      label: shipped?.label ?? labelForProduct(state, id),
      ...(shipped?.icon ? { icon: shipped.icon } : {}),
    };
  };

  const branches = categories
    .map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      children: c.productIds.filter((id) => !exclude(id)).map(leaf),
    }))
    .filter((b) => b.children.length > 0);

  // Products the shipped tree files nowhere sit at the top level beside the
  // branches, which is where the nav puts them too.
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
  onPickIcon,
  onMoveToGroup,
  onMoveToTopLevel,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  productId: string;
  currentGroupId: string | null;
  categories: readonly ResolvedGroup[];
  /**
   * Absent where the row may not be renamed.
   *
   * Only one case so far: a lifted row that still has children. Its label is
   * also the title of the panel it opens, so the name has stopped being the
   * row's own — see the note at the call site.
   */
  onRename?: () => void;
  /**
   * Opens the icon picker. Absent for roles that may not change icons.
   *
   * The row's own glyph has opened the picker since it shipped, and the menu
   * did not — so the one gesture people try first worked and the exhaustive
   * list of what a row can do was missing an entry it does have. A menu that
   * omits an action is read as the action not existing.
   */
  onPickIcon?: () => void;
  /**
   * Filing and removal, absent for rows that are neither.
   *
   * A chrome tail row — Desktop and mobile apps — can be renamed, re-iconed,
   * reordered and hidden, because all four are per-row facts the store already
   * holds. It cannot be moved INTO a category (categories hold products, and it
   * is not one) and it cannot be removed from the nav (what puts it there is an
   * axis, so the row would come straight back). Offering either would be a menu
   * entry that quietly does nothing, which is worse than a shorter menu.
   */
  onMoveToGroup?: (groupId: string) => void;
  onMoveToTopLevel?: () => void;
  onRemove?: () => void;
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
    ...(onRename
      ? [
          {
            id: "rename",
            label: "Rename",
            icon: Pencil,
            onSelect: onRename,
          },
        ]
      : []),
    ...(onPickIcon
      ? [{ id: "icon", label: "Change icon", icon: Image, onSelect: onPickIcon }]
      : []),
    { id: "up", label: "Move up", icon: MoveUp, ...(onMoveUp ? { onSelect: onMoveUp } : {}) },
    { id: "down", label: "Move down", icon: MoveDown, ...(onMoveDown ? { onSelect: onMoveDown } : {}) },
    ...(onMoveToGroup && onMoveToTopLevel
      ? [{
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
      onPick: (groupId: string) =>
        groupId === UNGROUPED_ID ? onMoveToTopLevel() : onMoveToGroup(groupId),
        }]
      : []),
    ...(onRemove
      ? [{
      id: "remove",
      label: "Remove from the nav",
      icon: Trash2,
      danger: true,
      onSelect: onRemove,
        }]
      : []),
  ];
}
