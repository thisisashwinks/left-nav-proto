"use client";

import * as React from "react";
import { Check, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEETING_COLORS, useCalendarGroups } from "./cal-settings-store";
import { MergeFieldInput, RichTextEditor } from "./builder-fields";
import { FIELD_ERROR, Field, PlainSelect, SectionCard, type SectionProps } from "./edit-controls";

/** 88 — Basic details: logo, name, description, URL, group, invite title, color. */

const NO_GROUP = "__none";
const ACCEPT = "image/png,image/jpeg,image/jpg,image/gif";

export function BasicDetailsSection({ draft, patch, errors }: SectionProps) {
  const groups = useCalendarGroups();

  return (
    <SectionCard title="Basic details" description="Basic information used to identify this calendar.">
      <Field
        label="Calendar logo"
        info="Shown at the top of the booking widget. Square images work best."
      >
        <LogoDrop logo={draft.logo} onChange={(logo) => patch({ logo })} />
      </Field>

      <Field
        label="Calendar name"
        info="What contacts see on the booking widget and in their invite."
        error={errors?.name}
      >
        <MergeFieldInput
          aria-label="Calendar name"
          value={draft.name}
          onChange={(name) => patch({ name })}
          placeholder="(eg) Outbound reach"
          error={!!errors?.name}
        />
      </Field>

      <Field label="Description" info="Tell contacts what the meeting is for and how to prepare.">
        <RichTextEditor
          value={draft.description}
          onChange={(description) => patch({ description })}
          placeholder="Write description"
        />
      </Field>

      <div className="h-px bg-[var(--pg-head-border)]" aria-hidden="true" />

      <Field
        label="Custom URL"
        info="The end of this calendar's booking link. Changing it changes the scheduling link."
        error={errors?.slug}
      >
        <div
          className={cn(
            "flex h-[36px] items-stretch overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
            errors?.slug && FIELD_ERROR,
            errors?.slug &&
              "focus-within:shadow-[inset_0_0_0_1px_var(--hr-error-500),0_0_0_3px_color-mix(in_oklab,var(--hr-error-500)_18%,transparent)]",
          )}
        >
          <span className="flex shrink-0 items-center border-r border-pg-border bg-pg px-[12px] text-[14px] leading-[20px] text-pg-text-strong">
            /widget/bookings/
          </span>
          <input
            value={draft.slug}
            aria-label="Custom URL"
            aria-invalid={!!errors?.slug || undefined}
            placeholder="my-calendar"
            // Slugs are lower-case and dashed; typing a space gives a dash.
            onChange={(e) =>
              patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })
            }
            className="min-w-0 flex-1 bg-transparent px-[12px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
        <Field
          label="Group"
          info="Groups share one scheduling link, so contacts can choose between their calendars."
        >
          <PlainSelect
            aria-label="Group"
            value={draft.groupId ?? NO_GROUP}
            onChange={(v) => patch({ groupId: v === NO_GROUP ? null : v })}
            options={[
              { value: NO_GROUP, label: "No group" },
              ...groups.map((g) => ({ value: g.id, label: g.name })),
            ]}
          />
        </Field>
        <Field
          label="Meeting invite title"
          info="The title of the calendar event sent to the contact. Merge fields fill in on booking."
        >
          <MergeFieldInput
            aria-label="Meeting invite title"
            value={draft.inviteTitle}
            onChange={(inviteTitle) => patch({ inviteTitle })}
          />
        </Field>
      </div>

      <Field label="Meeting color" info="The color these meetings take on the calendar views.">
        <div className="flex flex-wrap items-center gap-[5px]">
          {MEETING_COLORS.map((c) => {
            const on = c === draft.color;
            return (
              <button
                key={c}
                type="button"
                aria-label={`Meeting color ${c}`}
                aria-pressed={on}
                onClick={() => patch({ color: c })}
                style={{ background: c }}
                className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-white hover:brightness-110 active:scale-90"
              >
                {on ? <Check size={16} strokeWidth={2.5} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </Field>
    </SectionCard>
  );
}

/**
 * The logo dropzone — a real file input under the whole box, plus drag and
 * drop. The image is kept as a data URL, which is all a prototype store can
 * hold and all the widget preview needs.
 */
function LogoDrop({ logo, onChange }: { logo: string | null; onChange: (v: string | null) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);

  const read = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setProblem("Choose a PNG, JPEG, JPG, or GIF image.");
      return;
    }
    setProblem(null);
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      onChange={(e) => {
        read(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  if (logo) {
    return (
      <div className="flex items-center gap-[16px] rounded-[8px] px-[16px] py-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {picker}
        {/* eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise */}
        <img
          src={logo}
          alt="Calendar logo"
          className="size-[72px] rounded-[8px] object-cover shadow-[inset_0_0_0_1px_var(--pg-row-border)]"
        />
        <div className="flex flex-col gap-[4px]">
          <span className="text-[14px] leading-[20px] text-pg-text-strong">Logo uploaded</span>
          <div className="flex items-center gap-[12px] text-[14px] leading-[20px] font-medium">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-brand hover:underline"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-[var(--hr-error-600)] hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[6px]">
      {picker}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          read(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex flex-col items-center gap-[6px] rounded-[8px] px-[16px] pt-[14px] pb-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap",
          over && "bg-brand-soft shadow-[inset_0_0_0_1px_var(--brand)]",
        )}
      >
        <span className="flex size-[44px] items-center justify-center rounded-full bg-pg text-pg-text-strong shadow-[0_0_0_6px_color-mix(in_oklab,var(--pg-bg)_50%,transparent)]">
          <CloudUpload size={20} aria-hidden="true" />
        </span>
        <span className="pt-[6px] text-[14px] leading-[20px] text-pg-text-strong">
          <span className="font-semibold text-brand">Click to upload</span> or drag and drop
        </span>
        <span className="text-[13px] leading-[18px] text-pg-text">
          PNG, JPEG, JPG or GIF (max. dimensions 180×180px)
        </span>
      </button>
      {problem ? (
        <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">{problem}</span>
      ) : null}
    </div>
  );
}
