"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CalendarDays,
  CircleArrowDown,
  CircleCheck,
  Clock3,
  Download,
  Eye,
  Info,
  ListFilter,
  ReceiptText,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { OutlineButton, OverflowMenu, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { Modal } from "@/components/page/modal";
import { SideDrawer, DrawerCheckRow } from "@/components/page/side-drawer";
import { ToneAvatar } from "@/components/page/avatar";
import { TableCard, usePagination } from "@/components/page/table-card";
import { ListToolbar, useListToolbar, type ListToolbarModel } from "@/components/page/list-toolbar";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  ORDERS,
  ORDER_SOURCES,
  STATUS_LABEL,
  formatOrderDate,
  itemCount,
  money,
  orderTotals,
  type Order,
  type OrderStatus,
} from "./orders-data";

/*
 * Customer, Source, Items, Order date, Amount, Status, kebab — the live
 * column order and roughly its proportions. Source is wide because the store
 * names are long ("Services Elegant Touch Salon & Spa") and truncating the one
 * column that says where the money came from would hide the point of it.
 */
const COLS = "minmax(180px,1.6fr) minmax(160px,1.9fr) 0.7fr minmax(150px,1.2fr) minmax(110px,1fr) 0.9fr 40px";

const SORT_FIELDS = [
  { value: "date", label: "Order date" },
  { value: "amount", label: "Amount" },
  { value: "customer", label: "Customer" },
];

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => ({
  value: s,
  label: STATUS_LABEL[s],
}));
const SOURCE_OPTIONS = ORDER_SOURCES.map((s) => ({ value: s, label: s }));

/** Midnight at the start of a yyyy-mm-dd, local time; end-of-day for the end. */
const dayStart = (v: string) => (v ? new Date(`${v}T00:00:00`).getTime() : null);
const dayEnd = (v: string) => (v ? new Date(`${v}T23:59:59.999`).getTime() : null);

/**
 * Commerce ▸ Orders ▸ Order list.
 *
 * One list, filtered four ways — a date range, status, source and a search
 * over customer, source and order number — with each order opening in a
 * drawer rather than a page: an order is read, not edited, and the list you
 * were scanning should still be there behind it.
 */
export function OrdersPage() {
  const { effective } = useTheme();
  const toolbar = useListToolbar();
  const [orders, setOrders] = React.useState<Order[]>(ORDERS);
  const [query, setQuery] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [sources, setSources] = React.useState<string[]>([]);
  const [sort, setSort] = React.useState<{ field: string; dir: "asc" | "desc" } | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dayStart(start);
    const to = dayEnd(end);
    const filtered = orders.filter(
      (o) =>
        (statuses.length === 0 || statuses.includes(o.status)) &&
        (sources.length === 0 || sources.includes(o.source)) &&
        (from === null || o.placedAt >= from) &&
        (to === null || o.placedAt <= to) &&
        (q === "" ||
          o.number.toLowerCase().includes(q) ||
          o.source.toLowerCase().includes(q) ||
          (o.customer?.name.toLowerCase().includes(q) ?? false)),
    );
    if (!sort) return filtered;
    const key = (o: Order): string | number =>
      sort.field === "amount"
        ? orderTotals(o).total
        : sort.field === "customer"
          ? (o.customer?.name.toLowerCase() ?? "")
          : o.placedAt;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      return (ka < kb ? -1 : ka > kb ? 1 : 0) * dir;
    });
  }, [orders, query, start, end, statuses, sources, sort]);

  const pager = usePagination(rows);
  const filterCount = statuses.length + sources.length;
  const filtered = filterCount > 0 || query.trim() !== "" || start !== "" || end !== "";
  const open = orders.find((o) => o.id === openId) ?? null;

  const setStatus = (id: string, status: OrderStatus) => {
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    showToast(status === "completed" ? "Order marked as completed" : "Order marked as pending");
  };

  const clearAll = () => {
    setQuery("");
    setStart("");
    setEnd("");
    setStatuses([]);
    setSources([]);
  };

  const exportCsv = () => {
    const head = ["Order", "Customer", "Email", "Source", "Items", "Order date", "Amount", "Currency", "Status"];
    const body = rows.map((o) => [
      o.number,
      o.customer?.name ?? "",
      o.customer?.email ?? "",
      o.source,
      String(itemCount(o)),
      new Date(o.placedAt).toISOString(),
      orderTotals(o).total.toFixed(2),
      o.currency,
      STATUS_LABEL[o.status],
    ]);
    const csv = [head, ...body]
      .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} ${rows.length === 1 ? "order" : "orders"}`);
  };

  const toolbarModel = React.useMemo<ListToolbarModel>(
    () => ({
      search: { value: query, onChange: setQuery, placeholder: "Search" },
      quickFilters: [
        { id: "status", label: "Status", options: STATUS_OPTIONS, value: statuses, multiple: true, onChange: setStatuses },
        { id: "source", label: "Source", options: SOURCE_OPTIONS, value: sources, multiple: true, onChange: setSources },
      ],
      sort: { fields: SORT_FIELDS, value: sort, onChange: setSort },
      resultCount: { value: rows.length, noun: rows.length === 1 ? "order" : "orders" },
      trailing: <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />,
    }),
    [query, statuses, sources, sort, rows.length, start, end],
  );

  const table = (
    <TableCard
      pager={pager}
      className={toolbar.shared ? undefined : "rounded-none shadow-none"}
    >
      <div
        role="row"
        style={{ gridTemplateColumns: COLS }}
        className="sticky top-0 z-10 grid h-[44px] items-center gap-[16px] border-b border-pg-head-border bg-[color-mix(in_srgb,var(--pg-border)_22%,var(--pg-surface))] px-[24px]"
      >
        {["Customer", "Source", "Items", "Order date", "Amount", "Status", ""].map((h, i) => (
          <span
            key={h || `col-${i}`}
            role="columnheader"
            className="truncate text-[13px] leading-[18px] font-medium whitespace-nowrap text-pg-text-strong"
          >
            {h}
          </span>
        ))}
      </div>

      {pager.pageRows.map((o) => (
        <OrderRow
          key={o.id}
          order={o}
          onOpen={() => setOpenId(o.id)}
          onStatus={(s) => setStatus(o.id, s)}
        />
      ))}

      {rows.length === 0 ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-[6px] text-center">
          <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
            {filtered ? "No orders match" : "No orders yet"}
          </p>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            {filtered
              ? "Try a different search, date range, or filter."
              : "Orders show up here as soon as someone checks out."}
          </p>
          {filtered ? (
            <button
              type="button"
              onClick={clearAll}
              className="mt-[4px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}
    </TableCard>
  );

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[16px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Orders"
        description="Track all order submissions in a single place"
        aside={
          <OutlineButton onClick={() => setImportOpen(true)}>
            <Download size={15} aria-hidden="true" className="text-pg-text-strong" />
            Import as CSV
          </OutlineButton>
        }
      />

      {toolbar.shared ? (
        <ListToolbar model={toolbarModel}>
          <div className="flex min-h-0 flex-1 flex-col">{table}</div>
        </ListToolbar>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <div className="flex shrink-0 flex-wrap items-center gap-[12px] border-b border-pg-head-border px-[16px] py-[14px]">
            <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
            <span className="min-w-[8px] flex-1" />
            <button
              type="button"
              title="Export orders"
              aria-label="Export orders"
              onClick={exportCsv}
              className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:bg-pg"
            >
              <CircleArrowDown size={17} aria-hidden="true" />
            </button>
            <OutlineButton onClick={() => setFiltersOpen(true)} className="h-[36px]">
              <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
              Filters
              {filterCount > 0 ? (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-[5px] text-[11px] leading-none font-semibold text-brand-fg">
                  {filterCount}
                </span>
              ) : null}
            </OutlineButton>
            <label className="flex h-[36px] w-[220px] min-w-[160px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search orders"
                className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </label>
          </div>
          {table}
        </div>
      )}

      {filtersOpen ? (
        <FiltersDrawer
          statuses={statuses}
          sources={sources}
          onApply={(s, src) => {
            setStatuses(s);
            setSources(src);
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}

      {open ? (
        <OrderDrawer
          order={open}
          onClose={() => setOpenId(null)}
          onStatus={(s) => setStatus(open.id, s)}
        />
      ) : null}

      {importOpen ? <ImportModal onClose={() => setImportOpen(false)} /> : null}
    </div>
  );
}

/* ─── Toolbar ───────────────────────────────────────────────────────────── */

/**
 * Start → end as one field, the live control's shape: a range is one value,
 * and two separate pickers invite setting the start and forgetting the end.
 * The end can't precede the start; each slot clears on its own.
 */
function DateRange({
  start,
  end,
  onStart,
  onEnd,
}: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
}) {
  const slot = (
    value: string,
    onChange: (v: string) => void,
    label: string,
    bounds: { min?: string; max?: string },
  ) => (
    <span className="relative flex min-w-0 flex-1 items-center">
      <input
        type="date"
        value={value}
        min={bounds.min}
        max={bounds.max}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-full w-full min-w-0 bg-transparent text-center text-[14px] leading-[20px] focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0",
          value ? "text-pg-text" : "text-transparent",
        )}
      />
      {value ? null : (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[14px] leading-[20px] text-pg-faint">
          {label}
        </span>
      )}
    </span>
  );
  return (
    <div className="flex h-[36px] w-[360px] max-w-full shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
      {slot(start, onStart, "Start date", { max: end || undefined })}
      <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
      {slot(end, onEnd, "End date", { min: start || undefined })}
      {start || end ? (
        <button
          type="button"
          aria-label="Clear date range"
          onClick={() => {
            onStart("");
            onEnd("");
          }}
          className="flex size-[20px] shrink-0 items-center justify-center rounded-[4px] text-pg-muted hover:bg-pg hover:text-pg-heading"
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : (
        <CalendarDays size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      )}
    </div>
  );
}

/* ─── Rows ──────────────────────────────────────────────────────────────── */

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] w-fit items-center rounded-full px-[9px] text-[12px] leading-none font-medium whitespace-nowrap",
        status === "completed"
          ? "bg-[color-mix(in_oklab,var(--hr-success-500)_8%,transparent)] text-[var(--hr-success-700)] shadow-[inset_0_0_0_1px_var(--hr-success-300)]"
          : "bg-[color-mix(in_oklab,var(--hr-warning-500)_8%,transparent)] text-[var(--hr-warning-600)] shadow-[inset_0_0_0_1px_var(--hr-warning-300)]",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** A walk-in order has no contact — the live list draws a "?" disc for it. */
function CustomerCell({ order }: { order: Order }) {
  if (!order.customer) {
    return (
      <span className="flex min-w-0 items-center gap-[12px]">
        <span
          title="No customer on this order"
          className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[var(--hr-gray-600)] text-[13px] leading-none font-medium text-white"
        >
          ?
        </span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-[12px]">
      <ToneAvatar name={order.customer.name} tone={order.customer.tone} size={32} round />
      <span className="truncate text-[14px] leading-[20px] text-pg-text">{order.customer.name}</span>
    </span>
  );
}

function OrderRow({
  order,
  onOpen,
  onStatus,
}: {
  order: Order;
  onOpen: () => void;
  onStatus: (s: OrderStatus) => void;
}) {
  const n = itemCount(order);
  const { total } = orderTotals(order);
  return (
    <div
      role="row"
      style={{ gridTemplateColumns: COLS }}
      onClick={onOpen}
      className="group grid h-[60px] w-full cursor-pointer items-center gap-[16px] border-b border-pg-row-border px-[24px] last:border-b-0 hover:bg-[color-mix(in_srgb,var(--pg-border)_14%,var(--pg-surface))]"
    >
      <CustomerCell order={order} />
      <span className="truncate text-[14px] leading-[20px] text-pg-text" title={order.source}>
        {order.source}
      </span>
      <span className="truncate text-[14px] leading-[20px] text-pg-text">
        {n} {n === 1 ? "Item" : "Items"}
      </span>
      <span className="truncate text-[14px] leading-[20px] text-pg-text">
        {formatOrderDate(order.placedAt)}
      </span>
      <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-semibold text-pg-heading tabular-nums">
        {money(total, order.currency)}
        <AmountInfo order={order} />
      </span>
      <StatusPill status={order.status} />
      {/* The kebab is the one control in the row that must not open it. */}
      <span onClick={(e) => e.stopPropagation()} className="flex justify-end">
        <OverflowMenu
          items={[
            { label: "View order", icon: Eye, onClick: onOpen },
            order.status === "pending"
              ? { label: "Mark as completed", icon: CircleCheck, onClick: () => onStatus("completed") }
              : { label: "Mark as pending", icon: Clock3, onClick: () => onStatus("pending") },
            {
              label: "Download receipt",
              icon: ReceiptText,
              onClick: () => showToast(`Receipt for ${order.number} downloaded`),
            },
          ]}
        />
      </span>
    </div>
  );
}

/**
 * The ⓘ beside the amount: how the total was reached.
 *
 * Portalled and fixed-positioned, because the table scrolls inside its card
 * and an in-flow tooltip on the first or last row would be clipped by it.
 */
function AmountInfo({ order }: { order: Order }) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const t = orderTotals(order);
  const show = (el: HTMLElement) => setRect(el.getBoundingClientRect());
  const below = rect ? rect.bottom + 180 < window.innerHeight : true;
  return (
    <>
      <span
        tabIndex={0}
        aria-label={`Amount breakdown for ${order.number}`}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={() => setRect(null)}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setRect(null)}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex text-pg-text-strong outline-none focus-visible:text-brand"
      >
        <Info size={15} aria-hidden="true" />
      </span>
      {rect && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              style={{
                left: rect.left + rect.width / 2,
                top: below ? rect.bottom + 8 : rect.top - 8,
              }}
              className={cn(
                "pointer-events-none fixed z-[96] w-[220px] -translate-x-1/2 rounded-[8px] bg-[var(--hr-gray-900)] px-[12px] py-[10px] text-[12px] leading-[18px] text-white shadow-lg",
                !below && "-translate-y-full",
              )}
            >
              {[
                ["Subtotal", money(t.subtotal, order.currency)],
                ...(t.discount ? [["Discount", `−${money(t.discount, order.currency)}`]] : []),
                ...(t.tax ? [["Tax", money(t.tax, order.currency)]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-[12px] text-white/80">
                  <span>{k}</span>
                  <span className="tabular-nums">{v}</span>
                </div>
              ))}
              <div className="mt-[4px] flex justify-between gap-[12px] border-t border-white/20 pt-[4px] font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{money(t.total, order.currency)}</span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/* ─── Drawers & modal ───────────────────────────────────────────────────── */

/** SideDrawer floats without a scrim; this one dims the page behind it. */
function Scrim({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close panel"
      onClick={onClose}
      className="fixed inset-0 z-[79] cursor-default bg-[rgba(16,24,40,0.24)]"
    />
  );
}

function FiltersDrawer({
  statuses,
  sources,
  onApply,
  onClose,
}: {
  statuses: string[];
  sources: string[];
  onApply: (statuses: string[], sources: string[]) => void;
  onClose: () => void;
}) {
  const [s, setS] = React.useState(statuses);
  const [src, setSrc] = React.useState(sources);
  const flip = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  return (
    <>
      <Scrim onClose={onClose} />
      <SideDrawer
        title="Filters"
        width={360}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              disabled={s.length + src.length === 0}
              onClick={() => {
                setS([]);
                setSrc([]);
              }}
              className="text-[14px] leading-[20px] font-medium text-pg-muted enabled:hover:text-pg-heading disabled:text-pg-disabled"
            >
              Clear all
            </button>
            <span className="flex-1" />
            <OutlineButton onClick={onClose}>Cancel</OutlineButton>
            <PrimaryButton onClick={() => onApply(s, src)}>Apply</PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col gap-[16px] py-[14px]">
          <section className="flex flex-col">
            <h3 className="pb-[4px] text-[13px] leading-[18px] font-semibold text-pg-heading">Status</h3>
            {STATUS_OPTIONS.map((o) => (
              <DrawerCheckRow
                key={o.value}
                label={o.label}
                checked={s.includes(o.value)}
                onToggle={() => setS((l) => flip(l, o.value))}
              />
            ))}
          </section>
          <section className="flex flex-col border-t border-pg-head-border pt-[14px]">
            <h3 className="pb-[4px] text-[13px] leading-[18px] font-semibold text-pg-heading">Source</h3>
            {SOURCE_OPTIONS.map((o) => (
              <DrawerCheckRow
                key={o.value}
                label={o.label}
                checked={src.includes(o.value)}
                onToggle={() => setSrc((l) => flip(l, o.value))}
              />
            ))}
          </section>
        </div>
      </SideDrawer>
    </>
  );
}

function OrderDrawer({
  order,
  onClose,
  onStatus,
}: {
  order: Order;
  onClose: () => void;
  onStatus: (s: OrderStatus) => void;
}) {
  const t = orderTotals(order);
  const d = new Date(order.placedAt);
  const placed = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  return (
    <>
      <Scrim onClose={onClose} />
      <SideDrawer
        title={`Order ${order.number}`}
        subtitle={placed}
        width={420}
        onClose={onClose}
        trailing={<StatusPill status={order.status} />}
        footer={
          <>
            <OutlineButton onClick={() => showToast(`Receipt for ${order.number} downloaded`)}>
              <ReceiptText size={15} aria-hidden="true" className="text-pg-text-strong" />
              Download receipt
            </OutlineButton>
            <span className="flex-1" />
            {order.status === "pending" ? (
              <PrimaryButton onClick={() => onStatus("completed")}>Mark as completed</PrimaryButton>
            ) : (
              <OutlineButton onClick={() => onStatus("pending")}>Mark as pending</OutlineButton>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-[20px] py-[16px]">
          <section className="flex flex-col gap-[8px]">
            <h3 className="text-[13px] leading-[18px] font-semibold text-pg-muted">Customer</h3>
            {order.customer ? (
              <div className="flex items-center gap-[12px]">
                <ToneAvatar name={order.customer.name} tone={order.customer.tone} size={36} round />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[14px] leading-[20px] font-medium text-pg-heading">
                    {order.customer.name}
                  </span>
                  <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                    {order.customer.email}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[14px] leading-[20px] text-pg-muted">
                Walk-in order. No contact was attached at checkout.
              </p>
            )}
          </section>

          <dl className="grid grid-cols-2 gap-x-[16px] gap-y-[12px] text-[14px] leading-[20px]">
            {[
              ["Source", order.source],
              ["Payment", order.payment],
            ].map(([k, v]) => (
              <div key={k} className="flex min-w-0 flex-col gap-[2px]">
                <dt className="text-[13px] leading-[18px] text-pg-muted">{k}</dt>
                <dd className="truncate text-pg-text" title={v}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          <section className="flex flex-col gap-[8px]">
            <h3 className="text-[13px] leading-[18px] font-semibold text-pg-muted">
              Items ({itemCount(order)})
            </h3>
            <div className="flex flex-col rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              {order.lines.map((l, i) => (
                <div
                  key={`${l.name}-${i}`}
                  className="flex items-center gap-[12px] border-b border-pg-row-border px-[12px] py-[10px] last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">
                    {l.name}
                  </span>
                  <span className="shrink-0 text-[13px] leading-[18px] text-pg-muted tabular-nums">
                    {l.qty} × {money(l.price, order.currency)}
                  </span>
                  <span className="w-[88px] shrink-0 text-right text-[14px] leading-[20px] text-pg-heading tabular-nums">
                    {money(l.qty * l.price, order.currency)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-[6px] text-[14px] leading-[20px]">
            {[
              ["Subtotal", money(t.subtotal, order.currency)],
              ...(t.discount ? [["Discount", `−${money(t.discount, order.currency)}`]] : []),
              ["Tax", money(t.tax, order.currency)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-pg-text">
                <span className="text-pg-muted">{k}</span>
                <span className="tabular-nums">{v}</span>
              </div>
            ))}
            <div className="mt-[4px] flex justify-between border-t border-pg-head-border pt-[10px] text-[16px] leading-[22px] font-semibold text-pg-heading">
              <span>Total</span>
              <span className="tabular-nums">{money(t.total, order.currency)}</span>
            </div>
          </section>
        </div>
      </SideDrawer>
    </>
  );
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [drag, setDrag] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const take = (f: File | undefined) => {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      setError("Choose a .csv file.");
      return;
    }
    setError("");
    setFile(f);
  };
  return (
    <Modal
      title="Import orders"
      width={520}
      onClose={onClose}
      bodyClassName="gap-[12px]"
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton
            disabled={!file}
            className="disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              showToast(`Importing ${file!.name}. We'll let you know when it's done.`);
              onClose();
            }}
          >
            Import
          </PrimaryButton>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        Upload a CSV with one order per row. Include customer email, source, items, order date,
        amount, and status.
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          take(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex flex-col items-center gap-[6px] rounded-[8px] border border-dashed px-[16px] py-[24px] text-center motion-tap",
          drag ? "border-brand bg-brand-soft" : "border-pg-border-strong hover:bg-pg",
        )}
      >
        <UploadCloud size={22} aria-hidden="true" className="text-pg-muted" />
        {file ? (
          <span className="text-[14px] leading-[20px] font-medium text-pg-heading">{file.name}</span>
        ) : (
          <span className="text-[14px] leading-[20px] text-pg-text">
            <span className="font-medium text-brand">Click to upload</span> or drag and drop
          </span>
        )}
        <span className="text-[13px] leading-[18px] text-pg-muted">CSV only, up to 25 MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => take(e.target.files?.[0])}
      />
      {error ? (
        <p className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob(["Customer email,Source,Items,Order date,Amount,Currency,Status\n"], { type: "text/csv" }),
          );
          const a = document.createElement("a");
          a.href = url;
          a.download = "orders-template.csv";
          a.click();
          URL.revokeObjectURL(url);
        }}
        className="flex w-fit items-center gap-[6px] text-[14px] leading-[20px] font-medium text-brand hover:underline"
      >
        <Download size={14} aria-hidden="true" />
        Download sample CSV
      </button>
    </Modal>
  );
}
