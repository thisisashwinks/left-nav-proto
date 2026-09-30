"use client";

import { Plus, Trash2 } from "lucide-react";
import { Toggle } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import {
  FIELD,
  Field,
  InfoTip,
  SectionCard,
  Stepper,
  SwitchRow,
  UnitField,
  type SectionProps,
} from "./edit-controls";

/** 91 — the slot grid's arithmetic: length, spacing, notice, buffers and caps. */

export function BookingRulesSection({ draft, patch }: SectionProps) {
  const setExtra = (i: number, v: number | null) =>
    patch({ extraDurations: draft.extraDurations.map((d, j) => (j === i ? (v ?? 0) : d)) });

  return (
    <SectionCard title="Booking rules" description="Control how and when meetings can be booked.">
      <div className="flex w-full flex-col gap-[20px] md:max-w-[calc(50%-16px)]">
        <Field
          label="Meeting interval"
          info="How far apart slot start times are. 30 minutes offers 9:00, 9:30, 10:00, and so on."
        >
          <UnitField
            aria-label="Meeting interval"
            value={draft.intervalValue}
            onChange={(v) => patch({ intervalValue: v ?? 0 })}
            unit={draft.intervalUnit}
            onUnitChange={(intervalUnit) => patch({ intervalUnit })}
          />
        </Field>

        <div className="flex flex-col gap-[10px]">
          <Field label="Meeting duration" info="How long each meeting lasts.">
            <UnitField
              aria-label="Meeting duration"
              value={draft.durationValue}
              onChange={(v) => patch({ durationValue: v ?? 0 })}
              unit={draft.durationUnit}
              onUnitChange={(durationUnit) => patch({ durationUnit })}
            />
          </Field>
          {draft.extraDurations.map((d, i) => (
            <div key={i} className="flex items-center gap-[8px]">
              <UnitField
                aria-label={`Additional duration ${i + 1}`}
                value={d}
                onChange={(v) => setExtra(i, v)}
                unit={draft.durationUnit}
                // Extra lengths share the main duration's unit, as live.
                units={[draft.durationUnit]}
                onUnitChange={() => undefined}
              />
              <button
                type="button"
                aria-label={`Remove duration ${i + 1}`}
                title="Remove duration"
                onClick={() =>
                  patch({ extraDurations: draft.extraDurations.filter((_, j) => j !== i) })
                }
                className="motion-tap flex size-[36px] shrink-0 items-center justify-center rounded-[8px] text-pg-text-strong hover:bg-pg hover:text-[var(--hr-error-600)]"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-[6px]">
            <button
              type="button"
              onClick={() =>
                patch({ extraDurations: [...draft.extraDurations, draft.durationValue * 2 || 60] })
              }
              className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-brand hover:underline"
            >
              <Plus size={16} aria-hidden="true" />
              Add another duration
            </button>
            <InfoTip text="Let contacts choose how long to book, (eg) 30 or 60 minutes." />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-[32px] gap-y-[20px] md:grid-cols-2">
        <Field
          label="Minimum scheduling notice"
          info="The least time ahead a meeting can be booked. Stops last-minute bookings."
        >
          <UnitField
            aria-label="Minimum scheduling notice"
            value={draft.minNoticeValue}
            onChange={(minNoticeValue) => patch({ minNoticeValue })}
            unit={draft.minNoticeUnit}
            onUnitChange={(minNoticeUnit) => patch({ minNoticeUnit })}
            units={["minutes", "hours", "days", "weeks"]}
          />
        </Field>
        <div className="flex flex-col gap-[10px]">
          <Field
            label="Date range"
            info="How far into the future contacts can book. Leave blank for no limit."
          >
            <UnitField
              aria-label="Date range"
              value={draft.dateRangeValue}
              onChange={(dateRangeValue) => patch({ dateRangeValue })}
              unit={draft.dateRangeUnit}
              onUnitChange={(dateRangeUnit) => patch({ dateRangeUnit })}
              units={["days", "weeks"]}
            />
          </Field>
          <div className="flex items-center gap-[8px]">
            <Toggle
              checked={draft.countAvailableDaysOnly}
              onChange={(countAvailableDaysOnly) => patch({ countAvailableDaysOnly })}
              aria-label="Count available days only"
            />
            <span className="text-[14px] leading-[20px] text-pg-text-strong">
              Count available days only
            </span>
            <InfoTip text="Count only days with open slots toward the date range, skipping days off." />
          </div>
        </div>

        <Field label="Pre buffer time" info="Blocked time before each meeting, to prepare.">
          <UnitField
            aria-label="Pre buffer time"
            value={draft.preBufferValue}
            onChange={(preBufferValue) => patch({ preBufferValue })}
            unit={draft.preBufferUnit}
            onUnitChange={(preBufferUnit) => patch({ preBufferUnit })}
            units={["minutes", "hours"]}
          />
        </Field>
        <Field label="Post buffer time" info="Blocked time after each meeting, to wrap up.">
          <UnitField
            aria-label="Post buffer time"
            value={draft.postBufferValue}
            onChange={(postBufferValue) => patch({ postBufferValue })}
            unit={draft.postBufferUnit}
            onUnitChange={(postBufferUnit) => patch({ postBufferUnit })}
            units={["minutes", "hours"]}
          />
        </Field>

        <Field
          label="Maximum bookings per day"
          info="Once this many meetings are booked in a day, its remaining slots close. Leave blank for no limit."
        >
          <Stepper
            aria-label="Maximum bookings per day"
            value={draft.maxPerDay}
            onChange={(maxPerDay) => patch({ maxPerDay })}
            min={1}
          />
        </Field>
        <Field
          label="Maximum bookings per slot"
          info="How many contacts can book the same time. Above 1, a slot is shared."
        >
          <Stepper
            aria-label="Maximum bookings per slot"
            value={draft.maxPerSlot}
            onChange={(v) => patch({ maxPerSlot: v ?? 1 })}
            min={1}
          />
        </Field>
      </div>

      <div className="flex w-full flex-col gap-[12px] md:max-w-[calc(50%-16px)]">
        <SwitchRow
          checked={draft.lookBusy}
          onChange={(lookBusy) => patch({ lookBusy })}
          label="Look busy"
          info="Show fewer open slots than you have, so the calendar looks in demand. Bookings aren't affected."
        />
        <div className="flex flex-col gap-[6px]">
          <label className={cn("relative flex items-center", !draft.lookBusy && "cursor-not-allowed")}>
            <input
              type="number"
              min={0}
              max={100}
              aria-label="Look busy percentage"
              disabled={!draft.lookBusy}
              value={draft.lookBusyPercent}
              onChange={(e) =>
                patch({
                  lookBusyPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                })
              }
              className={cn(FIELD, "pr-[32px] [&::-webkit-inner-spin-button]:appearance-none")}
            />
            <span className="pointer-events-none absolute right-[12px] text-[14px] leading-[20px] text-pg-faint">
              %
            </span>
          </label>
          <span className="text-[13px] leading-[18px] text-pg-muted">
            Hide the number of available slots by x%.
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
