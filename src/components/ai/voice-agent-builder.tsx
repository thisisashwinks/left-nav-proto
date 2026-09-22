"use client";

import * as React from "react";
import {
  AudioLines,
  Check,
  ChevronDown,
  Clock,
  Hash,
  Mic,
  Pencil,
  Phone,
  Plus,
  Redo2,
  SlidersHorizontal,
  Trash2,
  Undo2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { useShellChrome } from "@/components/shell/full-bleed";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  voiceActions,
  voiceAgentPrompt,
  voiceSections,
  voiceWelcomeMessage,
} from "./voice-ai-data";
import { BuilderTrail } from "@/components/shell/builder-trail";

/**
 * Voice AI ▸ one agent — the FORM-shaped builder, and the hardest case the Sep
 * 22 chrome axis has been asked to hold.
 *
 * The workflow canvas and the Funnel AI builder are both artifacts: one plane
 * you look at, and whatever chrome the shell keeps is simply a slice off the
 * top of it. This is not that. An agent is a form — three columns of fields
 * that each scroll independently — and a form comes with commitments a canvas
 * never has. It has TWO states of itself (Build and Deploy) which are a mode
 * switch and not a view, it has a Save that is a distinct verb from Publish,
 * and it has a settings strip (voice, model, language, cost) that is neither
 * navigation nor commitment and cannot be folded into either.
 *
 * That is the whole reason this page exists next to the other two. If
 * `crumb-row` — one row, trail left, commitment right — can carry a builder
 * with a mode switch AND a Save, the axis holds for every builder archetype
 * the product has. If it cannot, the failure shows up here first and shows up
 * as a measurement rather than as an opinion. So this file goes out of its way
 * to put everything in the ONE row the arrangement asks for, including the
 * centred mode pair, rather than inventing a fourth placement that would make
 * the arrangement look like it worked.
 *
 * What is NOT chrome, and never moves: the settings strip below. It belongs to
 * the agent the way the workflow builder's ViewBar belongs to the workflow —
 * it is inside the builder, under whatever chrome the combination produced,
 * and it is identical in all four. Counting it as a chrome row would let this
 * page claim "two rows" in a combination the reviewer selected one row for.
 */

/**
 * Build and Deploy are two states of the agent, not two views of it.
 *
 * A segmented pair rather than the ViewBar's line tabs, and the distinction is
 * load-bearing: ViewBar's own rule is that every tab re-cuts the SAME
 * collection. These do not. Build edits a draft; Deploy attaches the saved
 * agent to numbers and widgets and can put it on the phone. A tab strip would
 * say "same thing, different filter" about a pair where one side is live.
 */
const MODES = [
  { id: "build", label: "Build" },
  { id: "deploy", label: "Deploy" },
] as const;

/** The greeting's two directions, which are genuinely different scripts. */
const DIRECTIONS = [
  { id: "inbound", label: "Inbound" },
  { id: "outbound", label: "Outbound" },
] as const;

export function VoiceAgentBuilder({
  agentName,
  onBack,
}: {
  agentName: string;
  onBack: () => void;
}) {
  const {
    appTheme,
    builderKeepSidebar,
    builderKeepTopBar,
    builderControls,
    builderExit,
  } = useTheme().effective;
  const [mode, setMode] = React.useState<string>("build");
  const [direction, setDirection] = React.useState<string>("inbound");
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [callType, setCallType] = React.useState<"web" | "phone">("web");
  const [scenario, setScenario] = React.useState<"inbound" | "outbound">(
    "inbound",
  );
  const [advanced, setAdvanced] = React.useState(false);

  /*
   * The ask — the same five fields the other two builders send, in the same
   * order, so a reviewer flipping the switches is comparing three page
   * archetypes and not three authors.
   *
   * `collapseSidebar` matters more here than on either of them. This page is
   * three columns wide by construction: lose 280px to the nav tree and the
   * prompt column — the one you actually type in — drops under 600px at
   * 1680, which is where a 100-line prompt starts wrapping into something you
   * cannot read the structure of. The rail keeps the nav reachable and gives
   * the prompt back ~220px of that.
   */
  const { barHidden, exit, trail } = useShellChrome({
    sidebar: builderKeepSidebar ? "keep" : "drop",
    topBar: builderKeepTopBar ? "keep" : "drop",
    exit: builderExit,
    onExit: onBack,
    backLabel: "Back to Voice AI",
    collapseSidebar: true,
  });

  /*
   * AI Agents ▸ Voice AI ▸ this agent.
   *
   * Published in every combination. The trail is what the shell folds the
   * crumb into and what comes straight back down as `trail` when there is no
   * bar to hold it — one trail, two renderers, and this page never decides
   * what it SAYS. It does decide what sits next to it: see `rename`.
   */
  useRecordCrumb({ name: agentName, kind: "Agent details" }, onBack);

  /*
   * Rename, as a glyph that follows whatever is currently naming the agent.
   *
   * The pencil is NOT part of the identity — it is an action on it — so it is
   * a separate node that gets appended after the trail in the arrangements
   * where the trail names the agent, and after the plain name in the ones
   * where nothing else does. That is the same move workflow-detail makes with
   * its status pill, and it is what stops this page ever drawing the agent's
   * name twice on one screen.
   */
  const rename = (
    <button
      type="button"
      aria-label={`Rename ${agentName}`}
      title="Rename"
      className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg-bg hover:text-pg-text"
    >
      <Pencil size={13} aria-hidden="true" />
    </button>
  );

  /* The agent's own name, for the arrangements with no trail to borrow it
     from. Never rendered alongside the trail — see the note on `rename`. */
  const plainName = (
    <span className="truncate text-[13.5px] leading-[normal] font-semibold text-pg-heading">
      {agentName}
    </span>
  );

  /*
   * The commitment side, and the reason this builder is the stress test.
   *
   * ONE button. Not three, like the workflow builder, and not two, like the
   * Funnel one — an agent has no preview and no version history worth a
   * button, and Deploy is a mode rather than an act. So the right edge is
   * cheap here, which is exactly what buys the centre its room. Had Save been
   * accompanied by Test and Publish the way the canvas builders are, the
   * one-row arrangement would be measurably tighter than the numbers below
   * report, and that caveat belongs in the finding rather than hidden by a
   * quietly-dropped button.
   */
  const commitActions = (
    <div className="flex shrink-0 items-center gap-[10px]">
      <PrimaryButton>
        <Check size={15} aria-hidden="true" />
        Save
      </PrimaryButton>
      {/*
        EVIDENCE AGAINST ITSELF. Not an endorsed pattern — see the twin notes
        in workflow-detail and funnel-ai-builder.

        The ✕ is worse on a form than on either canvas, and that is the whole
        reason to keep drawing it here. A canvas autosaves its layout; this
        page holds a prompt you have been editing for ten minutes in a
        textarea, and a ✕ sitting immediately right of Save reads as "throw
        that away". The exit that gets the same viewport without asking the
        operator to gamble is the back arrow.
      */}
      {builderExit === "close" ? exit : null}
    </div>
  );

  /* An arrow is a navigation move: leftmost of the topmost row, wherever that
     row is. Null whenever the sidebar survived or the shell kept a bar and
     hung the arrow in it — most of the time, which is the invariant working. */
  const leadingExit = builderExit === "back" ? exit : null;

  /*
   * Build / Deploy, dead centre, in a three-zone grid rather than a flex row.
   *
   * `1fr auto 1fr` is the only arrangement in which the pair stays centred on
   * the ROW as the trail grows — flex with a spacer centres it on the leftover
   * space instead, which means the mode switch drifts sideways when you open
   * an agent with a longer name. A control that moves when the content behind
   * it changes is the thing a reviewer clicks past twice and then complains
   * about, so the sides truncate and the centre does not move.
   *
   * The cost is stated rather than hidden: a long trail hits `truncate` before
   * the centre yields a pixel. At 1680 with the nav dropped it does not; with
   * the nav retained as a rail it does not either. See the report.
   */
  const modeSwitch = (
    <div
      role="tablist"
      aria-label="Agent mode"
      className="flex shrink-0 items-center gap-[2px] rounded-[9px] bg-pg-bg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {MODES.map((m) => {
        const on = m.id === mode;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setMode(m.id)}
            className={cn(
              "motion-tap h-[24px] rounded-[7px] px-[16px] text-[12.5px] leading-[normal] whitespace-nowrap",
              on
                ? "bg-pg-surface font-semibold text-pg-heading shadow-[0_1px_2px_0_rgba(15,23,42,0.10)]"
                : "font-medium text-pg-muted hover:text-pg-text",
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );

  /*
   * The builder's own row, as a function rather than four copies.
   *
   * Same reason funnel-ai-builder does it: the three arrangements that put
   * something different at the leading edge must not drift apart in height or
   * padding, because a 2px difference between two screenshots is what a chrome
   * review spends an hour arguing about instead of about the chrome.
   */
  const builderRow = (leading: React.ReactNode) => (
    <div className="grid h-[46px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-[12px] border-b border-pg-head-border px-[14px]">
      <div className="flex min-w-0 items-center gap-[6px]">{leading}</div>
      {modeSwitch}
      <div className="flex min-w-0 justify-end">{commitActions}</div>
    </div>
  );

  return (
    <div
      data-page-theme={appTheme}
      className="flex h-full min-h-0 flex-col bg-pg-surface"
    >
      {/*
        The chrome, in one of four shapes.

        Gated on `barHidden` — what the shell actually DID — never on the theme
        flag. Nav edit mode is the live case where the two disagree: it puts
        the bar back regardless of the ask, and a page trusting its own flag
        would draw a second trail directly under the real one.
      */}
      {!barHidden ? (
        /*
         * The bar is up, so the trail is already somewhere. This row carries
         * only what the bar cannot: the agent's name (the bar's trail ends at
         * Voice AI plus the record crumb, but the row still needs an anchor
         * for the rename), the mode pair, and Save.
         */
        builderRow(
          <>
            {plainName}
            {rename}
          </>,
        )
      ) : builderControls === "back-only" ? (
        /*
         * No trail at all. Nothing on screen says this agent lives under AI
         * Agents — which costs more on a form than on a canvas, because an
         * operator arrives here from a list of twelve near-identical names and
         * the trail is the only thing that was confirming which one opened.
         */
        builderRow(
          <>
            {leadingExit}
            {plainName}
            {rename}
          </>,
        )
      ) : builderControls === "split-rows" ? (
        <>
          {/*
            The trail in its own band. What this arrangement buys on THIS page
            is different from what it buys on a canvas: not room for a long
            generated name, but room for the name plus the rename glyph without
            either of them competing with a centred mode switch for the middle
            of the row.
          */}
          <div className="flex h-[34px] shrink-0 items-center gap-[10px] border-b border-pg-border px-[14px]">
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
            {rename}
          </div>
          {builderRow(null)}
        </>
      ) : (
        /* One row. The arrangement being stress-tested: exit, trail, rename on
           the left; Build/Deploy centred; Save right. */
        builderRow(
          <>
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
            {rename}
          </>,
        )
      )}

      {/*
        The agent's settings strip — NOT a chrome row, and identical in all
        four combinations.

        Voice, model and language are what the agent IS, the same way a
        workflow's status pill is; the token estimate on the right is what that
        choice costs per minute, which is the one number that changes when you
        touch the three controls to its left. They are on one strip because
        they are a single sentence read left to right — this voice, on this
        model, in this language, for this money — and splitting the price into
        a footer would break the only feedback loop the row has.
      */}
      <div className="flex h-[40px] shrink-0 items-center gap-[10px] border-b border-pg-border px-[14px]">
        <FieldSelect label="Voice" value="Jessica" trailing={SlidersHorizontal} />
        <FieldSelect label="Model" value="GPT 4.1" />
        <FieldSelect label="Language" value="English" />
        <button
          type="button"
          aria-label="Call duration limits"
          title="Call duration limits"
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
        >
          <Clock size={16} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1" />
        {/*
          Muted, and a range rather than a figure. The estimate genuinely is a
          range — it depends on how long the caller talks — and rounding it to
          one number would be the page claiming a precision the model cannot
          give, which is the kind of thing operators hold you to later.
        */}
        <span className="truncate text-[12px] leading-[normal] text-pg-faint tabular-nums">
          3.3k–3.4k tokens · $0.126–$0.148/min
        </span>
      </div>

      {/*
        Three columns, each its own scroller.

        The prompt takes the free width and the other two are fixed, for the
        reason the Funnel builder fixes its chat column: the middle and right
        columns are lists of controls whose useful width tops out around 340px,
        and every pixel past that is a pixel off the one column where width
        changes whether the work is legible.
      */}
      <div className="flex min-h-0 flex-1">
        <PromptColumn direction={direction} onDirection={setDirection} />

        <div className="flex w-[344px] shrink-0 flex-col gap-[12px] overflow-y-auto border-r border-pg-border p-[14px]">
          <ActionsCard />

          <div className="flex flex-col rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            {voiceSections.map((section) => (
              <AccordionRow
                key={section.id}
                label={section.label}
                summary={section.summary}
                open={openSection === section.id}
                onToggle={() =>
                  setOpenSection((cur) => (cur === section.id ? null : section.id))
                }
              />
            ))}
          </div>

          {/*
            Advanced, as a switch row rather than a sixth accordion.

            It is not a section — it REVEALS fields inside the five above
            (retry counts, interruption sensitivity, DTMF). Filing it as a
            peer of Knowledge base would promise its own panel of content that
            does not exist, which is the failure mode of every "Advanced"
            accordion that has ever been shipped.
          */}
          <button
            type="button"
            role="switch"
            aria-checked={advanced}
            onClick={() => setAdvanced((v) => !v)}
            className="motion-tap flex h-[40px] shrink-0 items-center justify-between gap-[10px] rounded-[10px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
          >
            <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text">
              Show advanced settings
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "flex h-[18px] w-[32px] shrink-0 items-center rounded-full px-[2px] motion-move",
                advanced ? "bg-brand" : "bg-pg-disabled",
              )}
            >
              <span
                className={cn(
                  "size-[14px] rounded-full bg-pg-surface motion-move",
                  advanced ? "translate-x-[14px]" : "translate-x-0",
                )}
              />
            </span>
          </button>
        </div>

        <TestAudioColumn
          callType={callType}
          onCallType={setCallType}
          scenario={scenario}
          onScenario={setScenario}
        />
      </div>
    </div>
  );
}


/**
 * The prompt, and the greeting under it — the left column.
 *
 * Two blocks and not two accordions, because they are the two halves of one
 * thing: the greeting is the first thing the prompt's call flow does. Folding
 * the welcome message away would let someone save an agent whose script starts
 * mid-conversation without ever having seen the sentence it starts with.
 */
function PromptColumn({
  direction,
  onDirection,
}: {
  direction: string;
  onDirection: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col border-r border-pg-border">
      {/*
        `overflow-x-auto` rather than letting the buttons bleed.

        Found by shooting this page at 1024 with the rail retained: the prompt
        column drops to about 240px, every child of this toolbar is shrink-0,
        and Prompt Optimizer was rendering ON TOP of the middle column. The
        toolbar scrolls instead. The column below it is still too narrow to
        write a prompt in at that width — see the report — but a builder that
        draws outside its own column is a defect rather than a trade-off.
      */}
      <div className="flex h-[40px] shrink-0 items-center gap-[8px] overflow-x-auto border-b border-pg-border px-[14px]">
        <ToolButton icon={Undo2} label="Undo" />
        <ToolButton icon={Redo2} label="Redo" />
        <span
          aria-hidden="true"
          className="mx-[2px] h-[18px] w-px shrink-0 bg-pg-border"
        />
        {/*
          Two insert buttons, and they are not the same kind of thing.

          "# Custom Value" drops a merge field — a token the runtime swaps for
          contact data. "Prompt Optimizer" rewrites what you have written. Only
          the second one is AI and only the second one wears the AI fill, which
          is the rule every AI affordance in this prototype follows: the mark
          means "a model did this", not "this is new".
        */}
        <InsertButton icon={Hash} label="Custom Value" />
        <InsertButton icon={Zap} label="Prompt Optimizer" ai />
        <div className="min-w-0 flex-1" />
        <span className="shrink-0 text-[11.5px] leading-[normal] text-pg-faint">
          Autosaved
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[14px] py-[12px]">
        {/*
          A <pre>, not a textarea. The prototype is not editing anything, and a
          textarea holding 100 lines would either scroll inside a scroller or
          force the column to size to its content — two scrollbars in one
          column being the exact reading problem this layout is here to prove
          it avoids.

          Mono at 12.5/19 because the prompt's structure IS its headings and
          its indentation; proportional type collapses the numbered rules into
          prose and you can no longer see the call flow at a glance.
        */}
        <pre className="font-mono text-[12.5px] leading-[19px] whitespace-pre-wrap text-pg-text">
          {voiceAgentPrompt}
        </pre>
      </div>

      <div className="shrink-0 border-t border-pg-border px-[14px] py-[11px]">
        <div className="flex items-center gap-[10px]">
          <span className="shrink-0 text-[13px] leading-[normal] font-semibold text-pg-heading">
            Welcome Message <span className="text-pg-danger">*</span>
          </span>
          {/*
            The pause is a chip on the label row rather than a field of its
            own, because it qualifies WHEN this message is spoken and not what
            it says. 0s is the default and reads as "the moment they pick up",
            which is the thing operators most often want to change after their
            first test call.
          */}
          <span className="flex h-[22px] shrink-0 items-center gap-[5px] rounded-[6px] bg-pg-bg px-[8px] text-[12px] leading-[normal] font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <Clock size={12} aria-hidden="true" className="text-pg-faint" />
            Pause Before Speaking: 0s
          </span>
          <div className="min-w-0 flex-1" />
          <FieldSelect value="AI speaks first" />
        </div>

        <div className="mt-[9px] flex items-center gap-[2px]">
          {DIRECTIONS.map((d) => {
            const on = d.id === direction;
            return (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onDirection(d.id)}
                className={cn(
                  "motion-tap relative shrink-0 px-[11px] pb-[7px] text-[13px] leading-[18px] whitespace-nowrap",
                  on
                    ? "font-semibold text-brand"
                    : "font-medium text-pg-muted hover:text-pg-text",
                )}
              >
                {d.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-[2px] rounded-full motion-move",
                    on ? "bg-brand" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="relative rounded-[9px] bg-pg-bg p-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <p className="pr-[64px] text-[13px] leading-[19px] text-pg-text">
            {voiceWelcomeMessage}
          </p>
          {/*
            The counter sits inside the field, bottom right, because it is a
            property of what is IN the box. Under the box it would be read as a
            hint about the next control down — which on this page is a column
            boundary, and there is nothing more confusing than a number
            floating on a seam.
          */}
          <span className="absolute right-[10px] bottom-[8px] text-[11.5px] leading-[normal] text-pg-faint tabular-nums">
            80 / 190
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The actions card — what the agent is allowed to DO, as opposed to say.
 *
 * Grouped by phase with the group names in caps at 11px, which is the one
 * place in this prototype an all-caps label earns itself: DURING THE CALL and
 * AFTER THE CALL are not headings you read, they are timestamps you scan, and
 * sentence case at 13px made them look like two more rows in the list.
 */
function ActionsCard() {
  const during = voiceActions.filter((a) => a.phase === "during");
  const after = voiceActions.filter((a) => a.phase === "after");
  return (
    <div className="flex shrink-0 flex-col rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="flex items-start gap-[10px] border-b border-pg-border p-[12px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="truncate text-[13.5px] leading-[normal] font-semibold text-pg-heading">
            Actions
          </span>
          <span className="text-[12px] leading-[16px] text-pg-muted">
            Configure actions your agent can perform
          </span>
        </div>
        <OutlineButton className="h-[28px] px-[10px] text-[12.5px]">
          <Plus size={14} aria-hidden="true" className="text-pg-text-strong" />
          New Action
        </OutlineButton>
      </div>

      <ActionGroup title="During the call">
        {during.map((a) => (
          <ActionRow key={a.id} label={a.label} handler={a.handler} />
        ))}
      </ActionGroup>

      <ActionGroup title="After the call">
        {after.length === 0 ? (
          <p className="px-[12px] py-[10px] text-[12.5px] leading-[17px] text-pg-faint">
            No post-call actions configured yet
          </p>
        ) : (
          after.map((a) => (
            <ActionRow key={a.id} label={a.label} handler={a.handler} />
          ))
        )}
      </ActionGroup>
    </div>
  );
}

function ActionGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col border-b border-pg-border last:border-b-0">
      <span className="px-[12px] pt-[10px] pb-[4px] text-[11px] leading-[normal] font-semibold tracking-[0.5px] text-pg-faint uppercase">
        {title}
      </span>
      {children}
    </div>
  );
}

/**
 * One action: what it is called, and what it actually calls.
 *
 * The handler name is on a second line rather than in a tooltip because two
 * actions in a real sub-account routinely share a label ("Send WhatsApp
 * message" twice, to two numbers) and the handler is the only thing that tells
 * them apart. A tooltip would make telling them apart a hover away.
 */
function ActionRow({ label, handler }: { label: string; handler: string }) {
  return (
    <div className="group flex items-center gap-[8px] px-[12px] py-[8px] hover:bg-pg-bg">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] leading-[17px] font-medium text-pg-text-strong">
          {label}
        </span>
        <span className="truncate font-mono text-[11.5px] leading-[16px] text-pg-faint">
          {handler}
        </span>
      </div>
      {/*
        Both glyphs stay in the flow at all times rather than appearing on
        hover. A list of two rows is not long enough for hover-reveal to buy
        anything, and delete arriving under a cursor that was aimed at edit is
        the one place this prototype refuses to save 40px.
      */}
      <RowGlyph icon={Pencil} label={`Edit ${label}`} />
      <RowGlyph icon={Trash2} label={`Delete ${label}`} danger />
    </div>
  );
}

function RowGlyph({
  icon: Icon,
  label,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] hover:bg-pg-surface",
        danger ? "text-pg-faint hover:text-pg-danger" : "text-pg-faint hover:text-pg-text",
      )}
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

/**
 * A collapsed section, with its summary still visible.
 *
 * The summary is the whole argument for shipping these closed: "2 sources
 * connected" and "Off" tell you the state of the section without opening it,
 * so the stack reads as a status list rather than as five doors. Open, the
 * body is a stage — this prototype is about the shape of the column, and
 * building a real knowledge-base picker here would invite review of the wrong
 * thing.
 */
function AccordionRow({
  label,
  summary,
  open,
  onToggle,
}: {
  label: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col border-b border-pg-border last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="motion-tap flex h-[42px] shrink-0 items-center gap-[10px] px-[12px] text-left hover:bg-pg-bg"
      >
        <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">
          {label}
        </span>
        <div className="min-w-0 flex-1" />
        <span className="shrink-0 truncate text-[12px] leading-[normal] text-pg-faint">
          {summary}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn(
            "shrink-0 text-pg-muted motion-move",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <p className="px-[12px] pb-[12px] text-[12.5px] leading-[17px] text-pg-faint">
          {label} settings — same column, same chrome.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Test Audio — the right column, and the only place on this page where the
 * agent is a thing that talks rather than a thing you configure.
 *
 * Its header carries the AI gradient and nothing else on the page does. That
 * is the mark doing its job: everything left of here is you writing rules, and
 * this panel is where the model starts speaking them back. A second gradient
 * anywhere in the three columns would make it decoration.
 */
function TestAudioColumn({
  callType,
  onCallType,
  scenario,
  onScenario,
}: {
  callType: "web" | "phone";
  onCallType: (v: "web" | "phone") => void;
  scenario: "inbound" | "outbound";
  onScenario: (v: "inbound" | "outbound") => void;
}) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col overflow-y-auto">
      <div className="flex h-[40px] shrink-0 items-center gap-[8px] border-b border-pg-border bg-[linear-gradient(120deg,var(--ai-btn-from),var(--ai-btn-to))] px-[14px] text-[var(--ai-btn-fg)]">
        <AudioLines size={16} aria-hidden="true" />
        <span className="truncate text-[13.5px] leading-[normal] font-semibold">
          Test Audio
        </span>
      </div>

      <div className="flex flex-col gap-[14px] p-[14px]">
        <div className="flex flex-col gap-[6px]">
          <FieldLabel>Choose Call Type</FieldLabel>
          <div className="flex items-center gap-[2px] rounded-[9px] bg-pg-bg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            {(
              [
                { id: "web", label: "Web Call", icon: AudioLines },
                { id: "phone", label: "Phone Call", icon: Phone },
              ] as const
            ).map((t) => {
              const on = t.id === callType;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onCallType(t.id)}
                  className={cn(
                    "motion-tap flex h-[26px] flex-1 items-center justify-center gap-[6px] rounded-[7px] text-[12.5px] leading-[normal] whitespace-nowrap",
                    on
                      ? "bg-pg-surface font-semibold text-pg-heading shadow-[0_1px_2px_0_rgba(15,23,42,0.10)]"
                      : "font-medium text-pg-muted hover:text-pg-text",
                  )}
                >
                  <t.icon size={13} aria-hidden="true" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/*
          Scenario is radios, not a second segmented pair.

          It looks like the control above it and is not one: call type picks the
          TRANSPORT, scenario picks which half of the prompt gets exercised —
          and the greeting block in the left column has its own Inbound /
          Outbound tabs that this has to be read against. Two identical-looking
          segmented pairs stacked would read as one compound setting.
        */}
        <fieldset className="flex flex-col gap-[6px]">
          <legend className="sr-only">Scenario</legend>
          <FieldLabel>Scenario</FieldLabel>
          <div className="flex items-center gap-[16px]">
            {(["inbound", "outbound"] as const).map((s) => {
              const on = s === scenario;
              return (
                <label
                  key={s}
                  className="motion-tap flex cursor-pointer items-center gap-[7px]"
                >
                  <input
                    type="radio"
                    name="voice-test-scenario"
                    checked={on}
                    onChange={() => onScenario(s)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-[15px] shrink-0 items-center justify-center rounded-full border-[1.5px]",
                      on ? "border-brand" : "border-pg-disabled",
                    )}
                  >
                    {on ? (
                      <span className="size-[7px] rounded-full bg-brand" />
                    ) : null}
                  </span>
                  <span className="text-[13px] leading-[normal] text-pg-text capitalize">
                    {s}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/*
          The mic, big, and doing nothing.

          It is the target you press to talk, so it is sized like one — 84px,
          well past the 36px everything else on this page uses. The button
          under it starts the session; the mic is what you hold afterwards.
          Both are here because the panel has to read as a phone and not as a
          form field with a play button.
        */}
        <div className="flex flex-col items-center gap-[10px] py-[6px]">
          <button
            type="button"
            aria-label="Hold to talk"
            title="Hold to talk"
            className="motion-tap flex size-[84px] items-center justify-center rounded-full bg-pg-bg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading active:scale-95"
          >
            <Mic size={30} aria-hidden="true" />
          </button>
          {/*
            The label follows the call type above it, rather than being fixed
            at "Start Web Call".

            Small, and worth the branch: the two controls are 120px apart and a
            button that keeps saying Web while the segmented control above it
            says Phone is the kind of thing an operator reads as "the picker
            did not take" — and then clicks the picker again instead of the
            button.
          */}
          <PrimaryButton className="w-full justify-center">
            <Phone size={15} aria-hidden="true" />
            Start {callType === "web" ? "Web" : "Phone"} Call
          </PrimaryButton>
          {/*
            The quota, under the button rather than beside it. It qualifies
            what happens when you press the thing above it, and putting a
            parenthetical allowance on the button's own row would make the
            allowance look like part of the action's name.
          */}
          <span className="text-[11.5px] leading-[normal] text-pg-faint">
            (20 minutes left today)
          </span>
        </div>

        <div className="flex flex-col gap-[6px] border-t border-pg-border pt-[12px]">
          <FieldLabel>Call History</FieldLabel>
          <FieldSelect value="Last 7 days" className="w-full justify-between" />
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12px] leading-[normal] font-medium text-pg-muted">
      {children}
    </span>
  );
}

/**
 * A select, as a button with a caret — the settings strip's unit.
 *
 * `label` prefixes the value inside the same control ("Voice: Jessica") rather
 * than sitting above it, because the strip is 40px tall and a stacked
 * label/value pair would double that. The prefix is muted and the value is
 * not, so the row still scans as three values and not as six words.
 */
function FieldSelect({
  label,
  value,
  trailing: Trailing,
  className,
}: {
  label?: string;
  value: string;
  trailing?: LucideIcon;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label ? `${label}: ${value}` : value}
      className={cn(
        "motion-tap flex h-[28px] shrink-0 items-center gap-[6px] rounded-[7px] bg-pg-surface px-[9px] text-[12.5px] leading-[normal] whitespace-nowrap shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        className,
      )}
    >
      {label ? <span className="text-pg-muted">{label}</span> : null}
      <span className="font-medium text-pg-text-strong">{value}</span>
      {Trailing ? (
        <Trailing size={13} aria-hidden="true" className="text-pg-faint" />
      ) : (
        <ChevronDown size={13} aria-hidden="true" className="text-pg-faint" />
      )}
    </button>
  );
}

function InsertButton({
  icon: Icon,
  label,
  ai,
}: {
  icon: LucideIcon;
  label: string;
  ai?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "motion-tap flex h-[26px] shrink-0 items-center gap-[5px] rounded-[7px] px-[9px] text-[12.5px] leading-[normal] font-medium whitespace-nowrap",
        ai
          ? "bg-[linear-gradient(120deg,var(--ai-btn-from),var(--ai-btn-to))] text-[var(--ai-btn-fg)] hover:brightness-[1.03]"
          : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading",
      )}
    >
      <Icon size={13} aria-hidden="true" />
      {label}
    </button>
  );
}

function ToolButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading active:scale-95"
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}
