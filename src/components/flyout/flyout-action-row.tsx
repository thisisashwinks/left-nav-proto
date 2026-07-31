"use client";

import { ArrowRight } from "lucide-react";
import type { FlyoutActionRow as FlyoutActionRowData } from "./types";

/**
 * The bordered card row used for "Explore Engage", "Manage favorites" and
 * "View all activity". Same geometry in all three places: padding 11px 12px,
 * 9px radius, 18px leading icon, two-line text, 16px trailing arrow.
 */
export function FlyoutActionRow({
  row,
  onSelect,
}: {
  row: FlyoutActionRowData;
  onSelect?: (id: string) => void;
}) {
  const Icon = row.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row.id)}
      className="group flex w-full shrink-0 items-center gap-[10px] rounded-[9px] bg-fly-card px-[12px] py-[11px] text-left shadow-[inset_0_0_0_1px_var(--nav-divider)] motion-tap hover:bg-nav-hover"
    >
      <Icon
        size={18}
        aria-hidden="true"
        className="shrink-0 text-nav-fg-muted motion-tap group-hover:scale-110"
      />
      <span className="flex h-fit flex-1 flex-col items-start gap-[1px]">
        <span className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
          {row.title}
        </span>
        <span className="text-[12px] leading-[normal] whitespace-nowrap text-nav-fg-subtle">
          {row.subtitle}
        </span>
      </span>
      <ArrowRight
        size={16}
        aria-hidden="true"
        className="shrink-0 text-nav-fg-subtle motion-tap group-hover:translate-x-[3px] group-hover:text-nav-fg-muted"
      />
    </button>
  );
}
