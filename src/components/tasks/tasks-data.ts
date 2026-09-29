"use client";

import * as React from "react";
import type { Task } from "@/components/contacts/tasks-panel";
import type { AssociatedObject } from "@/components/contacts/associated-objects";
import { ME, TEAMMATES, type Teammate } from "@/components/product/conversations/conversations-data";

/**
 * CRM ▸ Tasks — the account-wide task list.
 *
 * A module store rather than component state, so a task saved from the
 * drawer, a bulk delete and a saved list all survive leaving the page and
 * coming back within the session — the same shape the toast store uses.
 *
 * The row is the record rail's `Task` plus the one thing a table can sort by
 * that a rail never needed: when it was created.
 */

export interface CrmTask extends Task {
  /** Monotonic, not a wall-clock time — only its order matters. */
  createdAt: number;
}

/** The prototype's fixed "now", the same one tasks-panel reads. */
export const TODAY = "2026-09-29";

export const PEOPLE: Teammate[] = [ME, ...TEAMMATES];

export function personById(id: string | null) {
  return id ? PEOPLE.find((p) => p.id === id) ?? null : null;
}

export function personLabel(p: Teammate) {
  return p.id === ME.id ? `${p.name} (you)` : p.name;
}

/* ─── Dates ─────────────────────────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-10" → "Sep 10, 2026". Parsed by hand so no timezone shifts the day. */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "Sep 10, 2026 12:00 AM". */
export function formatDue(t: Pick<Task, "due" | "time">) {
  return `${formatDate(t.due)} ${t.time}`;
}

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Monday–Sunday around TODAY. */
export function thisWeek(): [string, string] {
  const [y, m, d] = TODAY.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun
  const fromMonday = (dow + 6) % 7;
  const start = addDays(TODAY, -fromMonday);
  return [start, addDays(start, 6)];
}

/** "12:00 AM" → minutes since midnight, for sorting within a day. */
export function timeToMinutes(time: string) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

/** Every half hour, for the drawer's time picker. */
export const TIME_SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h24 = Math.floor(i / 2);
  const min = i % 2 ? "30" : "00";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${min} ${h24 < 12 ? "AM" : "PM"}`;
});

export function isOverdue(t: Task) {
  return !t.done && t.due < TODAY;
}

export function plainText(html: string) {
  return html
    .replace(/<(br|\/p|\/div|\/li)\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/* ─── Records a task can point at ───────────────────────────────────────── */

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0][0]).toUpperCase();
}

function contact(name: string): AssociatedObject {
  return { id: `tc-${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`, kind: "contacts", name, initials: initialsOf(name) };
}

function company([name, initials]: [string, string]): AssociatedObject {
  return { id: `tco-${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`, kind: "companies", name, initials };
}

/** Lowercase on purpose — the live account's contacts were typed that way. */
const CONTACT_NAMES = [
  "andrew shaw",
  "avi landy",
  "todd lappin",
  "nathanael fourie",
  "nikhil satish",
  "chang lee",
  "gena lester",
  "rick",
  "passive profits academy",
  "keith besherse",
  "maria gonzalez",
  "david kim",
  "priya raman",
  "tom becker",
  "lena fischer",
  "omar haddad",
  "sofia rossi",
  "james carter",
  "aiko tanaka",
  "ben wallace",
  "chloe martin",
  "ethan brooks",
  "fatima noor",
  "george hill",
  "hannah price",
  "ivan petrov",
  "julia santos",
  "kevin osei",
  "laura chen",
  "mike ross",
];

export const CONTACT_OPTIONS: AssociatedObject[] = CONTACT_NAMES.map(contact);

// Initials given, not derived — "Harding & Sons" would come out as "H&".
export const COMPANY_OPTIONS: AssociatedObject[] = (
  [
    ["Martyn Bassett Associates", "MB"],
    ["Golden Boost", "GB"],
    ["Clearview Window Cleaning", "CW"],
    ["Harding & Sons Joinery", "HS"],
    ["24/7 Rapid Plumbing", "RP"],
    ["Northwind Dental", "ND"],
    ["Bluebird Bakery", "BB"],
    ["Summit Fitness", "SF"],
  ] as [string, string][]
).map(company);

function contactNamed(name: string) {
  return CONTACT_OPTIONS.find((c) => c.name === name) ?? contact(name);
}

/** "andrew shaw" → "Andrew Shaw", for titles. */
function titleCase(name: string) {
  return name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/* ─── Seed ──────────────────────────────────────────────────────────────── */

const UPDATE_DESC = "<p>Make sure you update appointment status after the meeting.</p>";

type Mirror = { contact: string; due: string; time?: string; done?: boolean; title?: string; html?: string; assignee?: string | null };

/** The first rows of the live account, in its order (screenshot 55). */
const MIRROR: Mirror[] = [
  { contact: "andrew shaw", due: "2026-09-10", done: true },
  { contact: "avi landy", due: "2026-09-10", done: true },
  { contact: "todd lappin", due: "2026-09-03" },
  { contact: "nathanael fourie", due: "2026-09-02" },
  { contact: "nathanael fourie", due: "2026-06-28" },
  { contact: "nikhil satish", due: "2026-06-17", time: "11:00 AM", title: "Share estimate", html: "", assignee: null },
  { contact: "nathanael fourie", due: "2026-05-15" },
  { contact: "nathanael fourie", due: "2026-05-13" },
  { contact: "nathanael fourie", due: "2026-05-12" },
  { contact: "nathanael fourie", due: "2026-05-09" },
  { contact: "nathanael fourie", due: "2026-02-21" },
  { contact: "nathanael fourie", due: "2026-02-12" },
  { contact: "chang lee", due: "2026-01-17" },
  { contact: "gena lester", due: "2026-01-11" },
  { contact: "rick", due: "2025-12-17" },
  { contact: "passive profits academy", due: "2025-11-15", title: "Update appointment status for Kendra Paige" },
  { contact: "keith besherse", due: "2025-10-22" },
];

const TEMPLATES: { title: (n: string) => string; html: string }[] = [
  { title: (n) => `Update appointment status for ${n}`, html: UPDATE_DESC },
  { title: (n) => `Follow up with ${n}`, html: "<p>Check in on the proposal and answer any open questions.</p>" },
  { title: () => "Share estimate", html: "" },
  { title: (n) => `Send onboarding checklist to ${n}`, html: "<p>Attach the checklist PDF and the kickoff calendar invite.</p>" },
  { title: (n) => `Call ${n} about renewal`, html: "<p>Their plan renews next month. Confirm the tier and the billing contact.</p>" },
  { title: (n) => `Collect signed contract from ${n}`, html: "" },
  { title: (n) => `Review intake form for ${n}`, html: "<p>Flag anything missing before the first session.</p>" },
];

const TIMES = ["12:00 AM", "12:00 AM", "12:00 AM", "9:00 AM", "10:30 AM", "2:00 PM", "4:30 PM"];

/** A tiny LCG — deterministic, so the server and client seed the same rows. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const TOTAL_SEEDED = 723;

function buildSeed(): CrmTask[] {
  const out: CrmTask[] = [];
  let created = 1_000_000;
  const martyn = COMPANY_OPTIONS[0];

  MIRROR.forEach((m, i) => {
    const c = contactNamed(m.contact);
    out.push({
      id: `task-${i + 1}`,
      title: m.title ?? `Update appointment status for ${titleCase(m.contact)}`,
      html: m.html ?? UPDATE_DESC,
      due: m.due,
      time: m.time ?? "12:00 AM",
      recurring: null,
      assigneeId: m.assignee === undefined ? ME.id : m.assignee,
      done: m.done ?? false,
      associations: i === 0 ? [martyn, c] : [c],
      createdAt: created--,
    });
  });

  const rand = rng(723);
  // Due dates spread from Jan 2024 to Dec 2026, so every view has something.
  const start = Date.UTC(2024, 0, 1);
  const span = Date.UTC(2026, 11, 31) - start;
  for (let i = out.length; i < TOTAL_SEEDED; i++) {
    const c = CONTACT_OPTIONS[Math.floor(rand() * CONTACT_OPTIONS.length)];
    const tpl = TEMPLATES[Math.floor(rand() * TEMPLATES.length)];
    const due = new Date(start + Math.floor(rand() * span)).toISOString().slice(0, 10);
    const past = due < TODAY;
    const assigneeRoll = rand();
    const assigneeId =
      assigneeRoll < 0.55 ? ME.id : assigneeRoll < 0.92 ? TEAMMATES[Math.floor(rand() * TEAMMATES.length)].id : null;
    const withCompany = rand() < 0.15;
    out.push({
      id: `task-${i + 1}`,
      title: tpl.title(titleCase(c.name)),
      html: tpl.html,
      due,
      time: TIMES[Math.floor(rand() * TIMES.length)],
      recurring: rand() < 0.06 ? { every: 1, unit: "week", ends: "never" } : null,
      assigneeId,
      done: past ? rand() < 0.3 : rand() < 0.05,
      associations: withCompany
        ? [COMPANY_OPTIONS[1 + Math.floor(rand() * (COMPANY_OPTIONS.length - 1))], c]
        : [c],
      createdAt: created--,
    });
  }
  return out;
}

/* ─── Filters, sort, views ──────────────────────────────────────────────── */

export type StatusFilter = "all" | "pending" | "completed";
export type DueFilter =
  | { kind: "any" | "today" | "week" | "overdue" | "upcoming" }
  | { kind: "custom"; from: string; to: string };
export type SortField = "due" | "title" | "created";
export interface TaskSort {
  field: SortField;
  dir: "asc" | "desc";
}

export interface TaskFilters {
  /** Teammate ids; "none" is Unassigned. Empty = any. */
  assignees: string[];
  status: StatusFilter;
  due: DueFilter;
  /** Associated contact ids. Empty = any. */
  contactIds: string[];
  description: "any" | "with" | "without";
  recurring: "any" | "only";
}

export const EMPTY_FILTERS: TaskFilters = {
  assignees: [],
  status: "all",
  due: { kind: "any" },
  contactIds: [],
  description: "any",
  recurring: "any",
};

/**
 * Newest first. The live account sorts by due date, but with upcoming tasks
 * in the set a due-date sort would float them above the rows it opens on —
 * created order keeps those rows first and lets new tasks land on top.
 */
export const DEFAULT_SORT: TaskSort = { field: "created", dir: "desc" };

export interface SavedTaskView {
  id: string;
  label: string;
  filters: TaskFilters;
  builtIn?: boolean;
}

export const BUILT_IN_VIEWS: SavedTaskView[] = [
  { id: "all", label: "All", filters: EMPTY_FILTERS, builtIn: true },
  { id: "today", label: "Due today", filters: { ...EMPTY_FILTERS, status: "pending", due: { kind: "today" } }, builtIn: true },
  { id: "overdue", label: "Overdue", filters: { ...EMPTY_FILTERS, status: "pending", due: { kind: "overdue" } }, builtIn: true },
  { id: "upcoming", label: "Upcoming", filters: { ...EMPTY_FILTERS, status: "pending", due: { kind: "upcoming" } }, builtIn: true },
];

function matchesDue(t: Task, due: DueFilter) {
  switch (due.kind) {
    case "any":
      return true;
    case "today":
      return t.due === TODAY;
    case "overdue":
      return t.due < TODAY;
    case "upcoming":
      return t.due > TODAY;
    case "week": {
      const [a, b] = thisWeek();
      return t.due >= a && t.due <= b;
    }
    case "custom":
      return (!due.from || t.due >= due.from) && (!due.to || t.due <= due.to);
  }
}

export function applyTaskFilters(rows: CrmTask[], f: TaskFilters, query: string) {
  const q = query.trim().toLowerCase();
  return rows.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q)) return false;
    if (f.status === "pending" && t.done) return false;
    if (f.status === "completed" && !t.done) return false;
    if (f.assignees.length && !f.assignees.includes(t.assigneeId ?? "none")) return false;
    if (!matchesDue(t, f.due)) return false;
    if (f.contactIds.length && !t.associations.some((a) => f.contactIds.includes(a.id))) return false;
    if (f.description !== "any") {
      const has = plainText(t.html).length > 0;
      if (f.description === "with" ? !has : has) return false;
    }
    if (f.recurring === "only" && !t.recurring) return false;
    return true;
  });
}

export function sortTasks(rows: CrmTask[], s: TaskSort) {
  const k = s.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let d = 0;
    if (s.field === "title") d = a.title.localeCompare(b.title);
    else if (s.field === "due")
      d = a.due.localeCompare(b.due) || timeToMinutes(a.time) - timeToMinutes(b.time);
    d = d || a.createdAt - b.createdAt;
    return d * k;
  });
}

/** How many of the Filters drawer's conditions are set. */
export function extraFilterCount(f: TaskFilters) {
  return (f.contactIds.length ? 1 : 0) + (f.description !== "any" ? 1 : 0) + (f.recurring !== "any" ? 1 : 0);
}

/* ─── Columns ───────────────────────────────────────────────────────────── */

export type ColumnId = "description" | "contacts" | "assignee" | "due";

export interface ColumnSetting {
  id: ColumnId;
  label: string;
  visible: boolean;
}

export const DEFAULT_COLUMNS: ColumnSetting[] = [
  { id: "description", label: "Description", visible: true },
  { id: "contacts", label: "Associated contacts", visible: true },
  { id: "assignee", label: "Assignee", visible: true },
  { id: "due", label: "Due date (IST)", visible: true },
];

/* ─── The store ─────────────────────────────────────────────────────────── */

interface State {
  tasks: CrmTask[];
  views: SavedTaskView[];
  columns: ColumnSetting[];
}

let state: State = { tasks: buildSeed(), views: [], columns: DEFAULT_COLUMNS };
const SERVER_STATE = state;
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTasksStore() {
  return React.useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

export function upsertTask(t: Omit<CrmTask, "createdAt"> & { createdAt?: number }) {
  const exists = state.tasks.find((x) => x.id === t.id);
  if (exists) {
    set({ tasks: state.tasks.map((x) => (x.id === t.id ? { ...exists, ...t, createdAt: exists.createdAt } : x)) });
    return;
  }
  const top = state.tasks.reduce((m, x) => Math.max(m, x.createdAt), 0);
  set({ tasks: [{ ...t, createdAt: top + 1 }, ...state.tasks] });
}

export function newTaskId() {
  const top = state.tasks.reduce((m, x) => Math.max(m, Number(x.id.replace(/\D/g, "")) || 0), 0);
  return `task-${top + 1}`;
}

export function patchTasks(ids: string[], patch: Partial<Task>) {
  const on = new Set(ids);
  set({ tasks: state.tasks.map((t) => (on.has(t.id) ? { ...t, ...patch } : t)) });
}

export function deleteTasks(ids: string[]) {
  const on = new Set(ids);
  set({ tasks: state.tasks.filter((t) => !on.has(t.id)) });
}

export function addView(label: string, filters: TaskFilters): SavedTaskView {
  const view: SavedTaskView = { id: `view-${state.views.length + 1}-${label.toLowerCase().replace(/\W+/g, "-")}`, label, filters };
  set({ views: [...state.views, view] });
  return view;
}

export function setColumns(columns: ColumnSetting[]) {
  set({ columns });
}
