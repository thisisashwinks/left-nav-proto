"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import type { SelectOption } from "@/components/page/form-controls";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

const FIELD =
  "h-[36px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]";

const MENU_MAX = 280;

type Anchor = { left: number; width: number; top?: number; bottom?: number };

/**
 * form-controls' Select, with its menu portalled to the body.
 *
 * The shared Select drops an absolute menu under its trigger, and Modal clips
 * its dialog with `overflow-hidden` for the rounded corners — so inside these
 * modals the object list was cut off at the footer. Same look and API; the
 * only difference is that the menu is fixed to the trigger's rect, measured
 * on the click that opens it, and flips above when there is no room below.
 */
export function FoldersSelect({
  value,
  options,
  onChange,
  placeholder = "",
  disabled,
  className,
  leading,
  "aria-label": ariaLabel,
}: {
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  leading?: React.ReactNode;
  "aria-label"?: string;
}) {
  const { effective } = useTheme();
  const [anchor, setAnchor] = React.useState<Anchor | null>(null);
  const [query, setQuery] = React.useState("");
  const menuRef = React.useRef<HTMLDivElement>(null);
  const open = anchor !== null;
  const current = options.find((o) => o.value === value);
  const searchable = options.length > 8;
  const shown = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Escape closes the menu and stops there, so the modal behind it stays up.
  // On window, not document: Modal listens on document in the capture phase
  // too, and window's capture runs first — stopPropagation on the same node
  // would not keep the modal's listener from firing.
  // Any scroll outside the menu closes it too: the rect it was pinned to has
  // moved, and a menu floating over the wrong row is worse than none.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setAnchor(null);
    };
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setAnchor(null);
    };
    const onResize = () => setAnchor(null);
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (open) {
      setAnchor(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    setQuery("");
    setAnchor(
      below < MENU_MAX + 12 && r.top > below
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4 }
        : { left: r.left, width: r.width, top: r.bottom + 4 },
    );
  };

  return (
    <div className={cn("relative min-w-0", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={toggle}
        className={cn(
          FIELD,
          "flex items-center gap-[8px] text-left motion-tap",
          disabled
            ? "cursor-not-allowed bg-pg text-pg-muted"
            : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        {leading}
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            current ? (disabled ? "text-pg-faint" : "text-pg-text") : "text-pg-faint",
          )}
        >
          {current?.label ?? placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {anchor && typeof document !== "undefined"
        ? createPortal(
            <div data-page-theme={effective.appTheme}>
              <button
                type="button"
                aria-label="Close options"
                tabIndex={-1}
                onClick={() => setAnchor(null)}
                className="fixed inset-0 z-[100] cursor-default"
              />
              <div
                ref={menuRef}
                role="listbox"
                style={{ left: anchor.left, width: anchor.width, top: anchor.top, bottom: anchor.bottom }}
                className="fixed z-[101] flex max-h-[280px] min-w-[200px] flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
              >
                {searchable ? (
                  <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
                    <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search"
                      className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
                    />
                  </div>
                ) : null}
                <div className="min-h-0 flex-1 overflow-y-auto p-[4px]">
                  {shown.length === 0 ? (
                    <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                      No matches
                    </p>
                  ) : null}
                  {shown.map((o) => {
                    const on = o.value === value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="option"
                        aria-selected={on}
                        onClick={() => {
                          onChange(o.value);
                          setAnchor(null);
                        }}
                        className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
                      >
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                            on ? "font-medium text-pg-heading" : "text-pg-text",
                          )}
                        >
                          {o.label}
                        </span>
                        {o.hint ? (
                          <span className="shrink-0 text-[12px] leading-[16px] text-pg-faint">
                            {o.hint}
                          </span>
                        ) : null}
                        {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** The 14px label above a control, with the red asterisk when required. */
export function FoldersLabel({
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

/**
 * The modal footer with its hairline: the divider runs edge to edge, so the
 * row is pulled out to the dialog's sides and padded back in.
 */
export function FoldersModalFooter({
  leading,
  children,
}: {
  leading?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-[16px] flex flex-1 items-center gap-[12px] border-t border-pg-head-border px-[16px] pt-[12px]">
      {leading}
      <span className="flex-1" />
      {children}
    </div>
  );
}

/** PrimaryButton's disabled look — the washed-out fill in the screenshots. */
export const DISABLED_PRIMARY =
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100";
