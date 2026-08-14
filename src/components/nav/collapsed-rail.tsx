"use client";

import * as React from "react";
import { PanelLeftOpen, Pin } from "lucide-react";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import type { WorkspaceScope } from "@/components/accounts/use-accounts";
import type { AiSession } from "@/components/ai/use-ai-session";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import type { SurfaceTheme } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { EntryClusterRail } from "./entry-cluster";
import { agencyEntries, agencySettings } from "./agency-config";
import { collapsedPinnedBlock, PINNED_VISIBLE } from "./favorites-morph";
import { navEntriesFor } from "./nav-entries";
import { useNavLayout } from "./nav-layout-provider";
import { flyoutIdFor, navConfig } from "./nav-config";
import { RailTooltip } from "./rail-tooltip";
import type { NavDensity } from "./use-nav-density";
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
  /** Hovering a row with no flyout — fades the open preview after the grace. */
  onHoverPlain?: () => void;
  onSearch: () => void;
  /** Whose nav this is: one sub-account, or the agency across all of them. */
  scope: WorkspaceScope;
  /** Identity behind the rail's mark — the account, or the agency at agency scope. */
  account: Account;
  switcherOpen: boolean;
  onToggleSwitcher: () => void;
  /** False for a plain sub-account user — the mark renders inert. */
  canSwitch?: boolean;
  /** Reopens the expanded nav. Lives right under the mark, not in the app bar. */
  onExpand: () => void;
  /** Owned by the shell, so the window can escape the rail's clipped box. */
  aiSession: AiSession;
  /** Measured by the shell on the wrapper both faces share. */
  density: NavDensity;
  /** Opens the manage surface — the floor tier's stand-in for the capsule. */
  onOpenLauncher: () => void;
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
  onHoverPlain,
  onSearch,
  scope,
  account,
  switcherOpen,
  onToggleSwitcher,
  canSwitch = true,
  onExpand,
  aiSession,
  density,
  onOpenLauncher,
}: CollapsedRailProps) {
  const atFloor = density === "floor";
  const agencyScope = scope === "agency";
  const scrollRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(scrollRef);
  // The capsule hugs its contents when collapsed, so the hole left for it has to
  // match. Read from the same store the capsule does rather than take a prop, so
  // the two can never disagree.
  const { entryLayout, dockPosition } = useTheme().effective;
  const topEntry = entryLayout === "top";
  const { state: layout, groups } = useNavLayout();
  const pinnedBlock = collapsedPinnedBlock(
    Math.min(layout.pinned.length, PINNED_VISIBLE) + 1,
  );
  // Same derivation as the expanded nav, so the two faces always hold the same
  // rows. Editing is not offered here — there is no visible label to rename, so
  // the rail shows the result of an edit rather than being a place to make one.
  const entries = React.useMemo(
    () => (agencyScope ? agencyEntries : navEntriesFor(layout, groups)),
    [agencyScope, layout, groups],
  );

  const railButton = (
    id: string,
    label: string,
    content: React.ReactNode,
    active: boolean,
    onClick: () => void,
    onHover?: () => void,
    /** Rows with no flyout get a label tooltip instead. */
    tooltip = false,
  ) => {
    const button = (
      <button
        key={id}
        type="button"
        // A tooltip replaces the native title rather than joining it.
        title={tooltip ? undefined : label}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        onPointerEnter={onHover}
        onFocus={onHover}
        className={cn(
          // Radius comes from the same knob the expanded rows use — it is one
          // row treatment seen two ways, so it must not drift when retuned.
          "flex h-[35px] w-[40px] shrink-0 items-center justify-center rounded-[var(--t-nav-radius,7px)]",
          "motion-tap hover:scale-105 active:scale-95 motion-press",
          active
            ? "bg-nav-hover text-nav-fg"
            : "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
        )}
      >
        {content}
      </button>
    );

    return tooltip ? (
      <RailTooltip key={id} label={label}>
        {button}
      </RailTooltip>
    ) : (
      button
    );
  };

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
        <i.icon
          size={16}
          aria-hidden="true"
          // Same knob as the expanded row's icon. The rail tile stays 40x35, so
          // the icon grows inside it rather than resizing the tile.
          style={{
            width: "var(--t-nav-icon, 16px)",
            height: "var(--t-nav-icon, 16px)",
          }}
        />
      ) : null,
      i.id === selectedId ||
        (i.hasFlyout === true &&
          (flyoutId === openFlyoutId || flyoutId === pinnedFlyoutId)),
      () => {
        onSelect(i.id);
        if (i.hasFlyout) onPinFlyout(flyoutId);
      },
      i.hasFlyout ? () => onHoverFlyout(flyoutId) : onHoverPlain,
      i.hasFlyout !== true,
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
      // pt 11: the 26px mark centres on y=24, the app header's midline —
      // matching the expanded header row and the account rail's plate. 26,
      // not 30 (Aug 13 review): the mark was crowding the AI orb visually.
      className="flex h-full w-[64px] shrink-0 flex-col items-center gap-[4px] overflow-hidden bg-nav pt-[11px] pr-[8px] pb-[3px] pl-[8px] shadow-[inset_-1px_0_0_0_var(--nav-border)]"
    >
      {/*
        The rail has no room for a name or a chevron, so the mark itself is the
        switcher trigger — same panel, anchored to this tile instead. A plain
        sub-account user has nothing to switch to, so the mark goes inert.
      */}
      {canSwitch ? (
        <button
          type="button"
          title={`Switch sub-account — ${account.name}`}
          aria-label={`Switch sub-account. Current account: ${account.name}`}
          aria-haspopup="dialog"
          aria-expanded={switcherOpen}
          onClick={onToggleSwitcher}
          className={cn(
            "motion-tap flex size-[26px] shrink-0 items-center justify-center outline-none",
            switcherOpen ? "scale-105" : "hover:scale-105 active:scale-95",
          )}
        >
          <AccountLogo
            logo={account.logo}
            src={agencyScope ? account.logoSrc : (config.logoSrc ?? account.logoSrc)}
            size={26}
            radius={999}
          />
        </button>
      ) : (
        <span
          title={account.name}
          className="flex size-[26px] shrink-0 items-center justify-center"
        >
          <AccountLogo
            logo={account.logo}
            src={config.logoSrc ?? account.logoSrc}
            size={26}
            radius={999}
          />
        </span>
      )}

      {/*
        Reopening the nav happens right under the mark — inside the rail the
        drawer belongs to, not off in the app bar (Aug 11 ask). Same glyph and
        size as the expanded header's toggle, so it reads as the same control.
      */}
      <RailTooltip label="Expand navigation">
        <button
          type="button"
          aria-label="Expand navigation"
          onClick={onExpand}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95 motion-press"
        >
          <PanelLeftOpen size={16} aria-hidden="true" />
        </button>
      </RailTooltip>

      {/*
        In `bottom` mode the pair has moved down with the pill, so nothing
        stands between the mark and the rows — search is no longer a separate
        control that only exists in one arrangement.
      */}
      {topEntry ? (
        <EntryClusterRail onSearch={onSearch} session={aiSession} />
      ) : null}

      {/*
        Reserved space for the pinned capsule, which FavoritesMorph renders
        outside both nav faces so it can travel between the two layouts.
      */}
      {dockPosition === "top" && !atFloor ? (
        <div
          aria-hidden="true"
          className="w-[44px] shrink-0"
          style={{ height: pinnedBlock }}
        />
      ) : null}

      {/*
        Row spacing tracks the expanded nav's knob, offset by the 2px the rail
        measures wider — with no labels to separate the rows, the design gives
        them more air. Sharing the knob keeps the two faces moving together;
        the offset keeps each at its own measured default.
      */}
      {/*
        As in the expanded nav, the fixed cluster joins the scroll at the floor. The
        rail is the worse case: 440px of chrome, so a 380px rail had a 0px scroll
        region with every product row unreachable.
      */}
      {/*
        The client's fixed cluster is Recent-products plus the AI pair; the
        agency scope has no equivalent yet, so its rail goes straight to the
        groups rather than showing rows that would open client panels.
      */}
      {atFloor || agencyScope ? null : (
        <>
          <div className="flex w-full flex-col items-center gap-[calc(var(--t-nav-space,2px)+2px)]">
            {config.railFixed.map(renderRailRow)}
          </div>
          {divider("div-fixed")}
        </>
      )}

      <div
        data-scroll-shell=""
        className="relative flex min-h-0 w-full flex-1 flex-col"
      >
        <div aria-hidden="true" data-scroll-fade="top" />
        <div
          ref={scrollRef}
          data-scroll-region=""
          data-cursor="menu"
          className="flex w-full flex-1 flex-col items-center gap-[calc(var(--t-nav-space,2px)+2px)] overflow-y-auto"
        >
          {atFloor && !agencyScope ? (
            <>
              {railButton("favorites-rail", "Pinned", <Pin size={16} aria-hidden="true" />, false, onOpenLauncher, undefined, true)}
              {config.railFixed.map(renderRailRow)}
              {divider("div-fixed-floor")}
            </>
          ) : null}
          {entries.map((entry) =>
            entry.kind === "item" ? (
              renderRailRow(entry.item)
            ) : entry.kind === "divider" ? (
              divider(entry.id)
            ) : null,
          )}
          {renderRailRow(agencyScope ? agencySettings : config.settings)}
        </div>
        <div aria-hidden="true" data-scroll-fade="bottom" />
      </div>

      {/*
        The same stacked pair the `top` arrangement shows under the logo — the
        expanded nav's merged pill, seen at rail width — holding the bottom
        edge instead. Nothing else joins it: expanding the rail is done from
        the app bar's far left in both arrangements, so the entry point is the
        only thing that moves between them.
      */}
      {topEntry ? null : (
        <div className="flex shrink-0 flex-col items-center pt-[6px]">
          <EntryClusterRail onSearch={onSearch} session={aiSession} />
        </div>
      )}

      {/* Last in the rail, so the capsule really is on its bottom edge. */}
      {dockPosition === "bottom" && !atFloor ? (
        <div
          aria-hidden="true"
          className="w-[44px] shrink-0"
          style={{ height: pinnedBlock + 12 }}
        />
      ) : null}
    </nav>
  );
}
