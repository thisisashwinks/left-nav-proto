import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The AI mark, v3 (Aug 13): a gradient donut with a star floating in it.
 *
 * The donut is a CSS conic ring — brand blue through violet, magenta, ember
 * and teal — masked to a torus, with a blurred copy underneath for bloom.
 * Doing it in CSS rather than SVG is the trick: the gradient's start angle
 * is `--ai-angle`, so on hover (or while the session thinks) the COLOURS
 * flow around the ring while the ring itself holds still — light moving
 * through a form, not an asset rotating. The star sits in the hole wearing
 * the same ramp, so mark and motion share one palette.
 *
 * Animation lives in ai.css (`.ai-donut*`, `.ai-mark-star`), scoped to
 * `.ai-entry` hover and to data-ai-state = thinking/listening.
 */

export function AiMark({
  size,
  state = "idle",
  className,
}: {
  /** Rendered box in px. */
  size: number;
  /** Session state — thinking/listening keep the ring flowing unhovered. */
  state?: string;
  className?: string;
}) {
  const uid = React.useId();

  return (
    <span
      aria-hidden="true"
      data-ai-state={state}
      style={{ width: size, height: size }}
      className={cn("ai-mark", className)}
    >
      {/* Bloom first, so the crisp ring paints over its own glow. */}
      <span className="ai-donut-bloom" />
      <span className="ai-donut" />

      <svg
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className="ai-mark-star"
      >
        <defs>
          <linearGradient id={`${uid}-star`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#6aa8ff" />
            <stop offset="48%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f43f7d" />
          </linearGradient>
        </defs>
        {/*
          The star wears the ring's own ramp rather than plain white, so it
          survives the light nav (a white star vanished into the pill) and
          the pair reads as one object.
        */}
        <path d={STAR_PATH} fill={`url(#${uid}-star)`} />
        {/* A white facet on the upper-left arm — the glint that makes it a gem. */}
        <path d={STAR_PATH} fill="#ffffff" opacity="0.28" transform="translate(-0.7 -0.7) scale(0.92)" style={{ transformOrigin: "16px 16px" }} />
      </svg>
    </span>
  );
}

/** Four-point star with concave sides, centred on 16/16, arms to ±7.6. */
const STAR_PATH =
  "M16 8.4 C17.15 12.7 19.3 14.85 23.6 16 C19.3 17.15 17.15 19.3 16 23.6 C14.85 19.3 12.7 17.15 8.4 16 C12.7 14.85 14.85 12.7 16 8.4 Z";
