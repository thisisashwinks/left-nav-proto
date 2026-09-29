"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { AnchoredPopover } from "@/components/contacts/associated-objects";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  leading?: React.ReactNode;
}

/**
 * A 36px filter select whose menu is portalled.
 *
 * The shared Select opens an absolute card, and the filter row sits inside
 * a card that clips — so this one hangs its menu off AnchoredPopover instead.
 * `allLabel` adds a first row that clears the value back to the placeholder,
 * which is how "Select workflow" goes back to meaning every workflow.
 */
export function FilterSelect({
  value,
  options,
  onChange,
  placeholder,
  allLabel,
  searchable = false,
  className,
  "aria-label": ariaLabel,
}: {
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  placeholder: string;
  allLabel?: string;
  searchable?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = React.useState<{ anchor: HTMLElement; width: number } | null>(null);
  const [query, setQuery] = React.useState("");
  const close = React.useCallback(() => setOpen(null), []);
  const current = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  const pick = (v: string | null) => {
    onChange(v);
    setOpen(null);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open != null}
        aria-label={ariaLabel}
        onClick={(e) => {
          if (open) return setOpen(null);
          setQuery("");
          setOpen({ anchor: e.currentTarget, width: e.currentTarget.offsetWidth });
        }}
        className={cn(
          "motion-tap flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] hover:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          className,
        )}
      >
        {searchable ? <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" /> : null}
        <span className={cn("min-w-0 flex-1 truncate", current ? "text-pg-text" : "text-pg-faint")}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {open ? (
        <AnchoredPopover anchor={open.anchor} onClose={close} width={Math.max(open.width, 220)} label={placeholder}>
          {searchable ? (
            <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
              <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search options"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>
          ) : null}
          <div role="listbox" className="max-h-[260px] overflow-y-auto p-[4px]">
            {allLabel && !q ? (
              <OptionRow label={allLabel} on={value == null} onClick={() => pick(null)} />
            ) : null}
            {shown.length === 0 ? (
              <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No matches</p>
            ) : null}
            {shown.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                leading={o.leading}
                on={o.value === value}
                onClick={() => pick(o.value)}
              />
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function OptionRow({
  label,
  leading,
  on,
  onClick,
}: {
  label: string;
  leading?: React.ReactNode;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={on}
      onClick={onClick}
      className="motion-tap flex h-[36px] w-full items-center gap-[8px] rounded-[6px] px-[10px] text-left hover:bg-pg"
    >
      {leading}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
          on ? "font-medium text-pg-heading" : "text-pg-text",
        )}
      >
        {label}
      </span>
      {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
    </button>
  );
}
