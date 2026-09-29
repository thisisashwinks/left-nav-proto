import type { AvatarTone } from "@/components/contacts/contacts-data";
import { TEAMMATES } from "@/components/product/conversations/conversations-data";

/**
 * Conversations ▸ Analytics — seeded daily SLA data, Jan 1 – Sep 29, 2026.
 *
 * Deterministic (a fixed-seed PRNG), and calibrated so the default range
 * (Jul 1 – Sep 29) and the period before it (Apr 1 – Jun 30) land exactly on
 * the live product's screenshot: 800 of 5,309 met, 175h 45m average, and a
 * −26.6 point swing against the previous 91 days. Every other range is just
 * whatever the seeded days add up to.
 *
 * Most volume has no contact owner, so it counts toward the overview but not
 * toward any row in the by-user table — the same attribution rule the
 * table's description states.
 */

/* ─── Calendar ──────────────────────────────────────────────────────────── */

const DAY_MS = 86_400_000;
const EPOCH = Date.UTC(2026, 0, 1);
export const DAY_COUNT = Math.round((Date.UTC(2026, 8, 29) - EPOCH) / DAY_MS) + 1;

export function dayToDate(i: number): Date {
  return new Date(EPOCH + i * DAY_MS);
}

/** "2026-07-01" → day index, clamped to the data. */
export function isoToDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const i = Math.round((Date.UTC(y!, m! - 1, d!) - EPOCH) / DAY_MS);
  return Math.max(0, Math.min(DAY_COUNT - 1, i));
}

export function dayToIso(i: number): string {
  return dayToDate(i).toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** 07/01/2026 */
export function formatUs(i: number): string {
  const d = dayToDate(i);
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

/** Jul 13 */
export function formatShort(i: number): string {
  const d = dayToDate(i);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Jul 13–19, Jun 29–Jul 5 */
export function formatSpan(a: number, b: number): string {
  if (a === b) return formatShort(a);
  const da = dayToDate(a);
  const db = dayToDate(b);
  return da.getUTCMonth() === db.getUTCMonth()
    ? `${formatShort(a)}–${db.getUTCDate()}`
    : `${formatShort(a)}–${formatShort(b)}`;
}

/** June 2026 */
export function formatMonth(i: number): string {
  const d = dayToDate(i);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const DEFAULT_START = isoToDay("2026-07-01");
export const DEFAULT_END = isoToDay("2026-09-29");

/* ─── Seeded generation ─────────────────────────────────────────────────── */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Split an integer total across weights, exactly (largest remainder). */
function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((s, v) => s + v, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((x, y) => y[0] - x[0]);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k]![1]]! += 1;
  return out;
}

export interface DayCell {
  messages: number;
  met: number;
  /** Total seconds to first reply across the day's messages. */
  responseSec: number;
}

const empty = (): DayCell[] =>
  Array.from({ length: DAY_COUNT }, () => ({ messages: 0, met: 0, responseSec: 0 }));

/* ─── People ────────────────────────────────────────────────────────────── */

export interface SlaUser {
  id: string;
  name: string;
  initials: string;
  tone: AvatarTone;
}

const EXTRA: SlaUser[] = [
  { id: "t-richa", name: "Richa Jindal", initials: "RJ", tone: "blue" },
  { id: "t-saikiran", name: "Sai Kiran Damagunta", initials: "SK", tone: "green" },
  { id: "t-jaydev", name: "Jaydev bhavsar", initials: "JB", tone: "teal" },
];

const byId = (id: string) => TEAMMATES.find((t) => t.id === id)!;
const person = (id: string): SlaUser => {
  const t = byId(id);
  return { id: t.id, name: t.name, initials: t.initials, tone: t.tone };
};

/** Default-window targets per user: messages, met, average seconds. */
const USER_PLAN: [SlaUser, number, number, number][] = [
  [person("t-aarat"), 25, 25, 14 * 60 + 51],
  [EXTRA[0]!, 12, 12, 33 * 60 + 1],
  [EXTRA[1]!, 29, 25, 1 * 3600 + 52 * 60 + 10],
  [EXTRA[2]!, 6, 4, 2 * 60 + 4],
  [person("t-aayush"), 22, 17, 48 * 60 + 10],
  [person("t-aayushi"), 14, 9, 3 * 3600 + 5 * 60 + 22],
  [person("t-abhilasha"), 19, 11, 1 * 3600 + 14 * 60 + 40],
  [person("t-prathamesh"), 11, 5, 5 * 3600 + 40 * 60 + 5],
  [person("t-rabbani"), 9, 3, 12 * 3600 + 8 * 60 + 33],
  [person("t-samrina"), 8, 2, 26 * 3600 + 30 * 60 + 12],
];

export const SLA_USERS: SlaUser[] = USER_PLAN.map((p) => p[0]);

/** Previous window (Apr 1 – Jun 30) and the one before it (Jan 1 – Mar 31). */
const PREV_START = isoToDay("2026-04-01");
const PREV_END = isoToDay("2026-06-30");

function fillUser(
  cells: DayCell[],
  rand: () => number,
  from: number,
  to: number,
  n: number,
  met: number,
  avgSec: number,
) {
  const span = to - from + 1;
  const days = Array.from({ length: n }, () => from + Math.floor(rand() * span));
  // Which of the n are met — shuffled so misses are spread across the range.
  const flags = Array.from({ length: n }, (_, i) => i < met);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [flags[i], flags[j]] = [flags[j]!, flags[i]!];
  }
  const secs = allocate(avgSec * n, days.map((_, i) => (flags[i] ? 0.4 : 1.6) + rand()));
  days.forEach((d, i) => {
    const c = cells[d]!;
    c.messages += 1;
    c.met += flags[i] ? 1 : 0;
    c.responseSec += secs[i]!;
  });
}

function buildUser(index: number): DayCell[] {
  const [, n, met, avg] = USER_PLAN[index]!;
  const rand = mulberry32(1000 + index * 97);
  const cells = empty();
  fillUser(cells, rand, DEFAULT_START, DEFAULT_END, n, met, avg);
  for (const [from, to] of [
    [PREV_START, PREV_END],
    [0, PREV_START - 1],
  ] as const) {
    const n2 = Math.max(2, Math.round(n * (0.7 + rand() * 0.6)));
    const rate = Math.min(1, Math.max(0, met / n + (rand() * 0.25 - 0.15)));
    fillUser(cells, rand, from, to, n2, Math.round(n2 * rate), Math.round(avg * (0.8 + rand() * 0.8)));
  }
  return cells;
}

export const USER_DAYS: DayCell[][] = USER_PLAN.map((_, i) => buildUser(i));

/* ─── Unowned volume, calibrated ────────────────────────────────────────── */

/** Weekly met-rate shape for the default window, Monday-anchored from Jun 29. */
const DEFAULT_WEEK_RATES = [43, 15, 11, 14, 22, 19, 12, 20, 8, 4, 13, 18, 25, 6];

const TARGETS = {
  current: { messages: 5309, met: 800, avgSec: 175 * 3600 + 45 * 60 },
  previous: { messages: 4812, met: 2006, avgSec: 310 * 3600 + 48 * 60 },
};

function buildUnowned(): DayCell[] {
  const rand = mulberry32(42);
  const cells = empty();
  const volumeW: number[] = [];
  const rateW: number[] = [];
  const firstMonday = isoToDay("2026-06-29");
  for (let d = 0; d < DAY_COUNT; d++) {
    const dow = dayToDate(d).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    volumeW.push((weekend ? 0.55 : 1.1) + 0.2 * Math.sin(d / 9) + rand() * 0.35);
    if (d >= DEFAULT_START) {
      const wk = Math.floor((d - firstMonday) / 7);
      rateW.push((DEFAULT_WEEK_RATES[wk] ?? 12) / 100);
    } else {
      rateW.push(0.34 + 0.12 * Math.sin(d / 13) + rand() * 0.1);
    }
  }

  const userSum = (from: number, to: number) => {
    let messages = 0;
    let met = 0;
    let sec = 0;
    for (const u of USER_DAYS)
      for (let d = from; d <= to; d++) {
        messages += u[d]!.messages;
        met += u[d]!.met;
        sec += u[d]!.responseSec;
      }
    return { messages, met, sec };
  };

  const calibrate = (from: number, to: number, t: { messages: number; met: number; avgSec: number }) => {
    const u = userSum(from, to);
    const idx = Array.from({ length: to - from + 1 }, (_, k) => from + k);
    const msgs = allocate(t.messages - u.messages, idx.map((d) => volumeW[d]!));
    const met = allocate(t.met - u.met, idx.map((d, k) => msgs[k]! * rateW[d]!));
    const sec = allocate(
      t.avgSec * t.messages - u.sec,
      idx.map((d, k) => msgs[k]! * (1.25 - rateW[d]!) * (0.8 + rand() * 0.4)),
    );
    idx.forEach((d, k) => {
      cells[d] = { messages: msgs[k]!, met: Math.min(met[k]!, msgs[k]!), responseSec: sec[k]! };
    });
  };

  calibrate(DEFAULT_START, DEFAULT_END, TARGETS.current);
  calibrate(PREV_START, PREV_END, TARGETS.previous);
  // Jan – Mar: uncalibrated, around 45 a day at roughly the spring rate.
  for (let d = 0; d < PREV_START; d++) {
    const messages = Math.round(volumeW[d]! * 45);
    const met = Math.round(messages * rateW[d]!);
    cells[d] = { messages, met, responseSec: Math.round(messages * (330 * 3600) * (1.25 - rateW[d]!)) };
  }
  return cells;
}

const UNOWNED = buildUnowned();

export const TOTAL_DAYS: DayCell[] = UNOWNED.map((c, d) => {
  const out = { ...c };
  for (const u of USER_DAYS) {
    out.messages += u[d]!.messages;
    out.met += u[d]!.met;
    out.responseSec += u[d]!.responseSec;
  }
  return out;
});

/* ─── Queries ───────────────────────────────────────────────────────────── */

export interface Tally {
  messages: number;
  met: number;
  breached: number;
  /** null when there were no messages to average. */
  metPct: number | null;
  breachedPct: number | null;
  avgSec: number | null;
}

export function tally(cells: DayCell[], from: number, to: number): Tally {
  let messages = 0;
  let met = 0;
  let sec = 0;
  for (let d = Math.max(0, from); d <= Math.min(DAY_COUNT - 1, to); d++) {
    messages += cells[d]!.messages;
    met += cells[d]!.met;
    sec += cells[d]!.responseSec;
  }
  return {
    messages,
    met,
    breached: messages - met,
    metPct: messages ? (met / messages) * 100 : null,
    breachedPct: messages ? ((messages - met) / messages) * 100 : null,
    avgSec: messages ? Math.round(sec / messages) : null,
  };
}

export type TrendMetric = "met" | "breached" | "response";

export interface TrendPoint {
  start: number;
  end: number;
  /** The day the label names — a week's Monday, which can precede `start`. */
  anchor: number;
  label: string;
  tally: Tally;
}

/**
 * Buckets for the trend chart: days for a month or less, otherwise weeks
 * anchored on Monday (so the default range starts Jun 29, as the live chart
 * does), with the first and last weeks clipped to the range.
 */
export function trend(from: number, to: number): { points: TrendPoint[]; unit: "day" | "week" } {
  const unit = to - from + 1 <= 31 ? "day" : "week";
  const points: TrendPoint[] = [];
  if (unit === "day") {
    for (let d = from; d <= to; d++)
      points.push({ start: d, end: d, anchor: d, label: formatShort(d), tally: tally(TOTAL_DAYS, d, d) });
    return { points, unit };
  }
  const dow = (dayToDate(from).getUTCDay() + 6) % 7; // Monday = 0
  for (let wk = from - dow; wk <= to; wk += 7) {
    const start = Math.max(wk, from);
    const end = Math.min(wk + 6, to);
    points.push({ start, end, anchor: wk, label: formatShort(wk), tally: tally(TOTAL_DAYS, start, end) });
  }
  return { points, unit };
}

/* ─── Formatting ────────────────────────────────────────────────────────── */

/** 14m 51s, 1h 52m, 175h 45m, 45s */
export function formatResponse(sec: number | null): string {
  if (sec === null) return "--";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${r}s`;
  return `${r}s`;
}

export function formatPct(v: number | null): string {
  return v === null ? "--" : `${v.toFixed(1)}%`;
}
