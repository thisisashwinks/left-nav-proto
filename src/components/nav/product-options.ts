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
 * The same shelf, one level deeper.
 *
 * `productTreeOptions` stops at the product because the menus that call it are
 * adding a product — a row in a category, or a row at top level. A picker that
 * is choosing a DESTINATION has a different floor: a lot of what an admin wants
 * to put in front of people is an L3 (Payments ▸ Invoices, Contacts ▸ Smart
 * lists), and a two-level picker made those unreachable, so the only way to
 * surface one was to add its whole parent and then prune.
 *
 * Kept as a separate export rather than a flag on the old one: its callers add
 * products and nothing else, and a tree that silently grew a third level under
 * them would start offering rows their stores cannot hold.
 */
export function productTreeOptionsDeep(
  state: NavLayoutState,
  exclude: (id: string) => boolean,
): RowMenuOption[] {
  const { categories, loose } = stockTreeFor(state);

  const leaf = (id: string): RowMenuOption => {
    const shipped = productById(id);
    const row: RowMenuOption = {
      id,
      // The shipped name and glyph, not the account's — see productTreeOptions.
      label: shipped?.label ?? labelForProduct(state, id),
      ...(shipped?.icon ? { icon: shipped.icon } : {}),
    };

    // `tabs: true` on an entry says its children are TABS ON ITS PAGE, not
    // places — a saved contact list, an estimate status, a settings section.
    // They have no address of their own to send anyone to, so a picker that
    // offered them would be filing a view into the nav as a destination, which
    // is the exact thing "views are not places" exists to stop. The product
    // stays a leaf and its tabs stay on its page.
    const children = (shipped?.tabs ? [] : (shipped?.children ?? []))
      .filter((c) => !exclude(c.id))
      .map((c) => ({
        id: c.id,
        label: c.label,
        ...(c.icon ? { icon: c.icon } : {}),
      }));

    // Only attach `children` when there are some. RowMenu reads the key's
    // presence as "this opens a list" and draws the submenu arrow for it, so an
    // empty array advertises a level that is not there and walks into nothing.
    return children.length > 0 ? { ...row, children } : row;
  };

  const branches = categories
    .map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      children: c.productIds.filter((id) => !exclude(id)).map(leaf),
    }))
    .filter((b) => b.children.length > 0);

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
/**
 * Every page in the catalogue, as one flat list carrying its trail.
 *
 * The other shape of the same question — see ADD_MENU_SHAPES. A tree is the
 * right way to BROWSE and the wrong way to search: a reader who already knows
 * they want Inbox has to remember it lives under Conversations, which lives
 * under CRM, before the menu will show it to them. Flattened, the name is
 * enough and the trail is there to tell two Settings apart.
 *
 * Pages only, no products. The two entries above already offer those, and a
 * list that mixed them would be the whole catalogue in one column with no way
 * to tell which rows open panels.
 */
export function pageOptions(
  state: NavLayoutState,
  exclude: (id: string) => boolean,
): RowMenuOption[] {
  const { categories, loose } = stockTreeFor(state);
  const productIds = [
    ...categories.flatMap((c) => c.productIds),
    ...loose,
  ];
  const out: RowMenuOption[] = [];
  for (const productId of productIds) {
    const shipped = productById(productId);
    // Views are not places: a `tabs` parent's children live ON its page.
    if (!shipped || shipped.tabs) continue;
    for (const child of shipped.children ?? []) {
      if (exclude(child.id)) continue;
      out.push({
        id: child.id,
        ...(child.icon ? { icon: child.icon } : {}),
        /*
          The trail in the LABEL, since a menu option has nowhere else to put
          it — and it is what tells two "Settings" apart. The same "Parent ›
          Row" shape `labelForProduct` uses when it qualifies a lifted row, so
          the two read as one convention rather than two.
        */
        label: `${labelForProduct(state, productId)} › ${child.label}`,
      });
    }
  }
  return out;
}

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
   * A chrome tail row — Desktop & mobile apps — can be renamed, re-iconed,
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
