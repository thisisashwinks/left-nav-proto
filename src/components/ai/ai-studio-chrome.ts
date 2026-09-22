import type * as React from "react";
import type { SurfaceTheme } from "@/design/theme";

/**
 * AI Studio's own palette, derived rather than picked.
 *
 * The brief for this screen allows the studio to look unlike the platform —
 * that is half of what the takeover IS, and a studio painted in exactly the
 * app's greys would be a weaker counter-example, not a kinder one. What it may
 * not do is stop following the theme: an operator who switches the accent or
 * flips to dark in the tuning panel and finds one product still blue-on-white
 * has found a bug, not a brand.
 *
 * So every value below is one `oklch(from …)` away from a token the rest of the
 * app already reads — `--pg-*` for the chrome, `--brand` for the wash. The
 * alternative considered and rejected was a `[data-studio-theme]` block in
 * tokens.css: that file is layer 1-6 of a system three other surfaces share,
 * and a seventh layer existing for one screen would be the tail wagging the
 * dog. A style object goes out of scope with the component that spreads it.
 *
 * Why a function of `appTheme` instead of CSS that reacts on its own: the wash
 * cannot be written as a single relative colour that reads well at both ends.
 * Light wants l≈0.88 at low chroma (a hint of colour on white); dark wants
 * l≈0.42 at similar chroma (a glow, not a fog). Relative syntax can scale a
 * channel, not choose between two intents — so the choice is made in TS, where
 * `useTheme().effective.appTheme` already says which end we are at.
 */

/** The studio's surfaces and lines, for the element that owns the takeover. */
export function studioChrome(theme: SurfaceTheme): React.CSSProperties {
  const dark = theme === "dark";
  return {
    /*
     * The studio's own sidebar ground: a shade off the page background rather
     * than a fill of its own. It has to read as "not the platform's nav"
     * without reading as a third product — the first cut used --pg-surface and
     * the sidebar vanished into the content beside it.
     */
    "--as-rail": dark
      ? "oklch(from var(--pg-bg) calc(l + 0.022) c h)"
      : "oklch(from var(--pg-bg) calc(l - 0.012) c h)",
    "--as-rail-line": "var(--pg-border)",
    /* The row under the pointer, and the row that is lit. */
    "--as-rail-hover": dark
      ? "oklch(from var(--pg-bg) calc(l + 0.055) c h)"
      : "oklch(from var(--pg-bg) calc(l - 0.045) c h)",
    "--as-rail-on": dark
      ? "oklch(from var(--pg-bg) calc(l + 0.085) c h)"
      : "oklch(from var(--pg-surface) l c h)",
    /*
     * The wash. Three lobes, hue-stepped off the accent rather than named:
     * green at h-120, the accent itself in the middle, warm at h+160. Stepping
     * off --brand is what keeps a red-accented agency's studio warm-washed
     * instead of stubbornly blue.
     */
    "--as-wash-green": dark
      ? "oklch(from var(--brand) 0.42 calc(c * 0.55) calc(h - 120))"
      : "oklch(from var(--brand) 0.9 calc(c * 0.45) calc(h - 120))",
    "--as-wash-accent": dark
      ? "oklch(from var(--brand) 0.4 calc(c * 0.6) h)"
      : "oklch(from var(--brand) 0.9 calc(c * 0.5) h)",
    "--as-wash-warm": dark
      ? "oklch(from var(--brand) 0.44 calc(c * 0.5) calc(h + 160))"
      : "oklch(from var(--brand) 0.92 calc(c * 0.45) calc(h + 160))",
  } as React.CSSProperties;
}

/**
 * A project's thumbnail tint, keyed off its id.
 *
 * Deliberately `accountColorFor`'s trick rather than `accountColorFor` itself:
 * that function's palette exists to make TENANTS distinguishable at 26px and
 * its doc explains, at length, which hues it refuses and why. Borrowing it
 * here would tie a project card's colour to a rule about sub-account avatars,
 * and the next person to add a hue for accounts would silently restyle this
 * grid. Same idea, own sentence.
 */
export function projectTint(id: string, theme: SurfaceTheme): React.CSSProperties {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  const hue = (hash % 12) * 30;
  const dark = theme === "dark";
  return {
    "--as-thumb-from": dark
      ? `oklch(from var(--brand) 0.34 calc(c * 0.7) calc(h + ${hue}))`
      : `oklch(from var(--brand) 0.86 calc(c * 0.55) calc(h + ${hue}))`,
    "--as-thumb-to": dark
      ? `oklch(from var(--brand) 0.24 calc(c * 0.5) calc(h + ${hue + 40}))`
      : `oklch(from var(--brand) 0.95 calc(c * 0.3) calc(h + ${hue + 40}))`,
  } as React.CSSProperties;
}
