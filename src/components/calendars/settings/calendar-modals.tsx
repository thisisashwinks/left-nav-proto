"use client";

import * as React from "react";
import {
  CalendarCheck2,
  ChevronRight,
  Copy,
  Info,
  Plus,
  Presentation,
  Repeat2,
  Settings,
  Ticket,
  Trash2,
  UserRound,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/page/modal";
import { TextInput, Toggle } from "@/components/page/form-controls";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  CALENDAR_TYPES,
  createCalendar,
  deleteCalendar,
  duplicateCalendar,
  emptyDraft,
  ME_ID,
  moveCalendarToGroup,
  setCalendarActive,
  slugify,
  slugTaken,
  STAFF,
  staffById,
  useCalendar,
  useCalendarGroups,
  type CalendarDraft,
  type CalendarType,
  type TimeUnit,
} from "./cal-settings-store";
import { Field, FIELD_ERROR, PlainSelect, UnitField } from "./edit-controls";
import {
  CancelButton,
  ChipMultiSelect,
  ConfirmButton,
  ConfirmModal,
  IconTile,
  PrefixInput,
  TEXTAREA,
} from "./modal-kit";

const TYPE_ICON: Record<CalendarType, LucideIcon> = {
  personal: UserRound,
  "round-robin": Repeat2,
  class: Presentation,
  collective: UsersRound,
  service: Wrench,
  event: Ticket,
};

/** Screenshot 86 — "Choose calendar type". */
export function ChooseTypeModal({
  onClose,
  onChoose,
}: {
  onClose: () => void;
  onChoose: (type: CalendarType) => void;
}) {
  const [more, setMore] = React.useState(false);
  const shown = CALENDAR_TYPES.filter((t) => more || !t.more);

  return (
    <Modal title="Choose calendar type" width={1000} onClose={onClose} bodyClassName="gap-0 pt-0">
      <p className="text-[14px] leading-[20px] text-pg-muted">
        Select a calendar type to set up your calendar and customize how appointments are
        scheduled.
      </p>
      <hr className="mt-[16px] mb-[16px] border-pg-head-border" />
      <div className="grid grid-cols-1 gap-[16px] px-0 sm:grid-cols-2 sm:px-[8px]">
        {shown.map((t) => {
          const Icon = TYPE_ICON[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChoose(t.id)}
              className={cn(
                "flex items-start gap-[12px] rounded-[8px] bg-pg-surface p-[16px] pb-[20px] text-left shadow-[inset_0_0_0_1px_var(--pg-card-border)]",
                "motion-tap hover:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus-visible:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus-visible:outline-none",
                t.more && "motion-fade-in",
              )}
            >
              <Icon size={20} aria-hidden="true" className="mt-[1px] shrink-0 text-brand" />
              <span className="flex min-w-0 flex-col gap-[2px]">
                <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
                  {t.label}
                </span>
                <span className="text-[14px] leading-[20px] text-pg-muted">{t.description}</span>
                <span className="text-[14px] leading-[20px] text-pg-muted">{t.example}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-expanded={more}
        onClick={() => setMore((m) => !m)}
        className="mt-[20px] mb-[8px] flex w-fit items-center gap-[6px] px-[8px] py-[4px] text-[14px] leading-[20px] font-medium text-pg-text-strong motion-tap hover:text-pg-heading"
      >
        <ChevronRight
          size={15}
          aria-hidden="true"
          className={cn("transition-transform", more && "rotate-90")}
        />
        {more ? "Show fewer types" : "Explore more types"}
      </button>
    </Modal>
  );
}

const Divider = () => <hr className="border-pg-head-border" />;

/**
 * Screenshot 87 — the quick "New calendar" form. Confirm creates the calendar
 * and closes; Advanced settings hands the half-filled draft to the builder.
 */
export function NewCalendarModal({
  type,
  onClose,
  onCreated,
  onAdvanced,
}: {
  type: CalendarType;
  onClose: () => void;
  onCreated: (calendarId: string) => void;
  onAdvanced: (type: CalendarType, draft: CalendarDraft) => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState<string | null>(null);
  const [staffIds, setStaffIds] = React.useState<string[]>([ME_ID]);
  // The slug follows the name until the user types into it, then it's theirs.
  const [slugInput, setSlugInput] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState<number | null>(30);
  const [unit, setUnit] = React.useState<TimeUnit>("minutes");
  const [acceptPayments, setAcceptPayments] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; slug?: string; staff?: string }>(
    {},
  );

  const slug = slugInput ?? slugify(name);

  const draft = () =>
    emptyDraft({
      name: name.trim(),
      description: description ?? "",
      slug,
      staffIds,
      durationValue: duration ?? 30,
      durationUnit: unit,
      acceptPayments,
    });

  const confirm = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Please enter a name";
    if (!slug) next.slug = "Slug is required";
    else if (slugTaken(slug)) next.slug = "This URL is already in use. Try another.";
    if (staffIds.length === 0) next.staff = "Select at least 1 team member";
    setErrors(next);
    if (Object.keys(next).length) return;
    const cal = createCalendar(type, draft());
    showToast("Calendar created");
    onCreated(cal.id);
  };

  return (
    <Modal
      title="New calendar"
      width={630}
      onClose={onClose}
      bodyClassName="gap-[20px] pt-[4px]"
      footer={
        <>
          <button
            type="button"
            onClick={() => onAdvanced(type, draft())}
            className="mr-auto flex items-center gap-[8px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
          >
            <Settings size={16} aria-hidden="true" />
            Advanced settings
          </button>
          <CancelButton onClick={onClose} />
          <ConfirmButton onClick={confirm}>Confirm</ConfirmButton>
        </>
      }
    >
      <div className="flex flex-col gap-[12px]">
        <Field
          label="Calendar name"
          info="The name contacts see on the booking page."
          error={errors.name}
        >
          <TextInput
            autoFocus
            aria-label="Calendar name"
            placeholder="(eg) Outbound reach"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
            }}
            className={cn(errors.name && FIELD_ERROR)}
          />
        </Field>
        {description === null ? (
          <button
            type="button"
            onClick={() => setDescription("")}
            className="flex w-fit items-center gap-[8px] py-[4px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
          >
            <Plus size={16} aria-hidden="true" />
            Add description
          </button>
        ) : (
          <Field label="Description">
            <textarea
              autoFocus
              aria-label="Description"
              placeholder="Write a short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={TEXTAREA}
            />
          </Field>
        )}
      </div>

      <Field
        label="Select team member"
        info="The people this calendar books. Each gets their own availability."
        error={errors.staff}
      >
        <ChipMultiSelect
          aria-label="Select team member"
          placeholder="Select team members"
          options={STAFF.map((s) => ({ value: s.id, label: s.name }))}
          value={staffIds}
          invalid={!!errors.staff}
          onChange={(v) => {
            setStaffIds(v);
            if (errors.staff) setErrors((er) => ({ ...er, staff: undefined }));
          }}
        />
      </Field>

      <Divider />

      <Field
        label="Custom URL"
        info="The end of the booking link. Letters, numbers, and hyphens only."
        error={errors.slug}
      >
        <PrefixInput
          aria-label="Custom URL"
          prefix="/widget/bookings/"
          placeholder="my-calendar"
          value={slug}
          invalid={!!errors.slug}
          onChange={(v) => {
            setSlugInput(v.toLowerCase().replace(/\s+/g, "-"));
            if (errors.slug) setErrors((er) => ({ ...er, slug: undefined }));
          }}
        />
      </Field>

      <Divider />

      <Field label="Meeting duration" info="How long each booked meeting lasts.">
        <UnitField
          aria-label="Meeting duration"
          value={duration}
          onChange={setDuration}
          unit={unit}
          onUnitChange={setUnit}
          units={["minutes", "hours"]}
          className="max-w-[390px]"
        />
      </Field>

      <Divider />

      <div className="flex flex-col gap-[8px]">
        <Field
          label="Booking availability"
          info="When each team member can be booked. Set hours in advanced settings."
        >
          {staffIds.length === 0 ? (
            <p className="text-[14px] leading-[20px] text-pg-muted">
              Select a team member to see their availability.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-2">
              {staffIds.map((id) => {
                const s = staffById(id);
                if (!s) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-[10px] rounded-[8px] px-[12px] py-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-pg text-[14px] font-medium text-pg-text-strong"
                    >
                      {s.initials}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[14px] leading-[20px] text-pg-text-strong">
                        {s.name}
                      </span>
                      <span className="text-[12px] leading-[16px] text-pg-muted">
                        No availability
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Field>
        <p className="text-[14px] leading-[20px] text-pg-muted">
          To further customize your business hours, please head to the advanced settings.
        </p>
      </div>

      <Divider />

      <label className="flex w-fit items-center gap-[12px] pb-[16px]">
        <Toggle
          checked={acceptPayments}
          onChange={setAcceptPayments}
          aria-label="Accept payments"
        />
        <span className="text-[14px] leading-[20px] text-pg-text-strong">Accept payments</span>
      </label>
    </Modal>
  );
}

/** 117 — Duplicate this calendar? */
export function DuplicateCalendarModal({
  calendarId,
  onClose,
}: {
  calendarId: string;
  onClose: () => void;
}) {
  const cal = useCalendar(calendarId);
  if (!cal) return null;
  return (
    <ConfirmModal
      icon={<Copy size={17} />}
      title="Duplicate this calendar?"
      message="You're about to duplicate calendar. This will create a new calendar with the same settings as the selected calendar."
      confirmLabel="Duplicate"
      onClose={onClose}
      onConfirm={() => {
        duplicateCalendar(calendarId);
        showToast("Calendar duplicated");
        onClose();
      }}
    />
  );
}

/** 118 — Deactivate this calendar? (and its Activate twin for inactive rows) */
export function DeactivateCalendarModal({
  calendarId,
  onClose,
}: {
  calendarId: string;
  onClose: () => void;
}) {
  const cal = useCalendar(calendarId);
  if (!cal) return null;
  const activate = !cal.active;
  return (
    <ConfirmModal
      icon={<Info size={17} />}
      title={activate ? "Activate this calendar?" : "Deactivate this calendar?"}
      message={activate ? "You're about to activate calendar." : "You're about to deactivate calendar."}
      confirmLabel="Save"
      onClose={onClose}
      onConfirm={() => {
        setCalendarActive(calendarId, activate);
        showToast(activate ? "Calendar activated" : "Calendar deactivated");
        onClose();
      }}
    />
  );
}

/** 119 — Delete this calendar? */
export function DeleteCalendarModal({
  calendarId,
  onClose,
}: {
  calendarId: string;
  onClose: () => void;
}) {
  const cal = useCalendar(calendarId);
  if (!cal) return null;
  return (
    <ConfirmModal
      tone="danger"
      danger
      icon={<Trash2 size={17} />}
      title="Delete this calendar?"
      message="You're about to delete calendar. When you hit delete it will also delete all its appointments."
      confirmLabel="Delete"
      onClose={onClose}
      onConfirm={() => {
        deleteCalendar(calendarId);
        showToast("Calendar deleted");
        onClose();
      }}
    />
  );
}

const NO_GROUP = "__none";

/** 116 — Select calendar group (Move to group). */
export function MoveToGroupModal({
  calendarId,
  onClose,
}: {
  calendarId: string;
  onClose: () => void;
}) {
  const cal = useCalendar(calendarId);
  const groups = useCalendarGroups();
  const [choice, setChoice] = React.useState(cal?.draft.groupId ?? NO_GROUP);
  if (!cal) return null;

  const select = () => {
    const groupId = choice === NO_GROUP ? null : choice;
    if (groupId !== cal.draft.groupId) {
      moveCalendarToGroup(calendarId, groupId);
      const g = groups.find((x) => x.id === groupId);
      showToast(g ? `Calendar moved to ${g.name}` : "Calendar removed from its group");
    }
    onClose();
  };

  return (
    <Modal
      title="Select calendar group"
      icon={
        <IconTile>
          <CalendarCheck2 size={17} />
        </IconTile>
      }
      width={462}
      onClose={onClose}
      bodyClassName="gap-[12px] pt-[4px]"
      footer={
        <>
          <CancelButton onClick={onClose} />
          <ConfirmButton onClick={select}>Select</ConfirmButton>
        </>
      }
    >
      <PlainSelect
        aria-label="Calendar group"
        value={choice}
        onChange={setChoice}
        options={[
          { value: NO_GROUP, label: "Unassigned (no group)" },
          ...groups.map((g) => ({ value: g.id, label: g.name })),
        ]}
      />
    </Modal>
  );
}
