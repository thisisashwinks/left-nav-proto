"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarDraft } from "./cal-settings-store";
import {
  FIELD,
  FIELD_ERROR,
  Field,
  PlainSelect,
  SectionCard,
  SwitchRow,
  type SectionProps,
} from "./edit-controls";
import { Divider, RadioRow, SubHeading, TEXTAREA, TagTextarea } from "./advanced-controls";

/** 92–93 — Advanced settings ▸ Form & confirmation. */

const FORMS = [
  { value: "default", label: "Default (First name, Last name, Email, Phone, Notes)" },
  { value: "lead-intake", label: "Lead intake form" },
  { value: "consultation", label: "Consultation request" },
  { value: "event-registration", label: "Event registration" },
];

type Step = CalendarDraft["widgetOrder"][number];
const STEP_LABEL: Record<Step, string> = {
  datetime: "Date & time selector",
  form: "Form",
};

const isUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export function FormConfirmationSection({ draft, patch, errors }: SectionProps) {
  const redirectBad = draft.redirectUrl.trim() !== "" && !isUrl(draft.redirectUrl.trim());
  const redirectError =
    errors?.redirectUrl ?? (redirectBad ? "Enter a full URL, like https://example.com/thanks." : undefined);

  return (
    <div className="flex flex-col gap-[16px]">
      <SectionCard
        title="Forms & guests"
        description="Set your preferences and settings for collecting customer information during bookings."
      >
        <Field
          label="Select form"
          info="The form contacts fill in when they book. Build more forms in Sites ▸ Forms."
          className="max-w-[400px]"
        >
          <PlainSelect
            aria-label="Select form"
            value={draft.formId}
            onChange={(v) => patch({ formId: v })}
            options={FORMS}
          />
        </Field>

        <Field
          label="Widget order"
          info="Choose whether contacts pick a time or fill in the form first. Drag to reorder."
        >
          <WidgetOrder
            order={draft.widgetOrder}
            onChange={(widgetOrder) => patch({ widgetOrder })}
          />
        </Field>

        <Divider />

        <div className="flex flex-col gap-[12px]">
          <SubHeading>Sticky contacts</SubHeading>
          <SwitchRow
            label="Pre-populate fields"
            info="Returning contacts see the form filled in with the details they entered last time."
            checked={draft.stickyContacts}
            onChange={(v) => patch({ stickyContacts: v })}
          />
        </div>

        <Divider />

        <div className="flex flex-col gap-[12px]">
          <SubHeading>Consent checkbox</SubHeading>
          <SwitchRow
            label="Consent checkbox"
            info="Adds a checkbox contacts must tick to agree to receive messages from you."
            checked={draft.consentEnabled}
            onChange={(v) => patch({ consentEnabled: v })}
          />
          {draft.consentEnabled ? (
            <textarea
              rows={4}
              aria-label="Consent text"
              value={draft.consentText}
              onChange={(e) => patch({ consentText: e.target.value })}
              className={cn(TEXTAREA, errors?.consentText && FIELD_ERROR)}
            />
          ) : null}
          {draft.consentEnabled && errors?.consentText ? (
            <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
              {errors.consentText}
            </span>
          ) : null}
        </div>

        <Divider />

        <div className="flex flex-col gap-[12px]">
          <SubHeading>Guests</SubHeading>
          <SwitchRow
            label="Add guests"
            info="Lets the person booking invite others to the same appointment."
            checked={draft.guestsEnabled}
            onChange={(v) => patch({ guestsEnabled: v })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Confirmation page"
        description="Configure preferences for the final page that appears after a successful booking."
      >
        <div className="flex flex-col gap-[12px]">
          <RadioRow
            name="confirmation"
            value={draft.confirmation}
            onChange={(v) => patch({ confirmation: v })}
            options={[
              { value: "message", label: "Thank you message" },
              { value: "redirect", label: "Redirect URL" },
            ]}
          />
          {draft.confirmation === "message" ? (
            <Field label="Thank you message" error={errors?.thankYouMessage}>
              <TagTextarea
                aria-label="Thank you message"
                value={draft.thankYouMessage}
                onChange={(v) => patch({ thankYouMessage: v })}
              />
            </Field>
          ) : (
            <Field
              label="Redirect URL"
              required
              error={redirectError}
              hint="Contacts are sent here once their booking is confirmed."
              className="max-w-[400px]"
            >
              <input
                type="url"
                aria-label="Redirect URL"
                placeholder="https://example.com/thanks"
                value={draft.redirectUrl}
                onChange={(e) => patch({ redirectUrl: e.target.value })}
                className={cn(FIELD, redirectError && FIELD_ERROR)}
              />
            </Field>
          )}
        </div>

        <Field
          label="Meta pixel ID (optional)"
          info="Tracks bookings as conversions in Meta Events Manager."
          className="max-w-[400px]"
        >
          <input
            aria-label="Meta pixel ID"
            placeholder="Pixel ID"
            inputMode="numeric"
            value={draft.metaPixelId}
            onChange={(e) => patch({ metaPixelId: e.target.value })}
            className={FIELD}
          />
        </Field>

        <Divider />

        <SwitchRow
          label="Auto-confirm new calendar meetings"
          info="New bookings are confirmed straight away. Turn off to review each one first."
          checked={draft.autoConfirm}
          onChange={(v) => patch({ autoConfirm: v })}
        />
      </SectionCard>
    </div>
  );
}

/**
 * Two steps, reorderable by drag or by the keyboard (arrow keys on a
 * focused handle), so the order is never mouse-only.
 */
function WidgetOrder({
  order,
  onChange,
}: {
  order: Step[];
  onChange: (next: Step[]) => void;
}) {
  const [dragging, setDragging] = React.useState<Step | null>(null);
  const [over, setOver] = React.useState<number | null>(null);
  const handles = React.useRef<Partial<Record<Step, HTMLButtonElement | null>>>({});

  const move = (step: Step, to: number) => {
    const from = order.indexOf(step);
    if (from === -1 || to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, step);
    onChange(next);
  };

  return (
    <div className="flex items-start gap-[16px]">
      <div className="flex flex-col pt-[8px]">
        {order.map((_, i) => (
          <span
            key={i}
            className="flex h-[52px] items-start text-[14px] leading-[20px] font-medium text-pg-text-strong"
          >
            Step {i + 1}
          </span>
        ))}
      </div>
      <ol className="flex w-full max-w-[372px] flex-col overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {order.map((step, i) => (
          <li
            key={step}
            draggable
            onDragStart={(e) => {
              setDragging(step);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", step);
            }}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              if (over !== i) setOver(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging) move(dragging, i);
              setDragging(null);
              setOver(null);
            }}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            className={cn(
              "flex h-[52px] items-center gap-[12px] bg-pg-surface px-[12px] text-[14px] leading-[20px] font-medium text-pg-text-strong",
              i > 0 && "border-t border-pg-row-border",
              dragging === step && "opacity-50",
              over === i && dragging && dragging !== step && "bg-brand-soft",
            )}
          >
            <button
              type="button"
              ref={(el) => {
                handles.current[step] = el;
              }}
              aria-label={`Reorder ${STEP_LABEL[step]}, step ${i + 1} of ${order.length}. Use arrow keys to move.`}
              onKeyDown={(e) => {
                const to = e.key === "ArrowUp" ? i - 1 : e.key === "ArrowDown" ? i + 1 : null;
                if (to === null) return;
                e.preventDefault();
                move(step, to);
                requestAnimationFrame(() => handles.current[step]?.focus());
              }}
              className="flex size-[24px] cursor-grab items-center justify-center rounded-[4px] text-pg-faint hover:bg-pg hover:text-pg-muted focus-visible:text-brand focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--brand-soft)] active:cursor-grabbing"
            >
              <GripVertical size={16} aria-hidden="true" />
            </button>
            {STEP_LABEL[step]}
          </li>
        ))}
      </ol>
    </div>
  );
}
