import {
  Calendar,
  CalendarClock,
  CalendarX2,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { AvatarTone } from "@/components/contacts/contacts-data";

/**
 * The fiction behind CRM ▸ Calendar ▸ Appointments — all four screens.
 *
 * Split out for the reason funnels-data and workflows-data are split out: the
 * week grid, the appointment table, the calendar list and the edit form are
 * four components reading one story, and a calendar that is called "tEst" in
 * the settings table and "Test" in the edit bar is the seam a reviewer finds
 * in a screenshot before they find the thing the screenshot was taken for.
 *
 * Transcribed from the operator's own screen recordings (Sep 22) rather than
 * invented, typos included — `tEst`, `See more (+302)`, the `06` in "All
 * calendars (06)". Tidying those up would have made the prototype argue with
 * the screenshots it is being compared against, and the zero-padded count in
 * particular is a real formatting bug the IA review should be able to see.
 */

/* ── the week grid ──────────────────────────────────────────────────────── */

export interface WeekDay {
  /** "21" — the column's date, drawn large. */
  date: string;
  /** "Mon" — the weekday, drawn small under it. */
  weekday: string;
  /**
   * Painted in the error ramp rather than the text ramp.
   *
   * The live product reds the whole Sunday column head, which reads as a
   * warning until you notice it is just the weekend. Kept because this
   * prototype is arguing about IA, not about colour semantics — changing it
   * here would quietly answer a question nobody asked.
   */
  weekend?: boolean;
}

export const weekDays: readonly WeekDay[] = [
  { date: "21", weekday: "Mon" },
  { date: "22", weekday: "Tue" },
  { date: "23", weekday: "Wed" },
  { date: "24", weekday: "Thu" },
  { date: "25", weekday: "Fri" },
  { date: "26", weekday: "Sat" },
  { date: "27", weekday: "Sun", weekend: true },
];

/**
 * 8 AM to 5 PM, and no further.
 *
 * The real grid runs midnight to midnight and opens scrolled to the working
 * day. Ten rows is what fits the canvas without a scroller of its own, and a
 * scroller here would put a second scrollbar inside a page that already has
 * one — which is a layout argument this screen does not exist to have.
 */
export const hourRows: readonly string[] = [
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
];

export interface WeekEvent {
  id: string;
  title: string;
  /** Who it is with — the second line of the block. */
  sub: string;
  /** Index into `weekDays`. */
  day: number;
  /** Index into `hourRows` for the top edge. */
  hour: number;
  /** Half-hour offset inside that row, 0 or 0.5. */
  offset?: number;
  /** In hour rows, so 1.5 is ninety minutes. */
  span: number;
  /** Which accent the block wears — the same four the edit form offers. */
  tone: "brand" | "green" | "purple" | "orange";
  /** Drawn as a hatched slot rather than a solid block. */
  blocked?: boolean;
}

export const weekEvents: readonly WeekEvent[] = [
  { id: "e1", title: "MoltClaw demo", sub: "Priya Raman", day: 0, hour: 1, span: 1, tone: "brand" },
  { id: "e2", title: "Focus block", sub: "Unavailable", day: 0, hour: 4, span: 2, tone: "orange", blocked: true },
  { id: "e3", title: "Discovery call", sub: "Dwight Schrute", day: 1, hour: 0, offset: 0.5, span: 1, tone: "green" },
  { id: "e4", title: "Onboarding", sub: "Acme Dental", day: 1, hour: 6, span: 1.5, tone: "purple" },
  { id: "e5", title: "MoltClaw demo", sub: "Jatin Kalra", day: 2, hour: 2, span: 1, tone: "brand" },
  { id: "e6", title: "Strategy review", sub: "Internal", day: 2, hour: 7, span: 1, tone: "green" },
  { id: "e7", title: "Saas walkthrough", sub: "Lena Fischer", day: 3, hour: 1, offset: 0.5, span: 1.5, tone: "purple" },
  { id: "e8", title: "Support sync", sub: "Team", day: 4, hour: 3, span: 1, tone: "orange" },
  { id: "e9", title: "MoltClaw demo", sub: "Omar Haddad", day: 4, hour: 6, span: 1, tone: "brand" },
  { id: "e10", title: "Weekend cover", sub: "Unavailable", day: 5, hour: 2, span: 3, tone: "orange", blocked: true },
];

/** The one all-day banner, so the All day row is not an empty gutter. */
export const allDayEvents: readonly { id: string; label: string; day: number; span: number }[] = [
  { id: "a1", label: "Q4 planning offsite", day: 2, span: 2 },
];

/* ── the Manage view panel ──────────────────────────────────────────────── */

export interface FilterOption {
  id: string;
  label: string;
  /** A second line — the user's role, the calendar's group. */
  sub?: string;
  tone: AvatarTone;
  checked?: boolean;
}

/**
 * Seven of three hundred and nine.
 *
 * The count in `See more (+302)` is the live one and it is the point of the
 * block: a filter list that starts with seven names and hides three hundred is
 * a search problem wearing a checkbox list's clothes, and the panel is worth
 * drawing at that scale rather than at a comfortable five.
 */
export const filterUsers: readonly FilterOption[] = [
  { id: "u-ashwin", label: "Ashwin K S", sub: "Product design", tone: "blue", checked: true },
  { id: "u-jatin", label: "Jatin Kalra", sub: "Solutions", tone: "purple" },
  { id: "u-priya", label: "Priya Raman", sub: "Customer success", tone: "green" },
  { id: "u-omar", label: "Omar Haddad", sub: "Sales", tone: "orange" },
  { id: "u-lena", label: "Lena Fischer", sub: "Sales", tone: "pink" },
  { id: "u-dwight", label: "Dwight Schrute", sub: "Partnerships", tone: "yellow" },
  { id: "u-mei", label: "Mei Tanaka", sub: "Onboarding", tone: "teal" },
];

export const filterCalendars: readonly FilterOption[] = [
  { id: "c-demos", label: "MoltClaw Demos", sub: "Sales team", tone: "blue" },
  { id: "c-onboard", label: "Onboarding 45m", sub: "Success", tone: "green" },
  { id: "c-discovery", label: "Discovery call", sub: "Sales team", tone: "purple" },
  { id: "c-test", label: "tEst", sub: "Ungrouped", tone: "orange" },
];

export const filterGroups: readonly FilterOption[] = [
  { id: "g-sales", label: "Sales team", tone: "blue" },
  { id: "g-success", label: "Success", tone: "green" },
  { id: "g-partners", label: "Partnerships", tone: "purple" },
];

/* ── the appointment list ───────────────────────────────────────────────── */

export type AppointmentStatus =
  | "Confirmed"
  | "Showed"
  | "No show"
  | "Cancelled";

export interface Appointment {
  id: string;
  /** The `#` column — the row's ordinal in the live table, not its index. */
  num: string;
  title: string;
  contact: string;
  tone: AvatarTone;
  status: AppointmentStatus;
  /** "Sep 24, 2026, 10:00 AM" — the date column, always with (CST) after it. */
  time: string;
  /**
   * The blue pill above the time on a moved appointment.
   *
   * One row carries it on purpose. A rescheduled appointment keeps its
   * original row and grows a second timestamp, which is the only place in this
   * table where a cell holds two facts — and a table that never shows its
   * two-line case looks tidier than the one that ships.
   */
  rescheduledTo?: string;
  calendar: string;
  owner: string;
}

export const appointments: readonly Appointment[] = [
  { id: "ap-1", num: "01", title: "MoltClaw demo — Acme Dental", contact: "Priya Raman", tone: "green", status: "Confirmed", time: "Sep 21, 2026, 9:00 AM", calendar: "MoltClaw Demos", owner: "Ashwin K S" },
  { id: "ap-2", num: "02", title: "Discovery call", contact: "Dwight Schrute", tone: "yellow", status: "Confirmed", time: "Sep 22, 2026, 8:30 AM", calendar: "Discovery call", owner: "Omar Haddad" },
  { id: "ap-3", num: "03", title: "Onboarding — Northwind", contact: "Mei Tanaka", tone: "teal", status: "Showed", time: "Sep 22, 2026, 2:00 PM", calendar: "Onboarding 45m", owner: "Mei Tanaka" },
  { id: "ap-4", num: "04", title: "MoltClaw demo — Kestrel Labs", contact: "Jatin Kalra", tone: "purple", status: "Confirmed", time: "Sep 23, 2026, 10:00 AM", rescheduledTo: "Rescheduled to Sep 25", calendar: "MoltClaw Demos", owner: "Ashwin K S" },
  { id: "ap-5", num: "05", title: "Saas walkthrough", contact: "Lena Fischer", tone: "pink", status: "Confirmed", time: "Sep 24, 2026, 9:30 AM", calendar: "Saas onboarding", owner: "Lena Fischer" },
  { id: "ap-6", num: "06", title: "Support sync", contact: "Omar Haddad", tone: "orange", status: "No show", time: "Sep 24, 2026, 11:00 AM", calendar: "Discovery call", owner: "Omar Haddad" },
  { id: "ap-7", num: "07", title: "MoltClaw demo — Brightwell", contact: "Priya Raman", tone: "green", status: "Confirmed", time: "Sep 25, 2026, 2:00 PM", calendar: "MoltClaw Demos", owner: "Ashwin K S" },
  { id: "ap-8", num: "08", title: "Quarterly review", contact: "Jatin Kalra", tone: "purple", status: "Cancelled", time: "Sep 25, 2026, 4:00 PM", calendar: "tEst", owner: "Jatin Kalra" },
  { id: "ap-9", num: "09", title: "Onboarding — Halcyon", contact: "Mei Tanaka", tone: "teal", status: "Confirmed", time: "Sep 26, 2026, 10:30 AM", calendar: "Onboarding 45m", owner: "Mei Tanaka" },
  { id: "ap-10", num: "10", title: "Partner intro", contact: "Dwight Schrute", tone: "yellow", status: "Confirmed", time: "Sep 27, 2026, 1:00 PM", calendar: "Discovery call", owner: "Omar Haddad" },
];

/**
 * The saved-view row, including the two the operator named themselves.
 *
 * `MoltClaw Demos` and `Saas` are their smart lists and they are kept verbatim
 * — a prototype that renamed them to "Demos" and "SaaS" would be showing a
 * row of views nobody in the recording has.
 */
export const appointmentViews: readonly {
  id: string;
  label: string;
  icon?: LucideIcon;
}[] = [
  { id: "upcoming", label: "Upcoming", icon: CalendarClock },
  { id: "cancelled", label: "Cancelled", icon: CalendarX2 },
  { id: "all", label: "All", icon: Layers },
  { id: "moltclaw", label: "MoltClaw Demos", icon: Calendar },
  { id: "saas", label: "Saas", icon: Sparkles },
];

/* ── the calendar list ──────────────────────────────────────────────────── */

export interface CalendarGroup {
  id: string;
  label: string;
  /** Zero-padded in the live product — see the note at the top of this file. */
  count: string;
}

export const calendarGroups: readonly CalendarGroup[] = [
  { id: "all", label: "All calendars", count: "06" },
  { id: "sales", label: "Sales team", count: "03" },
  { id: "success", label: "Success", count: "02" },
  { id: "ungrouped", label: "Ungrouped", count: "01" },
  /*
   * The group with nothing in it, and the only way to reach the empty state.
   *
   * A boolean on the page would have shown the same illustration in half the
   * lines, and it would have been a lie: an account with six calendars never
   * sees this screen, but a GROUP with none does, and that is the case the
   * operator actually hits. Selecting it filters the table to zero rows, which
   * is the empty state arriving the way it arrives in the product.
   */
  { id: "personal", label: "Personal", count: "00" },
];

export interface CalendarRow {
  id: string;
  name: string;
  /** The opaque id under the name, with a copy glyph beside it. */
  ref: string;
  group: string;
  duration: string;
  type: string;
  active: boolean;
  updated: string;
}

export const calendarRows: readonly CalendarRow[] = [
  { id: "cal-demos", name: "MoltClaw Demos", ref: "JkP2mQ4nR7", group: "Sales team", duration: "30 mins", type: "Round robin", active: true, updated: "Sep 21, 2026" },
  { id: "cal-discovery", name: "Discovery call", ref: "Tb9xL1vC3s", group: "Sales team", duration: "15 mins", type: "Unassigned", active: true, updated: "Sep 18, 2026" },
  { id: "cal-saas", name: "Saas onboarding", ref: "Hq6wZ8dA2e", group: "Sales team", duration: "45 mins", type: "Collective", active: true, updated: "Sep 16, 2026" },
  { id: "cal-onboard", name: "Onboarding 45m", ref: "Nm4rY7uK9p", group: "Success", duration: "45 mins", type: "Round robin", active: true, updated: "Sep 15, 2026" },
  { id: "cal-checkin", name: "Success check-in", ref: "Vc3sB5tE8j", group: "Success", duration: "20 mins", type: "Unassigned", active: true, updated: "Sep 11, 2026" },
  { id: "cal-test", name: "tEst", ref: "Gz1fX6hM0q", group: "Ungrouped", duration: "30 mins", type: "Unassigned", active: true, updated: "Sep 09, 2026" },
];

/* ── the edit form ──────────────────────────────────────────────────────── */

/** The left rail of the edit screen, in the order the live product lists it. */
export const editSections: readonly { id: string; label: string; deep?: boolean }[] = [
  { id: "service", label: "Service details" },
  { id: "staff", label: "Staff & location" },
  { id: "availability", label: "Availability" },
  { id: "rules", label: "Booking rules" },
  /*
   * The one row with a chevron, because it opens a whole second tree rather
   * than scrolling the form. Left as a leaf here: the review is about where
   * Calendars LIVES, and building out advanced settings would add a fifth
   * screen to a task about four.
   */
  { id: "advanced", label: "Advanced settings", deep: true },
];

/**
 * The meeting colours, as token references rather than hex.
 *
 * Six swatches off the HighRise ramps, so a recolour of the prototype moves
 * them with everything else. The live picker offers a wider set; six is the
 * number that fits one row beside the label without wrapping, and a wrapping
 * swatch row would be the only wrapped control on the form.
 */
export const meetingColors: readonly { id: string; label: string; token: string }[] = [
  { id: "mc-primary", label: "Blue", token: "var(--hr-primary-600)" },
  { id: "mc-success", label: "Green", token: "var(--hr-success-500)" },
  { id: "mc-violet", label: "Violet", token: "var(--hr-violet-500)" },
  { id: "mc-warning", label: "Amber", token: "var(--hr-warning-400)" },
  { id: "mc-error", label: "Red", token: "var(--hr-error-500)" },
  { id: "mc-gray", label: "Grey", token: "var(--hr-gray-500)" },
];
