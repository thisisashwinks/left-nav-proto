"use client";

import * as React from "react";
import { Bell, Mail, MessageCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeUnit } from "./cal-settings-store";
import {
  Field,
  SectionCard,
  SwitchRow,
  UnitField,
  type SectionProps,
} from "./edit-controls";
import { Divider, TagTextarea } from "./advanced-controls";

/** 95–96 — Advanced settings ▸ Notifications & policies. */

const CHANNELS: {
  id: string;
  label: string;
  icon: typeof Mail;
  items: { id: string; label: string; on: boolean }[];
}[] = [
  {
    id: "email",
    label: "Email",
    icon: Mail,
    items: [
      { id: "email-confirmation", label: "Booking confirmation", on: true },
      { id: "email-reminder", label: "Reminder", on: true },
      { id: "email-cancellation", label: "Cancellation", on: true },
      { id: "email-reschedule", label: "Reschedule", on: true },
    ],
  },
  {
    id: "sms",
    label: "SMS",
    icon: MessageSquare,
    items: [
      { id: "sms-confirmation", label: "Confirmation", on: true },
      { id: "sms-reminder", label: "Reminder", on: false },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    items: [{ id: "whatsapp-confirmation", label: "Confirmation", on: false }],
  },
  {
    id: "in-app",
    label: "In-app",
    icon: Bell,
    items: [{ id: "in-app-new-booking", label: "New booking", on: true }],
  },
];

function StatusPill({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick?: () => void;
  label?: string;
}) {
  const cls = cn(
    "inline-flex h-[22px] shrink-0 items-center rounded-[6px] px-[8px] text-[12px] leading-none font-medium whitespace-nowrap",
    on
      ? "bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] text-[var(--hr-success-700)]"
      : "bg-pg text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
  );
  if (!onClick) return <span className={cls}>{on ? "Enabled" : "Disabled"}</span>;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={cn(cls, "motion-tap hover:brightness-95 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--brand-soft)]")}
    >
      {on ? "Enabled" : "Disabled"}
    </button>
  );
}

/** "Rescheduling link will expire [30 | Minutes] before the meeting". */
function ExpiryRow({
  lead,
  value,
  unit,
  onChange,
  onUnitChange,
  disabled,
}: {
  lead: string;
  value: number | null;
  unit: TimeUnit;
  onChange: (v: number | null) => void;
  onUnitChange: (u: TimeUnit) => void;
  disabled: boolean;
}) {
  return (
    <fieldset
      disabled={disabled}
      className={cn(
        "flex flex-wrap items-center gap-x-[12px] gap-y-[8px] text-[14px] leading-[20px] text-pg-text",
        disabled && "opacity-50",
      )}
    >
      <span>{lead}</span>
      <UnitField
        aria-label={lead}
        value={value}
        onChange={onChange}
        unit={unit}
        onUnitChange={onUnitChange}
        className="w-[212px]"
      />
      <span>before the meeting</span>
    </fieldset>
  );
}

export function NotificationsSection({ draft, patch }: SectionProps) {
  const state = draft.notifications ?? {};
  const isOn = (id: string, fallback: boolean) => state[id] ?? fallback;

  return (
    <div className="flex flex-col gap-[16px]">
      <SectionCard
        title="Notifications"
        description="Configure how you send booking notifications via email, SMS, WhatsApp, and in-app alerts."
      >
        <div className="flex items-center gap-[8px]">
          <span className="text-[14px] leading-[20px] text-pg-text-strong">Status labels:</span>
          <StatusPill on />
          <StatusPill on={false} />
        </div>
        <ul className="flex flex-col overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {CHANNELS.flatMap((ch, ci) =>
            ch.items.map((item, ii) => {
              const on = isOn(item.id, item.on);
              const Icon = ch.icon;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex h-[44px] items-center gap-[12px] px-[12px]",
                    (ci > 0 || ii > 0) && "border-t border-pg-row-border",
                  )}
                >
                  <span className="flex w-[112px] shrink-0 items-center gap-[8px] text-[13px] leading-[18px] text-pg-muted">
                    {ii === 0 ? (
                      <>
                        <Icon size={14} aria-hidden="true" />
                        {ch.label}
                      </>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text-strong">
                    {item.label}
                  </span>
                  <StatusPill
                    on={on}
                    label={`${ch.label} ${item.label.toLowerCase()}: ${on ? "enabled" : "disabled"}. Toggle.`}
                    onClick={() => patch({ notifications: { ...state, [item.id]: !on } })}
                  />
                </li>
              );
            }),
          )}
        </ul>
      </SectionCard>

      <SectionCard
        title="Additional settings"
        description="Configure additional settings for your calendar."
      >
        <div className="flex flex-col gap-[16px]">
          <SwitchRow
            label="Assign contacts to their respective calendar team members each time an appointment is booked."
            hint="When enabled, Contact's assigned user will match the owner of the appointment with the most recent change — whether it's been booked, rescheduled, or reassigned."
            checked={draft.assignContactToOwner}
            onChange={(v) =>
              patch(v ? { assignContactToOwner: true } : { assignContactToOwner: false, skipIfAssigned: false })
            }
          />
          <SwitchRow
            label="Skip assigning Contact if the Contact has already an assigned user."
            hint="When enabled, a Contact's assigned user will remain the same, even if the appointment owner is different."
            checked={draft.skipIfAssigned}
            disabled={!draft.assignContactToOwner}
            onChange={(v) => patch({ skipIfAssigned: v })}
          />
        </div>

        <Divider />

        <div className="flex flex-col gap-[20px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
            Cancellation and reschedule policy:
          </span>
          <div className="flex flex-col gap-[16px]">
            <SwitchRow
              label="Allow rescheduling of meeting"
              info="Adds a reschedule link to booking emails and the confirmation page."
              checked={draft.allowReschedule}
              onChange={(v) => patch({ allowReschedule: v })}
            />
            <ExpiryRow
              lead="Rescheduling link will expire"
              value={draft.rescheduleExpiryValue}
              unit={draft.rescheduleExpiryUnit}
              onChange={(v) => patch({ rescheduleExpiryValue: v })}
              onUnitChange={(u) => patch({ rescheduleExpiryUnit: u })}
              disabled={!draft.allowReschedule}
            />
          </div>
          <div className="flex flex-col gap-[16px]">
            <SwitchRow
              label="Allow cancellation of meeting"
              info="Adds a cancellation link to booking emails and the confirmation page."
              checked={draft.allowCancel}
              onChange={(v) => patch({ allowCancel: v })}
            />
            <ExpiryRow
              lead="Cancellation link will expire"
              value={draft.cancelExpiryValue}
              unit={draft.cancelExpiryUnit}
              onChange={(v) => patch({ cancelExpiryValue: v })}
              onUnitChange={(u) => patch({ cancelExpiryUnit: u })}
              disabled={!draft.allowCancel}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Third-party calendar settings"
        description="Set up your preferences for third-party calendars."
      >
        <SwitchRow
          label="Allow Google / Outlook / iCloud calendar to send invitation & update emails to attendees."
          checked={draft.thirdPartyInvites}
          onChange={(v) => patch({ thirdPartyInvites: v })}
        />
        <Field
          label="Meeting invite notes"
          info="Added to the description of the event on the attendee's calendar."
        >
          <TagTextarea
            aria-label="Meeting invite notes"
            rows={5}
            value={draft.inviteNotes}
            onChange={(v) => patch({ inviteNotes: v })}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
