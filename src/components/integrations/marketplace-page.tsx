"use client";

import * as React from "react";
import {
  ArrowUpDown,
  BadgeCheck,
  Check,
  ChevronDown,
  ExternalLink,
  PackageCheck,
  Search,
  Settings,
  ShieldCheck,
  Star,
  type LucideIcon,
} from "lucide-react";
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  usePageChrome,
} from "@/components/page/page-header";
import {
  CollapsingSearch,
  useListShape,
} from "@/components/page/list-shape";
import { usePageCrumb } from "@/components/page/page-crumb";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  APP_CATEGORIES,
  CATEGORY_LABEL,
  marketplaceApps,
  type AppCategoryId,
  type MarketplaceApp,
} from "./marketplace-data";

/**
 * Integrations ▸ Marketplace Apps.
 *
 * Two tabs, because the IA says two tabs. What the IA also says, in a comment
 * next to them, is the decision this page is built around: installed apps was
 * a page of its own until the review pointed out it is a FILTER on the
 * marketplace and not a destination. So there is no Installed tab here and
 * there is no Installed screen — there is a cut, sitting on the same row as
 * the search and the category, and switching to it narrows the grid you were
 * already looking at. A reviewer can watch an app move from one cut to the
 * other by pressing Install, which is the whole argument made visible.
 *
 * BUILT WITHOUT THE DESIGN. Ashwin's screenshot of this screen exceeded the
 * image limit twice on Sep 23 and never reached the session, so everything
 * below is derived from the IA entry and from the pages either side of it.
 * The choices that are mine rather than the repo's are marked ASSUMPTION, and
 * each one is a small edit: the cut list is an array, the card is one
 * component, the settings tab is four rows.
 */

const TABS = [
  { id: "browse", label: "Browse marketplace" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * The two cuts of the shelf.
 *
 * ASSUMPTION, and the smallest one that honours the review. Two is what the
 * decision forces — everything, and the part you have — and a third ("Recently
 * added", "Built by HighLevel") would be inventing product on a page whose
 * design nobody in this session has seen. They are a plain array, so a third
 * costs one line if his screenshot shows one.
 */
const CUTS = [
  { id: "all", label: "All apps" },
  { id: "installed", label: "Installed" },
] as const;

type CutId = (typeof CUTS)[number]["id"];

const SORTS: { id: SortId; label: string }[] = [
  { id: "popular", label: "Sort: most installed" },
  { id: "rating", label: "Sort: highest rated" },
  { id: "name", label: "Sort: name A–Z" },
];

type SortId = "popular" | "rating" | "name";

export function MarketplaceAppsPage({
  initialTab,
}: {
  /** The nav row that was clicked, when it named one of the two tabs. */
  initialTab?: string | null;
}) {
  const { effective } = useTheme();
  const shape = useListShape();
  const { mergedRow, scopeInTrail, oneRow, showViews, showFilters } = shape;
  const chrome = usePageChrome();

  const [tab, setTab] = React.useState<TabId>(
    initialTab === "settings" ? "settings" : "browse",
  );
  const [cut, setCut] = React.useState<CutId>("all");
  const [category, setCategory] = React.useState<AppCategoryId | "all">("all");
  const [sort, setSort] = React.useState<SortId>("popular");
  const [query, setQuery] = React.useState("");
  /*
   * Install state lives here, seeded from the fixture.
   *
   * A Set of ids rather than a copy of the app rows, because nothing else
   * about an app changes when you install it and a second copy of seventeen
   * objects would be seventeen chances for the two to disagree.
   */
  const [installed, setInstalled] = React.useState<Set<string>>(
    () => new Set(marketplaceApps.filter((a) => a.installed).map((a) => a.id)),
  );

  const toggleInstall = (id: string) =>
    setInstalled((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = marketplaceApps.filter(
      (app) =>
        (cut === "all" || installed.has(app.id)) &&
        (category === "all" || app.category === category) &&
        (!q ||
          app.name.toLowerCase().includes(q) ||
          app.blurb.toLowerCase().includes(q) ||
          app.publisher.toLowerCase().includes(q)),
    );
    const sorted = [...hits];
    // The fixture's installs are formatted strings, so compare what they mean
    // rather than what they say — "9,740" sorting above "48,200" as text is
    // exactly the wrongness a reviewer spots from across the room.
    if (sort === "popular")
      sorted.sort(
        (a, b) =>
          Number(b.installs.replace(/,/g, "")) -
          Number(a.installs.replace(/,/g, "")),
      );
    if (sort === "rating")
      sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [category, cut, installed, query, sort]);

  const installedCount = installed.size;
  const cutLabel = CUTS.find((c) => c.id === cut)!.label;

  /*
   * L-E hands the cut to the trail, and only on Browse.
   *
   * The same condition contacts publishes under — `scopeInTrail && showViews`
   * — with one extra clause this page needs and contacts does not: the cut
   * belongs to the grid, and on the Settings tab there is no grid for it to
   * be cutting. A trail reading Integrations ▸ Marketplace Apps ▸ Installed
   * over a page of account switches would be naming a filter that is not on
   * screen, which is the dead-end failure the Calendars settings bug was.
   */
  usePageCrumb(
    scopeInTrail && showViews && tab === "browse"
      ? {
          label: cutLabel,
          options: CUTS.map((c) => ({
            id: c.id,
            label: c.label,
            selected: c.id === cut,
          })),
          onSelect: (id) => setCut(id as CutId),
        }
      : null,
  );

  /*
   * The cut, as a segmented control rather than as a ViewBar.
   *
   * ViewBar was the first thing tried, because that is what every other list
   * page's saved views are and `scopeInTabs` is written for it. It does not
   * fit here, and the reason is one row above: this page already draws a tab
   * strip, for Browse and Settings, and those tabs ARE the IA. Hanging a
   * second strip of tabs under the first puts two rows of underlined words in
   * 90px of canvas, and neither the reviewer nor the person using it can say
   * which row names the place and which one narrows it. So the cut takes the
   * shape that is unmistakably a filter — a two-up segment on the filter row,
   * beside the search it works with — and the tab strip keeps the only claim
   * on tab-shaped chrome.
   *
   * It still answers to `listShowViews`, which is the part that matters: the
   * knob governs the saved-view SCOPE CONTROL, not the tab strip specifically
   * (see the note in list-shape.tsx), and this is that control wearing a
   * different coat.
   */
  const cutControl = (
    <div
      role="radiogroup"
      aria-label="Marketplace cuts"
      className="flex shrink-0 rounded-[8px] bg-pg-bg p-[2px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {CUTS.map((c) => {
        const on = c.id === cut;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setCut(c.id)}
            className={cn(
              "motion-tap flex h-[30px] items-center gap-[6px] rounded-[6px] px-[11px] text-[13px] leading-none whitespace-nowrap",
              on
                ? "bg-pg-surface font-semibold text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border),0_1px_2px_0_rgba(15,23,42,0.06)]"
                : "font-medium text-pg-muted hover:text-pg-text",
            )}
          >
            {c.label}
            {/*
              The count rides the Installed segment and nothing else, because
              "All apps 17" is the page's own count said twice — slot 05 is
              already carrying it. On Installed it is the one number the cut
              exists to report, and it moves when you press Install.
            */}
            {c.id === "installed" ? (
              <span className="text-[12px] leading-none font-medium tabular-nums text-pg-faint">
                {installedCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );

  /*
   * The three filter controls, built as named pieces the way contacts builds
   * its four — so L-B can lift them onto the header's row without the row
   * below having to know.
   *
   * Only the search collapses under L-F, and that is not laziness. A glyph
   * can stand in for Filters or Sort because the word is a NOUN for the
   * control; the two pickers here are different objects — their label IS
   * their current value, "Payments" and "Sort: highest rated", and a funnel
   * icon in their place would delete the only thing on the row that says how
   * the grid is cut. Contacts made the same call in the other direction and
   * wrote it down: it kept the amber chip labelled and sold the four nouns.
   * So L-F buys back the 220px field and nothing else here, which is honest —
   * this page never had a second band for the variant to delete.
   */
  const searchField = oneRow ? (
    <CollapsingSearch
      placeholder="Search marketplace apps"
      label="Search marketplace apps"
    />
  ) : (
    <div className="flex h-[34px] min-w-[220px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
      <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search marketplace apps"
        aria-label="Search marketplace apps"
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
      />
    </div>
  );

  const categoryPicker = (
    <Select
      label="Category"
      value={APP_CATEGORIES.find((c) => c.id === category)!.label}
      options={APP_CATEGORIES}
      onPick={(id) => setCategory(id as AppCategoryId | "all")}
      width="w-[172px]"
    />
  );

  const sortPicker = (
    <Select
      label="Sort apps"
      icon={ArrowUpDown}
      value={SORTS.find((s) => s.id === sort)!.label}
      options={SORTS}
      onPick={(id) => setSort(id as SortId)}
      width="w-[200px]"
    />
  );

  const controls = (
    <>
      {searchField}
      {categoryPicker}
      {sortPicker}
    </>
  );

  /*
   * The header's actions, built once so the tab strip can adopt them.
   *
   * "View installed" is a shortcut to the cut rather than a door to a screen,
   * and it is spelled that way on purpose: the header offering a verb that
   * lands you on a filter is the review's decision stated in the one place
   * someone looking for an Installed PAGE would go looking.
   */
  const toInstalled = () => {
    setTab("browse");
    setCut("installed");
  };
  const secondary = [
    { label: "View installed", icon: PackageCheck, onClick: toInstalled },
  ];
  const overflow = [
    {
      label: "Marketplace settings",
      icon: Settings,
      onClick: () => setTab("settings"),
    },
    { label: "Open developer portal", icon: ExternalLink },
  ];

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Marketplace apps"
        /*
         * The size of the cut on screen, not the size of the shelf.
         *
         * Which is the same answer contacts gives, and it is the one that
         * survives the Installed filter: a count pinned to 17 while the grid
         * shows 7 would make slot 05 disagree with the canvas under it.
         */
        count={tab === "browse" ? String(shown.length) : undefined}
        description="Browse, install and configure apps for this account"
        /*
         * L-B's merged row, assembled from whichever bands are on — the same
         * shape contacts uses, with the cut standing where its smart-list
         * picker stands. On Settings there is nothing to merge: the tab has
         * no collection, so the row is the actions alone.
         */
        lead={
          mergedRow && tab === "browse" && (showViews || showFilters) ? (
            <>
              {showViews ? cutControl : null}
              {showFilters ? controls : null}
            </>
          ) : undefined
        }
        secondary={secondary}
        overflow={overflow}
        /*
         * No primary, and nothing is missing. The verb on this page is
         * Install, and it belongs to the CARD it installs — a header button
         * called "Install" has no referent. Inventing "Submit an app" to fill
         * the right edge would be putting a developer's action on an
         * operator's page to make a header look finished. Funnel detail made
         * the same call on Sep 23 for the same reason.
         */
      />

      {/*
        The tab strip, in the underlined idiom ProductPage, DeepTabs and
        funnel-detail all draw — byte for byte the same classes, so this is
        the same control and not a fourth tab style arriving on one screen.

        Copied rather than shared, which is now the THIRD caller and therefore
        worth stating plainly: funnel-detail's note (Sep 23) set the bar at
        "when a third caller appears the three collapse into one component
        with a `label` prop". This is that third caller, and it is still not
        the edit to make today — the stage's strip is wired to the catalogue
        and carries sub-tabs, DeepTabs is typed on DeepSection and announces
        itself as "Voice AI sections", and folding all three together is a
        change to the product stage that every screen in the prototype
        renders. It is a real debt and this comment is the invoice; the
        cheapest moment to pay it is the next time one of the three needs a
        behaviour the other two do not have.
      */}
      <div
        role="tablist"
        aria-label="Marketplace sections"
        className="-mt-[4px] flex shrink-0 items-center gap-[2px] overflow-x-auto border-b border-[var(--pg-border)]"
      >
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={cn(
                "motion-tap relative shrink-0 px-[11px] pt-[2px] pb-[9px] text-[13.5px] leading-[18px] whitespace-nowrap",
                on
                  ? "font-semibold text-pg-heading"
                  : "font-medium text-pg-muted hover:text-pg-text",
              )}
            >
              {t.label}
              {/* The underline is the selection, drawn over the rule below. */}
              <span
                aria-hidden="true"
                className={cn(
                  "motion-move absolute inset-x-[6px] -bottom-[1px] h-[2px] rounded-full",
                  on ? "bg-brand" : "bg-transparent",
                )}
              />
            </button>
          );
        })}

        {/*
          The actions rehouse onto the tab strip when slot 05 is gone.

          L-E's whole claim is that the page can lose its header because the
          scope moved into the trail — and contacts pays for that by dropping
          its actions into the table's canvas toolbar. A card grid has no
          toolbar to drop them into, and a marketplace with no way to reach
          its own settings is not a leaner page, it is a broken one. The strip
          is the row that survives every variant, so it takes them, held to
          the right edge where the header held them.

          A kebab rather than the "View installed" button the header shows,
          and the difference is the point: the header's ladder spends its
          width on the one action worth a button, and this row has no width to
          spend — it is already carrying two tabs. So everything collapses
          into the menu, including the two overflow items, which would
          otherwise be the things that silently vanish with slot 05. The
          OverflowMenu is the header's own, lent out for exactly this (see its
          note, Sep 22), so this is not a fourth menu in the prototype.
        */}
        {chrome.header ? null : (
          <>
            <span aria-hidden="true" className="min-w-[16px] flex-1" />
            <span className="flex shrink-0 items-center pb-[6px]">
              <OverflowMenu items={[...secondary, ...overflow]} />
            </span>
          </>
        )}
      </div>

      {tab === "browse" ? (
        <>
          {/*
            One band, carrying both halves.

            Gone under L-B (the header's row took it) and under L-E with the
            filters off (the trail took the cut and there is nothing left to
            draw). `shape.filterRow` is what says whether the labelled row
            exists at all; the two knobs then decide which halves of it are
            populated, exactly as they do on contacts.
          */}
          {!mergedRow && (showViews || shape.filterRow) ? (
            <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
              {showViews && !scopeInTrail ? cutControl : null}
              {showFilters ? controls : null}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto pb-[16px]">
            {shown.length === 0 ? (
              /*
               * Narrowed, not empty: the shelf has seventeen apps on it, so
               * the honest empty state says the filter found nothing and
               * offers the way back out rather than an onboarding
               * illustration. Contacts draws the same distinction.
               */
              <div className="flex flex-col items-center gap-[8px] rounded-[12px] bg-pg-surface px-[16px] py-[48px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
                <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                  No apps match that
                </span>
                <span className="text-[13px] leading-[18px] text-pg-muted">
                  Try another search, or widen the category.
                </span>
                <OutlineButton
                  className="mt-[4px]"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                    setCut("all");
                  }}
                >
                  Clear filters
                </OutlineButton>
              </div>
            ) : (
              /*
               * Three across at the widest, not four.
               *
               * Four was the first cut and it was measurably wrong: at 1600px
               * the cards land at ~300px, which clips "Almanac Scheduling"
               * mid-word and turns "48,200 installs" into "48,2…". A card
               * whose own name does not fit is worse than a shorter grid, and
               * the fix is not a smaller type ramp — 14px is the heading size
               * the design system gives this.
               */
              <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-3">
                {shown.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    installed={installed.has(app.id)}
                    onToggle={() => toggleInstall(app.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <MarketplaceSettings installedCount={installedCount} />
      )}
    </div>
  );
}

/* ─── The card ──────────────────────────────────────────────────────────── */

/**
 * One app on the shelf.
 *
 * Five facts and one verb, in that order down the card: who it is, what it
 * does, what kind of thing it is, how many accounts trust it, and whether you
 * have it. Anything more — screenshots, a price, a permissions list — belongs
 * to the app's own page, which this prototype does not have and should not
 * invent to make a tile look full.
 */
function AppCard({
  app,
  installed,
  onToggle,
}: {
  app: MarketplaceApp;
  installed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-[10px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="flex min-w-0 items-start gap-[10px]">
        <AppMark app={app} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-[5px]">
            <span className="truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
              {app.name}
            </span>
            {/*
              The verified tick is for first-party apps only, and it is the
              one badge on this card that means something a user cannot check
              for themselves. Handing it to every publisher would make it
              decoration.
            */}
            {app.publisher === "HighLevel" ? (
              <BadgeCheck
                size={14}
                aria-label="Built by HighLevel"
                className="shrink-0 text-brand"
              />
            ) : null}
          </span>
          {/*
            Publisher and reach on one line, separated by a middot.

            They started on two rows — publisher here, "48,200 installs" down
            in the meta row — and the meta row could not hold four things at
            a card's width. These two belong together anyway: both answer
            "who is behind this and does anyone use it", which is the
            question a marketplace card exists to answer before the verb.
          */}
          <span className="truncate text-[13px] leading-[18px] text-pg-muted">
            {app.publisher} · {app.installs} installs
          </span>
        </div>

        {installed ? (
          <span className="flex h-[22px] shrink-0 items-center gap-[4px] rounded-[6px] bg-[var(--pg-av-green-bg)] px-[7px] text-[11.5px] leading-none font-semibold text-[var(--pg-status-paid-fg)]">
            <Check size={12} strokeWidth={3} aria-hidden="true" />
            Installed
          </span>
        ) : null}
      </div>

      <p className="line-clamp-2 min-h-[36px] text-[13px] leading-[18px] text-pg-muted">
        {app.blurb}
      </p>

      <div className="flex min-w-0 items-center gap-[8px]">
        <span className="shrink-0 rounded-[6px] bg-pg-bg px-[8px] py-[3px] text-[12px] leading-[16px] font-medium whitespace-nowrap text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {CATEGORY_LABEL[app.category]}
        </span>
        <span
          aria-label={`Rated ${app.rating} out of 5`}
          className="flex shrink-0 items-center gap-[4px] text-[12.5px] leading-[16px] text-pg-faint tabular-nums"
        >
          <Star size={12} aria-hidden="true" className="text-pg-faint" />
          {app.rating}
        </span>
        <span aria-hidden="true" className="min-w-[4px] flex-1" />
        {/*
          One control, two states, and the verb changes with the state.

          An "Install" button that stays Install after installing is the bug
          every marketplace ships once. "Configure" is the honest second verb:
          the app is on, and what is left to do to it is set it up — which is
          also the third word in this page's own description.
        */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "motion-tap flex h-[30px] shrink-0 items-center gap-[6px] rounded-[8px] px-[12px] text-[12.5px] leading-none font-semibold whitespace-nowrap active:scale-[0.97]",
            installed
              ? "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
              : "bg-brand-soft text-brand hover:brightness-[0.97]",
          )}
        >
          {installed ? "Configure" : "Install"}
        </button>
      </div>
    </div>
  );
}

/**
 * The app's mark — a tone square with a glyph in it.
 *
 * Deliberately not `ToneAvatar`, which is byte-close and means something
 * else: its square holds an INITIAL, and its own doc says that marker is
 * there to say "this row is an object" with a letter so the markers are not
 * all identical. An app is not an anonymous record — it has a logo in the
 * real product, and the nearest honest stand-in for a logo is a glyph, not
 * the letter N for Northgate. The tokens are the same seven pairs either way,
 * so the two marks still belong to one family.
 *
 * And no third-party logos, now or later: a marketplace mock that draws real
 * wordmarks is making a partnership claim on a screenshot that gets shared.
 */
function AppMark({ app }: { app: MarketplaceApp }) {
  const Icon = app.icon;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-[36px] shrink-0 items-center justify-center rounded-[10px]",
        TONE[app.tone],
      )}
    >
      <Icon size={18} />
    </span>
  );
}

/** The same seven pairs the contacts table cycles, as --pg-av-* token pairs. */
const TONE: Record<MarketplaceApp["tone"], string> = {
  blue: "bg-[var(--pg-av-blue-bg)] text-[var(--pg-av-blue-fg)]",
  pink: "bg-[var(--pg-av-pink-bg)] text-[var(--pg-av-pink-fg)]",
  green: "bg-[var(--pg-av-green-bg)] text-[var(--pg-av-green-fg)]",
  orange: "bg-[var(--pg-av-orange-bg)] text-[var(--pg-av-orange-fg)]",
  purple: "bg-[var(--pg-av-purple-bg)] text-[var(--pg-av-purple-fg)]",
  yellow: "bg-[var(--pg-av-yellow-bg)] text-[var(--pg-av-yellow-fg)]",
  teal: "bg-[var(--pg-av-teal-bg)] text-[var(--pg-av-teal-fg)]",
};

/* ─── The Settings tab ──────────────────────────────────────────────────── */

/**
 * What the ACCOUNT decides about apps, as opposed to what any one app is
 * configured to do.
 *
 * Four switches and a line of prose, and it stops there on purpose. The
 * obvious way to fill this tab is a fake OAuth client list, a webhook table
 * and a billing section — all of which would be inventing a product surface
 * nobody has specified, on the tab whose IA blurb is one clause long. Each
 * row here is a question the marketplace genuinely raises the moment a second
 * person can install things: who may, what happens on update, and what
 * happens to the data when an app leaves.
 *
 * ASSUMPTION, all four. They are `SettingRow`-shaped so adding or cutting one
 * is a four-line edit.
 *
 * The controls are drawn here rather than imported from
 * `settings/controls.tsx`, following calendar-chrome's precedent (Sep): that
 * kit belongs to the agency Navigation tab, and reaching into it from a
 * product page would make this screen a dependent of the agency settings
 * screen — the next person to restyle that kit would silently restyle this.
 */
function MarketplaceSettings({ installedCount }: { installedCount: number }) {
  const [permissions, setPermissions] = React.useState(true);
  const [autoUpdate, setAutoUpdate] = React.useState(true);
  const [adminsOnly, setAdminsOnly] = React.useState(false);
  const [purge, setPurge] = React.useState(false);

  return (
    <div className="min-h-0 flex-1 overflow-auto pb-[16px]">
      <section className="w-full max-w-[720px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <header className="flex items-start gap-[10px] pb-[6px]">
          <ShieldCheck
            size={16}
            aria-hidden="true"
            className="mt-[2px] shrink-0 text-brand"
          />
          <div className="min-w-0">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              App permissions
            </h2>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              {/*
                The count is the link back to Browse, in a sentence rather
                than as a second button. It is context for the switches under
                it — four rules about apps read differently when you know
                seven of them are running — not an action of its own.
              */}
              {installedCount} apps are installed on this account.
            </p>
          </div>
        </header>

        <SettingRow
          label="Only admins can install apps"
          desc="Everyone else can browse and request."
          on={adminsOnly}
          onToggle={() => setAdminsOnly((v) => !v)}
        />
        <SettingRow
          label="Review permissions before installing"
          desc="Show what an app can read and change, and ask before it is granted."
          on={permissions}
          onToggle={() => setPermissions((v) => !v)}
        />
        <SettingRow
          label="Update apps automatically"
          desc="New versions install overnight. Permission changes always ask first."
          on={autoUpdate}
          onToggle={() => setAutoUpdate((v) => !v)}
        />
        <SettingRow
          label="Delete app data when an app is removed"
          desc="Off keeps 30 days of data, so reinstalling picks up where it left off."
          on={purge}
          onToggle={() => setPurge((v) => !v)}
          last
        />
      </section>
    </div>
  );
}

function SettingRow({
  label,
  desc,
  on,
  onToggle,
  last = false,
}: {
  label: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-[16px] py-[11px]",
        !last && "shadow-[inset_0_-1px_0_0_var(--pg-border)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-[18px] font-medium text-pg-heading">
          {label}
        </div>
        <div className="mt-[1px] text-[13px] leading-[18px] text-pg-muted">
          {desc}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={cn(
          "motion-tap flex h-[20px] w-[34px] shrink-0 items-center rounded-full px-[2px]",
          on ? "justify-end bg-brand" : "justify-start bg-pg-border-strong",
        )}
      >
        <span className="size-[16px] rounded-full bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.25)]" />
      </button>
    </div>
  );
}

/* ─── Furniture ─────────────────────────────────────────────────────────── */

/**
 * The filter row's dropdowns.
 *
 * Hand-rolled like every other menu in this prototype — an absolutely
 * positioned card over a full-screen click-catcher — so the trigger stays in
 * flow and the band keeps its height whether a menu is open or not. This is
 * the second copy of media-storage-page's `Select` and it is a copy rather
 * than an import for the same reason the tab strip above is: reaching across
 * two products for a twenty-line dropdown couples a marketplace filter to the
 * media library's layout. A third copy is the point at which it moves to
 * `components/page/`.
 */
function Select({
  label,
  value,
  options,
  onPick,
  width,
  icon: Icon,
}: {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  onPick: (id: string) => void;
  width: string;
  icon?: LucideIcon;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("relative shrink-0", width)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex h-[34px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[13px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
      >
        {Icon ? (
          <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="shrink-0 text-pg-faint"
        />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute top-[38px] left-0 z-50 w-full min-w-[180px] overflow-hidden rounded-[10px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onPick(o.id);
                  setOpen(false);
                }}
                className={cn(
                  "motion-tap flex w-full items-center rounded-[7px] px-[9px] py-[7px] text-left text-[13px] leading-[normal] hover:bg-pg-row-border",
                  o.label === value
                    ? "font-semibold text-pg-heading"
                    : "text-pg-text",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
