"use client";

import * as React from "react";
import {
  ArrowRight,
  CircleDollarSign,
  Copy,
  Download,
  Eye,
  FileText,
  ImageIcon,
  Images,
  Pencil,
  Search,
  Sparkles,
  TextCursorInput,
  Trash2,
  Type,
} from "lucide-react";
import { PageHeader, PrimaryButton, usePageChrome } from "@/components/page/page-header";
import { ViewBar } from "@/components/page/view-bar";
import { useListShape } from "@/components/page/list-shape";
import {
  ListToolbar,
  useListToolbar,
  type ListToolbarModel,
} from "@/components/page/list-toolbar";
import { Select } from "@/components/page/form-controls";
import { TableCard, usePagination } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  CONTENT_TYPES,
  IMAGE_TYPES,
  PRICE_PER_1K_WORDS,
  PRICE_PER_IMAGE,
  RANGES,
  TYPE_DESTINATION,
  TYPE_LABEL,
  daysAgo,
  fmt,
  formatDate,
  formatTime,
  imageRows as IMAGE_SEED,
  money,
  nowStamp,
  randomTxn,
  rowWords,
  sortKey,
  textRows as TEXT_SEED,
  type ContentTab,
  type ImageRow,
  type RangeId,
  type TextRow,
} from "./content-ai-data";
import { RowMenu, Segmented, StatCard, Thumb } from "./content-ai-ui";
import {
  DeleteModal,
  ImageModal,
  ImagesModal,
  TextModal,
  VariationsModal,
} from "./content-ai-modals";

/**
 * AI ▸ Content AI — the history of everything the account's AI has written
 * or drawn, and what it cost.
 *
 * Two tabs, as on the live screen: Text and Image. Each is three usage tiles
 * over one table, and the table is cut by where the content was used (the
 * segmented "All · Social planner · Blog · …" group). The date range is the
 * one control the live screen lacks: the tiles read "0" there because they
 * have no window to count over, and a usage number without a period is not
 * a number anyone can act on.
 */

const TABS = [
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
];

const TEXT_COLUMNS = [
  { id: "content", label: "Content", width: "minmax(220px,2.6fr)", locked: true },
  { id: "date", label: "Date", width: "minmax(120px,1fr)" },
  { id: "variations", label: "Variation count", width: "minmax(110px,0.9fr)" },
  { id: "txn", label: "Transaction ID", width: "minmax(200px,1.3fr)" },
  { id: "words", label: "Total words count", width: "minmax(110px,0.9fr)" },
  { id: "type", label: "Type", width: "minmax(100px,0.8fr)" },
] as const;

const IMAGE_COLUMNS = [
  { id: "content", label: "Prompt", width: "minmax(240px,2.6fr)", locked: true },
  { id: "date", label: "Date", width: "minmax(120px,1fr)" },
  { id: "variations", label: "Image count", width: "minmax(100px,0.8fr)" },
  { id: "txn", label: "Transaction ID", width: "minmax(200px,1.3fr)" },
  { id: "words", label: "Size", width: "minmax(100px,0.9fr)" },
  { id: "type", label: "Type", width: "minmax(100px,0.8fr)" },
] as const;

type ColumnId = (typeof TEXT_COLUMNS)[number]["id"];
type Sort = { field: string; dir: "asc" | "desc" } | null;

const ACTION_COL = "132px";

const SORT_OPTIONS: Record<ContentTab, { value: string; label: string }[]> = {
  text: [
    { value: "date:desc", label: "Newest first" },
    { value: "date:asc", label: "Oldest first" },
    { value: "size:desc", label: "Most words" },
    { value: "size:asc", label: "Fewest words" },
  ],
  image: [
    { value: "date:desc", label: "Newest first" },
    { value: "date:asc", label: "Oldest first" },
    { value: "size:desc", label: "Most images" },
    { value: "size:asc", label: "Fewest images" },
  ],
};

function inRange(at: string, range: RangeId) {
  const r = RANGES.find((x) => x.value === range)!;
  return r.days === null || daysAgo(at) < r.days;
}

/** Days the range spans, for the per-day tile. "All time" counts from the oldest row. */
function spanDays(range: RangeId, ats: string[]) {
  const r = RANGES.find((x) => x.value === range)!;
  if (r.days !== null) return r.days;
  return ats.length ? Math.max(...ats.map(daysAgo)) + 1 : 1;
}

/** Seven buckets across the range, oldest first, for the tiles' sparklines. */
function trend<T extends { at: string }>(rows: T[], days: number, value: (r: T) => number) {
  const buckets = Array.from({ length: 7 }, () => 0);
  for (const r of rows) {
    const i = Math.min(6, Math.floor((daysAgo(r.at) / days) * 7));
    buckets[6 - i]! += value(r);
  }
  return buckets;
}

function perDay(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 1 : 0 });
}

function downloadCsv(name: string, header: string[], lines: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [header, ...lines].map((l) => l.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

type Dialog =
  | { kind: "generate" }
  | { kind: "edit-text"; row: TextRow }
  | { kind: "edit-image"; row: ImageRow }
  | { kind: "view-text"; row: TextRow }
  | { kind: "view-image"; row: ImageRow }
  | { kind: "delete-text"; row: TextRow }
  | { kind: "delete-image"; row: ImageRow }
  | null;

export function ContentAiPage({
  initialTab,
}: {
  initialTab?: "text" | "image" | null;
}) {
  const { effective } = useTheme();
  const chrome = usePageChrome();
  const { showViews, showFilters } = useListShape();
  const { shared } = useListToolbar();

  const [tab, setTabState] = React.useState<ContentTab>(initialTab ?? "text");
  /*
   * The nav's Text / Image rows land here with a new initialTab while the page
   * stays mounted, so the seed is re-read when it changes — during render,
   * the way usePagination pulls its page back, rather than in an effect.
   */
  const [seed, setSeed] = React.useState(initialTab);
  if (seed !== initialTab) {
    setSeed(initialTab);
    if (initialTab) setTabState(initialTab);
  }

  const [texts, setTexts] = React.useState<TextRow[]>(TEXT_SEED);
  const [images, setImages] = React.useState<ImageRow[]>(IMAGE_SEED);
  const [range, setRange] = React.useState<RangeId>("30");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<Sort>(null);
  const [hidden, setHidden] = React.useState<ReadonlySet<ColumnId>>(() => new Set());
  const [dialog, setDialog] = React.useState<Dialog>(null);

  const setTab = (id: string) => {
    const next = id as ContentTab;
    setTabState(next);
    // Images are not generated in Conversations, so that cut has no meaning there.
    if (next === "image" && typeFilter === "conversation") setTypeFilter("all");
  };

  /* ------------------------------------------------------------- filtering */

  const q = query.trim().toLowerCase();
  const typeOk = (t: string) => typeFilter === "all" || t === typeFilter;

  const textInRange = React.useMemo(
    () => texts.filter((r) => inRange(r.at, range)),
    [texts, range],
  );
  const imageInRange = React.useMemo(
    () => images.filter((r) => inRange(r.at, range)),
    [images, range],
  );

  const textList = React.useMemo(() => {
    const hits = textInRange.filter(
      (r) =>
        typeOk(r.type) &&
        (!q ||
          r.variations.some((v) => v.toLowerCase().includes(q)) ||
          r.txn.includes(q)),
    );
    return sortRows(hits, sort, rowWords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInRange, typeFilter, q, sort]);

  const imageList = React.useMemo(() => {
    const hits = imageInRange.filter(
      (r) =>
        typeOk(r.type) &&
        (!q || r.prompt.toLowerCase().includes(q) || r.txn.includes(q)),
    );
    return sortRows(hits, sort, (r) => r.images.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageInRange, typeFilter, q, sort]);

  const filtered = typeFilter !== "all" || !!q;
  const clearFilters = () => {
    setTypeFilter("all");
    setQuery("");
  };

  /* ----------------------------------------------------------------- tiles */

  const rangeLabel = RANGES.find((r) => r.value === range)!.label;
  const tiles = React.useMemo(() => {
    if (tab === "text") {
      const days = spanDays(range, textInRange.map((r) => r.at));
      const words = textInRange.reduce((n, r) => n + rowWords(r), 0);
      const t = trend(textInRange, days, rowWords);
      return [
        { icon: Type, label: "Total words generated", value: fmt(words), hint: rangeLabel, trend: t },
        {
          icon: CircleDollarSign,
          label: "Cost",
          value: money((words / 1000) * PRICE_PER_1K_WORDS),
          hint: `${money(PRICE_PER_1K_WORDS)} per 1,000 words`,
          trend: t,
        },
        {
          icon: TextCursorInput,
          label: "Words/day",
          value: perDay(words / days),
          hint: `Across ${fmt(days)} days`,
          trend: t,
        },
      ];
    }
    const days = spanDays(range, imageInRange.map((r) => r.at));
    const count = imageInRange.reduce((n, r) => n + r.images.length, 0);
    const t = trend(imageInRange, days, (r) => r.images.length);
    return [
      { icon: Images, label: "Total images generated", value: fmt(count), hint: rangeLabel, trend: t },
      {
        icon: CircleDollarSign,
        label: "Cost",
        value: money(count * PRICE_PER_IMAGE),
        hint: `${money(PRICE_PER_IMAGE)} per image`,
        trend: t,
      },
      {
        icon: ImageIcon,
        label: "Images/day",
        value: perDay(count / days),
        hint: `Across ${fmt(days)} days`,
        trend: t,
      },
    ];
  }, [tab, range, rangeLabel, textInRange, imageInRange]);

  /* --------------------------------------------------------------- actions */

  const openGenerate = () => setDialog({ kind: "generate" });
  const generateLabel = tab === "text" ? "Generate text" : "Generate image";

  const goTo = (type: keyof typeof TYPE_DESTINATION) =>
    showToast(`Opening in ${TYPE_DESTINATION[type]}`);

  const duplicateText = (r: TextRow) => {
    setTexts((xs) => [{ ...r, id: `txt-${Date.now()}`, at: nowStamp(), txn: randomTxn() }, ...xs]);
    showToast("Content duplicated");
  };
  const duplicateImage = (r: ImageRow) => {
    setImages((xs) => [{ ...r, id: `img-${Date.now()}`, at: nowStamp(), txn: randomTxn() }, ...xs]);
    showToast("Image set duplicated");
  };

  const exportCsv = () => {
    if (tab === "text") {
      downloadCsv(
        "content-ai-text.csv",
        ["Content", "Date", "Time", "Variations", "Transaction ID", "Words", "Type"],
        textList.map((r) => [
          r.variations[0] ?? "",
          formatDate(r.at),
          formatTime(r.at),
          r.variations.length,
          r.txn,
          rowWords(r),
          TYPE_LABEL[r.type],
        ]),
      );
      showToast(`Exported ${fmt(textList.length)} rows`);
    } else {
      downloadCsv(
        "content-ai-images.csv",
        ["Prompt", "Date", "Time", "Images", "Transaction ID", "Size", "Type"],
        imageList.map((r) => [
          r.prompt,
          formatDate(r.at),
          formatTime(r.at),
          r.images.length,
          r.txn,
          r.resolution,
          TYPE_LABEL[r.type],
        ]),
      );
      showToast(`Exported ${fmt(imageList.length)} rows`);
    }
  };

  /* --------------------------------------------------------------- toolbar */

  const columnsDef = tab === "text" ? TEXT_COLUMNS : IMAGE_COLUMNS;
  const typeOptions = (tab === "text" ? CONTENT_TYPES : IMAGE_TYPES).map((t) => ({
    value: t.value as string,
    label: t.label as string,
  }));
  const resultCount = tab === "text" ? textList.length : imageList.length;

  const toolbarModel = React.useMemo<ListToolbarModel>(
    () => ({
      views: { items: TABS, activeId: tab, onSelect: setTab, noun: "view" },
      search: {
        value: query,
        onChange: setQuery,
        placeholder: tab === "text" ? "Search content or transaction ID" : "Search prompts or transaction ID",
      },
      quickFilters: [
        {
          id: "type",
          label: "Type",
          options: typeOptions,
          value: typeFilter === "all" ? [] : [typeFilter],
          onChange: (v) => setTypeFilter(v[0] ?? "all"),
        },
        {
          id: "range",
          label: "Date range",
          options: RANGES.map((r) => ({ value: r.value, label: r.label })),
          value: [range],
          onChange: (v) => setRange((v[0] as RangeId | undefined) ?? "all"),
        },
      ],
      sort: {
        fields: [
          { value: "date", label: "Date" },
          { value: "size", label: tab === "text" ? "Total words" : "Image count" },
        ],
        value: sort,
        onChange: setSort,
      },
      columns: {
        items: columnsDef.map((c) => ({
          id: c.id,
          label: c.label,
          visible: !hidden.has(c.id),
          locked: "locked" in c ? c.locked : undefined,
        })),
        onChange: (items) =>
          setHidden(
            new Set(items.filter((i) => !i.visible && !i.locked).map((i) => i.id as ColumnId)),
          ),
      },
      resultCount: { value: resultCount, noun: tab === "text" ? "generations" : "image sets" },
      trailing: chrome.header ? undefined : (
        <PrimaryButton onClick={openGenerate}>
          <Sparkles size={15} aria-hidden="true" />
          {generateLabel}
        </PrimaryButton>
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, query, typeFilter, range, sort, hidden, resultCount, chrome.header],
  );

  const sortValue = sort ? `${sort.field}:${sort.dir}` : "date:desc";
  const setSortValue = (v: string) => {
    const [field, dir] = v.split(":") as [string, "asc" | "desc"];
    setSort(field === "date" && dir === "desc" ? null : { field, dir });
  };

  const rangeSelect = (
    <Select
      aria-label="Date range"
      value={range}
      options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
      onChange={(v) => setRange(v as RangeId)}
      className="w-[156px] shrink-0"
    />
  );

  const generateFallback = chrome.header ? null : (
    <PrimaryButton className="h-[36px] text-[14px]" onClick={openGenerate}>
      <Sparkles size={16} aria-hidden="true" />
      {generateLabel}
    </PrimaryButton>
  );

  const viewBarShown = !shared && showViews;

  /* ------------------------------------------------------------------ body */

  const body = (
    <div className="flex min-h-0 flex-1 flex-col gap-[16px] pb-[16px]">
      <div className="grid shrink-0 grid-cols-1 gap-[16px] sm:grid-cols-3">
        {tiles.map((t, i) => (
          <StatCard key={t.label} {...t} colourIndex={i === 1 ? 1 : 0} />
        ))}
      </div>

      <TableCardShell>
        {shared || !showFilters ? null : (
          <div className="flex shrink-0 flex-wrap items-center gap-[12px] border-b border-pg-head-border p-[16px]">
            <Segmented
              label="Filter by type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[{ value: "all", label: "All" }, ...typeOptions]}
            />
            <span aria-hidden="true" className="min-w-0 flex-1" />
            <label className="flex h-[36px] w-[260px] max-w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "text" ? "Search content or ID" : "Search prompts or ID"}
                aria-label={tab === "text" ? "Search content or transaction ID" : "Search prompts or transaction ID"}
                className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </label>
            <Select
              aria-label="Sort"
              value={sortValue}
              options={SORT_OPTIONS[tab]}
              onChange={setSortValue}
              className="w-[156px] shrink-0"
            />
            {viewBarShown ? null : rangeSelect}
          </div>
        )}

        {tab === "text" ? (
          <TextTable
            rows={textList}
            hidden={hidden}
            empty={texts.length === 0}
            filtered={filtered}
            onClear={clearFilters}
            onGenerate={openGenerate}
            onView={(row) => setDialog({ kind: "view-text", row })}
            onEdit={(row) => setDialog({ kind: "edit-text", row })}
            onDuplicate={duplicateText}
            onDelete={(row) => setDialog({ kind: "delete-text", row })}
            onGoTo={(r) => goTo(r.type)}
          />
        ) : (
          <ImageTable
            rows={imageList}
            hidden={hidden}
            empty={images.length === 0}
            filtered={filtered}
            onClear={clearFilters}
            onGenerate={openGenerate}
            onView={(row) => setDialog({ kind: "view-image", row })}
            onEdit={(row) => setDialog({ kind: "edit-image", row })}
            onDuplicate={duplicateImage}
            onDelete={(row) => setDialog({ kind: "delete-image", row })}
            onGoTo={(r) => goTo(r.type)}
          />
        )}
      </TableCardShell>
    </div>
  );

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Content AI"
        description="Manage your AI-generated content"
        secondary={[{ label: "Export", icon: Download, onClick: exportCsv }]}
        primary={{ label: generateLabel, icon: Sparkles, onClick: openGenerate }}
      />

      {viewBarShown ? (
        <ViewBar
          label="Content AI views"
          views={TABS.map((t) => ({ ...t, icon: t.id === "text" ? FileText : ImageIcon }))}
          activeId={tab}
          onSelect={setTab}
          trailing={
            <span className="flex shrink-0 items-center gap-[8px]">
              {rangeSelect}
              {generateFallback}
            </span>
          }
        />
      ) : null}

      {shared ? (
        <ListToolbar model={toolbarModel}>
          <div className="flex min-h-0 flex-1 flex-col">{body}</div>
        </ListToolbar>
      ) : (
        body
      )}

      {dialog?.kind === "generate" ? (
        tab === "text" ? (
          <TextModal
            onClose={() => setDialog(null)}
            onSave={(row) => {
              setTexts((xs) => [row, ...xs]);
              setDialog({ kind: "view-text", row });
            }}
          />
        ) : (
          <ImageModal
            onClose={() => setDialog(null)}
            onSave={(row) => {
              setImages((xs) => [row, ...xs]);
              setDialog({ kind: "view-image", row });
            }}
          />
        )
      ) : null}
      {dialog?.kind === "edit-text" ? (
        <TextModal
          row={dialog.row}
          onClose={() => setDialog(null)}
          onSave={(row) => {
            setTexts((xs) => xs.map((x) => (x.id === row.id ? row : x)));
            setDialog(null);
          }}
        />
      ) : null}
      {dialog?.kind === "edit-image" ? (
        <ImageModal
          row={dialog.row}
          onClose={() => setDialog(null)}
          onSave={(row) => {
            setImages((xs) => xs.map((x) => (x.id === row.id ? row : x)));
            setDialog(null);
          }}
        />
      ) : null}
      {dialog?.kind === "view-text" ? (
        <VariationsModal row={dialog.row} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "view-image" ? (
        <ImagesModal row={dialog.row} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "delete-text" ? (
        <DeleteModal
          what="content"
          detail={truncate(dialog.row.variations[0] ?? "", 80)}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            const id = dialog.row.id;
            setTexts((xs) => xs.filter((x) => x.id !== id));
            setDialog(null);
            showToast("Content deleted");
          }}
        />
      ) : null}
      {dialog?.kind === "delete-image" ? (
        <DeleteModal
          what="image set"
          detail={truncate(dialog.row.prompt, 80)}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            const id = dialog.row.id;
            setImages((xs) => xs.filter((x) => x.id !== id));
            setDialog(null);
            showToast("Image set deleted");
          }}
        />
      ) : null}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

function sortRows<T extends { at: string }>(rows: T[], sort: Sort, size: (r: T) => number) {
  const out = [...rows];
  const dir = sort?.dir === "asc" ? 1 : -1;
  if (sort?.field === "size") {
    out.sort((a, b) => (size(a) - size(b)) * dir || sortKey(b.at) - sortKey(a.at));
  } else {
    out.sort((a, b) => (sortKey(a.at) - sortKey(b.at)) * (sort ? dir : -1));
  }
  return out;
}

/**
 * The outer card: filter band on top, then the table card. The table card is
 * flattened into it (no second ring, no radius) so the two read as one
 * surface, as on the live screen.
 */
function TableCardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.05)]">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ tables */

interface TableProps<T> {
  rows: T[];
  hidden: ReadonlySet<ColumnId>;
  empty: boolean;
  filtered: boolean;
  onClear: () => void;
  onGenerate: () => void;
  onView: (r: T) => void;
  onEdit: (r: T) => void;
  onDuplicate: (r: T) => void;
  onDelete: (r: T) => void;
  onGoTo: (r: T) => void;
}

function HeaderRow({
  columns,
  hidden,
  cols,
}: {
  columns: readonly { id: ColumnId; label: string }[];
  hidden: ReadonlySet<ColumnId>;
  cols: string;
}) {
  return (
    <div
      role="row"
      style={{ gridTemplateColumns: cols }}
      className="sticky top-0 z-10 grid h-[44px] items-center gap-[16px] border-b border-pg-head-border bg-pg px-[16px]"
    >
      {columns
        .filter((c) => !hidden.has(c.id))
        .map((c) => (
          <span
            key={c.id}
            role="columnheader"
            className="truncate text-[13px] leading-[18px] font-medium text-pg-muted"
          >
            {c.label}
          </span>
        ))}
      <span role="columnheader" className="text-[13px] leading-[18px] font-medium text-pg-muted">
        Action
      </span>
    </div>
  );
}

function gridOf(columns: readonly { id: ColumnId; width: string }[], hidden: ReadonlySet<ColumnId>) {
  return `${columns
    .filter((c) => !hidden.has(c.id))
    .map((c) => c.width)
    .join(" ")} ${ACTION_COL}`;
}

const ROW =
  "group grid items-center gap-[16px] border-b border-pg-row-border px-[16px] py-[12px] last:border-b-0 hover:bg-pg";

function DateCell({ at }: { at: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-[14px] leading-[20px] text-pg-text-strong">{formatDate(at)}</span>
      <span className="text-[13px] leading-[18px] text-pg-faint">{formatTime(at)} (IST)</span>
    </span>
  );
}

function CountPill({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <span>
      <button
        type="button"
        onClick={onClick}
        className="motion-tap inline-flex h-[24px] items-center rounded-full bg-pg-surface px-[10px] text-[12px] leading-none font-medium whitespace-nowrap text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
      >
        {children}
      </button>
    </span>
  );
}

function ActionCell<T>({
  row,
  label,
  props,
}: {
  row: T;
  label: string;
  props: TableProps<T>;
}) {
  return (
    <span className="flex items-center justify-between gap-[4px]">
      <button
        type="button"
        onClick={() => props.onGoTo(row)}
        className="motion-tap group/go flex items-center gap-[4px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-brand hover:underline"
      >
        Go to
        <ArrowRight
          size={15}
          aria-hidden="true"
          className="transition-transform group-hover/go:translate-x-[2px]"
        />
      </button>
      <RowMenu
        label={`Actions for ${label}`}
        items={[
          { label: "View", icon: Eye, onSelect: () => props.onView(row) },
          { label: "Edit", icon: Pencil, onSelect: () => props.onEdit(row) },
          { label: "Duplicate", icon: Copy, onSelect: () => props.onDuplicate(row) },
          { label: "Delete", icon: Trash2, danger: true, onSelect: () => props.onDelete(row) },
        ]}
      />
    </span>
  );
}

function Txn({ id }: { id: string }) {
  return (
    <button
      type="button"
      title="Copy transaction ID"
      onClick={() => {
        void navigator.clipboard?.writeText(id).catch(() => undefined);
        showToast("Transaction ID copied");
      }}
      className="motion-tap truncate text-left font-mono text-[13px] leading-[20px] text-pg-text hover:text-brand"
    >
      {id}
    </button>
  );
}

function TextTable(props: TableProps<TextRow>) {
  const { rows, hidden } = props;
  const pager = usePagination(rows);
  const cols = gridOf(TEXT_COLUMNS, hidden);
  const show = (id: ColumnId) => !hidden.has(id);

  return (
    <TableCard pager={pager} className="rounded-none shadow-none">
      <div role="table" aria-label="Generated text" className="min-w-[1080px]">
        <HeaderRow columns={TEXT_COLUMNS} hidden={hidden} cols={cols} />
        {rows.length === 0 ? (
          <EmptyRows {...props} noun="content" />
        ) : (
          pager.pageRows.map((r) => (
            <div key={r.id} role="row" style={{ gridTemplateColumns: cols }} className={ROW}>
              <button
                type="button"
                onClick={() => props.onView(r)}
                className="motion-tap line-clamp-2 min-w-0 text-left text-[14px] leading-[20px] text-pg-text-strong hover:text-pg-heading"
              >
                {r.variations[0]}
              </button>
              {show("date") ? <DateCell at={r.at} /> : null}
              {show("variations") ? (
                <CountPill onClick={() => props.onView(r)}>
                  {r.variations.length} {r.variations.length === 1 ? "variation" : "variations"}
                </CountPill>
              ) : null}
              {show("txn") ? <Txn id={r.txn} /> : null}
              {show("words") ? (
                <span className="text-[14px] leading-[20px] text-pg-text tabular-nums">
                  {fmt(rowWords(r))} words
                </span>
              ) : null}
              {show("type") ? (
                <span className="truncate text-[14px] leading-[20px] text-pg-text">
                  {TYPE_LABEL[r.type]}
                </span>
              ) : null}
              <ActionCell row={r} label={truncate(r.variations[0] ?? "", 40)} props={props} />
            </div>
          ))
        )}
      </div>
    </TableCard>
  );
}

function ImageTable(props: TableProps<ImageRow>) {
  const { rows, hidden } = props;
  const pager = usePagination(rows);
  const cols = gridOf(IMAGE_COLUMNS, hidden);
  const show = (id: ColumnId) => !hidden.has(id);

  return (
    <TableCard pager={pager} className="rounded-none shadow-none">
      <div role="table" aria-label="Generated images" className="min-w-[1080px]">
        <HeaderRow columns={IMAGE_COLUMNS} hidden={hidden} cols={cols} />
        {rows.length === 0 ? (
          <EmptyRows {...props} noun="images" />
        ) : (
          pager.pageRows.map((r) => (
            <div key={r.id} role="row" style={{ gridTemplateColumns: cols }} className={ROW}>
              <button
                type="button"
                onClick={() => props.onView(r)}
                className="motion-tap flex min-w-0 items-center gap-[12px] text-left"
              >
                <span className="flex shrink-0">
                  {r.images.slice(0, 3).map((h, i) => (
                    <Thumb
                      key={i}
                      hue={h}
                      size={36}
                      className={cn("ring-2 ring-pg-surface", i > 0 && "-ml-[14px]")}
                    />
                  ))}
                </span>
                <span className="line-clamp-2 min-w-0 text-[14px] leading-[20px] text-pg-text-strong hover:text-pg-heading">
                  {r.prompt}
                </span>
              </button>
              {show("date") ? <DateCell at={r.at} /> : null}
              {show("variations") ? (
                <CountPill onClick={() => props.onView(r)}>
                  {r.images.length} {r.images.length === 1 ? "image" : "images"}
                </CountPill>
              ) : null}
              {show("txn") ? <Txn id={r.txn} /> : null}
              {show("words") ? (
                <span className="text-[14px] leading-[20px] whitespace-nowrap text-pg-text">
                  {r.resolution}
                </span>
              ) : null}
              {show("type") ? (
                <span className="truncate text-[14px] leading-[20px] text-pg-text">
                  {TYPE_LABEL[r.type]}
                </span>
              ) : null}
              <ActionCell row={r} label={truncate(r.prompt, 40)} props={props} />
            </div>
          ))
        )}
      </div>
    </TableCard>
  );
}

function EmptyRows({
  empty,
  filtered,
  onClear,
  onGenerate,
  noun,
}: {
  empty: boolean;
  filtered: boolean;
  onClear: () => void;
  onGenerate: () => void;
  noun: string;
}) {
  const nothingYet = empty || !filtered;
  return (
    <div className="flex flex-col items-center justify-center gap-[12px] px-[16px] py-[48px] text-center">
      <span
        aria-hidden="true"
        className="flex size-[48px] items-center justify-center rounded-full bg-brand-soft text-brand"
      >
        {nothingYet ? <Sparkles size={22} /> : <Search size={22} />}
      </span>
      <div className="flex flex-col gap-[4px]">
        <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          {nothingYet ? `No ${noun} in this period` : "No results"}
        </h3>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          {nothingYet
            ? "Generate something new, or pick a longer date range."
            : "Try a different search or type."}
        </p>
      </div>
      {nothingYet ? (
        <PrimaryButton className="h-[36px] text-[14px]" onClick={onGenerate}>
          <Sparkles size={16} aria-hidden="true" />
          Generate {noun === "images" ? "image" : "text"}
        </PrimaryButton>
      ) : (
        <button
          type="button"
          onClick={onClear}
          className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] leading-[20px] font-medium text-brand hover:bg-brand-soft"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
