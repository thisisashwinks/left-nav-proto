"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import { BottomSlot } from "./bottom-slot";
import { FlyoutActionRow } from "./flyout-action-row";
import { FlyoutRow } from "./flyout-row";
import type { FlyoutConfig } from "./types";

interface FlyoutPanelProps {
  config: FlyoutConfig;
  /** Distance from the viewport's left edge — 272 when open, 64 when collapsed. */
  offsetLeft: number;
  theme: SurfaceTheme;
  phase: TransitionPhase;
  /** Keeps the panel alive while the pointer is inside it. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onClose: () => void;
  /** Fired for row and L2-child clicks — the shell routes them to pages. */
  onNavigate?: (id: string) => void;
}

/**
 * Rows past this point animate with the same delay as the last one. Without a
 * cap, Everything-sized lists would still be cascading seconds after the panel
 * has settled.
 */
const MAX_STAGGERED_ROWS = 12;

/**
 * The 360px flyout from left-nav.pen: absolutely positioned against the nav's
 * right edge, padded 14px with 16px at the bottom, 10px between blocks, and a
 * flex spacer that pins the bottom slot to the base of the panel.
 */
export function FlyoutPanel({
  config,
  offsetLeft,
  theme,
  phase,
  onPointerEnter,
  onPointerLeave,
  onClose,
  onNavigate,
}: FlyoutPanelProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Escape closes, and focus moves into the panel so keyboard users land here
  // rather than back at the top of the document.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(scrollRef);

  return (
    <div
      ref={panelRef}
      data-nav-theme={theme}
      role="dialog"
      aria-label={config.title}
      data-cursor="menu"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      tabIndex={-1}
      style={{ left: offsetLeft }}
      className={cn(
        // The panel itself no longer scrolls — its middle does.
        //
        // As one scrolling box with a `flex-1` spacer pushing the bottom slot down,
        // a short screen collapsed the spacer to 0 and scrolled the featured block
        // and contextual help clean out of sight. Whatever is in that slot is the
        // reason the panel is 360px wide; it should be the last thing to go, not the
        // first. So the title and the slot are pinned and only the list moves.
        // Inset to match the nav card it docks against — a panel that ran the full
        // page height overhung the card by the gap at both ends. Left stays flush
        // rather than gapped: the pointer travels from a nav row into this panel,
        // and a dead strip between them would close it on the way.
        //
        // Rounded on the right only, and no border on the left. Both are the same
        // idea: this is the nav continuing, not a second card. A left radius would
        // cut a notch out of the seam, and a left border would sit against the
        // card's right border and read as one 2px line.
        "absolute top-[var(--shell-canvas-gap)] bottom-[var(--shell-canvas-gap)] z-30 flex w-[360px] flex-col items-start overflow-hidden rounded-r-[var(--shell-canvas-radius)] bg-nav pt-[14px] pb-[16px] outline-none",
        "shadow-[var(--shell-canvas-shadow),inset_0_1px_0_0_var(--fly-border),inset_-1px_0_0_0_var(--fly-border),inset_0_-1px_0_0_var(--fly-border)]",
        // `left` animates too, so the panel follows the nav edge when the rail
        // collapses underneath an open panel instead of jumping.
        "motion-move",
        phase === "entering" ? "motion-panel-in" : "motion-panel-out",
      )}
    >
      <div className="flex w-full shrink-0 items-center gap-[8px] px-[16px] pt-0 pb-[4px]">
        <div className="flex h-fit flex-1 items-center justify-between">
          <h2 className="text-[15px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
            {config.title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle motion-tap hover:bg-nav-hover hover:text-nav-fg-muted hover:rotate-90 active:scale-90"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        data-scroll-shell=""
        className="relative flex min-h-0 w-full flex-1 flex-col"
      >
        <div aria-hidden="true" data-scroll-fade="top" />
        <div
          ref={scrollRef}
          data-scroll-region=""
          className="flex w-full flex-1 flex-col items-start gap-[var(--t-fly-block-gap,10px)] overflow-y-auto px-[14px] pt-[var(--t-fly-block-gap,10px)]"
        >
      {config.entries.map((entry, i) =>
        entry.kind === "label" ? (
          <div
            key={entry.id}
            style={{ "--row-index": Math.min(i, MAX_STAGGERED_ROWS) } as React.CSSProperties}
            className={cn(
              "motion-row-in flex w-full shrink-0 items-start pt-[6px] pr-[2px] pl-[2px]",
              config.spaciousLabels ? "pb-[4px]" : "pb-[2px]",
            )}
          >
            {/*
              Explicit 13px line-height, not `normal`. As a flex item the span
              is blockified and takes its 14px font box rather than the 13px
              line box Pencil lays out, which would make the row 1px too tall.
            */}
            <span className="text-[11px] leading-[13px] font-semibold tracking-[0.5px] whitespace-nowrap text-nav-fg-subtle uppercase">
              {entry.text}
            </span>
          </div>
        ) : (
          <FlyoutRow
            key={entry.item.id}
            item={entry.item}
            variant={config.variant}
            active={entry.item.id === activeId}
            rowIndex={Math.min(i, MAX_STAGGERED_ROWS)}
            onSelect={(id) => {
              setActiveId(id);
              onNavigate?.(id);
            }}
          />
        ),
      )}

      {config.cta ? (
        <div
          style={
            {
              "--row-index": Math.min(config.entries.length, MAX_STAGGERED_ROWS),
            } as React.CSSProperties
          }
          className="motion-row-in w-full shrink-0"
        >
          <FlyoutActionRow row={config.cta} />
        </div>
      ) : null}
        </div>
        <div aria-hidden="true" data-scroll-fade="bottom" />
      </div>

      {/*
        Pinned below the scroll region, so it survives a short screen. Lands last,
        after the list has settled.
      */}
      {config.bottom ? (
        <div
          style={
            {
              "--row-index": Math.min(config.entries.length + 2, MAX_STAGGERED_ROWS + 2),
            } as React.CSSProperties
          }
          className="motion-row-in w-full shrink-0 px-[14px] pt-[var(--t-fly-block-gap,10px)]"
        >
          <BottomSlot slot={config.bottom} />
        </div>
      ) : null}
    </div>
  );
}
