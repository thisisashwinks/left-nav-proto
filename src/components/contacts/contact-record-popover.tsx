"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Search } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { ToneAvatar } from "@/components/page/avatar";
import { Checkbox } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import { USERS } from "./settings/object-settings-store";

/**
 * The record card's popovers, portalled.
 *
 * The card's middle scrolls and its aside clips, so a menu drawn inside it
 * would be cut off at the edge it most often opens toward. The anchor's rect
 * is taken in the click handler and the card is placed fixed against it,
 * flipping above when there is not room below.
 */

export interface Anchor {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function anchorOf(el: Element): Anchor {
  const r = el.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
}

export function FloatingMenu({
  anchor,
  onClose,
  width = 240,
  maxHeight = 300,
  align = "left",
  className,
  children,
}: {
  anchor: Anchor;
  onClose: () => void;
  width?: number;
  maxHeight?: number;
  align?: "left" | "right";
  className?: string;
  children: React.ReactNode;
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

  // Opened from a click only, so there is no server render to match.
  if (typeof document === "undefined") return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const below = vh - anchor.bottom - 8;
  const flip = below < Math.min(maxHeight, 220) && anchor.top > below;
  const left = Math.max(
    8,
    Math.min(align === "left" ? anchor.left : anchor.right - width, vw - width - 8),
  );
  const style: React.CSSProperties = {
    left,
    width,
    maxHeight: Math.min(maxHeight, (flip ? anchor.top : vh - anchor.bottom) - 12),
    ...(flip ? { bottom: vh - anchor.top + 4 } : { top: anchor.bottom + 4 }),
  };

  return createPortal(
    <div data-page-theme={effective.appTheme}>
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[80] cursor-default"
      />
      <div
        style={style}
        className={cn(
          "motion-panel-in fixed z-[81] flex flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** The search row every picker opens with. */
export function MenuSearch({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="shrink-0 p-[8px]">
      <div className="flex h-[32px] items-center gap-[8px] rounded-[6px] px-[9px] shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
    </div>
  );
}

/**
 * Users, searchable. Single-select closes on pick (Owner); multi keeps the
 * menu open and ticks checkboxes (Followers).
 */
export function UserPicker({
  anchor,
  onClose,
  selected,
  multiple,
  onChange,
}: {
  anchor: Anchor;
  onClose: () => void;
  selected: string[];
  multiple?: boolean;
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? USERS.filter((u) => u.name.toLowerCase().includes(q)) : USERS;

  return (
    <FloatingMenu anchor={anchor} onClose={onClose} width={272} maxHeight={320}>
      <MenuSearch value={query} onChange={setQuery} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[4px] pb-[4px]">
        {shown.length === 0 ? (
          <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
            No users match
          </p>
        ) : null}
        {shown.map((u) => {
          const on = selected.includes(u.id);
          const toggle = () => {
            if (multiple) {
              onChange(on ? selected.filter((x) => x !== u.id) : [...selected, u.id]);
            } else {
              onChange([u.id]);
              onClose();
            }
          };
          return (
            <div
              key={u.id}
              role="option"
              aria-selected={on}
              tabIndex={0}
              onClick={toggle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle();
                }
              }}
              className="flex h-[34px] cursor-pointer items-center gap-[8px] rounded-[6px] px-[8px] motion-tap hover:bg-pg"
            >
              {multiple ? <Checkbox checked={on} onChange={toggle} /> : null}
              <ToneAvatar name={u.name} tone={u.tone} size={20} round />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                  on && !multiple ? "font-medium text-pg-heading" : "text-pg-text",
                )}
              >
                {u.name}
              </span>
              {on && !multiple ? (
                <Check size={14} aria-hidden="true" className="shrink-0 text-brand" />
              ) : null}
            </div>
          );
        })}
      </div>
    </FloatingMenu>
  );
}

/** A plain option list — dropdown fields, phone type, country. */
export function OptionMenu({
  anchor,
  onClose,
  options,
  selected,
  multiple,
  onChange,
  width = 240,
  align = "left",
  clearable = true,
}: {
  anchor: Anchor;
  onClose: () => void;
  options: { value: string; label: React.ReactNode; search?: string }[];
  selected: string[];
  multiple?: boolean;
  onChange: (values: string[]) => void;
  width?: number;
  align?: "left" | "right";
  clearable?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const searchable = options.length > 8;
  const q = query.trim().toLowerCase();
  const shown = q
    ? options.filter((o) => (o.search ?? String(o.value)).toLowerCase().includes(q))
    : options;

  return (
    <FloatingMenu anchor={anchor} onClose={onClose} width={width} align={align} maxHeight={300}>
      {searchable ? <MenuSearch value={query} onChange={setQuery} /> : null}
      <div className="min-h-0 flex-1 overflow-y-auto p-[4px]">
        {shown.length === 0 ? (
          <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
            No matches
          </p>
        ) : null}
        {shown.map((o) => {
          const on = selected.includes(o.value);
          const toggle = () => {
            if (multiple) {
              onChange(on ? selected.filter((x) => x !== o.value) : [...selected, o.value]);
            } else {
              onChange([o.value]);
              onClose();
            }
          };
          return (
            <div
              key={o.value}
              role="option"
              aria-selected={on}
              tabIndex={0}
              onClick={toggle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle();
                }
              }}
              className="flex min-h-[34px] cursor-pointer items-center gap-[8px] rounded-[6px] px-[10px] py-[6px] motion-tap hover:bg-pg"
            >
              {multiple ? <Checkbox checked={on} onChange={toggle} /> : null}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                  on && !multiple ? "font-medium text-pg-heading" : "text-pg-text",
                )}
              >
                {o.label}
              </span>
              {on && !multiple ? (
                <Check size={14} aria-hidden="true" className="shrink-0 text-brand" />
              ) : null}
            </div>
          );
        })}
      </div>
      {clearable && selected.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            onChange([]);
            onClose();
          }}
          className="shrink-0 border-t border-pg-head-border px-[14px] py-[8px] text-left text-[13px] leading-[18px] text-pg-muted motion-tap hover:text-pg-heading"
        >
          Clear selection
        </button>
      ) : null}
    </FloatingMenu>
  );
}
