"use client";

import * as React from "react";
import {
  ArrowUpDown,
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
import { OutlineButton, PageHeader } from "@/components/page/page-header";
import { ViewBar } from "@/components/page/view-bar";
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
        count={activeCount}
        description="People and companies in this account"
        secondary={[{ label: "Import", icon: Upload }]}
        primary={{
          label: "Add contact",
          icon: Plus,
          onClick: () => {
            setOpenId(null);
            setDrawer("add");
          },
        }}
        /*
         * Custom fields is the interesting one: it is configuration, so its one
         * home is Settings. It stays reachable from here because this is where
         * you think of it — a link to the canonical page, not a second copy of
         * it living on a tab.
         */
        overflow={[
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
        ]}
      />

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

      <div className="flex shrink-0 items-center gap-[10px]">
        <div className="flex h-[34px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
          <Search
            size={16}
            aria-hidden="true"
            className="shrink-0 text-pg-faint"
          />
          <input
            type="search"
            placeholder="Search by name, email, or phone"
            aria-label="Search contacts"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
        <OutlineButton>
          <ListFilter
            size={15}
            aria-hidden="true"
            className="text-pg-text-strong"
          />
          Filters
          <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-[normal] font-semibold text-brand-fg">
            2
          </span>
        </OutlineButton>
        <OutlineButton>
          <ArrowUpDown
            size={15}
            aria-hidden="true"
            className="text-pg-text-strong"
          />
          Sort
        </OutlineButton>
        <OutlineButton
          onClick={() => {
            setOpenId(null);
            setDrawer("fields");
          }}
        >
          <Settings
            size={15}
            aria-hidden="true"
            className="text-pg-text-strong"
          />
          Manage fields
        </OutlineButton>
      </div>

      {visible.length === 0 ? (
        /*
         * Cleared, not first-use: this account has 1,469 contacts, so the
         * honest empty state says the filter found nothing — and offers the
         * way back out rather than an onboarding illustration.
         */
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[8px] rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <span className="text-[14px] leading-[18px] font-semibold text-pg-heading">
            No contacts in {activeLabel}
          </span>
          <span className="text-[13px] leading-[18px] text-pg-muted">
            Nothing matches this list right now.
          </span>
          <OutlineButton onClick={() => setActiveList("all")} className="mt-[4px]">
            View all contacts
          </OutlineButton>
        </div>
      ) : (
        <ContactsTable
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
