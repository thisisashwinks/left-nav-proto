"use client";

import * as React from "react";
import { Box, BookUser, CodeXml, Info } from "lucide-react";
import { Select, TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { useObjectNames } from "./object-settings-store";
import {
  copyText,
  objectsFor,
  saveAssociation,
  type AssociationDef,
  type ObjectId,
} from "./associations-settings-data";

type Side = "one" | "many";

interface Form {
  object: ObjectId | null;
  kind: "single" | "pair";
  contactLabel: string;
  objectLabel: string;
  /** "Object to Contacts" — how many of this object one associated record holds. */
  contactLimit: Side;
  /** "Contact to Object" — how many associated records one of this object holds. */
  objectLimit: Side;
}

const EMPTY: Form = {
  object: null,
  kind: "pair",
  contactLabel: "",
  objectLabel: "",
  contactLimit: "many",
  objectLimit: "many",
};

// Only user rows are editable, and those only ever hold one / many.
const toSide = (l: AssociationDef["contactLimit"]): Side => (l === "one" ? "one" : "many");

const slug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const DISABLED_BTN =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100";

/**
 * Create / edit association — the drawer behind "+ Create association" and a
 * row's Edit.
 *
 * Everything below the object picker waits for an object: the labels, the
 * limits and the preview all name it, and a form that reads "Label for
 * Objects" is a form about nothing yet. The preview is derived straight from
 * the form, so it reads back exactly what Save will write.
 */
export function AssociationDrawer({
  editing,
  onClose,
}: {
  /** Absent to create. */
  editing?: AssociationDef;
  onClose: () => void;
}) {
  const names = useObjectNames();
  const objects = objectsFor(names);

  const initial = React.useMemo<Form>(
    () =>
      editing
        ? {
            object: editing.object,
            kind: editing.kind,
            contactLabel: editing.contactLabel,
            objectLabel: editing.kind === "pair" ? editing.objectLabel : "",
            contactLimit: toSide(editing.contactLimit),
            objectLimit: toSide(editing.objectLimit),
          }
        : EMPTY,
    [editing],
  );
  const [form, setForm] = React.useState<Form>(initial);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const target = objects.find((o) => o.id === form.object) ?? null;
  const targetOne = target?.singular ?? "Object";
  const targetMany = target?.plural ?? "Objects";
  const ready = target != null;

  const contactLabel = form.contactLabel.trim();
  // A single label names both ends of the relationship.
  const objectLabel = form.kind === "single" ? contactLabel : form.objectLabel.trim();
  const valid = ready && contactLabel.length > 0 && objectLabel.length > 0;
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const canSave = valid && (!editing || dirty);

  const mergeKey = `{{contact.${slug(form.kind === "single" ? contactLabel : objectLabel)}}}`;

  const save = () => {
    if (!canSave || !form.object) return;
    saveAssociation({
      id: editing?.id ?? `assoc-${Date.now()}`,
      object: form.object,
      kind: form.kind,
      contactLabel,
      objectLabel,
      contactLimit: form.contactLimit,
      objectLimit: form.objectLimit,
      createdBy: "user",
    });
    showToast(editing ? "Association updated." : "Association created.");
    onClose();
  };

  const contactRel = `${names.singular} (${contactLabel || "Label"}) to "${target?.plural ?? ""}" (${objectLabel || "Label"})`;
  const objectRel = `${targetOne} (${objectLabel || "Label"}) to "${names.plural}" (${contactLabel || "Label"})`;

  return (
    <>
      {/* A scrim, unlike the working drawers: this is a form you finish or cancel. */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[79] cursor-default bg-[#10182899]"
      />
      <SideDrawer
        title={editing ? "Edit association" : "Create association"}
        width={560}
        onClose={onClose}
        bodyClassName="px-[20px] py-[16px]"
        footer={
          <div className="ml-auto flex items-center gap-[12px]">
            <OutlineButton onClick={onClose} className="h-[36px]">
              Cancel
            </OutlineButton>
            <PrimaryButton
              disabled={!canSave}
              onClick={save}
              className={cn("h-[36px]", DISABLED_BTN)}
            >
              Save
            </PrimaryButton>
          </div>
        }
      >
        <div className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[4px]">
            <FieldLabel required>Select an object to associate with</FieldLabel>
            <Select
              aria-label="Object to associate with"
              value={form.object}
              placeholder="Select custom object"
              options={objects.map((o) => ({ value: o.id, label: o.plural }))}
              onChange={(v) => set("object", v as ObjectId)}
            />
          </div>

          <div role="radiogroup" aria-label="Labels" className="flex flex-col gap-[12px]">
            <Radio
              label="A single label"
              checked={form.kind === "single"}
              disabled={!ready}
              onSelect={() => set("kind", "single")}
            />
            {form.kind === "single" ? (
              <div className="flex flex-col gap-[4px] pl-[26px]">
                <FieldLabel info="The label shown on both records.">Label</FieldLabel>
                <div className="flex items-center gap-[8px]">
                  <TextInput
                    aria-label="Label"
                    placeholder="E.g., Partner"
                    disabled={!ready}
                    value={form.contactLabel}
                    onChange={(e) => set("contactLabel", e.target.value)}
                  />
                  <CopyKey mergeKey={mergeKey} disabled={!contactLabel} />
                </div>
                <Hint>Relate objects with the same label</Hint>
              </div>
            ) : null}

            <Radio
              label="A pair of labels"
              checked={form.kind === "pair"}
              disabled={!ready}
              onSelect={() => set("kind", "pair")}
            />
            {form.kind === "pair" ? (
              <div className="flex flex-col gap-[4px] pl-[26px]">
                <div className="flex items-end gap-[8px]">
                  <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                    <FieldLabel info={`How a ${targetOne.toLowerCase()} sees the ${names.singular.toLowerCase()}.`}>
                      Label for {names.plural}
                    </FieldLabel>
                    <TextInput
                      aria-label={`Label for ${names.plural}`}
                      placeholder="E.g., Buyer"
                      disabled={!ready}
                      value={form.contactLabel}
                      onChange={(e) => set("contactLabel", e.target.value)}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                    <FieldLabel info={`How a ${names.singular.toLowerCase()} sees the ${targetOne.toLowerCase()}.`}>
                      Label for {targetMany}
                    </FieldLabel>
                    <TextInput
                      aria-label={`Label for ${targetMany}`}
                      placeholder="E.g., Seller"
                      disabled={!ready}
                      value={form.objectLabel}
                      onChange={(e) => set("objectLabel", e.target.value)}
                    />
                  </div>
                  <CopyKey mergeKey={mergeKey} disabled={!objectLabel} />
                </div>
                <Hint>Relate objects with their own labels</Hint>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-[16px] border-t border-pg-head-border pt-[20px]">
            <FieldLabel info="Set how many records each side can be associated with." strong>
              Configure relationship
            </FieldLabel>
            <div className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">{contactRel}</span>
              <Select
                aria-label={contactRel}
                disabled={!ready}
                value={form.objectLimit}
                options={[
                  { value: "one", label: `One ${targetOne}` },
                  { value: "many", label: `Many ${targetMany}` },
                ]}
                onChange={(v) => set("objectLimit", v as Side)}
              />
            </div>
            <div className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">{objectRel}</span>
              <Select
                aria-label={objectRel}
                disabled={!ready}
                value={form.contactLimit}
                options={[
                  { value: "one", label: `One ${names.singular}` },
                  { value: "many", label: `Many ${names.plural}` },
                ]}
                onChange={(v) => set("contactLimit", v as Side)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[12px] border-t border-pg-head-border pt-[20px]">
            <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Preview</span>
            <div className="flex flex-col rounded-[12px] bg-pg px-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
              <PreviewRow
                from={<BookUser size={18} aria-hidden="true" />}
                to={<Box size={18} aria-hidden="true" />}
                label={contactLabel}
                many={form.objectLimit === "many"}
                subject={names.singular}
                object={form.objectLimit === "many" ? `many ${targetMany}` : `one ${targetOne}`}
              />
              <PreviewRow
                from={<Box size={18} aria-hidden="true" />}
                to={<BookUser size={18} aria-hidden="true" />}
                label={objectLabel}
                many={form.contactLimit === "many"}
                subject={targetOne}
                object={
                  form.contactLimit === "many" ? `many ${names.plural}` : `one ${names.singular}`
                }
              />
            </div>
          </div>
        </div>
      </SideDrawer>
    </>
  );
}

function FieldLabel({
  children,
  required,
  info,
  strong,
}: {
  children: React.ReactNode;
  required?: boolean;
  info?: string;
  strong?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-[4px] text-[14px] leading-[20px] text-pg-text-strong",
        strong ? "font-semibold" : "font-medium",
      )}
    >
      {children}
      {required ? <span className="text-pg-danger">*</span> : null}
      {info ? (
        <span title={info} className="flex text-pg-faint">
          <Info size={14} aria-label={info} />
        </span>
      ) : null}
    </span>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] leading-[18px] text-pg-muted">{children}</span>;
}

function Radio({
  label,
  checked,
  disabled,
  onSelect,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-fit items-center gap-[10px] text-left motion-tap",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[16px] shrink-0 items-center justify-center rounded-full",
          checked
            ? "bg-brand"
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {checked ? <span className="size-[6px] rounded-full bg-white" /> : null}
      </span>
      <span className="text-[14px] leading-[20px] text-pg-text">{label}</span>
    </button>
  );
}

function CopyKey({ mergeKey, disabled }: { mergeKey: string; disabled: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Copy ${mergeKey}`}
      title={disabled ? "Add a label to copy its key" : `Copy ${mergeKey}`}
      onClick={() => copyText(mergeKey)}
      className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:bg-pg active:scale-95 disabled:cursor-not-allowed disabled:text-pg-disabled disabled:hover:bg-pg-surface disabled:active:scale-100"
    >
      <CodeXml size={16} aria-hidden="true" />
    </button>
  );
}

/**
 * One direction of the relationship: this record — its label — how many of
 * the other it reaches. "Many" is drawn as a stacked tile so the count reads
 * before the badge does.
 */
function PreviewRow({
  from,
  to,
  label,
  many,
  subject,
  object,
}: {
  from: React.ReactNode;
  to: React.ReactNode;
  label: string;
  many: boolean;
  subject: string;
  object: string;
}) {
  const tile =
    "flex size-[32px] shrink-0 items-center justify-center rounded-full bg-pg-surface text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]";
  return (
    <div className="flex flex-col gap-[12px] border-b border-pg-head-border py-[16px] last:border-b-0">
      <div className="flex items-center">
        <span className={tile}>{from}</span>
        <span aria-hidden="true" className="h-px w-[24px] shrink-0 bg-pg-border" />
        <span className="flex h-[32px] min-w-0 flex-1 items-center justify-center truncate rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <span className="truncate">{label || "Label"}</span>
        </span>
        <span aria-hidden="true" className="h-px w-[24px] shrink-0 bg-pg-border" />
        <span className="flex shrink-0 items-center gap-[6px] pr-[8px]">
          <span className="rounded-[6px] bg-pg-surface px-[6px] py-[2px] text-[12px] leading-[16px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
            {many ? "1K" : "1"}
          </span>
          <span
            className={cn(
              tile,
              many &&
                "shadow-[inset_0_0_0_1px_var(--pg-border),4px_0_0_-1px_var(--pg-surface),4px_0_0_0_var(--pg-border),8px_0_0_-1px_var(--pg-surface),8px_0_0_0_var(--pg-border)]",
            )}
          >
            {to}
          </span>
        </span>
      </div>
      <p className="text-center text-[13px] leading-[18px] text-pg-text">
        A <strong className="font-semibold text-pg-heading">{subject}</strong> can be associated
        to <strong className="font-semibold text-pg-heading">{object}</strong>.
      </p>
    </div>
  );
}
