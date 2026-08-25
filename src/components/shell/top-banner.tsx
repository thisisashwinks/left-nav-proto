"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  CreditCard,
  Megaphone,
  Trophy,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Top banners, scoped by who they belong to.
 *
 * The exploration's answer to "agency level vs sub-account level" is span:
 * a banner runs exactly as wide as the thing it is about. Agency banners —
 * platform-to-agency comms like promos and billing — take the full window,
 * over the account rail, the nav and the canvas, because they are about the
 * whole relationship. A sub-account's banner starts where that account's
 * content starts, to the right of the rails, so its left edge says whose
 * problem it is — and it leaves when you switch accounts. Same glanceability
 * rule as the rail: position carries the level, not a label.
 *
 * Inside the strip the IA is a sentence, not a marquee: glyph (what kind),
 * lead (what happened), detail (what it means), one verb (what to do) — all
 * left-aligned on the reading edge where production centres them, so the
 * banner lines up with the page underneath instead of floating. Controls
 * live together at the far right: paging through the level's banners and
 * dismissing them are both "manage the strip", not content.
 */

export type BannerTone = "promo" | "warning" | "danger";

export interface Banner {
  id: string;
  tone: BannerTone;
  /** The glyph on the leading disc. Falls back to the tone's own. */
  icon?: LucideIcon;
  /** What happened, in a few bold words. */
  lead: string;
  /** What it means — regular weight, after the lead. */
  detail: string;
  /** The one verb. Verb-first per copy rules. */
  cta?: string;
}

/** What HighLevel is saying to the agency this week — the full-bleed strip. */
export const AGENCY_BANNERS: Banner[] = [
  {
    id: "summer-of-ai",
    tone: "promo",
    icon: Trophy,
    lead: "Summer of AI",
    detail: "$100K in cash prizes. Your division. Your clients.",
    cta: "Check your standing",
  },
  {
    id: "levelup-day",
    tone: "promo",
    icon: Megaphone,
    lead: "LevelUp Day is Aug 28",
    detail: "Live sessions on the new navigation and agency tools.",
    cta: "Save your seat",
  },
];

/**
 * Per-account strips, keyed by account id. Only Coastal and Brightpath carry
 * one, so switching accounts demonstrates the scoping: the strip appears with
 * its account and goes with it.
 */
/*
 * Per the Aug 11 review: banners name their account ("Coastal Fitness is
 * missing a payment method"), and processing status — bulk imports and the
 * like — is NOT top-banner material; that belongs to a background-processes
 * surface near the work itself, so ACME's import strip was removed.
 *
 * ACME carries the wallet strip from the Aug 13 audit — the one banner that
 * appeared on all 79 crawl screenshots — so the default view demonstrates
 * the account-banner anatomy without switching accounts. Service failing is
 * exactly what the top strip is FOR; contrast the import status it replaced.
 */
export const ACCOUNT_BANNERS: Record<string, Banner[]> = {
  acme: [
    {
      id: "acme-wallet",
      tone: "danger",
      icon: Wallet,
      lead: "ACME's wallet balance is below $0",
      detail: "SMS, calls and emails will start failing.",
      cta: "Add credits",
    },
  ],
  coastal: [
    {
      id: "coastal-payment",
      tone: "danger",
      icon: CreditCard,
      lead: "Coastal Fitness Co. is missing a payment method",
      detail: "Add a card to keep this account's campaigns running.",
      cta: "Add card",
    },
  ],
  brightpath: [
    {
      id: "brightpath-trial",
      tone: "warning",
      icon: CalendarClock,
      lead: "Brightpath Dental's trial ends Aug 24",
      detail: "Pick a plan to keep automations running.",
      cta: "Choose plan",
    },
  ],
};

/**
 * Literal colours, not surface tokens: the strip is a flash message from
 * outside the account's chrome, so it must not rebrand with the tenant —
 * a payment warning that turns Coastal-teal stops reading as a warning.
 * Each tone is a soft wash with a hairline base and a white disc for the
 * glyph, so the strip has structure without shouting.
 */
/*
 * Flat tints and light strokes (design review, Aug 21). The promo gradient went
 * — same verdict as the flyout's promo card — and each tone's stroke sits a
 * shade or two lighter than the ink it used to borrow, so the strip reads as a
 * tinted band rather than an outlined component. `cta` is the hollow chip's
 * ink AND its stroke: the review asked for smaller, tracked-out, all-caps and
 * hollow, and a hollow chip is drawn in one colour.
 */
/*
 * No bottom hairline on the bar (Aug 25).
 *
 * Each tone used to close itself off with an inset bottom line. Under the
 * floating chrome that line reads as a border on a strip that is not a card —
 * the banner sits on the plane, and the chrome below it already has its own
 * edge, so the two stacked up as a double rule.
 */
const TONES: Record<
  BannerTone,
  { bar: string; disc: string; cta: string; fallback: LucideIcon }
> = {
  promo: {
    bar: "bg-[#e3e8fd] text-[#1d2a63]",
    disc: "text-[#4553c8]",
    cta: "text-[#3746c0] shadow-[inset_0_0_0_1px_#aab5ec]",
    fallback: Megaphone,
  },
  warning: {
    bar: "bg-[#fdf0d1] text-[#6d4703]",
    disc: "text-[#a16207]",
    cta: "text-[#92400e] shadow-[inset_0_0_0_1px_#e4c37e]",
    fallback: CalendarClock,
  },
  danger: {
    bar: "bg-[#fce4e1] text-[#6d1d16]",
    disc: "text-[#c2362b]",
    cta: "text-[#c2362b] shadow-[inset_0_0_0_1px_#eba8a1]",
    fallback: CreditCard,
  },
};

interface TopBannerProps {
  banners: Banner[];
}

/**
 * One strip, paging through its level's live banners. Dismissing removes the
 * current banner; the strip goes when none are left. Session-only state:
 * this is a prototype of placement and anatomy, not persistence.
 */
/*
 * There used to be a `condensed` cut of this — 32px, no disc, tighter type, CTA
 * as a text link — worn permanently by the agency strip so agency comms read as
 * ambient beside an account's own banner. It is gone: two heights and two type
 * scales for the same component meant the strip changed size and weight as you
 * moved between agency and account, which read as a bug rather than a hierarchy.
 * One strip, one treatment.
 */
export function TopBanner({ banners }: TopBannerProps) {
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  const [index, setIndex] = React.useState(0);

  const live = banners.filter((b) => !dismissed.includes(b.id));
  if (live.length === 0) return null;

  const i = Math.min(index, live.length - 1);
  const banner = live[i];
  const tone = TONES[banner.tone];
  const Icon = banner.icon ?? tone.fallback;

  return (
    <div
      role="status"
      className={cn(
        // Inset top, left and right and rounded to the shell radius, so the strip
        // reads as a card on the page like the nav and the flyout rather than a
        // bar welded to the window. No bottom margin: the plane's own content is
        // already inset, which supplies the gap under it.
        //
        // `w-full` goes with it — 100% plus horizontal margins overflows. The
        // banner is a flex-column child, so it stretches to the width minus its
        // margins on its own.
        "mx-[var(--shell-canvas-gap)] mt-[var(--shell-canvas-gap)] flex shrink-0",
        "items-center gap-[8px] overflow-hidden rounded-[var(--shell-canvas-radius)] pr-[8px] pl-[10px]",
        /*
         * 32px, which is the height the agency strip used to wear.
         *
         * "One banner treatment, not two" collapsed the condensed agency cut
         * into the account's 44px one, and the single surviving height was the
         * taller of the two. A banner is ambient — it is the one thing on
         * screen nobody came for — and at 44px it was taking as much vertical
         * room as the app bar under it. The condensed cut was right; it just
         * should have been the one that survived.
         */
        "h-[32px]",
        tone.bar,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          // No disc at this height — a filled 26px circle in a 32px strip left
          // 3px above and below and read as a button. The glyph carries the
          // tone on its own, which is what the condensed cut always did.
          "flex shrink-0 items-center justify-center",
          tone.disc,
        )}
      >
        <Icon size={14} />
      </span>

      {/*
        Centred (design review, Aug 21 — reversing the Aug 13 left alignment).
        The message and its verb still travel together; a spacer on each side
        is what centres the pair while the disc and the strip's management hold
        the edges.
      */}
      <div aria-hidden="true" className="min-w-0 flex-1" />
      <p
        className={cn(
          "min-w-0 shrink truncate leading-[16px]",
          "text-[12.5px]",
        )}
      >
        <span className="font-semibold">{banner.lead}</span>
        <span className="opacity-75">{"  ·  "}</span>
        <span className="opacity-90">{banner.detail}</span>
      </p>

      {banner.cta ? (
        <button
          type="button"
          // Hollow, small, all-caps and tracked out (Aug 21 review) — a label
          // wearing a stroke, not a white block competing with the message.
          className={cn(
            "motion-tap flex h-[20px] shrink-0 items-center rounded-[6px] bg-transparent px-[8px]",
            "text-[10.5px] leading-none font-semibold tracking-[0.7px] uppercase",
            "hover:bg-white/40 active:scale-[0.98]",
            tone.cta,
          )}
        >
          {banner.cta}
        </button>
      ) : null}

      {/* Pushes the strip's management to the trailing edge, past the content. */}
      <div aria-hidden="true" className="min-w-0 flex-1" />

      {/* Strip management, gathered on the trailing edge away from content. */}
      <div className="flex shrink-0 items-center gap-[2px] pl-[4px]">
        {live.length > 1 ? (
          <>
            <Pager
              label="Previous banner"
              onClick={() => setIndex((i - 1 + live.length) % live.length)}
            >
              <ChevronLeft size={14} aria-hidden="true" />
            </Pager>
            <span className="px-[2px] text-[11.5px] leading-none tabular-nums opacity-75">
              {i + 1}/{live.length}
            </span>
            <Pager label="Next banner" onClick={() => setIndex((i + 1) % live.length)}>
              <ChevronRight size={14} aria-hidden="true" />
            </Pager>
            <span aria-hidden="true" className="mx-[6px] h-[16px] w-px bg-current opacity-20" />
          </>
        ) : null}

        <button
          type="button"
          aria-label="Dismiss banner"
          onClick={() => {
            setDismissed([...dismissed, banner.id]);
            setIndex(0);
          }}
          className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] opacity-70 hover:bg-black/5 hover:opacity-100 active:scale-95"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Pager({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="motion-tap flex size-[22px] items-center justify-center rounded-[5px] opacity-70 hover:bg-black/5 hover:opacity-100 active:scale-95"
    >
      {children}
    </button>
  );
}
