"use client";

import * as React from "react";
import {
  Baseline,
  Bold,
  Code,
  CodeXml,
  File,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Send,
  Smile,
  SquareCode,
  Strikethrough,
  Subscript,
  Superscript,
  Tag,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  Underline,
  Undo2,
} from "lucide-react";
import { TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { htmlToText, safeHtml, type Snippet } from "./snippets-data";
import {
  BTN,
  BrandOutlineButton,
  FieldError,
  FieldLabel,
  ModalFooter,
  PhoneFrame,
  PopSelect,
  Popover,
} from "./snippets-ui";
import { AttachmentButton, AttachmentList, MergeFieldMenu, ToolButton } from "./snippets-text-modal";

export interface EmailDraft {
  name: string;
  subject: string;
  body: string;
  attachments: string[];
}

/*
 * Raw hex: execCommand writes the colour into the saved HTML, where a var()
 * would not survive. Mid-scale HighRise values that read on light and dark.
 */
const TEXT_COLORS = ["#101828", "#667085", "#d92d20", "#dc6803", "#079455", "#155eef", "#7839ee", "#dd2590"];
const HIGHLIGHTS = ["#fef0c7", "#d1fadf", "#d1e0ff", "#fce7f6", "#ebe9fe", "#cff9fe", "#f2f4f7"];

const BLOCKS = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "pre", label: "Preformatted" },
];
const SIZES = ["12px", "13px", "14px", "16px", "18px", "20px", "24px"].map((v) => ({ value: v, label: v }));
const LINE_HEIGHTS = ["1", "1.15", "1.5", "2"].map((v) => ({ value: v, label: v }));
const FONTS = ["Inter", "Arial", "Georgia", "Helvetica", "Times New Roman", "Verdana"].map((v) => ({ value: v, label: v }));

const ALIGNS = [
  { cmd: "justifyLeft", label: "Align left", icon: TextAlignStart },
  { cmd: "justifyCenter", label: "Align center", icon: TextAlignCenter },
  { cmd: "justifyRight", label: "Align right", icon: TextAlignEnd },
  { cmd: "justifyFull", label: "Justify", icon: TextAlignJustify },
] as const;

const STATE_COMMANDS = [
  "bold",
  "italic",
  "underline",
  "strikeThrough",
  "superscript",
  "subscript",
  "insertUnorderedList",
  "insertOrderedList",
];

/** The rendered-HTML styles preflight strips: list markers, links, quotes, headings. */
const CONTENT =
  "break-words [&_a]:text-brand [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-[20px] [&_ul]:list-disc [&_ul]:pl-[20px] [&_blockquote]:border-l-[3px] [&_blockquote]:border-pg-border [&_blockquote]:pl-[10px] [&_blockquote]:text-pg-muted [&_code]:rounded-[4px] [&_code]:bg-pg [&_code]:px-[4px] [&_code]:font-mono [&_h1]:text-[24px] [&_h1]:font-semibold [&_h2]:text-[20px] [&_h2]:font-semibold [&_h3]:text-[16px] [&_h3]:font-semibold [&_pre]:font-mono [&_img]:max-w-full";

type Pop =
  | { what: "tags" | "color" | "highlight" | "align" | "link" | "image"; anchor: HTMLElement }
  | null;

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Create / Edit email snippet.
 *
 * The body is a contentEditable driven by document.execCommand — deprecated,
 * and still the only editing API every browser ships with a working undo
 * stack. It's uncontrolled: the HTML is written into the element on mount and
 * when leaving source view, never on keystrokes, so the caret never jumps.
 * Size, line height and font style the whole body (a visual setting in this
 * prototype, not per-selection).
 */
export function EmailSnippetModal({
  snippet,
  onSave,
  onClose,
}: {
  snippet?: Snippet;
  onSave: (draft: EmailDraft) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(snippet?.name ?? "");
  const [subject, setSubject] = React.useState(snippet?.subject ?? "");
  const [html, setHtml] = React.useState(snippet?.body ?? "");
  const [files, setFiles] = React.useState<string[]>(snippet?.attachments ?? []);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const [active, setActive] = React.useState<Set<string>>(() => new Set());
  const [pop, setPop] = React.useState<Pop>(null);
  const [popUrl, setPopUrl] = React.useState("");
  const [source, setSource] = React.useState(false);
  const [embed, setEmbed] = React.useState(false);
  const [block, setBlock] = React.useState("p");
  const [size, setSize] = React.useState("14px");
  const [lineHeight, setLineHeight] = React.useState("1.5");
  const [font, setFont] = React.useState("Inter");

  const editor = React.useRef<HTMLDivElement>(null);
  const saved = React.useRef<Range | null>(null);
  const initial = React.useRef(snippet?.body ?? "");

  React.useEffect(() => {
    if (editor.current) editor.current.innerHTML = initial.current;
  }, []);

  // Pressed states follow the caret; the range is kept for popover actions.
  React.useEffect(() => {
    const onSelection = () => {
      const el = editor.current;
      const sel = document.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
      saved.current = sel.getRangeAt(0).cloneRange();
      const next = new Set<string>();
      for (const cmd of STATE_COMMANDS) {
        try {
          if (document.queryCommandState(cmd)) next.add(cmd);
        } catch {
          /* unsupported — leave unpressed */
        }
      }
      let node: Node | null = sel.anchorNode;
      while (node && node !== el) {
        if (node.nodeName === "BLOCKQUOTE") next.add("quote");
        node = node.parentNode;
      }
      setActive((prev) => (prev.size === next.size && [...next].every((x) => prev.has(x)) ? prev : next));
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  const emit = () => {
    if (editor.current) setHtml(editor.current.innerHTML);
  };

  const restore = () => {
    const el = editor.current;
    if (!el) return;
    el.focus();
    const sel = document.getSelection();
    if (sel && saved.current && el.contains(saved.current.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
  };

  const exec = (command: string, arg?: string) => {
    restore();
    document.execCommand("styleWithCSS", false, command === "hiliteColor" || command === "foreColor" ? "true" : "false");
    document.execCommand(command, false, arg);
    emit();
  };

  const selectionText = () => document.getSelection()?.toString() ?? "";

  const openPop = (what: NonNullable<Pop>["what"]) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const anchor = e.currentTarget;
    setPopUrl("");
    setPop((p) => (p?.what === what ? null : { what, anchor }));
  };
  const closePop = React.useCallback(() => setPop(null), []);

  const toggleSource = () => {
    if (source) {
      // Back to rich view: the textarea's HTML becomes the editor's.
      if (editor.current) editor.current.innerHTML = html;
    }
    setSource((s) => !s);
  };

  const plain = htmlToText(html.replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")).trim();
  const words = plain ? plain.split(/\s+/).length : 0;
  const hasMedia = /<img\b/i.test(html);
  const nameMissing = !name.trim();
  const subjectMissing = !subject.trim();
  const bodyMissing = !plain && !hasMedia;

  const save = () => {
    setTried(true);
    if (nameMissing || subjectMissing || bodyMissing) return;
    onSave({ name: name.trim(), subject: subject.trim(), body: html, attachments: files });
  };

  const bodyStyle: React.CSSProperties = { fontSize: size, lineHeight, fontFamily: font };

  return (
    <Modal
      width={1020}
      title={snippet ? "Edit email snippet" : "Create email snippet"}
      onClose={onClose}
      footer={
        <ModalFooter>
          <OutlineButton className={BTN} onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton className={BTN} onClick={save}>
            Save
          </PrimaryButton>
        </ModalFooter>
      }
    >
      <p className="-mt-[8px] text-[13px] leading-[18px] text-pg-muted">
        Save your go-to emails and reuse them from any conversation.
      </p>

      <div className="flex gap-[24px] pt-[8px] pb-[8px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
          <div className="flex flex-col gap-[4px]">
            <FieldLabel required htmlFor="email-snippet-name">
              Name
            </FieldLabel>
            <TextInput
              id="email-snippet-name"
              autoFocus
              value={name}
              placeholder="Enter a snippet name"
              aria-invalid={tried && nameMissing}
              onChange={(e) => setName(e.target.value)}
            />
            {tried && nameMissing ? <FieldError>Enter a name.</FieldError> : null}
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel required htmlFor="email-snippet-subject">
              Subject
            </FieldLabel>
            <TextInput
              id="email-snippet-subject"
              value={subject}
              placeholder="Enter a subject"
              aria-invalid={tried && subjectMissing}
              onChange={(e) => setSubject(e.target.value)}
            />
            {tried && subjectMissing ? <FieldError>Enter a subject.</FieldError> : null}
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel required>Snippet body</FieldLabel>
            <div className="flex flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <div role="toolbar" aria-label="Formatting" className="flex flex-col gap-[4px] border-b border-pg-head-border px-[6px] py-[6px]">
                <div className="flex flex-wrap items-center gap-[2px]">
                  <ToolButton label="Undo" onClick={() => exec("undo")}>
                    <Undo2 size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Redo" onClick={() => exec("redo")}>
                    <Redo2 size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Insert emoji" onClick={() => exec("insertText", "🙂")}>
                    <Smile size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Insert merge field" on={pop?.what === "tags"} onClick={openPop("tags")}>
                    <Tag size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Bold" on={active.has("bold")} onClick={() => exec("bold")}>
                    <Bold size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Italic" on={active.has("italic")} onClick={() => exec("italic")}>
                    <Italic size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Underline" on={active.has("underline")} onClick={() => exec("underline")}>
                    <Underline size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Text color" on={pop?.what === "color"} onClick={openPop("color")}>
                    <Baseline size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Highlight" on={pop?.what === "highlight"} onClick={openPop("highlight")}>
                    <Highlighter size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Bulleted list" on={active.has("insertUnorderedList")} onClick={() => exec("insertUnorderedList")}>
                    <List size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Numbered list" on={active.has("insertOrderedList")} onClick={() => exec("insertOrderedList")}>
                    <ListOrdered size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Align" on={pop?.what === "align"} onClick={openPop("align")}>
                    <TextAlignStart size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Strikethrough" on={active.has("strikeThrough")} onClick={() => exec("strikeThrough")}>
                    <Strikethrough size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Superscript" on={active.has("superscript")} onClick={() => exec("superscript")}>
                    <Superscript size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Subscript" on={active.has("subscript")} onClick={() => exec("subscript")}>
                    <Subscript size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton
                    label="Inline code"
                    onClick={() => {
                      restore();
                      const t = selectionText();
                      exec("insertHTML", `<code>${escapeHtml(t || "code")}</code>&nbsp;`);
                    }}
                  >
                    <CodeXml size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Embed" on={embed} onClick={() => setEmbed((v) => !v)}>
                    <SquareCode size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton
                    label="Quote"
                    on={active.has("quote")}
                    onClick={() => exec("formatBlock", active.has("quote") ? "p" : "blockquote")}
                  >
                    <Quote size={16} aria-hidden="true" />
                  </ToolButton>
                </div>
                <div className="flex flex-wrap items-center gap-[2px]">
                  <ToolButton
                    label="Clear formatting"
                    onClick={() => {
                      exec("removeFormat");
                      exec("formatBlock", "p");
                      setBlock("p");
                    }}
                  >
                    <RemoveFormatting size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Link" on={pop?.what === "link"} onClick={openPop("link")}>
                    <Link size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Image" on={pop?.what === "image"} onClick={openPop("image")}>
                    <ImageIcon size={16} aria-hidden="true" />
                  </ToolButton>
                  <ToolButton label="Source code" on={source} onClick={toggleSource}>
                    <Code size={16} aria-hidden="true" />
                  </ToolButton>
                  <div className="ml-[4px] flex flex-wrap items-center gap-[6px]">
                    <PopSelect
                      size="sm"
                      aria-label="Block style"
                      className="w-[150px]"
                      value={block}
                      options={BLOCKS}
                      onChange={(v) => {
                        setBlock(v);
                        exec("formatBlock", v);
                      }}
                    />
                    <PopSelect size="sm" aria-label="Font size" className="w-[90px]" value={size} options={SIZES} onChange={setSize} />
                    <PopSelect
                      size="sm"
                      aria-label="Line height"
                      className="w-[76px]"
                      value={lineHeight}
                      options={LINE_HEIGHTS}
                      onChange={setLineHeight}
                    />
                    <PopSelect size="sm" aria-label="Font" className="w-[150px]" value={font} options={FONTS} onChange={setFont} />
                  </div>
                </div>
              </div>

              {source ? (
                <textarea
                  aria-label="HTML source"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="h-[160px] resize-y bg-transparent px-[12px] py-[10px] font-mono text-[13px] leading-[18px] text-pg-text focus:outline-none"
                />
              ) : null}
              <div className={cn("relative", source && "hidden")}>
                {bodyMissing ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[10px] left-[12px] text-[14px] leading-[20px] text-pg-faint"
                  >
                    Type a message
                  </span>
                ) : null}
                <div
                  ref={editor}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Snippet body"
                  aria-invalid={tried && bodyMissing}
                  onInput={emit}
                  onBlur={emit}
                  style={bodyStyle}
                  className={cn(
                    "block h-[160px] min-h-[100px] w-full resize-y overflow-auto px-[12px] py-[10px] text-pg-text focus:outline-none",
                    CONTENT,
                  )}
                />
              </div>
              <div className="flex items-center justify-end border-t border-pg-head-border bg-pg px-[12px] py-[8px] text-[13px] leading-[18px] text-pg-muted tabular-nums">
                {[...plain].length.toLocaleString("en-US")} characters | {words.toLocaleString("en-US")} words
              </div>
            </div>
            {tried && bodyMissing ? <FieldError>Enter a snippet body.</FieldError> : null}
          </div>

          <AttachmentList files={files} onRemove={(i) => setFiles((f) => f.filter((_, j) => j !== i))} />
          <AttachmentButton onAdd={(names) => setFiles((f) => [...f, ...names])} />

          <div className="flex flex-col gap-[4px]">
            <FieldLabel>Test email snippet</FieldLabel>
            <div className="grid grid-cols-2 gap-[8px]">
              <TextInput
                type="email"
                aria-label="From email"
                value={from}
                placeholder="From email"
                onChange={(e) => setFrom(e.target.value)}
              />
              <TextInput
                type="email"
                aria-label="To email"
                value={to}
                placeholder="To email"
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <BrandOutlineButton
              className="mt-[4px] self-end"
              disabled={!from.trim() || !to.trim()}
              onClick={() => showToast(`Test sent to ${to.trim()}.`)}
            >
              <Send size={16} aria-hidden="true" />
              Send test
            </BrandOutlineButton>
          </div>
        </div>

        <PhoneFrame>
          <EmailPreview subject={subject} html={html} files={files} style={bodyStyle} empty={bodyMissing && !subject.trim()} />
        </PhoneFrame>
      </div>

      {pop?.what === "tags" ? (
        <MergeFieldMenu anchor={pop.anchor} onClose={closePop} onPick={(t) => exec("insertText", t)} />
      ) : null}
      {pop?.what === "color" || pop?.what === "highlight" ? (
        <Popover anchor={pop.anchor} onClose={closePop} label={pop.what === "color" ? "Text color" : "Highlight color"}>
          <div className="flex w-[176px] flex-wrap gap-[6px] p-[6px]">
            {(pop.what === "color" ? TEXT_COLORS : HIGHLIGHTS).map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const cmd = pop.what === "color" ? "foreColor" : "hiliteColor";
                  setPop(null);
                  exec(cmd, c);
                }}
                style={{ background: c }}
                className="size-[22px] rounded-[6px] shadow-[inset_0_0_0_1px_rgba(16,24,40,0.12)] motion-tap hover:scale-110"
              />
            ))}
          </div>
        </Popover>
      ) : null}
      {pop?.what === "align" ? (
        <Popover anchor={pop.anchor} onClose={closePop} label="Align">
          <div className="flex gap-[2px]">
            {ALIGNS.map((a) => (
              <ToolButton
                key={a.cmd}
                label={a.label}
                onClick={() => {
                  setPop(null);
                  exec(a.cmd);
                }}
              >
                <a.icon size={16} aria-hidden="true" />
              </ToolButton>
            ))}
          </div>
        </Popover>
      ) : null}
      {pop?.what === "link" || pop?.what === "image" ? (
        <Popover anchor={pop.anchor} onClose={closePop} width={300} label={pop.what === "link" ? "Add a link" : "Add an image"}>
          <form
            className="flex items-center gap-[6px] p-[4px]"
            onSubmit={(e) => {
              e.preventDefault();
              const raw = popUrl.trim();
              const kind = pop.what;
              setPop(null);
              if (!raw) return;
              const url = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
              if (kind === "image") {
                exec("insertHTML", `<img src="${escapeHtml(url)}" alt="" />`);
                return;
              }
              restore();
              if (selectionText()) exec("createLink", url);
              else exec("insertHTML", `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>&nbsp;`);
            }}
          >
            <TextInput
              autoFocus
              value={popUrl}
              onChange={(e) => setPopUrl(e.target.value)}
              placeholder={pop.what === "link" ? "Paste a link" : "Paste an image URL"}
              aria-label={pop.what === "link" ? "Link URL" : "Image URL"}
              className="h-[32px] text-[13px]"
            />
            <button
              type="submit"
              className="h-[32px] shrink-0 rounded-[6px] bg-brand px-[10px] text-[13px] leading-none font-semibold text-brand-fg motion-tap hover:brightness-110"
            >
              Add
            </button>
          </form>
        </Popover>
      ) : null}
    </Modal>
  );
}

/** A received email on the phone: subject, sender, body and attachments. */
function EmailPreview({
  subject,
  html,
  files,
  style,
  empty,
}: {
  subject: string;
  html: string;
  files: string[];
  style: React.CSSProperties;
  empty: boolean;
}) {
  if (empty) {
    return (
      <p className="m-auto px-[16px] text-center text-[13px] leading-[18px] text-[#98a2b3]">
        Your email preview shows here.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-[10px] pt-[8px] text-[#101828]">
      <p className="text-[16px] leading-[22px] font-semibold break-words">{subject || "No subject"}</p>
      <div className="flex items-center gap-[8px] border-b border-[#eaecf0] pb-[10px]">
        <span className="flex size-[28px] items-center justify-center rounded-full bg-brand text-[12px] font-semibold text-brand-fg">
          Y
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[13px] leading-[18px] font-medium">You</span>
          <span className="text-[12px] leading-[16px] text-[#667085]">to {"{{contact.email}}"}</span>
        </span>
      </div>
      <div
        style={style}
        className={cn(CONTENT, "[&_blockquote]:border-[#d0d5dd] [&_blockquote]:text-[#667085] [&_code]:bg-[#f2f4f7]")}
        dangerouslySetInnerHTML={{ __html: safeHtml(html) }}
      />
      {files.length > 0 ? (
        <div className="flex flex-col gap-[6px] pt-[4px]">
          {files.map((f, i) => (
            <span
              key={`${f}-${i}`}
              className="flex items-center gap-[8px] rounded-[8px] bg-[#f2f4f7] px-[10px] py-[6px] text-[12px] leading-[16px] break-all text-[#344054]"
            >
              <File size={14} aria-hidden="true" className="shrink-0 text-brand" />
              {f}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
