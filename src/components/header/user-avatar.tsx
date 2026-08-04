"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Where the uploaded portrait lives. Swap the file, not the code. */
const AVATAR_SRC = "/avatar.png";

/**
 * The signed-in user's avatar.
 *
 * A real photo from `public/`, standing in for what would be an uploaded one. If
 * it ever fails to load — missing file, broken deploy — it falls back to a drawn
 * silhouette rather than a broken-image glyph or an empty circle, because this sits
 * in the app bar of every screen and is the last place that should look broken.
 */
export function UserAvatar({
  size = 26,
  initials,
}: {
  size?: number;
  /** Used for the accessible name, and as the fallback's label. */
  initials: string;
}) {
  const [failed, setFailed] = React.useState(false);

  if (failed) return <DrawnAvatar size={size} initials={initials} />;

  return (
    <Image
      src={AVATAR_SRC}
      alt={`Account, ${initials}`}
      width={size}
      height={size}
      // The box is forced in CSS, not just in the attributes: preflight sets
      // `img { height: auto }`, which let the source's own aspect ratio win and
      // rendered a 26x22 oval. `object-cover` then crops to the circle rather than
      // squashing the photo into it.
      style={{ width: size, height: size }}
      className={cn(
        "shrink-0 rounded-full object-cover",
        "shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]",
      )}
      onError={() => setFailed(true)}
      // Fixed at 26px in the bar, so there is nothing to negotiate at request time.
      priority
    />
  );
}

/**
 * The fallback face. Drawn, not loaded: no second request to fail, and it
 * recolours with the header's own token.
 */
function DrawnAvatar({ size, initials }: { size: number; initials: string }) {
  // Two avatars on one page would otherwise share a gradient id, and the second
  // would paint with the first's fill.
  const id = React.useId();
  const gradientId = `avatar-fill-${id}`;
  const clipId = `avatar-clip-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={`Account, ${initials}`}
      className="shrink-0"
    >
      <defs>
        {/*
          A white wash over the token, not a mix of two colours. `color-mix()`
          inside `stop-color` resolved to black — SVG gradient stops do not accept
          it — so the lighter top is a translucent white overlay on a flat fill.
        */}
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>

      <circle cx="20" cy="20" r="20" fill="var(--hdr-avatar)" />
      <circle cx="20" cy="20" r="20" fill={`url(#${gradientId})`} />

      {/*
        Head and shoulders, clipped to the disc. The shoulders are an ellipse
        hanging off the bottom edge rather than a drawn torso — at 26px anything
        with more detail than this turns to mud.
      */}
      <g clipPath={`url(#${clipId})`} fill="white" fillOpacity="0.92">
        <circle cx="20" cy="15.5" r="6.4" />
        <ellipse cx="20" cy="40" rx="12.6" ry="11.2" />
      </g>
    </svg>
  );
}
