"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DockLabel, DockPosition, SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { ComposedIcon } from "./composed-icon";
import { RailTooltip } from "./rail-tooltip";
import type { SwapPhase } from "@/lib/use-swap-phase";
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

/**
 * The favourites block: 272 wide, padded 12 left, 12 right, 6 top, 16 bottom,
 * holding a 248 x 40 capsule.
 *
 * left-nav.pen measures 12 at the top, but the header already ends in 10px of its
 * own bottom padding, so 12 more put 22px between the logo and the band — the two
 * read as unrelated rather than as one cluster. 6 here closes it to 16 without
 * touching the header's own measured geometry.
 *
 * The bottom stays heavier, deliberately: it separates the dock from the Recent
 * label below it, and it is the room the band grows into when it opens to carry a
 * centred caption.
 */
const BLOCK = { padTop: 6, padBottom: 16 };

/** Where the block starts: directly below the 54px logo row. */
const BLOCK_TOP = 54;

/** Six 16px slots space-between in the capsule's 224px content box. */
const SLOT_LEFTS = [24, 65.6, 107.2, 148.8, 190.4, 232];

/**
 * The band is the design's 40px at rest and opens to 56 while the pointer is in
 * it, which is the only state where a caption exists to hold: 12 above the icon,
 * 6 between icon and caption, 12 for the caption, 10 below.
 *
 * It opens *downward into the block's own 16px bottom padding*, and the block's
 * height never changes. That is the whole trick — the band gets the room a caption
 * needs without a single pixel of the nav below it moving, which was the review's
 * objection to the tracking caption in the first place. Sizing the block for the
 * open state instead would have left 20px of dead air under the band at rest.
 */
const CAPSULE = { rest: 40, open: 56 };

/** Where the icon row sits inside the resting band. */
const SLOT_INSET = (CAPSULE.rest - 16) / 2;

/** Room left under the caption, inside the band, at the top of the nav. */
const CAPTION_BOTTOM = 10;

/**
 * Where the caption sits from the band's *top* edge when the dock is pinned to the
 * nav's bottom.
 *
 * Mirrored, but not by the same number. There the band opens downward and the
 * caption takes the new space below the icons; here it opens upward and the caption
 * takes the space above them. The icons are bottom-anchored at SLOT_INSET, so the
 * band's extra 16px all appears above them: 12 for the caption and 4 to breathe
 * against the band's edge, leaving 6 between caption and icon.
 */
const CAPTION_TOP = CAPSULE.open - SLOT_INSET - 16 - 6 - 12;

/**
 * At the nav's bottom edge the block is padded evenly — the heavier 16 existed to
 * separate the dock from the Recent label under it, and at the bottom there is
 * nothing under it to separate from.
 */
const BOTTOM_BLOCK = { padTop: 12, padBottom: 12 };

/** How much of the nav's height the block claims, per position. */
export function pinnedBlockFor(position: DockPosition): number {
  return position === "bottom"
    ? BOTTOM_BLOCK.padTop + CAPSULE.rest + BOTTOM_BLOCK.padBottom
    : BLOCK.padTop + CAPSULE.rest + BLOCK.padBottom;
}

function expandedGeometry() {
  return {
    container: {
      left: 12,
      top: BLOCK_TOP + BLOCK.padTop,
      width: 248,
      height: CAPSULE.rest,
      radius: 34,
    },
    // Centred in the resting band. The band only ever grows away from the icons,
    // so the icon row stays put whether it is open or not.
    slots: SLOT_LEFTS.map((left) => ({
      left,
      top: BLOCK_TOP + BLOCK.padTop + SLOT_INSET,
    })),
    /** Dock captions only make sense horizontally; see below. */
    showLabels: true,
  };
}

/**
 * Collapsed capsule metrics, from the design's vertical capsule: 5px padding at
 * each end, 30px slots, 2px between them — so each slot after the first adds 32.
 */
// 81, not the design's 88: the rail's mark block is pt 11 + 26px mark (was
// 12 + 30), centred on the app header's midline — the capsule rides with it.
const COLLAPSED_TOP = 81;
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

const EXPANDED_NAV_WIDTH = 272;
const COLLAPSED_NAV_WIDTH = 64;

interface DockButtonProps {
  label: string;
  icon: LucideIcon;
  /** The row's own glyph, when `icon` is its parent's. See ComposedIcon. */
  badge?: LucideIcon;
  /**
   * Absolute placement inside the row. `top` or `bottom` depending on which edge
   * the band is anchored to — the icons have to be pinned to the edge the band
   * does *not* grow from, or they slide when it opens.
   */
  slot: React.CSSProperties;
  /** True only in `under` mode, where each icon carries its own caption. */
  showLabel: boolean;
  /** Which side the tooltip sits on — under the chip row, beside the rail. */
  placement: "right" | "below";
  /**
   * Name the icon on hover, for the modes with no visible caption.
   *
   * A real tooltip rather than the native `title` it used to set. The dock is
   * the one surface in the nav with no text on it at all, so the name is not a
   * nicety here — and a browser tooltip arrives a second late, in the OS's own
   * styling, which is exactly wrong for the fastest row in the nav. It also
   * carries the qualifier: "Opportunities › Settings", which is the whole
   * reason you would hover a gear.
   */
  titled: boolean;
  onClick?: () => void;
  /** Reports hover up, so a shared caption can name what is under the pointer. */
  onHoverChange?: (hovered: boolean) => void;
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
  badge,
  slot,
  showLabel,
  titled,
  placement,
  onClick,
  onHoverChange,
}: DockButtonProps) {
  const button = (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      // ::before widens the hit target to 30px without moving the icon.
      // Knocked out with the band: entering the row takes every icon to full
      // ink, not just the one under the pointer — the whole area is one control
      // announcing itself (Khoi, Aug 24).
      className="motion-move group/dock absolute size-[16px] text-nav-fg-muted before:absolute before:top-[-7px] before:left-[-7px] before:size-[30px] before:content-[''] group-hover/row:text-nav-fg focus-visible:text-nav-fg"
      style={slot}
    >
      {/*
        Grows in place, from its own centre.

        It used to scale from the bottom edge and lift, which read as the row
        reflowing under the pointer — every pass moved things. Scaling about the
        centre keeps each icon exactly where it was and only makes it bigger, which
        is the whole of the affordance. The lift knob is still honoured, so the
        earlier behaviour can be dialled back in for comparison.
      */}
      <span className="motion-dock relative block origin-center group-hover/dock:-translate-y-[var(--t-dock-lift,0px)] group-hover/dock:scale-[var(--t-dock-scale,1.25)] group-focus-visible/dock:-translate-y-[var(--t-dock-lift,0px)] group-focus-visible/dock:scale-[var(--t-dock-scale,1.25)]">
        <span
          aria-hidden="true"
          className="motion-dock absolute top-[-6px] left-[-6px] size-[28px] rounded-full bg-nav-rail-hi opacity-0 group-hover/dock:opacity-100 group-focus-visible/dock:opacity-100"
        />
        {/*
          Sized by the dock knob, so a retuned dock takes the badge with it.
          The knockout paints the capsule's own fill — the badge sits on the
          rail, not on the nav behind it.
        */}
        <span
          className="relative block"
          style={{ width: "var(--t-dock-icon, 16px)", height: "var(--t-dock-icon, 16px)" }}
        >
          <ComposedIcon
            icon={Icon}
            {...(badge ? { badge } : {})}
            size={16}
            className="size-full"
          />
        </span>
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

  /*
   * The tooltip wraps the button rather than living inside it.
   *
   * `RailTooltip` measures its first child, and the button is the thing with a
   * box — the wrapper is `display: contents`, so the dock's absolute slot
   * geometry is untouched by it.
   */
  return titled ? (
    <RailTooltip label={label} placement={placement}>
      {button}
    </RailTooltip>
  ) : (
    button
  );
}

interface PinnedMorphProps {
  theme: SurfaceTheme;
  items: PinnedRailItem[];
  collapsed: boolean;
  onSelect?: (id: string) => void;
  /** Click the chevron — opens the manage surface. Click only, never hover. */
  onOpenLauncher: () => void;
  /** The launcher is open. */
  launcherActive: boolean;
  /** Pins that fall outside the visible row, which the badge counts. */
  overflowCount: number;
  /** Where an icon's name goes, or whether it appears at all. */
  dockLabel: DockLabel;
  /** Under the logo, or pinned to the nav's bottom edge. */
  dockPosition: DockPosition;
  /**
   * Pixels the capsule sits lower than its measured position, because something
   * was inserted above it. Geometry here is absolute in nav-wrapper coordinates
   * so the capsule can travel between nav faces, which means anything added above
   * it has to be passed in rather than pushing it in flow.
   */
  topOffset?: number;
  /**
   * Where the account switch has got to, so the capsule leaves and arrives with
   * the rest of the nav.
   *
   * It cannot ride the scroll region's wrapper the way every other block does —
   * it is drawn outside both nav faces so one element can morph between the two
   * layouts — so it plays the same animation on its own root instead. Pins are
   * per-account, so holding still through a switch would leave the previous
   * account's favourites sitting above the arriving account's list.
   */
  swap?: SwapPhase;
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
export function PinnedMorph({
  theme,
  items,
  collapsed,
  onSelect,
  onOpenLauncher,
  launcherActive,
  overflowCount,
  dockLabel,
  dockPosition,
  topOffset = 0,
  swap = "idle",
}: PinnedMorphProps) {
  const visible = items.slice(0, PINNED_VISIBLE);
  // Favourites plus the permanent grid chip.
  const g = collapsed ? collapsedGeometry(visible.length + 1) : expandedGeometry();
  const navWidth = collapsed ? COLLAPSED_NAV_WIDTH : EXPANDED_NAV_WIDTH;

  /*
   * Which slot the pointer is on, for the centred caption.
   *
   * Only `center` mode needs React state — `under` mode is pure CSS `:hover`,
   * which cannot be beaten for reliability. But a caption that names a *sibling*
   * cannot be done in CSS at all, so this one is driven from JS.
   *
   * An index, not a label: the captions slide in from the side the pointer came
   * from, and only a position can tell you which side that is.
   */
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const centred = dockLabel === "center" && g.showLabels;

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
    : "left-[12px] w-[248px] rounded-[30px] group-hover/row:left-0 group-hover/row:w-[272px] group-hover/row:rounded-none";

  /**
   * Which edge the band hangs from.
   *
   * Only the expanded band cares. Its height animates, so whichever edge it is
   * anchored to is the edge that stays still — and the icons have to be pinned to
   * that same edge or they slide 16px every time the band opens.
   */
  const anchoredToBottom = dockPosition === "bottom";

  /** Slot positions are wrapper-absolute; the row is the offset parent, so the
   *  offset cancels out here and is applied once to the row itself. */
  const slotTop = (i: number) => g.slots[i].top - g.container.top;
  const lastSlot = g.slots.length - 1;

  const slotStyle = (i: number): React.CSSProperties =>
    anchoredToBottom && !collapsed
      ? { left: g.slots[i].left, bottom: SLOT_INSET }
      : { left: g.slots[i].left, top: slotTop(i) };

  /**
   * Where the row itself sits.
   *
   * At the bottom it is measured from the nav's last edge rather than from the
   * header, so it stays put however long the product list gets — which is the whole
   * argument for the variant.
   */
  const rowPlacement: React.CSSProperties = anchoredToBottom
    ? { bottom: collapsed ? BOTTOM_BLOCK.padBottom : BOTTOM_BLOCK.padBottom }
    : { top: g.container.top + topOffset };

  /*
   * Gone for the length of the wait, not skeletonised.
   *
   * The face below still draws its PinnedHole — that is driven by whether pins
   * are shown, not by the switch — so the space stays reserved and nothing under
   * the capsule shifts while it is away. Unmounting here is also what restarts
   * the entrance: remounting on the way back to `idle` replays the animation
   * without needing a key to force it.
   */
  if (swap === "waiting") return null;

  return (
    <div
      data-nav-theme={theme}
      className={cn(
        "pointer-events-none absolute inset-0 z-30",
        swap === "leaving" ? "motion-nav-swap-out" : "motion-nav-swap-in",
      )}
    >
      {/*
        The whole row is the hover target, not each icon — the band should open
        as soon as the pointer enters the section. It has to be the icons'
        ancestor: as a sibling, moving onto an icon would make the row lose the
        pointer and fire pointerleave, flickering the band shut.
      */}
      <div
        className={cn(
          "motion-move group/row pointer-events-auto absolute",
          // Height comes from a variable, not the inline style, so `hover:` can
          // override it — an inline height would win over any class. Only the
          // captioned band opens; the others have nothing to open for.
          "h-[var(--band-h)]",
          centred && "hover:h-[var(--band-h-open)]",
        )}
        style={
          {
            left: 0,
            ...rowPlacement,
            width: navWidth,
            "--band-h": `${g.container.height}px`,
            "--band-h-open": `${CAPSULE.open}px`,
          } as React.CSSProperties
        }
      >
        <div
          aria-hidden="true"
          className={cn(
            /*
             * Fill only — no ring. The capsule's 1px stroke ran parallel to the
             * nav card's own left edge a few pixels away and the two read as a
             * doubled line (Khoi, Aug 24). The fill is what defines the capsule;
             * hover darkens it a step and pushes the icons to full ink, which is
             * also the stronger rollover the same review asked for.
             */
            "motion-move absolute inset-y-0 bg-nav-rail group-hover/row:bg-nav-rail-hover",
            capsuleClass,
          )}
        />

        {visible.map(({ id, label, icon, badge }, i) => (
          <DockButton
            key={id}
            label={label}
            icon={icon}
            {...(badge ? { badge } : {})}
            slot={slotStyle(i)}
            showLabel={g.showLabels && dockLabel === "under"}
            /*
              Named on hover unless a caption is already naming it.

              Both caption modes are suppressed, `center` included — it names
              the hovered icon too, and a pill saying the same words two
              hundred pixels away is a second answer to a question already
              answered. With no caption at all, which is the default, every
              icon gets one.
            */
            titled={!(g.showLabels && dockLabel !== "none")}
            placement={collapsed ? "right" : "below"}
            onClick={() => onSelect?.(id)}
            {...(centred
              ? {
                  onHoverChange: (hovered: boolean) =>
                    // Only the slot that claimed the caption may release it, so
                    // leaving one icon for the next never blanks the label
                    // between them.
                    setHoveredIndex((current) =>
                      hovered ? i : current === i ? null : current,
                    ),
                }
              : {})}
          />
        ))}

        {/*
          The fixed caption. One element whose text changes with the pointer —
          the review's alternative to a caption that tracks the icon.

          It sits *inside* the band, along its bottom edge. Outside it read as a
          stray line of text floating under the nav's first section with nothing
          holding it; inside, the band is visibly the thing being labelled. Being
          inside also means it can be bigger than the 8px tracking caption ever
          could, because it is no longer squeezed between two sections.

          It fades rather than mounting, so there is no layout step at all: at rest
          it is a transparent box exactly where it will be when it appears.
        */}
        {centred ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 h-0 w-0"
            // Mirrored with the band: it opens away from the icons, so the caption
            // takes the room that appears — below at the top of the nav, above when
            // the dock is pinned to the bottom edge.
            style={
              anchoredToBottom ? { top: CAPTION_TOP } : { bottom: CAPTION_BOTTOM }
            }
          >
            {/*
              Every caption is mounted at once, stacked on the same centre point.
              Only the hovered one is at rest; the ones to its left are parked a
              little left, the ones to its right a little right, all transparent.

              That is what makes them slide *past* each other: moving one icon
              right, the old caption travels out to the left while the new one
              arrives from the right, in the same gesture, because both are just
              transitioning to their new resting place. No keys, no timers, and no
              exit animation to coordinate — the direction falls out of which side
              of the pointer each caption is on.
            */}
            {visible.map(({ id, label }, i) => (
              <span
                key={id}
                className={cn(
                  "motion-dock absolute left-0 block text-[length:var(--t-dock-center-label,12px)] leading-none font-medium whitespace-nowrap text-nav-fg-muted",
                  // The wrapper is a zero-height point, so the caption has to hang
                  // from the same edge the wrapper was measured from — anchoring it
                  // to the other one puts it outside the band.
                  anchoredToBottom ? "top-0" : "bottom-0",
                  hoveredIndex === i
                    ? "translate-x-[-50%] opacity-100"
                    : hoveredIndex !== null && i < hoveredIndex
                      ? "translate-x-[calc(-50%-16px)] opacity-0"
                      : hoveredIndex !== null
                        ? "translate-x-[calc(-50%+16px)] opacity-0"
                        : // Nothing hovered: park them all centred, so the first
                          // caption of the next pass fades up rather than flying in
                          // from wherever the last pass happened to leave it.
                          "translate-x-[-50%] opacity-0",
                )}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}

        {/*
          The chevron that ends the chip row, and it is permanent: it is the
          product list, not an overflow symptom. A 9-dot grid sat here for a
          while and read as a second, competing app-switcher next to the account
          mark; the chevron says "more of this row" instead, and turns to face
          the panel while it is open.

          Click only, deliberately — the one trigger in the nav that does not open
          on hover. It sits in the row you sweep through on the way to everything
          else, so hover here fired constantly without being asked for; the review
          called that surprising and hard to dismiss. The product rows keep hover
          because you arrive at them on purpose.

          The count badge appears only when pins fall outside the visible row,
          which is what makes unlimited pinning safe: the row shows what fits,
          the panel holds the rest and says how many.
        */}
        <RailTooltip
          label={
            overflowCount > 0
              ? `All products · ${overflowCount} more pinned`
              : "All products"
          }
          placement={collapsed ? "right" : "below"}
        >
        <button
          type="button"
          aria-label={
            overflowCount > 0
              ? `All products, ${overflowCount} more pinned`
              : "All products"
          }
          aria-expanded={launcherActive}
          onClick={onOpenLauncher}
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
        </RailTooltip>
      </div>
    </div>
  );
}
