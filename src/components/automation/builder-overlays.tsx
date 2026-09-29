"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  ChevronsDown,
  Copy,
  CopyPlus,
  Info,
  Italic,
  Keyboard,
  MessageSquare,
  Move,
  Pause,
  Pencil,
  Play,
  Redo2,
  Strikethrough,
  Trash2,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { AnchoredPopover, MenuOption, Select } from "@/components/contacts/book-appointment-modal";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { useBuilderState } from "./builder-state";

/**
 * The small pieces the Standard builder lays over its canvas and header —
 * the shortcuts dock, the Recent changes history, a node's hover toolbar,
 * kebab and note, the move targets, and the header's commit controls.
 *
 * Nothing here decides where it sits: the canvas and workflow-detail place
 * each piece. Everything reads the builder state and renders nothing outside
 * a provider, so a canvas drawn without workflow-detail is unaffected.
 *
 * Light and dark: the in-canvas pieces use pg tokens and follow whatever
 * `data-page-theme` the canvas sets. The popovers are portalled to the body,
 * out of reach of that attribute, so they re-apply it themselves from
 * `darkCanvas` (or an explicit `dark` prop).
 */

/* ─── Shared bits ───────────────────────────────────────────────────────── */

const ICON_BTN =
  "motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-text";

/**
 * The popover's content, re-themed. The wrapper fills the card's own
 * scroller, so its surface covers the card's light one when the canvas is dark.
 */
function Themed({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return (
    <div
      data-page-theme={dark ? "dark" : undefined}
      className="flex min-h-0 flex-1 flex-col rounded-[8px] bg-pg-surface text-pg-text"
    >
      {children}
    </div>
  );
}

function useCanvasDark(dark: boolean | undefined): boolean {
  const state = useBuilderState();
  return dark ?? state?.darkCanvas ?? false;
}

function PopoverHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex h-[48px] shrink-0 items-center gap-[8px] border-b border-pg-border pr-[8px] pl-[16px]">
      <span className="min-w-0 flex-1 truncate text-[16px] leading-[24px] font-semibold text-pg-heading">
        {title}
      </span>
      <button type="button" aria-label="Close" onClick={onClose} className={ICON_BTN}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Underline tabs; `center` puts them in the middle of a header row. */
function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (t: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex h-full items-stretch gap-[20px]">
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative flex items-center text-[14px] leading-[20px] whitespace-nowrap motion-tap",
              on ? "font-medium text-brand" : "text-pg-muted hover:text-pg-text",
            )}
          >
            {t.label}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 bottom-0 h-[2px] rounded-full",
                on ? "bg-brand" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ─── 1. Keyboard shortcuts ─────────────────────────────────────────────── */

/** A key, as the keycap draws it. Glyph strings render as-is; the rest are icons. */
type Key = "cmd" | "shift" | "alt" | "up" | "down" | "left" | "right" | string;

interface Shortcut {
  label: string;
  keys: Key[];
  /** An ⓘ after the label, with this as its tooltip. */
  info?: string;
}

type ShortcutTab = "essential" | "edit" | "view" | "navigation" | "tools";

const SHORTCUT_TABS: { id: ShortcutTab; label: string }[] = [
  { id: "essential", label: "Essential" },
  { id: "edit", label: "Edit" },
  { id: "view", label: "View" },
  { id: "navigation", label: "Navigation" },
  { id: "tools", label: "Tools" },
];

const SHORTCUTS: Record<ShortcutTab, Shortcut[]> = {
  essential: [
    { label: "Move to next node", keys: ["down"] },
    { label: "Move to previous node", keys: ["up"] },
    { label: "Zoom in", keys: ["+"] },
    { label: "Save workflow", keys: ["cmd", "S"] },
  ],
  edit: [
    { label: "Move selected node(s)", keys: ["cmd", "X"] },
    { label: "Move all actions from selected node onward", keys: ["cmd", "shift", "X"] },
    { label: "Copy selected node(s)", keys: ["cmd", "C"] },
    { label: "Copy all actions from selected node onward", keys: ["cmd", "shift", "C"] },
    { label: "Paste node(s)", keys: ["cmd", "V"] },
  ],
  view: [
    { label: "Zoom in", keys: ["+"] },
    { label: "Zoom out", keys: ["−"] },
    { label: "Zoom to 100%", keys: ["0"] },
    { label: "Fit view", keys: ["1"] },
  ],
  navigation: [
    { label: "Select all nodes", keys: ["cmd", "A"], info: "Triggers and actions" },
    { label: "Select all actions", keys: ["cmd", "shift", "A"], info: "Every action, no triggers" },
    { label: "Select all triggers", keys: ["cmd", "alt", "A"], info: "Every trigger, no actions" },
    { label: "Move to next node", keys: ["down"] },
    { label: "Move to previous node", keys: ["up"] },
    { label: "Move to left sibling node", keys: ["left"] },
    { label: "Move to right sibling node", keys: ["right"] },
    { label: "Select upstream nodes", keys: ["shift", "up"] },
    { label: "Select downstream nodes", keys: ["shift", "down"] },
  ],
  tools: [
    { label: "Delete selected node(s)", keys: ["del"] },
    { label: "Delete all actions from selected node onward", keys: ["cmd", "del"] },
    { label: "Open action panel", keys: ["tab"] },
    { label: "Open trigger panel", keys: ["shift", "tab"] },
    { label: "Save workflow", keys: ["cmd", "S"] },
  ],
};

const ARROWS = { up: ArrowUp, down: ArrowDown, left: ArrowLeft, right: ArrowRight } as const;

function Keycap({ k }: { k: Key }) {
  let body: React.ReactNode = k;
  let name = k;
  if (k === "cmd") {
    body = "⌘";
    name = "Command";
  } else if (k === "alt") {
    body = "⌥";
    name = "Option";
  } else if (k === "shift") {
    body = (
      <>
        <span aria-hidden="true">⇧</span>
        <span>shift</span>
      </>
    );
    name = "Shift";
  } else if (k in ARROWS) {
    const Icon = ARROWS[k as keyof typeof ARROWS];
    body = <Icon size={12} strokeWidth={2.25} aria-hidden="true" />;
    name = `${k} arrow`;
  }
  return (
    <kbd
      aria-label={name}
      className="inline-flex h-[22px] min-w-[22px] items-center justify-center gap-[3px] rounded-[5px] bg-pg px-[6px] font-sans text-[12px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border),0_1px_0_0_var(--pg-border-strong)]"
    >
      {body}
    </kbd>
  );
}

export function KeyboardShortcutsPanel({
  onClose,
  className,
}: {
  onClose: () => void;
  /** Placement. Defaults to docked along the bottom edge of a relative canvas. */
  className?: string;
}) {
  const [tab, setTab] = React.useState<ShortcutTab>("essential");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <section
      aria-label="Keyboard shortcuts"
      className={cn(
        "motion-slot-in flex h-[220px] flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]",
        className ?? "absolute inset-x-[16px] bottom-[16px] z-20",
      )}
    >
      {/* Title | tabs | close — the tabs sit in the true middle, not the leftover space. */}
      <header className="grid h-[44px] shrink-0 grid-cols-[1fr_auto_1fr] items-stretch border-b border-pg-border px-[16px]">
        <div className="flex items-center gap-[8px] text-pg-heading">
          <Keyboard size={16} aria-hidden="true" className="text-pg-muted" />
          <span className="text-[14px] leading-[20px] font-semibold">Keyboard shortcuts</span>
        </div>
        <UnderlineTabs tabs={SHORTCUT_TABS} value={tab} onChange={setTab} label="Shortcut groups" />
        <div className="flex items-center justify-end">
          <button type="button" aria-label="Close keyboard shortcuts" onClick={onClose} className={ICON_BTN}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div
        role="tabpanel"
        className="grid min-h-0 flex-1 grid-cols-3 content-start gap-x-[32px] gap-y-[4px] overflow-y-auto px-[16px] py-[12px]"
      >
        {SHORTCUTS[tab].map((s) => (
          <div key={s.label} className="flex h-[32px] items-center gap-[12px]">
            <span className="flex min-w-0 flex-1 items-center gap-[4px] text-[13px] leading-[18px] text-pg-text">
              <span className="truncate" title={s.label}>
                {s.label}
              </span>
              {s.info ? (
                <span title={s.info} className="flex shrink-0 text-pg-faint">
                  <Info size={13} aria-label={s.info} />
                </span>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-[4px]">
              {s.keys.map((k, i) => (
                <Keycap key={`${k}-${i}`} k={k} />
              ))}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── 2. Recent changes ─────────────────────────────────────────────────── */

export function RecentChangesPopover({
  anchorRef,
  onClose,
  dark,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  dark?: boolean;
}) {
  const state = useBuilderState();
  const isDark = useCanvasDark(dark);
  const [tab, setTab] = React.useState<"undo" | "redo">("undo");
  /*
   * Stepping several entries at once. undo() and redo() read the stack they
   * were rendered with, so two calls in one tick pop the same entry twice;
   * the first step runs on click, and each later one after the stack the
   * previous step produced has rendered.
   */
  const pending = React.useRef<{ dir: "undo" | "redo"; n: number }>({ dir: "undo", n: 0 });
  const undoLen = state?.undoStack.length ?? 0;
  const redoLen = state?.redoStack.length ?? 0;

  const step = React.useCallback(() => {
    const p = pending.current;
    if (!state || p.n <= 0) return;
    const stack = p.dir === "undo" ? state.undoStack : state.redoStack;
    if (stack.length === 0) {
      p.n = 0;
      return;
    }
    p.n -= 1;
    if (p.dir === "undo") state.undo();
    else state.redo();
  }, [state]);

  React.useEffect(() => {
    step();
    // Keyed on the stack sizes: one step per history change, not per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoLen, redoLen]);

  const stepTo = (dir: "undo" | "redo", n: number) => {
    pending.current = { dir, n };
    step();
  };

  if (!state) return null;
  const list = tab === "undo" ? state.undoStack : state.redoStack;
  const Glyph = tab === "undo" ? Undo2 : Redo2;

  return (
    <AnchoredPopover anchorRef={anchorRef} onClose={onClose} align="end" width={440} maxHeight={500}>
      <Themed dark={isDark}>
        <div className="flex h-[500px] max-h-full min-h-0 flex-col">
          <PopoverHeader title="Recent changes" onClose={onClose} />
          <div className="h-[40px] shrink-0 border-b border-pg-border px-[16px]">
            <UnderlineTabs
              label="History"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "undo", label: `Can undo (${state.undoStack.length})` },
                { id: "redo", label: `Can redo (${state.redoStack.length})` },
              ]}
            />
          </div>
          {list.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[4px] px-[24px] text-center">
              <span className="mb-[12px] flex size-[72px] items-center justify-center rounded-full bg-pg text-pg-faint">
                <Glyph size={36} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
                {tab === "undo" ? "No undo actions available" : "No redo actions available"}
              </p>
              <p className="text-[13px] leading-[18px] text-pg-muted">
                {tab === "undo"
                  ? "Make some changes to see undo history"
                  : "Undo some changes to see redo history"}
              </p>
            </div>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[8px]">
              {list.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    title={tab === "undo" ? "Undo to here" : "Redo to here"}
                    onClick={() => stepTo(tab, i + 1)}
                    className="group flex h-[40px] w-full items-center gap-[10px] rounded-[6px] px-[10px] text-left motion-tap hover:bg-pg"
                  >
                    <Glyph size={14} aria-hidden="true" className="shrink-0 text-pg-faint group-hover:text-brand" />
                    <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">{c.label}</span>
                    <span className="shrink-0 text-[13px] leading-[18px] text-pg-faint">{c.at || "Just now"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Themed>
    </AnchoredPopover>
  );
}

/* ─── 3. Node hover toolbar ─────────────────────────────────────────────── */

const TOOL_GLYPH =
  "motion-tap relative flex size-[24px] items-center justify-center rounded-[6px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.06)] hover:text-pg-text active:scale-[0.94]";

export function NodeHoverToolbar({
  nodeId,
  className,
}: {
  nodeId: string;
  /** Placement. Defaults to just above the top-right of a relative node wrapper. */
  className?: string;
}) {
  const state = useBuilderState();
  const noteRef = React.useRef<HTMLButtonElement>(null);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const closeNote = React.useCallback(() => setNoteOpen(false), []);
  if (!state) return null;
  const disabled = state.disabledNodes.includes(nodeId);
  const hasNote = Boolean(state.nodeNotes[nodeId]);

  return (
    <div
      // Clicks here are the toolbar's, not the node's (which would open its drawer).
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn("flex items-center gap-[4px]", className ?? "absolute right-0 bottom-full z-10 mb-[6px]")}
    >
      <button
        type="button"
        aria-label={disabled ? "Enable action" : "Disable action"}
        title={disabled ? "Enable action" : "Disable action"}
        onClick={() => state.toggleDisabled(nodeId)}
        className={cn(TOOL_GLYPH, disabled && "text-brand hover:text-brand")}
      >
        {disabled ? (
          <Play size={12} fill="currentColor" aria-hidden="true" />
        ) : (
          <Pause size={12} fill="currentColor" aria-hidden="true" />
        )}
      </button>
      <button
        ref={noteRef}
        type="button"
        aria-label="Notes"
        title="Notes"
        aria-expanded={noteOpen}
        onClick={() => setNoteOpen((v) => !v)}
        className={cn(TOOL_GLYPH, noteOpen && "text-brand")}
      >
        <MessageSquare size={13} aria-hidden="true" />
        {hasNote ? (
          <span
            aria-hidden="true"
            className="absolute -top-[2px] -right-[2px] size-[7px] rounded-full bg-brand shadow-[0_0_0_1.5px_var(--pg-surface)]"
          />
        ) : null}
      </button>
      {noteOpen ? <NodeNotePopover nodeId={nodeId} anchorRef={noteRef} onClose={closeNote} /> : null}
    </div>
  );
}

/* ─── 4. Node note ──────────────────────────────────────────────────────── */

type Format = "bold" | "italic" | "underline" | "strikeThrough";

const FORMATS: { cmd: Format; label: string; Icon: typeof Bold }[] = [
  { cmd: "bold", label: "Bold", Icon: Bold },
  { cmd: "italic", label: "Italic", Icon: Italic },
  { cmd: "underline", label: "Underline", Icon: Underline },
  { cmd: "strikeThrough", label: "Strikethrough", Icon: Strikethrough },
];

function count(text: string) {
  const t = text.replace(/ /g, " ");
  const chars = t.replace(/\n/g, "").length;
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  return { chars, words };
}

export function NodeNotePopover({
  nodeId,
  anchorRef,
  onClose,
  dark,
}: {
  nodeId: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  dark?: boolean;
}) {
  const state = useBuilderState();
  const isDark = useCanvasDark(dark);
  const saved = state?.nodeNotes[nodeId] ?? "";
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [text, setText] = React.useState("");
  const [active, setActive] = React.useState<Format[]>([]);

  // The note is stored as the editor's HTML; seed it once, then the DOM owns it.
  React.useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = saved;
    setText(el.innerText);
    el.focus();
    // Only on open: re-seeding on every save would drop the caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    const el = editorRef.current;
    if (!el) return;
    setText(el.innerText);
    setActive(FORMATS.filter((f) => document.queryCommandState(f.cmd)).map((f) => f.cmd));
  };

  // A prototype editor: execCommand is deprecated but still does all six jobs.
  const exec = (cmd: Format | "undo" | "redo") => {
    editorRef.current?.focus();
    document.execCommand(cmd);
    sync();
  };

  if (!state) return null;
  const { chars, words } = count(text);
  const empty = text.trim() === "";

  const save = () => {
    const html = empty ? "" : (editorRef.current?.innerHTML ?? "");
    state.setNodeNote(nodeId, html);
    state.recordChange("Edited note");
    onClose();
  };

  return (
    <AnchoredPopover anchorRef={anchorRef} onClose={onClose} align="end" width={560} maxHeight={440}>
      <Themed dark={isDark}>
        <PopoverHeader title={saved ? "Notes" : "No notes"} onClose={onClose} />
        <div className="flex flex-col gap-[8px] p-[16px]">
          <div className="overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <div
              role="toolbar"
              aria-label="Formatting"
              className="flex h-[36px] items-center gap-[2px] border-b border-pg-border px-[6px]"
            >
              {[
                { cmd: "undo" as const, label: "Undo", Icon: Undo2 },
                { cmd: "redo" as const, label: "Redo", Icon: Redo2 },
              ].map(({ cmd, label, Icon }) => (
                <button
                  key={cmd}
                  type="button"
                  aria-label={label}
                  title={label}
                  // Keep the selection in the editor.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec(cmd)}
                  className={cn(ICON_BTN, "size-[26px]")}
                >
                  <Icon size={14} aria-hidden="true" />
                </button>
              ))}
              <span aria-hidden="true" className="mx-[4px] h-[16px] w-px bg-pg-border" />
              {FORMATS.map(({ cmd, label, Icon }) => {
                const on = active.includes(cmd);
                return (
                  <button
                    key={cmd}
                    type="button"
                    aria-label={label}
                    aria-pressed={on}
                    title={label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec(cmd)}
                    className={cn(ICON_BTN, "size-[26px]", on && "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand")}
                  >
                    <Icon size={14} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <div className="relative">
              {empty ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-[10px] left-[12px] text-[14px] leading-[20px] text-pg-faint"
                >
                  Type a message
                </span>
              ) : null}
              <div
                ref={editorRef}
                role="textbox"
                aria-multiline="true"
                aria-label="Note"
                contentEditable
                suppressContentEditableWarning
                onInput={sync}
                onKeyUp={sync}
                onMouseUp={sync}
                className="h-[140px] overflow-y-auto px-[12px] py-[10px] text-[14px] leading-[20px] text-pg-text outline-none"
              />
            </div>
          </div>
          <p className="text-right text-[13px] leading-[18px] tabular-nums text-pg-faint">
            {chars.toLocaleString("en-US")} {chars === 1 ? "character" : "characters"} |{" "}
            {words.toLocaleString("en-US")} {words === 1 ? "word" : "words"}
          </p>
        </div>
        <footer className="flex items-center gap-[12px] border-t border-pg-border px-[16px] py-[12px]">
          <span className="min-w-0 flex-1 text-[13px] leading-[18px] text-pg-muted">
            * Notes are saved with workflow save
          </span>
          <button
            type="button"
            onClick={onClose}
            className="motion-tap h-[36px] rounded-[8px] bg-pg-surface px-[14px] text-[14px] leading-[20px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
          >
            Close
          </button>
          <button
            type="button"
            onClick={save}
            className="motion-tap h-[36px] rounded-[8px] bg-[var(--hr-success-600)] px-[14px] text-[14px] leading-[20px] font-medium text-white hover:brightness-[1.06]"
          >
            Save
          </button>
        </footer>
      </Themed>
    </AnchoredPopover>
  );
}

/* ─── 5. Node kebab menu ────────────────────────────────────────────────── */

export function NodeMenu({
  nodeId,
  anchorRef,
  onClose,
  onDelete,
  onNotes,
  dark,
}: {
  nodeId: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Opens the delete confirm; `from-here` is "Delete all actions from here". */
  onDelete: (scope: "one" | "from-here") => void;
  /** Opens the node's note popover. */
  onNotes: () => void;
  dark?: boolean;
}) {
  const state = useBuilderState();
  const isDark = useCanvasDark(dark);
  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };
  const move = () => {
    state?.setMoving(nodeId);
    showToast("Pick where to move this action");
  };
  const divider = <span aria-hidden="true" className="mx-[4px] my-[4px] h-px shrink-0 bg-pg-border" />;

  return (
    <AnchoredPopover anchorRef={anchorRef} onClose={onClose} align="end" width={264} maxHeight={400}>
      <Themed dark={isDark}>
        <div role="menu" aria-label="Action options" className="flex flex-col p-[4px]">
          <MenuOption onClick={run(() => showToast("Action copied"))}>
            <Copy size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
            Copy action
          </MenuOption>
          <MenuOption onClick={run(() => showToast("Actions copied"))}>
            <CopyPlus size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
            Copy all actions from here
          </MenuOption>
          {divider}
          <MenuOption onClick={run(move)}>
            <Move size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
            Move action
          </MenuOption>
          <MenuOption onClick={run(move)}>
            <ChevronsDown size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
            Move all actions from here
          </MenuOption>
          {divider}
          <MenuOption danger onClick={run(() => onDelete("one"))}>
            <Trash2 size={15} aria-hidden="true" className="shrink-0" />
            Delete action
          </MenuOption>
          <MenuOption danger onClick={run(() => onDelete("from-here"))}>
            <Trash2 size={15} aria-hidden="true" className="shrink-0" />
            Delete all actions from here
          </MenuOption>
          {divider}
          <MenuOption onClick={run(onNotes)}>
            <MessageSquare size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
            Notes
          </MenuOption>
        </div>
      </Themed>
    </AnchoredPopover>
  );
}

/* ─── 6. Move target ────────────────────────────────────────────────────── */

export function MoveTarget({ allowed, onDrop }: { allowed: boolean; onDrop: () => void }) {
  return (
    <button
      type="button"
      disabled={!allowed}
      onClick={(e) => {
        e.stopPropagation();
        onDrop();
      }}
      className={cn(
        "flex h-[26px] items-center rounded-full border border-dashed px-[12px] text-[12px] leading-[16px] font-medium whitespace-nowrap",
        allowed
          ? "motion-tap border-brand bg-brand-soft text-brand hover:brightness-[0.97] active:scale-[0.96]"
          : "cursor-not-allowed border-pg-border-strong bg-pg-surface text-pg-faint",
      )}
    >
      {allowed ? "Move here" : "Not allowed"}
    </button>
  );
}

/* ─── 7. Canvas kind ────────────────────────────────────────────────────── */

const KIND_OPTIONS: { value: "standard" | "advanced"; label: string }[] = [
  { value: "standard", label: "Standard builder" },
  { value: "advanced", label: "Advanced builder" },
];

export function CanvasKindSelect() {
  const state = useBuilderState();
  if (!state) return null;
  return (
    <Select
      label="Builder"
      value={state.canvasKind ?? "standard"}
      options={KIND_OPTIONS}
      onChange={state.setCanvasKind}
      width={184}
      menuWidth={200}
    />
  );
}

/* ─── 8. Save ───────────────────────────────────────────────────────────── */

export function SaveButton() {
  const state = useBuilderState();
  if (!state) return null;
  if (!state.dirty) {
    return (
      <button
        type="button"
        disabled
        className="h-[36px] cursor-default rounded-[8px] bg-brand-soft px-[14px] text-[14px] leading-[20px] font-medium text-brand"
      >
        Saved
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        state.save();
        showToast("Workflow saved");
      }}
      className="motion-tap relative h-[36px] rounded-[8px] bg-brand px-[14px] text-[14px] leading-[20px] font-medium text-brand-fg shadow-[0_1px_2px_0_rgba(16,24,40,0.08)] hover:brightness-[1.06] active:scale-[0.98]"
    >
      Save
      <span
        aria-label="Unsaved changes"
        className="absolute -top-[3px] -right-[3px] size-[9px] rounded-full bg-[var(--hr-error-500)] shadow-[0_0_0_2px_var(--pg-surface)]"
      />
    </button>
  );
}

/* ─── 9. Publish ────────────────────────────────────────────────────────── */

export function PublishToggle() {
  const state = useBuilderState();
  if (!state) return null;
  const on = state.published;
  const toggle = () => {
    state.setPublished(!on);
    state.recordChange(on ? "Moved to draft" : "Published");
    showToast(on ? "Workflow moved to draft" : "Workflow published");
  };
  return (
    <div className="flex h-[36px] items-center gap-[8px] text-[14px] leading-[20px]">
      <span className={on ? "text-pg-muted" : "font-medium text-pg-heading"}>Draft</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Publish"
        onClick={toggle}
        className={cn(
          "motion-tap relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors",
          on ? "bg-brand" : "bg-pg-border-strong",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-[2px] left-[2px] size-[16px] rounded-full bg-white shadow-[0_1px_2px_0_rgba(16,24,40,0.2)] transition-transform",
            on && "translate-x-[16px]",
          )}
        />
      </button>
      <span className={on ? "font-medium text-pg-heading" : "text-pg-muted"}>Publish</span>
    </div>
  );
}

/* ─── 10. Editable title ────────────────────────────────────────────────── */

export function EditableTitle({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(name);
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Escape sets this so the blur that follows unmounting doesn't commit.
  const cancelled = React.useRef(false);

  React.useLayoutEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const next = draft.trim();
    if (next && next !== name) onRename(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label="Workflow name"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cancelled.current = true;
            setEditing(false);
          }
        }}
        style={{ width: `${Math.max(12, draft.length + 2)}ch` }}
        className="h-[32px] max-w-[420px] min-w-0 rounded-[6px] bg-pg-surface px-[8px] text-[16px] leading-[24px] font-semibold text-pg-heading shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      title="Rename workflow"
      onClick={() => {
        setDraft(name);
        cancelled.current = false;
        setEditing(true);
      }}
      className="group motion-tap flex h-[32px] min-w-0 items-center gap-[6px] rounded-[6px] px-[8px] hover:bg-pg"
    >
      <span className="min-w-0 truncate text-[16px] leading-[24px] font-semibold text-pg-heading">{name}</span>
      <Pencil size={14} aria-hidden="true" className="shrink-0 text-pg-faint group-hover:text-pg-text" />
    </button>
  );
}
