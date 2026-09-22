"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Lock,
  Mail,
  MessageSquare,
  MoveDownLeft,
  Search,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import {
  DrawerCheckRow,
  DrawerField,
  DrawerInput,
  DrawerSelect,
  SideDrawer,
} from "@/components/page/side-drawer";
import { cn } from "@/lib/utils";

/* ─── Add contact ───────────────────────────────────────────────────────── */

const CHANNELS = [
  { id: "email", label: "Email", icon: <Mail size={15} aria-hidden="true" /> },
  { id: "sms", label: "Text / RCS messages", icon: <MessageSquare size={15} aria-hidden="true" /> },
  { id: "calls", label: "Calls & voicemail", icon: <Smartphone size={15} aria-hidden="true" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare size={15} aria-hidden="true" /> },
  { id: "inbound", label: "Inbound calls and SMS", icon: <MoveDownLeft size={15} aria-hidden="true" /> },
];

/**
 * Creating a contact, beside the list it will join.
 *
 * A drawer rather than a centred modal because nothing here needs the rest of
 * the page hidden — the list is the reason you are adding one, and seeing it
 * is how you notice the person is already in it.
 */
export function AddContactDrawer({ onClose }: { onClose: () => void }) {
  const [first, setFirst] = React.useState("");
  const [dndAll, setDndAll] = React.useState(false);
  const [channels, setChannels] = React.useState<string[]>([]);
  const toggle = (id: string) =>
    setChannels((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <SideDrawer
      width={400}
      onClose={onClose}
      title="Add contact"
      footer={
        <>
          <button
            type="button"
            disabled={!first}
            className="text-[12.5px] leading-[normal] font-medium text-brand motion-tap disabled:text-pg-disabled hover:not-disabled:brightness-110"
          >
            Save and add another
          </button>
          <span className="flex-1" />
          <OutlineButton onClick={onClose} className="h-[30px] px-[12px] text-[12.5px]">
            Cancel
          </OutlineButton>
          {/* Inert on purpose: the list's data is fixed in this prototype. */}
          <PrimaryButton
            onClick={onClose}
            className="h-[30px] px-[14px] text-[12.5px]"
          >
            Save
          </PrimaryButton>
        </>
      }
    >
      <div className="flex items-center justify-between pt-[12px]">
        <span className="text-[12.5px] leading-[16px] font-medium text-pg-text-strong">
          Contact image
        </span>
        <button
          type="button"
          className="text-[12.5px] leading-[normal] font-medium text-brand motion-tap hover:brightness-110"
        >
          Customize form
        </button>
      </div>
      <div className="flex size-[56px] items-center justify-center rounded-full bg-pg-surface text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <UserRound size={24} aria-hidden="true" />
      </div>

      <DrawerField label="First name" required>
        <DrawerInput
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          placeholder="Enter first name"
        />
      </DrawerField>
      <DrawerField label="Last name">
        <DrawerInput placeholder="Enter last name" />
      </DrawerField>

      <DrawerField label="Email">
        <div className="flex items-center gap-[8px]">
          <DrawerInput placeholder="Please enter email address" />
          <OutlineButton aria-label="Remove email" className="h-[34px] w-[34px] justify-center px-0">
            <Trash2 size={15} aria-hidden="true" className="text-pg-muted" />
          </OutlineButton>
        </div>
      </DrawerField>
      <button
        type="button"
        className="self-start text-[12.5px] leading-[normal] font-medium text-brand motion-tap hover:brightness-110"
      >
        + Add email
      </button>

      <DrawerField label="Phone">
        <div className="flex items-center gap-[8px]">
          <div className="w-[96px] shrink-0">
            <DrawerSelect placeholder="Select" />
          </div>
          <DrawerInput placeholder="Enter phone number" />
          <OutlineButton aria-label="Remove phone" className="h-[34px] w-[34px] justify-center px-0">
            <Trash2 size={15} aria-hidden="true" className="text-pg-muted" />
          </OutlineButton>
        </div>
      </DrawerField>
      <button
        type="button"
        className="self-start text-[12.5px] leading-[normal] font-medium text-brand motion-tap hover:brightness-110"
      >
        + Add phone
      </button>

      <DrawerField label="Contact type">
        <DrawerSelect placeholder="Select contact type" />
      </DrawerField>
      <DrawerField label="Time zone">
        <DrawerSelect placeholder="Select time zone" />
      </DrawerField>

      <div className="my-[12px] rounded-[10px] px-[12px] py-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <DrawerCheckRow
          label="DND all channels"
          checked={dndAll}
          onToggle={() => setDndAll((v) => !v)}
        />
        <div className="flex items-center gap-[10px] py-[6px]">
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--pg-border)]" />
          <span className="text-[11.5px] leading-none text-pg-faint">OR</span>
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--pg-border)]" />
        </div>
        <span className="text-[12.5px] leading-[16px] font-medium text-pg-text-strong">
          Channels
        </span>
        <div className={cn(dndAll && "pointer-events-none opacity-45")}>
          {CHANNELS.map((c) => (
            <DrawerCheckRow
              key={c.id}
              label={c.label}
              icon={c.icon}
              checked={channels.includes(c.id)}
              onToggle={() => toggle(c.id)}
            />
          ))}
        </div>
      </div>
    </SideDrawer>
  );
}

/* ─── Manage fields ─────────────────────────────────────────────────────── */

const TABLE_FIELDS = [
  { id: "name", label: "Contact name", locked: true },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "business", label: "Business name" },
  { id: "created", label: "Created (IST)" },
  { id: "activity", label: "Last activity (IST)" },
  { id: "tags", label: "Tags" },
];

const FIELD_GROUPS = [
  { id: "general", label: "General info", fields: ["Contact ID", "Source", "Owner", "Time zone"] },
  { id: "contact", label: "Contact", fields: ["Date of birth", "Contact type", "Street address", "City"] },
  { id: "additional", label: "Additional info", fields: ["Engagement score", "Followers", "Attribution source"] },
  { id: "fasttrack", label: "SaaS FastTrack", fields: ["Plan", "Trial ends"] },
  { id: "cpbeta", label: "CP Beta", fields: ["Portal access"] },
  { id: "form93", label: "Form | Form 93", fields: ["Service needed", "Budget"] },
  { id: "survey21", label: "Survey | Survey 21", fields: ["How did you hear about us?"] },
];

/**
 * Which columns the table draws.
 *
 * The same drawer shape as everything else on the right, and deliberately NOT
 * a page: picking columns is an adjustment to the list you are looking at, so
 * the list has to stay on screen while you make it.
 */
export function ManageFieldsDrawer({ onClose }: { onClose: () => void }) {
  const [on, setOn] = React.useState<string[]>(TABLE_FIELDS.map((f) => f.id));
  const [open, setOpen] = React.useState<string | null>("general");
  const [query, setQuery] = React.useState("");

  const groups = FIELD_GROUPS.filter(
    (g) =>
      !query ||
      g.label.toLowerCase().includes(query.toLowerCase()) ||
      g.fields.some((f) => f.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <SideDrawer
      width={380}
      onClose={onClose}
      title="Manage fields"
      footer={
        <>
          <button
            type="button"
            className="text-[12.5px] leading-[normal] font-medium text-brand motion-tap hover:brightness-110"
          >
            Add custom field
          </button>
          <span className="flex-1" />
          <OutlineButton onClick={onClose} className="h-[30px] px-[12px] text-[12.5px]">
            Cancel
          </OutlineButton>
          <PrimaryButton onClick={onClose} className="h-[30px] px-[14px] text-[12.5px]">
            Apply
          </PrimaryButton>
        </>
      }
    >
      <div className="sticky top-0 z-10 bg-pg-surface pt-[12px] pb-[10px]">
        <div className="flex h-[34px] items-center gap-[9px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
          <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields"
            aria-label="Search fields"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
      </div>

      <span className="text-[12.5px] leading-[16px] font-semibold text-pg-heading">
        Fields in table
      </span>
      <div className="pt-[4px] pb-[12px]">
        {TABLE_FIELDS.map((f) => (
          <div key={f.id} className="flex items-center gap-[8px] py-[6px]">
            <GripVertical
              size={15}
              aria-hidden="true"
              className={cn("shrink-0", f.locked ? "text-pg-disabled" : "text-pg-faint")}
            />
            <DrawerCheckRow
              label={f.label}
              checked={f.locked || on.includes(f.id)}
              onToggle={() =>
                f.locked
                  ? undefined
                  : setOn((c) =>
                      c.includes(f.id) ? c.filter((x) => x !== f.id) : [...c, f.id],
                    )
              }
              trailing={
                f.locked ? (
                  <Lock size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
                ) : undefined
              }
            />
          </div>
        ))}
      </div>

      <span className="text-[12.5px] leading-[16px] font-semibold text-pg-heading">
        Add fields
      </span>
      <div className="flex flex-col gap-[6px] py-[8px]">
        {groups.map((g) => {
          const isOpen = open === g.id;
          return (
            <div key={g.id} className="overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : g.id)}
                className="flex h-[38px] w-full items-center gap-[8px] px-[11px] text-left motion-tap"
              >
                {isOpen ? (
                  <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
                ) : (
                  <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
                )}
                <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-text">
                  {g.label}
                </span>
              </button>
              {isOpen ? (
                <div className="px-[11px] pb-[8px]">
                  {g.fields.map((f) => (
                    <DrawerCheckRow
                      key={f}
                      label={f}
                      checked={on.includes(f)}
                      onToggle={() =>
                        setOn((c) => (c.includes(f) ? c.filter((x) => x !== f) : [...c, f]))
                      }
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {groups.length === 0 ? (
          <p className="py-[16px] text-center text-[13px] text-pg-faint">
            No fields match “{query}”.
          </p>
        ) : null}
      </div>
    </SideDrawer>
  );
}
