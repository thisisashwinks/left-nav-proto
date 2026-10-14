"use client";

import type * as React from "react";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectBox } from "./select-box";

/**
 * The header both account panels wear.
 *
 * The All accounts directory worked this row out over several passes — a
 * title that becomes the count, a select-all box that says what it will
 * reach, Actions and Cancel as the standard pair, and an exit that steps
 * aside while a selection is running. The header dropdown then grew a
 * selection of its own and started down the same path from scratch, which is
 * how a shell ends up with two headers that do one job and disagree about
 * the details. Ashwin, Oct 14: same look, same behaviour, one component.
 *
 * Everything the two panels genuinely disagree about is a prop. The directory
 * can put its exit on the left as a back arrow; the dropdown is anchored to a
 * trigger and always closes. Neither is a special case of the other.
 */
export function DirectoryHeader({
  title,
  picking,
  allOn,
  mixed,
  onToggleAll,
  toggleAllLabel,
  showActions,
  onActions,
  showSelect,
  selectMode,
  onToggleSelect,
  selectLabel = "Select",
  showSelectAll,
  exit = "close",
  onClose,
  closeLabel = "Close",
  className,
}: {
  /** Already resolved — the panel owns the count, this row just sets it. */
  title: string;
  picking: boolean;
  allOn: boolean;
  mixed: boolean;
  onToggleAll: () => void;
  toggleAllLabel: string;
  showActions: boolean;
  onActions: () => void;
  showSelect: boolean;
  selectMode: boolean;
  onToggleSelect: () => void;
  /** What the button that starts selection is called. See SELECT_LABELS. */
  selectLabel?: string;
  /**
   * Whether the select-all box sits here.
   *
   * Defaults to `picking`, which is where it has always been. The header
   * dropdown can move it — and Select with it — onto a strip below the search
   * field; see SELECT_SPOTS. `picking` still governs the close, because that
   * is about the MODE being on rather than about where its controls live.
   */
  showSelectAll?: boolean;
  /** Where the way out lives, or that there isn't one. See DIRECTORY_EXITS. */
  exit?: "close" | "back";
  onClose: () => void;
  closeLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[44px] shrink-0 items-center gap-[9px] px-[12px]",
        className,
      )}
    >
      {/*
        The back arrow, when the exit is on the left.

        Ahead of the select-all box deliberately: it leaves the PANEL, and the
        box acts on the list inside it, so the control with the wider reach
        reads first. It hides in select mode for the same reason ✕ does —
        Cancel is the exit that belongs to the mode you are in.
      */}
      {exit === "back" && !picking ? (
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="motion-tap -ml-[4px] flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
        >
          {/* ArrowLeft, not ChevronLeft. A chevron is a DIRECTION — it is what
              every row in this panel wears to say "there is more through
              here" — and pointing one backwards asks the reader to read the
              same mark two ways in one surface. An arrow is a destination,
              which is what going back is. */}
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
      ) : null}

      {(showSelectAll ?? picking) ? (
        <SelectBox
          checked={allOn}
          mixed={mixed}
          onClick={onToggleAll}
          /*
            Says what it will do to what is on screen, not "everything". While
            a query is up this box reaches the matches and nothing else — and
            an admin who has just filtered to three of four hundred needs that
            stated before they press it, not discovered after.
          */
          label={toggleAllLabel}
        />
      ) : null}

      {/*
        The count replaces the title rather than joining it: there is room for
        one thing on the left, and while rows are ticked the count is the more
        useful of the two. The total goes in brackets because the title alone
        does not say how big "all" is — at forty sub-accounts that is the
        first thing worth knowing, since it tells you to search rather than
        scroll before you have started doing either.
      */}
      <span className="min-w-0 flex-1 truncate text-[13.5px] leading-[18px] font-semibold text-nav-fg">
        {title}
      </span>

      {showActions ? (
        /*
          Always the chooser, whatever the Entry knob says. Straight-in draws
          a button per path, and three of those do not fit beside a title and
          a close — so the panel asks once, in the modal, where there is room
          to explain the choice.

          Neutral ink, not the accent. Selection is not branded: the accent is
          the tenant's colour and it is already doing a job here — every row
          wears a logo in it — so spending it again on a control that acts ON
          those rows put the loudest thing on screen in the same hue as the
          things it was about to change. Worse, it changed colour per account:
          the same destructive action red in one and violet in the next, which
          is the one place a colour ought to be constant.
        */
        <button
          type="button"
          onClick={onActions}
          className="motion-tap flex h-[26px] shrink-0 items-center rounded-[7px] bg-[var(--admin-action)] px-[9px] text-[12px] leading-none font-medium text-[var(--admin-action-fg)] hover:bg-[var(--admin-action-hover)] active:scale-[0.98]"
        >
          {/* No glyph. Sparkles reads as AI everywhere else in this shell — it
              is the Ask AI mark — and a bulk run is the one thing here that is
              emphatically not that. The words are the label.

              "Actions", not "Bulk actions": the header already says "3 of 17
              selected" two inches to its left, so "bulk" is the one word in
              the row that repeats something. */}
          Actions
        </button>
      ) : null}

      {/*
        Select, iOS-style — and Cancel once you are in it.

        Before the close rather than after: this is the panel's own action and
        ✕ is the way out of the panel, so the one that changes what the panel
        IS should not sit outboard of the one that dismisses it. An outlined
        button rather than a text link, because it sits beside a filled
        primary and the two are the standard pair: one thing to do, one way to
        stop.
      */}
      {showSelect ? (
        <button
          type="button"
          onClick={onToggleSelect}
          className={cn(
            "motion-tap flex h-[26px] shrink-0 items-center rounded-[7px] px-[9px] text-[12px] leading-none font-medium text-nav-fg",
            "shadow-[inset_0_0_0_1px_var(--fly-border)] hover:bg-nav-hover",
          )}
        >
          {selectMode ? "Cancel" : selectLabel}
        </button>
      ) : null}

      {/*
        Gone while a selection is in progress.

        Cancel is already the way out of the mode and it is the way out people
        want — ✕ beside it offers a second exit that silently discards the
        same work, and the two sitting together make the reader decide which
        kind of leaving they meant. With the mode over, ✕ comes back as the
        only way out there is.
      */}
      {picking || exit === "back" ? null : (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
