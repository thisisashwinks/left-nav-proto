"use client";

import * as React from "react";
import { Undo2, X } from "lucide-react";
import { useNavLayout } from "./nav-layout-provider";

/** How long an undo stays on offer before it slides away. */
const DISMISS_MS = 5000;

/**
 * The single undo offer that lets every editing action skip its confirm dialog.
 *
 * One toast at a time, replaced rather than stacked — the store only keeps the
 * most recent offer, so a burst of pinning collapses into one thing to undo
 * rather than a queue to dismiss.
 */
export function UndoToast() {
  const { undoOffer, undo, dismissUndo } = useNavLayout();

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
      // Top centre (Aug 13 ask) — bottom-left sat on the Ask AI pill. The top
      // edge is free: banners are rare and the toast floats above the header
      // rather than inside it. Centre-bottom stays with the Contacts selection
      // bar, which owns that slot.
      className="motion-slot-in absolute top-[16px] left-1/2 z-40 flex h-[38px] -translate-x-1/2 items-center gap-[12px] rounded-[10px] bg-pg-overlay px-[14px] shadow-[0_8px_24px_0_rgba(15,23,42,0.28)]"
    >
      <span className="text-[13px] leading-none whitespace-nowrap text-pg-surface">
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
