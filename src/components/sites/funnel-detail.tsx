"use client";

import * as React from "react";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  GitCompareArrows,
  Pencil,
  Plus,
  Workflow,
} from "lucide-react";
import { OutlineButton, PageHeader, usePageChrome } from "@/components/page/page-header";
import { usePageCrumb } from "@/components/page/page-crumb";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  funnelMetrics,
  funnelRows,
  funnelStepStats,
  funnelSteps,
  type FunnelRow,
  type FunnelStep,
} from "./funnels-data";

/**
 * The three faces of one funnel.
 *
 * Added Sep 23, on Ashwin's report that the page "has tabs inside it" and this
 * one had none. The set is derived from the page rather than invented: the
 * meta strip this replaced carried exactly two OutlineButtons — Stats and
 * Settings — standing beside a steps column, and two buttons that each swap
 * the whole canvas for a different view of the same funnel are a tab strip
 * that has not been drawn yet. Converting them rather than keeping both was
 * the only honest option: a Stats tab beside a Stats button is two doors to
 * one room, and a reviewer cannot tell which one the design meant.
 *
 * FLAGGED AS AN ASSUMPTION. The screenshots of the live page did not reach
 * this session, and there is no funnel-detail shot in the production crawl
 * either — research-files/assets/ghl/SHOTLIST.md lists `sites-funnels.png`
 * (the LIST) and nothing below it. So Steps / Stats / Settings is what the
 * repo can support, not what the product was measured to have. If his
 * screenshot shows a fourth face, add it here; the strip below is a plain
 * array and the panels are three siblings.
 */
const TABS = [
  { id: "steps", label: "Steps" },
  { id: "stats", label: "Stats" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * One funnel, opened.
 *
 * `useRecordCrumb`, not `usePageCrumb`. The two look interchangeable from a
 * distance and are not: a page crumb is a SCOPE the page owns and can switch
 * between siblings (the smart list, the pipeline), while a record crumb says
 * "I have drilled into one object" and hands the trail an exit. This is the
 * second thing — you opened a funnel out of a list of them, and the way back
 * is the trail above.
 *
 * It publishes BOTH since Sep 23, which the first cut of this file argued
 * against ("the funnel has no sibling picker on this screen"). That was true
 * of the screen and false of the funnel: there are nine funnels in the list
 * and the trail already draws a menu on every other crumb that has siblings.
 * See the note on the page crumb below for what each of the two is carrying.
 *
 * What it no longer refuses is a header. The first cut had no title row on the
 * ground that the trail already says the funnel's name — a reasonable position,
 * but one this page was taking unilaterally while `pageTitle`, `pageDescription`
 * and `pageCount` sat in the panel doing nothing here. That is the wrong way to
 * hold an opinion: the axis exists so the duplication can be switched OFF and
 * looked at, and a page that hard-codes one side of it removes itself from the
 * comparison. Slot 05 is drawn through PageHeader on the ordinary `chrome="axis"`
 * path, so turning the title off across the app turns it off here too.
 */
export function FunnelDetail({
  funnel,
  onBack,
  onOpenFunnel,
  onEditStep,
}: {
  funnel: FunnelRow;
  onBack: () => void;
  /**
   * Open a SIBLING funnel, without closing this screen first.
   *
   * Handed up rather than held here because funnels-page owns `openId` — the
   * same reason the builder is opened from up there. See the crumb note below
   * for why this exists at all.
   */
  onOpenFunnel: (id: string) => void;
  /**
   * Open the page builder on one step.
   *
   * Handed down rather than opened here, because the builder is full-bleed: it
   * asks the shell to drop the sidebar and the app bar, and a screen rendered
   * INSIDE this one would be asking for that from under a detail view that is
   * still mounted and still publishing its own record crumb. funnels-page owns
   * list → detail → builder as three exclusive states for exactly that reason,
   * which is also how it already handles the AI builder.
   */
  onEditStep: (step: FunnelStep) => void;
}) {
  const { effective } = useTheme();
  const [stepId, setStepId] = React.useState(funnelSteps[0]?.id ?? "");
  const step = funnelSteps.find((s) => s.id === stepId) ?? funnelSteps[0]!;
  const [tab, setTab] = React.useState<TabId>("steps");

  useRecordCrumb({ name: funnel.name, kind: "Funnel details" }, onBack);

  /*
   * The funnel's siblings, offered from the trail.
   *
   * Ashwin's "inline dropdown" has two readings and this is the one that was
   * actually broken. The other — `deepInlineCrumb`, the panel's "Inline trail
   * for L4/L5" — does not reach this screen at all and should not: it is
   * gated on `isDeepPage`, which matches the Voice AI chain by id and nothing
   * else (deep-sections.tsx), so a funnel honouring it would be this page
   * claiming to be an L4/L5 stack that the catalogue does not give it. That
   * knob is not dead here, it is out of scope here, and the difference matters.
   *
   * What WAS dead is this: every crumb in the trail with siblings draws a menu,
   * and the one crumb standing over an open funnel drew a word. So the Funnels
   * crumb is republished with the funnels under it as options.
   *
   * `replace: true`, not append. The shell's trail already ends in "Funnels"
   * (SCREEN_NAMES.funnels, via the catalogue), and appending would print it
   * twice — replace is documented for exactly this case, "the page whose scope
   * IS the thing the shell's tail already names".
   *
   * Folders are filtered out, and that is the argument rather than a tidy-up: a
   * folder is not a sibling of the open funnel, it is a container you would have
   * to open first, and a menu that mixes the two would offer a choice that half
   * works. The record crumb still names which funnel is open, so this segment
   * only has to answer "which others are there".
   *
   * Note what app-shell does to this on the way out: `withRecordCrumb` wraps
   * every switchable segment so picking one closes the record first, then runs
   * the page's own handler. That is the right order here and not a fight — the
   * open funnel really does close, and `onOpenFunnel` opens the chosen one in
   * the same batch, so the screen swaps rather than bouncing through the list.
   *
   * It is published unconditionally, and `crumbSwitchers: false` is allowed to
   * take the caret away — the same treatment every other switchable crumb gets.
   * Gating the publish on that axis would make this page the one place where
   * "no switchers" also meant "no options were ever offered", so flipping the
   * axis back on would leave the funnel crumb inert while its neighbours woke
   * up. The axis decides what the BAR draws; the page just states what it has.
   */
  usePageCrumb({
    label: "Funnels",
    replace: true,
    options: funnelRows
      .filter((f) => f.kind === "funnel")
      .map((f) => ({
        id: f.id,
        label: f.name,
        icon: Workflow,
        selected: f.id === funnel.id,
      })),
    onSelect: onOpenFunnel,
  });

  /*
   * The back control, read exactly the way contact-detail reads it.
   *
   * Same three axes, same meanings, because two record screens that disagreed
   * about what "header" means would make the axis unmeasurable — the panel
   * would be describing one page and the reviewer would be looking at another.
   *
   * `crumb` draws nothing here: app-header already puts the arrow at the head
   * of the trail, driven by the `onExit` handed to useRecordCrumb above. A page
   * that also drew one would put two exits on screen, which is the duplication
   * the whole axis exists to settle.
   *
   * `header` is the placement that can have nowhere to go, and when it does it
   * draws NOTHING — deliberately, and not by falling back to the inline spot.
   * Slot 05 can be switched off entirely (`pageHeader: false`), and a silent
   * fallback would mean the panel said "header" while the canvas showed the
   * inline answer. The panel's own Note already warns the placement "only
   * exists while the record draws a header"; an empty result is that sentence
   * being true. Note the condition is `chrome.header`, not `chrome.title`: a
   * titleless header is still a row, with the count, the actions and the lead
   * slot on it, so the exit has somewhere to stand.
   */
  const chrome = usePageChrome();
  const backButton = effective.recordBackButton;
  const backPlace = effective.recordBackPlace;
  const headerBack = backButton && backPlace === "header" && chrome.header;
  /*
   * Inline means the head of the FIRST column in the canvas, on every tab.
   *
   * Which is why it is threaded through one `ColumnHead` rather than dropped
   * into the steps column: the steps column is not on screen under Stats or
   * Settings, and an exit that vanished when you changed tab would be a
   * different, worse option than the one the axis is offering. Each panel's
   * leading card takes the lead slot, so there is exactly one of these
   * whichever tab is open.
   */
  const inlineBack = backButton && backPlace === "inline";
  const back = <BackToFunnels onBack={onBack} />;

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        /*
         * `chrome="axis"` by omission, and that is the decision.
         *
         * NOT `chrome="own"`. That mode is for a page whose header has its own
         * dedicated switch — contact-detail's, which is chosen by the record
         * VARIANT picker and would otherwise be overruled by whatever a list
         * variant wrote into the shared knobs. This page has no such switch and
         * should not grow one: a funnel is a record you opened out of a list,
         * and "does a page name itself" is meant to be answered once for the
         * whole app. Taking the `own` escape hatch here would quietly remove
         * this screen from the only comparison the axis exists to run.
         */
        title={funnel.name}
        /*
         * The count is the funnel's own noun — "5 Steps", "3 Steps" — carried
         * on the row rather than parsed out of it. funnels-data puts the noun
         * ON the row for this reason: a column header cannot say whether it is
         * counting steps or funnels, and neither can a count pill.
         */
        count={funnel.count}
        /*
         * What is left of the old meta strip's left-hand line, once the count
         * has been lifted out of it into the pill. Lower-cased because the row
         * stores it capitalised for a table cell ("Yesterday") and this is a
         * sentence — the same treatment the CONTROL card's "Edited …" already
         * gives it.
         */
        description={`Last updated ${funnel.updated.toLowerCase()}`}
        lead={headerBack ? back : undefined}
        /*
         * No actions on the row, and nothing has been lost.
         *
         * The two the strip carried are the tabs now, Edit belongs to the CARD
         * it edits (a step can have two versions, so "edit the funnel" has no
         * referent), and Add step belongs to the column it appends to. Inventing
         * a primary to fill the right edge would be putting a button on a page
         * to make a header look finished.
         */
      />

      {/*
        The tab strip, in the underlined idiom ProductPage and DeepTabs both
        draw — byte for byte the same classes, so it is the same control and
        not a fourth tab style arriving on one screen.

        `DeepTabs` itself was the first thing tried and it does not fit, for
        two reasons that are both in its signature: it takes `DeepSection[]`,
        whose `icon` and `subs` are required, so three faces of a funnel would
        have to invent a glyph each and carry an empty L5 array to satisfy a
        type that is describing a different tree; and its `aria-label` is the
        literal string "Voice AI sections", which a funnel page cannot
        truthfully announce. Widening it would mean editing deep-sections for
        the benefit of one screen — and that file already faced this exact
        choice against ProductPage's catalogue strip and wrote the answer
        down: "copied rather than shared … until then the duplication is
        cheaper than the abstraction". When a third caller appears the three
        collapse into one component with a `label` prop; two is not three.

        It does not answer to `deepHeaderVariant`, and that was checked rather
        than assumed. That axis governs the Voice AI L4/L5 chain only — its
        page is selected by `isDeepPage`, which is a hard-coded id set — so
        there is nothing here for the five variants to be arguing about. These
        are three faces of ONE record, not two levels of a tree.
      */}
      <div
        role="tablist"
        aria-label="Funnel sections"
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
      </div>

      {tab === "steps" ? (
        <div className="flex min-h-0 flex-1 gap-[16px] pb-[2px]">
          {/*
            The steps column.

            A list on the left of the thing it selects, rather than a second tab
            strip under the first: a funnel's steps are ordered and a funnel
            grows to eight or ten of them, and an ordered set that long is a
            column. It is also the only reading that leaves room for the step's
            own panel to carry two cards side by side, which is the comparison
            this screen exists for.
          */}
          <div className="flex w-[248px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            <ColumnHead
              lead={inlineBack ? back : null}
              title="Funnel steps"
              trailing={
                <button
                  type="button"
                  aria-label="Add step"
                  title="Add step"
                  className="motion-tap flex size-[24px] items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading active:scale-95"
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              }
            />
            <div className="flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto p-[8px]">
              {funnelSteps.map((s, i) => {
                const on = s.id === step.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStepId(s.id)}
                    className={cn(
                      "motion-tap flex items-center gap-[9px] rounded-[8px] px-[9px] py-[8px] text-left",
                      on ? "bg-pg-row-selected" : "hover:bg-pg-bg",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-[20px] shrink-0 items-center justify-center rounded-[6px] text-[11px] leading-[normal] font-semibold",
                        on
                          ? "bg-brand text-brand-fg"
                          : "bg-pg-bg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span
                        className={cn(
                          "truncate text-[13px] leading-[18px]",
                          on
                            ? "font-semibold text-pg-heading"
                            : "font-medium text-pg-text",
                        )}
                      >
                        {s.name}
                      </span>
                      <span className="truncate text-[11.5px] leading-[16px] text-pg-faint">
                        {s.path}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* The open step. */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[14px] overflow-y-auto rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            {/*
              The URL, whole and selectable-looking.

              Not truncated to the path: this is the line an operator copies into
              an ad, and a URL you have to hover to read is one you cannot trust
              you have copied correctly.
            */}
            <div className="flex shrink-0 items-center gap-[10px]">
              <span className="text-[12px] leading-[normal] font-medium text-pg-muted">
                URL
              </span>
              <span className="flex h-[32px] min-w-0 flex-1 items-center rounded-[8px] bg-pg-bg px-[11px] text-[13px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <span className="truncate">{step.url}</span>
              </span>
              <IconAction icon={Copy} label="Copy URL" />
              <IconAction icon={ExternalLink} label="Open in a new tab" />
            </div>

            <div className="flex min-h-0 flex-wrap gap-[16px]">
              {/*
                CONTROL and VARIATION, side by side and the same size.

                Equal weight on purpose: a split test is a comparison, and drawing
                the empty half smaller would make "create a variation" look like a
                minor action rather than the other half of an experiment.
              */}
              <StepCard label="Control" share="100% of traffic">
                {/* The thumbnail. A drawing of the page, not an iframe — the
                    prototype has no page to render, and a grey rectangle would
                    not tell you which step you were looking at. */}
                <div className="flex h-[180px] w-full flex-col overflow-hidden rounded-[9px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
                  <div className="flex h-[72px] shrink-0 flex-col items-center justify-center gap-[6px] bg-pg-overlay">
                    <span className="h-[7px] w-[54px] rounded-full bg-pg-overlay-fg opacity-90" />
                    <span className="h-[5px] w-[86px] rounded-full bg-pg-overlay-fg opacity-50" />
                  </div>
                  <div className="flex flex-1 items-center gap-[10px] p-[12px]">
                    <span className="h-full w-[38%] rounded-[6px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]" />
                    <span className="h-full flex-1 rounded-[6px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-[10px]">
                  <span className="text-[12px] leading-[normal] text-pg-faint">
                    Edited {funnel.updated.toLowerCase()}
                  </span>
                  {/*
                    The one door to the page builder.

                    On the CONTROL card and not on the step row in the column at
                    the left: a step can have two versions under a split test, and
                    "edit the step" would be ambiguous the moment the variation
                    card fills in. What you edit is a page, and each card is one.
                  */}
                  <OutlineButton onClick={() => onEditStep(step)}>
                    <Pencil size={15} aria-hidden="true" className="text-pg-text-strong" />
                    Edit
                  </OutlineButton>
                </div>
              </StepCard>

              <StepCard label="Variation" share="No traffic yet">
                <div className="flex h-[180px] w-full flex-col items-center justify-center gap-[10px] rounded-[9px] bg-pg-bg text-center shadow-[inset_0_0_0_1px_var(--pg-border)]">
                  <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
                    <GitCompareArrows size={17} aria-hidden="true" />
                  </span>
                  <p className="max-w-[220px] text-[12.5px] leading-[17px] text-pg-muted">
                    Start a split test to send half your traffic to a second
                    version of this step.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-[10px]">
                  <span className="text-[12px] leading-[normal] text-pg-faint">
                    Split test is off
                  </span>
                  <OutlineButton>
                    <Plus size={15} aria-hidden="true" className="text-pg-text-strong" />
                    Create variation
                  </OutlineButton>
                </div>
              </StepCard>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "stats" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <ColumnHead
            lead={inlineBack ? back : null}
            title="Performance"
            trailing={
              <span className="text-[12px] leading-[normal] text-pg-faint">
                Last 30 days
              </span>
            }
          />
          <div className="flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto p-[16px]">
            {/*
              Four tiles, then the same numbers cut by step.

              The tiles come first because the question asked of a funnel from
              outside it is "did it work", and the per-step table is the follow-up
              — which step lost them. A table alone would answer the second
              question without ever answering the first.
            */}
            <div className="flex flex-wrap gap-[12px]">
              {funnelMetrics.map((m) => (
                <div
                  key={m.label}
                  className="flex min-w-[160px] flex-1 flex-col gap-[4px] rounded-[10px] bg-pg-bg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
                >
                  <span className="text-[12px] leading-[normal] text-pg-muted">
                    {m.label}
                  </span>
                  <span className="flex items-baseline gap-[7px]">
                    <span className="text-[20px] leading-[normal] font-semibold tracking-[-0.2px] text-pg-heading tabular-nums">
                      {m.value}
                    </span>
                    {m.delta ? (
                      <span
                        className={cn(
                          "text-[12px] leading-[normal] font-medium tabular-nums",
                          m.up ? "text-brand" : "text-pg-danger",
                        )}
                      >
                        {m.delta}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <div className="grid h-[38px] grid-cols-[2.4fr_1fr_1fr_1fr] items-center gap-[16px] border-b border-pg-head-border bg-pg-bg px-[14px]">
                {["Step", "Views", "Conversions", "Rate"].map((h) => (
                  <span
                    key={h}
                    className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
                  >
                    {h}
                  </span>
                ))}
              </div>
              {funnelSteps.map((s) => {
                const row = funnelStepStats.find((r) => r.stepId === s.id);
                return (
                  <div
                    key={s.id}
                    className="grid h-[44px] grid-cols-[2.4fr_1fr_1fr_1fr] items-center gap-[16px] border-b border-pg-row-border px-[14px] last:border-b-0"
                  >
                    <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">
                      {s.name}
                    </span>
                    {/*
                      An em dash rather than a zero where the fiction has no row.
                      A zero is a measurement and would read as a step nobody
                      visited, which is a different and much worse claim.
                    */}
                    <span className="text-[13px] leading-[normal] text-pg-text tabular-nums">
                      {row?.views ?? "—"}
                    </span>
                    <span className="text-[13px] leading-[normal] text-pg-text tabular-nums">
                      {row?.conversions ?? "—"}
                    </span>
                    <span className="text-[13px] leading-[normal] text-pg-text tabular-nums">
                      {row?.rate ?? "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <ColumnHead lead={inlineBack ? back : null} title="Funnel settings" />
          <div className="min-h-0 flex-1 overflow-y-auto p-[16px]">
            {/*
              A single column at a readable measure, not a two-up grid.

              Settings here are a short list of unrelated decisions, and a grid
              would invite the eye to read across a row and pair things that have
              nothing to do with each other — the failure the shipped settings
              screens are full of.
            */}
            <div className="flex max-w-[520px] flex-col gap-[16px]">
              <Field label="Funnel name" value={funnel.name} />
              <Field label="Path" value={funnelSteps[0]?.path ?? "/"} />
              <Field label="Custom domain" value="link.mycompany.com" />
              <div className="flex flex-col gap-[8px]">
                <span className="text-[12.5px] leading-[16px] text-pg-muted">
                  Visibility
                </span>
                <CheckRow label="Let search engines index this funnel" defaultOn />
                <CheckRow label="Redirect every step to HTTPS" defaultOn />
                <CheckRow label="Show a cookie banner on every step" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The record's own way out, drawn beside whatever names the record.
 *
 * Icon-only and 24px, the same as contact-detail's — deliberately, and not
 * shared. Two record screens copying one 12-line button is cheaper than a
 * `<BackToRecordList>` in page/ that both import, because the label differs
 * and the moment it takes a `noun` prop it is a component with one job and a
 * parameter for it. What must NOT differ is the size and the placement, and
 * those are what the axis is measuring.
 */
function BackToFunnels({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      title="Back to funnels"
      aria-label="Back to funnels"
      className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-text-strong"
    >
      <ArrowLeft size={15} aria-hidden="true" />
    </button>
  );
}

/**
 * The 40px head every panel on this page opens with.
 *
 * Lifted out on Sep 23 for one reason: `recordBackPlace: "inline"` means "the
 * head of the first column in the canvas", and this page now has three
 * different first columns depending on the tab. One component with a `lead`
 * slot is how that stays one placement instead of three copies that can drift.
 */
function ColumnHead({
  lead,
  title,
  trailing,
}: {
  lead?: React.ReactNode;
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex h-[40px] shrink-0 items-center justify-between gap-[8px] border-b border-pg-head-border px-[12px]">
      <div className="flex min-w-0 items-center gap-[8px]">
        {lead}
        <span className="truncate text-[12.5px] leading-[normal] font-semibold text-pg-heading">
          {title}
        </span>
      </div>
      {trailing}
    </div>
  );
}

/** One half of the control/variation pair. */
function StepCard({
  label,
  share,
  children,
}: {
  label: string;
  share: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-[360px] min-w-[300px] flex-1 flex-col gap-[10px] rounded-[10px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex items-baseline justify-between gap-[10px]">
        <span className="text-[11.5px] leading-[normal] font-semibold tracking-[0.6px] text-pg-muted uppercase">
          {label}
        </span>
        <span className="text-[12px] leading-[normal] text-pg-faint">{share}</span>
      </div>
      {children}
    </div>
  );
}

/**
 * A settings row: label over control, 4px apart.
 *
 * `defaultValue` rather than a controlled input — nothing on this screen saves,
 * and wiring state through so a prototype field can forget it on unmount would
 * be pretending at a persistence layer that does not exist.
 */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex flex-col gap-[4px]">
      <span className="text-[12.5px] leading-[16px] text-pg-muted">{label}</span>
      <input
        defaultValue={value}
        className="h-[36px] w-full rounded-[8px] bg-pg-surface px-[11px] text-[13px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
      />
    </label>
  );
}

function CheckRow({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = React.useState(defaultOn ?? false);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className="motion-tap flex items-center gap-[9px] text-left"
    >
      <span
        aria-hidden="true"
        className={cn(
          "motion-move flex h-[18px] w-[30px] shrink-0 items-center rounded-full p-[2px]",
          on ? "bg-brand" : "bg-pg-border-strong",
        )}
      >
        <span
          className={cn(
            "motion-move size-[14px] rounded-full bg-pg-surface",
            on && "translate-x-[12px]",
          )}
        />
      </span>
      <span className="text-[13px] leading-[18px] text-pg-text">{label}</span>
    </button>
  );
}

function IconAction({
  icon: Icon,
  label,
}: {
  icon: typeof Copy;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading active:scale-95"
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}
