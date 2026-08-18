"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  EllipsisVertical,
  ListFilter,
  Pin,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { CONTACTS_AREA_PAGES, useContactsArea } from "./contacts-area";
import { cn } from "@/lib/utils";
import { contacts as seedContacts, smartLists } from "./contacts-data";
import { ContactsTable } from "./contacts-table";

/** Outlined 34px button — Import, Filters, Sort, Columns, and the kebab. */
function OutlineButton({
  children,
  className,
  ...rest
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
        "motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_3px_0_rgba(15,23,42,0.06)] active:scale-[0.97]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * The page title as the navigator, per the header restructure: the tab strip
 * is gone from the app bar, so "Smart lists ⌄" opens the area's own menu —
 * the same destinations, one click away from the thing they are about. This
 * is the flyout-becomes-dropdown pattern every group's inner pages will use.
 */
function PageTitleMenu() {
  const [open, setOpen] = React.useState(false);
  // Shared with the breadcrumb's last crumb, which opens this same menu.
  const [pageId, setPageId] = useContactsArea();
  const current =
    CONTACTS_AREA_PAGES.find((p) => p.id === pageId) ?? CONTACTS_AREA_PAGES[0];

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap group/title -mx-[6px] flex items-center gap-[6px] rounded-[8px] px-[6px] py-[2px] hover:bg-pg-surface"
      >
        <h1 className="text-[20px] leading-[normal] font-semibold tracking-[-0.2px] whitespace-nowrap text-pg-heading">
          {current.label}
        </h1>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("text-pg-muted motion-tap", open && "rotate-180")}
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label="Contacts pages"
            className="absolute top-[calc(100%+8px)] left-[-6px] z-40 w-[280px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            <div className="flex items-center gap-[8px] px-[10px] pt-[8px] pb-[6px]">
              <span className="flex-1 text-[14px] leading-[18px] font-semibold text-pg-heading">
                Contacts
              </span>
              <Pin size={14} aria-hidden="true" className="text-pg-faint" />
            </div>
            {CONTACTS_AREA_PAGES.map((page) => {
              const selected = page.id === pageId;
              return (
                <button
                  key={page.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setPageId(page.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left",
                    selected
                      ? "bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]"
                      : "hover:bg-pg-bg",
                  )}
                >
                  <page.icon size={15} aria-hidden="true" className="text-pg-muted" />
                  <span className={cn("text-[13.5px] leading-[18px]", selected ? "font-semibold text-pg-heading" : "text-pg-text")}>
                    {page.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

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

  const toggleRow = (id: string) =>
    setRows((current) =>
      current.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)),
    );

  const selectedCount = rows.filter((c) => c.selected).length;
  const activeLabel =
    smartLists.find((l) => l.id === activeList)?.label ?? "All contacts";

  return (
    <div
      data-page-theme={appTheme}
      // No fill and no padding: the canvas paints nothing either, so content sits
      // directly on the shell plane, the rows bring their own surface, and the
      // canvas's own margin is the entire inset on every side.
      className="relative flex h-full min-h-0 flex-col gap-[14px]"
    >
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex flex-col items-start gap-[3px]">
          <PageTitleMenu />
          <p className="text-[13px] leading-[normal] whitespace-nowrap text-pg-muted">
            1,469 contacts organized across 6 lists
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-[10px]">
          <OutlineButton>
            <Upload size={15} aria-hidden="true" className="text-pg-text-strong" />
            Import
          </OutlineButton>
          <button
            type="button"
            className="flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-brand px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-brand-fg motion-tap hover:brightness-110 hover:shadow-[0_2px_10px_0_rgba(21,94,239,0.35)] active:scale-[0.97]"
          >
            <Plus size={16} aria-hidden="true" />
            Add contact
          </button>
          <OutlineButton aria-label="More actions" className="w-[34px] justify-center px-0">
            <EllipsisVertical size={16} aria-hidden="true" className="text-pg-text-strong" />
          </OutlineButton>
        </div>
      </div>

      <div className="flex h-[32px] shrink-0 items-center gap-[8px] overflow-x-auto">
        {smartLists.map(({ id, label, count, icon: Icon }) => {
          const active = id === activeList;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? "true" : undefined}
              onClick={() => setActiveList(id)}
              // The active chip is padded 0 6 0 11 to make room for its count
              // pill; inactive chips are padded 11 both sides and show the count
              // as bare text, with no pill at all.
              className={cn(
                "flex h-[32px] shrink-0 items-center gap-[7px] rounded-[8px]",
                "motion-tap active:scale-[0.97]",
                active
                  ? "bg-brand-soft pr-[6px] pl-[11px] shadow-[inset_0_0_0_1px_var(--brand)]"
                  : "bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
              )}
            >
              <Icon
                size={14}
                aria-hidden="true"
                className={cn("shrink-0", active ? "text-brand" : "text-pg-muted")}
              />
              <span
                className={cn(
                  "text-[13px] leading-[normal] whitespace-nowrap",
                  active
                    ? "font-semibold text-brand-strong"
                    : "font-medium text-pg-text",
                )}
              >
                {label}
              </span>
              {active ? (
                <span className="flex h-[20px] shrink-0 items-center rounded-[6px] bg-brand-soft-2 px-[7px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-brand-strong">
                  {count}
                </span>
              ) : (
                <span className="shrink-0 text-[12px] leading-[normal] whitespace-nowrap text-pg-faint">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <div aria-hidden="true" className="h-[20px] w-px shrink-0 bg-pg-border" />
        <button
          type="button"
          aria-label="Create list"
          className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)] motion-tap hover:rotate-90 hover:text-pg-text active:scale-90"
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-[10px]">
        <div className="flex h-[34px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
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
        <OutlineButton>
          <Columns3 size={15} aria-hidden="true" className="text-pg-text-strong" />
          Columns
        </OutlineButton>
      </div>

      <ContactsTable rows={rows} onToggleRow={toggleRow} />

      <div className="flex h-[30px] shrink-0 items-center justify-between">
        <span className="text-[13px] leading-[normal] whitespace-nowrap text-pg-muted">
          Showing {rows.length} of 1,469 in {activeLabel}
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
              <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
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

      {selectedCount > 0 ? (
        <div
          role="status"
          className="motion-slot-in absolute bottom-[24px] left-1/2 flex h-[42px] -translate-x-1/2 items-center gap-[14px] rounded-[10px] bg-pg-overlay px-[14px] shadow-[0_8px_24px_0_#0f172a47]"
        >
          <span className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-pg-surface">
            {selectedCount} selected
          </span>
          <span aria-hidden="true" className="h-[16px] w-px bg-[var(--pg-overlay-divider)]" />
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
          <span aria-hidden="true" className="h-[16px] w-px bg-[var(--pg-overlay-divider)]" />
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => setRows((c) => c.map((r) => ({ ...r, selected: false })))}
            className="text-pg-faint motion-tap hover:rotate-90 hover:text-pg-overlay-fg"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
