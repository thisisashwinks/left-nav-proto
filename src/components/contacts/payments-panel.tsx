"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  CreditCard,
  ExternalLink,
  FileText,
  Link2,
  ReceiptText,
  Repeat,
  X,
  type LucideIcon,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";

/**
 * The Payments panel of the record rail.
 *
 * Four ledgers on one person — what they paid, what renews, what they were
 * billed, and what they were quoted. Each is a small card rather than a tab,
 * because the question this panel answers is "is there money here at all",
 * and four short cards answer it at a glance where four tabs would make you
 * click through three empties to find the one that is not.
 *
 * The data is controlled: the host keeps it per record, like the
 * opportunities panel, so a charge made on one conversation does not show up
 * on the next one.
 */

export type PaymentStatus =
  | "succeeded"
  | "failed"
  | "refunded"
  | "active"
  | "canceled"
  | "paid"
  | "due"
  | "overdue"
  | "draft"
  | "sent"
  | "accepted";

export interface PaymentRow {
  id: string;
  /** "Sep 12, 2026" */
  date: string;
  amount: number;
  status: PaymentStatus;
}

export interface PaymentsData {
  transactions: PaymentRow[];
  subscriptions: PaymentRow[];
  invoices: PaymentRow[];
  estimates: PaymentRow[];
}

export type PaymentActionId =
  | "invoice"
  | "estimate"
  | "payment_link"
  | "charge"
  | "subscription";

/* ─── Formatting ────────────────────────────────────────────────────────── */

/** "$49", "$1,299", "$12.50" — cents only when there are some. */
export function formatMoney(n: number): string {
  const cents = Math.round(n * 100) % 100 !== 0;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** `<input type="date">` gives "2026-10-13"; parse it as a local date. */
function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return formatDate(new Date(y, m - 1, d));
}

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/* ─── Seed ──────────────────────────────────────────────────────────────── */

const EMPTY: PaymentsData = {
  transactions: [],
  subscriptions: [],
  invoices: [],
  estimates: [],
};

/** Most records have never paid; the two demo threads carry a little history. */
export function seedPayments(recordId: string): PaymentsData {
  const id = recordId.toLowerCase();
  if (id.includes("pietro")) {
    return {
      transactions: [
        { id: "pt-1", date: "Sep 12, 2026", amount: 690, status: "succeeded" },
        { id: "pt-2", date: "Aug 4, 2026", amount: 450, status: "succeeded" },
        { id: "pt-3", date: "Jun 19, 2026", amount: 159, status: "succeeded" },
      ],
      subscriptions: [
        { id: "ps-1", date: "Jun 19, 2026", amount: 59, status: "active" },
      ],
      invoices: [
        { id: "pi-1", date: "Sep 12, 2026", amount: 690, status: "paid" },
        { id: "pi-2", date: "Aug 4, 2026", amount: 450, status: "paid" },
        { id: "pi-3", date: "Sep 20, 2026", amount: 1250, status: "overdue" },
      ],
      estimates: [
        { id: "pe-1", date: "Sep 24, 2026", amount: 12500, status: "sent" },
      ],
    };
  }
  if (id.includes("aiden")) {
    return {
      transactions: [
        { id: "at-1", date: "Sep 18, 2026", amount: 249, status: "succeeded" },
        { id: "at-2", date: "Sep 17, 2026", amount: 249, status: "failed" },
      ],
      subscriptions: [
        { id: "as-1", date: "May 2, 2026", amount: 29, status: "canceled" },
      ],
      invoices: [
        { id: "ai-1", date: "Sep 26, 2026", amount: 249, status: "due" },
      ],
      estimates: [],
    };
  }
  return { ...EMPTY };
}

/* ─── Status pill ───────────────────────────────────────────────────────── */

const STATUS_LABEL: Record<PaymentStatus, string> = {
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
  active: "Active",
  canceled: "Canceled",
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
};

type Tone = "good" | "bad" | "info" | "warn" | "neutral";

const STATUS_TONE: Record<PaymentStatus, Tone> = {
  succeeded: "good",
  paid: "good",
  active: "good",
  accepted: "good",
  failed: "bad",
  overdue: "bad",
  sent: "info",
  due: "warn",
  refunded: "neutral",
  canceled: "neutral",
  draft: "neutral",
};

/**
 * The outlined money pill the invoices table uses, so a "Paid" here and a
 * "Paid" on the Invoices page are the same chip. `due` borrows the amber
 * warn pair — it is the one state that is neither settled nor late.
 */
export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex h-[21px] w-fit items-center rounded-full px-[9px] text-[11.5px] leading-[normal] font-medium whitespace-nowrap",
        tone === "good" &&
          "text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-paid-border)]",
        tone === "bad" &&
          "text-[var(--pg-status-overdue-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-overdue-border)]",
        tone === "info" &&
          "text-[var(--pg-status-sent-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-sent-border)]",
        tone === "warn" &&
          "text-[var(--pg-warn-fg)] shadow-[inset_0_0_0_1px_var(--pg-warn-border)]",
        tone === "neutral" &&
          "text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ─── Portalled menu ────────────────────────────────────────────────────── */

/**
 * A menu card that escapes the drawer's scroll clip.
 *
 * Same shape as the opportunities panel's: fixed to the viewport, placed off
 * the anchor's rect, flipped above when there is no room below, and closed by
 * an outside press or Escape. Exported so the agent logs filter can share it.
 */
export function PanelMenu({
  anchor,
  onClose,
  align = "end",
  width = 208,
  label,
  children,
}: {
  anchor: HTMLElement | null;
  onClose: () => void;
  align?: "start" | "end";
  width?: number;
  label: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !anchor) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const gap = 4;
      const below = r.bottom + gap;
      const top =
        below + h > window.innerHeight - 8 && r.top - gap - h >= 8
          ? r.top - gap - h
          : below;
      const rawLeft = align === "end" ? r.right - w : r.left;
      const left = Math.min(Math.max(8, rawLeft), window.innerWidth - w - 8);
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
      el.style.visibility = "visible";
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, align]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
      anchor?.focus();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [anchor, onClose]);

  if (!anchor) return null;
  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      style={{ position: "fixed", top: 0, left: 0, width, visibility: "hidden" }}
      className="z-[90] flex flex-col rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),0_0_0_1px_var(--pg-card-border)]"
    >
      {children}
    </div>,
    document.body,
  );
}

/* ─── Header actions ────────────────────────────────────────────────────── */

const ACTIONS: { id: PaymentActionId; label: string; icon: LucideIcon }[] = [
  { id: "invoice", label: "Create invoice", icon: ReceiptText },
  { id: "estimate", label: "Create estimate", icon: FileText },
  { id: "payment_link", label: "Send payment link", icon: Link2 },
  { id: "charge", label: "Charge card", icon: CreditCard },
  { id: "subscription", label: "Add subscription", icon: Repeat },
];

/** "Actions ▾" for the drawer header's trailing slot. */
export function PaymentsHeaderActions({
  onAction,
}: {
  onAction: (id: PaymentActionId) => void;
}) {
  const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  return (
    <>
      <OutlineButton
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
        className="h-[30px] gap-[5px] px-[10px] text-[13px]"
      >
        Actions
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn(
            "text-pg-muted transition-transform duration-150",
            anchor && "rotate-180",
          )}
        />
      </OutlineButton>
      <PanelMenu anchor={anchor} onClose={close} label="Payment actions">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onAction(a.id);
            }}
            className="flex h-[36px] w-full items-center gap-[9px] rounded-[6px] px-[9px] text-left text-[14px] leading-[20px] text-pg-text motion-tap hover:bg-pg"
          >
            <a.icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
            {a.label}
          </button>
        ))}
      </PanelMenu>
    </>
  );
}

/* ─── Inline create form ────────────────────────────────────────────────── */

interface ActionSpec {
  title: string;
  cta: string;
  list: keyof PaymentsData;
  status: PaymentStatus;
  /** A second field, when the action has a date worth asking for. */
  dateLabel?: string;
  dateDays?: number;
  hint?: string;
  toast: (amount: string, name: string, date: string) => string;
}

const SPECS: Record<PaymentActionId, ActionSpec> = {
  invoice: {
    title: "Create invoice",
    cta: "Create invoice",
    list: "invoices",
    status: "draft",
    dateLabel: "Due date",
    dateDays: 14,
    toast: (a, _n, d) => `Invoice for ${a} saved as draft${d ? ` · due ${d}` : ""}`,
  },
  estimate: {
    title: "Create estimate",
    cta: "Send estimate",
    list: "estimates",
    status: "sent",
    dateLabel: "Expires on",
    dateDays: 30,
    toast: (a, n) => `Estimate for ${a} sent to ${n}`,
  },
  payment_link: {
    title: "Send payment link",
    cta: "Send link",
    list: "invoices",
    status: "sent",
    hint: "They get a link by email and SMS to pay online.",
    toast: (a, n) => `Payment link for ${a} sent to ${n}`,
  },
  charge: {
    title: "Charge card",
    cta: "Charge card",
    list: "transactions",
    status: "succeeded",
    hint: "Charges the card on file ending in 4242.",
    toast: (a) => `Charged ${a} to card ending in 4242`,
  },
  subscription: {
    title: "Add subscription",
    cta: "Add subscription",
    list: "subscriptions",
    status: "active",
    dateLabel: "Starts on",
    dateDays: 0,
    hint: "Bills monthly until canceled.",
    toast: (a, n) => `${n} subscribed at ${a}/month`,
  },
};

const FIELD =
  "h-[36px] w-full rounded-[8px] bg-pg-surface text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";

function ActionForm({
  action,
  recordName,
  onCancel,
  onCreate,
}: {
  action: PaymentActionId;
  recordName: string;
  onCancel: () => void;
  onCreate: (row: PaymentRow, list: keyof PaymentsData) => void;
}) {
  const spec = SPECS[action];
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(() =>
    spec.dateDays !== undefined ? isoInDays(spec.dateDays) : "",
  );
  const value = Number(amount.replace(/,/g, ""));
  const valid = Number.isFinite(value) && value > 0;
  const amountId = `pay-amount-${action}`;
  const dateId = `pay-date-${action}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const rounded = Math.round(value * 100) / 100;
    onCreate(
      {
        id: `${action}-${Date.now()}`,
        date: formatDate(new Date()),
        amount: rounded,
        status: spec.status,
      },
      spec.list,
    );
    showToast(spec.toast(formatMoney(rounded), recordName, date ? formatIsoDate(date) : ""));
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--brand)]"
    >
      <div className="flex items-center justify-between gap-[8px]">
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
          {spec.title}
        </span>
        <button
          type="button"
          aria-label="Cancel"
          onClick={onCancel}
          className="flex size-[24px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label htmlFor={amountId} className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
          Amount
        </label>
        <div className={cn(FIELD, "flex items-center gap-[4px] px-[12px]")}>
          <span aria-hidden="true" className="text-pg-muted">
            $
          </span>
          <input
            id={amountId}
            autoFocus
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            className="min-w-0 flex-1 bg-transparent placeholder:text-pg-faint focus:outline-none"
          />
        </div>
      </div>

      {spec.dateLabel ? (
        <div className="flex flex-col gap-[4px]">
          <label htmlFor={dateId} className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
            {spec.dateLabel}
          </label>
          <input
            id={dateId}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(FIELD, "px-[12px] focus:outline-none [color-scheme:light] dark:[color-scheme:dark]")}
          />
        </div>
      ) : null}

      {spec.hint ? (
        <span className="text-[13px] leading-[18px] text-pg-muted">{spec.hint}</span>
      ) : null}

      <div className="flex justify-end gap-[12px]">
        <OutlineButton onClick={onCancel} className="h-[36px]">
          Cancel
        </OutlineButton>
        <PrimaryButton type="submit" disabled={!valid} className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50">
          {spec.cta}
        </PrimaryButton>
      </div>
    </form>
  );
}

/* ─── Ledger card ───────────────────────────────────────────────────────── */

function LedgerCard({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: PaymentRow[];
}) {
  return (
    <section className="overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex h-[44px] items-center justify-between gap-[8px] pr-[8px] pl-[12px]">
        <span className="truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
          {title}
          {rows.length ? (
            <span className="font-normal text-pg-muted"> ({rows.length})</span>
          ) : null}
        </span>
        <button
          type="button"
          aria-label={`Open ${title.toLowerCase()} in Payments`}
          title="Open in Payments"
          onClick={() => showToast("Opens in Payments")}
          className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text active:scale-90"
        >
          <ExternalLink size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="grid h-[32px] grid-cols-[1fr_76px_92px] items-center gap-[8px] bg-pg px-[12px] text-[13px] leading-[18px] text-pg-muted">
        <span>Date</span>
        <span className="text-right">Amount</span>
        <span className="pl-[4px]">Status</span>
      </div>
      {rows.length === 0 ? (
        <div className="flex h-[96px] items-center justify-center px-[12px] text-center text-[13px] leading-[18px] text-pg-muted">
          {empty}
        </div>
      ) : (
        <ul>
          {rows.map((r) => (
            <li
              key={r.id}
              className="grid h-[40px] grid-cols-[1fr_76px_92px] items-center gap-[8px] border-t border-pg-row-border px-[12px] text-[14px] leading-[20px]"
            >
              <span className="truncate text-pg-text">{r.date}</span>
              <span className="text-right font-medium text-pg-text-strong tabular-nums">
                {formatMoney(r.amount)}
              </span>
              <span className="pl-[4px]">
                <PaymentStatusPill status={r.status} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─── Body ──────────────────────────────────────────────────────────────── */

export function PaymentsBody({
  recordName,
  value,
  onChange,
  actionSignal,
}: {
  recordId: string;
  recordName: string;
  value: PaymentsData;
  onChange: (next: PaymentsData) => void;
  /**
   * Bump `n` to open the inline form for `id` — the header's Actions menu
   * lives in the drawer chrome, so this is how it reaches the body.
   */
  actionSignal?: { id: string; n: number };
}) {
  const [form, setForm] = React.useState<PaymentActionId | null>(null);
  const [seen, setSeen] = React.useState(actionSignal?.n);

  // Adjust-during-render rather than an effect: a new signal opens the form
  // on the same paint the menu closes on.
  if (actionSignal && actionSignal.n !== seen) {
    setSeen(actionSignal.n);
    if (actionSignal.id in SPECS) setForm(actionSignal.id as PaymentActionId);
  }

  const settled = value.transactions.filter((t) => t.status === "succeeded");
  const lifetime = settled.reduce((sum, t) => sum + t.amount, 0);
  const count = value.transactions.length;

  return (
    <div className="flex flex-col gap-[12px] py-[12px]">
      <p className="text-[13px] leading-[18px] text-pg-muted">
        {count === 0
          ? "No transactions yet. Create a payment to get started."
          : `Lifetime value ${formatMoney(lifetime)} · ${count.toLocaleString("en-US")} ${
              count === 1 ? "transaction" : "transactions"
            }`}
      </p>

      {form ? (
        <ActionForm
          key={`${form}-${seen ?? 0}`}
          action={form}
          recordName={recordName}
          onCancel={() => setForm(null)}
          onCreate={(row, list) => {
            onChange({ ...value, [list]: [row, ...value[list]] });
            setForm(null);
          }}
        />
      ) : null}

      <LedgerCard title="Transactions" empty="No transactions found" rows={value.transactions} />
      <LedgerCard title="Subscriptions" empty="No subscriptions found" rows={value.subscriptions} />
      <LedgerCard title="Invoices" empty="No invoices found" rows={value.invoices} />
      <LedgerCard title="Estimates" empty="No estimates found" rows={value.estimates} />
    </div>
  );
}
