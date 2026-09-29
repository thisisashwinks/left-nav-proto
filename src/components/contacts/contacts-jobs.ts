"use client";

import * as React from "react";
import type { AvatarTone } from "./contacts-data";

/**
 * Every background job the contacts area has run — imports, exports and the
 * rest of the bulk actions — in one store.
 *
 * Three screens read it: the Bulk actions page (everything), the Import data
 * page's history (imports only) and the stats modal (one job's lines). One
 * store, because the import you just started must show up on both lists at
 * once, at the same percentage.
 *
 * A module store rather than page state so it survives the contacts page
 * unmounting while you visit another product — a job that forgot itself
 * because you glanced at Conversations would be the one bug a "runs in the
 * background" promise cannot have.
 */

export type JobOperation =
  | "Import"
  | "Export"
  | "Email"
  | "Add tags"
  | "Workflow"
  | "WhatsApp"
  | "Delete";

export type JobStatus = "processing" | "complete" | "cancelled";

export interface JobUser {
  name: string;
  tone: AvatarTone;
}

/** One row of a job's result log — the stats modal's table. */
export interface JobLine {
  line: number;
  identifier: string;
  object: string;
  type: "success" | "error" | "warning";
}

export interface BulkJob {
  id: string;
  /** The 20-character id the Action details modal prints. */
  actionId: string;
  label: string;
  operation: JobOperation;
  status: JobStatus;
  /** 0–100 while processing. */
  progress: number;
  user: JobUser;
  created: number;
  completed: number | null;
  records: number;
  errors: number;
  warnings: number;
  source: "File" | "HubSpot";
  objects: string;
  /** Percent per second while processing. */
  speed: number;
  /** Real lines, for jobs made in this session from a real file. */
  lines?: JobLine[];
}

export const ME: JobUser = { name: "Ashwin K S", tone: "blue" };

const USERS: Record<string, JobUser> = {
  koushik: { name: "Koushik K", tone: "pink" },
  abhilasha: { name: "Abhilasha Rathore", tone: "yellow" },
  umar: { name: "Umar Ranginwala", tone: "purple" },
  maruthi: { name: "Maruthi L", tone: "green" },
  vishnupriya: { name: "Vishnupriya Poduval", tone: "orange" },
  emma: { name: "Emma Jackson", tone: "pink" },
  pratik: { name: "Pratik Zinjurde", tone: "teal" },
  ronak: { name: "Ronak Jindal", tone: "blue" },
};

const at = (iso: string) => new Date(iso).getTime();

function actionId(seed: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  let n = seed * 2654435761;
  for (let i = 0; i < 20; i++) {
    n = (n * 1103515245 + 12345) % 2147483648;
    out += chars[n % chars.length];
  }
  return out;
}

type Seed = Omit<BulkJob, "id" | "actionId" | "speed" | "source" | "objects" | "warnings" | "progress"> &
  Partial<Pick<BulkJob, "progress" | "warnings" | "speed">>;

/** The live account's own log, as screenshotted on Sep 29. */
const SEED: Seed[] = [
  { label: "Export_Contacts_All_Sep_2026_1_00_PM", operation: "Export", status: "processing", progress: 0.19, speed: 0.004, user: ME, created: at("2026-09-29T13:00:00"), completed: null, records: 1469, errors: 0 },
  { label: "Import Logs Sheet1 Sept 28 2026.csv-29_SEP_2026_12_56_PM", operation: "Import", status: "complete", user: ME, created: at("2026-09-29T12:56:00"), completed: at("2026-09-29T12:57:00"), records: 3, errors: 0 },
  { label: "Untitled campaign name - Email Marketing", operation: "Email", status: "complete", user: USERS.koushik, created: at("2026-09-29T00:51:00"), completed: at("2026-09-29T00:51:00"), records: 842, errors: 0 },
  { label: "Untitled1 spreadsheet - Sheet1.csv-28_SEP_2026_11_52_PM", operation: "Import", status: "complete", user: USERS.koushik, created: at("2026-09-28T23:52:00"), completed: at("2026-09-29T00:02:00"), records: 113, errors: 113 },
  { label: "no location ID", operation: "Add tags", status: "complete", user: USERS.abhilasha, created: at("2026-09-28T21:13:00"), completed: at("2026-09-28T21:17:00"), records: 260, errors: 0 },
  { label: "whatsapp_pricing_change_1_oct", operation: "Workflow", status: "complete", user: USERS.umar, created: at("2026-09-28T16:39:00"), completed: at("2026-09-28T17:00:00"), records: 5120, errors: 12 },
  { label: "WA Subscription Agency Owners - Sheet1.csv", operation: "Import", status: "complete", user: USERS.umar, created: at("2026-09-28T15:29:00"), completed: at("2026-09-28T15:37:00"), records: 37446, errors: 0 },
  { label: "WA Subscription Agency Owners - wave 2.csv", operation: "Import", status: "complete", user: USERS.umar, created: at("2026-09-28T12:54:00"), completed: at("2026-09-28T13:12:00"), records: 179265, errors: 4 },
  { label: "jhb", operation: "WhatsApp", status: "complete", user: USERS.maruthi, created: at("2026-09-25T17:07:00"), completed: at("2026-09-25T17:07:00"), records: 14, errors: 0 },
  { label: "nn", operation: "WhatsApp", status: "complete", user: USERS.vishnupriya, created: at("2026-09-25T16:07:00"), completed: at("2026-09-25T16:07:00"), records: 9, errors: 0 },
  { label: "Sonnet 4.6 Migration", operation: "Workflow", status: "complete", user: USERS.emma, created: at("2026-09-25T02:34:00"), completed: at("2026-09-25T08:55:00"), records: 2577, errors: 0 },
  { label: "Sonnet 4.6 Migration", operation: "Workflow", status: "cancelled", user: USERS.emma, created: at("2026-09-25T02:11:00"), completed: at("2026-09-25T02:33:00"), records: 2577, errors: 0 },
  { label: "sonnet-4.6-migration - sonnet-4.6-contacts.csv", operation: "Import", status: "complete", user: USERS.emma, created: at("2026-09-25T01:51:00"), completed: at("2026-09-25T02:03:00"), records: 2577, errors: 3 },
  { label: "sonnet-4.6-migration - sonnet-4.6-retry.csv", operation: "Import", status: "complete", user: USERS.emma, created: at("2026-09-25T01:34:00"), completed: at("2026-09-25T01:34:00"), records: 2577, errors: 2577 },
  { label: "sonnet-4.6-migration-retell-companies.csv", operation: "Import", status: "complete", user: USERS.emma, created: at("2026-09-25T01:18:00"), completed: at("2026-09-25T01:18:00"), records: 2577, errors: 2577 },
  { label: "No location ID", operation: "Add tags", status: "complete", user: USERS.abhilasha, created: at("2026-09-23T16:10:00"), completed: at("2026-09-23T16:10:00"), records: 48, errors: 0 },
  { label: "g87", operation: "Email", status: "complete", user: USERS.pratik, created: at("2026-09-23T15:37:00"), completed: at("2026-09-23T15:37:00"), records: 31, errors: 0 },
  { label: "new", operation: "Email", status: "complete", user: USERS.pratik, created: at("2026-09-23T15:31:00"), completed: at("2026-09-23T15:31:00"), records: 31, errors: 1 },
  { label: "dialer", operation: "Workflow", status: "complete", user: USERS.ronak, created: at("2026-09-21T19:17:00"), completed: at("2026-09-21T19:17:00"), records: 406, errors: 0 },
  { label: "Ryan Howell contacts.csv", operation: "Import", status: "complete", user: { name: "Ryan Howell", tone: "purple" }, created: at("2026-09-12T04:18:00"), completed: at("2026-09-12T04:21:00"), records: 386, errors: 22, warnings: 6 },
  { label: "Chetan Dhole leads.csv", operation: "Import", status: "complete", user: { name: "Chetan Dhole", tone: "yellow" }, created: at("2026-09-11T19:13:00"), completed: at("2026-09-11T19:17:00"), records: 386, errors: 22 },
];

let jobs: BulkJob[] = SEED.map((s, i) => ({
  progress: 100,
  warnings: 0,
  speed: 0,
  source: "File",
  objects: "Contacts",
  ...s,
  id: `seed-${i}`,
  actionId: actionId(i + 7),
}));

const listeners = new Set<() => void>();
let ticker: ReturnType<typeof setInterval> | null = null;

function emit() {
  listeners.forEach((l) => l());
  ensureTicker();
}

/**
 * Processing jobs advance once a second, and the interval only runs while
 * one exists — an idle page should not be re-rendering its table forever.
 */
function ensureTicker() {
  const busy = jobs.some((j) => j.status === "processing");
  if (busy && !ticker) {
    ticker = setInterval(() => {
      jobs = jobs.map((j) => {
        if (j.status !== "processing") return j;
        const progress = Math.min(100, j.progress + j.speed);
        return progress >= 100
          ? { ...j, progress: 100, status: "complete", completed: Date.now() }
          : { ...j, progress };
      });
      emit();
    }, 1000);
  } else if (!busy && ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  ensureTicker();
  return () => listeners.delete(l);
}

export function useJobs(): BulkJob[] {
  return React.useSyncExternalStore(
    subscribe,
    () => jobs,
    () => jobs,
  );
}

let counter = 0;

export function addJob(
  job: Pick<BulkJob, "label" | "operation" | "records"> &
    Partial<Pick<BulkJob, "errors" | "warnings" | "lines" | "speed" | "objects">>,
): BulkJob {
  counter += 1;
  const next: BulkJob = {
    errors: 0,
    warnings: 0,
    speed: 12,
    objects: "Contacts",
    ...job,
    id: `run-${Date.now()}-${counter}`,
    actionId: actionId(Date.now() % 100000),
    status: "processing",
    progress: 0,
    user: ME,
    created: Date.now(),
    completed: null,
    source: "File",
  };
  jobs = [next, ...jobs];
  emit();
  return next;
}

/**
 * Runs `cb` once, when a job stops processing — for work that must outlive
 * the screen that started it, like the "export ready" toast.
 */
export function onJobSettled(id: string, cb: (job: BulkJob) => void) {
  const check = () => {
    const job = jobs.find((j) => j.id === id);
    if (job && job.status === "processing") return;
    listeners.delete(check);
    if (job) cb(job);
  };
  listeners.add(check);
  ensureTicker();
}

export function cancelJob(id: string) {
  jobs = jobs.map((j) =>
    j.id === id && j.status === "processing"
      ? { ...j, status: "cancelled", completed: Date.now() }
      : j,
  );
  emit();
}

/* ─── Lines ─────────────────────────────────────────────────────────────── */

const LINE_NAMES = [
  "Ameet Kang", "Jared Schoolcraft", "Jared Schoolcraft", "Haris Saeed",
  "Marcel van den Hoven", "Andrew McEwan", "Hugo Lam", "Aaron Bailey",
  "Pat Friedl", "Andrei Gazez", "Sam Howard", "Annie Martin", "Drew Burks",
  "Kaleb Pushard", "Priya Raman", "Lena Ortiz", "Tomás Silva", "Grace Kim",
  "Omar Haddad", "Nina Petrova", "Ravi Shankar", "Chloe Dubois",
];

export type LineTab = "all" | "success" | "error" | "warning";

export function lineCounts(job: BulkJob) {
  const success = Math.max(0, job.records - job.errors - job.warnings);
  return { all: job.records, success, error: job.errors, warning: job.warnings };
}

/**
 * One page of a job's lines, generated on demand.
 *
 * Seeded jobs run to 179,265 records, so their lines are never built as an
 * array — line N is a function of N. Errors take the first lines and
 * warnings the next, which makes every tab a contiguous range and lets the
 * pager index straight into it. Session jobs carry their real lines instead.
 */
export function jobLines(
  job: BulkJob,
  tab: LineTab,
  page: number,
  perPage: number,
): JobLine[] {
  if (job.lines) {
    const pool =
      tab === "all" ? job.lines : job.lines.filter((l) => l.type === tab);
    return pool.slice((page - 1) * perPage, page * perPage);
  }
  const counts = lineCounts(job);
  const offset =
    tab === "error" ? 0 : tab === "warning" ? job.errors : tab === "success" ? job.errors + job.warnings : 0;
  const length = counts[tab];
  const out: JobLine[] = [];
  for (let k = (page - 1) * perPage; k < Math.min(length, page * perPage); k++) {
    const i = offset + k;
    out.push({
      line: i + 1,
      identifier: LINE_NAMES[i % LINE_NAMES.length],
      object: job.objects,
      type: i < job.errors ? "error" : i < job.errors + job.warnings ? "warning" : "success",
    });
  }
  return out;
}

export function tabCount(job: BulkJob, tab: LineTab): number {
  if (job.lines) {
    return tab === "all" ? job.lines.length : job.lines.filter((l) => l.type === tab).length;
  }
  return lineCounts(job)[tab];
}

/* ─── Formatting ────────────────────────────────────────────────────────── */

const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "Sep 29, 2026, 1:00 PM" — the headline date plus 12-hour time. */
export function formatStamp(ms: number | null): string {
  if (ms == null) return "–";
  const d = new Date(ms);
  return `${DATE.format(d)}, ${TIME.format(d)}`;
}

/** "29_SEP_2026_12_55_PM" — the suffix the live product stamps on labels. */
export function labelStamp(ms: number = Date.now()): string {
  const d = new Date(ms);
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${String(d.getDate()).padStart(2, "0")}_${mon}_${d.getFullYear()}_${h12}_${mm}_${h < 12 ? "AM" : "PM"}`;
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}
