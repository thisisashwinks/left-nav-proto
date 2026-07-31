"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { PinnedRailItem } from "./types";

/**
 * The pinned favourites capsule, which morphs between a horizontal pill and a
 * vertical capsule when the nav collapses.
 *
 * Geometry is in nav-wrapper coordinates so one element can travel between the
 * two states. Expanded slots are space-between inside the pill's 224px content
 * box; collapsed slots step 32px down (30px slot + 2px gap, as in the design's
 * vertical capsule).
 */

/** Five icons plus the overflow chevron — six slots, as in the design. */
export const PINNED_VISIBLE = 5;

const EXPANDED = {
  container: { left: 12, top: 50, width: 248, height: 40, radius: 34 },
  // 224px content box, six 16px slots, 25.6px gaps.
  slots: [24, 65.6, 107.2, 148.8, 190.4, 232].map((left) => ({ left, top: 62 })),
  /** Dock captions only make sense horizontally; see below. */
  showLabels: true,
};

const COLLAPSED = {
  container: { left: 10, top: 88, width: 44, height: 200, radius: 22 },
  slots: [100, 132, 164, 196, 228, 260].map((top) => ({ left: 24, top })),
  // A caption under a 16px icon is ~60px wide, which the 64px rail would clip.
  // The native tooltip carries the name in this state instead.
  showLabels: false,
};

/** Height the expanded nav reserves: 40px pill + 12px bottom padding. */
export const EXPANDED_PINNED_BLOCK = 52;
/** Height the collapsed rail reserves for the vertical capsule. */
export const COLLAPSED_PINNED_BLOCK = 200;

const EXPANDED_NAV_WIDTH = 272;
const COLLAPSED_NAV_WIDTH = 64;

interface DockButtonProps {
  label: string;
  icon: LucideIcon;
  left: number;
  top: number;
  showLabel: boolean;
  onHoverChange: (hovered: boolean) => void;
  onClick?: () => void;
}

/**
 * One dock slot. The icon stays 16px at rest, matching the design, and lifts and
 * grows on hover.
 *
 * Scaling is anchored to the bottom edge rather than the centre so the icon
 * grows upward, which keeps the gap below it free for the caption. The caption
 * is absolutely positioned, so nothing here nudges a neighbour.
 */
function DockButton({
  label,
  icon: Icon,
  left,
  top,
  showLabel,
  onHoverChange,
  onClick,
}: DockButtonProps) {
  return (
    <button
      type="button"
      // The caption already names it; a native tooltip would just duplicate it.
      title={showLabel ? undefined : label}
      aria-label={label}
      onClick={onClick}
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
      // ::before widens the hit target to 30px without moving the icon.
      className="motion-move group pointer-events-auto absolute size-[16px] text-nav-fg-muted before:absolute before:top-[-7px] before:left-[-7px] before:size-[30px] before:content-[''] hover:text-nav-fg focus-visible:text-nav-fg"
      style={{ left, top }}
    >
      <span className="motion-tap relative block origin-bottom group-hover:-translate-y-[4px] group-hover:scale-125 group-focus-visible:-translate-y-[4px] group-focus-visible:scale-125">
        <span
          aria-hidden="true"
          className="motion-tap absolute top-[-6px] left-[-6px] size-[28px] rounded-full bg-nav-rail-hi opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
        <Icon size={16} aria-hidden="true" className="relative" />
      </span>

      {showLabel ? (
        <span
          aria-hidden="true"
          className="motion-tap pointer-events-none absolute top-[18px] left-1/2 -translate-x-1/2 -translate-y-[2px] text-[8px] leading-none font-semibold tracking-[0.2px] whitespace-nowrap text-nav-fg-muted opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
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
}

/**
 * Hoisted out of both nav faces so a single element can morph between the two
 * layouts instead of being cross-faded between two copies. Each face leaves a
 * same-sized hole where the capsule sits, so nothing below it shifts.
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
}: FavoritesMorphProps) {
  // Hover is tracked in state rather than with a CSS group because the wrapper
  // spans the whole nav — a group-hover would fire anywhere in it.
  const [dockHovered, setDockHovered] = React.useState(false);

  const g = collapsed ? COLLAPSED : EXPANDED;
  const visible = items.slice(0, PINNED_VISIBLE);
  const navWidth = collapsed ? COLLAPSED_NAV_WIDTH : EXPANDED_NAV_WIDTH;

  /**
   * On hover the pill stretches edge to edge and drops its radius, becoming a
   * band. That is what gives the captions room — at rest the first caption
   * would otherwise hang off the pill's left end.
   */
  const container = dockHovered
    ? { left: 0, top: g.container.top, width: navWidth, height: g.container.height, radius: 0 }
    : g.container;

  return (
    <div
      data-nav-theme={theme}
      className="pointer-events-none absolute inset-0 z-30"
    >
      <div
        aria-hidden="true"
        className="motion-move pointer-events-none absolute bg-nav-rail shadow-[inset_0_0_0_1px_var(--nav-rail-border)]"
        style={{
          left: container.left,
          top: container.top,
          width: container.width,
          height: container.height,
          borderRadius: container.radius,
        }}
      />

      {visible.map(({ id, label, icon }, i) => (
        <DockButton
          key={id}
          label={label}
          icon={icon}
          left={g.slots[i].left}
          top={g.slots[i].top}
          showLabel={g.showLabels}
          onHoverChange={setDockHovered}
          onClick={() => onSelect?.(id)}
        />
      ))}

      <button
        type="button"
        title="Show all pinned"
        aria-label="Show all pinned"
        onClick={onOpenFavorites}
        onPointerEnter={() => setDockHovered(true)}
        onPointerLeave={() => setDockHovered(false)}
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
        {/*
          The disc is a child rather than a sibling so it can darken with the
          chevron. That also makes it concentric, 1px off the design's 227px.
        */}
        <span
          aria-hidden="true"
          className="motion-tap absolute top-[-4px] left-[-4px] size-[24px] rounded-full bg-nav-rail-hi group-hover:bg-nav-rail-disc"
        />
        <ChevronRight
          size={16}
          aria-hidden="true"
          className="motion-tap relative group-hover:translate-x-[2px]"
        />
      </button>
    </div>
  );
}
