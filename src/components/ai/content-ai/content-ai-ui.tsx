"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { EllipsisVertical, type LucideIcon } from "lucide-react";
import { Sparkline } from "@/components/reporting/chart-kit";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * One usage tile — a soft green glyph, a label and a figure, as on the live
 * screen. The sparkline is the one addition: the tile already answers "how
 * much", and the line answers "is that going up" without another chart.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  colourIndex = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  trend?: number[];
  colourIndex?: number;
}) {
  const flat = !trend || trend.every((v) => v === trend[0]);
  return (
    <div className="flex min-w-0 flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.05)]">
      <div className="flex items-start justify-between gap-[12px]">
        <span
          aria-hidden="true"
          className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[var(--pg-av-green-bg)] text-[var(--pg-av-green-fg)]"
        >
          <Icon size={18} />
        </span>
        {trend && !flat ? <Sparkline values={trend} colourIndex={colourIndex} /> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-[4px]">
        <span className="text-[14px] leading-[20px] text-pg-muted">{label}</span>
        <span className="text-[28px] leading-[34px] font-semibold text-pg-heading tabular-nums">
          {value}
        </span>
        {hint ? (
          <span className="text-[13px] leading-[18px] text-pg-faint">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The live screen's "No data" mark — an inbox tray with a cross badge —
 * drawn inline from tokens so it sits on the surface in light, dark and
 * tinted alike (no fill of its own, only strokes and a token-tinted badge).
 */
export function NoDataArt() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <path
        d="M10 30 L15 14 a3 3 0 0 1 2.8-2 H34"
        stroke="var(--pg-faint)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 30 v12 a4 4 0 0 0 4 4 h28 a4 4 0 0 0 4-4 V30 h-9 a2 2 0 0 0-1.8 1.2 a7.5 7.5 0 0 1-14.4 0 A2 2 0 0 0 19 30 Z"
        stroke="var(--pg-faint)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="color-mix(in srgb, var(--pg-faint) 10%, transparent)"
      />
      <path d="M46 30 L43 21" stroke="var(--pg-faint)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="43" cy="13" r="9" fill="var(--pg-faint)" stroke="var(--pg-surface)" strokeWidth="2.5" />
      <path
        d="M39.5 9.5 l7 7 M46.5 9.5 l-7 7"
        stroke="var(--pg-surface)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The joined button group the live screen filters by type with. */
export function Segmented({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex max-w-full shrink-0 items-stretch overflow-x-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "motion-tap flex h-[36px] shrink-0 items-center gap-[6px] px-[14px] text-[14px] leading-[20px] whitespace-nowrap",
              i > 0 && "shadow-[inset_1px_0_0_0_var(--pg-border)]",
              i === 0 && "rounded-l-[8px]",
              i === options.length - 1 && "rounded-r-[8px]",
              on
                ? "bg-pg font-semibold text-pg-heading"
                : "font-medium text-pg-text hover:bg-pg hover:text-pg-text-strong",
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span className="text-[12px] leading-none font-medium text-pg-faint tabular-nums">
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** A generated image, drawn as a gradient tile seeded by its hue. */
export function Thumb({
  hue,
  size = 36,
  className,
}: {
  hue: number;
  /** null = sized by className. */
  size?: number | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        ...(size === null ? {} : { width: size, height: size }),
        background: `radial-gradient(circle at 30% 25%, hsl(${hue} 85% 78% / 0.9), transparent 55%), linear-gradient(135deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 65% 36%))`,
      }}
      className={cn("block shrink-0 rounded-[6px]", className)}
    />
  );
}

export interface MenuItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
}

/**
 * The row kebab. Portalled for the reason pipeline-detail's is: the table
 * card scrolls its own body and would clip a menu opened on the last row.
 */
export function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const { effective } = useTheme();
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null);

  React.useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [pos]);

  const open = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const menuH = items.length * 36 + 12;
    const below = r.bottom + 4 + menuH <= window.innerHeight;
    setPos({
      top: below ? r.bottom + 4 : Math.max(8, r.top - 4 - menuH),
      right: window.innerWidth - r.right,
    });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        onClick={() => (pos ? setPos(null) : open())}
        className={cn(
          "motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading",
          pos && "bg-pg text-pg-heading",
        )}
      >
        <EllipsisVertical size={16} aria-hidden="true" />
      </button>
      {pos && typeof document !== "undefined"
        ? createPortal(
            <div data-page-theme={effective.appTheme}>
              <button
                type="button"
                aria-label="Close menu"
                tabIndex={-1}
                onClick={() => setPos(null)}
                className="fixed inset-0 z-[90] cursor-default"
              />
              <div
                role="menu"
                aria-label={label}
                style={{ position: "fixed", top: pos.top, right: pos.right }}
                className="motion-panel-in z-[91] w-[176px] rounded-[10px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
              >
                {items.map((it) => (
                  <button
                    key={it.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setPos(null);
                      it.onSelect();
                    }}
                    className={cn(
                      "motion-tap flex h-[36px] w-full items-center gap-[10px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] hover:bg-pg",
                      it.danger ? "text-pg-danger" : "text-pg-text-strong",
                    )}
                  >
                    <it.icon size={15} aria-hidden="true" className="shrink-0" />
                    {it.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** Label, control, optional hint — 4px between label and control. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-[4px]">
      <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[96px] w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none",
        className,
      )}
    />
  );
}

export function DangerButton({ className, ...rest }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] bg-[var(--hr-error-600)] px-[16px] text-[14px] leading-[20px] font-semibold whitespace-nowrap text-white motion-tap enabled:hover:brightness-110 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
}
