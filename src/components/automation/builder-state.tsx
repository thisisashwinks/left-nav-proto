"use client";

import * as React from "react";

/**
 * The Standard builder's session state — which rail panel is open, which
 * workflow the canvas is drawing, and what mode it is drawing it in.
 *
 * A context rather than props because three different files read it: the
 * canvas (what graph, what mode), the rail panels (switcher, version history,
 * find and replace, AI…), and workflow-detail above both (the title follows
 * the switcher, and viewing an old version strips the facets down to Builder
 * and Settings and takes Test / Publish away). Threading one value through all
 * three as props would have meant editing every signature between them.
 *
 * Provided by workflow-detail around the whole page. Everything is local and
 * lost on remount, like the rest of the canvas.
 */

export type RailPanelId =
  | "notes"
  | "errors"
  | "stats"
  | "sticky"
  | "switcher"
  | "find"
  | "versions"
  | "ai";

/**
 * Which run the canvas draws.
 *
 *   pm-beta   Form Submitted → Add Tag → END (the workflow that was opened)
 *   whatsapp  Add new trigger → Email → Wait for reply → Contact reply /
 *             Time out branches → AI decision maker / END
 *   empty     A brand-new workflow: the "What do you want to automate?" AI
 *             card, "Or", then Add new trigger → + → END
 */
export type BuilderGraph = "pm-beta" | "whatsapp" | "empty";

/**
 * `edit` is the normal canvas. `stats` is the read-only overlay the Stats rail
 * glyph turns on (no + joints, counts on the trigger, a "not editable" note).
 * `version` is viewing a previous version: read-only, a "This version is in
 * view only mode" banner, and workflow-detail hides the history facets and
 * the commit controls.
 */
export type BuilderMode = "edit" | "stats" | "version";

export interface SwitcherWorkflow {
  id: string;
  name: string;
  /** "July 29th 2026, 11:39 am" */
  edited: string;
  status: "published" | "draft";
  graph: BuilderGraph;
}

export const SWITCHER_WORKFLOWS: SwitcherWorkflow[] = [
  { id: "pm-beta", name: "Project Management Beta", edited: "July 29th 2026, 11:39 am", status: "published", graph: "pm-beta" },
  { id: "nw-2206", name: "New Workflow : 1790597362206", edited: "September 28th 2026, 5:42 pm", status: "draft", graph: "empty" },
  { id: "wa-oct", name: "WhatsApp pricing change 1 Oct send", edited: "September 28th 2026, 4:39 pm", status: "published", graph: "whatsapp" },
  { id: "nw-5215", name: "New Workflow : 1790593615215", edited: "September 28th 2026, 4:36 pm", status: "draft", graph: "empty" },
  { id: "company", name: "CompanyID → Associated Company Fields for new contacts", edited: "September 28th 2026, 1:00 pm", status: "draft", graph: "empty" },
  { id: "nw-8740", name: "New Workflow : 1790537578740", edited: "September 28th 2026, 1:02 am", status: "draft", graph: "empty" },
  { id: "nw-3358", name: "New Workflow : 1790411223358", edited: "September 26th 2026, 1:57 pm", status: "draft", graph: "empty" },
  { id: "nw-0102", name: "New Workflow : 1790336290102", edited: "September 25th 2026, 5:08 pm", status: "draft", graph: "empty" },
  { id: "wa-hook", name: "DO NOT TOUCH whatsapp_webhook", edited: "September 25th 2026, 4:23 pm", status: "published", graph: "whatsapp" },
  { id: "nw-8330", name: "New Workflow : 1790332738330", edited: "September 25th 2026, 4:10 pm", status: "draft", graph: "empty" },
];

export interface StickyNote {
  id: string;
  /** One of the 10 palette tints — see STICKY_TINTS. */
  tint: number;
  text: string;
  x: number;
  y: number;
}

/** Fill / border pairs for the sticky-note palette, in the live order. */
export const STICKY_TINTS: { fill: string; border: string }[] = [
  { fill: "#FEF7C3", border: "#EAAA08" },
  { fill: "#D1E0FF", border: "#528BFF" },
  { fill: "#D3F8DF", border: "#3CCB7F" },
  { fill: "#FDEAD7", border: "#EF6820" },
  { fill: "#CFF9FE", border: "#22CCEE" },
  { fill: "#F2F4F7", border: "#667085" },
  { fill: "#CCFBEF", border: "#15B79E" },
  { fill: "#EBE9FE", border: "#7A5AF8" },
  { fill: "#FBE8FF", border: "#D444F1" },
  { fill: "#FEE4E2", border: "#F04438" },
];

/**
 * The right-hand drawer — at most one open, beside the canvas (the canvas
 * narrows for it rather than being covered).
 *
 * `nodeId` is a canvas node id: "trigger", "add-tag", "email", "wait", "ai",
 * "notify", "reply", "timeout" (see the graph list above).
 */
export type BuilderDrawer =
  | { kind: "add-trigger" }
  | { kind: "trigger-config"; trigger: string }
  | { kind: "add-action"; after: string }
  | { kind: "action-config"; nodeId: string }
  | { kind: "action-stats"; nodeId: string }
  | { kind: "run-test" };

/** One entry in the undo / redo history the Recent changes popover lists. */
export interface BuilderChange {
  id: string;
  label: string;
  at: string;
}

export interface BuilderState {
  panel: RailPanelId | null;
  setPanel: (p: RailPanelId | null) => void;
  /** The workflow on the canvas — the switcher changes it. */
  current: SwitcherWorkflow;
  openWorkflow: (w: SwitcherWorkflow) => void;
  /** The header's pencil — renames the workflow on the canvas. */
  renameCurrent: (name: string) => void;
  /** Create a fresh draft (switcher "+", version "Create new workflow from this version"). */
  createWorkflow: (from?: { name: string; graph: BuilderGraph }) => void;
  recents: SwitcherWorkflow[];
  mode: BuilderMode;
  setMode: (m: BuilderMode) => void;
  /** The version being viewed while `mode === "version"`, e.g. 7. */
  viewingVersion: number | null;
  viewVersion: (v: number | null) => void;
  workflowNote: string;
  setWorkflowNote: (s: string) => void;
  stickies: StickyNote[];
  setStickies: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  stickiesHidden: boolean;
  setStickiesHidden: (b: boolean) => void;
  /** Node ids find-and-replace is highlighting on the canvas. */
  highlighted: string[];
  setHighlighted: (ids: string[]) => void;
  published: boolean;
  setPublished: (b: boolean) => void;

  /* ── Sep 29, batch 3: the canvas as an editor ─────────────────────────── */
  drawer: BuilderDrawer | null;
  setDrawer: (d: BuilderDrawer | null) => void;
  /** Keyboard shortcuts, docked along the canvas's bottom edge. */
  shortcutsOpen: boolean;
  setShortcutsOpen: (b: boolean) => void;
  darkCanvas: boolean;
  setDarkCanvas: (b: boolean) => void;
  /** Canvas zoom, in percent (25–200). */
  zoom: number;
  setZoom: (z: number) => void;
  /** Local override of the theme's builderCanvas knob — the "Standard builder ▾" select. */
  canvasKind: "standard" | "advanced" | null;
  setCanvasKind: (k: "standard" | "advanced" | null) => void;
  /** Unsaved edits exist: the header shows "Save" with a dot instead of "Saved". */
  dirty: boolean;
  /** Record an edit: marks dirty and pushes onto the undo history. */
  recordChange: (label: string) => void;
  save: () => void;
  undoStack: BuilderChange[];
  redoStack: BuilderChange[];
  undo: () => void;
  redo: () => void;
  /** The trigger the canvas draws, when one was picked — overrides the graph's own. */
  triggerName: string | null;
  setTriggerName: (s: string | null) => void;
  /** Nodes switched off from their hover toolbar — drawn as "Email (Disabled)". */
  disabledNodes: string[];
  toggleDisabled: (id: string) => void;
  /** Per-node notes, from the hover toolbar's note glyph. */
  nodeNotes: Record<string, string>;
  setNodeNote: (id: string, text: string) => void;
  /** Nodes deleted from the canvas this session. */
  deletedNodes: string[];
  deleteNode: (id: string) => void;
  /** The node being moved — the canvas shows "Move here" / "Not allowed" targets. */
  moving: string | null;
  setMoving: (id: string | null) => void;
  /** The node the canvas has selected (brand ring). */
  selected: string | null;
  setSelected: (id: string | null) => void;
}

const Ctx = React.createContext<BuilderState | null>(null);

export function BuilderStateProvider({
  initialName,
  children,
}: {
  /** The opened workflow's name — the switcher's "current" starts as it. */
  initialName: string;
  children: React.ReactNode;
}) {
  const [panel, setPanel] = React.useState<RailPanelId | null>(null);
  const [recents, setRecents] = React.useState<SwitcherWorkflow[]>(() =>
    SWITCHER_WORKFLOWS.map((w, i) => (i === 0 ? { ...w, name: initialName } : w)),
  );
  const [currentId, setCurrentId] = React.useState(recents[0]!.id);
  const [modeState, setModeState] = React.useState<BuilderMode>("edit");
  const [viewingVersion, setViewingVersion] = React.useState<number | null>(null);
  const [workflowNote, setWorkflowNote] = React.useState("");
  const [stickies, setStickies] = React.useState<StickyNote[]>([]);
  const [stickiesHidden, setStickiesHidden] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState<string[]>([]);
  const [published, setPublished] = React.useState(true);
  const [drawer, setDrawer] = React.useState<BuilderDrawer | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [darkCanvas, setDarkCanvas] = React.useState(false);
  const [zoom, setZoomState] = React.useState(100);
  const [canvasKind, setCanvasKind] = React.useState<"standard" | "advanced" | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [undoStack, setUndoStack] = React.useState<BuilderChange[]>([]);
  const [redoStack, setRedoStack] = React.useState<BuilderChange[]>([]);
  const [triggerName, setTriggerName] = React.useState<string | null>(null);
  const [disabledNodes, setDisabledNodes] = React.useState<string[]>([]);
  const [nodeNotes, setNodeNotes] = React.useState<Record<string, string>>({});
  const [deletedNodes, setDeletedNodes] = React.useState<string[]>([]);
  const [moving, setMoving] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const changeSeq = React.useRef(0);
  const recordChange = (label: string) => {
    changeSeq.current += 1;
    setUndoStack((u) => [{ id: `c${changeSeq.current}`, label, at: "Just now" }, ...u]);
    setRedoStack([]);
    setDirty(true);
  };

  const current = recents.find((w) => w.id === currentId) ?? recents[0]!;

  const value: BuilderState = {
    panel,
    setPanel: (p) => {
      setPanel(p);
      // Stats is a mode as much as a panel: its glyph turns the overlay on,
      // and leaving it for any other panel turns it off.
      if (p === "stats") setModeState("stats");
      else if (modeState === "stats") setModeState("edit");
      // Closing version history leaves the version you were looking at.
      if (p !== "versions" && modeState === "version") {
        setModeState("edit");
        setViewingVersion(null);
      }
    },
    current,
    openWorkflow: (w) => {
      setCurrentId(w.id);
      setModeState("edit");
      setViewingVersion(null);
      setHighlighted([]);
      setPublished(w.status === "published");
    },
    renameCurrent: (name) => {
      setRecents((r) => r.map((w) => (w.id === currentId ? { ...w, name } : w)));
      recordChange("Renamed workflow");
    },
    createWorkflow: (from) => {
      const stamp = String(1790673576900 + recents.length);
      const w: SwitcherWorkflow = {
        id: `nw-${stamp}`,
        name: from ? `${from.name} (copy)` : `New Workflow: ${stamp}`,
        edited: "September 29th 2026, 2:49 pm",
        status: "draft",
        graph: from?.graph ?? "empty",
      };
      setRecents((r) => [w, ...r]);
      setCurrentId(w.id);
      setModeState("edit");
      setViewingVersion(null);
      setPublished(false);
    },
    recents,
    mode: modeState,
    setMode: setModeState,
    viewingVersion,
    viewVersion: (v) => {
      setViewingVersion(v);
      setModeState(v === null ? "edit" : "version");
    },
    workflowNote,
    setWorkflowNote,
    stickies,
    setStickies,
    stickiesHidden,
    setStickiesHidden,
    highlighted,
    setHighlighted,
    published,
    setPublished,
    drawer,
    setDrawer,
    shortcutsOpen,
    setShortcutsOpen,
    darkCanvas,
    setDarkCanvas,
    zoom,
    setZoom: (z) => setZoomState(Math.max(25, Math.min(200, Math.round(z)))),
    canvasKind,
    setCanvasKind,
    dirty,
    recordChange,
    save: () => setDirty(false),
    undoStack,
    redoStack,
    undo: () => {
      const [top, ...rest] = undoStack;
      if (!top) return;
      setUndoStack(rest);
      setRedoStack((r) => [top, ...r]);
      setDirty(true);
    },
    redo: () => {
      const [top, ...rest] = redoStack;
      if (!top) return;
      setRedoStack(rest);
      setUndoStack((u) => [top, ...u]);
      setDirty(true);
    },
    triggerName,
    setTriggerName,
    disabledNodes,
    toggleDisabled: (id) => {
      setDisabledNodes((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
      recordChange(disabledNodes.includes(id) ? "Enabled action" : "Disabled action");
    },
    nodeNotes,
    setNodeNote: (id, text) => setNodeNotes((n) => ({ ...n, [id]: text })),
    deletedNodes,
    deleteNode: (id) => {
      setDeletedNodes((d) => [...d, id]);
      recordChange("Deleted action");
    },
    moving,
    setMoving,
    selected,
    setSelected,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * The builder state, or null outside a provider — the Advanced and Abstract
 * canvases, and any caller that draws a canvas without workflow-detail, keep
 * working exactly as they did.
 */
export function useBuilderState(): BuilderState | null {
  return React.useContext(Ctx);
}

/** Panel props every rail panel takes. The host draws the card; the panel draws its own header. */
export interface RailPanelProps {
  onClose: () => void;
}
