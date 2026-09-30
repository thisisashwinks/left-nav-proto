"use client";

import * as React from "react";
import {
  Copy,
  EllipsisVertical,
  Files,
  GripVertical,
  KeyRound,
  Link,
  Pencil,
  Plus,
  Search,
  SquareKanban,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { TextInput } from "@/components/page/form-controls";
import { PageHeader } from "@/components/page/page-header";
import { TableCard, usePagination } from "@/components/page/table-card";
import {
  ListToolbar,
  useListToolbar,
  type ListToolbarModel,
} from "@/components/page/list-toolbar";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { PipelineDetail } from "./pipeline-detail";
import { PipelineEditorModal } from "./pipeline-editor-modal";
import {
  CopyToSubAccountsModal,
  DeletePipelineModal,
  FloatingLayer,
  PermissionsDrawer,
  ReorderPipelineModal,
} from "./pipeline-row-modals";
import {
  formatUpdated,
  movePipeline,
  removePipeline,
  upsertPipeline,
  usePipelines,
  type PipelineConfig,
} from "./pipelines-store";

const HEAD = "text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted";
/** Toggleable columns, as the shared toolbar's column picker lists them. */
const PIPELINE_COLUMNS = [
  { id: "name", label: "Pipeline name", locked: true },
  { id: "stages", label: "Total stages" },
  { id: "updated", label: "Updated on" },
];

const PIPELINE_SORT_FIELDS = [
  { value: "name", label: "Pipeline name" },
  { value: "stages", label: "Total stages" },
  { value: "updated", label: "Updated on" },
];

type Dialog =
  | { kind: "create" }
  | { kind: "duplicate"; id: string }
  | { kind: "copy"; id: string }
  | { kind: "permissions"; id: string }
  | { kind: "reorder"; id: string }
  | { kind: "delete"; id: string };

/**
 * Settings › Pipelines.
 *
 * The list is the order the board's pipeline picker uses, so reordering is a
 * first-class action here: drag a row by its handle, or use "Move to position"
 * from the row menu when the target is a page away. Opening a pipeline swaps
 * the list for its detail in place rather than navigating, which keeps the
 * search, the page and the scroll where you left them for when you come back.
 */
export function PipelinesPage() {
  const pipelines = usePipelines();
  const [query, setQuery] = React.useState("");
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<Dialog | null>(null);
  const [menu, setMenu] = React.useState<{ id: string; rect: DOMRect } | null>(null);

  // Native drag and drop, armed from the handle only so text in the row stays
  // selectable and a click on the name never starts a drag.
  const [armedId, setArmedId] = React.useState<string | null>(null);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<{ id: string; after: boolean } | null>(null);

  const { shared } = useListToolbar();
  // Only the shared toolbar can set these; the page's own chrome has no
  // sort or column picker, so under it the list stays in board order.
  const [sort, setSort] = React.useState<{ field: string; dir: "asc" | "desc" } | null>(null);
  const [hiddenCols, setHiddenCols] = React.useState<Set<string>>(() => new Set());
  const activeSort = shared ? sort : null;
  const hidden = shared ? hiddenCols : new Set<string>();
  const cols = [
    "20px",
    "32px",
    "minmax(0,1fr)",
    hidden.has("stages") ? null : "120px",
    hidden.has("updated") ? null : "180px",
    "36px",
  ]
    .filter(Boolean)
    .join(" ");

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = q ? pipelines.filter((p) => p.name.toLowerCase().includes(q)) : pipelines;
    if (!activeSort) return found;
    const sign = activeSort.dir === "asc" ? 1 : -1;
    return [...found].sort((a, b) => {
      if (activeSort.field === "stages") return (a.stages.length - b.stages.length) * sign;
      if (activeSort.field === "updated") return a.updatedAt.localeCompare(b.updatedAt) * sign;
      return a.name.localeCompare(b.name) * sign;
    });
  }, [pipelines, query, activeSort]);
  const pager = usePagination(rows, 20);

  const model = React.useMemo<ListToolbarModel>(
    () => ({
      search: { value: query, onChange: setQuery, placeholder: "Search pipelines" },
      sort: { fields: PIPELINE_SORT_FIELDS, value: sort, onChange: setSort },
      columns: {
        items: PIPELINE_COLUMNS.map((c) => ({
          ...c,
          visible: c.locked || !hiddenCols.has(c.id),
        })),
        onChange: (items) =>
          setHiddenCols(new Set(items.filter((i) => !i.visible && !i.locked).map((i) => i.id))),
      },
      resultCount: { value: rows.length, noun: rows.length === 1 ? "pipeline" : "pipelines" },
    }),
    [query, sort, hiddenCols, rows.length],
  );

  const closeMenu = React.useCallback(() => setMenu(null), []);
  const closeDialog = React.useCallback(() => setDialog(null), []);
  const byId = (id: string) => pipelines.find((p) => p.id === id);

  const endDrag = () => {
    setArmedId(null);
    setDragId(null);
    setOver(null);
  };

  const drop = (targetId: string, after: boolean) => {
    const id = dragId;
    endDrag();
    if (!id || id === targetId) return;
    const from = pipelines.findIndex((p) => p.id === id);
    const target = pipelines.findIndex((p) => p.id === targetId);
    if (from < 0 || target < 0) return;
    let to = target + (after ? 1 : 0);
    if (from < to) to -= 1;
    if (to === from) return;
    movePipeline(id, to);
    showToast(`Pipeline moved to position ${to + 1}`);
  };

  const copyLink = (p: PipelineConfig) => {
    const url = `${window.location.origin}/opportunities/pipelines/${p.id}`;
    void navigator.clipboard?.writeText(url).catch(() => undefined);
    showToast("Link copied");
  };

  if (detailId && byId(detailId)) {
    return <PipelineDetail pipelineId={detailId} onBack={() => setDetailId(null)} />;
  }

  const menuPipeline = menu ? byId(menu.id) : undefined;
  const menuItems: { label: string; icon: LucideIcon; danger?: boolean; run: (p: PipelineConfig) => void }[] = [
    { label: "Edit", icon: Pencil, run: (p) => setDetailId(p.id) },
    { label: "Duplicate", icon: Copy, run: (p) => setDialog({ kind: "duplicate", id: p.id }) },
    { label: "Copy to sub-accounts", icon: Files, run: (p) => setDialog({ kind: "copy", id: p.id }) },
    { label: "Manage permissions", icon: KeyRound, run: (p) => setDialog({ kind: "permissions", id: p.id }) },
    { label: "Copy link", icon: Link, run: copyLink },
    { label: "Move to position", icon: GripVertical, run: (p) => setDialog({ kind: "reorder", id: p.id }) },
    { label: "Delete", icon: Trash2, danger: true, run: (p) => setDialog({ kind: "delete", id: p.id }) },
  ];

  const target = dialog && dialog.kind !== "create" ? byId(dialog.id) : undefined;

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <PageHeader
        title="Pipelines"
        description="Use pipelines to track opportunities and sales progress across stages."
        primary={{ label: "Create pipeline", icon: Plus, onClick: () => setDialog({ kind: "create" }) }}
      />

      {(() => {
        const table = (
          <TableCard pager={pager}>
            {shared ? null : (
              <div className="flex h-[48px] items-center justify-end gap-[12px] px-[16px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
                <div className="relative w-[240px]">
                  <Search
                    size={15}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-[11px] -translate-y-1/2 text-pg-faint"
                  />
                  <TextInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    aria-label="Search pipelines"
                    className="pl-[32px]"
                  />
                </div>
              </div>
            )}

            {rows.length === 0 ? (
              <div className="flex h-[240px] flex-col items-center justify-center gap-[4px] px-[16px] text-center">
                <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                  {query ? "No pipelines match your search" : "No pipelines yet"}
                </p>
                <p className="text-[13px] leading-[18px] text-pg-muted">
                  {query ? "Try a different name or clear the search." : "Create a pipeline to start tracking opportunities."}
                </p>
              </div>
            ) : (
              <div className="min-w-[720px]">
                <div
                  style={{ gridTemplateColumns: cols }}
                  className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
                >
                  <span />
                  <span className={HEAD}>#</span>
                  <span className={cn(HEAD, "flex items-center gap-[6px]")}>
                    <SquareKanban size={14} aria-hidden="true" />
                    Pipeline name
                  </span>
                  {hidden.has("stages") ? null : (
                    <span className={cn(HEAD, "text-right")}>Total stages</span>
                  )}
                  {hidden.has("updated") ? null : <span className={HEAD}>Updated on</span>}
                  <span className={cn(HEAD, "sr-only")}>Actions</span>
                </div>

                {pager.pageRows.map((p) => {
                  const index = pipelines.findIndex((x) => x.id === p.id);
                  const { date, time } = formatUpdated(p.updatedAt);
                  const dragging = dragId === p.id;
                  const showBefore = over?.id === p.id && !over.after && dragId !== p.id;
                  const showAfter = over?.id === p.id && over.after && dragId !== p.id;
                  return (
                    <div
                      key={p.id}
                      draggable={armedId === p.id}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", p.id);
                        setDragId(p.id);
                      }}
                      onDragEnd={endDrag}
                      onDragOver={(e) => {
                        if (!dragId) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        const r = e.currentTarget.getBoundingClientRect();
                        const after = e.clientY > r.top + r.height / 2;
                        if (over?.id !== p.id || over.after !== after) setOver({ id: p.id, after });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const r = e.currentTarget.getBoundingClientRect();
                        drop(p.id, e.clientY > r.top + r.height / 2);
                      }}
                      style={{ gridTemplateColumns: cols }}
                      className={cn(
                        "relative grid h-[52px] items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0",
                        dragging ? "opacity-50" : "hover:bg-pg",
                        menu?.id === p.id && "bg-pg",
                      )}
                    >
                      {showBefore ? (
                        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-px h-[2px] bg-brand" />
                      ) : null}
                      {showAfter ? (
                        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px] bg-brand" />
                      ) : null}

                      <span
                        role="button"
                        tabIndex={-1}
                        aria-label={`Drag to reorder ${p.name}`}
                        title="Drag to reorder"
                        onPointerDown={() => setArmedId(p.id)}
                        onPointerUp={() => {
                          if (!dragId) setArmedId(null);
                        }}
                        className="flex size-[20px] cursor-grab items-center justify-center rounded-[4px] text-pg-faint hover:text-pg-muted active:cursor-grabbing"
                      >
                        <GripVertical size={15} aria-hidden="true" />
                      </span>
                      <span className="text-[14px] leading-[20px] text-pg-muted tabular-nums">{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => setDetailId(p.id)}
                        className="motion-tap min-w-0 justify-self-start truncate text-left text-[14px] leading-[20px] font-medium text-pg-text-strong hover:text-brand hover:underline"
                      >
                        {p.name}
                      </button>
                      {hidden.has("stages") ? null : (
                        <span className="text-right text-[14px] leading-[20px] text-pg-text tabular-nums">
                          {p.stages.length.toLocaleString("en-US")}
                        </span>
                      )}
                      {hidden.has("updated") ? null : (
                        <span className="truncate text-[14px] leading-[20px] text-pg-text">
                          {date}
                          {time ? <span className="text-pg-muted"> / {time}</span> : null}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`Actions for ${p.name}`}
                        aria-haspopup="menu"
                        aria-expanded={menu?.id === p.id}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenu((prev) => (prev?.id === p.id ? null : { id: p.id, rect }));
                        }}
                        className={cn(
                          "motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading hover:shadow-[inset_0_0_0_1px_var(--pg-border)]",
                          menu?.id === p.id && "bg-pg-surface text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]",
                        )}
                      >
                        <EllipsisVertical size={16} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </TableCard>
        );
        return shared ? <ListToolbar model={model}>{table}</ListToolbar> : table;
      })()}

      {menu && menuPipeline ? (
        <FloatingLayer
          rect={menu.rect}
          onClose={closeMenu}
          align="end"
          width={228}
          z={90}
          maxHeight={360}
          role="menu"
          aria-label={`Actions for ${menuPipeline.name}`}
          className="p-[6px]"
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu();
                item.run(menuPipeline);
              }}
              className={cn(
                "motion-tap flex w-full items-center gap-[10px] rounded-[6px] px-[10px] py-[8px] text-left hover:bg-pg",
                item.danger ? "text-[var(--hr-error-500)]" : "text-pg-text",
              )}
            >
              <item.icon
                size={15}
                aria-hidden="true"
                className={cn("shrink-0", item.danger ? "text-[var(--hr-error-500)]" : "text-pg-muted")}
              />
              <span className="text-[14px] leading-[20px]">{item.label}</span>
            </button>
          ))}
        </FloatingLayer>
      ) : null}

      {dialog?.kind === "create" ? (
        <PipelineEditorModal
          mode="create"
          onClose={closeDialog}
          onSave={(p) => {
            upsertPipeline(p);
            showToast("Pipeline created");
          }}
        />
      ) : null}

      {dialog?.kind === "duplicate" && target ? (
        <PipelineEditorModal
          mode="duplicate"
          source={target}
          onClose={closeDialog}
          onSave={(p) => {
            upsertPipeline(p);
            showToast("Pipeline duplicated");
          }}
        />
      ) : null}

      {dialog?.kind === "copy" && target ? (
        <CopyToSubAccountsModal pipeline={target} onClose={closeDialog} />
      ) : null}

      {dialog?.kind === "permissions" && target ? (
        <PermissionsDrawer
          pipeline={target}
          onClose={closeDialog}
          onSave={(permissions) => upsertPipeline({ ...target, permissions })}
        />
      ) : null}

      {dialog?.kind === "reorder" && target ? (
        <ReorderPipelineModal
          pipelines={pipelines}
          initialId={target.id}
          onClose={closeDialog}
          onApply={(id, index) => movePipeline(id, index)}
        />
      ) : null}

      {dialog?.kind === "delete" && target ? (
        <DeletePipelineModal
          pipeline={target}
          onClose={closeDialog}
          onConfirm={() => removePipeline(target.id)}
        />
      ) : null}
    </div>
  );
}
