"use client";

import * as React from "react";
import { CalendarDays, Rows3 } from "lucide-react";
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
 * Two views, and they really are two views.
 *
 * The week grid and the appointment table are the SAME bookings drawn twice,
 * which is the one thing that makes a view control honest. Calendar settings
 * used to be a third tab here and is not any more: it configures a different
 * object — the calendars, not the bookings on them — and the proposed tree
 * already files it as an L3 with six L4s under it. A tab that leads to
 * another object is a nav item wearing a tab's clothes, so it went to the
 * place the nav already had for it, and this page reaches it the same way
 * everything else does: through the trail.
 */
const VIEWS = [
  { id: "calendar", label: "Calendar view", icon: CalendarDays },
  { id: "list", label: "Appointment list view", icon: Rows3 },
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
  const switchStyle = effective.calendarViewSwitch;
  const [seedView, seedLine, seedPage] = (initialView ?? "").split(":");

  const [view, setView] = React.useState<ViewId>(
    VIEWS.some((v) => v.id === seedView) ? (seedView as ViewId) : "calendar",
  );
  const [open, setOpen] = React.useState<CalendarRow | null>(null);
  /*
   * Settings arrives as its own place, so it draws no view control at all.
   *
   * Seeded once from the nav row rather than held as a tab: the trail is what
   * says you are in Calendar settings, and a page that ALSO offered a way
   * back to the grid from inside settings would be two navigators again.
   */
  const settingsPlace = seedView === "settings";

  /*
   * The opened calendar outranks the tab it was opened from.
   *
   * Returning from it puts you back on the settings tab with the same list,
   * which is why `view` is left alone here rather than being reset — the trail
   * crumb is the way out and it says Calendars ▸ tEst, so landing anywhere
   * other than the list you came from would make the crumb a lie.
   */
  if (open) {
    // Full bleed: the builder asks the shell for the window and lays out its
    // own chrome, so the page inset that wraps every other calendar screen
    // would be a margin around a builder — see calendar-edit.
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <CalendarEdit calendar={open} onBack={() => setOpen(null)} />
      </div>
    );
  }

  if (settingsPlace) {
    return (
      <div
        data-page-theme={effective.appTheme}
        className="relative flex h-full min-h-0 flex-col gap-[12px] px-[var(--page-inset)]"
      >
        <CalendarSettings
          initialLine={seedLine ?? null}
          initialPage={seedPage ?? null}
          onOpen={setOpen}
        />
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
      {switchStyle === "tabs" ? (
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
      ) : (
        /*
         * The same choice as one control, pushed to the right edge.
         *
         * A segmented switcher says the page has ONE subject drawn two ways,
         * where a tab strip says it has two halves. It also costs a row: the
         * control sits with the things that act on the collection rather than
         * above them, which is where a reader looks for "how is this drawn".
         */
        <div className="flex h-[34px] shrink-0 items-center gap-[10px]">
          <span className="text-[13px] leading-none font-semibold text-pg-heading">
            Appointments
          </span>
          <span className="flex-1" />
          <div
            role="group"
            aria-label="Appointment view"
            className="flex shrink-0 items-center gap-[2px] rounded-[9px] bg-pg-surface p-[2px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
          >
            {VIEWS.map((v) => {
              const on = v.id === view;
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "motion-tap flex h-[28px] shrink-0 items-center gap-[6px] rounded-[7px] px-[10px] text-[12.5px] leading-none whitespace-nowrap",
                    on
                      ? "bg-brand-soft font-semibold text-brand"
                      : "font-medium text-pg-muted hover:text-pg-text",
                  )}
                >
                  <v.icon size={14} aria-hidden="true" className="shrink-0" />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === "calendar" ? <CalendarWeekView /> : null}
      {view === "list" ? <AppointmentsList /> : null}
    </div>
  );
}
