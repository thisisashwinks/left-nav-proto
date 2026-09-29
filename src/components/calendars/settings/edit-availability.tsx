"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { Toggle } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import { staffById } from "./cal-settings-store";
import { StaffAvatar } from "./builder-fields";
import {
  DAYS,
  TIME_OPTIONS,
  TIMEZONES,
  hoursFor,
  setStaffHours,
  summarizeHours,
  useStaffHours,
  type WeeklyHours,
} from "./builder-hours";
import {
  FIELD,
  Field,
  InfoTip,
  PlainSelect,
  SectionCard,
  SwitchRow,
  type SectionProps,
} from "./edit-controls";

/** 90 — whose hours the slots come from, and whether a booking repeats. */

const REPEAT = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function AvailabilitySection({ draft, patch }: SectionProps) {
  const allHours = useStaffHours();
  const [editing, setEditing] = React.useState<string | null>(null);
  /*
   * The recurrence detail is builder-local: CalendarDraft carries only the
   * switch, and the section stays mounted while the rail moves between
   * sections, so these survive a trip to Booking rules and back.
   */
  const [repeat, setRepeat] = React.useState("weekly");
  const [count, setCount] = React.useState<number | null>(4);
  const staff = draft.staffIds.flatMap((id) => staffById(id) ?? []);

  return (
    <SectionCard
      title="Availability schedule"
      description="Set when meetings can be booked based on staff availability."
    >
      <Field
        label="Booking availability"
        info="Slots come from each staff member's working hours. Open a row to change them."
      >
        {staff.length === 0 ? (
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Add staff in Staff &amp; location to set their availability.
          </p>
        ) : (
          <div className="flex flex-col gap-[8px]">
            {staff.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setEditing(s.id)}
                className="motion-tap flex w-full max-w-[515px] items-center gap-[12px] rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
              >
                <StaffAvatar initials={s.initials} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
                    {s.name}
                  </span>
                  <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                    {summarizeHours(hoursFor(allHours, s.id))}
                  </span>
                </span>
                <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
              </button>
            ))}
          </div>
        )}
      </Field>

      <div className="h-px bg-[var(--pg-head-border)]" aria-hidden="true" />

      <SwitchRow
        checked={draft.recurring}
        onChange={(recurring) => patch({ recurring })}
        label="Recurring meeting"
        info="Book a series in one go — the contact's slot repeats on the schedule you set."
      />
      {draft.recurring ? (
        <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
          <Field label="Repeat" info="How often the meeting repeats after the first booking.">
            <PlainSelect aria-label="Repeat" value={repeat} onChange={setRepeat} options={REPEAT} />
          </Field>
          <Field
            label="Number of recurrences"
            info="How many meetings the series books, including the first."
          >
            <input
              type="number"
              min={1}
              aria-label="Number of recurrences"
              value={count ?? ""}
              onChange={(e) =>
                setCount(e.target.value === "" ? null : Math.max(1, Number(e.target.value)))
              }
              className={FIELD}
            />
          </Field>
        </div>
      ) : null}

      {editing ? (
        <HoursModal
          key={editing}
          name={staffById(editing)?.name ?? ""}
          initial={hoursFor(allHours, editing)}
          onClose={() => setEditing(null)}
          onSave={(h) => {
            setStaffHours(editing, h);
            setEditing(null);
          }}
        />
      ) : null}
    </SectionCard>
  );
}

/** A teammate's working week: each day on or off, with its hours, and a timezone. */
function HoursModal({
  name,
  initial,
  onClose,
  onSave,
}: {
  name: string;
  initial: WeeklyHours;
  onClose: () => void;
  onSave: (h: WeeklyHours) => void;
}) {
  const [h, setH] = React.useState(initial);
  const setDay = (d: (typeof DAYS)[number], p: Partial<WeeklyHours["days"]["Mon"]>) =>
    setH({ ...h, days: { ...h.days, [d]: { ...h.days[d], ...p } } });

  const timeSelect = (value: string, onChange: (v: string) => void, label: string, disabled: boolean) => (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(FIELD, "w-[120px] cursor-pointer appearance-none")}
    >
      {TIME_OPTIONS.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );

  return (
    <Modal
      title={`Working hours — ${name}`}
      width={520}
      onClose={onClose}
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={() => onSave(h)}>Save hours</PrimaryButton>
        </>
      }
    >
      <p className="text-[13px] leading-[18px] text-pg-muted">
        Meetings on this calendar can only be booked inside these hours.
      </p>
      <div className="flex flex-col gap-[6px] pt-[8px]">
        <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
          Timezone
          <InfoTip text="Slots are offered in this timezone, then shown to contacts in theirs." />
        </span>
        <PlainSelect
          aria-label="Timezone"
          value={h.timezone}
          onChange={(timezone) => setH({ ...h, timezone })}
          options={TIMEZONES}
        />
      </div>
      <div className="flex flex-col pt-[8px]">
        {DAYS.map((d) => {
          const day = h.days[d];
          return (
            <div
              key={d}
              className="flex h-[48px] items-center gap-[12px] border-b border-pg-row-border last:border-b-0"
            >
              <Toggle
                checked={day.on}
                onChange={(on) => setDay(d, { on })}
                aria-label={`Available on ${d}`}
              />
              <span className="w-[40px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
                {d}
              </span>
              {day.on ? (
                <span className="flex items-center gap-[8px]">
                  {timeSelect(day.start, (start) => setDay(d, { start }), `${d} start time`, false)}
                  <span className="text-pg-muted">–</span>
                  {timeSelect(day.end, (end) => setDay(d, { end }), `${d} end time`, false)}
                </span>
              ) : (
                <span className="text-[14px] leading-[20px] text-pg-muted">Unavailable</span>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
