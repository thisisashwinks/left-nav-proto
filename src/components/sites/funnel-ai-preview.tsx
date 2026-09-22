"use client";

import * as React from "react";
import { CalendarDays, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { previewPage } from "./funnels-data";

/**
 * A picture of the page the assistant says it built. Not a page.
 *
 * Everything here is static on purpose — no state, no handlers, no date
 * arithmetic. The builder screen exists so the Sep 22 review can judge the TOP
 * BAR against a two-column AI layout, and the moment this column becomes a
 * real calendar it starts collecting the kind of bug report ("the 31st is
 * wrong") that has nothing to do with the question being asked. A reviewer who
 * clicks a time slot here should get exactly what they would get clicking a
 * screenshot, which is the honest answer about how finished this is.
 *
 * The month is September 2026 and the offset is hard-coded beside it in
 * funnels-data rather than computed, for the same reason: a grid that shifts
 * with the real clock would make two screenshots taken a month apart disagree.
 */

/**
 * The imitated page's own palette, derived from the accent rather than fixed.
 *
 * It cannot use --pg-*: those tokens INVERT under a dark app theme, and this is
 * a customer's landing page being previewed inside the builder, not part of the
 * app's chrome. A hero that went pale because the operator switched the product
 * to dark mode would be the preview lying about what was published.
 *
 * Nor is it hard-coded hex (inbox-page does that, and is the exception that
 * proves the rule — it is imitating a named third-party product with its own
 * brand). This page belongs to the sub-account, so it follows the sub-account's
 * accent: every value below is one `oklch(from var(--brand) …)` away from the
 * same token the platform's own buttons read, which means swapping the accent
 * in the tuning panel restyles the fake landing page too.
 */
const PAGE_PALETTE: React.CSSProperties = {
  // The hero. Dark in every theme, tinted by the accent's hue.
  "--pv-ink": "oklch(from var(--brand) 0.21 calc(c * 0.30) h)",
  "--pv-ink-2": "oklch(from var(--brand) 0.27 calc(c * 0.34) h)",
  "--pv-on-ink": "oklch(from var(--brand) 0.97 calc(c * 0.06) h)",
  "--pv-on-ink-muted": "oklch(from var(--brand) 0.78 calc(c * 0.08) h)",
  // The card, and the type on it.
  "--pv-card": "oklch(from var(--brand) 0.995 calc(c * 0.01) h)",
  "--pv-card-2": "oklch(from var(--brand) 0.975 calc(c * 0.04) h)",
  "--pv-line": "oklch(from var(--brand) 0.92 calc(c * 0.06) h)",
  "--pv-title": "oklch(from var(--brand) 0.26 calc(c * 0.12) h)",
  "--pv-body": "oklch(from var(--brand) 0.48 calc(c * 0.08) h)",
  "--pv-faint": "oklch(from var(--brand) 0.66 calc(c * 0.06) h)",
  // The accent itself, for the chosen date and the slot rings.
  "--pv-accent": "var(--brand)",
  "--pv-accent-soft": "oklch(from var(--brand) 0.95 calc(c * 0.35) h)",
} as React.CSSProperties;

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function FunnelAiPreview() {
  const {
    brand,
    title,
    subtitle,
    eventName,
    duration,
    month,
    monthOffset,
    days,
    open,
    selected,
    slots,
    timezone,
  } = previewPage;

  return (
    <div
      style={PAGE_PALETTE}
      className="mx-auto w-full max-w-[860px] overflow-hidden rounded-[12px] shadow-[0_18px_40px_-12px_rgba(15,23,42,0.22),0_4px_10px_-4px_rgba(15,23,42,0.12)]"
    >
      {/*
        The hero, and the bottom padding it does not need.

        The card below pulls up into it by 40px, so the hero's own floor has to
        be deep enough that the overlap eats slack rather than the subtitle.
      */}
      <div
        className="flex flex-col items-center gap-[14px] px-[40px] pt-[42px] pb-[64px] text-center"
        style={{
          background:
            "linear-gradient(160deg, var(--pv-ink-2) 0%, var(--pv-ink) 58%)",
        }}
      >
        {/* A logo BLOCK, not a logo: the mark is the customer's and the
            prototype has no business inventing one, so this is the shape a
            mark occupies with the wordmark the assistant lifted from the
            account name beside it. */}
        <div className="flex items-center gap-[9px]">
          <span
            aria-hidden="true"
            className="flex size-[26px] items-center justify-center rounded-[7px]"
            style={{ background: "var(--pv-accent)" }}
          >
            <span className="size-[10px] rounded-[3px] bg-[var(--pv-on-ink)]" />
          </span>
          <span
            className="text-[13px] leading-[normal] font-semibold tracking-[2.4px]"
            style={{ color: "var(--pv-on-ink)" }}
          >
            {brand}
          </span>
        </div>

        <h2
          className="text-[34px] leading-[42px] font-semibold tracking-[-0.6px]"
          style={{ color: "var(--pv-on-ink)" }}
        >
          {title}
        </h2>
        <p
          className="max-w-[420px] text-[14px] leading-[20px]"
          style={{ color: "var(--pv-on-ink-muted)" }}
        >
          {subtitle}
        </p>
      </div>

      {/* The booking card. Pulled up over the hero's foot, which is the one
          piece of composition the assistant's reply claims and so the one the
          preview has to actually show. */}
      <div
        className="pb-[34px]"
        style={{ background: "var(--pv-card-2)" }}
      >
        <div
          className="mx-[28px] -mt-[40px] flex gap-[26px] rounded-[12px] p-[22px] shadow-[0_10px_24px_-8px_rgba(15,23,42,0.16)]"
          style={{ background: "var(--pv-card)" }}
        >
          {/* Left: who and how long. The identity column of every booking page
              ever shipped, and the reason the calendar reads as an appointment
              rather than as a date picker. */}
          <div
            className="flex w-[186px] shrink-0 flex-col gap-[12px] pr-[22px]"
            style={{ borderRight: "1px solid var(--pv-line)" }}
          >
            <span
              aria-hidden="true"
              className="size-[38px] rounded-full"
              style={{ background: "var(--pv-accent-soft)" }}
            />
            <div className="flex flex-col gap-[3px]">
              <span
                className="text-[15px] leading-[20px] font-semibold"
                style={{ color: "var(--pv-title)" }}
              >
                {eventName}
              </span>
              <span
                className="text-[13px] leading-[18px]"
                style={{ color: "var(--pv-faint)" }}
              >
                {brand.charAt(0) + brand.slice(1).toLowerCase()} team
              </span>
            </div>
            <div className="flex flex-col gap-[7px]">
              <PreviewMeta icon={Clock} label={duration} />
              <PreviewMeta icon={CalendarDays} label="Wed, Sep 23, 2026" />
            </div>
          </div>

          {/* Right: the month and the slots, side by side — the layout the
              prompt asked for in so many words. */}
          <div className="flex min-w-0 flex-1 gap-[22px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
              <span
                className="text-[13px] leading-[18px] font-semibold"
                style={{ color: "var(--pv-title)" }}
              >
                {month}
              </span>
              <div className="grid grid-cols-7 gap-y-[4px]">
                {WEEKDAYS.map((d, i) => (
                  <span
                    key={`${d}${i}`}
                    className="flex h-[22px] items-center justify-center text-[11px] leading-[normal] font-medium"
                    style={{ color: "var(--pv-faint)" }}
                  >
                    {d}
                  </span>
                ))}
                {/* Leading blanks, so the 1st lands on its weekday. Index keys
                    are safe here precisely because nothing ever reorders. */}
                {Array.from({ length: monthOffset }, (_, i) => (
                  <span key={`pad-${i}`} aria-hidden="true" className="h-[28px]" />
                ))}
                {Array.from({ length: days }, (_, i) => {
                  const date = i + 1;
                  const isOpen = (open as readonly number[]).includes(date);
                  const isSelected = date === selected;
                  return (
                    <span
                      key={date}
                      className={cn(
                        "mx-auto flex size-[28px] items-center justify-center rounded-full text-[12px] leading-[normal]",
                        isSelected ? "font-semibold" : "font-medium",
                      )}
                      style={
                        isSelected
                          ? { background: "var(--pv-accent)", color: "var(--pv-card)" }
                          : isOpen
                            ? { background: "var(--pv-accent-soft)", color: "var(--pv-title)" }
                            : { color: "var(--pv-faint)" }
                      }
                    >
                      {date}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex w-[124px] shrink-0 flex-col gap-[7px]">
              {slots.map((slot, i) => (
                <span
                  key={slot}
                  className="flex h-[32px] items-center justify-center rounded-[7px] text-[12.5px] leading-[normal] font-medium"
                  style={
                    // One filled slot, because a column of identical outlines
                    // says "pick one" and says nothing about what picking does.
                    i === 1
                      ? { background: "var(--pv-accent)", color: "var(--pv-card)" }
                      : {
                          color: "var(--pv-title)",
                          boxShadow: "inset 0 0 0 1px var(--pv-line)",
                        }
                  }
                >
                  {slot}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* The timezone row, under the card rather than in it — it applies to
            every slot above, and inside the slots column it would read as a
            seventh time. */}
        <div className="mx-[28px] mt-[14px] flex items-center justify-center gap-[7px]">
          <Globe size={14} aria-hidden="true" style={{ color: "var(--pv-faint)" }} />
          <span className="text-[12.5px] leading-[18px]" style={{ color: "var(--pv-body)" }}>
            {timezone}
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewMeta({
  icon: Icon,
  label,
}: {
  icon: typeof Clock;
  label: string;
}) {
  return (
    <span className="flex items-center gap-[8px]">
      <Icon size={14} aria-hidden="true" style={{ color: "var(--pv-faint)" }} />
      <span className="text-[13px] leading-[18px]" style={{ color: "var(--pv-body)" }}>
        {label}
      </span>
    </span>
  );
}
