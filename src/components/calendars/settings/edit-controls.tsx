"use client";

import * as React from "react";
import { ChevronDown, Info, Minus, Plus } from "lucide-react";
import { Toggle } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import type { CalendarDraft, TimeUnit } from "./cal-settings-store";

/**
 * The controls every section of the calendar builder is drawn from, shared
 * so Basic details and Widget appearance cannot drift apart: the section
 * card, a label with its ⓘ, a number-plus-unit pair, a switch row and a
 * stepper.
 */

/** What every builder section receives. */
export interface SectionProps {
  draft: CalendarDraft;
  patch: (p: Partial<CalendarDraft>) => void;
  /** Field-level errors from the last Save press, keyed by draft field. */
  errors?: Partial<Record<keyof CalendarDraft, string>>;
}

export const FIELD =
  "h-[36px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] disabled:bg-pg disabled:text-pg-muted";

export const FIELD_ERROR =
  "shadow-[inset_0_0_0_1px_var(--hr-error-500)] focus:shadow-[inset_0_0_0_1px_var(--hr-error-500),0_0_0_3px_color-mix(in_oklab,var(--hr-error-500)_18%,transparent)]";

/** The white card a section sits in: title, description, a rule, the body. */
export function SectionCard({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="flex flex-col rounded-[12px] bg-pg-surface px-[20px] pt-[18px] pb-[22px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
    >
      <div className="flex flex-col gap-[2px] border-b border-pg-head-border pb-[16px]">
        <h2 className="text-[16px] leading-[22px] font-medium text-pg-heading">{title}</h2>
        {description ? (
          <p className="text-[14px] leading-[20px] text-pg-muted">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-[20px] pt-[20px]">{children}</div>
    </section>
  );
}

/** The ⓘ after a label, with its explanation as a hover/focus tooltip. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex">
      <span
        tabIndex={0}
        aria-label={text}
        className="inline-flex text-pg-muted outline-none focus-visible:text-brand"
      >
        <Info size={14} aria-hidden="true" />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 w-max max-w-[260px] -translate-x-1/2 rounded-[6px] bg-[var(--hr-gray-900,#101828)] px-[8px] py-[6px] text-[12px] leading-[16px] font-normal text-white opacity-0 shadow-lg transition-opacity group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

/** Label (with optional ⓘ and required star) over a control, 6px apart. */
export function Field({
  label,
  info,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: React.ReactNode;
  info?: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-[6px]", className)}>
      <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
        {label}
        {required ? <span className="text-[var(--hr-error-600)]">*</span> : null}
        {info ? <InfoTip text={info} /> : null}
      </span>
      {children}
      {error ? (
        <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">{error}</span>
      ) : hint ? (
        <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span>
      ) : null}
    </div>
  );
}

const UNIT_LABEL: Record<TimeUnit, string> = {
  minutes: "Minutes",
  hours: "Hours",
  days: "Days",
  weeks: "Weeks",
};

/**
 * A number and its unit as one control — "30 | Minutes ▾".
 *
 * The unit is a native select dressed as the HighRise one: it never clips
 * inside a scrolling card and the keyboard works for free.
 */
export function UnitField({
  value,
  onChange,
  unit,
  onUnitChange,
  units = ["minutes", "hours", "days"],
  placeholder,
  className,
  "aria-label": ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  unit: TimeUnit;
  onUnitChange: (u: TimeUnit) => void;
  units?: TimeUnit[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[36px] w-full items-stretch overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        className,
      )}
    >
      <input
        type="number"
        min={0}
        inputMode="numeric"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
        className="min-w-0 flex-1 bg-transparent px-[12px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <label className="relative flex w-[42%] max-w-[156px] shrink-0 items-center border-l border-pg-border">
        <select
          value={unit}
          aria-label={ariaLabel ? `${ariaLabel} unit` : "Unit"}
          onChange={(e) => onUnitChange(e.target.value as TimeUnit)}
          className="h-full w-full cursor-pointer appearance-none bg-transparent pr-[30px] pl-[12px] text-[14px] leading-[20px] text-pg-text focus:outline-none"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {UNIT_LABEL[u]}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute right-[10px] text-pg-faint"
        />
      </label>
    </div>
  );
}

/** A native select at 36px, for the plain dropdowns (Group, Select form). */
export function PlainSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: {
  value: string | null;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <label className={cn("relative flex w-full items-center", className)}>
      <select
        value={value ?? ""}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD, "cursor-pointer appearance-none pr-[34px]", !value && "text-pg-faint")}
      >
        {placeholder !== undefined ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute right-[12px] text-pg-faint"
      />
    </label>
  );
}

/** A switch with its label (and ⓘ) to the right, and an optional hint below. */
export function SwitchRow({
  checked,
  onChange,
  label,
  info,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  info?: string;
  hint?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center gap-[10px]">
        <Toggle
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-label={typeof label === "string" ? label : undefined}
        />
        <span className="text-[14px] leading-[20px] text-pg-text-strong">{label}</span>
        {info ? <InfoTip text={info} /> : null}
      </div>
      {hint ? (
        <p className="pl-[46px] text-[13px] leading-[18px] text-pg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** A number with − and + at its right edge — Maximum bookings per slot. */
export function Stepper({
  value,
  onChange,
  min = 0,
  placeholder,
  "aria-label": ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const step = (d: number) => onChange(Math.max(min, (value ?? min - (d > 0 ? 1 : 0)) + d));
  return (
    <div className="flex h-[36px] w-full items-center rounded-[8px] bg-pg-surface pr-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
      <input
        type="number"
        min={min}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Math.max(min, Number(e.target.value)))
        }
        className="min-w-0 flex-1 bg-transparent px-[12px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {[
        { d: -1, icon: Minus, label: "Decrease" },
        { d: 1, icon: Plus, label: "Increase" },
      ].map(({ d, icon: Icon, label }) => (
        <button
          key={label}
          type="button"
          aria-label={ariaLabel ? `${label} ${ariaLabel.toLowerCase()}` : label}
          disabled={d < 0 && (value ?? min) <= min}
          onClick={() => step(d)}
          className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading disabled:opacity-40"
        >
          <Icon size={14} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
