"use client";

/*
 * Working Documents and Payments right-rail panels for the staging inbox copy.
 *
 * Drop-in replacements for DocumentsPanel / PaymentsPanel in
 * staging-rail-panels.tsx (same props, same 299px shell). Captured off
 * switchyard-v4 staging (Oct 7, 2026, 1728px viewport):
 *
 *  Documents  "+ Add" and "Add documents" both open the same 483px HighRise
 *             dialog: info icon + "Add documents", "Upload up to 10
 *             documents", a disabled "Section" select fixed to "Internal", a
 *             dropzone ("Drag and drop files, or click to upload" / "DOC, PNG,
 *             JPG, GIF, PPT, or PDF (max 250 MB each)"), a "Share documents on
 *             client portal" checkbox, Cancel / Upload.
 *  Payments   "Actions" opens a 174px dropdown: Add Card on File, Charge Now,
 *             Create Subscription, Create Invoice, Manage Methods, Create
 *             Estimate. Charge Now / Add Card / Manage Methods are 544px
 *             modals, Create Subscription a 900px modal. Create Invoice and
 *             Create Estimate open the full-page builders in a new tab on
 *             staging; here they open a condensed modal with the builder's
 *             "Invoice Settings" + "Add Products" fields (approximation).
 *
 * Saves are simulated: nothing leaves the browser. Items live in a
 * module-level store so they survive closing and reopening the panel.
 * Staging's copy is kept verbatim (title case included).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/* ─── Colour aliases ────────────────────────────────────────────────────── */

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
  "--p200": "var(--hr-primary-200)",
  "--p100": "var(--hr-primary-100)",
  "--p50": "var(--hr-primary-50)",
} as React.CSSProperties;

/* ─── Store ─────────────────────────────────────────────────────────────── */

export type DocSection = "Internal" | "Sent" | "Received";
export type StagingDoc = { id: string; name: string; type: string; date: Date; status: string; section: DocSection; shared: boolean };
export type PaymentKind = "Transactions" | "Subscriptions" | "Invoices" | "Estimates";
export type StagingPayment = { id: string; kind: PaymentKind; label: string; date: Date; amount: number; currency: string; status: string };

type State = { docs: StagingDoc[]; payments: StagingPayment[] };
let state: State = { docs: [], payments: [] };
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
function setState(fn: (s: State) => State) {
  state = fn(state);
  listeners.forEach((l) => l());
}
function useStore() {
  return React.useSyncExternalStore(subscribe, () => state, () => state);
}
let seq = 0;
const uid = () => `sd-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/* ─── Formatting ────────────────────────────────────────────────────────── */

const CURRENCIES: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", CAD: "CA$", AUD: "A$", INR: "₹" };
const money = (n: number, cur = "USD") =>
  `${CURRENCIES[cur] ?? "$"}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const mdy = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
const longDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return y ? new Date(y, (m ?? 1) - 1, d ?? 1) : new Date();
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

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
  searchSm: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  file:
    "M14 11H8m2 4H8m8-8H8m12-.2v10.4c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C17.72 22 16.88 22 15.2 22H8.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C4 19.72 4 18.88 4 17.2V6.8c0-1.68 0-2.52.327-3.162a3 3 0 011.311-1.311C6.28 2 7.12 2 8.8 2h6.4c1.68 0 2.52 0 3.162.327a3 3 0 011.311 1.311C20 4.28 20 5.12 20 6.8z",
  fileLines:
    "M14 2.27V6.4c0 .56 0 .84.109 1.054a1 1 0 00.437.437c.214.11.494.11 1.054.11h4.13M16 13H8m8 4H8m2-8H8m6-7H8.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C4 4.28 4 5.12 4 6.8v10.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C6.28 22 7.12 22 8.8 22h6.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C20 19.72 20 18.88 20 17.2V8l-6-6z",
  chevronDown: "M6 9l6 6 6-6",
  chevronRight: "M9 18l6-6-6-6",
  linkExternal:
    "M21 9V3m0 0h-6m6 0l-9 9m-2-9H7.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C3 5.28 3 6.12 3 7.8v8.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C5.28 21 6.12 21 7.8 21h8.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C21 18.72 21 17.88 21 16.2V14",
  infoCircle: "M12 16v-4m0-4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z",
  uploadCloud: "M8 16l4-4m0 0l4 4m-4-4v9m8-4.257A5.5 5.5 0 0016.5 7a.62.62 0 01-.534-.302 7.5 7.5 0 10-11.78 9.096",
  creditCard:
    "M22 10H2m0-1.8v7.6c0 1.12 0 1.68.218 2.108a2 2 0 00.874.874C3.52 19 4.08 19 5.2 19h13.6c1.12 0 1.68 0 2.108-.218a2 2 0 00.874-.874C22 17.48 22 16.92 22 15.8V8.2c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C20.48 5 19.92 5 18.8 5H5.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C2 6.52 2 7.08 2 8.2z",
  creditCardLine:
    "M22 10H2m9 4H6M2 8.2v7.6c0 1.12 0 1.68.218 2.108a2 2 0 00.874.874C3.52 19 4.08 19 5.2 19h13.6c1.12 0 1.68 0 2.108-.218a2 2 0 00.874-.874C22 17.48 22 16.92 22 15.8V8.2c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C20.48 5 19.92 5 18.8 5H5.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C2 6.52 2 7.08 2 8.2z",
  bankNote:
    "M20.141 11.457V5.55c0-.168 0-.252-.055-.405a1.365 1.365 0 00-.233-.358c-.118-.113-.16-.13-.241-.167-.614-.27-1.849-.62-4.131-.62-3.728 0-6.524 1.864-9.32 1.864-.892 0-1.689-.095-2.36-.224-.96-.184-1.44-.276-1.678-.193a.812.812 0 00-.496.41c-.127.217-.127.641-.127 1.488v10.018c0 .168 0 .252.055.405.034.092.163.29.234.358.118.113.159.13.24.167.615.27 1.849.62 4.131.62 3.729 0 4.165-1.369 6.96-1.369.892 0 1.69.095 2.361.224m-2.33-6.312a2.33 2.33 0 11-4.66 0 2.33 2.33 0 014.66 0zM5.228 9.592v3.728m11.185-3.728v3.728",
  trash:
    "M16 6v-.8c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C14.48 2 13.92 2 12.8 2h-1.6c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C8 3.52 8 4.08 8 5.2V6M3 6h18m-2 0v11.2c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C16.72 22 15.88 22 14.2 22H9.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C5 19.72 5 18.88 5 17.2V6",
};

/** Naive UI's filled chevron used by staging's selects. */
function SelectChevron({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M3.14645 5.64645C3.34171 5.45118 3.65829 5.45118 3.85355 5.64645L8 9.79289L12.1464 5.64645C12.3417 5.45118 12.6583 5.45118 12.8536 5.64645C13.0488 5.84171 13.0488 6.15829 12.8536 6.35355L8.35355 10.8536C8.15829 11.0488 7.84171 11.0488 7.64645 10.8536L3.14645 6.35355C2.95118 6.15829 2.95118 5.84171 3.14645 5.64645Z" fill="currentColor" />
    </svg>
  );
}

/* ─── Panel shell (same as staging-rail-panels) ─────────────────────────── */

function PanelShell({ title, onClose, onAdd, children }: { title: string; onClose: () => void; onAdd?: () => void; children: React.ReactNode }) {
  return (
    <div className="relative h-full w-[299px] shrink-0 overflow-hidden rounded-lg" style={VARS}>
      <div className="flex h-full w-full flex-col bg-white pt-2 pb-4">
        <div className="flex h-8 shrink-0 items-center justify-between px-4">
          <p className="text-[14px] leading-5 font-medium text-[var(--g900)]">{title}</p>
          <div className="flex items-center">
            {onAdd !== undefined ? (
              <button type="button" onClick={onAdd} className="flex h-4 items-center gap-1 rounded-[4px] text-[var(--g700)] hover:text-[var(--g900)]">
                <Stroke d={D.plus} size={14} />
                <span className="text-[11px] leading-4 font-semibold">Add</span>
              </button>
            ) : null}
            <button type="button" aria-label="Close" onClick={onClose} className="flex size-8 items-center justify-center rounded-[4px] text-[var(--g600)] hover:bg-[var(--g50)]">
              <Stroke d={D.close} size={16} />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="shrink-0 px-4">
      <div className="flex h-[26px] w-full overflow-hidden rounded-[4px] border border-[var(--g200)] bg-[#f7f7fa]">
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "flex h-6 flex-1 items-center justify-center px-2 text-[12px] leading-[18px] font-medium",
              i < options.length - 1 && "border-r border-[#e5e7eb]",
              o === value ? "bg-[var(--g200)] text-[var(--g900)]" : "bg-white text-[var(--g600)] hover:bg-[var(--g50)]",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, action, onAction }: { icon: string; title: string; description: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-[var(--g100)] text-[var(--g600)]">
        <Stroke d={icon} size={24} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] leading-[18px] font-semibold text-[#607179]">{title}</p>
        <p className="text-[13px] leading-[18px] text-[var(--g500)]">{description}</p>
      </div>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="flex h-6 items-center rounded-[4px] border border-[var(--g300)] bg-white px-1.5 text-[11px] leading-4 font-semibold text-[var(--g600)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[var(--g50)]"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

/* ─── Shared form bits ──────────────────────────────────────────────────── */

const SHADOW_XS = "shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]";
const INPUT =
  `h-10 w-full rounded-lg border border-[var(--g300)] bg-white px-3.5 text-[14px] leading-5 text-[var(--g900)] outline-none ${SHADOW_XS} placeholder:text-[var(--g400)] focus:border-[var(--p300)] focus:shadow-[0_0_0_4px_var(--p100)]`;
const BTN_SECONDARY =
  `flex h-10 items-center justify-center rounded-lg border border-[var(--g300)] bg-white px-4 text-[14px] leading-5 font-medium text-[var(--g700)] ${SHADOW_XS} hover:bg-[var(--g50)]`;
const BTN_PRIMARY =
  `flex h-10 items-center justify-center rounded-lg border border-[var(--p600)] bg-[var(--p600)] px-4 text-[14px] leading-5 font-medium text-white ${SHADOW_XS} hover:bg-[var(--p700)] disabled:cursor-not-allowed disabled:border-[var(--p200)] disabled:bg-[var(--p200)]`;

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1.5 text-[14px] leading-5 font-medium text-[var(--g700)]">
      {children}
      {required ? <span className="ml-1 text-[#f04438]">*</span> : null}
    </p>
  );
}

function NativeSelect({ value, onChange, options, className, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; className?: string; placeholder?: string }) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(INPUT, "appearance-none pr-9", !value && "text-[var(--g400)]")}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <SelectChevron className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--g400)]" />
    </div>
  );
}

/** n-modal card: 12px radius, 24px padding, xl shadow, gray mask. */
function Modal({ width, title, onClose, footer, children, header }: { width: number; title: string; onClose: () => void; footer: React.ReactNode; children: React.ReactNode; header?: React.ReactNode }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(16,24,40,0.45)] p-4" style={VARS} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[calc(100vh-32px)] flex-col rounded-xl bg-white p-6 shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
        style={{ width }}
      >
        <div className="flex shrink-0 items-start justify-between">
          {header ?? <p className="text-[18px] leading-7 font-medium text-[var(--g900)]">{title}</p>}
          <button type="button" aria-label="Close" onClick={onClose} className="-mr-1 flex size-8 items-center justify-center rounded-md text-[var(--g700)] hover:bg-[var(--g50)]">
            <Stroke d={D.close} size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <div className="flex shrink-0 justify-end gap-3 pt-6">{footer}</div>
      </div>
    </div>
  );
}

function GatewayNotice({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-16", className)}>
      <p className="text-[14px] leading-5 text-[var(--g500)]">Connect at least one payment gateway to start receiving payments</p>
      <button type="button" className={cn(BTN_SECONDARY, "h-9 px-3.5 text-[var(--g900)]")}>
        Integrate payment gateway
      </button>
    </div>
  );
}

function AdditionalOptions() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-t border-[var(--g200)] pt-5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-0.5 text-[14px] leading-5 font-medium text-[var(--p600)] hover:text-[var(--p700)]">
        Additional Options
        <Stroke d={open ? D.chevronDown : D.chevronRight} size={16} />
      </button>
      {open ? (
        <label className="mt-3 flex items-center gap-2 text-[14px] leading-5 text-[var(--g700)]">
          <input type="checkbox" className="size-4 accent-[var(--p600)]" />
          Send receipt to customer
        </label>
      ) : null}
    </div>
  );
}

/* ─── Documents ─────────────────────────────────────────────────────────── */

const ACCEPT = ".doc,.docx,.png,.jpg,.jpeg,.gif,.ppt,.pptx,.pdf";

function AddDocumentsModal({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = React.useState<{ name: string; size: number }[]>([]);
  const [shared, setShared] = React.useState(false);
  const [drag, setDrag] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);

  const take = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({ name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...next].slice(0, 10));
  };
  const upload = () => {
    const now = new Date();
    setState((s) => ({
      ...s,
      docs: [
        ...files.map((f) => ({
          id: uid(),
          name: f.name,
          type: (f.name.split(".").pop() ?? "file").toUpperCase(),
          date: now,
          status: shared ? "Shared" : "Uploaded",
          section: "Internal" as const,
          shared,
        })),
        ...s.docs,
      ],
    }));
    onClose();
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(16,24,40,0.45)] p-4 backdrop-blur-[4px]" style={VARS} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Add documents" className="w-[483px] overflow-hidden rounded-lg bg-white shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]">
        {/* header */}
        <div className="flex items-start justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[var(--p100)] text-[var(--p600)]">
              <Stroke d={D.infoCircle} size={16} />
            </span>
            <p className="text-[16px] leading-6 font-medium text-[var(--g900)]">Add documents</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-6 items-center justify-center rounded text-[var(--g700)] hover:bg-[var(--g50)]">
            <Stroke d={D.close} size={16} />
          </button>
        </div>
        {/* body */}
        <div className="flex flex-col px-4 pt-4 pb-4">
          <p className="text-[13px] leading-[18px] text-[var(--g600)]">Upload up to 10 documents</p>
          <p className="mt-3 mb-1 text-[13px] leading-[18px] font-medium text-[var(--g700)]">Section</p>
          <div className="flex h-8 cursor-not-allowed items-center justify-between rounded-[4px] border border-[var(--g300)] bg-[var(--g50)] px-2 text-[14px] text-[var(--g400)]">
            Internal
            <SelectChevron className="text-[var(--g500)]" />
          </div>
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              take(e.dataTransfer.files);
            }}
            className={cn(
              "mt-4 flex flex-col items-center gap-1 rounded-lg border px-4 py-3 text-center",
              drag ? "border-[var(--p300)] bg-[var(--p50)]" : "border-[var(--g200)] bg-white hover:bg-[var(--g50)]",
            )}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-[var(--g50)] text-[var(--g700)]">
              <Stroke d={D.uploadCloud} size={16} />
            </span>
            <span className="text-[13px] leading-[18px] text-[var(--g600)]">Drag and drop files, or click to upload</span>
            <span className="text-[11px] leading-4 text-[var(--g500)]">DOC, PNG, JPG, GIF, PPT, or PDF (max 250 MB each)</span>
          </button>
          <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => {
            take(e.target.files);
            e.target.value = "";
          }} />
          {files.length > 0 ? (
            <ul className="mt-3 flex max-h-40 flex-col gap-1.5 overflow-y-auto">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border border-[var(--g200)] px-2 py-1.5">
                  <Stroke d={D.fileLines} size={16} className="shrink-0 text-[var(--g500)]" />
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-[var(--g800)]">{f.name}</span>
                  <span className="text-[11px] text-[var(--g500)]">{f.size >= 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`}</span>
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-[var(--g500)] hover:text-[var(--g800)]">
                    <Stroke d={D.trash} size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <label className="mt-5 flex items-center gap-1.5 text-[13px] leading-[18px] text-[var(--g900)]">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} className="size-3.5 accent-[var(--p600)]" />
            Share documents on client portal
          </label>
        </div>
        {/* footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--g200)] px-4 py-3">
          <button type="button" onClick={onClose} className={cn(BTN_SECONDARY, "h-8 rounded-[4px] px-3 text-[13px]")}>
            Cancel
          </button>
          <button type="button" disabled={files.length === 0} onClick={upload} className={cn(BTN_PRIMARY, "h-8 rounded-[4px] px-3 text-[13px]")}>
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function DocRow({ doc }: { doc: StagingDoc }) {
  return (
    <li className="flex items-center gap-2.5 border-b border-[var(--g100)] py-2.5 last:border-b-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--g100)] text-[var(--g600)]">
        <Stroke d={D.fileLines} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] leading-[18px] font-medium text-[var(--g900)]" title={doc.name}>
          {doc.name}
        </p>
        <p className="text-[12px] leading-[18px] text-[var(--g500)]">
          {doc.type} · {longDate(doc.date)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 text-[11px] leading-[18px] font-medium",
          doc.shared ? "bg-[var(--p50)] text-[var(--p700)]" : "bg-[var(--g100)] text-[var(--g700)]",
        )}
      >
        {doc.status}
      </span>
    </li>
  );
}

export function DocumentsPanel({ onClose }: { onClose: () => void }) {
  const { docs } = useStore();
  const [tab, setTab] = React.useState("All");
  const [q, setQ] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const inTab = docs.filter((d) => tab === "All" || d.section === tab);
  const shown = inTab.filter((d) => d.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <PanelShell title="Documents" onClose={onClose} onAdd={() => setAdding(true)}>
      <div className="shrink-0 px-4">
        <label className={`flex h-8 w-full items-center gap-1 rounded-[4px] border border-[var(--g300)] bg-white px-2 ${SHADOW_XS} focus-within:border-[var(--p300)]`}>
          <span className="text-[var(--g500)]">
            <Stroke d={D.searchSm} size={16} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by document name"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] leading-[21px] text-[var(--g900)] outline-none placeholder:text-[var(--g700)]"
          />
        </label>
      </div>
      <div className="pt-2 pb-4">
        <Segmented options={["All", "Internal", "Sent", "Received"]} value={tab} onChange={setTab} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {shown.length > 0 ? (
          <ul className="flex flex-col">{shown.map((d) => <DocRow key={d.id} doc={d} />)}</ul>
        ) : inTab.length > 0 ? (
          <EmptyState icon={D.searchSm} title="No documents found" description="Try a different document name." />
        ) : (
          <EmptyState
            icon={D.file}
            title="No documents yet"
            description="Upload or send documents to see them listed here."
            action="Add documents"
            onAction={() => setAdding(true)}
          />
        )}
      </div>
      {adding ? <AddDocumentsModal onClose={() => setAdding(false)} /> : null}
    </PanelShell>
  );
}

/* ─── Payments ──────────────────────────────────────────────────────────── */

const CONTACT = { name: "shubham.kushwah+admin1", email: "shubham.kushwah+admin1@gohighlevel.com" };

/* Staging's product picker shows "No Data" on this account; these stand in so a row can be built. */
const PRODUCTS: { name: string; price: number }[] = [
  { name: "Consultation", price: 49 },
  { name: "Monthly retainer", price: 1299 },
  { name: "Website audit", price: 250 },
];

type ActionId = "card" | "charge" | "subscription" | "invoice" | "methods" | "estimate";
const ACTIONS: { id: ActionId; label: string; icon: string }[] = [
  { id: "card", label: "Add Card on File", icon: D.creditCard },
  { id: "charge", label: "Charge Now", icon: D.creditCardLine },
  { id: "subscription", label: "Create Subscription", icon: D.bankNote },
  { id: "invoice", label: "Create Invoice", icon: D.fileLines },
  { id: "methods", label: "Manage Methods", icon: D.fileLines },
  { id: "estimate", label: "Create Estimate", icon: D.file },
];

function addPayment(p: Omit<StagingPayment, "id">) {
  setState((s) => ({ ...s, payments: [{ ...p, id: uid() }, ...s.payments] }));
}

function ChargeNowModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [desc, setDesc] = React.useState("");
  const value = parseFloat(amount);
  const valid = value > 0 && desc.trim().length > 0;
  return (
    <Modal
      width={544}
      title="Charge Now"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => {
              addPayment({ kind: "Transactions", label: desc.trim(), date: new Date(), amount: value, currency, status: "Succeeded" });
              onClose();
            }}
            className={BTN_PRIMARY}
          >
            Confirm &amp; Charge
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pt-6">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <Label required>Amount</Label>
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="Amount" className={INPUT} />
          </div>
          <div className="w-[91px]">
            <Label>Currency</Label>
            <NativeSelect value={currency} onChange={setCurrency} options={Object.keys(CURRENCIES)} />
          </div>
        </div>
        <div>
          <Label required>Description</Label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" rows={3} className={cn(INPUT, "h-[89px] resize-y py-2.5")} />
        </div>
        <div className="border-t border-[var(--g200)]">
          <GatewayNotice className="py-20" />
        </div>
        <AdditionalOptions />
      </div>
    </Modal>
  );
}

function InfoModal({ title, subtitle, primary, onClose }: { title: string; subtitle?: string; primary?: string; onClose: () => void }) {
  return (
    <Modal
      width={544}
      title={title}
      onClose={onClose}
      header={
        <div>
          <p className="text-[18px] leading-7 font-medium text-[var(--g900)]">{title}</p>
          {subtitle ? <p className="text-[14px] leading-5 text-[var(--g600)]">{subtitle}</p> : null}
        </div>
      }
      footer={
        primary ? (
          <>
            <button type="button" onClick={onClose} className={BTN_SECONDARY}>
              Cancel
            </button>
            <button type="button" disabled className={BTN_PRIMARY}>
              {primary}
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Close
          </button>
        )
      }
    >
      <GatewayNotice className="py-20" />
      {primary ? <AdditionalOptions /> : null}
    </Modal>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[16px] leading-6 font-medium text-[var(--g900)]">{children}</p>;
}

/** Staging's "Products" table: Item / Price / Quantity / Tax / Subtotal, one row. */
function ProductsTable({ product, setProduct, price, setPrice, qty, setQty }: {
  product: string; setProduct: (v: string) => void; price: string; setPrice: (v: string) => void; qty: string; setQty: (v: string) => void;
}) {
  const subtotal = (parseFloat(price) || 0) * (parseInt(qty) || 0);
  return (
    <div className="rounded-lg border border-[var(--g200)]">
      <p className="px-4 pt-4 pb-4 text-[16px] leading-6 font-medium text-[var(--g900)]">Products</p>
      <div className="grid grid-cols-[2.4fr_1.1fr_1fr_1fr_1fr] gap-4 bg-[var(--g50)] px-4 py-3.5 text-[12px] leading-[18px] font-medium text-[var(--g900)]">
        <span>Item</span>
        <span className="pl-3">Price</span>
        <span className="text-center">Quantity</span>
        <span className="text-center">Tax</span>
        <span className="text-center">Subtotal</span>
      </div>
      <div className="grid grid-cols-[2.4fr_1.1fr_1fr_1fr_1fr] items-center gap-4 px-2 py-3">
        <NativeSelect
          value={product}
          placeholder="Add Product"
          options={PRODUCTS.map((p) => p.name)}
          onChange={(v) => {
            setProduct(v);
            const p = PRODUCTS.find((x) => x.name === v);
            if (p) setPrice(String(p.price));
          }}
        />
        <label className={cn(INPUT, "flex items-center gap-1 px-3")}>
          <span className="text-[var(--g900)]">$</span>
          <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" className="min-w-0 flex-1 bg-transparent outline-none" />
        </label>
        <input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="1" className={cn(INPUT, "text-center")} />
        <span className="text-center text-[14px] text-[var(--g900)]">-</span>
        <span className="text-center text-[14px] text-[var(--g900)]">{money(subtotal)}</span>
      </div>
    </div>
  );
}

function SubscriptionModal({ onClose }: { onClose: () => void }) {
  const [start, setStart] = React.useState("");
  const [product, setProduct] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [qty, setQty] = React.useState("1");
  const total = (parseFloat(price) || 0) * (parseInt(qty) || 0);
  return (
    <Modal
      width={900}
      title="Create New Subscription"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!(total > 0)}
            onClick={() => {
              addPayment({ kind: "Subscriptions", label: product || "Subscription", date: start ? fromIso(start) : new Date(), amount: total, currency: "USD", status: "Scheduled" });
              onClose();
            }}
            className={BTN_PRIMARY}
          >
            Schedule
          </button>
        </>
      }
    >
      <div className="mt-5 flex flex-col gap-6 border-t border-[var(--g200)] pt-5">
        <div className="flex flex-col gap-3">
          <SectionTitle>Customer Details</SectionTitle>
          <div className="flex flex-col gap-2 text-[14px] leading-5 text-[var(--g900)]">
            <p>{CONTACT.name}</p>
            <p>{CONTACT.email}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <SectionTitle>Subscription Details</SectionTitle>
          <div>
            <p className="mb-1.5 text-[12px] leading-[18px] font-medium text-[var(--g700)]">Add Bill Start Date</p>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} min={isoDay(new Date())} className={cn(INPUT, "w-[212px]", !start && "text-[var(--g400)]")} />
          </div>
          <ProductsTable product={product} setProduct={setProduct} price={price} setPrice={setPrice} qty={qty} setQty={setQty} />
        </div>
        <div className="border-t border-[var(--g200)]">
          <GatewayNotice className="py-20" />
        </div>
        <AdditionalOptions />
      </div>
    </Modal>
  );
}

let invoiceNo = 7;
let estimateNo = 1;

/** Condensed stand-in for staging's full-page invoice / estimate builder. */
function BuilderModal({ kind, onClose }: { kind: "Invoices" | "Estimates"; onClose: () => void }) {
  const isInv = kind === "Invoices";
  const today = new Date();
  const [num, setNum] = React.useState(isInv ? `INV-${String(invoiceNo).padStart(6, "0")}` : `EST-${String(estimateNo).padStart(6, "0")}`);
  const [issue, setIssue] = React.useState(isoDay(today));
  const [due, setDue] = React.useState(isoDay(addDays(today, isInv ? 14 : 30)));
  const [product, setProduct] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [qty, setQty] = React.useState("1");
  const total = (parseFloat(price) || 0) * (parseInt(qty) || 0);
  const commit = (status: string) => {
    addPayment({ kind, label: num, date: fromIso(issue), amount: total, currency: "USD", status });
    if (isInv) invoiceNo++;
    else estimateNo++;
    onClose();
  };
  return (
    <Modal
      width={900}
      title={isInv ? "Create Invoice" : "Create Estimate"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancel
          </button>
          <button type="button" disabled={!num.trim()} onClick={() => commit("Draft")} className={BTN_SECONDARY}>
            Save
          </button>
          <button type="button" disabled={!(total > 0) || !num.trim()} onClick={() => commit("Sent")} className={BTN_PRIMARY}>
            Send
          </button>
        </>
      }
    >
      <div className="mt-5 flex flex-col gap-6 border-t border-[var(--g200)] pt-5">
        <div className="flex flex-col gap-1">
          <SectionTitle>Business &amp; Customer Information</SectionTitle>
          <p className="text-[14px] leading-5 text-[var(--g600)]">Add your business and the customer information to this template</p>
          <div className="mt-3 grid grid-cols-2 gap-4 text-[14px] leading-5 text-[var(--g900)]">
            <div className="flex flex-col gap-1 rounded-lg border border-[var(--g200)] p-4">
              <p className="text-[12px] font-medium text-[var(--g500)]">Business Information</p>
              <p>Location sample data settings off 2: Blank</p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-[var(--g200)] p-4">
              <p className="text-[12px] font-medium text-[var(--g500)]">Customer Information</p>
              <p>{CONTACT.name}</p>
              <p className="text-[var(--g600)]">{CONTACT.email}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <SectionTitle>{isInv ? "Invoice Settings" : "Estimate Settings"}</SectionTitle>
          <p className="text-[14px] leading-5 text-[var(--g600)]">{isInv ? "Add invoice number and dates" : "Add estimate number and dates"}</p>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <Label required>{isInv ? "Invoice Number" : "Estimate Number"}</Label>
              <input value={num} onChange={(e) => setNum(e.target.value)} className={INPUT} />
            </div>
            <div>
              <Label required>Issue Date</Label>
              <input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} className={INPUT} />
            </div>
            <div>
              <Label required>{isInv ? "Due Date" : "Expiry Date"}</Label>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={INPUT} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <SectionTitle>Add Products</SectionTitle>
            <p className="text-[14px] leading-5 text-[var(--g600)]">Choose products from your catalogue or add new products to this {isInv ? "invoice" : "estimate"}</p>
          </div>
          <ProductsTable product={product} setProduct={setProduct} price={price} setPrice={setPrice} qty={qty} setQty={setQty} />
          <div className="ml-auto flex w-[260px] items-center justify-between text-[14px] leading-5 font-medium text-[var(--g900)]">
            <span>Amount Due</span>
            <span>{money(total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const STATUS_TONE: Record<string, string> = {
  Succeeded: "bg-[#ecfdf3] text-[#027a48]",
  Scheduled: "bg-[var(--p50)] text-[var(--p700)]",
  Sent: "bg-[var(--p50)] text-[var(--p700)]",
  Draft: "bg-[var(--g100)] text-[var(--g700)]",
};

const PAYMENT_CARDS: { title: PaymentKind; empty: string }[] = [
  { title: "Transactions", empty: "No transactions found" },
  { title: "Subscriptions", empty: "No subscriptions found" },
  { title: "Invoices", empty: "No invoices found" },
  { title: "Estimates", empty: "No estimates found" },
];

function ActionsMenu({ onPick }: { onPick: (id: ActionId) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", off);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", off);
      window.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 items-center gap-1 rounded-lg border border-[var(--g300)] bg-white p-2 text-[13px] leading-[13px] font-medium text-[var(--g700)] ${SHADOW_XS} hover:bg-[var(--g50)]`}
      >
        Actions
        <Stroke d={D.chevronDown} size={20} />
      </button>
      {open ? (
        <div role="menu" className="absolute top-[calc(100%+4px)] right-0 z-[1000] w-[174px] rounded-lg border border-[var(--g200)] bg-white py-1 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPick(a.id);
              }}
              className="flex h-[34px] w-full items-center gap-2 px-3 text-left text-[14px] leading-5 text-[var(--g700)] hover:bg-[var(--g50)]"
            >
              <Stroke d={a.icon} size={16} className="shrink-0 text-[var(--g500)]" />
              {a.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PaymentsPanel({ onClose }: { onClose: () => void }) {
  const { payments } = useStore();
  const [modal, setModal] = React.useState<ActionId | null>(null);
  const close = React.useCallback(() => setModal(null), []);
  const hasTransactions = payments.some((p) => p.kind === "Transactions");

  return (
    <PanelShell title="Payments" onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="flex h-[54px] items-start">
          <p className="w-[134px] text-[12px] leading-[18px] text-[#607179]">
            {hasTransactions ? "" : "No transactions yet! Create a new payment now"}
          </p>
          <div className="flex flex-1 justify-end">
            <ActionsMenu onPick={setModal} />
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-4 pb-4">
          {PAYMENT_CARDS.map((c) => {
            const rows = payments.filter((p) => p.kind === c.title);
            return (
              <div key={c.title} className="overflow-hidden rounded-lg bg-white shadow-[0_1px_3px_0_rgba(16,24,40,0.1),0_1px_2px_0_rgba(16,24,40,0.06)]">
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
                {rows.length === 0 ? (
                  <div className="flex h-[116px] items-center justify-center py-12">
                    <p className="text-[13px] leading-5 text-[var(--g500)]">{c.empty}</p>
                  </div>
                ) : (
                  <ul className="max-h-[180px] overflow-y-auto">
                    {rows.map((r) => (
                      <li key={r.id} title={r.label} className="grid min-h-9 grid-cols-3 items-center border-t border-[var(--g100)] text-[12px] leading-[18px] text-[var(--g900)]">
                        <span className="px-2.5 py-2">{mdy(r.date)}</span>
                        <span className="truncate px-2.5 py-2 font-medium">{money(r.amount, r.currency)}</span>
                        <span className="px-2.5 py-2">
                          <span className={cn("rounded-full px-1.5 py-px text-[11px] font-medium", STATUS_TONE[r.status] ?? STATUS_TONE.Draft)}>{r.status}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {modal === "charge" ? <ChargeNowModal onClose={close} /> : null}
      {modal === "card" ? <InfoModal title="Add Card on File" subtitle="Add customer card details for future purchases" primary="Add Card" onClose={close} /> : null}
      {modal === "methods" ? <InfoModal title="Manage Methods" onClose={close} /> : null}
      {modal === "subscription" ? <SubscriptionModal onClose={close} /> : null}
      {modal === "invoice" ? <BuilderModal kind="Invoices" onClose={close} /> : null}
      {modal === "estimate" ? <BuilderModal kind="Estimates" onClose={close} /> : null}
    </PanelShell>
  );
}
