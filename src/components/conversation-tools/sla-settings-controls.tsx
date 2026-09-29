"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { AnchoredPopover } from "@/components/contacts/associated-objects";
import { Checkbox } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import { SLA_UNITS, type SlaDuration, type SlaUnit } from "./sla-settings-data";

/* ─── Radio ─────────────────────────────────────────────────────────────── */

export function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-col gap-[8px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className="group flex w-fit items-center gap-[8px] text-left motion-tap disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-[16px] shrink-0 items-center justify-center rounded-full",
                on
                  ? "bg-brand"
                  : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)] group-hover:shadow-[inset_0_0_0_1px_var(--brand)]",
              )}
            >
              {on ? <span className="size-[6px] rounded-full bg-white" /> : null}
            </span>
            <span className="text-[14px] leading-[20px] text-pg-text">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Compact select ────────────────────────────────────────────────────── */

/**
 * A 36px select for the SLA grid — narrow, portalled so the table's overflow
 * never clips it, and scrolled to the current value when it opens (the value
 * list runs to 60).
 */
export function CompactSelect({
  value,
  options,
  onChange,
  disabled,
  placeholder = "--",
  className,
  "aria-label": ariaLabel,
}: {
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        aria-label={ariaLabel}
        onClick={(e) => {
          const el = e.currentTarget;
          setAnchor((a) => (a ? null : el));
        }}
        className={cn(
          "flex h-[36px] w-[88px] shrink-0 items-center gap-[6px] rounded-[8px] bg-pg-surface px-[10px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap",
          disabled
            ? "cursor-not-allowed bg-pg text-pg-faint"
            : "text-pg-text hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          anchor && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !current && "text-pg-faint")}>
          {disabled ? placeholder : (current?.label ?? placeholder)}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {anchor ? (
        <AnchoredPopover anchor={anchor} onClose={close} width={Math.max(anchor.offsetWidth, 112)} label={ariaLabel}>
          <div
            role="listbox"
            ref={(el) => {
              if (!el) return;
              const sel = el.querySelector<HTMLElement>('[aria-selected="true"]');
              if (sel) el.scrollTop = sel.offsetTop - el.clientHeight / 2 + sel.offsetHeight / 2;
            }}
            className="max-h-[240px] overflow-y-auto p-[4px]"
          >
            {options.map((o) => {
              const on = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(o.value);
                    close();
                  }}
                  className="flex h-[32px] w-full items-center gap-[8px] rounded-[6px] px-[10px] text-left motion-tap hover:bg-pg"
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                      on ? "font-medium text-pg-heading" : "text-pg-text",
                    )}
                  >
                    {o.label}
                  </span>
                  {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
                </button>
              );
            })}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

const VALUE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

/** Value + unit, side by side — one time cell of the SLA grid. */
export function DurationField({
  value,
  onChange,
  disabled,
  label,
}: {
  value: SlaDuration;
  onChange: (next: SlaDuration) => void;
  disabled?: boolean;
  /** "SMS SLA due soon" — prefixes both pickers' accessible names. */
  label: string;
}) {
  return (
    <div className="flex items-center gap-[8px]">
      <CompactSelect
        aria-label={`${label} value`}
        value={String(value.value)}
        options={VALUE_OPTIONS}
        disabled={disabled}
        onChange={(v) => onChange({ ...value, value: Number(v) })}
      />
      <CompactSelect
        aria-label={`${label} unit`}
        value={value.unit}
        options={SLA_UNITS}
        disabled={disabled}
        placeholder="Mins"
        className="w-[96px]"
        onChange={(v) => onChange({ ...value, unit: v as SlaUnit })}
      />
    </div>
  );
}

/* ─── Searchable multi-select ───────────────────────────────────────────── */

export function MultiPicker({
  items,
  selected,
  onChange,
  placeholder,
  noun,
  invalid,
}: {
  items: { id: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  /** "workflows" — used in the search placeholder and the empty state. */
  noun: string;
  invalid?: boolean;
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [query, setQuery] = React.useState("");
  const close = React.useCallback(() => setAnchor(null), []);
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  const picked = items.filter((i) => selected.includes(i.id));
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div className="flex max-w-[560px] flex-col gap-[4px]">
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        onClick={(e) => {
          const el = e.currentTarget;
          setQuery("");
          setAnchor((a) => (a ? null : el));
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          const el = e.currentTarget;
          setQuery("");
          setAnchor((a) => (a ? null : el));
        }}
        className={cn(
          "flex min-h-[36px] w-full cursor-pointer flex-wrap items-center gap-[6px] rounded-[8px] bg-pg-surface py-[5px] pr-[34px] pl-[10px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] relative",
          invalid && "shadow-[inset_0_0_0_1px_var(--hr-error-500)]",
          anchor && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        {picked.length === 0 ? (
          <span className="text-[14px] leading-[20px] text-pg-faint">{placeholder}</span>
        ) : (
          picked.map((p) => (
            <span
              key={p.id}
              className="inline-flex h-[24px] max-w-[240px] items-center gap-[4px] rounded-[6px] bg-pg pr-[4px] pl-[8px] text-[13px] leading-[18px] text-pg-text"
            >
              <span className="truncate">{p.label}</span>
              <button
                type="button"
                aria-label={`Remove ${p.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(p.id);
                }}
                className="flex size-[16px] shrink-0 items-center justify-center rounded-[4px] text-pg-faint hover:bg-pg-surface hover:text-pg-text"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="absolute top-1/2 right-[12px] -translate-y-1/2 text-pg-faint"
        />
      </div>

      {anchor ? (
        <AnchoredPopover anchor={anchor} onClose={close} width={anchor.offsetWidth} label={`Select ${noun}`}>
          <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[12px] py-[8px]">
            <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${noun}`}
              className="h-[20px] min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={() => onChange([])}
                className="shrink-0 text-[13px] leading-[18px] font-medium text-brand hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div role="listbox" aria-multiselectable="true" className="max-h-[260px] overflow-y-auto p-[4px]">
            {shown.length === 0 ? (
              <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                No {noun} match “{query.trim()}”.
              </p>
            ) : null}
            {shown.map((i) => {
              const on = selected.includes(i.id);
              return (
                <div
                  key={i.id}
                  role="option"
                  aria-selected={on}
                  className="flex min-h-[36px] items-center rounded-[6px] px-[10px] hover:bg-pg"
                >
                  <Checkbox
                    checked={on}
                    onChange={() => toggle(i.id)}
                    label={i.label}
                    className="w-full py-[8px]"
                  />
                </div>
              );
            })}
          </div>
        </AnchoredPopover>
      ) : null}
    </div>
  );
}
