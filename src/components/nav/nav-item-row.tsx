"use client";

import { ChevronRight } from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { cn } from "@/lib/utils";
import type { NavItem } from "./types";

interface NavItemRowProps {
  item: NavItem;
  active?: boolean;
  onSelect?: (id: string) => void;
}

/**
 * One nav row. Geometry is taken from left-nav.pen:
 *   compact  padding 6px 8px   (recent rows)
 *   default  padding 9px 8px   (everything else)
 *   gap 10px, radius 7px, 16px leading icon, 15px trailing chevron
 */
export function NavItemRow({ item, active = false, onSelect }: NavItemRowProps) {
  const Icon = item.icon;
  const compact = item.density === "compact";

  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={() => onSelect?.(item.id)}
      className={cn(
        "group flex w-full shrink-0 items-center gap-[10px] rounded-[7px] px-[8px] text-left",
        compact ? "py-[6px]" : "py-[9px]",
        active ? "bg-nav-hover" : "hover:bg-nav-hover active:bg-nav-active",
      )}
    >
      {item.ai ? (
        <NavAiSparkle className="text-nav-ai-icon" />
      ) : Icon ? (
        <Icon
          size={16}
          aria-hidden="true"
          className={cn(
            "shrink-0",
            active ? "text-nav-fg" : "text-nav-fg-muted group-hover:text-nav-fg",
          )}
        />
      ) : null}

      <span
        className={cn(
          "text-[14px] leading-[normal]",
          item.hasFlyout ? "flex-1" : "whitespace-nowrap",
          item.ai ? "text-nav-ai-fg" : "text-nav-fg",
        )}
      >
        {item.label}
      </span>

      {item.hasFlyout ? (
        <ChevronRight
          size={15}
          aria-hidden="true"
          className={cn(
            "shrink-0",
            active
              ? "text-nav-fg-muted"
              : "text-nav-fg-subtle group-hover:text-nav-fg-muted",
          )}
        />
      ) : null}
    </button>
  );
}
