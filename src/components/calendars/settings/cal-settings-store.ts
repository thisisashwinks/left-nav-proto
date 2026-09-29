"use client";

import * as React from "react";

/**
 * Calendar settings as live state — the calendars, their groups, and each
 * calendar's full configuration.
 *
 * One module store for every screen under Calendar settings ▸ Calendars: the
 * list, its row and group modals, and the create / edit builder all read and
 * write the same records, so a calendar saved in the builder is on the list
 * the moment you go back, and a group deleted from the rail takes its
 * calendars' group column with it.
 */

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      listeners.forEach((l) => l());
    },
    use: () => React.useSyncExternalStore(subscribe, () => value, () => value),
  };
}

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type CalendarType =
  | "personal"
  | "round-robin"
  | "class"
  | "collective"
  | "service"
  | "event";

export const CALENDAR_TYPES: {
  id: CalendarType;
  label: string;
  description: string;
  example: string;
  /** Behind "Explore more types" in the chooser. */
  more?: boolean;
}[] = [
  {
    id: "personal",
    label: "Personal booking",
    description: "Schedules one-on-one meetings with a specific team member.",
    example: "E.g.: Client meetings, private consultations.",
  },
  {
    id: "round-robin",
    label: "Round robin",
    description: "Distributes appointments among team members in a rotating order.",
    example: "E.g.: Sales calls, onboarding sessions.",
  },
  {
    id: "class",
    label: "Class booking",
    description: "One host meets with multiple participants.",
    example: "E.g.: Webinars, group training, online classes.",
  },
  {
    id: "collective",
    label: "Collective booking",
    description: "Multiple hosts meet with one participant.",
    example: "E.g.: Panel interviews, committee reviews.",
  },
  {
    id: "service",
    label: "Service booking",
    description: "Books a service with any available staff member.",
    example: "E.g.: Salon appointments, repairs, home visits.",
    more: true,
  },
  {
    id: "event",
    label: "Event",
    description: "A fixed time slot that contacts can register for.",
    example: "E.g.: Open houses, launch events.",
    more: true,
  },
];

/** The short label the list's Type column shows — "Personal". */
export const TYPE_SHORT: Record<CalendarType, string> = {
  personal: "Personal",
  "round-robin": "Round robin",
  class: "Class",
  collective: "Collective",
  service: "Service",
  event: "Event",
};

export type TimeUnit = "minutes" | "hours" | "days" | "weeks";

export interface StaffLocation {
  userId: string;
  /** "custom" | "zoom" | "google-meet" | "phone" | "address" … */
  kind: string;
  value: string;
  displayLabel: string;
}

/**
 * Everything the builder edits, flat, so a section can `patch({ … })` one
 * field without knowing where the others live.
 */
export interface CalendarDraft {
  /* Basic details */
  logo: string | null;
  name: string;
  description: string;
  slug: string;
  groupId: string | null;
  inviteTitle: string;
  color: string;

  /* Staff & location */
  staffIds: string[];
  locations: StaffLocation[];

  /* Availability */
  recurring: boolean;

  /* Booking rules */
  intervalValue: number;
  intervalUnit: TimeUnit;
  durationValue: number;
  durationUnit: TimeUnit;
  extraDurations: number[];
  minNoticeValue: number | null;
  minNoticeUnit: TimeUnit;
  dateRangeValue: number | null;
  dateRangeUnit: TimeUnit;
  countAvailableDaysOnly: boolean;
  preBufferValue: number | null;
  preBufferUnit: TimeUnit;
  postBufferValue: number | null;
  postBufferUnit: TimeUnit;
  maxPerDay: number | null;
  maxPerSlot: number;
  lookBusy: boolean;
  lookBusyPercent: number;

  /* Advanced ▸ Form & confirmation */
  formId: string;
  widgetOrder: ("datetime" | "form")[];
  stickyContacts: boolean;
  consentEnabled: boolean;
  consentText: string;
  guestsEnabled: boolean;
  confirmation: "message" | "redirect";
  thankYouMessage: string;
  redirectUrl: string;
  metaPixelId: string;
  autoConfirm: boolean;

  /* Advanced ▸ Payments */
  acceptPayments: boolean;
  /*
   * Optional so drafts seeded before these fields existed stay valid; the
   * Payments section reads them with its own fallbacks.
   */
  paymentAmount?: number | null;
  paymentCurrency?: "USD" | "EUR" | "GBP" | "INR";
  paymentMode?: "full" | "deposit";
  paymentDeposit?: number | null;
  /** Notification id → enabled. Missing ids fall back to their defaults. */
  notifications?: Record<string, boolean>;

  /* Advanced ▸ Notifications & policies */
  assignContactToOwner: boolean;
  skipIfAssigned: boolean;
  allowReschedule: boolean;
  rescheduleExpiryValue: number | null;
  rescheduleExpiryUnit: TimeUnit;
  allowCancel: boolean;
  cancelExpiryValue: number | null;
  cancelExpiryUnit: TimeUnit;
  thirdPartyInvites: boolean;
  inviteNotes: string;

  /* Advanced ▸ Widget appearance */
  coverImage: string | null;
  widgetStyle: "neo" | "classic";
  primaryColor: string;
  backgroundColor: string;
  buttonText: string;
  showTitle: boolean;
  showDescription: boolean;
  showDetails: boolean;
  customCode: string;

  /* Advanced ▸ Booking channels */
  clientPortalBooking: boolean;
}

export interface SettingsCalendar {
  id: string;
  /** The opaque id under the name — "RXsJN5oEuFcvtRcUoaj". */
  ref: string;
  type: CalendarType;
  active: boolean;
  ownerId: string;
  /** Epoch ms. */
  updatedAt: number;
  draft: CalendarDraft;
}

export interface CalendarGroup {
  id: string;
  name: string;
  description: string;
  slug: string;
  template: "neo" | "classic";
  active: boolean;
  /** Rearrange calendars writes this. Calendars not listed follow, by name. */
  order: string[];
}

/* ─── People ────────────────────────────────────────────────────────────── */

export const ME_ID = "me";

export const STAFF: { id: string; name: string; initials: string }[] = [
  { id: ME_ID, name: "Ashwin K S", initials: "AK" },
  { id: "st-abhishek", name: "Abhishek Babu", initials: "AB" },
  { id: "st-maya", name: "Maya Patel", initials: "MP" },
  { id: "st-daniel", name: "Daniel Park", initials: "DP" },
  { id: "st-sofia", name: "Sofia Lopez", initials: "SL" },
];

export const staffById = (id: string) => STAFF.find((s) => s.id === id);

/* ─── Defaults ──────────────────────────────────────────────────────────── */

export const MEETING_COLORS = [
  "#c62828",
  "#e57373",
  "#ef6c00",
  "#f4c542",
  "#5fbf7f",
  "#2e7d32",
  "#039be5",
  "#3949ab",
  "#7986cb",
  "#8e24aa",
  "#616161",
];

export const DEFAULT_THANK_YOU =
  "Thank you for your appointment request. We will contact you shortly to confirm your request. Please call our office at {{contactMethod}} if you have any questions.";

export const DEFAULT_INVITE_NOTES =
  "Phone:- {{contact.phone}}\nEmail:- {{contact.email}}\n\nNeed to make a change to this event?\nReschedule:- {{reschedule_link}}\nCancel:- {{cancellation_link}}";

export function emptyDraft(overrides: Partial<CalendarDraft> = {}): CalendarDraft {
  return {
    logo: null,
    name: "",
    description: "",
    slug: "",
    groupId: null,
    inviteTitle: "{{contact.name}}",
    color: MEETING_COLORS[6]!,

    staffIds: [ME_ID],
    locations: [],

    recurring: false,

    intervalValue: 30,
    intervalUnit: "minutes",
    durationValue: 30,
    durationUnit: "minutes",
    extraDurations: [],
    minNoticeValue: null,
    minNoticeUnit: "days",
    dateRangeValue: null,
    dateRangeUnit: "days",
    countAvailableDaysOnly: false,
    preBufferValue: null,
    preBufferUnit: "minutes",
    postBufferValue: null,
    postBufferUnit: "minutes",
    maxPerDay: null,
    maxPerSlot: 1,
    lookBusy: false,
    lookBusyPercent: 0,

    formId: "default",
    widgetOrder: ["datetime", "form"],
    stickyContacts: false,
    consentEnabled: true,
    consentText:
      "I confirm that I want to receive content from this company using any contact information I provide.",
    guestsEnabled: false,
    confirmation: "message",
    thankYouMessage: DEFAULT_THANK_YOU,
    redirectUrl: "",
    metaPixelId: "",
    autoConfirm: true,

    acceptPayments: false,

    assignContactToOwner: true,
    skipIfAssigned: false,
    allowReschedule: true,
    rescheduleExpiryValue: null,
    rescheduleExpiryUnit: "minutes",
    allowCancel: true,
    cancelExpiryValue: null,
    cancelExpiryUnit: "minutes",
    thirdPartyInvites: true,
    inviteNotes: DEFAULT_INVITE_NOTES,

    coverImage: null,
    widgetStyle: "neo",
    primaryColor: "#178af6ff",
    backgroundColor: "#ffffff",
    buttonText: "Schedule Meeting",
    showTitle: true,
    showDescription: true,
    showDetails: true,
    customCode: "",

    clientPortalBooking: false,
    ...overrides,
  };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const REF_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function newRef() {
  let s = "";
  for (let i = 0; i < 20; i++) s += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  return s;
}

export const formatDuration = (d: CalendarDraft) => {
  const v = d.durationValue;
  if (d.durationUnit === "hours") return `${v} hr`;
  if (d.durationUnit === "days") return `${v} ${v === 1 ? "day" : "days"}`;
  if (d.durationUnit === "weeks") return `${v} ${v === 1 ? "week" : "weeks"}`;
  return `${v} min`;
};

/** "September 29, 2026" over "04:23 AM" — the list's Date updated cell. */
export const formatUpdated = (ms: number) => {
  const d = new Date(ms);
  return {
    date: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
};

export const SCHEDULING_BASE = "https://api.leadconnectorhq.com/widget";

/* ─── Seed ──────────────────────────────────────────────────────────────── */

const SEED_TIME = new Date("2026-09-22T10:15:00").getTime();

/*
 * The groups the live account has, all empty. Their calendars are owned by
 * teammates, so the page opens on "Owned by: Me" with an empty list — the
 * live first screen — and switching the filter to All shows the rest.
 */
const groups = createStore<CalendarGroup[]>(
  [
    ["Abhishek Babu", "babu"],
    ["Agent Calnedar", "agent-calnedar"],
    ["Calendar", "calendar"],
    ["Con Call", "con-call"],
    ["Memberships", "memberships"],
    ["Mobile", "mobile"],
  ].map(([name, slug], i) => ({
    id: `grp-${i + 1}`,
    name: name!,
    description: "",
    slug: slug!,
    template: "classic" as const,
    active: true,
    order: [],
  })),
);

const calendars = createStore<SettingsCalendar[]>([
  {
    id: "cal-seed-1",
    ref: "Lw8QxT2mNc4RbV7pKs1e",
    type: "round-robin",
    active: true,
    ownerId: "st-abhishek",
    updatedAt: SEED_TIME,
    draft: emptyDraft({
      name: "Sales discovery call",
      slug: "sales-discovery",
      durationValue: 15,
      staffIds: ["st-abhishek", "st-maya"],
    }),
  },
  {
    id: "cal-seed-2",
    ref: "Pz3DkY9sHf6JtA0wLm5u",
    type: "class",
    active: true,
    ownerId: "st-maya",
    updatedAt: SEED_TIME - 86_400_000 * 3,
    draft: emptyDraft({
      name: "Product webinar",
      slug: "product-webinar",
      durationValue: 60,
      staffIds: ["st-maya"],
      maxPerSlot: 50,
    }),
  },
  {
    id: "cal-seed-3",
    ref: "Qe7GvR1cXb8NhU4oZi2y",
    type: "collective",
    active: false,
    ownerId: "st-daniel",
    updatedAt: SEED_TIME - 86_400_000 * 9,
    draft: emptyDraft({
      name: "Panel interview",
      slug: "panel-interview",
      durationValue: 45,
      staffIds: ["st-daniel", "st-sofia"],
    }),
  },
]);

/* ─── Hooks & getters ───────────────────────────────────────────────────── */

export const useCalendars = calendars.use;
export const getCalendars = calendars.get;
export const useCalendarGroups = groups.use;
export const getCalendarGroups = groups.get;

export const calendarById = (id: string) => calendars.get().find((c) => c.id === id);
export const groupById = (id: string | null) =>
  id ? groups.get().find((g) => g.id === id) : undefined;

export function useCalendar(id: string | null) {
  const all = useCalendars();
  return id ? all.find((c) => c.id === id) : undefined;
}

/** A group's calendars, in its rearranged order, then the rest by name. */
export function calendarsInGroup(groupId: string, all = calendars.get()) {
  const group = groups.get().find((g) => g.id === groupId);
  const members = all.filter((c) => c.draft.groupId === groupId);
  const order = group?.order ?? [];
  return [...members].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
    return a.draft.name.localeCompare(b.draft.name);
  });
}

/** Whether a slug is taken by another calendar. */
export const slugTaken = (slug: string, exceptId?: string) =>
  calendars.get().some((c) => c.id !== exceptId && c.draft.slug === slug);

/* ─── Calendar mutations ────────────────────────────────────────────────── */

export function createCalendar(type: CalendarType, draft: CalendarDraft): SettingsCalendar {
  const cal: SettingsCalendar = {
    id: `cal-${Date.now()}`,
    ref: newRef(),
    type,
    active: true,
    ownerId: ME_ID,
    updatedAt: Date.now(),
    draft,
  };
  calendars.set([cal, ...calendars.get()]);
  return cal;
}

export function saveCalendar(id: string, draft: CalendarDraft) {
  calendars.set(
    calendars.get().map((c) => (c.id === id ? { ...c, draft, updatedAt: Date.now() } : c)),
  );
}

export function duplicateCalendar(id: string): SettingsCalendar | undefined {
  const src = calendarById(id);
  if (!src) return undefined;
  let slug = `${src.draft.slug || slugify(src.draft.name)}-copy`;
  for (let n = 2; slugTaken(slug); n++) slug = `${src.draft.slug}-copy-${n}`;
  const copy: SettingsCalendar = {
    ...src,
    id: `cal-${Date.now()}`,
    ref: newRef(),
    ownerId: ME_ID,
    updatedAt: Date.now(),
    draft: { ...structuredClone(src.draft), name: `${src.draft.name} (copy)`, slug },
  };
  const list = calendars.get();
  const at = list.findIndex((c) => c.id === id);
  calendars.set([...list.slice(0, at + 1), copy, ...list.slice(at + 1)]);
  return copy;
}

export function setCalendarActive(id: string, active: boolean) {
  calendars.set(
    calendars.get().map((c) => (c.id === id ? { ...c, active, updatedAt: Date.now() } : c)),
  );
}

export function moveCalendarToGroup(id: string, groupId: string | null) {
  calendars.set(
    calendars
      .get()
      .map((c) =>
        c.id === id ? { ...c, draft: { ...c.draft, groupId }, updatedAt: Date.now() } : c,
      ),
  );
}

export function deleteCalendar(id: string) {
  calendars.set(calendars.get().filter((c) => c.id !== id));
}

/* ─── Group mutations ───────────────────────────────────────────────────── */

export function createGroup(
  g: Pick<CalendarGroup, "name" | "description" | "slug" | "template">,
): CalendarGroup {
  const group: CalendarGroup = { ...g, id: `grp-${Date.now()}`, active: true, order: [] };
  groups.set([...groups.get(), group]);
  return group;
}

/**
 * Edit group also sets which calendars sit in it ("Added calendar(s)"), so
 * membership is written here rather than calendar by calendar.
 */
export function updateGroup(
  id: string,
  patch: Partial<Omit<CalendarGroup, "id">>,
  calendarIds?: string[],
) {
  groups.set(groups.get().map((g) => (g.id === id ? { ...g, ...patch } : g)));
  if (calendarIds) {
    calendars.set(
      calendars.get().map((c) => {
        const inIt = calendarIds.includes(c.id);
        if (inIt && c.draft.groupId !== id) return { ...c, draft: { ...c.draft, groupId: id } };
        if (!inIt && c.draft.groupId === id) return { ...c, draft: { ...c.draft, groupId: null } };
        return c;
      }),
    );
  }
}

export function setGroupOrder(id: string, order: string[]) {
  groups.set(groups.get().map((g) => (g.id === id ? { ...g, order } : g)));
}

/** Deactivating a group deactivates every calendar in it too. */
export function deactivateGroup(id: string) {
  groups.set(groups.get().map((g) => (g.id === id ? { ...g, active: false } : g)));
  calendars.set(
    calendars.get().map((c) => (c.draft.groupId === id ? { ...c, active: false } : c)),
  );
}

export function activateGroup(id: string) {
  groups.set(groups.get().map((g) => (g.id === id ? { ...g, active: true } : g)));
}

/**
 * Without `withCalendars` the group's calendars fall back to Not grouped;
 * with it they are deleted along with the group.
 */
export function deleteGroup(id: string, withCalendars: boolean) {
  groups.set(groups.get().filter((g) => g.id !== id));
  calendars.set(
    withCalendars
      ? calendars.get().filter((c) => c.draft.groupId !== id)
      : calendars
          .get()
          .map((c) => (c.draft.groupId === id ? { ...c, draft: { ...c.draft, groupId: null } } : c)),
  );
}

/* ─── Opening the builder ───────────────────────────────────────────────── */

/**
 * What the list hands the page when it opens the builder: an existing
 * calendar by id ("Edit - dfgd"), or a new one of a type with the draft the
 * quick modal had so far ("Create").
 */
export type BuilderTarget =
  | { calendarId: string }
  | { calendarId: null; type: CalendarType; draft: CalendarDraft };
