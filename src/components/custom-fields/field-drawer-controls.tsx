"use client";

import * as React from "react";
import { Check, ChevronDown, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The small pieces the custom-field drawer is built from: a label row, an
 * info tip, inputs and textareas that carry their own character count, and a
 * select whose options can be disabled with a reason.
 *
 * The shared Select in form-controls has no disabled options, and editing a
 * field needs them — a Number field may become Monetary but not Checkbox —
 * so the type picker gets its own menu in the same shape.
 */

export const FIELD_BOX =
  "w-full rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none disabled:bg-pg disabled:text-pg-muted";

/** A hover/focus bubble on a 14px info glyph. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="flex text-pg-faint motion-tap hover:text-pg-muted focus-visible:text-pg-muted focus-visible:outline-none"
      >
        <Info size={14} aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[70] w-max max-w-[260px] -translate-x-1/2 rounded-[6px] bg-pg-overlay px-[10px] py-[6px] text-[12px] leading-[16px] font-normal text-pg-surface opacity-0 shadow-[0_8px_24px_0_rgba(16,24,40,0.2)] transition-opacity duration-100 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

/** Label, required mark and optional tip — the 4px-above-the-control row. */
export function FieldLabel({
  children,
  required,
  tip,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  tip?: string;
  htmlFor?: string;
}) {
  return (
    <div className="flex items-center gap-[6px]">
      <label htmlFor={htmlFor} className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
        {children}
        {required ? <span className="text-pg-danger"> *</span> : null}
      </label>
      {tip ? <InfoTip text={tip} /> : null}
    </div>
  );
}

/** A 13px line under a control — red for an error, grey for a hint. */
export function FieldNote({ tone = "hint", children }: { tone?: "hint" | "error"; children: React.ReactNode }) {
  return (
    <p className={cn("text-[13px] leading-[18px]", tone === "error" ? "text-pg-danger" : "text-pg-muted")}>
      {children}
    </p>
  );
}

/** A 36px input with its running length tucked inside on the right. */
export function CountedInput({
  value,
  onChange,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="relative">
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD_BOX, "h-[36px] pr-[44px]", className)}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[10px] -translate-y-1/2 text-[13px] leading-[18px] text-pg-faint tabular-nums"
      >
        {value.length}
      </span>
    </div>
  );
}

/** A resizable textarea with an "n / max" counter in its corner. */
export function CountedTextarea({
  value,
  onChange,
  max,
  rows = 3,
  className,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onChange?: (next: string) => void;
  max: number;
}) {
  return (
    <div className="relative">
      <textarea
        {...rest}
        rows={rows}
        maxLength={max}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={cn(FIELD_BOX, "block min-h-[92px] resize-y py-[8px] pb-[26px]", className)}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[10px] bottom-[8px] text-[13px] leading-[18px] text-pg-faint tabular-nums"
      >
        {value.length} / {max}
      </span>
    </div>
  );
}

export interface MenuOption {
  value: string;
  label: string;
  /** Set to disable the option; shown beside it as the reason. */
  disabledReason?: string;
}

/**
 * The shared Select's shape, plus disabled options. Searchable past eight
 * options, like the original, and Escape closes only the menu.
 */
export function MenuSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  disabled,
  id,
}: {
  value: string | null;
  options: MenuOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const current = options.find((o) => o.value === value);
  const shown = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  return (
    <div className="relative min-w-0">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
        className={cn(
          FIELD_BOX,
          "flex h-[36px] items-center gap-[8px] text-left motion-tap",
          disabled
            ? "cursor-not-allowed bg-pg text-pg-muted"
            : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", current ? "text-pg-text" : "text-pg-faint")}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close options"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default"
          />
          <div
            role="listbox"
            className="absolute top-[calc(100%+4px)] left-0 z-[61] flex max-h-[320px] w-full min-w-[220px] flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {options.length > 8 ? (
              <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
                <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
                />
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto p-[4px]">
              {shown.length === 0 ? (
                <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No matches</p>
              ) : null}
              {shown.map((o) => {
                const on = o.value === value;
                const off = Boolean(o.disabledReason);
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={on}
                    aria-disabled={off}
                    disabled={off}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap",
                      off ? "cursor-not-allowed" : "hover:bg-pg",
                    )}
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                        off ? "text-pg-faint" : on ? "font-medium text-pg-heading" : "text-pg-text",
                      )}
                    >
                      {o.label}
                    </span>
                    {o.disabledReason ? (
                      <span className="shrink-0 text-[12px] leading-[16px] text-pg-faint">{o.disabledReason}</span>
                    ) : null}
                    {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
