"use client";

/*
 * The thread column's secondary surfaces, read off staging (Oct 7, 2026):
 * the Notes / Activity / Associations tabs, the header's channel filter and
 * delete confirm, the email card's expanded body and ⋮ menu, and the
 * composer's expanded (email) state with its channel and send-option menus.
 *
 * Everything renders inside the staging root, so the `--g*` / `--p*` aliases
 * resolve. Dropdowns are `absolute` — mount them under a `relative` anchor.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import * as I from "./staging-icons";

type IconProps = { size?: number; className?: string };

function Svg({ size = 16, className, children, viewBox = "0 0 24 24" }: IconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

/* ─── Icons (staging's exact paths) ─────────────────────────────────────── */

const Pencil = (p: IconProps) => (
  <Svg {...p}><path d="M21 21h-8m-10.5.5l5.55-2.134c.354-.137.532-.205.698-.294.147-.08.288-.171.42-.274.149-.115.283-.25.552-.518L21 7a2.828 2.828 0 10-4-4L5.72 14.28c-.269.268-.403.403-.519.552a2.997 2.997 0 00-.273.42c-.089.166-.157.344-.294.699L2.5 21.5zm0 0l2.058-5.351c.147-.383.221-.575.347-.662a.5.5 0 01.38-.08c.15.028.295.173.585.463l2.26 2.26c.29.29.435.434.464.585a.5.5 0 01-.08.38c-.089.126-.28.2-.663.347L2.5 21.5z" /></Svg>
);
const SearchIcon = (p: IconProps) => <Svg {...p}><path d="M21 21l-3.5-3.5m2.5-6a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z" /></Svg>;
const Lines = (p: IconProps) => <Svg {...p}><path d="M6 12h12M3 6h18M9 18h6" /></Svg>;
const PlusIcon = (p: IconProps) => <Svg {...p}><path d="M12 5v14m-7-7h14" /></Svg>;
const ClockRefresh = (p: IconProps) => <Svg {...p}><path d="M22.7 11.5l-2 2-2-2m2.245 1.5A9 9 0 1019 17.657M12 7v5l3 2" /></Svg>;
const LinkExternal = (p: IconProps) => (
  <Svg {...p}><path d="M21 9V3m0 0h-6m6 0l-8 8m-3-6H7.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C3 7.28 3 8.12 3 9.8v6.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C5.28 21 6.12 21 7.8 21h6.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C19 18.72 19 17.88 19 16.2V14" /></Svg>
);
const XClose = (p: IconProps) => <Svg {...p}><path d="M17 7L7 17M7 7l10 10" /></Svg>;
const ChevronUp = (p: IconProps) => <Svg {...p}><path d="M18 15l-6-6-6 6" /></Svg>;
const ReplyIcon = (p: IconProps) => <Svg {...p}><path d="M9 14L4 9m0 0l5-5M4 9h6.4c3.36 0 5.04 0 6.324.654a6 6 0 012.622 2.622C20 13.56 20 15.24 20 18.6V20" /></Svg>;
const InfoCircle = (p: IconProps) => <Svg {...p}><path d="M12 16v-4m0-4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></Svg>;
const Forward = (p: IconProps) => <Svg {...p}><path d="M4 20v-1.4c0-3.36 0-5.04.654-6.324a6 6 0 012.622-2.622C8.56 9 10.24 9 13.6 9H20m0 0l-5 5m5-5l-5-5" /></Svg>;
const ForwardThread = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2 13.333v-.875c0-2.1 0-3.15.409-3.952a3.75 3.75 0 011.638-1.639c.802-.409 1.186-.409 3.286-.409h4m0 0L8.208 9.583m3.125-3.125L8.208 3.333M11.333 3l3.334 3.333-3.334 3.334" />
  </svg>
);
const ReplyAll = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 15 12" fill="none" className={className} aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M5.419 1.86431C5.71189 1.57142 5.71189 1.09655 5.419 0.803654C5.12611 0.510761 4.65124 0.510761 4.35834 0.803654L0.858342 4.30365C0.565449 4.59655 0.565449 5.07142 0.858342 5.36431L4.35834 8.86431C4.65124 9.15721 5.12611 9.15721 5.419 8.86431C5.71189 8.57142 5.71189 8.09655 5.419 7.80365L2.44933 4.83398L5.419 1.86431ZM7.94678 2.44765C8.23967 2.15475 8.23967 1.67988 7.94678 1.38699C7.65389 1.09409 7.17901 1.09409 6.88612 1.38699L3.96945 4.30365C3.67656 4.59655 3.67656 5.07142 3.96945 5.36431L6.88612 8.28098C7.17901 8.57387 7.65389 8.57387 7.94678 8.28098C8.23967 7.98809 8.23967 7.51321 7.94678 7.22032L6.31044 5.58398H8.23312C9.22558 5.58398 9.92483 5.58457 10.4708 5.62918C11.0081 5.67307 11.3306 5.75583 11.5816 5.88372C12.099 6.14737 12.5197 6.56806 12.7834 7.08551C12.9113 7.3365 12.994 7.65901 13.0379 8.19627C13.0825 8.74227 13.0831 9.44152 13.0831 10.434V11.2507C13.0831 11.6649 13.4189 12.0007 13.8331 12.0007C14.2473 12.0007 14.5831 11.6649 14.5831 11.2507V10.434V10.4014C14.5831 9.44892 14.5831 8.68838 14.5329 8.07412C14.4815 7.4441 14.3735 6.90222 14.1199 6.40452C13.7124 5.60484 13.0623 4.95467 12.2626 4.54721C11.7649 4.29362 11.223 4.18563 10.593 4.13416C9.97872 4.08397 9.21817 4.08398 8.26572 4.08398H8.23312H6.31044L7.94678 2.44765Z" />
  </svg>
);
const MailIcon = (p: IconProps) => (
  <Svg {...p}><path d="M2 7l8.165 5.715c.661.463.992.695 1.351.784a2 2 0 00.968 0c.36-.09.69-.32 1.351-.784L22 7M6.8 20h10.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C22 17.72 22 16.88 22 15.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C19.72 4 18.88 4 17.2 4H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C2 6.28 2 7.12 2 8.8v6.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C4.28 20 5.12 20 6.8 20z" /></Svg>
);
const EyeIcon = (p: IconProps) => (
  <Svg {...p}><path d="M2.42 12.713c-.136-.215-.204-.323-.242-.49a1.173 1.173 0 010-.446c.038-.167.106-.274.242-.49C3.546 9.505 6.895 5 12 5s8.455 4.505 9.58 6.287c.137.215.205.323.243.49.029.125.029.322 0 .446-.038.167-.106.274-.242.49C20.455 14.495 17.105 19 12 19c-5.106 0-8.455-4.505-9.58-6.287z" /><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /></Svg>
);
const SendIcon = (p: IconProps) => (
  <Svg {...p}><path d="M10.5 13.5L21 3M10.627 13.828l2.628 6.758c.232.596.347.893.514.98a.5.5 0 00.462 0c.167-.086.283-.384.515-.979l6.59-16.888c.21-.537.315-.806.258-.977a.5.5 0 00-.316-.316c-.172-.057-.44.048-.978.257L3.413 9.253c-.595.233-.893.349-.98.516a.5.5 0 000 .461c.087.167.385.283.98.514l6.758 2.629c.121.046.182.07.233.106a.5.5 0 01.116.117c.037.05.06.111.107.232z" /></Svg>
);
const Sparkle = (p: IconProps) => (
  // Not captured (staging renders it as an <img>); a plain sparkle stand-in.
  <Svg {...p}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" /></Svg>
);
const Dismiss12 = ({ size = 14, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" className={className} aria-hidden="true">
    <path d="M2.146 2.146a.5.5 0 01.708 0L6 5.293l3.146-3.147a.5.5 0 01.708.708L6.707 6l3.147 3.146a.5.5 0 01-.708.708L6 6.707 2.854 9.854a.5.5 0 01-.708-.708L5.293 6 2.146 2.854a.5.5 0 010-.708z" />
  </svg>
);

/* Composer toolbar, left to right. */
const TOOLBAR: { label: string; vb?: string; d: string; fill?: boolean }[] = [
  { label: "Formatting", vb: "0 0 20 20", fill: true, d: "M9.498 12H5.17l-1.334 3.333H2.4L6.667 4.666H8l4.267 10.667h-1.436l-1.333-3.334zm-.534-1.334l-1.63-4.077-1.63 4.077h3.26zm7.036-.31V10h1.334v5.334H16v-.357a2.667 2.667 0 110-4.62zM14.667 14a1.333 1.333 0 100-2.666 1.333 1.333 0 000 2.666z" },
  { label: "Emoji", d: "M8 14s1.5 2 4 2 4-2 4-2m-1-5h.01M9 9h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zm-6.5-3a.5.5 0 11-1 0 .5.5 0 011 0zm-6 0a.5.5 0 11-1 0 .5.5 0 011 0z" },
  { label: "Link", d: "M9 17H7A5 5 0 017 7h2m6 10h2a5 5 0 000-10h-2m-8 5h10" },
  { label: "Attach", d: "M17.5 5.256V16.5a5.5 5.5 0 11-11 0V5.667a3.667 3.667 0 017.333 0v10.779a1.833 1.833 0 11-3.666 0V6.65" },
  { label: "Templates", d: "M14 2.27V6.4c0 .56 0 .84.109 1.054a1 1 0 00.437.437c.214.11.494.11 1.054.11h4.13M16 13H8m8 4H8m2-8H8m6-7H8.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C4 4.28 4 5.12 4 6.8v10.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C6.28 22 7.12 22 8.8 22h6.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C20 19.72 20 18.88 20 17.2V8l-6-6z" },
  { label: "Trigger links", d: "M13 2L4.093 12.688c-.348.418-.523.628-.525.804a.5.5 0 00.185.397c.138.111.41.111.955.111H12l-1 8 8.907-10.688c.348-.418.523-.628.525-.804a.5.5 0 00-.185-.397c-.138-.111-.41-.111-.955-.111H12l1-8z" },
  { label: "Custom values", d: "M8 8h.01M2 5.2v4.475c0 .489 0 .733.055.963.05.204.13.4.24.579.123.201.296.374.642.72l7.669 7.669c1.188 1.188 1.782 1.782 2.467 2.004a3 3 0 001.854 0c.685-.222 1.28-.816 2.467-2.004l2.212-2.212c1.188-1.188 1.782-1.782 2.004-2.467a3 3 0 000-1.854c-.222-.685-.816-1.28-2.004-2.467l-7.669-7.669c-.346-.346-.519-.519-.72-.642a2.001 2.001 0 00-.579-.24C10.409 2 10.165 2 9.676 2H5.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C2 3.52 2 4.08 2 5.2zM8.5 8a.5.5 0 11-1 0 .5.5 0 011 0z" },
  { label: "Payment", d: "M6 16a4 4 0 004 4h4a4 4 0 000-8h-4a4 4 0 010-8h4a4 4 0 014 4m-6-6v20" },
  { label: "Image", d: "M16.2 21H6.931c-.605 0-.908 0-1.049-.12a.5.5 0 01-.173-.42c.014-.183.228-.397.657-.826l8.503-8.503c.396-.396.594-.594.822-.668a1 1 0 01.618 0c.228.074.426.272.822.668L21 15v1.2M16.2 21c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C21 18.72 21 17.88 21 16.2M16.2 21H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C3 18.72 3 17.88 3 16.2V7.8c0-1.68 0-2.52.327-3.162a3 3 0 011.311-1.311C5.28 3 6.12 3 7.8 3h8.4c1.68 0 2.52 0 3.162.327a3 3 0 011.311 1.311C21 5.28 21 6.12 21 7.8v8.4M10.5 8.5a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Clear formatting", d: "M17 9l-6 6m0-6l6 6M2.72 12.96l4.32 5.76c.352.47.528.704.751.873.198.15.421.262.66.33C8.72 20 9.013 20 9.6 20h7.6c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C22 17.72 22 16.88 22 15.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C19.72 4 18.88 4 17.2 4H9.6c-.587 0-.88 0-1.15.077a2 2 0 00-.659.33c-.223.169-.399.404-.751.873l-4.32 5.76c-.258.344-.387.516-.437.705a1 1 0 000 .51c.05.189.179.36.437.705z" },
];

/* ─── Shared bits ───────────────────────────────────────────────────────── */

/** Staging's popover shell: white, 8px radius, hr shadow-md. */
const POPOVER =
  "rounded-[8px] border border-[var(--g200)] bg-white shadow-[0_2px_4px_-2px_rgba(16,24,40,0.06),0_4px_8px_-2px_rgba(16,24,40,0.1)]";

function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex aspect-square items-center justify-center rounded-full bg-[var(--g100)] p-2 text-[var(--g700)]">{icon}</div>
      <div className="flex flex-col gap-3">
        <p className="text-[13px] leading-[18px] font-semibold text-[#607179]">{title}</p>
        <p className="text-[13px] leading-[18px] text-[var(--g500)]">{body}</p>
      </div>
      {action}
    </div>
  );
}

/* ─── Thread tabs ───────────────────────────────────────────────────────── */

/** Notes tab — empty state. Replaces the conversation body when tab === "notes". */
export function NotesTab() {
  const [q, setQ] = React.useState("");
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-white pt-3">
      <div className="flex h-5 items-center justify-between px-4">
        <span className="text-[14px] leading-5 font-medium text-[var(--g900)]">Notes</span>
        <button type="button" className="flex items-center gap-1 text-[14px] font-semibold text-[var(--g700)] hover:text-[var(--g900)]">
          <PlusIcon size={16} />
          Add
        </button>
      </div>
      <div className="mx-4 flex h-8 items-center gap-2 rounded-[8px] border border-[var(--g300)] bg-white px-2.5 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] focus-within:border-[var(--p600)]">
        <SearchIcon size={16} className="shrink-0 text-[var(--g500)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={50}
          placeholder="Search notes"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--g900)] outline-none placeholder:text-[var(--g500)]"
        />
        <Lines size={16} className="shrink-0 cursor-pointer text-[var(--g600)]" />
      </div>
      <div className="mt-1 flex justify-center px-4">
        <EmptyState
          icon={<Pencil size={24} />}
          title="No notes yet"
          body="Keep track of important details by adding your first note"
          action={
            <button type="button" className="h-6 rounded-[6px] border border-[var(--g300)] bg-white px-2 text-[11px] leading-4 font-semibold text-[var(--g700)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[var(--g50)]">
              Add note
            </button>
          }
        />
      </div>
    </div>
  );
}

/** Activity tab — empty state. */
export function ActivityTab({ timezone = "IST" }: { timezone?: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white px-4 pt-5">
      <div className="flex items-baseline gap-1">
        <span className="text-[16px] leading-6 font-medium text-[var(--g900)]">Activity</span>
        <span className="text-[13px] text-[var(--g500)]">({timezone})</span>
      </div>
      <div className="mt-9 flex justify-center px-10">
        <EmptyState
          icon={<ClockRefresh size={24} />}
          title="No activities yet!"
          body="Page visits, form submissions, appointments, calls, and more will appear here. Engage now to start tracking!"
        />
      </div>
    </div>
  );
}

/** Associations tab — empty state with staging's ghost (public/staging/associations-ghost.svg). */
export function AssociationsTab() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-[38px] shrink-0 items-center justify-between border-b border-[var(--g200)] px-4">
        <span className="text-[16px] leading-6 font-medium text-[var(--g900)]">Associations</span>
        <button type="button" className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--g600)] hover:text-[var(--g800)]">
          <LinkExternal size={16} />
          Manage associations
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-6 text-center">
        <p className="text-[14px] font-semibold text-[var(--g900)]">No association found</p>
        <p className="text-[13px] text-[var(--g500)]">Looks like a ghost town. Nothing to see here</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/staging/associations-ghost.svg" width={186} height={187} alt="" />
      </div>
    </div>
  );
}

/* ─── Header actions ────────────────────────────────────────────────────── */

const FILTER_GROUPS = ["All", "Conversations", "Activities"];
const FILTER_ITEMS = [
  "Email", "Internal Comment", "Contacts", "Appointments", "Opportunities",
  "Payments", "Invoice", "AI Action Logs", "SLA", "WhatsApp Permission",
];

/** `#chat-filter` dropdown. Mount under a `relative` wrapper around the filter button. */
export function ChannelFilterMenu({ onClose, onPick }: { onClose: () => void; onPick?: (v: string) => void }) {
  const [q, setQ] = React.useState("");
  const pick = (v: string) => { onPick?.(v); onClose(); };
  const items = FILTER_ITEMS.filter((i) => i.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="fixed inset-0 z-[999]" onClick={onClose} />
      <div className={cn("absolute top-full right-0 z-[1000] mt-2 w-[198px] overflow-hidden", POPOVER, "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]")}>
        <div className="border-b border-[var(--g200)] p-1">
          {FILTER_GROUPS.map((g) => (
            <button key={g} type="button" onClick={() => pick(g)} className="flex w-full items-center rounded px-2 pt-1 text-left text-[14px] leading-5 font-medium text-[var(--g900)] hover:bg-[var(--g50)]">
              {g}
            </button>
          ))}
        </div>
        <div className="p-2">
          <div className="flex h-6 items-center gap-1.5 rounded-[4px] border border-[var(--g300)] px-1.5 focus-within:border-[var(--p600)]">
            <SearchIcon size={14} className="shrink-0 text-[var(--g500)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--g900)] outline-none placeholder:text-[var(--g500)]" />
          </div>
        </div>
        <div className="px-2 pb-1">
          {items.map((i) => (
            <button key={i} type="button" onClick={() => pick(i)} className="flex h-[29px] w-full items-center rounded px-1 text-left text-[14px] text-[var(--g700)] hover:bg-[var(--g50)]">
              {i}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** `#delete-conversation` confirm. Fixed overlay; confirm is visual only. */
export function DeleteConversationModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm?: () => void }) {
  React.useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(16,24,40,0.7)] backdrop-blur-[16px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-[500px] rounded-[8px] bg-white shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08)]">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute top-4 right-4 flex size-6 items-center justify-center rounded-[6px] text-[var(--g600)] hover:bg-[var(--g50)]">
          <XClose size={16} />
        </button>
        <div className="pt-4 pr-[42px] pl-4 text-[18px] leading-[28.8px] font-medium text-[var(--g900)]">Delete Conversation</div>
        <p className="px-4 pt-2 pb-6 text-[13px] leading-6 text-[var(--g500)]">
          Are you sure you want to delete the conversation with {name} forever? This cannot be undone.
        </p>
        <div className="mr-4 mb-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-[8px] px-3.5 text-[14px] font-semibold text-[var(--g600)] hover:bg-[var(--g50)]">
            Cancel
          </button>
          <button type="button" onClick={() => { onConfirm?.(); onClose(); }} className="h-9 rounded-[8px] bg-[#d92d20] px-3.5 text-[14px] font-semibold text-white hover:bg-[#b42318]">
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Email card ────────────────────────────────────────────────────────── */

/**
 * The expanded email card (header chevron flips to ↑). Staging renders the
 * body in a 536px iframe; this is a static stand-in of the same email.
 */
export function EmailCardExpanded({
  subject,
  from,
  to,
  time,
  avatar,
  onCollapse,
  onReply,
  more,
}: {
  subject: string;
  from: string;
  to: string;
  time: string;
  /** The card's avatar + channel badge, as ThreadItem already renders it. */
  avatar: React.ReactNode;
  onCollapse: () => void;
  onReply?: () => void;
  /** The ⋮ trigger (wrap it with <EmailMoreMenu/> in a relative span). */
  more?: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[10px] border border-[var(--g200)] bg-white">
      <div onClick={onCollapse} className="relative flex min-w-0 cursor-pointer gap-2 border-b border-[var(--g200)] bg-[var(--g50)] px-4 py-2">
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--g900)]">{subject}</span>
        <div className="ml-auto flex items-center gap-2 text-[var(--g600)]">
          <I.Expand size={14} className="rounded-[2px]" />
          <ChevronUp size={16} />
        </div>
      </div>
      <div className="p-4 pb-0">
        <div className="flex w-full justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {avatar}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[14px] leading-[16.8px] font-medium text-[var(--g900)]">{from}</span>
              <span className="flex min-w-0 items-center gap-1 text-[14px] leading-[16.8px] text-[var(--g600)]">
                <span className="truncate">To: {to}</span>
                <I.ChevronDownSolid size={10} className="shrink-0" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="shrink-0 text-[14px] text-[var(--g600)]">{time}</p>
            <button type="button" aria-label="Reply" onClick={onReply} className="text-[var(--g900)]">
              <ReplyIcon size={16} />
            </button>
            {more}
          </div>
        </div>
        <div className="relative mt-2 overflow-hidden">
          <EmailBody subject={subject} />
        </div>
        <div className="mt-2 border-t border-[var(--g200)] py-3">
          <button type="button" onClick={onReply} className="flex h-8 items-center gap-2 rounded-[4px] bg-[var(--p600)] px-3 text-[14px] text-white hover:bg-[var(--p700)]">
            <ReplyIcon size={16} />
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

/** The welcome email as staging's iframe paints it. */
export function EmailBody({ subject }: { subject: string }) {
  return (
    <div className="bg-[#f4f5f9] px-3 pt-6 pb-0 text-[#101828]">
      <div className="px-3 text-[40px] leading-none">✦</div>
      <h2 className="mt-10 px-3 text-[18px] leading-7 font-semibold">{subject}</h2>
      <div className="mt-4 rounded-[10px] bg-white px-6 py-8 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]">
        <p className="text-[17px] font-semibold">Hola shubham.kushwah+admin1</p>
        <p className="mt-4 text-[15px] leading-[26px]">
          ¡Pase a la acción! Ahora ya puede publicar, comentar e interactuar dentro del grupo. ¡Colaboremos y divirtámonos!
        </p>
      </div>
      <div className="mt-6 inline-flex h-12 items-center rounded-t-[4px] bg-[#2d5fe8] px-10 text-[16px] font-semibold text-white">
        Ver grupo
      </div>
    </div>
  );
}

const MORE_ITEMS = [
  { label: "Details", icon: InfoCircle },
  { label: "Reply All", icon: ReplyAll },
  { label: "Forward Email", icon: Forward },
  { label: "Forward Thread", icon: ForwardThread },
];

/** The email card's ⋮ popover. Mount under a `relative` wrapper around the ⋮ button. */
export function EmailMoreMenu({ onClose, onPick }: { onClose: () => void; onPick?: (label: string) => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[999]" onClick={onClose} />
      <div className={cn("absolute top-full right-0 z-[1000] mt-2 w-[182px] py-1", POPOVER)}>
        {MORE_ITEMS.map((m, i) => (
          <button
            key={m.label}
            type="button"
            onClick={() => { onPick?.(m.label); onClose(); }}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-[var(--g700)] hover:bg-[var(--g50)]",
              (i === 1 || i === 2) && "border-t border-[var(--g100)]",
            )}
          >
            <m.icon size={16} className="shrink-0 text-[var(--g700)]" />
            <span className="truncate">{m.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ─── Composer ──────────────────────────────────────────────────────────── */

function Chip({ initials, label, onRemove }: { initials: string; label: string; onRemove?: () => void }) {
  return (
    <span className="flex h-7 min-w-0 items-center gap-1.5 rounded-[4px] border border-[var(--g300)] bg-white px-1.5 text-[14px] text-[var(--g900)]">
      {initials && (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--p50)] text-[10px] text-[var(--p700)]">{initials}</span>
      )}
      <span className="truncate">{label}</span>
      {onRemove && (
        <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="text-[var(--g400)] hover:text-[var(--g600)]">
          <Dismiss12 size={14} />
        </button>
      )}
    </span>
  );
}

/**
 * The composer after `#conv-composer-inline-expand-trigger` (email channel):
 * From / From Name / To (+CC BCC), Subject, a 150px body, toolbar, send split.
 * Replaces the 40px inline composer row. Sending is visual only.
 */
/**
 * The composer's channels. Staging offers the channels the contact can be
 * reached on plus Internal Comment: Email for an email contact, WhatsApp and
 * SMS for a phone contact.
 */
export type ComposerMode = "email" | "sms" | "whatsapp" | "comment";

export const COMPOSER_MODES: Record<
  ComposerMode,
  { label: string; icon: (p: IconProps) => React.ReactElement; tone: string }
> = {
  email: { label: "Email", icon: MailIcon, tone: "text-[var(--p600)]" },
  sms: { label: "SMS", icon: (p) => <I.MessageChat {...p} />, tone: "text-[var(--p600)]" },
  whatsapp: { label: "WhatsApp", icon: (p) => <I.WhatsApp {...p} />, tone: "text-[var(--wa)]" },
  comment: { label: "Internal Comment", icon: EyeIcon, tone: "text-[var(--g600)]" },
};

/** Which modes a conversation's composer offers, by the contact's channel. */
export function composerModesFor(channel: "email" | "whatsapp"): ComposerMode[] {
  return channel === "whatsapp" ? ["whatsapp", "sms", "comment"] : ["email", "comment"];
}

export function ExpandedComposer({
  mode,
  modes,
  onMode,
  fromEmail = "ashwin.ks@gohighlevel.com",
  fromName = "Ashwin K S",
  fromPhone = "+1 (555) 010-2030",
  toEmail,
  toPhone = "+91 98450 12345",
  toInitials,
  onCollapse,
}: {
  mode: ComposerMode;
  modes: ComposerMode[];
  onMode: (m: ComposerMode) => void;
  fromEmail?: string;
  fromName?: string;
  fromPhone?: string;
  toEmail: string;
  toPhone?: string;
  toInitials: string;
  /** Trash button (discard) — return to the collapsed row. */
  onCollapse: () => void;
}) {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [sendOpen, setSendOpen] = React.useState(false);
  const [pickOpen, setPickOpen] = React.useState(false);
  const ready = body.trim().length > 0;
  const comment = mode === "comment";
  const M = COMPOSER_MODES[mode];
  // Email keeps the full toolbar; chat channels and comments keep the basics.
  const tools = mode === "email" ? TOOLBAR : TOOLBAR.filter((t) => ["Emoji", "Attach", "Templates", "Trigger links", "Custom values"].includes(t.label));
  const placeholder = comment
    ? "Add an internal comment. Use @ to mention a teammate"
    : mode === "whatsapp"
      ? "Type a WhatsApp message"
      : mode === "sms"
        ? "Type an SMS"
        : "Type a message";
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[6px] border bg-white",
        comment ? "border-[var(--note-edge)]" : "border-[var(--p300)]",
      )}
    >
      <div className={cn("flex items-start gap-3 border-b px-3 py-2", comment ? "border-[var(--note-edge)] bg-[var(--note-bg)]" : "border-[var(--g200)]")}>
        {/* The channel switch, as on the collapsed row. */}
        <div className="relative pt-0.5">
          <button
            type="button"
            aria-label="Channel"
            onClick={() => setPickOpen((o) => !o)}
            className="flex h-6 items-center gap-0.5 rounded-md px-1 hover:bg-[var(--g50)]"
          >
            <M.icon size={16} className={M.tone} />
            <I.ChevronDown size={14} className="text-[var(--g600)]" />
          </button>
          {pickOpen ? (
            <ChannelPickerMenu
              value={mode}
              modes={modes}
              placement="below"
              onPick={onMode}
              onClose={() => setPickOpen(false)}
            />
          ) : null}
        </div>
        {comment ? (
          <span className="flex h-7 items-center text-[14px] font-medium text-[var(--note-ink)]">
            Internal comment · only your team sees this
          </span>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-8 text-[14px] text-[var(--g500)]">From</span>
              {mode === "email" ? (
                <>
                  <Chip initials="A" label={fromEmail} onRemove={() => {}} />
                  <span className="h-6 w-px bg-[var(--g200)]" />
                  <span className="text-[14px] text-[var(--g500)]">From Name:</span>
                  <Chip initials="" label={fromName} onRemove={() => {}} />
                </>
              ) : (
                <Chip initials="" label={fromPhone} />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 text-[14px] text-[var(--g500)]">To</span>
              <Chip initials={toInitials} label={mode === "email" ? toEmail : toPhone} />
              {mode === "email" ? (
                <div className="ml-auto flex gap-2 text-[14px] text-[var(--g500)]">
                  <button type="button" className="hover:text-[var(--g700)]">CC</button>
                  <button type="button" className="hover:text-[var(--g700)]">BCC</button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
      {mode === "email" ? (
        <div className="flex h-[34px] items-center gap-2 border-b border-[var(--g200)] px-3">
          <span className="text-[14px] text-[var(--g500)]">Subject:</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Enter subject" className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--g900)] outline-none placeholder:text-[var(--g500)]" />
        </div>
      ) : null}
      {mode === "whatsapp" ? (
        <div className="flex items-center justify-between border-b border-[var(--g200)] bg-[var(--g50)] px-3 py-1.5 text-[13px] text-[var(--g600)]">
          <span>The 24-hour window is open. Free-form messages are allowed.</span>
          <button type="button" className="font-medium text-[var(--p700)] hover:underline">Send template</button>
        </div>
      ) : null}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "block h-[124px] w-full resize-none px-3 py-2 text-[14px] leading-5 text-[var(--g900)] outline-none placeholder:text-[var(--g500)]",
          comment ? "bg-[#fffbeb]" : "bg-transparent",
        )}
      />
      {mode === "sms" ? (
        <div className="px-3 pb-1 text-right text-[12px] text-[var(--g500)]">
          {body.length} characters · {Math.max(1, Math.ceil(body.length / 160))} segment
        </div>
      ) : null}
      <div className="flex h-10 items-center border-t border-[var(--g200)]">
        <div className="flex flex-1 items-center gap-4 px-2 text-[var(--g700)]">
          {tools.map((t) => (
            <button key={t.label} type="button" aria-label={t.label} title={t.label} className="flex items-center hover:text-[var(--g900)]">
              <svg
                width={t.label === "Formatting" ? 20 : 16}
                height={t.label === "Formatting" ? 20 : 16}
                viewBox={t.vb ?? "0 0 24 24"}
                fill={t.fill ? "currentColor" : "none"}
                stroke={t.fill ? "none" : "currentColor"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={t.d} />
              </svg>
            </button>
          ))}
          <button type="button" aria-label="Discard" onClick={() => { setBody(""); setSubject(""); onCollapse(); }} className="ml-auto flex items-center hover:text-[var(--g900)]">
            <I.Trash size={16} />
          </button>
        </div>
        <div className="relative flex h-full shrink-0 items-center border-l border-[var(--g200)] px-2">
          <div className={cn("flex items-center overflow-hidden rounded-md bg-[var(--p600)]", !ready && "opacity-50")}>
            <button type="button" aria-label={comment ? "Add comment" : "Send"} className="flex items-center justify-center px-2 py-1 hover:bg-[var(--p700)]">
              <SendIcon size={16} className="text-white" />
            </button>
            <div className="h-6 w-px bg-[var(--p500)]" />
            <button type="button" aria-label="Send options" onClick={() => setSendOpen((o) => !o)} className="flex items-center justify-center p-1 hover:bg-[var(--p700)]">
              <I.ChevronDown size={12} className="text-white" />
            </button>
          </div>
          {sendOpen && <SendOptionsMenu onClose={() => setSendOpen(false)} />}
        </div>
      </div>
    </div>
  );
}

/**
 * `#conv-provider-select-trigger` menu. Opens upward from the collapsed row,
 * downward from the expanded composer; the picked channel carries staging's
 * primary outline and check.
 */
export function ChannelPickerMenu({
  value = "email",
  modes = ["email", "comment"],
  placement = "above",
  onPick,
  onClose,
}: {
  value?: ComposerMode;
  modes?: ComposerMode[];
  placement?: "above" | "below";
  onPick?: (v: ComposerMode) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[999]" onClick={onClose} />
      <div
        className={cn(
          "absolute left-0 z-[1000] w-[220px] p-px",
          placement === "above" ? "bottom-full mb-2" : "top-full mt-1",
          POPOVER,
        )}
      >
        {modes.map((id) => {
          const o = COMPOSER_MODES[id];
          const on = id === value;
          return (
            <button
              key={id}
              type="button"
              onClick={() => { onPick?.(id); onClose(); }}
              className={cn(
                "flex h-9 w-full items-center gap-2 rounded-[4px] border p-2 text-left text-[14px] text-[var(--g900)]",
                on ? "border-[var(--p600)] bg-[var(--p50)]" : "border-transparent hover:bg-[var(--g50)]",
              )}
            >
              <o.icon size={20} className={cn("shrink-0", o.tone)} />
              <span className="flex-1">{o.label}</span>
              {on ? (
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--p600)]" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** `#conv-send-options-dropdown-arrow` menu. Opens upward, right-aligned to the split button. */
export function SendOptionsMenu({ onClose, onPick }: { onClose: () => void; onPick?: (v: string) => void }) {
  const opts = [
    { label: "Send", icon: SendIcon },
    { label: "Send Later", icon: ClockRefresh },
    { label: "AI Schedule", icon: Sparkle },
  ];
  return (
    <>
      <div className="fixed inset-0 z-[999]" onClick={onClose} />
      <div className={cn("absolute right-2 bottom-full z-[1000] mb-2 w-[180px] p-1", POPOVER)}>
        {opts.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => { onPick?.(o.label); onClose(); }}
            className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[14px] text-[var(--g700)] hover:bg-[var(--g50)]"
          >
            <o.icon size={16} className="shrink-0 text-[var(--g600)]" />
            {o.label}
          </button>
        ))}
      </div>
    </>
  );
}
