"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Gem,
  Globe,
  ListFilter,
  MapPin,
  Phone,
  Plus,
  Search,
  Sparkles,
  Star,
  Tags,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { PageHeader, PrimaryButton } from "@/components/page/page-header";
import { ViewBar } from "@/components/page/view-bar";
import { ToneAvatar } from "@/components/page/avatar";
import { usePageCrumb } from "@/components/page/page-crumb";
import { cn } from "@/lib/utils";
import { ProspectDetail } from "./prospect-detail";
import {
  BAND_LABEL,
  bandFor,
  prospectTabs,
  prospects,
  suggestions,
  type Prospect,
  type ScoreBand,
} from "./prospecting-data";

/**
 * The paid-feature gem.
 *
 * `--ai-btn-fg` rather than the brand accent, and the reason is the same one
 * the AI surfaces give: entitlement is a property of the PLATFORM, not of
 * the account's branding, so an agency that recolours the app must not
 * recolour what it has to pay for. It is also why this is a gem and not a
 * lock — the product is advertising an upgrade, not refusing entry.
 */
function Premium({ label }: { label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[20px] shrink-0 items-center gap-[4px] rounded-[6px] bg-[var(--ai-btn-from)] px-[6px] text-[11.5px] leading-none font-semibold whitespace-nowrap text-[var(--ai-btn-fg)]",
        !label && "px-[4px]",
      )}
    >
      <Gem size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

/** The score, as a figure and a band — see `bandFor` for why it is both. */
function ScoreChip({ score }: { score: number }) {
  const band: ScoreBand = bandFor(score);
  return (
    <span className="inline-flex shrink-0 items-center gap-[6px]">
      <span
        className={cn(
          "flex h-[21px] items-center rounded-[6px] px-[7px] text-[11.5px] leading-none font-semibold tabular-nums",
          band === "high"
            ? "bg-[var(--pg-av-green-bg)] text-[var(--pg-status-paid-fg)]"
            : band === "medium"
              ? "bg-[var(--pg-av-yellow-bg)] text-[var(--pg-av-yellow-fg)]"
              : "bg-pg-bg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]",
        )}
      >
        {score}%
      </span>
      <span
        className={cn(
          "text-[12.5px] leading-none font-medium",
          band === "high"
            ? "text-[var(--pg-status-paid-fg)]"
            : band === "medium"
              ? "text-[var(--pg-av-yellow-fg)]"
              : "text-pg-muted",
        )}
      >
        {BAND_LABEL[band]}
      </span>
    </span>
  );
}

/**
 * One fact about the business — address, phone, site, rating.
 *
 * Every one of them ends in an affordance, and they are not the same
 * affordance: an address and a site OPEN somewhere, a phone number is
 * COPIED. That distinction is the whole reason the icons differ — a copy
 * glyph on a link would send someone to the clipboard when they meant to
 * visit, and production gets this right on the row it is drawn from.
 */
function FactRow({
  icon: Icon,
  children,
  action,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
  action: "open" | "copy";
}) {
  return (
    <span className="flex min-w-0 items-center gap-[8px] text-[13px] leading-[19px] text-pg-text">
      <Icon size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <span className="min-w-0 truncate">{children}</span>
      <button
        type="button"
        aria-label={action === "open" ? "Open in a new tab" : "Copy to clipboard"}
        className="motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[5px] text-pg-faint hover:bg-pg-bg hover:text-brand active:scale-90"
      >
        {action === "open" ? (
          <ExternalLink size={13} aria-hidden="true" />
        ) : (
          <Copy size={13} aria-hidden="true" />
        )}
      </button>
    </span>
  );
}

/**
 * Marketing ▸ Prospecting.
 *
 * Six tabs, of which one is a collection — see the note on `prospectTabs`
 * for why that is worth looking at rather than tidying away. This component
 * owns all six plus the account detail behind the first, on the same
 * argument Workflows makes: opening a prospect is not a move in the nav's
 * sense, so the trail does not change place and the record crumb appends.
 */
export function ProspectingPage({ initialTab }: { initialTab?: string | null }) {
  const { effective } = useTheme();
  const [tab, setTab] = React.useState(initialTab ?? "accounts");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const open = prospects.find((p) => p.id === openId) ?? null;

  /*
   * The lit tab as the trail's last crumb.
   *
   * Published for EVERY tab rather than only the collection, which is the
   * opposite of what the other list pages do — and it is the honest answer
   * here. On Contacts the tabs are cuts of one collection, so the trail
   * stopping at "Contacts" still names the place. Here the tabs are five
   * different places, and a trail that stopped at "Prospecting" while the
   * canvas showed the report builder would be naming the product and hiding
   * the screen. The strip's misuse of tabs is what forces this, which is
   * itself the finding.
   */
  const activeTab = prospectTabs.find((t) => t.id === tab) ?? prospectTabs[0]!;
  usePageCrumb(
    tab === "accounts"
      ? null
      : {
          label: activeTab.label,
          options: prospectTabs.map((t) => ({
            id: t.id,
            label: t.label,
            selected: t.id === tab,
          })),
          onSelect: setTab,
        },
  );

  if (open) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <ProspectDetail prospect={open} onBack={() => setOpenId(null)} />
      </div>
    );
  }

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Prospect accounts"
        status={<Premium label="Premium" />}
        secondary={[{ label: "Categorize now", icon: Tags }]}
        primary={{ label: "Add prospect", icon: Plus }}
      />

      <ViewBar
        label="Prospecting"
        views={prospectTabs.map((t) => ({
          id: t.id,
          label: t.label,
          mark: t.paid ? <Premium /> : undefined,
        }))}
        activeId={tab}
        onSelect={setTab}
      />

      {tab === "accounts" ? (
        <AllAccounts onOpen={setOpenId} />
      ) : (
        <TabStub label={activeTab.label} paid={activeTab.paid} />
      )}
    </div>
  );
}

function AllAccounts({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-auto pb-[14px]">
      {/*
        The collection's own heading, under the tab strip.

        A second heading on a page that already has one, which normally would
        be the duplication slot 05 exists to prevent — and here it is not,
        because the tab strip sits between them and changes what the lower
        one says. "Prospect accounts" names the product; "All prospects"
        names the tab. Read together they are a path, and dropping the lower
        one would leave the filters attached to nothing.
      */}
      <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <h2 className="text-[15.5px] leading-[21px] font-semibold text-pg-heading">
            All prospects
          </h2>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Manage all your prospect accounts seamlessly in one place.
          </p>
        </div>
        <span aria-hidden="true" className="min-w-[16px] flex-1" />
        {["Categories", "Source", "Status"].map((f) => (
          <button
            key={f}
            type="button"
            className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg active:scale-[0.98]"
          >
            <ListFilter size={15} aria-hidden="true" className="text-pg-muted" />
            {f}
          </button>
        ))}
        <div className="flex h-[34px] w-[230px] min-w-0 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
          <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="search"
            placeholder="Search prospects"
            aria-label="Search prospects"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
      </div>

      <SuggestionRail />

      {prospects.map((p) => (
        <ProspectCard key={p.id} prospect={p} onOpen={() => onOpen(p.id)} />
      ))}
    </div>
  );
}

/**
 * The AI's candidates, in a horizontal rail above the list.
 *
 * A rail rather than rows, and the distinction is doing real work: these
 * accounts are NOT in the collection. They have no status, no categories and
 * no history, and drawing them as list rows would put four objects in the
 * table that the Status filter cannot see and the count does not include.
 * A rail is the shape that says "these are on offer" — you scroll it, you
 * take one, and what you did not take is still not yours.
 *
 * Scrolled by real overflow with the chevrons driving it, rather than by an
 * index into a page: a rail whose arrows page by three loses its last card
 * whenever the viewport fits two and a half.
 */
function SuggestionRail() {
  const railRef = React.useRef<HTMLDivElement | null>(null);

  const nudge = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="relative shrink-0 rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <h3 className="mb-[12px] flex items-center gap-[8px] text-[14px] leading-[20px] font-semibold text-[var(--ai-btn-fg)]">
        <Sparkles size={16} aria-hidden="true" />
        AI generated prospects
      </h3>

      <div
        ref={railRef}
        className="flex snap-x snap-mandatory gap-[14px] overflow-x-auto scroll-smooth pb-[2px]"
      >
        {suggestions.map((s) => (
          <article
            key={s.id}
            className="flex w-[330px] shrink-0 snap-start flex-col gap-[10px] rounded-[10px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
          >
            <div className="flex items-start gap-[10px]">
              <ToneAvatar name={s.name} initials={s.initials} tone={s.tone} size={32} round />
              <h4 className="min-w-0 flex-1 text-[14px] leading-[20px] font-semibold text-pg-heading">
                {s.name}
              </h4>
            </div>

            <div className="flex items-start gap-[10px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                <FactRow icon={MapPin} action="open">
                  {s.address}
                </FactRow>
                <FactRow icon={Phone} action="copy">
                  {s.phone}
                </FactRow>
                <FactRow icon={Globe} action="open">
                  {s.site}
                </FactRow>
                <FactRow icon={Star} action="open">
                  {s.rating}
                </FactRow>
              </div>
              {/*
                The report link, beside the facts rather than under them: it
                acts on the whole card, and at the foot it would have read as
                a fifth fact.
              */}
              <button
                type="button"
                className="motion-tap shrink-0 text-[13px] leading-[19px] font-medium text-brand hover:underline"
              >
                View report
              </button>
            </div>

            <div className="flex flex-col gap-[7px] border-t border-pg-row-border pt-[10px]">
              <span className="flex items-center gap-[8px] text-[12.5px] leading-[normal] text-pg-muted">
                Niche:
                <span className="rounded-[6px] bg-brand-soft px-[7px] py-[2px] text-[12px] leading-[16px] font-medium text-brand">
                  {s.niche}
                </span>
              </span>
              <span className="flex items-center gap-[8px] text-[12.5px] leading-[normal] text-pg-muted">
                AI conversion score:
                <ScoreChip score={s.score} />
              </span>
            </div>
          </article>
        ))}
      </div>

      {/*
        The arrows straddle the rail's edges rather than sitting inside it,
        so no card is permanently half-covered by a control. They are inert
        decoration when the rail is not overflowing — which is honest enough
        at this size, and cheaper than a resize observer whose only job would
        be to hide two buttons.
      */}
      {(
        [
          ["left", ChevronLeft, -1],
          ["right", ChevronRight, 1],
        ] as const
      ).map(([side, Icon, dir]) => (
        <button
          key={side}
          type="button"
          aria-label={side === "left" ? "Previous prospects" : "More prospects"}
          onClick={() => nudge(dir)}
          className={cn(
            "motion-tap absolute top-1/2 flex size-[30px] -translate-y-1/2 items-center justify-center rounded-full bg-pg-surface text-pg-muted shadow-[0_2px_8px_rgba(16,24,40,0.12),inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading active:scale-95",
            side === "left" ? "left-[-10px]" : "right-[-10px]",
          )}
        >
          <Icon size={16} aria-hidden="true" />
        </button>
      ))}
    </section>
  );
}

/**
 * An account on the list, as a card rather than a table row.
 *
 * Cards because the object is not tabular: four contact facts, a variable
 * run of category chips and a score do not line up into columns that mean
 * anything across rows — and the production screen agrees. The cost is real
 * and worth stating: you cannot scan a column of scores down a page of
 * cards the way you can down a table, which is exactly what the Status and
 * Categories filters above are compensating for.
 */
function ProspectCard({
  prospect,
  onOpen,
}: {
  prospect: Prospect;
  onOpen: () => void;
}) {
  return (
    <article className="flex shrink-0 gap-[16px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <ToneAvatar
        name={prospect.name}
        initials={prospect.initials}
        tone={prospect.tone}
        size={38}
        round
      />

      <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <button
            type="button"
            onClick={onOpen}
            className="motion-tap min-w-0 truncate text-[15px] leading-[21px] font-semibold text-pg-heading hover:text-brand hover:underline"
          >
            {prospect.name}
          </button>
          {prospect.premiumReport ? <Premium label="Premium report" /> : null}
          <Chip tone="brand">{prospect.status}</Chip>
          <Chip tone="brand">{prospect.niche}</Chip>
          {prospect.source === "AI" ? <Chip tone="ai">AI</Chip> : null}
          {/*
            "Add categories" is a control, not a chip, and it is dashed so it
            reads as an empty slot rather than as a category called "Add
            categories" — the mistake the solid version made when it sat in
            the same run.
          */}
          <button
            type="button"
            className="motion-tap flex h-[22px] shrink-0 items-center gap-[4px] rounded-[6px] border border-dashed border-pg-border-strong px-[8px] text-[11.5px] leading-none font-medium text-pg-muted hover:border-brand hover:text-brand"
          >
            Add categories
            <Plus size={12} aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-[6px]">
          <FactRow icon={MapPin} action="open">
            {prospect.address}
          </FactRow>
          <FactRow icon={Phone} action="copy">
            {prospect.phone}
          </FactRow>
          <FactRow icon={Globe} action="open">
            {prospect.site}
          </FactRow>
          <FactRow icon={Star} action="open">
            {prospect.rating}
          </FactRow>
        </div>
      </div>

      <div className="flex w-[160px] shrink-0 flex-col items-end gap-[8px]">
        <span className="text-[12.5px] leading-[17px] text-pg-muted">
          Prospect score
        </span>
        <ScoreChip score={prospect.score} />
        <button
          type="button"
          onClick={onOpen}
          className="motion-tap mt-[4px] text-[13px] leading-[19px] font-medium text-brand hover:underline"
        >
          View report
        </button>
      </div>
    </article>
  );
}

function Chip({
  tone,
  children,
}: {
  tone: "brand" | "ai" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-[22px] shrink-0 items-center rounded-[6px] px-[8px] text-[11.5px] leading-none font-medium whitespace-nowrap",
        tone === "brand"
          ? "bg-brand-soft text-brand"
          : tone === "ai"
            ? "bg-[var(--ai-btn-from)] text-[var(--ai-btn-fg)]"
            : "bg-pg-bg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      {children}
    </span>
  );
}

/**
 * The five tabs that are not the collection.
 *
 * Stubs, and deliberately honest ones rather than mocked-up screens. What
 * this study is reviewing is the NAVIGATION — whether five unrelated objects
 * belong behind one tab strip — and building five plausible-looking screens
 * would answer a question nobody asked while making the strip look more
 * reasonable than it is. Each one names what it would be and says plainly
 * that it is not built.
 */
function TabStub({ label, paid }: { label: string; paid?: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[10px] rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      {paid ? <Premium label="Premium" /> : null}
      <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
        {label}
      </h2>
      <p className="max-w-[420px] text-center text-[13px] leading-[19px] text-pg-muted">
        Not built in this prototype. It is here because the product files it
        as a tab of Prospecting, which is the arrangement under review.
      </p>
      <PrimaryButton>Open {label.toLowerCase()}</PrimaryButton>
    </div>
  );
}
