"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one right-hand drawer, in the Ask AI shape.
 *
 * Every panel that arrives from the right — a record peeked at beside its
 * list, a form, a field picker — is the same object: a card that floats clear
 * of the page on three sides and keeps the 12px radius the rest of the
 * furniture uses. Floating rather than flush is the whole tell. A flush panel
 * reads as a fourth pane of the page and competes with it; a card with air
 * around it reads as something laid ON the page, which is what it is, and
 * which is why the page behind stays legible and clickable.
 *
 * No scrim, for the same reason: these drawers are for working alongside the
 * thing that opened them.
 */
export function SideDrawer({
  title,
  subtitle,
  lead,
  trailing,
  width = 380,
  /**
   * Sit in the layout as a column instead of floating over it. Same card, same
   * radius — a page already built out of side-by-side panes (the inbox) wants
   * the panel to BE one of them rather than to cover one.
   */
  inline = false,
  onClose,
  footer,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Sits before the title — a back arrow, an avatar. */
  lead?: React.ReactNode;
  /** Sits after the title, before the close button — a pager, a link. */
  trailing?: React.ReactNode;
  width?: number;
  inline?: boolean;
  onClose?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  React.useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      role="dialog"
      aria-label={typeof title === "string" ? title : "Panel"}
      style={{ width }}
      className={cn(
        "motion-slot-in flex flex-col overflow-hidden rounded-[12px] bg-pg-surface",
        inline
          ? "min-h-0 shrink-0 shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
          : /*
             * Fixed to the VIEWPORT, not to the page container.
             *
             * Anchored to the page it inherited that container's offset and
             * started below the app bar, leaving a band of chrome showing
             * above it — which is exactly what a full-height panel must not
             * do. Fixed, it runs the whole window with an 8px cap on three
             * sides, so nothing sits above it and the card still reads as
             * laid ON the app rather than welded to its edge.
             */
            "fixed top-[8px] right-[8px] bottom-[8px] z-[80] shadow-[0_12px_32px_-8px_rgba(15,23,42,0.22),0_0_0_1px_var(--pg-card-border)]",
        className,
      )}
    >
      {title || lead || onClose ? (
        <div className="flex shrink-0 items-center gap-[9px] border-b border-pg-head-border px-[14px] py-[11px]">
          {lead}
          <div className="flex min-w-0 flex-1 flex-col">
            {typeof title === "string" ? (
              <span className="truncate text-[14px] leading-[18px] font-semibold text-pg-heading">
                {title}
              </span>
            ) : (
              title
            )}
            {subtitle ? (
              <span className="truncate text-[12px] leading-[16px] text-pg-muted">
                {subtitle}
              </span>
            ) : null}
          </div>
          {trailing}
          {onClose ? (
            <button
              type="button"
              aria-label="Close panel"
              onClick={onClose}
              className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted motion-tap hover:bg-pg-bg hover:text-pg-text active:scale-90"
            >
              <X size={15} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={cn("min-h-0 flex-1 overflow-auto px-[14px]", bodyClassName)}>
        {children}
      </div>

      {footer ? (
        <div className="flex shrink-0 items-center gap-[8px] border-t border-pg-head-border px-[14px] py-[11px]">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

/** The label/control pair every drawer form is built out of. */
export function DrawerField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-[4px] py-[7px]">
      <span className="text-[12.5px] leading-[16px] font-medium text-pg-text-strong">
        {label}
        {required ? <span className="text-pg-danger"> *</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="text-[12px] leading-[16px] text-pg-faint">{hint}</span>
      ) : null}
    </label>
  );
}

/** A text input sized to the 36px control height the system uses. */
export function DrawerInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={cn(
        "h-[34px] w-full rounded-[8px] bg-pg-surface px-[10px] text-[13px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none",
        props.className,
      )}
    />
  );
}

/** A select-shaped control. Inert on purpose — the data here is fixed. */
export function DrawerSelect({
  placeholder,
  value,
}: {
  placeholder: string;
  value?: string;
}) {
  return (
    <button
      type="button"
      className="flex h-[34px] w-full items-center justify-between rounded-[8px] bg-pg-surface px-[10px] text-[13px] leading-[normal] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
    >
      <span className={value ? "text-pg-text" : "text-pg-faint"}>
        {value ?? placeholder}
      </span>
      <span aria-hidden="true" className="text-[11px] text-pg-faint">
        ▾
      </span>
    </button>
  );
}

/** A checkbox row, the shape the DND and channel lists repeat. */
export function DrawerCheckRow({
  label,
  icon,
  checked,
  onToggle,
  trailing,
}: {
  label: string;
  icon?: React.ReactNode;
  checked: boolean;
  onToggle: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-[9px] py-[7px] text-left motion-tap"
    >
      {icon ? <span className="shrink-0 text-pg-muted">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-text">
        {label}
      </span>
      {trailing}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[16px] shrink-0 items-center justify-center rounded-[4px] motion-tap",
          checked
            ? "bg-brand text-brand-fg"
            : "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {checked ? (
          <svg viewBox="0 0 12 12" className="size-[10px] fill-none stroke-current stroke-[2]">
            <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    </button>
  );
}
