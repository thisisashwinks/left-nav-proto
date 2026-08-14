import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * HighLevel's own AI mark (Aug 13, v2): a four-blade pinwheel mid-turn.
 *
 * The first cut traced the ClickUp flower too closely — six round petals,
 * centred four-point star. This one keeps what made that good (soft colour,
 * layered motion) and changes the identity: blades LEAN instead of petals
 * radiating, so the mark reads as something turning — automation — even
 * when still. The palette starts from the brand's own blue and adds teal
 * and coral, deliberately outside the reference's lavender-to-orange run.
 * The centre is a lit core, not a star; a single micro-spark sits off-axis
 * at two o'clock, like a glint thrown off the spin.
 *
 * Motion lives in ai.css (`.ai-mark-*`), scoped to `.ai-entry` hover: the
 * swirl turns, the core breathes against it, the glint flares on its own
 * beat. Three layers, three tempos.
 */

/** Four blades, 90° apart, each pre-leaned 30° about its own centre. */
const BLADES: { angle: number; from: string; to: string }[] = [
  { angle: 0, from: "#155eef", to: "#6aa8ff" }, // brand blue — top
  { angle: 90, from: "#7c3aed", to: "#c0a1fb" }, // violet — right
  { angle: 180, from: "#ff5d73", to: "#ffab70" }, // coral — bottom
  { angle: 270, from: "#0d9488", to: "#67e8f9" }, // teal — left
];

export function AiMark({
  size,
  state = "idle",
  className,
}: {
  /** Rendered box in px. */
  size: number;
  /** Session state — "thinking"/"listening" keep the swirl turning unhovered. */
  state?: string;
  className?: string;
}) {
  const uid = React.useId();

  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-ai-state={state}
      style={{ width: size, height: size, flexShrink: 0 }}
      className={cn("ai-mark", className)}
    >
      <defs>
        {BLADES.map((blade, i) => (
          <linearGradient
            key={blade.angle}
            id={`${uid}-b${i}`}
            x1="0.5"
            y1="1"
            x2="0.5"
            y2="0"
          >
            <stop offset="0%" stopColor={blade.from} />
            <stop offset="100%" stopColor={blade.to} />
          </linearGradient>
        ))}
        <radialGradient id={`${uid}-core`}>
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>

      <g className="ai-mark-swirl" filter={`url(#${uid}-soft)`}>
        {BLADES.map((blade, i) => (
          <ellipse
            key={blade.angle}
            cx="16"
            cy="9"
            rx="3.6"
            ry="7"
            fill={`url(#${uid}-b${i})`}
            opacity="0.95"
            // Outer rotate places the blade around the wheel; inner rotate
            // leans it about its own middle — the lean is the pinwheel.
            transform={`rotate(${blade.angle} 16 16) rotate(30 16 9)`}
          />
        ))}
      </g>

      {/* The lit core, breathing against the swirl's turn. */}
      <g className="ai-mark-core">
        <circle cx="16" cy="16" r="6" fill={`url(#${uid}-core)`} opacity="0.55" />
        <circle cx="16" cy="16" r="3.1" fill="#ffffff" />
      </g>

      {/* One glint at two o'clock — thrown off the spin, not centred on it. */}
      <path
        className="ai-mark-spark"
        d="M24.6 4.6 C25.05 6.3 25.85 7.1 27.55 7.55 C25.85 8 25.05 8.8 24.6 10.5 C24.15 8.8 23.35 8 21.65 7.55 C23.35 7.1 24.15 6.3 24.6 4.6 Z"
        fill="#ffffff"
        opacity="0.95"
      />
    </svg>
  );
}
