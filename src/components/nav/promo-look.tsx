"use client";

import * as React from "react";
import {
  BadgePercent,
  Egg,
  Flame,
  Gift,
  PartyPopper,
  Percent,
  ShoppingBag,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Star,
  Tag,
  Tags,
  Ticket,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BADGE_TONE } from "@/components/flyout/types";
import { useTheme } from "@/components/theme/theme-provider";
import {
  NAV_PROMO_TAG_LABEL_LABELS,
  type NavPromoIcon,
  type NavPromoIconTint,
  type NavPromoTagColor,
} from "@/design/theme";

/*
 * Holiday Promos' L1 look: the glyph, its touch of colour, and the tag. The
 * rest of the row is the sidebar's own. See NAV_PROMO_ICONS. Ashwin, Nov 19.
 */
const GLYPHS: Record<Exclude<NavPromoIcon, keyof typeof EMOJI>, LucideIcon> = {
  badgePercent: BadgePercent,
  percent: Percent,
  tag: Tag,
  tags: Tags,
  gift: Gift,
  shoppingBag: ShoppingBag,
  shoppingCart: ShoppingCart,
  ticket: Ticket,
  sparkles: Sparkles,
  partyPopper: PartyPopper,
  snowflake: Snowflake,
  egg: Egg,
  star: Star,
  flame: Flame,
};

/*
 * The emoji options render the system emoji in the icon's own box, at the
 * icon's size, in its own colours: the icon colour setting leaves it alone,
 * the dot still applies. Ashwin, Nov 20.
 */
const EMOJI = { emojiTada: "🎉", emojiConfetti: "🎊" } as const;
const isEmoji = (icon: NavPromoIcon): icon is keyof typeof EMOJI => icon in EMOJI;

const INK: Partial<Record<NavPromoIconTint, string>> = {
  red: "var(--hr-error-600)",
  green: "var(--hr-success-600)",
};
const DOT: Partial<Record<NavPromoIconTint, string>> = {
  redDot: "var(--hr-error-500)",
  greenDot: "var(--hr-success-500)",
};

/*
 * Built once per glyph and tint, so the row sees a stable component. The
 * tint is an inline colour so it outranks the row's muted ink; the dot is a
 * 6px disc on the glyph's top-right corner, ringed in the nav's surface.
 */
const cache = new Map<string, LucideIcon>();
function promoGlyph(icon: NavPromoIcon, tint: NavPromoIconTint): LucideIcon {
  const key = `${icon}:${tint}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const ink = INK[tint];
  const dot = DOT[tint];
  const C = React.forwardRef<SVGSVGElement, LucideProps>(function PromoGlyph({ style, className, ...rest }, ref) {
    const svg = isEmoji(icon) ? (
      <span
        aria-hidden="true"
        className={cn(className, "inline-flex items-center justify-center leading-none select-none")}
        style={{ ...style, fontSize: style?.width ?? 16 }}
      >
        {EMOJI[icon]}
      </span>
    ) : (
      React.createElement(GLYPHS[icon], { ref, ...rest, className, style: { ...style, ...(ink ? { color: ink } : {}) } })
    );
    if (!dot) return svg;
    return (
      <span className="relative inline-flex shrink-0" style={{ width: style?.width, height: style?.height }}>
        {svg}
        <span
          aria-hidden="true"
          className="absolute -top-[2px] -right-[2px] size-[6px] rounded-full shadow-[0_0_0_1.5px_var(--nav-bg,#fff)]"
          style={{ background: dot }}
        />
      </span>
    );
  }) as unknown as LucideIcon;
  cache.set(key, C);
  return C;
}

export function usePromoGlyph(): LucideIcon {
  const { navPromoIcon, navPromoIconTint } = useTheme().effective;
  return promoGlyph(navPromoIcon, navPromoIconTint);
}

/*
 * Soft and solid tints are HighRise's error and success scales.
 *
 * Each gradient stays inside one hue family, light-to-deep at 135°: across
 * two opposed hues (red into green) the middle of a 40px pill goes brown.
 * Every deep stop holds white text at 4.5:1 or better, gold carries dark
 * text instead, and a 1px inner highlight on the top edge gives the fill a
 * little depth without lifting it off the row. Ashwin, Nov 19.
 */
const SHEEN = "inset 0 1px 0 rgba(255,255,255,0.28)";
const grad = (from: string, to: string, color = "#fff"): { style: React.CSSProperties } => ({
  style: { background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`, color, boxShadow: SHEEN },
});
const TAG_FILL: Record<NavPromoTagColor, { className?: string; style?: React.CSSProperties }> = {
  default: { className: BADGE_TONE.new },
  // On the same steps as the New tag (100 fill, 700 ink; 900 and 200 on a
  // dark nav): the 50 wash vanished against the sidebar. Ashwin, Nov 20.
  redSoft: { style: { background: "var(--nav-promo-red-bg)", color: "var(--nav-promo-red-fg)" } },
  greenSoft: { style: { background: "var(--hr-success-50)", color: "var(--hr-success-700)" } },
  red: { style: { background: "var(--hr-error-600)", color: "#fff" } },
  // The Beta tag's yellow, on New's steps in light and dark. Ashwin, Nov 20.
  yellowSoft: { className: BADGE_TONE.beta },
  green: { style: { background: "var(--hr-success-600)", color: "#fff" } },
  holly: grad("#E8433A", "#A41E16"),
  evergreen: grad("#0E9F62", "#06603D"),
  sunset: grad("#F46A1F", "#C8104B"),
  gold: grad("#FEDF89", "#F5A524", "#5C2A06"),
  primary: grad("#3B7BFF", "#6938EF"),
};

/** The row's tag: NewTag's size and shape, in the picked words and fill. */
export function PromoTag() {
  const { navPromoTagLabel, navPromoTagColor } = useTheme().effective;
  const fill = TAG_FILL[navPromoTagColor];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "shrink-0 rounded-[2px] px-[4px] py-[2px] text-[10px] leading-[normal] font-semibold whitespace-nowrap",
        fill.className,
      )}
      style={fill.style}
    >
      {NAV_PROMO_TAG_LABEL_LABELS[navPromoTagLabel]}
    </span>
  );
}
