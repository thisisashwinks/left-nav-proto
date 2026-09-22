"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  ListFilter,
  Plus,
  Search,
} from "lucide-react";
import { PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import {
  CheckBox,
  GlyphButton,
  PanelSection,
  PanelToggle,
  RadioDot,
  SelectButton,
} from "./calendar-chrome";
import {
  allDayEvents,
  filterCalendars,
  filterGroups,
  filterUsers,
  hourRows,
  weekDays,
  weekEvents,
  type FilterOption,
} from "./calendars-data";

/**
 * The floor under an hour row, in pixels.
 *
 * A MINIMUM rather than a fixed height, and the events are placed in percent
 * off `hourRows.length` rather than in pixels off this. Fixed pixels were the
 * first cut and they left a third of the canvas empty under 5 PM on a 1000px
 * screen — a week grid that stops two thirds of the way down reads as content
 * that failed to load, not as a day that ends. Proportional rows fill the
 * canvas at any height and this floor is what stops them collapsing to
 * unreadable slivers on a short one, at which point the region scrolls.
 */
const ROW_MIN_H = 44;

/** Ten rows, so one hour is a tenth of the grid. Named once, read three times. */
const HOURS = hourRows.length;

/** Gutter + seven equal days. The gutter holds the zone and the hour labels. */
const GRID_COLS = `64px repeat(7, minmax(0, 1fr))`;

/**
 * Where the red line sits: 1:24 PM, five rows and a bit down.
 *
 * A constant, not `new Date()`. The line has to be in the same place in every
 * screenshot this prototype produces or two captures of the same screen look
 * like two designs — and a review comparing header variants would be reading
 * the difference between 10:05 and 16:40 as a layout change.
 */
const NOW_OFFSET = 5.4;

/** An hour band's share of the grid, as a CSS percentage string. */
const pct = (hours: number) => `${(hours / HOURS) * 100}%`;

const TONE_BLOCK: Record<string, string> = {
  brand: "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_var(--brand)]",
  green:
    "bg-[var(--pg-av-green-bg)] text-[var(--pg-av-green-fg)] shadow-[inset_0_0_0_1px_var(--pg-av-green-fg)]",
  purple:
    "bg-[var(--pg-av-purple-bg)] text-[var(--pg-av-purple-fg)] shadow-[inset_0_0_0_1px_var(--pg-av-purple-fg)]",
  orange:
    "bg-[var(--pg-av-orange-bg)] text-[var(--pg-av-orange-fg)] shadow-[inset_0_0_0_1px_var(--pg-av-orange-fg)]",
};

export interface CalendarWeekViewProps {
  /** Opens the create flow — a no-op here, wired so the button is not dead. */
  onNew?: () => void;
}

/**
 * Screen 1: the week grid, and the Manage view panel beside it.
 *
 * The panel is an inline SideDrawer, not a floating one. Floating is the right
 * default for a panel laid ON a page you keep reading — a record peeked at
 * beside its list — and it is wrong here: this panel FILTERS the grid, so you
 * work the two together, and a card floating over the Saturday and Sunday
 * columns would hide the part of the week you are narrowing. Inline makes the
 * grid narrower instead of hiding a seventh of it.
 */
export function CalendarWeekView({ onNew }: CalendarWeekViewProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [kind, setKind] = React.useState<"all" | "appointments" | "blocked">(
    "all",
  );
  const [buffer, setBuffer] = React.useState(true);
  const [open, setOpen] = React.useState({
    users: true,
    calendars: true,
    groups: false,
  });
  /*
   * Checked filters as a Set, seeded with the one user the recording has on.
   *
   * A Set rather than a flag on each option, for the reason the Voice AI list
   * keeps its selection this way: "is anything filtered" has to be one read,
   * and Clear all has to be one line rather than a map over three arrays.
   */
  const [checked, setChecked] = React.useState<ReadonlySet<string>>(
    () => new Set(filterUsers.filter((u) => u.checked).map((u) => u.id)),
  );

  const toggle = (id: string) =>
    setChecked((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[12px]">
      {/*
        The toolbar carries the primary, which is the one place in this
        prototype where it does not sit in slot 05.

        Not an oversight and not a variant: a week grid's header row is a DATE
        RANGE, and the range is what New is relative to — press it on the 21st
        and you get an appointment that week. Hoisting it to a page header
        would have separated the action from the scope it acts on, which is
        the merged-row variant's whole complaint, arrived at from the other
        direction.
      */}
      <div className="flex shrink-0 flex-wrap items-center gap-[8px]">
        <button
          type="button"
          className="motion-tap flex h-[34px] shrink-0 items-center rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
        >
          Today
        </button>
        <div className="flex shrink-0 items-center gap-[2px]">
          <GlyphButton icon={ChevronLeft} label="Previous week" size={30} />
          <GlyphButton icon={ChevronRight} label="Next week" size={30} />
        </div>
        <span className="shrink-0 px-[4px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-pg-heading">
          Sep 21 – 27, 2026
        </span>
        <SelectButton label="Grid density" value="Week view" />
        <SelectButton label="Calendar type" value="Meetings" />
        {/*
          The lightbulb is the product's tips launcher and it is kept as a
          glyph on purpose — it is the one control on this row that does not
          change what you are looking at, and giving it a word would put it in
          the same reading order as the four that do.
        */}
        <GlyphButton icon={Lightbulb} label="Scheduling tips" size={30} />

        <div className="flex-1" />

        <button
          type="button"
          aria-pressed={panelOpen}
          onClick={() => setPanelOpen((v) => !v)}
          className={cn(
            "motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] px-[14px] text-[13px] leading-[normal] font-medium whitespace-nowrap active:scale-[0.97]",
            panelOpen
              ? "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
              : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          )}
        >
          <ListFilter size={15} aria-hidden="true" />
          Manage view
          {checked.size > 0 ? (
            <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-none font-semibold text-brand-fg">
              {checked.size}
            </span>
          ) : null}
        </button>
        <PrimaryButton onClick={onNew}>
          <Plus size={16} aria-hidden="true" />
          New
        </PrimaryButton>
      </div>

      <div className="flex min-h-0 flex-1 gap-[12px] pb-[2px]">
        <WeekGrid />
        {panelOpen ? (
          <SideDrawer
            inline
            width={320}
            title="Manage view"
            onClose={() => setPanelOpen(false)}
            bodyClassName="px-[14px] py-[10px]"
          >
            <fieldset className="flex flex-col gap-[2px] pb-[6px]">
              <legend className="pb-[4px] text-[13px] leading-[18px] font-semibold text-pg-heading">
                View by type
              </legend>
              {(
                [
                  { id: "all", label: "All" },
                  { id: "appointments", label: "Appointments" },
                  { id: "blocked", label: "Blocked slots" },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={kind === o.id}
                  onClick={() => setKind(o.id)}
                  className="motion-tap flex items-center gap-[9px] rounded-[7px] px-[2px] py-[6px] text-left hover:bg-pg-bg"
                >
                  <RadioDot on={kind === o.id} />
                  <span className="text-[13px] leading-[18px] text-pg-text">
                    {o.label}
                  </span>
                </button>
              ))}
            </fieldset>

            <div className="flex items-center gap-[12px] border-t border-pg-row-border py-[12px]">
              <span className="min-w-0 flex-1 text-[13px] leading-[18px] font-medium text-pg-text-strong">
                Show buffer time
              </span>
              <PanelToggle
                on={buffer}
                onToggle={() => setBuffer((v) => !v)}
                label="Show buffer time"
              />
            </div>

            <div className="flex items-center gap-[12px] border-t border-pg-row-border pt-[12px] pb-[8px]">
              <span className="min-w-0 flex-1 text-[13px] leading-[18px] font-semibold text-pg-heading">
                Filters
              </span>
              {/*
                Always present, never disabled.

                A Clear all that greys out when nothing is filtered is the
                control telling you what it would have done — which is a
                tooltip's job. It costs nothing to press with an empty Set and
                it stops the header reflowing the moment you tick a box.
              */}
              <button
                type="button"
                onClick={() => setChecked(new Set())}
                className="motion-tap shrink-0 rounded-[6px] text-[12.5px] leading-[16px] font-semibold text-brand hover:brightness-110"
              >
                Clear all
              </button>
            </div>

            <div className="flex h-[34px] items-center gap-[9px] rounded-[8px] bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                type="search"
                placeholder="Search"
                aria-label="Search filters"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>

            <div className="pt-[6px]">
              <PanelSection
                title="Users"
                open={open.users}
                onToggle={() => setOpen((s) => ({ ...s, users: !s.users }))}
              >
                {filterUsers.map((u) => (
                  <FilterRow
                    key={u.id}
                    option={u}
                    on={checked.has(u.id)}
                    onToggle={() => toggle(u.id)}
                  />
                ))}
                {/*
                  302 more, and the count is the finding.

                  Left as plain text rather than a link to a picker: this
                  prototype has no user directory to open, and a button that
                  opens nothing is worse than a label that states the size of
                  the problem.
                */}
                <span className="px-[2px] py-[7px] text-[12.5px] leading-[16px] font-medium text-brand">
                  See more (+302)
                </span>
              </PanelSection>

              <PanelSection
                title="Calendars"
                open={open.calendars}
                onToggle={() =>
                  setOpen((s) => ({ ...s, calendars: !s.calendars }))
                }
              >
                {filterCalendars.map((c) => (
                  <FilterRow
                    key={c.id}
                    option={c}
                    on={checked.has(c.id)}
                    onToggle={() => toggle(c.id)}
                  />
                ))}
              </PanelSection>

              <PanelSection
                title="Groups"
                open={open.groups}
                onToggle={() => setOpen((s) => ({ ...s, groups: !s.groups }))}
              >
                {filterGroups.map((g) => (
                  <FilterRow
                    key={g.id}
                    option={g}
                    on={checked.has(g.id)}
                    onToggle={() => toggle(g.id)}
                  />
                ))}
              </PanelSection>
            </div>
          </SideDrawer>
        ) : null}
      </div>
    </div>
  );
}

function FilterRow({
  option,
  on,
  onToggle,
}: {
  option: FilterOption;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onToggle}
      className="motion-tap flex items-center gap-[9px] rounded-[7px] px-[2px] py-[5px] text-left hover:bg-pg-bg"
    >
      <CheckBox on={on} />
      <ToneAvatar name={option.label} tone={option.tone} size={22} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] leading-[17px] text-pg-text">
          {option.label}
        </span>
        {option.sub ? (
          <span className="truncate text-[11.5px] leading-[15px] text-pg-faint">
            {option.sub}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * The grid itself: zone gutter, seven day heads, an All day row, ten hours.
 *
 * One card with three stacked regions rather than three cards, because the
 * day columns have to line up across all three and the only way to guarantee
 * that is for all three to be the same grid template. `GRID_COLS` is declared
 * once above and handed to each region for exactly that reason.
 */
function WeekGrid() {
  return (
    <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div
        style={{ gridTemplateColumns: GRID_COLS }}
        className="grid shrink-0 border-b border-pg-head-border"
      >
        <div className="flex items-center justify-center px-[6px] py-[9px]">
          <span className="text-[11px] leading-[14px] font-medium text-pg-faint">
            GMT-06:00
          </span>
        </div>
        {weekDays.map((d) => (
          <div
            key={d.date}
            className="flex flex-col items-center gap-[1px] border-l border-pg-row-border py-[7px]"
          >
            <span
              className={cn(
                "text-[16px] leading-[20px] font-semibold",
                d.weekend ? "text-[var(--pg-danger)]" : "text-pg-heading",
              )}
            >
              {d.date}
            </span>
            <span
              className={cn(
                "text-[11.5px] leading-[14px] font-medium uppercase",
                d.weekend ? "text-[var(--pg-danger)]" : "text-pg-faint",
              )}
            >
              {d.weekday}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{ gridTemplateColumns: GRID_COLS }}
        className="grid shrink-0 border-b border-pg-head-border bg-pg-bg"
      >
        <div className="flex items-center justify-end px-[8px] py-[7px]">
          <span className="text-[11px] leading-[14px] font-medium text-pg-faint">
            All day
          </span>
        </div>
        {weekDays.map((d, i) => {
          const banner = allDayEvents.find((e) => e.day === i);
          return (
            <div
              key={d.date}
              style={banner ? { gridColumn: `span ${banner.span}` } : undefined}
              className={cn(
                "border-l border-pg-row-border px-[4px] py-[5px]",
                // A banner that spans two days eats the next column, so the
                // column it swallowed must not also draw itself.
                allDayEvents.some((e) => i > e.day && i < e.day + e.span) &&
                  "hidden",
              )}
            >
              {banner ? (
                <span className="flex h-[20px] items-center truncate rounded-[5px] bg-brand px-[7px] text-[11.5px] leading-none font-semibold text-brand-fg">
                  {banner.label}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <div
          style={{
            gridTemplateColumns: GRID_COLS,
            minHeight: HOURS * ROW_MIN_H,
          }}
          className="relative grid flex-1"
        >
          <div className="flex flex-col">
            {hourRows.map((h) => (
              <span
                key={h}
                className="flex flex-1 justify-end pr-[8px] pt-[2px] text-[11px] leading-[14px] font-medium whitespace-nowrap text-pg-faint"
              >
                {h}
              </span>
            ))}
          </div>

          {weekDays.map((d, dayIndex) => (
            <div
              key={d.date}
              className="relative flex flex-col border-l border-pg-row-border"
            >
              {hourRows.map((h) => (
                <div
                  key={h}
                  className="flex-1 border-b border-pg-row-border last:border-b-0"
                />
              ))}
              {weekEvents
                .filter((e) => e.day === dayIndex)
                .map((e) => (
                  <div
                    key={e.id}
                    style={{
                      top: pct(e.hour + (e.offset ?? 0)),
                      height: `calc(${pct(e.span)} - 3px)`,
                    }}
                    className={cn(
                      "absolute inset-x-[3px] overflow-hidden rounded-[6px] px-[6px] py-[3px]",
                      TONE_BLOCK[e.tone],
                      // Blocked slots read as unavailability, not as a booking:
                      // a soft diagonal wash over the same tone, so the two
                      // are the same object at different opacities rather than
                      // two colour systems on one grid.
                      e.blocked &&
                        "bg-[repeating-linear-gradient(135deg,var(--pg-bg)_0px,var(--pg-bg)_5px,var(--pg-surface)_5px,var(--pg-surface)_10px)] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                    )}
                  >
                    <span className="block truncate text-[11.5px] leading-[15px] font-semibold">
                      {e.title}
                    </span>
                    <span className="block truncate text-[11px] leading-[14px] opacity-80">
                      {e.sub}
                    </span>
                  </div>
                ))}
            </div>
          ))}

          {/*
            The now line, drawn over every column at once.

            One element spanning the seven days rather than seven segments:
            "now" is a property of the week, not of Wednesday, and seven
            separately positioned lines is seven chances for one of them to
            land a pixel off and read as a stepped line.
          */}
          <div
            aria-hidden="true"
            style={{ top: pct(NOW_OFFSET), left: 64 }}
            className="pointer-events-none absolute right-0 flex items-center"
          >
            <span className="size-[7px] shrink-0 rounded-full bg-[var(--pg-danger)]" />
            <span className="h-[1.5px] flex-1 bg-[var(--pg-danger)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
