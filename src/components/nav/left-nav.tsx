"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { AiDock } from "@/components/ai/ai-dock";
import type { AiSession } from "@/components/ai/use-ai-session";
import type { DockPosition, SurfaceTheme } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { CollapseToggle } from "./collapse-toggle";
import { EntryCluster } from "./entry-cluster";
import { pinnedBlockFor } from "./favorites-morph";
import { IconPicker, useIconPicker } from "./icon-picker";
import { navEntriesFor } from "./nav-entries";
import { flyoutIdFor, navConfig } from "./nav-config";
import { NavDivider } from "./nav-divider";
import { NavHeader } from "./nav-header";
import { NavItemRow } from "./nav-item-row";
import { useNavRowEdit } from "./use-nav-row-edit";
import { NavSectionLabel } from "./nav-section-label";
import type { NavConfig, NavEntry, NavItem } from "./types";

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
  /** Sub-account the session is in. Shown in the header's switcher trigger. */
  account: Account;
  switcherOpen: boolean;
  onToggleSwitcher: () => void;
  /** Owned by the shell, so the window can escape the nav's clipped box. */
  aiSession: AiSession;
}

/**
 * The 272px expanded nav.
 *
 * Restructured from "Screen A · Nav open + Contacts" per the nav review: the
 * standing entry points (Recent, AI Agents, Quick Actions) sit in a fixed
 * cluster under the favourites dock so they never scroll away, the product
 * groups and workspace links scroll below, and Settings is the last scrollable
 * row rather than a pinned footer — which frees the bottom edge for the AI dock.
 *
 * The middle block is derived from the active grouping mode rather than authored,
 * so switching between product groups, jobs, a flat list and the user's own
 * groups changes what the nav contains without changing how it is drawn.
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
  account,
  switcherOpen,
  onToggleSwitcher,
  aiSession,
}: LeftNavProps) {
  const { entryLayout, dockPosition } = useTheme();
  const topEntry = entryLayout === "top";
  const picker = useIconPicker();
  const { state, groups, editFor, pickerProps } = useNavRowEdit(picker);
  const entries = React.useMemo(
    () => navEntriesFor(state, groups),
    [state, groups],
  );

  const renderRow = (item: NavItem) => {
    const flyoutId = flyoutIdFor(item);
    const edit = editFor(item.id);
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
        {...(edit ? { edit } : {})}
      />
    );
  };

  const renderEntry = (entry: NavEntry) => {
    if (entry.kind === "label") {
      return <NavSectionLabel key={entry.id} text={entry.text} />;
    }
    if (entry.kind === "divider") {
      return <NavDivider key={entry.id} />;
    }
    return renderRow(entry.item);
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
        account={account}
        logoSrc={config.logoSrc}
        logoAlt={config.logoAlt}
        switcherOpen={switcherOpen}
        onToggleSwitcher={onToggleSwitcher}
        // In `top` mode search has moved down into the merged control, so the
        // header's right edge goes to the drawer toggle — otherwise the toggle
        // would be the only thing left in a 48px footer.
        trailing={
          topEntry ? (
            <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
          ) : (
            <HeaderSearchButton onSearch={onSearch} />
          )
        }
      />

      {topEntry ? <EntryCluster onSearch={onSearch} session={aiSession} /> : null}

      {/*
        The pinned capsule itself is rendered by FavoritesMorph, outside both nav
        faces, so it can travel between the two layouts. This reserves its space —
        here when the dock sits under the logo, and after the scroll region when it
        is pinned to the nav's bottom edge.
      */}
      {dockPosition === "top" ? <PinnedHole position="top" /> : null}

      <div
        data-cursor="menu"
        className="flex w-full shrink-0 flex-col items-start gap-[var(--t-nav-space,2px)] px-[10px]"
      >
        {config.fixed.map(renderEntry)}
      </div>

      <div className="w-full shrink-0 px-[10px]">
        <NavDivider />
      </div>

      <div
        data-cursor="menu"
        className="flex w-full flex-1 flex-col items-start gap-[var(--t-nav-space,2px)] overflow-y-auto px-[10px] pb-[2px]"
      >
        {entries.map(renderEntry)}
        {renderRow(config.settings)}
      </div>

      {/*
        AI takes the bottom bar; the drawer toggle sits at its right end, centred
        against the pill rather than sharing its baseline — the toggle is 28px
        and the pill 38px, so bottom-aligning them dropped the toggle 5px low.

        In `top` mode both have moved up, so the footer is dropped entirely rather
        than left as an empty 48px strip. The nav simply ends with its last row,
        which is the point of the comparison: whether the bottom edge is worth
        spending on at all.
      */}
      {topEntry ? null : (
        <div className="flex w-full shrink-0 items-center gap-[8px] px-[12px] pt-[8px] pb-[12px]">
          <AiDock collapsed={false} session={aiSession} />
          <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
        </div>
      )}

      {/* Last in the nav, so the dock really is on its bottom edge. */}
      {dockPosition === "bottom" ? <PinnedHole position="bottom" /> : null}

      {pickerProps ? <IconPicker {...pickerProps} /> : null}
    </nav>
  );
}

/** Reserves the space the floating capsule occupies, so nothing sits under it. */
function PinnedHole({ position }: { position: DockPosition }) {
  return (
    <div
      aria-hidden="true"
      className="w-full shrink-0"
      style={{ height: pinnedBlockFor(position) }}
    />
  );
}

/** The header's search icon, for the arrangement where search lives up here. */
function HeaderSearchButton({ onSearch }: { onSearch: () => void }) {
  return (
    <button
      type="button"
      title="Search"
      aria-label="Search"
      onClick={onSearch}
      className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted active:scale-95"
    >
      <Search size={16} aria-hidden="true" />
    </button>
  );
}
