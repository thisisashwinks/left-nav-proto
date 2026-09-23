"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The chart primitives the dashboard is built from.
 *
 * Hand-rolled SVG rather than a charting dependency: the point of these is
 * the page around them — scrolling, sticky chrome, widget density — and a
 * library would bring its own type scale, its own colours and its own dark
 * mode to argue with the tokens. Everything here paints from --pg-chart-*,
 * which is a validated five-step categorical set: fixed order, never cycled.
 */

export const SERIES = [
  "var(--pg-chart-1)",
  "var(--pg-chart-2)",
  "var(--pg-chart-3)",
  "var(--pg-chart-4)",
  "var(--pg-chart-5)",
] as const;

export function Legend({
  items,
}: {
  items: { label: string; colour: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[4px]">
      {items.map((s) => (
        <span key={s.label} className="flex items-center gap-[6px]">
          <span
            aria-hidden="true"
            className="size-[8px] shrink-0 rounded-full"
            style={{ background: s.colour }}
          />
          {/* Ink, not the series colour: the swatch carries identity. */}
          <span className="text-[12px] leading-none text-pg-muted">
            {s.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function Tooltip({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[8px] bg-pg-overlay px-[9px] py-[6px] text-[11.5px] leading-[16px] whitespace-nowrap text-pg-surface shadow-[0_6px_18px_-6px_rgba(15,23,42,0.4)]"
      style={{ left: x, top: y - 8 }}
    >
      {children}
    </div>
  );
}

export interface Series {
  label: string;
  values: number[];
}

/**
 * Lines over time, with a crosshair.
 *
 * One y-axis, always — two measures at different scales get two charts. The
 * crosshair reads the whole column at once, which is the question a
 * time-series actually gets asked: what happened on that day.
 */
export function LineChart({
  series,
  labels,
  height = 200,
  format = (v: number) => String(v),
}: {
  series: Series[];
  labels: string[];
  height?: number;
  format?: (v: number) => string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const W = 640;
  const H = height;
  const pad = { t: 10, r: 12, b: 22, l: 34 };
  const max = Math.max(...series.flatMap((s) => s.values)) * 1.15;
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (plotW * i) / (labels.length - 1);
  const y = (v: number) => pad.t + plotH - (plotH * v) / max;
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`${series.map((s) => s.label).join(" and ")} over time`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const rel = ((e.clientX - box.left) / box.width) * W;
          const i = Math.round(((rel - pad.l) / plotW) * (labels.length - 1));
          setHover(Math.min(labels.length - 1, Math.max(0, i)));
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--pg-chart-grid)"
              strokeWidth={1}
            />
            <text
              x={pad.l - 8}
              y={y(t) + 4}
              textAnchor="end"
              className="fill-[var(--pg-faint)] text-[10px]"
            >
              {format(t)}
            </text>
          </g>
        ))}

        {labels.map((l, i) =>
          i % 3 === 0 ? (
            <text
              key={l}
              x={x(i)}
              y={H - 6}
              textAnchor="middle"
              className="fill-[var(--pg-faint)] text-[10px]"
            >
              {l}
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

        {series.map((s, si) => (
          <g key={s.label}>
            <path
              d={s.values
                .map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`)
                .join(" ")}
              fill="none"
              stroke={SERIES[si % SERIES.length]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {hover !== null ? (
              <circle
                cx={x(hover)}
                cy={y(s.values[hover]!)}
                r={4.5}
                fill={SERIES[si % SERIES.length]}
                // The 2px surface ring keeps overlapping marks separable.
                stroke="var(--pg-surface)"
                strokeWidth={2}
              />
            ) : null}
          </g>
        ))}
      </svg>

      {hover !== null ? (
        <Tooltip x={(x(hover) / W) * 100 + 0} y={height - 26}>
          <span className="font-semibold">{labels[hover]}</span>
          {series.map((s, si) => (
            <span key={s.label} className="ml-[8px]">
              <span
                aria-hidden="true"
                className="mr-[4px] inline-block size-[7px] rounded-full align-middle"
                style={{ background: SERIES[si % SERIES.length] }}
              />
              {format(s.values[hover]!)}
            </span>
          ))}
        </Tooltip>
      ) : null}
    </div>
  );
}

/** Vertical bars: magnitude across a handful of named things. */
export function BarChart({
  data,
  height = 180,
  colourIndex = 0,
  format = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  height?: number;
  colourIndex?: number;
  format?: (v: number) => string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value)) * 1.2;

  return (
    <div className="relative flex items-end gap-[8px]" style={{ height }}>
      {data.map((d, i) => (
        <button
          key={d.label}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          className="flex min-w-0 flex-1 flex-col items-center justify-end gap-[6px]"
          style={{ height }}
        >
          <span className="text-[11px] leading-none font-semibold text-pg-text-strong tabular-nums">
            {format(d.value)}
          </span>
          <span
            // 4px rounded data-end, anchored to the baseline.
            className={cn(
              "w-full rounded-t-[4px] transition-[filter] duration-150",
              hover === i && "brightness-110",
            )}
            style={{
              height: `${(d.value / max) * (height - 34)}px`,
              background: SERIES[colourIndex % SERIES.length],
            }}
          />
          <span className="w-full truncate text-[11px] leading-none text-pg-muted">
            {d.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Horizontal bars: a ranked list where the labels are long. */
export function RankBars({
  data,
  format = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  format?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-[10px]">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-[10px]">
          <span className="w-[108px] shrink-0 truncate text-[12.5px] leading-none text-pg-text">
            {d.label}
          </span>
          <span className="h-[10px] min-w-0 flex-1 overflow-hidden rounded-[4px] bg-pg-bg">
            <span
              className="block h-full rounded-[4px]"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: SERIES[i % SERIES.length],
              }}
            />
          </span>
          <span className="w-[46px] shrink-0 text-right text-[12px] leading-none font-semibold text-pg-text-strong tabular-nums">
            {format(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Parts of one whole — four slices at most, and always direct-labelled. */
export function Donut({
  data,
  size = 148,
}: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  // Each slice's start is the sum of the ones before it — derived, not
  // accumulated in a variable during render.
  const offsets = data.map(
    (_, i) =>
      (data.slice(0, i).reduce((sum, d) => sum + d.value, 0) / total) * c,
  );

  return (
    <div className="flex items-center gap-[16px]">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Conversation status split"
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const lit = Math.max(len - 3, 0);
            return (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                // The gap between segments is surface showing through, not a
                // stroke of its own.
                stroke={SERIES[i % SERIES.length]}
                strokeWidth={16}
                strokeDasharray={`${lit} ${c - lit}`}
                strokeDashoffset={-offsets[i]!}
              />
            );
          })}
        </g>
        <text
          x={size / 2}
          y={size / 2 - 2}
          textAnchor="middle"
          className="fill-[var(--pg-heading)] text-[19px] font-semibold"
        >
          {total.toLocaleString()}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 15}
          textAnchor="middle"
          className="fill-[var(--pg-muted)] text-[11px]"
        >
          total
        </text>
      </svg>

      <div className="flex min-w-0 flex-col gap-[8px]">
        {data.map((d, i) => (
          <span key={d.label} className="flex items-center gap-[7px]">
            <span
              aria-hidden="true"
              className="size-[8px] shrink-0 rounded-full"
              style={{ background: SERIES[i % SERIES.length] }}
            />
            <span className="min-w-0 truncate text-[12.5px] leading-none text-pg-text">
              {d.label}
            </span>
            <span className="text-[12px] leading-none font-semibold text-pg-text-strong tabular-nums">
              {Math.round((d.value / total) * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** A trend line small enough to sit inside a stat tile. */
export function Sparkline({
  values,
  colourIndex = 0,
}: {
  values: number[];
  colourIndex?: number;
}) {
  const W = 120;
  const H = 32;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const d = values
    .map((v, i) => {
      const x = (W * i) / (values.length - 1);
      const y = H - 2 - ((v - min) / span) * (H - 6);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[32px] w-[120px]" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={SERIES[colourIndex % SERIES.length]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
