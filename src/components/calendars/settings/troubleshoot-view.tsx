"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  RotateCw,
  Wrench,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { FIELD } from "./edit-controls";

/**
 * 103 — the Troubleshooting view: the booking widget as a contact sees it,
 * except every slot is listed, and each unavailable one says why.
 *
 * "Today" and "now" are the real clock read in the chosen time zone, so
 * switching zones moves which slots are past — the thing people open this
 * view to check. Availability is the prototype's working hours
 * (Mon–Fri, 9:00 AM–5:00 PM) with a daily 1:00 PM hold as a sample conflict.
 *
 * Portalled and re-stamped with the page theme, like Modal, so the shell's
 * overflow can't clip it; Escape closes it.
 */

const ZONES = [
  { id: "Asia/Calcutta", abbr: "IST" },
  { id: "America/Chicago", abbr: "CT" },
  { id: "America/New_York", abbr: "ET" },
  { id: "America/Los_Angeles", abbr: "PT" },
  { id: "Europe/London", abbr: "UK" },
  { id: "UTC", abbr: "UTC" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_START = 9 * 60;
const DAY_END = 17 * 60;
const HOLD = 13 * 60;
const STEP = 30;

type Ymd = { y: number; m: number; d: number };

/** Calendar date and minutes past midnight of an instant, in a time zone. */
function zonedNow(ms: number, timeZone: string): Ymd & { minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: n("year"), m: n("month") - 1, d: n("day"), minutes: n("hour") * 60 + n("minute") };
}

function zoneLabel(ms: number, zone: (typeof ZONES)[number]) {
  let offset = "GMT";
  try {
    offset =
      new Intl.DateTimeFormat("en-US", { timeZone: zone.id, timeZoneName: "longOffset" })
        .formatToParts(new Date(ms))
        .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  } catch {
    // Older engines lack longOffset; the zone name alone still reads fine.
  }
  return `${offset === "GMT" ? "GMT+00:00" : offset} ${zone.id} (${zone.abbr})`;
}

const utc = ({ y, m, d }: Ymd) => new Date(Date.UTC(y, m, d));
const cmp = (a: Ymd, b: Ymd) => utc(a).getTime() - utc(b).getTime();
const isWeekend = (day: Ymd) => {
  const w = utc(day).getUTCDay();
  return w === 0 || w === 6;
};
const longDate = (day: Ymd) =>
  utc(day).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

type SlotState =
  | { kind: "available" }
  | { kind: "past" | "outside" | "conflict"; badge: string; reason: string };

function slotState(day: Ymd, min: number, today: Ymd, nowMin: number): SlotState {
  const c = cmp(day, today);
  if (c < 0 || (c === 0 && min <= nowMin))
    return { kind: "past", badge: "Past", reason: "Past time — this slot has already started." };
  if (isWeekend(day))
    return {
      kind: "outside",
      badge: "Off day",
      reason: "Outside availability — no working hours on weekends.",
    };
  if (min < DAY_START || min >= DAY_END)
    return {
      kind: "outside",
      badge: "Off hours",
      reason: "Outside availability — working hours are 9:00 AM–5:00 PM.",
    };
  if (min === HOLD)
    return {
      kind: "conflict",
      badge: "Busy",
      reason: "Conflicts with “Lunch hold” on the team member's Google calendar.",
    };
  return { kind: "available" };
}

export function TroubleshootView({
  name,
  durationLabel,
  onClose,
}: {
  name: string;
  durationLabel: string;
  onClose: () => void;
}) {
  const { effective } = useTheme();
  const [now, setNow] = React.useState(() => Date.now());
  const [zoneId, setZoneId] = React.useState(ZONES[0]!.id);
  const zoned = zonedNow(now, zoneId);
  const today: Ymd = { y: zoned.y, m: zoned.m, d: zoned.d };

  const [picked, setPicked] = React.useState<Ymd | null>(null);
  const [view, setView] = React.useState<{ y: number; m: number } | null>(null);
  const [slot, setSlot] = React.useState<number | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Until someone picks, the view follows "today" in the chosen zone.
  const selected = picked && cmp(picked, today) >= 0 ? picked : today;
  const month = view ?? { y: today.y, m: today.m };

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const refresh = () => {
    setNow(Date.now());
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 600);
    showToast("Availability refreshed.");
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(month.y, month.m + delta, 1));
    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };

  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(month.y, month.m, 1)).getUTCDay() + 6) % 7;
  const atCurrentMonth = month.y === today.y && month.m === today.m;
  const monthLabel = new Date(Date.UTC(month.y, month.m, 1)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });

  const slots = Array.from({ length: (24 * 60) / STEP }, (_, i) => i * STEP);
  const openCount = slots.filter(
    (m) => slotState(selected, m, today, zoned.minutes).kind === "available",
  ).length;
  const selectedState = slot !== null ? slotState(selected, slot, today, zoned.minutes) : null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      role="dialog"
      aria-modal="true"
      aria-label="Troubleshooting view"
      className="fixed inset-0 z-[90] overflow-y-auto bg-pg-surface px-[16px] py-[48px] sm:py-[88px]"
    >
      <div className="mx-auto flex w-full max-w-[960px] flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border),0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]">
        <header className="flex h-[44px] items-center gap-[12px] border-b border-[color-mix(in_oklab,var(--brand)_35%,transparent)] bg-[color-mix(in_oklab,var(--brand)_6%,var(--pg-surface))] px-[20px]">
          <span className="flex flex-1 items-center gap-[8px] text-[14px] leading-[20px] font-medium text-brand">
            <Wrench size={16} aria-hidden="true" />
            Troubleshooting view
          </span>
          <button
            type="button"
            onClick={refresh}
            className="flex h-[30px] items-center gap-[6px] rounded-[6px] px-[8px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:bg-brand-soft"
          >
            <RotateCw
              size={15}
              aria-hidden="true"
              className={cn("transition-transform duration-500", refreshing && "rotate-[360deg]")}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close troubleshooting view"
            className="flex size-[30px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[316px_1fr]">
          {/* Left — what is being booked. */}
          <aside className="flex flex-col gap-[12px] border-b border-pg-head-border px-[22px] pt-[36px] pb-[24px] md:border-r md:border-b-0">
            <h2 className="text-[20px] leading-[28px] font-medium break-words text-pg-heading">
              {name.trim() || "Untitled calendar"}
            </h2>
            <span className="flex items-center gap-[8px] text-[13px] leading-[18px] text-pg-muted">
              <Clock size={16} aria-hidden="true" />
              {durationLabel}
            </span>
            <span className="flex items-center gap-[8px] text-[13px] leading-[18px] text-pg-muted">
              <CalendarDays size={16} aria-hidden="true" />
              {longDate(selected)}
              {slot !== null ? `, ${hhmm(slot)}` : ""}
            </span>
            <div className="mt-[12px] flex flex-col gap-[6px] rounded-[8px] bg-pg px-[12px] py-[10px] text-[13px] leading-[18px] text-pg-muted">
              <span className="font-medium text-pg-text-strong">
                {openCount === 0
                  ? "No open slots on this day"
                  : `${openCount} open ${openCount === 1 ? "slot" : "slots"} on this day`}
              </span>
              {selectedState ? (
                <span>
                  {hhmm(slot!)} —{" "}
                  {selectedState.kind === "available"
                    ? "Available. No conflicts found."
                    : selectedState.reason}
                </span>
              ) : (
                <span>Select a slot to see why it is or isn&apos;t bookable.</span>
              )}
            </div>
          </aside>

          {/* Right — the widget: date picker and slots. */}
          <div className="grid grid-cols-1 gap-[24px] px-[24px] pt-[28px] pb-[24px] sm:grid-cols-[1fr_232px]">
            <div className="flex flex-col gap-[16px]">
              <h3 className="text-[15px] leading-[22px] font-medium text-pg-heading">
                Select date & time
              </h3>
              <div className="flex items-center justify-center gap-[20px]">
                <button
                  type="button"
                  aria-label="Previous month"
                  disabled={atCurrentMonth}
                  onClick={() => shiftMonth(-1)}
                  className="flex size-[36px] items-center justify-center rounded-full text-pg-muted motion-tap hover:bg-pg disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <span className="min-w-[136px] text-center text-[15px] leading-[22px] text-pg-heading">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => shiftMonth(1)}
                  className="flex size-[36px] items-center justify-center rounded-full bg-brand-soft text-brand motion-tap hover:brightness-95"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-7 justify-items-center gap-x-[4px] gap-y-[10px]">
                {WEEKDAYS.map((w) => (
                  <span
                    key={w}
                    className="pb-[6px] text-[13px] leading-[18px] font-medium text-pg-text-strong"
                  >
                    {w}
                  </span>
                ))}
                {Array.from({ length: lead }, (_, i) => (
                  <span key={`lead-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = { y: month.y, m: month.m, d: i + 1 };
                  const c = cmp(day, today);
                  const past = c < 0;
                  const isToday = c === 0;
                  const isSel = cmp(day, selected) === 0;
                  const weekend = isWeekend(day);
                  return (
                    <button
                      key={day.d}
                      type="button"
                      disabled={past}
                      aria-pressed={isSel}
                      aria-label={`${longDate(day)}${isToday ? ", today" : ""}${past ? ", past" : weekend ? ", no availability" : ""}`}
                      onClick={() => {
                        setPicked(day);
                        setSlot(null);
                      }}
                      className={cn(
                        "relative flex size-[40px] items-center justify-center rounded-full text-[14px] leading-none motion-tap",
                        past &&
                          "cursor-not-allowed border border-dashed border-[color-mix(in_oklab,var(--brand)_40%,transparent)] text-pg-faint",
                        !past &&
                          !isSel &&
                          (weekend
                            ? "border border-dashed border-pg-border text-pg-muted hover:bg-pg"
                            : "border border-[color-mix(in_oklab,var(--brand)_55%,transparent)] bg-brand-soft font-medium text-brand hover:brightness-95"),
                        isSel && "bg-brand font-semibold text-brand-fg",
                      )}
                    >
                      {day.d}
                      {isToday ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute bottom-[5px] size-[3px] rounded-full",
                            isSel ? "bg-brand-fg" : "bg-brand",
                          )}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-[6px] pt-[8px]">
                <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
                  Time zone
                </span>
                <label className="relative flex items-center">
                  <Globe
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[12px] text-pg-muted"
                  />
                  <select
                    aria-label="Time zone"
                    value={zoneId}
                    onChange={(e) => {
                      setZoneId(e.target.value);
                      setPicked(null);
                      setView(null);
                      setSlot(null);
                    }}
                    className={cn(FIELD, "cursor-pointer appearance-none pr-[34px] pl-[34px]")}
                  >
                    {ZONES.map((z) => (
                      <option key={z.id} value={z.id}>
                        {zoneLabel(now, z)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-[12px] text-pg-faint"
                  />
                </label>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-[12px] pt-[34px]">
              <h3 className="text-[15px] leading-[22px] font-medium text-pg-heading">
                Choose slot
              </h3>
              <ul className="flex max-h-[500px] flex-col gap-[10px] overflow-y-auto py-[2px] pr-[6px] pl-[2px]">
                {slots.map((min) => {
                  const st = slotState(selected, min, today, zoned.minutes);
                  const isSel = slot === min;
                  const open = st.kind === "available";
                  return (
                    <li key={min}>
                      <button
                        type="button"
                        aria-pressed={isSel}
                        onClick={() => setSlot(isSel ? null : min)}
                        className={cn(
                          "group/slot flex w-full flex-col items-center gap-[4px] rounded-[6px] px-[8px] py-[10px] text-center motion-tap",
                          open
                            ? "border border-[color-mix(in_oklab,var(--brand)_55%,transparent)] hover:bg-brand-soft"
                            : "border border-dashed border-pg-border hover:bg-pg",
                          isSel &&
                            (open
                              ? "border-brand bg-brand-soft shadow-[0_0_0_1px_var(--brand)]"
                              : "border-pg-muted bg-pg"),
                        )}
                      >
                        <span
                          className={cn(
                            "text-[14px] leading-[20px] font-semibold",
                            open ? "text-brand" : "text-pg-heading",
                          )}
                        >
                          {hhmm(min)}
                        </span>
                        {open ? (
                          <span className="text-[10px] leading-[14px] font-semibold tracking-[0.02em] text-[var(--hr-success-700)] uppercase">
                            Available
                          </span>
                        ) : (
                          <>
                            <span className="text-[10px] leading-[14px] font-semibold tracking-[0.02em] text-[var(--hr-error-600)] uppercase">
                              Unavailable
                            </span>
                            <span className="rounded-[4px] px-[5px] py-[1px] text-[10px] leading-[14px] font-semibold text-pg-text-strong uppercase shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
                              {st.badge}
                            </span>
                          </>
                        )}
                        <span
                          className={cn(
                            "text-[12px] leading-[16px] text-pg-muted",
                            isSel ? "block" : "hidden group-hover/slot:block group-focus-visible/slot:block",
                          )}
                        >
                          {open ? "No conflicts found." : st.reason.split(" — ")[0]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
