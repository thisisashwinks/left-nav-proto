"use client";

import * as React from "react";
import {
  ArrowUpDown,
  Check,
  EllipsisVertical,
  Folder,
  FolderPlus,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import { AiSparkle } from "@/components/icons/ai-sparkle";
import { PageHeader, usePageChrome } from "@/components/page/page-header";
import { ViewBar } from "@/components/page/view-bar";
import {
  CollapsingSearch,
  GlyphButton,
  useListShape,
} from "@/components/page/list-shape";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { voiceAgentRows, type VoiceAgentRow } from "./voice-ai-data";
import { VoiceAgentBuilder } from "./voice-agent-builder";

/**
 * AI Agents ▸ Voice AI — the agent list, and one agent open in the builder.
 *
 * One component owns both for the reason funnels-page and workflows-page do:
 * an opened agent is not a different PLACE in the nav's sense. You are still
 * in Voice AI, the trail grows a crumb (see the builder's useRecordCrumb) and
 * the sidebar selection does not move. Making the builder a destination would
 * give the nav an opinion about a thing you can only reach by clicking a row.
 *
 * Reached from product-page's REAL_PAGES on both catalogues at once —
 * `ai-agents-product`/`ai-voice` in the shipped tree and the `ia-ai-voice-*`
 * family in the proposed one — so whichever grouping axis the panel is set to,
 * the same two screens come up. That registration was written before this file
 * was, deliberately, so the wiring and the screens could be built by two
 * different pairs of hands without either waiting on the other.
 *
 * `ia-ai-voice-dashboard` lands here too, on the Agent List tab rather than on
 * Dashboard & Logs. That is a known, deliberate lie and a small one: the
 * dashboard is charts, this prototype is about the builder's chrome, and
 * sending someone who clicked Dashboard to an empty stage would cost the
 * review the one screen it came for.
 */

/**
 * Two cuts of Voice AI, as line tabs.
 *
 * They pass the ViewBar test only just, and it is worth naming why they pass:
 * both are views over the same set of agents — the list of them, and what they
 * have been doing. Neither leads to another object and neither is a settings
 * screen. Dashboard & Logs is a stage here for the reason above.
 */
const TABS = [
  { id: "dashboard", label: "Dashboard & Logs" },
  { id: "agents", label: "Agent List" },
];

/**
 * Name, Numbers, Widgets, Last Updated — plus the checkbox and the kebab.
 *
 * Widgets is 0.8fr and permanently a dash in this fiction, which is not an
 * oversight: the column exists in the live product and is empty in almost
 * every sub-account, and a prototype that quietly dropped the empty column
 * would be proposing a narrower table than the one anyone has to ship.
 */
const COLS = "34px 2.4fr 1.4fr 0.8fr 1fr 36px";

export function VoiceAiPage() {
  const { effective } = useTheme();
  const chrome = usePageChrome();
  /*
   * This page joins the list axis for one variant only, and it is worth being
   * honest about which.
   *
   * Its two tabs are views over the agents (the list of them, and what they
   * have been doing) — they pass ViewBar's test, but they are not SAVED views:
   * nobody made them and nobody can make a third. So L-B's picker and L-E's
   * switching crumb have nothing to pick from that a two-tab strip does not
   * already show at a glance, and this page sits those two out exactly as it
   * always has. L-F is different in kind: it does not ask where the scope
   * lives, it asks whether the filter row needs a row, and this page has a
   * filter row like any other. So `oneRow` is read and the rest is not.
   *
   * The two Sep 23 band switches are read for the same reason `oneRow` is:
   * neither asks where a control lives, both ask whether a band is worth its
   * height, and this page has both bands. `showViews` is the arguable one —
   * these tabs are not SAVED views — and it applies anyway, because what the
   * switch governs is a strip of cuts over one collection, which is exactly
   * what this is. Off, the page is the agent list and Dashboard & Logs is
   * unreachable from here, which is the same bargain every other list makes.
   */
  const { oneRow, showViews, showFilters } = useListShape();
  const [tab, setTab] = React.useState("agents");
  const [openAgent, setOpenAgent] = React.useState<string | null>(null);
  /*
   * Selection lives on the list, not on the row.
   *
   * A Set rather than a flag per row, because the header checkbox has to be
   * able to answer "are all of these on" in one read — and because the CRUD
   * bar this list will eventually grow needs the count, not twelve booleans.
   */
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const agentRows = React.useMemo(
    () => voiceAgentRows.filter((r) => r.count === null),
    [],
  );
  const allOn = selected.size === voiceAgentRows.length;

  if (openAgent) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <VoiceAgentBuilder
          agentName={openAgent}
          onBack={() => setOpenAgent(null)}
        />
      </div>
    );
  }

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Voice AI"
        count={String(agentRows.length)}
        description="Agents that answer, qualify and book on the phone"
        aside={<UpgradeButton />}
        secondary={[{ label: "Create Folder", icon: FolderPlus }]}
        primary={{ label: "Create Agent", icon: Plus }}
      />

      {showViews ? (
      <ViewBar
        label="Voice AI views"
        views={TABS}
        activeId={tab}
        onSelect={setTab}
        className={oneRow && tab === "agents" ? "h-[46px]" : undefined}
        /*
          Only on the agent list. Dashboard & Logs has no filter row to fold
          in, so folding one in would be drawing a toolbar for a tab that does
          not have one — and the two tabs would then sit at two heights, which
          makes switching between them jump.
        */
        trailing={
          oneRow && tab === "agents" ? (
            <span className="flex shrink-0 items-center gap-[8px]">
              <GlyphButton icon={ArrowUpDown} label="Sort By" />
              <CollapsingSearch
                placeholder="Search name or channel"
                label="Search name or channel"
              />
              {chrome.header ? null : <UpgradeButton />}
            </span>
          ) : undefined
        }
      />
      ) : null}

      {tab === "agents" ? (
        <>
          {/*
            L-F took this row's two controls up onto the tab strip, so the row
            itself goes. Every other variant keeps it where it is.

            `listShowFilters: false` empties it — and then the row survives
            only if the header is also off, because the upgrade offer below
            would otherwise have nowhere left to be. That is the one case in
            this file where a band outlives its own contents, and it is worth
            being explicit that it is a prototype concern rather than a
            product one: a plan wall nobody can reach is a plan wall nobody
            can price, and switching a header variant must not be the thing
            that hides it.
          */}
          {oneRow || (!showFilters && chrome.header) ? null : (
          <div className="flex shrink-0 items-center gap-[10px]">
            {showFilters ? (
            <>
            {/*
              Sort before search, which is the order the live product uses and
              the opposite of every other list in this prototype.

              Kept rather than normalised: this table's default order is
              last-updated descending and the names are near-useless for
              finding anything ("My Agent 441", "My Agent 629"), so sorting is
              the control operators actually reach for first. Moving it behind
              the search field to match Funnels would have been tidier and
              wrong about what this list is for.
            */}
            <button
              type="button"
              className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
            >
              <ArrowUpDown
                size={15}
                aria-hidden="true"
                className="text-pg-text-strong"
              />
              Sort By
            </button>

            <div className="flex h-[34px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <Search
                size={16}
                aria-hidden="true"
                className="shrink-0 text-pg-faint"
              />
              <input
                type="search"
                placeholder="Search name or channel"
                aria-label="Search name or channel"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>

            </>
            ) : (
              /*
                The slack the search field was taking, so the offer below
                keeps the right edge it holds when the controls are there.
              */
              <span aria-hidden="true" className="min-w-[16px] flex-1" />
            )}

            {/*
              The upgrade offer's second home, for the same reason funnels-page
              keeps a second Build with AI: the page-header knobs can take the
              whole of slot 05 away, and every other action it carries has
              another route (Create Agent is the empty state's own CTA, Create
              Folder is in the row kebab). This one has none — and an AI plan
              wall that vanishes when a reviewer switches to a titleless list
              is a wall nobody can price.
            */}
            {chrome.header ? null : <UpgradeButton />}
          </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            <div
              style={{ gridTemplateColumns: COLS }}
              className="sticky top-0 z-10 grid h-[38px] items-center gap-[12px] border-b border-pg-head-border bg-pg-surface px-[14px]"
            >
              <button
                type="button"
                aria-label={allOn ? "Clear selection" : "Select all agents"}
                onClick={() =>
                  setSelected(
                    allOn
                      ? new Set()
                      : new Set(voiceAgentRows.map((r) => r.id)),
                  )
                }
                className="group flex items-center"
              >
                <Checkbox checked={allOn} />
              </button>
              {["Name", "Numbers", "Widgets", "Last Updated", ""].map(
                (h, i) => (
                  <span
                    key={h || `blank-${i}`}
                    className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>

            {voiceAgentRows.map((row) => (
              <AgentListRow
                key={row.id}
                row={row}
                checked={selected.has(row.id)}
                onToggle={() =>
                  setSelected((cur) => {
                    const next = new Set(cur);
                    if (!next.delete(row.id)) next.add(row.id);
                    return next;
                  })
                }
                /*
                 * Folders do not open the builder. They would open into
                 * themselves — the same table, scoped — and that screen is
                 * the fourth one in a task about two, so the row stays inert
                 * rather than pretending.
                 */
                onOpen={
                  row.count === null ? () => setOpenAgent(row.name) : undefined
                }
              />
            ))}
          </div>

          <div className="flex h-[30px] shrink-0 items-center">
            <span className="text-[13px] leading-[normal] text-pg-muted">
              {selected.size > 0
                ? `${selected.size} of ${voiceAgentRows.length} selected`
                : `Showing ${voiceAgentRows.length} of ${voiceAgentRows.length} items`}
            </span>
          </div>
        </>
      ) : (
        /*
         * Dashboard & Logs — a stage, on purpose.
         *
         * The tab is here because the pair is what the live product shows and
         * because the builder has to be reachable from a screen that admits
         * this list is only half of Voice AI. Drawing fake call-volume charts
         * would invite a review of the charts.
         */
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-[11px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <p className="text-[13px] leading-[normal] text-pg-faint">
            Dashboard &amp; Logs — same page, same header.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * The plan wall, styled as an AI surface rather than as a button.
 *
 * Reads off --ai-btn-*, the pair every AI affordance in this prototype uses,
 * and deliberately NOT the brand fill: there is exactly one filled brand
 * button on a page and that is Create Agent. An upgrade offer competing with
 * the page's own default action is how a list ends up with two things
 * shouting, and the one that should win is the one that makes an agent.
 */
function UpgradeButton() {
  return (
    <button
      type="button"
      className={cn(
        "motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] px-[14px] text-[13px] leading-[normal] font-semibold whitespace-nowrap",
        "bg-[linear-gradient(120deg,var(--ai-btn-from),var(--ai-btn-to))] text-[var(--ai-btn-fg)]",
        "hover:brightness-[1.03] active:scale-[0.97]",
      )}
    >
      <AiSparkle box={16} glyphWidth={14} offsetX={1} offsetY={0.9} />
      Upgrade to unlimited AI Employee plan
    </button>
  );
}

/** 17px box, 5px radius, 1.5px border — the same checkbox the contacts table
    draws, copied rather than imported because that one is private to it. */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "motion-tap flex size-[17px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
        checked
          ? "border-brand bg-brand text-white"
          : "border-pg-disabled bg-pg-surface group-hover:border-pg-muted",
      )}
    >
      {checked ? <Check size={12} aria-hidden="true" /> : null}
    </span>
  );
}

function AgentListRow({
  row,
  checked,
  onToggle,
  onOpen,
}: {
  row: VoiceAgentRow;
  checked: boolean;
  onToggle: () => void;
  onOpen?: () => void;
}) {
  const isFolder = row.count !== null;
  return (
    <div
      style={{ gridTemplateColumns: COLS }}
      className={cn(
        "group grid h-[48px] w-full items-center gap-[12px] border-b border-pg-row-border px-[14px] last:border-b-0 hover:bg-pg-bg",
        checked && "bg-pg-row-selected",
      )}
    >
      <button
        type="button"
        aria-label={`${checked ? "Deselect" : "Select"} ${row.name}`}
        onClick={onToggle}
        className="flex items-center"
      >
        <Checkbox checked={checked} />
      </button>

      {/*
        The name is the button, not the row — the kebab has to be clickable
        without opening the agent, and a button inside a button is invalid.
      */}
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className={cn(
          "flex min-w-0 items-center gap-[9px] text-left",
          onOpen ? "motion-tap" : "cursor-default",
        )}
      >
        {isFolder ? (
          <Folder size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
        ) : null}
        <span
          className={cn(
            "truncate text-[13px] leading-[normal] font-medium text-pg-text-strong",
            onOpen && "group-hover:text-pg-heading",
          )}
        >
          {row.name}
        </span>
        {/*
          The count rides with the folder's name rather than living in its own
          column, because only folders have one and an empty column for eight
          of twelve rows is a column that has to be explained. Muted and
          parenthesised so it reads as part of the name, which is how the live
          product writes it.
        */}
        {isFolder ? (
          <span className="shrink-0 text-[13px] leading-[normal] text-pg-faint tabular-nums">
            ({row.count})
          </span>
        ) : null}
      </button>

      <span className="flex min-w-0 items-center gap-[7px]">
        {row.number ? (
          <>
            <Phone size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <span className="truncate text-[13px] leading-[normal] text-pg-text tabular-nums">
              {row.number}
            </span>
          </>
        ) : (
          <Dash />
        )}
      </span>

      {/*
        Widgets, permanently empty. See COLS — the dash is the honest render of
        a column the live product has and almost nobody fills.
      */}
      <Dash />

      {/*
        Two lines in one cell, date over time.

        Not "21 May 2026, 11:27 PM" on one line: the column is 1fr in a
        six-column grid and the single line truncates the time away at any
        window narrower than about 1500px — which loses precisely the half an
        operator uses to tell this morning's edit from last night's.
      */}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[12.5px] leading-[16px] text-pg-text">
          {row.updatedDate}
        </span>
        <span className="truncate text-[11.5px] leading-[15px] text-pg-faint tabular-nums">
          {row.updatedTime}
        </span>
      </span>

      <button
        type="button"
        aria-label={`Actions for ${row.name}`}
        className="motion-tap flex size-[28px] items-center justify-center rounded-[7px] text-pg-faint opacity-0 group-hover:opacity-100 hover:bg-pg-surface hover:text-pg-text focus-visible:opacity-100"
      >
        <EllipsisVertical size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

/** An en dash, not a hyphen and not an empty cell — the cell has to hold its
    width and an operator has to be able to tell "none" from "not loaded". */
function Dash() {
  return (
    <span aria-label="None" className="text-[13px] leading-[normal] text-pg-faint">
      –
    </span>
  );
}
