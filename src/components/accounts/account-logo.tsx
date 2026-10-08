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
 * Colours do not follow the accent and do not repaint in dark mode: a tenant's
 * mark is its own, not the workspace's. They arrive already resolved in the
 * spec's `from`/`to`, assigned by `lib/account-color.ts` from the account id —
 * this component never picks one. Every hue in that palette is dark enough at
 * 600 for the white mark to hold contrast on both nav surfaces.
 *
 * The gradient's light end is weaker: white against the 400 stop measures
 * 1.8–2.8:1, under the 3.0 large-text threshold. That is inherited, not new —
 * the hand-picked pairs this replaced measured 1.8–3.8:1 — and the mark sits
 * centred, nearer the 500 midpoint. Tightening every pair to 700→500 lifts the
 * light end to 2.4–4.0 and is a one-line change in `account-color.ts` if the
 * accessibility pass calls for it.
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
   *
   * Washes grey by default; see the `tint` prop for the arrangement that
   * keeps the account's own hue underneath the letters.
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
  /**
   * Two letters to draw instead of the account's own mark.
   *
   * Set by the rail under `railAvatars: "initials"` and `"tinted"`. Absent
   * everywhere else, so every other surface keeps whatever the account has.
   */
  initials?: string;
  /**
   * Keep the account's hue under those letters.
   *
   * Initials normally wash grey — a monogram is a placeholder, and colour
   * is reserved for marks someone actually chose. `tinted` is the reading
   * that says the hue is not decoration either: it is the only thing that
   * tells eleven lettered tiles apart at 26px, and it costs nothing,
   * because the palette is derived from the id rather than picked. See
   * RAIL_AVATARS and `lib/account-color.ts`.
   */
  tint?: boolean;
}

export function AccountLogo({
  logo,
  size,
  radius,
  src,
  initials,
  tint = false,
  className,
}: AccountLogoProps) {
  /*
   * The rail's "initials only" arrangement, handed down. See RAIL_AVATARS.
   *
   * A prop rather than a read of the axis in here: this component also
   * draws the nav header's mark and the switcher's, and the axis is about
   * the RAIL. The caller that is the rail says so; everyone else is
   * untouched.
   *
   * It outranks `src` as well as `glyph`, which is the point — an account
   * that uploaded a real logo is exactly the one the arrangement exists to
   * strip back.
   */
  const spec = initials ? { initials, from: logo.from, to: logo.to } : logo;
  const artwork = initials ? undefined : src;
  /*
   * Letters go grey unless the caller asks for the hue.
   *
   * The rule used to be "initials imply grey", which read as a statement
   * about monograms and was really a statement about PLACEHOLDERS — and it
   * made the one question worth asking unaskable, since no caller could
   * keep the letters and the colour at once.
   */
  const washGrey = Boolean(spec.initials) && !tint;
  // Gradient ids have to be unique per instance or the first one on the page
  // wins and every tile paints with it.
  const gradientId = `account-logo-${React.useId()}`;

  if (artwork) {
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
          backgroundImage: `url(${artwork})`,
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
          {/* Initials tiles are placeholders, not brand marks — they wash
              neutral grey so only real marks (glyphs, uploads) carry colour. */}
          <stop
            offset="0%"
            stopColor={washGrey ? "var(--hr-gray-600)" : spec.from}
          />
          <stop
            offset="100%"
            stopColor={washGrey ? "var(--hr-gray-400)" : spec.to}
          />
        </linearGradient>
      </defs>
      {/* rx is in viewBox units, so the CSS radius has to be scaled up with it. */}
      <rect
        width="32"
        height="32"
        rx={(radius * 32) / size}
        fill={`url(#${gradientId})`}
      />
      {spec.initials ? (
        <text
          x="16"
          y="16.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={spec.initials.length > 1 ? 12.5 : 14.5}
          fontWeight={600}
          fontFamily="inherit"
          letterSpacing="0.3"
        >
          {spec.initials}
        </text>
      ) : spec.glyph ? (
        GLYPHS[spec.glyph]
      ) : null}
    </svg>
  );
}
