"use client";

import * as React from "react";
import { Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageView {
  id: string;
  label: string;
  /** Pre-formatted, because these are seeded strings, not live sums. */
  count?: string;
  icon?: LucideIcon;
}

export interface ViewBarProps {
  views: PageView[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Omit to hide the + entirely — not every collection can be re-cut. */
  onCreate?: () => void;
  createLabel?: string;
  /** Names the set for screen readers: "Smart lists", "Pipelines", "Folders". */
  label: string;
  /**
   * Pinned to the far end of the row — for the one control that acts on the
   * lit view itself ("Customise list"), never for another view.
   */
  trailing?: React.ReactNode;
  /** Drops the rule under the row, for a bar that already sits on one. */
  noBorder?: boolean;
  /** `sm` for tabs inside a pane, where 300px is the whole budget. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Slot 06 of the page anatomy: saved views over one collection, as line tabs.
 *
 * Line tabs, not chips. Chips were the wrong object: a rounded outline with a
 * fill when lit is what this system uses for a filter token — something you
 * add and remove — so a row of them said "these stack" when only one can ever
 * be on. A tab strip with an underline says one-of-many and nothing else, and
 * it is the shape the design system already ships for exactly this.
 *
 * The narrowest definition of a tab in this prototype still holds: every tab
 * here re-cuts the SAME collection. A tab that leads to another object, an
 * action, or a settings screen is a nav item wearing a tab's clothes, and
 * belongs in the breadcrumb instead.
 */
export function ViewBar({
  views,
  activeId,
  onSelect,
  onCreate,
  createLabel = "Create view",
  label,
  trailing,
  noBorder,
  size = "md",
  className,
}: ViewBarProps) {
  const sm = size === "sm";
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex shrink-0 items-stretch gap-[2px] overflow-x-auto",
        sm ? "h-[34px]" : "h-[38px]",
        !noBorder && "border-b border-pg-head-border",
        className,
      )}
    >
      {views.map(({ id, label: viewLabel, count, icon: Icon }) => {
        const active = id === activeId;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(id)}
            /*
             * The indicator is drawn on the button, overlapping the row's
             * rule by 1px, so switching tabs moves 2px of colour and nothing
             * else — no border on the resting state means no reflow.
             */
            className={cn(
              "relative flex shrink-0 items-center gap-[6px] whitespace-nowrap motion-tap",
              sm ? "px-[9px] text-[13px]" : "px-[11px] text-[13.5px]",
              active
                ? "font-semibold text-brand"
                : "font-medium text-pg-muted hover:text-pg-text",
            )}
          >
            {Icon ? (
              <Icon
                size={sm ? 14 : 15}
                aria-hidden="true"
                className={cn("shrink-0", active ? "text-brand" : "text-pg-faint")}
              />
            ) : null}
            {viewLabel}
            {count ? (
              <span
                className={cn(
                  "flex h-[18px] shrink-0 items-center rounded-[5px] px-[5px] text-[11.5px] leading-none font-semibold tabular-nums",
                  active ? "bg-brand-soft text-brand" : "text-pg-faint",
                )}
              >
                {count}
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 -bottom-px h-[2px] rounded-full motion-move",
                active ? "bg-brand" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
      {onCreate ? (
        <button
          type="button"
          aria-label={createLabel}
          onClick={onCreate}
          className="flex shrink-0 items-center gap-[5px] px-[9px] text-[12.5px] leading-none font-medium text-brand motion-tap hover:brightness-110"
        >
          <Plus size={14} aria-hidden="true" />
          {createLabel}
        </button>
      ) : null}
      {trailing ? (
        <span className="ml-auto flex shrink-0 items-center pl-[8px]">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}
