"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The customizer's control kit.
 *
 * One deliberate departure from the prototype-controls panel: no sliders.
 * Every value here is one a customer reasons about as a number or a choice,
 * so it gets the input that says so — steppers with units, segmented choices,
 * fields with an "Unlimited" rest state — and every control fits the page
 * surface tokens, so the whole screen follows the accent and page theme.
 */

export function Card({
  title,
  sub,
  children,
  aside,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="w-full rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <header className="flex items-start gap-[12px] px-[18px] pt-[15px] pb-[4px]">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
            {title}
          </h3>
          {sub ? (
            <p className="mt-[2px] text-[12px] leading-[17px] text-pg-muted">
              {sub}
            </p>
          ) : null}
        </div>
        {aside}
      </header>
      <div className="px-[18px] pt-[8px] pb-[16px]">{children}</div>
    </section>
  );
}

/** Label + description on the left, any control on the right. */
export function SettingRow({
  label,
  desc,
  children,
  last = false,
  indent = false,
}: {
  label: React.ReactNode;
  desc?: React.ReactNode;
  children?: React.ReactNode;
  last?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-[16px] py-[11px]",
        !last && "shadow-[inset_0_-1px_0_0_var(--pg-border)]",
        indent && "pl-[26px]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-[18px] font-medium text-pg-heading">
          {label}
        </div>
        {desc ? (
          <div className="mt-[1px] text-[12px] leading-[16px] text-pg-muted">
            {desc}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-[8px]">{children}</div>
    </div>
  );
}

export function Switch({
  on,
  onToggle,
  disabled = false,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "motion-tap flex h-[20px] w-[34px] shrink-0 items-center rounded-full px-[2px]",
        on ? "justify-end bg-brand" : "justify-start bg-pg-border-strong",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <span className="size-[16px] rounded-full bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.25)]" />
    </button>
  );
}

/** − value + with a unit, clamped. The anti-slider. */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  label: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const btn =
    "motion-tap flex size-[26px] items-center justify-center text-pg-muted hover:bg-pg-bg hover:text-pg-heading disabled:cursor-not-allowed disabled:opacity-35";
  return (
    <div
      className={cn(
        "flex h-[30px] items-center overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
        disabled && "opacity-45",
      )}
    >
      <button type="button" aria-label={`Decrease ${label}`} disabled={disabled || value <= min} onClick={() => onChange(clamp(value - step))} className={btn}>
        <Minus size={13} aria-hidden="true" />
      </button>
      <span className="min-w-[52px] px-[4px] text-center text-[12.5px] leading-none font-medium text-pg-heading tabular-nums">
        {value}
        {unit ? <span className="ml-[2px] text-[11px] font-normal text-pg-muted">{unit}</span> : null}
      </span>
      <button type="button" aria-label={`Increase ${label}`} disabled={disabled || value >= max} onClick={() => onChange(clamp(value + step))} className={btn}>
        <Plus size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
  format,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-[8px] bg-pg-bg p-[2px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={opt === value}
          onClick={() => onChange(opt)}
          className={cn(
            "motion-tap rounded-[6px] px-[10px] py-[5px] text-[12px] leading-none font-medium whitespace-nowrap",
            opt === value
              ? "bg-pg-surface text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border),0_1px_2px_0_rgba(15,23,42,0.06)]"
              : "text-pg-muted hover:text-pg-text",
          )}
        >
          {format ? format(opt) : opt}
        </button>
      ))}
    </div>
  );
}

/** Number field whose empty state reads as its policy ("Unlimited"). */
export function LimitField({
  value,
  onChange,
  placeholder,
  unit,
  disabled = false,
  label,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
  unit?: string;
  disabled?: boolean;
  label: string;
}) {
  return (
    <label
      className={cn(
        "flex h-[32px] w-[150px] items-center gap-[6px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]",
        disabled && "opacity-45",
      )}
    >
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        disabled={disabled}
        value={value === null ? "" : value.toLocaleString("en-US")}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          onChange(digits === "" ? null : Number(digits));
        }}
        className="min-w-0 flex-1 bg-transparent text-right text-[13px] leading-none text-pg-heading tabular-nums placeholder:text-pg-faint focus:outline-none"
      />
      {unit ? <span className="shrink-0 text-[11.5px] leading-none text-pg-muted">{unit}</span> : null}
    </label>
  );
}

export function SelectField<T extends string>({
  options,
  value,
  onChange,
  format,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-[32px] rounded-[8px] bg-pg-surface pr-[8px] pl-[10px] text-[12.5px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--brand)]"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {format ? format(opt) : opt}
        </option>
      ))}
    </select>
  );
}

const CHIP_TONES = {
  inherit: "bg-pg-bg text-pg-muted",
  overridden: "bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] text-brand",
  locked: "bg-pg-bg text-pg-muted",
  metered: "bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] text-brand",
} as const;

export function Chip({
  tone,
  children,
}: {
  tone: keyof typeof CHIP_TONES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-[5px] px-[6px] py-[3px] text-[10px] leading-none font-semibold whitespace-nowrap",
        CHIP_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Thin usage meter with a right-aligned readout. */
export function Meter({
  used,
  total,
  readout,
}: {
  used: number;
  total: number;
  readout: string;
}) {
  const pct = total <= 0 ? 0 : Math.min(100, Math.round((used / total) * 100));
  return (
    <div className="flex w-full items-center gap-[10px]">
      <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-[11.5px] leading-none text-pg-muted tabular-nums">
        {readout}
      </span>
    </div>
  );
}
