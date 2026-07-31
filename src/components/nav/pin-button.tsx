"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavLayout } from "./nav-layout-provider";

/**
 * The favourite affordance that appears on hover wherever a product already is
 * — a flyout row, a search result, a recents entry.
 *
 * A star rather than a pin, and one star that fills rather than two icons that
 * swap: the sub-account switcher already marks its favourites this way, and two
 * different glyphs for the same gesture read as two different features. The
 * nav's own copy calls the dock Favorites, so the star is what matches it.
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
      title={pinned ? "Remove from favorites" : "Add to favorites"}
      aria-label={pinned ? "Remove from favorites" : "Add to favorites"}
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
      <Star
        size={14}
        fill={pinned ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );
}
