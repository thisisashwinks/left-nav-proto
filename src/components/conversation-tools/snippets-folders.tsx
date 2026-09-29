"use client";

import * as React from "react";
import { EllipsisVertical, Folder, Pencil, Search, Trash2 } from "lucide-react";
import { TextInput } from "@/components/page/form-controls";
import { usePagination } from "@/components/page/table-card";
import { cn } from "@/lib/utils";
import { formatUpdated, type Snippet, type SnippetFolder } from "./snippets-data";
import { Pager } from "./snippets-table";
import { MenuItem, Popover, useAnchor } from "./snippets-ui";

const GRID = "minmax(240px,1fr) 180px 220px 64px";

/**
 * The Folders tab's list — each folder, how many snippets it holds and when
 * it last changed. Clicking a name drills in; the kebab renames or deletes.
 */
export function SnippetFoldersTable({
  folders,
  snippets,
  onOpen,
  onRename,
  onDelete,
}: {
  folders: SnippetFolder[];
  snippets: Snippet[];
  onOpen: (f: SnippetFolder) => void;
  onRename: (f: SnippetFolder) => void;
  onDelete: (f: SnippetFolder) => void;
}) {
  const [query, setQuery] = React.useState("");

  const counts = React.useMemo(() => {
    const m = new Map<string, number>();
    snippets.forEach((s) => {
      if (s.folderId) m.set(s.folderId, (m.get(s.folderId) ?? 0) + 1);
    });
    return m;
  }, [snippets]);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return folders
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "en-US"));
  }, [folders, query]);

  const pager = usePagination(rows, 20);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-[36px] shrink-0 items-center gap-[10px] pb-[12px]">
        <span className="flex-1" />
        <div className="relative w-[240px]">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[10px] -translate-y-1/2 text-pg-faint"
          />
          <TextInput
            aria-label="Search folders"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-[32px]"
          />
        </div>
      </div>

      <div role="table" aria-label="Folders" className="min-h-0 flex-1 overflow-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div
          role="row"
          style={{ gridTemplateColumns: GRID }}
          className="sticky top-0 z-10 grid h-[44px] min-w-fit items-stretch border-b border-pg-head-border bg-pg-surface"
        >
          {["Folder name", "Snippets", "Date updated", ""].map((label, i) => (
            <div
              key={label || "actions"}
              role="columnheader"
              className={cn(
                "flex items-center px-[16px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-pg-text-strong",
                i > 0 && "shadow-[inset_1px_0_0_0_var(--pg-head-border)]",
              )}
            >
              {label || <span className="sr-only">Actions</span>}
            </div>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-[4px]">
            <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">No folders found</p>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              {folders.length === 0 ? "Create a folder to group your snippets." : "Try a different search."}
            </p>
          </div>
        ) : (
          pager.pageRows.map((f) => (
            <FolderRow
              key={f.id}
              folder={f}
              count={counts.get(f.id) ?? 0}
              onOpen={() => onOpen(f)}
              onRename={() => onRename(f)}
              onDelete={() => onDelete(f)}
            />
          ))
        )}
      </div>

      <Pager state={pager} />
    </div>
  );
}

function FolderRow({
  folder,
  count,
  onOpen,
  onRename,
  onDelete,
}: {
  folder: SnippetFolder;
  count: number;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const menu = useAnchor();
  return (
    <div
      role="row"
      style={{ gridTemplateColumns: GRID }}
      className="grid h-[46px] min-w-fit items-center border-b border-pg-row-border last:border-b-0 hover:bg-pg"
    >
      <div role="cell" className="min-w-0 px-[16px]">
        <button
          type="button"
          onClick={onOpen}
          className="flex max-w-full items-center gap-[8px] text-left text-[14px] leading-[20px] font-medium text-pg-text-strong motion-tap hover:text-brand"
        >
          <Folder size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
          <span className="truncate">{folder.name}</span>
        </button>
      </div>
      <div role="cell" className="px-[16px] text-[14px] leading-[20px] text-pg-text tabular-nums">
        {count.toLocaleString("en-US")}
      </div>
      <div role="cell" className="truncate px-[16px] text-[14px] leading-[20px] text-pg-text tabular-nums">
        {formatUpdated(folder.updatedAt)}
      </div>
      <div role="cell" className="flex justify-center">
        <button
          type="button"
          aria-label={`Actions for ${folder.name}`}
          aria-expanded={Boolean(menu.anchor)}
          onClick={menu.toggle}
          className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-heading hover:shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          <EllipsisVertical size={16} aria-hidden="true" />
        </button>
        {menu.anchor ? (
          <Popover anchor={menu.anchor} onClose={menu.close} width={180} align="end" label={`Actions for ${folder.name}`}>
            <div role="menu" className="flex flex-col">
              <MenuItem
                icon={Pencil}
                label="Rename folder"
                onClick={() => {
                  menu.close();
                  onRename();
                }}
              />
              <MenuItem
                icon={Trash2}
                label="Delete folder"
                danger
                onClick={() => {
                  menu.close();
                  onDelete();
                }}
              />
            </div>
          </Popover>
        ) : null}
      </div>
    </div>
  );
}
