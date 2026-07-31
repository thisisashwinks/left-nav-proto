"use client";

import * as React from "react";
import { AppHeader } from "@/components/header/app-header";
import { CollapseToggle } from "@/components/nav/collapse-toggle";
import { LeftNav } from "@/components/nav/left-nav";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * Screen A's frame: the nav on the left and, to its right, the app bar stacked
 * above the page canvas. The app bar deliberately starts at the nav's right
 * edge rather than spanning the window, which is how left-nav.pen composes it.
 *
 * The collapse toggle is positioned as in the design: centred on the nav's
 * right edge, 24px up from the bottom.
 */
export function AppShell({ children }: { children?: React.ReactNode }) {
  const { navTheme, headerTheme } = useTheme();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-app">
      {collapsed ? null : <LeftNav theme={navTheme} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader theme={headerTheme} />
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>

      <div
        className="absolute bottom-[24px] z-10"
        style={{ left: collapsed ? 0 : 260 }}
      >
        <CollapseToggle
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>
    </div>
  );
}
