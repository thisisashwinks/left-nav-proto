"use client";

import * as React from "react";
import { flyouts } from "@/components/flyout/flyout-config";
import { FlyoutPanel } from "@/components/flyout/flyout-panel";
import { AppHeader } from "@/components/header/app-header";
import { CollapseToggle } from "@/components/nav/collapse-toggle";
import { CollapsedRail } from "@/components/nav/collapsed-rail";
import { LeftNav } from "@/components/nav/left-nav";
import { useTheme } from "@/components/theme/theme-provider";

/** Nav widths from left-nav.pen; the flyout docks against whichever is showing. */
const EXPANDED_WIDTH = 272;
const COLLAPSED_WIDTH = 64;

/**
 * Screen A's frame: the nav on the left and, to its right, the app bar stacked
 * above the page canvas. The app bar deliberately starts at the nav's right
 * edge rather than spanning the window, which is how left-nav.pen composes it.
 *
 * Collapsing swaps the 272px nav for the 64px rail (Screen B) rather than hiding
 * it, and the flyout re-docks to the narrower edge (Screen D).
 */
export function AppShell({ children }: { children?: React.ReactNode }) {
  const { navTheme, headerTheme } = useTheme();
  const [collapsed, setCollapsed] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [openFlyoutId, setOpenFlyoutId] = React.useState<string | null>(null);

  const navWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  const openFlyout = openFlyoutId ? flyouts[openFlyoutId] : undefined;

  // Clicking the row that is already open closes it, which is what makes the
  // nav rows feel like toggles rather than one-way triggers.
  const toggleFlyout = (id: string) =>
    setOpenFlyoutId((current) => (current === id ? null : id));

  const closeFlyout = () => setOpenFlyoutId(null);

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-app">
      {collapsed ? (
        <CollapsedRail
          theme={navTheme}
          openFlyoutId={openFlyoutId}
          onOpenFlyout={toggleFlyout}
        />
      ) : (
        <LeftNav
          theme={navTheme}
          selectedId={selectedId}
          onSelect={setSelectedId}
          openFlyoutId={openFlyoutId}
          onOpenFlyout={toggleFlyout}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader theme={headerTheme} />
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>

      {openFlyout ? (
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
            className="absolute top-0 right-0 bottom-0 z-10 cursor-default"
          />
          <FlyoutPanel
            key={openFlyout.id}
            config={openFlyout}
            offsetLeft={navWidth}
            theme={navTheme}
            onClose={closeFlyout}
          />
        </>
      ) : null}

      <div
        className="absolute bottom-[24px] z-40"
        style={{ left: navWidth - 12 }}
      >
        <CollapseToggle
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>
    </div>
  );
}
