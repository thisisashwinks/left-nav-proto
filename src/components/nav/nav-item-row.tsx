"use client";

import { ChevronRight } from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { cn } from "@/lib/utils";
import type { NavItem } from "./types";

interface NavItemRowProps {
  item: NavItem;
  active?: boolean;
  onSelect?: () => void;
  /** Pointer entered — used to preview this row's flyout. */
  onHover?: () => void;
}

/**
 * One nav row. Geometry is taken from left-nav.pen:
 *   compact  padding 6px 8px   (recent rows)
 *   default  padding 9px 8px   (everything else)
 *   gap 10px, radius 7px, 16px leading icon, 15px trailing chevron
 */
export function NavItemRow({
  item,
  active = false,
  onSelect,
  onHover,
}: NavItemRowProps) {
  const Icon = item.icon;
  const compact = item.density === "compact";

  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onSelect}
      onPointerEnter={onHover}
      onFocus={onHover}
      className={cn(
        "group flex w-full shrink-0 items-center text-left",
        "gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)]",
        "motion-tap",
        // Compact rows keep their tighter padding proportionally.
        compact
          ? "py-[calc(var(--t-nav-py,9px)*0.667)]"
          : "py-[var(--t-nav-py,9px)]",
        active ? "bg-nav-hover" : "hover:bg-nav-hover active:bg-nav-active",
        "active:scale-[0.99] motion-press",
      )}
    >
      {item.ai ? (
        <NavAiSparkle className="text-nav-ai-icon" />
      ) : Icon ? (
        <Icon
          size={16}
          aria-hidden="true"
          style={{ width: "var(--t-nav-icon, 16px)", height: "var(--t-nav-icon, 16px)" }}
          className={cn(
            "shrink-0 motion-tap group-hover:scale-110",
            active ? "text-nav-fg" : "text-nav-fg-muted group-hover:text-nav-fg",
          )}
        />
      ) : null}

      <span
        className={cn(
          "text-[length:var(--t-nav-font,14px)] leading-[normal]",
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
          // Nudges toward the flyout it opens, which is the direction the panel
          // arrives from.
          className={cn(
            "shrink-0 motion-tap group-hover:translate-x-[2px]",
            active
              ? "translate-x-[2px] text-nav-fg-muted"
              : "text-nav-fg-subtle group-hover:text-nav-fg-muted",
          )}
        />
      ) : null}
    </button>
  );
}
