"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Copy, Settings, X } from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import type { Appointment } from "@/components/contacts/appointments-panel";
import type { Task } from "@/components/contacts/tasks-panel";
import type { Note } from "@/components/contacts/notes-panel";
import type { PaymentsData } from "@/components/contacts/payments-panel";
import type { AssociatedObject } from "@/components/contacts/associated-objects";
import { useRecordSlice } from "@/components/contacts/record-store";
import { ME } from "@/components/product/conversations/conversations-data";
import { cn } from "@/lib/utils";
import type { Opportunity } from "./opportunities-data";
import { UnsavedChangesModal } from "./opportunity-delete-modal";
import {
  AppointmentSection,
  AssociationsSection,
  CustomSection,
  DetailsSection,
  EMPTY_CUSTOM,
  NotesSection,
  PaymentsSection,
  TasksSection,
  draftErrors,
  draftFrom,
  recordFromDraft,
  seedAppointmentsFor,
  seedAssociations,
  seedOppNotes,
  seedOppPayments,
  seedOppTasks,
  stagesFor,
  type CustomValues,
  type Draft,
} from "./opportunity-edit-sections";

export type EditSection =
  | "details"
  | "custom"
  | "appointment"
  | "tasks"
  | "notes"
  | "payments"
  | "associations";

const NAV: { id: EditSection; label: string }[] = [
  { id: "details", label: "Opportunity details" },
  { id: "custom", label: "Additional info" },
  { id: "appointment", label: "Book or update appointment" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "payments", label: "Payments" },
  { id: "associations", label: "Associated objects" },
];

/** The sections that commit through the footer's Save; the rest save as they go. */
const DRAFT_SECTIONS: EditSection[] = ["details", "custom", "appointment"];

const AUDIT_ID = "IhktoVMyOytSqKIe8mnm";

const DEFAULT_PIPELINE = "services";

/**
 * The record a create starts from. Its id is minted once, on mount, so the
 * sections that save as they go — tasks, notes, payments, associations —
 * have an `opp:<id>` to save under before the opportunity itself exists.
 */
function blankOpportunity(stageId: string): Opportunity {
  return {
    id: `opp-${Date.now()}`,
    name: "",
    contact: "",
    value: "",
    stageId,
    owner: ME.name,
    updated: "Just now",
    source: "",
    tone: "blue",
    status: "open",
  };
}

/**
 * Edit opportunity — the full record in one modal, a section nav on the left.
 *
 * Details, additional info, and the appointment are one draft behind one
 * Save, so leaving with edits in them asks first. Tasks, notes, payments, and
 * associations reuse the contact rail's bodies and save as they go, the way
 * they do everywhere else, into the record store under `opp:<id>`.
 *
 * Portalled at z-[89] rather than the Modal's 95: the reused association
 * picker portals at z-[90], and it has to land above this dialog. Everything
 * this opens on top — the booking modal, the unsaved-changes confirm (95),
 * the task menus (96), the pickers (100) — still stacks over it.
 *
 * Escape listens in the bubble phase on purpose. Every menu and nested modal
 * in the app catches Escape in capture and stops it, so one press closes the
 * topmost thing only and reaches this dialog last.
 *
 * Add opportunity is this same modal in create mode, not a second form: a
 * blank draft, a required primary-contact picker at the top of details, and
 * one "Create opportunity" that commits everything and closes. Without a
 * `record`, the modal is in create mode whatever `mode` says.
 */
export function OpportunityEditModal({
  record,
  mode = "edit",
  defaultStageId,
  defaultPipelineId,
  initialSection = "details",
  onClose,
  onSave,
  onDelete,
}: {
  /** Required to edit; ignored in create mode. */
  record?: Opportunity;
  mode?: "edit" | "create";
  /** Create mode: the column the add started from. Falls back to the pipeline's first open stage. */
  defaultStageId?: string;
  /** Create mode: the pipeline the board is showing. */
  defaultPipelineId?: string;
  initialSection?: EditSection;
  onClose: () => void;
  onSave: (next: Opportunity) => void;
  onDelete?: () => void;
}) {
  const { effective } = useTheme();
  const creating = mode === "create" || !record;
  const [blank] = React.useState(() =>
    blankOpportunity(
      defaultStageId ??
        stagesFor(defaultPipelineId ?? DEFAULT_PIPELINE).find((s) => s.tone === "open")?.id ??
        "",
    ),
  );
  const source = creating ? blank : record;
  const recordId = `opp:${source.id}`;
  const [pipelineId, setPipelineId] = useRecordSlice<string>(
    recordId,
    "pipeline",
    () => (creating ? defaultPipelineId : undefined) ?? DEFAULT_PIPELINE,
  );
  const [custom, setCustom] = useRecordSlice<CustomValues>(recordId, "custom", () => ({ ...EMPTY_CUSTOM }));
  const [appointments, setAppointments] = useRecordSlice<Appointment[]>(recordId, "appointments", () =>
    seedAppointmentsFor(source),
  );
  /*
   * What the save-as-you-go sections hold, read with the sections' own seeds
   * (so whichever mounts first seeds the same thing). Only create mode looks
   * at them: a create with a task or a note in it asks before it is dropped.
   */
  const [tasks] = useRecordSlice<Task[]>(recordId, "tasks", () => seedOppTasks(source));
  const [notes] = useRecordSlice<Note[]>(recordId, "notes", () => seedOppNotes(source));
  const [payments] = useRecordSlice<PaymentsData>(recordId, "payments", () => seedOppPayments(source));
  const [associations] = useRecordSlice<AssociatedObject[]>(recordId, "associations", () =>
    seedAssociations(source),
  );

  const [section, setSection] = React.useState<EditSection>(initialSection);
  const [base, setBase] = React.useState<{ record: Opportunity; draft: Draft }>(() => ({
    record: source,
    draft: draftFrom(source, pipelineId, custom, appointments),
  }));
  const [draft, setDraft] = React.useState<Draft>(base.draft);
  const [confirming, setConfirming] = React.useState(false);

  const errors = draftErrors(draft);
  const valid = Object.values(errors).every((e) => e === null);
  const draftDirty = JSON.stringify(draft) !== JSON.stringify(base.draft);
  const sideEntered =
    tasks.length > 0 ||
    notes.length > 0 ||
    associations.length > 0 ||
    Object.values(payments).some((rows) => rows.length > 0);
  // A create is dirty once anything is in it, including what saved as it went.
  const dirty = draftDirty || (creating && sideEntered);

  /*
   * What the sections draw from. Edit mode hands them the saved record, as it
   * always has; create mode has nothing saved, so they follow the draft's
   * contact and name as you fill them in.
   */
  const view: Opportunity = creating
    ? {
        ...base.record,
        name: draft.name.trim(),
        contact: draft.contact.trim(),
        tone: draft.contactTone,
        phone: draft.contactPhone.trim() || undefined,
      }
    : base.record;

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const requestClose = React.useCallback(() => {
    if (dirty) setConfirming(true);
    else onClose();
  }, [dirty, onClose]);

  React.useEffect(() => {
    if (confirming) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirming, requestClose]);

  const save = () => {
    if (!dirty || !valid) return;
    const next = recordFromDraft(base.record, draft);
    setPipelineId(draft.pipelineId);
    setCustom(draft.custom);
    setAppointments(draft.appointments);
    const saved = { ...draft, value: next.value.replace(/^\$/, ""), name: next.name };
    setBase({ record: next, draft: saved });
    setDraft(saved);
    onSave(next);
    showToast("Opportunity updated");
  };

  const create = () => {
    if (!valid) return;
    const next: Opportunity = {
      ...recordFromDraft(base.record, draft),
      contact: draft.contact.trim(),
      tone: draft.contactTone,
      phone: draft.contactPhone.trim() || undefined,
      updated: "Just now",
    };
    setPipelineId(draft.pipelineId);
    setCustom(draft.custom);
    setAppointments(draft.appointments);
    onSave(next);
    showToast("Opportunity created");
    onClose();
  };

  const copyAudit = async () => {
    try {
      await navigator.clipboard.writeText(AUDIT_ID);
      showToast("Audit log ID copied");
    } catch {
      showToast("Can't copy right now. Select the ID and copy it instead.");
    }
  };

  if (typeof document === "undefined") return <></>;

  const showSave = DRAFT_SECTIONS.includes(section);

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[89] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={requestClose}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="opp-edit-title"
        className="motion-panel-in relative flex h-[min(820px,88dvh)] w-[1100px] max-w-full flex-col overflow-hidden rounded-[8px] bg-pg-surface text-[14px] leading-[20px] text-pg-text shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        {/* Header */}
        <header className="flex shrink-0 items-start gap-[12px] border-b border-pg-row-border px-[16px] pt-[12px] pb-[12px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[2px] pt-[2px]">
            <h2 id="opp-edit-title" className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
              {creating ? "Add opportunity" : <>Edit &ldquo;{base.record.name}&rdquo;</>}
            </h2>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              {creating
                ? "Add opportunity details, tasks, notes, and appointments."
                : "Add and edit opportunity details, tasks, notes, and appointments."}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          <nav
            aria-label="Opportunity sections"
            className="flex w-[240px] shrink-0 flex-col border-r border-pg-row-border p-[8px]"
          >
            <ul className="flex flex-col gap-[2px]">
              {NAV.map((item) => {
                const on = item.id === section;
                // A blank create is not flagged until something is in it.
                const flagged =
                  item.id === "details" && !valid && (!creating || draftDirty);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={on ? "page" : undefined}
                      onClick={() => setSection(item.id)}
                      className={cn(
                        "flex h-[36px] w-full items-center gap-[8px] rounded-[6px] px-[12px] text-left text-[14px] leading-[20px] motion-tap",
                        on
                          ? "bg-brand-soft font-semibold text-brand"
                          : "text-pg-text hover:bg-pg hover:text-pg-heading",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {flagged ? (
                        <span
                          aria-label="Needs attention"
                          className="size-[6px] shrink-0 rounded-full bg-[var(--hr-error-500)]"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => showToast("Field settings open in a new tab")}
              className="flex h-[36px] items-center gap-[8px] rounded-[6px] px-[12px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:bg-pg"
            >
              <Settings size={16} aria-hidden="true" />
              Manage fields
            </button>
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto px-[24px] py-[20px]">
            {section === "details" ? (
              <DetailsSection
                record={view}
                draft={draft}
                onChange={patch}
                mode={creating ? "create" : "edit"}
              />
            ) : section === "custom" ? (
              <CustomSection value={draft.custom} onChange={(c) => patch({ custom: c })} />
            ) : section === "appointment" ? (
              <AppointmentSection
                record={view}
                value={draft.appointments}
                onChange={(a) => patch({ appointments: a })}
              />
            ) : section === "tasks" ? (
              <TasksSection record={view} />
            ) : section === "notes" ? (
              <NotesSection record={view} />
            ) : section === "payments" ? (
              <PaymentsSection record={view} />
            ) : (
              <AssociationsSection record={view} />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 flex-wrap items-center gap-x-[16px] gap-y-[8px] border-t border-pg-row-border px-[16px] py-[12px]">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[16px] gap-y-[4px] text-[13px] leading-[18px] text-pg-muted">
            {creating ? (
              <span>Not saved yet</span>
            ) : (
              <>
                <span>
                  Created by:{" "}
                  <button
                    type="button"
                    onClick={() => showToast("Profile opens in a new tab")}
                    className="font-medium text-brand motion-tap hover:underline"
                  >
                    Ragavendar Balaji
                  </button>
                </span>
                <span>Created on: Sep 11, 2026, 3:12 PM (IST)</span>
                <span className="flex items-center gap-[4px]">
                  Audit log: <span className="font-mono text-[12px] text-pg-text">{AUDIT_ID}</span>
                  <button
                    type="button"
                    aria-label="Copy audit log ID"
                    title="Copy audit log ID"
                    onClick={copyAudit}
                    className="flex size-[24px] items-center justify-center rounded-[4px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading active:scale-90"
                  >
                    <Copy size={13} aria-hidden="true" />
                  </button>
                </span>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-[12px]">
            {onDelete && !creating ? (
              <button
                type="button"
                onClick={onDelete}
                className="h-[36px] rounded-[8px] px-[8px] text-[14px] leading-[20px] font-medium text-[var(--hr-error-500)] motion-tap hover:bg-pg"
              >
                Delete opportunity
              </button>
            ) : null}
            <OutlineButton className="h-[36px]" onClick={requestClose}>
              Cancel
            </OutlineButton>
            {creating ? (
              // Create commits from any section: there is no record to save into until it runs.
              <PrimaryButton
                onClick={create}
                disabled={!valid}
                className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
              >
                Create opportunity
              </PrimaryButton>
            ) : showSave ? (
              <PrimaryButton
                onClick={save}
                disabled={!dirty || !valid}
                className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
              >
                Save
              </PrimaryButton>
            ) : null}
          </div>
        </footer>
      </div>

      {confirming ? (
        <UnsavedChangesModal onKeepEditing={() => setConfirming(false)} onDiscard={onClose} />
      ) : null}
    </div>,
    document.body,
  );
}
