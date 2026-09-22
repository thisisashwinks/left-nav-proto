"use client";

import * as React from "react";
import {
  CalendarPlus,
  Copy,
  EllipsisVertical,
  Pencil,
  Plus,
  Search,
  Share2,
  Wrench,
} from "lucide-react";
import { PrimaryButton } from "@/components/page/page-header";
import { cn } from "@/lib/utils";
import { GlyphButton } from "./calendar-chrome";
import { calendarGroups, calendarRows, type CalendarRow } from "./calendars-data";

/**
 * Name, Group, Duration, Type, Status, Date updated, actions.
 *
 * The action column is fixed at 132px rather than a fraction: four glyphs at
 * 30px plus the gaps, and a fractional column would let a long calendar name
 * squeeze them into three-and-a-half buttons at narrow widths.
 */
const COLS = "2.2fr 1.1fr 0.9fr 1.1fr 0.9fr 1.1fr 132px";

/** The top row of the settings surface — the four product lines. */
const LINES = [
  { id: "meetings", label: "Meetings" },
  { id: "services", label: "Services", badge: "New" },
  { id: "rentals", label: "Rentals", badge: "New" },
  { id: "connections", label: "Connections" },
];

/**
 * The second row, which is NOT the same kind of control as the first.
 *
 * The line above picks a product; this picks a page within it. They are drawn
 * as two strips because that is what the live screen does and the review has
 * to be able to see the cost of it — two rows of tabs above a table, on a page
 * the breadcrumb already names. Collapsing them into one strip of eleven would
 * have answered the question this screen was built to ask.
 */
const PAGES = [
  { id: "calendars", label: "Calendars" },
  { id: "service-v1", label: "Service calendars (v1)" },
  { id: "preferences", label: "Preferences" },
  { id: "availability", label: "My availability" },
];

export interface CalendarSettingsProps {
  /** Which product line the nav asked for, when it named one. */
  initialLine?: string | null;
  /** Which page within it, likewise. */
  initialPage?: string | null;
  /** Open one calendar in the edit screen. */
  onOpen: (calendar: CalendarRow) => void;
}

/**
 * Screen 3: Calendar settings — the calendar list.
 *
 * Settings for a product, inside the product. In the shipped app these six
 * pages are a mini-product living in the Settings nav-swap, and the proposed
 * IA files them under CRM ▸ Calendars ▸ Settings on the product-owns-its-
 * settings rule. This component is what that rule looks like when it lands:
 * the sub-tabs are the SAME rows the Settings nav used to draw, now drawn on
 * the page they configure.
 */
export function CalendarSettings({
  initialLine,
  initialPage,
  onOpen,
}: CalendarSettingsProps) {
  const [line, setLine] = React.useState(initialLine ?? "meetings");
  const [page, setPage] = React.useState(initialPage ?? "calendars");
  const [group, setGroup] = React.useState("all");

  const rows = React.useMemo(
    () =>
      group === "all"
        ? calendarRows
        : calendarRows.filter(
            (r) =>
              r.group ===
              (calendarGroups.find((g) => g.id === group)?.label ?? ""),
          ),
    [group],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[12px]">
      <div
        role="tablist"
        aria-label="Calendar settings sections"
        className="flex shrink-0 items-center gap-[2px] overflow-x-auto border-b border-pg-head-border"
      >
        {LINES.map((l) => {
          const on = l.id === line;
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setLine(l.id)}
              className={cn(
                "motion-tap relative flex shrink-0 items-center gap-[6px] px-[11px] pt-[2px] pb-[9px] text-[13.5px] leading-[18px] whitespace-nowrap",
                on
                  ? "font-semibold text-pg-heading"
                  : "font-medium text-pg-muted hover:text-pg-text",
              )}
            >
              {l.label}
              {l.badge ? (
                <span className="rounded-[4px] bg-brand-soft px-[5px] py-[1px] text-[10px] leading-[14px] font-semibold text-brand">
                  {l.badge}
                </span>
              ) : null}
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

      <div
        role="tablist"
        aria-label="Calendar settings pages"
        className="-mt-[4px] flex shrink-0 items-center gap-[6px] overflow-x-auto"
      >
        {PAGES.map((p) => {
          const on = p.id === page;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setPage(p.id)}
              className={cn(
                "motion-tap shrink-0 rounded-[7px] px-[10px] py-[5px] text-[12.5px] leading-[17px] whitespace-nowrap",
                on
                  ? "bg-pg-surface font-semibold text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]"
                  : "font-medium text-pg-muted hover:bg-pg-surface hover:text-pg-text",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 gap-[12px] pb-[2px]">
        {/*
          The Groups rail, left of the table it filters.

          A rail rather than a select, because a group is a place you stay in
          while you work — you open Sales team and then edit three calendars —
          and a dropdown would close over the answer every time. It is also the
          only surface on this screen where "+ New group" has anywhere to sit
          that is not the page's one primary slot.
        */}
        <div className="flex w-[212px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <div className="flex h-[38px] shrink-0 items-center border-b border-pg-head-border px-[12px]">
            <span className="text-[12.5px] leading-[normal] font-semibold text-pg-heading">
              Groups
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto p-[8px]">
            {calendarGroups.map((g) => {
              const on = g.id === group;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroup(g.id)}
                  className={cn(
                    "motion-tap flex items-center gap-[8px] rounded-[8px] px-[9px] py-[7px] text-left",
                    on
                      ? "bg-brand-soft font-semibold text-brand"
                      : "font-medium text-pg-text hover:bg-pg-bg",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-[17px]">
                    {g.label}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[12px] leading-[16px] tabular-nums",
                      on ? "text-brand" : "text-pg-faint",
                    )}
                  >
                    ({g.count})
                  </span>
                </button>
              );
            })}
            {/*
              Last row of the list, not a footer pinned to the card's bottom.

              Pinned was the first cut and it put New group four hundred pixels
              under the fifth group on a tall canvas — far enough that it read
              as belonging to the page rather than to the list. Here it sits
              where the next group would go, which is what it makes.
            */}
            <button
              type="button"
              className="motion-tap mt-[2px] flex items-center gap-[7px] rounded-[8px] px-[9px] py-[7px] text-left text-[12.5px] leading-[17px] font-semibold text-brand hover:bg-pg-bg"
            >
              <Plus size={14} aria-hidden="true" />
              New group
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
          <div className="flex shrink-0 items-center gap-[10px]">
            <div className="flex h-[34px] min-w-0 flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                type="search"
                placeholder="Search calendars"
                aria-label="Search calendars"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>
            <PrimaryButton>
              <Plus size={16} aria-hidden="true" />
              New calendar
            </PrimaryButton>
          </div>

          {rows.length === 0 ? (
            <CalendarsEmpty />
          ) : (
            <div className="min-h-0 flex-1 overflow-auto rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
              <div
                style={{ gridTemplateColumns: COLS }}
                className="sticky top-0 z-10 grid h-[38px] items-center gap-[12px] border-b border-pg-head-border bg-pg-surface px-[14px]"
              >
                {[
                  "Calendar name",
                  "Group",
                  "Duration",
                  "Type",
                  "Status",
                  "Date updated",
                  "",
                ].map((h, i) => (
                  <span
                    key={h || `blank-${i}`}
                    className="truncate text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {rows.map((row) => (
                <div
                  key={row.id}
                  style={{ gridTemplateColumns: COLS }}
                  className="group grid min-h-[56px] w-full items-center gap-[12px] border-b border-pg-row-border px-[14px] last:border-b-0 hover:bg-pg-bg"
                >
                  <span className="flex min-w-0 flex-col gap-[1px]">
                    {/*
                      The name is the button, not the row — the action column
                      is four buttons and a button inside a button is invalid
                      HTML, the same trap funnels-page documents on its rows.
                    */}
                    <button
                      type="button"
                      onClick={() => onOpen(row)}
                      className="motion-tap truncate text-left text-[13px] leading-[17px] font-medium text-pg-text-strong hover:text-brand"
                    >
                      {row.name}
                    </button>
                    <span className="flex items-center gap-[4px]">
                      <span className="truncate text-[11.5px] leading-[15px] text-pg-faint">
                        {row.ref}
                      </span>
                      <GlyphButton
                        icon={Copy}
                        label={`Copy id for ${row.name}`}
                        size={18}
                      />
                    </span>
                  </span>
                  <span className="truncate text-[13px] leading-[normal] text-pg-text">
                    {row.group}
                  </span>
                  <span className="truncate text-[13px] leading-[normal] text-pg-text">
                    {row.duration}
                  </span>
                  <span className="truncate text-[13px] leading-[normal] text-pg-text">
                    {row.type}
                  </span>
                  <span className="inline-flex h-[22px] w-fit items-center gap-[5px] rounded-[6px] bg-pg-bg px-[8px] text-[12px] leading-[normal] font-medium text-[var(--pg-status-subscribed-fg)]">
                    <span
                      aria-hidden="true"
                      className="size-[6px] rounded-full bg-[var(--pg-status-subscribed-dot)]"
                    />
                    Active
                  </span>
                  <span className="truncate text-[13px] leading-[normal] text-pg-muted">
                    {row.updated}
                  </span>
                  <span className="flex items-center justify-end gap-[2px]">
                    <GlyphButton
                      icon={Pencil}
                      label={`Edit ${row.name}`}
                      onClick={() => onOpen(row)}
                    />
                    <GlyphButton icon={Share2} label={`Share ${row.name}`} />
                    <GlyphButton icon={Wrench} label={`Configure ${row.name}`} />
                    <GlyphButton
                      icon={EllipsisVertical}
                      label={`More actions for ${row.name}`}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The empty state, on the page's own card rather than in place of it.
 *
 * Same 12px radius and same surface as the table it replaces, so switching
 * groups does not change the shape of the region — only what is in it. A
 * borderless centred block would have read as the page failing to load.
 */
function CalendarsEmpty() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[14px] rounded-[12px] bg-pg-surface px-[24px] py-[40px] text-center shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <EmptyIllustration />
      <div className="flex flex-col gap-[4px]">
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          No calendars yet – set one up!
        </h2>
        <p className="max-w-[360px] text-[13px] leading-[18px] text-pg-muted">
          Calendars in this group will show here once you create one.
        </p>
      </div>
      <PrimaryButton>
        <Plus size={16} aria-hidden="true" />
        Create calendar
      </PrimaryButton>
    </div>
  );
}

/**
 * Drawn inline, not fetched.
 *
 * An `<img>` would need a file in `public/`, and a file in `public/` needs a
 * light and a dark twin plus something that decides between them — for one
 * empty state. An inline figure painted out of --pg-* and --brand follows the
 * page theme AND the accent for free, which is the whole reason this prototype
 * has a token layer. A month grid with a plus on it is as much drawing as an
 * empty state should carry: the sentence under it is doing the work.
 */
function EmptyIllustration() {
  return (
    <span
      aria-hidden="true"
      className="flex size-[104px] shrink-0 flex-col justify-start gap-[7px] rounded-[20px] bg-pg-bg p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      <span className="flex items-center gap-[4px]">
        <span className="h-[4px] w-[4px] rounded-full bg-pg-border-strong" />
        <span className="h-[4px] flex-1 rounded-full bg-pg-border-strong" />
        <span className="h-[4px] w-[4px] rounded-full bg-pg-border-strong" />
      </span>
      <span className="grid grid-cols-4 gap-[5px]">
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-[9px] rounded-[3px]",
              i === 5 ? "bg-brand" : "bg-pg-border",
            )}
          />
        ))}
      </span>
      <span className="mt-[2px] flex items-center justify-center text-brand">
        <CalendarPlus size={22} strokeWidth={1.8} />
      </span>
    </span>
  );
}
