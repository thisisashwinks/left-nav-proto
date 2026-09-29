"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The small pieces every snippets surface shares: a portalled popover that
 * works inside a modal, menu rows, labels, the divided modal footer, the
 * danger buttons and the phone mockup.
 */

export const BTN = "h-[36px] text-[14px]";

/** PrimaryButton's disabled look. */
export const DISABLED_PRIMARY =
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100";

/**
 * A card hung off a trigger, fixed to the viewport so no scroller clips it.
 *
 * Why not AnchoredPopover: that one sits at z-90, under the modal (95), and
 * listens for Escape on the document — the same node the modal listens on,
 * so the modal (registered first) would close too. This one sits at z-100
 * and catches Escape on the window in the capture phase, which runs before
 * any document listener, then stops it there: Escape closes only this layer.
 */
export function Popover({
  anchor,
  onClose,
  children,
  width,
  align = "start",
  className,
  label,
}: {
  anchor: HTMLElement;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  align?: "start" | "end";
  className?: string;
  label?: string;
}) {
  const { effective } = useTheme();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const place = () => {
      const el = ref.current;
      if (!el) return;
      const a = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const below = a.bottom + 4 + h <= window.innerHeight - 8 || a.top - 4 - h < 8;
      const top = below ? a.bottom + 4 : a.top - 4 - h;
      let left = align === "end" ? a.right - w : a.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      el.style.top = `${Math.round(top)}px`;
      el.style.left = `${Math.round(left)}px`;
      el.style.visibility = "visible";
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    const ro = new ResizeObserver(place);
    if (ref.current) ro.observe(ref.current);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      ro.disconnect();
    };
  }, [anchor, align]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor.contains(t)) return;
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [anchor, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div data-page-theme={effective.appTheme} className="contents">
      <div
        ref={ref}
        role="dialog"
        aria-label={label}
        style={{ width, visibility: "hidden" }}
        className={cn(
          "motion-fade-in fixed top-0 left-0 z-[100] flex max-h-[320px] flex-col overflow-y-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Open state for a popover: the element it hangs from, or nothing. */
export function useAnchor() {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  const toggle = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    setAnchor((a) => (a === el ? null : el));
  };
  return { anchor, close, toggle };
}

export function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
  selected,
}: {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex h-[36px] w-full shrink-0 items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] motion-tap hover:bg-pg",
        danger ? "text-pg-danger" : "text-pg-text",
        selected && "text-brand",
      )}
    >
      {Icon ? (
        <Icon size={15} aria-hidden="true" className={cn("shrink-0", danger || selected ? "" : "text-pg-muted")} />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected ? <Check size={15} aria-hidden="true" className="shrink-0 text-brand" /> : null}
    </button>
  );
}

export function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
      {children}
      {required ? <span className="text-pg-danger"> *</span> : null}
    </label>
  );
}

export function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] leading-[18px] text-pg-danger">{children}</p>;
}

/** The modal footer with a hairline running edge to edge. */
export function ModalFooter({ leading, children }: { leading?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="-mx-[16px] flex flex-1 items-center gap-[12px] border-t border-pg-head-border px-[16px] pt-[12px]">
      {leading}
      <span className="flex-1" />
      {children}
    </div>
  );
}

/** Red outline — "Delete snippets" in the bulk bar. */
export function DangerOutlineButton({ className, children, ...rest }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[14px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-pg-danger shadow-[inset_0_0_0_1px_var(--hr-error-300)]",
        "motion-tap hover:bg-[color-mix(in_oklab,var(--hr-error-500)_6%,var(--pg-surface))] active:scale-[0.97]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Red fill — the confirm in a delete dialog. */
export function DangerButton({ className, children, ...rest }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] bg-[var(--hr-error-600)] px-[16px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white",
        "motion-tap hover:bg-[var(--hr-error-700)] active:scale-[0.97]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Brand outline — Add attachment, Add, Send. */
export function BrandOutlineButton({ className, children, ...rest }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[14px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-brand shadow-[inset_0_0_0_1px_var(--brand)]",
        "motion-tap hover:bg-[color-mix(in_oklab,var(--brand)_6%,var(--pg-surface))] active:scale-[0.97]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * A select whose menu is portalled, so a modal's overflow can't clip it.
 */
export function PopSelect({
  value,
  options,
  onChange,
  placeholder,
  className,
  "aria-label": ariaLabel,
  size = "md",
}: {
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  size?: "md" | "sm";
}) {
  const { anchor, close, toggle } = useAnchor();
  const current = options.find((o) => o.value === value);
  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={Boolean(anchor)}
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          size === "md" ? "h-[36px] text-[14px]" : "h-[30px] text-[13px]",
          anchor && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", current ? "text-pg-text" : "text-pg-faint")}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
      </button>
      {anchor ? (
        <Popover anchor={anchor} onClose={close} width={Math.max(anchor.offsetWidth, 140)} label={ariaLabel}>
          <div role="listbox" aria-label={ariaLabel} className="flex flex-col">
            {options.length === 0 ? (
              <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No options yet.</p>
            ) : (
              options.map((o) => (
                <MenuItem
                  key={o.value}
                  label={o.label}
                  selected={o.value === value}
                  onClick={() => {
                    onChange(o.value);
                    close();
                  }}
                />
              ))
            )}
          </div>
        </Popover>
      ) : null}
    </>
  );
}

/**
 * The phone the modals preview into — a CSS device: black frame, notch,
 * 9:41 and a green 75% battery. The screen is always light, like the live
 * product's, because it depicts a handset rather than this app's chrome.
 */
export function PhoneFrame({ children }: { children?: React.ReactNode }) {
  return (
    <div
      aria-label="Preview"
      className="relative flex h-[600px] w-[300px] shrink-0 flex-col overflow-hidden rounded-[44px] bg-white shadow-[inset_0_0_0_4px_#000]"
    >
      <div className="relative flex h-[44px] shrink-0 items-center justify-between px-[24px] pt-[6px] text-[13px] leading-[18px] font-medium text-[#101828]">
        <span>9:41</span>
        <span
          aria-hidden="true"
          className="absolute top-[4px] left-1/2 h-[26px] w-[110px] -translate-x-1/2 rounded-b-[16px] bg-black"
        />
        <span className="flex items-center gap-[3px]">
          <span className="relative flex h-[12px] w-[24px] items-center rounded-[3px] p-[1.5px] shadow-[inset_0_0_0_1px_#101828]">
            <span className="h-full w-[75%] rounded-[1.5px] bg-[var(--hr-success-500)]" />
            <span className="absolute top-1/2 -right-[3px] h-[5px] w-[2px] -translate-y-1/2 rounded-r-[1px] bg-[#101828]" />
          </span>
          75%
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[14px] pb-[12px]">{children}</div>
      <span aria-hidden="true" className="mx-auto mb-[10px] h-[5px] w-[76px] shrink-0 rounded-full bg-[#d0d5dd]" />
    </div>
  );
}
