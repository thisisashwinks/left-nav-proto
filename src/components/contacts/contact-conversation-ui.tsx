"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The small pieces the conversation column's popovers and toolbars share.
 *
 * Popovers are hand-rolled like every other menu in this prototype: an
 * absolutely positioned card over a fixed full-screen click-catcher, so the
 * anchor stays in normal flow and nothing reflows when one opens.
 */

export const POP_CARD =
  "absolute z-[41] rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border),0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]";

export function Popover({
  open,
  onClose,
  className,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Placement — `bottom-full mb-[6px]` for the composer's upward menus. */
  className?: string;
  label: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[40] cursor-default"
      />
      <div role="menu" aria-label={label} className={cn(POP_CARD, className)}>
        {children}
      </div>
    </>
  );
}

/** A 36px menu row with an optional icon and a check for the current pick. */
export function MenuRow({
  icon: Icon,
  iconClassName,
  label,
  checked,
  onClick,
}: {
  icon?: LucideIcon;
  iconClassName?: string;
  label: string;
  checked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? "menuitem" : "menuitemradio"}
      aria-checked={checked}
      onClick={onClick}
      className={cn(
        "motion-tap flex h-[36px] w-full items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] hover:bg-pg",
        checked ? "bg-brand-soft text-brand" : "text-pg-text",
      )}
    >
      {Icon ? (
        <Icon size={16} aria-hidden="true" className={cn("shrink-0", iconClassName)} />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {checked ? <Check size={15} aria-hidden="true" className="shrink-0" /> : null}
    </button>
  );
}

/** A square icon button — the header's four controls and the toolbars'. */
export function IconBtn({
  icon: Icon,
  label,
  onClick,
  size = 32,
  iconSize = 18,
  active = false,
  className,
  children,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  size?: number;
  iconSize?: number;
  active?: boolean;
  className?: string;
  /** Trailing content — the ⌄ a menu trigger wears. */
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{ height: size, minWidth: size }}
      className={cn(
        "motion-tap relative flex shrink-0 items-center justify-center gap-[2px] rounded-[7px] px-[4px] hover:bg-pg active:scale-95",
        active ? "bg-pg text-pg-heading" : "text-pg-text-strong hover:text-pg-heading",
        className,
      )}
    >
      <Icon size={iconSize} aria-hidden="true" />
      {children}
    </button>
  );
}

/** `**bold**` inside otherwise plain text, newlines kept by the caller. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-pg-heading">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}
