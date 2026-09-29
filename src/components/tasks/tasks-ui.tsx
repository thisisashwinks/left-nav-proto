"use client";

import * as React from "react";
import { Check, Search } from "lucide-react";
import { ToneAvatar } from "@/components/page/avatar";
import type { Teammate } from "@/components/product/conversations/conversations-data";
import { cn } from "@/lib/utils";

/** Small pieces the tasks page's popovers, drawer and table share. */

export const FIELD_BOX =
  "flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";

export const LABEL = "text-[14px] leading-[20px] font-medium text-pg-text-strong";

export const SECTION_HEAD = "px-[10px] pt-[6px] pb-[4px] text-[12px] leading-[16px] font-semibold text-pg-muted";

/** One selectable row. `multi` draws a checkbox instead of a trailing tick. */
export function OptionRow({
  selected,
  onClick,
  multi,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "flex h-[36px] w-full shrink-0 items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] motion-tap hover:bg-pg",
        selected && !multi ? "font-medium text-pg-heading" : "text-pg-text",
      )}
    >
      {multi ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
            selected ? "bg-brand text-brand-fg" : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          )}
        >
          {selected ? <Check size={11} strokeWidth={3} /> : null}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 items-center gap-[8px]">{children}</span>
      {selected && !multi ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
    </button>
  );
}

/** The search line at the top of a picker. */
export function PopoverSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
      <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
      />
    </div>
  );
}

export function PersonAvatar({ person, size = 24 }: { person: Teammate; size?: number }) {
  return <ToneAvatar name={person.name} initials={person.initials} tone={person.tone} size={size} round />;
}
