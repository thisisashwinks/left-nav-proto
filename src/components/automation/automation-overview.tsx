"use client";

import * as React from "react";
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Download,
  ExternalLink,
  Info,
  ListFilter,
  RefreshCw,
  UserRound,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { OutlineButton, PageHeader } from "@/components/page/page-header";
import { GlyphButton } from "@/components/page/list-shape";
import { showToast } from "@/components/page/toast";
import {
  AnchoredPopover,
  FIELD_BOX,
  MenuOption,
} from "@/components/contacts/book-appointment-modal";
import { cn } from "@/lib/utils";
import { SWITCHER_WORKFLOWS } from "./builder-state";

/**
 * Automation ▸ Workflows ▸ Analytics.
 *
 * One page answering three questions in the order they get asked: how much is
 * running, what is broken, and which triggers are doing the work. The first
 * two share a row because they are read together — a spike in enrollments is
 * only alarming if the error list beside it is also long — and the trigger
 * filter gets the full width under them because it is the one part you work
 * rather than glance at.
 *
 * Everything is seeded and deterministic. The filter's numbers move when you
 * pick a value, but they move the same way every time, so a screenshot taken
 * on Tuesday still matches the prototype on Friday.
 */

/* ─── Shared pieces ─────────────────────────────────────────────────────── */

/**
 * HighRise canvas: 12px radius, shadow/lg, with the page's own hairline on
 * top so the card still has an edge in dark, where the shadow disappears.
 */
const CARD =
  "rounded-[12px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]";

/**
 * A brand wash that follows the page theme.
 *
 * Mixed from --brand rather than read off --brand-soft, because --brand-soft
 * is a 50-level tint that only the nav re-steps for dark: on a dark page it
 * would be the brightest object in the card. A 14% mix is a tint in both.
 */
const BRAND_TINT = "bg-[color-mix(in_oklab,var(--brand)_14%,transparent)]";

/** 1.7K, 4.9M — the HighRise compact form, one decimal, trailing .0 dropped. */
function compact(n: number): string {
  const units: [number, string][] = [
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (Math.abs(n) >= size) {
      return `${(n / size).toFixed(1).replace(/\.0$/, "")}${suffix}`;
    }
  }
  return String(Math.round(n));
}

/**
 * An ⓘ that explains a number on hover or focus.
 *
 * CSS-only on purpose: the explanation is one sentence and never needs to
 * escape the card, so a portal and a measured position would be machinery
 * for nothing.
 */
function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="flex size-[16px] items-center justify-center rounded-full text-pg-faint motion-tap hover:text-pg-text focus-visible:text-pg-text"
      >
        <Info size={13} aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-[6px] w-max max-w-[220px] -translate-x-1/2 rounded-[8px] bg-pg-overlay px-[9px] py-[6px] text-[12px] leading-[16px] font-normal text-pg-surface opacity-0 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.4)] transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

function CardTitle({
  icon: Icon,
  children,
  trailing,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-[8px]">
      {Icon ? (
        <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-text-strong" />
      ) : null}
      <h2 className="truncate text-[16px] leading-[24px] font-semibold text-pg-heading">
        {children}
      </h2>
      {trailing}
    </div>
  );
}

/* ─── Row 1, left: the headline numbers ─────────────────────────────────── */

const STATS: {
  label: string;
  value: number;
  icon: LucideIcon;
  chip: string;
  tip?: string;
}[] = [
  { label: "Total workflows", value: 1_712, icon: Workflow, chip: `${BRAND_TINT} text-brand` },
  {
    label: "Published workflows",
    value: 181,
    icon: CircleCheck,
    chip: "bg-[var(--pg-av-green-bg)] text-[var(--pg-av-green-fg)]",
  },
  {
    label: "Total enrollments",
    value: 4_912_604,
    icon: Users,
    chip: "bg-[var(--pg-av-pink-bg)] text-[var(--pg-av-pink-fg)]",
    tip: "Contacts enrolled across all workflows, all time",
  },
];

/**
 * Three hero numbers in one card, not three cards.
 *
 * They are one reading — the size of the estate — so they share a surface
 * and are split by hairlines. Below 560px of card the dividers turn
 * horizontal and the columns stack, rather than squeezing a 28px number into
 * a third of a phone.
 */
function StatCard() {
  return (
    <section
      aria-label="Workflow totals"
      className={cn(CARD, "@container grid grid-cols-1 @min-[560px]:grid-cols-3")}
    >
      {STATS.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "flex min-w-0 flex-col gap-[12px] p-[16px]",
            i > 0 &&
              "border-t border-pg-border @min-[560px]:border-t-0 @min-[560px]:border-l",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("flex size-[32px] items-center justify-center rounded-[8px]", s.chip)}
          >
            <s.icon size={16} />
          </span>
          <div className="flex flex-col gap-[4px]">
            <span className="flex items-center gap-[6px] text-[14px] leading-[20px] text-pg-muted">
              {s.label}
              {s.tip ? <InfoTip text={s.tip} /> : null}
            </span>
            <span
              title={s.value.toLocaleString("en-US")}
              className="text-[28px] leading-[36px] font-semibold tracking-[-0.01em] text-pg-heading tabular-nums"
            >
              {compact(s.value)}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ─── Row 1, left: enrollments over time ────────────────────────────────── */

const WEEKS: { label: string; value: number }[] = [
  { label: "Aug 16–Aug 22", value: 275_412 },
  { label: "Aug 23–Aug 29", value: 58_093 },
  { label: "Aug 30–Sep 5", value: 146_211 },
  { label: "Sep 6–Sep 12", value: 45_380 },
  { label: "Sep 13–Sep 19", value: 53_127 },
  { label: "Sep 20–Sep 26", value: 61_904 },
  { label: "Sep 27–Oct 3", value: 70_856 },
];

const Y_MAX = 300_000;
const Y_TICKS = [0, 50_000, 100_000, 150_000, 200_000, 250_000, 300_000];

/**
 * A monotone cubic through the points — d3's curveMonotoneX, by hand.
 *
 * Monotone rather than a cardinal spline because a spline overshoots: between
 * 275K and 58K it would dip below 58K and draw a week that never happened.
 * Fritsch–Carlson keeps every segment inside the range of its two ends.
 */
function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0]!.x},${pts[0]!.y}`;
  const slope = pts.slice(0, -1).map((p, i) => (pts[i + 1]!.y - p.y) / (pts[i + 1]!.x - p.x));
  const t = pts.map((_, i) => {
    if (i === 0) return slope[0]!;
    if (i === n - 1) return slope[n - 2]!;
    const a = slope[i - 1]!;
    const b = slope[i]!;
    return a * b <= 0 ? 0 : (a + b) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    const m = slope[i]!;
    if (m === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i]! / m;
    const b = t[i + 1]! / m;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      t[i] = tau * a * m;
      t[i + 1] = tau * b * m;
    }
  }
  let d = `M${pts[0]!.x},${pts[0]!.y}`;
  for (let i = 0; i < n - 1; i++) {
    const p = pts[i]!;
    const q = pts[i + 1]!;
    const dx = (q.x - p.x) / 3;
    d += ` C${p.x + dx},${p.y + t[i]! * dx} ${q.x - dx},${q.y - t[i + 1]! * dx} ${q.x},${q.y}`;
  }
  return d;
}

/**
 * Enrollments per week, one series.
 *
 * Drawn at the card's real pixel width (a ResizeObserver, not a stretched
 * viewBox) so the 12px axis labels stay 12px at every width instead of
 * scaling with the plot. One series, so no legend: the title names it. The
 * hover is a whole column — the question is "what happened that week", and a
 * target the width of a week is easier to hit than an 8px dot.
 */
function EnrollmentsChart() {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [hover, setHover] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 272;
  const pad = { t: 12, r: 8, b: 30, l: 60 };
  const plotW = Math.max(0, width - pad.l - pad.r);
  const plotH = H - pad.t - pad.b;
  const band = plotW / WEEKS.length;
  const x = (i: number) => pad.l + band * (i + 0.5);
  const y = (v: number) => pad.t + plotH - (plotH * v) / Y_MAX;
  const pts = WEEKS.map((w, i) => ({ x: x(i), y: y(w.value) }));
  // A range label needs about 84px; below that, every other week is named.
  const labelEvery = band >= 84 ? 1 : 2;

  return (
    <div ref={wrapRef} className="relative h-[272px] w-full">
      {width > 0 ? (
        <svg
          width={width}
          height={H}
          role="img"
          aria-label="Workflow enrollments per week, last 7 weeks"
          onMouseLeave={() => setHover(null)}
          className="block"
        >
          {/* The axis title, turned to run up the scale it names. */}
          <text
            transform={`translate(12 ${pad.t + plotH / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-[var(--pg-muted)] text-[12px]"
          >
            Enrollments
          </text>

          {Y_TICKS.map((t) => (
            <g key={t}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--pg-border)"
                strokeWidth={1}
                strokeDasharray={t === 0 ? undefined : "3 4"}
              />
              <text
                x={pad.l - 10}
                y={y(t) + 4}
                textAnchor="end"
                className="fill-[var(--pg-faint)] text-[12px] tabular-nums"
              >
                {t === 0 ? "0" : compact(t)}
              </text>
            </g>
          ))}

          {WEEKS.map((w, i) =>
            i % labelEvery === 0 ? (
              <text
                key={w.label}
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                className={cn(
                  "text-[12px]",
                  hover === i ? "fill-[var(--pg-text)]" : "fill-[var(--pg-faint)]",
                )}
              >
                {w.label}
              </text>
            ) : null,
          )}

          {hover !== null ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.t}
              y2={pad.t + plotH}
              stroke="var(--pg-border-strong)"
              strokeWidth={1}
            />
          ) : null}

          <path
            d={monotonePath(pts)}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {pts.map((p, i) => (
            <circle
              key={WEEKS[i]!.label}
              cx={p.x}
              cy={p.y}
              r={hover === i ? 5.5 : 4}
              fill="var(--brand)"
              // The 2px surface ring separates the dot from the line under it.
              stroke="var(--pg-surface)"
              strokeWidth={2}
            />
          ))}

          {/* Hit targets last, so they sit over the marks. */}
          {WEEKS.map((w, i) => (
            <rect
              key={w.label}
              x={pad.l + band * i}
              y={pad.t}
              width={band}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>
      ) : null}

      {hover !== null && width > 0 ? (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[8px] bg-pg-overlay px-[10px] py-[7px] whitespace-nowrap shadow-[0_6px_18px_-6px_rgba(15,23,42,0.4)]"
          style={{
            // Clamped so the first and last weeks do not push the tooltip
            // past the card's edge.
            left: Math.min(Math.max(x(hover), 80), width - 80),
            top: pts[hover]!.y - 12,
          }}
        >
          <span className="block text-[12px] leading-[16px] text-pg-faint">
            {WEEKS[hover]!.label}
          </span>
          <span className="block text-[13px] leading-[18px] font-semibold text-pg-surface tabular-nums">
            {WEEKS[hover]!.value.toLocaleString("en-US")} enrollments
          </span>
        </div>
      ) : null}
    </div>
  );
}

function EnrollmentsCard() {
  return (
    <section className={cn(CARD, "flex min-w-0 flex-col gap-[12px] p-[16px]")}>
      <CardTitle icon={Activity}>Workflow enrollments – last 7 weeks</CardTitle>
      <EnrollmentsChart />
    </section>
  );
}

/* ─── Row 1, right: what is broken ──────────────────────────────────────── */

const ERRORS: { id: string; name: string; ago: string; message: string; step: string }[] = [
  {
    id: "wa-hook",
    name: "DO NOT TOUCH whatsapp_webhook",
    ago: "6 hours ago",
    message: "Webhook returned 500 from api.whatsapp.com",
    step: "Webhook",
  },
  {
    id: "company",
    name: "CompanyID → Associated Company Fields for new contacts",
    ago: "a day ago",
    message: "Custom field “Company ID” no longer exists",
    step: "Update contact field",
  },
  {
    id: "nw-4921",
    name: "New Workflow : 1790150304921",
    ago: "6 days ago",
    message: "Email action has no sender address",
    step: "Send email",
  },
  {
    id: "dnd",
    name: "DND – Master Workflow",
    ago: "12 days ago",
    message: "Contact has DND on for SMS, so the message was skipped",
    step: "Send SMS",
  },
  {
    id: "wa-banned",
    name: "Do not touch WhatsApp Banned Accounts",
    ago: "19 days ago",
    message: "WhatsApp template was rejected by Meta",
    step: "Send WhatsApp",
  },
  {
    id: "wallet",
    name: "Wallet Txn Anomaly Alert – Staging",
    ago: "21 days ago",
    message: "Custom code timed out after 30 seconds",
    step: "Custom code",
  },
];

/**
 * The error list, one row per workflow rather than per error.
 *
 * A workflow that failed forty times is still one thing to fix, so the row
 * names the workflow and when it last failed, and the detail opens in place.
 * Inline rather than a drawer: you are triaging down a list, and a drawer
 * would cover the next row you were about to read.
 */
function ErrorReviewCard() {
  const [openId, setOpenId] = React.useState<string | null>(null);

  return (
    <section className={cn(CARD, "flex h-full min-h-0 min-w-0 flex-col gap-[12px] p-[16px]")}>
      <div className="flex items-start justify-between gap-[12px]">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <CardTitle
            trailing={
              <span
                aria-label={`${ERRORS.length} workflows`}
                className="flex h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--hr-error-600)] px-[6px] text-[12px] leading-none font-semibold text-white tabular-nums"
              >
                {ERRORS.length}
              </span>
            }
          >
            Error review summary
          </CardTitle>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Workflows currently have errors that need attention
          </p>
        </div>
      </div>

      <OutlineButton
        onClick={() => showToast("Opening workflows that need review")}
        className="w-fit"
      >
        Needs review
        <ExternalLink size={14} aria-hidden="true" className="text-pg-text-strong" />
      </OutlineButton>

      <ul className="-mr-[6px] flex max-h-[360px] min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto pr-[6px] @min-[880px]:max-h-none">
        {ERRORS.map((e) => {
          const open = openId === e.id;
          return (
            <li key={e.id} className="shrink-0 rounded-[8px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-row-border)]">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : e.id)}
                className="flex w-full items-center gap-[10px] rounded-[8px] px-[12px] py-[10px] text-left motion-tap hover:bg-[color-mix(in_oklab,var(--pg-border)_40%,transparent)]"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="truncate text-[14px] leading-[20px] font-medium text-pg-heading">
                    {e.name}
                  </span>
                  <span className="text-[13px] leading-[18px] text-pg-muted">
                    Last error: {e.ago}
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-pg-faint transition-transform duration-150",
                    open && "rotate-90",
                  )}
                />
              </button>
              {open ? (
                <div className="motion-slot-in flex flex-col gap-[6px] border-t border-pg-border px-[12px] pt-[10px] pb-[12px]">
                  <p className="text-[13px] leading-[18px] text-[var(--pg-status-overdue-fg)]">
                    {e.message}
                  </p>
                  <p className="text-[13px] leading-[18px] text-pg-muted">
                    Affected step: <span className="text-pg-text">{e.step}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => showToast(`Opening ${e.name}`)}
                    className="flex w-fit items-center gap-[4px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
                  >
                    Open workflow
                    <ExternalLink size={13} aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── Row 2: trigger analysis ───────────────────────────────────────────── */

type FilterType = "trigger" | "workflow" | "folder";

const FILTER_TYPES: { value: FilterType; label: string }[] = [
  { value: "trigger", label: "Trigger type" },
  { value: "workflow", label: "Workflow" },
  { value: "folder", label: "Folder" },
];

const FILTER_VALUES: Record<FilterType, string[]> = {
  trigger: [
    "Form submitted",
    "Contact tag",
    "Appointment status",
    "Inbound webhook",
    "Birthday reminder",
  ],
  workflow: SWITCHER_WORKFLOWS.map((w) => w.name),
  folder: ["Web forms", "Sales", "Retention"],
};

/** The unfiltered 30-day totals the three cards open on. */
const BASE_ATTEMPTED = 10_600_000;
const BASE_MATCHED = 1_300_000;

/** "Today" for the prototype, and the edge of the 30-day window. */
const TODAY = "2026-09-29";

function shiftDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * A stable number in [0, 1) for a string.
 *
 * The same value always yields the same slice, so picking "Sales" twice
 * shows the same numbers twice — a filter that re-rolled on every pick would
 * read as noise rather than as data.
 */
function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

/**
 * The three totals for a filter and a window.
 *
 * Matched is derived from attempted and unmatched from both, so the cards
 * always add up: matched + unmatched = attempted, whatever the scale. The
 * window scales linearly against 30 days and is clamped there, because 30
 * days is all the data this report keeps.
 */
function triggerTotals(value: string | null, from: string, to: string) {
  const days = Math.min(30, Math.max(1, daysBetween(from, to)));
  const window = days / 30;
  const u = value ? hashUnit(value) : 0;
  const share = value ? 0.08 + u * 0.42 : 1;
  const matchRate = value
    ? 0.06 + hashUnit(`${value}:match`) * 0.22
    : BASE_MATCHED / BASE_ATTEMPTED;
  const attempted = Math.round(BASE_ATTEMPTED * share * window);
  const matched = Math.round(attempted * matchRate);
  return { attempted, matched, unmatched: attempted - matched };
}

/**
 * A 36px select that can be empty and can be off.
 *
 * The book-appointment Select always has a value; this one opens on a
 * placeholder, and the value half of the filter is disabled until the type
 * half says what kind of value it would be.
 */
function FilterSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled,
  width = 200,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  width?: number;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{ width }}
        className={cn(
          FIELD_BOX,
          "min-w-0 text-left text-[14px] leading-[20px] motion-tap enabled:hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] disabled:cursor-not-allowed disabled:bg-pg-bg",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            current ? "text-pg-text" : disabled ? "text-pg-disabled" : "text-pg-faint",
          )}
        >
          {current?.label ?? placeholder}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn("shrink-0", disabled ? "text-pg-disabled" : "text-pg-faint")}
        />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={Math.max(width, 240)}>
          <div role="listbox" aria-label={label} className="flex flex-col p-[4px]">
            {options.map((o) => (
              <MenuOption
                key={o.value}
                selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  close();
                }}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/**
 * The window, as two dates and two shortcuts.
 *
 * ISO in the trigger because that is what the shipped report prints and
 * what the native date inputs round-trip; the quick picks cover the two
 * windows anyone actually asks for.
 */
function DateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const picks = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
  ];

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Date range"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          FIELD_BOX,
          "shrink-0 text-[14px] leading-[20px] text-pg-text motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] tabular-nums",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <Calendar size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        {from} → {to}
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} align="end" width={280} maxHeight={360}>
          <div role="dialog" aria-label="Date range" className="flex flex-col gap-[12px] p-[12px]">
            <div className="flex flex-col gap-[8px]">
              {(
                [
                  ["Start date", from, (v: string) => onChange(v, to)],
                  ["End date", to, (v: string) => onChange(from, v)],
                ] as const
              ).map(([label, value, set]) => (
                <label key={label} className="flex flex-col gap-[4px]">
                  <span className="text-[13px] leading-[18px] font-medium text-pg-text">{label}</span>
                  <span className={FIELD_BOX}>
                    <input
                      type="date"
                      value={value}
                      max={TODAY}
                      onChange={(e) => {
                        if (e.target.value) set(e.target.value);
                      }}
                      className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text outline-none [color-scheme:light] [[data-page-theme=dark]_&]:[color-scheme:dark]"
                    />
                  </span>
                </label>
              ))}
            </div>
            <div className="flex flex-col border-t border-pg-border pt-[8px]">
              {picks.map((p) => {
                const pickFrom = shiftDays(TODAY, -p.days);
                return (
                  <MenuOption
                    key={p.label}
                    selected={from === pickFrom && to === TODAY}
                    onClick={() => {
                      onChange(pickFrom, TODAY);
                      close();
                    }}
                  >
                    {p.label}
                  </MenuOption>
                );
              })}
            </div>
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[8px] rounded-[10px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex items-center justify-between gap-[8px]">
        <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text">{label}</span>
        <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </div>
      <span
        title={value.toLocaleString("en-US")}
        className="text-[28px] leading-[36px] font-semibold tracking-[-0.01em] text-pg-heading tabular-nums"
      >
        {compact(value)}
      </span>
      <span className="text-[13px] leading-[18px] text-pg-muted">{caption}</span>
    </div>
  );
}

function TriggerAnalysisCard() {
  const [type, setType] = React.useState<FilterType | null>(null);
  const [value, setValue] = React.useState<string | null>(null);
  const [from, setFrom] = React.useState(shiftDays(TODAY, -30));
  const [to, setTo] = React.useState(TODAY);
  const totals = triggerTotals(value, from, to);

  return (
    <section className={cn(CARD, "flex min-w-0 flex-col gap-[16px] p-[16px]")}>
      <div className="flex flex-col gap-[2px]">
        <CardTitle icon={ListFilter}>Trigger analysis filter</CardTitle>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Filter trigger performance by various criteria to get detailed insights
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <FilterSelect
            label="Filter type"
            placeholder="Filter type"
            value={type}
            options={FILTER_TYPES}
            onChange={(v) => {
              // A new type makes the old value meaningless, so it goes.
              setType(v as FilterType);
              setValue(null);
            }}
            width={180}
          />
          <span className="px-[2px] text-[14px] leading-[20px] text-pg-muted">is</span>
          <FilterSelect
            label="Filter value"
            placeholder="Filter value"
            value={value}
            options={(type ? FILTER_VALUES[type] : []).map((v) => ({ value: v, label: v }))}
            onChange={setValue}
            disabled={!type}
            width={240}
          />
          {type ? (
            <button
              type="button"
              onClick={() => {
                setType(null);
                setValue(null);
              }}
              className="px-[4px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
        <DateRange
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
          }}
        />
      </div>

      <div className="@container">
        <div className="grid grid-cols-1 gap-[16px] @min-[640px]:grid-cols-3">
          <MetricCard
            label="Attempted enrollments"
            value={totals.attempted}
            caption="Total contacts evaluated per workflow"
            icon={UserRound}
          />
          <MetricCard
            label="Matched enrollments"
            value={totals.matched}
            caption="Contacts matching workflow triggers"
            icon={UserRound}
          />
          <MetricCard
            label="Unmatched enrollments"
            value={totals.unmatched}
            caption="Contacts failing to match triggers"
            icon={UserRound}
          />
        </div>
      </div>

      <p className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
        <Info size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        Trigger analysis data is available up to the last 30 days
      </p>
    </section>
  );
}

/* ─── The page ──────────────────────────────────────────────────────────── */

export function AutomationOverview() {
  const { effective } = useTheme();

  return (
    <div
      data-page-theme={effective.appTheme}
      // The page scrolls as a whole, like the dashboard: nothing here is a
      // list long enough to earn its own pane except the error list.
      className="@container flex h-full min-h-0 flex-col gap-[16px] overflow-y-auto px-[var(--page-inset)] pb-[16px]"
    >
      <PageHeader
        title="Workflow analytics"
        description="How your workflows are running across this account"
        aside={
          <GlyphButton
            icon={RefreshCw}
            label="Refresh"
            onClick={() => showToast("Analytics refreshed")}
          />
        }
        secondary={[
          { label: "Export", icon: Download, onClick: () => showToast("Report exported") },
        ]}
      />

      {/*
        2/3 + 1/3 from 880px of page; stacked under it. The error card is
        pinned to the row's height by the left column rather than setting it:
        absolutely filling its cell, it scrolls its own list instead of
        stretching the row to six expanded rows.
      */}
      <div className="grid shrink-0 grid-cols-1 gap-[16px] @min-[880px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-[16px]">
          <StatCard />
          <EnrollmentsCard />
        </div>
        <div className="relative min-w-0 @min-[880px]:min-h-[420px]">
          <div className="@min-[880px]:absolute @min-[880px]:inset-0">
            <ErrorReviewCard />
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <TriggerAnalysisCard />
      </div>
    </div>
  );
}
