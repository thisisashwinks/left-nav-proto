"use client";

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

/**
 * Collapsed capsule metrics, from the design's vertical capsule: 5px padding at
 * each end, 30px slots, 2px between them — so each slot after the first adds 32.
 */
const COLLAPSED_TOP = 88;
const COLLAPSED_SLOT_PITCH = 32;

/**
 * The collapsed capsule is sized to its contents rather than to a fixed five
 * slots. Expanded, the pill spans the nav whatever it holds and the leftover
 * space is fine; collapsed, an oversized capsule reads as a gap with nothing in
 * it. Six slots gives the design's 200px.
 */
export function collapsedPinnedBlock(slotCount: number): number {
  return COLLAPSED_SLOT_PITCH * slotCount + 8;
}

function collapsedGeometry(slotCount: number) {
  return {
    container: {
      left: 10,
      top: COLLAPSED_TOP,
      width: 44,
      height: collapsedPinnedBlock(slotCount),
      radius: 22,
    },
    slots: Array.from({ length: slotCount }, (_, i) => ({
      left: 24,
      top: COLLAPSED_TOP + 12 + i * COLLAPSED_SLOT_PITCH,
    })),
    // A caption under a 16px icon is ~60px wide, which the 64px rail would clip.
    // The tooltip carries the name in this state instead.
    showLabels: false,
  };
}

/** Height the expanded nav reserves: 40px pill + 12px bottom padding. */
export const EXPANDED_PINNED_BLOCK = 52;

const EXPANDED_NAV_WIDTH = 272;
const COLLAPSED_NAV_WIDTH = 64;

interface DockButtonProps {
  label: string;
  icon: LucideIcon;
  left: number;
  top: number;
  showLabel: boolean;
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
  onClick,
}: DockButtonProps) {
  return (
    <button
      type="button"
      // The caption already names it; a native tooltip would just duplicate it.
      title={showLabel ? undefined : label}
      aria-label={label}
      onClick={onClick}
      // ::before widens the hit target to 30px without moving the icon.
      className="motion-move group/dock absolute size-[16px] text-nav-fg-muted before:absolute before:top-[-7px] before:left-[-7px] before:size-[30px] before:content-[''] hover:text-nav-fg focus-visible:text-nav-fg"
      style={{ left, top }}
    >
      <span className="motion-dock relative block origin-bottom group-hover/dock:-translate-y-[var(--t-dock-lift,5px)] group-hover/dock:scale-[var(--t-dock-scale,1.25)] group-focus-visible/dock:-translate-y-[var(--t-dock-lift,5px)] group-focus-visible/dock:scale-[var(--t-dock-scale,1.25)]">
        <span
          aria-hidden="true"
          className="motion-dock absolute top-[-6px] left-[-6px] size-[28px] rounded-full bg-nav-rail-hi opacity-0 group-hover/dock:opacity-100 group-focus-visible/dock:opacity-100"
        />
        <Icon
          size={16}
          aria-hidden="true"
          className="relative"
          style={{ width: "var(--t-dock-icon, 16px)", height: "var(--t-dock-icon, 16px)" }}
        />
      </span>

      {showLabel ? (
        <span
          aria-hidden="true"
          className="motion-dock pointer-events-none absolute top-[var(--t-dock-label-top,16px)] left-1/2 -translate-x-1/2 -translate-y-[3px] text-[length:var(--t-dock-label,8px)] leading-none font-semibold tracking-[0.2px] whitespace-nowrap text-nav-fg-muted opacity-0 group-hover/dock:translate-y-0 group-hover/dock:opacity-100 group-focus-visible/dock:translate-y-0 group-focus-visible/dock:opacity-100"
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
  /** Click the chevron — pins the manage surface open. */
  onOpenLauncher: () => void;
  /** Hover the chevron — previews it on the nav's shared intent timer. */
  onHoverLauncher: () => void;
  /** The launcher is open. */
  launcherActive: boolean;
  /** Pins that fall outside the visible row, which the badge counts. */
  overflowCount: number;
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
  onOpenLauncher,
  onHoverLauncher,
  launcherActive,
  overflowCount,
}: FavoritesMorphProps) {
  const visible = items.slice(0, PINNED_VISIBLE);
  // Favourites plus the permanent grid chip.
  const g = collapsed ? collapsedGeometry(visible.length + 1) : EXPANDED;
  const navWidth = collapsed ? COLLAPSED_NAV_WIDTH : EXPANDED_NAV_WIDTH;

  /**
   * At rest the capsule is the design's pill; while the pointer is anywhere in
   * the row it stretches edge to edge and drops its radius, becoming a band.
   * That is what gives the captions room — at rest the first caption would
   * otherwise hang off the pill's left end.
   *
   * Driven by CSS `:hover` on the row rather than React state: `:hover` matches
   * ancestors of whatever is hovered, so moving between the row's dead space and
   * an icon can never flicker the band, and there is no state to get stuck.
   */
  const capsuleClass = collapsed
    ? "left-[10px] w-[44px] rounded-[22px] group-hover/row:left-0 group-hover/row:w-[64px] group-hover/row:rounded-none"
    : "left-[12px] w-[248px] rounded-[34px] group-hover/row:left-0 group-hover/row:w-[272px] group-hover/row:rounded-none";

  /** Slot positions are wrapper-absolute; the row is the offset parent. */
  const slotTop = (i: number) => g.slots[i].top - g.container.top;
  const lastSlot = g.slots.length - 1;

  return (
    <div
      data-nav-theme={theme}
      className="pointer-events-none absolute inset-0 z-30"
    >
      {/*
        The whole row is the hover target, not each icon — the band should open
        as soon as the pointer enters the section. It has to be the icons'
        ancestor: as a sibling, moving onto an icon would make the row lose the
        pointer and fire pointerleave, flickering the band shut.
      */}
      <div
        className="motion-move group/row pointer-events-auto absolute"
        style={{
          left: 0,
          top: g.container.top,
          width: navWidth,
          height: g.container.height,
        }}
      >
        <div
          aria-hidden="true"
          className={cn(
            "motion-move absolute inset-y-0 bg-nav-rail shadow-[inset_0_0_0_1px_var(--nav-rail-border)]",
            capsuleClass,
          )}
        />

        {visible.map(({ id, label, icon }, i) => (
          <DockButton
            key={id}
            label={label}
            icon={icon}
            left={g.slots[i].left}
            top={slotTop(i)}
            showLabel={g.showLabels}
            onClick={() => onSelect?.(id)}
          />
        ))}

        {/*
          The chevron that ends the chip row, and it is permanent: it is the
          product list, not an overflow symptom. A 9-dot grid sat here for a
          while and read as a second, competing app-switcher next to the account
          mark; the chevron says "more of this row" instead, and turns to face
          the panel while it is open.

          It opens on hover, on the same intent timer as the product rows, so the
          whole nav answers to the pointer the same way — and still pins on click,
          which is what keeps it open while you work inside it.

          The count badge appears only when pins fall outside the visible row,
          which is what makes unlimited pinning safe: the row shows what fits,
          the panel holds the rest and says how many.
        */}
        <button
          type="button"
          title="All products"
          aria-label={
            overflowCount > 0
              ? `All products, ${overflowCount} more pinned`
              : "All products"
          }
          aria-expanded={launcherActive}
          onClick={onOpenLauncher}
          onPointerEnter={onHoverLauncher}
          onFocus={onHoverLauncher}
          className={cn(
            "motion-move group/dock absolute size-[16px]",
            "before:absolute before:top-[-7px] before:left-[-7px] before:size-[30px] before:content-['']",
            "hover:text-nav-fg",
            launcherActive ? "text-nav-fg" : "text-nav-fg-muted",
          )}
          style={{ left: g.slots[lastSlot].left, top: slotTop(lastSlot) }}
        >
          {/*
            The disc is a child rather than a sibling so it can darken with the
            icon. That also makes it concentric, 1px off the design's 227px.
          */}
          <span
            aria-hidden="true"
            className={cn(
              "motion-tap absolute top-[-4px] left-[-4px] size-[24px] rounded-full group-hover/dock:bg-nav-rail-disc",
              launcherActive ? "bg-nav-rail-disc" : "bg-nav-rail-hi",
            )}
          />
          <ChevronRight
            size={16}
            aria-hidden="true"
            className={cn(
              "motion-tap relative",
              launcherActive && "rotate-180",
            )}
          />
          {overflowCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-[-8px] left-[9px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-brand px-[3px] text-[9px] leading-none font-semibold text-brand-fg"
            >
              {overflowCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
