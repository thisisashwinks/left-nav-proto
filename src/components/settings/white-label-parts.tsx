"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The pieces every White Label approach is drawn from.
 *
 * Lifted out of white-label-tab so the four approaches can each live in their
 * own file: they are alternatives to one another, not variations of one
 * layout, and keeping them apart is what lets a reader see one without the
 * other three around it.
 */

/** A section, with production's own header-left / card-right arrangement. */
export function Section({
  title,
  sub,
  tag,
  children,
  onSave,
  dirty = false,
  onCancel,
}: {
  title: string;
  sub: string;
  /**
   * A short status chip under the description.
   *
   * For saying what a section does NOT reach yet without spending a sentence
   * on it. A sentence appended to the description reads as part of what the
   * field is for and ages badly — it has to be edited out again the day the
   * support lands. A chip reads as a notice, sits apart from the copy, and
   * can simply be removed. Ashwin, Oct 9.
   */
  tag?: string;
  children: React.ReactNode;
  onSave?: () => void;
  dirty?: boolean;
  onCancel?: () => void;
}) {
  return (
    <section className="flex flex-col gap-[12px] border-t border-pg-border pt-[20px] md:flex-row md:gap-[24px]">
      <header className="shrink-0 md:w-[224px] md:pt-[2px]">
        <h3 className="text-[14px] leading-[20px] font-medium text-pg-heading">
          {title}
        </h3>
        <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
          {sub}
        </p>
        {tag ? (
          <span className="mt-[8px] inline-flex items-center rounded-[4px] bg-brand-soft px-[6px] py-[2px] text-[11px] leading-[16px] font-medium whitespace-nowrap text-brand">
            {tag}
          </span>
        ) : null}
      </header>

      <div className="min-w-0 flex-1 rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <div className="p-[16px]">{children}</div>
        {onSave ? (
          <footer className="flex justify-end gap-[12px] border-t border-pg-border px-[16px] py-[12px]">
            <button
              type="button"
              onClick={onCancel}
              className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!dirty}
              className={cn(
                "motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-white active:scale-[0.98]",
                dirty
                  ? "bg-brand hover:brightness-95"
                  : "cursor-not-allowed bg-brand opacity-50",
              )}
            >
              Save changes
            </button>
          </footer>
        ) : null}
      </div>
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-[4px]">
      <span className="text-[13px] leading-[18px] text-pg-text">{label}</span>
      <span className="flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
        {icon ? <span className="shrink-0 text-pg-faint">{icon}</span> : null}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-pg-text outline-none"
        />
      </span>
    </label>
  );
}

