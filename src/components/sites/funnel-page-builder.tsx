"use client";

import * as React from "react";
import {
  ArrowUp,
  AtSign,
  Blocks,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Code2,
  Columns2,
  CreditCard,
  Eye,
  FileText,
  History,
  Keyboard,
  Layers,
  Palette,
  PanelLeftClose,
  Paintbrush,
  Plus,
  QrCode,
  Redo2,
  Save,
  Smartphone,
  SquareStack,
  Tablet,
  Terminal,
  Type,
  Undo2,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { AiSparkle } from "@/components/icons/ai-sparkle";
import { PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { useShellChrome } from "@/components/shell/full-bleed";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { FunnelAiPreview } from "./funnel-ai-preview";
import {
  builderTranscript,
  type BuilderMessage,
  type FunnelRow,
  type FunnelStep,
} from "./funnels-data";
import { BuilderTrail } from "@/components/shell/builder-trail";

/**
 * The funnel PAGE builder — the fifth builder shape, and the worst case for the
 * Sep 22 chrome axis.
 *
 * The other four each bring one row of their own: the workflow canvas has a
 * toolbar, the AI builder has a control row, the form builder has a field bar.
 * This one brings THREE before any content — a builder row (autosave, save,
 * publish), a toolbar row (the element glyphs, the page selector, the device
 * toggles, history), and a live-URL strip. They are not padding and they are
 * not collapsible into each other: the first is commitment, the second is
 * authoring, and the third is the published address, which is the one line an
 * operator reads to check they are editing the page they think they are.
 *
 * That makes this the page the `crumb-row` arrangement has to survive, not the
 * AI builder. See the note on `builderRow` below for what actually happens when
 * the trail and the publish controls are asked to share one 46px band with an
 * autosave chip — the short version is that it fits and reads badly, and the
 * fix is not a fourth placement, it is fewer rows of our own.
 *
 * Reached from funnel-detail's CONTROL card Edit button, which had no handler
 * until this file existed. funnels-page owns the list → detail → builder state
 * the same way it already owns list → AI builder: in-page, never a route, for
 * the reason spelled out at the top of that file.
 */

/**
 * The element run.
 *
 * A dense unlabelled strip rather than the AI builder's 52px labelled rail,
 * because a page editor's element palette is a dozen entries and a vertical
 * rail of twelve icons is taller than the canvas it serves. `ai` swaps in the
 * product's own filled sparkle for the reason it does everywhere else: Lucide's
 * outline star is not the mark this prototype's AI surfaces wear.
 */
const ELEMENTS: readonly {
  id: string;
  label: string;
  icon: LucideIcon;
  ai?: true;
}[] = [
  { id: "add", label: "Add element", icon: Plus },
  { id: "ai", label: "Ask AI", icon: Blocks, ai: true },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "code", label: "Custom code", icon: Code2 },
  { id: "styles", label: "Brand styles", icon: Paintbrush },
  { id: "text", label: "Text", icon: Type },
  { id: "integrations", label: "Integrations", icon: Cloud },
  { id: "products", label: "Products", icon: CreditCard },
  { id: "forms", label: "Forms and surveys", icon: SquareStack },
  { id: "tracking", label: "Tracking code", icon: Terminal },
  { id: "theme", label: "Theme", icon: Palette },
];

/**
 * Desktop / tablet / mobile — the frame, fitted, not the page reflowed.
 *
 * The first cut just narrowed the frame and let the preview do what it liked
 * inside it. At 430px that produced a picture of the booking card's two columns
 * overlapping each other, which is a bug report about funnel-ai-preview rather
 * than a mobile view: that component is a fixed 860px DRAWING of a page and its
 * own header says it is deliberately not a page, so it has no breakpoints to
 * honour and nothing to learn from being squeezed.
 *
 * So the narrow frames fit the drawing to their width instead. `zoom` rather
 * than a transform because zoom reflows — a scaled transform leaves the element
 * claiming its full 860px of layout height and the canvas scrolls to nothing.
 * A fit-to-width mobile frame is not a lie about responsive behaviour the way
 * an overlapping one is; it says "this is the page at phone width", which is
 * exactly as much as a static prototype can honestly claim. The status strip
 * reports the resulting percentage, which is why it is computed and not the
 * hard-coded "100%" the AI builder gets away with.
 */
const PREVIEW_WIDTH = 860;

const DEVICES = [
  { id: "desktop", label: "Desktop", icon: Monitor, frame: null },
  { id: "tablet", label: "Tablet", icon: Tablet, frame: 768 },
  { id: "mobile", label: "Mobile", icon: Smartphone, frame: 430 },
] as const;

/** Same pair, same reason, as the AI builder's: Assist answers, Build writes. */
const MODES = [
  { id: "assist", label: "Assist" },
  { id: "build", label: "Build" },
] as const;

/**
 * The selection green, fixed rather than derived from the accent.
 *
 * Every other colour on this screen is either a --pg-* chrome token or one
 * oklch step off --brand, and this is the deliberate exception. A selection
 * outline is a TOOL mark: it says "the editor has hold of this box", and it has
 * to stay legible over whatever the sub-account's page happens to be coloured.
 * Painting it in the accent would mean a sub-account whose brand is green gets
 * an invisible selection, and one whose brand is the page's own hero colour
 * gets a selection that reads as part of the design being edited. Green because
 * no other chrome in the prototype is, so nothing else on screen can be
 * mistaken for a selection.
 */
const SELECTION: React.CSSProperties = {
  "--pb-select": "#12b76a",
  "--pb-select-fg": "#ffffff",
} as React.CSSProperties;

export function FunnelPageBuilder({
  funnel,
  step,
  onBack,
}: {
  funnel: FunnelRow;
  step: FunnelStep;
  onBack: () => void;
}) {
  const {
    appTheme,
    builderKeepSidebar,
    builderKeepTopBar,
    builderControls,
    builderExit,
  } = useTheme().effective;
  const [device, setDevice] = React.useState<string>("desktop");
  const [mode, setMode] = React.useState<string>("assist");
  /*
   * The AI panel opens WITH the builder, which is not the obvious default.
   *
   * The screenshot this was built from has it open, and that is the real
   * product's answer rather than an accident of how the shot was taken: the
   * panel is how you get a page changed without knowing which of the twelve
   * element glyphs owns the thing you want to change. Starting it closed would
   * make the first thing an operator sees a toolbar they have to decode.
   */
  const [aiOpen, setAiOpen] = React.useState(true);

  /* The chosen frame, and what the 860px drawing has to shrink by to sit in it.
     Derived rather than stored, because two pieces of state that must agree are
     one piece of state and a bug waiting for someone to add a fourth device. */
  const deviceDef = DEVICES.find((d) => d.id === device) ?? DEVICES[0];
  const frame = deviceDef.frame;
  const fit = frame ? Math.min(1, frame / PREVIEW_WIDTH) : 1;

  /*
   * The same ask the other four builders make, field for field.
   *
   * Not "the same because it copies them" — the same because the axis is only
   * worth anything if a reviewer can flip one switch in the tuning panel and
   * see five different page archetypes answer it. A page editor that decided it
   * needed the sidebar kept when the others did not would make its screenshot
   * uncomparable with theirs, which is the only thing the screenshots are for.
   *
   * `collapseSidebar` matters more here than anywhere: with the AI panel open
   * the canvas is already sharing its width, and a 280px platform tree beside a
   * 320px AI panel leaves a laptop under half a window of page.
   */
  const { barHidden, exit, trail } = useShellChrome({
    sidebar: builderKeepSidebar ? "keep" : "drop",
    topBar: builderKeepTopBar ? "keep" : "drop",
    exit: builderExit,
    onExit: onBack,
    backLabel: `Back to ${funnel.name}`,
    collapseSidebar: true,
  });

  /*
   * One crumb, and it names the PAGE rather than the funnel.
   *
   * The record-crumb slot holds exactly one record, so opening the builder out
   * of funnel-detail replaces that screen's crumb rather than extending it —
   * the funnel's own name drops out of the trail while you are editing one of
   * its pages. That is a real loss of context and it is recorded here rather
   * than worked around, because the workaround (publishing "Northside webinar ▸
   * Book a meeting" as one label) would be a page faking two crumbs in a slot
   * built for one, and the trail is the thing this study is trying to make
   * trustworthy. The page name wins the slot because it is what the editor is
   * pointed at; the funnel is one back-arrow away and named on the exit.
   */
  useRecordCrumb({ name: step.name, kind: "Page details" }, onBack);

  /*
   * Commitment, always right, in every combination — the Sep 22 rule.
   *
   * Preview and Save are glyphs here where the AI builder gives Preview a
   * labelled outline button, and that is forced rather than chosen: this row
   * also has to carry the autosave chip and, under `crumb-row`, the trail. Save
   * exists at all beside an autosave chip because autosave and a named version
   * are different promises, which is the same reason the toolbar has a history
   * clock.
   */
  const commitActions = (
    <div className="flex shrink-0 items-center gap-[4px]">
      <ToolButton icon={Eye} label="Preview" />
      <ToolButton icon={Save} label="Save" />
      <PrimaryButton className="ml-[6px]">
        <Check size={15} aria-hidden="true" />
        Publish
      </PrimaryButton>
      {/*
        The ✕ lands here under the "Close" exit, on the commitment side, and it
        is as wrong here as it is in the AI builder — worse, if anything, since
        what it sits beside is a Publish button and the two read as a
        discard/keep pair they are not. Drawn rather than suppressed because the
        axis is being judged, not defended.
      */}
      {builderExit === "close" ? exit : null}
    </div>
  );

  /* An arrow is navigation, so it leads the topmost row — whichever that is.
     Null whenever the sidebar survived or the shell kept a bar to hang it in. */
  const leadingExit = builderExit === "back" ? exit : null;

  /*
   * The autosave chip.
   *
   * It is state, not an action, and it sits next to the exit rather than next
   * to Publish for that reason: the left of this row is "what is true about
   * this page", the right is "what you can do to it". Putting a reassurance
   * beside a commitment button is how you get operators clicking Publish to
   * make the reassurance go away.
   */
  const autosave = (
    <span className="flex h-[26px] shrink-0 items-center gap-[6px] rounded-[7px] bg-pg-bg px-[9px] text-[12px] leading-[normal] font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <Cloud size={14} aria-hidden="true" className="text-pg-faint" />
      Autosave on
    </span>
  );

  /*
   * The builder's own commitment row, in one of four shapes.
   *
   * A function rather than four hand-written copies, for the reason the AI
   * builder gives: three arrangements put something different at the leading
   * edge and a 2px height drift between them is an hour of a chrome review
   * argued about the wrong thing.
   *
   * FINDING, recorded where it happened. Under `crumb-row` with no bar this
   * single 46px band carries, left to right: the back arrow, a four-crumb trail
   * ending in a page name, the autosave chip, then preview, save and Publish.
   * It does not overflow — the trail truncates and the chip is fixed — but the
   * trail is the part that gives, so the arrangement that exists to keep the
   * trail on screen is the one that shortens it first. `split-rows` costs 34px
   * off a canvas that has already given up two rows and a URL strip, which is
   * why it is not obviously the answer either. The honest reading is that this
   * builder has too many rows of its OWN, and the chrome axis is being asked to
   * absorb a problem it did not create.
   */
  const builderRow = (leading?: React.ReactNode) => (
    <div className="flex h-[46px] shrink-0 items-center gap-[12px] border-b border-pg-head-border px-[14px]">
      {leading ? (
        <div className="flex min-w-0 items-center gap-[10px]">{leading}</div>
      ) : null}
      {autosave}
      <div className="min-w-0 flex-1" />
      {commitActions}
    </div>
  );

  return (
    <div
      data-page-theme={appTheme}
      style={SELECTION}
      className="flex h-full min-h-0 flex-col bg-pg-surface"
    >
      {/* Gated on `barHidden` — what the shell actually did — never on the
          theme flag, because nav edit mode puts the bar back and a page
          trusting its own flag would draw a second trail under the real one. */}
      {!barHidden ? (
        builderRow()
      ) : builderControls === "back-only" ? (
        builderRow(leadingExit)
      ) : builderControls === "split-rows" ? (
        <>
          <div className="flex h-[34px] shrink-0 items-center gap-[10px] border-b border-pg-border px-[14px]">
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
          </div>
          {builderRow()}
        </>
      ) : (
        builderRow(
          <>
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
          </>,
        )
      )}

      {/*
        The toolbar row: authoring on the left, the subject in the middle,
        history on the right.

        The page selector is CENTRED rather than left-aligned with the element
        run, which is the one piece of this layout that is worth arguing for. It
        names the thing every other control on the row acts on, and a funnel has
        several pages — a selector tucked at the left edge among twelve glyphs
        would read as a thirteenth glyph, and an operator editing the wrong page
        of a funnel is the single most expensive mistake this screen can cause.
      */}
      <div className="flex h-[44px] shrink-0 items-center gap-[10px] border-b border-pg-border px-[10px]">
        <div className="flex shrink-0 items-center gap-[1px]">
          {ELEMENTS.map((item) => {
            const Icon = item.icon;
            if (item.ai) {
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={aiOpen ? "Hide Ask AI" : "Ask AI"}
                  title={aiOpen ? "Hide Ask AI" : "Ask AI"}
                  aria-pressed={aiOpen}
                  onClick={() => setAiOpen((v) => !v)}
                  className={cn(
                    "motion-tap flex size-[30px] shrink-0 items-center justify-center rounded-[8px]",
                    aiOpen
                      ? "bg-[var(--ai-btn-from)] text-[var(--ai-btn-fg)]"
                      : "text-pg-muted hover:bg-pg-bg hover:text-pg-heading",
                  )}
                >
                  <AiSparkle
                    box={17}
                    glyphWidth={14}
                    offsetX={1.4}
                    offsetY={1.1}
                  />
                </button>
              );
            }
            return <ToolButton key={item.id} icon={Icon} label={item.label} />;
          })}
        </div>

        <span
          aria-hidden="true"
          className="h-[20px] w-px shrink-0 bg-pg-border"
        />
        <ToolButton icon={Columns2} label="Split view" />

        <div className="min-w-0 flex-1" />

        {/* The subject, and the frame it is being judged in. */}
        <div className="flex shrink-0 items-center gap-[8px]">
          <button
            type="button"
            className="motion-tap flex h-[30px] max-w-[220px] items-center gap-[6px] rounded-[8px] bg-pg-bg px-[10px] text-[12.5px] leading-[normal] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading"
          >
            <FileText size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <span className="truncate">{step.name}</span>
            <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          </button>

          <div
            role="tablist"
            aria-label="Device preview"
            className="flex items-center gap-[2px] rounded-[9px] bg-pg-bg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
          >
            {DEVICES.map((d) => {
              const on = d.id === device;
              return (
                <button
                  key={d.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={d.label}
                  title={d.label}
                  onClick={() => setDevice(d.id)}
                  className={cn(
                    "motion-tap flex size-[24px] items-center justify-center rounded-[7px]",
                    on
                      ? "bg-pg-surface text-pg-heading shadow-[0_1px_2px_0_rgba(15,23,42,0.10)]"
                      : "text-pg-muted hover:text-pg-text",
                  )}
                >
                  <d.icon size={14} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 flex-1" />

        <div className="flex shrink-0 items-center gap-[1px]">
          <ToolButton icon={Keyboard} label="Keyboard shortcuts" />
          <ToolButton icon={History} label="Version history" />
          <span aria-hidden="true" className="mx-[4px] h-[20px] w-px bg-pg-border" />
          <ToolButton icon={Undo2} label="Undo" />
          <ToolButton icon={Redo2} label="Redo" />
        </div>
      </div>

      {/*
        The live URL strip.

        Its own band rather than a line inside the toolbar, because it is the
        only thing on screen that describes the PUBLISHED page rather than the
        draft in the canvas — the dot and the Live pill are saying "what is out
        there right now", which is exactly the fact a Publish button makes
        dangerous to guess at. Full URL, untruncated, for the reason
        funnel-detail gives: this is the line an operator copies into an ad.
      */}
      <div className="flex h-[32px] shrink-0 items-center gap-[8px] border-b border-pg-border bg-pg-bg px-[14px]">
        <span
          aria-hidden="true"
          className="size-[6px] shrink-0 rounded-full bg-[var(--pb-select)]"
        />
        <span className="truncate text-[12px] leading-[normal] text-pg-muted">
          {step.url}
        </span>
        <span className="flex h-[19px] shrink-0 items-center gap-[4px] rounded-full bg-pg-surface px-[8px] text-[11px] leading-[normal] font-semibold text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
          Live
        </span>
        <div className="min-w-0 flex-1" />
        <ToolButton icon={QrCode} label="QR code for this page" />
      </div>

      <div className="flex min-h-0 flex-1">
        {aiOpen ? (
          /*
           * Ask AI, on the LEFT of the canvas.
           *
           * The AI builder puts its conversation left too, and this is the same
           * decision for a different reason: there, chat and artifact are peers.
           * Here the canvas is the subject and the panel is a tool, so the
           * instinct is to park it right with the other inspectors. It sits left
           * anyway because the element run it belongs to starts at the left edge
           * of the toolbar directly above it, and a panel that opens on the
           * opposite side of the screen from the button that opened it is the
           * kind of thing people report as a bug.
           *
           * 320px rather than the AI builder's 392px: that column IS the work,
           * this one is a side conversation about a canvas that needs the width.
           */
          <div className="flex w-[320px] shrink-0 flex-col border-r border-pg-border">
            <div className="flex h-[38px] shrink-0 items-center gap-[8px] px-[12px]">
              <span className="flex size-[20px] shrink-0 items-center justify-center rounded-[6px] bg-[var(--ai-btn-from)] text-[var(--ai-btn-fg)]">
                <AiSparkle box={13} glyphWidth={11} offsetX={1} offsetY={0.8} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] font-semibold text-pg-heading">
                Ask AI
              </span>
              <button
                type="button"
                aria-label="Hide Ask AI"
                title="Hide Ask AI"
                onClick={() => setAiOpen(false)}
                className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
              >
                <PanelLeftClose size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="shrink-0 px-[12px] pb-[8px]">
              <div
                role="tablist"
                aria-label="Assistant mode"
                className="flex items-center gap-[2px] rounded-[9px] bg-pg-bg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
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
                        "motion-tap h-[24px] flex-1 rounded-[7px] text-[12.5px] leading-[normal] whitespace-nowrap",
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
            </div>

            {/* The same transcript the AI builder opens on, deliberately. It is
                the conversation that produced this page, and an editor opened on
                a page the assistant wrote should still be able to show you what
                you asked for — a fresh empty panel would lose that thread at
                exactly the moment you want to amend it. */}
            <div className="flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto px-[12px] pt-[4px] pb-[12px]">
              {builderTranscript.map((message) => (
                <Turn key={message.id} message={message} />
              ))}
            </div>

            <div className="shrink-0 px-[12px] pb-[10px]">
              <div className="flex flex-col gap-[9px] rounded-[14px] bg-pg-bg p-[10px] shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
                <span className="px-[2px] text-[13px] leading-[18px] text-pg-faint">
                  Ask for a change to this page…
                </span>
                <div className="flex items-center gap-[7px]">
                  <button
                    type="button"
                    className="motion-tap flex h-[26px] shrink-0 items-center gap-[4px] rounded-[7px] bg-pg-surface px-[8px] text-[12px] leading-[normal] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading"
                  >
                    <AtSign size={13} aria-hidden="true" className="text-pg-faint" />
                    Hero
                  </button>
                  <div className="min-w-0 flex-1" />
                  <button
                    type="button"
                    aria-label="Send"
                    title="Send"
                    className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg hover:brightness-110 active:scale-95"
                  >
                    <ArrowUp size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/*
          The canvas.

          On --pg-bg so the page reads as a document on a workbench, the same
          relationship the AI builder's preview column has to its plane. The
          difference between the two screens is entirely in the frame: there the
          page is being LOOKED at, here it is being HELD, and the selection
          outline plus the section handles are what carries that. Without them a
          reviewer comparing the two screenshots would see the same picture
          twice and conclude the page builder was never built.
        */}
        <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-pg-bg">
          {/*
            No floating "reopen" button over the canvas, deliberately.

            The first cut had one at the top-left, and it landed on top of the
            selection label — which is the tell that it was the wrong control in
            the wrong place. The sparkle in the toolbar is already the toggle
            (it flips to `aria-pressed={false}` and reads "Ask AI" when closed),
            it is where the panel opened FROM, and a second affordance for one
            boolean is how you get two controls that disagree.
          */}
          <div
            style={frame ? { width: frame + 48 } : undefined}
            className="mx-auto w-full max-w-full px-[24px] pt-[36px] pb-[24px]"
          >
            {/*
              The selected section, drawn as a wrapper around the existing
              preview rather than as an edit of it.

              funnel-ai-preview is a picture of a page and is documented as
              never becoming one; the builder does not get to make it editable,
              and it does not need to. What an editor looks like from the
              outside is a box with a name on it and handles at its corners, and
              all three of those are this component's to draw.
            */}
            <div
              style={fit < 1 ? { zoom: fit } : undefined}
              className="relative outline-[2px] outline-offset-[3px] outline-[var(--pb-select)]"
            >
              <span className="absolute -top-[26px] left-0 flex h-[20px] items-center gap-[5px] rounded-[5px] bg-[var(--pb-select)] px-[7px] text-[11px] leading-[normal] font-semibold text-[var(--pb-select-fg)]">
                Section · Hero
              </span>
              {(
                [
                  "-top-[4px] -left-[4px]",
                  "-top-[4px] -right-[4px]",
                  "-bottom-[4px] -left-[4px]",
                  "-bottom-[4px] -right-[4px]",
                ] as const
              ).map((at) => (
                <span
                  key={at}
                  aria-hidden="true"
                  className={cn(
                    "absolute size-[8px] rounded-[2px] border border-[var(--pb-select)] bg-pg-surface",
                    at,
                  )}
                />
              ))}
              <FunnelAiPreview />
            </div>
          </div>
        </div>
      </div>

      {/*
        The status strip. Same 26px and same chips as the AI builder's, so the
        two screens' vertical budgets are comparable line for line — which is
        the whole point of counting them.
      */}
      <div className="flex h-[26px] shrink-0 items-center gap-[6px] border-t border-pg-border px-[14px]">
        <span className="text-[11.5px] leading-[normal] text-pg-muted">Page</span>
        <ChevronRight size={11} aria-hidden="true" className="text-pg-faint" />
        <span className="text-[11.5px] leading-[normal] font-medium text-pg-text">
          Section
        </span>
        <div className="min-w-0 flex-1" />
        <span className="text-[11.5px] leading-[normal] text-pg-faint">
          {deviceDef.label} · {Math.round(fit * 100)}%
        </span>
      </div>
    </div>
  );
}


/** One turn of the transcript. Narrower measure than the AI builder's, same
    convention: the user's turn is a bubble, the assistant's is content. */
function Turn({ message }: { message: BuilderMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-[12px] rounded-br-[4px] bg-pg-bg px-[11px] py-[8px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {message.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-[8px]">
      <span className="mt-[1px] flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--ai-btn-from)] text-[var(--ai-btn-fg)]">
        <AiSparkle box={13} glyphWidth={11} offsetX={1} offsetY={0.8} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
        {message.body.map((p) => (
          <p key={p} className="text-[13px] leading-[18px] text-pg-text">
            {p}
          </p>
        ))}
        {message.bullets ? (
          <ul className="flex flex-col gap-[5px]">
            {message.bullets.map((b) => (
              <li
                key={b}
                className="flex gap-[7px] text-[13px] leading-[18px] text-pg-text"
              >
                <span
                  aria-hidden="true"
                  className="mt-[6px] size-[4px] shrink-0 rounded-full bg-pg-faint"
                />
                {b}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="motion-tap flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading active:scale-95"
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
