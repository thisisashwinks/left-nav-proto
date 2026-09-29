"use client";

import * as React from "react";
import {
  Baseline,
  Bold,
  Highlighter,
  Image as ImageGlyph,
  Italic,
  Link,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The description box the note and task forms share — a contentEditable with
 * a toolbar over it.
 *
 * `document.execCommand` does the formatting. It is deprecated and it is also
 * still the only thing every browser ships that edits a contentEditable with
 * a working undo stack, which is exactly what a prototype needs and nothing
 * more. The editor is uncontrolled underneath: the HTML is written into the
 * element only when the prop moves away from what the element already holds,
 * so typing never round-trips through React and the caret never jumps.
 */

export type RichTextTool =
  | "bold"
  | "underline"
  | "italic"
  | "strike"
  | "color"
  | "highlight"
  | "link"
  | "image"
  | "bullets"
  | "numbers"
  | "undo"
  | "redo";

const ALL_TOOLS: RichTextTool[] = [
  "bold",
  "underline",
  "italic",
  "strike",
  "color",
  "highlight",
  "link",
  "image",
  "bullets",
  "numbers",
  "undo",
  "redo",
];

const TOOL: Record<RichTextTool, { label: string; icon: LucideIcon; command?: string }> = {
  bold: { label: "Bold", icon: Bold, command: "bold" },
  underline: { label: "Underline", icon: Underline, command: "underline" },
  italic: { label: "Italic", icon: Italic, command: "italic" },
  strike: { label: "Strikethrough", icon: Strikethrough, command: "strikeThrough" },
  color: { label: "Text color", icon: Baseline },
  highlight: { label: "Highlight", icon: Highlighter },
  link: { label: "Link", icon: Link },
  image: { label: "Image", icon: ImageGlyph },
  bullets: { label: "Bulleted list", icon: List, command: "insertUnorderedList" },
  numbers: { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
  undo: { label: "Undo", icon: Undo2, command: "undo" },
  redo: { label: "Redo", icon: Redo2, command: "redo" },
};

/*
 * Raw hex rather than tokens: execCommand writes the colour INTO the HTML,
 * and a `var()` in a saved note would not survive the trip. Mid-scale HighRise
 * values, which read on both the light and the dark surface.
 */
const TEXT_COLORS = ["#101828", "#667085", "#d92d20", "#dc6803", "#079455", "#155eef", "#7839ee", "#dd2590"];
const HIGHLIGHTS = ["#fef0c7", "#d1fadf", "#d1e0ff", "#fce7f6", "#ebe9fe", "#cff9fe", "#f2f4f7"];

/**
 * The styles rendered note HTML needs, in the editor and wherever the note
 * is shown — preflight strips list markers, so they come back here.
 */
export const RICH_TEXT_CONTENT =
  "break-words [&_a]:text-brand [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-[20px] [&_ul]:list-disc [&_ul]:pl-[20px]";

/** The text a reader sees, without the markup. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<(br|\/div|\/p|\/li)\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|apos);/g, "x")
    .replace(/&#?[a-z0-9]+;/gi, "x")
    .replace(/\n+$/, "");
}

/** Counts plain text, the way the "0 / 2,000 characters" counter does. */
export function plainTextLength(html: string): number {
  return htmlToPlainText(html).replace(/\n/g, "").length;
}

type Popover = "color" | "highlight" | "link" | null;

export function RichTextField({
  value,
  onChange,
  placeholder,
  maxLength,
  minHeight = 160,
  tools = ALL_TOOLS,
  autoFocus,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  maxLength: number;
  minHeight?: number;
  /** Which toolbar buttons; default all. */
  tools?: RichTextTool[];
  autoFocus?: boolean;
}) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const savedRange = React.useRef<Range | null>(null);
  const [active, setActive] = React.useState<Set<string>>(() => new Set());
  const [popover, setPopover] = React.useState<Popover>(null);
  const [linkUrl, setLinkUrl] = React.useState("");

  const length = plainTextLength(value);
  const over = length > maxLength;
  const empty = length === 0 && !/<(img|li|span[^>]*data-rtf-image)/i.test(value);

  // Write the prop in only when it differs — a reset, an edit being loaded.
  React.useEffect(() => {
    const el = editorRef.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  React.useEffect(() => {
    if (autoFocus) editorRef.current?.focus();
  }, [autoFocus]);

  // The toolbar's pressed states follow the caret.
  React.useEffect(() => {
    const onSelection = () => {
      const el = editorRef.current;
      const sel = document.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
      const next = new Set<string>();
      for (const t of ALL_TOOLS) {
        const cmd = TOOL[t].command;
        if (!cmd || t === "undo" || t === "redo") continue;
        try {
          if (document.queryCommandState(cmd)) next.add(t);
        } catch {
          /* unsupported command — leave it unpressed */
        }
      }
      setActive((prev) =>
        prev.size === next.size && [...next].every((x) => prev.has(x)) ? prev : next,
      );
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  // Escape closes a toolbar popover without closing the drawer under it.
  React.useEffect(() => {
    if (!popover) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setPopover(null);
      editorRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setPopover(null);
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [popover]);

  const emit = () => {
    const el = editorRef.current;
    if (el) onChange(el.innerHTML);
  };

  const saveSelection = () => {
    const el = editorRef.current;
    const sel = document.getSelection();
    if (el && sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    } else {
      savedRange.current = null;
    }
  };

  const restoreSelection = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = document.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    // Colours as inline styles rather than <font> tags.
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, arg);
    emit();
  };

  const run = (tool: RichTextTool) => {
    const cmd = TOOL[tool].command;
    if (cmd) {
      exec(cmd);
      return;
    }
    if (tool === "image") {
      exec(
        "insertHTML",
        `<span contenteditable="false" data-rtf-image="" class="mx-[2px] inline-flex h-[22px] items-center gap-[5px] rounded-[6px] bg-pg px-[7px] align-middle text-[12px] leading-none font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>image.png</span>&nbsp;`,
      );
      return;
    }
    saveSelection();
    if (tool === "link") setLinkUrl("");
    setPopover((p) => (p === tool ? null : (tool as Popover)));
  };

  const applyLink = () => {
    const raw = linkUrl.trim();
    setPopover(null);
    restoreSelection();
    if (!raw) return;
    const url = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed) {
      const safe = url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
      exec("insertHTML", `<a href="${safe}" target="_blank" rel="noreferrer">${safe}</a>&nbsp;`);
    } else {
      exec("createLink", url);
    }
  };

  const applyColor = (kind: "color" | "highlight", color: string) => {
    setPopover(null);
    restoreSelection();
    exec(kind === "color" ? "foreColor" : "hiliteColor", color);
  };

  return (
    <div className="flex flex-col gap-[4px]">
      <div
        ref={boxRef}
        className={cn(
          "relative flex flex-col rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]",
          "focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          over &&
            "shadow-[inset_0_0_0_1px_var(--hr-error-500)] focus-within:shadow-[inset_0_0_0_1px_var(--hr-error-500),0_0_0_3px_color-mix(in_oklab,var(--hr-error-500)_16%,transparent)]",
        )}
      >
        <div
          role="toolbar"
          aria-label="Formatting"
          className="flex flex-wrap items-center gap-[2px] border-b border-pg-head-border px-[6px] py-[4px]"
        >
          {tools.map((t) => {
            const def = TOOL[t];
            const on = active.has(t) || popover === t;
            return (
              <button
                key={t}
                type="button"
                title={def.label}
                aria-label={def.label}
                aria-pressed={def.command && t !== "undo" && t !== "redo" ? on : undefined}
                // Keep the selection in the editor while the button is pressed.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(t)}
                className={cn(
                  "flex size-[28px] shrink-0 items-center justify-center rounded-[6px] motion-tap active:scale-90",
                  on ? "bg-brand-soft text-brand" : "text-pg-muted hover:bg-pg hover:text-pg-text",
                )}
              >
                <def.icon size={15} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {popover === "link" ? (
          <div className="absolute top-[40px] left-[6px] z-[2] flex w-[260px] max-w-[calc(100%-12px)] items-center gap-[6px] rounded-[8px] bg-pg-surface p-[6px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]">
            <input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
              }}
              placeholder="Paste a link"
              aria-label="Link URL"
              className="h-[30px] min-w-0 flex-1 rounded-[6px] bg-pg-surface px-[8px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand)] focus:outline-none"
            />
            <button
              type="button"
              onClick={applyLink}
              className="h-[30px] shrink-0 rounded-[6px] bg-brand px-[10px] text-[13px] leading-none font-semibold text-brand-fg motion-tap hover:brightness-110"
            >
              Add link
            </button>
          </div>
        ) : null}

        {popover === "color" || popover === "highlight" ? (
          <div
            role="listbox"
            aria-label={popover === "color" ? "Text color" : "Highlight color"}
            className="absolute top-[40px] left-[6px] z-[2] flex flex-wrap gap-[6px] rounded-[8px] bg-pg-surface p-[8px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {(popover === "color" ? TEXT_COLORS : HIGHLIGHTS).map((c) => (
              <button
                key={c}
                type="button"
                role="option"
                aria-selected={false}
                aria-label={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyColor(popover, c)}
                style={{ background: c }}
                className="size-[22px] rounded-[6px] shadow-[inset_0_0_0_1px_rgba(16,24,40,0.12)] motion-tap hover:scale-110"
              />
            ))}
          </div>
        ) : null}

        <div className="relative">
          {empty ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-[8px] left-[12px] text-[14px] leading-[20px] text-pg-faint"
            >
              {placeholder}
            </span>
          ) : null}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder}
            aria-invalid={over || undefined}
            onInput={emit}
            onBlur={emit}
            style={{ minHeight, height: minHeight }}
            className={cn(
              "block w-full resize-y overflow-auto px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text focus:outline-none",
              RICH_TEXT_CONTENT,
            )}
          />
        </div>
      </div>
      <span
        aria-live="polite"
        className={cn(
          "self-end text-[13px] leading-[18px]",
          over ? "text-[var(--pg-status-overdue-fg)]" : "text-pg-muted",
        )}
      >
        {length.toLocaleString("en-US")} / {maxLength.toLocaleString("en-US")} characters
      </span>
    </div>
  );
}
