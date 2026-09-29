"use client";

import * as React from "react";
import { ExternalLink, ImageIcon, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { emptyDraft } from "./cal-settings-store";
import {
  FIELD,
  FIELD_ERROR,
  Field,
  InfoTip,
  SectionCard,
  SwitchRow,
  type SectionProps,
} from "./edit-controls";
import { RadioRow, SubHeading, TEXTAREA } from "./advanced-controls";
import { HEX, WidgetPreviewModal, safeColor } from "./advanced-widget-preview";

/** 97–98 — Advanced settings ▸ Widget appearance. */

const COVER_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif"];

export function WidgetAppearanceSection({ draft, patch }: SectionProps) {
  const [preview, setPreview] = React.useState(false);
  const neo = draft.widgetStyle === "neo";

  const reset = () => {
    const d = emptyDraft();
    patch({
      primaryColor: d.primaryColor,
      backgroundColor: d.backgroundColor,
      buttonText: d.buttonText,
      showTitle: d.showTitle,
      showDescription: d.showDescription,
      showDetails: d.showDetails,
    });
    showToast("Widget settings reset to default.");
  };

  return (
    <SectionCard title="Customizations" description="Set widget style and other preferences.">
      <div className="flex flex-col gap-[12px]">
        <SubHeading description="The uploaded image will be visible within the Group View for Neo template and won't appear on the individual calendar link.">
          Calendar cover image
        </SubHeading>
        <CoverDropzone value={draft.coverImage} onChange={(coverImage) => patch({ coverImage })} />
      </div>

      <hr className="border-0 border-t border-pg-head-border" />

      <div className="flex flex-col gap-[12px]">
        <SubHeading description="Choose between our classic or the sleek Neo widget.">
          Calendar widget style
        </SubHeading>
        <RadioRow
          name="widget-style"
          value={draft.widgetStyle}
          onChange={(widgetStyle) => patch({ widgetStyle })}
          options={[
            { value: "neo", label: "Neo" },
            { value: "classic", label: "Classic" },
          ]}
        />
      </div>

      <fieldset
        disabled={!neo}
        aria-label="Customize calendar widget"
        className={cn(
          "flex flex-col overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)] transition-opacity",
          !neo && "opacity-50",
        )}
      >
        <div className="flex flex-col items-start gap-[20px] bg-pg px-[20px] py-[20px] sm:flex-row sm:items-center sm:gap-[40px]">
          <WidgetIllustration />
          <div className="flex flex-col items-start gap-[10px]">
            <h3 className="text-[18px] leading-[26px] font-medium text-pg-heading">
              Customize calendar widget
            </h3>
            <span className="rounded-full bg-brand-soft px-[8px] py-[2px] text-[12px] leading-[18px] font-medium text-brand shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_30%,transparent)]">
              Only works with Neo widget
            </span>
            <p className="text-[14px] leading-[20px] text-pg-text">
              Customize widget appearance: primary color, background color, and button text.{" "}
              <a
                href="https://help.gohighlevel.com/"
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-[20px] bg-pg-surface px-[20px] pt-[20px] pb-[16px]">
          <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-heading">
            Primary settings
            <InfoTip text="Colours and text used across the Neo booking widget." />
          </span>
          <div className="flex max-w-[496px] flex-col gap-[20px]">
            <ColorField
              label="Primary color"
              info="Buttons, selected dates, and slots use this color."
              value={draft.primaryColor}
              onChange={(primaryColor) => patch({ primaryColor })}
            />
            <ColorField
              label="Background color"
              info="The widget's background."
              value={draft.backgroundColor}
              onChange={(backgroundColor) => patch({ backgroundColor })}
            />
            <Field label="Button text" info="The label on the widget's booking button.">
              <input
                aria-label="Button text"
                value={draft.buttonText}
                maxLength={40}
                onChange={(e) => patch({ buttonText: e.target.value })}
                className={FIELD}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-[16px]">
            <SwitchRow
              label="Calendar title"
              info="Show the calendar's name at the top of the widget."
              checked={draft.showTitle}
              disabled={!neo}
              onChange={(v) => patch({ showTitle: v })}
            />
            <SwitchRow
              label="Calendar description"
              info="Show the calendar's description under its name."
              checked={draft.showDescription}
              disabled={!neo}
              onChange={(v) => patch({ showDescription: v })}
            />
            <SwitchRow
              label="Calendar details"
              info="Show the duration and selected date."
              checked={draft.showDetails}
              disabled={!neo}
              onChange={(v) => patch({ showDetails: v })}
            />
          </div>
          <div className="flex items-center justify-end gap-[12px] border-t border-pg-head-border pt-[16px]">
            <button
              type="button"
              onClick={reset}
              className="flex h-[36px] items-center gap-[8px] rounded-[8px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reset to default
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="flex h-[36px] items-center gap-[8px] rounded-[8px] bg-brand-soft px-[12px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:brightness-95"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Preview widget
            </button>
          </div>
        </div>
      </fieldset>

      <Field
        label="Insert custom code"
        info="HTML, CSS, or JavaScript added to the booking page — for tracking scripts or style tweaks."
        className="max-w-[400px]"
      >
        <textarea
          rows={4}
          aria-label="Custom code"
          placeholder="Please input custom code here"
          value={draft.customCode}
          onChange={(e) => patch({ customCode: e.target.value })}
          className={cn(TEXTAREA, "font-mono text-[13px]")}
        />
      </Field>

      {preview ? <WidgetPreviewModal draft={draft} onClose={() => setPreview(false)} /> : null}
    </SectionCard>
  );
}

/**
 * A swatch plus hex field. The swatch opens the native colour picker; the
 * hex field accepts 3-, 6- or 8-digit values (the default carries alpha).
 */
function ColorField({
  label,
  info,
  value,
  onChange,
}: {
  label: string;
  info: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const pickerRef = React.useRef<HTMLInputElement>(null);
  const valid = HEX.test(value.trim());
  const shown = safeColor(value, "#ffffff");
  // The native picker only speaks #rrggbb.
  const six =
    shown.length === 4
      ? `#${shown[1]}${shown[1]}${shown[2]}${shown[2]}${shown[3]}${shown[3]}`
      : shown.slice(0, 7);

  return (
    <Field label={label} info={info} error={valid ? undefined : "Enter a hex color, like #178af6."}>
      <div
        className={cn(
          "flex h-[36px] items-center gap-[10px] rounded-[8px] bg-pg-surface pr-[12px] pl-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          !valid && FIELD_ERROR,
        )}
      >
        <button
          type="button"
          aria-label={`Pick ${label.toLowerCase()}`}
          onClick={() => pickerRef.current?.click()}
          className="relative size-[22px] shrink-0 rounded-[4px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
          style={{ background: shown }}
        />
        <input
          ref={pickerRef}
          type="color"
          tabIndex={-1}
          aria-hidden="true"
          value={six}
          onChange={(e) => onChange(e.target.value)}
          className="pointer-events-none absolute size-0 opacity-0"
        />
        <input
          aria-label={label}
          value={value}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text focus:outline-none"
        />
      </div>
    </Field>
  );
}

/** Click or drop to upload; the image is kept as a data URL on the draft. */
function CoverDropzone({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const take = (file: File | undefined) => {
    if (!file) return;
    if (!COVER_TYPES.includes(file.type)) {
      setError("Upload a PNG, JPEG, JPG, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("That image is over 5 MB. Choose a smaller one.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/gif"
      className="hidden"
      onChange={(e) => {
        take(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  if (value) {
    return (
      <div className="flex items-center gap-[16px] rounded-[8px] p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL */}
        <img
          src={value}
          alt="Calendar cover"
          className="size-[72px] shrink-0 rounded-[6px] object-cover shadow-[inset_0_0_0_1px_var(--pg-border)]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
            <ImageIcon size={14} aria-hidden="true" className="text-pg-muted" />
            Cover image uploaded
          </span>
          <span className="text-[13px] leading-[18px] text-pg-muted">
            Shown in the Neo group view.
          </span>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-[36px] rounded-[8px] px-[12px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:bg-brand-soft"
        >
          Replace
        </button>
        <button
          type="button"
          aria-label="Remove cover image"
          onClick={() => onChange(null)}
          className="flex size-[36px] items-center justify-center rounded-[8px] text-pg-muted motion-tap hover:bg-pg hover:text-[var(--hr-error-600)]"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
        {fileInput}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[6px]">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload calendar cover image"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!over) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-[12px] rounded-[8px] px-[16px] py-[16px] text-center shadow-[inset_0_0_0_1px_var(--pg-border)] outline-none transition-colors focus-visible:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          over && "bg-brand-soft shadow-[inset_0_0_0_1px_var(--brand)]",
          error && FIELD_ERROR,
        )}
      >
        <span className="flex size-[40px] items-center justify-center rounded-full bg-pg text-pg-muted shadow-[0_0_0_6px_color-mix(in_oklab,var(--pg-bg)_50%,transparent)]">
          <UploadCloud size={20} aria-hidden="true" />
        </span>
        <span className="flex flex-col gap-[2px]">
          <span className="text-[14px] leading-[20px] text-pg-text">
            <span className="font-medium text-brand">Click to upload</span> or drag and drop
          </span>
          <span className="text-[12px] leading-[18px] text-pg-text-strong">
            PNG, JPEG, JPG, or GIF (max. dimensions 180×180px)
          </span>
        </span>
      </div>
      {error ? (
        <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">{error}</span>
      ) : null}
      {fileInput}
    </div>
  );
}

/** The person-at-a-board picture, drawn in page tokens so it follows the theme. */
function WidgetIllustration() {
  return (
    <svg
      width="168"
      height="112"
      viewBox="0 0 168 112"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="146" y="30" width="12" height="54" rx="3" fill="var(--pg-text-strong)" opacity="0.8" />
      <rect x="24" y="12" width="128" height="80" rx="6" fill="var(--pg-surface)" stroke="var(--pg-heading)" strokeWidth="1.5" />
      <rect x="24" y="12" width="128" height="10" rx="5" fill="var(--pg-surface)" stroke="var(--pg-heading)" strokeWidth="1.5" />
      <circle cx="31" cy="17" r="1.4" fill="var(--pg-heading)" />
      <circle cx="36" cy="17" r="1.4" fill="var(--pg-heading)" />
      <circle cx="41" cy="17" r="1.4" fill="var(--pg-heading)" />
      <rect x="32" y="28" width="112" height="56" rx="3" stroke="var(--pg-heading)" strokeWidth="1.2" />
      <line x1="72" y1="28" x2="72" y2="84" stroke="var(--pg-heading)" strokeWidth="1.2" />
      <rect x="38" y="34" width="6" height="6" rx="1" stroke="var(--pg-heading)" strokeWidth="1" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <circle
            key={`${r}${c}`}
            cx={86 + c * 9}
            cy={42 + r * 9}
            r="3"
            fill="var(--pg-faint)"
            opacity="0.7"
          />
        )),
      )}
      {[0, 1, 2].map((r) => (
        <rect key={r} x="114" y={39 + r * 9} width="20" height="6" rx="3" fill="var(--pg-faint)" opacity="0.7" />
      ))}
      <rect x="18" y="26" width="10" height="52" rx="2" fill="var(--brand)" />
      {/* the person */}
      <path d="M8 110 C8 90 14 80 26 78 C38 80 44 90 44 110 Z" fill="var(--pg-surface)" stroke="var(--pg-heading)" strokeWidth="1.5" />
      <path d="M36 86 L52 72" stroke="var(--pg-heading)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="54" cy="70" r="3" fill="var(--pg-surface)" stroke="var(--pg-heading)" strokeWidth="1.2" />
      <circle cx="26" cy="66" r="9" fill="var(--pg-surface)" stroke="var(--pg-heading)" strokeWidth="1.5" />
      <path d="M17 64 C18 56 34 55 35 63 C31 60 22 60 17 64 Z" fill="var(--pg-heading)" />
      <path d="M19 70 C21 76 31 76 33 70" fill="var(--pg-heading)" opacity="0.85" />
    </svg>
  );
}
