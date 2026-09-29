"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Filter, PieChart } from "lucide-react";
import { Checkbox, Toggle } from "@/components/page/form-controls";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { STAGE_COLORS, type StageColorMode } from "./pipelines-store";

/**
 * The pieces a pipeline's settings are built from, shared by the editor
 * modal and the pipeline detail page so both read the same.
 *
 * Every popover here is portalled to the body at z-[100] — above the modal's
 * z-[95] — and re-stamped with the page theme, because the portal leaves the
 * subtree that carries it. Escape is caught on the window in the capture
 * phase, which runs before the modal's document listener, so it closes the
 * popover and leaves the modal standing.
 */

const CARD =
  "rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]";

/* ------------------------------------------------------------------ */
/* Portalled popover                                                   */
/* ------------------------------------------------------------------ */

function useEscapeFirst(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      e.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);
}

function Popover({
  anchor,
  onClose,
  align = "start",
  children,
  className,
}: {
  anchor: HTMLElement | null;
  onClose: () => void;
  align?: "start" | "end";
  children: React.ReactNode;
  className?: string;
}) {
  const { effective } = useTheme();
  const [pos, setPos] = React.useState<{ top: number; left: number; right: number } | null>(null);

  useEscapeFirst(true, onClose);

  React.useLayoutEffect(() => {
    if (!anchor) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, right: window.innerWidth - r.right });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor]);

  if (typeof document === "undefined" || !pos) return null;

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        style={
          align === "end"
            ? { top: pos.top, right: pos.right }
            : { top: pos.top, left: pos.left }
        }
        className={cn(
          "motion-panel-in absolute rounded-[8px] bg-pg-surface p-[8px] shadow-[inset_0_0_0_1px_var(--pg-border),0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * A hover tooltip, portalled so the scrolling modal body can't clip it.
 * Exported for the ⓘ headers and the disabled probability field.
 */
export function HoverTip({
  content,
  children,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const { effective } = useTheme();
  const ref = React.useRef<HTMLSpanElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.top - 6, left: r.left + r.width / 2 });
  };
  const hide = () => setPos(null);

  return (
    <span
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className={cn("inline-flex", className)}
    >
      {children}
      {pos && typeof document !== "undefined"
        ? createPortal(
            <div
              data-page-theme={effective.appTheme}
              role="tooltip"
              style={{ top: pos.top, left: pos.left }}
              className="pointer-events-none fixed z-[100] max-w-[260px] -translate-x-1/2 -translate-y-full rounded-[6px] bg-pg-overlay px-[10px] py-[6px] text-[12px] leading-[16px] font-normal text-pg-overlay-fg shadow-[0_4px_6px_-2px_rgba(16,24,40,0.12)]"
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function ProbabilityToggleCard({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={cn(CARD, "flex items-center gap-[16px] px-[16px] py-[12px]")}>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
          Use opportunity-level probability
        </span>
        <span className="text-[13px] leading-[18px] text-pg-muted">
          When on, each opportunity uses its own probability. When off, probability
          comes from the stage.
        </span>
      </div>
      <Toggle
        checked={value}
        onChange={onChange}
        aria-label="Use opportunity-level probability"
      />
    </div>
  );
}

const COLOR_OPTIONS: { value: StageColorMode; label: string }[] = [
  { value: "none", label: "Default (no color)" },
  { value: "dot", label: "Colored dot" },
  { value: "tint", label: "Background tint" },
];

const SAMPLE = "#155eef";

function ColorPreview({ mode }: { mode: StageColorMode }) {
  if (mode === "dot") {
    return (
      <span className="inline-flex items-center gap-[6px] text-[13px] leading-[18px] font-medium text-pg-text">
        <span className="size-[8px] rounded-full" style={{ background: SAMPLE }} />
        Stage name
      </span>
    );
  }
  if (mode === "tint") {
    return (
      <span
        className="inline-flex h-[22px] items-center rounded-[6px] px-[8px] text-[12px] leading-none font-medium"
        style={{
          background: `color-mix(in oklab, ${SAMPLE} 14%, transparent)`,
          color: `color-mix(in oklab, ${SAMPLE} 80%, var(--pg-text))`,
        }}
      >
        Stage name
      </span>
    );
  }
  return (
    <span className="text-[13px] leading-[18px] font-medium text-pg-text">Stage name</span>
  );
}

export function ColorModeCard({
  value,
  onChange,
}: {
  value: StageColorMode;
  onChange: (v: StageColorMode) => void;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + COLOR_OPTIONS.length) % COLOR_OPTIONS.length;
    onChange(COLOR_OPTIONS[next]!.value);
    refs.current[next]?.focus();
  };

  return (
    <div className={cn(CARD, "flex flex-wrap items-center gap-[16px] px-[16px] py-[12px]")}>
      <div className="flex min-w-[200px] flex-1 flex-col gap-[2px]">
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
          Set pipeline display colors
        </span>
        <span className="text-[13px] leading-[18px] text-pg-muted">
          Choose how stage colors appear across your pipeline views
        </span>
      </div>
      <div role="radiogroup" aria-label="Stage colors" className="flex gap-[8px]">
        {COLOR_OPTIONS.map((opt, i) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "motion-tap flex w-[128px] flex-col items-center gap-[8px] rounded-[8px] bg-pg-surface px-[8px] py-[10px]",
                selected
                  ? "shadow-[inset_0_0_0_1.5px_var(--brand)]"
                  : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
              )}
            >
              <span className="flex h-[36px] w-full items-center justify-center rounded-[6px] bg-pg">
                <ColorPreview mode={opt.value} />
              </span>
              <span
                className={cn(
                  "text-[12px] leading-[16px] font-medium",
                  selected ? "text-brand" : "text-pg-muted",
                )}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row controls                                                        */
/* ------------------------------------------------------------------ */

export function StageColorSwatch({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const open = anchor !== null;
  const close = React.useCallback(() => setAnchor(null), []);

  return (
    <>
      <button
        type="button"
        aria-label="Stage color"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => setAnchor(open ? null : e.currentTarget)}
        className="motion-tap flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
      >
        <span className="size-[20px] rounded-[5px]" style={{ background: value }} />
      </button>
      {open ? (
        <Popover anchor={anchor} onClose={close}>
          <div className="grid grid-cols-5 gap-[6px]">
            {STAGE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={c === value}
                onClick={() => {
                  onChange(c);
                  close();
                }}
                className={cn(
                  "motion-tap size-[24px] rounded-[6px]",
                  c === value &&
                    "shadow-[0_0_0_2px_var(--pg-surface),0_0_0_3.5px_var(--brand)]",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </Popover>
      ) : null}
    </>
  );
}

export function ReportVisibility({
  funnel,
  pie,
  onChange,
}: {
  funnel: boolean;
  pie: boolean;
  onChange: (v: { funnel: boolean; pie: boolean }) => void;
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const open = anchor !== null;
  const close = React.useCallback(() => setAnchor(null), []);

  const iconBtn = (on: boolean) =>
    cn(
      "motion-tap flex size-[28px] items-center justify-center rounded-[6px] hover:bg-pg",
      on ? "text-brand" : "text-pg-faint",
    );

  return (
    <div className="flex h-[36px] items-center gap-[2px]">
      <button
        type="button"
        aria-label="Show in funnel chart"
        aria-pressed={funnel}
        title="Funnel chart"
        onClick={() => onChange({ funnel: !funnel, pie })}
        className={iconBtn(funnel)}
      >
        <Filter size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Show in pie chart"
        aria-pressed={pie}
        title="Pie chart"
        onClick={() => onChange({ funnel, pie: !pie })}
        className={iconBtn(pie)}
      >
        <PieChart size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Report visibility options"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => setAnchor(open ? null : e.currentTarget)}
        className="motion-tap flex size-[24px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
      >
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open ? (
        <Popover anchor={anchor} onClose={close} className="flex w-[200px] flex-col">
          <Checkbox
            checked={funnel}
            onChange={(v) => onChange({ funnel: v, pie })}
            label="Show in funnel chart"
            className="h-[32px] rounded-[6px] px-[8px] hover:bg-pg"
          />
          <Checkbox
            checked={pie}
            onChange={(v) => onChange({ funnel, pie: v })}
            label="Show in pie chart"
            className="h-[32px] rounded-[6px] px-[8px] hover:bg-pg"
          />
        </Popover>
      ) : null}
    </div>
  );
}

export function ProbabilityInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-[36px] w-[88px] items-center rounded-[8px] pr-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        disabled ? "bg-pg" : "bg-pg-surface",
      )}
    >
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        step={1}
        aria-label="Probability"
        disabled={disabled}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = Math.round(Number(e.target.value));
          onChange(Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0);
        }}
        className="h-full min-w-0 flex-1 bg-transparent pl-[12px] text-[14px] leading-[20px] text-pg-text [appearance:textfield] focus:outline-none disabled:cursor-not-allowed disabled:text-pg-muted [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-[14px] leading-[20px] text-pg-muted">%</span>
    </div>
  );
}
