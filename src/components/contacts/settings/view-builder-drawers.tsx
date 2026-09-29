"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  CirclePlus,
  GripVertical,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Trash2,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { SideDrawer } from "@/components/page/side-drawer";
import { Select, Toggle } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import type { ViewLayout } from "./object-settings-store";
import { AddMenu, SortableRows } from "./view-builder-parts";

/**
 * The builder's two drawers — Edit contact card and Edit tabs.
 *
 * Both edit a copy of their slice of the draft and hand it back on Apply, so
 * Cancel really is cancel and the builder's undo stack gains one step per
 * Apply rather than one per toggle.
 */

type Card = ViewLayout["card"];

const ADDABLE_FIELDS = ["Owner & Followers", "Tags", "Email", "Phone", "Company name", "Lead source", "Contact type"];
const ADDABLE_ACTIONS = ["Delete", "Call", "Email", "Message", "Add to workflow"];

export const CUSTOM_FIELDS = [
  { id: "dob", label: "Date of birth", sample: "03/14/1991" },
  { id: "language", label: "Preferred language", sample: "English" },
  { id: "ltv", label: "Lifetime value", sample: "$12,500" },
  { id: "company-size", label: "Company size", sample: "51–200" },
  { id: "renewal", label: "Renewal date", sample: "01/14/2027" },
  { id: "timezone", label: "Time zone", sample: "Central (CT)" },
];
const MAX_CUSTOM = 2;

const FIELD_SAMPLE: Record<string, string> = {
  Email: "olivia.john@example.com",
  Phone: "(555) 214-8890",
  "Company name": "Northwind Traders",
  "Lead source": "Website form",
  "Contact type": "Lead",
};

const ACTION_ICON: Record<string, LucideIcon> = {
  Delete: Trash2,
  Call: Phone,
  Email: Mail,
  Message: MessageSquare,
  "Add to workflow": Workflow,
};

const TAGS = ["High value VIP lead", "WIP", "Opportunity best fit from workshop", "Shared lead", "Hot lead"];

/** The drawers float over a dimmed page, as the builder's screenshots show. */
function Scrim({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close panel"
      tabIndex={-1}
      onClick={onClose}
      className="motion-fade-in fixed inset-0 z-[79] cursor-default bg-[#10182866]"
    />
  );
}

function DrawerFooter({ onCancel, onApply }: { onCancel: () => void; onApply: () => void }) {
  return (
    <div className="ml-auto flex items-center gap-[12px]">
      <OutlineButton className="h-[36px]" onClick={onCancel}>
        Cancel
      </OutlineButton>
      <PrimaryButton className="h-[36px]" onClick={onApply}>
        Apply
      </PrimaryButton>
    </div>
  );
}

function SectionHead({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-[8px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">{title}</h3>
        {hint ? <p className="text-[13px] leading-[18px] text-pg-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ─── Edit contact card ─────────────────────────────────────────────────── */

export function EditCardDrawer({
  card,
  onApply,
  onClose,
}: {
  card: Card;
  onApply: (next: Card) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = React.useState<Card>(() => structuredClone(card));
  const set = (patch: Partial<Card>) => setDraft((d) => ({ ...d, ...patch }));
  const setVisible = (key: keyof Card["visible"], on: boolean) =>
    setDraft((d) => ({ ...d, visible: { ...d.visible, [key]: on } }));

  return (
    <>
      <Scrim onClose={onClose} />
      <SideDrawer
        title="Edit contact card"
        width={880}
        onClose={onClose}
        bodyClassName="flex gap-[16px] overflow-hidden px-[16px] py-[12px]"
        footer={<DrawerFooter onCancel={onClose} onApply={() => onApply(draft)} />}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-[24px] overflow-y-auto pr-[4px] pb-[8px]">
          <section className="flex flex-col gap-[12px]">
            <SectionHead
              title={`Fields (${draft.fields.length})`}
              action={
                <AddMenu
                  items={ADDABLE_FIELDS.filter((f) => !draft.fields.includes(f)).map((f) => ({ id: f, label: f }))}
                  onPick={(f) => set({ fields: [...draft.fields, f] })}
                  emptyTitle="Every field is on the card"
                />
              }
            />
            <SortableRows items={draft.fields} onChange={(fields) => set({ fields })} />
          </section>

          <section className="flex flex-col gap-[12px]">
            <SectionHead
              title="Actions"
              action={
                <AddMenu
                  items={ADDABLE_ACTIONS.filter((a) => !draft.actions.includes(a)).map((a) => ({
                    id: a,
                    label: a,
                    icon: ACTION_ICON[a],
                  }))}
                  onPick={(a) => set({ actions: [...draft.actions, a] })}
                  emptyTitle="Every action is on the card"
                />
              }
            />
            <SortableRows items={draft.actions} onChange={(actions) => set({ actions })} />
          </section>

          <section className="flex flex-col gap-[12px]">
            <SectionHead title="Visible on card" />
            <div className="flex flex-col gap-[8px]">
              {(
                [
                  ["engagement", "Engagement score"],
                  ["owner", "Owner"],
                  ["followers", "Followers"],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="flex h-[44px] items-center gap-[10px] rounded-[8px] px-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
                >
                  <span className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text">{label}</span>
                  <Toggle
                    checked={draft.visible[key]}
                    onChange={(on) => setVisible(key, on)}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-[12px]">
            <SectionHead title="Custom fields" hint="Select up to 2 custom fields to display" />
            <CustomFieldPicker value={draft.customFields} onChange={(customFields) => set({ customFields })} />
          </section>
        </div>

        <CardPreview card={draft} />
      </SideDrawer>
    </>
  );
}

/**
 * A multi-select capped at two. Past the cap the unchosen rows grey out
 * rather than silently swapping, so nobody loses a pick they meant to keep.
 */
function CustomFieldPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const full = value.length >= MAX_CUSTOM;
  const chosen = CUSTOM_FIELDS.filter((f) => value.includes(f.id));

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-h-[36px] w-full items-center gap-[6px] rounded-[8px] bg-pg-surface px-[12px] py-[4px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-[4px]">
          {chosen.length === 0 ? (
            <span className="text-[14px] leading-[20px] text-pg-faint">Select custom fields</span>
          ) : (
            chosen.map((f) => (
              <span
                key={f.id}
                className="inline-flex h-[24px] items-center gap-[4px] rounded-[6px] bg-pg px-[8px] text-[13px] leading-[18px] text-pg-text"
              >
                {f.label}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${f.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter((v) => v !== f.id));
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(value.filter((v) => v !== f.id));
                  }}
                  className="flex text-pg-faint hover:text-pg-heading"
                >
                  <X size={12} aria-hidden="true" />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close options"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default"
          />
          <div
            role="listbox"
            aria-multiselectable="true"
            className="absolute top-[calc(100%+4px)] left-0 z-[61] flex w-full flex-col rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {CUSTOM_FIELDS.map((f) => {
              const on = value.includes(f.id);
              const blocked = full && !on;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  disabled={blocked}
                  onClick={() => onChange(on ? value.filter((v) => v !== f.id) : [...value, f.id])}
                  className={cn(
                    "flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg",
                    blocked && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
                      on ? "bg-brand text-brand-fg" : "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                    )}
                  >
                    {on ? <Check size={11} strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">
                    {f.label}
                  </span>
                </button>
              );
            })}
            <p className="px-[10px] pt-[6px] pb-[4px] text-[12px] leading-[16px] text-pg-faint">
              {value.length} of {MAX_CUSTOM} selected
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Olivia John's card, drawn from the draft so every change lands live. */
function CardPreview({ card }: { card: Card }) {
  const showOwner = card.visible.owner;
  const showFollowers = card.visible.followers;

  return (
    <div className="flex w-[400px] shrink-0 flex-col gap-[16px] overflow-y-auto rounded-[12px] bg-pg p-[16px]">
      <h3 className="text-[14px] leading-[20px] font-medium text-pg-muted">Preview</h3>

      <div className="flex flex-col gap-[16px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="flex items-center gap-[10px]">
          <ToneAvatar name="Olivia John" tone="green" size={32} round />
          <span className="min-w-0 truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
            Olivia John
          </span>
          {card.visible.engagement ? (
            <span
              title="Engagement score"
              className="flex h-[22px] shrink-0 items-center rounded-[4px] bg-brand px-[6px] text-[13px] leading-none font-semibold text-brand-fg"
            >
              85
            </span>
          ) : null}
          <span className="ml-auto flex shrink-0 items-center gap-[2px]">
            {card.actions.map((a) => {
              const Icon = ACTION_ICON[a] ?? Pencil;
              return (
                <span
                  key={a}
                  title={a}
                  className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-text"
                >
                  <Icon size={16} aria-label={a} />
                </span>
              );
            })}
          </span>
        </div>

        {card.fields.map((f) => {
          if (f === "Owner & Followers") {
            if (!showOwner && !showFollowers) return null;
            return (
              <div key={f} className="grid grid-cols-2 gap-[12px]">
                {showOwner ? (
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[13px] leading-[18px] text-pg-text">Owner</span>
                    <span className="flex h-[28px] w-fit items-center gap-[6px] rounded-full px-[6px] pr-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                      <ToneAvatar name="Devon Lane" tone="orange" size={18} round />
                      <span className="text-[13px] leading-[18px] text-pg-text">Devon Lane</span>
                      <ChevronDown size={13} aria-hidden="true" className="text-pg-faint" />
                    </span>
                  </div>
                ) : null}
                {showFollowers ? (
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[13px] leading-[18px] text-pg-text">Followers</span>
                    <span className="flex h-[28px] w-fit items-center gap-[4px] rounded-full px-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                      <ToneAvatar name="Devon Lane" tone="orange" size={18} round />
                      <ChevronDown size={13} aria-hidden="true" className="text-pg-faint" />
                    </span>
                  </div>
                ) : null}
              </div>
            );
          }
          if (f === "Tags") {
            return (
              <div key={f} className="flex flex-col gap-[6px]">
                <span className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-text">
                  Tags ({TAGS.length})
                  <CirclePlus size={14} aria-hidden="true" className="text-brand" />
                </span>
                <div className="flex flex-wrap gap-[6px]">
                  {TAGS.map((t) => (
                    <span
                      key={t}
                      className="inline-flex h-[24px] max-w-[220px] items-center gap-[4px] rounded-[4px] px-[6px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
                    >
                      <span className="truncate">{t}</span>
                      <X size={11} aria-hidden="true" className="shrink-0 text-pg-faint" />
                    </span>
                  ))}
                </div>
                <span className="flex items-center gap-[4px] text-[13px] leading-[18px] font-medium text-brand">
                  40 more
                  <ChevronDown size={13} aria-hidden="true" />
                </span>
              </div>
            );
          }
          return (
            <div key={f} className="flex flex-col gap-[2px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">{f}</span>
              <span className="text-[14px] leading-[20px] text-pg-text">{FIELD_SAMPLE[f] ?? "—"}</span>
            </div>
          );
        })}

        {CUSTOM_FIELDS.filter((c) => card.customFields.includes(c.id)).map((c) => (
          <div key={c.id} className="flex flex-col gap-[2px]">
            <span className="text-[13px] leading-[18px] text-pg-muted">{c.label}</span>
            <span className="text-[14px] leading-[20px] text-pg-text">{c.sample}</span>
          </div>
        ))}
      </div>

      <p className="mt-auto pt-[16px] text-center text-[13px] leading-[18px] text-pg-faint">
        This shows a preview of the contact card based on the current configuration.
      </p>
    </div>
  );
}

/* ─── Edit tabs ─────────────────────────────────────────────────────────── */

const DYNAMIC_OPTIONS = ["DND", "Payments", "Documents", "Appointments"].map((v) => ({ value: v, label: v }));

/**
 * All fields | dynamic tab | Actions.
 *
 * The order is fixed — the dynamic tab always sits between the two — so the
 * grips are drawn to match the product but do not drag; the layout has no
 * tab order to store. The pencils apply and jump to that tab in the builder,
 * which is where its folders or modules are actually edited.
 */
export function EditTabsDrawer({
  dynamicTab,
  onApply,
  onEditTab,
  onClose,
}: {
  dynamicTab: string | null;
  onApply: (next: string | null) => void;
  onEditTab: (next: string | null, tab: "fields" | "actions") => void;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<string | null>(dynamicTab);

  const cardClass = "flex flex-col gap-[6px] rounded-[8px] bg-pg px-[16px] py-[14px]";
  const handle = (
    <span aria-hidden="true" className="flex text-pg-faint">
      <GripVertical size={15} />
    </span>
  );

  return (
    <>
      <Scrim onClose={onClose} />
      <SideDrawer
        title="Edit tabs"
        width={460}
        onClose={onClose}
        bodyClassName="flex flex-col gap-[16px] px-[16px] py-[12px]"
        footer={<DrawerFooter onCancel={onClose} onApply={() => onApply(tab)} />}
      >
        <div className={cardClass}>
          <div className="flex items-center gap-[10px]">
            {handle}
            <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-medium text-pg-heading">All fields</span>
            <button
              type="button"
              aria-label="Edit all fields"
              onClick={() => onEditTab(tab, "fields")}
              className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-heading"
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
          </div>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Manage all folders and fields. Show or hide them from users as needed.
          </p>
        </div>

        <div className="flex flex-col gap-[10px] rounded-[8px] border border-dashed border-pg-border-strong px-[16px] py-[14px]">
          <div className="flex items-center gap-[10px]">
            {handle}
            <span className="text-[13px] leading-[18px] font-medium text-pg-muted">Dynamic tab</span>
          </div>
          {tab ? (
            <div className="flex h-[40px] items-center gap-[8px] rounded-[8px] bg-brand-soft px-[16px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_30%,transparent)]">
              <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-brand">{tab}</span>
              <button
                type="button"
                aria-label={`Remove ${tab}`}
                onClick={() => setTab(null)}
                className="flex size-[24px] items-center justify-center rounded-[6px] text-brand motion-tap hover:bg-pg-surface"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Select
              value={null}
              options={DYNAMIC_OPTIONS}
              onChange={setTab}
              placeholder="Select a module or tab"
              aria-label="Dynamic tab"
            />
          )}
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Add a module to appear as a separate tab. This will be placed between all fields and actions tab.
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-[10px]">
            {handle}
            <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-medium text-pg-heading">Actions</span>
            <button
              type="button"
              aria-label="Edit actions"
              onClick={() => onEditTab(tab, "actions")}
              className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-heading"
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
          </div>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Show, hide, or rearrange modules from users as needed.
          </p>
        </div>
      </SideDrawer>
    </>
  );
}
