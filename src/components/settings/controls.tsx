"use client";

import * as React from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The Navigation tab's control kit.
 *
 * One deliberate departure from the prototype-controls panel: no sliders.
 * Every value here is one an agency reasons about as a number or a choice, so
 * it gets the input that says so — steppers with units, segmented choices —
 * and every control fits the page surface tokens, so the whole tab follows the
 * accent and page theme.
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
  disabled = false,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex rounded-[8px] bg-pg-bg p-[2px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
        // Matches Switch and Stepper, the two controls that already had this.
        disabled && "opacity-45",
      )}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={opt === value}
          // Really disabled, not `pointer-events-none` on a wrapper: a focusable
          // button behind that class is still tab-reachable and Enter-activatable,
          // so a keyboard user could change a locked setting.
          disabled={disabled}
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

/**
 * A dropdown, rather than the browser's.
 *
 * Same argument the nav's own `TemplatePicker` makes: a native `<select>` opens
 * the platform's list — the OS font, none of the page's theming, and on macOS it
 * lands on top of the chosen option rather than below the control. Every other
 * control on these pages is one the product drew; this one is too.
 *
 * Page-surface tokens rather than the nav's, which is the whole reason it is a
 * second component and not an import: the nav's picker is painted for a dark
 * sidebar and reads as a foreign object on a settings card.
 */
export function Picker<T extends string>({
  value,
  options,
  onChange,
  label,
  format,
  disabled = false,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
  format: (v: T) => string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative w-[200px]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "motion-tap flex h-[36px] w-full items-center gap-[8px] rounded-[8px] bg-pg-bg px-[11px] text-left text-[13px] leading-none text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
          disabled && "cursor-not-allowed opacity-45",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{format(value)}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-muted motion-move", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="motion-menu-in absolute top-[calc(100%+4px)] right-0 left-0 z-20 flex max-h-[220px] flex-col gap-[1px] overflow-y-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "motion-tap truncate rounded-[6px] px-[8px] py-[7px] text-left text-[13px] leading-[18px]",
                opt === value
                  ? "bg-pg-row-selected font-medium text-pg-heading"
                  : "text-pg-text hover:bg-pg-row-border",
              )}
            >
              {format(opt)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const CHIP_TONES = {
  inherit: "bg-pg-bg text-pg-muted",
  overridden: "bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] text-brand",
  /**
   * Outlined and quiet — deliberately the faintest tone in the set, because it
   * names something this account cannot have. It used to be byte-identical to
   * `inherit`, which already means "this is the shipped default" two cards over;
   * two meanings must not share one look.
   */
  locked:
    "bg-transparent text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)]",
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

/**
 * A monospace textarea, for the one setting whose value is code.
 *
 * Every autocorrect affordance is off: a browser that capitalises the first
 * letter of a CSS selector or curls a quote produces a stylesheet that silently
 * does nothing.
 */
export function CodeArea({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      placeholder={placeholder}
      disabled={disabled}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      className={cn(
        "min-h-[180px] w-full resize-y rounded-[8px] bg-pg-bg px-[11px] py-[9px] font-mono text-[12.5px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] outline-none placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1.5px_var(--brand)]",
        disabled && "opacity-60",
      )}
    />
  );
}
