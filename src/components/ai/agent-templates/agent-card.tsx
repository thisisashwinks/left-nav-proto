"use client";

import * as React from "react";
import { Headphones, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatListens, type AgentTemplate, type PortraitTone } from "./data";

/**
 * One marketplace listing as a card: lilac band, then the facts a buyer
 * compares — title and listens on one line, maker, one line of pitch, rating,
 * price. Every card carries the same facts in the same place so the grid scans.
 */
export function AgentCard({
  agent,
  onOpen,
}: {
  agent: AgentTemplate;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="motion-tap group flex min-w-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface p-[8px] text-left shadow-[inset_0_0_0_1px_var(--pg-card-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_8px_16px_-6px_rgba(16,24,40,0.12)] active:scale-[0.995]"
    >
      <AgentBand agent={agent} className="rounded-[8px]" />

      <div className="flex min-w-0 flex-col gap-[4px] px-[8px] pt-[12px] pb-[8px]">
        <div className="flex min-w-0 items-center gap-[10px]">
          <h3 className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
            {agent.title}
          </h3>
          <span className="flex shrink-0 items-center gap-[4px] text-[13px] leading-[18px] text-pg-muted tabular-nums">
            <Headphones size={14} aria-hidden="true" />
            <span className="sr-only">Listens:</span>
            {formatListens(agent.listens)}
          </span>
        </div>
        <p className="truncate text-[13px] leading-[18px] text-pg-muted">
          By {agent.author}
        </p>
        <p className="truncate text-[13px] leading-[18px] text-pg-text">
          {agent.description}
        </p>
        <div className="flex items-center justify-between gap-[8px] pt-[6px]">
          <Rating rating={agent.rating} reviews={agent.reviews} />
          <PricePill paid={agent.paid} />
        </div>
      </div>
    </button>
  );
}

/**
 * The listing's artwork, drawn rather than photographed.
 *
 * The live marketplace uses makers' headshots on a lilac field; this prototype
 * ships no images, so the portrait is a token-tinted silhouette. The band is
 * mixed with --pg-surface (not painted with fixed lilac hexes) so it dims with
 * the surface in dark mode instead of glowing, and the name's violet is mixed
 * toward --pg-heading so it stays legible on whichever band that produces.
 */
export function AgentBand({
  agent,
  className,
}: {
  agent: AgentTemplate;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[290/200] w-full shrink-0 items-center overflow-hidden",
        className,
      )}
      style={{
        backgroundColor:
          "color-mix(in oklab, var(--hr-violet-200) 42%, var(--pg-surface))",
        backgroundImage:
          "radial-gradient(color-mix(in oklab, var(--hr-violet-500) 22%, transparent) 1px, transparent 1.4px)",
        backgroundSize: "12px 12px",
      }}
    >
      <span
        className="relative z-[1] line-clamp-3 w-[46%] pl-[7%] text-[18px] leading-[24px] font-bold tracking-[-0.01em]"
        style={{
          color: "color-mix(in oklab, var(--hr-violet-700) 78%, var(--pg-heading))",
        }}
      >
        {agent.persona}
      </span>

      <div className="absolute top-1/2 right-[7%] aspect-square h-[62%] -translate-y-1/2">
        <Rings />
        <Portrait tone={agent.tone} />
      </div>
    </div>
  );
}

/** Concentric rounded octagons behind the portrait — the live band's motif. */
function Rings() {
  const octagon = (r: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = (Math.PI / 8) * (2 * i + 1);
      return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
    }).join(" ");
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute top-1/2 left-1/2 size-[250%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
    >
      {[22, 30, 38, 46].map((r, i) => (
        <polygon
          key={r}
          points={octagon(r)}
          strokeLinejoin="round"
          strokeWidth={6 - i}
          style={{
            fill: "none",
            stroke: `color-mix(in oklab, var(--hr-violet-300) ${44 - i * 9}%, transparent)`,
          }}
        />
      ))}
    </svg>
  );
}

/** A head-and-shoulders silhouette in a disc, tinted from one HighRise ramp. */
function Portrait({ tone }: { tone: PortraitTone }) {
  const clip = React.useId();
  const ramp = (step: number) => `var(--hr-${tone}-${step})`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="relative size-full drop-shadow-[0_6px_10px_rgba(16,24,40,0.12)] motion-move group-hover:scale-[1.03]"
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="50"
        style={{ fill: "color-mix(in oklab, var(--pg-surface) 85%, transparent)" }}
      />
      <g clipPath={`url(#${clip})`}>
        <rect
          width="100"
          height="100"
          style={{ fill: `color-mix(in oklab, ${ramp(100)} 80%, var(--pg-surface))` }}
        />
        <circle cx="50" cy="40" r="17" style={{ fill: ramp(400) }} />
        <path
          d="M14 104 C 16 72, 34 62, 50 62 C 66 62, 84 72, 86 104 Z"
          style={{ fill: ramp(500) }}
        />
      </g>
    </svg>
  );
}

/** Amber stars with a true half star — the live card shows 4.4 as 4½. */
export function Rating({
  rating,
  reviews,
  size = 14,
}: {
  rating: number;
  reviews: number;
  size?: number;
}) {
  // Rounded to the nearest half, which is what the glyphs can say; the exact
  // number beside them carries the rest.
  const halves = Math.round(rating * 2);
  return (
    <span className="flex items-center gap-[6px]">
      <span
        role="img"
        aria-label={`Rated ${rating} out of 5`}
        className="flex items-center gap-[1px]"
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = halves >= (i + 1) * 2 ? 1 : halves === i * 2 + 1 ? 0.5 : 0;
          return (
            <span key={i} className="relative" style={{ width: size, height: size }}>
              <Star size={size} aria-hidden="true" className="absolute inset-0 text-pg-border-strong" />
              {fill > 0 ? (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: size * fill }}
                >
                  <Star
                    size={size}
                    aria-hidden="true"
                    className="fill-[var(--hr-warning-400)] text-[var(--hr-warning-400)]"
                  />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      <span className="text-[13px] leading-[18px] text-pg-text tabular-nums">
        {rating}({reviews})
      </span>
    </span>
  );
}

export function PricePill({ paid }: { paid: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-[8px] py-[2px] text-[12px] leading-[16px] font-medium",
        paid
          ? "bg-brand-soft text-brand"
          : "text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      {paid ? "Paid" : "Free"}
    </span>
  );
}
