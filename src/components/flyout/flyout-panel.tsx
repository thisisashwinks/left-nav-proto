"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { TransitionPhase } from "@/lib/use-exit-transition";
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
        "absolute top-0 bottom-0 z-30 flex w-[360px] flex-col items-start gap-[var(--t-fly-block-gap,10px)] overflow-y-auto bg-nav pt-[14px] pr-[14px] pb-[16px] pl-[14px] shadow-[8px_0_24px_0_var(--fly-shadow),inset_-1px_0_0_0_var(--fly-border)] outline-none",
        // `left` animates too, so the panel follows the nav edge when the rail
        // collapses underneath an open panel instead of jumping.
        "motion-move",
        phase === "entering" ? "motion-panel-in" : "motion-panel-out",
      )}
    >
      <div className="flex w-full shrink-0 items-center gap-[8px] pt-0 pr-[2px] pb-[4px] pl-[2px]">
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
            onSelect={setActiveId}
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

      <div data-cursor="inert" className="w-full flex-1" />

      {/* The bottom slot lands last, after the list has settled. */}
      {config.bottom ? (
        <div
          style={
            {
              "--row-index": Math.min(config.entries.length + 2, MAX_STAGGERED_ROWS + 2),
            } as React.CSSProperties
          }
          className="motion-row-in w-full shrink-0"
        >
          <BottomSlot slot={config.bottom} />
        </div>
      ) : null}
    </div>
  );
}
