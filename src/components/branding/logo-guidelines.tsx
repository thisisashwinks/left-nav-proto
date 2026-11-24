"use client";

/**
 * Full logo guidelines (Nov 24, 2026, Ashwin): aspect ratio plus do's and
 * don'ts, drawn the way a brand identity guide shows them — the same logo,
 * right and wrong, side by side.
 *
 * Shown below the Full logo row in onboarding, and behind a "Logo
 * guidelines" button on White label (agency) and Business profile
 * (sub-account), as a modal or an accordion (prototype controls).
 *
 * Every example uses the sample Acme Agency wordmark, inside a frame the
 * height of the sidebar's logo slot, so each pair shows what actually
 * happens to that kind of file at the top of the sidebar.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Eye, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

const WORDMARK = "/wordmark-acme-agency.svg";
const ICON = "/icon-acme-agency.svg";

export const LOGO_ASPECT_GUIDANCE =
  "Use a horizontal logo, about 4:1 (for example 400 × 100 px). SVG or a transparent PNG works best.";

type Example = { id: string; ok: boolean; title: string; art: React.ReactNode };

const checker =
  "bg-[conic-gradient(#eaecf0_25%,#fff_0_50%,#eaecf0_0_75%,#fff_0)] [background-size:10px_10px]";

function examples(h: number): Example[][] {
  const logo = <img src={WORDMARK} alt="" style={{ height: h }} className="w-auto" />;
  return [
    [
      { id: "wide", ok: true, title: "Horizontal, about 4:1", art: logo },
      {
        id: "stacked",
        ok: false,
        title: "Stacked or square logos",
        // Icon over the name, squeezed into the same height: everything shrinks.
        art: (
          <span className="flex flex-col items-center" style={{ height: h }}>
            <img src={ICON} alt="" style={{ height: h * 0.62 }} className="w-auto" />
            <span className="font-extrabold tracking-[-0.02em] text-[#1f1636]" style={{ fontSize: h * 0.3, lineHeight: 1 }}>
              acme
            </span>
          </span>
        ),
      },
    ],
    [
      {
        id: "transparent",
        ok: true,
        title: "Transparent background",
        art: <span className={cn("rounded-[3px] px-[4px] py-[2px]", checker)}>{logo}</span>,
      },
      {
        id: "box",
        ok: false,
        title: "Solid background boxes",
        // A white JPG plate on a tinted sidebar: the box shows, the brand does not.
        art: (
          <span className="absolute inset-[1px] flex items-center justify-center rounded-[7px] bg-[#e7eefc]">
            <span className="bg-white px-[10px] py-[6px]">{logo}</span>
          </span>
        ),
      },
    ],
    [
      {
        id: "tight",
        ok: true,
        title: "Cropped close to the logo",
        art: <span className="outline-1 outline-offset-1 outline-dashed outline-[#98a2b3]">{logo}</span>,
      },
      {
        id: "space",
        ok: false,
        title: "Lots of empty space",
        // Same file height, most of it air: the artwork lands tiny.
        art: (
          <span
            className="flex items-center justify-center outline-1 outline-dashed outline-[#98a2b3]"
            style={{ height: h + 8, width: (h + 8) * 2.2 }}
          >
            <img src={WORDMARK} alt="" style={{ height: h * 0.4 }} className="w-auto" />
          </span>
        ),
      },
    ],
  ];
}

function Tile({ ex, compact }: { ex: Example; compact: boolean }) {
  return (
    <figure className="flex min-w-0 flex-col gap-[6px]">
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-[8px] bg-white",
          compact ? "h-[56px]" : "h-[80px]",
          ex.ok
            ? "shadow-[inset_0_0_0_1px_var(--pg-border)]"
            : "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-error-600)_35%,transparent)]",
        )}
      >
        {ex.art}
      </div>
      <figcaption className="flex items-start gap-[6px] text-[13px] leading-[18px] text-pg-text">
        <span
          aria-hidden="true"
          className={cn(
            "mt-[1px] flex size-[16px] shrink-0 items-center justify-center rounded-full text-white",
            ex.ok ? "bg-[var(--hr-success-600)]" : "bg-[var(--hr-error-600)]",
          )}
        >
          {ex.ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
        </span>
        <span>
          <span className="sr-only">{ex.ok ? "Do: " : "Don't: "}</span>
          {ex.title}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * The guide itself: aspect guidance, then Do row over Don't row. `only`
 * draws one row without its heading or the aspect line — for the split
 * Do's / Don'ts accordions.
 */
export function LogoGuidelines({
  compact = false,
  className,
  only,
}: {
  compact?: boolean;
  className?: string;
  only?: "do" | "dont";
}) {
  const pairs = examples(compact ? 26 : 36);
  const row = (ok: boolean, heading = true) => (
    <div className="flex flex-col gap-[8px]">
      {heading ? (
        <span className="text-[12px] leading-[16px] font-semibold tracking-[0.04em] text-pg-muted uppercase">
          {ok ? "Do" : "Don't"}
        </span>
      ) : null}
      <div className={cn("grid grid-cols-3", compact ? "gap-[8px]" : "gap-[12px]")}>
        {pairs.map((p) => (
          <Tile key={p[ok ? 0 : 1]!.id} ex={p[ok ? 0 : 1]!} compact={compact} />
        ))}
      </div>
    </div>
  );
  if (only) return <div className={className}>{row(only === "do", false)}</div>;
  return (
    <div className={cn("flex flex-col", compact ? "gap-[12px]" : "gap-[16px]", className)}>
      <p className="text-[13px] leading-[18px] text-pg-muted">{LOGO_ASPECT_GUIDANCE}</p>
      {row(true)}
      {row(false)}
    </div>
  );
}

/** "Logo guidelines" — the eye button settings rows show under the spec. */
export function LogoGuidelinesButton({
  open,
  onClick,
}: {
  open?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="motion-tap mt-[2px] flex items-center gap-[6px] self-start text-[13px] leading-[18px] font-medium text-[var(--hr-primary-600)] hover:underline"
    >
      <Eye size={14} aria-hidden="true" />
      {open ? "Hide logo guidelines" : "Logo guidelines"}
    </button>
  );
}

/** HighRise modal holding the guide. */
export function LogoGuidelinesModal({ onClose }: { onClose: () => void }) {
  const { effective } = useTheme();
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[120] flex items-center justify-center p-[16px] font-sans">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-[#10182899]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Logo guidelines"
        className="motion-panel-in relative flex w-[600px] max-w-full flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <header className="flex items-center gap-[10px] px-[16px] pt-[12px] pb-[4px]">
          <h2 className="min-w-0 flex-1 text-[16px] leading-[22px] font-semibold text-pg-heading">Logo guidelines</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[24px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="px-[16px] pt-[8px] pb-[16px]">
          <LogoGuidelines />
        </div>
        <footer className="flex justify-end px-[16px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
          >
            Got it
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/** One collapsible row: title + hint, chevron, body below (Nov 24, 2026). */
export function GuideAccordion({
  title,
  hint,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();
  return (
    <div className="flex flex-col rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="motion-tap flex min-h-[40px] items-center gap-[8px] rounded-[8px] px-[12px] py-[8px] text-left hover:bg-pg"
      >
        {icon}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[14px] leading-[20px] font-medium text-pg-heading">{title}</span>
          {hint ? <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span> : null}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-muted transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div id={id} className="motion-panel-in px-[12px] pt-[4px] pb-[12px]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

const Badge = ({ ok }: { ok: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex size-[18px] shrink-0 items-center justify-center rounded-full text-white",
      ok ? "bg-[var(--hr-success-600)]" : "bg-[var(--hr-error-600)]",
    )}
  >
    {ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
  </span>
);

/** The whole guide in one accordion. */
export function LogoGuidelinesAccordion() {
  return (
    <GuideAccordion
      title="Logo guidelines"
      hint="Horizontal, about 4:1. See what works best."
      icon={<Eye size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />}
    >
      <LogoGuidelines compact />
    </GuideAccordion>
  );
}

/** Do's and Don'ts as two accordions, the aspect line above them. */
export function LogoDosDontsAccordions() {
  return (
    <div className="flex flex-col gap-[8px]">
      <p className="text-[13px] leading-[18px] text-pg-muted">{LOGO_ASPECT_GUIDANCE}</p>
      <GuideAccordion title="Do's" icon={<Badge ok />}>
        <LogoGuidelines compact only="do" />
      </GuideAccordion>
      <GuideAccordion title="Don'ts" icon={<Badge ok={false} />}>
        <LogoGuidelines compact only="dont" />
      </GuideAccordion>
    </div>
  );
}
