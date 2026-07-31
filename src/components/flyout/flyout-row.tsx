"use client";

import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { cn } from "@/lib/utils";
import type { FlyoutItem, FlyoutItemVariant } from "./types";

/**
 * Per-variant geometry, read off the Pencil export. The differences are small
 * but real — gap, vertical alignment, icon size, and title weight all shift
 * between the product panels and the Favorites/Recent/Quick Actions panels.
 */
const VARIANT = {
  product: {
    row: "gap-[10px] px-[8px] py-[9px] items-start",
    iconBox: "w-[24px] h-[22px]",
    iconSize: 20,
    text: "gap-[2px]",
    title: "font-semibold whitespace-nowrap",
    desc: "text-[12.5px] leading-[17px] w-full",
  },
  compact: {
    row: "gap-[11px] px-[8px] py-[9px] items-center",
    iconBox: "w-[24px] h-[22px]",
    iconSize: 19,
    text: "gap-[1px]",
    title: "font-semibold whitespace-nowrap",
    desc: "text-[12.5px] leading-[normal] whitespace-nowrap",
  },
  recent: {
    row: "gap-[11px] p-[8px] items-center",
    iconBox: "w-[26px] h-[22px]",
    iconSize: 19,
    text: "gap-[1px]",
    title: "font-medium whitespace-nowrap",
    desc: "text-[12px] leading-[normal] whitespace-nowrap",
  },
  action: {
    row: "gap-[10px] px-[8px] py-[9px] items-center",
    iconBox: "w-[24px] h-[22px]",
    iconSize: 20,
    text: "gap-[2px]",
    title: "font-semibold whitespace-nowrap",
    desc: "text-[12.5px] leading-[17px] w-full",
  },
} as const satisfies Record<FlyoutItemVariant, unknown>;

interface FlyoutRowProps {
  item: FlyoutItem;
  variant: FlyoutItemVariant;
  active?: boolean;
  onSelect?: (id: string) => void;
}

export function FlyoutRow({
  item,
  variant,
  active = false,
  onSelect,
}: FlyoutRowProps) {
  const v = VARIANT[variant];
  const Icon = item.icon;

  return (
    <button
      type="button"
      aria-current={active ? "true" : undefined}
      onClick={() => onSelect?.(item.id)}
      className={cn(
        "group flex w-full shrink-0 rounded-[9px] text-left",
        v.row,
        active ? "bg-nav-hover" : "hover:bg-nav-hover",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
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
          <Icon size={v.iconSize} aria-hidden="true" />
        ) : null}
      </div>

      <div className={cn("flex h-fit flex-1 flex-col items-start", v.text)}>
        <div className="flex w-full shrink-0 items-center gap-[7px]">
          <span
            className={cn("text-[14px] leading-[normal] text-nav-fg", v.title)}
          >
            {item.label}
          </span>
          {item.badge ? (
            <span className="shrink-0 rounded-[2px] bg-[linear-gradient(-53.271deg,var(--fly-badge-from)_20.741%,var(--fly-badge-to)_61.206%)] px-[4px] py-[2px] text-[10px] leading-[normal] font-semibold whitespace-nowrap text-fly-badge-fg shadow-[0_2px_4px_0_#00000014]">
              {item.badge}
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
}
