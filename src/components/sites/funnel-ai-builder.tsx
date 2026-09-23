"use client";

import * as React from "react";
import {
  ArrowUp,
  AtSign,
  Check,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Layers,
  Monitor,
  Palette,
  Paperclip,
  Redo2,
  Settings2,
  Sparkles,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { AiSparkle } from "@/components/icons/ai-sparkle";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import {
  CollabIsland,
  FloatingLayer,
  IdentityIsland,
  Island,
  IslandGlyph,
} from "@/components/shell/floating-chrome";
import { useShellChrome } from "@/components/shell/full-bleed";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { FunnelAiPreview } from "./funnel-ai-preview";
import { builderTranscript, type BuilderMessage } from "./funnels-data";
import { BuilderTrail } from "@/components/shell/builder-trail";

/**
 * Funnel AI — the builder the Sep 22 top-bar review is really about.
 *
 * The workflow canvas was the only builder in the prototype, and a canvas is a
 * forgiving thing to hang chrome over: it is one scrolling plane with space at
 * the top. This is the hard case. An AI builder is two columns that both want
 * the full height — a conversation you scroll and an artifact you look at —
 * and every pixel the app bar keeps is a pixel off the bottom of BOTH. That is
 * the argument the four retain combinations have to be judged against, so this
 * page consumes the same ThemeState fields the workflow builder does and goes
 * out of its way to draw nothing the shell is already drawing.
 *
 * It asks for chrome exactly the way the workflow builder does — same four
 * ThemeState fields, same `useShellChrome` ask, same rule about who draws the
 * exit — so a reviewer flipping the switches sees two genuinely different page
 * archetypes answering one question, rather than two pages that happen to have
 * been built in different weeks. This file was started against the older
 * `useFullBleed` enum and moved onto `useShellChrome` the same afternoon that
 * landed; nothing here should be the reason that shim outlives its note.
 */

/**
 * The rail's tools. `ai` swaps the Lucide glyph for the product's own sparkle —
 * every AI surface in this prototype wears the filled Material mark rather than
 * Lucide's outline one, and the rail is not the place to break that.
 */
const RAIL: readonly {
  id: string;
  label: string;
  icon: LucideIcon;
  ai?: true;
}[] = [
  { id: "ai", label: "AI", icon: Sparkles, ai: true },
  { id: "sections", label: "Sections", icon: Layers },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "styles", label: "Brand styles", icon: Palette },
  { id: "settings", label: "Page settings", icon: Settings2 },
];

/**
 * Assist and Build are two different machines, not two tones of voice.
 *
 * Assist answers and suggests; Build writes to the page. They are a segmented
 * control rather than a toggle because the second one spends money and changes
 * the artifact, and a switch that looks like a preference is the wrong weight
 * for that.
 */
const MODES = [
  { id: "assist", label: "Assist" },
  { id: "build", label: "Build" },
] as const;

export function FunnelAiBuilder({ onBack }: { onBack: () => void }) {
  const {
    appTheme,
    builderKeepSidebar,
    builderKeepTopBar,
    builderControls,
    builderExit,
    builderChromeStyle,
  } = useTheme().effective;
  const [mode, setMode] = React.useState<string>("build");
  /*
   * The Sep 23 axis. `builderControls` is read only inside the `rows` half
   * below — it places ROWS, and this style has none. See floating-chrome.tsx.
   */
  const floating = builderChromeStyle === "floating";

  /*
   * The ask, stated as the two retain switches rather than mapped onto a shape.
   *
   * `collapseSidebar` for the same reason the workflow builder asks for it: a
   * retained nav should be there without being the widest thing on screen
   * while you are drawing, and it matters more here than it does there — the
   * chat column is already a fixed 392px, so a 280px tree beside it leaves the
   * artifact under half the window on a laptop.
   *
   * `exit` is a NODE the shell builds, not permission to draw one. Null
   * whenever the sidebar survived, or whenever the shell kept a bar it could
   * hang the arrow in itself, so there is no arrangement this page can express
   * in which an exit stands beside a retained sidebar.
   */
  const { barHidden, exit, trail } = useShellChrome({
    sidebar: builderKeepSidebar ? "keep" : "drop",
    topBar: builderKeepTopBar ? "keep" : "drop",
    exit: builderExit,
    onExit: onBack,
    backLabel: "Back to Funnels",
    collapseSidebar: true,
  });

  /*
   * Content ▸ Sites ▸ Funnel ▸ Build with AI.
   *
   * Published in every combination, bar or no bar: the crumb is what the shell
   * folds into the trail, and that same trail comes back down as `trail` when
   * there is no bar to hold it. The page never decides what the trail SAYS.
   *
   * "Build with AI" rather than a funnel name because there is no funnel yet —
   * this is the door that creates one, and naming the crumb after the page the
   * assistant has not finished writing would be the trail promising an
   * artifact that does not exist.
   */
  useRecordCrumb("Build with AI", onBack);

  /*
   * The commitment side. Always right, in every combination — the Sep 22 rule
   * this prototype's builders all obey. Preview is outlined and Publish filled
   * because only one of the two is a decision about the live page.
   */
  const commitActions = (
    <div className="flex shrink-0 items-center gap-[10px]">
      <OutlineButton>
        <Eye size={15} aria-hidden="true" className="text-pg-text-strong" />
        Preview
      </OutlineButton>
      <PrimaryButton>
        <Check size={15} aria-hidden="true" />
        Publish
      </PrimaryButton>
      {/*
        EVIDENCE AGAINST ITSELF, and the one control here that sits on the
        wrong side on purpose. Not an endorsed pattern.

        The shell hands a ✕ down only under the "Close" exit, and this is where
        it lands: on the RIGHT, beside Publish. It is worse here than on the
        workflow canvas, which is the reason to keep drawing it — what a ✕
        beside Publish threatens to discard is a conversation as well as a
        page, and the conversation is the part you cannot get back by
        remembering what you did. The exit that gets the same viewport without
        the ambiguity is the back arrow.

        Under `floating` this cluster does not carry it: both exits end the
        collaboration island instead, for the reason CollabIsland states —
        there is no leading edge on an island for an arrow to claim, so the
        page stops choosing a side and the two exits are compared in one place.
      */}
      {!floating && builderExit === "close" ? exit : null}
    </div>
  );

  /*
   * The exit's side, decided once.
   *
   * An arrow is a navigation move, so it goes leftmost of the topmost row —
   * whichever row that turns out to be. Null whenever the sidebar survived or
   * the shell kept the bar and hung the arrow there itself, which is most of
   * the time, and that is the invariant working rather than a case to handle.
   */
  const leadingExit = builderExit === "back" ? exit : null;

  /* Undo / redo / device — the builder's own tools, which are neither
     navigation nor commitment and so sit in the middle of whichever row they
     end up on. */
  const canvasTools = (
    <div className="flex shrink-0 items-center gap-[2px]">
      <ToolButton icon={Undo2} label="Undo" />
      <ToolButton icon={Redo2} label="Redo" />
      <ToolButton icon={Monitor} label="Desktop preview" />
    </div>
  );

  /*
   * The builder's own row: whatever leads it, then the tools, then commitment.
   *
   * A function rather than four copies of the row, so the three arrangements
   * that put something different at its leading edge cannot drift apart in
   * height or padding — which they did in the first cut, and a 2px difference
   * between two screenshots is exactly the kind of noise a chrome review
   * spends an hour arguing about.
   */
  const builderRow = (leading?: React.ReactNode) => (
    <div className="flex h-[46px] shrink-0 items-center gap-[12px] border-b border-pg-head-border px-[14px]">
      {leading ? (
        <div className="flex min-w-0 items-center gap-[10px]">{leading}</div>
      ) : null}
      {canvasTools}
      <div className="min-w-0 flex-1" />
      {commitActions}
    </div>
  );

  return (
    <div
      data-page-theme={appTheme}
      className="flex h-full min-h-0 flex-col bg-pg-surface"
    >
      {/*
        The builder's own chrome, above the two columns, in one of four shapes.

        Gated on `barHidden` — what the shell actually did — and never on the
        theme flag, because the two disagree whenever the shell refuses the
        ask. Nav edit mode is the live case: it puts the bar back, and a page
        trusting its own flag would draw a second trail directly under the real
        one.

        There is always exactly one control row, even with the bar retained:
        Publish has nowhere else to live. What changes between combinations is
        only whether that row ALSO carries the trail and the exit.
      */}
      {floating ? (
        /*
         * Nothing here. Under `floating` this page's chrome is not above the
         * columns at all — it is four islands anchored to the ARTIFACT column
         * further down, and the reason it is the artifact rather than the
         * window is worth stating: an identity island floating over the left
         * column would be sitting on a transcript, and a transcript scrolls
         * rather than pans. Content you cannot move out from under an island
         * is content the island has taken, which is a different and worse
         * trade than the one this style is offering.
         */
        null
      ) : !barHidden ? (
        builderRow()
      ) : builderControls === "back-only" ? (
        /*
         * No trail at all. The most artifact of the three and the least
         * context — nothing on screen says this page is in Sites, and the only
         * way back is the one control at the left.
         */
        builderRow(leadingExit)
      ) : builderControls === "split-rows" ? (
        <>
          {/*
            The trail gets its own band, which is this arrangement's whole
            claim: a generated page's name is long and unchosen ("Book a
            meeting — draft 3"), and it should not be competing with three
            buttons for the same row. It costs 34px off the top of BOTH
            columns, which is the price the panel is asking to be judged.
          */}
          <div className="flex h-[34px] shrink-0 items-center gap-[10px] border-b border-pg-border px-[14px]">
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
          </div>
          {builderRow()}
        </>
      ) : (
        /* One row: trail left, tools in the middle, commitment right. */
        builderRow(
          <>
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
          </>,
        )
      )}

      <div className="flex min-h-0 flex-1">
        {/*
          The icon rail.

          Slim and unlabelled because it is the builder's OWN tool switcher and
          it sits inside a page that may already have a 280px platform nav to
          its left — two labelled columns of navigation side by side is the
          thing this whole review is trying to avoid, and the rail earns its
          place only by being narrow enough not to read as a second one.
        */}
        <div className="flex w-[52px] shrink-0 flex-col items-center gap-[4px] border-r border-pg-border py-[10px]">
          {RAIL.map((item) => {
            const Icon = item.icon;
            const on = item.ai === true;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                title={item.label}
                aria-pressed={on}
                className={cn(
                  "motion-tap flex size-[34px] items-center justify-center rounded-[9px]",
                  on
                    ? "bg-[var(--ai-btn-from)] text-[var(--ai-btn-fg)]"
                    : "text-pg-muted hover:bg-pg-bg hover:text-pg-heading",
                )}
              >
                {on ? (
                  <AiSparkle box={19} glyphWidth={16} offsetX={1.6} offsetY={1.3} />
                ) : (
                  <Icon size={17} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {/*
          The conversation. Full height, fixed width, its own scroller.

          Fixed rather than proportional: a chat column that grows with the
          window ends up with 120-character lines, and the artifact beside it is
          the thing that should get the extra pixels — it is the one being
          judged. 392px is the ChatGPT/Claude measure, about 70 characters at
          14px, which is also why the transcript below reads like one.
        */}
        <div className="flex w-[392px] shrink-0 flex-col border-r border-pg-border">
          <div className="flex h-[46px] shrink-0 items-center justify-between gap-[10px] px-[14px]">
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
                      "motion-tap h-[24px] rounded-[7px] px-[14px] text-[12.5px] leading-[normal] whitespace-nowrap",
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
            <span className="truncate text-[12px] leading-[normal] text-pg-faint">
              Untitled funnel
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-[14px] pt-[6px] pb-[14px]">
            {builderTranscript.map((message) => (
              <Turn key={message.id} message={message} />
            ))}
          </div>

          {/*
            The composer, and the two things that qualify what you are about to
            send: an attachment and a context chip. Both sit INSIDE the box with
            the send button, because all three are part of one utterance — a
            chip parked outside the field would read as a filter on the
            transcript rather than as scope on the next message.
          */}
          <div className="shrink-0 px-[14px] pb-[10px]">
            <div className="flex flex-col gap-[9px] rounded-[14px] bg-pg-bg p-[10px] shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
              <span className="px-[2px] text-[13.5px] leading-[19px] text-pg-faint">
                Ask for a change, or describe the next step…
              </span>
              <div className="flex items-center gap-[7px]">
                <button
                  type="button"
                  aria-label="Attach a file"
                  title="Attach a file"
                  className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading"
                >
                  <Paperclip size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="motion-tap flex h-[26px] shrink-0 items-center gap-[4px] rounded-[7px] bg-pg-surface px-[8px] text-[12px] leading-[normal] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading"
                >
                  <AtSign size={13} aria-hidden="true" className="text-pg-faint" />
                  Section
                </button>
                <div className="min-w-0 flex-1" />
                <button
                  type="button"
                  aria-label="Send"
                  title="Send"
                  className="motion-tap flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg hover:brightness-110 active:scale-95"
                >
                  <ArrowUp size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
            {/*
              Under the composer, not over it: it qualifies what comes BACK, and
              a caveat above the field would be read as a caveat on the thing
              you are typing.
            */}
            <p className="mt-[7px] text-center text-[11px] leading-[15px] text-pg-faint">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>

        {/*
          The artifact. Everything that is not chrome or conversation.

          On --pg-bg rather than the page surface so the previewed page reads as
          a document sitting on a workbench — the same relationship the shell's
          own canvas has to the plane behind it.
        */}
        <div className="relative min-h-0 min-w-0 flex-1 bg-pg-bg">
          {/*
            One element owns the overflow, its parent owns the coordinate
            space. An island positioned inside a scroller would ride up out of
            the window with the page, which is the opposite of the behaviour
            being reviewed. The extra top padding when floating opens the
            preview below the identity island rather than under it — see the
            same note, at more length, in funnel-page-builder.
          */}
          <div
            className={cn(
              "h-full overflow-y-auto px-[24px] pb-[24px]",
              floating ? "pt-[76px]" : "pt-[24px]",
            )}
          >
            <FunnelAiPreview />
          </div>
          {/*
            Three islands, not five. This builder has no canvas to zoom and no
            tool palette: its tools are the 52px labelled rail at the far left,
            which is a COLUMN and stays one — turning a rail that is already
            beside the work into an island floating over the work would be the
            style applied for its own sake. Undo, redo and the device toggle are
            the only controls here that were page chrome in `rows`, so they are
            the only ones that had to find a new home.

            No palette either, and `builderToolPalette` is not read here. This
            builder edits by ASKING — the transcript on the left is the tool,
            and the preview on the right is a picture of a page rather than a
            surface you place things on. A bar of element glyphs under it would
            be offering a second, non-existent way to work. Sep 23.
          */}
          {floating ? (
            <FloatingLayer
              topLeft={
                <IdentityIsland
                  icon={Layers}
                  name="Untitled funnel"
                  trail={trail}
                  onLeave={onBack}
                  exit={exit}
                />
              }
              topRight={<CollabIsland commit={commitActions} />}
              bottomRight={
                <Island className="py-[5px]">
                  <IslandGlyph icon={Undo2} label="Undo" />
                  <IslandGlyph icon={Redo2} label="Redo" />
                  <IslandGlyph icon={Monitor} label="Desktop preview" />
                </Island>
              }
            />
          ) : null}
        </div>
      </div>

      {/*
        The status strip.

        Real, in the sense that it names the selection the builder is scoped to
        — "@ Section" in the composer means THIS section — and it costs 26px at
        the bottom of the window, which is exactly the kind of thing the bar
        study is counting. Left it in so the count is honest.
      */}
      <div className="flex h-[26px] shrink-0 items-center gap-[6px] border-t border-pg-border px-[14px]">
        <span className="text-[11.5px] leading-[normal] text-pg-muted">Page</span>
        <ChevronRight size={11} aria-hidden="true" className="text-pg-faint" />
        <span className="text-[11.5px] leading-[normal] font-medium text-pg-text">
          Section
        </span>
        <div className="min-w-0 flex-1" />
        <span className="text-[11.5px] leading-[normal] text-pg-faint">
          Desktop · 100%
        </span>
      </div>
    </div>
  );
}


/**
 * One turn of the transcript.
 *
 * The user's is a bubble and the assistant's is not, which is the convention
 * every assistant in this class settled on: the reply is the page's content,
 * the prompt is a thing you said. Boxing both would make the column read as a
 * chat log rather than as a working surface.
 */
function Turn({ message }: { message: BuilderMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[86%] rounded-[12px] rounded-br-[4px] bg-pg-bg px-[12px] py-[9px] text-[13.5px] leading-[19px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {message.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-[9px]">
      <span className="mt-[1px] flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--ai-btn-from)] text-[var(--ai-btn-fg)]">
        <AiSparkle box={14} glyphWidth={12} offsetX={1} offsetY={0.8} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
        {message.body.map((p) => (
          <p key={p} className="text-[13.5px] leading-[19px] text-pg-text">
            {p}
          </p>
        ))}
        {message.bullets ? (
          <ul className="flex flex-col gap-[5px]">
            {message.bullets.map((b) => (
              <li
                key={b}
                className="flex gap-[8px] text-[13.5px] leading-[19px] text-pg-text"
              >
                <span
                  aria-hidden="true"
                  className="mt-[7px] size-[4px] shrink-0 rounded-full bg-pg-faint"
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

function ToolButton({
  icon: Icon,
  label,
}: {
  icon: typeof Undo2;
  label: string;
}) {
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
