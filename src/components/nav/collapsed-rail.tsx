"use client";

import { Search } from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { AiDock } from "./ai-dock";
import { CollapseToggle } from "./collapse-toggle";
import { COLLAPSED_PINNED_BLOCK } from "./favorites-morph";
import { flyoutIdFor, navConfig } from "./nav-config";
import type { NavConfig, NavItem } from "./types";

interface CollapsedRailProps {
  theme: SurfaceTheme;
  config?: NavConfig;
  /** Row the user has selected. Shared with the expanded nav. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Flyout currently showing — hovered if any, else pinned. */
  openFlyoutId: string | null;
  /** Flyout pinned by a click. Survives the pointer leaving. */
  pinnedFlyoutId: string | null;
  onHoverFlyout: (id: string) => void;
  onPinFlyout: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/**
 * The 64px icon rail from the CollapsedRail component in left-nav.pen.
 *
 * Geometry: 64px wide, padded 12px 8px with 4px between children, a 30px logo
 * mark, a 38px search button, the pinned favourites capsule (44px wide, 22px
 * radius, 40x30 slots), then 40x35 icon buttons separated by inset dividers.
 */
export function CollapsedRail({
  theme,
  config = navConfig,
  selectedId,
  onSelect,
  openFlyoutId,
  pinnedFlyoutId,
  onHoverFlyout,
  onPinFlyout,
  collapsed,
  onToggleCollapsed,
}: CollapsedRailProps) {
  const railButton = (
    id: string,
    label: string,
    content: React.ReactNode,
    active: boolean,
    onClick: () => void,
    onHover?: () => void,
  ) => (
    <button
      key={id}
      type="button"
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      onPointerEnter={onHover}
      onFocus={onHover}
      className={cn(
        "flex h-[35px] w-[40px] shrink-0 items-center justify-center rounded-[7px]",
        "motion-tap hover:scale-105 active:scale-95 motion-press",
        active
          ? "bg-nav-hover text-nav-fg"
          : "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
      )}
    >
      {content}
    </button>
  );

  const divider = (key: string) => (
    <div key={key} className="flex w-full shrink-0 items-start px-[8px] py-[4px]">
      <div className="h-px flex-1 bg-nav-divider" />
    </div>
  );

  const renderRailRow = (i: NavItem) => {
    const flyoutId = flyoutIdFor(i);
    return railButton(
      i.id,
      i.label,
      i.ai ? (
        <NavAiSparkle className="text-nav-ai-icon" />
      ) : i.icon ? (
        <i.icon size={16} aria-hidden="true" />
      ) : null,
      i.id === selectedId ||
        (i.hasFlyout === true &&
          (flyoutId === openFlyoutId || flyoutId === pinnedFlyoutId)),
      () => {
        onSelect(i.id);
        if (i.hasFlyout) onPinFlyout(flyoutId);
      },
      i.hasFlyout ? () => onHoverFlyout(flyoutId) : undefined,
    );
  };

  return (
    <nav
      data-nav-theme={theme}
      aria-label="Main"
      data-cursor="menu"
      // Bottom padding is 3px, not the design's 12px, on purpose: the Pencil
      // file puts the Settings icon at y-centre 910.5 here but 920 in the
      // expanded footer, so collapsing made the icon hop 9.5px. Holding the
      // expanded baseline is worth the deviation.
      className="flex h-full w-[64px] shrink-0 flex-col items-center gap-[4px] overflow-hidden bg-nav pt-[12px] pr-[8px] pb-[3px] pl-[8px] shadow-[inset_-1px_0_0_0_var(--nav-border)]"
    >
      <div
        role="img"
        aria-label={config.logoAlt}
        className="flex size-[30px] shrink-0 items-center justify-center rounded-[7px] bg-nav-fg"
      >
        <span className="text-[13px] leading-none font-bold text-nav">A</span>
      </div>

      <button
        type="button"
        title="Search"
        aria-label="Search"
        className="motion-tap flex size-[38px] shrink-0 items-center justify-center rounded-[9px] text-nav-fg-subtle hover:scale-105 hover:bg-nav-hover hover:text-nav-fg-muted active:scale-95"
      >
        <Search size={16} aria-hidden="true" />
      </button>

      {/*
        Reserved space for the pinned capsule, which FavoritesMorph renders
        outside both nav faces so it can travel between the two layouts.
      */}
      <div
        aria-hidden="true"
        className="w-[44px] shrink-0"
        style={{ height: COLLAPSED_PINNED_BLOCK }}
      />

      <div className="flex w-full flex-col items-center gap-[4px]">
        {config.fixed.map(renderRailRow)}
      </div>

      {divider("div-fixed")}

      <div
        data-cursor="menu"
        className="flex w-full flex-1 flex-col items-center gap-[4px] overflow-y-auto"
      >
        {config.entries.map((entry) =>
          entry.kind === "item" ? (
            renderRailRow(entry.item)
          ) : entry.kind === "divider" ? (
            divider(entry.id)
          ) : null,
        )}
        {renderRailRow(config.settings)}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-[6px] pt-[6px]">
        <AiDock collapsed />
        <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
      </div>
    </nav>
  );
}
