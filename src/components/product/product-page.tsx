"use client";

import * as React from "react";
import {
  ChevronLeft,
  Columns3,
  EllipsisVertical,
  ListFilter,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CaretDown } from "@/components/icons/caret-down";
import { useTheme } from "@/components/theme/theme-provider";
import type {
  CatalogueChild,
  CatalogueEntry,
} from "@/components/nav/catalogue";
import { cn } from "@/lib/utils";

interface ProductPageProps {
  /**
   * `CatalogueEntry` rather than `CatalogueProduct`: this page renders products
   * from either IA, and the proposed tree files membership on the bucket so its
   * products carry no groupId/jobId/suiteId. Nothing here reads those.
   */
  product: CatalogueEntry;
  /** The L2 sub-place showing, or null for the product's own landing view. */
  childId: string | null;
  onChildChange: (id: string | null) => void;
  /** The bucket this product sits in, for the title menu's step-up view. */
  groupLabel?: string;
  siblings?: { id: string; label: string; icon?: LucideIcon }[];
  onSelectSibling?: (id: string) => void;
  /** A tab or sub-tab id the nav asked for, pre-selected on the bar. */
  initialTab?: string | null;
}

/**
 * The stand-in page every product opens to.
 *
 * The point of this page is its HEADER: the title is the navigator, exactly
 * as ContactsPage does for Smart lists — the current app's header-tab
 * dropdowns become the title's own menu, listing the product's L2 places
 * from the catalogue. The body below is a deliberately plain stage (toolbar
 * and skeleton rows), because the interaction being demoed is up top.
 */
export function ProductPage({
  product,
  childId,
  onChildChange,
  groupLabel,
  siblings,
  onSelectSibling,
  initialTab,
}: ProductPageProps) {
  const { effective } = useTheme();
  const pages = React.useMemo(
    () => (product.tabs ? [] : flattenPages(product.children ?? [])),
    [product],
  );
  const current = pages.find((p) => p.child.id === childId)?.child ?? null;
  const title = current?.label ?? overviewLabel(product);
  /*
   * The tab bar belongs to whichever place is open — the product itself when it
   * is a tabs-parent, otherwise the page you drilled to. Local state, because a
   * tab is not a destination: it does not belong in the trail or the URL.
   */
  const tabOwner = current ?? product;
  const tabs = React.useMemo(
    () => (tabOwner.tabs ? (tabOwner.children ?? []) : []),
    [tabOwner],
  );
  /*
   * `initialTab` is whatever the nav was clicked with, which may name a tab or a
   * sub-tab. Either way it selects the pair, so a deep nav row still lands
   * somewhere exact — without the tab ever reaching the breadcrumb.
   */
  const seeded = React.useMemo(() => {
    if (!initialTab) return { tab: null as string | null, sub: null as string | null };
    if (tabs.some((t) => t.id === initialTab)) {
      return { tab: initialTab, sub: null };
    }
    const parent = tabs.find((t) =>
      (t.children ?? []).some((c) => c.id === initialTab),
    );
    return parent
      ? { tab: parent.id, sub: initialTab }
      : { tab: null, sub: null };
  }, [initialTab, tabs]);

  const [activeTab, setActiveTab] = React.useState<string | null>(null);
  const currentTab =
    tabs.find((t) => t.id === (activeTab ?? seeded.tab))?.id ??
    tabs[0]?.id ??
    null;
  /*
   * A second, quieter row when the selected tab itself has children.
   *
   * Two levels of in-page control is what the real product does — Invoices &
   * Estimates has a tab bar, and picking Estimates gives you Draft/Sent/Accepted
   * under it. Both levels are filters on one page, so neither reaches the trail.
   */
  const subTabs = tabs.find((t) => t.id === currentTab)?.children ?? [];
  const [activeSubTab, setActiveSubTab] = React.useState<string | null>(null);
  const currentSubTab =
    subTabs.find((t) => t.id === (activeSubTab ?? seeded.sub))?.id ??
    subTabs[0]?.id ??
    null;

  return (
    <div
      data-page-theme={effective.appTheme}
      // No fill: the canvas paints nothing either, so content sits directly on
      // the shell plane and the rows bring their own surface. Horizontal inset
      // only — the canvas's own margin is the whole vertical one — and it comes
      // from --page-inset, which the app bar above reads too so the two agree.
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex flex-col items-start gap-[3px]">
          {pages.length > 0 ? (
            <TitleMenu
              area={product.label}
              pages={pages}
              currentId={current?.id ?? null}
              overview={overviewLabel(product)}
              onChange={onChildChange}
              groupLabel={groupLabel}
              siblings={siblings}
              onSelectSibling={onSelectSibling}
            />
          ) : (
            <h1 className="text-[20px] leading-[normal] font-semibold tracking-[-0.2px] whitespace-nowrap text-pg-heading">
              {title}
            </h1>
          )}
          <p className="text-[13px] leading-[normal] whitespace-nowrap text-pg-muted">
            {product.blurb}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-[10px]">
          <button
            type="button"
            className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_3px_0_rgba(15,23,42,0.06)] active:scale-[0.97]"
          >
            <Upload size={15} aria-hidden="true" className="text-pg-text-strong" />
            Import
          </button>
          <button
            type="button"
            className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-brand px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-brand-fg hover:brightness-110 hover:shadow-[0_2px_10px_0_rgba(21,94,239,0.35)] active:scale-[0.97]"
          >
            <Plus size={16} aria-hidden="true" />
            New
          </button>
          <button
            type="button"
            aria-label="More actions"
            className="motion-tap flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
          >
            <EllipsisVertical size={16} aria-hidden="true" className="text-pg-text-strong" />
          </button>
        </div>
      </div>

      {tabs.length > 0 ? (
        /*
          The in-page tab bar. Sits under the title and above the toolbar, which
          is where the current app puts it — and it is the whole reason those
          rows left the nav.
        */
        <div
          role="tablist"
          aria-label={`${title} views`}
          className="-mt-[4px] flex shrink-0 items-center gap-[2px] overflow-x-auto border-b border-[var(--pg-border)]"
        >
          {tabs.map((tab) => {
            const on = tab.id === currentTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "motion-tap relative shrink-0 px-[11px] pb-[9px] pt-[2px] text-[13.5px] leading-[18px] whitespace-nowrap",
                  on
                    ? "font-semibold text-pg-heading"
                    : "font-medium text-pg-muted hover:text-pg-text",
                )}
              >
                {tab.label}
                {tab.badge ? (
                  <span className="ml-[6px] rounded-[4px] bg-pg-bg px-[5px] py-[1px] text-[10px] leading-[14px] font-semibold text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
                    {tab.badge.label}
                  </span>
                ) : null}
                {/* The underline is the selection, drawn over the rule below. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-[6px] -bottom-[1px] h-[2px] rounded-full motion-move",
                    on ? "bg-brand" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {subTabs.length > 0 ? (
        <div
          role="tablist"
          aria-label={`${tabs.find((t) => t.id === currentTab)?.label ?? title} filters`}
          className="-mt-[6px] flex shrink-0 items-center gap-[6px] overflow-x-auto"
        >
          {subTabs.map((sub) => {
            const on = sub.id === currentSubTab;
            return (
              <button
                key={sub.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActiveSubTab(sub.id)}
                className={cn(
                  "motion-tap shrink-0 rounded-[7px] px-[10px] py-[4px] text-[12.5px] leading-[17px] whitespace-nowrap",
                  on
                    ? "bg-pg-surface font-semibold text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]"
                    : "font-medium text-pg-muted hover:bg-pg-surface hover:text-pg-text",
                )}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Toolbar — enough furniture to read as a real list page. */}
      <div className="flex shrink-0 items-center gap-[10px]">
        <div className="flex h-[34px] w-[300px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <span className="text-[13px] leading-[normal] text-pg-faint">
            Search {title.toLowerCase()}
          </span>
        </div>
        <div className="flex-1" />
        <ToolbarButton icon={ListFilter} label="Filters" />
        <ToolbarButton icon={Columns3} label="Columns" />
      </div>

      {/*
        The stage. Skeleton rows, not fake data: this page exists to demo the
        title menu, and plausible-but-fabricated records would upstage it.
      */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <div className="flex h-[40px] shrink-0 items-center gap-[16px] border-b border-[var(--pg-border)] px-[16px]">
          <span className="h-[10px] w-[14px] rounded-[3px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]" />
          <span className="text-[12px] leading-[normal] font-semibold tracking-[0.4px] text-pg-faint uppercase">
            {title}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="flex h-[46px] shrink-0 items-center gap-[16px] border-b border-[var(--pg-border)] px-[16px] last:border-b-0"
            >
              <span className="size-[14px] shrink-0 rounded-[3px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]" />
              <span className="h-[10px] w-[18%] rounded-full bg-pg-bg" />
              <span className="h-[10px] w-[12%] rounded-full bg-pg-bg opacity-80" />
              <span className="h-[10px] w-[22%] rounded-full bg-pg-bg opacity-60" />
              <span className="ml-auto h-[10px] w-[8%] rounded-full bg-pg-bg opacity-50" />
            </div>
          ))}
        </div>
        <div className="flex h-[44px] shrink-0 items-center justify-between border-t border-[var(--pg-border)] px-[16px]">
          <span className="text-[12.5px] leading-[normal] text-pg-muted">
            Demo stage — {product.label}
            {current ? ` · ${current.label}` : ""}
            {currentTab
              ? ` · ${tabs.find((t) => t.id === currentTab)?.label ?? ""}`
              : ""}
            {currentSubTab
              ? ` · ${subTabs.find((t) => t.id === currentSubTab)?.label ?? ""}`
              : ""}
          </span>
          <span className="text-[12.5px] leading-[normal] text-pg-faint">
            Rows per page 20
          </span>
        </div>
      </div>
    </div>
  );
}

/** A page in the title menu, with how deep in the tree it sits. */
interface PageNode {
  child: CatalogueChild;
  depth: number;
}

/**
 * The product's whole page tree, flattened for one menu.
 *
 * Flat with indentation rather than a cascading submenu, because that is what
 * the current app's header-tab dropdowns already are — a list — and a cascade
 * inside a title menu would be a third interaction to explain.
 */
function flattenPages(
  nodes: readonly CatalogueChild[],
  depth = 0,
): PageNode[] {
  return nodes.flatMap((child) => [
    { child, depth },
    // Stop at a tabs-parent. Its children are tabs on its page, so they are not
    // pages — and that is true however the nav chooses to draw them. The
    // `tabsInNav` axis moves rows around; it does not turn a filter into a place.
    ...(child.tabs ? [] : flattenPages(child.children ?? [], depth + 1)),
  ]);
}

/** What the parent product's own landing view is called in the menu. */
function overviewLabel(product: CatalogueEntry): string {
  return product.label;
}

function ToolbarButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean | "true" }>;
  label: string;
}) {
  return (
    <button
      type="button"
      className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
    >
      <Icon size={15} aria-hidden="true" className="text-pg-text-strong" />
      {label}
    </button>
  );
}

/**
 * "{Current page} ⌄" — the same title-as-navigator ContactsPage established
 * for Smart lists, generated from the catalogue's L2 children. The menu is
 * headed by the product's name, so the dropdown reads as "where you are
 * inside {product}".
 */
function TitleMenu({
  area,
  pages,
  currentId,
  overview,
  onChange,
  groupLabel,
  siblings = [],
  onSelectSibling,
}: {
  area: string;
  pages: PageNode[];
  currentId: string | null;
  overview: string;
  onChange: (id: string | null) => void;
  /** The bucket this product sits in — the level the back arrow steps up to. */
  groupLabel?: string;
  /** The other products in that bucket, so switching never leaves the menu. */
  siblings?: { id: string; label: string; icon?: LucideIcon }[];
  onSelectSibling?: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  /*
   * Two levels in one menu: this product's pages, and one step up, the bucket's
   * products. The review's ask — from a page you should be able to keep moving
   * without closing the menu and going back through the nav.
   */
  const [view, setView] = React.useState<"pages" | "products">("pages");
  const canStepUp = Boolean(groupLabel && siblings.length > 0 && onSelectSibling);
  const current = pages.find((p) => p.child.id === currentId)?.child;


  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const row = (
    selected: boolean,
    label: string,
    onClick: () => void,
    badge?: CatalogueChild["badge"],
    key?: string,
    depth = 0,
  ) => (
    <button
      key={key ?? label}
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      // Depth as indent: the L4s read as belonging to the L3 above them.
      style={depth > 0 ? { paddingLeft: 10 + depth * 14 } : undefined}
      className={cn(
        "motion-tap flex w-full items-center gap-[8px] rounded-[8px] px-[10px] py-[9px] text-left",
        selected
          ? "bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]"
          : "hover:bg-pg-bg",
      )}
    >
      <span
        className={cn(
          "text-[13.5px] leading-[18px]",
          selected ? "font-semibold text-pg-heading" : "text-pg-text",
        )}
      >
        {label}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-[4px] bg-pg-bg px-[5px] py-[1px] text-[10px] leading-[14px] font-semibold text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {badge.label}
        </span>
      ) : null}
    </button>
  );

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          // Reopening always starts at this product's pages, never wherever it
          // was left. Done here rather than in an effect — Next 16 rejects
          // setState in an effect, and the toggle is the honest place for it.
          setOpen((v) => !v);
          setView("pages");
        }}
        className="motion-tap group/title -mx-[6px] flex items-center gap-[6px] rounded-[8px] px-[6px] py-[2px] hover:bg-pg-surface"
      >
        <h1 className="text-[20px] leading-[normal] font-semibold tracking-[-0.2px] whitespace-nowrap text-pg-heading">
          {current?.label ?? overview}
        </h1>
        <CaretDown
          size={14}
          className={cn("shrink-0 text-pg-muted motion-tap", open && "rotate-180")}
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
            aria-label={view === "pages" ? `${area} pages` : `${groupLabel} products`}
            className="absolute top-[calc(100%+8px)] left-[-6px] z-40 w-[280px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            {/*
              The header is a header, not a row.
              
              It used to be 14px semibold — the same weight the selected row
              wears — so "Social Planner" the heading and "Social Listening" the
              selection read as siblings. Now it is small, uppercase, tracked and
              muted, sitting above a rule: the same section-label idiom the
              flyout panels already use, and impossible to mistake for a choice.
            */}
            <div className="mb-[4px] flex items-center gap-[6px] border-b border-[var(--pg-border)] px-[6px] pt-[5px] pb-[7px]">
              {canStepUp ? (
                <button
                  type="button"
                  aria-label={
                    view === "pages"
                      ? `Up to ${groupLabel}`
                      : `Back to ${area}`
                  }
                  onClick={() =>
                    setView((v) => (v === "pages" ? "products" : "pages"))
                  }
                  className="motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[5px] text-pg-muted hover:bg-pg-bg hover:text-pg-text active:scale-95"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                </button>
              ) : null}
              <span className="flex-1 truncate text-[11px] leading-[14px] font-semibold tracking-[0.5px] text-pg-faint uppercase">
                {view === "pages" ? area : groupLabel}
              </span>
            </div>

            {view === "pages" ? (
              <>
                {row(currentId === null, overview, () => {
                  onChange(null);
                  setOpen(false);
                })}
                {pages.map(({ child, depth }) =>
                  row(
                    child.id === currentId,
                    child.label,
                    () => {
                      onChange(child.id);
                      setOpen(false);
                    },
                    child.badge,
                    child.id,
                    depth,
                  ),
                )}
              </>
            ) : (
              siblings.map((sibling) => (
                <button
                  key={sibling.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={sibling.label === area}
                  onClick={() => {
                    onSelectSibling?.(sibling.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "motion-tap flex w-full items-center gap-[9px] rounded-[8px] px-[10px] py-[9px] text-left",
                    sibling.label === area
                      ? "bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]"
                      : "hover:bg-pg-bg",
                  )}
                >
                  {sibling.icon ? (
                    <sibling.icon
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-pg-muted"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "truncate text-[13.5px] leading-[18px]",
                      sibling.label === area
                        ? "font-semibold text-pg-heading"
                        : "text-pg-text",
                    )}
                  >
                    {sibling.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
