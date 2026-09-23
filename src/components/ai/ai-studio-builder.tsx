"use client";

import * as React from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Code,
  Copy,
  EllipsisVertical,
  ExternalLink,
  Eye,
  History,
  LayoutGrid,
  Monitor,
  PanelRight,
  Plus,
  RotateCw,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Undo2,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { AiSparkle } from "@/components/icons/ai-sparkle";
import { PrimaryButton } from "@/components/page/page-header";
import {
  CollabIsland,
  FloatingLayer,
  IdentityIsland,
  Island,
  IslandGlyph,
  IslandRule,
} from "@/components/shell/floating-chrome";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { BUILDER_TURN, type StudioProject } from "./ai-studio-data";
import { AiStudioPreview } from "./ai-studio-preview";

/**
 * AI Studio's builder: one conversation, one artifact, one splitter.
 *
 * The same archetype as `funnel-ai-builder.tsx` and drawn separately on
 * purpose — the two exist to be COMPARED. The funnel builder keeps the
 * platform's chrome switchable (its four retain combinations are the thing
 * under test); this one has taken the whole shell, so the row along the top is
 * the only chrome on screen and every control the session needs has to be in
 * it. Sharing a component between them would have meant a row with a
 * `takeover?` prop, and the first thing that prop would have hidden is the
 * difference the review is about.
 *
 * The exit is the shell's node, handed down, and here it does mean something
 * unambiguous: it goes back to the project list one level up. That is worth
 * naming, because it is the strongest thing that can be said for the pattern —
 * the arrow is only vague on the HOME screen, where the level above it is a
 * platform the screen never mentions.
 *
 * Right column: a picture. See `ai-studio-preview.tsx`.
 */

/** The three ways to look at the project. Views, not modes: none of them writes. */
const VIEWS = [
  { id: "preview", label: "Preview", icon: Eye },
  { id: "code", label: "Code", icon: Code },
  { id: "components", label: "Components", icon: LayoutGrid },
] as const;

/** Where the splitter may go. */
const CHAT_MIN = 320;
const CHAT_MAX = 620;

export function AiStudioBuilder({
  project,
  exit,
}: {
  project: StudioProject;
  /** The exit the shell built. Null only if the shell refused the takeover. */
  exit: React.ReactNode | null;
}) {
  /*
   * The one ThemeState field this screen reads, and the reason it is not two.
   *
   * `builderKeepSidebar` and `builderKeepTopBar` are deliberately NOT wired
   * here — see ai-studio-page, which explains that the takeover is a fixed
   * data point rather than a variant under test. The chrome STYLE is a
   * different question: it is about how this screen draws the controls it
   * already owns, not about how much of the platform survives, and a
   * counter-example that could not be shown in both styles would be arguing
   * against `rows` rather than against the takeover.
   */
  const floating = useTheme().effective.builderChromeStyle === "floating";
  const [view, setView] = React.useState<string>("preview");
  /*
   * The split, in pixels rather than a percentage.
   *
   * A percentage split feels right until the window is resized: the chat
   * column is a MEASURE — about 70 characters at 14px, the same reasoning as
   * the funnel builder's fixed 392 — and a percentage stretches it to
   * 120-character lines on a wide monitor while squeezing it under readable on
   * a laptop. Draggable because this builder, unlike that one, has no platform
   * nav to give the artifact room by collapsing; the splitter is the only
   * width negotiation left on the screen.
   */
  const [chatWidth, setChatWidth] = React.useState(424);
  const [dragging, setDragging] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const box = rootRef.current?.getBoundingClientRect();
      if (!box) return;
      setChatWidth(
        Math.min(CHAT_MAX, Math.max(CHAT_MIN, e.clientX - box.left)),
      );
    };
    const stop = () => setDragging(false);
    /*
     * On the window, not the handle. A 5px strip loses the pointer the moment
     * the drag outruns the render, and a handle that drops the gesture at
     * speed is the bug every hand-rolled splitter ships with once.
     */
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragging]);

  /*
   * The view switch and the path field, hoisted out of the row on Sep 23.
   *
   * Both are needed twice now — in the row under `rows`, and in an island
   * under `floating` — and a second copy of either would be a second piece of
   * state's worth of chances to disagree: two tablists both claiming to say
   * which view is selected is exactly the failure the "one boolean, one
   * affordance" note elsewhere in this prototype keeps catching.
   */
  const viewSwitch = (
    <div
      role="tablist"
      aria-label="Project view"
      className="flex shrink-0 items-center gap-[2px] rounded-[9px] bg-pg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {VIEWS.map((v) => {
        const on = v.id === view;
        const Icon = v.icon;
        return (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={on}
            aria-label={v.label}
            title={v.label}
            onClick={() => setView(v.id)}
            className={cn(
              "motion-tap flex h-[24px] items-center gap-[5px] rounded-[7px] px-[8px] text-[12.5px] leading-[normal]",
              on
                ? "bg-pg-surface font-semibold text-pg-heading shadow-[0_1px_2px_0_rgba(15,23,42,0.10)]"
                : "font-medium text-pg-muted hover:text-pg-text",
            )}
          >
            <Icon size={14} aria-hidden="true" />
            {/* Only the selected view says its name. Three labels made the
                cluster wider than the path field it sits beside, and the two
                unselected ones are a choice, not a status. */}
            {on ? v.label : null}
          </button>
        );
      })}
    </div>
  );

  const pathField = (
    <div className="flex h-[30px] items-center gap-[4px] rounded-[9px] bg-pg px-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <Monitor size={14} aria-hidden="true" className="shrink-0 text-pg-muted" />
      <ChevronDown size={12} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <span className="mx-[4px] w-[132px] truncate text-[12.5px] leading-[normal] text-pg-text">
        /
      </span>
      <GlyphButton icon={ExternalLink} label="Open in a new tab" small />
      <GlyphButton icon={RotateCw} label="Refresh preview" small />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-pg-surface">
      {floating ? null : (
        <>
        {/*
          The builder's row — under `rows`, the only row there is.

          Three tracks rather than a flex line with spacers: the path field is
          centred on the WINDOW, which is what makes it read as the address of
          the thing on the right rather than as one more control belonging to the
          cluster at the left. Spacers would centre it between its neighbours
          instead, and it would drift every time a label changed.
        */}
        <div className="grid h-[48px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-[12px] border-b border-pg-head-border px-[12px]">
          <div className="flex min-w-0 items-center gap-[8px]">
            {exit}
            <button
              type="button"
              className="motion-tap flex h-[30px] min-w-0 items-center gap-[6px] rounded-[8px] px-[8px] text-[13px] leading-[normal] font-semibold text-pg-heading hover:bg-pg"
            >
              <span className="truncate">{project.name}</span>
              <ChevronDown size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
            </button>
            <GlyphButton icon={History} label="Version history" />
            <GlyphButton icon={PanelRight} label="Toggle panel" />

            <span aria-hidden="true" className="mx-[2px] h-[18px] w-px bg-pg-border" />

            {/*
              Preview / code / components as a segmented group rather than three
              loose glyphs: they are one choice with three answers, and three
              separate toggles would let a reader believe two could be on.
            */}
            {viewSwitch}
          </div>

          {pathField}

          <div className="flex items-center justify-end">
            <PrimaryButton className="h-[30px] px-[14px] text-[12.5px]">
              Publish
            </PrimaryButton>
          </div>
        </div>
        </>
      )}

      {/*
        `select-none` only WHILE dragging. A pointer crossing the preview with
        a button down selects the app's headline on the way past, and the first
        screenshot of a resize had "Tasks / Stay organized" highlighted in blue
        halfway across it. Permanent select-none was the other fix and is
        worse: the transcript is text a reader should be able to copy, and this
        column is where the assistant's answer lives.
      */}
      <div
        ref={rootRef}
        className={cn("flex min-h-0 flex-1", dragging && "select-none")}
      >
        <div
          className="flex min-h-0 shrink-0 flex-col"
          style={{ width: chatWidth }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[16px] pt-[16px] pb-[10px]">
            {/* The stamp, as a rule with the time on it. A bare line of text
                left-aligned reads as a message from nobody; the rule says it
                is a divider in the transcript. */}
            <div className="flex shrink-0 items-center gap-[10px]">
              <span aria-hidden="true" className="h-px min-w-0 flex-1 bg-pg-border" />
              <span className="text-[11.5px] leading-[normal] text-pg-faint">
                {BUILDER_TURN.stamp}
              </span>
              <span aria-hidden="true" className="h-px min-w-0 flex-1 bg-pg-border" />
            </div>

            {/* The prompt is a bubble and the reply is not — the convention
                every assistant in this class settled on, and the same one the
                funnel builder follows. The reply is the page's content; the
                prompt is a thing you said. */}
            <div className="flex justify-end">
              <div className="max-w-[86%] rounded-[12px] rounded-br-[4px] bg-pg px-[12px] py-[9px] text-[13.5px] leading-[19px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
                {BUILDER_TURN.prompt}
              </div>
            </div>

            {/* Kept, and kept QUIET. How long it thought is provenance, not
                content, so it sits at the transcript's smallest size — but
                deleting it would take away the only evidence on screen that
                the run below took time rather than being canned. */}
            <p className="text-[12px] leading-[normal] text-pg-faint">
              {BUILDER_TURN.thought}
            </p>

            <ToolRunCard />

            <div className="flex flex-col gap-[9px]">
              {BUILDER_TURN.reply.map((p) => (
                <p key={p} className="text-[13.5px] leading-[19px] text-pg-text">
                  {p}
                </p>
              ))}
            </div>

            {/*
              The reactions, under the whole turn rather than beside it.

              Undo is first and it is not a reaction at all — it is the one
              control here that changes the project, and it sits with the
              others because that is where this product puts it. Worth a note
              precisely because it is the kind of thing a review should catch:
              a destructive action filed among thumbs.
            */}
            <div className="flex items-center gap-[2px]">
              <GlyphButton icon={Undo2} label="Undo this change" small />
              <GlyphButton icon={Copy} label="Copy" small />
              <GlyphButton icon={ThumbsUp} label="Good response" small />
              <GlyphButton icon={ThumbsDown} label="Bad response" small />
              <GlyphButton icon={EllipsisVertical} label="More" small />
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-[8px] px-[16px] pb-[12px]">
            {/*
              One suggestion, not a row of them. A chip rail under a composer
              reads as a menu you are expected to choose from, and the next
              step after a first build is usually something the assistant could
              not have guessed.
            */}
            <button
              type="button"
              className="motion-tap flex h-[28px] w-fit items-center gap-[6px] rounded-full bg-pg-surface pr-[11px] pl-[7px] text-[12.5px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading"
            >
              <AiSparkle box={14} glyphWidth={12} offsetX={1} offsetY={0.8} />
              {BUILDER_TURN.suggestion}
            </button>

            <div className="flex flex-col gap-[9px] rounded-[14px] bg-pg p-[10px] shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
              <span className="px-[2px] text-[13.5px] leading-[19px] text-pg-faint">
                Ask AI…
              </span>
              <div className="flex items-center gap-[6px]">
                <GlyphButton icon={Plus} label="Add context" />
                {/*
                  "Visual edits" is a MODE — it changes what clicking the
                  preview does — so it is a labelled control among glyphs
                  rather than a fourth icon. The glyphs beside it are all
                  one-shot actions; a mode hidden among them would be the only
                  thing on the row that stays on after you press it.
                */}
                <button
                  type="button"
                  className="motion-tap flex h-[26px] shrink-0 items-center gap-[5px] rounded-[7px] bg-pg-surface px-[8px] text-[12px] leading-[normal] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading"
                >
                  <SquarePen size={13} aria-hidden="true" className="text-pg-faint" />
                  Visual edits
                </button>
                <GlyphButton icon={Volume2} label="Read replies aloud" />
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
          </div>
        </div>

        {/*
          The splitter.

          A separator role with arrow keys as well as a pointer: it is the only
          way to give the artifact more room on this screen, and a control that
          exists solely as a 5px drag target is one keyboard users simply do
          not have. `touch-none` so a trackpad drag does not scroll the
          transcript underneath it mid-gesture.
        */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the conversation"
          aria-valuenow={chatWidth}
          aria-valuemin={CHAT_MIN}
          aria-valuemax={CHAT_MAX}
          tabIndex={0}
          onPointerDown={(e) => {
            // Stops the gesture from starting a selection in the first place;
            // `select-none` below only covers what it would drag across next.
            e.preventDefault();
            setDragging(true);
          }}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 48 : 16;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              setChatWidth((w) => Math.max(CHAT_MIN, w - step));
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              setChatWidth((w) => Math.min(CHAT_MAX, w + step));
            }
          }}
          className={cn(
            "group relative w-[5px] shrink-0 cursor-col-resize touch-none border-x border-pg-border bg-pg-surface",
            "focus-visible:outline-none",
            dragging && "bg-pg",
          )}
        >
          {/* The grip: three dots, only once the pointer or focus is on the
              strip. Permanently visible it becomes a decorative seam down the
              middle of every screenshot of this screen. */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-[3px] rounded-full bg-pg-surface px-[2px] py-[6px] opacity-0 shadow-[inset_0_0_0_1px_var(--pg-border)]",
              "group-hover:opacity-100 group-focus-visible:opacity-100",
              dragging && "opacity-100",
            )}
          >
            <span className="size-[2px] rounded-full bg-pg-faint" />
            <span className="size-[2px] rounded-full bg-pg-faint" />
            <span className="size-[2px] rounded-full bg-pg-faint" />
          </span>
        </div>

        {/*
          The artifact, on --pg-bg rather than the page surface: the generated
          app reads as a document on a workbench, which is the same
          relationship the shell's canvas has to the plane behind it.
        */}
        <div className="relative min-h-0 min-w-0 flex-1 bg-pg">
          {/* The scroller is separate so the islands, which are positioned
              against the box, do not ride up out of the window with the page
              they are floating over. */}
          <div
            className={cn(
              "h-full overflow-y-auto px-[28px] pb-[28px]",
              floating ? "pt-[76px]" : "pt-[28px]",
            )}
          >
            <AiStudioPreview />
          </div>

          {/*
            Four islands, over the ARTIFACT rather than over the window.
            Anchoring them to the whole screen would put the identity island on
            top of a transcript, and a transcript scrolls rather than pans —
            content you cannot move out from under an island is content the
            island has taken.

            No zoom, no undo pair, and — the Sep 23 answer to the axis — no
            tool palette even when the reviewer turns one on. This builder has
            none of the three: the preview is an iframe at whatever size the
            splitter left it, Undo lives under the turn that caused the change
            (which is where this product puts it, and which the note beside it
            already argues about), and the project is CHANGED by asking for a
            change in the transcript rather than by holding a tool over a
            surface. `builderToolPalette` is therefore not read on this page at
            all. Inventing any of the three to win a symmetrical set of six
            corners would be the style inventing controls for the page — which
            is exactly the mistake the workflow canvas's pen and "Font" were.
          */}
          {floating ? (
            <FloatingLayer
              topLeft={
                <IdentityIsland
                  icon={LayoutGrid}
                  name={project.name}
                  /*
                    Empty, and not a bug. This screen takes the whole shell,
                    so there is no bar's trail coming down to it — the only
                    path it could draw is one it invented, and `ai-studio-page`
                    is explicit that the level above AI Studio is a platform
                    this screen never names. The island shows the project and
                    the way out, which is all it can honestly say.
                  */
                  trail={[]}
                  onLeave={() => undefined}
                  exit={exit}
                  trailing={
                    <>
                      <IslandRule />
                      <IslandGlyph icon={History} label="Version history" />
                      <IslandGlyph icon={PanelRight} label="Toggle panel" />
                    </>
                  }
                />
              }
              /*
                Path and view in ONE island, as of Sep 23.

                The view switch was a bottom-centre island of its own, which
                put it in the slot the tool palette uses on every other builder
                — so it read as this screen's palette, and this screen has no
                tools. It is not a palette: preview, code and components are
                three ways to LOOK at the project, which is the same tense as
                the path field beside it. One island, one statement about what
                is being looked at and how, and the bottom of the canvas left
                to the canvas.
              */
              topCentre={
                <Island className="py-[5px]">
                  {pathField}
                  <IslandRule />
                  {viewSwitch}
                </Island>
              }
              topRight={
                <CollabIsland
                  commit={
                    <PrimaryButton className="h-[30px] px-[14px] text-[12.5px]">
                      Publish
                    </PrimaryButton>
                  }
                />
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * The tool run, as a card rather than as prose.
 *
 * This is the part of the transcript that is a RECORD instead of a reply: six
 * tools ran and wrote files, and that happened whether or not anyone reads the
 * paragraph under it. A card is how the screen says "this is what the model
 * did", so the prose below it can be what the model SAYS — the two were one
 * block in the first cut and the reply read like a changelog.
 */
function ToolRunCard() {
  return (
    <div className="flex flex-col gap-[9px] rounded-[12px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <p className="text-[13.5px] leading-[19px] font-semibold text-pg-heading">
        {BUILDER_TURN.runTitle}
      </p>
      <p className="flex items-center gap-[6px] text-[12.5px] leading-[normal] text-pg-muted">
        <Check size={13} aria-hidden="true" className="text-pg-muted" />
        {BUILDER_TURN.runMeta}
      </p>
      <div className="flex items-center gap-[7px] pt-[1px]">
        {/* Details opens the run; Preview jumps the right column to what it
            produced. Both are outlined — neither is the default action here,
            because the default action after a finished run is to keep talking,
            and that control is the composer. */}
        <CardButton label="Details" />
        <CardButton label="Preview" />
      </div>
    </div>
  );
}

function CardButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="motion-tap flex h-[26px] items-center rounded-[7px] bg-pg-surface px-[10px] text-[12.5px] leading-[normal] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading"
    >
      {label}
    </button>
  );
}

function GlyphButton({
  icon: Icon,
  label,
  small,
}: {
  icon: LucideIcon;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        /* Hover fills with --pg-bg, which is the page's own recessed tone:
           the glyphs that sit on a recessed strip (the path bar, the
           composer) then darken their ink alone, which is the right amount
           of feedback for a control already inside a container. */
        "motion-tap flex shrink-0 items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg hover:text-pg-heading active:scale-95",
        small ? "size-[24px]" : "size-[28px]",
      )}
    >
      <Icon size={small ? 14 : 16} aria-hidden="true" />
    </button>
  );
}
