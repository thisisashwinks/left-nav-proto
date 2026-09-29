"use client";

import * as React from "react";
import { Check, ChevronDown, Minus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The form controls the flow screens are built from — select, checkbox, text
 * input — at the HighRise sm height of 36px.
 *
 * The drawers already have 34px cousins in side-drawer.tsx; those stay as
 * they are because the drawers they serve are dense by design. The import
 * wizard and the filter builder are forms first, which is what the 36px
 * default is for.
 */

const FIELD =
  "h-[36px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]";
const FIELD_FOCUS =
  "focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none";

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        FIELD,
        FIELD_FOCUS,
        "placeholder:text-pg-faint disabled:bg-pg disabled:text-pg-muted",
        className,
      )}
    />
  );
}

export interface SelectOption {
  value: string;
  label: string;
  /** A second line or a trailing note — "Contact", a count. */
  hint?: string;
}

/**
 * A button that opens a menu of options.
 *
 * Hand-rolled like every other menu in this prototype: an absolutely
 * positioned card over a full-screen click-catcher. It grows a search field
 * past eight options, because the field pickers in the map step carry forty
 * and nobody scrolls forty.
 */
export function Select({
  value,
  options,
  onChange,
  placeholder = "Please select",
  disabled,
  className,
  menuClassName,
  leading,
  "aria-label": ariaLabel,
}: {
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  /** Sits before the value — a search glyph on filter bars. */
  leading?: React.ReactNode;
  "aria-label"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const current = options.find((o) => o.value === value);
  const searchable = options.length > 8;
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
    <div className={cn("relative min-w-0", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
        className={cn(
          FIELD,
          "flex items-center gap-[8px] text-left motion-tap",
          disabled
            ? "cursor-not-allowed bg-pg text-pg-muted"
            : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        {leading}
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            current ? "text-pg-text" : "text-pg-faint",
          )}
        >
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
            className={cn(
              "absolute top-[calc(100%+4px)] left-0 z-[61] flex max-h-[280px] w-full min-w-[200px] flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]",
              menuClassName,
            )}
          >
            {searchable ? (
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
                <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                  No matches
                </p>
              ) : null}
              {shown.map((o) => {
                const on = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                        on ? "font-medium text-pg-heading" : "text-pg-text",
                      )}
                    >
                      {o.label}
                    </span>
                    {o.hint ? (
                      <span className="shrink-0 text-[12px] leading-[16px] text-pg-faint">
                        {o.hint}
                      </span>
                    ) : null}
                    {on ? (
                      <Check size={14} aria-hidden="true" className="shrink-0 text-brand" />
                    ) : null}
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

/** A 16px checkbox. `mixed` draws the header's partial state. */
export function Checkbox({
  checked,
  mixed,
  onChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  mixed?: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Rendered beside the box, and clicking it toggles too. */
  label?: React.ReactNode;
  className?: string;
}) {
  const on = checked || mixed;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "flex shrink-0 items-center gap-[8px] text-left motion-tap",
        disabled ? "cursor-not-allowed opacity-50" : "",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
          on
            ? "bg-brand text-brand-fg"
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {mixed ? (
          <Minus size={11} strokeWidth={3} />
        ) : checked ? (
          <Check size={11} strokeWidth={3} />
        ) : null}
      </span>
      {label ? (
        <span className="text-[14px] leading-[20px] text-pg-text">{label}</span>
      ) : null}
    </button>
  );
}

/** The soft pill every status column in these flows uses. */
export function StatusTag({
  tone,
  children,
}: {
  tone: "success" | "brand" | "danger" | "neutral" | "warning";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-[4px] rounded-[6px] px-[8px] text-[12px] leading-none font-medium whitespace-nowrap",
        tone === "success" &&
          "bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] text-[var(--pg-status-paid-fg)]",
        tone === "brand" &&
          "bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] text-brand",
        tone === "danger" &&
          "bg-[color-mix(in_oklab,var(--hr-error-600)_12%,transparent)] text-[var(--pg-status-overdue-fg)]",
        tone === "warning" && "bg-[var(--pg-warn-bg)] text-[var(--pg-warn-fg)]",
        tone === "neutral" &&
          "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      {children}
    </span>
  );
}

/** The blue note block — "Bulk actions are performed over a period of time." */
export function InfoCallout({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-[10px] rounded-[8px] bg-[color-mix(in_oklab,var(--brand)_8%,var(--pg-surface))] px-[14px] py-[12px] text-[14px] leading-[20px] text-[var(--pg-status-sent-fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_22%,transparent)]">
      {icon ? <span className="mt-[2px] shrink-0">{icon}</span> : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** A 36×20 switch — Auto-save, "Visible on card". */
export function Toggle({
  checked,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[20px] w-[36px] shrink-0 items-center rounded-full motion-tap",
        checked ? "bg-brand" : "bg-[var(--pg-border-strong)]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[2px] left-[2px] size-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.12)] transition-transform duration-150",
          checked && "translate-x-[16px]",
        )}
      />
    </button>
  );
}
