"use client";

import * as React from "react";
import { AccountSwitcher } from "@/components/accounts/account-switcher";
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
import { LeftNav } from "@/components/nav/left-nav";
import { productById } from "@/components/nav/catalogue";
import { flyoutForGroup } from "@/components/nav/group-flyout";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { PinnedLauncher } from "@/components/nav/pinned-launcher";
import { UndoToast } from "@/components/nav/undo-toast";
import { PINNED_VISIBLE } from "@/components/nav/favorites-morph";
import { CommandPalette } from "@/components/search/command-palette";
import { SearchFlyout } from "@/components/search/search-flyout";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useExitTransition } from "@/lib/use-exit-transition";
import { useFlyoutIntent } from "@/lib/use-flyout-intent";

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
  const {
    navTheme,
    headerTheme,
    searchMode,
    searchTheme,
    dockLabel,
    dockPosition,
    entryLayout,
  } = useTheme();
  const [collapsed, setCollapsed] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const {
    state: layout,
    groups,
    productLabelFor,
    productIconFor,
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

  /*
   * Seeds the accent from the current account's logo. Only the one property is
   * written — tokens.css derives the rest of the brand ramp from it, and the
   * tint layer derives the neutrals from that, so switching account can move the
   * whole workspace's temperature rather than just its buttons.
   *
   * Set on <html> because that is where [data-accent] is scoped, and React does
   * not own that element here.
   */
  const accountBrand = accounts.current.logo.from;
  React.useEffect(() => {
    document.documentElement.style.setProperty("--account-brand", accountBrand);
  }, [accountBrand]);

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

  const intent = useFlyoutIntent(FLYOUT_HOVER_GRACE_MS);

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
  const pinnedItems = layout.pinned
    .filter((id) => productById(id) !== undefined)
    .map((id) => ({
      id,
      label: productLabelFor(id),
      icon: productIconFor(id),
    }));
  const overflowCount = Math.max(0, layout.pinned.length - PINNED_VISIBLE);

  const navWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  // Group panels win over the authored registry: a renamed Engage has to open a
  // panel titled with its new name, and the registry still holds the old one.
  const requested = intent.activeId
    ? (groupFlyouts.get(intent.activeId) ?? flyouts[intent.activeId] ?? null)
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

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-app">
      <div
        style={{ width: navWidth }}
        onPointerLeave={intent.scheduleClear}
        onPointerEnter={intent.cancelClear}
        className="relative z-20 h-full shrink-0 overflow-hidden motion-move"
      >
        {/*
          Rendered before the faces so it sits near its visual position in the
          tab order. It paints above them via its own z-index.
        */}
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
            onToggleCollapsed={() => setCollapsed((c) => !c)}
            onSearch={() => setSearchOpen(true)}
            account={accounts.current}
            switcherOpen={switcherOpen}
            onToggleSwitcher={toggleSwitcher}
            aiSession={aiSession}
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
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((c) => !c)}
            onSearch={() => setSearchOpen(true)}
            account={accounts.current}
            switcherOpen={switcherOpen}
            onToggleSwitcher={toggleSwitcher}
            aiSession={aiSession}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          theme={headerTheme}
          // Only when the rail has nowhere of its own for it: collapsed, with the
          // entry cluster at the top, its logo row is a bare 30px mark and its
          // footer is empty by design.
          {...(entryLayout === "top" && collapsed
            ? { onExpandNav: () => setCollapsed(false) }
            : {})}
        />
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
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
            style={{ left: navWidth }}
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
            offsetLeft={navWidth}
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
          offsetLeft={navWidth}
          session={aiSession}
          phase={ai.phase}
        />
      ) : null}

      {launcher.isMounted ? (
        <PinnedLauncher
          offsetLeft={navWidth}
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
      */}
      {switcher.isMounted ? (
        <AccountSwitcher
          session={accounts}
          anchor={
            collapsed ? SWITCHER_ANCHOR.collapsed : SWITCHER_ANCHOR.expanded
          }
          theme={navTheme}
          phase={switcher.phase}
          onClose={() => setSwitcherOpen(false)}
        />
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
            offsetLeft={navWidth}
            theme={searchTheme}
            onClose={() => setSearchOpen(false)}
          />
        )
      ) : null}
    </div>
  );
}
