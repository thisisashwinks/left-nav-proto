"use client";

import * as React from "react";
import { Check, Copy, Download, LoaderCircle, Sparkles, Trash2 } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { Select } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  CONTENT_TYPES,
  IMAGE_STYLES,
  IMAGE_TYPES,
  PRICE_PER_1K_WORDS,
  PRICE_PER_IMAGE,
  RESOLUTIONS,
  TYPE_LABEL,
  draftVariations,
  fmt,
  formatDate,
  formatTime,
  money,
  nowStamp,
  randomTxn,
  rowWords,
  wordCount,
  type ContentType,
  type ImageRow,
  type TextRow,
} from "./content-ai-data";
import { DangerButton, Field, TextArea, Thumb } from "./content-ai-ui";

const BTN = "h-[36px] text-[14px]";

const TONES = ["Professional", "Friendly", "Persuasive", "Playful"].map((t) => ({
  value: t,
  label: t,
}));
const LENGTHS = [
  { value: "short", label: "Short", hint: "About 20 words" },
  { value: "medium", label: "Medium", hint: "About 40 words" },
  { value: "long", label: "Long", hint: "About 80 words" },
];
const COUNT = (max: number, noun: string) =>
  Array.from({ length: max }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} ${noun}${i === 0 ? "" : "s"}`,
  }));

/** The short wait that makes "Generate" read as generating. */
function useGenerating() {
  const [busy, setBusy] = React.useState(false);
  const timer = React.useRef<number | null>(null);
  React.useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const run = (fn: () => void) => {
    setBusy(true);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      fn();
    }, 900);
  };
  return { busy, run };
}

function GenerateButton({
  busy,
  disabled,
  onClick,
  label,
}: {
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <PrimaryButton
      className={cn(BTN, (disabled || busy) && "pointer-events-none opacity-60")}
      disabled={disabled || busy}
      onClick={onClick}
    >
      {busy ? (
        <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />
      ) : (
        <Sparkles size={16} aria-hidden="true" />
      )}
      {busy ? "Generating…" : label}
    </PrimaryButton>
  );
}

/* --------------------------------------------------------------- text form */

/**
 * Generate text, or edit a row that already exists.
 *
 * Editing works on the variations directly — the brief that produced them is
 * gone by then, and regenerating would throw away the copy someone came back
 * to fix.
 */
export function TextModal({
  row,
  onClose,
  onSave,
}: {
  row?: TextRow;
  onClose: () => void;
  onSave: (row: TextRow) => void;
}) {
  const editing = !!row;
  const [brief, setBrief] = React.useState("");
  const [type, setType] = React.useState<ContentType>(row?.type ?? "social");
  const [tone, setTone] = React.useState(row?.tone ?? "Friendly");
  const [length, setLength] = React.useState("short");
  const [count, setCount] = React.useState("3");
  const [variations, setVariations] = React.useState<string[]>(row?.variations ?? []);
  const { busy, run } = useGenerating();

  const words = Math.round(
    wordCount(brief) * Number(count) * (length === "short" ? 1.3 : length === "medium" ? 3 : 6),
  );

  const generate = () =>
    run(() => {
      const v = draftVariations(brief, tone, length, Number(count));
      const next: TextRow = {
        id: `txt-${Date.now()}`,
        at: nowStamp(),
        variations: v,
        txn: randomTxn(),
        type,
        tone,
      };
      onSave(next);
      showToast(
        `Generated ${v.length} ${v.length === 1 ? "variation" : "variations"} · ${fmt(rowWords(next))} words`,
      );
    });

  const save = () => {
    if (!row) return;
    const cleaned = variations.map((v) => v.trim()).filter(Boolean);
    onSave({ ...row, type, tone, variations: cleaned });
    showToast("Changes saved");
  };

  return (
    <Modal
      title={editing ? "Edit content" : "Generate text"}
      width={560}
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton className={BTN} onClick={onClose}>
            Cancel
          </OutlineButton>
          {editing ? (
            <PrimaryButton
              className={cn(BTN, !variations.some((v) => v.trim()) && "pointer-events-none opacity-60")}
              onClick={save}
            >
              Save changes
            </PrimaryButton>
          ) : (
            <GenerateButton
              busy={busy}
              disabled={!brief.trim()}
              onClick={generate}
              label="Generate"
            />
          )}
        </>
      }
    >
      {editing ? (
        <div className="flex flex-col gap-[12px]">
          {variations.map((v, i) => (
            <Field key={i} label={`Variation ${i + 1}`} hint={`${fmt(wordCount(v))} words`}>
              <TextArea
                value={v}
                rows={3}
                className="min-h-[72px]"
                onChange={(e) =>
                  setVariations((xs) => xs.map((x, k) => (k === i ? e.target.value : x)))
                }
              />
            </Field>
          ))}
        </div>
      ) : (
        <Field label="What should we write?" hint="Describe the topic, offer, or audience.">
          <TextArea
            autoFocus
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Announce our fall menu and invite regulars to try the pumpkin chai latte"
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-[16px]">
        <Field label="Used in">
          <Select
            aria-label="Used in"
            value={type}
            options={CONTENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(v) => setType(v as ContentType)}
          />
        </Field>
        <Field label="Tone">
          <Select aria-label="Tone" value={tone} options={TONES} onChange={setTone} />
        </Field>
        {editing ? null : (
          <>
            <Field label="Length">
              <Select aria-label="Length" value={length} options={LENGTHS} onChange={setLength} />
            </Field>
            <Field label="Variations">
              <Select
                aria-label="Variations"
                value={count}
                options={COUNT(5, "variation")}
                onChange={setCount}
              />
            </Field>
          </>
        )}
      </div>

      {editing ? null : (
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Estimated {fmt(words)} words · {money((words / 1000) * PRICE_PER_1K_WORDS)} at{" "}
          {money(PRICE_PER_1K_WORDS)} per 1,000 words
        </p>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------- image form */

export function ImageModal({
  row,
  onClose,
  onSave,
}: {
  row?: ImageRow;
  onClose: () => void;
  onSave: (row: ImageRow) => void;
}) {
  const editing = !!row;
  const [prompt, setPrompt] = React.useState(row?.prompt ?? "");
  const [type, setType] = React.useState<ContentType>(row?.type ?? "social");
  const [style, setStyle] = React.useState<string>(row?.style ?? "Photographic");
  const [resolution, setResolution] = React.useState<string>(row?.resolution ?? "1024 × 1024");
  const [count, setCount] = React.useState("4");
  const { busy, run } = useGenerating();

  const generate = () =>
    run(() => {
      const n = Number(count);
      const seed = Math.floor(Math.random() * 360);
      onSave({
        id: `img-${Date.now()}`,
        at: nowStamp(),
        prompt: prompt.trim(),
        images: Array.from({ length: n }, (_, k) => (seed + k * 37) % 360),
        txn: randomTxn(),
        type,
        style,
        resolution,
      });
      showToast(`Generated ${n} ${n === 1 ? "image" : "images"}`);
    });

  const save = () => {
    if (!row) return;
    onSave({ ...row, prompt: prompt.trim(), type });
    showToast("Changes saved");
  };

  return (
    <Modal
      title={editing ? "Edit image details" : "Generate image"}
      width={560}
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton className={BTN} onClick={onClose}>
            Cancel
          </OutlineButton>
          {editing ? (
            <PrimaryButton
              className={cn(BTN, !prompt.trim() && "pointer-events-none opacity-60")}
              onClick={save}
            >
              Save changes
            </PrimaryButton>
          ) : (
            <GenerateButton
              busy={busy}
              disabled={!prompt.trim()}
              onClick={generate}
              label="Generate"
            />
          )}
        </>
      }
    >
      {editing ? (
        <div className="flex gap-[8px]">
          {row.images.map((h, i) => (
            <Thumb key={i} hue={h} size={64} className="rounded-[8px]" />
          ))}
        </div>
      ) : null}
      <Field
        label="Prompt"
        hint={editing ? "Renaming the prompt does not change the images." : "Describe the subject, setting, and mood."}
      >
        <TextArea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Cozy coffee shop interior at golden hour, steam rising from a latte"
        />
      </Field>
      <div className="grid grid-cols-2 gap-[16px]">
        <Field label="Used in">
          <Select
            aria-label="Used in"
            value={type}
            options={IMAGE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(v) => setType(v as ContentType)}
          />
        </Field>
        {editing ? null : (
          <>
            <Field label="Style">
              <Select
                aria-label="Style"
                value={style}
                options={IMAGE_STYLES.map((s) => ({ value: s, label: s }))}
                onChange={setStyle}
              />
            </Field>
            <Field label="Size">
              <Select
                aria-label="Size"
                value={resolution}
                options={RESOLUTIONS.map((r) => ({ value: r, label: r }))}
                onChange={setResolution}
              />
            </Field>
            <Field label="Images">
              <Select aria-label="Images" value={count} options={COUNT(4, "image")} onChange={setCount} />
            </Field>
          </>
        )}
      </div>
      {editing ? null : (
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Estimated cost {money(Number(count) * PRICE_PER_IMAGE)} at {money(PRICE_PER_IMAGE)} per image
        </p>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------- read views */

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      aria-label="Copy variation"
      onClick={() => {
        void navigator.clipboard?.writeText(text).catch(() => undefined);
        setDone(true);
        showToast("Copied to clipboard");
        window.setTimeout(() => setDone(false), 1400);
      }}
      className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
    >
      {done ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
    </button>
  );
}

export function VariationsModal({ row, onClose }: { row: TextRow; onClose: () => void }) {
  return (
    <Modal
      title={`${row.variations.length} ${row.variations.length === 1 ? "variation" : "variations"}`}
      width={600}
      onClose={onClose}
      bodyClassName="gap-[12px]"
      footer={
        <OutlineButton className={BTN} onClick={onClose}>
          Close
        </OutlineButton>
      }
    >
      <p className="text-[13px] leading-[18px] text-pg-muted">
        {TYPE_LABEL[row.type]} · {row.tone} · {formatDate(row.at)}, {formatTime(row.at)} · {fmt(rowWords(row))} words
      </p>
      {row.variations.map((v, i) => (
        <div
          key={i}
          className="flex items-start gap-[12px] rounded-[8px] bg-pg px-[12px] py-[10px]"
        >
          <span className="mt-[1px] flex size-[20px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] leading-none font-semibold text-brand">
            {i + 1}
          </span>
          <p className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text-strong">{v}</p>
          <CopyButton text={v} />
        </div>
      ))}
    </Modal>
  );
}

export function ImagesModal({ row, onClose }: { row: ImageRow; onClose: () => void }) {
  return (
    <Modal
      title={row.prompt}
      width={640}
      onClose={onClose}
      bodyClassName="gap-[12px]"
      footer={
        <>
          <OutlineButton className={BTN} onClick={onClose}>
            Close
          </OutlineButton>
          <PrimaryButton
            className={BTN}
            onClick={() => showToast(`Downloading ${row.images.length} ${row.images.length === 1 ? "image" : "images"}`)}
          >
            <Download size={16} aria-hidden="true" />
            Download all
          </PrimaryButton>
        </>
      }
    >
      <p className="text-[13px] leading-[18px] text-pg-muted">
        {TYPE_LABEL[row.type]} · {row.style} · {row.resolution} · {formatDate(row.at)}
      </p>
      <div className="grid grid-cols-2 gap-[12px]">
        {row.images.map((h, i) => (
          <div key={i} className="group relative">
            <Thumb hue={h} size={null} className="aspect-square w-full rounded-[8px]" />
            <button
              type="button"
              aria-label={`Download image ${i + 1}`}
              onClick={() => showToast(`Downloading image ${i + 1}`)}
              className="motion-tap absolute top-[8px] right-[8px] flex size-[32px] items-center justify-center rounded-[8px] bg-pg-surface text-pg-text-strong opacity-0 shadow-[inset_0_0_0_1px_var(--pg-border)] group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Download size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------- delete */

export function DeleteModal({
  what,
  detail,
  onClose,
  onConfirm,
}: {
  what: string;
  detail: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      width={440}
      onClose={onClose}
      title={`Delete ${what}?`}
      icon={
        <span
          aria-hidden="true"
          className="flex size-[36px] items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--pg-danger)_14%,var(--pg-surface))] text-pg-danger"
        >
          <Trash2 size={18} />
        </span>
      }
      footer={
        <>
          <OutlineButton className={BTN} onClick={onClose}>
            Cancel
          </OutlineButton>
          <DangerButton onClick={onConfirm}>Delete</DangerButton>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        <span className="font-medium text-pg-text-strong">“{detail}”</span> will be removed from
        your history. Usage you were already charged for stays on your bill.
      </p>
    </Modal>
  );
}

