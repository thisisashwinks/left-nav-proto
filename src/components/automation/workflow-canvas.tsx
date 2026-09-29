"use client";

import * as React from "react";
import {
  AlignCenterHorizontal,
  ClipboardList,
  Clock,
  Ellipsis,
  GitBranch,
  Hand,
  Keyboard,
  LogIn,
  LogOut,
  Mail,
  Maximize,
  MessageSquare,
  Minus,
  Moon,
  MousePointer2,
  Plus,
  Share2,
  Sparkles,
  Tag,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { BuilderCanvas } from "@/components/page/header-variants";
import { cn } from "@/lib/utils";
/* The Standard builder's state-driven furniture — rail, panels, stickies. A
   second lucide import rather than a longer first one, so the two halves of
   this file can be edited without colliding on one list. */
import {
  ArrowUp,
  Bell,
  Copy,
  EllipsisVertical,
  Eye,
  GripVertical,
  Info,
  Mic,
  SquarePlus,
  Trash2,
} from "lucide-react";
import { showToast } from "@/components/page/toast";
import {
  useBuilderState,
  type BuilderState,
} from "@/components/automation/builder-state";
import {
  BuilderRail,
  PANEL_GAP,
  PANEL_W,
  RAIL_W,
  RailPanelHost,
  StickyNotes,
  StickyPalette,
  panelHasCard,
} from "@/components/automation/builder-rail";
import {
  BuilderDrawerHost,
  DeleteStepModal,
} from "@/components/automation/builder-drawers";
import {
  KeyboardShortcutsPanel,
  MoveTarget,
  NodeHoverToolbar,
  NodeMenu,
  NodeNotePopover,
} from "@/components/automation/builder-overlays";

/**
 * The thing the Sep 22 header study is actually standing around.
 *
 * Up to now the builder page drew a stylised run of step cards, and every
 * argument about builder chrome — how much of the app bar survives, where the
 * publish row goes, whether the sidebar stays — was being judged against a
 * canvas that looked nothing like the one operators use. That is a bad test:
 * chrome is only ever too much or too little RELATIVE to what it frames, and
 * the real Workflows canvas is far busier than the sketch was. A toolbar that
 * looks generous over three grey boxes looks cramped over a canvas that
 * already carries a tool rail, a zoom cluster and a minimap of its own.
 *
 * So this file draws the two real canvases at the fidelity the review needs,
 * and keeps the sketch as the third option so the earlier judgements can still
 * be reproduced rather than only remembered.
 *
 * Three rules hold for all three variants:
 *
 *   1. NO PAGE CHROME. Not a header, not a trail, not a publish row. Those are
 *      exactly what the variants disagree about, and a canvas that drew its own
 *      would be answering the question the page above it is asking.
 *   2. It fills whatever box it is given. The parent owns the height; this
 *      component owns nothing but the inside of it.
 *   3. Presentational only. No fetching, no store, no persistence — the drag
 *      state in `advanced` is local and is meant to be lost on remount, because
 *      a canvas that remembered a demo layout would start every review from
 *      wherever the last reviewer left it.
 */

/* ── shared furniture ───────────────────────────────────────────────────── */

/**
 * The dot grid.
 *
 * Drawn as a background image on a layer of its own rather than on the frame,
 * so its opacity can be dropped without taking the frame's own surface colour
 * with it. Both real builders use a dot grid rather than ruled lines — it
 * reads as "place things here" without implying rows.
 */
function GridBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{
        backgroundImage:
          "radial-gradient(var(--pg-border-strong) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    />
  );
}

/**
 * The dark board, as a local re-definition of the page tokens rather than a
 * forked class list.
 *
 * Every surface on the canvas — cards, rafts, minimap, the rail, the dot grid
 * — already paints from --pg-*, so redefining those vars on the frame turns
 * the whole subtree dark at once and a new card added later is dark for free.
 * Inline on the frame, not a page-theme selector: the live builder lets you
 * draw on a dark board inside a light app, so this must NOT leak to the page
 * chrome or to the drawer beside the canvas (which sits outside the frame).
 */
const DARK_CANVAS_VARS = {
  colorScheme: "dark",
  "--pg-bg": "#0B0B0F",
  "--pg-surface": "#111114",
  "--pg-card-border": "#2A2A30",
  "--pg-border": "#2A2A30",
  "--pg-border-strong": "#34343C",
  "--pg-heading": "#F2F4F7",
  "--pg-text": "#D0D5DD",
  "--pg-muted": "#98A2B3",
  "--pg-faint": "#667085",
  "--pg-disabled": "#3A3A42",
  "--pg-av-blue-bg": "#16203a",
  "--pg-av-blue-fg": "#93b4fd",
  "--pg-av-green-bg": "#10281f",
  "--pg-av-green-fg": "#6ee7b7",
  "--pg-av-purple-bg": "#241436",
  "--pg-av-purple-fg": "#d8b4fe",
  "--brand-soft": "color-mix(in oklab, var(--brand) 18%, #111114)",
} as React.CSSProperties;

/**
 * The box every variant lives in.
 *
 * `overflow-hidden` is load-bearing twice over: it clips the grid to the
 * rounded corner, and it stops a node dragged to the edge in `advanced` from
 * extending the page's scroll region — a canvas that grows the document when
 * you drag is the fastest way to make a header study unusable.
 */
function CanvasFrame({
  children,
  className,
  flush,
  dark,
}: {
  children: React.ReactNode;
  className?: string;
  /**
   * Drop the radius and the ring — the Sep 23 addition for `overlays="page"`.
   *
   * A rounded card with a hairline around it is what a canvas looks like when
   * it is one PANE among rows, and it is the correct drawing under `rows`.
   * Under the floating islands the page has already given up its gutter so the
   * surface can reach the shell's edges, and a 11px corner radius arriving at
   * a square viewport corner is the one pixel that still says "pane". The grid
   * is clipped by `overflow-hidden` either way, so nothing else depends on it.
   */
  flush?: boolean;
  /** The builder's own dark board — see DARK_CANVAS_VARS. */
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative h-full min-h-0 w-full overflow-hidden bg-pg",
        flush ? "" : "rounded-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
        className,
      )}
      style={dark ? DARK_CANVAS_VARS : undefined}
    >
      <GridBackdrop />
      {children}
    </div>
  );
}

/**
 * A floating canvas control.
 *
 * Every overlay control in both real builders is the same object: a white
 * square on the canvas, not a button in a bar. Sharing one component keeps
 * them the same weight across variants, which matters because the review is
 * comparing how much chrome sits ABOVE the canvas — the controls inside it
 * have to be a constant for that comparison to mean anything.
 */
function CanvasButton({
  icon: Icon,
  label,
  className,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
  /** Only the read-only path canvas wires these up; the studies stay inert. */
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "motion-tap flex size-[30px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg hover:text-pg-text active:scale-[0.94]",
        className,
      )}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

/** The white raft the floating controls sit on. */
function ControlRaft({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "flex items-center gap-[2px] rounded-[9px] bg-pg-surface p-[3px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_2px_8px_-2px_rgba(15,23,42,0.10)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Who owns the canvas's furniture — the Sep 23 addition, and the only thing
 * about this file that the chrome axis is allowed to move.
 *
 * `canvas` is everything this file has drawn since it was written: the tool
 * rail, the zoom cluster, the minimap. `page` says the page above has taken
 * those corners for its own floating islands, so this file stands the
 * duplicates down.
 *
 * It exists because of a collision this file PREDICTED. The minimap's own note
 * below says it is kept because it occupies the bottom-right corner, "which is
 * the corner a floating publish row would want" — and on Sep 23 a floating
 * arrangement arrived and wanted exactly that, plus the bottom-left the zoom
 * stack has and the rail's whole left edge. Two zoom clusters and two tool
 * palettes on one screen is not a finding about chrome, it is a rendering bug
 * a reviewer spends the session on instead.
 *
 * Deliberately NOT the same thing as hiding controls. Under `page` the zoom
 * cluster, the undo pair and Add are all still on screen — each is in an
 * island a few pixels away, drawn by floating-chrome.tsx. What moved is which
 * file draws it, and rule 1 at the top of this file still holds: this canvas
 * never draws page chrome. It is now merely allowed to be told that the page
 * drew the canvas's.
 *
 * The rail is the one thing that MOVES RATHER THAN RELOCATES, and it is worth
 * naming rather than glossing: under `page` the eight step categories stop
 * being a permanent band and become what the island's Add step opens. That is
 * a real difference between the two styles and a fair thing to price, which is
 * the entire purpose of having the axis.
 */
export type CanvasOverlays = "canvas" | "page";

export function WorkflowCanvas({
  variant,
  overlays = "canvas",
}: {
  variant: BuilderCanvas;
  overlays?: CanvasOverlays;
}) {
  if (variant === "advanced") return <AdvancedCanvas overlays={overlays} />;
  if (variant === "abstract") return <SketchCanvas overlays={overlays} />;
  return <StandardCanvas overlays={overlays} />;
}

/* ── standard ───────────────────────────────────────────────────────────── */

/**
 * The left rail's glyphs, top to bottom.
 *
 * Eight categories, then the AI entry, then the theme toggle — the order the
 * shipped builder uses, and the reason it is worth reproducing at all: the
 * rail is the only part of the Standard canvas that competes with the page
 * header for the top-left corner. Any variant that moves a back arrow or a
 * trail down into the canvas area lands on top of it, and the review cannot
 * see that collision unless the rail is actually drawn.
 */
const STANDARD_RAIL: readonly { icon: LucideIcon; label: string }[] = [
  { icon: Zap, label: "Triggers" },
  { icon: Users, label: "Contact actions" },
  { icon: MessageSquare, label: "Conversations" },
  { icon: Mail, label: "Email" },
  { icon: Clock, label: "Wait" },
  { icon: GitBranch, label: "Conditions" },
  { icon: Tag, label: "Data" },
  { icon: Share2, label: "Integrations" },
];

/** Geometry the trigger row and its elbow both have to agree on. */
const TRIGGER_H = 62;
/** Gap from the centre card's right edge to the dashed sibling. */
const ADD_TRIGGER_GAP = 22;
const CARD_W = 302;
const ADD_TRIGGER_W = 172;

function NodeCard({
  icon: Icon,
  tone,
  title,
  detail,
  menu,
  disabled,
}: {
  icon: LucideIcon;
  tone: "green" | "blue";
  title: string;
  detail: React.ReactNode;
  menu?: boolean;
  /** Switched off from the hover toolbar: grey card, grey icon, "(Disabled)". */
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-[10px] rounded-[10px] px-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.05)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_2px_8px_-2px_rgba(15,23,42,0.10)]",
        disabled ? "bg-pg" : "bg-pg-surface",
      )}
      style={{ width: CARD_W, height: TRIGGER_H }}
    >
      <span
        className={cn(
          "flex size-[30px] shrink-0 items-center justify-center rounded-[8px]",
          disabled && "opacity-60 grayscale",
        )}
        style={{
          background:
            tone === "green" ? "var(--pg-av-green-bg)" : "var(--pg-av-blue-bg)",
          color:
            tone === "green" ? "var(--pg-av-green-fg)" : "var(--pg-av-blue-fg)",
        }}
      >
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-[2px]">
        <span
          className={cn(
            "truncate text-[13px] leading-[17px] font-semibold",
            disabled ? "text-pg-muted" : "text-pg-heading",
          )}
        >
          {disabled ? `${title} (Disabled)` : title}
        </span>
        <span className="truncate text-[12px] leading-[16px] text-pg-muted">
          {detail}
        </span>
      </div>
      {menu ? (
        <button
          type="button"
          aria-label="Step options"
          title="Step options"
          className="motion-tap absolute top-[6px] right-[6px] flex size-[22px] items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg hover:text-pg-text"
        >
          <Ellipsis size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/** The `+` that sits on the run between two nodes. */
function RunPlus({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add step"
      title="Add step"
      onClick={onClick}
      className="motion-tap flex size-[24px] items-center justify-center rounded-full bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:rotate-90 hover:text-brand active:scale-90"
    >
      <Plus size={13} aria-hidden="true" />
    </button>
  );
}

function RunLine({ height }: { height: number }) {
  return (
    <span
      aria-hidden="true"
      className="w-px bg-pg-border-strong"
      style={{ height }}
    />
  );
}

/**
 * The shipped Standard builder.
 *
 * One vertical run down the middle, a rail on the far left, controls bottom
 * left, a minimap bottom right. The dashed "Add new trigger" card to the right
 * of the trigger is the detail worth the trouble: it is the only thing in the
 * Standard canvas that is not on the centre line, so it is what tells you at a
 * glance that the run is centred on the CANVAS rather than on the content —
 * and that is precisely what breaks when a variant steals width from the left
 * for a retained sidebar.
 */
function StandardCanvas({ overlays }: { overlays: CanvasOverlays }) {
  const own = overlays === "canvas";
  /*
   * Sep 29: the builder state, when workflow-detail provides it. Null means a
   * caller drawing this canvas on its own, and every `state ?` below falls
   * back to exactly what this canvas drew before there was any state — so
   * the header study's screenshots stay reproducible.
   */
  const state = useBuilderState();
  const editable = !state || state.mode === "edit";
  const cardOpen = Boolean(state && panelHasCard(state.panel));
  /* Where the left-hand rafts start: past the rail, and past the panel card
     when one is open so it does not bury them. */
  const leftInset =
    (own ? RAIL_W : 0) + (cardOpen ? PANEL_GAP + PANEL_W : 0) + 14;
  useMoveEscape(state);
  return (
    <BuilderLayout state={state}>
    <CanvasFrame flush={overlays === "page"} dark={state?.darkCanvas}>
      {state && own ? <BuilderRail /> : null}
      {state ? <RailPanelHost /> : null}
      {state ? <StickyPalette /> : null}
      {state ? <StickyNotes /> : null}
      {state && state.mode === "stats" ? (
        <StatsViewNote left={leftInset} />
      ) : null}
      {state && state.mode === "version" ? <VersionViewPill /> : null}

      {/* The category rail. Full height and flush left, as it ships — it is
          part of the canvas, not a floating raft like the zoom cluster.

          Gone under `page`, and Sep 23 sharpened WHY. The first reason still
          holds: when the page draws a palette, two element palettes on one
          canvas is the arrangement neither style is arguing for. The second
          is geometric and survives the palette being switched off — the
          identity island anchors at `left-[12px]`, which is inside this rail.
          Keeping a 42px band under an island that lands on its top three
          glyphs is not "the canvas kept its rail", it is two things in one
          place. The eight categories are reached from the island's Add step
          under `page`, the way every other menu on this canvas is reached.

          Under builder state the rail is BuilderRail's instead — the
          workflow's tools rather than step categories. */}
      {own && !state ? (
      <div className="absolute inset-y-0 left-0 z-10 flex w-[42px] flex-col items-center gap-[2px] border-r border-pg-border bg-pg-surface py-[10px]">
        {STANDARD_RAIL.map((item) => (
          <CanvasButton key={item.label} icon={item.icon} label={item.label} />
        ))}
        <span className="mt-auto flex flex-col items-center gap-[4px]">
          <CanvasButton
            icon={Sparkles}
            label="Build with AI"
            className="text-brand hover:text-brand"
          />
          <span
            aria-hidden="true"
            className="h-px w-[18px] bg-pg-border"
          />
          <CanvasButton icon={Moon} label="Dark canvas" />
        </span>
      </div>
      ) : null}

      {/* The run. `pl-[42px]` keeps it centred on the canvas the operator can
          actually see rather than on the frame, which is what the product
          does — the rail is furniture, not content. The padding goes with the
          rail: keeping it under `page` would push the run off centre to make
          room for something that is no longer there.

          Under builder state the padding also clears an open panel card, and
          the run centres with `m-auto` rather than the flex centring, so a
          graph taller than the frame scrolls from its top instead of being
          clipped above it. */}
      <div
        className={cn(
          state
            ? "absolute inset-0 flex overflow-auto"
            : "absolute inset-0 flex items-center justify-center overflow-auto",
          own && "pl-[42px]",
        )}
        style={
          state
            ? { paddingLeft: leftInset - 14, transition: "padding-left 180ms ease" }
            : undefined
        }
      >
        {state ? (
          /* Zoom scales the run from its top centre, so zooming out pulls
             the graph up toward where the eye already is instead of
             sinking it into the middle of the frame. */
          <div
            className="m-auto"
            style={{
              transform: `scale(${state.zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 150ms ease",
            }}
          >
            <BuilderRun state={state} editable={editable} />
          </div>
        ) : (
        <div className="relative flex flex-col items-center py-[40px]">
          <NodeCard
            icon={ClipboardList}
            tone="green"
            title="Form Submitted"
            detail={
              <>
                Form is is any of{" "}
                <span className="text-pg-text">“Project Manage…”</span>
              </>
            }
          />

          {/*
           * The dashed sibling and its elbow.
           *
           * Both are positioned rather than laid out, because the run has to
           * stay centred on the canvas and a second column in the flex row
           * would drag the centre line left by half the dashed card. The two
           * offsets below are the same arithmetic written twice — the card
           * starts half a card plus the gap out from the centre, and the elbow
           * has to reach its middle — so they are derived from the constants
           * instead of typed as literals.
           */}
          <div
            className="absolute flex items-center justify-center rounded-[10px] border border-dashed border-pg-border-strong bg-pg-surface/60 text-[12px] leading-[16px] font-medium text-pg-muted"
            style={{
              left: `calc(50% + ${CARD_W / 2 + ADD_TRIGGER_GAP}px)`,
              top: 40,
              width: ADD_TRIGGER_W,
              height: TRIGGER_H - 6,
            }}
          >
            <Plus size={13} aria-hidden="true" className="mr-[6px]" />
            Add new trigger
          </div>
          <span
            aria-hidden="true"
            className="absolute rounded-br-[10px] border-r border-b border-dashed border-pg-border-strong"
            style={{
              left: "50%",
              top: 40 + TRIGGER_H - 6,
              width: CARD_W / 2 + ADD_TRIGGER_GAP + ADD_TRIGGER_W / 2,
              height: 28,
            }}
          />

          <RunLine height={22} />
          <RunPlus />
          <RunLine height={22} />

          <NodeCard
            icon={Tag}
            tone="blue"
            title="Add Tag"
            detail="project-manager"
            menu
          />

          <RunLine height={22} />
          <RunPlus />
          <RunLine height={22} />

          {/* END is a pill rather than a card on purpose: it is a state the
              run reaches, not a step you can open. */}
          <span className="flex h-[26px] items-center rounded-full bg-[var(--pg-border)] px-[14px] text-[11px] leading-[normal] font-semibold tracking-[0.6px] text-pg-muted">
            END
          </span>
        </div>
        )}
      </div>

      {/* Top corners. Left is help, right is the one thing you can add to the
          canvas from outside a node — the same left-is-free / right-is-
          commitment split the page header above obeys. The help raft goes
          under `page`: the identity island lands on that exact spot, and the
          shortcut hints are printed above the palette's tools there anyway. */}
      {own ? (
        state ? (
          <div className="absolute top-[14px] z-10" style={{ left: leftInset }}>
            <ControlRaft>
              <CanvasButton
                icon={Keyboard}
                label="Keyboard shortcuts"
                onClick={() => state.setShortcutsOpen(!state.shortcutsOpen)}
                className={state.shortcutsOpen ? "text-brand hover:text-brand" : undefined}
              />
            </ControlRaft>
          </div>
        ) : (
        <ControlRaft className="absolute top-[14px] left-[56px] z-10">
          <CanvasButton icon={Keyboard} label="Keyboard shortcuts" />
        </ControlRaft>
        )
      ) : null}
      {/* Add, and the Sep 23 correction to the note that used to be here.
          It said Add "survives in both" and then, under `page`, dropped it
          from `top-[14px]` to `top-[62px]` so it would clear the collaboration
          island. What that produced was a lone brand button hanging in the gap
          BETWEEN two islands, attached to neither and to nothing on the
          canvas — a stray third thing, and the first question the screenshot
          got. The control still survives; it is drawn by the page, in the
          bottom-right island beside undo and redo, where the canvas's other
          actions already are. Relocated, not removed — which is the whole
          contract of `overlays` and is why this is one more `own` gate rather
          than a special case.

          Sep 29: gone in the read-only modes too — Stats and a past version
          are both views you cannot add to. */}
      {own && editable ? (
        <button
          type="button"
          onClick={
            state
              ? () => state.setDrawer({ kind: "add-action", after: "end" })
              : undefined
          }
          className="motion-tap absolute top-[14px] right-[14px] z-10 flex h-[30px] items-center gap-[5px] rounded-[8px] bg-brand px-[11px] text-[13px] leading-[normal] font-medium text-brand-fg shadow-[0_1px_2px_0_rgba(16,24,40,0.08)] hover:brightness-[1.06] active:scale-[0.98]"
        >
          <Plus size={14} aria-hidden="true" />
          Add
        </button>
      ) : null}

      {/* Bottom left: pan, then the zoom stack, then fit. Three rafts rather
          than one row of five, because the product groups them that way and
          the gaps are what make the percentage readable as a value rather
          than as another button. */}
      {own ? (
        <div
          className="absolute bottom-[14px] left-[56px] z-10 flex items-center gap-[8px]"
          style={state ? { left: leftInset } : undefined}
        >
          <ControlRaft>
            <CanvasButton icon={Hand} label="Pan canvas" />
          </ControlRaft>
          <ControlRaft>
            <CanvasButton
              icon={Plus}
              label="Zoom in"
              onClick={state ? () => state.setZoom(state.zoom + 10) : undefined}
            />
            <span className="min-w-[40px] px-[4px] text-center text-[12px] leading-[normal] font-medium tabular-nums text-pg-text">
              {state ? state.zoom : 100}%
            </span>
            <CanvasButton
              icon={Minus}
              label="Zoom out"
              onClick={state ? () => state.setZoom(state.zoom - 10) : undefined}
            />
          </ControlRaft>
          <ControlRaft>
            <CanvasButton
              icon={Maximize}
              label="Fit to screen"
              onClick={state ? () => state.setZoom(fitZoom(state)) : undefined}
            />
          </ControlRaft>
        </div>
      ) : null}

      {/* The minimap. Kept as a dumb rectangle with blocks in it — it is here
          because it occupies the bottom-right corner, which is the corner a
          floating publish row would want, not because a review needs a working
          overview of a two-node workflow.

          Sep 23: that corner was in fact wanted. Under `page` the undo/redo
          island has it, and the minimap is the one control here with no island
          equivalent — so this is the single place where the floating style
          genuinely COSTS the canvas something rather than relocating it. Left
          as a note rather than as a fourth island, because "where does the
          minimap go" is a real question this style has to answer and inventing
          a home for it here would answer it before anyone asked. */}
      {own ? (
        <div className="absolute right-[14px] bottom-[14px] z-10 h-[96px] w-[150px] overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border),0_2px_8px_-2px_rgba(15,23,42,0.10)]">
          <span className="absolute top-[16px] left-[52px] h-[12px] w-[46px] rounded-[3px] bg-pg-disabled" />
          <span className="absolute top-[34px] left-[52px] h-[12px] w-[46px] rounded-[3px] bg-pg-disabled" />
          <span className="absolute top-[16px] left-[104px] h-[12px] w-[28px] rounded-[3px] bg-pg-border-strong" />
          <span className="absolute top-[56px] left-[62px] h-[9px] w-[26px] rounded-full bg-pg-border-strong" />
        </div>
      ) : null}
    </CanvasFrame>
    </BuilderLayout>
  );
}

/**
 * Fit, as the live builder does it: 100% on a bare canvas, 54% when a drawer
 * has taken the right-hand third — the whole WhatsApp fork then still fits
 * in what is left, which is the only graph here wide enough to need it.
 */
function fitZoom(state: BuilderState) {
  return state.drawer ? 54 : 100;
}

/** Escape drops a node being moved — the move is a mode, and modes escape. */
function useMoveEscape(state: BuilderState | null) {
  const moving = state?.moving ?? null;
  const setMoving = state?.setMoving;
  React.useEffect(() => {
    if (!moving || !setMoving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoving(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moving, setMoving]);
}

/**
 * The row and column the canvas sits in once there is builder state.
 *
 * The drawer is IN LAYOUT to the right, not floated over the canvas: the
 * frame narrows by the drawer plus a 16px gap, so the run re-centres on what
 * is still visible rather than disappearing under a card. Keyboard shortcuts
 * dock the same way along the bottom, full width, 16px below the frame.
 *
 * With no state this is a pass-through, so the stateless study keeps its
 * exact box.
 */
function BuilderLayout({
  state,
  children,
}: {
  state: BuilderState | null;
  children: React.ReactNode;
}) {
  if (!state) return <>{children}</>;
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-[16px]">
      <div className="flex min-h-0 flex-1 gap-[16px]">
        <div className="relative min-h-0 min-w-0 flex-1">{children}</div>
        {/* Draws nothing with no drawer open, and flex `gap` only spaces
            children that render, so the frame is full width until then. */}
        <BuilderDrawerHost />
      </div>
      {state.shortcutsOpen ? (
        /* In flow, under the frame — not the panel's own default of floating
           over the canvas's bottom edge, which would bury the rafts. */
        <KeyboardShortcutsPanel
          className="w-full shrink-0"
          onClose={() => state.setShortcutsOpen(false)}
        />
      ) : null}
    </div>
  );
}

/* ── standard, under builder state ──────────────────────────────────────── */

/**
 * The runs StandardCanvas draws when workflow-detail hands it builder state.
 *
 * Three graphs (see BuilderGraph) and three modes. The modes are all
 * subtraction — read-only takes the `+` joints away, Stats also takes the
 * Add new trigger card and swaps the trigger's footer for its counts — so
 * every graph is written once and asks `editable` / `stats` where it forks,
 * rather than being drawn three times.
 *
 * Node ids are the ones find-and-replace highlights: "trigger", "add-tag",
 * "email", "wait", "ai" and "add-trigger".
 */

/** The violet the Wait step and its branches wear in the shipped builder. */
const VIOLET = {
  bg: "var(--pg-av-purple-bg)",
  fg: "var(--pg-av-purple-fg)",
  line: "var(--hr-violet-500)",
};
/** The trigger card's footer strip, under its 62px body. */
const TRIGGER_FOOT_H = 33;
/** Each branch column is a card wide, so a full card below one still fits. */
const BRANCH_GAP = 40;
const AI_CARD_W = 620;

const TRIGGER_STATS = [
  { value: 175, label: "Attempted" },
  { value: 61, label: "Matched" },
  { value: 114, label: "Unmatched" },
] as const;

/** The brand ring find-and-replace lays on a matching node. */
function Highlight({
  on,
  children,
}: {
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] transition-shadow duration-150",
        on && "shadow-[0_0_0_2px_var(--brand),0_0_0_6px_var(--brand-soft)]",
      )}
    >
      {children}
    </div>
  );
}

/**
 * Line, `+`, line — or one plain line of the same length when read-only.
 *
 * `after` is the node the joint hangs under, which is what the `+` hands the
 * Add action drawer and what a move asks about: while a node is being moved
 * every joint becomes a drop target, except the one directly under the
 * moving node, where dropping would be a move to where it already is.
 */
function Joint({ editable, after }: { editable: boolean; after?: string }) {
  const state = useBuilderState();
  if (!editable) return <RunLine height={68} />;
  if (state && after && state.moving) {
    const moving = state.moving;
    return (
      <>
        <RunLine height={14} />
        <MoveTarget
          allowed={after !== moving}
          onDrop={() => {
            state.setMoving(null);
            state.recordChange("Moved action");
            showToast("Action moved");
          }}
        />
        <RunLine height={14} />
      </>
    );
  }
  return (
    <>
      <RunLine height={22} />
      <RunPlus
        onClick={
          state && after
            ? () => state.setDrawer({ kind: "add-action", after })
            : undefined
        }
      />
      <RunLine height={22} />
    </>
  );
}

function EndPill() {
  return (
    <span className="flex h-[26px] items-center rounded-full bg-[var(--pg-border)] px-[14px] text-[11px] leading-[normal] font-semibold tracking-[0.6px] text-pg-muted">
      END
    </span>
  );
}

/**
 * "Add new trigger" as the head of a run — the dashed brand card a workflow
 * starts from when it has no trigger yet. Brand rather than grey (unlike the
 * pm-beta sibling) because here it is the next thing to do, not an option.
 */
function AddTriggerCard({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="motion-tap flex items-center justify-center gap-[6px] rounded-[10px] border border-dashed border-brand bg-brand-soft/60 text-[13px] leading-[18px] font-medium text-brand hover:bg-brand-soft"
      style={{ width: CARD_W, height: TRIGGER_H - 6 }}
    >
      <Plus size={14} aria-hidden="true" />
      Add new trigger
    </button>
  );
}

/** NodeCard's shape in a tone NodeCard does not carry — the violet Wait. */
function ToneCard({
  icon: Icon,
  tone,
  title,
  detail,
  disabled,
}: {
  icon: LucideIcon;
  tone: { bg: string; fg: string };
  title: string;
  detail: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-[10px] rounded-[10px] px-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.05)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_2px_8px_-2px_rgba(15,23,42,0.10)]",
        disabled ? "bg-pg" : "bg-pg-surface",
      )}
      style={{ width: CARD_W, height: TRIGGER_H }}
    >
      <span
        className={cn(
          "flex size-[30px] shrink-0 items-center justify-center rounded-[8px]",
          disabled && "opacity-60 grayscale",
        )}
        style={{ background: tone.bg, color: tone.fg }}
      >
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-[2px]">
        <span
          className={cn(
            "truncate text-[13px] leading-[17px] font-semibold",
            disabled ? "text-pg-muted" : "text-pg-heading",
          )}
        >
          {disabled ? `${title} (Disabled)` : title}
        </span>
        <span className="truncate text-[12px] leading-[16px] text-pg-muted">
          {detail}
        </span>
      </div>
    </div>
  );
}

/**
 * The pm-beta trigger, with the footer the live card carries: duplicate and
 * delete on the left, a Stats link on the right. Under Stats the footer
 * becomes the counts — the card is the same card, reporting instead of
 * offering.
 */
function TriggerCard({
  stats,
  editable,
  onStats,
}: {
  stats: boolean;
  editable: boolean;
  onStats: () => void;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.05)]"
      style={{ width: CARD_W }}
    >
      <div
        className="flex items-center gap-[10px] px-[12px]"
        style={{ height: TRIGGER_H }}
      >
        <span
          className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px]"
          style={{
            background: "var(--pg-av-green-bg)",
            color: "var(--pg-av-green-fg)",
          }}
        >
          <ClipboardList size={16} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-[2px]">
          <span className="truncate text-[13px] leading-[17px] font-semibold text-pg-heading">
            Form Submitted
          </span>
          <span className="truncate text-[12px] leading-[16px] text-pg-muted">
            Form is is any of{" "}
            <span className="text-pg-text">“Project Manage…”</span>
          </span>
        </div>
      </div>
      {stats ? (
        <div className="grid grid-cols-3 border-t border-pg-border">
          {TRIGGER_STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-[2px] py-[8px]"
            >
              <span className="text-[16px] leading-[20px] font-semibold tabular-nums text-pg-heading">
                {s.value.toLocaleString("en-US")}
              </span>
              <span className="text-[12px] leading-[16px] text-pg-muted">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex items-center gap-[2px] border-t border-pg-border px-[6px]"
          style={{ height: TRIGGER_FOOT_H - 1 }}
          /* The footer's own buttons, not a click on the card: under builder
             state the card opens the trigger drawer, and Stats must not. */
          onClick={(e) => e.stopPropagation()}
        >
          {editable ? (
            <>
              <CanvasButton
                icon={Copy}
                label="Duplicate trigger"
                className="size-[24px]"
              />
              <CanvasButton
                icon={Trash2}
                label="Delete trigger"
                className="size-[24px]"
              />
            </>
          ) : null}
          <button
            type="button"
            onClick={onStats}
            className="motion-tap ml-auto rounded-[6px] px-[6px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
          >
            Stats
          </button>
        </div>
      )}
    </div>
  );
}

/** One arm of the Wait for reply fork: violet title, a clipped description. */
function BranchCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      className="flex w-[240px] flex-col gap-[2px] rounded-[10px] border-b-2 bg-pg-surface px-[12px] py-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.05)]"
      style={{ borderBottomColor: VIOLET.line }}
    >
      <span
        className="truncate text-[13px] leading-[17px] font-semibold"
        style={{ color: VIOLET.fg }}
      >
        {title}
      </span>
      <span className="truncate text-[12px] leading-[16px] text-pg-muted">
        {detail}
      </span>
    </div>
  );
}

const AI_STARTERS: { label: string; prompt: string }[] = [
  {
    label: "Lead nurturing",
    prompt: "When a new lead is created, send a welcome email, wait 2 days, then send a follow-up SMS",
  },
  {
    label: "Form automation",
    prompt: "When a form is submitted, add a tag, assign the contact to a user, and notify the team",
  },
  {
    label: "Email campaigns",
    prompt: "Send a 3-email campaign, 1 week apart, and stop if the contact replies",
  },
];

/**
 * The first thing a brand-new workflow shows: build it by describing it.
 * Everything here is a demo — sending only toasts — because what is under
 * review is the canvas offering this at all, not the builder behind it.
 */
function AiStartCard() {
  const [text, setText] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Building your workflow…");
    setText("");
  };

  return (
    <div className="relative" style={{ width: AI_CARD_W }}>
      {/* The glow: a soft violet wash behind the card, blurred so it reads
          as light rather than as a second, larger card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[28px] rounded-[40px] blur-[24px]"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 45%, color-mix(in oklab, var(--hr-violet-400) 32%, transparent), color-mix(in oklab, var(--brand) 10%, transparent) 60%, transparent 80%)",
        }}
      />
      <form
        ref={formRef}
        onSubmit={submit}
        className="relative flex flex-col items-center gap-[12px] rounded-[16px] bg-pg-surface px-[24px] pt-[24px] pb-[20px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-violet-400)_40%,var(--pg-card-border)),0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]"
      >
        <span
          className="flex size-[36px] items-center justify-center rounded-[10px]"
          style={{ background: VIOLET.bg, color: VIOLET.fg }}
        >
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <div className="flex flex-col items-center gap-[2px] text-center">
          <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">
            What do you want to automate?
          </h2>
          <p className="text-[14px] leading-[20px] text-pg-muted">
            Build workflows for free by chatting with AI
          </p>
        </div>
        <div className="relative w-full rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--hr-violet-500),0_0_0_3px_color-mix(in_oklab,var(--hr-violet-400)_22%,transparent)]">
          <textarea
            aria-label="Describe your workflow"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            rows={3}
            placeholder="After sending a proposal, wait 24 hours then send SMS follow-up…"
            className="block w-full resize-none rounded-[12px] bg-transparent px-[14px] pt-[12px] pb-[52px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
          <div className="absolute right-[8px] bottom-[8px] flex items-center gap-[6px]">
            <button
              type="button"
              aria-label="Dictate"
              title="Dictate"
              className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg hover:text-pg-text"
            >
              <Mic size={16} aria-hidden="true" />
            </button>
            <button
              type="submit"
              aria-label="Send"
              title="Send"
              className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] text-white hover:brightness-[1.06] active:scale-[0.96]"
              style={{ background: "var(--hr-violet-600)" }}
            >
              <ArrowUp size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-[8px]">
          {AI_STARTERS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setText(s.prompt)}
              className="motion-tap flex h-[28px] items-center rounded-full bg-pg-surface px-[12px] text-[13px] leading-[18px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            className="motion-tap flex h-[28px] items-center rounded-full bg-pg-surface px-[12px] text-[13px] leading-[18px] font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg hover:text-pg-text"
          >
            More
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * One node on the run, as an editor sees it.
 *
 * Everything a card does under builder state lives here rather than in the
 * cards, so NodeCard / ToneCard / TriggerCard stay the same drawings the
 * stateless study and Execution logs use:
 *
 *   click        selects it (brand ring) and opens its drawer
 *   hover        the hover toolbar above the top-right corner, and a ⋮⋮
 *                handle at the left — the handle is a promise that the node
 *                moves, which the toolbar's Move keeps
 *   kebab        the node menu; Notes and Delete fork off it
 *
 * Read-only modes keep the ring and lose the rest: you can look at a node
 * in Stats, not change it.
 */
function BuilderNode({
  id,
  editable,
  lit,
  onOpen,
  menu = true,
  children,
}: {
  id: string;
  editable: boolean;
  /** Find-and-replace is highlighting it. */
  lit?: boolean;
  /** Overrides the default action-config drawer — the trigger's is its own. */
  onOpen?: () => void;
  menu?: boolean;
  children: React.ReactNode;
}) {
  const state = useBuilderState();
  const [hover, setHover] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const kebabRef = React.useRef<HTMLButtonElement>(null);
  if (!state) return <Highlight on={Boolean(lit)}>{children}</Highlight>;

  const selected = state.selected === id;
  const beingMoved = state.moving === id;
  const note = state.nodeNotes[id];
  const open = () => {
    if (!editable) return;
    state.setSelected(id);
    if (onOpen) onOpen();
    else state.setDrawer({ kind: "action-config", nodeId: id });
  };

  return (
    <div
      ref={cardRef}
      className={cn("relative", beingMoved && "opacity-50")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Highlight on={Boolean(lit) || selected}>
        <div
          role="button"
          tabIndex={editable ? 0 : -1}
          aria-pressed={selected}
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open();
            }
          }}
          className={cn(
            "rounded-[10px] outline-none focus-visible:shadow-[0_0_0_2px_var(--brand)]",
            editable && "cursor-pointer",
          )}
        >
          {children}
        </div>
      </Highlight>

      {/* A note, when there is one: a small chip on the top-left corner that
          opens it again — the card itself stays the card. */}
      {note ? (
        <button
          type="button"
          aria-label="View note"
          title={note}
          onClick={() => setNoteOpen(true)}
          className="motion-tap absolute -top-[8px] -left-[8px] z-10 flex size-[18px] items-center justify-center rounded-full bg-brand text-brand-fg shadow-[0_0_0_2px_var(--pg-bg)]"
        >
          <MessageSquare size={10} aria-hidden="true" />
        </button>
      ) : null}

      {editable && hover && !state.moving ? (
        <>
          <span
            aria-hidden="true"
            className="absolute top-1/2 -left-[22px] flex h-[24px] w-[16px] -translate-y-1/2 cursor-grab items-center justify-center text-pg-faint"
          >
            <GripVertical size={14} />
          </span>
          {/* The toolbar sits above the top-right corner; the padding below it
              is part of this hover box, so travelling up to it does not drop
              the hover on the way. */}
          <div className="absolute right-0 bottom-full z-20 pb-[6px]">
            <NodeHoverToolbar nodeId={id} className="relative" />
          </div>
        </>
      ) : null}

      {editable && menu ? (
        <button
          ref={kebabRef}
          type="button"
          aria-label="Step options"
          title="Step options"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="motion-tap absolute top-[6px] right-[6px] z-10 flex size-[22px] items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg hover:text-pg-text"
        >
          <EllipsisVertical size={14} aria-hidden="true" />
        </button>
      ) : null}

      {menuOpen ? (
        <NodeMenu
          nodeId={id}
          anchorRef={kebabRef}
          onClose={() => setMenuOpen(false)}
          onDelete={() => {
            setMenuOpen(false);
            setDeleting(true);
          }}
          onNotes={() => {
            setMenuOpen(false);
            setNoteOpen(true);
          }}
        />
      ) : null}
      {noteOpen ? (
        <NodeNotePopover
          nodeId={id}
          anchorRef={cardRef}
          onClose={() => setNoteOpen(false)}
        />
      ) : null}
      {deleting ? (
        <DeleteStepModal nodeId={id} onClose={() => setDeleting(false)} />
      ) : null}
    </div>
  );
}

/**
 * A fork: one column per arm, a bar across the top from the first arm's
 * centre to the last's.
 *
 * Each column draws its own halves of the bar, and the gap between arms is
 * padding inside the columns rather than `gap` between them, so the bar is
 * continuous whatever width each arm turns out to be — the Contact reply arm
 * carries a three-way fork of its own and is far wider than Time out, and a
 * bar inset by half a card at each end would miss both centres.
 */
function Fork({
  arms,
  minArm = CARD_W,
}: {
  arms: { key: string; node: React.ReactNode }[];
  minArm?: number;
}) {
  if (arms.length === 1) {
    return <div className="flex flex-col items-center">{arms[0]!.node}</div>;
  }
  return (
    <div className="flex items-start">
      {arms.map((a, i) => (
        <div
          key={a.key}
          className="relative flex flex-col items-center"
          style={{ paddingInline: BRANCH_GAP / 2, minWidth: minArm + BRANCH_GAP }}
        >
          {i > 0 ? (
            <span aria-hidden="true" className="absolute top-0 left-0 h-px w-1/2 bg-pg-border-strong" />
          ) : null}
          {i < arms.length - 1 ? (
            <span aria-hidden="true" className="absolute top-0 right-0 h-px w-1/2 bg-pg-border-strong" />
          ) : null}
          <RunLine height={18} />
          {a.node}
        </div>
      ))}
    </div>
  );
}

/** The AI decision maker's arms: grey pills, not cards — a route, not a step. */
function BranchPill({ label }: { label: string }) {
  return (
    <span className="flex h-[26px] items-center rounded-full bg-pg-surface px-[12px] text-[12px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
      {label}
    </span>
  );
}

/** A picked trigger, before it has settings: brand-tinted, "• name". */
function TriggerNameCard({ name }: { name: string }) {
  return (
    <div
      className="flex items-center gap-[10px] rounded-[10px] border border-brand bg-brand-soft px-[12px]"
      style={{ width: CARD_W, height: TRIGGER_H }}
    >
      <span
        className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px]"
        style={{ background: "var(--pg-av-green-bg)", color: "var(--pg-av-green-fg)" }}
      >
        <Zap size={16} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-[2px]">
        <span className="truncate text-[13px] leading-[17px] font-semibold text-pg-heading">
          <span aria-hidden="true" className="mr-[4px] text-brand">•</span>
          {name}
        </span>
        <span className="truncate text-[12px] leading-[16px] text-pg-muted">
          Set up this trigger
        </span>
      </div>
    </div>
  );
}

/**
 * The head of a run that starts from a trigger slot: Add new trigger until
 * one is picked, then the picked trigger as a node of its own.
 */
function TriggerSlot({
  state,
  editable,
  lit,
}: {
  state: BuilderState;
  editable: boolean;
  lit: (id: string) => boolean;
}) {
  const name = state.triggerName;
  if (name && !state.deletedNodes.includes("trigger")) {
    return (
      <>
        <BuilderNode
          id="trigger"
          editable={editable}
          lit={lit("trigger")}
          onOpen={() => state.setDrawer({ kind: "trigger-config", trigger: name })}
        >
          <TriggerNameCard name={name} />
        </BuilderNode>
        <Joint editable={editable} after="trigger" />
      </>
    );
  }
  return (
    <>
      <Highlight on={lit("add-trigger")}>
        <AddTriggerCard
          onClick={editable ? () => state.setDrawer({ kind: "add-trigger" }) : undefined}
        />
      </Highlight>
      <Joint editable={editable} after="trigger" />
    </>
  );
}

function BuilderRun({
  state,
  editable,
}: {
  state: BuilderState;
  editable: boolean;
}) {
  const stats = state.mode === "stats";
  const lit = (id: string) => state.highlighted.includes(id);
  const off = (id: string) => state.disabledNodes.includes(id);
  const gone = (id: string) => state.deletedNodes.includes(id);
  const graph = state.current.graph;

  if (graph === "empty") {
    return (
      <div className="relative m-auto flex flex-col items-center py-[40px]">
        <AiStartCard />
        <div
          className="my-[28px] flex w-[240px] items-center gap-[12px] text-[13px] leading-[18px] font-medium text-pg-muted"
          role="separator"
          aria-label="Or"
        >
          <span aria-hidden="true" className="h-px flex-1 bg-pg-border-strong" />
          Or
          <span aria-hidden="true" className="h-px flex-1 bg-pg-border-strong" />
        </div>
        {!stats ? <TriggerSlot state={state} editable={editable} lit={lit} /> : null}
        <EndPill />
      </div>
    );
  }

  if (graph === "whatsapp") {
    /* Deleting a node takes it and the joint under it off the run, so the
       joint above now leads straight to whatever came next. Deleting a
       node that owns a fork (Wait, AI) takes the fork with it — its arms
       have nothing left to branch from. */
    const aiArms = [
      { key: "ai-default", label: "Default branch" },
      { key: "ai-auto", label: "Auto reply" },
      { key: "ai-genuine", label: "Genuine reply" },
    ].map((b) => ({
      key: b.key,
      node: (
        <>
          <BranchPill label={b.label} />
          <Joint editable={editable} after={b.key} />
          {b.key === "ai-genuine" && !gone("notify") ? (
            <>
              <BuilderNode id="notify" editable={editable} lit={lit("notify")}>
                <NodeCard
                  icon={Bell}
                  tone="green"
                  title="Internal notification"
                  detail="Notify the team about a genuine reply"
                  disabled={off("notify")}
                />
              </BuilderNode>
              <Joint editable={editable} after="notify" />
            </>
          ) : null}
          <EndPill />
        </>
      ),
    }));

    const arms: { key: string; node: React.ReactNode }[] = [];
    if (!gone("reply")) {
      arms.push({
        key: "reply",
        node: (
          <>
            <BuilderNode id="reply" editable={editable} lit={lit("reply")}>
              <BranchCard
                title="Contact reply"
                detail="What will happen when a contact replies"
              />
            </BuilderNode>
            <Joint editable={editable} after="reply" />
            {!gone("ai") ? (
              <>
                <BuilderNode id="ai" editable={editable} lit={lit("ai")}>
                  <NodeCard
                    icon={Sparkles}
                    tone="blue"
                    title="AI decision maker"
                    detail="Route by what the contact said"
                    disabled={off("ai")}
                  />
                </BuilderNode>
                <RunLine height={22} />
                <Fork arms={aiArms} minArm={160} />
              </>
            ) : (
              <EndPill />
            )}
          </>
        ),
      });
    }
    if (!gone("timeout")) {
      arms.push({
        key: "timeout",
        node: (
          <>
            <BuilderNode id="timeout" editable={editable} lit={lit("timeout")}>
              <BranchCard title="Time out" detail="What will happen after 2 days" />
            </BuilderNode>
            <Joint editable={editable} after="timeout" />
            <EndPill />
          </>
        ),
      });
    }

    return (
      <div className="relative m-auto flex flex-col items-center py-[40px]">
        {!stats ? <TriggerSlot state={state} editable={editable} lit={lit} /> : null}
        {!gone("email") ? (
          <>
            <BuilderNode id="email" editable={editable} lit={lit("email")}>
              <NodeCard
                icon={Mail}
                tone="green"
                title="Email"
                detail="WhatsApp pricing change, Oct 1"
                disabled={off("email")}
              />
            </BuilderNode>
            <Joint editable={editable} after="email" />
          </>
        ) : null}
        {!gone("wait") ? (
          <>
            {/* The contacts currently waiting — a count on the run, not a
                node, and the way into this step's stats. */}
            <button
              type="button"
              aria-label="37,267 contacts waiting — view stats"
              onClick={() => {
                state.setSelected("wait");
                state.setDrawer({ kind: "action-stats", nodeId: "wait" });
              }}
              className="motion-tap mb-[6px] inline-flex h-[20px] items-center gap-[4px] rounded-full bg-pg-surface px-[8px] text-[12px] leading-none font-medium tabular-nums text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:text-brand hover:shadow-[inset_0_0_0_1px_var(--brand)]"
            >
              <Users size={11} aria-hidden="true" className="text-pg-muted" />
              {(37267).toLocaleString("en-US")}
            </button>
            <BuilderNode id="wait" editable={editable} lit={lit("wait")}>
              <ToneCard
                icon={Clock}
                tone={VIOLET}
                title="Wait for reply"
                detail="Time out after 2 days"
                disabled={off("wait")}
              />
            </BuilderNode>
            {arms.length > 0 ? (
              <>
                <RunLine height={22} />
                {/* The fork. The run above lands inside the bar wherever the
                    arms' widths put it — the arms are not the same width, so
                    it is not the bar's midpoint, and the product does not
                    pretend it is either. */}
                <Fork arms={arms} />
              </>
            ) : (
              <>
                <Joint editable={editable} after="wait" />
                <EndPill />
              </>
            )}
          </>
        ) : (
          <EndPill />
        )}
      </div>
    );
  }

  /* pm-beta — the run this canvas has always drawn, with the trigger's
     footer and the ids find-and-replace aims at. */
  const triggerH = stats ? 0 : TRIGGER_H + TRIGGER_FOOT_H;
  return (
    <div className="relative m-auto flex flex-col items-center py-[40px]">
      <BuilderNode
        id="trigger"
        editable={editable}
        lit={lit("trigger")}
        onOpen={() =>
          state.setDrawer({ kind: "trigger-config", trigger: "Form Submitted" })
        }
      >
        <TriggerCard
          stats={stats}
          editable={editable}
          onStats={() => state.setPanel(state.panel === "stats" ? null : "stats")}
        />
      </BuilderNode>

      {/* The dashed sibling and its elbow, as in the stateless run; the elbow
          is longer by the trigger's footer, so it still meets the run at the
          first `+`. Gone under Stats, which cannot add anything. */}
      {!stats ? (
        <>
          <button
            type="button"
            disabled={!editable}
            onClick={() => state.setDrawer({ kind: "add-trigger" })}
            className={cn(
              "motion-tap absolute flex items-center justify-center rounded-[10px] border border-dashed border-pg-border-strong bg-pg-surface/60 text-[12px] leading-[16px] font-medium text-pg-muted transition-shadow enabled:hover:border-brand enabled:hover:text-brand",
              lit("add-trigger") &&
                "shadow-[0_0_0_2px_var(--brand),0_0_0_6px_var(--brand-soft)]",
            )}
            style={{
              left: `calc(50% + ${CARD_W / 2 + ADD_TRIGGER_GAP}px)`,
              top: 40,
              width: ADD_TRIGGER_W,
              height: TRIGGER_H - 6,
            }}
          >
            <Plus size={13} aria-hidden="true" className="mr-[6px]" />
            Add new trigger
          </button>
          <span
            aria-hidden="true"
            className="absolute rounded-br-[10px] border-r border-b border-dashed border-pg-border-strong"
            style={{
              left: "50%",
              top: 40 + TRIGGER_H - 6,
              width: CARD_W / 2 + ADD_TRIGGER_GAP + ADD_TRIGGER_W / 2,
              height: triggerH - TRIGGER_H + 6 + (editable ? 22 : 34),
            }}
          />
        </>
      ) : null}

      <Joint editable={editable} after="trigger" />
      {!gone("add-tag") ? (
        <>
          <BuilderNode id="add-tag" editable={editable} lit={lit("add-tag")}>
            <NodeCard
              icon={Tag}
              tone="blue"
              title="Add Tag"
              detail="project-manager"
              disabled={off("add-tag")}
            />
          </BuilderNode>
          <Joint editable={editable} after="add-tag" />
        </>
      ) : null}
      <EndPill />
    </div>
  );
}

/** Stats view's two-line caveat, under the keyboard raft. */
function StatsViewNote({ left }: { left: number }) {
  return (
    <div
      className="absolute top-[58px] z-10 flex max-w-[300px] flex-col gap-[4px] rounded-[9px] bg-pg-surface px-[12px] py-[10px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-card-border),0_2px_8px_-2px_rgba(15,23,42,0.10)]"
      style={{ left }}
    >
      <span className="flex items-start gap-[6px]">
        <Info size={14} aria-hidden="true" className="mt-[2px] shrink-0 text-brand" />
        <span>
          Workflow is not editable in{" "}
          <strong className="font-semibold text-pg-heading">Stats view</strong>.
        </span>
      </span>
      <span className="pl-[20px] text-pg-muted">
        <strong className="font-semibold text-pg-text">Note:</strong> Stats are
        only available for the last 30 days.
      </span>
    </div>
  );
}

/** The banner a past version wears, centred at the top of the canvas. */
function VersionViewPill() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[14px] z-10 flex justify-center">
      <span
        role="status"
        className="inline-flex h-[30px] items-center gap-[6px] rounded-full px-[12px] text-[13px] leading-[18px] font-medium"
        style={{
          background: "var(--pg-warn-bg)",
          color: "var(--pg-warn-fg)",
          boxShadow: "inset 0 0 0 1px var(--pg-warn-border)",
        }}
      >
        <Eye size={14} aria-hidden="true" style={{ color: "var(--pg-warn-icon)" }} />
        This version is in view only mode
      </span>
    </div>
  );
}

/* ── advanced ───────────────────────────────────────────────────────────── */

type AdvancedNode = "trigger" | "action";

interface Point {
  x: number;
  y: number;
}

/** Tile edge, and the half of it every centre calculation needs. */
const TILE = 60;
const HALF_TILE = TILE / 2;
/** How far short of a tile's centre a connector stops. */
const STUB = 36;
/** Where the `+` tile sits relative to the node it hangs off. */
const PLUS_OFFSET = 132;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * The Advanced builder.
 *
 * The whole claim of the Advanced canvas is that a node goes wherever you put
 * it, so the nodes here really drag. A canvas that only LOOKS free would test
 * the wrong thing: half the chrome question for this variant is what happens
 * when an operator drags a node under the page header, and that is not
 * something a static mock can show. Drag one to the top edge and you can see
 * whether the variant's header is a lid or a wall.
 *
 * Pointer events rather than HTML5 drag-and-drop: the nav's row reordering
 * uses dragstart/drop because it moves an item between two trees, and this
 * moves a box inside one box. Pointer capture keeps the gesture alive when the
 * pointer outruns the tile, which is the failure mode people actually hit.
 */
function AdvancedCanvas({ overlays }: { overlays: CanvasOverlays }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  /*
   * Null until measured.
   *
   * Centring the pair needs the frame's real size, and the frame's size is a
   * page-header question — it is different in every variant, which is the
   * point of the study. So the layout is computed from the box we were handed
   * on mount rather than from constants that would only be right in one
   * variant. One frame of nothing is the cost; a pair of nodes sitting off
   * centre in three of four variants was the alternative.
   */
  const [pos, setPos] = React.useState<Record<AdvancedNode, Point> | null>(null);
  const [dragging, setDragging] = React.useState<AdvancedNode | null>(null);
  const grab = React.useRef<{
    node: AdvancedNode;
    pointerId: number;
    dx: number;
    dy: number;
  } | null>(null);

  /* Read before the measuring effect: under the WhatsApp flow the pair's
     layer is hidden and measures as 0×0, so the pair re-centres when the
     switcher brings a graph back that draws it. */
  const state = useBuilderState();
  const flow = state?.current.graph === "whatsapp";

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || flow) return;
    const box = el.getBoundingClientRect();
    /* Left of centre, because the `+` tile hangs off the right end and the
       pair plus its tail is what should look centred, not the pair alone. */
    const cx = box.width / 2 - PLUS_OFFSET / 2;
    const cy = box.height / 2 - HALF_TILE - 10;
    setPos({
      trigger: { x: cx - 150, y: cy },
      action: { x: cx + 30, y: cy },
    });
  }, [flow]);

  function onPointerDown(node: AdvancedNode, e: React.PointerEvent) {
    const el = wrapRef.current;
    if (!el || !pos) return;
    const box = el.getBoundingClientRect();
    grab.current = {
      node,
      pointerId: e.pointerId,
      dx: e.clientX - box.left - pos[node].x,
      dy: e.clientY - box.top - pos[node].y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(node);
  }

  function onPointerMove(e: React.PointerEvent) {
    const held = grab.current;
    const el = wrapRef.current;
    if (!held || !el || held.pointerId !== e.pointerId) return;
    const box = el.getBoundingClientRect();
    setPos((prev) =>
      prev
        ? {
            ...prev,
            [held.node]: {
              /* Clamped to the frame so a node cannot be dragged out of
                 existence — the bottom margin leaves room for the caption,
                 which is part of the node even though it is not in the tile. */
              x: clamp(e.clientX - box.left - held.dx, 8, box.width - TILE - 8),
              y: clamp(e.clientY - box.top - held.dy, 8, box.height - TILE - 46),
            },
          }
        : prev,
    );
  }

  function endDrag(e: React.PointerEvent) {
    const held = grab.current;
    if (!held || held.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    grab.current = null;
    setDragging(null);
  }

  const plus = pos
    ? { x: pos.action.x + PLUS_OFFSET, y: pos.action.y }
    : null;

  /*
   * Sep 29: builder state, when workflow-detail provides it — the same rail,
   * panel host and drawer host the Standard canvas has, so switching the
   * "Standard builder ▾" select keeps the operator's tools where they were.
   * The WhatsApp graph gets its real Advanced drawing; the other graphs keep
   * the draggable pair below, which is still the honest demo of this canvas.
   */
  const own = overlays === "canvas";
  const leftInset =
    (state && own ? RAIL_W : 0) +
    (state && panelHasCard(state.panel) ? PANEL_GAP + PANEL_W : 0) +
    14;
  useMoveEscape(state);

  return (
    <BuilderLayout state={state}>
    <CanvasFrame flush={overlays === "page"} dark={state?.darkCanvas}>
      {state && own ? <BuilderRail /> : null}
      {state ? <RailPanelHost /> : null}
      {state && flow ? (
        <div
          className="absolute inset-0 flex overflow-auto"
          style={{ paddingLeft: leftInset - 14, transition: "padding-left 180ms ease" }}
        >
          <div
            className="m-auto"
            style={{
              transform: `scale(${state.zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 150ms ease",
            }}
          >
            <AdvancedWhatsAppFlow state={state} />
          </div>
        </div>
      ) : null}
      <div
        ref={wrapRef}
        className={cn("absolute inset-0", flow && "hidden")}
      >
        {pos && plus ? (
          <>
            {/* Connectors first, so a tile dragged over one covers it. */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <Connector
                from={centreOf(pos.trigger)}
                to={centreOf(pos.action)}
              />
              <Connector from={centreOf(pos.action)} to={centreOf(plus)} />
            </svg>

            <AdvancedTile
              icon={ClipboardList}
              tone="green"
              caption="Form Submitted"
              at={pos.trigger}
              active={dragging === "trigger"}
              onPointerDown={(e) => onPointerDown("trigger", e)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            />
            <AdvancedTile
              icon={Tag}
              tone="blue"
              caption="Add Tag"
              sub="(Default Path)"
              at={pos.action}
              active={dragging === "action"}
              onPointerDown={(e) => onPointerDown("action", e)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            />

            {/* The tail. Not draggable: it is a place to add the next node,
                and it belongs to the end of the run rather than to the
                canvas — so it follows whatever the last node does. */}
            <button
              type="button"
              aria-label="Add step"
              title="Add step"
              className="motion-tap absolute flex items-center justify-center rounded-[14px] border border-dashed border-pg-border-strong bg-pg-surface/70 text-pg-muted hover:border-brand hover:text-brand active:scale-[0.96]"
              style={{ left: plus.x, top: plus.y, width: TILE, height: TILE }}
            >
              <Plus size={20} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {/* One raft here, not three: the Advanced canvas has no pan tool and no
          percentage readout, and pretending otherwise would blur the one
          honest difference between the two builders' control sets. It is also
          the whole of this variant's furniture, which is why `page` leaves the
          free canvas looking most like the whiteboard the style came from. */}
      {overlays === "canvas" ? (
        <ControlRaft
          className="absolute bottom-[14px] left-[14px] z-10"
          style={state ? { left: leftInset } : undefined}
        >
          <CanvasButton icon={MousePointer2} label="Select" />
          <CanvasButton
            icon={Maximize}
            label="Fit to screen"
            onClick={state ? () => state.setZoom(fitZoom(state)) : undefined}
          />
          <CanvasButton
            icon={Minus}
            label="Zoom out"
            onClick={state ? () => state.setZoom(state.zoom - 10) : undefined}
          />
          <CanvasButton
            icon={Plus}
            label="Zoom in"
            onClick={state ? () => state.setZoom(state.zoom + 10) : undefined}
          />
          <CanvasButton
            icon={AlignCenterHorizontal}
            label="Auto layout"
            onClick={state ? () => showToast("Layout tidied") : undefined}
          />
        </ControlRaft>
      ) : null}
    </CanvasFrame>
    </BuilderLayout>
  );
}

/* ── advanced, under builder state ──────────────────────────────────────── */

/** The Advanced WhatsApp flow's tile — smaller than the free canvas's. */
const FLOW_TILE = 48;
/** The flow's drawing box; item positions below are inside it. */
const FLOW_W = 900;
const FLOW_H = 360;

type FlowItem =
  | {
      kind: "tile";
      id: string;
      x: number;
      y: number;
      icon: LucideIcon;
      tone: { bg: string; fg: string };
      caption: string;
      sub?: string;
      count?: number;
    }
  | { kind: "pill"; id: string; x: number; y: number; label: string; add?: boolean };

/*
 * Positions are the centre of each item. Left to right: Email, Wait for
 * reply, its two arms, the AI decision maker off the Wait arm, and the AI's
 * three arms. Laid out by hand, because the point of the Advanced canvas is
 * that the operator lays it out — an auto-layout here would be answering
 * the question the Auto layout button asks.
 */
const FLOW_ITEMS: FlowItem[] = [
  { kind: "tile", id: "email", x: 40, y: 180, icon: Mail, tone: { bg: "var(--pg-av-green-bg)", fg: "var(--pg-av-green-fg)" }, caption: "Email", sub: "(Default path)" },
  { kind: "tile", id: "wait", x: 210, y: 180, icon: Clock, tone: VIOLET, caption: "Wait for reply", count: 37268 },
  { kind: "pill", id: "reply", x: 390, y: 110, label: "Wait" },
  { kind: "pill", id: "timeout", x: 390, y: 250, label: "Timeout", add: true },
  { kind: "tile", id: "ai", x: 560, y: 110, icon: Sparkles, tone: { bg: "var(--pg-av-blue-bg)", fg: "var(--pg-av-blue-fg)" }, caption: "AI decision maker" },
  { kind: "pill", id: "ai-default", x: 770, y: 30, label: "Default branch", add: true },
  { kind: "pill", id: "ai-auto", x: 770, y: 110, label: "Auto reply", add: true },
  { kind: "pill", id: "ai-genuine", x: 770, y: 190, label: "Genuine reply", add: true },
];

const FLOW_EDGES: [string, string][] = [
  ["email", "wait"],
  ["wait", "reply"],
  ["wait", "timeout"],
  ["reply", "ai"],
  ["ai", "ai-default"],
  ["ai", "ai-auto"],
  ["ai", "ai-genuine"],
];

/** How far either side of its centre an item's connector ports sit. */
function flowHalf(item: FlowItem) {
  return item.kind === "tile" ? FLOW_TILE / 2 : 44;
}

/**
 * The WhatsApp workflow as the Advanced builder draws it: left to right,
 * small square tiles with captions, dark slate pills for branches, and
 * curved connectors — the one graph here with enough shape to show why an
 * operator would pick this canvas over the Standard run.
 */
function AdvancedWhatsAppFlow({ state }: { state: BuilderState }) {
  const byId = new Map(FLOW_ITEMS.map((i) => [i.id, i]));
  const items = FLOW_ITEMS.filter((i) => !state.deletedNodes.includes(i.id));
  const edges = FLOW_EDGES.filter(
    ([a, b]) => !state.deletedNodes.includes(a) && !state.deletedNodes.includes(b),
  );

  return (
    <div className="relative my-[40px]" style={{ width: FLOW_W, height: FLOW_H }}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        {edges.map(([a, b]) => {
          const from = byId.get(a)!;
          const to = byId.get(b)!;
          const x1 = from.x + flowHalf(from) + 4;
          const x2 = to.x - flowHalf(to) - 4;
          const mid = (x2 - x1) / 2;
          return (
            <g key={`${a}-${b}`} stroke="var(--pg-border-strong)" fill="var(--pg-border-strong)">
              <path
                d={`M ${x1} ${from.y} C ${x1 + mid} ${from.y}, ${x2 - mid} ${to.y}, ${x2} ${to.y}`}
                fill="none"
                strokeWidth={1.5}
              />
              <circle cx={x1} cy={from.y} r={2.5} />
              <polygon
                points={`${x2},${to.y} ${x2 - 7},${to.y - 3.5} ${x2 - 7},${to.y + 3.5}`}
                strokeWidth={0}
              />
            </g>
          );
        })}
      </svg>

      {items.map((item) =>
        item.kind === "tile" ? (
          <FlowTile key={item.id} item={item} state={state} />
        ) : (
          <div
            key={item.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-[4px]"
            style={{ left: item.x, top: item.y }}
          >
            <span className="flex h-[24px] items-center rounded-full bg-[#334155] px-[10px] text-[12px] leading-none font-medium whitespace-nowrap text-white">
              {item.label}
            </span>
            {item.add ? (
              <button
                type="button"
                aria-label={`Add action after ${item.label}`}
                title="Add action"
                onClick={() => state.setDrawer({ kind: "add-action", after: item.id })}
                className="motion-tap absolute left-full ml-[4px] flex size-[22px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-surface hover:text-brand"
              >
                <SquarePlus size={15} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ),
      )}
    </div>
  );
}

function FlowTile({
  item,
  state,
}: {
  item: Extract<FlowItem, { kind: "tile" }>;
  state: BuilderState;
}) {
  const Icon = item.icon;
  const selected = state.selected === item.id;
  const disabled = state.disabledNodes.includes(item.id);
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: item.x - FLOW_TILE / 2,
        top: item.y - FLOW_TILE / 2,
        width: FLOW_TILE,
      }}
    >
      {item.count !== undefined ? (
        <button
          type="button"
          aria-label={`${item.count.toLocaleString("en-US")} contacts waiting — view stats`}
          onClick={() => {
            state.setSelected(item.id);
            state.setDrawer({ kind: "action-stats", nodeId: item.id });
          }}
          className="motion-tap absolute -top-[20px] left-1/2 inline-flex h-[16px] -translate-x-1/2 items-center rounded-full bg-pg-surface px-[6px] text-[10px] leading-none font-medium tabular-nums text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:text-brand"
        >
          {item.count.toLocaleString("en-US")}
        </button>
      ) : null}
      <button
        type="button"
        aria-label={item.caption}
        aria-pressed={selected}
        onClick={() => {
          state.setSelected(item.id);
          state.setDrawer({ kind: "action-config", nodeId: item.id });
        }}
        className={cn(
          "motion-tap flex items-center justify-center rounded-[12px]",
          disabled ? "bg-pg" : "bg-pg-surface",
          selected
            ? "shadow-[0_0_0_2px_var(--brand),0_0_0_6px_var(--brand-soft)]"
            : "shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.06)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_4px_10px_-4px_rgba(15,23,42,0.16)]",
        )}
        style={{ width: FLOW_TILE, height: FLOW_TILE }}
      >
        <span
          className={cn(
            "flex size-[28px] items-center justify-center rounded-[8px]",
            disabled && "opacity-60 grayscale",
          )}
          style={{ background: item.tone.bg, color: item.tone.fg }}
        >
          <Icon size={15} aria-hidden="true" />
        </span>
      </button>
      <div className="pointer-events-none absolute top-[54px] left-1/2 w-[140px] -translate-x-1/2 text-center">
        <div className="truncate text-[12px] leading-[16px] font-medium text-pg-text">
          {disabled ? `${item.caption} (Disabled)` : item.caption}
        </div>
        {item.sub ? (
          <div className="truncate text-[11px] leading-[15px] text-pg-faint">
            {item.sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function centreOf(p: Point): Point {
  return { x: p.x + HALF_TILE, y: p.y + HALF_TILE };
}

/**
 * A straight run between two tiles: dot, line, dot, arrowhead.
 *
 * The arrowhead is a drawn polygon rather than an SVG `marker`, because a
 * marker needs an id and this component is rendered more than once per canvas
 * — two markers with the same id in one document is a bug that only shows up
 * as a missing arrow on whichever one lost.
 */
function Connector({ from, to }: { from: Point; to: Point }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const a = { x: from.x + ux * STUB, y: from.y + uy * STUB };
  const b = { x: to.x - ux * STUB, y: to.y - uy * STUB };
  /* Perpendicular, for the two back corners of the head. */
  const px = -uy;
  const py = ux;
  const head = [
    `${b.x},${b.y}`,
    `${b.x - ux * 9 + px * 4.5},${b.y - uy * 9 + py * 4.5}`,
    `${b.x - ux * 9 - px * 4.5},${b.y - uy * 9 - py * 4.5}`,
  ].join(" ");

  return (
    <g stroke="var(--pg-border-strong)" fill="var(--pg-border-strong)">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={1.5} />
      <circle cx={a.x} cy={a.y} r={3} />
      <circle cx={b.x} cy={b.y} r={3} />
      <polygon points={head} strokeWidth={0} />
    </g>
  );
}

function AdvancedTile({
  icon: Icon,
  tone,
  caption,
  sub,
  at,
  active,
  ...pointer
}: {
  icon: LucideIcon;
  tone: "green" | "blue";
  caption: string;
  sub?: string;
  at: Point;
  active: boolean;
} & Pick<
  React.ComponentProps<"div">,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel"
>) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: at.x, top: at.y, width: TILE }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`${caption} — drag to move`}
        className={cn(
          "flex items-center justify-center rounded-[14px] bg-pg-surface select-none",
          /* No motion-tap while held: a transition on a dragged element lags
             the pointer, which reads as the canvas being slow rather than as
             the node being eased. */
          active
            ? "cursor-grabbing shadow-[inset_0_0_0_1px_var(--brand),0_8px_18px_-6px_rgba(15,23,42,0.28)]"
            : "motion-tap cursor-grab shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.06)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_4px_10px_-4px_rgba(15,23,42,0.16)]",
        )}
        style={{ width: TILE, height: TILE, touchAction: "none" }}
        {...pointer}
      >
        <span
          className="flex size-[32px] items-center justify-center rounded-[9px]"
          style={{
            background:
              tone === "green"
                ? "var(--pg-av-green-bg)"
                : "var(--pg-av-blue-bg)",
            color:
              tone === "green"
                ? "var(--pg-av-green-fg)"
                : "var(--pg-av-blue-fg)",
          }}
        >
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      {/* The caption is wider than the tile and centred on it, so it is taken
          out of the layout flow entirely — otherwise a long label would widen
          the node and move the point the connector aims at. */}
      <div className="pointer-events-none absolute top-[66px] left-1/2 w-[150px] -translate-x-1/2 text-center">
        <div className="truncate text-[12px] leading-[16px] font-medium text-pg-text">
          {caption}
        </div>
        {sub ? (
          <div className="truncate text-[11px] leading-[15px] text-pg-faint">
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── abstract ───────────────────────────────────────────────────────────── */

/**
 * The sketch the prototype drew before either real canvas existed.
 *
 * Kept, and kept unchanged in shape, because the builder chrome decisions
 * taken before Sep 22 were taken against THIS. If it were quietly replaced by
 * the real canvas, every earlier judgement would become unreproducible — you
 * would have the conclusion and no way to see what it was looking at. It is an
 * exhibit, not a proposal: nothing here claims to be what the product draws.
 *
 * It is also the only one of the three with a right-hand inspector, which is
 * why it is still useful beyond the archive — it is the cheapest way to see
 * what a variant's chrome does when the canvas is not the full width.
 */
function SketchCanvas({ overlays }: { overlays: CanvasOverlays }) {
  const own = overlays === "canvas";
  return (
    <CanvasFrame flush={overlays === "page"}>
      {/* `pr` for the inspector, the same way the Standard canvas pads for its
          rail: the run is centred on the space the operator can see, not on
          the frame. It is a small thing that decides whether the sketch reads
          as a canvas with a panel beside it or as a canvas pushed off centre. */}
      <div className="absolute inset-0 flex items-center justify-center pr-[210px]">
        <div className="flex flex-col items-center gap-[10px]">
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className="h-[22px] w-px bg-pg-border-strong"
                />
              ) : null}
              <div className="flex h-[54px] w-[218px] items-center gap-[10px] rounded-[10px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
                <span className="size-[26px] shrink-0 rounded-[7px] bg-pg-border" />
                <span className="flex min-w-0 flex-col gap-[5px]">
                  <span className="block h-[7px] w-[104px] rounded-full bg-pg-border-strong" />
                  <span className="block h-[6px] w-[68px] rounded-full bg-pg-border" />
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Floating tool rail — a raft on the canvas, not a flush strip, which
          is the detail that separates the sketch from the Standard canvas it
          was standing in for. Under `page` the palette island IS this raft,
          turned on its side and moved to the bottom. */}
      {own ? (
        <div className="absolute top-1/2 left-[14px] z-10 flex -translate-y-1/2 flex-col gap-[6px] rounded-[10px] bg-pg-surface p-[6px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_2px_8px_-2px_rgba(15,23,42,0.10)]">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="size-[22px] rounded-[6px] bg-pg-border" />
          ))}
        </div>
      ) : null}

      {/* Inspector. Blocked out rather than filled in, deliberately: a canvas
          study that drew a plausible settings form would collect feedback on
          the form. */}
      <div className="absolute inset-y-[14px] right-[14px] z-10 w-[196px] rounded-[10px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_2px_8px_-2px_rgba(15,23,42,0.10)]">
        <span className="block h-[8px] w-[92px] rounded-full bg-pg-border-strong" />
        <span className="mt-[14px] block h-px w-full bg-pg-border" />
        {[0, 1, 2].map((i) => (
          <span key={i} className="mt-[14px] block">
            <span className="block h-[6px] w-[56px] rounded-full bg-pg-border" />
            <span className="mt-[6px] block h-[28px] w-full rounded-[7px] bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]" />
          </span>
        ))}
      </div>

      {/* Zoom cluster, bottom centre — the sketch's own guess at where canvas
          controls go, and wrong in a useful way: both real builders put them
          bottom LEFT, and the difference is visible the moment the two are
          switched between. */}
      {own ? (
        <ControlRaft className="absolute bottom-[14px] left-1/2 z-10 -translate-x-1/2">
          <CanvasButton icon={Minus} label="Zoom out" />
          <span className="px-[4px] text-[12px] leading-[normal] font-medium tabular-nums text-pg-text">
            100%
          </span>
          <CanvasButton icon={Plus} label="Zoom in" />
          <span aria-hidden="true" className="mx-[2px] h-[18px] w-px bg-pg-border" />
          <CanvasButton icon={Maximize} label="Fit to screen" />
        </ControlRaft>
      ) : null}
    </CanvasFrame>
  );
}

/* ── contact path (read-only) ───────────────────────────────────────────── */

/** Which step a run reached last — the one the "Exited" tab sits on. */
export type PathStep = "trigger" | "add-tag";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

/**
 * One run of the Standard workflow, drawn for Execution logs.
 *
 * The same two cards and the same run as StandardCanvas, because the question
 * this view answers — "where did THIS contact go?" — is only legible against
 * the canvas the operator built. A path drawn in some other shape would ask
 * them to map it back onto the builder in their head.
 *
 * Read-only on purpose: no rail, no `+` on the run, no Add, no minimap. What
 * is left is the steps the contact touched, ringed in green, with a tab above
 * the first ("Entered") and the last ("Exited"). The run between steps the
 * contact actually walked is dashed green; the rest of the run to END stays
 * the ordinary grey line, so the eye can tell travelled from untravelled.
 *
 * Zoom is a CSS transform on the run, in 10% steps. Fit measures the run's
 * natural size against the frame and picks the largest step that fits, capped
 * at 100% — a two-card path blown up to fill a wide monitor reads as a bug.
 */
export function ContactPathCanvas({
  exitedAt = "add-tag",
  topLeft,
  topRight,
  className,
}: {
  exitedAt?: PathStep;
  /** The run's info block. */
  topLeft?: React.ReactNode;
  /** A way back — the canvas draws none of its own. */
  topRight?: React.ReactNode;
  className?: string;
}) {
  const [zoom, setZoom] = React.useState(1);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const runRef = React.useRef<HTMLDivElement>(null);

  const step = (d: number) =>
    setZoom((z) =>
      Math.round(clamp(z + d, ZOOM_MIN, ZOOM_MAX) * 10) / 10,
    );

  const fit = () => {
    const frame = frameRef.current;
    const run = runRef.current;
    if (!frame || !run) return;
    const scale = Math.min(
      1,
      (frame.clientWidth - 80) / run.offsetWidth,
      (frame.clientHeight - 160) / run.offsetHeight,
    );
    setZoom(clamp(Math.floor(scale * 10) / 10, ZOOM_MIN, 1));
  };

  const reachedTag = exitedAt === "add-tag";

  return (
    <CanvasFrame className={className}>
      <div
        ref={frameRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div
          ref={runRef}
          className="flex flex-col items-center py-[40px] transition-transform duration-150"
          style={{ transform: `scale(${zoom})` }}
        >
          <PathStepFrame
            tab={
              <>
                <LogIn size={12} aria-hidden="true" />
                Entered
                {!reachedTag ? " · Exited" : null}
              </>
            }
          >
            <NodeCard
              icon={ClipboardList}
              tone="green"
              title="Form Submitted"
              detail={
                <>
                  Form is is any of{" "}
                  <span className="text-pg-text">“Project Manage…”</span>
                </>
              }
            />
          </PathStepFrame>

          {reachedTag ? (
            <>
              <span
                aria-hidden="true"
                className="border-l-[1.5px] border-dashed border-[var(--hr-success-500)]"
                style={{ height: 56 }}
              />
              <PathStepFrame
                tab={
                  <>
                    <LogOut size={12} aria-hidden="true" />
                    Exited
                  </>
                }
              >
                <NodeCard icon={Tag} tone="blue" title="Add Tag" detail="project-manager" />
              </PathStepFrame>
            </>
          ) : (
            <>
              <RunLine height={44} />
              <NodeCard icon={Tag} tone="blue" title="Add Tag" detail="project-manager" />
            </>
          )}

          <RunLine height={44} />
          <span className="flex h-[26px] items-center rounded-full bg-[var(--pg-border)] px-[14px] text-[11px] leading-[normal] font-semibold tracking-[0.6px] text-pg-muted">
            END
          </span>
        </div>
      </div>

      {topLeft ? (
        <div className="absolute top-[14px] left-[14px] z-10 max-w-[calc(100%-200px)]">
          {topLeft}
        </div>
      ) : null}
      {topRight ? (
        <div className="absolute top-[14px] right-[14px] z-10">{topRight}</div>
      ) : null}

      <div className="absolute bottom-[14px] left-[14px] z-10 flex items-center gap-[8px]">
        <ControlRaft>
          <CanvasButton icon={Plus} label="Zoom in" onClick={() => step(ZOOM_STEP)} />
          <span className="min-w-[40px] px-[4px] text-center text-[12px] leading-[normal] font-medium tabular-nums text-pg-text">
            {Math.round(zoom * 100)}%
          </span>
          <CanvasButton icon={Minus} label="Zoom out" onClick={() => step(-ZOOM_STEP)} />
        </ControlRaft>
        <ControlRaft>
          <CanvasButton icon={Maximize} label="Fit to screen" onClick={fit} />
        </ControlRaft>
      </div>
    </CanvasFrame>
  );
}

/**
 * The green ring a travelled step wears, and the tab that names it.
 *
 * The tab sits ABOVE the ring rather than inside it so the card itself is
 * drawn exactly as the builder draws it — the highlight is something laid on
 * the step, not a different step.
 */
function PathStepFrame({
  tab,
  children,
}: {
  tab: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="mb-[6px] inline-flex h-[22px] items-center gap-[4px] rounded-full bg-pg-surface px-[9px] text-[12px] leading-none font-medium text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-success-500)_45%,transparent)]">
        {tab}
      </span>
      <div className="rounded-[14px] bg-[color-mix(in_oklab,var(--hr-success-500)_10%,transparent)] p-[4px] shadow-[0_0_0_1px_color-mix(in_oklab,var(--hr-success-500)_40%,transparent)]">
        {children}
      </div>
    </div>
  );
}
