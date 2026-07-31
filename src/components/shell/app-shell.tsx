"use client";

import * as React from "react";
import { flyouts } from "@/components/flyout/flyout-config";
import { FlyoutPanel } from "@/components/flyout/flyout-panel";
import { AppHeader } from "@/components/header/app-header";
import { CollapseToggle } from "@/components/nav/collapse-toggle";
import { CollapsedRail } from "@/components/nav/collapsed-rail";
import { FavoritesMorph } from "@/components/nav/favorites-morph";
import { LeftNav } from "@/components/nav/left-nav";
import { navConfig } from "@/components/nav/nav-config";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useExitTransition } from "@/lib/use-exit-transition";

/** Nav widths from left-nav.pen; the flyout docks against whichever is showing. */
const EXPANDED_WIDTH = 272;
const COLLAPSED_WIDTH = 64;

/** Must match --dur-fast, which drives the panel's exit animation. */
const FLYOUT_EXIT_MS = 140;

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
  const { navTheme, headerTheme } = useTheme();
  const [collapsed, setCollapsed] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [openFlyoutId, setOpenFlyoutId] = React.useState<string | null>(null);

  const navWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  const requested = openFlyoutId ? (flyouts[openFlyoutId] ?? null) : null;
  const flyout = useExitTransition(requested, FLYOUT_EXIT_MS);

  // Clicking the row that is already open closes it, which is what makes the
  // nav rows feel like toggles rather than one-way triggers.
  const toggleFlyout = (id: string) =>
    setOpenFlyoutId((current) => (current === id ? null : id));

  const closeFlyout = () => setOpenFlyoutId(null);

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-app">
      <div
        style={{ width: navWidth }}
        className="relative z-20 h-full shrink-0 overflow-hidden motion-move"
      >
        {/*
          Rendered before the faces so it sits near its visual position in the
          tab order. It paints above them via its own z-index.
        */}
        <FavoritesMorph
          theme={navTheme}
          items={navConfig.pinned}
          collapsed={collapsed}
          onOpenFavorites={() => toggleFlyout("favorites")}
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
            openFlyoutId={openFlyoutId}
            onOpenFlyout={toggleFlyout}
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
            openFlyoutId={openFlyoutId}
            onOpenFlyout={toggleFlyout}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader theme={headerTheme} />
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
            onClick={closeFlyout}
            style={{ left: navWidth }}
            className={cn(
              "absolute top-0 right-0 bottom-0 z-10 cursor-default motion-move",
              flyout.phase === "entering" ? "opacity-100" : "opacity-0",
            )}
          />
          <FlyoutPanel
            key={flyout.value.id}
            config={flyout.value}
            offsetLeft={navWidth}
            theme={navTheme}
            phase={flyout.phase}
            onClose={closeFlyout}
          />
        </>
      ) : null}

      <div
        style={{ left: navWidth - 12 }}
        className="absolute bottom-[24px] z-40 motion-move"
      >
        <CollapseToggle
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>
    </div>
  );
}
