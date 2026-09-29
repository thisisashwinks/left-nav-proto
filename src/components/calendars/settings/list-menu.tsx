"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  /** Draws a check — the filter selects use the menu as a listbox. */
  checked?: boolean;
}

const ITEM_H = 34;
const PAD = 6;
const EDGE = 8;

/**
 * A menu pinned to the rect of the control that opened it.
 *
 * Portalled and `position: fixed` because both of its callers sit inside
 * scrolling regions — the group rail and the table card — and an absolutely
 * placed card would be clipped by the table's rounded overflow. The rect is
 * captured at click time rather than measured here, so render never reads
 * the DOM; the menu closes on scroll or resize instead of chasing its anchor.
 *
 * `side="top"` is the live product's habit for the kebabs (108, 115): the
 * menu rises over the row rather than covering the rows beneath it. It flips
 * when there is not room.
 */
export function AnchoredMenu({
  anchor,
  items,
  width,
  side = "bottom",
  align = "end",
  label,
  onClose,
}: {
  anchor: DOMRect;
  items: MenuItem[];
  width: number;
  side?: "top" | "bottom";
  align?: "start" | "end";
  label: string;
  onClose: () => void;
}) {
  const { effective } = useTheme();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    const onMove = (e: Event) => {
      // Scrolling inside the menu itself (a long owner list) is not a reason to shut it.
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const height = Math.min(items.length * ITEM_H + PAD * 2, vh - EDGE * 2);
  const roomAbove = anchor.top - EDGE;
  const roomBelow = vh - anchor.bottom - EDGE;
  const up = side === "top" ? roomAbove >= height || roomAbove > roomBelow : roomBelow < height && roomAbove > roomBelow;
  const top = up ? Math.max(EDGE, anchor.top - 4 - height) : Math.min(anchor.bottom + 4, vh - EDGE - height);
  const rawLeft = align === "end" ? anchor.right - width : anchor.left;
  const left = Math.min(Math.max(EDGE, rawLeft), vw - EDGE - width);

  return createPortal(
    <div data-page-theme={effective.appTheme}>
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[90] cursor-default"
      />
      <div
        ref={menuRef}
        role="menu"
        aria-label={label}
        style={{ top, left, width, maxHeight: height }}
        className="motion-panel-in fixed z-[91] overflow-y-auto rounded-[8px] bg-pg-surface p-[6px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role={item.checked === undefined ? "menuitem" : "menuitemradio"}
            aria-checked={item.checked}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={cn(
              "motion-tap flex h-[34px] w-full items-center gap-[10px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] hover:bg-pg",
              item.danger ? "text-pg-danger" : "text-pg-text",
            )}
          >
            {item.icon ? (
              <item.icon
                size={15}
                aria-hidden="true"
                className={cn("shrink-0", item.danger ? "text-pg-danger" : "text-pg-text-strong")}
              />
            ) : null}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.checked ? (
              <Check size={15} aria-hidden="true" className="shrink-0 text-brand" />
            ) : null}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

/**
 * "Status: All ▾" — a compact select whose button carries its own label, so
 * the toolbar needs no field labels above it.
 */
export function FilterSelect<V extends string>({
  label,
  value,
  options,
  onChange,
  width = 200,
}: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
  width?: number;
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const current = options.find((o) => o.value === value)?.label ?? "";
  const close = React.useCallback(() => setRect(null), []);

  return (
    <>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={rect !== null}
        onClick={(e) => setRect(rect ? null : e.currentTarget.getBoundingClientRect())}
        className={cn(
          "motion-tap flex h-[36px] shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface pr-[10px] pl-[12px] text-[14px] leading-[20px] whitespace-nowrap text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]",
          "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          rect && "shadow-[inset_0_0_0_1px_var(--brand)]",
        )}
      >
        <span>
          {label}: {current}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-faint motion-move", rect && "rotate-180")}
        />
      </button>
      {rect ? (
        <AnchoredMenu
          anchor={rect}
          width={width}
          align="start"
          label={label}
          onClose={close}
          items={options.map((o) => ({
            label: o.label,
            checked: o.value === value,
            onSelect: () => onChange(o.value),
          }))}
        />
      ) : null}
    </>
  );
}
