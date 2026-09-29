"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Folder,
  FolderInput,
  Pencil,
  Search,
  SearchX,
  Trash2,
} from "lucide-react";
import { Checkbox, TextInput } from "@/components/page/form-controls";
import { OutlineButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  fieldTypeLabel,
  folderById,
  formatCreated,
  fullKey,
  useCustomFields,
  type CustomField,
  type FieldType,
} from "./custom-fields-data";
import type { ObjectScope } from "./custom-fields-page";
import {
  COLUMNS,
  ColumnPicker,
  CreatedChip,
  DEFAULT_HIDDEN,
  FieldTypeChip,
  SourceChip,
  matchesCreated,
  type ColumnId,
  type CreatedFilter,
  type SourceFilter,
} from "./fields-filters";
import { DeleteFieldsModal, MoveFieldsModal } from "./fields-modals";

const PER_PAGE = [10, 20, 50, 100] as const;

/**
 * Proportional widths so long names and keys truncate instead of widening the
 * table. Field name is the one column with no width — it takes what is left —
 * so the others must never add up to the table's minimum, or it collapses to
 * nothing, which is exactly what fixed pixel widths did at laptop width.
 */
const WIDTH: Record<ColumnId, string> = {
  name: "",
  type: "w-[12%]",
  folder: "w-[16%]",
  key: "w-[18%]",
  created: "w-[17%]",
  description: "w-[16%]",
  actions: "w-[112px]",
};

const TH =
  "sticky top-0 z-[2] h-[44px] border-r border-b border-pg-head-border bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] font-medium whitespace-nowrap text-pg-heading last:border-r-0";
const TD = "h-[46px] border-b border-pg-row-border px-[12px] text-[14px] leading-[20px] text-pg-text";

type Pending = { kind: "move" | "delete"; fields: CustomField[]; bulk: boolean } | null;

/**
 * The Fields table: filter row, a table that scrolls under a sticky header,
 * and the pager.
 *
 * Every filter change clears the ticks and returns to page 1 in its own
 * handler, not an effect: a selection made under one filter would otherwise
 * carry rows the new filter hides into a bulk delete nobody can see.
 */
export function FieldsTab({ scope, onEditField }: { scope: ObjectScope; onEditField: (field: CustomField) => void }) {
  const { fields, folders } = useCustomFields();
  // Read once per mount — "This week" should not drift mid-session.
  const [now] = React.useState(() => new Date());

  const [types, setTypes] = React.useState<FieldType[]>([]);
  const [created, setCreated] = React.useState<CreatedFilter | null>(null);
  const [source, setSource] = React.useState<SourceFilter>("all");
  const [query, setQuery] = React.useState("");
  const [hidden, setHidden] = React.useState<ColumnId[]>(DEFAULT_HIDDEN);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState<number>(20);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [pending, setPending] = React.useState<Pending>(null);

  const refilter = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
    setSelected(new Set());
  };
  const onTypes = refilter(setTypes);
  const onCreated = refilter(setCreated);
  const onSource = refilter(setSource);
  const onQuery = refilter(setQuery);

  const filtersOn = types.length > 0 || created !== null || source !== "all" || query.trim() !== "";
  const clearFilters = () => {
    setTypes([]);
    setCreated(null);
    setSource("all");
    setQuery("");
    setPage(1);
    setSelected(new Set());
  };

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = fields.filter(
      (f) =>
        (scope === "all" || f.object === scope) &&
        (types.length === 0 || types.includes(f.type)) &&
        (source === "all" || f.source === source) &&
        matchesCreated(f, created, now) &&
        (!q || f.name.toLowerCase().includes(q) || fullKey(f).toLowerCase().includes(q)),
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return out.sort((a, b) => dir * a.createdAt.localeCompare(b.createdAt));
  }, [fields, scope, types, source, created, now, query, sortDir]);

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  // A delete can shorten the list under you; pull back during render, as
  // table-card's usePagination does, so no empty page is ever painted.
  if (page > pageCount) setPage(pageCount);
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * perPage, current * perPage);

  // Ticks are ids; reading them through the store drops any that were deleted.
  const selectedFields = fields.filter((f) => selected.has(f.id));
  const pageIds = pageRows.map((r) => r.id);
  const onPage = pageIds.filter((id) => selected.has(id)).length;

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      const all = pageIds.every((id) => next.has(id));
      pageIds.forEach((id) => (all ? next.delete(id) : next.add(id)));
      return next;
    });

  const show = (c: ColumnId) => !hidden.includes(c);
  const visibleCols = COLUMNS.filter((c) => show(c.id));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[12px]">
      <div className="flex shrink-0 flex-wrap items-center gap-[8px]">
        {selectedFields.length > 0 ? (
          <div className="flex h-[36px] items-center gap-[4px] rounded-[8px] bg-[color-mix(in_oklab,var(--brand)_8%,var(--pg-surface))] pr-[4px] pl-[12px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_22%,transparent)]">
            <span className="pr-[8px] text-[14px] leading-[20px] font-medium text-brand">
              {selectedFields.length.toLocaleString("en-US")} selected
            </span>
            <BulkButton onClick={() => setPending({ kind: "move", fields: selectedFields, bulk: true })}>
              <FolderInput size={15} aria-hidden="true" />
              Move to folder
            </BulkButton>
            <BulkButton danger onClick={() => setPending({ kind: "delete", fields: selectedFields, bulk: true })}>
              <Trash2 size={15} aria-hidden="true" />
              Delete
            </BulkButton>
            <BulkButton onClick={() => setSelected(new Set())}>Clear</BulkButton>
          </div>
        ) : (
          <>
            <FieldTypeChip value={types} onChange={onTypes} />
            <CreatedChip value={created} onChange={onCreated} />
            <SourceChip value={source} onChange={onSource} />
          </>
        )}
        <span className="flex-1" />
        <ColumnPicker hidden={hidden} onChange={setHidden} />
        <div className="relative w-[240px]">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[11px] -translate-y-1/2 text-pg-faint"
          />
          <TextInput
            aria-label="Search fields"
            placeholder="Search fields"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="pl-[32px]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-head-border)]">
        {total === 0 ? (
          <EmptyState filtered={filtersOn} onClear={clearFilters} />
        ) : (
          <table className="w-full min-w-[960px] table-fixed border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={cn(TH, "w-[48px] px-0")}>
                  <span className="flex justify-center">
                    <Checkbox
                      checked={onPage > 0 && onPage === pageIds.length}
                      mixed={onPage > 0 && onPage < pageIds.length}
                      onChange={togglePage}
                    />
                  </span>
                </th>
                {visibleCols.map((c) => (
                  <th
                    key={c.id}
                    className={cn(TH, WIDTH[c.id], c.id === "actions" && "text-center")}
                    aria-sort={c.id === "created" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {c.id === "created" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                          setPage(1);
                        }}
                        className="flex w-full items-center justify-between gap-[8px] motion-tap"
                      >
                        {c.label}
                        {sortDir === "desc" ? (
                          <ArrowDown size={15} aria-hidden="true" className="text-brand" />
                        ) : (
                          <ArrowUp size={15} aria-hidden="true" className="text-brand" />
                        )}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((f) => {
                const on = selected.has(f.id);
                const folder = folderById(folders, f.folderId);
                const key = fullKey(f);
                return (
                  <tr key={f.id} className={cn("group", on ? "bg-pg-row-selected" : "hover:bg-pg")}>
                    <td className={cn(TD, "px-0")}>
                      <span className="flex justify-center">
                        <Checkbox checked={on} onChange={(v) => toggle(f.id, v)} />
                      </span>
                    </td>
                    {show("name") ? (
                      <td className={TD}>
                        <span className="flex min-w-0 items-center gap-[6px]">
                          <span className="min-w-0 truncate font-medium text-pg-heading" title={f.name}>
                            {f.name}
                          </span>
                          <CopyButton text={f.name} what="Field name" />
                        </span>
                      </td>
                    ) : null}
                    {show("type") ? <td className={cn(TD, "truncate")}>{fieldTypeLabel(f.type)}</td> : null}
                    {show("folder") ? (
                      <td className={TD}>
                        {folder ? (
                          <span
                            title={folder.name}
                            className="inline-flex h-[26px] max-w-full items-center gap-[6px] rounded-[6px] bg-pg-surface px-[8px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
                          >
                            <Folder size={14} aria-hidden="true" className="shrink-0 text-pg-muted" />
                            <span className="min-w-0 truncate">{folder.name}</span>
                          </span>
                        ) : (
                          <span className="text-pg-faint">—</span>
                        )}
                      </td>
                    ) : null}
                    {show("key") ? (
                      <td className={TD}>
                        <span className="flex min-w-0 items-center gap-[6px]">
                          <span className="min-w-0 truncate font-mono text-[13px] leading-[18px] text-pg-text" title={key}>
                            {key}
                          </span>
                          <CopyButton text={key} what="Key" />
                        </span>
                      </td>
                    ) : null}
                    {show("created") ? (
                      <td className={cn(TD, "whitespace-nowrap tabular-nums")}>{formatCreated(f.createdAt)}</td>
                    ) : null}
                    {show("description") ? (
                      <td className={cn(TD, "truncate", !f.description && "text-pg-faint")} title={f.description || undefined}>
                        {f.description || "—"}
                      </td>
                    ) : null}
                    {show("actions") ? (
                      <td className={TD}>
                        <span className="flex items-center justify-center gap-[2px]">
                          <RowAction label={`Edit ${f.name}`} onClick={() => onEditField(f)}>
                            <Pencil size={15} aria-hidden="true" />
                          </RowAction>
                          <RowAction
                            label={`Move ${f.name} to folder`}
                            onClick={() => setPending({ kind: "move", fields: [f], bulk: false })}
                          >
                            <FolderInput size={15} aria-hidden="true" />
                          </RowAction>
                          <RowAction
                            label={`Delete ${f.name}`}
                            onClick={() => setPending({ kind: "delete", fields: [f], bulk: false })}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </RowAction>
                        </span>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 ? (
        <Pager
          page={current}
          pageCount={pageCount}
          perPage={perPage}
          total={total}
          onPage={setPage}
          onPerPage={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      ) : null}

      {pending?.kind === "move" ? (
        <MoveFieldsModal
          fields={pending.fields}
          onClose={() => setPending(null)}
          onDone={() => {
            if (pending.bulk) setSelected(new Set());
            setPending(null);
          }}
        />
      ) : null}
      {pending?.kind === "delete" ? (
        <DeleteFieldsModal
          fields={pending.fields}
          onClose={() => setPending(null)}
          onDone={() => {
            if (pending.bulk) setSelected(new Set());
            setPending(null);
          }}
        />
      ) : null}
    </div>
  );
}

function BulkButton({
  danger,
  onClick,
  children,
}: {
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[28px] items-center gap-[6px] rounded-[6px] px-[8px] text-[14px] leading-[20px] font-medium whitespace-nowrap motion-tap hover:bg-pg-surface",
        danger ? "text-pg-danger" : "text-pg-text",
      )}
    >
      {children}
    </button>
  );
}

function RowAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label.split(" ")[0]}
      onClick={onClick}
      className="flex size-[30px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-heading hover:shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {children}
    </button>
  );
}

/**
 * Shown on row hover and on keyboard focus, so the resting table stays as
 * quiet as the screenshot.
 */
function CopyButton({ text, what }: { text: string; what: string }) {
  return (
    <button
      type="button"
      aria-label={`Copy ${what.toLowerCase()}`}
      onClick={() => {
        // `navigator.clipboard` is absent on insecure origins; the toast still
        // confirms the intent rather than failing silently.
        navigator.clipboard?.writeText(text)?.catch(() => {});
        showToast(`${what} copied to clipboard`);
      }}
      className="flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted opacity-0 shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap group-hover:opacity-100 hover:text-pg-heading focus-visible:opacity-100"
    >
      <Copy size={13} aria-hidden="true" />
    </button>
  );
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-[12px] px-[16px] text-center">
      <span className="flex size-[44px] items-center justify-center rounded-full bg-pg text-pg-muted">
        <SearchX size={20} aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-[4px]">
        <p className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          {filtered ? "No fields match these filters" : "No fields yet"}
        </p>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          {filtered ? "Try a different search, or clear the filters to see every field." : "Create a field to start capturing data on this object."}
        </p>
      </div>
      {filtered ? (
        <OutlineButton className="h-[36px] text-[14px]" onClick={onClear}>
          Clear filters
        </OutlineButton>
      ) : null}
    </div>
  );
}

/**
 * 1 2 3 … 30: the neighbours of the current page, plus both ends, so the
 * row stays short however deep you page.
 */
function pageSlots(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(page - 1, pageCount - 2));
  const run = [start, start + 1, start + 2];
  const out: (number | "gap")[] = [];
  if (run[0] > 1) out.push(1);
  if (run[0] > 2) out.push("gap");
  out.push(...run);
  if (run[2] < pageCount - 1) out.push("gap");
  if (run[2] < pageCount) out.push(pageCount);
  return out;
}

const STEP =
  "flex h-[32px] items-center rounded-[6px] px-[10px] text-[13px] leading-[18px] font-medium motion-tap shadow-[inset_0_0_0_1px_var(--pg-border)]";

/**
 * "Fields per page 20 · 1 - 20 of 594 · Previous 1 2 3 … 30 Next".
 *
 * Its own rather than table-card's TablePager, which has no range readout
 * and puts the per-page control last; this row is the live product's order.
 */
function Pager({
  page,
  pageCount,
  perPage,
  total,
  onPage,
  onPerPage,
}: {
  page: number;
  pageCount: number;
  perPage: number;
  total: number;
  onPage: (n: number) => void;
  onPerPage: (n: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-[8px] text-[13px] leading-[18px] text-pg-text">
      <span>Fields per page</span>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Fields per page"
          onClick={() => setOpen((v) => !v)}
          className={cn(STEP, "gap-[6px] text-pg-text-strong", open && "shadow-[inset_0_0_0_1px_var(--brand)]")}
        >
          {perPage}
          <ChevronDown size={14} aria-hidden="true" className="text-pg-muted" />
        </button>
        {open ? (
          <>
            <button
              type="button"
              aria-label="Close options"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] cursor-default"
            />
            {/* Opens upward: the pager sits on the page's bottom edge. */}
            <div
              role="listbox"
              className="absolute bottom-[calc(100%+4px)] left-0 z-[61] w-[88px] rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
            >
              {PER_PAGE.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="option"
                  aria-selected={n === perPage}
                  onClick={() => {
                    onPerPage(n);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[6px] px-[8px] py-[6px] text-[14px] leading-[20px] motion-tap hover:bg-pg",
                    n === perPage ? "font-medium text-pg-heading" : "text-pg-text",
                  )}
                >
                  {n}
                  {n === perPage ? <Check size={14} aria-hidden="true" className="text-brand" /> : null}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <span className="px-[4px] tabular-nums">
        {fmt(from)} - {fmt(to)} of {fmt(total)}
      </span>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className={cn(STEP, page <= 1 ? "cursor-not-allowed text-pg-disabled" : "text-pg-text-strong hover:bg-pg")}
      >
        Previous
      </button>
      {pageSlots(page, pageCount).map((slot, i) =>
        slot === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="flex h-[32px] w-[24px] items-center justify-center text-pg-muted">
            …
          </span>
        ) : (
          <button
            key={slot}
            type="button"
            aria-current={slot === page ? "page" : undefined}
            onClick={() => onPage(slot)}
            className={cn(
              "flex h-[32px] min-w-[32px] items-center justify-center rounded-[6px] px-[6px] motion-tap tabular-nums",
              slot === page
                ? "font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                : "font-medium text-pg-text hover:bg-pg",
            )}
          >
            {slot}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
        className={cn(STEP, page >= pageCount ? "cursor-not-allowed text-pg-disabled" : "text-pg-text-strong hover:bg-pg")}
      >
        Next
      </button>
    </div>
  );
}
