"use client";

import * as React from "react";
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  Columns3,
  EllipsisVertical,
  ListFilter,
  Plus,
  Search,
} from "lucide-react";
import {
  OutlineButton,
  PageHeader,
  PrimaryButton,
} from "@/components/page/page-header";
import { usePageCrumb } from "@/components/page/page-crumb";
import { ViewBar } from "@/components/page/view-bar";
import { ToneAvatar } from "@/components/page/avatar";
import { useTheme } from "@/components/theme/theme-provider";
import { SelectButton } from "./calendar-chrome";
import { appointments, appointmentViews } from "./calendars-data";

/**
 * #, Title, Contact, Status, Appointment time, Calendar, Owner, kebab.
 *
 * `#` is 44px and not a checkbox column: the live table numbers its rows and
 * has no bulk actions on them, and swapping the ordinal for a tickbox would
 * have been the prototype proposing a CRUD bar the product does not have.
 * Appointment time is the widest non-title column because one row in ten
 * carries two lines in it — see `rescheduledTo` in calendars-data.
 */
const COLS = "44px 2.1fr 1.3fr 1.2fr 1.5fr 1.2fr 1.2fr 36px";

export interface AppointmentsListProps {
  onNew?: () => void;
}

/**
 * Screen 2: Appointments as a table.
 *
 * This is the screen that obeys `listHeaderVariant`, and it obeys it the way
 * contacts-page does rather than the way funnels-page does — because it is the
 * shape the axis was drawn for: a saved-view row over one collection. The four
 * page-header knobs are already written when a variant is picked, so the title,
 * count and description need nothing here. What a boolean cannot say is WHERE
 * the saved view lives once the title stops naming the page:
 *
 *   L-C / L-D  the ViewBar under the header, which is where it has always been
 *   L-B        a picker on the header's own row, no second count
 *   L-E        the last crumb in the trail, and the actions drop into the
 *              toolbar because a header that is gone cannot carry them
 *
 * The week grid next door sits the axis out, and deliberately: it has no
 * saved views and its own toolbar states the scope (Sep 21 – 27) better than
 * a title could. See the note on its toolbar.
 */
export function AppointmentsList({ onNew }: AppointmentsListProps) {
  const { effective } = useTheme();
  const [view, setView] = React.useState("upcoming");

  const variant = effective.listHeaderVariant;
  const mergedRow = variant === "L-B";
  const scopeInTrail = variant === "L-E";

  const active =
    appointmentViews.find((v) => v.id === view) ?? appointmentViews[0]!;

  /*
   * Only in L-E, and unconditionally within it — including while the calendar
   * settings tab is showing, because the tab is in-page state and the trail
   * has no business flickering when you switch one.
   */
  usePageCrumb(
    scopeInTrail
      ? {
          label: active.label,
          options: appointmentViews.map((v) => ({
            id: v.id,
            label: v.label,
            icon: v.icon,
            selected: v.id === view,
          })),
          onSelect: setView,
        }
      : null,
  );

  /*
   * Built once and placed three ways, which is what keeps the three variants
   * a question about POSITION rather than three toolbars that drifted apart.
   */
  const meetings = <SelectButton label="Calendar type" value="Meetings" />;
  const newButton = (
    <PrimaryButton onClick={onNew}>
      <Plus size={16} aria-hidden="true" />
      New appointment
    </PrimaryButton>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[12px]">
      <PageHeader
        title="Appointments"
        count={mergedRow ? undefined : String(appointments.length)}
        description="Everything booked across this account's calendars"
        lead={mergedRow ? <ViewPicker label={active.label} /> : undefined}
        aside={mergedRow ? undefined : meetings}
        primary={
          scopeInTrail
            ? undefined
            : { label: "New appointment", icon: Plus, onClick: onNew }
        }
      />

      {/*
        The saved-view row leaves the page entirely in the two variants that
        moved it. Hiding it rather than dimming it: a tab strip that is still
        drawn while the trail also switches views is two controls for one
        choice, which is the exact duplication the axis exists to price.
      */}
      {mergedRow || scopeInTrail ? null : (
        <ViewBar
          label="Appointment views"
          views={appointmentViews.map((v) => ({ id: v.id, label: v.label }))}
          activeId={view}
          onSelect={setView}
          /*
            No `onCreate`, even though the row ends in a `+ Smart list`.

            The ViewBar's own create sits flush against the last TAB, and the
            overflow has to come between them — the four hidden views belong
            with the five shown ones, not after the button that makes a sixth.
            So both ride the strip below, in the order the live row has them.
          */
          trailing={
            <button
              type="button"
              className="motion-tap flex items-center gap-[6px] px-[8px] text-[12.5px] leading-none font-medium text-pg-muted hover:text-pg-text"
            >
              <Columns3 size={14} aria-hidden="true" />
              Customize list
            </button>
          }
        />
      )}

      {/*
        `4 More` sits outside the ViewBar, not inside it.

        The bar's contract is that every tab re-cuts the same collection; an
        overflow control re-cuts nothing, it reveals. Passing it in as a view
        would have made it selectable, lit, and permanently wrong.
      */}
      {mergedRow || scopeInTrail ? null : (
        <div className="-mt-[6px] flex shrink-0 items-center gap-[10px]">
          <button
            type="button"
            className="motion-tap flex h-[26px] items-center gap-[5px] rounded-[7px] px-[8px] text-[12.5px] leading-none font-medium text-pg-muted hover:bg-pg-bg hover:text-pg-text"
          >
            4 More
            <ChevronDown size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="motion-tap flex h-[26px] items-center gap-[5px] rounded-[7px] px-[8px] text-[12.5px] leading-none font-semibold text-brand hover:brightness-110"
          >
            <Plus size={13} aria-hidden="true" />
            Smart list
          </button>
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
        <div className="flex h-[34px] min-w-[220px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
          <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="search"
            placeholder="Search by title"
            aria-label="Search appointments by title"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
        <OutlineButton>
          <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
          Advanced filters
          <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-none font-semibold text-brand-fg">
            1
          </span>
        </OutlineButton>
        <OutlineButton>
          <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
          Sort by
          <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-none font-semibold text-brand-fg">
            1
          </span>
        </OutlineButton>
        <OutlineButton>
          <Columns3 size={15} aria-hidden="true" className="text-pg-text-strong" />
          Manage columns
        </OutlineButton>
        {/*
          With no header the Meetings scope and New appointment ride here, on
          the right edge they held when there was one. An appointments page you
          cannot book from is not a header variant, it is a broken page.
        */}
        {scopeInTrail ? (
          <>
            {meetings}
            {newButton}
          </>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div
          style={{ gridTemplateColumns: COLS }}
          className="sticky top-0 z-10 grid h-[38px] items-center gap-[12px] border-b border-pg-head-border bg-pg-surface px-[14px]"
        >
          {[
            "#",
            "Title",
            "Contact",
            "Status",
            "Appointment time",
            "Calendar",
            "Appointment owner",
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

        {appointments.map((a) => (
          <div
            key={a.id}
            style={{ gridTemplateColumns: COLS }}
            className="group grid min-h-[52px] w-full items-center gap-[12px] border-b border-pg-row-border px-[14px] last:border-b-0 hover:bg-pg-bg"
          >
            <span className="text-[12.5px] leading-[normal] text-pg-faint tabular-nums">
              {a.num}
            </span>
            <span className="flex min-w-0 items-center gap-[8px]">
              <Calendar size={15} aria-hidden="true" className="shrink-0 text-brand" />
              <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">
                {a.title}
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-[7px]">
              <ToneAvatar name={a.contact} tone={a.tone} size={24} />
              <span className="truncate text-[13px] leading-[normal] text-pg-text">
                {a.contact}
              </span>
            </span>
            {/*
              A select per row, not a pill.

              Status is the one column an operator EDITS from the table — it is
              how a no-show gets marked — so it gets the control that says so.
              A coloured pill would have been prettier and would have hidden
              the only write action on the screen.
            */}
            <SelectButton
              label={`Status for ${a.title}`}
              value={a.status}
              className="h-[30px] w-fit px-[10px] text-[12.5px]"
            />
            <span className="flex min-w-0 flex-col gap-[2px]">
              {a.rescheduledTo ? (
                <span className="w-fit rounded-[5px] bg-brand-soft px-[6px] py-[1px] text-[11px] leading-[15px] font-semibold text-brand">
                  {a.rescheduledTo}
                </span>
              ) : null}
              <span className="truncate text-[12.5px] leading-[17px] text-pg-text">
                {a.time}{" "}
                <span className="text-pg-faint">(CST)</span>
              </span>
            </span>
            <span className="truncate text-[13px] leading-[normal] text-pg-text">
              {a.calendar}
            </span>
            <span className="truncate text-[13px] leading-[normal] text-pg-text">
              {a.owner}
            </span>
            <button
              type="button"
              aria-label={`Actions for ${a.title}`}
              className="motion-tap flex size-[28px] items-center justify-center rounded-[7px] text-pg-faint opacity-0 group-hover:opacity-100 hover:bg-pg-surface hover:text-pg-text focus-visible:opacity-100"
            >
              <EllipsisVertical size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The merged row's scope control.
 *
 * Static, like every other `▾` on these screens — the views all show the same
 * ten rows in this fiction, so a working menu would change the caption and
 * nothing else, which is a worse lie than a control that plainly does not move.
 */
function ViewPicker({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
    >
      <span className="text-[14px] leading-[normal] font-semibold text-pg-heading">
        {label}
      </span>
      <span className="text-[12.5px] leading-[normal] text-pg-muted">
        {appointments.length}
      </span>
      <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
    </button>
  );
}
