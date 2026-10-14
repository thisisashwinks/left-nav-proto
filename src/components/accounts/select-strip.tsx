"use client";

import { cn } from "@/lib/utils";
import type { SelectStrip } from "@/design/theme";
import { SelectBox } from "./select-box";

/**
 * The selection controls, on a strip of their own under the search field.
 *
 * Shared by both account panels. The header dropdown grew this first; the
 * rail's directory now reads the same axes, and a second implementation of
 * three layouts and a two-state left side is exactly the drift that put two
 * different-looking select modes on one shell a week ago.
 *
 * Three states run through one row. At rest the left is a count, the button
 * itself, or nothing — see SELECT_STRIPS. In select mode it is always the box
 * plus a pressable Select all, and once anything is ticked that button gives
 * way to the count. The box stays either way, so selecting everything is
 * still one press away after you have ticked a row by hand.
 */
export function SelectStripRow({
  strip,
  picking,
  allOn,
  mixed,
  onToggleAll,
  toggleAllLabel,
  selectedCount,
  totalCount,
  selectMode,
  onToggleSelect,
  selectWord,
  className,
}: {
  strip: SelectStrip;
  picking: boolean;
  allOn: boolean;
  mixed: boolean;
  onToggleAll: () => void;
  toggleAllLabel: string;
  selectedCount: number;
  totalCount: number;
  selectMode: boolean;
  onToggleSelect: () => void;
  /** "Select" or "Edit account" — see SELECT_LABELS. */
  selectWord: string;
  className?: string;
}) {
  const button = (
    <button
      type="button"
      onClick={onToggleSelect}
      className={cn(
        "motion-tap flex h-[26px] shrink-0 items-center rounded-[7px] px-[9px] text-[12px] leading-none font-medium text-nav-fg",
        "shadow-[inset_0_0_0_1px_var(--fly-border)] hover:bg-nav-hover",
      )}
    >
      {selectMode ? "Cancel" : selectWord}
    </button>
  );

  return (
    <div
      className={cn(
        // The box lines up with the row checkboxes below it, so the column of
        // ticks runs unbroken from this one down.
        "mt-[6px] flex shrink-0 items-center gap-[8px] pl-[9px]",
        className,
      )}
    >
      {strip === "left" ? button : null}
      {picking ? (
        <>
          <SelectBox
            checked={allOn}
            mixed={mixed}
            onClick={onToggleAll}
            label={toggleAllLabel}
          />
          {selectedCount > 0 ? (
            <span className="truncate text-[11.5px] leading-[normal] text-nav-fg-subtle">
              {selectedCount} selected
            </span>
          ) : (
            <button
              type="button"
              onClick={onToggleAll}
              className="motion-tap shrink-0 rounded-[6px] px-[4px] py-[2px] text-[11.5px] leading-[normal] font-medium text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
            >
              Select all
            </button>
          )}
        </>
      ) : strip === "count" ? (
        <span className="truncate text-[11.5px] leading-[normal] text-nav-fg-subtle">
          {totalCount} accounts
        </span>
      ) : null}
      <span className="flex-1" />
      {strip === "left" ? null : button}
    </div>
  );
}
