"use client";

import * as React from "react";

/**
 * Seeded sub-account logos.
 *
 * Every account gets a gradient tile and a geometric mark instead of a grey
 * monogram, which is what makes a list of fourteen accounts scannable — you
 * recognise the shape and the colour before you read the name.
 *
 * Drawn rather than fetched, on purpose: these stand in for tenant uploads, so
 * they must not reach a CDN, must survive offline, and must stay crisp from 20px
 * in the nav header to 30px in the collapsed rail. Real uploads override them
 * through `navConfig.logoSrc` / `Account.logoSrc`.
 *
 * Colours are literal hexes rather than theme tokens: a tenant's brand does not
 * follow the accent or repaint in dark mode. Every ramp is dark enough for the
 * white mark to hold contrast on both nav surfaces.
 */

export type LogoGlyph =
  | "peak"
  | "wave"
  | "ring"
  | "bolt"
  | "spark"
  | "chevrons"
  | "block"
  | "shield"
  | "leaf"
  | "arc"
  | "orbit"
  | "dots";

export interface AccountLogoSpec {
  /** Absent for accounts with no mark at all — initials carry the tile. */
  glyph?: LogoGlyph;
  /** Gradient stops, top-left to bottom-right. */
  from: string;
  to: string;
  /**
   * The production fallback (Aug 13 review): most real sub-accounts never
   * upload a logo, so the tile shows initials on the brand wash — the
   * contacts-avatar pattern. Wins over `glyph` when both are set.
   */
  initials?: string;
}

/** All marks are drawn in a 32x32 box and scaled by the caller. */
const STROKE = { fill: "none", stroke: "#fff", strokeWidth: 2.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const GLYPHS: Record<LogoGlyph, React.ReactNode> = {
  peak: <path d="M16 9.5 24.5 23h-17z" fill="#fff" />,
  wave: (
    <>
      <path d="M7 19c3-4.5 6-4.5 9 0s6 4.5 9 0" {...STROKE} />
      <path d="M7 13c3-4.5 6-4.5 9 0s6 4.5 9 0" {...STROKE} opacity={0.55} />
    </>
  ),
  ring: <circle cx="16" cy="16" r="7" {...STROKE} strokeWidth={3.2} />,
  bolt: <path d="M18.5 7 9.5 18.5h5.2L13.5 25l9-11.5h-5.2z" fill="#fff" />,
  spark: (
    <path
      d="M16 6.5l2.3 6.6 6.6 2.3-6.6 2.3L16 24.5l-2.3-6.8-6.6-2.3 6.6-2.3z"
      fill="#fff"
    />
  ),
  chevrons: (
    <>
      <path d="M10 17.5 16 11.5l6 6" {...STROKE} />
      <path d="M10 24 16 18l6 6" {...STROKE} opacity={0.5} />
    </>
  ),
  block: <rect x="9.5" y="9.5" width="13" height="13" rx="4" {...STROKE} strokeWidth={3} />,
  shield: <path d="M16 7l7.5 3.2v5.6c0 4.4-3.1 7.6-7.5 9.2-4.4-1.6-7.5-4.8-7.5-9.2v-5.6z" fill="#fff" />,
  leaf: <path d="M23 9c0 7.7-5.3 13-13 13C10 14.3 15.3 9 23 9z" fill="#fff" />,
  arc: (
    <>
      <path d="M8.5 22a7.5 7.5 0 0 1 15 0" {...STROKE} strokeWidth={3.2} />
      <circle cx="16" cy="22" r="1.9" fill="#fff" />
    </>
  ),
  orbit: (
    <>
      <ellipse cx="16" cy="16" rx="9" ry="4.4" {...STROKE} strokeWidth={2.4} transform="rotate(-30 16 16)" />
      <circle cx="16" cy="16" r="3.4" fill="#fff" />
    </>
  ),
  dots: (
    <>
      <circle cx="12" cy="12" r="2.6" fill="#fff" />
      <circle cx="20" cy="12" r="2.6" fill="#fff" opacity={0.6} />
      <circle cx="12" cy="20" r="2.6" fill="#fff" opacity={0.6} />
      <circle cx="20" cy="20" r="2.6" fill="#fff" />
    </>
  ),
};

interface AccountLogoProps {
  logo: AccountLogoSpec;
  /** Rendered size in px. */
  size: number;
  /** Corner radius in px, so each call site can match its surrounding geometry. */
  radius: number;
  /** An uploaded asset, which replaces the drawn mark entirely. */
  src?: string;
  className?: string;
}

export function AccountLogo({
  logo,
  size,
  radius,
  src,
  className,
}: AccountLogoProps) {
  // Gradient ids have to be unique per instance or the first one on the page
  // wins and every tile paints with it.
  const gradientId = `account-logo-${React.useId()}`;

  if (src) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          // A logo tile, not a photo crop: real marks are mostly transparent
          // squares, so they sit contained on a white tile with a hairline
          // ring — the Slack-workspace treatment. The white also keeps dark
          // marks legible on the dark nav.
          backgroundColor: "#ffffff",
          backgroundImage: `url(${src})`,
          // Most favicons carry their own safe-area padding, so the artwork
          // needs nearly the whole tile before it reads at 20px.
          backgroundSize: "86% 86%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          boxShadow: "inset 0 0 0 1px rgba(16,24,40,0.12)",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={logo.from} />
          <stop offset="100%" stopColor={logo.to} />
        </linearGradient>
      </defs>
      {/* rx is in viewBox units, so the CSS radius has to be scaled up with it. */}
      <rect
        width="32"
        height="32"
        rx={(radius * 32) / size}
        fill={`url(#${gradientId})`}
      />
      {logo.initials ? (
        <text
          x="16"
          y="16.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={logo.initials.length > 1 ? 12.5 : 14.5}
          fontWeight={600}
          fontFamily="inherit"
          letterSpacing="0.3"
        >
          {logo.initials}
        </text>
      ) : logo.glyph ? (
        GLYPHS[logo.glyph]
      ) : null}
    </svg>
  );
}
