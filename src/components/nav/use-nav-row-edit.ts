"use client";

import * as React from "react";
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
 * Editing is gated on permission, not on a mode. It used to sit behind an
 * "edit mode" switch, which meant the affordance the Aug 18 review actually asked
 * for — hover a row, get a pencil, rename it there — was invisible unless someone
 * had found a toggle on a prototype panel first. `state.editing` survives as a
 * forcing switch that pins every pencil open, which is useful for photographing
 * the affordance and for nothing else.
 */
export function useNavRowEdit(picker: IconPickerHandle) {
  const layout = useNavLayout();
  const { state, groups, can } = layout;
  const [renamingId, setRenamingId] = React.useState<string | null>(null);

  const editFor = (itemId: string): NavRowEdit | null => {
    // Renaming is the personalization layer, so every role has it — but ask
    // rather than assume, so a role that loses it loses the pencil with it.
    if (!can.renameForSelf) return null;
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
      pinned: state.editing,
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
          selected: nameForIcon(
            groups.some((g) => g.id === target)
              ? layout.iconFor(target)
              : layout.productIconFor(target),
          ),
          onPick: (iconName: string) => layout.setIcon(target, iconName),
          ...(layout.hasIconOverride(target)
            ? { onReset: () => layout.resetIcon(target) }
            : {}),
          onClose: picker.close,
        }
      : null;

  return { state, groups, can, editFor, pickerProps };
}
