"use client";

import * as React from "react";

/**
 * The SLA trend: one area line, measured rather than scaled.
 *
 * The chart-kit LineChart stretches a fixed viewBox, which is right for a
 * dashboard tile but squashes the axis type on a full-width card. This one
 * measures its box with a ResizeObserver and draws in real pixels, so the
 * 12px labels stay 12px at any width.
 */
export interface TrendDatum {
  label: string;
  /** Tooltip heading, e.g. "Jul 13–19". */
  title: string;
  value: number | null;
  /** Tooltip value, already formatted. */
  display: string;
  /** Tooltip second line, e.g. "84 of 402 messages". */
  detail?: string;
}

const HEIGHT = 280;
const PAD = { t: 12, r: 16, b: 32, l: 64 };

export function SlaTrendChart({
  data,
  yMax,
  yStep,
  yFormat,
  yTitle,
}: {
  data: TrendDatum[];
  yMax: number;
  yStep: number;
  yFormat: (v: number) => string;
  yTitle: string;
}) {
  const [width, setWidth] = React.useState(0);
  const [hover, setHover] = React.useState<number | null>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const gradientId = "sla-trend-" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "");

  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(Math.round(entries[0]!.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = HEIGHT - PAD.t - PAD.b;
  const n = data.length;
  const x = (i: number) => PAD.l + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const y = (v: number) => PAD.t + plotH - (plotH * Math.min(v, yMax)) / yMax;
  const ticks = Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, k) => k * yStep);

  // Thin the x labels so they never collide: about one per 90px.
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 90))));

  const pts = data
    .map((d, i) => (d.value === null ? null : ([x(i), y(d.value)] as const)))
    .filter((p): p is readonly [number, number] => p !== null);
  const line = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px},${py}`).join(" ");
  const area =
    pts.length > 1
      ? `${line} L${pts[pts.length - 1]![0]},${PAD.t + plotH} L${pts[0]![0]},${PAD.t + plotH} Z`
      : "";

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div ref={boxRef} className="relative w-full" style={{ height: HEIGHT }}>
      {width > 0 ? (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${yTitle} by ${n > 0 ? "period" : "week"}`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            if (n === 0) return;
            const rel = e.clientX - e.currentTarget.getBoundingClientRect().left;
            const i = n <= 1 ? 0 : Math.round(((rel - PAD.l) / plotW) * (n - 1));
            setHover(Math.min(n - 1, Math.max(0, i)));
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.l}
                x2={width - PAD.r}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--pg-chart-grid)"
                strokeWidth={1}
              />
              <text
                x={PAD.l - 12}
                y={y(t) + 4}
                textAnchor="end"
                className="fill-[var(--pg-muted)] text-[12px]"
              >
                {yFormat(t)}
              </text>
            </g>
          ))}

          <text
            transform={`translate(14 ${PAD.t + plotH / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-[var(--pg-muted)] text-[12px]"
          >
            {yTitle}
          </text>

          {data.map((d, i) =>
            i % every === 0 ? (
              <text
                key={`${d.label}-${i}`}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor={i === 0 ? "start" : "middle"}
                className="fill-[var(--pg-muted)] text-[12px]"
              >
                {d.label}
              </text>
            ) : null,
          )}

          {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
          {line ? (
            <path
              d={line}
              fill="none"
              stroke="var(--brand)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {hover !== null ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.t}
              y2={PAD.t + plotH}
              stroke="var(--pg-border-strong)"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ) : null}

          {data.map((d, i) =>
            d.value === null ? null : (
              <circle
                key={i}
                cx={x(i)}
                cy={y(d.value)}
                r={hover === i ? 5 : 3}
                fill="var(--brand)"
                stroke="var(--pg-surface)"
                strokeWidth={hover === i ? 2 : 1}
              />
            ),
          )}
        </svg>
      ) : null}

      {hovered && hover !== null ? (
        <div
          role="status"
          className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col gap-[2px] rounded-[8px] bg-pg-overlay px-[10px] py-[8px] whitespace-nowrap shadow-[0_6px_18px_-6px_rgba(15,23,42,0.4)]"
          style={{
            left: Math.min(Math.max(x(hover), 90), width - 90),
            top: (hovered.value === null ? PAD.t + plotH : y(hovered.value)) - 12,
          }}
        >
          <span className="text-[12px] leading-[16px] text-pg-overlay-fg">{hovered.title}</span>
          <span className="text-[13px] leading-[18px] font-semibold text-pg-surface">{hovered.display}</span>
          {hovered.detail ? (
            <span className="text-[12px] leading-[16px] text-pg-overlay-fg">{hovered.detail}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
