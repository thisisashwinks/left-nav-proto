"use client";

import * as React from "react";
import { Undo2, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useNavLayout } from "./nav-layout-provider";
import { TOAST_TOP } from "./template-message";

/** How long an undo stays on offer before it slides away. */
const DISMISS_MS = 5000;

/**
 * The single undo offer that lets every editing action skip its confirm dialog.
 *
 * One toast at a time, replaced rather than stacked — the store only keeps the
 * most recent offer, so a burst of pinning collapses into one thing to undo
 * rather than a queue to dismiss.
 */
export function UndoToast({
  navWidth,
}: {
  /** The nav column's right edge, so the toast can centre itself on the nav. */
  navWidth: number;
}) {
  const { undoOffer, undo, dismissUndo, state } = useNavLayout();
  const centred = useTheme().effective.templateMessagePlacement === "centred";

  React.useEffect(() => {
    if (!undoOffer) return;
    const timer = setTimeout(dismissUndo, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [undoOffer, dismissUndo]);

  if (!undoOffer) return null;

  return (
    <div
      // Keyed on the offer so a replacement replays the entrance instead of
      // silently swapping its text.
      key={undoOffer.id}
      role="status"
      /*
       * Riding the nav's foot, above the Ask AI pill (design review, Aug 21).
       * It was top-centre of the page, which put the confirmation a screen away
       * from the row that just moved — the eye is IN the nav when the toast
       * matters. 74px up clears the pill and its lift. Left-aligned to the nav
       * rather than centred on it: the message names two categories and is
       * routinely wider than the column, and centring pushed it off the window's
       * left edge. Growing rightward over the canvas is the direction with room.
       *
       * 74px clears the pill; editing needs 94 more, because the editing card
       * stands between the two and the toast was landing across its Discard and
       * Save. Undo appears almost exclusively WHILE editing, so the colliding
       * case was the common one rather than the edge.
       */
      /*
        Centred, this leaves the nav entirely.

        It is the nav's own undo offer and every edit raises it — pinning,
        renaming, reordering — so it is not a template surface. But the
        placement axis was asked to govern every toast in the nav, and an axis
        whose "all centred" setting leaves the most common toast in the product
        where it was is not all-centred. See TEMPLATE_MESSAGE_PLACEMENTS.
      */
      style={
        centred
          ? { top: TOAST_TOP, left: "50%" }
          : {
              left: Math.max(12, navWidth - 260),
              bottom: state.editing ? 74 + 94 : 74,
            }
      }
      className={cn(
        "motion-slot-in z-40 flex h-[38px] items-center gap-[12px] rounded-[10px] bg-pg-overlay px-[14px] shadow-[0_8px_24px_0_rgba(15,23,42,0.28)]",
        centred
          ? "fixed max-w-[calc(100vw-32px)] -translate-x-1/2"
          : "absolute max-w-[min(520px,calc(100%-24px))]",
      )}
    >

      <span className="truncate text-[13px] leading-none whitespace-nowrap text-pg-surface">
        {undoOffer.message}
      </span>
      <span aria-hidden="true" className="h-[16px] w-px bg-[var(--pg-overlay-divider)]" />
      <button
        type="button"
        onClick={undo}
        className="motion-tap flex items-center gap-[5px] text-[13px] leading-none font-medium whitespace-nowrap text-pg-overlay-fg hover:brightness-125"
      >
        <Undo2 size={13} aria-hidden="true" />
        Undo
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismissUndo}
        className="motion-tap text-pg-faint hover:rotate-90 hover:text-pg-overlay-fg"
      >
        <X size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
