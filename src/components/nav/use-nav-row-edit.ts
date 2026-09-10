"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { nameForIcon } from "./icon-catalogue";
import type { IconPicker, useIconPicker } from "./icon-picker";
import { editTargetFor } from "./nav-entries";
import type { NavRowEdit } from "./nav-item-row";
import { useNavLayout } from "./nav-layout-provider";

type IconPickerHandle = ReturnType<typeof useIconPicker>;
type IconPickerProps = React.ComponentProps<typeof IconPicker>;

/**
 * Turns the layout store into per-row editing handlers.
 *
 * Used by the expanded nav, which is the only face with a label to rename. The
 * rail derives the same rows and shows the result.
 *
 * Which row is being renamed is local state, not store state: it is a transient
 * UI mode, and putting it in the store would mean a rename started in the nav
 * appeared to also be in progress in the launcher.
 *
 * Editing is gated on permission AND on the mode.
 *
 * It briefly sat on permission alone, so that hovering any row gave you a pencil
 * without having to find a switch first. Reviewed in the nav, that read as a nav
 * you maintain rather than a nav you use: ninety rows each offering to be
 * renamed, on every hover, forever. So the affordances are back behind the mode —
 * but the mode's own way in is now a control in the nav itself rather than a
 * toggle on a prototype panel, which is what made the old arrangement
 * undiscoverable.
 */
export function useNavRowEdit(
  picker: IconPickerHandle,
  /**
   * The shipped glyph for a row the catalogue does not know.
   *
   * Optional, and only the expanded nav passes one: it is the face that draws
   * those rows and therefore the only thing that knows what they look like
   * before an override exists.
   */
  chromeIcon?: (id: string) => LucideIcon | null,
) {
  const layout = useNavLayout();
  const { state, groups, can } = layout;
  const [renamingId, setRenamingId] = React.useState<string | null>(null);

  const editFor = (itemId: string): NavRowEdit | null => {
    // Renaming is the personalization layer, so every role has it — but ask
    // rather than assume, so a role that loses it loses the pencil with it.
    if (!can.renameForSelf) return null;
    // Outside the mode a row is a destination and nothing else. No pencil, no
    // kebab, no hover affordance of any kind.
    if (!state.editing) return null;
    const target = editTargetFor(state, groups, itemId);
    // Chrome — Recent, AI Agents, Settings, custom links. Those are
    // product decisions, not the account's, so they are not renameable here.
    if (!target) return null;

    const { kind, id } = target;
    const isGroup = kind === "group";
    const renamed = isGroup
      ? layout.isRenamed(id)
      : layout.isProductRenamed(id);

    return {
      renaming: renamingId === itemId,
      pinned: true,
      /*
        Products only, and only where the base label is a NAME.

        `productBaseLabelFor` falls back to the raw id for anything the
        catalogue does not know — which is exactly the chrome rows that edit
        like products (see CHROME_TAIL_IDS). Handing the field "white-label-
        apps" to start from would make the first rename a rename to a slug, so
        those rows fall through to the row's own label instead, which is what
        NavItemRow uses when no seed is given.
      */
      ...(isGroup || layout.productBaseLabelFor(id) === id
        ? {}
        : { renameValue: layout.productBaseLabelFor(id) }),
      onStartRename: () => setRenamingId(itemId),
      onCommitRename: (next) => {
        if (isGroup) layout.setLabel(id, next);
        else layout.setProductLabel(id, next);
        setRenamingId(null);
      },
      onCancelRename: () => setRenamingId(null),
      // Renames land at account scope for a user, and at whichever scope is
      // selected above that. Icons are governance, so they follow regroup.
      ...(can.regroup
        ? { onPickIcon: (trigger: HTMLElement) => picker.open(id, trigger) }
        : {}),
      ...(renamed
        ? {
            onReset: () =>
              isGroup ? layout.resetLabel(id) : layout.resetProductLabel(id),
          }
        : {}),
    };
  };

  const target = picker.targetId;
  const pickerProps: IconPickerProps | null =
    target && picker.anchor
      ? {
          anchor: picker.anchor,
          // The effective icon, not just an override, so the shipped glyph reads
          // as selected before anyone has changed anything.
          /*
            The effective icon, not just an override, so the shipped glyph reads
            as selected before anyone has changed anything.

            `chromeIcon` is the same rule one level out: a tail row that names
            no product resolves through the catalogue to a folder, which would
            show Folder ticked under a row drawing a phone. The face knows what
            it drew, so it says.
          */
          selected: nameForIcon(
            groups.some((g) => g.id === target)
              ? layout.iconFor(target)
              : layout.hasIconOverride(target) || !chromeIcon?.(target)
                ? layout.productIconFor(target)
                : chromeIcon(target)!,
          ),
          onPick: (iconName: string) => layout.setIcon(target, iconName),
          ...(layout.hasIconOverride(target)
            ? { onReset: () => layout.resetIcon(target) }
            : {}),
          onClose: picker.close,
        }
      : null;

  return {
    state,
    groups,
    can,
    editFor,
    pickerProps,
    /**
     * Opens a row's rename field from outside a row.
     *
     * The nav's Add-a-category action needs it: the new row has to mount already
     * asking for its name, and the only thing that knows the row exists is the
     * commit that just created it.
     */
    startRename: setRenamingId,
  };
}
