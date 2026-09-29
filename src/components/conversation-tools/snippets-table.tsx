"use client";

import * as React from "react";
import {
  ChevronDown,
  CircleX,
  Copy,
  EllipsisVertical,
  Folder,
  FolderInput,
  ListFilter,
  Paperclip,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { Checkbox, TextInput } from "@/components/page/form-controls";
import { OutlineButton } from "@/components/page/page-header";
import { usePagination, type PagerState } from "@/components/page/table-card";
import { cn } from "@/lib/utils";
import {
  TYPE_LABEL,
  bodyPreview,
  formatUpdated,
  htmlToText,
  type Snippet,
  type SnippetFolder,
  type SnippetType,
} from "./snippets-data";
import { BTN, DangerOutlineButton, MenuItem, Popover, useAnchor } from "./snippets-ui";

const GRID =
  "48px minmax(200px,1.2fr) minmax(240px,1.8fr) minmax(140px,0.7fr) 120px 200px 48px";

/**
 * The snippets table — search, type filter, selection, row menu and pager.
 *
 * Used twice: on All snippets with every row, and inside a drilled-into
 * folder with that folder's rows. Selection is the page's, so the bulk bar's
 * modals can clear it once they've acted.
 */
export function SnippetsTable({
  rows,
  folders,
  selected,
  onSelect,
  leading,
  onMove,
  onDelete,
  onEdit,
  onDuplicate,
}: {
  rows: Snippet[];
  folders: SnippetFolder[];
  selected: Set<string>;
  onSelect: (next: Set<string>) => void;
  /** What the toolbar's left side shows when nothing is selected. */
  leading?: React.ReactNode;
  onMove: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onEdit: (s: Snippet) => void;
  onDuplicate: (s: Snippet) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [types, setTypes] = React.useState<Set<SnippetType>>(() => new Set());
  const filter = useAnchor();

  const folderName = React.useMemo(() => new Map(folders.map((f) => [f.id, f.name])), [folders]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((s) => {
      if (types.size > 0 && !types.has(s.type)) return false;
      if (!q) return true;
      const body = s.type === "email" ? htmlToText(s.body) : s.body;
      return s.name.toLowerCase().includes(q) || body.toLowerCase().includes(q);
    });
  }, [rows, query, types]);

  const pager = usePagination(visible, 20);

  // Selection only counts rows that still exist — a delete elsewhere drops them.
  const liveSelected = rows.filter((s) => selected.has(s.id));
  const count = liveSelected.length;
  const pageIds = pager.pageRows.map((s) => s.id);
  const pageOn = pageIds.filter((id) => selected.has(id)).length;
  const allVisibleOn = visible.length > 0 && visible.every((s) => selected.has(s.id));

  const setMany = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    onSelect(next);
  };

  const toggleType = (t: SnippetType) =>
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-[36px] shrink-0 flex-wrap items-center gap-[10px] pb-[12px]">
        {leading}
        {count > 0 ? (
          <div className="flex items-center gap-[12px]">
            <span className="text-[14px] leading-[20px] text-pg-text">
              {count.toLocaleString("en-US")} {count === 1 ? "row" : "rows"} selected
            </span>
            {!allVisibleOn ? (
              <button
                type="button"
                onClick={() => setMany(visible.map((s) => s.id), true)}
                className="text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
              >
                Select all ({visible.length.toLocaleString("en-US")})
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Clear selection"
              title="Clear selection"
              onClick={() => onSelect(new Set())}
              className="flex size-[24px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading"
            >
              <CircleX size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}
        <span className="flex-1" />
        {count > 0 ? (
          <>
            <OutlineButton className={BTN} onClick={() => onMove(liveSelected.map((s) => s.id))}>
              <FolderInput size={16} aria-hidden="true" />
              Move to folder
            </OutlineButton>
            <DangerOutlineButton onClick={() => onDelete(liveSelected.map((s) => s.id))}>
              <Trash2 size={16} aria-hidden="true" />
              Delete snippets
            </DangerOutlineButton>
          </>
        ) : null}
        <div className="relative w-[240px]">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[10px] -translate-y-1/2 text-pg-faint"
          />
          <TextInput
            aria-label="Search snippets"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-[32px]"
          />
        </div>
      </div>

      <div role="table" aria-label="Snippets" className="min-h-0 flex-1 overflow-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div
          role="row"
          style={{ gridTemplateColumns: GRID }}
          className="sticky top-0 z-10 grid h-[44px] min-w-fit items-stretch border-b border-pg-head-border bg-pg-surface"
        >
          <div role="columnheader" className="flex items-center justify-center">
            <Checkbox
              checked={pageIds.length > 0 && pageOn === pageIds.length}
              mixed={pageOn > 0 && pageOn < pageIds.length}
              onChange={(on) => setMany(pageIds, on)}
              disabled={pageIds.length === 0}
            />
          </div>
          {["Name", "Body", "Folder", "Type", "Date updated", ""].map((label) => (
            <div
              key={label || "actions"}
              role="columnheader"
              className="flex items-center justify-between gap-[8px] px-[14px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-pg-text-strong shadow-[inset_1px_0_0_0_var(--pg-head-border)]"
            >
              {label ? <span>{label}</span> : <span className="sr-only">Actions</span>}
              {label === "Type" ? (
                <button
                  type="button"
                  aria-label="Filter by type"
                  title="Filter by type"
                  aria-expanded={Boolean(filter.anchor)}
                  onClick={filter.toggle}
                  className={cn(
                    "flex size-[24px] items-center justify-center rounded-[6px] motion-tap hover:bg-pg",
                    types.size > 0 || filter.anchor ? "text-brand" : "text-pg-muted",
                  )}
                >
                  <ListFilter size={15} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-[4px]">
            <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">No snippets found</p>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              {rows.length === 0 ? "Snippets you add show up here." : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          pager.pageRows.map((s) => (
            <Row
              key={s.id}
              snippet={s}
              folder={s.folderId ? folderName.get(s.folderId) : undefined}
              selected={selected.has(s.id)}
              onToggle={(on) => setMany([s.id], on)}
              onMove={() => onMove([s.id])}
              onEdit={() => onEdit(s)}
              onDuplicate={() => onDuplicate(s)}
              onDelete={() => onDelete([s.id])}
            />
          ))
        )}
      </div>

      <Pager state={pager} />

      {filter.anchor ? (
        <Popover anchor={filter.anchor} onClose={filter.close} width={200} align="end" label="Filter by type">
          {(Object.keys(TYPE_LABEL) as SnippetType[]).map((t) => (
            <div key={t} className="flex h-[36px] items-center rounded-[6px] px-[10px] hover:bg-pg">
              <Checkbox checked={types.has(t)} onChange={() => toggleType(t)} label={TYPE_LABEL[t]} className="w-full" />
            </div>
          ))}
          {types.size > 0 ? (
            <button
              type="button"
              onClick={() => setTypes(new Set())}
              className="mt-[4px] flex h-[32px] items-center border-t border-pg-row-border px-[10px] text-[13px] leading-[18px] font-medium text-brand motion-tap"
            >
              Clear filter
            </button>
          ) : null}
        </Popover>
      ) : null}
    </div>
  );
}

function Row({
  snippet: s,
  folder,
  selected,
  onToggle,
  onMove,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  snippet: Snippet;
  folder?: string;
  selected: boolean;
  onToggle: (on: boolean) => void;
  onMove: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const menu = useAnchor();
  const run = (fn: () => void) => () => {
    menu.close();
    fn();
  };
  return (
    <div
      role="row"
      aria-selected={selected}
      style={{ gridTemplateColumns: GRID }}
      className={cn(
        "grid h-[46px] min-w-fit items-center border-b border-pg-row-border last:border-b-0",
        selected ? "bg-pg-row-selected" : "hover:bg-pg",
      )}
    >
      <div role="cell" className="flex justify-center">
        <Checkbox checked={selected} onChange={onToggle} />
      </div>
      <div role="cell" className="min-w-0 px-[14px]">
        <button
          type="button"
          onClick={onEdit}
          title={s.name}
          className="block max-w-full truncate text-left text-[14px] leading-[20px] text-pg-text-strong motion-tap hover:text-brand"
        >
          {s.name}
        </button>
      </div>
      <div role="cell" className="flex min-w-0 items-center gap-[4px] px-[14px] text-[14px] leading-[20px] text-pg-text">
        {s.attachments.length > 0 ? (
          <Paperclip size={14} aria-label="Has attachments" className="shrink-0 text-pg-muted" />
        ) : null}
        <span className="truncate">{bodyPreview(s)}</span>
      </div>
      <div role="cell" className="min-w-0 px-[14px]">
        {folder ? (
          <span className="inline-flex h-[24px] max-w-full items-center gap-[5px] rounded-[6px] bg-pg px-[8px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <Folder size={13} aria-hidden="true" className="shrink-0 text-pg-muted" />
            <span className="truncate">{folder}</span>
          </span>
        ) : null}
      </div>
      <div role="cell" className="px-[14px] text-[14px] leading-[20px] text-pg-text">
        {TYPE_LABEL[s.type]}
      </div>
      <div role="cell" className="truncate px-[14px] text-[14px] leading-[20px] whitespace-nowrap text-pg-text tabular-nums">
        {formatUpdated(s.updatedAt)}
      </div>
      <div role="cell" className="flex justify-center">
        <button
          type="button"
          aria-label={`Actions for ${s.name}`}
          aria-expanded={Boolean(menu.anchor)}
          onClick={menu.toggle}
          className={cn(
            "flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-heading hover:shadow-[inset_0_0_0_1px_var(--pg-border)]",
            menu.anchor && "bg-pg-surface text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]",
          )}
        >
          <EllipsisVertical size={16} aria-hidden="true" />
        </button>
        {menu.anchor ? (
          <Popover anchor={menu.anchor} onClose={menu.close} width={200} align="end" label={`Actions for ${s.name}`}>
            <div role="menu" className="flex flex-col">
              <MenuItem icon={FolderInput} label="Move to folder" onClick={run(onMove)} />
              <MenuItem icon={Pencil} label="Edit snippet" onClick={run(onEdit)} />
              <MenuItem icon={Copy} label="Duplicate snippet" onClick={run(onDuplicate)} />
              <MenuItem icon={Trash2} label="Delete snippet" danger onClick={run(onDelete)} />
            </div>
          </Popover>
        ) : null}
      </div>
    </div>
  );
}

const PER_PAGE = [10, 20, 50, 100];
const STEP = "motion-tap flex h-[32px] items-center rounded-[6px] px-[10px] text-[13px] leading-[18px] font-medium";

function slots(page: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", count];
  if (page >= count - 3) return [1, "gap", count - 4, count - 3, count - 2, count - 1, count];
  return [1, "gap", page - 1, page, page + 1, "gap", count];
}

/** "Rows per page 20⌄ · 1–20 of 108 · Previous 1 2 3 4 5 6 Next". */
export function Pager({ state }: { state: PagerState }) {
  const { page, perPage, pageCount, total, setPage, setPerPage } = state;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-[8px] pt-[12px] text-[13px] leading-[18px] text-pg-text">
      <span className="text-pg-text-strong">Rows per page</span>
      <span className="relative flex h-[32px] items-center gap-[6px] rounded-[6px] px-[10px] text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {perPage}
        <ChevronDown size={13} aria-hidden="true" className="text-pg-muted" />
        <select
          aria-label="Rows per page"
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {PER_PAGE.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </span>
      <span className="px-[4px] tabular-nums">
        {from.toLocaleString("en-US")}–{to.toLocaleString("en-US")} of {total.toLocaleString("en-US")}
      </span>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className={cn(
          STEP,
          "shadow-[inset_0_0_0_1px_var(--pg-border)]",
          page <= 1 ? "cursor-not-allowed text-pg-disabled" : "text-pg-text-strong hover:bg-pg",
        )}
      >
        Previous
      </button>
      {slots(page, pageCount).map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="w-[20px] text-center text-pg-muted">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            aria-current={n === page ? "page" : undefined}
            onClick={() => setPage(n)}
            className={cn(
              STEP,
              "min-w-[32px] justify-center",
              n === page
                ? "font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                : "text-pg-text hover:bg-pg hover:text-pg-text-strong",
            )}
          >
            {n}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => setPage(page + 1)}
        className={cn(
          STEP,
          "shadow-[inset_0_0_0_1px_var(--pg-border)]",
          page >= pageCount ? "cursor-not-allowed text-pg-disabled" : "text-pg-text-strong hover:bg-pg",
        )}
      >
        Next
      </button>
    </div>
  );
}
