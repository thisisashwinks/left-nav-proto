"use client";

import * as React from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CirclePlay,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlyoutActionRow } from "./flyout-action-row";
import type { FlyoutBottomSlot } from "./types";

/** Shared section label used inside the slot cards (10px, 0.4px tracking). */
function SlotLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full shrink-0 items-start pt-[4px] pr-[2px] pb-[5px] pl-[2px]">
      <span className="text-[10px] leading-[normal] font-semibold tracking-[0.4px] whitespace-nowrap text-nav-fg-subtle uppercase">
        {children}
      </span>
    </div>
  );
}

/** "Meet AI Employee" — the gradient promo card from the Engage panel. */
function FeaturedCard({
  slot,
}: {
  slot: Extract<FlyoutBottomSlot, { kind: "featured" }>;
}) {
  const Icon = slot.icon;
  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[8px] rounded-[10px] bg-[linear-gradient(-67.269deg,var(--fly-promo-from)_13.281%,var(--fly-promo-to)_77.336%)] p-[14px] shadow-[0_2px_4px_0_#00000014]">
      <div className="flex w-full shrink-0 items-center gap-[10px]">
        <Icon size={18} aria-hidden="true" className="shrink-0 text-fly-promo-icon" />
        <span className="text-[14px] leading-[normal] font-semibold whitespace-nowrap text-fly-promo-fg">
          {slot.title}
        </span>
      </div>
      <p className="w-full text-[12.5px] leading-[17px] text-fly-promo-body">
        {slot.body}
      </p>
      <button
        type="button"
        className="flex shrink-0 items-center gap-[6px] pt-[2px]"
      >
        <CirclePlay size={16} aria-hidden="true" className="shrink-0 text-fly-promo-icon" />
        <span className="text-[12.5px] leading-[normal] font-medium whitespace-nowrap text-fly-promo-fg">
          {slot.linkLabel}
        </span>
      </button>
    </div>
  );
}

/** "SEE IT WORK" — poster-frame video tile with a duration chip. */
function ShortLoopCard({
  slot,
}: {
  slot: Extract<FlyoutBottomSlot, { kind: "shortLoop" }>;
}) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[2px] rounded-[10px] bg-nav p-[10px] shadow-[0_8px_22px_0_#1018281a,inset_0_0_0_1px_var(--nav-divider)]">
      <SlotLabel>{slot.label}</SlotLabel>
      <div className="relative flex h-[158px] w-full shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-fly-tile shadow-[inset_0_0_0_1px_var(--nav-divider)]">
        <span className="flex size-[44px] items-center justify-center rounded-full bg-nav text-fly-accent shadow-[0_4px_12px_0_#10182833]">
          <Play size={20} aria-hidden="true" />
        </span>
        <span className="absolute right-[10px] bottom-[10px] rounded-[5px] bg-[var(--fly-duration-bg)] px-[7px] py-[3px] font-mono text-[10px] leading-[normal] font-medium text-white">
          {slot.duration}
        </span>
      </div>
      <div className="flex w-full shrink-0 flex-col items-start gap-[3px] pt-[9px] pr-[2px] pb-[2px] pl-[2px]">
        <span className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
          {slot.title}
        </span>
        <span className="w-full text-[11.5px] leading-[16px] text-nav-fg-subtle">
          {slot.caption}
        </span>
      </div>
    </div>
  );
}

/** "HELP WITH X" — scoped support questions plus an AI hand-off. */
function ContextualHelpCard({
  slot,
}: {
  slot: Extract<FlyoutBottomSlot, { kind: "contextualHelp" }>;
}) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[1px]">
      <SlotLabel>{slot.label}</SlotLabel>
      {slot.questions.map((q) => (
        <button
          key={q}
          type="button"
          className="flex w-full shrink-0 items-center gap-[9px] rounded-[7px] px-[8px] py-[7px] text-left hover:bg-nav-hover"
        >
          <CircleHelp size={15} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
          <span className="flex-1 text-[12.5px] leading-[normal] text-nav-fg-muted">
            {q}
          </span>
        </button>
      ))}
      <button
        type="button"
        className="flex w-full shrink-0 items-center gap-[9px] rounded-[7px] bg-fly-accent-soft p-[8px] text-left"
      >
        <Sparkles size={15} aria-hidden="true" className="shrink-0 text-fly-accent" />
        <span className="flex-1 text-[12.5px] leading-[normal] font-semibold text-fly-accent">
          {slot.askLabel}
        </span>
        <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-fly-accent" />
      </button>
    </div>
  );
}

/** Release-note callout, scoped to the group the panel belongs to. */
function WhatsNewCard({
  slot,
  onDismiss,
}: {
  slot: Extract<FlyoutBottomSlot, { kind: "whatsNew" }>;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[7px] rounded-[10px] bg-fly-accent-soft p-[12px]">
      <div className="flex w-full shrink-0 items-center gap-[8px]">
        <span className="shrink-0 rounded-full bg-nav px-[7px] py-[2px] text-[10px] leading-[normal] font-semibold tracking-[0.3px] whitespace-nowrap text-fly-accent">
          {slot.pill}
        </span>
        <span className="flex-1 text-[13px] leading-[normal] font-semibold text-fly-accent">
          {slot.title}
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="shrink-0 text-fly-accent"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="w-full text-[12.5px] leading-[18px] text-nav-fg-muted">
        {slot.body}
      </p>
      <button type="button" className="flex shrink-0 items-center gap-[6px]">
        <span className="text-[12.5px] leading-[normal] font-medium whitespace-nowrap text-fly-accent">
          {slot.linkLabel}
        </span>
        <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-fly-accent" />
      </button>
    </div>
  );
}

/**
 * Pages between any mix of the other slot kinds. Nested carousels are ignored
 * rather than flattened, so a config mistake degrades to "show nothing" instead
 * of recursing.
 */
function Carousel({
  slides,
  onSelect,
}: {
  slides: FlyoutBottomSlot[];
  onSelect?: (id: string) => void;
}) {
  const pages = slides.filter((s) => s.kind !== "carousel");
  const [index, setIndex] = React.useState(0);

  if (pages.length === 0) return null;
  const current = pages[Math.min(index, pages.length - 1)];

  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[8px]">
      <BottomSlot slot={current} onSelect={onSelect} />
      {pages.length > 1 ? (
        <div className="flex w-full shrink-0 items-center justify-between px-[2px]">
          <div className="flex items-center gap-[5px]">
            {pages.map((page, i) => (
              <button
                key={`${page.kind}-${i}`}
                type="button"
                aria-label={`Show ${page.kind} card`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                className={cn(
                  "size-[6px] rounded-full",
                  i === index ? "bg-fly-accent" : "bg-nav-divider",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-[2px]">
            <button
              type="button"
              aria-label="Previous card"
              onClick={() => setIndex((i) => (i - 1 + pages.length) % pages.length)}
              className="flex size-[20px] items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted"
            >
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next card"
              onClick={() => setIndex((i) => (i + 1) % pages.length)}
              className="flex size-[20px] items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted"
            >
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BottomSlot({
  slot,
  onSelect,
}: {
  slot: FlyoutBottomSlot;
  onSelect?: (id: string) => void;
}) {
  switch (slot.kind) {
    case "action":
      return <FlyoutActionRow row={slot.row} onSelect={onSelect} />;
    case "featured":
      return <FeaturedCard slot={slot} />;
    case "shortLoop":
      return <ShortLoopCard slot={slot} />;
    case "contextualHelp":
      return <ContextualHelpCard slot={slot} />;
    case "whatsNew":
      return <WhatsNewCard slot={slot} />;
    case "carousel":
      return <Carousel slides={slot.slides} onSelect={onSelect} />;
  }
}
