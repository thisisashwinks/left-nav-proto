"use client";

import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavLayout } from "./nav-layout-provider";

/**
 * The favourite affordance that appears on hover wherever a product already is
 * — a flyout row, a search result, a recents entry.
 *
 * A pin that fills, not a star (Aug 13): the rail directory, the dock row and
 * this button all say "pin" now — one glyph and one verb for one gesture,
 * everywhere it appears.
 *
 * Adding never goes through a settings screen, and there is no confirm step:
 * the same star is the undo. Always rendered rather than conditionally mounted
 * so it stays reachable by keyboard; only its opacity depends on hover.
 *
 * The containing row must carry `group/row` — the hover variant is a static
 * class so Tailwind can see it, which a templated group name would defeat.
 */
export function PinButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { isPinned, togglePin } = useNavLayout();
  const pinned = isPinned(productId);

  return (
    <button
      type="button"
      title={pinned ? "Unpin" : "Pin"}
      aria-label={pinned ? "Unpin" : "Pin"}
      aria-pressed={pinned}
      onClick={(e) => {
        // The row itself navigates; pinning must not also trigger that.
        e.stopPropagation();
        togglePin(productId);
      }}
      className={cn(
        "motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px]",
        "hover:bg-nav-hover active:scale-90 motion-press",
        // Favourited stays visible so the row reads as favourited at a glance;
        // the rest only appear on hover or focus.
        pinned
          ? "text-brand opacity-100"
          : "text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 hover:text-nav-fg focus-visible:opacity-100",
        className,
      )}
    >
      <Pin
        size={14}
        fill={pinned ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );
}
