"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { Select } from "@/components/page/form-controls";
import { showToast } from "@/components/page/toast";
import { OpportunityCard } from "../opportunity-card";
import { OPPORTUNITY_DRAG_TYPE } from "../stage-column";
import { stagesFor } from "../opportunity-edit-sections";
import {
  OpportunitySortPopover,
  sortOpportunities,
  type OpportunitySort,
} from "../opportunity-sort";
import {
  countOpportunities,
  formatMoney,
  parseMoney,
  stages,
  type Opportunity,
} from "../opportunities-data";

/* ── time ───────────────────────────────────────────────────────────────── */

type Granularity = "month" | "quarter";

/** The prototype's "now": Sep 2026, as a month index (year × 12 + month). */
const TODAY_MONTH = 2026 * 12 + 8;
const COLUMN_COUNT = 5;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Bucket {
  key: string;
  label: string;
  /** Month indices this bucket spans, first to last. */
  from: number;
  to: number;
  /** Past or current — painted success; future is brand. */
  reached: boolean;
}

function monthLabel(m: number): string {
  return `${MONTHS[m % 12].slice(0, 3)} ${Math.floor(m / 12)}`;
}

/**
 * The window of columns. Month mode opens one month back (Aug–Dec 2026);
 * quarter mode opens one quarter back. ‹ and › shift by one unit.
 */
function buildBuckets(granularity: Granularity, offset: number): Bucket[] {
  if (granularity === "month") {
    const start = TODAY_MONTH - 1 + offset;
    return Array.from({ length: COLUMN_COUNT }, (_, i) => {
      const m = start + i;
      return {
        key: `m${m}`,
        label: monthLabel(m),
        from: m,
        to: m,
        reached: m <= TODAY_MONTH,
      };
    });
  }
  const currentQ = Math.floor(TODAY_MONTH / 3);
  const startQ = currentQ - 1 + offset;
  return Array.from({ length: COLUMN_COUNT }, (_, i) => {
    const q = startQ + i;
    const from = q * 3;
    return {
      key: `q${q}`,
      label: `Q${(q % 4) + 1} ${Math.floor(from / 12)}`,
      from,
      to: from + 2,
      reached: q <= currentQ,
    };
  });
}

/** "2026-10-14" → month index; null when the date does not parse. */
function monthIndexOf(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 12 + Number(m[2]) - 1;
}

function isoFor(monthIndex: number, day: number): string {
  const y = Math.floor(monthIndex / 12);
  const mo = (monthIndex % 12) + 1;
  return `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Stable across renders and reloads, so a derived date never jumps. */
function hash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The seed has almost no close dates, and a timeline of five empty months
 * says nothing. So ~60% of undated rows get a deterministic date in
 * Aug–Dec 2026 here — local to this view, never written to the record.
 */
function derivedClose(id: string): string | undefined {
  const h = hash(id);
  if (h % 10 >= 6) return undefined;
  const month = 2026 * 12 + 7 + ((h >>> 4) % 5);
  const day = 1 + ((h >>> 8) % 28);
  return isoFor(month, day);
}

/* ── money ─────────────────────────────────────────────────────────────── */

const STAGE_PROBABILITY: Record<string, number> = {
  new: 0.1,
  reached: 0.25,
  quoted: 0.5,
  won: 1,
  lost: 0,
};

function probability(o: Opportunity): number {
  if (o.status === "won") return 1;
  if (o.status === "lost" || o.status === "abandoned") return 0;
  return STAGE_PROBABILITY[o.stageId] ?? 0.2;
}

function compactMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return formatMoney(Math.round(n));
}

/* ── stage progress ────────────────────────────────────────────────────── */

const SEGMENTS = 6;

function StageProgress({ record, pipelineId }: { record: Opportunity; pipelineId: string }) {
  const list = pipelineId === "all" ? stages : stagesFor(pipelineId);
  const open = list.filter((s) => s.tone === "open");
  const stage = stages.find((s) => s.id === record.stageId);
  const won = record.status === "won" || stage?.tone === "won";
  const lost = record.status === "lost" || stage?.tone === "lost";
  const idx = open.findIndex((s) => s.id === record.stageId);
  const filled = won
    ? SEGMENTS
    : lost
      ? 0
      : Math.max(1, Math.round(((idx + 1) / (open.length + 1)) * SEGMENTS));
  const label = won ? "Won" : lost ? "Lost" : (stage?.label ?? "Open");

  return (
    <div
      role="img"
      aria-label={`Stage: ${label}`}
      title={label}
      className="flex gap-[3px] px-[2px]"
    >
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-[4px] flex-1 rounded-full",
            i < filled
              ? won
                ? "bg-[var(--hr-success-500)]"
                : "bg-brand"
              : lost && i === 0
                ? "bg-pg-danger"
                : "bg-[var(--pg-border)]",
          )}
        />
      ))}
    </div>
  );
}

/* ── column ────────────────────────────────────────────────────────────── */

function useDrop(onDrop: (id: string) => void) {
  const depth = React.useRef(0);
  const [over, setOver] = React.useState(false);
  return {
    over,
    handlers: {
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      onDragLeave: () => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        const id = e.dataTransfer.getData(OPPORTUNITY_DRAG_TYPE);
        if (id) onDrop(id);
      },
    },
  };
}

type Accent = "warning" | "success" | "brand";

const ACCENT_BORDER: Record<Accent, string> = {
  warning: "shadow-[inset_0_2px_0_0_var(--hr-warning-500),inset_0_0_0_1px_var(--pg-border)]",
  success: "shadow-[inset_0_2px_0_0_var(--hr-success-500),inset_0_0_0_1px_var(--pg-border)]",
  brand: "shadow-[inset_0_2px_0_0_var(--brand),inset_0_0_0_1px_var(--pg-border)]",
};

function TimelineColumn({
  label,
  accent,
  warning,
  rows,
  collapsed,
  onToggleCollapse,
  onDropCard,
  emptyText,
  children,
}: {
  label: string;
  accent: Accent;
  warning?: boolean;
  rows: Opportunity[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onDropCard: (id: string) => void;
  emptyText: string;
  children: React.ReactNode;
}) {
  const { over, handlers } = useDrop(onDropCard);
  const total = rows.reduce((n, o) => n + parseMoney(o.value), 0);
  const weighted = rows.reduce((n, o) => n + parseMoney(o.value) * probability(o), 0);
  const pct = total ? Math.round((weighted / total) * 100) : 0;

  if (collapsed) {
    return (
      <section
        aria-label={label}
        {...handlers}
        className={cn(
          "flex h-full w-[40px] shrink-0 flex-col items-center gap-[8px] rounded-[8px] bg-pg-surface py-[8px] motion-tap",
          over ? "shadow-[inset_0_0_0_2px_var(--brand)]" : ACCENT_BORDER[accent],
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand column"
          aria-label={`Expand ${label}`}
          aria-expanded={false}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <span
          title={countOpportunities(rows.length)}
          className="text-[13px] leading-[18px] font-semibold tabular-nums text-pg-heading"
        >
          {rows.length.toLocaleString("en-US")}
        </span>
        <span
          className="min-h-0 truncate text-[14px] leading-[20px] font-semibold whitespace-nowrap text-pg-heading"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {label}
        </span>
      </section>
    );
  }

  return (
    <section
      aria-label={label}
      {...handlers}
      className={cn(
        "flex h-full min-h-0 w-[280px] shrink-0 flex-col gap-[8px] rounded-[10px] motion-tap",
        over && "bg-brand-soft shadow-[inset_0_0_0_2px_var(--brand)]",
      )}
    >
      <header
        className={cn(
          "flex shrink-0 flex-col gap-[2px] rounded-[8px] bg-pg-surface px-[12px] pt-[12px] pb-[10px]",
          ACCENT_BORDER[accent],
        )}
      >
        <div className="flex items-center gap-[6px]">
          {warning ? (
            <AlertTriangle
              size={15}
              aria-hidden="true"
              className="shrink-0 text-[var(--hr-warning-500)]"
            />
          ) : null}
          <h3 className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
            {label}
          </h3>
          <span
            title="Weighted amount"
            className="shrink-0 text-[14px] leading-[20px] font-semibold tabular-nums text-pg-heading"
          >
            {compactMoney(weighted)}
          </span>
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse column"
            aria-label={`Collapse ${label}`}
            aria-expanded
            className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="flex items-center justify-between gap-[6px] text-[13px] leading-[18px]">
          <span className="text-pg-muted">{countOpportunities(rows.length)}</span>
          <span className="tabular-nums text-pg-muted">
            +{pct}% of {compactMoney(total)}
          </span>
        </p>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Total <span className="font-semibold tabular-nums text-pg-heading">{formatMoney(total)}</span>
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto pb-[4px]">
        {rows.length > 0 ? (
          children
        ) : (
          <p className="px-[8px] py-[16px] text-center text-[13px] leading-[18px] text-pg-muted">
            {emptyText}
          </p>
        )}
      </div>
    </section>
  );
}

/* ── timeline ──────────────────────────────────────────────────────────── */

const NO_DATE = "none";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-[normal] font-semibold tabular-nums text-brand-fg">
      {children}
    </span>
  );
}

/**
 * Forecast timeline: the pipeline's deals laid out by expected close, with
 * undated deals held in their own column at the front — they are the ones
 * the forecast cannot count, so they are the first thing to fix.
 */
export function ForecastTimeline({
  pipelineId,
  rows,
  onOpenRecord,
  onAdd,
  filtersCount,
  onOpenFilters,
  sort,
  onSortChange: setSort,
  hideListControls = false,
}: {
  pipelineId: string;
  rows: Opportunity[];
  onOpenRecord: (id: string) => void;
  onAdd: () => void;
  filtersCount: number;
  onOpenFilters: () => void;
  /** Owned by the page, so the shared list toolbar can drive it too. */
  sort: OpportunitySort | null;
  onSortChange: (sort: OpportunitySort | null) => void;
  /**
   * The shared list toolbar is drawing Advanced filters and Sort above the
   * timeline, so the row keeps only its time window, grouping, and Add.
   */
  hideListControls?: boolean;
}) {
  const [sortOpen, setSortOpen] = React.useState(false);
  const [granularity, setGranularity] = React.useState<Granularity>("month");
  const [offset, setOffset] = React.useState(0);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [dragId, setDragId] = React.useState<string | null>(null);
  /** Local close-date moves from drag; "" means moved to No close date. */
  const [overrides, setOverrides] = React.useState<Record<string, string>>({});

  const buckets = React.useMemo(() => buildBuckets(granularity, offset), [granularity, offset]);

  const closeOf = React.useCallback(
    (o: Opportunity): string | undefined => {
      if (o.id in overrides) return overrides[o.id] || undefined;
      return o.expectedClose || derivedClose(o.id);
    },
    [overrides],
  );

  const grouped = React.useMemo(() => {
    const map = new Map<string, Opportunity[]>();
    map.set(NO_DATE, []);
    for (const b of buckets) map.set(b.key, []);
    for (const o of sortOpportunities(rows, sort)) {
      const m = monthIndexOf(closeOf(o));
      if (m === null) {
        map.get(NO_DATE)!.push(o);
        continue;
      }
      const b = buckets.find((x) => m >= x.from && m <= x.to);
      if (b) map.get(b.key)!.push(o);
    }
    return map;
  }, [rows, sort, buckets, closeOf]);

  const toggle = (key: string) =>
    setCollapsed((c) => {
      const n = new Set(c);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const dropInto = (bucket: Bucket | null) => (id: string) => {
    setDragId(null);
    const record = rows.find((o) => o.id === id);
    if (!record) return;
    if (!bucket) {
      if (!closeOf(record)) return;
      setOverrides((cur) => ({ ...cur, [id]: "" }));
      showToast("Expected close date cleared");
      return;
    }
    const current = monthIndexOf(closeOf(record));
    if (current !== null && current >= bucket.from && current <= bucket.to) return;
    // Middle month of a quarter; the 15th, so the date reads as mid-period.
    const target = bucket.from + Math.floor((bucket.to - bucket.from) / 2);
    setOverrides((cur) => ({ ...cur, [id]: isoFor(target, 15) }));
    showToast(
      `Expected close moved to ${
        granularity === "month" ? MONTHS[target % 12] : bucket.label
      }`,
    );
  };

  const cardsFor = (list: Opportunity[]) =>
    list.map((o) => (
      <div key={o.id} className="flex flex-col gap-[6px]">
        <OpportunityCard
          record={o}
          onOpen={() => onOpenRecord(o.id)}
          draggable
          dragging={dragId === o.id}
          onDragStart={(e) => {
            e.dataTransfer.setData(OPPORTUNITY_DRAG_TYPE, o.id);
            e.dataTransfer.effectAllowed = "move";
            setDragId(o.id);
          }}
          onDragEnd={() => setDragId(null)}
        />
        <StageProgress record={o} pipelineId={pipelineId} />
      </div>
    ));

  const undated = grouped.get(NO_DATE) ?? [];
  const unit = granularity === "month" ? "month" : "quarter";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[12px]">
      <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
        {hideListControls ? null : (
          <>
        <OutlineButton onClick={onOpenFilters}>
          <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
          Advanced filters
          {filtersCount ? <Badge>{filtersCount}</Badge> : null}
        </OutlineButton>
        <div className="relative shrink-0">
          <OutlineButton
            aria-haspopup="dialog"
            aria-expanded={sortOpen}
            onClick={() => setSortOpen((v) => !v)}
          >
            <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
            Sort
            {sort ? <Badge>1</Badge> : null}
          </OutlineButton>
          {sortOpen ? (
            <OpportunitySortPopover
              sort={sort}
              onChange={setSort}
              onClose={() => setSortOpen(false)}
            />
          ) : null}
        </div>
          </>
        )}

        <span aria-hidden="true" className="min-w-[16px] flex-1" />

        <div
          role="group"
          aria-label="Time window"
          className="flex h-[34px] shrink-0 items-center gap-[2px] rounded-[8px] bg-pg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          <button
            type="button"
            aria-label={`Previous ${unit}`}
            title={`Previous ${unit}`}
            onClick={() => setOffset((n) => n - 1)}
            className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-text active:scale-[0.97]"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-pressed={offset === 0}
            onClick={() => setOffset(0)}
            className={cn(
              "flex h-[28px] items-center rounded-[6px] px-[10px] text-[13px] leading-[normal] font-medium motion-tap active:scale-[0.97]",
              offset === 0
                ? "bg-pg-surface text-pg-text-strong shadow-[0_1px_2px_0_rgba(15,23,42,0.08),inset_0_0_0_1px_var(--pg-border)]"
                : "text-pg-muted hover:text-pg-text",
            )}
          >
            Today
          </button>
          <button
            type="button"
            aria-label={`Next ${unit}`}
            title={`Next ${unit}`}
            onClick={() => setOffset((n) => n + 1)}
            className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-text active:scale-[0.97]"
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
        <Select
          className="w-[128px] shrink-0"
          aria-label="Group by"
          value={granularity}
          options={[
            { value: "month", label: "Month" },
            { value: "quarter", label: "Quarter" },
          ]}
          onChange={(v) => {
            setGranularity(v as Granularity);
            setOffset(0);
          }}
        />
        <PrimaryButton onClick={onAdd}>
          <Plus size={16} aria-hidden="true" />
          Add opportunity
        </PrimaryButton>
      </div>

      <div className="flex min-h-0 flex-1 gap-[10px] overflow-x-auto pb-[4px]">
        <TimelineColumn
          label="No close date"
          accent="warning"
          warning
          rows={undated}
          collapsed={collapsed.has(NO_DATE)}
          onToggleCollapse={() => toggle(NO_DATE)}
          onDropCard={dropInto(null)}
          emptyText="Every opportunity has a close date"
        >
          {cardsFor(undated)}
        </TimelineColumn>
        {buckets.map((b) => {
          const list = grouped.get(b.key) ?? [];
          return (
            <TimelineColumn
              key={b.key}
              label={b.label}
              accent={b.reached ? "success" : "brand"}
              rows={list}
              collapsed={collapsed.has(b.key)}
              onToggleCollapse={() => toggle(b.key)}
              onDropCard={dropInto(b)}
              emptyText={`Nothing expected to close this ${unit}`}
            >
              {cardsFor(list)}
            </TimelineColumn>
          );
        })}
      </div>
    </div>
  );
}
