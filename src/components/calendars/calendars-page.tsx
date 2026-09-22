"use client";

import * as React from "react";
import { CalendarDays, Rows3, Settings } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { AppointmentsList } from "./appointments-list";
import { CalendarEdit } from "./calendar-edit";
import { CalendarSettings } from "./calendar-settings";
import { CalendarWeekView } from "./calendar-week-view";
import type { CalendarRow } from "./calendars-data";

/**
 * CRM ▸ Calendar ▸ Appointments — the grid, the list, settings, and one
 * calendar opened.
 *
 * One component owns all four for the reason funnels-page and workflows-page
 * each own three: none of the other three is a different PLACE in the nav's
 * sense. You are still in Calendars. The opened calendar grows a crumb (see
 * calendar-edit) and the sidebar selection does not move, because the nav
 * cannot have an opinion about a thing you can only reach by clicking a row.
 *
 * Reached from product-page's REAL_PAGES on both id families — `calendars` in
 * the shipped catalogue, which has no children at all, and `ia-crm-calendars`
 * with `ia-crm-calendars-appointments` / `-settings` in the proposed tree — so
 * the screens are there whichever grouping axis the panel is on.
 */

/**
 * The three views, as a page-level tab strip.
 *
 * Deliberately NOT a `ViewBar`. That component's contract is that every tab
 * re-cuts the SAME collection, and it holds here for the first two — the week
 * grid and the table are the same appointments, drawn twice — but breaks flat
 * on the third: Calendar settings is a configuration screen for a different
 * object (the calendars, not the bookings on them). A ViewBar would have said
 * all three are cuts of one list and been wrong about a third of itself.
 *
 * So why is settings a tab at all, rather than a place? Because the proposed
 * IA files it as an L3 with six L4s under it and this page has to be able to
 * show that whole chain from either tree — and the shipped catalogue has no
 * child for it to be. A tab is the only control that exists in both worlds.
 * The gear glyph is there to say it is a different kind of tab out loud.
 */
const VIEWS = [
  { id: "calendar", label: "Calendar view", icon: CalendarDays },
  { id: "list", label: "Appointment list view", icon: Rows3 },
  { id: "settings", label: "Calendar settings", icon: Settings },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export interface CalendarsPageProps {
  /**
   * What the nav row asked for, as `view[:line[:page]]`.
   *
   * A colon-joined string rather than three props because REAL_PAGES hands a
   * page exactly one seed value — see the `views` map there — and inventing a
   * second channel for it would have meant editing product-page's shape for
   * one product. Parsed once below and then forgotten: after the first render
   * the tabs are ordinary in-page state, because a tab is not a destination
   * and must not be re-seeded when something above re-renders.
   */
  initialView?: string | null;
}

export function CalendarsPage({ initialView }: CalendarsPageProps) {
  const { effective } = useTheme();
  const [seedView, seedLine, seedPage] = (initialView ?? "").split(":");

  const [view, setView] = React.useState<ViewId>(
    VIEWS.some((v) => v.id === seedView) ? (seedView as ViewId) : "calendar",
  );
  const [open, setOpen] = React.useState<CalendarRow | null>(null);

  /*
   * The opened calendar outranks the tab it was opened from.
   *
   * Returning from it puts you back on the settings tab with the same list,
   * which is why `view` is left alone here rather than being reset — the trail
   * crumb is the way out and it says Calendars ▸ tEst, so landing anywhere
   * other than the list you came from would make the crumb a lie.
   */
  if (open) {
    return (
      <div
        data-page-theme={effective.appTheme}
        className="relative flex h-full min-h-0 flex-col gap-[12px] px-[var(--page-inset)]"
      >
        <CalendarEdit calendar={open} onBack={() => setOpen(null)} />
      </div>
    );
  }

  return (
    <div
      data-page-theme={effective.appTheme}
      // No fill: the canvas paints nothing either, so content sits directly on
      // the shell plane and the cards bring their own surface. Horizontal
      // inset only — the canvas's own margin is the whole vertical one.
      className="relative flex h-full min-h-0 flex-col gap-[12px] px-[var(--page-inset)]"
    >
      <div
        role="tablist"
        aria-label="Calendar views"
        className="flex shrink-0 items-center gap-[2px] overflow-x-auto border-b border-pg-head-border"
      >
        {VIEWS.map((v) => {
          const on = v.id === view;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setView(v.id)}
              className={cn(
                "motion-tap relative flex shrink-0 items-center gap-[7px] px-[11px] pt-[2px] pb-[9px] text-[13.5px] leading-[18px] whitespace-nowrap",
                on
                  ? "font-semibold text-pg-heading"
                  : "font-medium text-pg-muted hover:text-pg-text",
              )}
            >
              <v.icon
                size={15}
                aria-hidden="true"
                className={cn("shrink-0", on ? "text-brand" : "text-pg-faint")}
              />
              {v.label}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-[6px] -bottom-px h-[2px] rounded-full motion-move",
                  on ? "bg-brand" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      {view === "calendar" ? <CalendarWeekView /> : null}
      {view === "list" ? <AppointmentsList /> : null}
      {view === "settings" ? (
        <CalendarSettings
          initialLine={seedLine ?? null}
          initialPage={seedPage ?? null}
          onOpen={setOpen}
        />
      ) : null}
    </div>
  );
}
