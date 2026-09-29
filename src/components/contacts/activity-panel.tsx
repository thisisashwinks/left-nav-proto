"use client";

import * as React from "react";
import {
  Calendar,
  ClipboardList,
  ExternalLink,
  Globe,
  MailOpen,
  MousePointerClick,
  Phone,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The Activity panel of the record rail — everything the contact DID, as
 * opposed to everything we did to them (that lives in Conversations).
 *
 * It is a timeline, newest first, grouped by day. Each entry says what
 * happened, where it came from (the source card), and where/when — the same
 * three lines HighLevel's own activity feed uses, so the prototype reads as
 * the product and not a guess at it.
 */
export type ActivityKind =
  | "page_visit"
  | "form_submission"
  | "appointment"
  | "call"
  | "trigger_link"
  | "email_open";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  title: string;
  source: string;
  detail: string;
  path?: string;
  /** "Jun 19 at 5:25 PM" */
  when: string;
  /** "Jun 19, 2026" — the group label. */
  day: string;
}

const KIND_ICON: Record<ActivityKind, LucideIcon> = {
  trigger_link: MousePointerClick,
  page_visit: Globe,
  form_submission: ClipboardList,
  appointment: Calendar,
  call: Phone,
  email_open: MailOpen,
};

/* ─── Seed ──────────────────────────────────────────────────────────────── */

/** Records that have never done anything — the empty state has to be seen. */
const QUIET_IDS = new Set(["erik", "denise"]);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** FNV-1a — a stable number per record id, so a reload shows the same feed. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — tiny seeded PRNG. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Template = Omit<ActivityEntry, "id" | "when" | "day">;

const TEMPLATES: Template[] = [
  {
    kind: "trigger_link",
    title: "Trigger link visited",
    source: "Trigger Link",
    detail: "mmlite_template_ver_a",
    path: "/links/r/2/eyJhbGciOiJIU…",
  },
  {
    kind: "trigger_link",
    title: "Trigger link visited",
    source: "Trigger Link",
    detail: "spring_promo_cta",
    path: "/links/r/7/eyJ0eXAiOiJKV…",
  },
  {
    kind: "page_visit",
    title: "Page visited",
    source: "Funnel",
    detail: "Summer webinar — landing page",
    path: "/summer-webinar",
  },
  {
    kind: "page_visit",
    title: "Page visited",
    source: "Website",
    detail: "Pricing",
    path: "/pricing",
  },
  {
    kind: "page_visit",
    title: "Page visited",
    source: "Google Ads",
    detail: "Free consultation",
    path: "/free-consultation?utm_source=google",
  },
  {
    kind: "form_submission",
    title: "Form submitted",
    source: "Form",
    detail: "Contact us",
    path: "/contact-us",
  },
  {
    kind: "form_submission",
    title: "Survey submitted",
    source: "Survey",
    detail: "Client intake questionnaire",
    path: "/intake",
  },
  {
    kind: "appointment",
    title: "Appointment booked",
    source: "Calendar",
    detail: "Discovery call · 30 min",
    path: "/widget/booking/discovery",
  },
  {
    kind: "appointment",
    title: "Appointment rescheduled",
    source: "Calendar",
    detail: "Strategy session · 45 min",
  },
  {
    kind: "call",
    title: "Inbound call",
    source: "Phone",
    detail: "Answered · 4 min 12 sec",
  },
  {
    kind: "call",
    title: "Missed call",
    source: "Phone",
    detail: "(415) 555-0132 · Voicemail left",
  },
  {
    kind: "email_open",
    title: "Email opened",
    source: "Email campaign",
    detail: "September newsletter",
  },
  {
    kind: "email_open",
    title: "Email opened",
    source: "Workflow",
    detail: "Welcome series — Step 2",
  },
];

function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

/**
 * A believable feed for one record: deterministic per id, newest first.
 * `new-*` records (just created) and a couple of named ones get nothing.
 */
export function seedActivity(recordId: string): ActivityEntry[] {
  if (recordId.startsWith("new-") || QUIET_IDS.has(recordId)) return [];

  const rand = rng(hash(recordId));
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

  const total = 3 + Math.floor(rand() * 6); // 3–8
  const dayCount = Math.min(total, 2 + Math.floor(rand() * 3)); // 2–4

  // Walk back from the day before "today" in the prototype's calendar.
  // UTC keeps server and client render identical.
  const days: Date[] = [];
  let cursor = Date.UTC(2026, 8, 28) - Math.floor(rand() * 4) * 86400000;
  for (let i = 0; i < dayCount; i++) {
    days.push(new Date(cursor));
    cursor -= (1 + Math.floor(rand() * 18)) * 86400000;
  }

  // Every day gets at least one entry; the rest land anywhere.
  const perDay = days.map(() => 1);
  for (let i = dayCount; i < total; i++) perDay[Math.floor(rand() * dayCount)]++;

  const out: ActivityEntry[] = [];
  days.forEach((d, di) => {
    const mon = MONTHS[d.getUTCMonth()];
    const date = d.getUTCDate();
    const day = `${mon} ${date}, ${d.getUTCFullYear()}`;
    // Waking hours, newest first within the day.
    const times = Array.from({ length: perDay[di] }, () => 7 * 60 + Math.floor(rand() * 15 * 60)).sort(
      (a, b) => b - a,
    );
    times.forEach((t, ti) => {
      out.push({
        ...pick(TEMPLATES),
        id: `${recordId}-${di}-${ti}`,
        when: `${mon} ${date} at ${formatTime(t)}`,
        day,
      });
    });
  });
  return out;
}

/* ─── Filter ────────────────────────────────────────────────────────────── */

type FilterId = "all" | "visits" | "forms" | "appointments" | "calls";

const FILTERS: { id: FilterId; label: string; kinds?: ActivityKind[] }[] = [
  { id: "all", label: "All" },
  { id: "visits", label: "Visits", kinds: ["page_visit", "trigger_link"] },
  { id: "forms", label: "Forms", kinds: ["form_submission"] },
  { id: "appointments", label: "Appointments", kinds: ["appointment"] },
  { id: "calls", label: "Calls", kinds: ["call"] },
];

function FilterChips({ value, onChange }: { value: FilterId; onChange: (id: FilterId) => void }) {
  return (
    <div role="radiogroup" aria-label="Filter activity" className="flex flex-wrap gap-[6px]">
      {FILTERS.map((f) => {
        const on = f.id === value;
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(f.id)}
            className={cn(
              "h-[24px] rounded-full px-[9px] text-[12.5px] leading-none font-medium motion-tap active:scale-95",
              on
                ? "bg-brand-soft text-brand"
                : "text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-surface hover:text-pg-text",
            )}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Body ──────────────────────────────────────────────────────────────── */

function ActivityEmpty() {
  return (
    <div className="flex flex-col items-center gap-[6px] px-[20px] pt-[48px] pb-[24px] text-center">
      <span className="mb-[6px] flex size-[40px] items-center justify-center rounded-full bg-pg text-pg-muted">
        <RotateCcw size={18} aria-hidden="true" />
      </span>
      <span className="text-[14px] leading-[20px] font-semibold text-pg-text-strong">
        No activities yet
      </span>
      <span className="max-w-[240px] text-[13px] leading-[18px] text-pg-muted">
        Page visits, form submissions, appointments, calls, and more will appear here.
      </span>
    </div>
  );
}

function EntryRow({ entry: e, last }: { entry: ActivityEntry; last: boolean }) {
  const Icon = KIND_ICON[e.kind];
  return (
    <div className="relative flex gap-[9px] pt-[10px]">
      {/* The timeline thread — from under this disc to the next one. */}
      {!last ? (
        <span
          aria-hidden="true"
          className="absolute top-[38px] -bottom-[10px] left-[11.5px] w-px bg-pg-row-border"
        />
      ) : null}
      <span className="relative mt-[2px] flex size-[24px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon size={13} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">{e.title}</span>
        <div className="flex flex-col gap-[2px] rounded-[8px] bg-pg-surface px-[9px] py-[7px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <span className="w-fit rounded-[4px] bg-brand-soft px-[5px] text-[12px] leading-[18px] font-medium text-brand">
            Source: {e.source}
          </span>
          <span className="truncate text-[13px] leading-[18px] text-pg-text">{e.detail}</span>
        </div>
        <span className="flex items-center gap-[5px] text-[12px] leading-[16px] text-pg-faint">
          {e.path ? (
            <>
              <span className="min-w-0 truncate">{e.path}</span>
              <ExternalLink size={11} aria-hidden="true" className="shrink-0" />
            </>
          ) : null}
          <span className="shrink-0">{e.when}</span>
        </span>
      </div>
    </div>
  );
}

export function ActivityBody({ entries }: { entries: ActivityEntry[] }) {
  const [filter, setFilter] = React.useState<FilterId>("all");

  const groups = React.useMemo(() => {
    const kinds = FILTERS.find((f) => f.id === filter)?.kinds;
    const shown = kinds ? entries.filter((e) => kinds.includes(e.kind)) : entries;
    // Entries arrive newest first, so first-seen order is the day order.
    const byDay = new Map<string, ActivityEntry[]>();
    for (const e of shown) {
      const list = byDay.get(e.day);
      if (list) list.push(e);
      else byDay.set(e.day, [e]);
    }
    return Array.from(byDay, ([day, list]) => ({ day, entries: list }));
  }, [entries, filter]);

  if (entries.length === 0) return <ActivityEmpty />;

  return (
    <div className="flex flex-col py-[10px]">
      <div className="pb-[14px]">
        <FilterChips value={filter} onChange={setFilter} />
      </div>
      {groups.length === 0 ? (
        <span className="px-[20px] py-[32px] text-center text-[13px] leading-[18px] text-pg-muted">
          No activities match this filter
        </span>
      ) : (
        groups.map((group) => (
          <div key={group.day} className="pb-[14px]">
            <span className="text-[11.5px] leading-[16px] font-semibold tracking-[0.04em] text-pg-muted uppercase">
              {group.day}
            </span>
            {group.entries.map((e, i) => (
              <EntryRow key={e.id} entry={e} last={i === group.entries.length - 1} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

/** The drawer footer — where this record first and last came from. */
export function ActivityFooter() {
  return (
    <div className="flex min-w-0 flex-col gap-[3px]">
      <span className="truncate text-[12px] leading-[16px] text-pg-muted">
        First attribution source: <span className="font-medium text-pg-text">CRM UI</span>
      </span>
      <span className="truncate text-[12px] leading-[16px] text-pg-muted">
        Latest attribution source: <span className="font-medium text-pg-text">Direct traffic</span>
      </span>
    </div>
  );
}
