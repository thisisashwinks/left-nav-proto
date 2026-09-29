"use client";

import * as React from "react";
import { ArrowLeft, ImageIcon, ListChecks, Plus, Trash2, X } from "lucide-react";
import { TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { cn } from "@/lib/utils";
import type { RcsCard, RcsKind, Snippet } from "./snippets-data";
import { BTN, DISABLED_PRIMARY, FieldError, FieldLabel, ModalFooter, PhoneFrame } from "./snippets-ui";
import { MessagePreview } from "./snippets-text-modal";

export interface RcsDraft {
  name: string;
  body: string;
  rcs: { kind: RcsKind; cards: RcsCard[] };
}

const KINDS: { id: RcsKind; title: string; description: string; art: React.ReactNode }[] = [
  { id: "plain", title: "Plain text", description: "Send a plain text message", art: <PlainArt /> },
  { id: "card", title: "Standalone card", description: "Send a single rich content card message", art: <CardArt /> },
  { id: "carousel", title: "Carousel", description: "Send multiple rich cards in one message", art: <CarouselArt /> },
];

const COMPOSE_TITLE: Record<RcsKind, string> = {
  plain: "Plain text",
  card: "Standalone card",
  carousel: "Carousel",
};

const MAX_BUTTONS = 4;
const MAX_CARDS = 10;

const blankCard = (): RcsCard => ({ title: "", description: "", imageUrl: "", buttons: [] });

/**
 * RCS "Create new template" — name and type first, then a compose step for
 * that type. Editing starts on the compose step with the name locked, since
 * the live product won't rename a template once it exists.
 */
export function RcsSnippetModal({
  snippet,
  onSave,
  onClose,
}: {
  snippet?: Snippet;
  onSave: (draft: RcsDraft) => void;
  onClose: () => void;
}) {
  const editing = Boolean(snippet);
  const [step, setStep] = React.useState<1 | 2>(editing ? 2 : 1);
  const [name, setName] = React.useState(snippet?.name ?? "");
  const [kind, setKind] = React.useState<RcsKind | null>(snippet?.rcs?.kind ?? (snippet ? "plain" : null));
  const [text, setText] = React.useState(snippet?.rcs?.kind === "plain" || !snippet?.rcs ? (snippet?.body ?? "") : "");
  const [cards, setCards] = React.useState<RcsCard[]>(() => {
    const existing = snippet?.rcs?.cards ?? [];
    if (snippet?.rcs?.kind === "card") return existing.length ? existing.slice(0, 1) : [blankCard()];
    if (snippet?.rcs?.kind === "carousel") return existing.length >= 2 ? existing : [...existing, blankCard(), blankCard()].slice(0, 2);
    return [blankCard()];
  });
  const [tried, setTried] = React.useState(false);

  const chooseKind = (k: RcsKind) => {
    setKind(k);
    setCards((c) => (k === "carousel" ? (c.length >= 2 ? c : [...c, blankCard()].slice(0, Math.max(2, c.length + 1))) : c.slice(0, 1)));
  };

  const updateCard = (i: number, patch: Partial<RcsCard>) =>
    setCards((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const cardErrors = cards.map((c) => !c.title.trim());
  const invalid =
    kind === "plain" ? !text.trim() : kind === "card" ? cardErrors[0] : cards.length < 2 || cardErrors.some(Boolean);

  const save = () => {
    setTried(true);
    if (!kind || invalid) return;
    const used = kind === "plain" ? [] : kind === "card" ? cards.slice(0, 1) : cards;
    const clean = used.map((c) => ({ ...c, title: c.title.trim(), buttons: c.buttons.map((b) => b.trim()).filter(Boolean) }));
    onSave({
      name: name.trim(),
      body: kind === "plain" ? text : clean[0]?.title || "",
      rcs: { kind, cards: clean },
    });
  };

  const title = (
    <span className="flex items-center gap-[8px]">
      <ListChecks size={18} aria-hidden="true" className="text-pg-muted" />
      {editing ? "Edit template" : "Create new template"}
    </span>
  );

  if (step === 1) {
    const ready = Boolean(name.trim() && kind);
    return (
      <Modal
        width={720}
        title={title}
        onClose={onClose}
        footer={
          <ModalFooter>
            <OutlineButton className={BTN} onClick={onClose}>
              Cancel
            </OutlineButton>
            <PrimaryButton className={cn(BTN, DISABLED_PRIMARY)} disabled={!ready} onClick={() => setStep(2)}>
              Next
            </PrimaryButton>
          </ModalFooter>
        }
      >
        <div className="flex flex-col gap-[4px]">
          <FieldLabel required htmlFor="rcs-name">
            Template name
          </FieldLabel>
          <TextInput
            id="rcs-name"
            autoFocus
            value={name}
            placeholder="Enter a template name"
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-[13px] leading-[18px] text-pg-muted">You can&rsquo;t change the template name later.</p>
        </div>

        <p className="pt-[12px] text-[16px] leading-[22px] font-semibold text-pg-heading">
          What type of template would you like to create?
        </p>
        <div role="radiogroup" aria-label="Template type" className="grid grid-cols-3 gap-[16px] pb-[8px]">
          {KINDS.map((k) => {
            const on = kind === k.id;
            return (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => chooseKind(k.id)}
                className={cn(
                  "flex flex-col items-center gap-[8px] rounded-[12px] bg-pg-surface px-[16px] pt-[20px] pb-[16px] text-center motion-tap",
                  on
                    ? "bg-[color-mix(in_oklab,var(--brand)_5%,var(--pg-surface))] shadow-[inset_0_0_0_1.5px_var(--brand)]"
                    : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                )}
              >
                <span className="flex h-[96px] w-[112px] items-center justify-center rounded-[12px] bg-pg">{k.art}</span>
                <span className={cn("pt-[4px] text-[16px] leading-[22px] font-semibold", on ? "text-brand" : "text-pg-heading")}>
                  {k.title}
                </span>
                <span className="text-[13px] leading-[18px] text-pg-muted">{k.description}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    );
  }

  const k = kind ?? "plain";
  return (
    <Modal
      width={940}
      title={title}
      onClose={onClose}
      footer={
        <ModalFooter
          leading={
            editing ? null : (
              <OutlineButton className={BTN} onClick={() => setStep(1)}>
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </OutlineButton>
            )
          }
        >
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
        {COMPOSE_TITLE[k]} · <span className="font-medium text-pg-text">{name}</span>
      </p>

      <div className="flex gap-[24px] pt-[8px] pb-[8px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
          {k === "plain" ? (
            <div className="flex flex-col gap-[4px]">
              <FieldLabel required htmlFor="rcs-text">
                Message
              </FieldLabel>
              <textarea
                id="rcs-text"
                autoFocus
                value={text}
                placeholder="Type a message"
                onChange={(e) => setText(e.target.value)}
                className="h-[180px] resize-y rounded-[8px] bg-pg-surface px-[12px] py-[10px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
              />
              <div className="flex justify-between gap-[8px]">
                {tried && !text.trim() ? <FieldError>Enter a message.</FieldError> : <span />}
                <span className="text-[13px] leading-[18px] text-pg-muted tabular-nums">
                  {[...text].length.toLocaleString("en-US")} / 3,072 characters
                </span>
              </div>
            </div>
          ) : (
            <>
              {(k === "card" ? cards.slice(0, 1) : cards).map((c, i) => (
                <CardFields
                  key={i}
                  index={i}
                  card={c}
                  heading={k === "carousel" ? `Card ${i + 1}` : null}
                  showError={tried && cardErrors[i]}
                  onChange={(patch) => updateCard(i, patch)}
                  onRemove={k === "carousel" && cards.length > 2 ? () => setCards((cs) => cs.filter((_, j) => j !== i)) : undefined}
                />
              ))}
              {k === "carousel" ? (
                <OutlineButton
                  className={cn(BTN, "self-start", cards.length >= MAX_CARDS && "cursor-not-allowed opacity-50")}
                  disabled={cards.length >= MAX_CARDS}
                  onClick={() => setCards((cs) => [...cs, blankCard()])}
                >
                  <Plus size={16} aria-hidden="true" />
                  Add card
                </OutlineButton>
              ) : null}
            </>
          )}
        </div>

        <PhoneFrame>
          {k === "plain" ? (
            <MessagePreview body={text} files={[]} />
          ) : (
            <div className="flex flex-1 flex-col justify-end gap-[6px] pt-[12px]">
              <div className={cn("flex gap-[8px]", k === "carousel" && "-mx-[14px] overflow-x-auto px-[14px] pb-[4px]")}>
                {(k === "card" ? cards.slice(0, 1) : cards).map((c, i) => (
                  <CardPreview key={i} card={c} narrow={k === "carousel"} />
                ))}
              </div>
              <span className="self-end text-[12px] leading-[16px] text-[#98a2b3]">Read 15:29</span>
            </div>
          )}
        </PhoneFrame>
      </div>
    </Modal>
  );
}

function CardFields({
  index,
  card,
  heading,
  showError,
  onChange,
  onRemove,
}: {
  index: number;
  card: RcsCard;
  heading: string | null;
  showError: boolean;
  onChange: (patch: Partial<RcsCard>) => void;
  onRemove?: () => void;
}) {
  const id = `rcs-card-${index}`;
  return (
    <div className={cn("flex flex-col gap-[12px]", heading && "rounded-[8px] p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]")}>
      {heading ? (
        <div className="flex items-center justify-between">
          <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">{heading}</p>
          {onRemove ? (
            <button
              type="button"
              aria-label={`Remove ${heading}`}
              title="Remove card"
              onClick={onRemove}
              className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-danger"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-[4px]">
        <FieldLabel required htmlFor={`${id}-title`}>
          Title
        </FieldLabel>
        <TextInput
          id={`${id}-title`}
          value={card.title}
          maxLength={200}
          placeholder="Enter a card title"
          aria-invalid={showError}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        {showError ? <FieldError>Enter a card title.</FieldError> : null}
      </div>
      <div className="flex flex-col gap-[4px]">
        <FieldLabel htmlFor={`${id}-desc`}>Description</FieldLabel>
        <textarea
          id={`${id}-desc`}
          value={card.description}
          maxLength={2000}
          placeholder="Enter a description"
          onChange={(e) => onChange({ description: e.target.value })}
          className="h-[72px] resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-[4px]">
        <FieldLabel htmlFor={`${id}-img`}>Image URL</FieldLabel>
        <TextInput
          id={`${id}-img`}
          value={card.imageUrl}
          placeholder="https://"
          onChange={(e) => onChange({ imageUrl: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-[6px]">
        <FieldLabel>Buttons</FieldLabel>
        {card.buttons.map((b, j) => (
          <div key={j} className="flex items-center gap-[8px]">
            <TextInput
              aria-label={`Button ${j + 1} label`}
              value={b}
              maxLength={25}
              placeholder="Button label"
              onChange={(e) => onChange({ buttons: card.buttons.map((x, k) => (k === j ? e.target.value : x)) })}
            />
            <button
              type="button"
              aria-label={`Remove button ${j + 1}`}
              onClick={() => onChange({ buttons: card.buttons.filter((_, k) => k !== j) })}
              className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-danger motion-tap hover:bg-pg"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
        {card.buttons.length < MAX_BUTTONS ? (
          <button
            type="button"
            onClick={() => onChange({ buttons: [...card.buttons, ""] })}
            className="flex h-[28px] items-center gap-[6px] self-start text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
          >
            <Plus size={15} aria-hidden="true" />
            Add button
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CardPreview({ card, narrow }: { card: RcsCard; narrow: boolean }) {
  const buttons = card.buttons.filter((b) => b.trim());
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-[16px] bg-white shadow-[inset_0_0_0_1px_#eaecf0]",
        narrow ? "w-[200px]" : "w-full",
      )}
    >
      <div className="flex h-[110px] items-center justify-center bg-[#f2f4f7] text-[#98a2b3]">
        {card.imageUrl.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary user URL, preview only
          <img src={card.imageUrl.trim()} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={28} aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-col gap-[2px] px-[12px] pt-[10px] pb-[8px]">
        <p className="text-[14px] leading-[20px] font-semibold break-words text-[#101828]">{card.title || "Card title"}</p>
        {card.description ? (
          <p className="text-[13px] leading-[18px] break-words whitespace-pre-wrap text-[#475467]">{card.description}</p>
        ) : null}
      </div>
      {buttons.length > 0 ? (
        <div className="flex flex-col gap-[6px] px-[12px] pb-[12px]">
          {buttons.map((b, i) => (
            <span
              key={i}
              className="flex h-[32px] items-center justify-center rounded-full text-[13px] leading-[18px] font-medium text-brand shadow-[inset_0_0_0_1px_#d0d5dd]"
            >
              {b}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Illustrations ─────────────────────────────────────────────────────── */

function PlainArt() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <path d="M14 14h28v8H32v24h-8V22H14z" fill="#a6f4c5" stroke="#101828" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="42" cy="12" r="4" fill="#fff" stroke="#101828" strokeWidth="1.5" />
      <circle cx="17" cy="40" r="3.5" fill="#fff" stroke="#101828" strokeWidth="1.5" />
      <circle cx="39" cy="46" r="2" fill="#fff" stroke="#101828" strokeWidth="1.5" />
    </svg>
  );
}

function CardArt() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="15" y="12" width="26" height="26" rx="2" fill="#fedf89" stroke="#101828" strokeWidth="1.5" />
      <rect x="15" y="42" width="26" height="4" rx="2" fill="#fedf89" stroke="#101828" strokeWidth="1.5" />
      <path d="M9 9l2 2M47 45l2 2" stroke="#98a2b3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CarouselArt() {
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden="true">
      <rect x="4" y="16" width="4" height="22" rx="1.5" fill="#fff" stroke="#101828" strokeWidth="1.5" />
      <rect x="11" y="13" width="4" height="28" rx="1.5" fill="#fff" stroke="#101828" strokeWidth="1.5" />
      <rect x="20" y="10" width="32" height="32" rx="2" fill="#b2ccff" stroke="#101828" strokeWidth="1.5" />
      <rect x="20" y="45" width="32" height="4" rx="2" fill="#b2ccff" stroke="#101828" strokeWidth="1.5" />
      <rect x="57" y="13" width="4" height="28" rx="1.5" fill="#fff" stroke="#101828" strokeWidth="1.5" />
      <rect x="64" y="16" width="4" height="22" rx="1.5" fill="#fff" stroke="#101828" strokeWidth="1.5" />
    </svg>
  );
}
