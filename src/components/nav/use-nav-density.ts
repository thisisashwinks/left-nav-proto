"use client";

import * as React from "react";
import { useElementHeight } from "@/lib/use-element-height";

/**
 * How much room the nav has, and therefore how much it should give up.
 *
 * The order matters and is the whole design: give up *density* before giving up
 * *visibility*, and give up the fixed cluster's position before letting any row
 * become unreachable. Measured on the real thing:
 *
 *   16.2-inch (1020px)  597px for the list, ~130px slack
 *   14-inch   (890px)   467px for the list, ZERO slack
 *   500px               77px  — two rows of twenty-five
 *   380px               2px   — Quick Actions unreachable
 *
 * The 14-inch figure is why this exists. The nav was tuned on a 16.2-inch screen
 * where the slack hid the problem; one custom link, one extra group, or a longer
 * translated string tips it over.
 */
export type NavDensity = "roomy" | "short" | "tight" | "floor";

/**
 * Non-compressible chrome, measured: everything that is `shrink-0` plus the
 * dividers. 423px in the expanded nav, 440px in the rail — the rail is worse
 * because its stacked entry cluster and reserved capsule cost more than the
 * expanded nav's single row does.
 */
const CHROME = { expanded: 423, rail: 440 };

/** Rows we want visible before claiming the nav is usable. ~35px each. */
const ROW = 35;

export function useNavDensity<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  collapsed: boolean,
): NavDensity {
  const height = useElementHeight(ref);
  const chrome = collapsed ? CHROME.rail : CHROME.expanded;

  // 0 means "not measured yet" — assume roomy so the first paint is the design
  // rather than a flash of the most degraded state.
  if (height === 0) return "roomy";

  const forList = height - chrome;

  // Below the chrome cost the fixed cluster gets clipped and its rows become
  // unreachable, because the nav is `overflow-hidden` and the page cannot scroll.
  if (forList < ROW * 2) return "floor";
  // Enough for a list, but not enough to also carry three inline recents.
  if (forList < ROW * 6) return "tight";
  // Fits, with nothing spare. This is a 14-inch screen.
  if (forList < ROW * 14) return "short";
  return "roomy";
}

/**
 * The tuning overrides each tier applies.
 *
 * Written as the existing `--t-nav-*` custom properties rather than new ones, so
 * the control panel's sliders and this stay one system: a demo can still retune
 * rows by hand, and short screens just start from a tighter baseline.
 *
 * `roomy` returns nothing at all, so the design's own measured values are never
 * overridden on a screen that has room for them.
 */
export function densityVars(density: NavDensity): React.CSSProperties {
  switch (density) {
    case "roomy":
      return {};
    case "short":
      return { "--t-nav-py": "7px", "--t-nav-space": "1px" } as React.CSSProperties;
    case "tight":
    case "floor":
      return { "--t-nav-py": "5px", "--t-nav-space": "0px" } as React.CSSProperties;
  }
}

/**
 * How many inline recent rows the tier can afford.
 *
 * `short` still gets the full three. A 14-inch screen is the most common laptop,
 * not an edge case, and dropping content there would mean almost nobody saw the
 * designed block — three destinations and a More row. Tightening the row rhythm
 * buys that space instead, which is the cheaper concession.
 *
 * Trimming starts at `tight`, where compression alone can no longer fit a usable
 * product list.
 */
export function recentsBudgetFor(density: NavDensity): number {
  switch (density) {
    case "roomy":
    case "short":
      return 3;
    case "tight":
      return 1;
    case "floor":
      // None. At the floor the Recent row is the only way in, which is what keeps
      // every product row reachable.
      return 0;
  }
}
