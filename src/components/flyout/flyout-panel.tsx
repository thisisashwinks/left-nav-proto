"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { BottomSlot } from "./bottom-slot";
import { FlyoutActionRow } from "./flyout-action-row";
import { FlyoutRow } from "./flyout-row";
import type { FlyoutConfig } from "./types";

interface FlyoutPanelProps {
  config: FlyoutConfig;
  /** Distance from the viewport's left edge — 272 when open, 64 when collapsed. */
  offsetLeft: number;
  theme: SurfaceTheme;
  onClose: () => void;
}

/**
 * The 360px flyout from left-nav.pen: absolutely positioned against the nav's
 * right edge, padded 14px with 16px at the bottom, 10px between blocks, and a
 * flex spacer that pins the bottom slot to the base of the panel.
 */
export function FlyoutPanel({
  config,
  offsetLeft,
  theme,
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
      tabIndex={-1}
      style={{ left: offsetLeft }}
      className="absolute top-0 bottom-0 z-30 flex w-[360px] flex-col items-start gap-[10px] overflow-y-auto bg-nav pt-[14px] pr-[14px] pb-[16px] pl-[14px] shadow-[8px_0_24px_0_var(--fly-shadow),inset_-1px_0_0_0_var(--fly-border)] outline-none"
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
            className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {config.entries.map((entry) =>
        entry.kind === "label" ? (
          <div
            key={entry.id}
            className={cn(
              "flex w-full shrink-0 items-start pt-[6px] pr-[2px] pl-[2px]",
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
            onSelect={setActiveId}
          />
        ),
      )}

      {config.cta ? <FlyoutActionRow row={config.cta} /> : null}

      <div className="w-full flex-1" />

      {config.bottom ? <BottomSlot slot={config.bottom} /> : null}
    </div>
  );
}
