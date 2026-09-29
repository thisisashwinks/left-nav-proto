import type { AvatarTone } from "@/components/contacts/contacts-data";
import { pipelines } from "@/components/opportunities/opportunities-data";

/**
 * The Forecast ▸ Summary numbers.
 *
 * Seeded off the shipped screen's Status breakdown, and every other cut is
 * derived from that one rather than seeded beside it: the stat cards, the
 * table's Total row and each group-by all add up to the same four figures,
 * so switching "Group by" never changes what the page claims in total.
 * Everything is held in cents while it is being split, because splitting
 * $25,300.02 five ways in floats is how a Total row ends up a cent out.
 */

/** "all" or one of `pipelines[].id`. */
export type ForecastPipelineId = string;

/** 1100 → "$1,100.00". Always two decimals, the way the forecast prints money. */
export function fmtUSD2(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 5275 → "5,275". */
export function fmtCount(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Each pipeline's share of the account. Deterministic, sums to 1, and ordered
 * like the chip rail so the Pipeline group-by reads in the same order.
 */
const PIPELINE_SHARE: Record<string, number> = {
  services: 0.42,
  install: 0.27,
  hot: 0.11,
  winter: 0.2,
};

function shareOf(pipelineId: string): number {
  if (pipelineId === "all") return 1;
  return PIPELINE_SHARE[pipelineId] ?? 0.25;
}

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

/**
 * Split an integer across weights so the parts add back up exactly
 * (largest remainder). Used for counts and for cents alike.
 */
function splitInt(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; left > 0 && order.length > 0; k++, left--) {
    out[order[k % order.length]!.i]! += 1;
  }
  return out;
}

export interface BreakdownRow {
  label: string;
  count: number;
  max: number;
  /** Null where a forecast does not apply — a closed opportunity. */
  expected: number | null;
  won: number;
  /** Expected plus won: what the period is on course to book. */
  total: number;
}

/** The shipped Status breakdown, account-wide. */
const STATUS_BASE = [
  { label: "Open", count: 5275, max: 51310.09, expected: 25300.02, won: 0 },
  { label: "Won", count: 8, max: 1100, expected: null, won: 1100 },
  { label: "Lost", count: 3, max: 0, expected: null, won: 0 },
  { label: "Abandoned", count: 2, max: 0, expected: null, won: 0 },
] as const;

function row(
  label: string,
  count: number,
  maxC: number,
  expectedC: number | null,
  wonC: number,
): BreakdownRow {
  return {
    label,
    count,
    max: fromCents(maxC),
    expected: expectedC === null ? null : fromCents(expectedC),
    won: fromCents(wonC),
    total: fromCents((expectedC ?? 0) + wonC),
  };
}

/** The Status cut, scaled to the pipeline in scope. */
function statusRows(pipelineId: string): BreakdownRow[] {
  const f = shareOf(pipelineId);
  return STATUS_BASE.map((s) =>
    row(
      s.label,
      // A pipeline never shows zero of a status the account has.
      Math.max(1, Math.round(s.count * f)),
      Math.round(toCents(s.max) * f),
      s.expected === null ? null : Math.round(toCents(s.expected) * f),
      Math.round(toCents(s.won) * f),
    ),
  );
}

export function forecastTotals(pipelineId: string): {
  maxPotential: number;
  expected: number;
  won: number;
  open: number;
} {
  const rows = statusRows(pipelineId);
  const sumC = (pick: (r: BreakdownRow) => number) =>
    rows.reduce((n, r) => n + toCents(pick(r)), 0);
  return {
    maxPotential: fromCents(sumC((r) => r.max)),
    expected: fromCents(sumC((r) => r.expected ?? 0)),
    won: fromCents(sumC((r) => r.won)),
    open: rows[0]!.count,
  };
}

/**
 * A cut of the whole into named slices.
 *
 * Open work (count, max, expected) and won work split on separate weights so
 * the bars do not all share one ratio — an owner can be good at closing and
 * light on pipeline. Expected leans off the open weights a little per row,
 * which keeps it under max everywhere (the account-wide ratio is ~0.49).
 */
function splitCut(
  pipelineId: string,
  slices: { label: string; open: number; won: number; lean?: number }[],
): BreakdownRow[] {
  const [open, won, lost, abandoned] = statusRows(pipelineId);
  const openW = slices.map((s) => s.open);
  const expW = slices.map((s) => s.open * (s.lean ?? 1));
  const wonW = slices.map((s) => s.won);
  const closedCount = won!.count + lost!.count + abandoned!.count;

  const openCount = splitInt(open!.count, openW);
  const closed = splitInt(closedCount, slices.map((s) => s.won + 0.4));
  const maxOpen = splitInt(toCents(open!.max), openW);
  const exp = splitInt(toCents(open!.expected ?? 0), expW);
  const wonC = splitInt(toCents(won!.won), wonW);

  return slices.map((s, i) =>
    row(
      s.label,
      openCount[i]! + closed[i]!,
      maxOpen[i]! + wonC[i]!,
      exp[i]!,
      wonC[i]!,
    ),
  );
}

const GROUPS: Record<
  string,
  (pipelineId: string) => BreakdownRow[]
> = {
  status: statusRows,

  stage: (pipelineId) => {
    const [open, won, lost, abandoned] = statusRows(pipelineId);
    const w = [0.46, 0.32, 0.22];
    const lean = [0.7, 1.05, 1.45];
    const counts = splitInt(open!.count, w);
    const max = splitInt(toCents(open!.max), w);
    const exp = splitInt(
      toCents(open!.expected ?? 0),
      w.map((x, i) => x * lean[i]!),
    );
    return [
      row("New lead", counts[0]!, max[0]!, exp[0]!, 0),
      row("Reached out", counts[1]!, max[1]!, exp[1]!, 0),
      row("Quote sent", counts[2]!, max[2]!, exp[2]!, 0),
      row("Won", won!.count, toCents(won!.max), null, toCents(won!.won)),
      // Abandoned has no stage of its own; it sits where the board puts it.
      row("Lost", lost!.count + abandoned!.count, 0, null, 0),
    ];
  },

  owner: (pipelineId) =>
    splitCut(pipelineId, [
      { label: "Samrina Shabha", open: 0.34, won: 0.5, lean: 1.1 },
      { label: "Dev Anand", open: 0.28, won: 0.32, lean: 0.95 },
      { label: "Vishnupriya Poduval", open: 0.16, won: 0.18, lean: 1.2 },
      { label: "Unassigned", open: 0.22, won: 0, lean: 0.75 },
    ]),

  pipeline: (pipelineId) => {
    if (pipelineId !== "all") {
      const p = pipelines.find((x) => x.id === pipelineId);
      const t = forecastTotals(pipelineId);
      const count = statusRows(pipelineId).reduce((n, r) => n + r.count, 0);
      return [
        row(
          p?.label ?? "Pipeline",
          count,
          toCents(t.maxPotential),
          toCents(t.expected),
          toCents(t.won),
        ),
      ];
    }
    return splitCut(
      "all",
      pipelines.map((p, i) => ({
        label: p.label,
        open: PIPELINE_SHARE[p.id] ?? 0.25,
        won: [0.45, 0.3, 0.25, 0][i] ?? 0,
        lean: [1, 0.9, 1.3, 0.85][i],
      })),
    );
  },

  source: (pipelineId) =>
    splitCut(pipelineId, [
      { label: "WhatsApp", open: 0.31, won: 0.35, lean: 1 },
      { label: "Web form", open: 0.27, won: 0.2, lean: 0.85 },
      { label: "Referral", open: 0.18, won: 0.3, lean: 1.35 },
      { label: "Inbound call", open: 0.24, won: 0.15, lean: 0.95 },
    ]),
};

export const GROUP_BY_OPTIONS = [
  { value: "status", label: "Status" },
  { value: "stage", label: "Stage" },
  { value: "owner", label: "Owner" },
  { value: "pipeline", label: "Pipeline" },
  { value: "source", label: "Source" },
] as const;

export function breakdown(groupBy: string, pipelineId: string): BreakdownRow[] {
  return (GROUPS[groupBy] ?? GROUPS.status!)(pipelineId);
}

/** The bold last row of the breakdown table. */
export function breakdownTotal(rows: BreakdownRow[]): BreakdownRow {
  const sumC = (pick: (r: BreakdownRow) => number) =>
    rows.reduce((n, r) => n + toCents(pick(r)), 0);
  const expected = rows.some((r) => r.expected !== null)
    ? sumC((r) => r.expected ?? 0)
    : null;
  return row(
    "Total",
    rows.reduce((n, r) => n + r.count, 0),
    sumC((r) => r.max),
    expected,
    sumC((r) => r.won),
  );
}

/* ─── At-risk and data quality ─────────────────────────────────────────── */

export type RiskId = "high" | "medium" | "low";
export type QualityId = "missing-close" | "missing-value" | "overdue";

export type DrillTarget =
  | { kind: "risk"; id: RiskId }
  | { kind: "quality"; id: QualityId };

export type ForecastTone = "error" | "warning" | "success" | "brand";

export const RISK_BUCKETS: {
  id: RiskId;
  label: string;
  rule: string;
  tone: ForecastTone;
  count: number;
  value: number;
}[] = [
  { id: "high", label: "High risk", rule: "Slipped 2+ times or 14+ days", tone: "error", count: 0, value: 0 },
  { id: "medium", label: "Medium risk", rule: "Slipped 1+ times or 7+ days (excluding high)", tone: "warning", count: 2, value: 3400 },
  { id: "low", label: "Low risk", rule: "Slipped 1+ times or 1+ days (excluding high and medium)", tone: "success", count: 3, value: 5150 },
];

export const DATA_QUALITY: {
  id: QualityId;
  label: string;
  hint: string;
  tone: ForecastTone;
  count: number;
}[] = [
  { id: "missing-close", label: "Missing close date", hint: "Not included in forecast calculations.", tone: "brand", count: 5275 },
  { id: "missing-value", label: "Missing opportunity value", hint: "These opportunities contribute $0 to totals.", tone: "success", count: 5268 },
  { id: "overdue", label: "Overdue opportunities", hint: "May inflate forecast totals.", tone: "error", count: 0 },
];

/** A data-quality count scoped to the pipeline, the same way the totals are. */
export function qualityCount(id: QualityId, pipelineId: string): number {
  const base = DATA_QUALITY.find((q) => q.id === id)?.count ?? 0;
  return base === 0 ? 0 : Math.max(1, Math.round(base * shareOf(pipelineId)));
}

export interface ForecastRow {
  id: string;
  name: string;
  value: number;
  status: "Open" | "Won" | "Lost" | "Abandoned";
  pipeline: string;
  stage: string;
  /** Absent when nobody owns it — drawn as the unassigned glyph. */
  owner?: string;
  ownerInitials?: string;
  ownerTone?: AvatarTone;
  expectedClose?: string;
  daysSlipped?: number;
  timesSlipped?: number;
  originalClose?: string;
  newClose?: string;
}

const NAMES = [
  "Ben Davis Davis", "Ansh", "Prasath Dhayalan", "Nikhil Satish", "Jhu 9 H 0",
  "Derrick Selvakumar", "Ahmed Bahar", "Shreyas", "Convo test", "Meghraj Suthar",
  "Tridev Singh", "Shivani", "Arman Ali", "Ritesh Mukim", "Pradeep Kumar",
  "Ella", "Abhilash Chauhan", "Jatin", "Vishnu", "Sachin",
  "Karthik Ramesh", "Priya Nair", "Test contact 2", "Rohan Mehta", "Sana Qureshi",
  "Ishaan", "Gaurav Tiwari", "Neha Kapoor", "Farhan Sheikh", "Lead from chat",
];

const OWNERS: { name: string; initials: string; tone: AvatarTone }[] = [
  { name: "Samrina Shabha", initials: "SS", tone: "blue" },
  { name: "Dev Anand", initials: "DA", tone: "orange" },
  { name: "Vishnupriya Poduval", initials: "VP", tone: "purple" },
];

const PIPELINE_LABELS = pipelines.map((p) => p.label);
const OPEN_STAGES = ["New lead", "Reached out", "Quote sent"];

/** A stable owner-or-nobody for row i: every fourth row is unassigned. */
function ownerFor(i: number): Pick<ForecastRow, "owner" | "ownerInitials" | "ownerTone"> {
  if (i % 4 === 3) return {};
  const o = OWNERS[i % OWNERS.length]!;
  return { owner: o.name, ownerInitials: o.initials, ownerTone: o.tone };
}

function base(prefix: string, i: number): Omit<ForecastRow, "value"> {
  return {
    id: `${prefix}-${i + 1}`,
    name: NAMES[i % NAMES.length]!,
    status: "Open",
    pipeline: PIPELINE_LABELS[i % PIPELINE_LABELS.length]!,
    stage: OPEN_STAGES[(i * 2) % OPEN_STAGES.length]!,
    ...ownerFor(i),
  };
}

const RISK_ROWS: Record<RiskId, ForecastRow[]> = {
  high: [],
  medium: [
    { ...base("risk-m", 5), value: 2100, daysSlipped: 9, timesSlipped: 1, originalClose: "09/12/2026", newClose: "09/21/2026" },
    { ...base("risk-m", 2), value: 1300, daysSlipped: 11, timesSlipped: 1, originalClose: "09/08/2026", newClose: "09/19/2026" },
  ],
  low: [
    { ...base("risk-l", 9), value: 2400, daysSlipped: 3, timesSlipped: 1, originalClose: "09/22/2026", newClose: "09/25/2026" },
    { ...base("risk-l", 3), value: 1750, daysSlipped: 5, timesSlipped: 1, originalClose: "09/18/2026", newClose: "09/23/2026" },
    { ...base("risk-l", 6), value: 1000, daysSlipped: 2, timesSlipped: 1, originalClose: "09/24/2026", newClose: "09/26/2026" },
  ],
};

/** Values that look entered by hand: mostly round, the odd cents. */
function valueFor(i: number): number {
  const v = [450, 1200, 690, 2850, 320, 7300, 1150, 4200, 980, 15.5][i % 10]!;
  return v + (i >= 10 ? 100 * (i % 7) : 0);
}

const QUALITY_ROWS: Record<QualityId, ForecastRow[]> = {
  "missing-close": NAMES.map((_, i) => ({ ...base("mc", i), value: valueFor(i) })),
  "missing-value": NAMES.map((_, i) => ({
    ...base("mv", (i + 4) % NAMES.length),
    id: `mv-${i + 1}`,
    value: 0,
    expectedClose: `10/${String((i % 28) + 1).padStart(2, "0")}/2026`,
  })),
  overdue: [],
};

export function drillRows(target: DrillTarget): { rows: ForecastRow[]; total: number } {
  if (target.kind === "risk") {
    const rows = RISK_ROWS[target.id];
    return { rows, total: RISK_BUCKETS.find((b) => b.id === target.id)?.count ?? rows.length };
  }
  const rows = QUALITY_ROWS[target.id];
  return { rows, total: DATA_QUALITY.find((q) => q.id === target.id)?.count ?? rows.length };
}

/** Title and subtitle for a drilldown, from the same tables the page reads. */
export function drillMeta(target: DrillTarget): { title: string; subtitle: string } {
  if (target.kind === "risk") {
    const b = RISK_BUCKETS.find((x) => x.id === target.id)!;
    return { title: `Slippage drilldown · ${b.label}`, subtitle: b.rule };
  }
  const q = DATA_QUALITY.find((x) => x.id === target.id)!;
  return { title: q.label, subtitle: q.hint };
}
