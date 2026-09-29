"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  List,
  ListFilter,
  Loader2,
  Mail,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Undo2,
  Upload,
  X,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { showToast, Toaster } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { OutlineButton, PageHeader } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { ViewBar } from "@/components/page/view-bar";
import { useJobs } from "@/components/contacts/contacts-jobs";
import { BulkActionsPage } from "@/components/contacts/bulk-actions-page";
import {
  ListToolbar,
  useListToolbar,
  type ListToolbarModel,
} from "@/components/page/list-toolbar";
import { cn } from "@/lib/utils";
import {
  addCompanies,
  applyFilters,
  applySearch,
  COLUMN_DEFS,
  columnDef,
  createList,
  formatCount,
  plural,
  removeAllCompanies,
  removeCompanies,
  saveList,
  sortCompanies,
  tailRow,
  useCompanies,
  useCompanyLists,
  virtualTotal,
  type ColumnId,
  type ColumnState,
  type Company,
  type CompanyFilter,
  type CompanyList,
  type CompanySort,
  type CompanyType,
} from "./companies-data";

const COMPANY_TYPES: CompanyType[] = ["Customer", "Supplier", "Subcontractor", "Partner"];
import { CompaniesTable } from "./companies-table";
import { CompanyDrawer } from "./company-drawer";
import {
  CompanyFiltersDrawer,
  ImportCompaniesModal,
  ListNameModal,
  ManageFieldsDrawer,
  ManageListsDrawer,
  SortPanel,
} from "./companies-drawers";
import {
  AddToAutomationModal,
  BulkDeleteModal,
  ComposeEmailDrawer,
  ConfirmRecipientsModal,
} from "./companies-bulk-modals";
import { ExportProgressModal, startCompanyExport } from "./companies-export";
import { OptionList, Popover } from "./companies-ui";

/** The kebab's Export row while an export is running. */
const Spinner = React.forwardRef<SVGSVGElement, LucideProps>(function Spinner(
  { className, ...props },
  ref,
) {
  return <Loader2 ref={ref} {...props} className={cn(className, "animate-spin text-brand")} />;
}) as LucideIcon;

type Drawer =
  | { kind: "add" }
  | { kind: "edit"; company: Company }
  | { kind: "filters" }
  | { kind: "fields" }
  | { kind: "lists" }
  | { kind: "compose"; count: number }
  | null;

type ModalState =
  | { kind: "export"; jobId: string; count: number }
  | { kind: "automation" }
  | { kind: "email" }
  | { kind: "delete" }
  | { kind: "import" }
  | { kind: "list-name"; mode: "create" | "save-as" }
  | null;

/** In "all" mode `ids` holds the EXCLUDED rows; otherwise the selected ones. */
interface Selection {
  all: boolean;
  ids: Map<string, Company>;
}
const NO_SELECTION: Selection = { all: false, ids: new Map() };

interface Cut {
  filters: CompanyFilter[];
  sort: CompanySort | null;
  columns: ColumnState[];
}
const cutKey = (c: Cut) => JSON.stringify([c.filters, c.sort, c.columns]);
const cutOf = (l: CompanyList): Cut => ({ filters: l.filters, sort: l.sort, columns: l.columns });

const PAGE_SIZES = [10, 20, 50, 100];

export function CompaniesPage({ initialList }: { initialList: string | null }) {
  return (
    <>
      <CompaniesPageBody initialList={initialList} />
      <Toaster />
    </>
  );
}

function CrumbedScreen({
  name,
  onExit,
  children,
}: {
  name: string;
  onExit: () => void;
  children: React.ReactNode;
}) {
  useRecordCrumb({ name, kind: name }, onExit);
  return <>{children}</>;
}

function CompaniesPageBody({ initialList }: { initialList: string | null }) {
  const { effective } = useTheme();
  const store = useCompanies();
  const lists = useCompanyLists();
  const jobs = useJobs();

  const findList = (id: string | null) => lists.find((l) => l.id === id) ?? lists[0];

  const [activeId, setActiveId] = React.useState(() => findList(initialList).id);
  const [cut, setCut] = React.useState<Cut>(() => cutOf(findList(initialList)));
  const [search, setSearch] = React.useState("");
  /* The Type quick filter — works inside the list, so it never dirties it. */
  const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
  /* The shared list toolbar, when prototype controls turn it on. */
  const { shared } = useListToolbar();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [selection, setSelection] = React.useState<Selection>(NO_SELECTION);
  const [drawer, setDrawer] = React.useState<Drawer>(null);
  const [modal, setModal] = React.useState<ModalState>(null);
  const [view, setView] = React.useState<"bulk-actions" | null>(null);
  const [exportJobId, setExportJobId] = React.useState<string | null>(null);
  const [sortAnchor, setSortAnchor] = React.useState<HTMLElement | null>(null);
  const [unsavedAnchor, setUnsavedAnchor] = React.useState<HTMLElement | null>(null);
  const [sizeAnchor, setSizeAnchor] = React.useState<HTMLElement | null>(null);

  const active = lists.find((l) => l.id === activeId) ?? lists[0];

  const pickList = (id: string) => {
    const list = findList(id);
    setActiveId(list.id);
    setCut(cutOf(list));
    setPage(1);
    setSelection(NO_SELECTION);
  };

  /*
   * The nav's saved-list rows re-seed the tab. Adjusted during render (the
   * React-sanctioned way to follow a prop), not in an effect.
   */
  const [seenList, setSeenList] = React.useState(initialList);
  if (seenList !== initialList) {
    setSeenList(initialList);
    pickList(initialList ?? "all");
  }

  const dirty = cutKey(cut) !== cutKey(cutOf(active));
  const { filters, sort, columns } = cut;

  /* ─── Rows ─────────────────────────────────────────────────────────── */

  const narrowed = filters.length > 0 || search.trim() !== "" || typeFilter.length > 0;
  const realCut = React.useMemo(
    () =>
      sortCompanies(
        applySearch(
          applyFilters(store.real, filters).filter(
            (c) => typeFilter.length === 0 || typeFilter.includes(c.type),
          ),
          search,
        ),
        sort,
      ),
    [store.real, filters, search, sort, typeFilter],
  );
  // Nothing narrows the list: it is the whole account, real rows then the tail.
  const total = narrowed ? realCut.length : virtualTotal(store);
  const rowAt = (i: number) => (i < realCut.length ? realCut[i] : tailRow(store, i - realCut.length));
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const pageRows: Company[] = [];
  for (let i = start; i < Math.min(start + pageSize, total); i++) pageRows.push(rowAt(i));

  /* ─── Selection ────────────────────────────────────────────────────── */

  const isSelected = (id: string) =>
    selection.all ? !selection.ids.has(id) : selection.ids.has(id);
  const selectedCount = selection.all ? Math.max(0, total - selection.ids.size) : selection.ids.size;
  const selectedSample = (): Company[] => {
    if (!selection.all) return [...selection.ids.values()].slice(0, 10);
    const out: Company[] = [];
    for (let i = 0; i < total && out.length < 10; i++) {
      const c = rowAt(i);
      if (!selection.ids.has(c.id)) out.push(c);
    }
    return out;
  };

  const toggleRow = (id: string) => {
    const row = pageRows.find((r) => r.id === id);
    if (!row) return;
    setSelection((s) => {
      const ids = new Map(s.ids);
      if (ids.has(id)) ids.delete(id);
      else ids.set(id, row);
      return { all: s.all, ids };
    });
  };
  const togglePage = (select: boolean) =>
    setSelection((s) => {
      const ids = new Map(s.ids);
      // In "all" mode the map is exclusions, so selecting means removing.
      const add = s.all ? !select : select;
      pageRows.forEach((r) => (add ? ids.set(r.id, r) : ids.delete(r.id)));
      return { all: s.all, ids };
    });
  const clearSelection = () => setSelection(NO_SELECTION);

  const resetView = () => {
    setPage(1);
    setSelection(NO_SELECTION);
  };
  const setFilters = (next: CompanyFilter[]) => {
    setCut((c) => ({ ...c, filters: next }));
    resetView();
  };
  const setSort = (next: CompanySort | null) => {
    setCut((c) => ({ ...c, sort: next }));
    setPage(1);
  };

  /* ─── Actions ──────────────────────────────────────────────────────── */

  const exportJob = jobs.find((j) => j.id === exportJobId);
  const exporting = modal?.kind === "export" || exportJob?.status === "processing";

  const openExport = (count: number, scope: string) => {
    const jobId = startCompanyExport(count, scope);
    setExportJobId(jobId);
    setModal({ kind: "export", jobId, count });
  };

  const deleteSelected = () => {
    const count = selectedCount;
    if (selection.all) {
      if (!narrowed) {
        const kept = [...selection.ids.values()];
        removeAllCompanies();
        if (kept.length) addCompanies(kept);
      } else {
        removeCompanies(new Set(realCut.filter((c) => !selection.ids.has(c.id)).map((c) => c.id)));
      }
    } else {
      removeCompanies(new Set(selection.ids.keys()));
    }
    setModal(null);
    clearSelection();
    showToast(`${plural(count, "company", "companies")} deleted. Restore within 2 months.`);
  };

  const saveAsNew = (label: string) => {
    const made = createList({ label, ...cut });
    setActiveId(made.id);
    setModal(null);
    showToast(`List "${label}" created.`);
  };

  if (view === "bulk-actions") {
    return (
      <CrumbedScreen name="Bulk actions" onExit={() => setView(null)}>
        <BulkActionsPage />
      </CrumbedScreen>
    );
  }

  const sample = selectedCount > 0 ? selectedSample() : [];

  const selectionBar = (
    <div className="flex min-w-0 items-center gap-[8px]">
      <span className="flex h-[36px] shrink-0 items-center gap-[8px] rounded-[8px] bg-brand-soft pr-[6px] pl-[12px] text-[14px] leading-[20px] font-medium text-brand">
        {plural(selectedCount, "company", "companies")} selected
        <button
          type="button"
          aria-label="Clear selection"
          onClick={clearSelection}
          className="flex size-[24px] items-center justify-center rounded-[6px] motion-tap hover:bg-[color-mix(in_oklab,var(--brand)_14%,transparent)]"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </span>
      {!selection.all && selectedCount < total ? (
        <button
          type="button"
          onClick={() => setSelection({ all: true, ids: new Map() })}
          className="shrink-0 px-[4px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
        >
          Select all {formatCount(total)}
        </button>
      ) : null}
      <span aria-hidden="true" className="mx-[4px] h-[20px] w-px shrink-0 bg-[var(--pg-border)]" />
      {(
        [
          { label: "Export", icon: Upload, onClick: () => openExport(selectedCount, "Selected") },
          { label: "Trigger automation", icon: Zap, onClick: () => setModal({ kind: "automation" }) },
          { label: "Send email", icon: Mail, onClick: () => setModal({ kind: "email" }) },
        ] as const
      ).map((a) => (
        <OutlineButton key={a.label} onClick={a.onClick} className="h-[36px] px-[12px] text-[14px]">
          <a.icon size={15} aria-hidden="true" className="text-pg-text-strong" />
          {a.label}
        </OutlineButton>
      ))}
      <OutlineButton
        onClick={() => setModal({ kind: "delete" })}
        className="h-[36px] px-[12px] text-[14px] text-[var(--hr-error-600)]"
      >
        <Trash2 size={15} aria-hidden="true" />
        Delete
      </OutlineButton>
    </div>
  );

  const filterChips = (
    <div className="flex items-center gap-[8px]">
      <OutlineButton onClick={() => setDrawer({ kind: "filters" })} className="h-[36px] text-[14px]">
        <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
        Filters
        {filters.length ? (
          <span className="flex size-[18px] items-center justify-center rounded-full bg-brand text-[11px] leading-none font-semibold text-brand-fg">
            {filters.length}
          </span>
        ) : null}
      </OutlineButton>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={!!sortAnchor}
        onClick={(e) => setSortAnchor(sortAnchor ? null : e.currentTarget)}
        className={cn(
          "flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] px-[14px] text-[14px] leading-[20px] font-medium whitespace-nowrap motion-tap active:scale-[0.97]",
          sort
            ? "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_30%,transparent)]"
            : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
        )}
      >
        <ArrowUpDown size={15} aria-hidden="true" />
        {sort ? "Sort (1)" : "Sort"}
      </button>
    </div>
  );

  const unsavedButton = dirty ? (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={!!unsavedAnchor}
      onClick={(e) => setUnsavedAnchor(unsavedAnchor ? null : e.currentTarget)}
      className="flex h-[28px] shrink-0 items-center gap-[6px] rounded-[7px] bg-[color-mix(in_oklab,var(--hr-warning-500)_14%,var(--pg-surface))] px-[10px] text-[13px] leading-none font-semibold whitespace-nowrap text-[var(--hr-warning-700)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-warning-500)_40%,transparent)] motion-tap active:scale-[0.97]"
    >
      <Save size={14} aria-hidden="true" className="shrink-0 text-[var(--hr-warning-600)]" />
      Unsaved changes
      <ChevronDown size={13} aria-hidden="true" className="shrink-0" />
    </button>
  ) : undefined;

  /*
   * The page's controls described for the shared toolbar — the same state the
   * page's own row drives, so switching variants keeps every filter.
   */
  const toolbarModel: ListToolbarModel = {
    views: {
      items: lists.map((l) => ({ id: l.id, label: l.label, icon: List })),
      activeId: active.id,
      onSelect: pickList,
      onCreate: () => setModal({ kind: "list-name", mode: "create" }),
      noun: "list",
    },
    search: {
      value: search,
      onChange: (v) => {
        setSearch(v);
        resetView();
      },
      placeholder: "Search companies",
    },
    quickFilters: [
      {
        id: "type",
        label: "Type",
        options: COMPANY_TYPES.map((t) => ({ value: t, label: t })),
        value: typeFilter,
        multiple: true,
        onChange: (v) => {
          setTypeFilter(v);
          resetView();
        },
      },
    ],
    advanced: {
      count: filters.length,
      onOpen: () => setDrawer({ kind: "filters" }),
      onClear: () => setFilters([]),
      chips: filters.map((f) => ({
        id: f.id,
        label: [columnDef(f.field).label, f.operator.toLowerCase(), f.value]
          .filter(Boolean)
          .join(" "),
        onRemove: () => setFilters(filters.filter((x) => x.id !== f.id)),
      })),
    },
    sort: {
      fields: COLUMN_DEFS.map((c) => ({ value: c.id, label: c.label })),
      value: sort,
      onChange: (next) => setSort(next as CompanySort | null),
    },
    columns: {
      items: columns.map((c) => ({
        id: c.id,
        label: columnDef(c.id).label,
        visible: c.visible,
        locked: c.id === "name",
      })),
      onChange: (items) =>
        setCut((c) => ({
          ...c,
          columns: items.map((i) => ({ id: i.id as ColumnId, visible: i.locked || i.visible })),
        })),
    },
    resultCount: { value: total, noun: "companies" },
    trailing: unsavedButton,
  };

  const listContent =
    total === 0 ? (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[8px] rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <span className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          {narrowed ? "No companies match" : "No companies yet"}
        </span>
        <span className="text-[13px] leading-[18px] text-pg-muted">
          {narrowed ? "Try another search or remove a filter." : "Add your first company to get started."}
        </span>
        {narrowed ? (
          <OutlineButton
            onClick={() => {
              setSearch("");
              setTypeFilter([]);
              setFilters([]);
            }}
            className="mt-[4px] h-[36px] text-[14px]"
          >
            Clear filters
          </OutlineButton>
        ) : null}
      </div>
    ) : (
      <CompaniesTable
        rows={pageRows}
        columns={columns}
        sort={sort}
        onSort={setSort}
        isSelected={isSelected}
        onToggleRow={toggleRow}
        onTogglePage={togglePage}
        onOpen={(company) => setDrawer({ kind: "edit", company })}
      />
    );

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Companies"
        status={
          <span className="shrink-0 rounded-[6px] bg-brand-soft px-[8px] py-[2px] text-[13px] leading-[18px] font-medium whitespace-nowrap text-brand">
            {plural(virtualTotal(store), "company", "companies")}
          </span>
        }
        secondary={[{ label: "Import", icon: Download, onClick: () => setModal({ kind: "import" }) }]}
        primary={{ label: "Add company", icon: Plus, onClick: () => setDrawer({ kind: "add" }) }}
        overflow={[
          {
            label: "Export",
            icon: exporting ? Spinner : Upload,
            onClick: () => {
              if (exportJob?.status === "processing") {
                setModal({ kind: "export", jobId: exportJob.id, count: exportJob.records });
              } else openExport(total, active.label);
            },
          },
          { label: "Manage smart lists", icon: List, onClick: () => setDrawer({ kind: "lists" }) },
          { label: "Bulk actions", icon: Copy, onClick: () => setView("bulk-actions") },
        ]}
      />

      {shared ? (
        <div className="flex min-h-0 flex-1 flex-col gap-[14px]">
          {/*
            The selection bar has no home in the shared toolbar — it acts on
            rows, not on the list — so it keeps a row of its own above them.
          */}
          {selectedCount > 0 ? (
            <div className="flex min-h-[36px] shrink-0 items-center">{selectionBar}</div>
          ) : null}
          <ListToolbar model={toolbarModel}>{listContent}</ListToolbar>
        </div>
      ) : (
      <>
      <ViewBar
        label="Company lists"
        views={lists.map((l) => ({ id: l.id, label: l.label, icon: List }))}
        activeId={active.id}
        onSelect={pickList}
        onCreate={() => setModal({ kind: "list-name", mode: "create" })}
        createLabel="List"
        maxVisible={6}
        trailing={unsavedButton}
      />

      <div className="flex min-h-[36px] shrink-0 items-center gap-[10px]">
        {selectedCount > 0 ? selectionBar : filterChips}
        <span aria-hidden="true" className="min-w-[16px] flex-1" />
        <div
          className={cn(
            "flex h-[36px] shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
            selectedCount > 0 ? "w-[180px]" : "w-[240px]",
          )}
        >
          <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetView();
            }}
            placeholder="Search"
            aria-label="Search companies"
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
        <OutlineButton
          aria-label="Manage fields"
          title="Manage fields"
          onClick={() => setDrawer({ kind: "fields" })}
          className="h-[36px] w-[36px] justify-center px-0"
        >
          <Settings size={16} aria-hidden="true" className="text-pg-text-strong" />
        </OutlineButton>
      </div>

      {listContent}
      </>
      )}

      <div className="flex h-[36px] shrink-0 items-center justify-between pb-[4px]">
        <span className="text-[14px] leading-[20px] whitespace-nowrap text-pg-muted">
          Page {formatCount(current)} of {formatCount(pageCount)}
        </span>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            aria-label="Rows per page"
            aria-haspopup="listbox"
            aria-expanded={!!sizeAnchor}
            onClick={(e) => setSizeAnchor(sizeAnchor ? null : e.currentTarget)}
            className="flex h-[32px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
          >
            {pageSize}
            <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
          </button>
          <OutlineButton
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
            className="h-[32px] px-[10px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={15} aria-hidden="true" />
            Prev
          </OutlineButton>
          <PageBox key={`${current}-${pageCount}`} page={current} pageCount={pageCount} onGo={setPage} />
          <OutlineButton
            disabled={current >= pageCount}
            onClick={() => setPage(current + 1)}
            className="h-[32px] px-[10px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight size={15} aria-hidden="true" />
          </OutlineButton>
        </div>
      </div>

      {/* ─── Popovers ─────────────────────────────────────────────────── */}

      {sortAnchor ? (
        <Popover anchor={sortAnchor} onClose={() => setSortAnchor(null)} width={320} label="Sort">
          <SortPanel sort={sort} onChange={setSort} />
        </Popover>
      ) : null}

      {unsavedAnchor ? (
        <Popover
          anchor={unsavedAnchor}
          onClose={() => setUnsavedAnchor(null)}
          width={220}
          align="end"
          label="Unsaved changes"
        >
          <div role="menu" className="flex flex-col p-[4px]">
            {(
              [
                {
                  label: "Save changes",
                  icon: Save,
                  onClick: () => {
                    saveList(active.id, cut);
                    showToast(`"${active.label}" saved.`);
                  },
                },
                {
                  label: "Save as new list",
                  icon: Plus,
                  onClick: () => setModal({ kind: "list-name", mode: "save-as" }),
                },
                {
                  label: "Discard changes",
                  icon: Undo2,
                  onClick: () => {
                    setCut(cutOf(active));
                    resetView();
                  },
                },
              ] as const
            ).map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setUnsavedAnchor(null);
                  item.onClick();
                }}
                className="flex items-center gap-[10px] rounded-[6px] px-[10px] py-[8px] text-left text-[14px] leading-[20px] text-pg-text motion-tap hover:bg-pg"
              >
                <item.icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
                {item.label}
              </button>
            ))}
          </div>
        </Popover>
      ) : null}

      {sizeAnchor ? (
        <Popover anchor={sizeAnchor} onClose={() => setSizeAnchor(null)} width={120} align="end" label="Rows per page">
          <OptionList
            value={String(pageSize)}
            options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
            onPick={(v) => {
              setPageSize(Number(v));
              setPage(1);
              setSizeAnchor(null);
            }}
          />
        </Popover>
      ) : null}

      {/* ─── Drawers ──────────────────────────────────────────────────── */}

      {drawer?.kind === "add" ? <CompanyDrawer company={null} onClose={() => setDrawer(null)} /> : null}
      {drawer?.kind === "edit" ? (
        <CompanyDrawer key={drawer.company.id} company={drawer.company} onClose={() => setDrawer(null)} />
      ) : null}
      {drawer?.kind === "filters" ? (
        <CompanyFiltersDrawer applied={filters} onApply={setFilters} onClose={() => setDrawer(null)} />
      ) : null}
      {drawer?.kind === "fields" ? (
        <ManageFieldsDrawer
          columns={columns}
          onApply={(next) => setCut((c) => ({ ...c, columns: next }))}
          onClose={() => setDrawer(null)}
        />
      ) : null}
      {drawer?.kind === "lists" ? (
        <ManageListsDrawer
          lists={lists}
          onClose={() => setDrawer(null)}
          onDeleted={(id) => {
            if (id === active.id) pickList("all");
          }}
        />
      ) : null}
      {drawer?.kind === "compose" ? (
        <ComposeEmailDrawer
          count={drawer.count}
          onClose={() => setDrawer(null)}
          onSent={() => {
            setDrawer(null);
            clearSelection();
          }}
        />
      ) : null}

      {/* ─── Modals ───────────────────────────────────────────────────── */}

      {modal?.kind === "export" ? (
        <ExportProgressModal jobId={modal.jobId} count={modal.count} onClose={() => setModal(null)} />
      ) : null}
      {modal?.kind === "import" ? <ImportCompaniesModal onClose={() => setModal(null)} /> : null}
      {modal?.kind === "automation" ? (
        <AddToAutomationModal
          rows={sample}
          count={selectedCount}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            clearSelection();
          }}
        />
      ) : null}
      {modal?.kind === "email" ? (
        <ConfirmRecipientsModal
          rows={sample}
          count={selectedCount}
          onClose={() => setModal(null)}
          onProceed={() => {
            setModal(null);
            setDrawer({ kind: "compose", count: selectedCount });
          }}
        />
      ) : null}
      {modal?.kind === "delete" ? (
        <BulkDeleteModal
          rows={sample}
          count={selectedCount}
          onClose={() => setModal(null)}
          onConfirm={deleteSelected}
        />
      ) : null}
      {modal?.kind === "list-name" ? (
        <ListNameModal
          title={modal.mode === "create" ? "Create list" : "Save as new list"}
          confirmLabel="Create list"
          onClose={() => setModal(null)}
          onSave={saveAsNew}
        />
      ) : null}
    </div>
  );
}

/** The current-page box: type a page and press Enter. */
function PageBox({
  page,
  pageCount,
  onGo,
}: {
  page: number;
  pageCount: number;
  onGo: (page: number) => void;
}) {
  const [draft, setDraft] = React.useState(String(page));
  const commit = () => {
    const n = Math.round(Number(draft));
    if (Number.isFinite(n) && n >= 1 && n <= pageCount && n !== page) onGo(n);
    else setDraft(String(page));
  };
  return (
    <input
      aria-label={`Page ${page} of ${pageCount}`}
      inputMode="numeric"
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      style={{ width: Math.max(40, String(pageCount).length * 9 + 20) }}
      className="h-[32px] rounded-[8px] bg-pg-surface text-center text-[14px] leading-[20px] font-medium tabular-nums text-pg-heading shadow-[inset_0_0_0_1px_var(--brand)] focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
    />
  );
}
