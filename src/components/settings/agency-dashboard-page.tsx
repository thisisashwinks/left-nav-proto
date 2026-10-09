"use client";

import * as React from "react";
import {
  DollarSign,
  Info,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import { PageTitle, usePageChrome } from "@/components/page/page-header";
import { RailTooltip } from "@/components/nav/rail-tooltip";
import { ProductionStubTab } from "./tab-production-stub";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_TABS,
  GROWTH,
  GROWTH_LEFT_MAX,
  GROWTH_RIGHT_MAX,
  REVENUE_SPLIT,
  REVENUE_TOTAL,
  SUMMARY_TILES,
  type DashboardTab,
  type MetricTile,
} from "./agency-dashboard-data";

/**
 * Agency Dashboard ▸ Summary.
 *
 * Where an agency lands when it switches scope: four numbers, a two-axis
 * trend and a revenue split. It is the one agency screen that is about the
 * BUSINESS rather than about configuring something, which is why it is the
 * default — arriving on a settings page would say the agency scope is a
 * place you go to change things, when mostly it is a place you go to look.
 *
 * Both charts are hand-drawn SVG rather than a charting library. Three
 * reasons, in order: the prototype has no chart dependency and adding one
 * for two figures would be the largest thing in the bundle; these are
 * fixtures with a known shape, so none of a library's axis inference,
 * tooltips or responsiveness is being used; and a hand-drawn chart reads
 * the design tokens directly, where a library would need a theme adapter
 * to stop looking like a different product.
 */
export function AgencyDashboardPage() {
  const { title: showTitle, description: showDesc } = usePageChrome();
  const [tab, setTab] = React.useState<DashboardTab>("Summary");

  return (
    /*
      No max width here, unlike Labs and White Label.

      Those are one column of prose and a switch, and capping them keeps a
      sentence near the control that answers it. This page is a grid: four
      figures that are meant to be compared at a glance, and two charts
      whose whole value is horizontal room — seven months on two axes gets
      harder to read at every pixel you take away. Capping it would leave
      the figures in a row with empty plane either side of them, which is
      the one thing a dashboard cannot afford to look like. Ashwin, Oct 9.
    */
    <div className="w-full px-[var(--page-inset)] pb-[24px]">
      {/*
        The title and the tabs share a row, which is the one place this page
        departs from the other agency screens.

        They stack everywhere else because their tab strips are long. Three
        short tabs beside a two-word title fit easily, and the screenshot
        puts them there — it reads as one heading for one subject rather
        than a page with a navigation bar under it.
      */}
      <header className="flex flex-wrap items-baseline gap-x-[28px] gap-y-[8px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        {showTitle ? (
          <PageTitle
            title="Agency Dashboard"
            className="pb-[10px] text-[22px] leading-[30px] font-semibold tracking-[-0.3px] text-pg-heading"
          />
        ) : null}
        <nav aria-label="Dashboard sections" className="flex gap-[18px]">
          {DASHBOARD_TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-current={t === tab ? "page" : undefined}
              onClick={() => setTab(t)}
              className={cn(
                "motion-tap shrink-0 pb-[10px] text-[14px] leading-[20px] font-medium whitespace-nowrap",
                t === tab
                  ? "text-brand shadow-[inset_0_-2px_0_0_var(--brand)]"
                  : "text-pg-muted hover:text-pg-text",
              )}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {tab !== "Summary" ? (
        <div className="pt-[16px]">
          <ProductionStubTab label={tab} />
        </div>
      ) : (
        <div className="flex flex-col gap-[16px] pt-[16px]">
          <div className="flex flex-wrap items-center justify-between gap-[12px]">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              Revenue &amp; Customers Overview
            </h2>
            {/*
              "Processing", as a state rather than a button.

              The real dashboard recomputes on a schedule and says so while
              it is behind. Kept because it is the one thing on the page
              that admits the numbers are not live — a dashboard that never
              says this is a dashboard people trust at the wrong moments.
            */}
            <span className="flex h-[28px] shrink-0 items-center gap-[7px] rounded-full bg-brand-soft px-[12px] text-[12.5px] leading-none font-medium text-brand">
              <span
                aria-hidden="true"
                className="size-[6px] shrink-0 rounded-full bg-brand"
              />
              Processing
            </span>
          </div>

          {/*
            The methodology note.

            It is not decoration: it explains that these figures count
            subscriptions in HighLevel and not what the payment processors
            saw, which is the single most common way an agency's own
            arithmetic disagrees with this page. A dashboard that changed
            how it counts and did not say so would be a dashboard nobody
            could reconcile.
          */}
          <aside className="rounded-[10px] bg-brand-soft-2 px-[16px] py-[12px] shadow-[inset_0_0_0_1px_var(--brand-soft)]">
            <p className="flex gap-[10px] text-[13px] leading-[19px] text-brand">
              <Info size={15} aria-hidden="true" className="mt-[2px] shrink-0" />
              <span>
                We&rsquo;ve updated how MRR and Revenue are calculated in the
                Agency Dashboard to improve accuracy and consistency across
                reports.
                <br />
                <span className="text-pg-text">
                  These metrics now reflect subscriptions that currently exist
                  in HighLevel and do not include data pulled directly from
                  payment processors. Learn more about how MRR is calculated{" "}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="font-medium text-brand hover:underline"
                  >
                    here
                  </a>
                  .
                </span>
              </span>
            </p>
          </aside>

          {/*
            Four across, and they wrap in pairs rather than one at a time.

            `minmax(220px, 1fr)` on a four-column grid gives 4 / 2 / 1 as the
            canvas narrows, which keeps the set reading as a row of
            comparable figures. Four columns collapsing one at a time would
            leave a 3 + 1 that looks like one number has been singled out.
          */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[16px]">
            {SUMMARY_TILES.map((tile) => (
              <MetricCard key={tile.id} tile={tile} />
            ))}
          </div>

          {/*
            Two charts, and the trend gets the wider half on purpose: it
            carries seven months on two axes, where the donut carries three
            numbers. `minmax(340px, …)` is the width below which the month
            labels start colliding, so the pair stacks rather than squeezing.
          */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-[16px]">
            <ChartCard title="Growth Rate" hint="New customers, MRR and total revenue, month by month. Customers read on the left axis and revenue on the right.">
              <GrowthChart />
            </ChartCard>
            <ChartCard
              title="Revenue Distribution Last Month"
              hint="How last month's revenue divides across SaaS subscriptions, reselling margin and rebilled usage."
            >
              <RevenueDonut />
            </ChartCard>
          </div>
        </div>
      )}

      {showTitle && showDesc ? null : null}
    </div>
  );
}

const TILE_ICON = {
  revenue: DollarSign,
  recurring: RefreshCw,
  newCustomers: UserPlus,
  customers: Users,
} as const;

/** One of the four figures. */
function MetricCard({ tile }: { tile: MetricTile }) {
  const Icon = TILE_ICON[tile.icon];
  return (
    <article className="flex flex-col gap-[14px] rounded-[10px] bg-pg-surface p-[20px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <span className="flex size-[34px] items-center justify-center rounded-full bg-pg">
        <Icon size={16} aria-hidden="true" className="text-pg-muted" />
      </span>
      <span className="flex flex-col gap-[6px]">
        <span className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
          <span className="min-w-0 truncate">{tile.label}</span>
          <Hint text={tile.hint} />
        </span>
        <span className="text-[26px] leading-[32px] font-semibold tracking-[-0.4px] text-pg-heading tabular-nums">
          {tile.value}
        </span>
      </span>
    </article>
  );
}

/** A chart in its own card, with the heading band the page's cards share. */
function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <h3 className="flex items-center gap-[6px] px-[20px] py-[16px] text-[15px] leading-[21px] font-semibold text-pg-heading shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        {title}
        <Hint text={hint} />
      </h3>
      <div className="min-w-0 flex-1 p-[20px]">{children}</div>
    </section>
  );
}

/** The info glyph the dashboard puts beside every figure. */
function Hint({ text }: { text: string }) {
  return (
    <RailTooltip label={text} placement="above" wrap={260}>
      <span
        tabIndex={0}
        role="note"
        aria-label={text}
        className="flex size-[16px] shrink-0 cursor-help items-center justify-center rounded-full text-pg-faint hover:text-pg-muted"
      >
        <Info size={14} aria-hidden="true" />
      </span>
    </RailTooltip>
  );
}

/* ─── Growth Rate ───────────────────────────────────────────────────────── */

const W = 560;
const H = 260;
const PAD = { top: 16, right: 46, bottom: 28, left: 46 };

/**
 * Three series on two axes.
 *
 * Drawn in a fixed 560×260 viewBox and scaled by `preserveAspectRatio`,
 * which is what lets the card be fluid without the maths being: every
 * coordinate below is in chart units, and the browser does the fitting.
 * The alternative — measuring the card and recomputing on resize — is a
 * ResizeObserver and a re-render for a picture that does not change.
 */
function GrowthChart() {
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (GROWTH.length - 1)) * plotW;
  const left = (v: number) => PAD.top + plotH - (v / GROWTH_LEFT_MAX) * plotH;
  const right = (v: number) => PAD.top + plotH - (v / GROWTH_RIGHT_MAX) * plotH;

  const line = (get: (i: number) => number) =>
    GROWTH.map((_, i) => `${i === 0 ? "M" : "L"}${x(i)},${get(i)}`).join(" ");

  const series = [
    {
      id: "newCustomers",
      label: "New Customers",
      colour: "var(--hr-fuchsia-600)",
      shape: "dot" as const,
      at: (i: number) => left(GROWTH[i]!.newCustomers),
    },
    {
      id: "mrr",
      label: "MRR",
      colour: "var(--hr-indigo-500)",
      shape: "diamond" as const,
      at: (i: number) => left(GROWTH[i]!.mrr),
    },
    {
      id: "revenue",
      label: "Total Revenue",
      colour: "var(--hr-blue-light-500)",
      shape: "square" as const,
      at: (i: number) => right(GROWTH[i]!.revenue),
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-[10px]">
      {/*
        The legend leads, because with three lines on two axes the colours
        are the only way to read the chart and a legend underneath is a
        key you find after you have already given up.

        Shapes as well as colour: two of these three are blues a step
        apart, which is a distinction that survives on a screen and not in
        a printout or for a reader who cannot separate them.
      */}
      <div className="flex flex-wrap items-center justify-center gap-x-[18px] gap-y-[6px]">
        {series.map((s) => (
          <span
            key={s.id}
            className="flex items-center gap-[6px] text-[12px] leading-[16px] text-pg-muted"
          >
            <svg width="22" height="10" aria-hidden="true">
              <line
                x1="0"
                y1="5"
                x2="22"
                y2="5"
                stroke={s.colour}
                strokeWidth="1.6"
              />
              <Marker shape={s.shape} cx={11} cy={5} colour={s.colour} />
            </svg>
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="New customers, MRR and total revenue by month"
        className="h-[240px] w-full"
      >
        {/* Four gridlines and their left labels, at the quarters. */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = PAD.top + plotH - f * plotH;
          return (
            <g key={f}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="var(--pg-border)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[var(--pg-faint)] text-[10px]"
              >
                {f === 0 ? "0" : `${Math.round((GROWTH_LEFT_MAX * f) / 1000)}k`}
              </text>
              <text
                x={W - PAD.right + 8}
                y={y + 4}
                className="fill-[var(--pg-faint)] text-[10px]"
              >
                {f === 0 ? "0" : `${Math.round((GROWTH_RIGHT_MAX * f) / 1000)}k`}
              </text>
            </g>
          );
        })}

        {/* The right axis names itself; the left is the chart's default. */}
        <text
          x={W - 8}
          y={PAD.top + plotH / 2}
          textAnchor="middle"
          transform={`rotate(90 ${W - 8} ${PAD.top + plotH / 2})`}
          className="fill-[var(--pg-faint)] text-[10px]"
        >
          Total Customers
        </text>

        {GROWTH.map((p, i) => (
          <text
            key={p.month}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-[var(--pg-muted)] text-[11px]"
          >
            {p.month}
          </text>
        ))}

        {series.map((s) => (
          <g key={s.id}>
            <path
              d={line(s.at)}
              fill="none"
              stroke={s.colour}
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {GROWTH.map((p, i) => (
              <Marker
                key={p.month}
                shape={s.shape}
                cx={x(i)}
                cy={s.at(i)}
                colour={s.colour}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * A series' point marker.
 *
 * One component for the legend and the chart, so a swatch cannot end up
 * drawing a different shape from the line it stands for — which is the
 * usual way a legend stops being a legend.
 */
function Marker({
  shape,
  cx,
  cy,
  colour,
}: {
  shape: "dot" | "diamond" | "square";
  cx: number;
  cy: number;
  colour: string;
}) {
  if (shape === "square") {
    return (
      <rect x={cx - 3.5} y={cy - 3.5} width="7" height="7" fill={colour} rx="1" />
    );
  }
  if (shape === "diamond") {
    return (
      <rect
        x={cx - 3.2}
        y={cy - 3.2}
        width="6.4"
        height="6.4"
        fill={colour}
        transform={`rotate(45 ${cx} ${cy})`}
      />
    );
  }
  return <circle cx={cx} cy={cy} r="3.6" fill={colour} />;
}

/* ─── Revenue Distribution ──────────────────────────────────────────────── */

/**
 * The three revenue lines as a donut, with the month's total in the hole.
 *
 * `stroke-dasharray` on one circle per slice rather than arc paths: the
 * geometry is a single circumference and three lengths, so the arithmetic
 * is three multiplications instead of three sets of polar coordinates and
 * a large-arc flag. It also means the gaps between slices are a stroke
 * property rather than something to compute.
 */
function RevenueDonut() {
  const R = 54;
  const C = 2 * Math.PI * R;
  /*
   * Each slice's start, worked out before anything is drawn.
   *
   * A running `let` incremented inside the map was the obvious way and the
   * compiler rejects it — rightly: a render that mutates as it walks is a
   * render whose output depends on how many times React chose to call it.
   * The offsets are a function of the data, so they are derived from it.
   */
  const starts = REVENUE_SPLIT.reduce<number[]>((acc, slice, i) => {
    const prev = i === 0 ? 0 : acc[i - 1]! + (REVENUE_SPLIT[i - 1]!.pct / 100) * C;
    acc.push(prev);
    return acc;
  }, []);

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-[28px] gap-y-[16px]">
      <div className="relative shrink-0">
        <svg
          viewBox="0 0 140 140"
          role="img"
          aria-label="Revenue split by line of business"
          className="size-[180px]"
        >
          {/* -90deg, so the first slice starts at twelve o'clock. */}
          <g transform="rotate(-90 70 70)">
            {REVENUE_SPLIT.map((slice, i) => {
              const len = (slice.pct / 100) * C;
              return (
                <circle
                  key={slice.id}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={slice.colour}
                  strokeWidth="16"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-starts[i]!}
                />
              );
            })}
          </g>
          <text
            x="70"
            y="75"
            textAnchor="middle"
            className="fill-[var(--pg-heading)] text-[15px] font-semibold"
          >
            {REVENUE_TOTAL}
          </text>
        </svg>
      </div>

      <ul className="flex shrink-0 flex-col gap-[12px]">
        {REVENUE_SPLIT.map((slice) => (
          <li
            key={slice.id}
            className="flex items-center gap-[9px] text-[13px] leading-[18px] text-pg-text"
          >
            <span
              aria-hidden="true"
              className="size-[9px] shrink-0 rounded-full"
              style={{ backgroundColor: slice.colour }}
            />
            {slice.label}{" "}
            <span className="font-semibold text-pg-heading tabular-nums">
              ({slice.pct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
