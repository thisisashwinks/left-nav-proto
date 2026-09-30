"use client";

import { AutomationOverview } from "./automation-overview";
import { GlobalWorkflowSettings } from "./global-workflow-settings";
import * as React from "react";
import {
  ArrowUpDown,
  Columns3,
  Folder,
  FolderPlus,
  Import,
  ListFilter,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  PrimaryButton,
} from "@/components/page/page-header";
import {
  CollapsingSearch,
  GlyphButton,
  ScopePicker,
  useListShape,
} from "@/components/page/list-shape";
import { usePageCrumb } from "@/components/page/page-crumb";
import { CrumbSep } from "@/components/header/app-header";
/*
 * Restored by hand after a concurrent Sep 22 edit landed `SCREEN_NAMES` in the
 * title below while this file's import block was being rewritten for the list
 * axis, and the import went missing in the overlap. The title stays on
 * screen-names.ts: the trail's leaf and this heading have to say one word.
 */
import { SCREEN_NAMES } from "@/components/nav/screen-names";
import { ViewBar } from "@/components/page/view-bar";
import { cn } from "@/lib/utils";
import { WorkflowDetail } from "./workflow-detail";
import {
  STATUS_LABEL,
  folderPath,
  foldersIn,
  workflowFolders,
  workflowViews,
  workflows as allWorkflows,
  workflowsIn,
  type Workflow,
} from "./workflows-data";
import { TableCard, usePagination } from "@/components/page/table-card";
import {
  ListToolbar,
  useListToolbar,
  type ListToolbarModel,
} from "@/components/page/list-toolbar";

const COLS = "2.4fr 1.1fr 0.9fr 1.4fr 1.2fr";

/*
 * COLS as data, so the list toolbar can hide all but Name. With nothing
 * hidden the template this builds is COLS.
 */
const WORKFLOW_COLUMNS: { id: string; label: string; width: string; locked?: boolean }[] = [
  { id: "name", label: "Name", width: "2.4fr", locked: true },
  { id: "status", label: "Status", width: "1.1fr" },
  { id: "enrolled", label: "Enrolled", width: "0.9fr" },
  { id: "updated", label: "Last edited", width: "1.4fr" },
  { id: "created", label: "Created on", width: "1.2fr" },
];

const WORKFLOW_SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "enrolled", label: "Enrolled" },
  { value: "created", label: "Created on" },
];

const EDITORS = [...new Set(allWorkflows.map((w) => w.updatedBy))].sort();

/** "Apr 28 2025, 12:22 PM" to a timestamp, for sorting. */
const createdAt = (s: string) => Date.parse(s.replace(",", "")) || 0;

function StatusPill({ status }: { status: Workflow["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] w-fit items-center gap-[5px] rounded-[6px] bg-pg-bg px-[8px] text-[12px] leading-[normal] font-medium",
        status === "live"
          ? "text-[var(--pg-status-subscribed-fg)]"
          : status === "review"
            ? "text-[var(--pg-status-inquiry-fg)]"
            : "text-pg-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-[6px] rounded-full",
          status === "live"
            ? "bg-[var(--pg-status-subscribed-dot)]"
            : status === "review"
              ? "bg-[var(--pg-status-inquiry-dot)]"
              : "bg-pg-disabled",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Automation ▸ Workflows.
 *
 * List and detail are one component because the detail is not a different
 * place in the nav's sense — you are still in Workflows, looking at one of
 * them. The header changes what it says; the trail above does not move.
 */
export function WorkflowsPage({ initialView }: { initialView?: string | null }) {
  /*
   * Analytics and Settings are the nav's own L3s beside the list — separate
   * places, not views of it — so they return before any list state exists.
   */
  if (initialView === "analytics") return <AutomationOverview />;
  if (initialView === "settings") return <GlobalWorkflowSettings />;
  return <WorkflowsList initialView={initialView} />;
}

function WorkflowsList({ initialView }: { initialView?: string | null }) {
  const { effective } = useTheme();
  /*
   * The nav can name a view, so a deep row lands on the slice it promised —
   * but only as a seed. Once here, the view bar owns the cut.
   */
  const [view, setView] = React.useState(initialView ?? "all");
  const [openId, setOpenId] = React.useState<string | null>(null);
  /*
   * Which folder is open, or null for the whole collection.
   *
   * State rather than a route, like `openId` beside it: a folder is not a
   * different place in the nav's sense — you are still in Workflows, looking
   * at some of them — and the trail says so by growing a segment rather than
   * by the nav moving. Sep 28.
   */
  const [folderId, setFolderId] = React.useState<string | null>(null);
  const folder = workflowFolders.find((f) => f.id === folderId) ?? null;
  const [query, setQuery] = React.useState("");
  const [editors, setEditors] = React.useState<string[]>([]);
  const [sort, setSort] = React.useState<{ field: string; dir: "asc" | "desc" } | null>(null);
  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(() => new Set());
  const toolbar = useListToolbar();
  const needle = query.trim().toLowerCase();
  const cols =
    hidden.size === 0
      ? COLS
      : WORKFLOW_COLUMNS.filter((c) => !hidden.has(c.id))
          .map((c) => c.width)
          .join(" ");

  /*
   * Folder first, then the view.
   *
   * Order matters for the counts: the view bar inside a folder has to say how
   * many Drafts are IN THIS FOLDER, not in the collection, or the strip is
   * describing a list the page is not showing.
   */
  const inFolder = React.useMemo(() => workflowsIn(folderId), [folderId]);

  /*
   * The folders that live at this level, which are rows like any other.
   *
   * Above the workflows and outside the view filter, both deliberately. A
   * folder has no status, so "Drafts" cannot say anything about it — hiding
   * every directory the moment you picked a cut would make the cut look like
   * it had emptied the place. Directories first is the convention every file
   * browser uses and the one Ashwin's screenshot shows.
   */
  const folderRows = React.useMemo(
    () =>
      // A folder has no editor, so an Edited by filter leaves only workflows.
      editors.length > 0
        ? []
        : foldersIn(folderId).filter((f) => !needle || f.label.toLowerCase().includes(needle)),
    [folderId, needle, editors],
  );

  /** Root → here, for both trails: the bar's crumbs and the table's own. */
  const trail = React.useMemo(() => folderPath(folderId), [folderId]);

  const viewRows = React.useMemo(() => {
    if (view === "all") return inFolder;
    if (view === "live") return inFolder.filter((w) => w.status === "live");
    if (view === "drafts") return inFolder.filter((w) => w.status === "draft");
    if (view === "review") return inFolder.filter((w) => w.status === "review");
    return [];
  }, [view, inFolder]);

  /* Search, the Edited by filter and the sort, over the view's cut. */
  const rows = React.useMemo(() => {
    const filtered = viewRows.filter(
      (w) =>
        (editors.length === 0 || editors.includes(w.updatedBy)) &&
        (!needle ||
          w.name.toLowerCase().includes(needle) ||
          w.updatedBy.toLowerCase().includes(needle)),
    );
    if (!sort) return filtered;
    const key = (w: Workflow): string | number =>
      sort.field === "enrolled"
        ? Number(w.enrolled.replace(/,/g, "")) || 0
        : sort.field === "created"
          ? createdAt(w.created)
          : w.name.toLowerCase();
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      return (ka < kb ? -1 : ka > kb ? 1 : 0) * dir;
    });
  }, [viewRows, editors, needle, sort]);

  /*
   * The page the table is standing on.
   *
   * Over `rows`, so the pager counts what the view actually shows rather than
   * the collection behind it — switch to Drafts and "1 2 3 … 14" has to become
   * the number of pages of drafts, or the control is describing a different
   * list from the one under it.
   */
  const pager = usePagination(rows);

  /*
   * The table's own path — Home ▸ Sales ▸ Quotes — built once, placed twice.
   *
   * `tableCrumb` decides whether it is the card's first band or a line above
   * the card, and those are the same row of words in two boxes. Two copies in
   * the JSX would have been two places for the next change to miss, which is
   * how the bar's trail and the builder's drifted apart in the first place.
   *
   * The separator is `crumbSeparator`, the bar's own axis: Ashwin settled on
   * Sep 29 that one setting drives both trails, so a slash bar and a chevron
   * card cannot happen by accident.
   */
  const tableTrail = (
    <div
      aria-label="Folder path"
      className={cn(
        "flex shrink-0 items-center gap-[4px]",
        effective.tableCrumb === "inside"
          ? "h-[36px] border-b border-pg-head-border px-[16px]"
          : /*
               Above the card it is a line of the page, so it takes the page's
               own left edge rather than the table's 16px inset — indenting it
               would make it look like a row that had escaped the card.
             */
            "h-[22px]",
      )}
    >
      <button
        type="button"
        onClick={() => setFolderId(null)}
        className={cn(
          "motion-tap -mx-[4px] rounded-[5px] px-[4px] text-[13px] leading-[normal]",
          folderId === null
            ? "font-medium text-pg-text-strong"
            : "text-pg-muted hover:bg-pg-bg hover:text-pg-text-strong",
        )}
      >
        Home
      </button>
      {trail.map((f, i) => (
        <React.Fragment key={f.id}>
          <CrumbSep kind={effective.crumbSeparator} className="text-pg-faint" />
          <button
            type="button"
            onClick={() => setFolderId(f.id)}
            className={cn(
              "motion-tap -mx-[4px] truncate rounded-[5px] px-[4px] text-[13px] leading-[normal]",
              i === trail.length - 1
                ? "font-medium text-pg-text-strong"
                : "text-pg-muted hover:bg-pg-bg hover:text-pg-text-strong",
            )}
          >
            {f.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );

  /*
   * The view strip's own counts, recounted at every level.
   *
   * `workflowViews` ships numbers from when the seed had eight rows in it, and
   * they were wrong in both directions the moment the list grew: the strip
   * said 34 over a table of 236, and said it again inside a folder holding 14.
   * Deleted keeps its shipped count — nothing in the seed is deleted, so
   * counting would print 0 on a cut that is meant to have something in it.
   */
  const views = React.useMemo(() => {
    const n = (f: (w: Workflow) => boolean) => String(inFolder.filter(f).length);
    return workflowViews.map((v) =>
      v.id === "all"
        ? { ...v, count: String(inFolder.length) }
        : v.id === "live"
          ? { ...v, count: n((w) => w.status === "live") }
          : v.id === "drafts"
            ? { ...v, count: n((w) => w.status === "draft") }
            : v.id === "review"
              ? { ...v, count: n((w) => w.status === "review") }
              : v,
    );
  }, [inFolder]);

  // By id across the whole collection, not just this folder: the record stays
  // open while the folder crumb is being switched underneath it.
  const open = allWorkflows.find((w) => w.id === openId) ?? null;

  /*
   * Which shape of header this page wears — the SAME derivation Contacts uses.
   *
   * Until Sep 22 this page read nothing off `listHeaderVariant` at all: it drew
   * PageHeader, which respects the four chrome knobs a variant writes, and
   * stopped there. That was enough to make L-D look right and left L-B
   * and L-E half-built — pick "Merged control row" and Contacts grew a scope
   * picker while Workflows just lost its title, which is two products, not two
   * variants of one. The hook is in page/list-shape.tsx precisely so the answer
   * to "what does L-B mean" cannot be given twice.
   */
  const shape = useListShape();
  const activeView = views.find((v) => v.id === view) ?? views[0]!;

  const { folderCrumb, recordKeepsFolder } = effective;
  /*
   * Whether folders reach the app bar's trail at all.
   *
   * Only when the table has no trail of its own. With `tableCrumb` on, the
   * path is drawn in (or above) the card and the bar stops at Workflows, so
   * the two trails never say the same folders twice. Sep 30.
   */
  const foldersInTrail = effective.tableCrumb === "off";

  /*
   * Inside a folder, `replace` hands the trail's scope slot to the folder — so
   * the view has to come back to the page, or the variant loses its cuts
   * entirely. That is the whole of the difference between the two answers, and
   * it is one boolean because L-E's every other branch already keys off this.
   *
   * `beside` leaves it alone: the folder appends and the view stays the leaf.
   */
  const scopeInTrail =
    shape.scopeInTrail &&
    !(folder !== null && foldersInTrail && folderCrumb === "replace");
  /*
   * And the cuts need somewhere to go once the trail stops carrying them.
   *
   * `shape.scopeInTabs` is `!mergedRow && !scopeInTrail && showViews` computed
   * against the GLOBAL variant, so overriding the trail alone left L-E's
   * folders with no view control at all — no crumb, no strip. Recomputed here
   * on the same expression, with the local answer substituted in.
   */
  const scopeInTabs = !shape.mergedRow && !scopeInTrail && shape.showViews;

  /*
   * L-E's last crumb: Automation ▸ Workflows ▸ Drafts, switchable from there.
   *
   * Published unconditionally rather than only on the list, for the reason
   * contacts-page publishes its own: the crumb is the scope control, and a
   * scope control that vanishes the moment you open a workflow would make the
   * variant look like a bug when the detail view is what you are judging.
   * `null` on every other variant un-publishes it — and on this one too
   * when `listShowViews` is off. L-E's scope control IS this crumb, so a
   * views switch that only deleted tab strips would leave the one variant
   * with no tab strip fully switchable, which is the knob doing nothing on
   * the setting where it has the most to say. Un-published, the trail stops
   * at Workflows and the lit cut is the cut you get.
   */
  const viewSegment =
    !toolbar.shared && scopeInTrail && shape.showViews
      ? {
          label: activeView.label,
          icon: activeView.icon,
          options: views.map((v) => ({
            id: v.id,
            label: v.label,
            icon: v.icon,
            selected: v.id === view,
          })),
          onSelect: setView,
        }
      : null;

  /*
   * The folder's own segment, and what hangs off it.
   *
   * No `options`: Ashwin settled on Sep 28 that the Folder column is the way
   * in, so the crumb states where you are rather than offering the siblings.
   * A dropdown here would be a second way to do the one thing the table
   * already does, on the one segment whose menu is easiest to add and hardest
   * to justify.
   *
   * `onExit` is what makes "Workflows" above it mean "leave this folder" — see
   * page-crumb.tsx. Without it the trail would shorten on click while the
   * folder's rows stayed on screen.
   *
   * Dropped entirely once a workflow is open and `recordKeepsFolder` is off:
   * the record crumb lands straight under Workflows, and the trail says the
   * same thing however you got there.
   */
  const folderSegment =
    foldersInTrail && trail.length > 0 && (open === null || recordKeepsFolder)
      ? {
          label: trail[0]!.label,
          // Each ancestor is a place, stated rather than inferred: these have
          // no sibling menu for `crumbTargetFor` to read an id out of, because
          // folders are reached from the table. See Crumb.onNavigate.
          onNavigate: () => setFolderId(trail[0]!.id),
          onExit: () => setFolderId(null),
          tail: [
            ...trail.slice(1).map((f) => ({
              label: f.label,
              onNavigate: () => setFolderId(f.id),
            })),
            ...(viewSegment && folderCrumb === "beside" ? [viewSegment] : []),
          ],
        }
      : null;

  usePageCrumb(folderSegment ?? viewSegment);

  /*
   * Search, filters, sort and columns as one fragment.
   *
   * All four variants use the SAME controls and only disagree about where they
   * stand — their own row under the header (L-D), merged into the header's row
   * (L-B), inside the canvas against the table they filter (L-E), or on the
   * tab row itself with their labels gone (L-F, which takes `glyphControls`
   * below rather than this run). Building them once is what keeps that true,
   * and it is how contacts-page is built for the same reason.
   */
  const controls = (
    <>
      <div className="flex h-[34px] min-w-0 flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workflows"
          aria-label="Search workflows"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <OutlineButton>
        <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
        Filters
      </OutlineButton>
      <OutlineButton>
        <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
        Sort
      </OutlineButton>
      <OutlineButton>
        <Columns3 size={15} aria-hidden="true" className="text-pg-text-strong" />
        Columns
      </OutlineButton>
    </>
  );

  /*
   * The same four controls with their labels sold off — L-F, and only L-F.
   *
   * One-to-one with the labelled run above, in the same order, introducing
   * nothing: Filters, Sort, Columns, search. Workflows has no unsaved-view
   * state to place, which is the difference between this cluster and the one
   * on Contacts and worth saying out loud — a workflow view is a status cut
   * the product defines, not a query someone saved, so there is nothing here
   * that can be edited-but-not-written-back. The variant is therefore easier
   * on this page than on the one it was drawn for, and a review that only
   * looked here would conclude L-F is free.
   */
  const glyphControls = (
    <>
      <GlyphButton icon={ListFilter} label="Filters" />
      <GlyphButton icon={ArrowUpDown} label="Sort" />
      <GlyphButton icon={Columns3} label="Columns" />
      <CollapsingSearch
        placeholder="Search workflows"
        label="Search workflows"
        value={query}
        onChange={setQuery}
      />
    </>
  );

  const toolbarModel: ListToolbarModel = {
    views: {
      items: views.map((v) => ({ id: v.id, label: v.label, count: v.count, icon: v.icon })),
      activeId: view,
      onSelect: setView,
      noun: "view",
    },
    search: { value: query, onChange: setQuery, placeholder: "Search workflows" },
    quickFilters: [
      {
        id: "editor",
        label: "Edited by",
        options: EDITORS.map((e) => ({ value: e, label: e })),
        value: editors,
        multiple: true,
        onChange: setEditors,
      },
    ],
    sort: { fields: WORKFLOW_SORT_FIELDS, value: sort, onChange: setSort },
    columns: {
      items: WORKFLOW_COLUMNS.map((c) => ({
        id: c.id,
        label: c.label,
        visible: !hidden.has(c.id),
        locked: c.locked,
      })),
      onChange: (items) =>
        setHidden(new Set(items.filter((c) => !c.visible && !c.locked).map((c) => c.id))),
    },
    resultCount: { value: rows.length, noun: rows.length === 1 ? "workflow" : "workflows" },
  };

  const overflowActions = [
    { label: "New folder", icon: FolderPlus },
    { label: "Automation settings", icon: Settings },
  ];

  if (open) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <WorkflowDetail
          workflow={open}
          onBack={() => setOpenId(null)}
        /*
          The lit cut, not the whole collection — so the crumb's menu offers
          the records the list is actually showing.
        */
          siblings={rows.map((w) => ({ id: w.id, name: w.name }))}
          onOpenSibling={setOpenId}
        />
      </div>
    );
  }

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      {/*
        L-E is a structural decision, so the variant decides it — not the knob.

        The four chrome knobs say what a header may DRAW; they cannot say "and
        the view now lives in the breadcrumb", which is the whole of L-E. So
        the page branches on the variant and lets the `noHeader` chrome it
        writes be the consequence rather than the mechanism — the same way
        opportunities-page treats K-C. Turning the header knob back on while
        parked on L-E therefore does nothing here, which is right: the actions
        are already on the toolbar below, and a header that offered Create
        workflow a second time is the duplication this was called to kill.
      */}
      {scopeInTrail && !toolbar.shared ? null : (
      <PageHeader
        /*
          The trail's leaf says this same word — see screen-names.ts. Inside a
          folder it is the folder's name instead, for exactly the same reason:
          the heading and the leaf have to agree about where you are.
        */
        title={folder ? folder.label : SCREEN_NAMES.workflows}
        /*
         * On the merged row the picker states the view AND its size, so the
         * header does not also hang a count off a title that is not there —
         * two counts for one collection is exactly the repetition L-B was
         * drawn to remove. The same rule Contacts follows, for the same reason.
         */
        count={shape.mergedRow && !toolbar.shared ? undefined : activeView.count}
        description={folder ? folder.description : "Triggers, actions and handoffs"}
        /*
         * L-B's merged row, assembled from whichever bands are on.
         *
         * Each switch removes its own half of what L-B merged in — the
         * picker, or the four controls. With both off the lead is undefined
         * and the row is its actions alone: L-B does not add a row, it fills
         * the one PageHeader was drawing anyway, so emptying it leaves that
         * header rather than a gap.
         */
        lead={
          !toolbar.shared && shape.mergedRow && (shape.showViews || shape.showFilters) ? (
            <>
              {shape.showViews ? (
              <ScopePicker
                label="Workflow views"
                views={views}
                activeId={view}
                onSelect={setView}
                onCreate={() => undefined}
                createLabel="Create view"
                showCount={effective.pageHeader && effective.pageCount}
              />
              ) : null}
              {shape.showFilters ? controls : null}
            </>
          ) : undefined
        }
        secondary={[{ label: "Import", icon: Import }]}
        primary={{ label: "Create workflow", icon: Plus }}
        overflow={overflowActions}
      />
      )}

      {/*
        The tab strip is the scope control of last resort: it is here when the
        scope has nowhere better to be. Once the header's row carries a picker
        (L-B) or the trail's tail does (L-E), a row of tabs saying the same
        thing a third time is the duplication the whole axis is about.

        `scopeInTabs` folds `listShowViews` in, so the strip also goes when
        the collection is told not to offer its cuts at all — see list-shape.
      */}
      {!toolbar.shared && scopeInTabs ? (
        <ViewBar
          label="Workflow views"
          views={views}
          activeId={view}
          onSelect={setView}
          onCreate={() => undefined}
          createLabel="Create view"
          /*
            Four of five, so this page shows the overflow chip too.

            Not because the row is short of space — five short status words
            fit easily — but because L-D and L-F have to be judged on the same
            shape everywhere, and an overflow that appears only on Contacts
            would let the axis be approved on the strength of the one page
            where it is invisible.
          */
          maxVisible={4}
          className={shape.oneRow ? "h-[46px]" : undefined}
          trailing={
            shape.oneRow ? (
              <span className="flex shrink-0 items-center gap-[8px]">
                {glyphControls}
              </span>
            ) : undefined
          }
        />
      ) : null}

      {/*
        The controls keep their own row in two variants of four: L-B pulled
        them up into the header, and L-F pushed them onto the tab row as
        glyphs. `listShowFilters: false` takes them away in the other two —
        and the row itself with them, EXCEPT under L-E, where it survives
        empty-handed because it is also carrying the actions. Under L-E they
        inherit those actions: a
        Workflows page you cannot create a workflow from is not a variant, it
        is a broken page, so Import, Create and the kebab ride the right edge
        of this row — the edge they held when there was a header.
      */}
      {!toolbar.shared && ((!shape.mergedRow && shape.filterRow) || scopeInTrail) ? (
        <div className="flex shrink-0 items-center gap-[10px]">
          {shape.showFilters ? (
            controls
          ) : (
            /*
              The slack the search field was taking, so the actions keep the
              right edge they hold in every other variant instead of sliding
              left into the middle of an otherwise empty row.
            */
            <span aria-hidden="true" className="min-w-[16px] flex-1" />
          )}
          {scopeInTrail ? (
            <>
              <OutlineButton>
                <Import size={15} aria-hidden="true" className="text-pg-text-strong" />
                Import
              </OutlineButton>
              <PrimaryButton>
                <Plus size={16} aria-hidden="true" />
                Create workflow
              </PrimaryButton>
              <OverflowMenu items={overflowActions} />
            </>
          ) : null}
        </div>
      ) : null}

      {(() => {
        const table = (
      <>
      {effective.tableCrumb === "above" ? tableTrail : null}

      <TableCard pager={pager}>
        {/*
          The table's own trail, behind `tableCrumb`.

          A second statement of the same path, inside the canvas, where a file
          browser would put it. Off by default: the app bar above is already
          saying it, and the whole point of the option is to see the two
          together and decide which one the eye actually uses. It sits INSIDE
          the card because that is where the screenshot has it — a trail above
          the card would be a third band competing with the header.
        */}
        {effective.tableCrumb === "inside" ? tableTrail : null}

        <div
          style={{ gridTemplateColumns: cols }}
          className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
        >
          {/*
            No Folder column since Sep 28. Folders are rows now, so a column
            repeating each row's parent said the same thing a second time —
            and on a folder page it said the same thing on every row.
          */}
          {WORKFLOW_COLUMNS.filter((c) => !hidden.has(c.id)).map((c) => c.label).map((h) => (
            <span
              key={h}
              className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
            >
              {h}
            </span>
          ))}
        </div>

        {/*
          Directories first, and outside the pager.

          A folder run that split across a page boundary would be the one thing
          a file browser never does — you would open a folder page and find
          three directories at the bottom of page 2. They are also outside the
          view filter: see `folderRows`.
        */}
        {folderRows.map((f) => (
          <div
            key={f.id}
            role="button"
            tabIndex={0}
            onClick={() => setFolderId(f.id)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              setFolderId(f.id);
            }}
            style={{ gridTemplateColumns: cols }}
            className="grid h-[44px] w-full cursor-pointer items-center gap-[16px] border-b border-pg-row-border px-[16px] text-left motion-tap hover:bg-pg-bg"
          >
            <span className="flex min-w-0 items-center gap-[10px]">
              <Folder size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
              <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">
                {f.label}
              </span>
            </span>
            {/*
              Status and Enrolled stay empty on a directory rather than
              summing what is inside it. A folder is not live or draft, and a
              total here would be the one number on the row that changed
              meaning between two row types in the same column.
            */}
            {hidden.has("status") ? null : <span aria-hidden="true" />}
            {hidden.has("enrolled") ? null : <span aria-hidden="true" />}
            {hidden.has("updated") ? null : (
            <span className="truncate text-[13px] leading-[normal] text-pg-muted">
              {f.updated}
            </span>
            )}
            {hidden.has("created") ? null : (
            <span className="truncate text-[13px] leading-[normal] text-pg-muted">
              {f.created}
            </span>
            )}
          </div>
        ))}

        {pager.pageRows.map((w) => (
          /*
            A div, not a button.

            Rows carry their own controls now — the kebab, and until Sep 28 the
            folder link — and a button inside a button is invalid: the browser
            reparents it and the outer row stops being clickable in the middle.
            The nav's own rows made this same move for the same reason. `role`,
            `tabIndex` and the key handler put back what the element gave up.
          */
          <div
            key={w.id}
            role="button"
            tabIndex={0}
            onClick={() => setOpenId(w.id)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              setOpenId(w.id);
            }}
            style={{ gridTemplateColumns: cols }}
            className="grid h-[44px] w-full cursor-pointer items-center gap-[16px] border-b border-pg-row-border px-[16px] text-left last:border-b-0 motion-tap hover:bg-pg-bg"
          >
            {/*
              Indented past the folder glyph, so names line up in one column
              whether the row above is a directory or a workflow.
            */}
            <span className="truncate pl-[25px] text-[13px] leading-[normal] font-medium text-pg-text-strong">
              {w.name}
            </span>
            {hidden.has("status") ? null : <StatusPill status={w.status} />}
            {hidden.has("enrolled") ? null : (
            <span className="text-[13px] leading-[normal] text-pg-text">
              {w.enrolled}
            </span>
            )}
            {hidden.has("updated") ? null : (
            <span className="truncate text-[13px] leading-[normal] text-pg-muted">
              {w.updated} · {w.updatedBy}
            </span>
            )}
            {hidden.has("created") ? null : (
            <span className="truncate text-[13px] leading-[normal] text-pg-muted">
              {w.created}
            </span>
            )}
          </div>
        ))}

        {rows.length === 0 && folderRows.length === 0 ? (
          /*
           * Cleared, not empty.
           *
           * Nothing in Deleted means the bin is empty, which is a good state —
           * so it gets a confirmation rather than the create button the
           * first-use state would offer.
           */
          <div className="flex h-[200px] flex-col items-center justify-center gap-[4px]">
            <p className="text-[13.5px] leading-[normal] font-medium text-pg-text">
              {needle || editors.length > 0 ? "No workflows match" : "Nothing here"}
            </p>
            <p className="text-[12.5px] leading-[normal] text-pg-faint">
              {needle || editors.length > 0
                ? "Try a different search or clear the filters."
                : "No workflows have been deleted in the last 30 days."}
            </p>
          </div>
        ) : null}
      </TableCard>
      </>
        );
        return toolbar.shared ? (
          <ListToolbar model={toolbarModel}>
            <div className="flex min-h-0 flex-1 flex-col gap-[14px]">{table}</div>
          </ListToolbar>
        ) : (
          table
        );
      })()}
    </div>
  );
}
