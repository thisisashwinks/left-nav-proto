"use client";

import * as React from "react";
import {
  ArrowRight,
  CalendarDays,
  Copy,
  Download,
  Info,
  ListFilter,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  PrimaryButton,
} from "@/components/page/page-header";
import {
  CollapsingSearch,
  GlyphButton,
  ScopePicker,
  useListShape,
} from "@/components/page/list-shape";
import { usePageCrumb } from "@/components/page/page-crumb";
import { ViewBar } from "@/components/page/view-bar";
import { ToneAvatar } from "@/components/page/avatar";
import { SCREEN_NAMES } from "@/components/nav/screen-names";
import { cn } from "@/lib/utils";
import { TableCard, usePagination } from "@/components/page/table-card";
import {
  ListToolbar,
  useListToolbar,
  type ListToolbarModel,
} from "@/components/page/list-toolbar";
import { InvoiceBuilder } from "./invoice-builder";
import { InvoiceLayoutsPage } from "./invoice-layouts-page";
import {
  KIND_ICON,
  KIND_LABEL,
  STATUS_LABEL,
  invoiceTiles,
  invoiceViews,
  invoices as seedInvoices,
  type Invoice,
  type InvoiceStatus,
  type InvoiceTile,
} from "./invoices-data";

/*
 * Seven columns, and the amount is the only one that is not left-aligned.
 *
 * Money right-aligns so the decimal points stack — $1,450.00 over $900.00
 * over $12,500.00 is only comparable at a glance if the columns of digits
 * line up, which is also why the cell is `tabular-nums`. Everything else on
 * this row is a name or a date and reads from the left.
 */
const COLS = "2.1fr 1.1fr 1.5fr 1fr 0.9fr 0.9fr 40px";

/*
 * The same six data columns as COLS, as data, so the list toolbar can hide
 * all but the name. With nothing hidden the template this builds is COLS.
 */
type InvoiceColumnId = "name" | "number" | "customer" | "issued" | "amount" | "status";
const INVOICE_COLUMNS: { id: InvoiceColumnId; label: string; width: string; locked?: boolean }[] = [
  { id: "name", label: "Invoice name", width: "2.1fr", locked: true },
  { id: "number", label: "Invoice number", width: "1.1fr" },
  { id: "customer", label: "Customer", width: "1.5fr" },
  { id: "issued", label: "Issue date", width: "1fr" },
  { id: "amount", label: "Amount", width: "0.9fr" },
  { id: "status", label: "Status", width: "0.9fr" },
];

function colsFor(hidden: ReadonlySet<string>) {
  if (hidden.size === 0) return COLS;
  return [
    ...INVOICE_COLUMNS.filter((c) => !hidden.has(c.id)).map((c) => c.width),
    "40px",
  ].join(" ");
}

const KIND_OPTIONS = (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => ({
  value: k,
  label: KIND_LABEL[k],
}));

const SORT_FIELDS = [
  { value: "name", label: "Invoice name" },
  { value: "issued", label: "Issue date" },
  { value: "amount", label: "Amount" },
  { value: "customer", label: "Customer" },
];

function amountValue(amount: string) {
  return Number(amount.replace(/[^0-9.-]/g, "")) || 0;
}

/**
 * The money state, as an outlined pill.
 *
 * Outlined rather than the dot-and-fill pill the CRM lists use, because this
 * column has four states where those have two, and a filled chip at four
 * colours turns a quiet table into a set of traffic lights. The outline keeps
 * the row's weight on the invoice name where it belongs and still lets
 * "Overdue" be found by colour when you are scanning for it — which is the
 * one scan anyone actually runs down this column.
 */
function StatusPill({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-[21px] w-fit items-center rounded-full px-[9px] text-[11.5px] leading-[normal] font-medium whitespace-nowrap",
        status === "paid"
          ? "text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-paid-border)]"
          : status === "overdue"
            ? "text-[var(--pg-status-overdue-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-overdue-border)]"
            : status === "sent"
              ? "text-[var(--pg-status-sent-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-sent-border)]"
              : "text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * One of the four summary tiles.
 *
 * The number is the hero and the label is the caption, in that visual order
 * but the reverse reading order — label small on top, number large beneath —
 * which is how the production screen has it and is the right way round: you
 * come to this strip for the figure, and the label is what you check after
 * you have already read it.
 *
 * No sparkline, no delta, no comparison. There is no series behind these, and
 * a trend line drawn from one number is a decoration that claims to be data.
 */
function SummaryTile({ tile }: { tile: InvoiceTile }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[6px] rounded-[10px] bg-pg-surface px-[16px] py-[13px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <span className="flex items-center gap-[7px] truncate text-[12.5px] leading-[17px] text-pg-muted">
        <tile.icon
          size={14}
          aria-hidden="true"
          className={cn(
            "shrink-0",
            tile.tone === "paid"
              ? "text-[var(--pg-status-paid-fg)]"
              : tile.tone === "overdue"
                ? "text-[var(--pg-status-overdue-fg)]"
                : "text-pg-faint",
          )}
        />
        {tile.label}
      </span>
      <span className="truncate text-[24px] leading-[30px] font-semibold tracking-[-0.4px] text-pg-heading tabular-nums">
        {tile.value}
      </span>
    </div>
  );
}

/**
 * The date-range control, as one field rather than two.
 *
 * Two inputs with an arrow between them is what production draws and it is
 * worth keeping: a range is one value, and a single field with two slots says
 * so, where two separate date pickers side by side invite you to set the
 * start and forget the end. The arrow is inside the box for the same reason
 * the URL prefix is inside its input over in the calendar editor.
 */
function DateRange() {
  return (
    <div className="flex h-[34px] shrink-0 items-center gap-[10px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <span className="text-pg-faint">Start date</span>
      <ArrowRight size={13} aria-hidden="true" className="text-pg-faint" />
      <span className="text-pg-faint">End date</span>
      <CalendarDays size={15} aria-hidden="true" className="ml-[4px] text-pg-muted" />
    </div>
  );
}

export interface InvoicesPageProps {
  /**
   * The nav's seed: a status cut, or the word `layouts` for the L3 that is a
   * different screen rather than a different cut of this one.
   *
   * One prop for both because a REAL_PAGES entry gets exactly one seed
   * string, the same arrangement Calendars uses for `settings`. The page
   * sorts out which kind it is below.
   */
  initialView?: string | null;
}

/**
 * Commerce ▸ Invoices & Estimates.
 *
 * List, layouts and the one-invoice builder in one component, on the same
 * argument Workflows makes: opening an invoice is not a move in the nav's
 * sense — you are still in Invoices, looking at one of them — so the trail
 * above does not move and the record crumb appends itself.
 *
 * Layouts is the exception and is handled differently, because it genuinely
 * IS another place: its own L3 in both trees, its own heading, its own
 * collection of objects. It early-returns rather than branching inside the
 * render, so nothing below this line has to keep asking "unless we are on
 * layouts".
 */
export function InvoicesPage({ initialView }: InvoicesPageProps) {
  const { effective } = useTheme();
  const layoutsPlace = initialView === "layouts";
  /*
   * The nav can name a cut, so a deep row lands on the slice it promised —
   * but only as a seed. Once here, the view bar owns it.
   */
  const [view, setView] = React.useState(
    initialView && initialView !== "layouts" ? initialView : "all",
  );
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [kinds, setKinds] = React.useState<string[]>([]);
  const [sort, setSort] = React.useState<{ field: string; dir: "asc" | "desc" } | null>(null);
  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(() => new Set());
  const toolbar = useListToolbar();

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = seedInvoices.filter(
      (i) =>
        (view === "all" || i.status === view) &&
        (kinds.length === 0 || kinds.includes(i.kind)) &&
        (q === "" ||
          i.name.toLowerCase().includes(q) ||
          i.number.toLowerCase().includes(q) ||
          i.customer.toLowerCase().includes(q)),
    );
    if (!sort) return filtered;
    const key = (i: Invoice): string | number =>
      sort.field === "issued"
        ? Date.parse(i.issued) || 0
        : sort.field === "amount"
          ? amountValue(i.amount)
          : sort.field === "customer"
            ? i.customer.toLowerCase()
            : i.name.toLowerCase();
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      return (ka < kb ? -1 : ka > kb ? 1 : 0) * dir;
    });
  }, [view, query, kinds, sort]);

  const cols = colsFor(hidden);

  /*
   * The page this table is standing on — see page/table-card.tsx.
   *
   * Over the FILTERED rows, so the pager counts what the view shows rather
   * than the collection behind it: switch the cut and the page count has to
   * follow, or the control is describing a different list from the one under
   * it.
   */
  const pager = usePagination(rows);

  const open = seedInvoices.find((i) => i.id === openId) ?? null;

  const shape = useListShape();
  const activeView = invoiceViews.find((v) => v.id === view) ?? invoiceViews[0]!;

  /*
   * L-E's last crumb: Payments ▸ Invoices ▸ Overdue, switchable from there.
   *
   * Published unconditionally rather than only on the list, for the reason
   * workflows-page publishes its own — the crumb IS the scope control under
   * this variant, and one that vanished the moment you opened an invoice
   * would read as a bug exactly when the detail view is what is being judged.
   * Null on the layouts place, which has no cuts to offer.
   */
  usePageCrumb(
    !layoutsPlace && !toolbar.shared && shape.scopeInTrail && shape.showViews
      ? {
          label: activeView.label,
          options: invoiceViews.map((v) => ({
            id: v.id,
            label: v.label,
            selected: v.id === view,
          })),
          onSelect: setView,
        }
      : null,
  );

  const controls = (
    <>
      <DateRange />
      <div className="flex h-[34px] min-w-0 flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search invoices"
          aria-label="Search invoices"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <GlyphButton icon={Download} label="Export invoices" />
      <OutlineButton>
        <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
        Filters
      </OutlineButton>
    </>
  );

  /*
   * The same controls with their labels sold off — L-F, and only L-F.
   *
   * The date range does not survive the reduction, and that is the finding
   * rather than an omission: a range is two values and a glyph cannot show
   * either, so collapsing it would hide a filter that is currently ON with no
   * way to tell. It becomes a calendar glyph that opens the same picker, and
   * the range it holds is then invisible until you open it — which is the
   * cost of L-F on any page whose filters carry state, and the one thing
   * Workflows' version of this cluster cannot show.
   */
  const glyphControls = (
    <>
      <GlyphButton icon={CalendarDays} label="Date range" />
      <GlyphButton icon={ListFilter} label="Filters" />
      <GlyphButton icon={Download} label="Export invoices" />
      <CollapsingSearch placeholder="Search invoices" label="Search invoices" />
    </>
  );

  const toolbarModel = React.useMemo<ListToolbarModel>(
    () => ({
      views: {
        items: invoiceViews.map((v) => ({ id: v.id, label: v.label, count: v.count })),
        activeId: view,
        onSelect: setView,
        noun: "view",
      },
      search: { value: query, onChange: setQuery, placeholder: "Search invoices" },
      quickFilters: [
        {
          id: "kind",
          label: "Type",
          options: KIND_OPTIONS,
          value: kinds,
          multiple: true,
          onChange: setKinds,
        },
      ],
      sort: { fields: SORT_FIELDS, value: sort, onChange: setSort },
      columns: {
        items: INVOICE_COLUMNS.map((c) => ({
          id: c.id,
          label: c.label,
          visible: !hidden.has(c.id),
          locked: c.locked,
        })),
        onChange: (items) =>
          setHidden(new Set(items.filter((c) => !c.visible && !c.locked).map((c) => c.id))),
      },
      resultCount: { value: rows.length, noun: rows.length === 1 ? "invoice" : "invoices" },
    }),
    [view, query, kinds, sort, hidden, rows.length],
  );

  const overflowActions = [
    { label: "Import invoices", icon: Upload },
    { label: "Export as CSV", icon: Download },
    { label: "Invoice settings", icon: Settings },
  ];

  if (layoutsPlace) {
    return <InvoiceLayoutsPage />;
  }

  if (open) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <InvoiceBuilder
          invoice={open}
          onBack={() => setOpenId(null)}
        /*
          The lit cut, not the whole collection — so the crumb's menu offers
          the records the list is actually showing.
        */
          siblings={rows.map((i) => ({ id: i.id, name: i.name }))}
          onOpenSibling={setOpenId}
        />
      </div>
    );
  }

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      {shape.scopeInTrail && !toolbar.shared ? null : (
        <PageHeader
          title={SCREEN_NAMES.invoices}
          count={shape.mergedRow && !toolbar.shared ? undefined : activeView.count}
          description="Create and manage all invoices generated for your business"
          lead={
            !toolbar.shared && shape.mergedRow && (shape.showViews || shape.showFilters) ? (
              <>
                {shape.showViews ? (
                  <ScopePicker
                    label="Invoice views"
                    views={invoiceViews}
                    activeId={view}
                    onSelect={setView}
                    showCount={effective.pageHeader && effective.pageCount}
                  />
                ) : null}
                {shape.showFilters ? controls : null}
              </>
            ) : undefined
          }
          secondary={[{ label: "Settings", icon: Settings }]}
          primary={{ label: "New", icon: Plus }}
          overflow={overflowActions}
        />
      )}

      {/*
        The summary strip, above the cuts rather than inside them.

        It reports the whole account, not the lit view — 109 drafts and 58
        overdue are true whichever tab is on — so it sits above the tab strip
        where the scope it describes is unambiguous. Putting it under the tabs
        would have made four totals that never change look broken every time
        someone switched cut.
      */}
      <div className="flex shrink-0 items-stretch gap-[12px]">
        {invoiceTiles.map((t) => (
          <SummaryTile key={t.id} tile={t} />
        ))}
      </div>

      {!toolbar.shared && shape.scopeInTabs ? (
        <ViewBar
          label="Invoice views"
          views={invoiceViews}
          activeId={view}
          onSelect={setView}
          maxVisible={4}
          className={shape.oneRow ? "h-[46px]" : undefined}
          trailing={
            shape.oneRow ? (
              <span className="flex shrink-0 items-center gap-[8px]">
                {glyphControls}
              </span>
            ) : undefined
          }
        />
      ) : null}

      {!toolbar.shared && ((!shape.mergedRow && shape.filterRow) || shape.scopeInTrail) ? (
        <div className="flex shrink-0 items-center gap-[10px]">
          {shape.showFilters ? (
            controls
          ) : (
            <span aria-hidden="true" className="min-w-[16px] flex-1" />
          )}
          {shape.scopeInTrail ? (
            <>
              <OutlineButton>
                <Settings size={15} aria-hidden="true" className="text-pg-text-strong" />
                Settings
              </OutlineButton>
              <PrimaryButton>
                <Plus size={16} aria-hidden="true" />
                New
              </PrimaryButton>
              <OverflowMenu items={overflowActions} />
            </>
          ) : null}
        </div>
      ) : null}

      {(() => {
        const table = (
      <TableCard pager={pager}>
        <div
          style={{ gridTemplateColumns: cols }}
          className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
        >
          {[
            ...INVOICE_COLUMNS.filter((c) => !hidden.has(c.id)).map((c) => c.label),
            "",
          ].map((h, i) => (
            <span
              key={h || `col-${i}`}
              className={cn(
                "text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted",
                h === "Amount" && "text-right",
              )}
            >
              {h}
            </span>
          ))}
        </div>

        {pager.pageRows.map((inv) => (
          <InvoiceRow
            key={inv.id}
            invoice={inv}
            cols={cols}
            hidden={hidden}
            onOpen={() => setOpenId(inv.id)}
          />
        ))}

        {rows.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-[4px]">
            <p className="text-[13.5px] leading-[normal] font-medium text-pg-text">
              {query.trim() || kinds.length > 0
                ? "No invoices match"
                : `Nothing in ${activeView.label.toLowerCase()}`}
            </p>
            <p className="text-[12.5px] leading-[normal] text-pg-faint">
              {query.trim() || kinds.length > 0
                ? "Try a different search or clear the filters."
                : "Invoices land here as soon as one reaches this state."}
            </p>
          </div>
        ) : null}
      </TableCard>
        );
        return toolbar.shared ? (
          <ListToolbar model={toolbarModel}>
            <div className="flex min-h-0 flex-1 flex-col">{table}</div>
          </ListToolbar>
        ) : (
          table
        );
      })()}

    </div>
  );
}

/**
 * One row, as a button.
 *
 * The kebab is a real control inside it, so it is a sibling of the row's
 * content and stops the click from reaching the row — a nested <button> is
 * invalid HTML and a kebab that also opened the invoice would be the most
 * annoying bug on the page. The row is therefore a grid whose last cell is
 * the menu, and the row's own hit area is the six cells before it.
 */
function InvoiceRow({
  invoice,
  cols,
  hidden,
  onOpen,
}: {
  invoice: Invoice;
  cols: string;
  hidden: ReadonlySet<string>;
  onOpen: () => void;
}) {
  const Kind = KIND_ICON[invoice.kind];
  return (
    <div
      style={{ gridTemplateColumns: cols }}
      className="group grid h-[52px] w-full items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0 hover:bg-pg-bg"
    >
      <button
        type="button"
        onClick={onOpen}
        className="motion-tap flex min-w-0 items-center gap-[10px] text-left"
      >
        {/*
          The kind glyph in a tile, not bare. A bare icon at 15px beside 13px
          text reads as punctuation; the tile gives it a box the eye can find
          when it is scanning for the one Text2Pay row in a screen of invoices.
        */}
        <span
          title={KIND_LABEL[invoice.kind]}
          className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-pg-bg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          <Kind size={15} aria-hidden="true" />
        </span>
        <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">
          {invoice.name}
        </span>
      </button>

      {hidden.has("number") ? null : (
      <span className="truncate text-[13px] leading-[normal] text-pg-text tabular-nums">
        {invoice.number}
      </span>
      )}

      {hidden.has("customer") ? null : (
      <span className="flex min-w-0 items-center gap-[8px]">
        <ToneAvatar name={invoice.customer} tone={invoice.tone} size={26} round />
        <span className="truncate text-[13px] leading-[normal] text-pg-text">
          {invoice.customer}
        </span>
      </span>
      )}

      {hidden.has("issued") ? null : (
      <span className="truncate text-[13px] leading-[normal] text-pg-text">
        {invoice.issued}
      </span>
      )}

      {hidden.has("amount") ? null : (
      <span className="flex items-center justify-end gap-[5px] text-[13px] leading-[normal] text-pg-text tabular-nums">
        {invoice.amount}
        {invoice.amountNote ? (
          <Info
            size={13}
            aria-label="This total differs from the amount billed"
            className="shrink-0 text-pg-faint"
          />
        ) : null}
      </span>
      )}

      {hidden.has("status") ? null : <StatusPill status={invoice.status} />}

      <OverflowMenu
        items={[
          { label: "Send reminder", icon: Send },
          { label: "Download PDF", icon: Download },
          { label: "Duplicate", icon: Copy },
          { label: "Delete invoice", icon: Trash2, danger: true },
        ]}
      />
    </div>
  );
}
