"use client";

/*
 * Conversations ▸ Inbox — the rail and list-column surfaces staging opens on
 * demand: the expanded inbox rail, the collapsed rail's Views menu, the sort
 * menu, the filter drawer, the bulk-select bar and its Actions menu, and the
 * empty states. Measured off switchyard-v4 staging (Oct 7, 2026, 1728px) like
 * staging-inbox.tsx, and rendered inside its root so the `--g*`/`--p*` aliases
 * resolve. Icons are staging's own paths.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import * as I from "./staging-icons";

type IconProps = { size?: number; className?: string };

function Svg({ size = 16, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

/* ─── Staging icons not in staging-icons.tsx ────────────────────────────── */

export function TableRows(p: IconProps) {
  return <Svg {...p}><path d="M3 9h18M3 15h18M7.8 3h8.4c1.68 0 2.52 0 3.162.327a3 3 0 011.311 1.311C21 5.28 21 6.12 21 7.8v8.4c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C18.72 21 17.88 21 16.2 21H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C3 18.72 3 17.88 3 16.2V7.8c0-1.68 0-2.52.327-3.162a3 3 0 011.311-1.311C5.28 3 6.12 3 7.8 3z" /></Svg>;
}
export function UserLeft(p: IconProps) {
  return <Svg {...p}><path d="M19 21l-3-3m0 0l3-3m-3 3h6m-10-2.5H7.5c-1.396 0-2.093 0-2.661.172a4 4 0 00-2.667 2.667C2 18.907 2 19.604 2 21M14.5 7.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></Svg>;
}
export function UserUp(p: IconProps) {
  return <Svg {...p}><path d="M16 18l3-3m0 0l3 3m-3-3v6m-7-5.5H7.5c-1.396 0-2.093 0-2.661.172a4 4 0 00-2.667 2.667C2 18.907 2 19.604 2 21M14.5 7.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></Svg>;
}
export function InfoCircle(p: IconProps) {
  return <Svg {...p}><path d="M12 16v-4m0-4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></Svg>;
}
export function PlusThin(p: IconProps) {
  return <Svg {...p}><path d="M12 5v14m-7-7h14" /></Svg>;
}
export function Chevron(p: IconProps) {
  return <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>;
}
export function ChevronLeft(p: IconProps) {
  return <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>;
}
export function Search(p: IconProps) {
  return <Svg {...p}><path d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z" /></Svg>;
}
export function XClose(p: IconProps) {
  return <Svg {...p}><path d="M17 7L7 17M7 7l10 10" /></Svg>;
}
export function CheckThick({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <path d="M50.42,16.76L22.34,39.45l-8.1-11.46c-1.12-1.58-3.3-1.96-4.88-0.84c-1.58,1.12-1.95,3.3-0.84,4.88l10.26,14.51c0.56,0.79,1.42,1.31,2.38,1.45c0.16,0.02,0.32,0.03,0.48,0.03c0.8,0,1.57-0.27,2.2-0.78l30.99-25.03c1.5-1.21,1.74-3.42,0.52-4.92C54.13,15.78,51.93,15.55,50.42,16.76z" />
    </svg>
  );
}
export function MailOpenIcon(p: IconProps) {
  return <Svg {...p}><path d="M13.744 2.633l7.528 4.894c.266.173.399.259.495.374a1 1 0 01.189.348c.044.143.044.302.044.62v7.33c0 1.681 0 2.521-.327 3.163a3 3 0 01-1.311 1.31C19.72 21 18.88 21 17.2 21H6.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C2 18.72 2 17.88 2 16.2V8.868c0-.317 0-.476.044-.62a1 1 0 01.189-.347c.096-.115.229-.201.495-.374l7.528-4.894m3.488 0c-.631-.41-.947-.615-1.287-.695a2 2 0 00-.914 0c-.34.08-.656.285-1.287.695m3.488 0l7.224 4.696c.344.224.516.335.576.477a.5.5 0 010 .388c-.06.141-.232.253-.576.477l-7.224 4.695c-.631.41-.947.616-1.287.696-.3.07-.613.07-.914 0-.34-.08-.656-.285-1.287-.696L3.032 8.671c-.344-.224-.516-.336-.576-.477a.5.5 0 010-.388c.06-.142.232-.253.576-.477l7.224-4.696" /></Svg>;
}
export function MailIcon(p: IconProps) {
  return <Svg {...p}><path d="M2 7l8.165 5.715c.661.463.992.695 1.351.784a2 2 0 00.968 0c.36-.09.69-.32 1.351-.784L22 7M6.8 20h10.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C22 17.72 22 16.88 22 15.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C19.72 4 18.88 4 17.2 4H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C2 6.28 2 7.12 2 8.8v6.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C4.28 20 5.12 20 6.8 20z" /></Svg>;
}
export function StarIcon(p: IconProps) {
  return <Svg {...p}><path d="M11.283 3.453c.23-.467.345-.7.502-.775a.5.5 0 01.43 0c.157.075.272.308.502.775l2.187 4.43c.068.138.102.207.152.26a.502.502 0 00.155.114c.067.03.143.042.295.064l4.891.715c.515.075.773.113.892.238a.5.5 0 01.133.41c-.023.172-.21.353-.582.716L17.3 13.846c-.11.108-.165.162-.2.226a.5.5 0 00-.06.183c-.009.072.004.148.03.3l.835 4.867c.088.514.132.77.05.922a.5.5 0 01-.349.253c-.17.032-.4-.09-.862-.332l-4.373-2.3c-.136-.07-.204-.107-.276-.12a.498.498 0 00-.192 0c-.072.013-.14.05-.276.12l-4.373 2.3c-.461.243-.692.364-.862.332a.5.5 0 01-.348-.253c-.083-.152-.039-.409.05-.922l.834-4.867c.026-.152.039-.228.03-.3a.5.5 0 00-.06-.184c-.035-.063-.09-.117-.2-.225L3.16 10.4c-.373-.363-.56-.544-.582-.716a.5.5 0 01.132-.41c.12-.125.377-.163.892-.238l4.891-.715c.152-.022.228-.034.295-.064a.5.5 0 00.155-.113c.05-.054.084-.123.152-.26l2.187-4.43z" /></Svg>;
}
export function StarOff(p: IconProps) {
  return <Svg {...p}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /><line x1="3" y1="3" x2="21" y2="21" /></Svg>;
}
export function TrashIcon(p: IconProps) {
  return <Svg {...p}><path d="M9 3h6M3 6h18m-2 0l-.701 10.52c-.105 1.578-.158 2.367-.499 2.965a3 3 0 01-1.298 1.215c-.62.3-1.41.3-2.993.3h-3.018c-1.582 0-2.373 0-2.993-.3A3 3 0 016.2 19.485c-.34-.598-.394-1.387-.499-2.966L5 6m5 4.5v5m4-5v5" /></Svg>;
}
export function UserCircleIcon(p: IconProps) {
  return <Svg {...p}><path d="M5.316 19.438A4.001 4.001 0 019 17h6a4.001 4.001 0 013.684 2.438M16 9.5a4 4 0 11-8 0 4 4 0 018 0zm6 2.5c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></Svg>;
}

/* ─── Shared bits ───────────────────────────────────────────────────────── */

/** Closes a popover on outside mousedown or Escape. */
function useDismiss(ref: React.RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [ref, open, onClose]);
}

const MENU_SHADOW =
  "shadow-[0_2px_4px_-2px_rgba(16,24,40,0.06),0_4px_8px_-2px_rgba(16,24,40,0.1)]";
const POPOVER_SHADOW =
  "shadow-[0_3px_6px_-4px_rgba(0,0,0,0.12),0_6px_16px_0_rgba(0,0,0,0.08),0_9px_28px_8px_rgba(0,0,0,0.05)]";

/* ─── Expanded inbox rail ───────────────────────────────────────────────── */

export type InboxMenuId =
  | "my-inbox-all"
  | "assigned-to-me"
  | "followed-by-me"
  | "team-inbox"
  | "internal-chat";

const MY_INBOX: { id: InboxMenuId; label: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { id: "my-inbox-all", label: "All", icon: TableRows },
  { id: "assigned-to-me", label: "Assigned to me", icon: UserLeft },
  { id: "followed-by-me", label: "Followed by me", icon: UserUp },
];

function RailItem({
  on,
  child,
  onClick,
  children,
}: {
  on: boolean;
  child?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={on || undefined}
      className={cn(
        "my-0.5 flex h-[30px] w-full items-center gap-1 overflow-hidden rounded-[4px] border px-2 py-1 text-left text-[14px] leading-5",
        child && "ml-3 h-8 w-[calc(100%-12px)]",
        on
          ? "border-[var(--p700)] bg-white font-normal text-[var(--p700)] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
          : "border-transparent text-[var(--g900)] hover:bg-[var(--g50)]",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The rail when `#conv-inbox-panel-toggle-button` is clicked: 222px wide
 * (collapsed is 52px), labelled buttons, a search field, and the menu. When
 * any conversation is checked staging disables New conversation and Import
 * — pass `actionsDisabled`.
 */
export function ExpandedInboxRail({
  menu,
  onMenu,
  onCollapse,
  autoFocusSearch,
  actionsDisabled,
}: {
  menu: InboxMenuId;
  onMenu: (id: InboxMenuId) => void;
  onCollapse: () => void;
  /** True when opened from the collapsed rail's search icon. */
  autoFocusSearch?: boolean;
  actionsDisabled?: boolean;
}) {
  const [myOpen, setMyOpen] = React.useState(true);
  const [viewsOpen, setViewsOpen] = React.useState(true);
  return (
    <div className="relative flex h-full w-[222px] shrink-0 flex-col items-start bg-white px-4 pt-4 pb-2 shadow-[inset_-1px_0_0_0_var(--g200)]">
      <button
        type="button"
        aria-label="Collapse inbox menu"
        onClick={onCollapse}
        className="absolute top-1/2 -right-3 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--g900)] shadow-md"
      >
        <ChevronLeft size={16} />
      </button>

      <div className={cn("mb-2 flex w-full shrink-0 flex-col items-center gap-3", actionsDisabled && "pointer-events-none opacity-50")}>
        <button
          type="button"
          className="flex h-8 w-full items-center justify-center gap-2 rounded-[5px] border border-[var(--p600)] bg-[var(--p600)] px-2.5 text-[13px] leading-[18px] font-semibold whitespace-nowrap text-white shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
        >
          <I.MessagePlus size={16} />
          New conversation
        </button>
        <button
          type="button"
          className="flex h-8 w-full items-center justify-center gap-2 rounded-[5px] border border-[var(--g300)] bg-white px-2.5 text-[13px] leading-[18px] font-semibold text-[var(--g600)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
        >
          <I.Download size={16} />
          Import
        </button>
      </div>
      <div className="w-full">
        <InboxSearch autoFocus={autoFocusSearch} />
      </div>

      <div className="mt-2 flex w-full flex-1 flex-col justify-between overflow-y-auto">
        <div className="w-full shrink-0">
          {/* My inbox */}
          <div className="my-1">
            <button
              type="button"
              onClick={() => setMyOpen((o) => !o)}
              aria-expanded={myOpen}
              className="flex h-[34px] w-full items-center justify-between pr-3"
            >
              <span className="my-0.5 flex h-[30px] items-center px-2 text-[14px] leading-5 text-[var(--g900)]">My inbox</span>
              <Chevron size={16} className={cn("text-[var(--g600)] transition-transform", myOpen && "rotate-180")} />
            </button>
            {myOpen
              ? MY_INBOX.map((m) => (
                  <RailItem key={m.id} child on={menu === m.id} onClick={() => onMenu(m.id)}>
                    <m.icon size={16} className="shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </RailItem>
                ))
              : null}
          </div>
          <div className="my-1">
            <RailItem on={menu === "team-inbox"} onClick={() => onMenu("team-inbox")}>
              <span className="truncate">Team inbox</span>
            </RailItem>
          </div>
          <div className="my-1">
            <RailItem on={menu === "internal-chat"} onClick={() => onMenu("internal-chat")}>
              <span className="truncate">Internal chat</span>
            </RailItem>
          </div>
          <div className="my-3 h-px w-full bg-[var(--g300)]" />

          {/* Views */}
          <div className="mx-1 my-3">
            <button
              type="button"
              onClick={() => setViewsOpen((o) => !o)}
              aria-expanded={viewsOpen}
              className="flex h-8 w-full items-center justify-between pr-3"
            >
              <span className="flex items-center px-1 text-[14px] leading-5 font-medium text-[var(--g700)]">
                Views
                <InfoCircle size={12} className="ml-1 text-[var(--g400)]" />
              </span>
              <Chevron size={16} className={cn("text-[var(--g600)] transition-transform", viewsOpen && "rotate-180")} />
            </button>
            {viewsOpen ? (
              <div className="mt-2">
                <button
                  type="button"
                  className="my-1 flex items-center px-2 text-[14px] leading-4 font-medium text-[var(--p700)] hover:font-semibold"
                >
                  <PlusThin size={14} className="mr-1.5 ml-0.5" />
                  Create view
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The rail's search field (190×32). Staging's collapsed-rail search icon
 * (`#conv-inbox-panel-search-button`) just expands the rail and focuses
 * this field — no separate popover or modal.
 */
export function InboxSearch({ autoFocus }: { autoFocus?: boolean }) {
  const [q, setQ] = React.useState("");
  const [focus, setFocus] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <div
      className={cn(
        "flex h-8 w-full items-center rounded-[4px] border bg-white px-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]",
        focus
          ? "border-[var(--p500)] shadow-[0_0_0_4px_var(--p50)]"
          : "border-[var(--g300)]",
      )}
    >
      <Search size={16} className="mr-1 shrink-0 text-[var(--g600)]" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder="Search"
        className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[var(--g900)] outline-none placeholder:text-[var(--g500)]"
      />
      {q ? (
        <button type="button" aria-label="Clear" onClick={() => setQ("")} className="ml-1 text-[var(--g400)]">
          <XClose size={14} />
        </button>
      ) : null}
    </div>
  );
}

/* ─── Collapsed rail: Views dropdown ────────────────────────────────────── */

/**
 * Opens to the right of the collapsed rail's Views icon
 * (`#views-collapsed-dropdown-trigger`). Wrap the 38px trigger in a
 * `relative` element and render this beside it.
 */
export function ViewsMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useDismiss(ref, open, onClose);
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="menu"
      className={cn("absolute top-0 left-full z-50 ml-1.5 w-[220px] rounded-[3px] bg-white py-1", POPOVER_SHADOW)}
    >
      <button
        type="button"
        role="menuitem"
        onClick={onClose}
        className="flex h-[29px] w-full items-center px-3 text-[14px] font-medium text-[var(--p700)] hover:font-semibold"
      >
        <span className="flex items-center px-1">
          <PlusThin size={14} className="mr-1.5 ml-0.5 shrink-0" />
          <span className="truncate">Create view</span>
        </span>
      </button>
    </div>
  );
}

/* ─── Sort menu ─────────────────────────────────────────────────────────── */

export const SORT_OPTIONS: { id: string; label: string; disabled?: boolean; hint?: string }[] = [
  { id: "latest-all", label: "Latest - All Messages" },
  { id: "oldest-all", label: "Oldest - All Messages" },
  { id: "latest-manual", label: "Latest - Manual Messages" },
  { id: "oldest-manual", label: "Oldest - Manual Messages" },
  { id: "engagement", label: "Engagement Score - High to Low" },
  { id: "sla-overdue", label: "Longest SLA Overdue", disabled: true, hint: "SLA has not been set. Go to Settings to configure." },
  { id: "sla-next", label: "Next SLA Target", disabled: true, hint: "SLA has not been set. Go to Settings to configure." },
];

/**
 * The sort button's (`#conv-sort-button-icon`) select menu, 287px wide.
 * Render inside a `relative` wrapper around the Filter/Sort icon pair; it
 * drops 4px below and aligns to the wrapper's right edge.
 */
export function SortMenu({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (id: string) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  useDismiss(ref, open, onClose);
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="listbox"
      className={cn(
        "absolute top-full right-0 z-50 my-1 w-[287px] rounded-[4px] border border-[var(--g300)] bg-white py-1",
        MENU_SHADOW,
      )}
    >
      {SORT_OPTIONS.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="option"
            aria-selected={on}
            disabled={o.disabled}
            onClick={() => {
              onChange(o.id);
              onClose();
            }}
            className={cn(
              "relative flex w-full flex-col items-start px-2 py-1 text-left",
              o.disabled ? "cursor-not-allowed text-[#c2c2c2]" : "text-[var(--g700)] hover:bg-[var(--g50)]",
            )}
          >
            <span className="text-[14px] leading-[18px]">{o.label}</span>
            {o.hint ? <span className="text-[11px] leading-4">{o.hint}</span> : null}
            {on ? (
              <CheckThick size={16} className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--p700)]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Filter drawer ─────────────────────────────────────────────────────── */

export const FILTER_TYPES = [
  "Engagement Score",
  "Assigned",
  "Follower",
  "Mention",
  "Last Message Direction",
  "Last Outbound Message Type",
  "Last Message Channel",
  "Tag",
  "SLA",
] as const;

function SelectBox({
  placeholder,
  value,
  disabled,
  options,
  onChange,
}: {
  placeholder: string;
  value?: string;
  disabled?: boolean;
  options?: readonly string[];
  onChange?: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex h-9 w-full items-center rounded-[6px] border py-2 pr-9 pl-3 text-left text-[14px] leading-5 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]",
          disabled
            ? "cursor-not-allowed border-[var(--g300)] bg-[var(--g50)] text-[var(--g400)]"
            : open
              ? "border-[var(--p500)] bg-white"
              : "border-[var(--g300)] bg-white",
        )}
      >
        <span className={cn("truncate", value ? "text-[var(--g900)]" : !disabled && "text-[var(--g500)]")}>
          {value ?? placeholder}
        </span>
        <Chevron size={16} className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--g500)]" />
      </button>
      {open && options ? (
        <div className={cn("absolute top-full right-0 left-0 z-10 my-1 max-h-[260px] overflow-y-auto rounded-[4px] border border-[var(--g300)] bg-white py-1", MENU_SHADOW)}>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange?.(o);
                setOpen(false);
              }}
              className="relative flex h-[26px] w-full items-center px-2 text-left text-[14px] leading-[18px] text-[var(--g700)] hover:bg-[var(--g50)]"
            >
              {o}
              {o === value ? <CheckThick size={16} className="absolute right-2 text-[var(--p700)]" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The 360px right drawer `#conv-filter-button-icon` opens, over a dimmed
 * page. Choosing a Filter type is local only; Apply stays a no-op (staging's
 * is disabled until a full condition exists).
 */
export function FilterDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = React.useState<string | undefined>();
  const [cond, setCond] = React.useState<string | undefined>();
  React.useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onClose]);
  if (!open) return null;
  const clear = () => {
    setType(undefined);
    setCond(undefined);
  };
  const canApply = Boolean(type && cond);
  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" onClick={onClose} />
      <div className="absolute top-0 right-0 bottom-0 flex w-[360px] flex-col overflow-hidden rounded-l-[3px] border border-[var(--g300)] bg-white text-[var(--g700)] shadow-[0_6px_16px_-9px_rgba(0,0,0,0.08),0_9px_28px_0_rgba(0,0,0,0.05),0_12px_48px_16px_rgba(0,0,0,0.03)]">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex h-[41px] w-full items-center justify-between border-b border-[var(--g300)] px-2 py-1">
            <div className="flex items-center gap-2">
              <I.FilterLines size={20} className="text-[var(--g600)]" />
              <span className="text-[16px] leading-[26px] font-medium text-[var(--g900)]">Filters</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clear} className="h-5 text-[14px] leading-5 font-semibold text-[var(--g600)]">
                Clear
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex h-8 w-7 items-center justify-center rounded-[4px] text-[var(--g600)] hover:bg-[var(--g50)]"
              >
                <XClose size={20} />
              </button>
            </div>
          </div>

          <div className="mx-2 my-4 bg-white">
            <div className="rounded-xl border border-[var(--g200)] bg-[var(--g50)]">
              <div className="space-y-1 p-2">
                <SelectBox placeholder="Filter Type" value={type} options={FILTER_TYPES} onChange={(v) => { setType(v); setCond(undefined); }} />
                <div className="mt-1 flex flex-col gap-1">
                  <SelectBox placeholder="Is" value={cond} disabled={!type} options={["Is", "Is not"]} onChange={setCond} />
                  <SelectBox placeholder="Value" disabled={!cond} options={[]} />
                </div>
              </div>
            </div>
            {/* AND / OR joiner, disabled until a condition exists */}
            <div className="flex flex-col items-center">
              <div className="ml-1 h-4 w-px border-l border-dotted border-[var(--g200)]" />
              <div className="flex h-[30px] items-center overflow-hidden rounded-[6px] border border-[var(--g200)]">
                <span className="mx-0.5 flex h-6 w-[43px] items-center justify-center text-[12px] leading-[17px] font-semibold text-[var(--g300)]">AND</span>
                <span className="h-6 w-px bg-[var(--g200)]" />
                <span className="mx-0.5 flex h-6 w-10 items-center justify-center text-[12px] leading-[17px] font-semibold text-[var(--g300)]">OR</span>
              </div>
              <div className="ml-1 h-4 w-px border-l border-dotted border-[var(--g200)]" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#efeff5] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-[var(--g300)] bg-white px-3.5 text-[14px] leading-5 font-semibold text-[var(--g600)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canApply}
            onClick={onClose}
            className={cn(
              "h-9 rounded-lg border px-3.5 text-[14px] leading-5 font-semibold text-white shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]",
              canApply ? "border-[var(--p600)] bg-[var(--p600)]" : "cursor-not-allowed border-[#b2ccff] bg-[#b2ccff]",
            )}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bulk select ───────────────────────────────────────────────────────── */

const BULK_ACTIONS: { label: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { label: "Mark as read", icon: MailOpenIcon },
  { label: "Mark as unread", icon: MailIcon },
  { label: "Add star", icon: StarIcon },
  { label: "Remove star", icon: StarOff },
  { label: "Delete conversations", icon: TrashIcon },
];

/**
 * Replaces the "Select all" row while anything is checked: the checkbox,
 * "N selected", and a primary 28px Actions dropdown. Actions are inert.
 * Pass the staging Checkbox as `checkbox` so the tick matches the rows.
 */
export function BulkBar({ count, checkbox }: { count: number; checkbox: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  return (
    <div className="flex min-h-[28px] w-full items-center justify-between">
      <label className="flex cursor-pointer items-center gap-1">
        {checkbox}
        <span className="truncate pl-1 text-[14px] leading-5 font-medium text-[var(--g600)] select-none">
          {count} selected
        </span>
      </label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-7 items-center gap-1 rounded-[5px] bg-[var(--p600)] px-2 text-[12px] font-semibold text-white"
        >
          Actions
          <Chevron size={16} className="shrink-0" />
        </button>
        {open ? (
          <div
            role="menu"
            className={cn("absolute top-full right-0 z-50 mt-1 w-[202px] rounded-[3px] bg-white py-1", POPOVER_SHADOW)}
          >
            <div className="flex flex-col gap-1">
              {BULK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  role="menuitem"
                  onClick={close}
                  className="flex h-[26px] w-full items-center gap-2 px-2 py-1 text-left text-[14px] text-[var(--g700)] hover:bg-[var(--g50)]"
                >
                  <a.icon size={16} className="shrink-0" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Empty states ──────────────────────────────────────────────────────── */

/**
 * The thread column when the list is empty (My inbox, Internal chat, …).
 * `scope` is the inbox's name as staging interpolates it: "All" for My inbox
 * ▸ All, "Internal chat" for Internal chat.
 */
export function CaughtUpEmpty({ scope, onViewAll }: { scope: string; onViewAll?: () => void }) {
  const label = scope === "All" ? "View All Conversations" : `View All ${scope} Conversations`;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white px-2 text-center">
      <div className="text-[20px] leading-7 font-medium text-[var(--g500)]">All Caught Up!</div>
      <p className="mt-1 text-[14px] leading-5 text-[var(--g400)]">
        You don&apos;t have any unread {scope} conversations right now.
      </p>
      <button
        type="button"
        onClick={onViewAll}
        className="mt-6 h-[37px] rounded-[6px] bg-[var(--p600)] px-6 text-[14px] text-white"
      >
        {label}
      </button>
    </div>
  );
}

/** Contact panel with nothing selected (inbox views). 251px text column. */
export function NoConversationSelected() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center">
      <UserCircleIcon size={40} className="mx-auto text-[var(--g400)]" />
      <p className="mt-2 w-[251px] text-[13px] leading-[18px] font-semibold text-[var(--root-ink)]">No conversation selected</p>
      <p className="w-[251px] text-[12px] leading-[17px] text-[var(--g500)]">
        Select a conversation from the list to view contact details.
      </p>
    </div>
  );
}

/** Contact panel for Internal chat with nothing selected. */
export function NoInternalChatSelected() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center">
      <UserCircleIcon size={52} className="text-[var(--g700)]" />
      <p className="mt-6 text-[20px] leading-7 text-[var(--g900)]">No Internal Chat Selected</p>
    </div>
  );
}

/** Internal chat's list only has two tabs and no filter, sort, or Select all. */
export const INTERNAL_CHAT_TABS = ["unread", "all"] as const;
