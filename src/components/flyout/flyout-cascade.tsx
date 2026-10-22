"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { SurfaceTheme } from "@/design/theme";
import { focusFirstItem, menuKeyDown } from "@/lib/a11y";
import { cn } from "@/lib/utils";
import { cascadeIdFor, FLY_ROW_SELECTOR } from "./types";

/**
 * The L3 dropdown, and the L4 one beside it.
 *
 * One level per panel, stacked left to right off the L2 flyout's edge — the
 * desktop-menu cascade, which is the one three-level pattern people already
 * know without being taught.
 *
 * Sized to its contents rather than to the viewport, which is the whole
 * difference from the panel it hangs off: the L2 flyout is a full-height
 * surface because it is a place you browse, and an L3 list is four rows you
 * came for on purpose.
 *
 * Each level knows only its own anchor and the level before it. Positioning is
 * computed at open time and held, rather than recomputed on scroll: the panel
 * behind these does not scroll while a cascade is up (the pointer is out here),
 * and a live-tracking popover would spend its frames chasing something that
 * never moves.
 */
export interface CascadeLevel {
  /** The row this level hangs off — its id, for the parent's open state. */
  id: string;
  /** The anchoring row's name, which names this level for assistive tech. */
  label?: string;
  /** Where the anchoring row sits, sampled when it was opened. */
  anchor: { top: number; right: number };
  /** Rendered by the caller, which owns the row markup at every level. */
  body: React.ReactNode;
}

/** Gap between a panel and the surface it hangs off. */
const GAP = 4;
/** Kept clear of the viewport's bottom edge, so a long list never runs off. */
const EDGE = 12;

export function FlyoutCascade({
  levels,
  theme,
  onPointerEnter,
  onPointerLeave,
  onCloseLevel,
}: {
  levels: readonly CascadeLevel[];
  theme: SurfaceTheme;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  /** Keyboard only: ArrowLeft shuts the level at `depth` and everything past it. */
  onCloseLevel?: (depth: number) => void;
}) {
  return (
    <>
      {levels.map((level, i) => (
        <CascadePanel
          key={`${level.id}-${i}`}
          level={level}
          theme={theme}
          depth={i}
          {...(onPointerEnter ? { onPointerEnter } : {})}
          {...(onPointerLeave ? { onPointerLeave } : {})}
          {...(onCloseLevel ? { onCloseLevel } : {})}
        />
      ))}
    </>
  );
}

function CascadePanel({
  level,
  theme,
  depth,
  onPointerEnter,
  onPointerLeave,
  onCloseLevel,
}: {
  level: CascadeLevel;
  theme: SurfaceTheme;
  depth: number;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onCloseLevel?: (depth: number) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const id = cascadeIdFor(level.id);
  /*
   * Opened from the keyboard, the level takes focus on its first row.
   *
   * Only when the row that opened it is the focused element and is showing a
   * keyboard focus ring — a click or a hover leaves focus where it was.
   */
  React.useEffect(() => {
    const from = document.activeElement as HTMLElement | null;
    if (!from || from.getAttribute("aria-controls") !== id) return;
    if (!from.matches(":focus-visible")) return;
    focusFirstItem(ref.current, FLY_ROW_SELECTOR);
  }, [id]);
  /*
   * Nudged up only if it would run off the bottom.
   *
   * Measured after mount rather than guessed from the row count: the rows carry
   * tuning knobs, so their height is not a constant this file can know. Held in
   * state so the first paint is at the anchor and the correction is one frame
   * later — which reads as the panel settling, not as it jumping.
   */
  const [lift, setLift] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const overflow = box.bottom - (window.innerHeight - EDGE);
    setLift(overflow > 0 ? overflow : 0);
  }, [level.anchor.top, level.body]);

  return createPortal(
    <div
      ref={ref}
      id={id}
      role="group"
      {...(level.label ? { "aria-label": level.label } : {})}
      data-fly-cascade=""
      onKeyDown={(e) => {
        // A rename field keeps its own arrows and Home/End.
        if ((e.target as HTMLElement).closest("input, textarea")) return;
        if (menuKeyDown(e, ref.current, FLY_ROW_SELECTOR)) return;
        if (e.key !== "ArrowLeft" || !onCloseLevel) return;
        e.preventDefault();
        // Back to the row this level hangs off, then shut it.
        document
          .querySelector<HTMLElement>(`[aria-controls="${id}"]`)
          ?.focus({ preventScroll: true });
        onCloseLevel(depth);
      }}
      data-nav-theme={theme}
      data-cursor="menu"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{
        top: level.anchor.top - lift,
        left: level.anchor.right + GAP,
        // Above the L2 flyout (z-30) and each level above the last, so a
        // cascade never paints under the panel it came out of.
        zIndex: 40 + depth,
      }}
      className={cn(
        "motion-panel-in fixed flex min-w-[200px] max-w-[280px] flex-col gap-[1px] rounded-[10px] bg-nav p-[6px]",
        // A real shadow, unlike the L2 panel's hairlines: that one is the nav
        // continuing, and this one is genuinely floating over it. Without the
        // lift, two white surfaces 4px apart read as one with a scratch in it.
        "shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]",
      )}
    >
      {level.body}
    </div>,
    document.body,
  );
}
