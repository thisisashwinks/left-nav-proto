"use client";

/*
 * The inbox's right-rail panels, the keyboard-shortcuts sheet and the
 * new-conversation modal, as the staging build draws them.
 *
 * Measured off switchyard-v4 staging (Oct 7, 2026, 1728px viewport) the same
 * way as staging-inbox.tsx: sizes, colours and weights come from computed
 * styles, icons are staging's own SVG paths. Staging's copy is kept verbatim
 * (title case, "client Actions", "No transactions yet! ..."), because the
 * point is to show what shipped.
 *
 * Panels are drop-in replacements for ContactPanel (299px, full height, same
 * shell). Modals and the sheet are `fixed`, and carry their own colour aliases
 * so they render correctly whether or not they sit inside the inbox root.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/* ─── Colour aliases (same as the inbox root) ───────────────────────────── */

const VARS = {
  "--g900": "var(--hr-gray-900)",
  "--g800": "var(--hr-gray-800)",
  "--g700": "var(--hr-gray-700)",
  "--g600": "var(--hr-gray-600)",
  "--g500": "var(--hr-gray-500)",
  "--g400": "var(--hr-gray-400)",
  "--g300": "var(--hr-gray-300)",
  "--g200": "var(--hr-gray-200)",
  "--g100": "var(--hr-gray-100)",
  "--g50": "var(--hr-gray-50)",
  "--p700": "var(--hr-primary-700)",
  "--p600": "var(--hr-primary-600)",
  "--p300": "var(--hr-primary-300)",
} as React.CSSProperties;

/* ─── Icons (staging's own paths) ───────────────────────────────────────── */

type IconProps = { size?: number; className?: string };

function Stroke({ size = 16, className, d }: IconProps & { d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const D = {
  plus: "M12 5v14m-7-7h14",
  close: "M17 7L7 17M7 7l10 10",
  search: "M21 21l-3.5-3.5m2.5-6a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z",
  searchSm: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  filterLines: "M6 12h12M3 6h18M9 18h6",
  clipboardCheck:
    "M16 4c.93 0 1.395 0 1.776.102a3 3 0 012.122 2.122C20 6.605 20 7.07 20 8v9.2c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C17.72 22 16.88 22 15.2 22H8.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C4 19.72 4 18.88 4 17.2V8c0-.93 0-1.395.102-1.776a3 3 0 012.122-2.122C6.605 4 7.07 4 8 4m1 11l2 2 4.5-4.5M9.6 6h4.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437C16 5.24 16 4.96 16 4.4v-.8c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C15.24 2 14.96 2 14.4 2H9.6c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C8 2.76 8 3.04 8 3.6v.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C8.76 6 9.04 6 9.6 6z",
  calendar:
    "M21 10H3m13-8v4M8 2v4m-.2 16h8.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C21 19.72 21 18.88 21 17.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C18.72 4 17.88 4 16.2 4H7.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C3 6.28 3 7.12 3 8.8v8.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C5.28 22 6.12 22 7.8 22z",
  file:
    "M14 11H8m2 4H8m8-8H8m12-.2v10.4c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C17.72 22 16.88 22 15.2 22H8.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C4 19.72 4 18.88 4 17.2V6.8c0-1.68 0-2.52.327-3.162a3 3 0 011.311-1.311C6.28 2 7.12 2 8.8 2h6.4c1.68 0 2.52 0 3.162.327a3 3 0 011.311 1.311C20 4.28 20 5.12 20 6.8z",
  chevronDown: "M6 9l6 6 6-6",
  linkExternal:
    "M21 9V3m0 0h-6m6 0l-9 9m-2-9H7.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C3 5.28 3 6.12 3 7.8v8.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C5.28 21 6.12 21 7.8 21h8.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C21 18.72 21 17.88 21 16.2V14",
  keyboard:
    "M6 10h.01M8 14h.01M10 10h.01M12 14h.01M14 10h.01M16 14h.01M18 10h.01M5.2 18h13.6c1.12 0 1.68 0 2.108-.218a2 2 0 00.874-.874C22 16.48 22 15.92 22 14.8V9.2c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C20.48 6 19.92 6 18.8 6H5.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C2 7.52 2 8.08 2 9.2v5.6c0 1.12 0 1.68.218 2.108a2 2 0 00.874.874C3.52 18 4.08 18 5.2 18z",
};

/** Naive UI's filled chevron used by staging's selects. */
function SelectChevron({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M3.14645 5.64645C3.34171 5.45118 3.65829 5.45118 3.85355 5.64645L8 9.79289L12.1464 5.64645C12.3417 5.45118 12.6583 5.45118 12.8536 5.64645C13.0488 5.84171 13.0488 6.15829 12.8536 6.35355L8.35355 10.8536C8.15829 11.0488 7.84171 11.0488 7.64645 10.8536L3.14645 6.35355C2.95118 6.15829 2.95118 5.84171 3.14645 5.64645Z" fill="currentColor" />
    </svg>
  );
}

/* ─── Panel shell ───────────────────────────────────────────────────────── */

/*
 * Staging's panel shell: 8px top / 16px bottom padding on the white card, a
 * 32px header row (title 14/20 medium gray-900, a tiny "+ Add" text button and
 * a 32px close), then the panel's own content inset 16px.
 */
function PanelShell({
  title,
  onClose,
  onAdd,
  children,
}: {
  title: string;
  onClose: () => void;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-[299px] shrink-0 overflow-hidden rounded-lg">
      <div className="flex h-full w-full flex-col bg-white pt-2 pb-4">
        <div className="flex h-8 shrink-0 items-center justify-between px-4">
          <p className="text-[14px] leading-5 font-medium text-[var(--g900)]">{title}</p>
          <div className="flex items-center">
            {onAdd !== undefined ? (
              <button
                type="button"
                onClick={onAdd}
                className="mr-0 flex h-4 items-center gap-1 rounded-[4px] text-[var(--g700)] hover:text-[var(--g900)]"
              >
                <Stroke d={D.plus} size={14} />
                <span className="text-[11px] leading-4 font-semibold">Add</span>
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-[4px] text-[var(--g600)] hover:bg-[var(--g50)]"
            >
              <Stroke d={D.close} size={16} />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

/** 32px HighRise input: 4px radius, gray-300 border, xs shadow, 16px lead icon. */
function PanelSearch({ placeholder, trailing }: { placeholder: string; trailing?: React.ReactNode }) {
  return (
    <div className="shrink-0 px-4">
      <label className="flex h-8 w-full items-center gap-1 rounded-[4px] border border-[var(--g300)] bg-white px-2 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] focus-within:border-[var(--p300)]">
        <span className="text-[var(--g500)]">
          <Stroke d={placeholder === "Search by title" ? D.search : D.searchSm} size={16} />
        </span>
        <input
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] leading-[21px] text-[var(--g900)] outline-none placeholder:text-[var(--g700)]"
        />
        {trailing}
      </label>
    </div>
  );
}

/** Staging's segmented control: 26px, gray-25 track, white segments, selected gray-200. */
function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="shrink-0 px-4">
      <div className="flex h-[26px] w-full overflow-hidden rounded-[4px] border border-[var(--g200)] bg-[#f7f7fa]">
        {options.map((o, i) => {
          const on = o === value;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={cn(
                "flex h-6 flex-1 items-center justify-center px-2 text-[12px] leading-[18px] font-medium",
                i < options.length - 1 && "border-r border-[#e5e7eb]",
                on ? "bg-[var(--g200)] text-[var(--g900)]" : "bg-white text-[var(--g600)] hover:bg-[var(--g50)]",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Staging's "search not found" empty state, reused for every panel. */
function EmptyState({ icon, title, description, action }: { icon: string; title: string; description: string; action: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-[var(--g100)] text-[var(--g600)]">
        <Stroke d={icon} size={24} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] leading-[18px] font-semibold text-[#607179]">{title}</p>
        <p className="text-[13px] leading-[18px] text-[var(--g500)]">{description}</p>
      </div>
      <button
        type="button"
        className="flex h-6 items-center rounded-[4px] border border-[var(--g300)] bg-white px-1.5 text-[11px] leading-4 font-semibold text-[var(--g600)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[var(--g50)]"
      >
        {action}
      </button>
    </div>
  );
}

/* ─── Tasks ─────────────────────────────────────────────────────────────── */

export function TasksPanel({ onClose }: { onClose: () => void }) {
  return (
    <PanelShell title="Tasks" onClose={onClose} onAdd={() => {}}>
      <div className="flex flex-col gap-4">
        <div className="pt-1">
          <PanelSearch
            placeholder="Search by title"
            trailing={
              <button type="button" aria-label="Filter" className="ml-4 text-[var(--g600)]">
                <Stroke d={D.filterLines} size={16} />
              </button>
            }
          />
        </div>
        <div className="px-4">
          <EmptyState
            icon={D.clipboardCheck}
            title="No tasks yet"
            description="Stay organized by creating your first task."
            action="Add task"
          />
        </div>
      </div>
    </PanelShell>
  );
}

/* ─── Appointments ──────────────────────────────────────────────────────── */

export function AppointmentsPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = React.useState("Upcoming");
  return (
    <PanelShell title="Appointments" onClose={onClose} onAdd={() => {}}>
      <PanelSearch placeholder="Search by Calendar Name" />
      <div className="pt-2 pb-5">
        <Segmented options={["Upcoming", "Past"]} value={tab} onChange={setTab} />
      </div>
      <div className="px-4 pt-[80px]">
        <EmptyState
          icon={D.calendar}
          title="No appointments yet"
          description="Keep things moving by creating your first appointment."
          action="Add Appointment"
        />
      </div>
    </PanelShell>
  );
}

/* ─── Documents ─────────────────────────────────────────────────────────── */

export function DocumentsPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = React.useState("All");
  return (
    <PanelShell title="Documents" onClose={onClose} onAdd={() => {}}>
      <PanelSearch placeholder="Search by document name" />
      <div className="pt-2 pb-4">
        <Segmented options={["All", "Internal", "Sent", "Received"]} value={tab} onChange={setTab} />
      </div>
      <div className="px-4">
        <EmptyState
          icon={D.file}
          title="No documents yet"
          description="Upload or send documents to see them listed here."
          action="Add documents"
        />
      </div>
    </PanelShell>
  );
}

/* ─── Payments ──────────────────────────────────────────────────────────── */

const PAYMENT_CARDS = [
  { title: "Transactions", empty: "No transactions found" },
  { title: "Subscriptions", empty: "No subscriptions found" },
  { title: "Invoices", empty: "No invoices found" },
  { title: "Estimates", empty: "No estimates found" },
];

export function PaymentsPanel({ onClose }: { onClose: () => void }) {
  return (
    <PanelShell title="Payments" onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="flex h-[54px] items-start">
          <p className="w-[134px] text-[12px] leading-[18px] text-[#607179]">
            No transactions yet! Create a new payment now
          </p>
          <div className="flex flex-1 justify-end">
            <button
              type="button"
              className="flex h-8 items-center gap-1 rounded-lg border border-[var(--g300)] bg-white p-2 text-[13px] leading-[13px] font-medium text-[var(--g700)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[var(--g50)]"
            >
              Actions
              <Stroke d={D.chevronDown} size={20} />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-4 pb-4">
          {PAYMENT_CARDS.map((c) => (
            <div
              key={c.title}
              className="overflow-hidden rounded-lg bg-white shadow-[0_1px_3px_0_rgba(16,24,40,0.1),0_1px_2px_0_rgba(16,24,40,0.06)]"
            >
              <div className="flex h-11 items-center justify-between px-4 py-3">
                <p className="text-[13px] leading-5 font-medium text-black">{c.title}</p>
                <a href="#" aria-label={`Open ${c.title}`} className="text-[var(--g700)]" onClick={(e) => e.preventDefault()}>
                  <Stroke d={D.linkExternal} size={16} />
                </a>
              </div>
              <div className="grid h-[38px] grid-cols-3 bg-[var(--g50)]">
                {["Date", "Amount", "Status"].map((h) => (
                  <div key={h} className="p-2.5 text-[12px] leading-[18px] font-medium text-[var(--g500)]">
                    {h}
                  </div>
                ))}
              </div>
              <div className="flex h-[116px] items-center justify-center py-12">
                <p className="text-[13px] leading-5 text-[var(--g500)]">{c.empty}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

/* ─── Keyboard shortcuts sheet ──────────────────────────────────────────── */

/*
 * Staging opens a bottom sheet, not a modal: full width, 240px tall, docked to
 * the viewport's foot with no mask. Four tabs; three-column grid of rows.
 * Keys are image keycaps (30px; ⇧ and ranges 60px; Enter 80px).
 */

type Shortcut = { label: string; keys: string[][] };

const SHORTCUT_TABS: { id: string; label: string; rows: Shortcut[] }[] = [
  {
    id: "navigation",
    label: "Navigation",
    rows: [
      { label: "Navigate between conversations", keys: [["↑"], ["↓"]] },
      { label: "Navigate between conversation tabs", keys: [["←"], ["→"]] },
      { label: "Select all conversations", keys: [["⌘", "A"]] },
      { label: "Select multiple conversations", keys: [["⇧", "↑"], ["⇧", "↓"]] },
      { label: "Search Conversation", keys: [["/"]] },
      { label: "Expand / Close Left Sidebar", keys: [["⌘", "⌥", "["]] },
      { label: "Expand / Close Right Sidebar", keys: [["⌘", "⌥", "]"]] },
      { label: "Switch right panel tabs", keys: [["⌘", "1-8"]] },
      { label: "Switch between the clients tabs", keys: [["⌥", "1-3"]] },
    ],
  },
  {
    id: "actions",
    label: "Conversation Actions",
    rows: [
      { label: "Focus on Composer", keys: [["Enter"]] },
      { label: "Star Conversation", keys: [["⌥", "S"]] },
      { label: "Unstar Conversation", keys: [["⌥", "⇧", "S"]] },
      { label: "Mark as read", keys: [["⌥", "R"]] },
      { label: "Mark as unread", keys: [["⌥", "U"]] },
      { label: "Archive/Unarchive conversation", keys: [["⌥", "E"]] },
    ],
  },
  {
    id: "composer",
    label: "Composer",
    rows: [
      { label: "Expand/Collapse Composer", keys: [["⌘", "⇧", "C"]] },
      { label: "Switch Between Channels (Next)", keys: [["⌥", "↓"]] },
      { label: "Switch Between Channels (Previous)", keys: [["⌥", "↑"]] },
      { label: "Send Message", keys: [["Enter"]] },
      { label: "Send Email", keys: [["⌘", "Enter"]] },
      { label: "Schedule Message or Email", keys: [["⌘", "⇧", "Enter"]] },
    ],
  },
  {
    id: "record-actions",
    label: "client Actions",
    rows: [
      { label: "Open Owner Dropdown", keys: [["⌥", "O"]] },
      { label: "Open Followers Dropdown", keys: [["⌥", "F"]] },
      { label: "Open Tags Dropdown", keys: [["⌥", "T"]] },
      { label: "Call client (Phone)", keys: [["⌥", "C"]] },
      { label: "Save Record Changes", keys: [["⌘", "S"]] },
      { label: "Toggle Empty Fields Visibility", keys: [["⌥", "H"]] },
    ],
  },
];

/** CSS rebuild of staging's keycap SVG: gray-200→300 gradient cap, inset face, gray-600 glyph. */
function Keycap({ k }: { k: string }) {
  const w = k === "Enter" ? 80 : k === "⇧" || k.includes("-") ? 60 : 30;
  return (
    <span
      className="relative inline-flex h-[30px] shrink-0 items-center justify-center rounded-[6px] border border-[rgba(124,124,124,0.3)] bg-[linear-gradient(176deg,#eaecf0,#d0d5dd)]"
      style={{ width: w }}
    >
      <span className="absolute inset-[3px] rounded-[3.7px] bg-[linear-gradient(176deg,#d0d5dd,#eaecf0)]" />
      <span className="relative text-[13px] leading-none font-semibold text-[#475467] [text-shadow:1px_1px_0_rgba(255,255,255,0.9)]">
        {k}
      </span>
    </span>
  );
}

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = React.useState("navigation");
  const active = SHORTCUT_TABS.find((t) => t.id === tab)!;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Keyboard Shortcuts"
      style={VARS}
      className="fixed inset-x-0 bottom-0 z-[1000] h-[240px] rounded-t-[3px] bg-white p-2 shadow-[0_6px_16px_-9px_rgba(0,0,0,0.08),0_9px_28px_0_rgba(0,0,0,0.05),0_12px_48px_16px_rgba(0,0,0,0.03)]"
    >
      <div className="flex h-[41px] items-stretch border-b border-[var(--g200)]">
        <div className="flex shrink-0 items-center gap-3 text-[var(--g700)]">
          <Stroke d={D.keyboard} size={20} />
          <p className="text-[16px] leading-6 font-semibold">Keyboard Shortcuts</p>
        </div>
        <div className="flex flex-1 justify-center gap-2">
          {SHORTCUT_TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex h-10 items-center px-2 py-2.5 text-[14px] leading-5",
                  on ? "font-semibold text-[var(--p700)]" : "font-medium text-[var(--g600)] hover:text-[var(--g800)]",
                )}
              >
                {t.label}
                {on ? <span className="absolute inset-x-0 -bottom-px h-px bg-[var(--p700)]" /> : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex size-10 shrink-0 items-center justify-center rounded-[4px] text-[var(--g600)] hover:bg-[var(--g50)]"
        >
          <Stroke d={D.close} size={20} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-x-8 px-4 pt-3">
        {active.rows.map((r, i) => {
          const lastRow = i >= Math.floor((active.rows.length - 1) / 3) * 3;
          return (
            <div
              key={r.label}
              className={cn("flex h-[51px] items-center justify-between py-2.5", !lastRow && "border-b border-[var(--g100)]")}
            >
              <span className="truncate text-[14px] leading-5 text-[var(--g900)]">{r.label}</span>
              <div className="flex shrink-0 items-center gap-2">
                {r.keys.map((combo, ci) => (
                  <React.Fragment key={ci}>
                    {ci > 0 ? <span className="text-[14px] leading-5 text-[var(--g700)]">or</span> : null}
                    <span className="flex items-center gap-2">
                      {combo.map((k) => (
                        <Keycap key={k} k={k} />
                      ))}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── New conversation modal ────────────────────────────────────────────── */

const MODAL_SHADOW =
  "shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]";

function ModalFrame({
  width,
  onClose,
  title,
  children,
}: {
  width: number;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={VARS} className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(16,24,40,0.7)] backdrop-blur-[4px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn("relative rounded-lg bg-white", MODAL_SHADOW)} style={{ width }}>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-[1] flex size-5 items-center justify-center rounded-[4px] text-[var(--g700)] hover:bg-[var(--g100)]"
        >
          <Stroke d={D.close} size={20} />
        </button>
        <div className="flex items-center pt-4 pr-[42px] pl-4">{title}</div>
        {children}
      </div>
    </div>
  );
}

function ChooserCard({ img, caption, cta, onClick }: { img: string; caption: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex-1 rounded-[5px] border-2 border-[var(--g200)] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-col items-center justify-center gap-1 p-6">
        <div className="flex h-36 w-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="h-full w-full object-contain" />
        </div>
        <div className="flex w-full items-center justify-center px-2">
          <p className="my-1 text-center text-[14px] leading-5 text-[var(--g700)] opacity-80">{caption}</p>
        </div>
        <div className="flex flex-col items-center self-stretch p-2">
          <button
            type="button"
            onClick={onClick}
            className="flex h-10 items-center justify-center rounded-lg border border-[#84adff] bg-white px-3.5 py-2 text-[14px] leading-5 font-semibold whitespace-nowrap text-[var(--p700)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[var(--hr-primary-50)]"
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}

function Required() {
  return <span className="ml-0.5 text-[#ef4444]">*</span>;
}

/** 32px HighRise select with a 16px leading search icon and Naive's filled chevron. */
function SearchSelect({ placeholder }: { placeholder: string }) {
  return (
    <button
      type="button"
      className="relative flex h-8 w-full items-center rounded-[4px] border border-[var(--g300)] bg-white px-7 text-left shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:border-[var(--p300)]"
    >
      <span className="absolute left-2 text-[var(--g500)]">
        <Stroke d={D.search} size={16} />
      </span>
      <span className="flex-1 truncate text-[14px] leading-[18px] text-[var(--g500)]">{placeholder}</span>
      <span className="absolute right-2 text-[var(--g500)]">
        <SelectChevron size={16} />
      </span>
    </button>
  );
}

function Radio({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-1" onClick={onClick}>
      <span
        className={cn(
          "relative flex size-4 items-center justify-center rounded-full border",
          on ? "border-[var(--p600)] bg-[var(--p600)]" : "border-[var(--g400)] bg-white",
        )}
      >
        {on ? <span className="size-1.5 rounded-full bg-white" /> : null}
      </span>
      <span className="text-[14px] leading-5 font-light text-[var(--g700)]">{label}</span>
    </label>
  );
}

function FormFooter({ onBack, primary }: { onBack: () => void; primary: string }) {
  return (
    <div className="mt-6 border-t border-[var(--g200)] px-6 py-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 items-center rounded-lg border border-[var(--g300)] bg-white px-3.5 py-2 text-[14px] leading-5 font-semibold text-[var(--g600)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[var(--g50)]"
        >
          Back
        </button>
        {/* Disabled until a contact/participant is chosen: primary-200 fill. */}
        <button
          type="button"
          disabled
          className="flex h-9 cursor-not-allowed items-center rounded-lg border border-[#b2ccff] bg-[#b2ccff] px-3.5 py-2 text-[14px] leading-5 font-semibold text-white shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
        >
          {primary}
        </button>
      </div>
    </div>
  );
}

export function NewConversationModal({
  onClose,
  initialStep = "chooser",
}: {
  onClose: () => void;
  initialStep?: "chooser" | "contacts" | "teammates";
}) {
  const [step, setStep] = React.useState(initialStep);
  const [kind, setKind] = React.useState<"single" | "group">("single");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (step === "contacts") {
    return (
      <ModalFrame
        width={500}
        onClose={onClose}
        title={<h2 className="m-0 px-1 text-[14px] leading-5 font-semibold text-[var(--g700)]">Conversation With Contacts</h2>}
      >
        <div className="mt-4 flex flex-col gap-2 px-6">
          <div className="flex flex-col gap-2">
            <div className="text-[14px] leading-5 text-[var(--g700)]">
              I want to have a<Required />
            </div>
            <div className="flex items-center gap-8">
              <Radio on={kind === "single"} label="Single Contact Conversation" onClick={() => setKind("single")} />
              <Radio on={kind === "group"} label="Group Conversation" onClick={() => setKind("group")} />
            </div>
          </div>
          <div className="flex flex-col gap-2 py-1">
            <div className="flex flex-col gap-1">
              <label className="text-[14px] leading-5 font-medium text-[var(--g700)]">
                {kind === "single" ? "Select Contact" : "Select Contacts"}
                <Required />
              </label>
              <SearchSelect placeholder={kind === "single" ? "Select Contact" : "Select Contacts"} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[14px] leading-5 font-medium text-[var(--g700)]">
                Chat Type<Required />
              </label>
              <SearchSelect placeholder="Select Chat Type" />
            </div>
          </div>
        </div>
        <FormFooter onBack={() => setStep("chooser")} primary="Create Conversation" />
      </ModalFrame>
    );
  }

  if (step === "teammates") {
    return (
      <ModalFrame
        width={500}
        onClose={onClose}
        title={<h2 className="m-0 text-[14px] leading-5 font-semibold text-[var(--g700)]">Conversation With Teammates</h2>}
      >
        <div className="mt-4 px-6">
          <label className="relative flex h-9 w-full items-center gap-2 rounded-[6px] border border-[#d1d5db] bg-white px-9 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] focus-within:border-[var(--p300)]">
            <span className="absolute left-3 text-[var(--g500)]">
              <Stroke d={D.search} size={20} />
            </span>
            <input
              autoFocus
              placeholder="Search Participants"
              className="h-5 w-full bg-transparent text-[14px] leading-5 text-[var(--g900)] outline-none placeholder:text-[var(--g500)]"
            />
          </label>
        </div>
        <FormFooter onBack={() => setStep("chooser")} primary="Create Internal Chat" />
      </ModalFrame>
    );
  }

  return (
    <ModalFrame
      width={730}
      onClose={onClose}
      title={
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[14px] leading-5 font-semibold text-[var(--g700)]">Start a new conversation</h2>
          <p className="m-0 text-[14px] leading-[19px] font-normal text-[var(--g900)]">
            Initiate and manage conversations to streamline communication, reduce response times, and keep your
            workflow on track.
          </p>
        </div>
      }
    >
      <div className="mt-4 mb-4 flex w-full flex-col items-center px-4">
        <div className="flex w-full gap-2">
          <ChooserCard
            img="/staging/conversation-contacts.svg"
            caption="Message one or more contacts"
            cta="Message Contacts"
            onClick={() => setStep("contacts")}
          />
          <ChooserCard
            img="/staging/conversation-teammates.svg"
            caption="Message one or more teammates"
            cta="Message Teammates"
            onClick={() => setStep("teammates")}
          />
        </div>
      </div>
    </ModalFrame>
  );
}

export type RailPanelId = "contact" | "tasks" | "appointments" | "documents" | "payments";
