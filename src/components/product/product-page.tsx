"use client";

import * as React from "react";
import { usePageChrome } from "@/components/page/page-header";
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
import { InboxPage } from "./inbox-page";
import {
  DeepPageTrail,
  DeepRail,
  DeepSubTabs,
  DeepTabs,
  isDeepPage,
  useDeepPlace,
} from "./deep-sections";
import { OpportunitiesPage } from "@/components/opportunities/opportunities-page";
import { WorkflowsPage } from "@/components/automation/workflows-page";
import { FunnelsPage } from "@/components/sites/funnels-page";

/**
 * The products that have a real page behind them, in both catalogues.
 *
 * Two id families per entry because the shipped tree and the proposed IA each
 * carry their own copy of the same product — the same page under two names,
 * which is the whole point of having two trees to compare. `children` names
 * the L2s that are still that page; every other L2 falls through to the stage,
 * so a half-built product can grow one real screen at a time.
 */
const REAL_PAGES: {
  products: string[];
  children: string[];
  /**
   * Nav row id → the view that row names, for the trees that file views as
   * L3s. The page keeps ownership of the cut; this only seeds it.
   */
  views?: Record<string, string>;
  render: (view: string | null) => React.ReactNode;
}[] = [
  {
    products: ["conversations", "ia-crm-conversations"],
    children: ["ia-crm-conversations-inbox"],
    render: () => <InboxPage />,
  },
  {
    products: ["opportunities", "ia-crm-opportunities"],
    children: ["ia-crm-opportunities-list"],
    render: () => <OpportunitiesPage />,
  },
  {
    /*
     * The shipped tree files Workflows as an L2 of Automation; the proposed
     * tree promotes it to a product of its own. Both arrive here, which is
     * why the match is on a pair of lists rather than a single id.
     */
    products: ["automation", "ia-automation-workflows"],
    children: ["automation-workflows", "ia-automation-list"],
    views: {
      "ia-automation-list-all": "all",
      "ia-automation-list-review": "review",
      "ia-automation-list-drafts": "drafts",
      "ia-automation-list-deleted": "deleted",
    },
    render: (view) => <WorkflowsPage initialView={view} />,
  },
  {
    /*
     * Content ▸ Sites ▸ Funnel, and the AI builder behind it.
     *
     * Two id families as usual, and they are further apart than the pairs
     * above: the shipped catalogue calls the product "Sites & funnels" with a
     * child "Funnels", the proposed tree calls them "Sites" and "Funnel". Both
     * name the same screen, so both are listed rather than the page picking a
     * winner — the whole point of the two trees is that they can disagree
     * about words without disagreeing about pages.
     *
     * The `childId === null` clause in realPageFor means landing on the
     * product bare lands here too, which is right for this one: funnels are
     * what an operator means by Sites, and the shipped app opens on them.
     */
    products: ["sites", "ia-content-sites"],
    children: ["sites-funnels", "ia-content-sites-funnel"],
    render: () => <FunnelsPage />,
  },
];

function realPageFor(
  productId: string,
  childId: string | null,
  initialTab: string | null,
) {
  const hit = REAL_PAGES.find(
    (entry) =>
      entry.products.includes(productId) &&
      (childId === null || entry.children.includes(childId)),
  );
  if (!hit) return null;
  return hit.render((initialTab && hit.views?.[initialTab]) ?? null);
}

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
  const { title: showTitle, description: showDesc } = usePageChrome();
  /*
   * The inbox gets the real page; everything else gets the stage.
   *
   * Landing on Conversations with no child selected counts: the inbox is what
   * that product IS, and dropping someone onto a skeleton table when they
   * clicked the row named Conversations would be the one page in the prototype
   * that lies about where it took you.
   */
  const realPage = realPageFor(product.id, childId, initialTab ?? null);
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

  /*
   * The one chain deep enough to have an L4 and an L5 argument.
   *
   * Voice AI's sub-sections are declared in deep-sections rather than in either
   * catalogue — see the note there. What matters here is that the deep page
   * takes over the in-page tab rows completely: the proposed tree gives Voice
   * AI two tabs of its own, and drawing those UNDER a variant's L4 strip would
   * put three rows of tabs on the screen the review is trying to measure.
   *
   * Unconditional, like every hook above it: `deep` decides what the hook
   * publishes, never whether it runs.
   */
  const deep = isDeepPage(product.id, childId);
  const place = useDeepPlace(deep && !realPage);

  /*
   * After the hooks, never before them.
   *
   * Every hook above runs for the inbox too and its results go unused, which is
   * the price of the rule — returning early from the middle of a component that
   * has already called four of them is how a render crashes on the NEXT page
   * you navigate to, not this one.
   */
  if (realPage) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        {realPage}
      </div>
    );
  }

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
          {showTitle ? (
            <>
              <h1 className="text-[20px] leading-[normal] font-semibold tracking-[-0.2px] whitespace-nowrap text-pg-heading">
                {title}
              </h1>
              {showDesc ? (
                <p className="text-[13px] leading-[normal] whitespace-nowrap text-pg-muted">
                  {product.blurb}
                </p>
              ) : null}
            </>
          ) : null}
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

      {!deep && tabs.length > 0 ? (
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

      {!deep && subTabs.length > 0 ? (
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

      {/*
        The deep chain's own rows, one variant at a time.

        X-2 keeps both strips and lets the bar say all four levels anyway —
        that redundancy IS the variant, so nothing here tries to soften it.
        X-6 drops the L4 strip because the trail took that level. X-4 and X-3
        draw nothing at page level at all: one moved the whole chain into the
        crumb menus, the other moved it into the content beside the card.
        X-5 draws its second trail here, where a page header would have been.
      */}
      {deep && (place.variant === "X-2" || place.variant === "X-6") ? (
        <>
          {place.variant === "X-2" ? (
            <DeepTabs
              sections={place.sections}
              activeId={place.section.id}
              onSelect={place.setSection}
            />
          ) : null}
          {place.section.subs.length > 0 ? (
            <DeepSubTabs
              label={`${place.section.label} filters`}
              subs={place.section.subs}
              activeId={place.sub?.id ?? null}
              onSelect={place.setSub}
            />
          ) : null}
        </>
      ) : null}

      {deep && place.variant === "X-5" ? (
        <DeepPageTrail
          sections={place.sections}
          section={place.section}
          sub={place.sub}
          onSection={place.setSection}
          onSub={place.setSub}
        />
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
      {/*
        A row, not just the card — X-3 puts its rail inside the content area
        rather than above it, and "inside the content" has to be literally
        true for the variant to be worth looking at. With no rail the row has
        one child and lays out exactly as the bare card did.
      */}
      <div className="flex min-h-0 flex-1">
        {deep && place.variant === "X-3" ? (
          <DeepRail
            sections={place.sections}
            section={place.section}
            sub={place.sub}
            onSection={place.setSection}
            onSub={place.setSub}
          />
        ) : null}

      {/* --pg-card-border, not --pg-border: this is the page's one big card, the
          same thing the contacts table draws, and the joined shells switch that
          token off so the card is not a second ring inside the canvas's own. */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
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
            {/* The catalogue's own tabs, only where they are actually drawn —
                the deep page suppresses those strips, so naming a tab nobody
                can see would make the readout disagree with the screen. */}
            {!deep && currentTab
              ? ` · ${tabs.find((t) => t.id === currentTab)?.label ?? ""}`
              : ""}
            {!deep && currentSubTab
              ? ` · ${subTabs.find((t) => t.id === currentSubTab)?.label ?? ""}`
              : ""}
            {/*
              The deep chain reads out here too, because four of the five
              variants move the selection somewhere other than a tab strip —
              without this line a screenshot of X-4 cannot show that picking a
              crumb changed anything on the page.
            */}
            {deep
              ? ` · ${place.section.label}${place.sub ? ` · ${place.sub.label}` : ""}`
              : ""}
          </span>
          <span className="text-[12.5px] leading-[normal] text-pg-faint">
            Rows per page 20
          </span>
        </div>
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
