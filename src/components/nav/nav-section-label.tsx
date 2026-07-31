"use client";

import { ChevronRight } from "lucide-react";

interface NavSectionLabelProps {
  text: string;
  /**
   * When set, the label becomes the trigger for a flyout. The Pencil file lays
   * this row out with space-between and no trailing element, so the chevron only
   * appears on hover — it adds an affordance without changing the resting design.
   */
  onOpen?: () => void;
}

/**
 * Section heading, e.g. "RECENT". Padding 2px 8px 6px 8px in the Pencil file,
 * 11px semibold with 0.4px tracking, always uppercased.
 */
export function NavSectionLabel({ text, onOpen }: NavSectionLabelProps) {
  const label = (
    // Explicit 13px line-height, not `normal`: as a flex item the span is
    // blockified and takes its 14px font box rather than the 13px line box
    // Pencil lays out, which would make the row 1px too tall.
    <span className="text-[11px] leading-[13px] font-semibold tracking-[0.4px] whitespace-nowrap text-nav-fg-subtle uppercase">
      {text}
    </span>
  );

  if (!onOpen) {
    return (
      <div className="flex w-full shrink-0 items-start justify-between pt-[2px] pr-[8px] pb-[6px] pl-[8px]">
        {label}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full shrink-0 items-start justify-between pt-[2px] pr-[8px] pb-[6px] pl-[8px] text-left"
    >
      {label}
      <ChevronRight
        size={13}
        aria-hidden="true"
        className="shrink-0 text-nav-fg-subtle opacity-0 group-hover:opacity-100"
      />
    </button>
  );
}
