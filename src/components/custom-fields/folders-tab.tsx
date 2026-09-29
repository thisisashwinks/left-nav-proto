"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Info, Pencil, Search, Trash2 } from "lucide-react";
import { TextInput } from "@/components/page/form-controls";
import { usePagination } from "@/components/page/table-card";
import { cn } from "@/lib/utils";
import { formatCreated, useCustomFields, type CustomFolder } from "./custom-fields-data";
import type { ObjectScope } from "./custom-fields-page";
import { DeleteFolderModal, FolderModal } from "./folder-modals";
import {
  ColumnsPicker,
  CreatedFilterChip,
  FoldersPager,
  matchesCreated,
  type ColumnDef,
  type CreatedFilter,
} from "./folders-toolbar";

type ColumnKey = "name" | "count" | "created" | "actions";

const COLUMNS: ColumnDef<ColumnKey>[] = [
  { key: "name", label: "Folder name", locked: true },
  { key: "count", label: "Number of fields" },
  { key: "created", label: "Created (IST)" },
  { key: "actions", label: "Actions" },
];

const WIDTH: Record<ColumnKey, string> = {
  name: "minmax(200px,1fr)",
  count: "220px",
  created: "220px",
  actions: "116px",
};

type Sort = "desc" | "asc" | null;
type Dialog = { kind: "edit" | "delete"; folder: CustomFolder } | null;

/**
 * The Folders tab — every folder in scope, its field count and its age.
 *
 * Counts are derived from the fields store on every render, so moving,
 * creating or deleting a field in the other tab shows up here without any
 * bookkeeping. System folders carry an info glyph instead of actions: the
 * live table offers nothing on them, and a greyed pencil would only invite
 * the click it refuses.
 */
export function FoldersTab({ scope }: { scope: ObjectScope }) {
  const { folders, fields } = useCustomFields();
  const [query, setQuery] = React.useState("");
  const [created, setCreated] = React.useState<CreatedFilter | null>(null);
  const [sort, setSort] = React.useState<Sort>(null);
  const [visible, setVisible] = React.useState<Set<ColumnKey>>(() => new Set(COLUMNS.map((c) => c.key)));
  const [dialog, setDialog] = React.useState<Dialog>(null);

  const counts = React.useMemo(() => {
    const m = new Map<string, number>();
    fields.forEach((f) => m.set(f.folderId, (m.get(f.folderId) ?? 0) + 1));
    return m;
  }, [fields]);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const out = folders.filter(
      (f) =>
        (scope === "all" || f.object === scope) &&
        (!q || f.name.toLowerCase().includes(q)) &&
        matchesCreated(f.createdAt, created, now),
    );
    if (sort) {
      const dir = sort === "asc" ? 1 : -1;
      out.sort((a, b) => dir * a.createdAt.localeCompare(b.createdAt));
    }
    return out;
  }, [folders, scope, query, created, sort]);

  const pager = usePagination(rows, 20);
  const shown = COLUMNS.filter((c) => visible.has(c.key));
  const grid = shown.map((c) => WIDTH[c.key]).join(" ");

  const toggleColumn = (key: ColumnKey) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const SortIcon = sort === "desc" ? ArrowDown : sort === "asc" ? ArrowUp : ArrowUpDown;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-[10px] pb-[12px]">
        <CreatedFilterChip value={created} onChange={setCreated} />
        <span className="flex-1" />
        <ColumnsPicker columns={COLUMNS} visible={visible} onToggle={toggleColumn} />
        <div className="relative w-[240px]">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[10px] -translate-y-1/2 text-pg-faint"
          />
          <TextInput
            aria-label="Search folders"
            placeholder="Search folders"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-[32px]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div
          role="row"
          style={{ gridTemplateColumns: grid }}
          className="sticky top-0 z-10 grid h-[40px] min-w-fit items-stretch border-b border-pg-head-border bg-pg-surface"
        >
          {shown.map((c, i) => (
            <div
              key={c.key}
              role="columnheader"
              aria-sort={c.key === "created" && sort ? (sort === "asc" ? "ascending" : "descending") : undefined}
              className={cn(
                "flex items-center px-[16px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-pg-text-strong",
                i > 0 && "shadow-[inset_1px_0_0_0_var(--pg-head-border)]",
                (c.key === "count" || c.key === "actions") && "justify-center",
              )}
            >
              {c.key === "created" ? (
                <button
                  type="button"
                  onClick={() => setSort((s) => (s === null ? "desc" : s === "desc" ? "asc" : null))}
                  className="group motion-tap flex w-full items-center justify-between gap-[8px]"
                >
                  {c.label}
                  <SortIcon
                    size={15}
                    aria-hidden="true"
                    className={sort ? "text-brand" : "text-pg-faint opacity-0 group-hover:opacity-100"}
                  />
                </button>
              ) : (
                c.label
              )}
            </div>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-[4px]">
            <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">No folders found</p>
            <p className="text-[13px] leading-[18px] text-pg-muted">Try a different search or filter.</p>
          </div>
        ) : (
          pager.pageRows.map((f) => (
            <div
              key={f.id}
              role="row"
              style={{ gridTemplateColumns: grid }}
              className="grid h-[40px] min-w-fit items-center border-b border-pg-row-border last:border-b-0 hover:bg-pg"
            >
              {shown.map((c) => (
                <Cell
                  key={c.key}
                  column={c.key}
                  folder={f}
                  count={counts.get(f.id) ?? 0}
                  onEdit={() => setDialog({ kind: "edit", folder: f })}
                  onDelete={() => setDialog({ kind: "delete", folder: f })}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {rows.length > 0 ? <FoldersPager state={pager} noun="Folders" /> : null}

      {dialog?.kind === "edit" ? (
        <FolderModal mode="edit" folder={dialog.folder} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "delete" ? (
        <DeleteFolderModal folder={dialog.folder} onClose={() => setDialog(null)} />
      ) : null}
    </div>
  );
}

function Cell({
  column,
  folder,
  count,
  onEdit,
  onDelete,
}: {
  column: ColumnKey;
  folder: CustomFolder;
  count: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  switch (column) {
    case "name":
      return (
        <span className="truncate px-[16px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
          {folder.name}
        </span>
      );
    case "count":
      return (
        <span className="px-[16px] text-center text-[14px] leading-[20px] text-pg-text tabular-nums">
          {count.toLocaleString("en-US")}
        </span>
      );
    case "created":
      return (
        <span className="truncate px-[16px] text-[14px] leading-[20px] text-pg-text">
          {formatCreated(folder.createdAt)}
        </span>
      );
    case "actions":
      return folder.system ? (
        <span className="flex justify-center">
          <span className="group relative flex">
            <span
              tabIndex={0}
              aria-label="System folder — can't be renamed or deleted"
              className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted outline-none hover:text-pg-heading focus-visible:shadow-[0_0_0_2px_var(--brand-soft)]"
            >
              <Info size={16} aria-hidden="true" />
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute top-1/2 right-[calc(100%+6px)] z-20 -translate-y-1/2 rounded-[6px] bg-pg-overlay px-[8px] py-[5px] text-[13px] leading-[18px] whitespace-nowrap text-pg-overlay-fg opacity-0 shadow-[0_8px_24px_0_rgba(16,24,40,0.2)] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
            >
              System folder — can&rsquo;t be renamed or deleted
            </span>
          </span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-[6px]">
          <IconButton label={`Edit ${folder.name}`} onClick={onEdit}>
            <Pencil size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label={`Delete ${folder.name}`} onClick={onDelete} danger>
            <Trash2 size={15} aria-hidden="true" />
          </IconButton>
        </span>
      );
  }
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-text-strong hover:bg-pg-surface hover:shadow-[inset_0_0_0_1px_var(--pg-border)]",
        danger ? "hover:text-pg-danger" : "hover:text-brand",
      )}
    >
      {children}
    </button>
  );
}
