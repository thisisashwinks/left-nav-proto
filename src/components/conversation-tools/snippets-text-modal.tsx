"use client";

import * as React from "react";
import { File, Info, Plus, Send, Smile, Tag, Upload, X } from "lucide-react";
import { TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { MERGE_FIELDS, fileNameFromUrl, smsStats, type Snippet } from "./snippets-data";
import {
  BTN,
  BrandOutlineButton,
  FieldError,
  FieldLabel,
  ModalFooter,
  PhoneFrame,
  Popover,
  useAnchor,
} from "./snippets-ui";

export interface TextDraft {
  name: string;
  body: string;
  attachments: string[];
}

/* ─── Shared compose pieces ─────────────────────────────────────────────── */

/** The merge-field menu the tag button opens, grouped Contact / Account / Appointment. */
export function MergeFieldMenu({
  anchor,
  onClose,
  onPick,
}: {
  anchor: HTMLElement;
  onClose: () => void;
  onPick: (token: string) => void;
}) {
  return (
    <Popover anchor={anchor} onClose={onClose} width={260} label="Insert a merge field">
      {MERGE_FIELDS.map((g) => (
        <div key={g.group} className="flex flex-col py-[2px]">
          <p className="px-[10px] pt-[6px] pb-[2px] text-[12px] leading-[16px] font-semibold text-pg-muted">
            {g.group}
          </p>
          {g.fields.map((f) => (
            <button
              key={f.token}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(f.token);
                onClose();
              }}
              className="flex h-[34px] w-full items-center justify-between gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] text-pg-text motion-tap hover:bg-pg"
            >
              <span className="truncate">{f.label}</span>
              <span className="truncate text-[12px] leading-[16px] text-pg-faint">{f.token}</span>
            </button>
          ))}
        </div>
      ))}
    </Popover>
  );
}

export function AttachmentList({ files, onRemove }: { files: string[]; onRemove: (i: number) => void }) {
  if (files.length === 0) return null;
  return (
    <ul className="flex flex-col gap-[6px]">
      {files.map((f, i) => (
        <li key={`${f}-${i}`} className="flex items-center gap-[8px] text-[14px] leading-[20px] text-pg-text">
          <File size={16} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="min-w-0 truncate">{f}</span>
          <button
            type="button"
            aria-label={`Remove ${f}`}
            title="Remove"
            onClick={() => onRemove(i)}
            className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-pg-danger motion-tap hover:bg-[color-mix(in_oklab,var(--hr-error-500)_10%,transparent)]"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Add attachment — a brand outline over a hidden file input. */
export function AttachmentButton({ onAdd }: { onAdd: (names: string[]) => void }) {
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <BrandOutlineButton className="self-start" onClick={() => input.current?.click()}>
        <Upload size={16} aria-hidden="true" />
        Add attachment
      </BrandOutlineButton>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const names = Array.from(e.target.files ?? []).map((f) => f.name);
          if (names.length) onAdd(names);
          e.target.value = "";
        }}
      />
    </>
  );
}

export function ToolButton({
  label,
  onClick,
  on,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  on?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={
        on
          ? "flex size-[28px] shrink-0 items-center justify-center rounded-[6px] bg-brand-soft text-brand motion-tap"
          : "flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text"
      }
    >
      {children}
    </button>
  );
}

/* ─── The modal ─────────────────────────────────────────────────────────── */

/**
 * Create / Edit text snippet — the form on the left, a live phone preview
 * on the right. Counts, segments and cost are derived from the body on every
 * render: 160 characters a segment, $0.0079 a segment, rounded up to cents.
 */
export function TextSnippetModal({
  snippet,
  onSave,
  onClose,
}: {
  snippet?: Snippet;
  onSave: (draft: TextDraft) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(snippet?.name ?? "");
  const [body, setBody] = React.useState(snippet?.body ?? "");
  const [files, setFiles] = React.useState<string[]>(snippet?.attachments ?? []);
  const [url, setUrl] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const tags = useAnchor();
  const area = React.useRef<HTMLTextAreaElement>(null);

  const stats = smsStats(body);
  const nameMissing = !name.trim();
  const bodyMissing = !body.trim();

  const insert = (text: string) => {
    const el = area.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + text + body.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const addUrl = () => {
    if (!url.trim()) return;
    setFiles((f) => [...f, fileNameFromUrl(url)]);
    setUrl("");
  };

  const save = () => {
    setTried(true);
    if (nameMissing || bodyMissing) return;
    onSave({ name: name.trim(), body, attachments: files });
  };

  return (
    <Modal
      width={980}
      title={snippet ? "Edit text snippet" : "Create text snippet"}
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
        Save your go-to phrases and reuse them from any message.
      </p>

      <div className="flex gap-[24px] pt-[8px] pb-[8px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
          <div className="flex flex-col gap-[4px]">
            <FieldLabel required htmlFor="text-snippet-name">
              Name
            </FieldLabel>
            <TextInput
              id="text-snippet-name"
              autoFocus
              value={name}
              placeholder="Enter a snippet name"
              aria-invalid={tried && nameMissing}
              onChange={(e) => setName(e.target.value)}
            />
            {tried && nameMissing ? <FieldError>Enter a name.</FieldError> : null}
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel required htmlFor="text-snippet-body">
              Snippet body
            </FieldLabel>
            <div className="flex flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <div role="toolbar" aria-label="Insert" className="flex items-center gap-[2px] border-b border-pg-head-border px-[6px] py-[4px]">
                <ToolButton label="Insert emoji" onClick={() => insert("🙂")}>
                  <Smile size={16} aria-hidden="true" />
                </ToolButton>
                <ToolButton label="Insert merge field" on={Boolean(tags.anchor)} onClick={tags.toggle}>
                  <Tag size={16} aria-hidden="true" />
                </ToolButton>
              </div>
              <textarea
                id="text-snippet-body"
                ref={area}
                value={body}
                placeholder="Type a message"
                aria-invalid={tried && bodyMissing}
                onChange={(e) => setBody(e.target.value)}
                className="h-[140px] resize-y bg-transparent px-[12px] py-[10px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
              <div className="flex items-center justify-between gap-[12px] border-t border-pg-head-border bg-pg px-[12px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                <span className="flex items-center gap-[4px]">
                  Approximate cost: ${stats.cost.toFixed(2)}
                  <span title="Estimated at $0.0079 per 160-character segment. Carrier fees may apply." className="flex">
                    <Info size={14} aria-label="About the cost estimate" />
                  </span>
                </span>
                <span className="tabular-nums">
                  {stats.chars.toLocaleString("en-US")} characters | {stats.words.toLocaleString("en-US")} words |{" "}
                  {stats.segs} segs
                </span>
              </div>
            </div>
            {tried && bodyMissing ? <FieldError>Enter a snippet body.</FieldError> : null}
          </div>

          <AttachmentList files={files} onRemove={(i) => setFiles((f) => f.filter((_, j) => j !== i))} />
          <AttachmentButton onAdd={(names) => setFiles((f) => [...f, ...names])} />

          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="text-snippet-url">Add file through URL</FieldLabel>
            <div className="flex gap-[8px]">
              <TextInput
                id="text-snippet-url"
                value={url}
                placeholder="Enter a URL"
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrl();
                  }
                }}
              />
              <BrandOutlineButton disabled={!url.trim()} onClick={addUrl}>
                <Plus size={16} aria-hidden="true" />
                Add
              </BrandOutlineButton>
            </div>
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="text-snippet-phone">Test snippet</FieldLabel>
            <div className="flex gap-[8px]">
              <TextInput
                id="text-snippet-phone"
                type="tel"
                value={phone}
                placeholder="Enter a phone number"
                onChange={(e) => setPhone(e.target.value)}
              />
              <BrandOutlineButton
                disabled={!phone.trim() || bodyMissing}
                onClick={() => showToast(`Test sent to ${phone.trim()}.`)}
              >
                <Send size={16} aria-hidden="true" />
                Send
              </BrandOutlineButton>
            </div>
          </div>
        </div>

        <PhoneFrame>
          <MessagePreview body={body} files={files} />
        </PhoneFrame>
      </div>

      {tags.anchor ? <MergeFieldMenu anchor={tags.anchor} onClose={tags.close} onPick={insert} /> : null}
    </Modal>
  );
}

/** An outbound SMS thread: the bubble, its attachments and a read receipt. */
export function MessagePreview({ body, files }: { body: string; files: string[] }) {
  const empty = !body.trim() && files.length === 0;
  return (
    <div className="flex flex-1 flex-col justify-end gap-[6px] pt-[12px]">
      {empty ? (
        <p className="m-auto px-[16px] text-center text-[13px] leading-[18px] text-[#98a2b3]">
          Your message preview shows here.
        </p>
      ) : (
        <>
          {body.trim() ? (
            <div className="ml-auto max-w-[85%] rounded-[18px] rounded-br-[4px] bg-brand px-[14px] py-[8px] text-[14px] leading-[20px] break-words whitespace-pre-wrap text-brand-fg">
              {body}
            </div>
          ) : null}
          {files.map((f, i) => (
            <div
              key={`${f}-${i}`}
              className="ml-auto flex max-w-[85%] items-center gap-[8px] rounded-[12px] bg-[#f2f4f7] px-[12px] py-[8px] text-[13px] leading-[18px] break-all text-[#344054]"
            >
              <File size={16} aria-hidden="true" className="shrink-0 text-brand" />
              {f}
            </div>
          ))}
          <span className="self-end text-[12px] leading-[16px] text-[#98a2b3]">Read 15:29</span>
        </>
      )}
    </div>
  );
}
