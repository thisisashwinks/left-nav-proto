"use client";

import * as React from "react";
import {
  ChartPie,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  History,
  MessageSquare,
  Moon,
  Sun,
  Search,
  Sparkles,
  SquareArrowOutUpRight,
  StickyNote,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  STICKY_TINTS,
  useBuilderState,
  type RailPanelId,
  type RailPanelProps,
} from "./builder-state";
import { WorkflowSwitcherPanel, VersionHistoryPanel } from "./builder-panels-history";
import { FindReplacePanel, AiBuilderPanel } from "./builder-panels-tools";
import { RailTooltip } from "@/components/nav/rail-tooltip";
import { cn } from "@/lib/utils";

/**
 * The Standard builder's left rail, and everything it opens.
 *
 * Until Sep 29 the rail was eight step categories — a palette of things you
 * could drop on the run. The shipped builder moved those behind the `+` on the
 * run a while ago, and what the rail carries now is the WORKFLOW's tools:
 * notes, errors, stats, sticky notes, the switcher, find and replace, version
 * history, and AI. Drawing the old palette would have left the review judging
 * a rail that no longer exists.
 *
 * Every glyph here is a toggle over one piece of builder state (`panel`), so
 * the rail, the floating card beside it, and the canvas's own overlays (stats
 * mode, the sticky palette) cannot disagree about which one is open. Only
 * rendered inside a BuilderStateProvider — StandardCanvas keeps its old rail
 * when there is none.
 */

/** The rail's own width — the canvas pads the run by it. */
export const RAIL_W = 42;
/** The floating panel card, and the gap either side of it. */
export const PANEL_W = 300;
export const PANEL_GAP = 12;

/** The card's shadow — HighRise shadow/lg, under the canvas's hairline. */
const PANEL_SHADOW =
  "shadow-[inset_0_0_0_1px_var(--pg-card-border),0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]";

/* ── the rail ───────────────────────────────────────────────────────────── */

function RailGlyph({
  icon: Icon,
  label,
  active,
  onClick,
  className,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <RailTooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={onClick ? Boolean(active) : undefined}
        onClick={onClick}
        className={cn(
          "motion-tap flex size-[30px] shrink-0 items-center justify-center rounded-[7px] active:scale-[0.94]",
          /* The active chip is a surface lifted by a ring rather than a fill:
             the rail is already the surface colour, so a tinted fill would be
             the loudest thing on the canvas for what is only "this is open". */
          active
            ? "bg-pg-surface text-brand shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_45%,transparent),0_1px_3px_0_rgba(16,24,40,0.10)]"
            : "text-pg-muted hover:bg-pg hover:text-pg-text",
          className,
        )}
      >
        <Icon size={15} aria-hidden="true" />
      </button>
    </RailTooltip>
  );
}

export function BuilderRail() {
  const state = useBuilderState();
  if (!state) return null;
  const { panel, setPanel, current } = state;
  const toggle = (id: RailPanelId) => setPanel(panel === id ? null : id);

  /* A brand-new workflow has no trigger, which is an error the product
     counts — so the Errors glyph stops being a reassuring check. */
  const hasError = current.graph === "empty";

  const tools: { id: RailPanelId; icon: LucideIcon; label: string; className?: string }[] = [
    { id: "notes", icon: MessageSquare, label: "Notes" },
    hasError
      ? { id: "errors", icon: CircleAlert, label: "Errors · 1 error", className: "text-[var(--pg-warn-icon)] hover:text-[var(--pg-warn-icon)]" }
      : { id: "errors", icon: CircleCheck, label: "Errors" },
    { id: "stats", icon: ChartPie, label: "Stats" },
    { id: "sticky", icon: StickyNote, label: "Sticky notes" },
    { id: "switcher", icon: SquareArrowOutUpRight, label: "Workflow switcher" },
    { id: "find", icon: Search, label: "Find and replace" },
    { id: "versions", icon: History, label: "Version history" },
  ];

  return (
    /* A <nav> so RailTooltip anchors its pill to the rail's edge rather than
       to each glyph — the same reading the app's own collapsed rail has. */
    <nav
      aria-label="Builder tools"
      className="absolute inset-y-0 left-0 z-10 flex flex-col items-center gap-[2px] border-r border-pg-border bg-pg-surface py-[10px]"
      style={{ width: RAIL_W }}
    >
      {tools.map((t) => (
        <RailGlyph
          key={t.id}
          icon={t.icon}
          label={t.label}
          active={panel === t.id}
          onClick={() => toggle(t.id)}
          className={panel === t.id ? undefined : t.className}
        />
      ))}
      <span className="mt-auto flex flex-col items-center gap-[4px]">
        <RailGlyph
          icon={Sparkles}
          label="Build with AI"
          active={panel === "ai"}
          onClick={() => toggle("ai")}
          className="text-[var(--hr-violet-600)] hover:text-[var(--hr-violet-600)]"
        />
        <span aria-hidden="true" className="h-px w-[18px] bg-pg-border" />
        {/* The canvas's own theme, independent of the page's — the live
            builder lets you draw on a dark board inside a light app. */}
        <RailGlyph
          icon={state.darkCanvas ? Sun : Moon}
          label={state.darkCanvas ? "Light canvas" : "Dark canvas"}
          active={state.darkCanvas}
          onClick={() => state.setDarkCanvas(!state.darkCanvas)}
        />
      </span>
    </nav>
  );
}

/* ── the panel host ─────────────────────────────────────────────────────── */

/**
 * Which component draws which panel. `stats` and `sticky` are absent on
 * purpose: both are MODES of the canvas (an overlay on the run, a palette in
 * the corner), not cards beside it.
 */
const PANELS: Partial<Record<RailPanelId, React.ComponentType<RailPanelProps>>> = {
  notes: NotesPanel,
  errors: ErrorsPanel,
  switcher: WorkflowSwitcherPanel,
  versions: VersionHistoryPanel,
  find: FindReplacePanel,
  ai: AiBuilderPanel,
};

/** True when the open panel draws a card — the canvas pads its run by it. */
export function panelHasCard(panel: RailPanelId | null): boolean {
  return panel !== null && Boolean(PANELS[panel]);
}

/**
 * The floating card just right of the rail.
 *
 * Inside the canvas frame and above the run, full height less a gutter — a
 * pane that belongs to the canvas, not a drawer that belongs to the page.
 * The host draws the card; each panel draws its own header, so a panel that
 * wants a search field or a tab row under its title does not have to fight
 * a header the host imposed.
 */
export function RailPanelHost() {
  const state = useBuilderState();
  if (!state || !state.panel) return null;
  const Panel = PANELS[state.panel];
  if (!Panel) return null;
  const close = () => state.setPanel(null);

  return (
    <aside
      aria-label="Builder panel"
      className={cn(
        "motion-slot-in absolute z-20 flex flex-col overflow-y-auto rounded-[12px] bg-pg-surface p-[16px]",
        PANEL_SHADOW,
      )}
      style={{
        top: PANEL_GAP,
        bottom: PANEL_GAP,
        left: RAIL_W + PANEL_GAP,
        width: PANEL_W,
      }}
    >
      <Panel key={state.panel} onClose={close} />
    </aside>
  );
}

/* ── shared panel furniture ─────────────────────────────────────────────── */

function PanelHeader({
  title,
  subtitle,
  onClose,
  extra,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-[8px]">
      <div className="min-w-0 flex-1">
        <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">
          {title}
        </h2>
        <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
          {subtitle}
        </p>
      </div>
      {extra}
      <PanelIconButton icon={X} label="Close" onClick={onClose} />
    </div>
  );
}

function PanelIconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-text"
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  const id = React.useId();
  return (
    <section className="border-t border-pg-border pt-[12px]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="motion-tap flex h-[28px] w-full items-center justify-between rounded-[6px] text-[14px] leading-[20px] font-medium text-pg-heading"
      >
        {title}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn(
            "text-pg-muted transition-transform duration-150",
            open ? "" : "-rotate-90",
          )}
        />
      </button>
      {open ? (
        <div id={id} className="mt-[8px]">
          {children}
        </div>
      ) : null}
    </section>
  );
}

/* ── notes ──────────────────────────────────────────────────────────────── */

const NOTE_MAX = 5000;

export function NotesPanel({ onClose }: RailPanelProps) {
  const state = useBuilderState();
  const note = state?.workflowNote ?? "";
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="flex flex-col gap-[16px]">
      <PanelHeader
        title="Notes"
        subtitle="Add or review comments for workflow and actions."
        onClose={onClose}
      />

      <Section title="Workflow note">
        <textarea
          aria-label="Workflow note"
          value={note}
          maxLength={NOTE_MAX}
          onChange={(e) => state?.setWorkflowNote(e.target.value)}
          placeholder="Add a note"
          rows={5}
          className="block w-full resize-none rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
        />
        <div className="mt-[4px] flex items-start justify-between gap-[8px] text-[13px] leading-[18px] text-pg-muted">
          <span>Workflow note will be saved when workflow is saved</span>
          <span className="shrink-0 tabular-nums">
            {fmt(note.length)} / {fmt(NOTE_MAX)}
          </span>
        </div>
      </Section>

      <Section title="Action notes">
        <div className="flex flex-col items-center gap-[6px] rounded-[8px] bg-pg px-[12px] py-[20px] text-center">
          <MessageSquare size={18} aria-hidden="true" className="text-pg-faint" />
          <span className="text-[13px] leading-[18px] text-pg-muted">
            No action notes
          </span>
        </div>
      </Section>
    </div>
  );
}

/* ── errors ─────────────────────────────────────────────────────────────── */

/**
 * Someone flying a kite — the "nothing to fix" picture. A line drawing in the
 * canvas's own greys so it reads as an empty state, not as an illustration
 * competing with the run behind it.
 */
function KiteFlyer() {
  return (
    <svg
      viewBox="0 0 180 130"
      width={180}
      height={130}
      aria-hidden="true"
      fill="none"
      stroke="var(--pg-border-strong)"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* ground */}
      <path d="M12 118 H168" />
      {/* the kite */}
      <path
        d="M128 14 L146 30 L132 52 L114 34 Z"
        fill="var(--brand-soft)"
        stroke="var(--brand)"
      />
      <path d="M128 14 L132 52 M114 34 L146 30" stroke="var(--brand)" strokeWidth={1} />
      {/* its tail */}
      <path d="M132 52 C136 60, 128 64, 134 72 S130 84, 136 90" />
      <path d="M131 62 l5 -2 M133 76 l5 -1" />
      {/* the string, down to the hand */}
      <path d="M132 52 C112 70, 86 70, 64 76" strokeDasharray="2 3" />
      {/* the flyer */}
      <circle cx={52} cy={66} r={7} />
      <path d="M52 73 V96" />
      <path d="M52 80 L64 76" />
      <path d="M52 80 L42 88" />
      <path d="M52 96 L44 116 M52 96 L60 116" />
    </svg>
  );
}

export function ErrorsPanel({ onClose }: RailPanelProps) {
  const state = useBuilderState();
  const empty = state?.current.graph === "empty";
  const [shown, setShown] = React.useState(true);

  if (empty) {
    return (
      <div className="flex flex-col gap-[16px]">
        <PanelHeader
          title="1 error"
          subtitle="Fix it before you publish."
          onClose={onClose}
        />
        <div className="flex items-start gap-[10px] rounded-[8px] bg-[var(--pg-warn-bg)] px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-warn-border)]">
          <CircleAlert
            size={16}
            aria-hidden="true"
            className="mt-[2px] shrink-0 text-[var(--pg-warn-icon)]"
          />
          <span className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text">
            Add a trigger to start this workflow
          </span>
          <button
            type="button"
            onClick={onClose}
            className="motion-tap shrink-0 text-[14px] leading-[20px] font-medium text-brand hover:underline"
          >
            Fix
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <PanelHeader
        title="0 errors"
        subtitle="You are all good to go"
        onClose={onClose}
        extra={
          <PanelIconButton
            icon={shown ? EyeOff : Eye}
            label={shown ? "Hide errors on canvas" : "Show errors on canvas"}
            onClick={() => setShown((s) => !s)}
          />
        }
      />
      <div className="flex flex-col items-center gap-[8px] pt-[24px] text-center">
        <KiteFlyer />
        <span className="mt-[8px] flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-heading">
          <CircleCheck
            size={16}
            aria-hidden="true"
            className="text-[var(--hr-success-500)]"
          />
          Zero errors
        </span>
        <span className="text-[13px] leading-[18px] text-pg-muted">
          You are all good to go
        </span>
      </div>
    </div>
  );
}

/* ── sticky notes ───────────────────────────────────────────────────────── */

const STICKY_W = 180;
const STICKY_H = 120;

/**
 * The palette the Sticky notes glyph opens: ten tints and a visibility
 * switch, in the top-left corner under the keyboard raft. A swatch drops a
 * note of that tint on the canvas; each new note lands a step down and right
 * of the last so a burst of clicks fans out instead of stacking invisibly.
 */
export function StickyPalette() {
  const state = useBuilderState();
  if (!state || state.panel !== "sticky") return null;
  const { stickies, setStickies, stickiesHidden, setStickiesHidden } = state;

  const add = (tint: number) => {
    const n = stickies.length % 6;
    setStickies((s) => [
      ...s,
      {
        id: `sticky-${Date.now()}-${s.length}`,
        tint,
        text: "",
        x: 240 + n * 28,
        y: 96 + n * 28,
      },
    ]);
    setStickiesHidden(false);
  };

  return (
    <div
      className="absolute z-10 flex w-[172px] flex-col gap-[8px] rounded-[9px] bg-pg-surface p-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_2px_8px_-2px_rgba(15,23,42,0.10)]"
      style={{ top: 58, left: RAIL_W + 14 }}
    >
      <div className="grid grid-cols-5 gap-[6px]">
        {STICKY_TINTS.map((t, i) => (
          <button
            key={t.border}
            type="button"
            aria-label={`Add sticky note, color ${i + 1}`}
            title="Add sticky note"
            onClick={() => add(i)}
            className="motion-tap size-[26px] rounded-[6px] hover:scale-[1.08] active:scale-[0.94]"
            style={{
              background: t.fill,
              boxShadow: `inset 0 0 0 1.5px ${t.border}`,
            }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setStickiesHidden(!stickiesHidden)}
        className="motion-tap flex h-[28px] items-center justify-center gap-[6px] rounded-[6px] text-[13px] leading-[18px] font-medium text-pg-text hover:bg-pg"
      >
        {stickiesHidden ? (
          <Eye size={14} aria-hidden="true" />
        ) : (
          <EyeOff size={14} aria-hidden="true" />
        )}
        {stickiesHidden ? "Show notes" : "Hide notes"}
      </button>
    </div>
  );
}

/**
 * The notes themselves, on the canvas.
 *
 * Positioned in the frame's coordinates, over the run and under the rafts —
 * a note is content someone left on the canvas, so it should sit on the
 * canvas, but never over the controls you would use to get rid of it.
 * Dragged by the strip along the top with pointer capture, the same gesture
 * the Advanced tiles use; the rest of the card is a textarea and has to keep
 * its own pointer for selecting text.
 */
export function StickyNotes() {
  const state = useBuilderState();
  const grab = React.useRef<{
    id: string;
    pointerId: number;
    dx: number;
    dy: number;
  } | null>(null);
  if (!state || state.stickiesHidden || state.stickies.length === 0) return null;
  const { stickies, setStickies } = state;

  const update = (id: string, patch: Partial<(typeof stickies)[number]>) =>
    setStickies((s) => s.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const onDown = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    const note = stickies.find((n) => n.id === id);
    if (!note) return;
    grab.current = {
      id,
      pointerId: e.pointerId,
      dx: e.clientX - note.x,
      dy: e.clientY - note.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const held = grab.current;
    if (!held || held.pointerId !== e.pointerId) return;
    update(held.id, {
      x: Math.max(0, e.clientX - held.dx),
      y: Math.max(0, e.clientY - held.dy),
    });
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const held = grab.current;
    if (!held || held.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    grab.current = null;
  };

  return (
    <>
      {stickies.map((n) => {
        const tint = STICKY_TINTS[n.tint] ?? STICKY_TINTS[0]!;
        return (
          <div
            key={n.id}
            className="absolute z-[5] flex flex-col overflow-hidden rounded-[8px] shadow-[0_4px_10px_-4px_rgba(15,23,42,0.18)]"
            style={{
              left: n.x,
              top: n.y,
              width: STICKY_W,
              height: STICKY_H,
              background: tint.fill,
              boxShadow: `inset 0 0 0 1px ${tint.border}, 0 4px 10px -4px rgba(15,23,42,0.18)`,
            }}
          >
            <div
              role="button"
              tabIndex={-1}
              aria-label="Drag sticky note"
              className="flex h-[20px] shrink-0 cursor-grab items-center justify-end pr-[2px] active:cursor-grabbing"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => onDown(n.id, e)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <button
                type="button"
                aria-label="Delete sticky note"
                title="Delete sticky note"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() =>
                  setStickies((s) => s.filter((x) => x.id !== n.id))
                }
                className="motion-tap flex size-[18px] items-center justify-center rounded-[4px] text-[#475467] hover:bg-black/5"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
            {/* Literal ink, not a pg token: the tints are light in both
                themes, and dark-theme text on them would vanish. */}
            <textarea
              aria-label="Sticky note"
              value={n.text}
              onChange={(e) => update(n.id, { text: e.target.value })}
              placeholder="Type a note"
              className="min-h-0 flex-1 resize-none bg-transparent px-[10px] pb-[8px] text-[13px] leading-[18px] text-[#101828] placeholder:text-[#667085] focus:outline-none"
            />
          </div>
        );
      })}
    </>
  );
}
