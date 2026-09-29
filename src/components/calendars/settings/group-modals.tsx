"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Equal, Info, Trash2 } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { Checkbox, TextInput } from "@/components/page/form-controls";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  calendarsInGroup,
  createGroup,
  deactivateGroup,
  deleteGroup,
  getCalendarGroups,
  SCHEDULING_BASE,
  setGroupOrder,
  slugify,
  updateGroup,
  useCalendarGroups,
  useCalendars,
  type CalendarGroup,
} from "./cal-settings-store";
import { FIELD_ERROR, PlainSelect } from "./edit-controls";
import {
  CancelButton,
  ChipMultiSelect,
  ConfirmButton,
  ConfirmModal,
  CopyField,
  EmbedBlock,
  embedSnippet,
  FieldError,
  FormLabel,
  PrefixInput,
  TEXTAREA,
  UnderlineTabs,
} from "./modal-kit";

function useGroup(id: string | undefined) {
  const groups = useCalendarGroups();
  return id ? groups.find((g) => g.id === id) : undefined;
}

/** "Group name: Abhishek Babu" under a group modal's title. */
function GroupNameLine({ name, divider }: { name: string; divider?: boolean }) {
  return (
    <p
      className={cn(
        "text-[14px] leading-[20px] text-pg-muted",
        divider && "border-b border-pg-head-border pb-[8px]",
      )}
    >
      Group name: {name}
    </p>
  );
}

/** 107 (add, groupId undefined) and 109 (edit). */
export function GroupFormModal({
  groupId,
  onClose,
  onSaved,
}: {
  groupId?: string;
  onClose: () => void;
  onSaved?: (groupId: string) => void;
}) {
  const editing = useGroup(groupId);
  const calendars = useCalendars();
  const isEdit = !!groupId;

  const [name, setName] = React.useState(editing?.name ?? "");
  const [description, setDescription] = React.useState(editing?.description ?? "");
  const [template, setTemplate] = React.useState<CalendarGroup["template"]>(
    editing?.template ?? "neo",
  );
  // A new group's URL follows its name until typed into; an existing one's is fixed.
  const [slugInput, setSlugInput] = React.useState<string | null>(editing?.slug ?? null);
  const [calendarIds, setCalendarIds] = React.useState<string[]>(() =>
    groupId ? calendarsInGroup(groupId).map((c) => c.id) : [],
  );
  const [errors, setErrors] = React.useState<{ name?: string; slug?: string; calendars?: string }>(
    {},
  );
  const nameId = React.useId();
  const descId = React.useId();

  const slug = slugInput ?? slugify(name);

  const save = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Please enter a group name";
    if (!slug) next.slug = "Group URL is required";
    else if (getCalendarGroups().some((g) => g.id !== groupId && g.slug === slug))
      next.slug = "This URL is already in use. Try another.";
    // The live form stars Added calendar(s) as required on edit.
    if (isEdit && calendarIds.length === 0) next.calendars = "Add at least 1 calendar";
    setErrors(next);
    if (Object.keys(next).length) return;

    const fields = { name: name.trim(), description: description.trim(), slug, template };
    if (groupId) {
      updateGroup(groupId, fields, calendarIds);
      showToast("Group updated");
      onSaved?.(groupId);
    } else {
      const g = createGroup(fields);
      showToast("Group created");
      onSaved?.(g.id);
    }
    onClose();
  };

  if (isEdit && !editing) return null;

  return (
    <Modal
      title={isEdit ? "Edit group" : "Add new calendar group"}
      width={600}
      onClose={onClose}
      bodyClassName="gap-[20px] pt-[4px]"
      footer={
        <>
          <CancelButton onClick={onClose} />
          <ConfirmButton onClick={save}>{isEdit ? "Save" : "Create"}</ConfirmButton>
        </>
      }
    >
      <p className="border-b border-pg-head-border pb-[20px] text-[14px] leading-[20px] text-pg-text">
        Use calendar groups to effectively organize and group multiple calendars together.
      </p>

      <div className="flex flex-col gap-[6px]">
        <FormLabel htmlFor={nameId} required>
          Group name
        </FormLabel>
        <TextInput
          id={nameId}
          autoFocus
          placeholder="Group name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
          }}
          className={cn(errors.name && FIELD_ERROR)}
        />
        <FieldError>{errors.name}</FieldError>
      </div>

      <div className="flex flex-col gap-[6px]">
        <FormLabel htmlFor={descId}>Group description</FormLabel>
        <textarea
          id={descId}
          placeholder="Group description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={TEXTAREA}
        />
      </div>

      {isEdit ? (
        <div className="flex flex-col gap-[6px]">
          <FormLabel required>Added calendar(s)</FormLabel>
          <ChipMultiSelect
            aria-label="Added calendars"
            placeholder="Select calendars"
            options={calendars.map((c) => ({ value: c.id, label: c.draft.name || "Untitled" }))}
            value={calendarIds}
            invalid={!!errors.calendars}
            onChange={(v) => {
              setCalendarIds(v);
              if (errors.calendars) setErrors((er) => ({ ...er, calendars: undefined }));
            }}
          />
          <FieldError>{errors.calendars}</FieldError>
        </div>
      ) : null}

      <div className="flex flex-col gap-[8px]">
        <FormLabel hint="You now have the choice to select either the Classic or Neo templates for the Group view.">
          Template
        </FormLabel>
        <PlainSelect
          aria-label="Template"
          value={template}
          onChange={(v) => setTemplate(v as CalendarGroup["template"])}
          options={[
            { value: "neo", label: "Neo" },
            { value: "classic", label: "Classic" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-[6px] pb-[16px]">
        <FormLabel required>Group URL</FormLabel>
        <PrefixInput
          aria-label="Group URL"
          prefix="/widget/groups/"
          placeholder="group-url"
          value={slug}
          invalid={!!errors.slug}
          onChange={(v) => {
            setSlugInput(v.toLowerCase().replace(/\s+/g, "-"));
            if (errors.slug) setErrors((er) => ({ ...er, slug: undefined }));
          }}
        />
        <FieldError>{errors.slug}</FieldError>
      </div>
    </Modal>
  );
}

/** 110–111 — Share group: Scheduling link | Embed code. */
export function ShareGroupModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const group = useGroup(groupId);
  const [tab, setTab] = React.useState<"link" | "embed">("link");
  const [stamp] = React.useState(() => Date.now());
  if (!group) return null;

  const permanent = `${SCHEDULING_BASE}/group/${group.id}`;

  return (
    <Modal title="Share group" width={630} onClose={onClose} bodyClassName="gap-[16px] pt-[8px]">
      <GroupNameLine name={group.name} divider />
      <UnderlineTabs
        tabs={[
          { id: "link", label: "Scheduling link" },
          { id: "embed", label: "Embed code" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div role="tabpanel" className="flex flex-col pt-[4px] pb-[8px]">
        {tab === "link" ? (
          <div className="flex flex-col gap-[40px]">
            <CopyField
              label="Scheduling link"
              value={`${SCHEDULING_BASE}/groups/${group.slug}`}
              hint="The scheduling link is determined by the slug. Adjust the slug, and the scheduling link automatically adapts to the modification."
            />
            <CopyField
              label="Permanent link"
              value={permanent}
              hint="Ideal for funnels, website redirects, or ads, the permanent link remains constant, unaffected by slug changes."
            />
          </div>
        ) : (
          <EmbedBlock what="group" code={embedSnippet(permanent, group.id, stamp)} />
        )}
      </div>
    </Modal>
  );
}

/** 112 — Rearrange calendars. */
export function RearrangeCalendarsModal({
  groupId,
  onClose,
}: {
  groupId: string;
  onClose: () => void;
}) {
  const group = useGroup(groupId);
  const calendars = useCalendars();
  const [order, setOrder] = React.useState<string[]>(() =>
    calendarsInGroup(groupId).map((c) => c.id),
  );
  const [dragId, setDragId] = React.useState<string | null>(null);
  if (!group) return null;

  const nameOf = (id: string) => calendars.find((c) => c.id === id)?.draft.name || "Untitled";
  // Calendars deleted while the modal is open drop out of the list.
  const rows = order.filter((id) => calendars.some((c) => c.id === id));

  const move = (id: string, to: number) => {
    const from = rows.indexOf(id);
    if (from === -1 || to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    next.splice(from, 1);
    next.splice(to, 0, id);
    setOrder(next);
  };

  return (
    <Modal
      title="Rearrange calendars"
      width={504}
      onClose={onClose}
      bodyClassName="gap-[12px] pt-[4px]"
      footer={
        <>
          <CancelButton onClick={onClose} />
          <ConfirmButton
            onClick={() => {
              setGroupOrder(groupId, rows);
              showToast("Calendar order saved");
              onClose();
            }}
          >
            Save
          </ConfirmButton>
        </>
      }
    >
      <GroupNameLine name={group.name} />
      {rows.length === 0 ? (
        <p className="rounded-[8px] bg-pg px-[16px] py-[20px] text-center text-[14px] leading-[20px] text-pg-muted">
          No calendars in this group yet. Add some from Edit group.
        </p>
      ) : (
        <ul aria-label="Calendars in this group" className="flex flex-col gap-[4px] pb-[4px]">
          {rows.map((id, i) => (
            <li
              key={id}
              draggable
              onDragStart={(e) => {
                setDragId(id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", id);
              }}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                if (dragId !== id) move(dragId, i);
              }}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={() => setDragId(null)}
              className={cn(
                "motion-move group/row flex h-[64px] items-center gap-[12px] rounded-[4px] bg-pg px-[20px] text-[14px] leading-[20px] font-semibold text-pg-heading",
                dragId === id && "opacity-50",
              )}
            >
              <Equal
                size={18}
                aria-hidden="true"
                className="shrink-0 cursor-grab text-pg-muted active:cursor-grabbing"
              />
              <span className="min-w-0 flex-1 truncate">{nameOf(id)}</span>
              {rows.length > 1 ? (
                <span className="flex gap-[2px] opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100">
                  <button
                    type="button"
                    aria-label={`Move ${nameOf(id)} up`}
                    disabled={i === 0}
                    onClick={() => move(id, i - 1)}
                    className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading disabled:opacity-30"
                  >
                    <ArrowUp size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${nameOf(id)} down`}
                    disabled={i === rows.length - 1}
                    onClick={() => move(id, i + 1)}
                    className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading disabled:opacity-30"
                  >
                    <ArrowDown size={14} aria-hidden="true" />
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/** 113 — Deactivate group & all associated calendars? */
export function DeactivateGroupModal({
  groupId,
  onClose,
}: {
  groupId: string;
  onClose: () => void;
}) {
  const group = useGroup(groupId);
  if (!group) return null;
  return (
    <ConfirmModal
      icon={<Info size={17} />}
      title="Deactivate group & all associated calendars?"
      message="Are you sure you want to deactivate this group? All calendars within the group will also be deactivated and unavailable for booking."
      confirmLabel="Save"
      onClose={onClose}
      onConfirm={() => {
        deactivateGroup(groupId);
        showToast("Group deactivated");
        onClose();
      }}
    />
  );
}

/** 114 — Delete <group>? */
export function DeleteGroupModal({
  groupId,
  onClose,
  onDeleted,
}: {
  groupId: string;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const group = useGroup(groupId);
  const [withCalendars, setWithCalendars] = React.useState(false);
  if (!group) return null;
  return (
    <ConfirmModal
      tone="danger"
      danger
      icon={<Trash2 size={17} />}
      title={`Delete ${group.name}`}
      message="Are you sure you wish to delete the selected group?"
      confirmLabel="Delete"
      onClose={onClose}
      onConfirm={() => {
        deleteGroup(groupId, withCalendars);
        showToast(withCalendars ? "Group and its calendars deleted" : "Group deleted");
        onDeleted?.();
        onClose();
      }}
    >
      <div className="flex flex-col gap-[4px] pb-[8px]">
        <Checkbox
          checked={withCalendars}
          onChange={setWithCalendars}
          label="Delete associated calendars and appointments"
        />
        <p className="pl-[24px] text-[14px] leading-[22px] text-pg-muted">
          Selecting this option will also delete the calendars in this group, along with all
          appointments in those calendars.
        </p>
      </div>
    </ConfirmModal>
  );
}
