"use client";

import * as React from "react";
import {
  AccountRail,
  ACCOUNT_RAIL_EXPANDED_WIDTH,
  ACCOUNT_RAIL_WIDTH,
} from "@/components/accounts/account-rail";
import { AccountSwitcher } from "@/components/accounts/account-switcher";
import { RailSwitcher } from "@/components/accounts/rail-switcher";
import { useAccounts } from "@/components/accounts/use-accounts";
import { AiWindow } from "@/components/ai/ai-window";
import { useAiSession } from "@/components/ai/use-ai-session";
import { flyouts } from "@/components/flyout/flyout-config";
import { FlyoutPanel } from "@/components/flyout/flyout-panel";
import { AppHeader } from "@/components/header/app-header";
import { CollapsedRail } from "@/components/nav/collapsed-rail";
import {
  ENTRY_CLUSTER_HEIGHT,
  ENTRY_CLUSTER_RAIL_HEIGHT,
} from "@/components/nav/entry-cluster";
import { FavoritesMorph } from "@/components/nav/favorites-morph";
import {
  densityVars,
  recentsBudgetFor,
  useNavDensity,
} from "@/components/nav/use-nav-density";
import { LeftNav } from "@/components/nav/left-nav";
import { agencyFlyouts, agencyPinned } from "@/components/nav/agency-config";
import {
  accountSettingsFlyout,
  agencySettingsFlyout,
  SETTINGS_FLYOUT_ID,
} from "@/components/nav/settings-config";
import { productById } from "@/components/nav/catalogue";
import { flyoutForGroup } from "@/components/nav/group-flyout";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { PinnedLauncher } from "@/components/nav/pinned-launcher";
import { UndoToast } from "@/components/nav/undo-toast";
import { PINNED_VISIBLE } from "@/components/nav/favorites-morph";
import { AccountsIndexPage } from "@/components/customizer/accounts-index";
import { CustomizerPage } from "@/components/customizer/customizer-page";
import { CommandPalette } from "@/components/search/command-palette";
import { SearchFlyout } from "@/components/search/search-flyout";
import {
  ACCOUNT_BANNERS,
  AGENCY_BANNERS,
  TopBanner,
} from "@/components/shell/top-banner";
import { AUTO_COLLAPSE_WIDTH } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { useTuning } from "@/components/tuning/tuning-provider";
import { cn } from "@/lib/utils";
import { useExitTransition } from "@/lib/use-exit-transition";
import { useFlyoutIntent } from "@/lib/use-flyout-intent";
import { useMediaQuery } from "@/lib/use-media-query";

/** Nav widths from left-nav.pen; the flyout docks against whichever is showing. */
const EXPANDED_WIDTH = 272;
const COLLAPSED_WIDTH = 64;

/** Must match --dur-fast, which drives the panel's exit animation. */
const FLYOUT_EXIT_MS = 140;

/** Same, for the Ask AI window's exit. */
const AI_EXIT_MS = 140;

/** Same again, for the account switcher's exit. */
const SWITCHER_EXIT_MS = 140;

/**
 * Where the account switcher hangs from, per nav face: 6px below its trigger and
 * flush with the trigger's left edge, so the panel reads as growing out of it.
 * Expanded, the trigger is the 30px chip at y14 inside the nav's 12px padding,
 * whose hover surface starts 6px in; collapsed, it is the 30px mark at y12
 * inside the rail's 8px padding.
 */
/**
 * The launcher's id in the flyout intent. Deliberately not a key in `flyouts`:
 * it has its own component, so the generic panel must not claim it.
 */
const LAUNCHER_ID = "launcher";

const SWITCHER_ANCHOR = {
  expanded: { left: 6, top: 50 },
  collapsed: { left: 8, top: 48 },
} as const;

/**
 * How long the panel survives the pointer leaving. Long enough to cross the
 * seam between a trigger and the panel, or between two triggers, without the
 * panel closing and reopening.
 */
const FLYOUT_HOVER_GRACE_MS = 180;

/**
 * Screen A's frame: the nav on the left and, to its right, the app bar stacked
 * above the page canvas. The app bar deliberately starts at the nav's right
 * edge rather than spanning the window, which is how left-nav.pen composes it.
 *
 * Collapsing animates the rail's width and cross-fades between the two nav
 * faces. Both faces stay mounted so neither has to be rebuilt mid-transition;
 * the hidden one is `inert` so it takes no focus and is skipped by the
 * accessibility tree.
 */
export function AppShell({ children }: { children?: React.ReactNode }) {
  const { effective, setActiveThemeAccount, scopeModel } = useTheme();
  const { setActiveAccount: setActiveTuningAccount } = useTuning();
  const {
    navTheme,
    headerTheme,
    dockLabel,
    dockPosition,
    entryLayout,
    recentsMode,
    autoCollapse,
    // Per-account like the rest of the look — a tenant can ship spotlight
    // search while its neighbour keeps the nav panel.
    searchMode,
    searchTheme,
  } = effective;
  /*
   * Collapsed follows the viewport until the user says otherwise.
   *
   * `null` means "no opinion yet", so a narrow viewport gets the rail without
   * anyone asking. The moment the user touches the toggle their choice sticks for
   * good — resizing never overrides a decision they made on purpose, which is the
   * behaviour the earlier review asked for when the drawer toggle was added.
   *
   * Derived rather than synced in an effect: an effect that calls setState here
   * would render the wrong face first and then correct itself, and Next 16 rejects
   * that pattern outright.
   */
  const [manualCollapsed, setManualCollapsed] = React.useState<boolean | null>(
    null,
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  /** Who the customizer is shaping. Null = still on the Sub-accounts picker. */
  const [customizeAccountId, setCustomizeAccountId] = React.useState<string | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const [railExpanded, setRailExpanded] = React.useState(false);
  const {
    state: layout,
    groups,
    productLabelFor,
    productIconFor,
    setActiveAccount: setActiveNavAccount,
  } = useNavLayout();

  /*
   * The panel behind each group row. Built here rather than looked up in the
   * authored registry because three of the four grouping modes have no authored
   * panels — a job group or a group the user just made needs one generated from
   * the catalogue. Memoised because useExitTransition compares by identity, and a
   * fresh object every render would read as a new flyout on every render.
   */
  const groupFlyouts = React.useMemo(
    () =>
      new Map(groups.map((group) => [group.id, flyoutForGroup(layout, group)])),
    [layout, groups],
  );

  /*
   * Which sub-account the session is in, plus its recents and favourites. Owned
   * here because the nav header shows the current account and both nav faces
   * have to agree on it — the switcher panel only reads and writes it.
   */
  const accounts = useAccounts();

  const agencyScope = accounts.scope === "agency";
  // What the nav header shows: the agency identity at agency scope, the
  // current sub-account otherwise. One derivation for both nav faces.
  const headerAccount = agencyScope ? accounts.agency : accounts.current;
  const customizeAccount =
    accounts.accounts.find((a) => a.id === customizeAccountId) ?? null;
  const recentAccounts = accounts.recentIds
    .map((id) => accounts.accounts.find((a) => a.id === id))
    .filter((a): a is (typeof accounts.accounts)[number] => a !== undefined);

  /*
   * Seeds the accent from whoever owns the workspace right now: the current
   * sub-account's logo, or the agency's own brand at agency scope — switching
   * to the agency rebrands the whole surface, exactly as entering a client
   * does. Only the one property is written — tokens.css derives the rest of
   * the brand ramp from it, and the tint layer derives the neutrals from
   * that, so a scope change can move the workspace's temperature rather than
   * just its buttons.
   *
   * Set on <html> because that is where [data-accent] is scoped, and React does
   * not own that element here.
   */
  const accountBrand = headerAccount.logo.from;
  React.useEffect(() => {
    document.documentElement.style.setProperty("--account-brand", accountBrand);
  }, [accountBrand]);

  // Whose saved look / density / nav layout the workspace wears. The
  // agency's own profiles live under "agency"; every sub-account carries
  // its own set. All three stores share one owner key so a switch never
  // leaves one surface on the previous account. Layout effect so the first
  // paint after a switch already wears the arriving account.
  const themeOwnerId = agencyScope ? "agency" : accounts.current.id;
  React.useLayoutEffect(() => {
    setActiveThemeAccount(themeOwnerId);
    setActiveTuningAccount(themeOwnerId);
    setActiveNavAccount(themeOwnerId);
  }, [
    themeOwnerId,
    setActiveThemeAccount,
    setActiveTuningAccount,
    setActiveNavAccount,
  ]);

  // Cmd/Ctrl-K opens search from anywhere, which is the whole point of the
  // spotlight treatment. Bound on the window so it works with focus in the page.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Search and the switcher both own the keyboard, so opening one has to
        // dismiss the other rather than stacking two focus traps.
        setSwitcherOpen(false);
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const narrow = useMediaQuery(`(max-width: ${AUTO_COLLAPSE_WIDTH - 1}px)`);
  const collapsed = manualCollapsed ?? (autoCollapse && narrow);
  const toggleCollapsed = React.useCallback(
    () => setManualCollapsed(!collapsed),
    [collapsed],
  );

  const intent = useFlyoutIntent(FLYOUT_HOVER_GRACE_MS);


  /*
   * How much room the nav has, measured once here on the wrapper both faces share.
   *
   * Measured rather than derived from the viewport: the nav's height is not the
   * window's, and the wrapper is the box that actually has to hold the faces. Doing
   * it here rather than inside each face means the two faces and the floating
   * capsule cannot disagree about the tier — which matters, because the capsule is
   * positioned in this wrapper's coordinate space.
   */
  const navWrapRef = React.useRef<HTMLDivElement>(null);
  const density = useNavDensity(navWrapRef, collapsed);
  const atFloor = density === "floor";

  /*
   * How many inline recent rows to show.
   *
   * Two inputs, and density always wins. The mode is a product question — the review
   * argued pinned and recents overlap — while density is a safety mechanism: at the
   * floor tier the answer has to be zero whatever the mode says, or the rows we just
   * made reachable get crowded out again.
   */
  const recentsBudget = Math.min(
    recentsBudgetFor(density),
    recentsMode === "flyout-only"
      ? 0
      : recentsMode === "fixed-three"
        ? 3
        : // Adaptive: a user with pins has already said what they reach for.
          layout.pinned.length === 0
          ? 3
          : layout.pinned.length <= 3
            ? 2
            : 1,
  );

  /*
   * The Ask AI conversation lives here rather than in the dock that opens it:
   * both nav faces clip their overflow, so the window has to be rendered out
   * here, and it has to survive the nav collapsing underneath it.
   */
  const aiSession = useAiSession();

  /**
   * The chip row is a window onto the ordered pin list, so it takes the head.
   * Labels and icons come from the store's resolvers, not the raw catalogue, so a
   * renamed product's dock caption matches its nav row.
   */
  const pinnedItems = agencyScope
    ? agencyPinned
    : layout.pinned
        .filter((id) => productById(id) !== undefined)
        .map((id) => ({
          id,
          label: productLabelFor(id),
          icon: productIconFor(id),
        }));
  const overflowCount = Math.max(0, layout.pinned.length - PINNED_VISIBLE);

  const railActive = scopeModel === "rail";
  /*
   * Expanded shows full account names beside the tiles — the answer to
   * low-quality tenant logos. Panel offsets follow the live width.
   */
  const navWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  /*
   * Where panels dock. With the account rail live, everything that hangs off
   * the nav's right edge — flyouts, the AI window, the launcher — starts one
   * rail further right, and the switcher panels anchor past it too.
   */
  const railWidth = railActive
    ? railExpanded
      ? ACCOUNT_RAIL_EXPANDED_WIDTH
      : ACCOUNT_RAIL_WIDTH
    : 0;
  const leftOffset = railWidth + navWidth;
  // Group panels win over the authored registry: a renamed Engage has to open a
  // panel titled with its new name, and the registry still holds the old one.
  // At agency scope the agency's own panels take their place.
  // The Settings row opens a flyout like any group row; which menu it holds
  // follows the scope, not the registry.
  const requested = intent.activeId
    ? intent.activeId === SETTINGS_FLYOUT_ID
      ? agencyScope
        ? agencySettingsFlyout
        : accountSettingsFlyout
      : agencyScope
        ? (agencyFlyouts[intent.activeId] ?? null)
        : (groupFlyouts.get(intent.activeId) ?? flyouts[intent.activeId] ?? null)
    : null;
  const flyout = useExitTransition(requested, FLYOUT_EXIT_MS);
  // A bare `true` rather than the session object: useExitTransition compares
  // by identity, and the session is rebuilt on every render.
  const ai = useExitTransition(aiSession.open || null, AI_EXIT_MS);
  const switcher = useExitTransition(switcherOpen || null, SWITCHER_EXIT_MS);
  /*
   * The launcher rides the same hover intent as the product rows rather than its
   * own open flag, which is what makes the chip row's chevron behave like every
   * other trigger in the nav: preview on hover, pin on click, one panel at a
   * time, and the same grace period when the pointer crosses the seam into it.
   */
  const launcher = useExitTransition(
    intent.activeId === LAUNCHER_ID || null,
    FLYOUT_EXIT_MS,
  );

  // Opening the switcher clears whatever else is showing over the canvas: it is
  // a modal choice, and a flyout left open behind it would keep reacting to
  // hover through the scrim.
  const toggleSwitcher = React.useCallback(() => {
    if (switcherOpen) {
      setSwitcherOpen(false);
      return;
    }
    // Read state rather than an updater: these are side effects, and an updater
    // is called twice under StrictMode. `intent.close()` covers the launcher
    // too, now that it shares the flyout intent.
    intent.close();
    setSearchOpen(false);
    setSwitcherOpen(true);
  }, [intent, switcherOpen]);

  // Leaving one scope for the other closes whatever was open over the canvas —
  // a client flyout has no meaning at agency scope and vice versa — and drops
  // the row selection, which named a row the other scope does not have.
  const scopeRef = React.useRef(accounts.scope);
  React.useEffect(() => {
    if (scopeRef.current === accounts.scope) return;
    scopeRef.current = accounts.scope;
    intent.close();
    setSelectedId(null);
    setCustomizeAccountId(null);
  }, [accounts.scope, intent]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/*
        Agency-level banners span the whole window — over the account rail, the
        nav and the canvas — because platform-to-agency comms are about the
        whole relationship, not any one account. The width is the level.
      */}
      <TopBanner banners={AGENCY_BANNERS} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden bg-app">
      {railActive ? (
        <AccountRail
          session={accounts}
          theme={navTheme}
          expanded={railExpanded}
          onToggleExpanded={() => setRailExpanded((v) => !v)}
          switcherOpen={switcherOpen}
          onToggleSwitcher={toggleSwitcher}
        />
      ) : null}

      <div
        ref={navWrapRef}
        style={{ width: navWidth, ...densityVars(density) }}
        onPointerLeave={intent.scheduleClear}
        onPointerEnter={intent.cancelClear}
        className="relative z-20 h-full min-h-0 shrink-0 self-stretch overflow-hidden bg-nav motion-move"
      >
        {/*
          Rendered before the faces so it sits near its visual position in the
          tab order. It paints above them via its own z-index.
        */}
        {/*
          Withdrawn at the floor tier, where each face shows a plain Favorites row
          inside its scroll region instead. The capsule is positioned absolutely in
          this wrapper, so it cannot join a scroll region — leaving it up would mean
          a floating dock hanging over rows trying to scroll underneath it.
        */}
        {atFloor ? null : (
        <FavoritesMorph
          theme={navTheme}
          items={pinnedItems}
          collapsed={collapsed}
          onOpenLauncher={() => intent.togglePin(LAUNCHER_ID)}
          launcherActive={intent.activeId === LAUNCHER_ID}
          overflowCount={overflowCount}
          dockLabel={dockLabel}
          dockPosition={dockPosition}
          // The capsule's geometry is absolute, so anything inserted above it in
          // either face has to be handed to it as an offset. Irrelevant at the
          // bottom, where it is measured from the nav's last edge instead.
          topOffset={
            dockPosition === "top" && entryLayout === "top"
              ? collapsed
                ? ENTRY_CLUSTER_RAIL_HEIGHT
                : ENTRY_CLUSTER_HEIGHT
              : 0
          }
        />
        )}

        <div
          inert={collapsed}
          aria-hidden={collapsed}
          className={cn(
            "absolute inset-y-0 left-0 motion-move",
            collapsed
              ? "-translate-x-2 opacity-0"
              : "translate-x-0 opacity-100 delay-[60ms]",
          )}
        >
          <LeftNav
            theme={navTheme}
            selectedId={selectedId}
            onSelect={setSelectedId}
            openFlyoutId={intent.activeId}
            pinnedFlyoutId={intent.pinnedId}
            onHoverFlyout={intent.hover}
            onPinFlyout={intent.togglePin}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
            onSearch={() => setSearchOpen(true)}
            scope={accounts.scope}
            account={headerAccount}
            recentAccounts={recentAccounts}
            onSwitchAccount={accounts.switchTo}
            switcherOpen={switcherOpen}
            onToggleSwitcher={toggleSwitcher}
            aiSession={aiSession}
            density={density}
            onOpenLauncher={() => intent.togglePin(LAUNCHER_ID)}
            recentsBudget={recentsBudget}
          />
        </div>

        <div
          inert={!collapsed}
          aria-hidden={!collapsed}
          className={cn(
            "absolute inset-y-0 left-0 motion-move",
            collapsed
              ? "translate-x-0 opacity-100 delay-[60ms]"
              : "-translate-x-2 opacity-0",
          )}
        >
          <CollapsedRail
            theme={navTheme}
            selectedId={selectedId}
            onSelect={setSelectedId}
            openFlyoutId={intent.activeId}
            pinnedFlyoutId={intent.pinnedId}
            onHoverFlyout={intent.hover}
            onPinFlyout={intent.togglePin}
            onSearch={() => setSearchOpen(true)}
            scope={accounts.scope}
            account={headerAccount}
            switcherOpen={switcherOpen}
            onToggleSwitcher={toggleSwitcher}
            aiSession={aiSession}
            density={density}
            onOpenLauncher={() => intent.togglePin(LAUNCHER_ID)}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          Sub-account banners start where the account's content starts, right
          of both rails — the left edge says whose problem it is, and the strip
          leaves with its account on switch (the key remounts it, which also
          resets its dismissals to that account's own).
        */}
        {accounts.scope === "account" ? (
          <TopBanner
            key={accounts.current.id}
            banners={ACCOUNT_BANNERS[accounts.current.id] ?? []}
          />
        ) : null}
        <AppHeader
          theme={headerTheme}
          crumbs={
            selectedId === "agency-sub-accounts"
              ? customizeAccount
                ? ["Sub-accounts", `Customize ${customizeAccount.name}`]
                : ["Sub-accounts"]
              : agencyScope
                ? [accounts.agency.name, "Overview"]
                : ["Contacts", "Smart lists"]
          }
          // Whenever the rail is showing: the 64px face has no logo row or
          // footer slot for a toggle in either arrangement, so reopening is
          // done from the app bar's far left, immediately right of the rail.
          {...(collapsed ? { onExpandNav: () => setManualCollapsed(false) } : {})}
        />
        {/*
          The customizer lives behind the Sub-accounts page, as production
          shapes an account from its row there: the nav row opens the table,
          and picking an account opens its customizer. A canvas destination,
          not a route, so the live nav stays beside it and scope/rail state
          survives entering and leaving.
        */}
        <div className="min-h-0 flex-1 overflow-auto">
          {selectedId === "agency-sub-accounts" ? (
            customizeAccount ? (
              <CustomizerPage
                account={customizeAccount}
                onBack={() => setCustomizeAccountId(null)}
              />
            ) : (
              <AccountsIndexPage
                session={accounts}
                onCustomize={setCustomizeAccountId}
              />
            )
          ) : (
            children
          )}
        </div>
      </div>

      {flyout.isMounted && flyout.value ? (
        <>
          {/*
            Click-away target. Covers the page canvas only — it starts at the
            nav's right edge so the nav stays clickable while a flyout is open,
            which is what lets one row hand off directly to another.
          */}
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={intent.close}
            style={{ left: leftOffset }}
            className={cn(
              "absolute top-0 right-0 bottom-0 z-10 cursor-default motion-move",
              flyout.phase === "entering" ? "opacity-100" : "opacity-0",
            )}
          />
          {/*
            Deliberately unkeyed. Keying by id remounted the panel when moving
            from one trigger to the next, which replayed the entrance from
            opacity 0 and let the page flash through underneath. Unkeyed, the
            panel persists and only its rows re-enter.
          */}
          <FlyoutPanel
            config={flyout.value}
            offsetLeft={leftOffset}
            theme={navTheme}
            phase={flyout.phase}
            onPointerEnter={intent.cancelClear}
            onPointerLeave={intent.scheduleClear}
            onClose={intent.close}
          />
        </>
      ) : null}

      {/*
        Above the flyouts, below search. Docked past the nav's right edge, so
        the dock it grew out of stays visible beside it.
      */}
      {ai.isMounted ? (
        <AiWindow
          theme={navTheme}
          offsetLeft={leftOffset}
          session={aiSession}
          phase={ai.phase}
        />
      ) : null}

      {launcher.isMounted ? (
        <PinnedLauncher
          offsetLeft={leftOffset}
          theme={navTheme}
          phase={launcher.phase}
          onPointerEnter={intent.cancelClear}
          onPointerLeave={intent.scheduleClear}
          onClose={intent.close}
        />
      ) : null}

      {/*
        Anchored to its trigger in whichever nav face is showing, and rendered
        out here because both faces clip their overflow.

        Two models, two panels. The rail model gets the curate-and-jump panel
        docked past the rail; the header model keeps the anchored switcher,
        with the agency as its standing first row.
      */}
      {switcher.isMounted ? (
        railActive ? (
          <RailSwitcher
            session={accounts}
            offsetLeft={railWidth}
            theme={navTheme}
            phase={switcher.phase}
            onClose={() => setSwitcherOpen(false)}
          />
        ) : (
          <AccountSwitcher
            session={accounts}
            showAgency
            anchor={
              collapsed ? SWITCHER_ANCHOR.collapsed : SWITCHER_ANCHOR.expanded
            }
            theme={navTheme}
            phase={switcher.phase}
            onClose={() => setSwitcherOpen(false)}
          />
        )
      ) : null}

      <UndoToast />

      {/* Search sits above the flyouts; both treatments share the same model. */}
      {searchOpen ? (
        searchMode === "spotlight" ? (
          <CommandPalette
            theme={searchTheme}
            onClose={() => setSearchOpen(false)}
          />
        ) : (
          <SearchFlyout
            offsetLeft={leftOffset}
            theme={searchTheme}
            onClose={() => setSearchOpen(false)}
          />
        )
      ) : null}
      </div>
    </div>
  );
}
