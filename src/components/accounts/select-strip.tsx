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
  showActions = false,
  onActions,
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
  /** The word that starts the mode — see SELECT_LABELS. */
  selectWord: string;
  /**
   * The bulk primary, when this strip is the row carrying the selection.
   *
   * It lives in the panel's title row while the controls are up there. Once
   * they move down here, leaving Actions behind would split the pair: the
   * thing you press and the thing that acts on what you pressed would sit
   * four rows apart, with a search field between them. See SELECT_SPOTS.
   */
  showActions?: boolean;
  onActions?: () => void;
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
        /*
          The box shares a vertical axis with the tick boxes on the rows
          under it, so the column of ticks runs unbroken from this one down —
          a select-all that does not head the column it selects reads as a
          different control. 7 lands it where the dropdown's rows put theirs;
          the rail's directory insets its rows differently and overrides this
          with 8.

          `-mb-[8px]` against the list's own top margin: the strip is a
          caption for the rows under it, not a band between two things, and
          at the 13px it sat at the Edit button read as belonging to the
          search field above rather than to the list below. Pulled to 5.
          Ashwin, Oct 14.
        */
        "mt-[6px] -mb-[8px] flex shrink-0 items-center gap-[8px] pl-[7px]",
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
          {totalCount} sub-accounts
        </span>
      ) : null}
      <span className="flex-1" />
      {/*
        Before Cancel, which is the order the title row uses: one thing to
        do, then the way to stop.
      */}
      {showActions ? (
        <button
          type="button"
          onClick={() => onActions?.()}
          className="motion-tap flex h-[26px] shrink-0 items-center rounded-[7px] bg-[var(--admin-action)] px-[9px] text-[12px] leading-none font-medium text-[var(--admin-action-fg)] hover:bg-[var(--admin-action-hover)] active:scale-[0.98]"
        >
          Actions
        </button>
      ) : null}
      {strip === "left" ? null : button}
    </div>
  );
}
