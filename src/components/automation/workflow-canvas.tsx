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
}) {
  return (
    <div
      className={cn(
        "relative h-full min-h-0 w-full overflow-hidden bg-pg",
        flush ? "" : "rounded-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
        className,
      )}
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
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
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
}: {
  icon: LucideIcon;
  tone: "green" | "blue";
  title: string;
  detail: React.ReactNode;
  menu?: boolean;
}) {
  return (
    <div
      className="relative flex items-center gap-[10px] rounded-[10px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.05)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_2px_8px_-2px_rgba(15,23,42,0.10)]"
      style={{ width: CARD_W, height: TRIGGER_H }}
    >
      <span
        className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px]"
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
        <span className="truncate text-[13px] leading-[17px] font-semibold text-pg-heading">
          {title}
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
function RunPlus() {
  return (
    <button
      type="button"
      aria-label="Add step"
      title="Add step"
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
  return (
    <CanvasFrame flush={overlays === "page"}>
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
          under `page`, the way every other menu on this canvas is reached. */}
      {own ? (
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
          room for something that is no longer there. */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center overflow-auto",
          own && "pl-[42px]",
        )}
      >
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
      </div>

      {/* Top corners. Left is help, right is the one thing you can add to the
          canvas from outside a node — the same left-is-free / right-is-
          commitment split the page header above obeys. The help raft goes
          under `page`: the identity island lands on that exact spot, and the
          shortcut hints are printed above the palette's tools there anyway. */}
      {own ? (
        <ControlRaft className="absolute top-[14px] left-[56px] z-10">
          <CanvasButton icon={Keyboard} label="Keyboard shortcuts" />
        </ControlRaft>
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
          than a special case. */}
      {own ? (
        <button
          type="button"
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
        <div className="absolute bottom-[14px] left-[56px] z-10 flex items-center gap-[8px]">
          <ControlRaft>
            <CanvasButton icon={Hand} label="Pan canvas" />
          </ControlRaft>
          <ControlRaft>
            <CanvasButton icon={Plus} label="Zoom in" />
            <span className="px-[4px] text-[12px] leading-[normal] font-medium tabular-nums text-pg-text">
              100%
            </span>
            <CanvasButton icon={Minus} label="Zoom out" />
          </ControlRaft>
          <ControlRaft>
            <CanvasButton icon={Maximize} label="Fit to screen" />
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

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    /* Left of centre, because the `+` tile hangs off the right end and the
       pair plus its tail is what should look centred, not the pair alone. */
    const cx = box.width / 2 - PLUS_OFFSET / 2;
    const cy = box.height / 2 - HALF_TILE - 10;
    setPos({
      trigger: { x: cx - 150, y: cy },
      action: { x: cx + 30, y: cy },
    });
  }, []);

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

  return (
    <CanvasFrame flush={overlays === "page"}>
      <div ref={wrapRef} className="absolute inset-0">
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
        <ControlRaft className="absolute bottom-[14px] left-[14px] z-10">
          <CanvasButton icon={MousePointer2} label="Select" />
          <CanvasButton icon={Maximize} label="Fit to screen" />
          <CanvasButton icon={Minus} label="Zoom out" />
          <CanvasButton icon={Plus} label="Zoom in" />
          <CanvasButton icon={AlignCenterHorizontal} label="Tidy layout" />
        </ControlRaft>
      ) : null}
    </CanvasFrame>
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
