"use client";

import * as React from "react";
import {
  Calendar,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Info,
  Settings,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Legend } from "@/components/reporting/chart-kit";
import { Select } from "@/components/page/form-controls";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { FORECAST_COLOURS, ForecastBars } from "./forecast-bars";
import {
  DATA_QUALITY,
  GROUP_BY_OPTIONS,
  RISK_BUCKETS,
  breakdown,
  breakdownTotal,
  fmtCount,
  fmtUSD2,
  forecastTotals,
  qualityCount,
  type BreakdownRow,
  type DrillTarget,
  type ForecastTone,
  type QualityId,
} from "./forecast-data";

/**
 * Opportunities ▸ Forecast ▸ Summary.
 *
 * Top to bottom it answers three questions in the order a sales lead asks
 * them: how much is out there (the four figures), how much of it should I not
 * trust (at-risk and data quality, side by side because they are the two
 * reasons a forecast lies), and where is it (the group-by chart and its
 * table). Every number is scoped to the pipeline in the page header.
 */

const CARD =
  "rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]";

/** Left-border colour for a risk row, and ink for a tone. */
const TONE_EDGE: Record<ForecastTone, string> = {
  error: "var(--pg-danger)",
  warning: "var(--pg-warn-icon)",
  success: "var(--pg-status-subscribed-dot)",
  brand: "var(--brand)",
};

/** The tinted round icon on a data-quality row. */
const TONE_DISC: Record<ForecastTone, string> = {
  brand: "bg-brand-soft text-brand",
  success:
    "bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] text-[var(--pg-status-paid-fg)]",
  error:
    "bg-[color-mix(in_oklab,var(--hr-error-600)_12%,transparent)] text-[var(--pg-status-overdue-fg)]",
  warning: "bg-[var(--pg-warn-bg)] text-[var(--pg-warn-fg)]",
};

const QUALITY_ICON: Record<QualityId, LucideIcon> = {
  "missing-close": Calendar,
  "missing-value": CircleDollarSign,
  overdue: Clock,
};

export function ForecastSummary({
  pipelineId,
  onOpenDrill,
  onOpenFilters,
  hideFilters = false,
}: {
  pipelineId: string;
  onOpenDrill: (t: DrillTarget) => void;
  onOpenFilters: () => void;
  /** The shared list toolbar draws the way in to filters instead. */
  hideFilters?: boolean;
}) {
  const [groupBy, setGroupBy] = React.useState<string>("status");
  const totals = forecastTotals(pipelineId);
  const rows = breakdown(groupBy, pipelineId);
  const total = breakdownTotal(rows);
  const groupLabel =
    GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label ?? "Status";

  const riskCount = RISK_BUCKETS.reduce((n, b) => n + b.count, 0);
  const riskValue = RISK_BUCKETS.reduce((n, b) => n + b.value, 0);

  return (
    <div className="flex flex-col gap-[16px]">
      {hideFilters ? null : (
      <div className="flex items-center">
        <button
          type="button"
          onClick={onOpenFilters}
          className="motion-tap flex h-[32px] items-center gap-[6px] rounded-full bg-pg-surface px-[12px] text-[13px] leading-[18px] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg hover:text-pg-heading"
        >
          <SlidersHorizontal size={14} aria-hidden="true" className="text-pg-muted" />
          Advanced filters
        </button>
      </div>
      )}

      <div className="grid grid-cols-2 gap-[16px] xl:grid-cols-4">
        <Stat
          label="Max potential revenue"
          value={fmtUSD2(totals.maxPotential)}
          hint="Total value if all open opportunities close"
        />
        <Stat
          label="Expected revenue"
          value={fmtUSD2(totals.expected)}
          hint="Based on opportunity or stage probability"
        />
        <Stat
          label="Won revenue"
          value={fmtUSD2(totals.won)}
          hint="Total value of won opportunities"
          valueClassName="text-[var(--pg-status-paid-fg)]"
        />
        <Stat
          label="Open opportunities"
          value={fmtCount(totals.open)}
          hint="Opportunities currently in progress"
        />
      </div>

      <div className="grid grid-cols-1 gap-[16px] lg:grid-cols-2">
        <section className={cn(CARD, "flex flex-col gap-[12px] p-[16px]")}>
          <header className="flex flex-col gap-[2px]">
            <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[6px]">
              <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
                At-risk opportunities
              </h3>
              <button
                type="button"
                onClick={() => showToast("Risk settings are coming soon")}
                className="motion-tap flex items-center gap-[4px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
              >
                <Settings size={14} aria-hidden="true" />
                Adjust risk settings
              </button>
              <span className="ml-auto rounded-full bg-pg px-[10px] py-[3px] text-[12px] leading-[16px] font-medium whitespace-nowrap text-pg-text-strong tabular-nums shadow-[inset_0_0_0_1px_var(--pg-border)]">
                {fmtCount(riskCount)} {riskCount === 1 ? "opportunity" : "opportunities"} · {fmtUSD2(riskValue)}
              </span>
            </div>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              Opportunities whose expected close date was pushed this period.
            </p>
          </header>

          <div className="flex flex-col gap-[8px]">
            {RISK_BUCKETS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onOpenDrill({ kind: "risk", id: b.id })}
                style={{ borderLeftColor: TONE_EDGE[b.tone] }}
                className="motion-tap flex items-center gap-[12px] rounded-[8px] border-l-[3px] bg-pg-surface py-[10px] pr-[12px] pl-[12px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
                    {b.label}
                  </span>
                  <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                    {b.rule}
                  </span>
                </span>
                <span className="flex shrink-0 items-baseline gap-[6px] tabular-nums">
                  <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                    {fmtCount(b.count)}
                  </span>
                  <span className="text-[13px] leading-[18px] text-pg-muted">
                    ({fmtUSD2(b.value)})
                  </span>
                </span>
                <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
              </button>
            ))}
          </div>
        </section>

        <section className={cn(CARD, "flex flex-col gap-[12px] p-[16px]")}>
          <header className="flex flex-col gap-[2px]">
            <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              Fix your forecast data
            </h3>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              Data quality directly impacts forecast accuracy.
            </p>
          </header>

          <div className="flex flex-col gap-[8px]">
            {DATA_QUALITY.map((q) => {
              const Icon = QUALITY_ICON[q.id];
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onOpenDrill({ kind: "quality", id: q.id })}
                  className="motion-tap flex items-center gap-[12px] rounded-[8px] bg-pg-surface px-[12px] py-[10px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-[32px] shrink-0 items-center justify-center rounded-full",
                      TONE_DISC[q.tone],
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
                      {q.label}
                    </span>
                    <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                      {q.hint}
                    </span>
                  </span>
                  <span className="shrink-0 text-[14px] leading-[20px] font-semibold text-pg-heading tabular-nums">
                    {fmtCount(qualityCount(q.id, pipelineId))}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-[8px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
          Group by
        </span>
        <Select
          aria-label="Group by"
          value={groupBy}
          options={GROUP_BY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={setGroupBy}
          className="w-[180px]"
        />
      </div>

      <section className={cn(CARD, "flex flex-col gap-[16px] p-[16px]")}>
        <header className="flex flex-wrap items-center justify-between gap-[8px]">
          <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            Opportunities by {groupLabel.toLowerCase()}
          </h3>
          <Legend
            items={[
              { label: "Won revenue", colour: FORECAST_COLOURS.won },
              { label: "Expected revenue", colour: FORECAST_COLOURS.expected },
              { label: "Max potential revenue", colour: FORECAST_COLOURS.max },
            ]}
          />
        </header>
        <ForecastBars
          rows={rows.map((r) => ({
            label: r.label,
            max: r.max,
            expected: r.expected ?? 0,
            won: r.won,
          }))}
        />
      </section>

      <BreakdownTable groupLabel={groupLabel} rows={rows} total={total} />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string;
  hint: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn(CARD, "flex min-w-0 flex-col gap-[4px] p-[16px]")}>
      <span className="text-[13px] leading-[18px] font-medium text-pg-muted">{label}</span>
      <span
        className={cn(
          "truncate text-[24px] leading-[32px] font-semibold text-pg-heading tabular-nums",
          valueClassName,
        )}
      >
        {value}
      </span>
      <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span>
    </div>
  );
}

const COLUMNS: { label: string; info?: string }[] = [
  { label: "Opportunities" },
  { label: "Max potential revenue", info: "Total value if all open opportunities close" },
  { label: "Expected revenue", info: "Based on opportunity or stage probability" },
  { label: "Won revenue" },
  { label: "Total potential", info: "Expected revenue plus won revenue" },
];

function BreakdownTable({
  groupLabel,
  rows,
  total,
}: {
  groupLabel: string;
  rows: BreakdownRow[];
  total: BreakdownRow;
}) {
  return (
    <div className={cn(CARD, "overflow-x-auto")}>
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="h-[40px] border-b border-pg-head-border">
            <th className="px-[16px] text-left text-[12px] leading-[16px] font-medium whitespace-nowrap text-pg-muted">
              {groupLabel}
            </th>
            {COLUMNS.map((c) => (
              <th
                key={c.label}
                className="px-[16px] text-right text-[12px] leading-[16px] font-medium whitespace-nowrap text-pg-muted"
              >
                <span className="inline-flex items-center gap-[4px]">
                  {c.label}
                  {c.info ? (
                    <span title={c.info} className="inline-flex text-pg-faint">
                      <Info size={13} aria-label={c.info} />
                    </span>
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <BreakdownLine key={r.label} row={r} />
          ))}
          <BreakdownLine row={total} bold />
        </tbody>
      </table>
    </div>
  );
}

function BreakdownLine({ row, bold }: { row: BreakdownRow; bold?: boolean }) {
  const cell = cn(
    "px-[16px] text-right text-[14px] leading-[20px] whitespace-nowrap tabular-nums",
    bold ? "font-semibold" : "",
  );
  return (
    <tr
      className={cn(
        "h-[44px] border-b border-pg-row-border last:border-b-0",
        bold && "bg-pg",
      )}
    >
      <td
        className={cn(
          "px-[16px] text-left text-[14px] leading-[20px] whitespace-nowrap",
          bold ? "font-semibold text-pg-heading" : "text-pg-text",
        )}
      >
        {row.label}
      </td>
      <td className={cn(cell, bold ? "text-pg-heading" : "text-pg-text")}>
        {fmtCount(row.count)}
      </td>
      <td className={cn(cell, bold ? "text-pg-heading" : "text-pg-text")}>
        {fmtUSD2(row.max)}
      </td>
      <td className={cn(cell, row.expected === null ? "text-pg-faint" : "text-brand")}>
        {row.expected === null ? "–" : fmtUSD2(row.expected)}
      </td>
      <td className={cn(cell, "text-[var(--pg-status-paid-fg)]")}>{fmtUSD2(row.won)}</td>
      <td className={cn(cell, bold ? "text-pg-heading" : "text-pg-text")}>
        {fmtUSD2(row.total)}
      </td>
    </tr>
  );
}
