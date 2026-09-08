"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";

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
}: {
  levels: readonly CascadeLevel[];
  theme: SurfaceTheme;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
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
}: {
  level: CascadeLevel;
  theme: SurfaceTheme;
  depth: number;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
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
      role="menu"
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
