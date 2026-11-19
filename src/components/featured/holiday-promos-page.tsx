"use client";

import * as React from "react";
import { useTheme } from "@/components/theme/theme-provider";
import type { NavPromoCampaign } from "@/design/theme";

/**
 * Holiday Promos: the landing page the promo row or card opens.
 *
 * One designed page per weekly campaign, each a single image from
 * public/promos scaled to the canvas width (up to its own), on a field of
 * its edge colour so the sides don't read as a frame. Pick the week in
 * Prototype controls › Holiday Promos: landing page. See NAV_PROMO_CAMPAIGNS.
 * Ashwin, Nov 19.
 */
const CAMPAIGNS: Record<NavPromoCampaign, { src: string; alt: string; field: string }> = {
  blackFriday: {
    src: "/promos/black-friday.jpg",
    alt: "Black Friday week: pull the lever to unlock up to 50% off.",
    field: "#0a0d2d",
  },
  cyberWeek: {
    src: "/promos/cyber-week.jpg",
    alt: "Cyber Week: click a card to uncover your deal, up to 50% off.",
    field: "#140711",
  },
  holiday: {
    src: "/promos/holiday.jpg",
    alt: "Holiday savings: click a snow globe to reveal your holiday offer.",
    field: "#000c46",
  },
  endOfYear: {
    src: "/promos/end-of-year.jpg",
    alt: "End of year savings: drop the ball to reveal up to 50% off.",
    field: "#403994",
  },
  newYear: {
    src: "/promos/new-year.jpg",
    alt: "New Year savings: open a box to see what 2026 has in store.",
    field: "#38318e",
  },
};

export function HolidayPromosPage() {
  const { navPromoCampaign, navPromoFit } = useTheme().effective;
  const c = CAMPAIGNS[navPromoCampaign];
  const full = navPromoFit === "full";
  return (
    <div className="relative h-full min-h-0 overflow-y-auto" style={{ background: c.field }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a static, unoptimised mock */}
      <img
        key={c.src}
        src={c.src}
        alt={c.alt}
        className={full ? "block h-auto w-full" : "mx-auto block h-auto w-auto max-w-[min(100%,960px)]"}
      />
    </div>
  );
}
