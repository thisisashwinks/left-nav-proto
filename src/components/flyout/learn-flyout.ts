import { Compass, Lightbulb, PencilLine, Rocket, Sparkles, GraduationCap, Users, type LucideIcon } from "lucide-react";
import type { NavTourLearnIcon } from "@/design/theme";
import type { FlyoutConfig } from "./types";

/**
 * "Learn about new Sidebar" — the standing way back into the tours.
 *
 * As an L2 it is the nav's own panel with one row per tour, so picking which
 * one to take reads like any other panel in the sidebar rather than a menu of
 * its own. See NAV_TOUR_LEARN_OPENS. Ashwin, Nov 16.
 */
export const LEARN_FLYOUT_ID = "learn-sidebar";
export const LEARN_NAV_LABEL = "Learn about new Sidebar";

/** The row's glyph, by the prototype controls. See NAV_TOUR_LEARN_ICONS. */
export const LEARN_ICONS: Record<NavTourLearnIcon, LucideIcon> = {
  compass: Compass,
  sparkles: Sparkles,
  cap: GraduationCap,
  bulb: Lightbulb,
};

/** An L2 row's id, which the shell routes to the tour it names. */
export const LEARN_ROW_PREFIX = "learn-tour-";

export const learnFlyout: FlyoutConfig = {
  id: LEARN_FLYOUT_ID,
  title: LEARN_NAV_LABEL,
  variant: "product",
  entries: [
    {
      kind: "item",
      item: {
        id: `${LEARN_ROW_PREFIX}getStarted`,
        label: "Get started",
        description: "Categories, search, pins, and more",
        icon: Rocket,
      },
    },
    {
      kind: "item",
      item: {
        id: `${LEARN_ROW_PREFIX}subAccounts`,
        label: "Sub-accounts",
        description: "Switch between and create sub-accounts",
        icon: Users,
      },
    },
    {
      kind: "item",
      item: {
        id: `${LEARN_ROW_PREFIX}editing`,
        label: "Editing",
        description: "Reorder, hide, and save layouts",
        icon: PencilLine,
      },
    },
  ],
};
