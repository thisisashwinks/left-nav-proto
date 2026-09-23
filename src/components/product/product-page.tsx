"use client";

import * as React from "react";
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  PrimaryButton,
} from "@/components/page/page-header";
import { useListShape } from "@/components/page/list-shape";
import {
  Columns3,
  Download,
  ListFilter,
  Plus,
  Search,
  Settings,
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
import { AgentTemplatesPage } from "@/components/ai/agent-templates-page";
import { KnowledgeBasePage } from "@/components/ai/knowledge-base-page";
import { LaunchpadPage } from "@/components/launchpad/launchpad-page";
import { ReportingDashboardPage } from "@/components/reporting/dashboard-page";
import { FunnelsPage } from "@/components/sites/funnels-page";
import { InvoicesPage } from "@/components/invoices/invoices-page";
import { ProspectingPage } from "@/components/prospecting/prospecting-page";
import { AiStudioPage } from "@/components/ai/ai-studio-page";
import { VoiceAiPage } from "@/components/ai/voice-ai-page";
import { CalendarsPage } from "@/components/calendars/calendars-page";
import { MediaStoragePage } from "@/components/media/media-storage-page";
import { MarketplaceAppsPage } from "@/components/integrations/marketplace-page";

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
    /*
     * Voice AI's agent list — the PROPOSED tree's copy of it, and only that.
     *
     * The shipped tree's `ai-voice` deliberately is not here, because the two
     * trees are now showing two different screens under that name and both are
     * wanted. `voice-ai-page.tsx` (Sep 22, the concurrent AI study) arrived
     * claiming every id the chain owns — `ai-voice`, `ia-ai-voice` and both of
     * the proposed tree's children — and since `realPage` is checked before the
     * stage renders, that left NO route in either tree to the L4/L5 stage:
     * five `deepHeaderVariant` variants and `deepInlineCrumb` became switches
     * with nothing behind them, and nothing would have said so until a review
     * asked to see X-3.
     *
     * Giving the deep page a child id back was not enough either — the
     * proposed tree draws Voice AI's children inside the page as tabs, not as
     * nav rows, so a route through `ia-ai-voice-dashboard` is a route nobody
     * can click. The split that works is by TREE: the proposed tree's Voice AI
     * is the agent list, the shipped tree's is the deep chain. That is also
     * where the research put it — the path it filmed someone getting lost in
     * reads AI Agents ▸ Voice AI ▸ Dashboard & logs ▸ Inbound, and "AI Agents"
     * is the shipped catalogue's product, not the proposed one's.
     */
    products: ["ia-ai-voice"],
    children: ["ia-ai-voice-agents", "ia-ai-voice-dashboard"],
    render: () => <VoiceAiPage />,
  },
  {
    /*
     * AI ▸ Knowledge Base, the proposed tree's copy only.
     *
     * The shipped catalogue files the same screen as `ai-knowledge`, an L2 of
     * the AI Agents product, and claiming that pair here would hand this page
     * the product's bare landing too — `realPageFor` matches on `childId ===
     * null` — so AI Agents would lose its stage to whichever of its four
     * children was routed first. Same split, and the same reason, as Voice AI
     * above.
     */
    products: ["ia-ai-knowledge"],
    children: [],
    render: () => <KnowledgeBasePage />,
  },
  {
    /*
     * AI ▸ Agent Templates. Proposed tree only, same split as its two
     * neighbours: the shipped catalogue's note says templates were routed to
     * All Products rather than given a row, so there is no shipped id to pair.
     */
    products: ["ia-ai-templates"],
    children: [],
    render: () => <AgentTemplatesPage />,
  },
  {
    /*
     * CRM ▸ Media Storage. Proposed tree only — the shipped catalogue has no
     * account-wide media row at all (its only "Media" is the affiliate
     * manager's, a different collection entirely), so there is nothing to pair.
     */
    products: ["ia-crm-media"],
    children: [],
    render: () => <MediaStoragePage />,
  },
  {
    /*
     * Integrations ▸ Marketplace Apps. Proposed tree only — the shipped
     * catalogue has no marketplace row at all (its only "marketplace" is a
     * note about where Agent Templates were routed), so there is nothing to
     * pair. Same split, and the same reason, as Media Storage above.
     *
     * `children: []` for the reason Prospecting spells out: the IA marks this
     * product `tabs: true`, so resolveTarget truncates at it and the two rows
     * arrive as `initialTab` with `childId` null — which the `childId ===
     * null` clause in realPageFor matches. Listing the two ids under
     * `children` would have looked more careful and done nothing.
     *
     * `views` maps the two nav rows onto the page's own tab keys, and it is
     * the whole reason the Settings row is clickable: without it, choosing
     * Settings in the nav would open the app grid under a Settings crumb —
     * the dead-end the Calendars settings bug was. There is no third entry
     * because there is no third row: Installed is a FILTER on Browse, which
     * is the review decision recorded beside this product in proposed-ia.ts.
     */
    products: ["ia-integrations-marketplace"],
    children: [],
    views: {
      "ia-integrations-marketplace-browse": "browse",
      "ia-integrations-marketplace-settings": "settings",
    },
    render: (view) => <MarketplaceAppsPage initialTab={view} />,
  },
  {
    products: ["ai-studio", "ia-ai-studio"],
    children: [],
    render: () => <AiStudioPage />,
  },
  {
    /*
     * CRM ▸ Calendar ▸ Appointments, plus the calendar settings behind it.
     *
     * The two trees disagree about more than the name here. The shipped
     * catalogue's `calendars` has no children at all — its own note says the
     * calendar/list split is a toggle inside and settings live in Settings —
     * so it arrives with `childId === null` and the `childId === null` clause
     * in realPageFor is what lands it on the page rather than the stage. The
     * proposed tree splits the same product into an Appointments L3 and a
     * Settings L3 with six L4s under it, which is the one chain that makes
     * the product-owns-its-settings rule concrete rather than hypothetical.
     *
     * The six L4s arrive as `initialTab` and the two L3s as `childId`, and
     * `views` is keyed by both: each seeds the screen AND, for the L4s, the
     * sub-tab pair inside it, encoded as `view:line:page` because a
     * REAL_PAGES entry gets exactly one seed string.
     *
     * The Settings L3 is in that map for a reason that used to be a bug: it
     * seeded nothing, so the trail said Calendars ▸ Settings and the page
     * opened the week grid. That was survivable while settings was also a
     * tab you could see — it is not survivable now that settings is a place
     * of its own, because there was no longer anything on screen to click.
     * A crumb that names a screen the page does not show is the one failure
     * the trail cannot absorb.
     */
    products: ["calendars", "ia-crm-calendars"],
    children: [
      "ia-crm-calendars-appointments",
      "ia-crm-calendars-settings",
    ],
    views: {
      "ia-crm-calendars-appointments": "calendar",
      "ia-crm-calendars-settings": "settings",
      "ia-crm-calendars-meetings": "settings:meetings:calendars",
      "ia-crm-calendars-services": "settings:services:calendars",
      "ia-crm-calendars-rentals": "settings:rentals:calendars",
      "ia-crm-calendars-connections": "settings:connections:calendars",
      "ia-crm-calendars-preferences": "settings:meetings:preferences",
      "ia-crm-calendars-availability": "settings:meetings:availability",
    },
    render: (view) => <CalendarsPage initialView={view} />,
  },
  {
    /*
     * Where the workspace opens, and the one product id with no nav row of its
     * own: the setup card at the top of the nav is Launchpad's row (see
     * PROPOSED_HOME_ID), and it selects this id like any other.
     *
     * No children, and none coming. The guide's sections are a list inside the
     * page rather than L3s, because a step you finish and never return to is
     * not a place — filing them in the tree would leave an account with a
     * permanent branch of completed work.
     */
    products: ["ia-launchpad"],
    children: [],
    render: () => <LaunchpadPage />,
  },
  {
    /*
     * Commerce ▸ Invoices & Estimates, plus Layouts behind it.
     *
     * Both trees file the same product and both now carry the Layouts L3 with
     * its New badge, so unlike Calendars there is no tree-by-tree split here —
     * the two id families differ only in spelling.
     *
     * `views` seeds two KINDS of thing through one string, which is the
     * arrangement Calendars established: the status L3s seed a cut of the
     * list, and `layouts` seeds a different screen entirely. The page sorts
     * that out rather than REAL_PAGES growing a second render, because the
     * two share the product's trail and Layouts is not a place the shell
     * needs to know about.
     *
     * The shipped tree's `invoices-estimates` seeds nothing on purpose: an
     * estimate is a document KIND, not a status, and the four cuts this list
     * offers are statuses. Seeding it to a cut would have made the nav row
     * promise a filter the page does not have — the dead-end failure the
     * Calendars settings bug was.
     */
    products: ["invoices", "ia-commerce-invoices"],
    children: [
      "invoices-all",
      "invoices-layouts",
      "invoices-recurring",
      "invoices-estimates",
      "invoices-accounting",
      "ia-commerce-invoices-all",
      "ia-commerce-invoices-layouts",
      "ia-commerce-invoices-recurring",
      "ia-commerce-invoices-estimates",
      "ia-commerce-invoices-templates",
      "ia-commerce-invoices-sync",
    ],
    views: {
      "invoices-layouts": "layouts",
      "ia-commerce-invoices-layouts": "layouts",
      "ia-commerce-est-draft": "draft",
      "ia-commerce-est-sent": "sent",
      "ia-commerce-est-accepted": "paid",
      "ia-commerce-est-declined": "overdue",
    },
    render: (view) => <InvoicesPage initialView={view} />,
  },
  {
    /*
     * Marketing ▸ Prospecting.
     *
     * `children: []` is correct rather than lazy. The proposed tree marks
     * this product `tabs: true`, so resolveTarget truncates at it and the six
     * rows arrive as `initialTab` with `childId` null — which the `childId ===
     * null` clause in realPageFor matches. The shipped tree's `prospecting`
     * has no children at all and lands on the same clause. Listing the six
     * ids under `children` would have looked more careful and done nothing.
     *
     * `views` is keyed by those six ids straight through to the page's own
     * tab keys. It is the thinnest possible map and it still earns its place:
     * without it, clicking Analytics in the nav opens All accounts under an
     * Analytics crumb — the dead-end the Calendars settings bug was.
     */
    products: ["prospecting", "ia-marketing-prospecting"],
    children: [],
    views: {
      "ia-marketing-prospecting-accounts": "accounts",
      "ia-marketing-prospecting-ai": "ai",
      "ia-marketing-prospecting-widgets": "widgets",
      "ia-marketing-prospecting-reports": "reports",
      "ia-marketing-prospecting-analytics": "analytics",
      "ia-marketing-prospecting-settings": "settings",
    },
    render: (view) => <ProspectingPage initialTab={view} />,
  },
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
    products: ["dashboards", "ia-reporting-dashboard"],
    children: [],
    render: () => <ReportingDashboardPage />,
  },
  {
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
  /*
   * The tab wins, then the place.
   *
   * A nav row can name either — an L4 arrives as `initialTab`, an L3 as
   * `childId` — and a page that only read the first left every L3 in the map
   * seeding nothing. Checked in that order because the deeper row is the more
   * specific answer: Calendars ▸ Settings ▸ Services should open Services,
   * not the settings screen's default line.
   */
  const seed =
    (initialTab ? hit.views?.[initialTab] : undefined) ??
    (childId ? hit.views?.[childId] : undefined) ??
    null;
  return hit.render(seed);
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
  /*
   * The stage is a list page, so it answers to the list axis like one.
   *
   * Until Sep 22 this page drew its own header — an `<h1>` and three buttons
   * behind `usePageChrome().title` — which meant switching the page header OFF
   * left the three buttons floating over the canvas with nothing above them,
   * and L-B and L-E did nothing here at all. Every product without a real
   * screen yet lands on this stage, so "the header pattern" as most of the
   * prototype demonstrates it WAS this hand-rolled row: the one page most
   * likely to be screenshotted was the one page not on the axis.
   */
  const shape = useListShape();
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
   * Search, filters and columns, built once and placed by the variant.
   *
   * The three list variants that move this furniture — its own row (L-C, L-D),
   * merged into the header's row (L-B), inside the canvas (L-E) — use the SAME
   * controls and disagree only about where they stand. Contacts and Workflows
   * are built this way for the same reason; a second copy of the search field
   * per variant is how two of them end up with different placeholders.
   *
   * A component rather than the inline fragment those two pages use, because
   * this one has three `React.useMemo`s above it: the React Compiler will not
   * optimise a component where it cannot prove a manual memo still holds, and
   * a JSX value built in the body is enough to make it give up on the whole
   * file (`preserve-manual-memoization`, and it is an ERROR in this repo, not
   * a warning). One element, and the compiler has nothing to reconcile.
   */
  const controls = <ListControls title={title} />;

  /*
   * Named items rather than the bare kebab this page used to draw.
   *
   * The old button opened nothing, which was survivable while the header was
   * hand-rolled and survivable nowhere else: PageHeader's ladder spills
   * inline actions INTO this menu past its budget, so a menu that cannot
   * render rows would silently swallow them. Settings and Export are the two
   * every other page in the prototype puts here.
   */
  const overflowActions = [
    { label: `${product.label} settings`, icon: Settings },
    { label: "Export", icon: Download },
  ];

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
      {/*
        Slot 05, drawn by the component every other page draws it with.

        A heading, not a menu (Abhishek, Aug 19): the title used to be the
        navigator — that was this page's whole point before the breadcrumb had
        cascading menus. Now the trail does it better, and a caret here offered
        a second way to the same places while looking like it might do
        something else. Two navigators on one screen is the misleading part.

        The deep page is excluded from the list axis on purpose. Voice AI's
        L4/L5 chain is judged on its OWN axis (`deepHeaderVariant`), all five
        of whose variants ask for the same titleless header; letting the list
        axis also merge a toolbar into that row would mean a deep screenshot
        was measuring two decisions at once, which is precisely what the
        per-archetype axes were split up to prevent.
      */}
      {!deep && shape.scopeInTrail ? null : (
        <PageHeader
          title={title}
          description={product.blurb}
          lead={
            !deep && shape.mergedRow ? (
              /*
               * No scope picker here, unlike Contacts and Workflows.
               *
               * L-B's picker replaces a strip of SAVED VIEWS — one collection
               * re-cut — and the stage has none. Its tab strip comes from the
               * catalogue and is the product's own structure, so promoting it
               * to a picker (or to the trail's tail under L-E) would be this
               * page making a claim about the IA. deep-sections.tsx refuses
               * that for the same reason; the stage is not the place to start.
               * What L-B still means here is the real half of it: the row
               * stops naming what the trail already named, and carries the
               * page's controls instead.
               */
              controls
            ) : undefined
          }
          secondary={[{ label: "Import", icon: Upload }]}
          primary={{ label: "New", icon: Plus }}
          overflow={overflowActions}
        />
      )}

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

        `deepInlineCrumb` short-circuits all five: with it on, the levels are
        the page trail below and nothing else, whichever variant is selected.
      */}
      {deep &&
      !place.inlineCrumb &&
      (place.variant === "X-2" || place.variant === "X-6") ? (
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

      {/*
        The page-scoped trail: X-5's own answer, or `deepInlineCrumb` imposing
        it on whichever variant is showing. One row either way — the knob does
        not stack a trail on top of a variant's tab bars, it replaces them, and
        `useDeepPlace` has already stopped the app bar publishing the same
        levels so the two chains cannot be read as one.
      */}
      {deep && (place.inlineCrumb || place.variant === "X-5") ? (
        <DeepPageTrail
          sections={place.sections}
          section={place.section}
          sub={place.sub}
          onSection={place.setSection}
          onSub={place.setSub}
        />
      ) : null}

      {/*
        Toolbar — enough furniture to read as a real list page.

        Absent under L-B, where the header's row is already carrying it. Under
        L-E it also inherits the page's actions: a header was taken away, and a
        page you cannot create anything from is not a variant, it is a broken
        page. They sit on this row's right edge, the edge they held when there
        was a header — the same move contacts-page and workflows-page make.
      */}
      {!deep && shape.mergedRow ? null : (
        <div className="flex shrink-0 items-center gap-[10px]">
          {controls}
          {!deep && shape.scopeInTrail ? (
            <>
              <OutlineButton>
                <Upload size={15} aria-hidden="true" className="text-pg-text-strong" />
                Import
              </OutlineButton>
              <PrimaryButton>
                <Plus size={16} aria-hidden="true" />
                New
              </PrimaryButton>
              <OverflowMenu items={overflowActions} />
            </>
          ) : null}
        </div>
      )}

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
        {deep && !place.inlineCrumb && place.variant === "X-3" ? (
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

/** The stage's search-and-filter furniture, wherever the variant puts it. */
function ListControls({ title }: { title: string }) {
  return (
    <>
      <div className="flex h-[34px] min-w-0 flex-1 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <span className="truncate text-[13px] leading-[normal] text-pg-faint">
          Search {title.toLowerCase()}
        </span>
      </div>
      <ToolbarButton icon={ListFilter} label="Filters" />
      <ToolbarButton icon={Columns3} label="Columns" />
    </>
  );
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
