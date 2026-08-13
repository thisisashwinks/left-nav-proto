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
const TONES: Record<
  BannerTone,
  { bar: string; disc: string; cta: string; fallback: LucideIcon }
> = {
  promo: {
    bar: "bg-[linear-gradient(90deg,#dee5fd,#e9e2fc)] text-[#1d2a63] shadow-[inset_0_-1px_0_0_rgba(29,42,99,0.12)]",
    disc: "text-[#4553c8]",
    cta: "text-[#3746c0]",
    fallback: Megaphone,
  },
  warning: {
    bar: "bg-[#fdf0d1] text-[#6d4703] shadow-[inset_0_-1px_0_0_rgba(109,71,3,0.14)]",
    disc: "text-[#a16207]",
    cta: "text-[#92400e]",
    fallback: CalendarClock,
  },
  danger: {
    bar: "bg-[#fce4e1] text-[#6d1d16] shadow-[inset_0_-1px_0_0_rgba(109,29,22,0.14)]",
    disc: "text-[#c2362b]",
    cta: "text-[#c2362b]",
    fallback: CreditCard,
  },
};

interface TopBannerProps {
  banners: Banner[];
  /**
   * A slimmer cut of the same strip — no disc, tighter type, CTA as a text
   * link. The agency strip wears it permanently: only one banner ever shows
   * at a time now, but agency comms stay ambient where an account's own
   * banner speaks at full height — and the strip never resizes as you move
   * between accounts.
   */
  condensed?: boolean;
}

/**
 * One strip, paging through its level's live banners. Dismissing removes the
 * current banner; the strip goes when none are left. Session-only state:
 * this is a prototype of placement and anatomy, not persistence.
 */
export function TopBanner({ banners, condensed = false }: TopBannerProps) {
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
        "flex w-full shrink-0 items-center gap-[10px] pr-[10px] pl-[14px]",
        condensed ? "h-[32px]" : "h-[44px]",
        tone.bar,
      )}
    >
      {condensed ? (
        <Icon size={13} aria-hidden="true" className={cn("shrink-0", tone.disc)} />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-[26px] shrink-0 items-center justify-center rounded-full bg-white/85",
            "shadow-[0_1px_2px_0_rgba(15,23,42,0.12)]",
            tone.disc,
          )}
        >
          <Icon size={14} />
        </span>
      )}

      {/*
        Message and verb travel together: the CTA sits right after the
        sentence it answers, and the spacer comes AFTER the pair — a button
        exiled to the far edge stopped reading as part of its banner
        (Aug 13 note). Only the strip's management stays on the trailing edge.
      */}
      <p
        className={cn(
          "min-w-0 shrink truncate leading-[18px]",
          condensed ? "text-[12px]" : "text-[13px]",
        )}
      >
        <span className="font-semibold">{banner.lead}</span>
        <span className="opacity-75">{"  ·  "}</span>
        <span className="opacity-90">{banner.detail}</span>
      </p>

      {banner.cta ? (
        condensed ? (
          <button
            type="button"
            className={cn(
              "motion-tap shrink-0 text-[12px] leading-none font-semibold underline underline-offset-2",
              "hover:opacity-80 active:opacity-60",
              tone.cta,
            )}
          >
            {banner.cta}
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "motion-tap flex h-[27px] shrink-0 items-center rounded-[7px] bg-white px-[11px]",
              "text-[12.5px] leading-none font-semibold",
              "shadow-[0_1px_2px_0_rgba(15,23,42,0.12),inset_0_0_0_1px_rgba(15,23,42,0.06)]",
              "hover:scale-[1.02] active:scale-[0.98]",
              tone.cta,
            )}
          >
            {banner.cta}
          </button>
        )
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
