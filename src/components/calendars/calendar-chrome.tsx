"use client";

import * as React from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The handful of controls the four Calendar screens share.
 *
 * Kept here rather than in `page/` because none of them has a second caller
 * yet. A control that exists once is a page's own detail; promoting it to the
 * shared kit before a second page asks for it is how `page/` fills up with
 * things nobody reuses — and the kit is the one folder in this prototype whose
 * value depends entirely on everything in it being load-bearing.
 *
 * The one thing NOT here is a real menu. Every `▾` on these screens is a
 * static affordance: the screens exist to be judged as Calendar screens, and a
 * working dropdown on `Week view` would have to make the week grid re-render
 * as a day, which is date maths this task explicitly does not want.
 */

/** 34px outlined control with a caret — every `▾` select on these screens. */
export function SelectButton({
  label,
  value,
  icon: Icon,
  onClick,
  className,
}: {
  /** Screen-reader name, when `value` alone does not say what is being picked. */
  label?: string;
  value: string;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="listbox"
      onClick={onClick}
      className={cn(
        "motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
        "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]",
        className,
      )}
    >
      {Icon ? (
        <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-text-strong" />
      ) : null}
      {value}
      <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
    </button>
  );
}

/**
 * A square icon-only button, for the row actions and the toolbar glyphs.
 *
 * `title` as well as `aria-label` on purpose: the calendar list's action
 * column is four unlabelled glyphs in a row, and a sighted operator needs the
 * same affordance the screen reader gets. The live product ships them bare and
 * that is the complaint the row exists to reproduce, not to inherit.
 */
export function GlyphButton({
  icon: Icon,
  label,
  size = 30,
  tone = "muted",
  onClick,
  className,
}: {
  icon: LucideIcon;
  label: string;
  size?: number;
  tone?: "muted" | "text";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={cn(
        "motion-tap flex shrink-0 items-center justify-center rounded-[7px] hover:bg-pg-bg hover:text-pg-heading active:scale-95",
        tone === "muted" ? "text-pg-faint" : "text-pg-text-strong",
        className,
      )}
    >
      <Icon size={Math.round(size * 0.52)} aria-hidden="true" />
    </button>
  );
}

/**
 * The panel's own toggle.
 *
 * Deliberately not `settings/controls.tsx`'s Switch, which is byte-similar:
 * that kit belongs to the agency Navigation tab and is documented as the
 * prototype-controls' anti-slider counterpart. Reaching into it from a product
 * page would make a calendar filter panel a dependent of the agency settings
 * screen, and the next person to restyle that kit would silently restyle this.
 */
export function PanelToggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "motion-tap flex h-[20px] w-[34px] shrink-0 items-center rounded-full px-[2px]",
        on ? "justify-end bg-brand" : "justify-start bg-pg-border-strong",
      )}
    >
      <span className="size-[16px] rounded-full bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.25)]" />
    </button>
  );
}

/** A 16px box that fills with the brand when checked. */
export function CheckBox({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
        on
          ? "bg-brand text-brand-fg"
          : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      {on ? <Check size={11} strokeWidth={3} /> : null}
    </span>
  );
}

/** A 16px ring with a brand dot when selected. */
export function RadioDot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-[16px] shrink-0 items-center justify-center rounded-full",
        on
          ? "shadow-[inset_0_0_0_5px_var(--brand)]"
          : "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    />
  );
}

/**
 * A collapsible block in the Manage view panel.
 *
 * Open by default and collapsible rather than the other way round: the panel's
 * three blocks are the filter, and a filter panel that opens with everything
 * shut makes you click three times to find out it is empty. Collapse is for
 * the operator who has 302 users and wants Users out of the way.
 */
export function PanelSection({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-pg-row-border py-[8px] first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="motion-tap flex w-full items-center gap-[6px] rounded-[7px] px-[2px] py-[6px] text-left hover:text-pg-heading"
      >
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn(
            "shrink-0 text-pg-faint motion-move",
            open ? "" : "-rotate-90",
          )}
        />
        <span className="flex-1 text-[13px] leading-[18px] font-semibold text-pg-heading">
          {title}
        </span>
        {count ? (
          <span className="text-[12px] leading-[16px] text-pg-faint">{count}</span>
        ) : null}
      </button>
      {open ? <div className="flex flex-col pt-[2px]">{children}</div> : null}
    </section>
  );
}
