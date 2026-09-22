"use client";

import * as React from "react";
import {
  ArrowLeft,
  Bold,
  Check,
  ChevronRight,
  Italic,
  Link2,
  List,
  ListOrdered,
  Lightbulb,
  Share2,
  Strikethrough,
  Underline,
  UploadCloud,
  Wrench,
} from "lucide-react";
import { PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { cn } from "@/lib/utils";
import { GlyphButton, SelectButton } from "./calendar-chrome";
import { editSections, meetingColors, type CalendarRow } from "./calendars-data";

export interface CalendarEditProps {
  calendar: CalendarRow;
  onBack: () => void;
}

/**
 * Screen 4: one calendar, opened for editing.
 *
 * `useRecordCrumb`, not the builder chrome. The distinction matters more here
 * than anywhere else in this batch, because the screen LOOKS like a builder —
 * full-width bar, a Save at the right edge, a rail down the left — and it is
 * not one. A builder asks the shell to withdraw the nav and the app bar
 * because its canvas IS the product (the workflow graph, the funnel page); a
 * settings form has no canvas, it has fields, and taking the sidebar away
 * would strand an operator inside a form with no way back to the rest of CRM
 * except the form's own back link. So the shell keeps its chrome, the trail
 * grows one crumb — Calendars ▸ tEst — and that crumb is the way out.
 *
 * The bar below is therefore NOT a second breadcrumb. It carries the one thing
 * the trail cannot: Save changes, and the two glyphs that act on this calendar
 * rather than on the page.
 */
export function CalendarEdit({ calendar, onBack }: CalendarEditProps) {
  const [section, setSection] = React.useState("service");
  const [color, setColor] = React.useState(meetingColors[0]!.id);

  useRecordCrumb(calendar.name, onBack);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[12px]">
      <div className="relative flex h-[44px] shrink-0 items-center gap-[12px] rounded-[10px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <button
          type="button"
          onClick={onBack}
          className="motion-tap flex shrink-0 items-center gap-[7px] rounded-[7px] px-[6px] py-[4px] text-[13px] leading-[normal] font-medium text-pg-muted hover:bg-pg-bg hover:text-pg-text"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to calendars list
        </button>
        {/*
          The title is centred with an absolute span rather than by flexing the
          two sides, because the left link and the right cluster are different
          widths and always will be — "Back to calendars list" is eleven
          characters longer than the buttons opposite it. Centring by layout
          would have put the name a few pixels off centre and left it there.
        */}
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 truncate text-[14px] leading-[normal] font-semibold text-pg-heading">
          Edit - {calendar.name}
        </span>
        <span className="flex-1" />
        <GlyphButton icon={Share2} label={`Share ${calendar.name}`} tone="text" />
        <GlyphButton
          icon={Wrench}
          label={`Advanced configuration for ${calendar.name}`}
          tone="text"
        />
        <PrimaryButton>Save changes</PrimaryButton>
      </div>

      <div className="flex min-h-0 flex-1 gap-[12px] pb-[2px]">
        <div className="flex w-[238px] shrink-0 flex-col gap-[10px]">
          <nav
            aria-label="Calendar settings sections"
            className="flex flex-col gap-[2px] overflow-hidden rounded-[12px] bg-pg-surface p-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
          >
            {editSections.map((s) => {
              const on = s.id === section;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-current={on ? "page" : undefined}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "motion-tap flex items-center gap-[8px] rounded-[8px] px-[10px] py-[8px] text-left",
                    on
                      ? "bg-brand-soft font-semibold text-brand"
                      : "font-medium text-pg-text hover:bg-pg-bg",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px]">
                    {s.label}
                  </span>
                  {s.deep ? (
                    <ChevronRight
                      size={14}
                      aria-hidden="true"
                      className={cn("shrink-0", on ? "text-brand" : "text-pg-faint")}
                    />
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/*
            The tip card, under the rail rather than beside the field it is
            about. It is advice about the whole form, not about one input, and
            an inline hint next to Custom URL would have claimed otherwise.
          */}
          <div className="flex flex-col gap-[6px] rounded-[12px] bg-pg-bg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <span className="flex items-center gap-[7px] text-[12.5px] leading-[17px] font-semibold text-pg-heading">
              <Lightbulb size={15} aria-hidden="true" className="text-brand" />
              Quick tip
            </span>
            <p className="text-[12px] leading-[17px] text-pg-muted">
              Keep the service name short — it is what a contact sees on the
              booking widget and in the calendar invite.
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-[12px] bg-pg-surface p-[20px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <div className="flex max-w-[680px] flex-col gap-[18px]">
            <Field label="Service logo">
              {/*
                A dropzone, and the dimension line is part of the control, not
                a hint under it. A 180×180 cap that lives outside the box is a
                rule you read after you have already dragged the wrong file in.
              */}
              <div className="flex flex-col items-center gap-[6px] rounded-[10px] border border-dashed border-pg-border-strong bg-pg-bg px-[16px] py-[22px]">
                <span className="flex size-[36px] items-center justify-center rounded-[10px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
                  <UploadCloud size={18} aria-hidden="true" />
                </span>
                <span className="text-[13px] leading-[18px] text-pg-text">
                  <span className="font-semibold text-brand">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </span>
                <span className="text-[12px] leading-[16px] text-pg-faint">
                  PNG, JPEG, JPG or GIF (max. dimensions 180×180px)
                </span>
              </div>
            </Field>

            <Field label="Service name" required>
              <TextInput value={calendar.name} />
            </Field>

            <Field label="Description">
              <div className="overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <div className="flex items-center gap-[1px] border-b border-pg-row-border bg-pg-bg px-[6px] py-[4px]">
                  <SelectButton
                    label="Text style"
                    value="Normal"
                    className="h-[26px] border-0 bg-transparent px-[8px] text-[12.5px] shadow-none hover:shadow-none"
                  />
                  <span
                    aria-hidden="true"
                    className="mx-[4px] h-[16px] w-px bg-pg-border"
                  />
                  {[
                    { icon: Bold, label: "Bold" },
                    { icon: Italic, label: "Italic" },
                    { icon: Underline, label: "Underline" },
                    { icon: Strikethrough, label: "Strikethrough" },
                    { icon: Link2, label: "Insert link" },
                    { icon: List, label: "Bulleted list" },
                    { icon: ListOrdered, label: "Numbered list" },
                  ].map((t) => (
                    <GlyphButton
                      key={t.label}
                      icon={t.icon}
                      label={t.label}
                      size={26}
                      tone="text"
                    />
                  ))}
                </div>
                <div className="min-h-[92px] px-[12px] py-[10px] text-[13px] leading-[19px] text-pg-text">
                  A 30 minute walkthrough of the platform, tailored to what the
                  contact asked about on the form.
                </div>
              </div>
            </Field>

            <Field
              label="Custom URL"
              hint="Contacts land here when they book from a link you share."
            >
              {/*
                The prefix is inside the control, on the same 34px row, so the
                whole URL reads as one string. A grey label to the LEFT of a
                separate input reads as two fields, and the operator then types
                the prefix again.
              */}
              <div className="flex h-[34px] items-center overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
                <span className="flex h-full shrink-0 items-center border-r border-pg-border bg-pg-bg px-[10px] text-[12.5px] leading-[normal] text-pg-muted">
                  /widget/bookings/
                </span>
                <input
                  defaultValue="test"
                  aria-label="Custom URL slug"
                  className="min-w-0 flex-1 bg-transparent px-[10px] text-[13px] leading-[normal] text-pg-text focus:outline-none"
                />
              </div>
            </Field>

            <Field label="Group">
              <SelectButton
                label="Calendar group"
                value={calendar.group}
                className="w-full justify-between"
              />
            </Field>

            <Field
              label="Appointment invite title"
              hint="Merge fields resolve when the invite is sent."
            >
              <TextInput value="{{contact.name}}" />
            </Field>

            <Field label="Meeting color">
              {/*
                4px of side padding, because the lit swatch's ring is drawn
                OUTSIDE its circle — without it the first swatch's ring is
                shaved off by the scroll container's edge, and the one colour
                you can see is selected is the one that looks broken.
              */}
              <div className="flex items-center gap-[10px] px-[4px] py-[4px]">
                {meetingColors.map((c) => {
                  const on = c.id === color;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={c.label}
                      aria-pressed={on}
                      onClick={() => setColor(c.id)}
                      style={{ background: c.token }}
                      className={cn(
                        "motion-tap flex size-[26px] items-center justify-center rounded-full text-white active:scale-90",
                        // The ring sits OUTSIDE the swatch rather than on it,
                        // so the lit colour is still the full circle — an
                        // inset ring would have dimmed the one swatch you are
                        // trying to judge.
                        on &&
                          "shadow-[0_0_0_2px_var(--pg-surface),0_0_0_4px_var(--brand)]",
                      )}
                    >
                      {on ? <Check size={14} strokeWidth={3} /> : null}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Label over control, 4px apart — the form rhythm the drawer fields use. */
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[12.5px] leading-[16px] font-medium text-pg-text-strong">
        {label}
        {required ? <span className="text-pg-danger"> *</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="text-[12px] leading-[16px] text-pg-faint">{hint}</span>
      ) : null}
    </div>
  );
}

function TextInput({ value }: { value: string }) {
  return (
    <input
      defaultValue={value}
      className="h-[34px] w-full rounded-[8px] bg-pg-surface px-[11px] text-[13px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]"
    />
  );
}
