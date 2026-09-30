"use client";

import * as React from "react";
import { Check, ChevronDown, Search, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAFF, staffById, type StaffLocation } from "./cal-settings-store";
import { MergeFieldInput, StaffAvatar } from "./builder-fields";
import {
  FIELD,
  Field,
  InfoTip,
  PlainSelect,
  SectionCard,
  type SectionProps,
} from "./edit-controls";

/** 89 / 104 / 105 — who takes these meetings, and where each of them meets. */

const LOCATION_KINDS = [
  { value: "custom", label: "Custom" },
  { value: "zoom", label: "Zoom" },
  { value: "google-meet", label: "Google Meet" },
  { value: "phone", label: "Phone call" },
  { value: "address", label: "In-person address" },
  { value: "teams", label: "Microsoft Teams" },
];

/*
 * The conferencing kinds make their own link when a meeting is booked, so
 * they have nothing to type; the other three need the address, number or
 * link from the operator.
 */
const GENERATED: Record<string, string> = {
  zoom: "A Zoom link is created for each meeting when it's booked.",
  "google-meet": "A Google Meet link is created for each meeting when it's booked.",
  teams: "A Microsoft Teams link is created for each meeting when it's booked.",
};
const PLACEHOLDER: Record<string, string> = {
  custom: "Meeting location",
  phone: "(eg) +1 (555) 123-4567",
  address: "(eg) 123 Main St, Dallas, TX",
};

const newLocation = (userId: string): StaffLocation => ({
  userId,
  kind: "custom",
  value: "",
  displayLabel: "",
});

export function StaffLocationSection({ draft, patch, errors }: SectionProps) {
  const staff = draft.staffIds.flatMap((id) => staffById(id) ?? []);

  const setStaff = (ids: string[]) => {
    const added = ids.filter((id) => !draft.staffIds.includes(id));
    patch({
      staffIds: ids,
      // A new teammate arrives with one Custom location to fill in, as live;
      // a removed one takes their locations with them.
      locations: [
        ...draft.locations.filter((l) => ids.includes(l.userId)),
        ...added.map(newLocation),
      ],
    });
  };

  return (
    <SectionCard
      title="Staff & meeting location"
      description="Assign staff to this calendar and set where meetings take place."
    >
      <Field
        label="Select staff & assign meeting location"
        info="Staff who take meetings on this calendar. Each can meet in a different place."
        error={errors?.staffIds}
      >
        <StaffPicker value={draft.staffIds} onChange={setStaff} />
      </Field>

      {staff.map((s) => (
        <StaffLocations
          key={s.id}
          staffId={s.id}
          name={s.name}
          initials={s.initials}
          locations={draft.locations}
          onChange={(locations) => patch({ locations })}
        />
      ))}
    </SectionCard>
  );
}

/** One teammate's row: who, on the left; their locations, on the right. */
function StaffLocations({
  staffId,
  name,
  initials,
  locations,
  onChange,
}: {
  staffId: string;
  name: string;
  initials: string;
  locations: StaffLocation[];
  onChange: (next: StaffLocation[]) => void;
}) {
  // Indexes into the whole array, so edits write back to the right entry.
  const mine = locations.map((l, i) => ({ l, i })).filter(({ l }) => l.userId === staffId);
  const update = (i: number, p: Partial<StaffLocation>) =>
    onChange(locations.map((l, j) => (j === i ? { ...l, ...p } : l)));

  return (
    <div className="flex flex-col gap-[16px] md:flex-row md:gap-[24px]">
      <div className="flex min-w-0 items-center gap-[10px] self-start md:w-[calc(35%-12px)] md:pt-[4px]">
        <StaffAvatar initials={initials} size={32} />
        <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
          {name}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
        {mine.map(({ l, i }, n) => (
          <LocationRow
            key={i}
            first={n === 0}
            location={l}
            onChange={(p) => update(i, p)}
            onRemove={() => onChange(locations.filter((_, j) => j !== i))}
          />
        ))}
        {mine.length === 0 ? (
          <p className="text-[13px] leading-[18px] text-pg-muted">
            No meeting location yet. Contacts will be asked where to meet.
          </p>
        ) : null}
        <div className="flex items-center justify-end gap-[8px] border-t border-pg-head-border pt-[16px]">
          <button
            type="button"
            onClick={() => onChange([...locations, newLocation(staffId)])}
            className="motion-tap flex h-[36px] items-center rounded-[8px] bg-brand-soft px-[14px] text-[14px] leading-[20px] font-medium text-brand hover:brightness-95 active:scale-[0.97]"
          >
            Add location
          </button>
          <InfoTip text="Offer more than one place to meet. Contacts choose one when they book." />
        </div>
      </div>
    </div>
  );
}

function LocationRow({
  first,
  location,
  onChange,
  onRemove,
}: {
  first: boolean;
  location: StaffLocation;
  onChange: (p: Partial<StaffLocation>) => void;
  onRemove: () => void;
}) {
  // Revealed by the link; stays open once a label is written.
  const [labelOpen, setLabelOpen] = React.useState(location.displayLabel !== "");
  const generated = GENERATED[location.kind];
  const showLabel = labelOpen || location.displayLabel !== "";

  const toggleLabel = () => {
    if (showLabel) {
      setLabelOpen(false);
      onChange({ displayLabel: "" });
    } else setLabelOpen(true);
  };
  const labelText = showLabel ? "Remove display label" : "Add display label";
  const labelTip =
    "A friendlier name contacts see instead of the raw address or link — (eg) Main office.";

  return (
    <div className="flex flex-col gap-[12px]">
      <Field
        label={first ? "Meeting location" : "Another meeting location"}
        info={first ? "Where the meeting takes place. Pick Custom to enter any address or link." : undefined}
      >
        <div className="flex items-center gap-[12px]">
          <PlainSelect
            aria-label="Meeting location type"
            value={location.kind}
            onChange={(kind) => onChange({ kind, value: "" })}
            options={LOCATION_KINDS}
          />
          <button
            type="button"
            aria-label="Remove meeting location"
            title="Remove meeting location"
            onClick={onRemove}
            className="motion-tap flex size-[36px] shrink-0 items-center justify-center rounded-[8px] text-pg-text-strong hover:bg-pg hover:text-[var(--hr-error-600)]"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </Field>

      {generated ? (
        <p className="text-[13px] leading-[18px] text-pg-muted">{generated}</p>
      ) : (
        <MergeFieldInput
          aria-label="Meeting location"
          value={location.value}
          onChange={(value) => onChange({ value })}
          placeholder={PLACEHOLDER[location.kind] ?? "Meeting location"}
          trailing={
            <button
              type="button"
              onClick={toggleLabel}
              className="flex items-center gap-[6px] rounded-r-[8px] px-[14px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-brand hover:bg-brand-soft"
            >
              {labelText}
              <InfoTip text={labelTip} />
            </button>
          }
        />
      )}
      {generated ? (
        <div className="flex items-center gap-[6px]">
          <button
            type="button"
            onClick={toggleLabel}
            className="text-[14px] leading-[20px] font-medium text-brand hover:underline"
          >
            {labelText}
          </button>
          <InfoTip text={labelTip} />
        </div>
      ) : null}

      {showLabel ? (
        <input
          autoFocus={labelOpen && location.displayLabel === ""}
          aria-label="Display label"
          value={location.displayLabel}
          onChange={(e) => onChange({ displayLabel: e.target.value })}
          placeholder="Display label (eg) Main office"
          className={FIELD}
        />
      ) : null}
    </div>
  );
}

/**
 * The staff multi-select: chips in the field, a checklist below it.
 *
 * Hand-rolled on the prototype's usual pattern — an absolutely positioned
 * card over a full-screen click-catcher — with a search once the list is long
 * enough to need one.
 */
function StaffPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const listId = React.useId();
  const shown = STAFF.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="relative">
      <div
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label="Select staff member"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className={cn(
          "flex min-h-[36px] w-full cursor-pointer items-center gap-[6px] rounded-[8px] bg-pg-surface py-[4px] pr-[34px] pl-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)] outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        {value.length === 0 ? (
          <span className="px-[4px] text-[14px] leading-[20px] text-pg-faint">Select staff member</span>
        ) : (
          <div className="flex flex-wrap gap-[6px]">
            {value.map((id) => (
              <span
                key={id}
                className="flex h-[26px] items-center gap-[6px] rounded-[6px] bg-pg-surface pr-[4px] pl-[8px] text-[14px] leading-[20px] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]"
              >
                {staffById(id)?.name ?? id}
                <button
                  type="button"
                  aria-label={`Remove ${staffById(id)?.name ?? "staff member"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(id);
                  }}
                  className="flex size-[18px] items-center justify-center rounded-[4px] text-pg-muted hover:bg-pg hover:text-pg-heading"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-[11px] right-[12px] text-pg-faint transition-transform",
            open && "rotate-180",
          )}
        />
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close staff list"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            className="absolute top-[calc(100%+4px)] right-0 left-0 z-40 flex flex-col rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            <label className="relative mb-[4px] flex items-center">
              <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-[10px] text-pg-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search staff"
                aria-label="Search staff"
                className={cn(FIELD, "h-[32px] pl-[30px]")}
              />
            </label>
            {shown.map((s) => {
              const on = value.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "flex h-[36px] items-center gap-[10px] rounded-[6px] px-[8px] text-left hover:bg-pg",
                    on && "bg-brand-soft hover:bg-brand-soft",
                  )}
                >
                  <StaffAvatar initials={s.initials} size={24} />
                  <span className={cn("min-w-0 flex-1 truncate text-[14px] leading-[20px]", on ? "font-medium text-brand" : "text-pg-text-strong")}>
                    {s.name}
                  </span>
                  {on ? <Check size={16} aria-hidden="true" className="text-brand" /> : null}
                </button>
              );
            })}
            {shown.length === 0 ? (
              <span className="px-[8px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                No staff match &ldquo;{query}&rdquo;.
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
