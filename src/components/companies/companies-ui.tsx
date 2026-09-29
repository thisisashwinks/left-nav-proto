"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { AnchoredPopover } from "@/components/contacts/associated-objects";
import { ToneAvatar } from "@/components/page/avatar";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import type { Company } from "./companies-data";

/* ─── Escape: topmost layer only ────────────────────────────────────────── */

/*
 * The shared Modal, SideDrawer and AnchoredPopover each listen for Escape on
 * the document, and all of them fire on one press — so a popover inside a
 * modal took the modal with it. Every layer this page opens registers here
 * instead, and a window capture listener (which runs before any document
 * listener) closes only the newest one and stops the event there.
 */
type Layer = { close: () => void };
const stack: Layer[] = [];
let installed = false;

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape" || stack.length === 0) return;
      e.stopPropagation();
      e.preventDefault();
      stack[stack.length - 1].close();
    },
    true,
  );
}

export function useEscapeLayer(onClose: () => void) {
  const handler = React.useRef(onClose);
  React.useEffect(() => {
    handler.current = onClose;
  });
  React.useEffect(() => {
    install();
    const layer: Layer = { close: () => handler.current() };
    stack.push(layer);
    return () => {
      const i = stack.indexOf(layer);
      if (i !== -1) stack.splice(i, 1);
    };
  }, []);
}

/** The scrim under a drawer: it sits at z-79, one under SideDrawer's card. */
export function Scrim({ onClose }: { onClose: () => void }) {
  const { effective } = useTheme();
  if (typeof document === "undefined") return null;
  return createPortal(
    <div data-page-theme={effective.appTheme} className="contents">
      <button
        type="button"
        aria-label="Close panel"
        tabIndex={-1}
        onClick={onClose}
        className="motion-fade-in fixed inset-0 z-[79] cursor-default bg-[#10182866]"
      />
    </div>,
    document.body,
  );
}

/** AnchoredPopover above modals (z-95), and on the escape stack. */
export function Popover({
  anchor,
  onClose,
  children,
  width,
  align,
  label,
  className,
}: {
  anchor: HTMLElement;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  align?: "start" | "end";
  label?: string;
  className?: string;
}) {
  useEscapeLayer(onClose);
  return (
    <AnchoredPopover
      anchor={anchor}
      onClose={onClose}
      width={width}
      align={align}
      label={label}
      className={cn("z-[100] overflow-hidden", className)}
    >
      {children}
    </AnchoredPopover>
  );
}

export interface Option {
  value: string;
  label: string;
  /** Leading glyph — a flag. */
  lead?: React.ReactNode;
  hint?: string;
}

/**
 * A select whose menu is portalled, so it survives the overflow of modals
 * and drawers (the shared Select clips inside them).
 */
export function PopoverSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  searchable,
  className,
  menuWidth,
  "aria-label": ariaLabel,
  renderValue,
}: {
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  menuWidth?: number;
  "aria-label"?: string;
  renderValue?: (o: Option) => React.ReactNode;
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={!!anchor}
        aria-label={ariaLabel}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
        className={cn(
          "flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          anchor && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          className,
        )}
      >
        {current ? (
          renderValue ? (
            renderValue(current)
          ) : (
            <>
              {current.lead}
              <span className="min-w-0 flex-1 truncate text-pg-text">{current.label}</span>
            </>
          )
        ) : (
          <span className="min-w-0 flex-1 truncate text-pg-faint">{placeholder}</span>
        )}
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {anchor ? (
        <Popover
          anchor={anchor}
          onClose={() => setAnchor(null)}
          width={menuWidth ?? Math.max(anchor.offsetWidth, 200)}
          label={ariaLabel}
        >
          <OptionList
            options={options}
            value={value}
            searchable={searchable ?? options.length > 8}
            onPick={(v) => {
              onChange(v);
              setAnchor(null);
            }}
          />
        </Popover>
      ) : null}
    </>
  );
}

export function OptionList({
  options,
  value,
  searchable,
  onPick,
}: {
  options: Option[];
  value: string | null;
  searchable?: boolean;
  onPick: (value: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  return (
    <div className="flex max-h-[300px] flex-col">
      {searchable ? (
        <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[12px] py-[8px]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search options"
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
      ) : null}
      <div role="listbox" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
        {shown.length === 0 ? (
          <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No matches</p>
        ) : null}
        {shown.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => onPick(o.value)}
              className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
            >
              {o.lead}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                  on ? "font-medium text-pg-heading" : "text-pg-text",
                )}
              >
                {o.label}
              </span>
              {o.hint ? (
                <span className="shrink-0 text-[13px] leading-[18px] text-pg-faint">{o.hint}</span>
              ) : null}
              {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Up to 10 overlapping initials, then "+N". */
export function AvatarStack({ rows, total }: { rows: Company[]; total: number }) {
  const shown = rows.slice(0, 10);
  const rest = total - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((c) => (
        <span
          key={c.id}
          title={c.name}
          className="-ml-[8px] rounded-full ring-2 ring-pg-surface first:ml-0"
        >
          <ToneAvatar name={c.name} tone={c.tone} size={32} round initials={c.name.slice(0, 1).toUpperCase()} />
        </span>
      ))}
      {rest > 0 ? (
        <span className="-ml-[8px] flex h-[32px] min-w-[32px] items-center justify-center rounded-full bg-pg px-[8px] text-[12px] leading-none font-semibold text-pg-muted ring-2 ring-pg-surface">
          +{rest.toLocaleString("en-US")}
        </span>
      ) : null}
    </div>
  );
}

/** A glyph in a brand-soft circle — drawer and modal headers. */
export function SoftIcon({ children, size = 36 }: { children: React.ReactNode; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
    >
      {children}
    </span>
  );
}

/** Label over control, 4px apart. */
export function Field({
  label,
  required,
  htmlFor,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <label htmlFor={htmlFor} className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
        {label}
        {required ? <span className="text-pg-danger"> *</span> : null}
      </label>
      {children}
      {error ? (
        <span role="alert" className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** A grey note block, for the neutral callouts. */
export function GreyCallout({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-[10px] rounded-[8px] bg-pg px-[14px] py-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
      {icon ? <span className="mt-[2px] shrink-0 text-pg-muted">{icon}</span> : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** The destructive button. */
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
