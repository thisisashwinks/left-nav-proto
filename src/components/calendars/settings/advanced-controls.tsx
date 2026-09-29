"use client";

import * as React from "react";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The few pieces the Advanced settings sections share beyond edit-controls:
 * the in-card rule and sub-heading, a radio pair, and a textarea with the
 * merge-tag glyph the live product puts in its bottom-right corner.
 */

export const TEXTAREA =
  "w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[10px] text-[14px] leading-[22px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] disabled:bg-pg disabled:text-pg-muted";

/** The full-width rule between groups inside a card. */
export function Divider() {
  return <hr className="border-0 border-t border-pg-head-border" />;
}

/** "Sticky contacts", "Guests" — a group's heading inside a card. */
export function SubHeading({
  children,
  description,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[2px]">
      <h3 className="text-[14px] leading-[20px] font-medium text-pg-heading">{children}</h3>
      {description ? (
        <p className="text-[13px] leading-[18px] text-pg-muted">{description}</p>
      ) : null}
    </div>
  );
}

/** A row of native radios, painted brand so the keyboard works for free. */
export function RadioRow<T extends string>({
  name,
  value,
  onChange,
  options,
  disabled,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap items-center gap-x-[24px] gap-y-[8px]">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "flex cursor-pointer items-center gap-[8px] text-[14px] leading-[20px] text-pg-text-strong",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            disabled={disabled}
            onChange={() => onChange(o.value)}
            className="size-[16px] cursor-pointer accent-[var(--brand)] disabled:cursor-not-allowed"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

const MERGE_TAGS: { tag: string; label: string }[] = [
  { tag: "{{contact.name}}", label: "Contact name" },
  { tag: "{{contact.first_name}}", label: "Contact first name" },
  { tag: "{{contact.email}}", label: "Contact email" },
  { tag: "{{contact.phone}}", label: "Contact phone" },
  { tag: "{{appointment.start_time}}", label: "Appointment start time" },
  { tag: "{{appointment.meeting_location}}", label: "Meeting location" },
  { tag: "{{reschedule_link}}", label: "Reschedule link" },
  { tag: "{{cancellation_link}}", label: "Cancellation link" },
  { tag: "{{contactMethod}}", label: "Contact method" },
];

/**
 * A textarea whose tag glyph opens the custom values menu; a pick is
 * inserted at the caret, not appended, so a tag can land mid-sentence.
 */
export function TagTextarea({
  value,
  onChange,
  rows = 4,
  placeholder,
  "aria-label": ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const insert = (tag: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + tag + value.slice(end));
    setOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(TEXTAREA, "block pr-[44px]")}
      />
      <button
        type="button"
        aria-label="Insert custom value"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "absolute right-[10px] bottom-[10px] flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading",
          open && "bg-pg text-pg-heading",
        )}
      >
        <Tag size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 bottom-[42px] z-30 flex max-h-[260px] w-[260px] flex-col overflow-y-auto rounded-[8px] bg-pg-surface py-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]"
        >
          <span className="px-[12px] pt-[6px] pb-[4px] text-[12px] leading-[16px] font-medium text-pg-muted">
            Custom values
          </span>
          {MERGE_TAGS.map((m) => (
            <button
              key={m.tag}
              type="button"
              role="menuitem"
              onClick={() => insert(m.tag)}
              className="flex flex-col items-start px-[12px] py-[6px] text-left hover:bg-pg focus-visible:bg-pg focus-visible:outline-none"
            >
              <span className="text-[14px] leading-[20px] text-pg-text-strong">{m.label}</span>
              <span className="text-[12px] leading-[16px] text-pg-muted">{m.tag}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
