import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The AI mark, rebuilt from the ClickUp reference (Aug 13): six soft petals —
 * lavender, blue, violet, magenta, ember, rose — overlapping around a white
 * four-point sparkle. The old orb read as "generic AI ball"; the flower is a
 * mark you can recognise at 24px.
 *
 * Colour is deliberately NOT accent-derived: the petals ARE the identity,
 * the same six hues in every workspace, like the reference. Animation lives
 * in ai.css (`.ai-flower-*`), scoped to `.ai-entry` hover: the petals spin
 * slowly, the sparkle twinkles, the whole mark pops a few percent.
 */

/** One petal per hue, 60° apart. Order controls the overlap stacking. */
const PETALS: { angle: number; from: string; to: string }[] = [
  { angle: 330, from: "#b9a0f5", to: "#9a76ef" }, // lavender — top-left
  { angle: 270, from: "#cf8f92", to: "#b97a86" }, // rose — left
  { angle: 210, from: "#f0691f", to: "#e34d17" }, // ember — bottom-left
  { angle: 90, from: "#9a63f8", to: "#7c3aed" }, // violet — right
  { angle: 150, from: "#f43fc0", to: "#e91e9c" }, // magenta — bottom-right
  { angle: 30, from: "#5aa2fd", to: "#3178f6" }, // blue — top-right
];

export function AiFlower({
  size,
  className,
}: {
  /** Rendered box in px. */
  size: number;
  className?: string;
}) {
  const uid = React.useId();

  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: size, height: size, flexShrink: 0 }}
      className={cn("ai-flower", className)}
    >
      <defs>
        {PETALS.map((petal, i) => (
          <linearGradient
            key={petal.angle}
            id={`${uid}-p${i}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={petal.from} />
            <stop offset="100%" stopColor={petal.to} />
          </linearGradient>
        ))}
        {/* Soft edges — the reference petals are bloomed, not vector-crisp. */}
        <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.55" />
        </filter>
        <filter id={`${uid}-halo`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      <g className="ai-flower-petals" filter={`url(#${uid}-soft)`}>
        {PETALS.map((petal, i) => (
          <ellipse
            key={petal.angle}
            cx="16"
            cy="9.6"
            rx="5.6"
            ry="6.7"
            fill={`url(#${uid}-p${i})`}
            opacity="0.94"
            transform={`rotate(${petal.angle} 16 16)`}
          />
        ))}
      </g>

      {/* The sparkle: a glow pass underneath, then the crisp white star. */}
      <g className="ai-flower-spark">
        <path
          d={SPARK_PATH}
          fill="#ffffff"
          opacity="0.85"
          filter={`url(#${uid}-halo)`}
        />
        <path d={SPARK_PATH} fill="#ffffff" />
      </g>
    </svg>
  );
}

/** Four-point star, concave sides, centred on 16/16. */
const SPARK_PATH =
  "M16 9.2 C17.05 13.1 18.9 14.95 22.8 16 C18.9 17.05 17.05 18.9 16 22.8 C14.95 18.9 13.1 17.05 9.2 16 C13.1 14.95 14.95 13.1 16 9.2 Z";
