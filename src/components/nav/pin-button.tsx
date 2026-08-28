"use client";

import * as React from "react";
import { Pin } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { PIN_LIMIT, useNavLayout } from "./nav-layout-provider";
import { RailTooltip } from "./rail-tooltip";

/**
 * What a refused pin says, in the fewest words that still say what to do.
 *
 * Exported because the merged block draws its own pin — one sentence, one
 * place, or the two surfaces end up explaining the same rule differently.
 */
export const PIN_CAP_HINT = `Max ${PIN_LIMIT} - unpin one first`;

/**
 * The ink a set pin is drawn in.
 *
 * gray-400 rather than the brand, by default: a set pin is a state, not an
 * action — it is describing the row rather than asking to be pressed — and a
 * column of accent-coloured pins was the loudest thing in the list. The axis is
 * platform-wide so the mark cannot mean one thing in the dock and another in a
 * panel; see PIN_MARK_COLOURS.
 */
export function usePinnedInk(): string {
  const { pinMarkColour } = useTheme().effective;
  return pinMarkColour === "brand"
    ? "text-brand"
    : "text-[var(--hr-gray-400)]";
}

/**
 * The favourite affordance that appears on hover wherever a product already is
 * — a flyout row, a search result, a recents entry.
 *
 * A pin that fills, not a star (Aug 13): the rail directory, the dock row and
 * this button all say "pin" now — one glyph and one verb for one gesture,
 * everywhere it appears.
 *
 * Adding never goes through a settings screen, and there is no confirm step:
 * the same pin is the undo. Always rendered rather than conditionally mounted
 * so it stays reachable by keyboard; only its opacity depends on hover.
 *
 * The containing row must carry `group/row` — the hover variant is a static
 * class so Tailwind can see it, which a templated group name would defeat.
 */
export function PinButton({
  productId,
  className,
  size = 14,
}: {
  productId: string;
  className?: string;
  /**
   * The glyph, not the button — the 22px target is fixed so the trailing
   * column lines up whatever the mark inside it measures.
   *
   * 14 is this control's own size, on the roomy rows it was drawn for. The
   * flyout's rows ask for 12, matching the nav's, because the two levels are
   * meant to read as one list seen at two depths.
   */
  size?: number;
}) {
  const { isPinned, togglePin, pinsFull } = useNavLayout();
  const pinned = isPinned(productId);
  const pinnedInk = usePinnedInk();
  // Full, and this row is not one of the five: the pin is shown refusing rather
  // than shown working and doing nothing.
  const blocked = !pinned && pinsFull;

  const button = (
    <button
      type="button"
      /*
       * `aria-disabled`, not `disabled`.
       *
       * A disabled button takes no pointer events, which means no hover — and
       * the hover is where the explanation lives. So the button stays live,
       * announces itself as unavailable, and refuses in its own handler.
       */
      aria-disabled={blocked}
      title={pinned ? "Unpin" : blocked ? PIN_CAP_HINT : "Pin"}
      aria-label={pinned ? "Unpin" : "Pin"}
      aria-pressed={pinned}
      onClick={(e) => {
        // The row itself navigates; pinning must not also trigger that.
        e.stopPropagation();
        if (blocked) return;
        togglePin(productId);
      }}
      className={cn(
        "motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px]",
        "hover:bg-nav-hover active:scale-90 motion-press",
        // Pinned stays visible so the row reads as pinned at a glance; the rest
        // only appear on hover or focus.
        pinned
          ? cn(pinnedInk, "opacity-100")
          : "text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 hover:text-nav-fg focus-visible:opacity-100",
        blocked &&
          "cursor-not-allowed opacity-0 group-hover/row:opacity-30 hover:bg-transparent hover:text-nav-fg-subtle active:scale-100",
        className,
      )}
    >
      <Pin
        size={size}
        fill={pinned ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );

  // Only when it would refuse. A tooltip on every pin would explain a control
  // whose glyph and whose title already say what it does.
  return blocked ? (
    <RailTooltip label={PIN_CAP_HINT} placement="below">
      {button}
    </RailTooltip>
  ) : (
    button
  );
}
