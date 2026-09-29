"use client";

import * as React from "react";
import { CircleCheck, List, ListChecks, Plus, Search, Settings, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/page/page-header";
import { showToast, Toaster } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  BUILT_IN_VIEWS,
  DEFAULT_SORT,
  addView,
  applyTaskFilters,
  deleteTasks,
  patchTasks,
  setColumns,
  sortTasks,
  useTasksStore,
  type CrmTask,
  type TaskFilters,
  type TaskSort,
} from "./tasks-data";
import { FilterChips, describeFilters } from "./tasks-filters";
import { Pagination, TasksEmpty, TasksTable } from "./tasks-table";
import { TaskDrawer } from "./task-drawer";
import { DeleteTasksModal, ManageFieldsDrawer, NewListModal } from "./task-modals";

export type TaskView = "all" | "today" | "overdue" | "upcoming";

const BUILT_IN_IDS: TaskView[] = ["all", "today", "overdue", "upcoming"];

function seedView(initial: string | null): TaskView {
  return BUILT_IN_IDS.includes(initial as TaskView) ? (initial as TaskView) : "all";
}

function viewFilters(id: string): TaskFilters {
  return (BUILT_IN_VIEWS.find((v) => v.id === id) ?? BUILT_IN_VIEWS[0]).filters;
}

type Overlay =
  | { kind: "new" }
  | { kind: "edit"; task: CrmTask }
  | { kind: "delete"; ids: string[]; titles: string[] }
  | { kind: "list" }
  | { kind: "fields" }
  | null;

function plural(n: number, one: string) {
  return `${n.toLocaleString("en-US")} ${one}${n === 1 ? "" : "s"}`;
}

/**
 * CRM ▸ Tasks — every task in the account, as a table.
 *
 * The four built-in tabs are presets over the same filter chips, so picking
 * Due today lights Status: Pending and Due date: Today and the chips can
 * then be edited like any others; "+ List" snapshots whatever the chips say
 * into a tab of its own.
 */
export function TasksPage({ initialView }: { initialView: string | null }) {
  const { effective } = useTheme();
  const store = useTasksStore();

  const [activeView, setActiveView] = React.useState<string>(() => seedView(initialView));
  const [filters, setFilters] = React.useState<TaskFilters>(() => viewFilters(seedView(initialView)));
  const [sort, setSort] = React.useState<TaskSort>(DEFAULT_SORT);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [overlay, setOverlay] = React.useState<Overlay>(null);
  const close = React.useCallback(() => setOverlay(null), []);

  // The nav's four rows re-seed the tab when they change underneath us.
  const [seenInitial, setSeenInitial] = React.useState(initialView);
  if (initialView !== seenInitial) {
    setSeenInitial(initialView);
    const v = seedView(initialView);
    setActiveView(v);
    setFilters(viewFilters(v));
    setPage(1);
    setSelected(new Set());
  }

  const views = [...BUILT_IN_VIEWS, ...store.views];

  const filtered = React.useMemo(
    () => sortTasks(applyTaskFilters(store.tasks, filters, query), sort),
    [store.tasks, filters, query, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  // Only what is still on screen counts as selected — a deleted or filtered
  // out task can't be acted on from here.
  const liveSelected = React.useMemo(() => {
    const s = new Set<string>();
    for (const t of filtered) if (selected.has(t.id)) s.add(t.id);
    return s;
  }, [filtered, selected]);
  const selCount = liveSelected.size;
  const allSelected = selCount > 0 && selCount === filtered.length;

  const resetCut = () => {
    setPage(1);
    setSelected(new Set());
  };
  const pickView = (id: string) => {
    const v = views.find((x) => x.id === id);
    if (!v) return;
    setActiveView(id);
    setFilters(v.filters);
    resetCut();
  };
  const changeFilters = (f: TaskFilters) => {
    setFilters(f);
    resetCut();
  };

  const toggleRow = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const togglePage = (on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      for (const r of rows) {
        if (on) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });

  const toggleDone = (t: CrmTask) => {
    patchTasks([t.id], { done: !t.done });
    showToast(t.done ? "Task marked as pending." : "Task marked as done.");
  };

  const bulkMark = (done: boolean) => {
    const ids = [...liveSelected];
    patchTasks(ids, { done });
    setSelected(new Set());
    showToast(`${plural(ids.length, "task")} marked as ${done ? "done" : "pending"}.`);
  };

  const confirmDelete = (ids: string[]) => {
    deleteTasks(ids);
    setSelected((s) => {
      const next = new Set(s);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setOverlay(null);
    showToast(ids.length === 1 ? "Task deleted." : `${plural(ids.length, "task")} deleted.`);
  };

  const openAdd = () => setOverlay({ kind: "new" });

  const countPill = (
    <span className="shrink-0 rounded-[6px] bg-brand-soft px-[8px] py-[2px] text-[13px] leading-[18px] font-medium whitespace-nowrap text-brand">
      {plural(filtered.length, "task")}
    </span>
  );

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Tasks"
        status={countPill}
        primary={{ label: "Add task", icon: Plus, onClick: openAdd }}
        overflow={[
          {
            label: "Bulk actions",
            icon: ListChecks,
            onClick: () => {
              if (rows.length === 0) {
                showToast("No tasks on this page to select.");
                return;
              }
              setSelected(new Set(rows.map((r) => r.id)));
              showToast(`${plural(rows.length, "task")} selected. Choose an action above the table.`);
            },
          },
        ]}
      />

      <div role="tablist" aria-label="Task lists" className="flex h-[38px] shrink-0 items-stretch border-b border-pg-head-border">
        <div className="flex min-w-0 items-stretch gap-[2px] overflow-hidden">
          {views.map((v) => {
            const on = v.id === activeView;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={on}
                title={v.label}
                onClick={() => pickView(v.id)}
                className={cn(
                  "relative flex min-w-0 shrink items-center gap-[6px] px-[11px] text-[14px] whitespace-nowrap motion-tap",
                  on ? "font-semibold text-brand" : "font-medium text-pg-muted hover:text-pg-text",
                )}
              >
                <List size={15} aria-hidden="true" className={cn("shrink-0", on ? "text-brand" : "text-pg-faint")} />
                <span className="max-w-[168px] truncate">{v.label}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 -bottom-px h-[2px] rounded-full motion-move",
                    on ? "bg-brand" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
        <span aria-hidden="true" className="mx-[6px] my-[9px] w-px shrink-0 bg-pg-head-border" />
        <button
          type="button"
          onClick={() => setOverlay({ kind: "list" })}
          className="flex shrink-0 items-center gap-[5px] px-[8px] text-[14px] font-medium text-pg-faint motion-tap hover:text-pg-muted"
        >
          <Plus size={15} aria-hidden="true" />
          List
        </button>
      </div>

      <section className="flex min-h-0 flex-1 flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[16px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="flex shrink-0 flex-wrap items-center gap-[12px]">
          {selCount > 0 ? (
            <div role="status" className="flex min-w-0 flex-wrap items-center gap-[16px]">
              <span className="flex h-[36px] items-center gap-[12px] rounded-full bg-brand-soft pr-[6px] pl-[14px] text-[14px] leading-[20px]">
                <span className="font-medium whitespace-nowrap text-brand">{plural(selCount, "task")} selected</span>
                {allSelected ? null : (
                  <button
                    type="button"
                    onClick={() => setSelected(new Set(filtered.map((t) => t.id)))}
                    className="font-semibold whitespace-nowrap text-brand underline-offset-2 motion-tap hover:underline"
                  >
                    Select all{filtered.length > selCount ? ` ${filtered.length.toLocaleString("en-US")}` : ""}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Clear selection"
                  onClick={() => setSelected(new Set())}
                  className="flex size-[24px] items-center justify-center rounded-full text-brand motion-tap hover:bg-[color-mix(in_oklab,var(--brand)_14%,transparent)]"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </span>
              <button
                type="button"
                onClick={() => bulkMark(true)}
                className="flex h-[32px] items-center gap-[6px] rounded-[6px] px-[6px] text-[14px] leading-[20px] font-medium text-pg-text motion-tap hover:bg-pg"
              >
                <CircleCheck size={17} aria-hidden="true" className="fill-[var(--hr-success-600)] text-pg-surface" />
                Mark as done
              </button>
              <button
                type="button"
                onClick={() => bulkMark(false)}
                className="flex h-[32px] items-center gap-[6px] rounded-[6px] px-[6px] text-[14px] leading-[20px] font-medium text-pg-text motion-tap hover:bg-pg"
              >
                <CircleCheck size={17} aria-hidden="true" className="text-pg-muted" />
                Mark as pending
              </button>
              <button
                type="button"
                onClick={() => {
                  const ids = [...liveSelected];
                  const titles = filtered.filter((t) => liveSelected.has(t.id)).map((t) => t.title);
                  setOverlay({ kind: "delete", ids, titles });
                }}
                className="flex h-[32px] items-center gap-[6px] rounded-[6px] px-[6px] text-[14px] leading-[20px] font-medium text-[var(--pg-status-overdue-fg)] motion-tap hover:bg-[color-mix(in_oklab,var(--hr-error-600)_8%,transparent)]"
              >
                <Trash2 size={16} aria-hidden="true" />
                Delete
              </button>
            </div>
          ) : (
            <FilterChips
              filters={filters}
              onFilters={changeFilters}
              sort={sort}
              onSort={(s) => {
                setSort(s);
                setPage(1);
              }}
            />
          )}
          <label className="ml-auto flex h-[36px] max-w-[280px] min-w-[160px] grow basis-[160px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search for task title"
              aria-label="Search for task title"
              className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => setOverlay({ kind: "fields" })}
            className="flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] text-[14px] leading-[20px] font-medium text-pg-text-strong motion-tap hover:bg-pg"
          >
            <Settings size={16} aria-hidden="true" />
            Manage fields
          </button>
        </div>

        <TasksTable
          rows={rows}
          columns={store.columns}
          selected={liveSelected}
          onToggleRow={toggleRow}
          onTogglePage={togglePage}
          sort={sort}
          onSort={(s) => {
            setSort(s);
            setPage(1);
          }}
          onToggleDone={toggleDone}
          onEdit={(task) => setOverlay({ kind: "edit", task })}
          onDelete={(t) => setOverlay({ kind: "delete", ids: [t.id], titles: [t.title] })}
          empty={
            <TasksEmpty
              searching={query.trim().length > 0}
              onAdd={openAdd}
              onClearSearch={() => setQuery("")}
            />
          }
          footer={
            <Pagination
              page={current}
              pageCount={pageCount}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(n) => {
                setPageSize(n);
                setPage(1);
              }}
            />
          }
        />
      </section>

      {overlay?.kind === "new" ? <TaskDrawer task={null} onClose={close} /> : null}
      {overlay?.kind === "edit" ? <TaskDrawer key={overlay.task.id} task={overlay.task} onClose={close} /> : null}
      {overlay?.kind === "delete" ? (
        <DeleteTasksModal titles={overlay.titles} onClose={close} onConfirm={() => confirmDelete(overlay.ids)} />
      ) : null}
      {overlay?.kind === "list" ? (
        <NewListModal
          summary={describeFilters(filters)}
          onClose={close}
          onCreate={(name) => {
            const v = addView(name, filters);
            setActiveView(v.id);
            resetCut();
            setOverlay(null);
            showToast(`List "${name}" created.`);
          }}
        />
      ) : null}
      {overlay?.kind === "fields" ? (
        <ManageFieldsDrawer columns={store.columns} onChange={setColumns} onClose={close} />
      ) : null}

      <Toaster />
    </div>
  );
}
