"use client";

import * as React from "react";
import {
  Baseline,
  Bold,
  ChevronDown,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
  Tag,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignStart,
  Underline,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The builder's own composite fields — the ones only the four core sections
 * draw: a text input with the merge-field tag at its right edge, the
 * description editor, and a person's initials disc.
 */

const MERGE_FIELDS = [
  { value: "{{contact.name}}", label: "Contact full name" },
  { value: "{{contact.first_name}}", label: "Contact first name" },
  { value: "{{contact.last_name}}", label: "Contact last name" },
  { value: "{{contact.email}}", label: "Contact email" },
  { value: "{{contact.phone}}", label: "Contact phone" },
  { value: "{{user.name}}", label: "Assigned user name" },
  { value: "{{location.name}}", label: "Business name" },
];

const WRAP =
  "relative flex h-[36px] w-full items-stretch rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";
const WRAP_ERROR =
  "shadow-[inset_0_0_0_1px_var(--hr-error-500)] focus-within:shadow-[inset_0_0_0_1px_var(--hr-error-500),0_0_0_3px_color-mix(in_oklab,var(--hr-error-500)_18%,transparent)]";

/**
 * A text input whose tag glyph opens the merge fields and drops the chosen
 * one in at the caret — so "{{contact.name}}" is picked, never typed wrong.
 */
export function MergeFieldInput({
  value,
  onChange,
  placeholder,
  error,
  trailing,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  /** A control sharing the field's border, past the tag — "Add display label". */
  trailing?: React.ReactNode;
  "aria-label"?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);

  const insert = (token: string) => {
    const el = inputRef.current;
    const at = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? at;
    onChange(value.slice(0, at) + token + value.slice(end));
    setOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + token.length, at + token.length);
    });
  };

  return (
    <div className={cn(WRAP, error && WRAP_ERROR)}>
      <input
        ref={inputRef}
        value={value}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 rounded-[8px] bg-transparent px-[12px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
      />
      <button
        type="button"
        aria-label="Insert merge field"
        title="Insert merge field"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="motion-tap flex w-[36px] shrink-0 items-center justify-center text-pg-text-strong hover:text-brand"
      >
        <Tag size={16} aria-hidden="true" />
      </button>
      {trailing ? (
        <div className="flex shrink-0 items-stretch border-l border-pg-border">{trailing}</div>
      ) : null}
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close merge fields"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            className="absolute top-[calc(100%+4px)] right-0 z-40 flex w-[240px] flex-col rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            <span className="px-[8px] pt-[4px] pb-[6px] text-[12px] leading-[16px] font-medium text-pg-muted">
              Merge fields
            </span>
            {MERGE_FIELDS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="menuitem"
                onClick={() => insert(f.value)}
                className="flex flex-col items-start rounded-[6px] px-[8px] py-[6px] text-left hover:bg-pg"
              >
                <span className="text-[14px] leading-[20px] text-pg-text-strong">{f.label}</span>
                <span className="text-[12px] leading-[16px] text-pg-muted">{f.value}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** A person's initials in a grey disc — the staff rows' avatar. */
export function StaffAvatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-pg text-[13px] leading-none font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-row-border)]"
    >
      {initials}
    </span>
  );
}

/* ─── Description editor ─────────────────────────────────────────────── */

const BLOCKS = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "blockquote", label: "Quote" },
];

const ALIGNS: { cmd: string; icon: LucideIcon; label: string }[] = [
  { cmd: "justifyLeft", icon: TextAlignStart, label: "Align left" },
  { cmd: "justifyCenter", icon: TextAlignCenter, label: "Align center" },
  { cmd: "justifyRight", icon: TextAlignEnd, label: "Align right" },
];

const isBlank = (html: string) =>
  html.replace(/<br\s*\/?>/g, "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim() === "";

/**
 * The description's editor, on contentEditable and execCommand.
 *
 * execCommand is deprecated but still does all of this in every browser, and
 * a prototype has no business shipping an editor framework to prove a
 * toolbar works. The editable is uncontrolled — seeded once, reported on
 * every input — because re-rendering its HTML would throw the caret to the
 * start on every keystroke.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [seed] = React.useState(value);
  const [block, setBlock] = React.useState("p");
  const [align, setAlign] = React.useState(0);

  const report = () => onChange(editorRef.current?.innerHTML ?? "");
  const run = (cmd: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    report();
  };
  const syncBlock = () => {
    const v = String(document.queryCommandValue("formatBlock") || "p").toLowerCase();
    setBlock(BLOCKS.some((b) => b.value === v) ? v : "p");
  };

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex flex-wrap items-center gap-[4px] rounded-[8px] bg-pg-surface px-[8px] py-[4px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <ToolButton icon={Bold} label="Bold" onClick={() => run("bold")} />
        <ToolButton icon={Italic} label="Italic" onClick={() => run("italic")} />
        <ToolButton icon={Underline} label="Underline" onClick={() => run("underline")} />
        <ToolButton icon={Strikethrough} label="Strikethrough" onClick={() => run("strikeThrough")} />
        <ToolButton
          icon={Link2}
          label="Insert link"
          onClick={() => {
            const url = window.prompt("Link URL", "https://");
            if (url) run("createLink", url);
          }}
        />
        <ToolButton
          icon={RemoveFormatting}
          label="Clear formatting"
          onClick={() => {
            run("removeFormat");
            run("unlink");
          }}
        />
        <ColorTool icon={Baseline} label="Text color" fallback="#101828" onPick={(c) => run("foreColor", c)} />
        <ColorTool icon={Highlighter} label="Highlight" fallback="#fef08a" onPick={(c) => run("hiliteColor", c)} />
        <label className="relative ml-[2px] flex w-[184px] items-center">
          <select
            value={block}
            aria-label="Text style"
            onChange={(e) => {
              setBlock(e.target.value);
              run("formatBlock", `<${e.target.value}>`);
            }}
            className="h-[28px] w-full cursor-pointer appearance-none rounded-[6px] bg-pg-surface pr-[28px] pl-[10px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none"
          >
            {BLOCKS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute right-[8px] text-pg-faint"
          />
        </label>
        <span aria-hidden="true" className="mx-[4px] h-[18px] w-px bg-[var(--pg-border)]" />
        <ToolButton
          icon={ALIGNS[align]!.icon}
          label={ALIGNS[align]!.label}
          onClick={() => {
            // One button that steps left → center → right, as the live toolbar's.
            const next = (align + 1) % ALIGNS.length;
            setAlign(next);
            run(ALIGNS[next]!.cmd);
          }}
        />
        <ToolButton icon={List} label="Bulleted list" onClick={() => run("insertUnorderedList")} />
        <ToolButton icon={ListOrdered} label="Numbered list" onClick={() => run("insertOrderedList")} />
      </div>
      <div className="relative">
        {isBlank(value) && placeholder ? (
          <span className="pointer-events-none absolute top-[10px] left-[14px] text-[14px] leading-[20px] text-pg-faint">
            {placeholder}
          </span>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="Description"
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: seed }}
          onInput={report}
          onKeyUp={syncBlock}
          onMouseUp={syncBlock}
          className="min-h-[92px] rounded-[8px] bg-pg-surface px-[14px] py-[10px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-pg-border [&_blockquote]:pl-[10px] [&_h1]:text-[20px] [&_h1]:leading-[28px] [&_h1]:font-semibold [&_h2]:text-[18px] [&_h2]:leading-[26px] [&_h2]:font-semibold [&_h3]:text-[16px] [&_h3]:leading-[24px] [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-[20px] [&_ul]:list-disc [&_ul]:pl-[20px]"
        />
      </div>
    </div>
  );
}

function ToolButton({
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
      // Keep the selection in the editor: a mousedown on the button would
      // otherwise blur it and the command would land on nothing.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-text-strong hover:bg-pg hover:text-pg-heading"
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}

/** A glyph over an invisible native colour input — text colour, highlight. */
function ColorTool({
  icon: Icon,
  label,
  fallback,
  onPick,
}: {
  icon: LucideIcon;
  label: string;
  fallback: string;
  onPick: (color: string) => void;
}) {
  return (
    <label
      title={label}
      className="motion-tap relative flex size-[28px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-pg-text-strong hover:bg-pg"
    >
      <Icon size={16} aria-hidden="true" />
      <input
        type="color"
        aria-label={label}
        defaultValue={fallback}
        onChange={(e) => onPick(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}
