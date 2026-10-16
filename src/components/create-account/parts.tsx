"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import type { StartOption } from "./flow-data";

/**
 * The pieces every screen of the Create sub-account flow shares.
 *
 * Kept beside the flow rather than promoted to `page/`: the flow's dialogs are
 * the 1360px wizard shape from the Figma, not the 480px confirm `Modal` the rest
 * of the prototype opens, and the two should not be mistaken for each other.
 */

/* ─── Buttons ───────────────────────────────────────────────────────────── */

export function FlowButton({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  /** md is the 36px HighRise default; sm is the 32px footer button. */
  size?: "md" | "sm";
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "motion-tap flex shrink-0 items-center justify-center gap-[8px] font-semibold whitespace-nowrap active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        size === "md"
          ? "h-[36px] rounded-[8px] px-[14px] text-[14px] leading-[20px]"
          : "h-[32px] rounded-[4px] px-[10px] text-[13px] leading-[18px]",
        variant === "primary"
          ? "bg-brand text-brand-fg shadow-[inset_0_0_0_1px_var(--brand)] hover:bg-brand-strong"
          : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_2px_rgba(16,24,40,0.05)] hover:bg-pg",
        className,
      )}
    />
  );
}

/* ─── SaaS / Regular ────────────────────────────────────────────────────── */

export type AccountKind = "saas" | "regular";

/** The HighRise segmented tabs, 251px, top-right of both dialogs. */
export function AccountKindTabs({
  value,
  onChange,
}: {
  value: AccountKind;
  onChange: (kind: AccountKind) => void;
}) {
  const options: { id: AccountKind; label: string }[] = [
    { id: "saas", label: "Saas Account" },
    { id: "regular", label: "Regular Account" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Account type"
      className="flex shrink-0 items-center gap-[6px] rounded-[4px] bg-pg p-[4px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={cn(
              "motion-tap flex h-[32px] items-center justify-center rounded-[4px] px-[8px] text-[14px] leading-[20px] whitespace-nowrap",
              on
                ? "bg-pg-surface font-semibold text-brand shadow-[0_1px_3px_rgba(16,24,40,0.1),0_1px_2px_rgba(16,24,40,0.06)]"
                : "font-medium text-pg-text-strong hover:text-pg-heading",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Illustration crops ────────────────────────────────────────────────── */

/**
 * The 56px illustration tile on an option card.
 *
 * Each illustration is cropped into the tile exactly as the Figma crops it —
 * an offset box, and for the PNG sheets a second offset inside that — rather
 * than scaled to fit, which would shrink the scene to a thumbnail.
 */
export function ArtTile({ art, blank = false }: { art: StartOption["art"]; blank?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative size-[56px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--hr-gray-blue-100,#eaecf5)]"
    >
      <ArtImage art={art} />
      {blank ? <PlusMark scale={13.76 / 54} left={21.4} top={22.5} /> : null}
    </span>
  );
}

export function ArtImage({ art }: { art: StartOption["art"] }) {
  return (
    <span
      className="absolute overflow-hidden"
      style={{ left: art.left, top: art.top, width: art.width, height: art.height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={art.src}
        className="absolute max-w-none"
        style={
          art.crop
            ? { width: art.crop.width, height: art.crop.height, left: art.crop.left, top: art.crop.top }
            : { inset: 0, width: "100%", height: "100%" }
        }
      />
    </span>
  );
}

/**
 * The blank snapshot's plus, drawn rather than shipped: two rounded bars in
 * the Figma's #4b5cab at 47%, sized off the 54px card version.
 */
export function PlusMark({ scale, left, top }: { scale: number; left: number; top: number }) {
  const long = 54 * scale;
  const short = 14 * scale;
  return (
    <span
      aria-hidden="true"
      className="absolute opacity-[0.47]"
      style={{ left, top, width: long, height: long }}
    >
      <span
        className="absolute rounded-[4px] bg-[#4b5cab]"
        style={{ left: 0, top: (long - short) / 2, width: long, height: short, borderRadius: 4 * scale }}
      />
      <span
        className="absolute rounded-[4px] bg-[#4b5cab]"
        style={{ left: (long - short) / 2, top: 0, width: short, height: long, borderRadius: 4 * scale }}
      />
    </span>
  );
}

/* ─── The wizard dialog ─────────────────────────────────────────────────── */

/**
 * The flow's dialog: centred, 40px off the window edge, 12px radius,
 * shadow/xl, a header with a hairline under it and a footer with one above.
 *
 * Portalled and re-stamped with the page theme for the same reasons `Modal`
 * is. Escape closes it from the capture phase.
 */
export function FlowDialog({
  label,
  header,
  footer,
  children,
  onClose,
  bodyClassName,
}: {
  /** The dialog's accessible name. */
  label: string;
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  bodyClassName?: string;
}) {
  const { effective } = useTheme();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[95] flex items-center justify-center p-[16px] sm:p-[40px]"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="motion-panel-in relative flex max-h-full w-full max-w-[1360px] flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]"
      >
        <header className="shrink-0 bg-pg-surface shadow-[inset_0_-1px_0_0_var(--pg-border)]">
          {header}
        </header>
        <div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>
          {children}
        </div>
        <footer className="flex shrink-0 items-center gap-[12px] bg-pg-surface px-[24px] py-[16px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
          {footer}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg hover:text-pg-heading"
    >
      <X size={20} aria-hidden="true" />
    </button>
  );
}
