"use client";

import type { SurfaceTheme } from "@/design/theme";
import { AiDock } from "./ai-dock";
import { CollapseToggle } from "./collapse-toggle";
import { EXPANDED_PINNED_BLOCK } from "./favorites-morph";
import { flyoutIdFor, navConfig } from "./nav-config";
import { NavDivider } from "./nav-divider";
import { NavHeader } from "./nav-header";
import { NavItemRow } from "./nav-item-row";
import { NavSectionLabel } from "./nav-section-label";
import type { NavConfig, NavItem } from "./types";

interface LeftNavProps {
  /** Drives [data-nav-theme], independent of the app's own theme. */
  theme: SurfaceTheme;
  config?: NavConfig;
  /** Row the user has selected. Null on first load — nothing is preselected. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Flyout currently showing — hovered if any, else pinned. */
  openFlyoutId: string | null;
  /** Flyout pinned by a click. Survives the pointer leaving. */
  pinnedFlyoutId: string | null;
  onHoverFlyout: (flyoutId: string) => void;
  onPinFlyout: (flyoutId: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSearch: () => void;
}

/**
 * The 272px expanded nav.
 *
 * Restructured from "Screen A · Nav open + Contacts" per the nav review: the
 * standing entry points (Recent, AI Agents, Quick Actions) sit in a fixed
 * cluster under the favourites dock so they never scroll away, the five product
 * groups and workspace links scroll below, and Settings is the last scrollable
 * row rather than a pinned footer — which frees the bottom edge for the AI dock.
 *
 * Row geometry is unchanged from the design: 272px wide, 1px right border, rows
 * padded 9px/8px with 2px between them.
 */
export function LeftNav({
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
  onSearch,
}: LeftNavProps) {
  const renderRow = (item: NavItem) => {
    const flyoutId = flyoutIdFor(item);
    return (
      <NavItemRow
        key={item.id}
        item={item}
        active={
          item.id === selectedId ||
          (item.hasFlyout === true &&
            (flyoutId === openFlyoutId || flyoutId === pinnedFlyoutId))
        }
        onSelect={() => {
          onSelect(item.id);
          if (item.hasFlyout) onPinFlyout(flyoutId);
        }}
        onHover={item.hasFlyout ? () => onHoverFlyout(flyoutId) : undefined}
      />
    );
  };

  return (
    <nav
      data-nav-theme={theme}
      aria-label="Main"
      // Pencil draws strokes over the box instead of adding to it, so every
      // border in the nav is an inset shadow. A real CSS border would steal a
      // pixel of content width and push every measurement off by one.
      className="flex h-full w-[272px] shrink-0 flex-col items-start overflow-hidden bg-nav shadow-[inset_-1px_0_0_0_var(--nav-border)]"
    >
      <NavHeader
        logoSrc={config.logoSrc}
        logoAlt={config.logoAlt}
        onSearch={onSearch}
      />

      {/*
        The pinned capsule itself is rendered by FavoritesMorph, outside both nav
        faces, so it can travel between the two layouts. This reserves its space.
      */}
      <div
        aria-hidden="true"
        className="w-full shrink-0"
        style={{ height: EXPANDED_PINNED_BLOCK }}
      />

      <div
        data-cursor="menu"
        className="flex w-full shrink-0 flex-col items-start gap-[var(--t-nav-space,2px)] px-[10px]"
      >
        {config.fixed.map(renderRow)}
      </div>

      <div className="w-full shrink-0 px-[10px]">
        <NavDivider />
      </div>

      <div
        data-cursor="menu"
        className="flex w-full flex-1 flex-col items-start gap-[var(--t-nav-space,2px)] overflow-y-auto px-[10px] pb-[2px]"
      >
        {config.entries.map((entry) => {
          if (entry.kind === "label") {
            return <NavSectionLabel key={entry.id} text={entry.text} />;
          }
          if (entry.kind === "divider") {
            return <NavDivider key={entry.id} />;
          }
          return renderRow(entry.item);
        })}
        {renderRow(config.settings)}
      </div>

      {/* AI takes the bottom bar; the drawer toggle sits at its right end. */}
      <div className="flex w-full shrink-0 items-end gap-[8px] px-[12px] pt-[8px] pb-[12px]">
        <AiDock collapsed={false} />
        <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
      </div>
    </nav>
  );
}
