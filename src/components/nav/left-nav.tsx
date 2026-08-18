"use client";

import * as React from "react";
import { History, Pin, Rocket } from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import type { WorkspaceScope } from "@/components/accounts/use-accounts";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import type { AiSession } from "@/components/ai/use-ai-session";
import type { DockPosition, SurfaceTheme } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { usePlanFor } from "@/components/customizer/customizer-profiles";
import { agencyEntries, agencySettings } from "./agency-config";
import { CollapseToggle } from "./collapse-toggle";
import { EntryCluster, EntryPill } from "./entry-cluster";
import { pinnedBlockFor } from "./favorites-morph";
import { IconPicker, useIconPicker } from "./icon-picker";
import { navEntriesFor } from "./nav-entries";
import { fixedEntriesFor, flyoutIdFor, navConfig } from "./nav-config";
import { NavDivider } from "./nav-divider";
import { NavHeader } from "./nav-header";
import { NavItemRow } from "./nav-item-row";
import { useNavRowEdit } from "./use-nav-row-edit";
import type { NavDensity } from "./use-nav-density";
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
  /**
   * Hovering a row with no flyout of its own. Fades the open preview after
   * the grace — the in-nav dismissal, so getting rid of a panel never means
   * travelling all the way across it (Khoi's distance note).
   */
  onHoverPlain?: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSearch: () => void;
  /** Whose nav this is: one sub-account, or the agency across all of them. */
  scope: WorkspaceScope;
  /** Identity in the header — the current account, or the agency at agency scope. */
  account: Account;
  /** Recently visited accounts, for the agency scope's Recent block. */
  recentAccounts: Account[];
  onSwitchAccount: (id: string) => void;
  switcherOpen: boolean;
  onToggleSwitcher: () => void;
  /** False for a plain sub-account user — the trigger renders inert. */
  canSwitch?: boolean;
  /** Owned by the shell, so the window can escape the nav's clipped box. */
  aiSession: AiSession;
  /**
   * How much vertical room the nav has. Measured by the shell on the wrapper both
   * faces share, so the two faces and the floating capsule can never disagree
   * about it.
   */
  density: NavDensity;
  /** Opens the manage surface — the floor tier's stand-in for the dock. */
  onOpenLauncher: () => void;
  /** How many inline recent rows to show, after the density budget. */
  recentsBudget: number;
}

/**
 * The 272px expanded nav.
 *
 * Restructured from "Screen A · Nav open + Contacts" per the nav review: the
 * standing entry points (Recent, AI Agents, Quick Actions) sit in a fixed
 * cluster under the favourites dock so they never scroll away, the product
 * groups and custom links scroll below, and Settings is the last scrollable
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
  onHoverPlain,
  collapsed,
  onToggleCollapsed,
  onSearch,
  scope,
  account,
  recentAccounts,
  onSwitchAccount,
  switcherOpen,
  onToggleSwitcher,
  canSwitch = true,
  aiSession,
  density,
  onOpenLauncher,
  recentsBudget,
}: LeftNavProps) {
  const {
    entryLayout,
    dockPosition,
    launchpad: launchpadSetting,
  } = useTheme().effective;
  const topEntry = entryLayout === "top";
  const atFloor = density === "floor";
  const agencyScope = scope === "agency";
  /*
   * The base plan has no setup-guide toggle: the row is always visible there. So
   * the plan substitutes for the setting rather than the customizer merely
   * showing a locked switch — the tiering is a property of the nav, not a claim
   * on a settings page. Owner key matches the shell's, so a switch moves this
   * with everything else.
   */
  const { has } = usePlanFor(agencyScope ? "agency" : account.id);
  const launchpad = has("launchpadToggle") ? launchpadSetting : true;
  const picker = useIconPicker();
  const { state, groups, editFor, pickerProps } = useNavRowEdit(picker);
  // At agency scope the middle block is the agency's own config — the grouping
  // modes, renames and volume switch stay a sub-account exercise.
  const entries = React.useMemo(
    () => (agencyScope ? agencyEntries : navEntriesFor(state, groups)),
    [agencyScope, state, groups],
  );

  // Recent names this account's own places, then the block is trimmed to what
  // the density and the recents mode allow. At agency scope the cluster is the
  // agency's, so it keeps the authored rows.
  const fixedEntries = React.useMemo(
    () =>
      trimRecents(
        agencyScope ? config.fixed : fixedEntriesFor(state, config.fixed),
        recentsBudget,
      ),
    [agencyScope, state, config.fixed, recentsBudget],
  );

  const scrollRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(scrollRef);

  const renderRow = (item: NavItem) => {
    const flyoutId = flyoutIdFor(item);
    // Inline edit is for the catalogue's rows; the agency config has no
    // override maps behind it yet, so its rows stay plain destinations.
    const edit = agencyScope ? undefined : editFor(item.id);
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
        onHover={item.hasFlyout ? () => onHoverFlyout(flyoutId) : onHoverPlain}
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
      //
      // No fill and no seam of its own: the chrome card in the shell paints the
      // surface this and the account rail share, so a face that painted itself
      // would draw a second box inside that one.
      className="flex h-full w-[272px] shrink-0 flex-col items-start overflow-hidden"
    >
      <NavHeader
        account={account}
        agency={agencyScope}
        // The config's demo logo pins the header to one asset; at agency scope
        // the identity is the agency's own mark, never that override.
        logoSrc={agencyScope ? undefined : config.logoSrc}
        logoAlt={config.logoAlt}
        switcherOpen={switcherOpen}
        onToggleSwitcher={onToggleSwitcher}
        canSwitch={canSwitch}
        // The drawer toggle holds the header's right edge in both
        // arrangements — collapsing is nav chrome, not entry, so it must not
        // move when the pill does. Per review: the toggle need not shift.
        trailing={
          <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
        }
      />

      {topEntry ? <EntryCluster onSearch={onSearch} session={aiSession} /> : null}

      {/*
        The pinned capsule itself is rendered by FavoritesMorph, outside both nav
        faces, so it can travel between the two layouts. This reserves its space —
        here when the dock sits under the logo, and after the scroll region when it
        is pinned to the nav's bottom edge.
      */}
      {dockPosition === "top" && !atFloor ? <PinnedHole position="top" /> : null}

      {/*
        The standing entry points normally sit above the scroll region so they never
        scroll away. At the floor they move *into* it: they are `shrink-0` inside an
        `overflow-hidden` nav with no page scroll behind it, so on a short enough
        screen they were being clipped and Quick Actions became permanently
        unreachable. A row you can scroll to beats a row pinned out of sight.
      */}
      {atFloor ? null : (
        <>
          {/*
            The zero-state setup guide (Mapping row 61): Launchpad as a
            temporary row while the account is being set up, not a permanent
            L1. First thing under the dock, only for accounts still
            onboarding — Brightpath in the demo — and it leaves on activation
            (toggle in the customizer's Appearance). Below the pinned hole,
            not above: the favourites capsule floats over the header block at
            a fixed offset, and a row slid in under the header sat beneath it.
          */}
          {launchpad && !agencyScope ? <SetupGuideRow /> : null}
          <div
            data-cursor="menu"
            className="flex w-full shrink-0 flex-col items-start gap-[var(--t-nav-space,2px)] px-[10px]"
          >
            {agencyScope ? (
              <RecentAccountsBlock
                accounts={recentAccounts}
                onSwitch={onSwitchAccount}
              />
            ) : (
              fixedEntries.map(renderEntry)
            )}
          </div>

          <div className="w-full shrink-0 px-[10px]">
            <NavDivider />
          </div>
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
          className="flex w-full flex-1 flex-col items-start gap-[var(--t-nav-space,2px)] overflow-y-auto px-[10px] pb-[2px]"
        >
          {atFloor ? (
            <>
              {agencyScope ? null : <FavoritesRow onOpen={onOpenLauncher} />}
              {agencyScope ? (
                <RecentAccountsBlock
                  accounts={recentAccounts}
                  onSwitch={onSwitchAccount}
                />
              ) : (
                fixedEntries.map(renderEntry)
              )}
              <NavDivider />
            </>
          ) : null}
          {entries.map(renderEntry)}
          {renderRow(agencyScope ? agencySettings : config.settings)}
        </div>
        <div aria-hidden="true" data-scroll-fade="bottom" />
      </div>

      {/*
        The same merged Search + Ask AI pill the `top` arrangement shows, holding
        the bottom edge instead — the two variants differ only in the pill's
        placement now, which is the comparison the review actually wants to
        make. The pill is alone down here: the drawer toggle stays up in the
        header either way.

        In `top` mode the footer is dropped entirely rather than left as an
        empty 48px strip. The nav simply ends with its last row, which is the
        point of the comparison: whether the bottom edge is worth spending on
        at all.
      */}
      {topEntry ? null : (
        <div className="flex w-full shrink-0 px-[12px] pt-[8px] pb-[12px]">
          <EntryPill onSearch={onSearch} session={aiSession} />
        </div>
      )}

      {/* Last in the nav, so the dock really is on its bottom edge. */}
      {dockPosition === "bottom" && !atFloor ? (
        <PinnedHole position="bottom" />
      ) : null}

      {pickerProps ? <IconPicker {...pickerProps} /> : null}
    </nav>
  );
}

/**
 * The agency's Recent block: the last sub-accounts visited, as compact rows
 * with the account's own mark where a product row has its icon. Clicking one
 * is the fast path back into a client — the block plays the role the client
 * nav's Recent products play, at the unit the agency thinks in.
 */
function RecentAccountsBlock({
  accounts,
  onSwitch,
}: {
  accounts: Account[];
  onSwitch: (id: string) => void;
}) {
  if (accounts.length === 0) return null;
  return (
    <>
      <NavSectionLabel text="Recent accounts" />
      {accounts.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => onSwitch(account.id)}
          className="motion-tap flex w-full items-center gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] py-[6px] text-left hover:bg-nav-hover active:scale-[0.99]"
        >
          <AccountLogo logo={account.logo} src={account.logoSrc} size={16} radius={999} />
          <span
            className="truncate leading-[20px] text-nav-fg"
            style={{ fontSize: "calc(var(--t-nav-font, 14px) - 0.5px)" }}
          >
            {account.name}
          </span>
        </button>
      ))}
    </>
  );
}

/**
 * Favourites as a plain scrollable row, for the floor tier.
 *
 * The capsule cannot simply join the scroll region: FavoritesMorph positions it with
 * absolute coordinates in nav-wrapper space, and the faces only reserve a hole in
 * flow, so moving the hole would leave the capsule behind. Rather than refactor that
 * geometry for the smallest screens, the floor swaps the dock for one row that opens
 * the same manage surface — the favourites are still one click away, and every row
 * in the nav is reachable.
 */
function FavoritesRow({ onOpen }: { onOpen: () => void }) {
  return (
    <NavItemRow
      item={{ id: "favorites-row", label: "Pinned", icon: Pin, hasFlyout: true }}
      onSelect={onOpen}
    />
  );
}

/**
 * Drops inline recent rows past the budget, keeping the most recent ones.
 *
 * Operates on entries rather than on the config so the section label goes with them:
 * a "RECENT" heading over nothing but a "More" row is worse than no heading. At a
 * budget of zero the whole block goes and Recent lives behind its own row.
 */
function trimRecents(entries: NavEntry[], budget: number): NavEntry[] {
  const isRecentRow = (e: NavEntry) =>
    e.kind === "item" && e.item.id.startsWith("recent-") && e.item.id !== "recent-more";

  const total = entries.filter(isRecentRow).length;
  if (budget >= total) return entries;

  let seen = 0;
  const kept = entries.filter((e) => {
    if (!isRecentRow(e)) return true;
    seen += 1;
    return seen <= budget;
  });

  if (budget > 0) return kept;

  /*
   * With no rows above it, the block's section label goes — and the door stops
   * being "More".
   *
   * "More" only means anything as the tail of a visible list. On its own it is more
   * than nothing, so the row takes the name and the icon the rail already uses for
   * the same destination: Recent, with a history glyph.
   */
  return kept
    .filter((e) => !(e.kind === "label" && e.id === "recent-label"))
    .map((e) =>
      e.kind === "item" && e.item.id === "recent-more"
        ? { kind: "item", item: { ...e.item, label: "Recent", icon: History } }
        : e,
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

/**
 * The zero-state setup guide row. Deliberately reads as a guest, not a
 * product: a soft brand wash and a progress meter say "temporary, almost
 * done" — the whole point (Mapping 61) is that this row EARNS its exit.
 */
function SetupGuideRow() {
  const done = 4;
  const total = 7;
  return (
    <div className="w-full shrink-0 px-[10px] pt-[2px] pb-[6px]">
      <button
        type="button"
        className="motion-tap group flex w-full flex-col gap-[7px] rounded-[9px] bg-brand-soft px-[10px] py-[9px] text-left shadow-[inset_0_0_0_1px_var(--brand)] hover:brightness-[1.02] active:scale-[0.99]"
      >
        <span className="flex w-full items-center gap-[8px]">
          <Rocket size={15} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] font-semibold text-brand-strong">
            Getting started
          </span>
          <span className="shrink-0 text-[11.5px] leading-none font-medium text-brand-strong opacity-80">
            {done} of {total}
          </span>
        </span>
        {/* The meter is the row's exit visa: at 7/7 the row leaves the nav. */}
        <span className="h-[3px] w-full overflow-hidden rounded-full bg-brand-soft-2">
          <span
            className="block h-full rounded-full bg-brand motion-move"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </span>
      </button>
    </div>
  );
}
