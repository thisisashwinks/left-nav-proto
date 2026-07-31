"use client";

import { ChevronRight, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { PinnedRailItem } from "./types";

/**
 * The pinned row is two capsules that share a styling and a height: a
 * single-slot Search capsule on the left, and Favorites on the right. Both morph
 * between a horizontal and a vertical layout when the nav collapses.
 *
 * Geometry is in nav-wrapper coordinates so one element can travel between the
 * two states. Expanded slots are space-between inside each capsule's content
 * box; collapsed slots step 32px down (30px slot + 2px gap, as in the design's
 * vertical capsule).
 */

/** Favourites shows four icons plus the overflow chevron. */
export const PINNED_VISIBLE = 4;

const EXPANDED = {
  search: { left: 12, top: 50, width: 40, height: 40, radius: 34 },
  searchSlot: { left: 24, top: 62 },
  favorites: { left: 60, top: 50, width: 200, height: 40, radius: 34 },
  // 176px content box, five 16px slots, 24px gaps.
  slots: [72, 112, 152, 192, 232].map((left) => ({ left, top: 62 })),
  disc: { left: 228, top: 58 },
  /** Dock labels only make sense horizontally; see below. */
  showLabels: true,
};

const COLLAPSED = {
  search: { left: 10, top: 46, width: 44, height: 40, radius: 22 },
  searchSlot: { left: 24, top: 58 },
  favorites: { left: 10, top: 90, width: 44, height: 168, radius: 22 },
  slots: [102, 134, 166, 198, 230].map((top) => ({ left: 24, top })),
  disc: { left: 20, top: 226 },
  // A label under a 16px icon is ~45px wide, which the 64px rail would clip.
  // The native tooltip carries the name in this state instead.
  showLabels: false,
};

/** Height the expanded nav reserves: 40px capsule + 12px bottom padding. */
export const EXPANDED_PINNED_BLOCK = 52;
/** Height the collapsed rail reserves: search 40 + 4 gap + favourites 168. */
export const COLLAPSED_PINNED_BLOCK = 212;

interface DockButtonProps {
  label: string;
  icon: LucideIcon;
  left: number;
  top: number;
  showLabel: boolean;
  onClick?: () => void;
}

/**
 * One dock slot. The icon stays 16px at rest, matching the design, and grows
 * with a soft brand backdrop and a small caption on hover — the caption is
 * absolutely positioned so growing it never nudges its neighbours.
 */
function DockButton({
  label,
  icon: Icon,
  left,
  top,
  showLabel,
  onClick,
}: DockButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      // ::before widens the hit target to 30px without moving the icon.
      className="motion-move group pointer-events-auto absolute size-[16px] text-nav-fg-muted before:absolute before:top-[-7px] before:left-[-7px] before:size-[30px] before:content-[''] hover:text-brand"
      style={{ left, top }}
    >
      <span
        aria-hidden="true"
        className="motion-tap absolute top-[-6px] left-[-6px] size-[28px] scale-75 rounded-full bg-brand-soft opacity-0 group-hover:scale-100 group-hover:opacity-100"
      />
      <Icon
        size={16}
        aria-hidden="true"
        className="motion-tap relative group-hover:scale-125"
      />
      {showLabel ? (
        <span
          aria-hidden="true"
          className="motion-tap pointer-events-none absolute top-[19px] left-1/2 -translate-x-1/2 -translate-y-[2px] text-[8px] leading-none font-semibold tracking-[0.2px] whitespace-nowrap text-nav-fg-muted opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
        >
          {label}
        </span>
      ) : null}
    </button>
  );
}

interface FavoritesMorphProps {
  theme: SurfaceTheme;
  items: PinnedRailItem[];
  collapsed: boolean;
  onSelect?: (id: string) => void;
  onOpenFavorites: () => void;
  onSearch?: () => void;
}

/**
 * Hoisted out of both nav faces so a single element can morph between the two
 * layouts instead of being cross-faded between two copies. Each face leaves a
 * same-sized hole where the capsules sit, so nothing below them shifts.
 *
 * Trade-off: living beside the faces rather than inside them puts it outside
 * their DOM order. It is rendered before the faces to keep it as close to its
 * visual position in the tab order as possible.
 */
export function FavoritesMorph({
  theme,
  items,
  collapsed,
  onSelect,
  onOpenFavorites,
  onSearch,
}: FavoritesMorphProps) {
  const g = collapsed ? COLLAPSED : EXPANDED;
  const visible = items.slice(0, PINNED_VISIBLE);

  const capsule =
    "motion-move pointer-events-none absolute bg-nav-rail shadow-[inset_0_0_0_1px_var(--nav-rail-border)]";

  return (
    <div
      data-nav-theme={theme}
      className="pointer-events-none absolute inset-0 z-30"
    >
      <div
        aria-hidden="true"
        className={capsule}
        style={{
          left: g.search.left,
          top: g.search.top,
          width: g.search.width,
          height: g.search.height,
          borderRadius: g.search.radius,
        }}
      />
      <div
        aria-hidden="true"
        className={capsule}
        style={{
          left: g.favorites.left,
          top: g.favorites.top,
          width: g.favorites.width,
          height: g.favorites.height,
          borderRadius: g.favorites.radius,
        }}
      />

      {/* Backdrop behind the overflow chevron; travels with it. */}
      <span
        aria-hidden="true"
        className="motion-move pointer-events-none absolute size-[24px] rounded-full bg-nav-rail-hi"
        style={{ left: g.disc.left, top: g.disc.top }}
      />

      <DockButton
        label="Search"
        icon={Search}
        left={g.searchSlot.left}
        top={g.searchSlot.top}
        showLabel={g.showLabels}
        onClick={onSearch}
      />

      {visible.map(({ id, label, icon }, i) => (
        <DockButton
          key={id}
          label={label}
          icon={icon}
          left={g.slots[i].left}
          top={g.slots[i].top}
          showLabel={g.showLabels}
          onClick={() => onSelect?.(id)}
        />
      ))}

      <button
        type="button"
        title="Show all pinned"
        aria-label="Show all pinned"
        onClick={onOpenFavorites}
        className={cn(
          "motion-move group pointer-events-auto absolute size-[16px] text-nav-fg-muted",
          "before:absolute before:top-[-7px] before:left-[-7px] before:size-[30px] before:content-['']",
          "hover:text-nav-fg",
        )}
        style={{
          left: g.slots[g.slots.length - 1].left,
          top: g.slots[g.slots.length - 1].top,
        }}
      >
        <ChevronRight
          size={16}
          aria-hidden="true"
          className="motion-tap relative group-hover:translate-x-[2px]"
        />
      </button>
    </div>
  );
}
