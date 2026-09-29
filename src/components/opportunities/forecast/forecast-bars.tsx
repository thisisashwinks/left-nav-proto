"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { fmtUSD2 } from "./forecast-data";

/**
 * The forecast's layered horizontal bars.
 *
 * One row per category, three marks on ONE track rather than three bars side
 * by side: max potential is the ceiling, expected is how much of it the
 * probabilities believe in, won is what already landed. Layering says that
 * they are nested quantities of the same money, which grouped bars would not.
 * Drawn in HTML rather than SVG so the label column can truncate and the
 * track can stretch with the card.
 */

export const FORECAST_COLOURS = {
  won: "var(--pg-status-subscribed-dot)",
  expected: "var(--brand)",
  // --pg-disabled is the one grey with a chosen dark step that still reads
  // as a mark on the dark surface; --pg-border-strong disappears there.
  max: "var(--pg-disabled)",
} as const;

const TICK = 10000;

export function ForecastBars({
  rows,
}: {
  rows: { label: string; max: number; expected: number; won: number }[];
}) {
  const [hover, setHover] = React.useState<{ i: number; x: number; y: number; w: number } | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const peak = Math.max(0, ...rows.map((r) => Math.max(r.max, r.expected, r.won)));
  const top = Math.max(TICK, Math.ceil(peak / TICK) * TICK);
  const ticks = Array.from({ length: top / TICK + 1 }, (_, i) => i * TICK);
  const pct = (v: number) => `${Math.min(100, (Math.max(0, v) / top) * 100)}%`;

  const hovered = hover ? rows[hover.i] : undefined;
  // Flip to the pointer's left once the card would run off the right edge.
  const flip = hover ? hover.x > hover.w - 260 : false;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseLeave={() => setHover(null)}
    >
      <div role="list" aria-label="Forecast by category" className="relative">
        {/* Gridlines, drawn once across the whole plot height, behind the rows. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-[12px] left-[152px]">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute top-0 bottom-0 w-px bg-[var(--pg-chart-grid)] opacity-70"
              style={{ left: pct(t) }}
            />
          ))}
        </div>

        {rows.map((r, i) => (
          <div
            key={r.label}
            role="listitem"
            aria-label={`${r.label}: max potential ${fmtUSD2(r.max)}, expected ${fmtUSD2(r.expected)}, won ${fmtUSD2(r.won)}`}
            onMouseMove={(e) => {
              const box = wrapRef.current?.getBoundingClientRect();
              if (!box) return;
              setHover({ i, x: e.clientX - box.left, y: e.clientY - box.top, w: box.width });
            }}
            className={cn(
              "relative flex h-[40px] items-center rounded-[6px] pr-[12px] transition-colors duration-100",
              hover?.i === i && "bg-[color-mix(in_oklab,var(--pg-text)_5%,transparent)]",
            )}
          >
            <span className="w-[152px] shrink-0 truncate pr-[12px] pl-[8px] text-[13px] leading-[18px] text-pg-text">
              {r.label}
            </span>
            <span className="relative h-[8px] min-w-0 flex-1">
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: pct(r.max), background: FORECAST_COLOURS.max }}
              />
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: pct(r.expected), background: FORECAST_COLOURS.expected }}
              />
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: pct(r.won), background: FORECAST_COLOURS.won }}
              />
            </span>
          </div>
        ))}
      </div>

      {/* X axis. */}
      <div className="flex pt-[6px] pr-[12px]" aria-hidden="true">
        <div className="w-[152px] shrink-0" />
        <div className="relative h-[16px] min-w-0 flex-1">
          {ticks.map((t, i) => (
            <span
              key={t}
              className={cn(
                "absolute top-0 text-[11px] leading-[16px] whitespace-nowrap text-pg-faint tabular-nums",
                i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
              )}
              style={{ left: pct(t) }}
            >
              {fmtUSD2(t)}
            </span>
          ))}
        </div>
      </div>

      {hover && hovered ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 w-[248px] rounded-[8px] bg-pg-surface p-[12px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          style={{
            top: hover.y + 14,
            left: flip ? hover.x - 14 : hover.x + 14,
            transform: flip ? "translateX(-100%)" : undefined,
          }}
        >
          <p className="pb-[8px] text-[13px] leading-[18px] font-semibold text-pg-heading">
            {hovered.label}
          </p>
          <div className="flex flex-col gap-[8px]">
            <TipRow colour={FORECAST_COLOURS.won} label="Won revenue" value={hovered.won} />
            <TipRow colour={FORECAST_COLOURS.expected} label="Expected revenue" value={hovered.expected} />
            <TipRow
              colour={FORECAST_COLOURS.max}
              label="Max potential revenue"
              value={hovered.max}
              hint="Total value if all open opportunities close"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TipRow({
  colour,
  label,
  value,
  hint,
}: {
  colour: string;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-[8px]">
      <span
        aria-hidden="true"
        className="mt-[5px] size-[8px] shrink-0 rounded-full"
        style={{ background: colour }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline justify-between gap-[8px]">
          <span className="text-[12px] leading-[18px] text-pg-muted">{label}</span>
          <span className="text-[12px] leading-[18px] font-semibold text-pg-heading tabular-nums">
            {fmtUSD2(value)}
          </span>
        </span>
        {hint ? (
          <span className="text-[11px] leading-[15px] text-pg-faint">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}
