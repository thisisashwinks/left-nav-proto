"use client";

import type * as React from "react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { WithPin } from "@/components/nav/with-pin";
import { productById } from "@/components/nav/catalogue";
import { cn } from "@/lib/utils";
import type { FlyoutBadgeTone, FlyoutItem, FlyoutItemVariant } from "./types";

/** Same gradient angle and stops in both tones; only the ramp differs. */
const BADGE_TONE: Record<FlyoutBadgeTone, string> = {
  new: "bg-[linear-gradient(-53.271deg,var(--fly-badge-from)_20.741%,var(--fly-badge-to)_61.206%)] text-fly-badge-fg",
  beta: "bg-[linear-gradient(-53.271deg,var(--fly-badge-beta-from)_20.741%,var(--fly-badge-beta-to)_61.206%)] text-fly-badge-beta-fg",
};

/**
 * Per-variant geometry, read off the Pencil export. The differences are small
 * but real — gap, vertical alignment, icon size, and title weight all shift
 * between the product panels and the Favorites/Recent/Quick Actions panels.
 */
const VARIANT = {
  product: {
    row: "gap-[var(--t-fly-gap,10px)] px-[8px] py-[var(--t-fly-py,9px)] items-start",
    iconBox: "w-[24px] h-[22px]",
    iconSize: 20,
    text: "gap-[2px]",
    title: "font-semibold whitespace-nowrap",
    desc: "text-[length:var(--t-fly-desc,12.5px)] leading-[17px] w-full",
    // Space held for the pin, which is no longer a flex child. Exactly the pin's
    // 22px plus the gap it used to sit behind, so the text wraps where it did.
    pinReserve: "pr-[calc(8px+22px+var(--t-fly-gap,10px))]",
    // items-start rows align the pin with the title, not the row's middle.
    pinTop: "top-[var(--t-fly-py,9px)]",
  },
  compact: {
    row: "gap-[calc(var(--t-fly-gap,10px)+1px)] px-[8px] py-[var(--t-fly-py,9px)] items-center",
    iconBox: "w-[24px] h-[22px]",
    iconSize: 19,
    text: "gap-[1px]",
    title: "font-semibold whitespace-nowrap",
    desc: "text-[length:var(--t-fly-desc,12.5px)] leading-[normal] whitespace-nowrap",
    pinReserve: "pr-[calc(8px+22px+var(--t-fly-gap,10px)+1px)]",
    pinTop: "top-1/2 -translate-y-1/2",
  },
  recent: {
    row: "gap-[11px] p-[8px] items-center",
    iconBox: "w-[26px] h-[22px]",
    iconSize: 19,
    text: "gap-[1px]",
    title: "font-medium whitespace-nowrap",
    desc: "text-[12px] leading-[normal] whitespace-nowrap",
    pinReserve: "pr-[41px]",
    pinTop: "top-1/2 -translate-y-1/2",
  },
  action: {
    row: "gap-[var(--t-fly-gap,10px)] px-[8px] py-[var(--t-fly-py,9px)] items-center",
    iconBox: "w-[24px] h-[22px]",
    iconSize: 20,
    text: "gap-[2px]",
    title: "font-semibold whitespace-nowrap",
    desc: "text-[length:var(--t-fly-desc,12.5px)] leading-[17px] w-full",
    pinReserve: "pr-[calc(8px+22px+var(--t-fly-gap,10px))]",
    pinTop: "top-1/2 -translate-y-1/2",
  },
} as const satisfies Record<FlyoutItemVariant, unknown>;

interface FlyoutRowProps {
  item: FlyoutItem;
  variant: FlyoutItemVariant;
  active?: boolean;
  /** Position in the stagger sequence when the panel opens. */
  rowIndex?: number;
  onSelect?: (id: string) => void;
}

export function FlyoutRow({
  item,
  variant,
  active = false,
  rowIndex = 0,
  onSelect,
}: FlyoutRowProps) {
  const v = VARIANT[variant];
  const Icon = item.icon;
  /** Only rows that map to a pinnable product get a pin. */
  const pinnable = productById(item.id) !== undefined;

  const row = (
    <button
      type="button"
      aria-current={active ? "true" : undefined}
      onClick={() => onSelect?.(item.id)}
      style={{ "--row-index": rowIndex } as React.CSSProperties}
      className={cn(
        "motion-row-in group group/row flex w-full shrink-0 rounded-[9px] text-left",
        "motion-tap",
        // v.row carries the per-variant gap, padding and alignment. Losing it
        // is what collapsed every flyout row's breathing room.
        v.row,
        // Replaces the padding the pin used to occupy as a flex child.
        pinnable && v.pinReserve,
        active ? "bg-nav-hover" : "hover:bg-nav-hover",
        "active:scale-[0.99] motion-press",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          // The icon leans in a touch on hover — enough to feel responsive
          // without shifting the text beside it.
          "motion-tap group-hover:scale-110",
          v.iconBox,
          active
            ? "text-nav-fg"
            : item.ai
              ? "text-nav-ai-icon"
              : "text-nav-fg-muted group-hover:text-nav-fg",
        )}
      >
        {item.ai ? (
          <NavAiSparkle />
        ) : Icon ? (
          <Icon
            size={v.iconSize}
            aria-hidden="true"
            style={{
              width: "var(--t-fly-icon, 20px)",
              height: "var(--t-fly-icon, 20px)",
            }}
          />
        ) : null}
      </div>

      <div className={cn("flex h-fit flex-1 flex-col items-start", v.text)}>
        <div className="flex w-full shrink-0 items-center gap-[7px]">
          <span
            className={cn(
              "text-[length:var(--t-fly-title,14px)] leading-[normal] text-nav-fg",
              v.title,
            )}
          >
            {item.label}
          </span>
          {item.badge ? (
            <span
              className={cn(
                "shrink-0 rounded-[2px] px-[4px] py-[2px] text-[10px] leading-[normal] font-semibold whitespace-nowrap shadow-[0_2px_4px_0_#00000014]",
                BADGE_TONE[item.badge.tone],
              )}
            >
              {item.badge.label}
            </span>
          ) : null}
        </div>

        {item.description ? (
          <span
            className={cn("text-left text-nav-fg-subtle font-normal", v.desc)}
          >
            {item.description}
          </span>
        ) : null}
      </div>

      {item.time ? (
        <span className="shrink-0 text-[12px] leading-[normal] whitespace-nowrap text-nav-fg-subtle">
          {item.time}
        </span>
      ) : null}
    </button>
  );

  return (
    <WithPin productId={item.id} pinClass={v.pinTop}>
      {row}
    </WithPin>
  );
}
