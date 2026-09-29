"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CircleCheck,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toneFor, AnchoredPopover } from "@/components/contacts/associated-objects";
import { ToneAvatar } from "@/components/page/avatar";
import { Checkbox } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { cn } from "@/lib/utils";
import {
  formatDue,
  isOverdue,
  personById,
  personLabel,
  plainText,
  type ColumnId,
  type ColumnSetting,
  type CrmTask,
  type SortField,
  type TaskSort,
} from "./tasks-data";
import { OptionRow, PersonAvatar } from "./tasks-ui";

/**
 * The task table: checkbox | Status | Title | (managed columns) | Actions.
 *
 * 49px rows with dividers both ways, as the live product draws them. The
 * row checkbox only shows on hover until something is selected — then every
 * row shows one, because a selection you can't see the edges of is a
 * selection you can't trust.
 */

const W = { check: 48, status: 76, contacts: 220, assignee: 132, due: 220, actions: 96 } as const;

const CELL = "flex h-full min-w-0 items-center px-[14px] border-r border-pg-row-border last:border-r-0";
const HEAD_TEXT = "text-[14px] leading-[20px] font-semibold whitespace-nowrap text-pg-heading";

function colStyle(id: ColumnId | "title"): { className: string; style?: React.CSSProperties } {
  switch (id) {
    case "title":
      return { className: "flex-[1.3] min-w-[220px]" };
    case "description":
      return { className: "flex-1 min-w-[200px]" };
    default:
      return { className: "shrink-0", style: { width: W[id] } };
  }
}

function SortGlyph({ field, sort }: { field: SortField; sort: TaskSort }) {
  if (sort.field !== field) {
    return <ChevronsUpDown size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />;
  }
  const Icon = sort.dir === "asc" ? ArrowUp : ArrowDown;
  return <Icon size={14} aria-hidden="true" className="shrink-0 text-brand" />;
}

function SortHead({
  label,
  field,
  sort,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: TaskSort;
  onSort: (s: TaskSort) => void;
}) {
  const on = sort.field === field;
  return (
    <button
      type="button"
      onClick={() => onSort({ field, dir: on && sort.dir === "asc" ? "desc" : "asc" })}
      aria-label={`Sort by ${label.toLowerCase()}`}
      className="flex h-full w-full min-w-0 items-center justify-between gap-[8px] text-left motion-tap"
    >
      <span className={cn(HEAD_TEXT, "truncate")}>{label}</span>
      <SortGlyph field={field} sort={sort} />
    </button>
  );
}

function StatusButton({ task, onToggle }: { task: CrmTask; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={task.done}
      aria-label={task.done ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as done`}
      title={task.done ? "Mark as pending" : "Mark as done"}
      onClick={onToggle}
      className="flex size-[28px] items-center justify-center rounded-full motion-tap active:scale-90"
    >
      {task.done ? (
        <span className="flex size-[22px] items-center justify-center rounded-full bg-[var(--hr-success-600)] text-white">
          <Check size={14} strokeWidth={3} aria-hidden="true" />
        </span>
      ) : (
        <CircleCheck
          size={23}
          strokeWidth={1.6}
          aria-hidden="true"
          className="text-pg-faint motion-tap hover:text-[var(--hr-success-600)]"
        />
      )}
    </button>
  );
}

function ContactsCell({ task }: { task: CrmTask }) {
  const contacts = task.associations.filter((a) => a.kind === "contacts");
  if (contacts.length === 0) return <span className="text-[14px] text-pg-faint">—</span>;
  const first = contacts[0];
  return (
    <span className="flex min-w-0 items-center gap-[8px]">
      <ToneAvatar name={first.name} initials={first.initials} tone={toneFor(first.id)} size={28} round />
      <span className="truncate text-[14px] leading-[20px] text-pg-text">{first.name}</span>
      {contacts.length > 1 ? (
        <span
          title={contacts.slice(1).map((c) => c.name).join(", ")}
          className="shrink-0 rounded-[6px] bg-pg px-[6px] py-[1px] text-[12px] leading-[16px] font-medium text-pg-muted"
        >
          +{contacts.length - 1}
        </span>
      ) : null}
    </span>
  );
}

export function TasksTable({
  rows,
  columns,
  selected,
  onToggleRow,
  onTogglePage,
  sort,
  onSort,
  onToggleDone,
  onEdit,
  onDelete,
  empty,
  footer,
}: {
  rows: CrmTask[];
  columns: ColumnSetting[];
  selected: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (on: boolean) => void;
  sort: TaskSort;
  onSort: (s: TaskSort) => void;
  onToggleDone: (t: CrmTask) => void;
  onEdit: (t: CrmTask) => void;
  onDelete: (t: CrmTask) => void;
  /** Drawn under the head row when there are no rows. */
  empty: React.ReactNode;
  footer: React.ReactNode;
}) {
  const shown = columns.filter((c) => c.visible);
  const selecting = selected.size > 0;
  const onPage = rows.filter((r) => selected.has(r.id)).length;
  const allOnPage = rows.length > 0 && onPage === rows.length;

  const cell = (id: ColumnId, t: CrmTask) => {
    const { className, style } = colStyle(id);
    switch (id) {
      case "description": {
        const text = plainText(t.html);
        return (
          <div key={id} style={style} className={cn(CELL, className)}>
            <span title={text || undefined} className="truncate text-[14px] leading-[20px] text-pg-text">
              {text}
            </span>
          </div>
        );
      }
      case "contacts":
        return (
          <div key={id} style={style} className={cn(CELL, className)}>
            <ContactsCell task={t} />
          </div>
        );
      case "assignee": {
        const p = personById(t.assigneeId);
        return (
          <div key={id} style={style} className={cn(CELL, className)}>
            {p ? (
              <span title={personLabel(p)} className="flex">
                <PersonAvatar person={p} size={28} />
              </span>
            ) : null}
          </div>
        );
      }
      case "due":
        return (
          <div key={id} style={style} className={cn(CELL, className)}>
            <span
              className={cn(
                "truncate text-[14px] leading-[20px] tabular-nums",
                isOverdue(t) ? "text-[var(--pg-status-overdue-fg)]" : "text-pg-text",
              )}
            >
              {formatDue(t)}
            </span>
          </div>
        );
    }
  };

  const head = (id: ColumnId) => {
    const { className, style } = colStyle(id);
    const label = columns.find((c) => c.id === id)?.label ?? id;
    return (
      <div key={id} role="columnheader" style={style} className={cn(CELL, className)}>
        {id === "due" ? (
          <SortHead label={label} field="due" sort={sort} onSort={onSort} />
        ) : (
          <span className={cn(HEAD_TEXT, "truncate")}>{label}</span>
        )}
      </div>
    );
  };

  const title = colStyle("title");

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] bg-pg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3] rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <div role="table" aria-label="Tasks" className="flex min-h-full min-w-[1120px] flex-col">
          <div
            role="row"
            className="sticky top-0 z-[2] flex h-[48px] shrink-0 items-stretch border-b border-pg-head-border bg-pg-surface"
          >
            <div style={{ width: W.check }} className={cn(CELL, "shrink-0 justify-center px-0")}>
              <Checkbox
                checked={allOnPage}
                mixed={onPage > 0 && !allOnPage}
                disabled={rows.length === 0}
                onChange={() => onTogglePage(!allOnPage)}
                className="p-[6px]"
              />
            </div>
            <div role="columnheader" style={{ width: W.status }} className={cn(CELL, "shrink-0")}>
              <span className={HEAD_TEXT}>Status</span>
            </div>
            <div role="columnheader" className={cn(CELL, title.className)}>
              <SortHead label="Title" field="title" sort={sort} onSort={onSort} />
            </div>
            {shown.map((c) => head(c.id))}
            <div role="columnheader" style={{ width: W.actions }} className={cn(CELL, "shrink-0")}>
              <span className={HEAD_TEXT}>Actions</span>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-[48px]">{empty}</div>
          ) : (
            rows.map((t) => {
              const on = selected.has(t.id);
              return (
                <div
                  key={t.id}
                  role="row"
                  className={cn(
                    "group flex h-[49px] shrink-0 items-stretch border-b border-pg-row-border motion-tap",
                    on ? "bg-pg-row-selected" : "bg-pg-surface hover:bg-pg",
                  )}
                >
                  <div style={{ width: W.check }} className={cn(CELL, "shrink-0 justify-center px-0")}>
                    <Checkbox
                      checked={on}
                      onChange={() => onToggleRow(t.id)}
                      className={cn(
                        "p-[6px] focus-visible:opacity-100",
                        selecting || on ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      )}
                    />
                  </div>
                  <div style={{ width: W.status }} className={cn(CELL, "shrink-0 justify-center")}>
                    <StatusButton task={t} onToggle={() => onToggleDone(t)} />
                  </div>
                  <div className={cn(CELL, title.className, "gap-[6px]")}>
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      title={t.title}
                      className="min-w-0 truncate text-left text-[14px] leading-[20px] text-pg-text motion-tap group-hover:text-brand"
                    >
                      {t.title}
                    </button>
                    <Pencil
                      size={13}
                      aria-hidden="true"
                      className="shrink-0 text-brand opacity-0 motion-tap group-hover:opacity-100"
                    />
                  </div>
                  {shown.map((c) => cell(c.id, t))}
                  <div style={{ width: W.actions }} className={cn(CELL, "shrink-0 gap-[4px]")}>
                    <button
                      type="button"
                      aria-label={`Edit ${t.title}`}
                      title="Edit"
                      onClick={() => onEdit(t)}
                      className="flex size-[30px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-heading active:scale-90"
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${t.title}`}
                      title="Delete"
                      onClick={() => onDelete(t)}
                      className="flex size-[30px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-[var(--pg-status-overdue-fg)] active:scale-90"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {footer}
    </div>
  );
}

/* ─── Pagination ────────────────────────────────────────────────────────── */

const PAGE_SIZES = [10, 20, 50, 100];

export function Pagination({
  page,
  pageCount,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  const [draft, setDraft] = React.useState<string | null>(null);
  const nav =
    "flex h-[36px] items-center rounded-[8px] bg-pg-surface px-[14px] text-[14px] leading-[20px] font-medium shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap";

  const commit = () => {
    if (draft === null) return;
    const n = Number.parseInt(draft, 10);
    if (Number.isFinite(n)) onPage(Math.max(1, Math.min(pageCount, n)));
    setDraft(null);
  };

  return (
    <div className="relative z-[2] flex h-[56px] shrink-0 items-center justify-between gap-[12px] border-t border-pg-head-border bg-pg-surface px-[14px]">
      <span className="text-[14px] leading-[20px] whitespace-nowrap text-pg-text">
        Page {page.toLocaleString("en-US")} of {pageCount.toLocaleString("en-US")}
      </span>
      <div className="flex shrink-0 items-center gap-[8px]">
        <button
          type="button"
          aria-label="Rows per page"
          aria-haspopup="listbox"
          aria-expanded={anchor !== null}
          onClick={(e) => {
            const el = e.currentTarget;
            setAnchor((a) => (a ? null : el));
          }}
          className={cn(nav, "gap-[10px] px-[12px] text-pg-text hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]")}
        >
          {pageSize}
          <ChevronDown size={15} aria-hidden="true" className="text-pg-faint" />
        </button>
        {anchor ? (
          <AnchoredPopover anchor={anchor} onClose={close} width={120} label="Rows per page">
            <div role="listbox" className="flex flex-col p-[4px]">
              {PAGE_SIZES.map((n) => (
                <OptionRow
                  key={n}
                  selected={n === pageSize}
                  onClick={() => {
                    onPageSize(n);
                    close();
                  }}
                >
                  {n}
                </OptionRow>
              ))}
            </div>
          </AnchoredPopover>
        ) : null}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={cn(nav, page <= 1 ? "cursor-not-allowed text-pg-disabled" : "text-pg-text hover:bg-pg")}
        >
          Prev
        </button>
        <input
          aria-label="Current page"
          inputMode="numeric"
          value={draft ?? String(page)}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          style={{ width: Math.max(36, String(pageCount).length * 9 + 20) }}
          className="h-[36px] rounded-[8px] bg-pg-surface text-center text-[14px] leading-[20px] font-medium text-brand shadow-[inset_0_0_0_1px_var(--brand)] focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
        />
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          className={cn(nav, page >= pageCount ? "cursor-not-allowed text-pg-disabled" : "text-pg-text hover:bg-pg")}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */

export function TasksEmpty({
  searching,
  onAdd,
  onClearSearch,
}: {
  searching: boolean;
  onAdd: () => void;
  onClearSearch: () => void;
}) {
  if (searching) {
    return (
      <div className="flex max-w-[340px] flex-col items-center gap-[6px] text-center">
        <span className="text-[16px] leading-[22px] font-semibold text-pg-heading">No tasks match your search</span>
        <span className="text-[13px] leading-[18px] text-pg-muted">Try a different title, or clear the search.</span>
        <OutlineButton className="mt-[10px] h-[36px] text-[14px]" onClick={onClearSearch}>
          Clear search
        </OutlineButton>
      </div>
    );
  }
  return (
    <div className="flex max-w-[340px] flex-col items-center text-center">
      <DeskIllustration />
      <span className="mt-[24px] text-[16px] leading-[22px] font-semibold text-pg-heading">No tasks yet</span>
      <span className="mt-[8px] text-[14px] leading-[20px] text-pg-muted">
        No tasks in sight! Ready to create a fresh one?
      </span>
      <PrimaryButton className="mt-[20px] h-[36px] text-[14px]" onClick={onAdd}>
        <Plus size={16} aria-hidden="true" />
        Add task
      </PrimaryButton>
    </div>
  );
}

/** A desk, a chair, a board of notes, a plant — line art in the page's own tokens. */
function DeskIllustration() {
  const line = "var(--pg-text-strong)";
  const soft = "var(--pg-border-strong)";
  return (
    <svg width="320" height="190" viewBox="0 0 320 190" fill="none" aria-hidden="true">
      {/* floor */}
      <path d="M4 176h312" stroke={soft} strokeWidth="1.5" strokeLinecap="round" />
      {/* board */}
      <rect x="126" y="6" width="166" height="118" rx="3" fill="var(--pg-surface)" stroke={soft} strokeWidth="1.5" />
      <path d="M288 124v4H132" stroke={soft} strokeWidth="1.5" />
      <rect x="140" y="16" width="10" height="12" rx="1" stroke={soft} />
      <rect x="156" y="16" width="10" height="12" rx="1" stroke={soft} />
      <path d="M142 20h6M142 24h6M158 20h6M158 24h6" stroke={soft} />
      <path d="M140 38h56M140 50h56M140 62h56M140 74h56M140 86h40" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <rect x="208" y="22" width="12" height="15" rx="1.5" fill="var(--pg-av-yellow-bg)" stroke="var(--pg-av-yellow-fg)" />
      <path d="M211 27h6M211 31h6" stroke="var(--pg-av-yellow-fg)" />
      <rect x="235" y="21" width="42" height="34" rx="2" fill="var(--pg-av-yellow-bg)" stroke="var(--pg-av-yellow-fg)" />
      <path d="M241 31h22M241 37h16" stroke="var(--pg-av-yellow-fg)" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="258" y="70" width="22" height="42" rx="2" stroke={soft} />
      <path d="M262 80h14M262 88h14M262 96h14M262 104h14" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      {/* chair */}
      <path d="M22 66c0-6 4-9 10-9h34c6 0 9 3 9 9v70H22V66Z" fill="var(--pg-surface)" stroke={soft} strokeWidth="1.5" />
      <path d="M28 70v62" stroke={soft} />
      <path d="M18 136h62v8H18z" fill="var(--pg-surface)" stroke={soft} strokeWidth="1.5" />
      <path d="M32 144v28M68 144v28M60 172h16" stroke={soft} strokeWidth="1.5" strokeLinecap="round" />
      {/* desk */}
      <path d="M34 108h170" stroke={line} strokeWidth="3" strokeLinecap="round" />
      <path d="M40 110v66M198 110v66M52 110v56M186 110v56M40 124h12M186 124h12" stroke={line} strokeWidth="2" strokeLinecap="round" />
      {/* cat on the desk */}
      <path
        d="M104 108c-6-3-8-10-6-16l-2-8 7 4c4-1 9-1 13 0l7-4-2 8c2 6 0 13-6 16"
        fill="var(--pg-surface)"
        stroke={line}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M106 95h1M117 95h1" stroke={line} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M110 100c1 1 3 1 4 0" stroke={line} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M98 112c-8 6-10 18 0 24 10 5 22 2 26-6 3-6 1-12-4-16" fill="var(--pg-surface)" stroke={line} strokeWidth="1.8" />
      <path d="M124 128c8 0 12-4 12-8" stroke={line} strokeWidth="1.8" strokeLinecap="round" />
      {/* plant */}
      <path d="M290 176l-4-20h24l-4 20z" fill="var(--pg-surface)" stroke={soft} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M298 156c-2-10-8-16-14-18 2 8 6 14 14 18ZM300 156c1-10 5-18 11-22 0 9-4 16-11 22Z" stroke={soft} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
