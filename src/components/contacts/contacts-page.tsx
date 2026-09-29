"use client";

import * as React from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  List,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { showToast, Toaster } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  PrimaryButton,
} from "@/components/page/page-header";
import { usePageCrumb } from "@/components/page/page-crumb";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { ViewBar } from "@/components/page/view-bar";
import {
  CollapsingSearch,
  GlyphButton,
  UnsavedChanges,
  useListShape,
} from "@/components/page/list-shape";
import {
  ListToolbar,
  useListToolbar,
  type ListToolbarModel,
} from "@/components/page/list-toolbar";
import { cn } from "@/lib/utils";
import { contactsAreaLabel, useContactsArea } from "./contacts-area";
import {
  contacts as seedContacts,
  STATUS_LABELS,
  type Contact,
  type ContactStatus,
} from "./contacts-data";
import { ContactsTable } from "./contacts-table";
import { AddContactDrawer, ManageFieldsDrawer } from "./contact-drawers";
import { ContactDetail } from "./contact-detail";
import { addList, useSmartLists, type ManagedList } from "./smart-lists-store";
import { AddSmartListDrawer } from "./smart-list-drawer";
import {
  applyFilters,
  describeCondition,
  isComplete,
  type FilterGroup,
} from "./contact-filters";
import { FiltersDrawer } from "./filters-drawer";
import {
  SORT_FIELDS,
  sortContacts,
  SortPopover,
  type ContactSort,
} from "./sort-popover";
import { ImportHub } from "./import-hub";
import { ImportWizard } from "./import-wizard";
import { BulkActionsPage } from "./bulk-actions-page";
import { ExportFlow } from "./export-flow";
import { trashContacts } from "./deleted-contacts";
import { RestoreContactsPage } from "./restore-contacts";
import { ManageSmartListsPage } from "./manage-smart-lists";
import { FindDuplicatesModal, ManageDuplicatesPage } from "./manage-duplicates";
import { ContactSettingsPage } from "./settings/contact-settings";
import { CustomFieldsPage } from "@/components/custom-fields/custom-fields-page";
import { TasksPage } from "@/components/tasks/tasks-page";
import { CompaniesPage } from "@/components/companies/companies-page";

/**
 * The screens that replace the list without leaving the Contacts area.
 *
 * In-page state rather than routes, like an open record: each publishes its
 * own crumb, so the trail is the way back out.
 */
type ContactsView =
  | "import-hub"
  | "import-wizard"
  | "restore"
  | "duplicates"
  | "bulk-actions"
  | "manage-lists"
  | "settings"
  | null;

/**
 * Bulk actions and Manage smart lists reached from INSIDE the page — Check
 * progress, the kebab — rather than from the area menu.
 *
 * They get a crumb of their own, like Import and Restore, because the trail
 * above them is not always the area menu: in the product tree the tail is
 * the nav's own "Smart lists" row, which knows nothing of these two, and
 * switching the area page underneath it left the trail naming a page you
 * were no longer on.
 */
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

type DuplicateRule = "email" | "phone" | "name";

/**
 * The toaster rides beside the page rather than inside it, so a toast fired
 * from any of the sub-screens below — which each return their own tree —
 * still has somewhere to land.
 */
export function ContactsPage() {
  return (
    <>
      <ContactsPageBody />
      <Toaster />
    </>
  );
}

/** A cut's identity, for comparing the live one against the saved one. */
const cutKey = (sort: ContactSort | null, filters: FilterGroup[]) =>
  JSON.stringify({ sort, filters });

/**
 * The Contacts page from the ContactsApp component in left-nav.pen.
 *
 * Layout: 24px padding with 14px between blocks — header, smart-list chip rail,
 * toolbar, table (flexible), pagination — and the selection bar floating 24px
 * from the bottom, horizontally centred.
 *
 * Every colour comes from the --pg-* tokens, and every blue routes through
 * --brand-*, so the page follows both the page theme and the accent.
 */
function ContactsPageBody() {
  const { effective } = useTheme();
  const appTheme = effective.appTheme;
  const [rows, setRows] = React.useState(seedContacts);
  const smartLists = useSmartLists();
  const [activeListRaw, setActiveList] = React.useState("all");
  /*
   * A list deleted in Manage smart lists while it was lit falls back to All,
   * rather than leaving the page cut by a list that no longer exists.
   */
  const activeList = smartLists.some((l) => l.id === activeListRaw)
    ? activeListRaw
    : "all";
  const [view, setView] = React.useState<ContactsView>(null);
  const [dupRule, setDupRule] = React.useState<DuplicateRule>("email");
  const [modal, setModal] = React.useState<
    { kind: "export"; scope: "all" | "selected" } | { kind: "duplicates" } | null
  >(null);
  const [sortOpen, setSortOpen] = React.useState(false);
  /*
   * Read, not written, here any more.
   *
   * The title used to be this page's navigator — a dropdown over the same five
   * destinations the app bar's tab strip once held. The breadcrumb's last crumb
   * now owns that move, so what is left is a heading that names whichever area
   * page the trail put you on. One switch, one place, and the title can no
   * longer disagree with the trail about where you are.
   */
  const [pageId, setPageId] = useContactsArea();
  /*
   * One record, ONE depth, as of Sep 23.
   *
   * There used to be two: a row click opened a peek panel beside the list, and
   * the peek's last control was "Open full page". Two destinations for one
   * gesture is the thing the header axis spent a week deleting everywhere
   * else, and it was worse here than in the chrome — the peek showed a strict
   * subset of the record page (owner, email, phone, created, last activity,
   * tags, opportunities) so the second click was never a choice, just a toll.
   * The row goes to the record now, and ContactPeek is left in the tree
   * unreferenced rather than deleted: it is the only drawing of the
   * peek-beside-the-list pattern this prototype has, and the pattern may yet
   * be wanted for a surface that genuinely cannot navigate away.
   *
   * `openId` is still the record the list is pointed at, which is what keeps
   * the record page's ‹ › pager walking the cut you came from rather than the
   * whole table.
   */
  const [openId, setOpenId] = React.useState<string | null>(null);
  /*
   * One slot for whatever came in from the right.
   *
   * A peeked record, the add form and the field picker are the same object in
   * the same place, so they take turns rather than stacking — opening one
   * closes the last, which is the only behaviour that keeps a single drawer
   * honest.
   */
  const [drawer, setDrawer] = React.useState<
    "add" | "fields" | "filters" | null
  >(null);

  /*
   * The live cut, and the cut this smart list was SAVED with.
   *
   * Two pieces of state rather than a `dirty` flag, because a flag has to be
   * set by hand from every control that could dirty the view and is therefore
   * wrong the first time someone adds a control and forgets. Holding the saved
   * cut next to the live one makes "unsaved changes" a comparison, which
   * cannot drift: Discard copies saved over live, Save-as-new copies live over
   * saved, and neither has to know what the other controls do.
   *
   * It opens dirty on purpose — sorted A–Z over a list saved in the table's
   * own order — because the amber button is the part of this row under review
   * and a row that only shows it after you fiddle is a row nobody screenshots.
   */
  const [sort, setSort] = React.useState<ContactSort | null>({
    field: "name",
    dir: "asc",
  });
  const [filters, setFilters] = React.useState<FilterGroup[]>([]);
  const [savedCut, setSavedCut] = React.useState<{
    sort: ContactSort | null;
    filters: FilterGroup[];
  }>({ sort: null, filters: [] });
  const filterCount = filters.length;
  /*
   * Search, the Status quick filter and hidden columns: what works INSIDE the
   * cut. None of them is part of the smart list's saved definition, so none
   * of them dirties the view. Held here rather than in the toolbar so they
   * survive switching between the page's own row and the shared toolbar.
   */
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [hiddenCols, setHiddenCols] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const narrowed =
    filterCount > 0 || query.trim() !== "" || statusFilter.length > 0;
  const dirty = cutKey(sort, filters) !== cutKey(savedCut.sort, savedCut.filters);

  /*
   * Switching lists is not an edit to the list you are leaving.
   *
   * So the live cut and the saved cut both reset, and the amber button goes
   * away — rather than following you to the next list still claiming there is
   * something unsaved about it, which would make the one warning colour on the
   * page mean "you have been here a while".
   */
  const pickList = (id: string) => {
    /*
     * A list opens in the cut it was saved with, which is also its saved
     * cut — so a list made by "Save as new smart list" opens clean, with its
     * filters and sort already on.
     */
    const list = smartLists.find((l) => l.id === id);
    setActiveList(id);
    setSort(list?.sort ?? null);
    setFilters(list?.filters ?? []);
    setSavedCut({ sort: list?.sort ?? null, filters: list?.filters ?? [] });
  };

  /*
   * The chips actually re-cut the rows.
   *
   * A view bar whose chips only change a label is the thing the tenets warn
   * about — it teaches people that tabs here do not mean anything. The cuts
   * are deterministic rather than random so a list holds still between
   * visits, and one of them lands on three rows on purpose: the narrow,
   * nearly-empty saved list is the case a table has to survive.
   */
  const activeCut =
    smartLists.find((l) => l.id === activeList)?.cutOf ?? "all";
  const visible = React.useMemo(() => {
    const cut = (() => {
      switch (activeCut) {
        case "inquiries":
          return rows.filter((c) => c.status === "inquiry");
        case "subscribed":
          return rows.filter((c) => c.status === "subscribed");
        case "hot-leads":
          return rows.filter((_, i) => i % 5 === 0);
        case "no-email":
          return rows.filter((c) => !c.email).slice(0, 3);
        default:
          return rows;
      }
    })();
    /*
     * The sort is applied to the rows, not merely counted on the button.
     *
     * The `(1)` badge on Sort is the only evidence in the row that the list is
     * not in its saved order, and it is also — via `dirty` below — the reason
     * the amber "Unsaved changes" button is on screen at load. A badge that
     * reordered nothing would have made both of those props, and the whole
     * point of drawing the unsaved state is to see what it costs when it is
     * real.
     */
    const q = query.trim().toLowerCase();
    const found = cut.filter(
      (c) =>
        (statusFilter.length === 0 || statusFilter.includes(c.status)) &&
        (!q ||
          [c.name, c.email, c.handle].some((v) => v?.toLowerCase().includes(q))),
    );
    return sortContacts(applyFilters(found, filters), sort);
  }, [activeCut, rows, filters, sort, query, statusFilter]);

  /*
   * Prev/next walk the cut on screen, not the whole table. Paging out of the
   * list you are looking at would be the panel disagreeing with the page
   * behind it, and the page is the one telling the truth.
   */
  const openIndex = visible.findIndex((c) => c.id === openId);
  const openContact = openIndex === -1 ? null : visible[openIndex];
  const step = (delta: number) => {
    const next = visible[openIndex + delta];
    if (next) setOpenId(next.id);
  };

  const toggleRow = (id: string) =>
    setRows((current) =>
      current.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)),
    );

  const selectedCount = rows.filter((c) => c.selected).length;
  const active = smartLists.find((l) => l.id === activeList);
  const activeLabel = active?.label ?? "All contacts";
  const activeCount =
    activeList === "all" && !narrowed
      ? "1,469"
      : visible.length.toLocaleString("en-US");
  const selectedRows = rows.filter((c) => c.selected);

  /* ─── Flow entry points ─────────────────────────────────────────────── */

  /** Every sub-screen replaces the list, so it closes whatever sat on it. */
  const openView = (next: ContactsView) => {
    setOpenId(null);
    setDrawer(null);
    setSortOpen(false);
    setView(next);
  };
  const openBulkActions = () => {
    setModal(null);
    openView("bulk-actions");
  };
  const openExport = (scope: "all" | "selected") =>
    setModal({ kind: "export", scope });
  const deleteSelected = () => {
    const doomed = rows.filter((c) => c.selected);
    if (doomed.length === 0) return;
    trashContacts(doomed.map((c) => ({ ...c, selected: false })));
    setRows((current) => current.filter((c) => !c.selected));
    showToast(
      doomed.length === 1
        ? "1 contact deleted. Restore it from Restore contacts."
        : `${doomed.length} contacts deleted. Restore them from Restore contacts.`,
    );
  };
  const addContacts = (incoming: Contact[]) =>
    setRows((current) => [
      ...incoming.filter((c) => !current.some((r) => r.id === c.id)),
      ...current,
    ]);
  const [creatingList, setCreatingList] = React.useState<{
    filters: FilterGroup[];
    sort: ContactSort | null;
  } | null>(null);
  const createList = (list: {
    label: string;
    filters: FilterGroup[];
    sort: ContactSort | null;
  }) => {
    const made = addList(list.label, activeCut, String(visible.length), {
      filters: list.filters,
      sort: list.sort,
    });
    setCreatingList(null);
    setActiveList(made.id);
    setSort(list.sort);
    setFilters(list.filters);
    setSavedCut({ sort: list.sort, filters: list.filters });
    showToast(`Smart list "${list.label}" created.`);
  };

  /*
   * Which shape of header this page is wearing (Sep 22 variants).
   *
   * Read through useListShape now rather than derived here, which is the
   * inversion of how this started: page/list-shape.tsx was lifted OUT of this
   * file in September precisely so Workflows and Appointments could stop
   * re-deriving it, and then this file went on deriving its own copy anyway.
   * That held while the axis had four ids and broke the day it had L-F — the
   * hook grew `oneRow` and the three lines below could not have.
   *
   * The four page-header knobs are already written for us when a variant is
   * picked, so the title, description and count need nothing here. What is
   * left is the part a boolean cannot say: WHERE the saved-list scope lives
   * once the title stops naming the page — a picker on the merged row (L-B),
   * the last crumb in the trail (L-E), or the tab strip it has always been
   * (L-D, and L-F with the filter row folded into it).
   */
  const shape = useListShape();
  const { mergedRow, scopeInTrail, oneRow, showViews, showFilters } = shape;
  /*
   * The shared list toolbar (prototype controls ▸ List toolbar). When it is
   * on, it owns the views, the filters and the search, so none of the page's
   * own placements below draw — not the tabs, not the merged row, not the
   * trail's crumb, not the glyph cluster.
   */
  const { shared } = useListToolbar();

  /*
   * Handed to the shell, which owns the bar. Published unconditionally in
   * L-E — including while a record is open, where the trail then reads
   * Contacts ▸ Smart lists ▸ Hot leads ▸ Priya Raman and every level of it
   * still moves.
   *
   * `showViews` is the second half of the condition, and it reaches up into
   * the bar deliberately. L-E's scope control is not a tab strip, it is the
   * trail's last crumb — so a `listShowViews: false` that only deleted tabs
   * would leave this variant with its saved views fully switchable, which is
   * the one knob doing nothing on the one variant. Un-published, the trail
   * stops at Contacts and the lit cut is simply the cut you get.
   */
  const listArea = pageId !== "bulk-actions" && pageId !== "manage";
  usePageCrumb(
    scopeInTrail && showViews && listArea && view === null && !shared
      ? {
          label: activeLabel,
          options: smartLists.map((list) => ({
            id: list.id,
            label: list.label,
            icon: list.icon,
            selected: list.id === activeList,
          })),
          onSelect: pickList,
        }
      : null,
  );

  const openFields = () => {
    setOpenId(null);
    setDrawer("fields");
  };

  /*
   * The four controls, built once as named pieces rather than as one fragment.
   *
   * They used to be a single `controls` fragment in a fixed order, which was
   * right while every variant wanted the same order and only disagreed about
   * which row it sat on. L-D broke that on Sep 23: the live product splits the
   * filter row in two — what CUTS the list on the left, what FINDS inside the
   * cut on the right — and a fragment cannot be split down the middle by the
   * page that renders it. Named pieces can be, and L-B and L-E go on
   * composing them in the old order, so the split costs those two nothing.
   */
  const filtersButton = (
    <OutlineButton
      /*
       * Opens the filter builder. What it applies is half of what makes the
       * view dirty, and the badge counts the groups that survived Apply.
       */
      onClick={() => {
        setOpenId(null);
        setDrawer("filters");
      }}
    >
      <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
      Filters
      {filterCount ? (
        <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-[normal] font-semibold tabular-nums text-brand-fg">
          {filterCount}
        </span>
      ) : null}
    </OutlineButton>
  );

  const sortPopover = sortOpen ? (
    <SortPopover
      sort={sort}
      onChange={setSort}
      onClose={() => setSortOpen(false)}
    />
  ) : null;

  const sortButton = (
    <div className="relative shrink-0">
      <OutlineButton
        aria-haspopup="dialog"
        aria-expanded={sortOpen}
        onClick={() => setSortOpen((v) => !v)}
      >
        <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
        Sort
        {sort ? (
          <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-[normal] font-semibold tabular-nums text-brand-fg">
            1
          </span>
        ) : null}
      </OutlineButton>
      {sortPopover}
    </div>
  );

  const manageFieldsButton = (
    <OutlineButton onClick={openFields}>
      <Settings size={15} aria-hidden="true" className="text-pg-text-strong" />
      Manage fields
    </OutlineButton>
  );

  /*
   * `grow` is the difference between the two rows this field lives on.
   *
   * On its own row under the header (L-D) it is a fixed 260px pinned to the
   * right, beside Manage fields, because the live product puts it there and
   * because a search that eats the whole row reads as the row's subject when
   * the row's subject is the filters. Merged into the header's row (L-B) or
   * into the canvas toolbar (L-E) it takes the slack instead — those rows end
   * in buttons that must hold the right edge, and something has to give.
   */
  const searchField = (grow: boolean) => (
    <div
      className={cn(
        "flex h-[34px] items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        grow ? "min-w-0 flex-1" : "w-[260px] shrink-0",
      )}
    >
      <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={grow ? "Search by name, email, or phone" : "Search Contacts"}
        aria-label="Search contacts"
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
      />
    </div>
  );

  /*
   * The old order, for the two variants that never asked for a new one.
   *
   * L-B pulls this into the header's row and L-E drops it into the canvas
   * toolbar; both want one run of controls with the search taking the slack,
   * which is exactly what they had before the L-D row was split. Keeping the
   * fragment means neither variant is re-designed by a change that was about
   * a third one.
   */
  const controls = (
    <>
      {searchField(true)}
      {filtersButton}
      {sortButton}
      {manageFieldsButton}
    </>
  );

  /*
   * The same four controls with their labels sold off — L-F, and only L-F.
   *
   * The mapping is one-to-one with the labelled row above and deliberately
   * introduces nothing: Filters, Sort (keeping its count, which is the one
   * thing a glyph cannot say) and Manage fields become 34px squares, and the
   * search becomes the magnifier it already starts with. Four controls, four
   * glyphs. A fifth invented for the cluster would have made L-F a different
   * page rather than the same page one row shorter, and the comparison the
   * variant exists for would be worthless.
   */
  const glyphControls = (
    <>
      <GlyphButton
        icon={ListFilter}
        label="Filters"
        count={filterCount}
        onClick={() => {
          setOpenId(null);
          setDrawer("filters");
        }}
      />
      <span className="relative shrink-0">
        <GlyphButton
          icon={ArrowUpDown}
          label="Sort"
          count={sort ? 1 : 0}
          onClick={() => setSortOpen((v) => !v)}
        />
        {sortPopover}
      </span>
      <GlyphButton icon={Settings} label="Manage fields" onClick={openFields} />
      <CollapsingSearch placeholder="Search Contacts" label="Search contacts" />
    </>
  );

  /*
   * The amber button, built once and placed by the variant.
   *
   * Absent when the live cut and the saved cut agree, rather than disabled: a
   * greyed-out "Unsaved changes" would be a row permanently warning you about
   * nothing, and the row is already the most crowded 38px in the product.
   *
   * It goes with the filters (Sep 23), because it is a report ON them. With
   * `listShowFilters` off there is no Filters button and no Sort button, so
   * the only thing the amber chip could say is "the cut on screen is not the
   * one on disk, and nothing on this page put it there" — and its Discard
   * would then silently reorder the table with nothing visible to explain
   * why. The page opens dirty on purpose (see `sort`), so this is the
   * normal case rather than an edge: filters off means the list is a fixed
   * cut, and a fixed cut has no unsaved state to warn about.
   */
  const unsavedChanges = (
    <UnsavedChanges
      onSaveAsNew={() => {
        setOpenId(null);
        setDrawer(null);
        setCreatingList({ filters, sort });
      }}
      onDiscard={() => {
        setSort(savedCut.sort);
        setFilters(savedCut.filters);
      }}
    />
  );
  const unsaved = dirty && showFilters ? unsavedChanges : null;

  const openAdd = () => {
    setOpenId(null);
    setDrawer("add");
  };

  /*
   * Custom fields is the interesting one: it is configuration, so its one
   * home is Settings. It stays reachable from here because this is where
   * you think of it — a link to the canonical page, not a second copy of
   * it living on a tab.
   */
  const overflowActions = [
    { label: "Export", icon: Upload, onClick: () => openExport("all") },
    { label: "Restore", icon: RefreshCw, onClick: () => openView("restore") },
    {
      label: "Manage smart lists",
      icon: List,
      onClick: () => openView("manage-lists"),
    },
    {
      label: "Manage duplicates",
      icon: Copy,
      onClick: () => setModal({ kind: "duplicates" }),
    },
    {
      label: "Contact settings",
      icon: Settings,
      onClick: () => openView("settings"),
    },
  ];

  /*
   * With no header at all, the actions would go with it — and a contacts page
   * you cannot add a contact from is not a variant, it is a broken page. They
   * ride the in-canvas toolbar instead, on its right edge, which is the edge
   * they held when there was a header.
   *
   * Which is also why the toolbar survives `listShowFilters: false` with only
   * the actions on it. The row is not the filter row wearing a different
   * position — under L-E it is the only chrome the page has left, and the
   * spacer that replaces the controls is what keeps Add contact on the right
   * edge it holds in every other variant rather than sliding to the left.
   */
  const canvasToolbar = scopeInTrail ? (
    <>
      {showFilters && !shared ? (
        controls
      ) : (
        <span aria-hidden="true" className="min-w-[16px] flex-1" />
      )}
      <OutlineButton onClick={() => openView("import-hub")}>
        <Download size={15} aria-hidden="true" className="text-pg-text-strong" />
        Import
      </OutlineButton>
      <PrimaryButton onClick={openAdd}>
        <Plus size={16} aria-hidden="true" />
        Add contact
      </PrimaryButton>
      <OverflowMenu items={overflowActions} />
    </>
  ) : null;

  /*
   * The page's controls described for the shared toolbar. Every slice points
   * at the same state the page's own row uses, so a filter set in one
   * variant is still set in the next.
   */
  const removeCondition = (id: string) =>
    setFilters((groups) =>
      groups
        .map((g) => ({ ...g, conditions: g.conditions.filter((c) => c.id !== id) }))
        .filter((g) => g.conditions.length > 0),
    );
  const appliedConditions = filters.flatMap((g) => g.conditions.filter(isComplete));
  const toolbarColumns = [
    { id: "name", label: "Name", locked: true },
    { id: "email", label: "Email" },
    { id: "created", label: "Created" },
    { id: "activity", label: "Last activity" },
    { id: "status", label: "Status" },
  ];
  const toolbarModel: ListToolbarModel = {
    views: {
      items: smartLists.map((l) => ({
        id: l.id,
        label: l.label,
        count: l.count,
        icon: l.icon,
      })),
      activeId: activeList,
      onSelect: pickList,
      onCreate: () => {
        setOpenId(null);
        setDrawer(null);
        setCreatingList({ filters: [], sort: null });
      },
      noun: "smart list",
    },
    search: {
      value: query,
      onChange: setQuery,
      placeholder: "Search by name, email, or handle",
    },
    quickFilters: [
      {
        id: "status",
        label: "Status",
        options: (Object.keys(STATUS_LABELS) as ContactStatus[]).map((v) => ({
          value: v,
          label: STATUS_LABELS[v],
        })),
        value: statusFilter,
        multiple: true,
        onChange: setStatusFilter,
      },
    ],
    advanced: {
      count: appliedConditions.length,
      onOpen: () => {
        setOpenId(null);
        setDrawer("filters");
      },
      onClear: () => setFilters([]),
      chips: appliedConditions.map((c) => ({
        id: c.id,
        label: describeCondition(c),
        onRemove: () => removeCondition(c.id),
      })),
    },
    sort: {
      fields: SORT_FIELDS,
      value: sort,
      onChange: (next) => setSort(next as ContactSort | null),
    },
    columns: {
      items: toolbarColumns.map((c) => ({ ...c, visible: !hiddenCols.has(c.id) })),
      onChange: (items) =>
        setHiddenCols(
          new Set(items.filter((c) => !c.visible && !c.locked).map((c) => c.id)),
        ),
    },
    resultCount: { value: visible.length, noun: "contacts" },
    /*
     * The amber button reports on the lit view, so it rides with the views
     * rather than being lost when the page's tab strip steps aside.
     */
    trailing: dirty ? unsavedChanges : undefined,
  };

  /*
   * A record is open, so the record is what this component renders.
   *
   * The condition used to be `full && openContact` — the second half of the
   * two-step. With the peek gone there is no other thing `openId` could mean,
   * and the guard collapses to "is one open". `onBack` clears it rather than
   * dropping to a lesser view, which is the same one-destination rule read
   * backwards: one gesture in, one gesture out.
   */
  /*
   * Two of the area's pages are pages of their own rather than titles over
   * this list — Bulk actions, Custom fields, Tasks and Companies.
   */
  if (pageId === "bulk-actions") return <BulkActionsPage />;
  if (pageId === "custom-fields") return <CustomFieldsPage initialObject="contact" />;
  if (pageId === "tasks") return <TasksPage initialView="all" />;
  if (pageId === "companies") return <CompaniesPage initialList="all" />;
  if (pageId === "manage") {
    return <ManageSmartListsPage onBack={() => setPageId("smart-lists")} />;
  }

  if (view === "bulk-actions") {
    return (
      <CrumbedScreen name="Bulk actions" onExit={() => setView(null)}>
        <BulkActionsPage />
      </CrumbedScreen>
    );
  }
  if (view === "manage-lists") {
    return (
      <CrumbedScreen name="Manage smart lists" onExit={() => setView(null)}>
        <ManageSmartListsPage onBack={() => setView(null)} />
      </CrumbedScreen>
    );
  }
  if (view === "settings") {
    return <ContactSettingsPage onExit={() => setView(null)} />;
  }
  if (view === "import-hub") {
    return (
      <ImportHub
        onClose={() => setView(null)}
        onStartCsv={() => setView("import-wizard")}
      />
    );
  }
  if (view === "import-wizard") {
    return (
      <ImportWizard
        onExit={() => setView(null)}
        onBack={() => setView("import-hub")}
        onOpenBulkActions={openBulkActions}
        onImported={addContacts}
      />
    );
  }
  if (view === "restore") {
    return (
      <RestoreContactsPage
        onExit={() => setView(null)}
        onRestored={addContacts}
      />
    );
  }
  if (view === "duplicates") {
    return (
      <ManageDuplicatesPage
        rule={dupRule}
        onExit={() => setView(null)}
        onChangeRule={setDupRule}
      />
    );
  }

  if (openContact) {
    return (
      <ContactDetail
        contact={openContact}
        onBack={() => setOpenId(null)}
        onPrev={openIndex > 0 ? () => step(-1) : undefined}
        onNext={openIndex < visible.length - 1 ? () => step(1) : undefined}
        position={`${openIndex + 1} of ${visible.length}`}
        /*
          The lit cut, not the account. `visible` is what the pager steps
          through, so the crumb's menu and the arrows agree about what "next"
          means — two controls over one set rather than two sets.
        */
        siblings={visible.map((c) => ({ id: c.id, name: c.name }))}
        onOpenSibling={setOpenId}
        onDelete={() => {
          trashContacts([{ ...openContact, selected: false }]);
          setRows((current) => current.filter((c) => c.id !== openContact.id));
          setOpenId(null);
          showToast(`${openContact.name} deleted. Restore it within 60 days.`);
        }}
      />
    );
  }

  return (
    <div
      data-page-theme={appTheme}
      // No fill: the canvas paints nothing either, so content sits directly on
      // the shell plane and the rows bring their own surface. Horizontal inset
      // only — the canvas's own margin is the whole vertical one — and it comes
      // from --page-inset, which the app bar above reads too so the two agree.
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title={contactsAreaLabel(pageId)}
        /*
         * On the merged row the picker states the scope AND its size, so the
         * header does not also hang a count off a title that is not there —
         * two counts for one collection is exactly the repetition the variant
         * was drawn to remove.
         */
        count={mergedRow && !shared ? undefined : activeCount}
        description="People and companies in this account"
        /*
         * L-B's merged row, assembled from whichever of the two bands are on.
         *
         * The variant's claim is that the header's row can carry the scope
         * and the filters instead of repeating the trail's last crumb, and
         * each switch simply removes its half of that claim — picker only, or
         * filters only. With both off the lead is undefined and the row is
         * the actions alone, held to the right edge. That is a thin row and
         * it is the honest result: L-B does not ADD a row, it fills one that
         * PageHeader was drawing anyway, so switching off everything it
         * merged in leaves the header it merged them into.
         */
        lead={
          mergedRow && (showViews || showFilters) && !shared ? (
            <>
              {showViews ? (
              <SmartListPicker
                smartLists={smartLists}
                activeId={activeList}
                onSelect={pickList}
                onCreate={() => {
                  setOpenId(null);
                  setDrawer(null);
                  setCreatingList({ filters: [], sort: null });
                }}
                /*
                 * The raw knob, not usePageChrome's count.
                 *
                 * That hook makes the count depend on the title, because in
                 * slot 05 the count hangs off the title and has nothing to
                 * attach to without one. Here it attaches to the picker, which
                 * is present — so the dependency does not apply, and the knob
                 * keeps doing something on the one variant that has no title.
                 */
                showCount={effective.pageHeader && effective.pageCount}
              />
              ) : null}
              {showFilters ? controls : null}
            </>
          ) : undefined
        }
        secondary={[
          {
            label: "Import",
            icon: Download,
            onClick: () => openView("import-hub"),
          },
        ]}
        primary={{
          label: "Add contact",
          icon: Plus,
          onClick: openAdd,
        }}
        overflow={overflowActions}
      />

      {/*
        The tab strip is the scope control of last resort: it is here when the
        scope has nowhere better to be. Once the row carries a picker (L-B) or
        the trail's tail does (L-E), a row of tabs saying the same thing a
        third time is the duplication under review.

        L-F keeps the strip exactly where L-D has it and makes it 46px, which
        is the whole of what the variant changes about slot 06: the tabs never
        moved, the row UNDER them was deleted and its contents pushed onto this
        row's right edge. 46 rather than 38 because the controls it inherits
        are 34px tall and a 2px indicator needs somewhere to sit under them.
        With the filters switched off there is nothing to inherit, so the
        strip is back at 38px and L-F is L-D — see the oneRow note in
        list-shape.tsx.

        `scopeInTabs` folds `listShowViews` in, so the strip also goes when
        the collection is told not to offer its cuts at all.
      */}
      {shape.scopeInTabs && !shared ? (
        <ViewBar
          label="Smart lists"
          views={smartLists}
          activeId={activeList}
          onSelect={pickList}
          onCreate={() => {
            setOpenId(null);
            setDrawer(null);
            setCreatingList({ filters: [], sort: null });
          }}
          createLabel="Add Smart List"
          /*
            Four tabs and `1 more` on its own row; three and `2 more` when the
            row is also carrying the filters.

            Not a fit measured at runtime — see the note on the prop. Four is
            what the account this was drawn from shows at a normal width, and
            pinning it means the overflow chip is in every screenshot of L-D
            rather than only in the ones taken on a small laptop. L-F gets one
            fewer because it is paying for the glyph cluster out of the same
            1160px, and the alternative is a fourth tab truncated to two
            syllables — which reads as a bug rather than as the cost the
            variant is asking to be judged on. The budget moving with the
            variant IS the finding: a row cannot hold both, and this is the
            exchange rate.
          */
          maxVisible={oneRow ? 3 : 4}
          className={oneRow ? "h-[46px]" : undefined}
          trailing={
            oneRow ? (
              <>
                {/*
                  The glyph cluster, then the amber button — and the amber
                  button is the one thing on this row that did NOT give up its
                  label.

                  That is the trade L-F is here to be judged on, made
                  deliberately and in the one direction that survives being
                  argued about. The row cannot carry four labelled controls and
                  a warning; something loses its words. Filters, Sort and
                  Manage fields are controls you go looking for, and their
                  glyphs are the conventional ones — a funnel, two arrows, a
                  gear — so a hover recovers the word for the rare person who
                  needs it. "Unsaved changes" is the opposite kind of object:
                  nobody goes looking for it, it has to find YOU, and an amber
                  triangle with no text is indistinguishable from the dozen
                  other status glyphs this product shows. Collapsing the only
                  control that can lose work, to keep labels on four that
                  cannot, would be spending the row's budget backwards.

                  It stays at the right end rather than moving to the header's
                  action zone, which was the other candidate: the actions up
                  there act on the COLLECTION (add a contact, import), and this
                  one acts on the lit view — the same rule that put "Customise
                  list" on this edge in L-D.
                */}
                <span className="flex shrink-0 items-center gap-[8px]">
                  {glyphControls}
                </span>
                {unsaved}
              </>
            ) : (
              /*
                One control on this edge at a time, and dirty wins.

                "Customise list" edits the view's definition; "Unsaved changes"
                says the definition on screen is not the one on disk. Drawing
                both would offer to edit a thing while telling you the thing is
                already edited, and the second message is the one with a
                deadline on it.
              */
              (unsaved ??
                (activeList === "all" ? undefined : (
                  <button
                    type="button"
                    className="flex h-[30px] items-center gap-[6px] rounded-[8px] px-[9px] text-[12.5px] leading-none font-medium text-pg-text-strong motion-tap hover:bg-pg-surface"
                  >
                    <SlidersHorizontal
                      size={14}
                      aria-hidden="true"
                      className="text-pg-muted"
                    />
                    Customise list
                  </button>
                )))
            )
          }
        />
      ) : null}

      {/*
        The filter row, split down the middle.

        Left of the gap: what CUTS the list — Filters and Sort, the two controls
        that change which rows exist and are therefore the two that can leave
        the view unsaved. Right of it: what works INSIDE the cut — the search
        field and the column picker, neither of which dirties anything. The
        live product draws it this way and the reason holds: the two halves
        answer to different buttons on the row above.

        Gone entirely under L-F, which is the row L-F buys back, and under L-B
        and L-E, which took these controls somewhere else.

        `shape.filterRow`, not `scopeInTabs && !oneRow` as it read until Sep
        23. The old expression asked "are the tabs here" as a proxy for "is
        there a second band", which was true while the tabs were the only
        thing that could take the band away — and became false the moment
        `listShowViews` could delete the strip on its own. L-D with no views
        keeps this row: the tabs are what went, and the filters had nothing to
        do with it.
      */}
      {!shared && !mergedRow && !scopeInTrail && shape.filterRow ? (
        <div className="flex shrink-0 items-center gap-[10px]">
          {filtersButton}
          {sortButton}
          <span aria-hidden="true" className="min-w-[16px] flex-1" />
          {searchField(false)}
          {manageFieldsButton}
        </div>
      ) : null}

      {(() => {
        const listContent = visible.length === 0 ? (
        /*
         * Cleared, not first-use: this account has 1,469 contacts, so the
         * honest empty state says the filter found nothing — and offers the
         * way back out rather than an onboarding illustration.
         */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          {/*
            The toolbar stays put when the cut comes back empty: it is the
            thing that got you here and the thing that gets you out, so it
            cannot be the part that disappears.
          */}
          {canvasToolbar ? (
            <div className="flex h-[54px] shrink-0 items-center gap-[10px] px-[12px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
              {canvasToolbar}
            </div>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[8px]">
            <span className="text-[14px] leading-[18px] font-semibold text-pg-heading">
              {narrowed
                ? "No contacts match these filters"
                : `No contacts in ${activeLabel}`}
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              {narrowed
                ? "Try removing a filter or two."
                : "Nothing matches this list right now."}
            </span>
            {/* Filters first: they are the nearer cause, and clearing them
                keeps you on the list you chose. */}
            <OutlineButton
              onClick={() => {
                if (!narrowed) return pickList("all");
                setFilters([]);
                setQuery("");
                setStatusFilter([]);
              }}
              className="mt-[4px]"
            >
              {narrowed ? "Clear filters" : "View all contacts"}
            </OutlineButton>
          </div>
        </div>
      ) : (
        <ContactsTable
          toolbar={canvasToolbar}
          rows={visible}
          onToggleRow={toggleRow}
          /*
            Straight to the record. The drawer closes first because the record
            page replaces this whole component — leaving `drawer` set would
            have the add form or the field picker waiting for you on the way
            back, which is a page remembering something you did not ask it to.
          */
          onOpenRow={(id) => {
            setDrawer(null);
            setOpenId(id);
          }}
          activeId={openId}
          hiddenColumns={hiddenCols}
        />
      );
        /*
          Under the shared toolbar the list rides inside it, so the side-views
          variant can lay the views beside it. The wrapper keeps the table
          filling the height it filled on its own.
        */
        return shared ? (
          <div className="flex min-h-0 flex-1 flex-col gap-[14px]">
            <ListToolbar model={toolbarModel}>{listContent}</ListToolbar>
          </div>
        ) : (
          listContent
        );
      })()}

      <div className="flex h-[30px] shrink-0 items-center justify-between">
        <span className="text-[13px] leading-[normal] whitespace-nowrap text-pg-muted">
          Showing {visible.length} of {activeCount} in {activeLabel}
        </span>
        <div className="flex shrink-0 items-center gap-[16px]">
          <div className="flex shrink-0 items-center gap-[8px]">
            <span className="text-[13px] leading-[normal] whitespace-nowrap text-pg-muted">
              Rows per page
            </span>
            <button
              type="button"
              className="flex h-[30px] shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-95"
            >
              <span className="text-[13px] leading-[normal] font-medium text-pg-text">
                20
              </span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className="text-pg-faint"
              />
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-[4px]">
            <button
              type="button"
              aria-label="Previous page"
              disabled
              className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-disabled shadow-[inset_0_0_0_1px_var(--pg-border)]"
            >
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <span className="flex h-[30px] shrink-0 items-center justify-center px-[8px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text-strong">
              Page 1 of 92
            </span>
            <button
              type="button"
              aria-label="Next page"
              className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-90"
            >
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/*
        Full height, like Ask AI: the drawer runs the canvas top to bottom
        rather than starting under the header. It is the same object wherever
        it opens from, so it gets the same frame every time, and the 8px cap
        on three sides is what keeps it reading as laid ON the page.
      */}
      {drawer === "add" ? <AddContactDrawer onClose={() => setDrawer(null)} /> : null}
      {drawer === "fields" ? (
        <ManageFieldsDrawer onClose={() => setDrawer(null)} />
      ) : null}
      {drawer === "filters" ? (
        <FiltersDrawer
          applied={filters}
          onApply={setFilters}
          onClose={() => setDrawer(null)}
        />
      ) : null}
      {creatingList ? (
        <AddSmartListDrawer
          initialFilters={creatingList.filters}
          initialSort={creatingList.sort}
          onClose={() => setCreatingList(null)}
          onCreate={createList}
        />
      ) : null}

      {modal?.kind === "export" ? (
        <ExportFlow
          count={
            modal.scope === "selected"
              ? selectedRows.length
              : activeList === "all" && filterCount === 0
                ? 1469
                : visible.length
          }
          sample={(modal.scope === "selected" ? selectedRows : visible)
            .slice(0, 3)
            .map((c) => ({ name: c.name, tone: c.tone }))}
          scopeLabel={modal.scope === "selected" ? "Selected" : activeLabel}
          onClose={() => setModal(null)}
          onCheckProgress={openBulkActions}
        />
      ) : null}
      {modal?.kind === "duplicates" ? (
        <FindDuplicatesModal
          onClose={() => setModal(null)}
          onFind={(rule) => {
            setModal(null);
            setDupRule(rule);
            openView("duplicates");
          }}
        />
      ) : null}

      {selectedCount > 0 ? (
        <div
          role="status"
          className="motion-slot-in absolute bottom-[24px] left-1/2 flex h-[42px] -translate-x-1/2 items-center gap-[14px] rounded-[10px] bg-pg-overlay px-[14px] shadow-[0_8px_24px_0_var(--hr-gray-900)47]"
        >
          <span className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-pg-surface">
            {selectedCount} selected
          </span>
          <span
            aria-hidden="true"
            className="h-[16px] w-px bg-[var(--pg-overlay-divider)]"
          />
          {(
            [
              ["Add to list", undefined],
              ["Add tag", undefined],
              ["Export", () => openExport("selected")],
            ] as const
          ).map(([action, onClick]) => (
            <button
              key={action}
              type="button"
              onClick={onClick}
              className="text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-overlay-fg motion-tap hover:brightness-125 active:scale-95"
            >
              {action}
            </button>
          ))}
          <button
            type="button"
            onClick={deleteSelected}
            className="text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-danger motion-tap hover:brightness-110 active:scale-95"
          >
            Delete
          </button>
          <span
            aria-hidden="true"
            className="h-[16px] w-px bg-[var(--pg-overlay-divider)]"
          />
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() =>
              setRows((c) => c.map((r) => ({ ...r, selected: false })))
            }
            className="text-pg-faint motion-tap hover:rotate-90 hover:text-pg-overlay-fg"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The saved list as a picker, for the variants where the row carries scope.
 *
 * A tab strip and a dropdown answer the same question and cost very different
 * heights: seven tabs need their own 38px row, one button needs none. The
 * trade is that a closed menu shows one list instead of seven, which is the
 * whole argument L-B is here to be judged on — so the button states the list
 * AND its size, and the menu is one press away with the counts on every row.
 *
 * Hand-rolled like every other menu in this prototype: an absolutely
 * positioned card over a full-screen click-catcher, so the anchor stays in
 * normal flow and the row it sits on keeps its height whether the menu is
 * open or shut.
 */
function SmartListPicker({
  smartLists,
  activeId,
  onSelect,
  onCreate,
  showCount,
}: {
  smartLists: ManagedList[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  /** Follows the page-header count knob — the same number, wherever it lands. */
  showCount: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const active = smartLists.find((l) => l.id === activeId) ?? smartLists[0];
  const ActiveIcon = active.icon;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Smart list"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[34px] shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface pr-[10px] pl-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
      >
        <ActiveIcon size={15} aria-hidden="true" className="shrink-0 text-brand" />
        <span className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-pg-heading">
          {active.label}
        </span>
        {showCount ? (
          <span className="text-[12.5px] leading-[normal] font-medium tabular-nums whitespace-nowrap text-pg-muted">
            {active.count}
          </span>
        ) : null}
        <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close smart lists"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label="Smart lists"
            className="absolute top-[calc(100%+8px)] left-0 z-40 w-[248px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            {smartLists.map((list) => {
              const on = list.id === activeId;
              return (
                <button
                  key={list.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  onClick={() => {
                    onSelect(list.id);
                    setOpen(false);
                  }}
                  className="motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[8px] text-left hover:bg-pg-bg"
                >
                  <list.icon
                    size={15}
                    aria-hidden="true"
                    className={cn("shrink-0", on ? "text-brand" : "text-pg-muted")}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[13.5px] leading-[18px]",
                      on ? "font-semibold text-pg-heading" : "text-pg-text",
                    )}
                  >
                    {list.label}
                  </span>
                  <span className="shrink-0 text-[12px] leading-[18px] tabular-nums text-pg-faint">
                    {list.count}
                  </span>
                  {on ? (
                    <Check size={14} aria-hidden="true" className="shrink-0 text-brand" />
                  ) : null}
                </button>
              );
            })}
            {/*
              Creating a list is not one of the lists, so it sits under a rule
              rather than at the end of the radio group — a menu where the last
              row does something else is how you pick the wrong one.
            */}
            <span
              aria-hidden="true"
              className="my-[4px] block h-px bg-[var(--pg-border)]"
            />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
              className="motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[8px] text-left text-brand hover:bg-pg-bg"
            >
              <Plus size={15} aria-hidden="true" className="shrink-0" />
              <span className="text-[13.5px] leading-[18px] font-medium">
                Create list
              </span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
