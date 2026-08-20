"use client";

import * as React from "react";
import {
  Columns3,
  EllipsisVertical,
  ListFilter,
  Plus,
  Search,
  Upload,
} from "lucide-react";
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
  /** A tab or sub-tab id the nav asked for, pre-selected on the bar. */
  initialTab?: string | null;
}

/**
 * The stand-in page every product opens to.
 *
 * The title was the navigator until the breadcrumb grew cascading menus; now the
 * trail owns switching and this is a plain heading. What the page still carries
 * is the in-page tab bar — one or two rows of views that deliberately are NOT
 * places. The body is a plain stage on purpose.
 */
export function ProductPage({
  product,
  childId,
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
          {/*
            A heading, not a menu (Abhishek, Aug 19).
            
            The title used to be the navigator — that was this page's whole point
            before the breadcrumb had cascading menus. Now the trail does it
            better, and a caret here offered a second way to the same places
            while looking like it might do something else. Two navigators on one
            screen is the misleading part.
          */}
          <h1 className="text-[20px] leading-[normal] font-semibold tracking-[-0.2px] whitespace-nowrap text-pg-heading">
            {title}
          </h1>
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
