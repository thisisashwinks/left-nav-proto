"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Info,
  Search,
  Triangle,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/page/page-header";
import { Select, Toggle } from "@/components/page/form-controls";
import { Toaster } from "@/components/page/toast";
import { ToneAvatar } from "@/components/page/avatar";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  DAY_COUNT,
  DEFAULT_END,
  DEFAULT_START,
  dayToIso,
  formatMonth,
  formatPct,
  formatResponse,
  formatSpan,
  formatUs,
  isoToDay,
  SLA_USERS,
  tally,
  TOTAL_DAYS,
  trend,
  USER_DAYS,
  type Tally,
  type TrendMetric,
} from "./conversation-analytics-data";
import { SlaTrendChart, type TrendDatum } from "./conversation-analytics-chart";
import { UnderlineTabs } from "./sla-settings-page";

/**
 * Conversations ▸ Analytics — SLA performance.
 *
 * Everything on the page is derived from one range: the overview, its
 * comparison with the equal-length period before, the trend and the table.
 */
export function ConversationAnalyticsPage() {
  const { effective } = useTheme();
  const [range, setRange] = React.useState({ from: DEFAULT_START, to: DEFAULT_END });

  const len = range.to - range.from + 1;
  const current = tally(TOTAL_DAYS, range.from, range.to);
  const previous = tally(TOTAL_DAYS, range.from - len, range.from - 1);
  const compare = `Compared with ${formatUs(Math.max(0, range.from - len))}–${formatUs(Math.max(0, range.from - 1))}`;

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col overflow-y-auto px-[var(--page-inset)]"
    >
      <div className="flex shrink-0 flex-col gap-[14px] pb-[24px]">
        <PageHeader title="Analytics" description="See how quickly your team responds to conversations." />

        <UnderlineTabs tabs={["SLA performance"]} />

        <section className="flex flex-col gap-[20px] rounded-[12px] bg-pg-surface p-[20px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]">
          <header className="flex flex-wrap items-start gap-[12px]">
            <div className="flex min-w-[240px] flex-1 flex-col gap-[2px]">
              <h2 className="flex items-center gap-[6px] text-[16px] leading-[24px] font-semibold text-pg-heading">
                SLA overview
                <InfoTip text="SLAs are measured from a customer's message to your team's first reply." />
              </h2>
              <p className="text-[13px] leading-[18px] text-pg-muted">
                Monitor response times and see how consistently SLAs are met or breached.
              </p>
            </div>
            <DateRange
              from={range.from}
              to={range.to}
              onChange={(from, to) => setRange(from <= to ? { from, to } : { from: to, to: from })}
            />
          </header>

          <KpiCard current={current} previous={previous} compare={compare} />

          <TrendCard from={range.from} to={range.to} />

          <div className="h-px bg-pg-row-border" />

          <UsersSection from={range.from} to={range.to} />
        </section>
      </div>
      <Toaster />
    </div>
  );
}

/* ─── Bits ──────────────────────────────────────────────────────────────── */

function InfoTip({ text }: { text: string }) {
  return (
    <span title={text} aria-label={text} role="img" className="inline-flex text-pg-faint">
      <Info size={14} aria-hidden="true" />
    </span>
  );
}

function DateField({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (day: number) => void;
}) {
  return (
    <label className="relative flex h-[36px] w-[150px] cursor-pointer items-center gap-[8px] px-[12px] hover:bg-pg">
      <CalendarDays size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <span className="text-[14px] leading-[20px] text-pg-text tabular-nums">{formatUs(value)}</span>
      {/* The native picker, invisible over the field: US format on screen
          whatever the browser's locale, and a real calendar underneath. */}
      <input
        type="date"
        aria-label={label}
        value={dayToIso(value)}
        min={dayToIso(min)}
        max={dayToIso(max)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            /* Some browsers refuse outside a trusted gesture; the input still works. */
          }
        }}
        onChange={(e) => {
          if (e.target.value) onChange(isoToDay(e.target.value));
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

function DateRange({
  from,
  to,
  onChange,
}: {
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
      <DateField label="Start date" value={from} min={0} max={to} onChange={(d) => onChange(d, to)} />
      <span aria-hidden="true" className="w-px bg-[var(--pg-border)]" />
      <DateField
        label="End date"
        value={to}
        min={from}
        max={DAY_COUNT - 1}
        onChange={(d) => onChange(from, d)}
      />
    </div>
  );
}

function DeltaChip({
  good,
  down,
  children,
  title,
}: {
  good: boolean;
  down: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-[22px] items-center gap-[4px] rounded-[6px] px-[6px] text-[13px] leading-[18px] font-medium whitespace-nowrap tabular-nums",
        good
          ? "bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] text-[var(--pg-status-paid-fg)]"
          : "bg-[color-mix(in_oklab,var(--hr-error-600)_12%,transparent)] text-[var(--pg-status-overdue-fg)]",
      )}
    >
      <Triangle
        size={8}
        aria-hidden="true"
        fill="currentColor"
        strokeWidth={0}
        className={cn(down && "rotate-180")}
      />
      <span className="sr-only">{down ? "Down" : "Up"}</span>
      {children}
    </span>
  );
}

/** "+26.6%", "−26.6%" — percentage points, with a true minus. */
function signedPct(v: number): string {
  const r = Math.round(v * 10) / 10;
  return `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(1)}%`;
}

function Kpi({
  icon: Icon,
  tone,
  label,
  hint,
  value,
  chip,
  caption,
}: {
  icon: LucideIcon;
  tone: "success" | "warning" | "brand";
  label: string;
  hint: string;
  value: string;
  chip: React.ReactNode;
  caption: string;
}) {
  return (
    <div className="flex min-w-0 gap-[14px] border-pg-row-border px-[24px] py-[20px] not-first:border-t md:not-first:border-t-0 md:not-first:border-l">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[36px] shrink-0 items-center justify-center rounded-full",
          tone === "success" &&
            "bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] text-[var(--hr-success-600)]",
          tone === "warning" &&
            "bg-[color-mix(in_oklab,var(--hr-warning-500)_14%,transparent)] text-[var(--hr-warning-600)]",
          tone === "brand" && "bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] text-brand",
        )}
      >
        <Icon size={18} />
      </span>
      <div className="flex min-w-0 flex-col gap-[4px]">
        <span className="flex items-center gap-[6px] text-[14px] leading-[20px] text-pg-muted">
          {label}
          <InfoTip text={hint} />
        </span>
        <span className="flex flex-wrap items-center gap-[8px]">
          <span className="text-[28px] leading-[36px] font-semibold text-pg-heading tabular-nums">{value}</span>
          {chip}
        </span>
        <span className="text-[13px] leading-[18px] text-pg-muted">{caption}</span>
      </div>
    </div>
  );
}

function KpiCard({ current, previous, compare }: { current: Tally; previous: Tally; compare: string }) {
  const n = current.messages.toLocaleString("en-US");
  const hasPrev = previous.messages > 0 && current.messages > 0;
  const metDelta = hasPrev ? current.metPct! - previous.metPct! : 0;
  const respDelta = hasPrev ? current.avgSec! - previous.avgSec! : 0;

  return (
    <div className="grid grid-cols-1 rounded-[12px] shadow-[inset_0_0_0_1px_var(--pg-head-border)] md:grid-cols-3">
      <Kpi
        icon={ClipboardCheck}
        tone="success"
        label="SLA met"
        hint="Share of customer messages that got a first reply before the SLA overdue time."
        value={formatPct(current.metPct)}
        chip={
          hasPrev ? (
            <DeltaChip good={metDelta >= 0} down={metDelta < 0} title={compare}>
              {signedPct(metDelta)}
            </DeltaChip>
          ) : null
        }
        caption={`${current.met.toLocaleString("en-US")} of ${n} messages replied within SLA.`}
      />
      <Kpi
        icon={TriangleAlert}
        tone="warning"
        label="SLA breached"
        hint="Share of customer messages that passed the SLA overdue time before a reply."
        value={formatPct(current.breachedPct)}
        chip={
          hasPrev ? (
            <DeltaChip good={-metDelta <= 0} down={-metDelta < 0} title={compare}>
              {signedPct(-metDelta)}
            </DeltaChip>
          ) : null
        }
        caption={`${current.breached.toLocaleString("en-US")} of ${n} messages breached SLA.`}
      />
      <Kpi
        icon={Clock}
        tone="brand"
        label="Average response time"
        hint="Average time from a customer's message to your team's first reply."
        value={formatResponse(current.avgSec)}
        chip={
          hasPrev && respDelta !== 0 ? (
            <DeltaChip good={respDelta <= 0} down={respDelta < 0} title={compare}>
              {formatResponse(Math.abs(respDelta))}
            </DeltaChip>
          ) : null
        }
        caption={`Based on ${n} messages`}
      />
    </div>
  );
}

/* ─── Trend ─────────────────────────────────────────────────────────────── */

const METRICS: { value: TrendMetric; label: string }[] = [
  { value: "met", label: "SLA met %" },
  { value: "breached", label: "SLA breached %" },
  { value: "response", label: "Average response time" },
];

function niceStep(raw: number): number {
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

function TrendCard({ from, to }: { from: number; to: number }) {
  const [metric, setMetric] = React.useState<TrendMetric>("met");
  const { points, unit } = trend(from, to);

  const data: TrendDatum[] = points.map((p) => {
    const t = p.tally;
    const title = unit === "week" ? `Week of ${formatSpan(p.start, p.end)}` : formatSpan(p.start, p.end);
    const count = `${t.messages.toLocaleString("en-US")} messages`;
    if (metric === "response") {
      return {
        label: p.label,
        title,
        value: t.avgSec === null ? null : t.avgSec / 3600,
        display: `Average response time ${formatResponse(t.avgSec)}`,
        detail: `Based on ${count}`,
      };
    }
    const met = metric === "met";
    return {
      label: p.label,
      title,
      value: met ? t.metPct : t.breachedPct,
      display: `${met ? "SLA met" : "SLA breached"} ${formatPct(met ? t.metPct : t.breachedPct)}`,
      detail: `${(met ? t.met : t.breached).toLocaleString("en-US")} of ${count}`,
    };
  });

  const hours = metric === "response";
  const maxH = Math.max(0, ...data.map((d) => d.value ?? 0));
  const step = hours ? niceStep(maxH / 5) : 20;
  const yMax = hours ? Math.max(step, Math.ceil(maxH / step) * step) : 100;
  const caption =
    points.length > 0
      ? `${formatMonth(points[0]!.anchor)} – ${formatMonth(to)}`
      : "";

  return (
    <div className="flex flex-col gap-[16px] rounded-[12px] p-[20px] shadow-[inset_0_0_0_1px_var(--pg-head-border)]">
      <header className="flex flex-wrap items-start gap-[12px]">
        <div className="flex min-w-[240px] flex-1 flex-col gap-[2px]">
          <h3 className="flex items-center gap-[8px] text-[16px] leading-[24px] font-semibold text-pg-heading">
            <TrendingUp size={16} aria-hidden="true" className="text-pg-muted" />
            SLA performance trend
          </h3>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Track how SLA metrics change over time for the metric you choose.
          </p>
        </div>
        <Select
          aria-label="Trend metric"
          className="w-[240px] shrink-0"
          value={metric}
          options={METRICS}
          onChange={(v) => setMetric(v as TrendMetric)}
        />
      </header>

      <SlaTrendChart
        data={data}
        yMax={yMax}
        yStep={step}
        yFormat={(v) => (hours ? `${v}h` : String(v))}
        yTitle={hours ? "Average response time (hrs)" : metric === "met" ? "SLA met %" : "SLA breached %"}
      />

      <p className="text-center text-[13px] leading-[18px] text-pg-muted">{caption}</p>
    </div>
  );
}

/* ─── By user ───────────────────────────────────────────────────────────── */

type SortKey = "user" | "met" | "breached" | "response";

function UsersSection({ from, to }: { from: number; to: number }) {
  const [counts, setCounts] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "met", dir: "desc" });

  const q = query.trim().toLowerCase();
  const rows = SLA_USERS.map((u, i) => ({ user: u, t: tally(USER_DAYS[i]!, from, to) }))
    .filter((r) => !q || r.user.name.toLowerCase().includes(q))
    .sort((a, b) => {
      // Users with nothing in range sink, whichever way the column points.
      const ea = a.t.messages === 0;
      const eb = b.t.messages === 0;
      if (ea !== eb) return ea ? 1 : -1;
      const sign = sort.dir === "asc" ? 1 : -1;
      let d = 0;
      if (sort.key === "user") d = a.user.name.localeCompare(b.user.name);
      if (sort.key === "met") d = (a.t.metPct ?? 0) - (b.t.metPct ?? 0);
      if (sort.key === "breached") d = (a.t.breachedPct ?? 0) - (b.t.breachedPct ?? 0);
      if (sort.key === "response") d = (a.t.avgSec ?? 0) - (b.t.avgSec ?? 0);
      if (d !== 0) return d * sign;
      // Ties: more messages first, then by name — Aarat's 25 of 25 above Richa's 12 of 12.
      return b.t.messages - a.t.messages || a.user.name.localeCompare(b.user.name);
    });

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "user" || key === "response" ? "asc" : "desc" },
    );

  return (
    <div className="flex flex-col gap-[16px]">
      <header className="flex flex-wrap items-center gap-[12px]">
        <div className="flex min-w-[280px] flex-1 flex-col gap-[2px]">
          <h3 className="text-[16px] leading-[24px] font-semibold text-pg-heading">SLA performance by user</h3>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Track SLA compliance and response times by user. Performance is attributed to the contact
            owner when the SLA is evaluated.
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-[8px]">
          <Toggle aria-label="Show statistics in numbers" checked={counts} onChange={setCounts} />
          <span className="text-[14px] leading-[20px] text-pg-text">Show statistics in numbers</span>
        </label>
        <div className="relative w-[280px] shrink-0">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-pg-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            aria-label="Search users"
            className="h-[36px] w-full rounded-[8px] bg-pg-surface pr-[12px] pl-[34px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
          />
        </div>
      </header>

      <div className="overflow-x-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-head-border)]">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-pg">
              <SortHead k="user" sort={sort} onSort={onSort} first>
                User
              </SortHead>
              <SortHead k="met" sort={sort} onSort={onSort} right>
                SLA met %
              </SortHead>
              <SortHead k="breached" sort={sort} onSort={onSort} right>
                SLA breached %
              </SortHead>
              <SortHead k="response" sort={sort} onSort={onSort} right last>
                Average response time
              </SortHead>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-[16px] py-[32px] text-center text-[14px] leading-[20px] text-pg-muted">
                  No users match “{query.trim()}”.
                </td>
              </tr>
            ) : null}
            {rows.map(({ user, t }, i) => {
              const cell = cn(
                "h-[44px] px-[16px] text-[14px] leading-[20px] text-pg-text",
                i < rows.length - 1 && "border-b border-pg-row-border",
              );
              const num = cn(cell, "text-right tabular-nums");
              const none = t.messages === 0;
              return (
                <tr key={user.id} className="hover:bg-pg">
                  <td className={cell}>
                    <span className="flex items-center gap-[10px]">
                      <ToneAvatar name={user.name} initials={user.initials} tone={user.tone} size={28} round />
                      <span className="truncate">{user.name}</span>
                    </span>
                  </td>
                  <td className={num}>
                    {none ? "--" : counts ? `${t.met} of ${t.messages}` : formatPct(t.metPct)}
                  </td>
                  <td className={num}>
                    {none ? "--" : counts ? `${t.breached} of ${t.messages}` : formatPct(t.breachedPct)}
                  </td>
                  <td className={num}>{formatResponse(t.avgSec)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHead({
  k,
  sort,
  onSort,
  right,
  first,
  last,
  children,
}: {
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
  right?: boolean;
  first?: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "h-[40px] border-b border-pg-head-border px-[16px] text-[13px] leading-[18px] font-medium text-pg-text-strong",
        right ? "text-right" : "text-left",
        first && "rounded-tl-[8px]",
        last && "rounded-tr-[8px]",
      )}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn("group inline-flex items-center gap-[4px]", right && "flex-row")}
      >
        {children}
        <Icon
          size={14}
          aria-hidden="true"
          className={cn(active ? "text-brand" : "text-pg-faint opacity-0 group-hover:opacity-100")}
        />
      </button>
    </th>
  );
}
