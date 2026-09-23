"use client";

import * as React from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  ListFilter,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  PrimaryButton,
} from "@/components/page/page-header";
import { usePageCrumb } from "@/components/page/page-crumb";
import { ViewBar } from "@/components/page/view-bar";
import {
  CollapsingSearch,
  GlyphButton,
  UnsavedChanges,
  useListShape,
} from "@/components/page/list-shape";
import { cn } from "@/lib/utils";
import { contactsAreaLabel, useContactsArea } from "./contacts-area";
import { contacts as seedContacts, smartLists } from "./contacts-data";
import { ContactsTable } from "./contacts-table";
import { AddContactDrawer, ManageFieldsDrawer } from "./contact-drawers";
import { ContactDetail } from "./contact-detail";

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
export function ContactsPage() {
  const { effective } = useTheme();
  const appTheme = effective.appTheme;
  const [rows, setRows] = React.useState(seedContacts);
  const [activeList, setActiveList] = React.useState("all");
  /*
   * Read, not written, here any more.
   *
   * The title used to be this page's navigator — a dropdown over the same five
   * destinations the app bar's tab strip once held. The breadcrumb's last crumb
   * now owns that move, so what is left is a heading that names whichever area
   * page the trail put you on. One switch, one place, and the title can no
   * longer disagree with the trail about where you are.
   */
  const [pageId] = useContactsArea();
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
  const [drawer, setDrawer] = React.useState<"add" | "fields" | null>(null);

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
  const [sortApplied, setSortApplied] = React.useState(true);
  const [filterCount, setFilterCount] = React.useState(0);
  const [savedCut, setSavedCut] = React.useState({ sort: false, filters: 0 });
  const dirty =
    sortApplied !== savedCut.sort || filterCount !== savedCut.filters;

  /*
   * Switching lists is not an edit to the list you are leaving.
   *
   * So the live cut and the saved cut both reset, and the amber button goes
   * away — rather than following you to the next list still claiming there is
   * something unsaved about it, which would make the one warning colour on the
   * page mean "you have been here a while".
   */
  const pickList = (id: string) => {
    setActiveList(id);
    setSortApplied(false);
    setFilterCount(0);
    setSavedCut({ sort: false, filters: 0 });
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
  const visible = React.useMemo(() => {
    const cut = (() => {
      switch (activeList) {
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
    return sortApplied
      ? [...cut].sort((a, b) => a.name.localeCompare(b.name))
      : cut;
  }, [activeList, rows, sortApplied]);

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
  const activeCount = activeList === "all" ? "1,469" : String(visible.length);

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
  usePageCrumb(
    scopeInTrail && showViews
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
       * Cycles rather than opening a filter builder, which this prototype does
       * not have. It has to DO something: the badge is half of what makes the
       * view dirty, and a button that cannot change the number would leave
       * "Unsaved changes" with only one input and no way to show the amber
       * button appearing rather than merely being there.
       */
      onClick={() => setFilterCount((c) => (c + 1) % 3)}
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

  const sortButton = (
    <OutlineButton onClick={() => setSortApplied((v) => !v)}>
      <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
      Sort
      {sortApplied ? (
        <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-[normal] font-semibold tabular-nums text-brand-fg">
          1
        </span>
      ) : null}
    </OutlineButton>
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
        onClick={() => setFilterCount((c) => (c + 1) % 3)}
      />
      <GlyphButton
        icon={ArrowUpDown}
        label="Sort"
        count={sortApplied ? 1 : 0}
        onClick={() => setSortApplied((v) => !v)}
      />
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
   * why. The page opens dirty on purpose (see `sortApplied`), so this is the
   * normal case rather than an edge: filters off means the list is a fixed
   * cut, and a fixed cut has no unsaved state to warn about.
   */
  const unsaved = dirty && showFilters ? (
    <UnsavedChanges
      onSaveAsNew={() =>
        setSavedCut({ sort: sortApplied, filters: filterCount })
      }
      onDiscard={() => {
        setSortApplied(savedCut.sort);
        setFilterCount(savedCut.filters);
      }}
    />
  ) : null;

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
    { label: "Manage smart lists", icon: SlidersHorizontal },
    {
      label: "Manage fields",
      icon: Columns3,
      onClick: () => {
        setOpenId(null);
        setDrawer("fields");
      },
    },
    { label: "Custom fields", icon: Settings },
    { label: "Export contacts", icon: Download },
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
      {showFilters ? (
        controls
      ) : (
        <span aria-hidden="true" className="min-w-[16px] flex-1" />
      )}
      <OutlineButton onClick={() => undefined}>
        <Upload size={15} aria-hidden="true" className="text-pg-text-strong" />
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
   * A record is open, so the record is what this component renders.
   *
   * The condition used to be `full && openContact` — the second half of the
   * two-step. With the peek gone there is no other thing `openId` could mean,
   * and the guard collapses to "is one open". `onBack` clears it rather than
   * dropping to a lesser view, which is the same one-destination rule read
   * backwards: one gesture in, one gesture out.
   */
  if (openContact) {
    return (
      <ContactDetail
        contact={openContact}
        onBack={() => setOpenId(null)}
        onPrev={openIndex > 0 ? () => step(-1) : undefined}
        onNext={openIndex < visible.length - 1 ? () => step(1) : undefined}
        position={`${openIndex + 1} of ${visible.length}`}
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
        count={mergedRow ? undefined : activeCount}
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
          mergedRow && (showViews || showFilters) ? (
            <>
              {showViews ? (
              <SmartListPicker
                activeId={activeList}
                onSelect={pickList}
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
        secondary={[{ label: "Import", icon: Upload }]}
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
      {shape.scopeInTabs ? (
        <ViewBar
          label="Smart lists"
          views={smartLists}
          activeId={activeList}
          onSelect={pickList}
          onCreate={() => undefined}
          createLabel="Add Smart List"
          /*
            Four tabs and `1 more` on its own row; three and `2 more` when the
            row is also carrying the filters.

            Not a fit measured at runtime — see the note on the prop. Four is
            what the account this was drawn from shows at a normal width, and
            pinning it means the overflow chip is in every screenshot of L-D
            rather than only in the ones taken on a small laptop. L-F gets one
            fewer because it is paying for the glyph cluster out of the same
            1160px, and the alternative is a fourth tab clipped mid-word by
            the scroll box — which reads as a bug rather than as the cost the
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
      {!mergedRow && !scopeInTrail && shape.filterRow ? (
        <div className="flex shrink-0 items-center gap-[10px]">
          {filtersButton}
          {sortButton}
          <span aria-hidden="true" className="min-w-[16px] flex-1" />
          {searchField(false)}
          {manageFieldsButton}
        </div>
      ) : null}

      {visible.length === 0 ? (
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
              No contacts in {activeLabel}
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Nothing matches this list right now.
            </span>
            <OutlineButton
              onClick={() => setActiveList("all")}
              className="mt-[4px]"
            >
              View all contacts
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
        />
      )}

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
          {["Add to list", "Add tag", "Export"].map((action) => (
            <button
              key={action}
              type="button"
              className="text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-overlay-fg motion-tap hover:brightness-125 active:scale-95"
            >
              {action}
            </button>
          ))}
          <button
            type="button"
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
  activeId,
  onSelect,
  showCount,
}: {
  activeId: string;
  onSelect: (id: string) => void;
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
              onClick={() => setOpen(false)}
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
