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
import { cn } from "@/lib/utils";
import { contactsAreaLabel, useContactsArea } from "./contacts-area";
import { contacts as seedContacts, smartLists } from "./contacts-data";
import { ContactsTable } from "./contacts-table";
import { ContactPeek } from "./contact-peek";
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
   * One record, two depths. `openId` is the record the list is pointed at;
   * `full` says whether it is being read beside the list or on its own page.
   * Keeping them apart means promoting a peek to the full record never loses
   * your place — go back and the same row is still the one in hand.
   */
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [full, setFull] = React.useState(false);
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
   * The chips actually re-cut the rows.
   *
   * A view bar whose chips only change a label is the thing the tenets warn
   * about — it teaches people that tabs here do not mean anything. The cuts
   * are deterministic rather than random so a list holds still between
   * visits, and one of them lands on three rows on purpose: the narrow,
   * nearly-empty saved list is the case a table has to survive.
   */
  const visible = React.useMemo(() => {
    switch (activeList) {
      case "inquiries":
        return rows.filter((c) => c.status === "inquiry");
      case "subscribed":
        return rows.filter((c) => c.status === "subscribed");
      case "hot-leads":
        return rows.filter((_, i) => i % 5 === 0);
      case "engaged":
        return rows.filter((c) => !c.lastActivity.includes("month"));
      case "imported":
        return rows.filter((_, i) => i % 3 === 1);
      case "no-email":
        return rows.filter((c) => !c.email).slice(0, 3);
      default:
        return rows;
    }
  }, [activeList, rows]);

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
   * The four page-header knobs are already written for us when a variant is
   * picked, so the title, description and count need nothing here. What is
   * left is the part a boolean cannot say: WHERE the saved-list scope lives
   * once the title stops naming the page — a picker on the merged row (L-B),
   * the last crumb in the trail (L-E), or the tab strip it has always been
   * (L-C, L-D). Defaulting to L-C means this axis draws exactly what the
   * prototype drew before it existed.
   */
  const variant = effective.listHeaderVariant;
  const mergedRow = variant === "L-B";
  const scopeInTrail = variant === "L-E";

  /*
   * Handed to the shell, which owns the bar. Published unconditionally in
   * L-E — including while a record is open, where the trail then reads
   * Contacts ▸ Smart lists ▸ Hot leads ▸ Priya Raman and every level of it
   * still moves.
   */
  usePageCrumb(
    scopeInTrail
      ? {
          label: activeLabel,
          options: smartLists.map((list) => ({
            id: list.id,
            label: list.label,
            icon: list.icon,
            selected: list.id === activeList,
          })),
          onSelect: setActiveList,
        }
      : null,
  );

  /*
   * Search, filters and the field picker as one fragment, because all three
   * variants below use the SAME controls and only disagree about where they
   * stand — page chrome under the header, merged into the header's row, or
   * inside the table card. Building them once is what keeps that true.
   */
  const controls = (
    <>
      <div className="flex h-[34px] min-w-0 flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          type="search"
          placeholder="Search by name, email, or phone"
          aria-label="Search contacts"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <OutlineButton>
        <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
        Filters
        <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-[normal] font-semibold text-brand-fg">
          2
        </span>
      </OutlineButton>
      <OutlineButton>
        <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
        Sort
      </OutlineButton>
      <OutlineButton
        onClick={() => {
          setOpenId(null);
          setDrawer("fields");
        }}
      >
        <Settings size={15} aria-hidden="true" className="text-pg-text-strong" />
        Manage fields
      </OutlineButton>
    </>
  );

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
   */
  const canvasToolbar = scopeInTrail ? (
    <>
      {controls}
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

  if (full && openContact) {
    return (
      <ContactDetail
        contact={openContact}
        onBack={() => setFull(false)}
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
        lead={
          mergedRow ? (
            <>
              <SmartListPicker
                activeId={activeList}
                onSelect={setActiveList}
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
              {controls}
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
      */}
      {mergedRow || scopeInTrail ? null : (
        <ViewBar
          label="Smart lists"
          views={smartLists}
          activeId={activeList}
          onSelect={setActiveList}
          onCreate={() => undefined}
          createLabel="Create list"
          /*
           * Acts on the lit chip, so it rides the chip row rather than the
           * control bar below — the control bar filters the rows, this edits
           * the view those rows come from. Absent on All, which is not a saved
           * list and so has nothing to customise.
           */
          trailing={
            activeList === "all" ? undefined : (
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
            )
          }
        />
      )}

      {mergedRow || scopeInTrail ? null : (
        <div className="flex shrink-0 items-center gap-[10px]">{controls}</div>
      )}

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

      {openContact ? (
        <ContactPeek
          contact={openContact}
          onClose={() => setOpenId(null)}
          onPrev={openIndex > 0 ? () => step(-1) : undefined}
          onNext={openIndex < visible.length - 1 ? () => step(1) : undefined}
          onOpenFull={() => setFull(true)}
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
