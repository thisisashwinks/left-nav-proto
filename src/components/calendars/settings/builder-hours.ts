"use client";

import * as React from "react";

/**
 * Each staff member's weekly working hours, as the Availability section's
 * rows open and edit them.
 *
 * Kept per person rather than per calendar, because that is what the rows
 * are: "Set when meetings can be booked based on staff availability" — the
 * schedule is the teammate's, and every calendar they sit on reads the same
 * one. So it lives beside the builder rather than inside CalendarDraft, and
 * editing it from one calendar changes the row on every other.
 */

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

export interface DayHours {
  on: boolean;
  /** "HH:MM", 24-hour. */
  start: string;
  end: string;
}

export interface WeeklyHours {
  timezone: string;
  days: Record<Day, DayHours>;
}

export const TIMEZONES = [
  { value: "America/Chicago", label: "GMT-05:00 America/Chicago (CDT)" },
  { value: "America/New_York", label: "GMT-04:00 America/New_York (EDT)" },
  { value: "America/Denver", label: "GMT-06:00 America/Denver (MDT)" },
  { value: "America/Los_Angeles", label: "GMT-07:00 America/Los_Angeles (PDT)" },
  { value: "Europe/London", label: "GMT+01:00 Europe/London (BST)" },
  { value: "Asia/Kolkata", label: "GMT+05:30 Asia/Kolkata (IST)" },
];

/** Every half hour of the day, as select options — "12:00 AM" … "11:30 PM". */
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 ? "30" : "00";
  return { value: `${String(h).padStart(2, "0")}:${m}`, label: formatTime(`${h}:${m}`) };
});

export function formatTime(hhmm: string) {
  const [hs, ms] = hhmm.split(":");
  const h = Number(hs);
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${ms} ${suffix}`;
}

/* The live default: weekdays, midnight to midnight — what a new teammate has. */
const defaultHours = (): WeeklyHours => ({
  timezone: TIMEZONES[0]!.value,
  days: Object.fromEntries(
    DAYS.map((d) => [d, { on: d !== "Sat" && d !== "Sun", start: "00:00", end: "00:00" }]),
  ) as Record<Day, DayHours>,
});

let hours: Record<string, WeeklyHours> = {};
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useStaffHours() {
  return React.useSyncExternalStore(subscribe, () => hours, () => hours);
}

export const hoursFor = (all: Record<string, WeeklyHours>, staffId: string) =>
  all[staffId] ?? defaultHours();

export function setStaffHours(staffId: string, next: WeeklyHours) {
  hours = { ...hours, [staffId]: next };
  listeners.forEach((l) => l());
}

/** "Weekdays, 12:00 AM to 12:00 AM" — the row's subtitle. */
export function summarizeHours(h: WeeklyHours) {
  const on = DAYS.filter((d) => h.days[d].on);
  if (on.length === 0) return "Unavailable";
  const first = h.days[on[0]!];
  const sameHours = on.every((d) => h.days[d].start === first.start && h.days[d].end === first.end);
  if (!sameHours) return `${on.join(", ")}, custom hours`;
  const range = `${formatTime(first.start)} to ${formatTime(first.end)}`;
  const weekdays = DAYS.slice(0, 5);
  const label =
    on.length === 7
      ? "Every day"
      : on.length === 5 && weekdays.every((d) => on.includes(d))
        ? "Weekdays"
        : on.length === 2 && on.includes("Sat") && on.includes("Sun")
          ? "Weekends"
          : on.join(", ");
  return `${label}, ${range}`;
}
