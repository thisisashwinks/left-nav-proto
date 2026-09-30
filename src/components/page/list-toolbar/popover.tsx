"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Minus, Search } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The one popover every list-toolbar menu opens in.
 *
 * Portalled to the body so no page's overflow can clip it (the toolbar sits
 * inside canvases and MFE-style containers that clip), and re-stamped with the
 * page theme because the portal leaves the subtree that carries it — the same
 * move modal.tsx makes.
 *
 * Positioned by writing to the element directly rather than through state: a
 * menu re-measures on every scroll and every resize of its own contents (a
 * search narrowing the list), and a re-render per scroll event would be a lot
 * of React for a `top` value.
 *
 * Popovers nest — the View menu's Filter tab opens a filter's options from
 * inside itself — so they keep a stack. Escape closes only the top one, and a
 * click inside a popover opened ABOVE this one does not count as outside.
 */

const stack: string[] = [];

export function usePopover() {
  const [open, setOpen] = React.useState(false);
  // A callback ref into state, so the popover gets the element itself and
  // can re-read its position whenever the page moves under it.
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const toggle = React.useCallback(() => setOpen((v) => !v), []);
  // A tuple, so the setter handed to `ref=` does not make the compiler treat
  // the whole state object as a ref.
  return [{ open, setOpen, close, toggle, anchor }, setAnchor] as const;
}

export const POPOVER_SHADOW =
  "shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]";

export function Popover({
  anchor,
  onClose,
  width = 260,
  align = "start",
  label,
  role = "dialog",
  className,
  children,
}: {
  anchor: HTMLElement | null;
  onClose: () => void;
  width?: number;
  /** `end` lines the popover's right edge up with the trigger's. */
  align?: "start" | "end";
  label: string;
  role?: "dialog" | "menu" | "listbox";
  className?: string;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();
  const id = React.useId();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    stack.push(id);
    return () => {
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [id]);

  React.useEffect(() => {
    const focusBack = () => {
      const target = anchor?.matches("button, input")
        ? anchor
        : anchor?.querySelector<HTMLElement>("button, input");
      target?.focus();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || stack[stack.length - 1] !== id) return;
      // Caught in the capture phase and stopped, so a menu over a drawer
      // closes on its own and leaves the drawer standing.
      e.stopPropagation();
      e.preventDefault();
      onClose();
      focusBack();
    };
    const onPointerDown = (e: PointerEvent) => {
      const node = e.target as Node | null;
      if (!node) return;
      if (ref.current?.contains(node) || anchor?.contains(node)) return;
      const el = node instanceof Element ? node : node.parentElement;
      const host = el?.closest("[data-lt-popover]")?.getAttribute("data-lt-popover");
      if (host && stack.indexOf(host) > stack.indexOf(id)) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [id, anchor, onClose]);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !anchor) return;
    const margin = 8;
    const gap = 6;
    const place = () => {
      const a = anchor.getBoundingClientRect();
      const h = el.scrollHeight;
      const w = el.offsetWidth;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const below = a.bottom + gap;
      const roomBelow = vh - margin - below;
      const roomAbove = a.top - gap - margin;
      // Below when it fits; flipped above only when above is genuinely
      // roomier, so a tall menu low on screen stays attached to its trigger.
      const up = h > roomBelow && roomAbove > roomBelow;
      const room = up ? roomAbove : roomBelow;
      const height = Math.min(h, room);
      const top = up ? a.top - gap - height : below;
      let left = align === "end" ? a.right - w : a.left;
      left = Math.max(margin, Math.min(left, vw - w - margin));
      el.style.maxHeight = `${Math.max(120, room)}px`;
      el.style.top = `${Math.max(margin, top)}px`;
      el.style.left = `${left}px`;
      el.style.visibility = "visible";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(anchor);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, align]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const auto = el.querySelector<HTMLElement>("[data-autofocus]");
    if (auto) auto.focus();
  }, []);

  /*
   * Up/Down walk the rows, like every native menu. Only across rows that
   * declare themselves (menuitem*, option), so a search field or a tab row
   * inside the popover keeps its own arrow keys.
   */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (e.altKey) return;
    const el = ref.current;
    if (!el) return;
    const rows = Array.from(
      el.querySelectorAll<HTMLElement>(
        "[role=menuitem]:not([disabled]),[role=menuitemradio]:not([disabled]),[role=menuitemcheckbox]:not([disabled]),[role=option]:not([disabled])",
      ),
    );
    if (!rows.length) return;
    e.preventDefault();
    const i = rows.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? rows[(i + 1) % rows.length]
        : rows[(i - 1 + rows.length) % rows.length];
    next?.focus();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      data-lt-popover={id}
      data-page-theme={effective.appTheme}
      role={role}
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{ width }}
      className={cn(
        "motion-slot-in invisible fixed top-0 left-0 z-[90] max-w-[calc(100vw-16px)] overflow-y-auto rounded-[12px] bg-pg-surface",
        POPOVER_SHADOW,
        className,
      )}
    >
      <div>{children}</div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------------ */
/* Menu parts                                                                */
/* ------------------------------------------------------------------------ */

/** A 16px box drawn as a span, so it can sit inside a row that is a button. */
export function CheckBox({ checked, mixed, disabled }: { checked: boolean; mixed?: boolean; disabled?: boolean }) {
  const on = checked || mixed;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
        on
          ? "bg-brand text-brand-fg"
          : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        disabled && "opacity-50",
      )}
    >
      {mixed ? <Minus size={11} strokeWidth={3} /> : checked ? <Check size={11} strokeWidth={3} /> : null}
    </span>
  );
}

export function MenuItem({
  children,
  leading,
  trailing,
  selected,
  role = "menuitem",
  checked,
  disabled,
  onClick,
  className,
  title,
}: {
  children: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Draws the row as the current one — heading-weight text. */
  selected?: boolean;
  role?: "menuitem" | "menuitemradio" | "menuitemcheckbox" | "option";
  checked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === "menuitem" ? undefined : !!checked}
      aria-selected={role === "option" ? !!checked : undefined}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={cn(
        "motion-tap flex min-h-[34px] w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] focus:outline-none enabled:hover:bg-pg enabled:focus-visible:bg-pg disabled:cursor-not-allowed",
        selected ? "font-semibold text-pg-heading" : "text-pg-text",
        disabled && "text-pg-muted",
        className,
      )}
    >
      {leading}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </button>
  );
}

export function MenuSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex h-[34px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
      <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <input
        data-autofocus
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Down from the field lands on the first row.
          if (e.key !== "ArrowDown") return;
          const rows = e.currentTarget
            .closest("[data-lt-popover]")
            ?.querySelector<HTMLElement>("[role^=menuitem],[role=option]");
          if (rows) {
            e.preventDefault();
            e.stopPropagation();
            rows.focus();
          }
        }}
        className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
      />
    </div>
  );
}

export function MenuDivider() {
  return <div role="separator" className="-mx-[6px] my-[6px] h-px bg-pg-border" />;
}

/** "Status" + a Clear link — the head of a filter or sort menu. */
export function MenuHeader({
  title,
  action,
  onAction,
  actionDisabled,
}: {
  title: React.ReactNode;
  action?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <div className="flex min-h-[28px] items-center justify-between gap-[8px] px-[10px] pt-[2px]">
      <span className="truncate text-[13px] leading-[18px] font-semibold text-pg-heading">
        {title}
      </span>
      {action ? (
        <button
          type="button"
          disabled={actionDisabled}
          onClick={onAction}
          className="motion-tap shrink-0 text-[13px] leading-[18px] font-medium text-brand enabled:hover:brightness-110 disabled:text-pg-disabled"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

export function MenuEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-[10px] py-[10px] text-[13px] leading-[18px] text-pg-muted">{children}</div>
  );
}
