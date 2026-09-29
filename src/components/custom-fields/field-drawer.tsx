"use client";

import * as React from "react";
import { AlignLeft, ChevronDown, Pencil, TextCursorInput } from "lucide-react";
import { Select } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  FIELD_TYPES,
  OBJECTS,
  addField,
  fullKey,
  objectById,
  updateField,
  useCustomFields,
  type CustomField,
  type FieldType,
  type ObjectId,
} from "./custom-fields-data";
import {
  CountedInput,
  CountedTextarea,
  FIELD_BOX,
  FieldLabel,
  FieldNote,
  MenuSelect,
} from "./field-drawer-controls";
import { DefaultValueBody } from "./field-drawer-defaults";
import {
  DESCRIPTION_MAX,
  compatibleTypes,
  effectiveKey,
  initialForm,
  snapshot,
  toRow,
  validate,
  type FieldForm,
} from "./field-drawer-form";
import { FieldPreview } from "./field-drawer-preview";

const KEY_TIP =
  "Use the key to reference this field in templates, workflows, and the API. It can't be changed after the field is created.";

/**
 * Create or edit one custom field, with a live preview beside the form.
 *
 * Unlike the working drawers this one has a scrim: it is a form you finish
 * or abandon, not a panel you work alongside. Every way out — the ×, Cancel,
 * Escape, the scrim — goes through one guard, so a dirty form always asks
 * before it throws edits away. The guard is what SideDrawer gets as its
 * onClose, which is how its own Escape listener is routed through it; the
 * confirm modal catches Escape in the capture phase, so while it is up,
 * Escape closes only the modal.
 *
 * Editing locks what other things already point at: the object and the key.
 * The type may move only within its compatible group.
 */
export function FieldDrawer({
  field,
  defaultObject,
  onClose,
}: {
  field?: CustomField;
  defaultObject?: ObjectId;
  onClose: () => void;
}) {
  const editing = Boolean(field);
  const { fields, folders } = useCustomFields();
  const [form, setForm] = React.useState<FieldForm>(() => initialForm(field, defaultObject, folders));
  const [baseline] = React.useState(() => snapshot(form));
  const [detailsOpen, setDetailsOpen] = React.useState(true);
  const [defaultsOpen, setDefaultsOpen] = React.useState(true);
  const [confirming, setConfirming] = React.useState(false);

  const patch = (next: Partial<FieldForm>) => setForm((f) => ({ ...f, ...next }));
  const dirty = snapshot(form) !== baseline;
  const { valid, errors } = validate(form, fields, field?.id);
  const key = effectiveKey(form);
  const typeMeta = FIELD_TYPES.find((t) => t.id === form.type)!;

  const requestClose = () => (dirty ? setConfirming(true) : onClose());

  const save = () => {
    if (!valid) return;
    const row = toRow(form);
    if (field) {
      updateField(field.id, row);
      showToast("Custom field updated.");
    } else {
      addField(row);
      showToast("Custom field created.");
    }
    onClose();
  };

  const allowed = field ? compatibleTypes(field.type) : null;
  const typeOptions = FIELD_TYPES.map((t) => ({
    value: t.id,
    label: t.label,
    disabledReason: allowed && !allowed.includes(t.id) ? "Not compatible" : undefined,
  }));
  const objectFolders = form.object ? folders.filter((f) => f.object === form.object) : [];

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={requestClose}
        className="motion-fade-in fixed inset-0 z-[79] cursor-default bg-[#10182899]"
      />
      <SideDrawer
        title={
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[16px] leading-[22px] font-medium text-pg-heading">
              {editing ? "Edit custom field" : "Create custom field"}
            </span>
            <span className="truncate text-[14px] leading-[20px] text-pg-muted">
              Customize your field&apos;s details and see live preview
            </span>
          </div>
        }
        onClose={requestClose}
        className="w-[min(1400px,calc(100vw_-_280px))]!"
        bodyClassName="px-[16px] py-[12px]"
        footer={
          <div className="ml-auto flex items-center gap-[12px]">
            <OutlineButton onClick={requestClose} className="h-[36px] text-[14px]">
              Cancel
            </OutlineButton>
            <PrimaryButton
              onClick={save}
              disabled={!valid}
              className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:brightness-100 disabled:active:scale-100"
            >
              {editing ? "Save changes" : "Create custom field"}
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid min-h-full grid-cols-[minmax(0,1fr)_minmax(300px,420px)] items-start gap-[12px]">
          <div className="flex flex-col rounded-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            <Section
              icon={<AlignLeft size={16} aria-hidden="true" />}
              title="Field details"
              open={detailsOpen}
              onToggle={() => setDetailsOpen((v) => !v)}
            >
              <div className="grid grid-cols-2 gap-x-[20px] gap-y-[16px]">
                <div className="flex flex-col gap-[4px]">
                  <FieldLabel htmlFor="cf-type" required>
                    Field type
                  </FieldLabel>
                  <MenuSelect
                    id="cf-type"
                    value={form.type}
                    options={typeOptions}
                    onChange={(v) => patch({ type: v as FieldType })}
                  />
                  {editing ? (
                    <FieldNote>You can switch only to types that keep this field&apos;s data.</FieldNote>
                  ) : null}
                </div>

                <div className="flex flex-col gap-[4px]">
                  <FieldLabel required>Add to object</FieldLabel>
                  <Select
                    value={form.object}
                    options={OBJECTS.map((o) => ({ value: o.id, label: o.label }))}
                    onChange={(v) => {
                      const object = v as ObjectId;
                      if (object === form.object) return;
                      // A new object brings its own folders; start on its first.
                      patch({ object, folderId: folders.find((f) => f.object === object)?.id ?? null });
                    }}
                    placeholder="Select object"
                    disabled={editing}
                    aria-label="Add to object"
                  />
                  {editing ? <FieldNote>A field can&apos;t move to another object.</FieldNote> : null}
                </div>

                <div className="flex flex-col gap-[4px]">
                  <FieldLabel htmlFor="cf-name" required>
                    Field name
                  </FieldLabel>
                  <CountedInput
                    id="cf-name"
                    value={form.name}
                    onChange={(name) => patch({ name })}
                    placeholder="Enter name"
                    autoComplete="off"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <FieldLabel required>Folder name</FieldLabel>
                  <Select
                    value={form.folderId}
                    options={objectFolders.map((f) => ({ value: f.id, label: f.name }))}
                    onChange={(folderId) => patch({ folderId })}
                    placeholder="Select folder"
                    disabled={!form.object}
                    aria-label="Folder name"
                  />
                </div>

                <div className="col-span-2 flex flex-col gap-[4px]">
                  <FieldLabel htmlFor="cf-key" tip={KEY_TIP}>
                    Key
                  </FieldLabel>
                  <KeyRow form={form} editing={editing} patch={patch} keyValue={key} />
                  {errors.key ? <FieldNote tone="error">{errors.key}</FieldNote> : null}
                </div>

                <div className="col-span-2 flex flex-col gap-[4px]">
                  <FieldLabel htmlFor="cf-description">Description</FieldLabel>
                  <CountedTextarea
                    id="cf-description"
                    value={form.description}
                    onChange={(description) => patch({ description })}
                    max={DESCRIPTION_MAX}
                    placeholder="Add a short description to explain this field"
                  />
                </div>
              </div>
            </Section>

            <Section
              icon={<TextCursorInput size={16} aria-hidden="true" />}
              title="Set default value"
              subtitle={typeMeta.hint}
              open={defaultsOpen}
              onToggle={() => setDefaultsOpen((v) => !v)}
              divided
            >
              <DefaultValueBody form={form} patch={patch} errors={errors} />
            </Section>
          </div>

          <div className="self-stretch">
            <FieldPreview form={form} />
          </div>
        </div>
      </SideDrawer>

      {confirming ? (
        <Modal
          title="You have unsaved changes"
          onClose={() => setConfirming(false)}
          footer={
            <>
              <OutlineButton onClick={() => setConfirming(false)} className="h-[36px] text-[14px]">
                Keep editing
              </OutlineButton>
              <button
                type="button"
                onClick={onClose}
                className="motion-tap flex h-[36px] shrink-0 items-center rounded-[8px] bg-pg-danger px-[16px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white hover:brightness-110 active:scale-[0.97]"
              >
                Discard changes
              </button>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-muted">
            If you discard your changes, all unsaved edits will be lost.
          </p>
        </Modal>
      ) : null}
    </>
  );
}

/** One collapsible card section — "Field details", "Set default value". */
function Section({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  divided,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  divided?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(divided && "border-t border-pg-head-border")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-start gap-[10px] px-[12px] py-[16px] text-left motion-tap"
      >
        <span className="mt-[2px] shrink-0 text-pg-text-strong">{icon}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[16px] leading-[22px] font-medium text-pg-heading">{title}</span>
          {subtitle ? <span className="text-[14px] leading-[20px] text-pg-text">{subtitle}</span> : null}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("mt-[3px] shrink-0 text-pg-muted transition-transform duration-150", open && "rotate-180")}
        />
      </button>
      {open ? <div className="px-[12px] pb-[16px]">{children}</div> : null}
    </section>
  );
}

/**
 * The key, read-only until the pencil: then a monospace input that no longer
 * follows the name. Always shown with its full merge-tag form beside it.
 */
function KeyRow({
  form,
  editing,
  patch,
  keyValue,
}: {
  form: FieldForm;
  editing: boolean;
  patch: (next: Partial<FieldForm>) => void;
  keyValue: string;
}) {
  const tag = form.object && keyValue ? fullKey({ object: form.object, key: keyValue }) : null;
  const prefix = form.object ? objectById(form.object).keyPrefix : null;

  if (!editing && form.keyEdited) {
    return (
      <div className="flex flex-col gap-[4px]">
        <input
          id="cf-key"
          autoFocus
          value={form.key}
          onChange={(e) =>
            patch({ key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 60) })
          }
          spellCheck={false}
          autoComplete="off"
          className={cn(FIELD_BOX, "h-[36px] font-mono text-[13px]")}
        />
        {tag ? <span className="font-mono text-[13px] leading-[18px] text-pg-muted">{tag}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-[20px] flex-wrap items-center gap-x-[10px] gap-y-[2px]">
      {keyValue ? (
        <>
          <span className="font-mono text-[13px] leading-[18px] text-pg-muted">{keyValue}</span>
          {!editing ? (
            <button
              type="button"
              aria-label="Edit key"
              onClick={() => patch({ keyEdited: true, key: keyValue })}
              className="flex size-[20px] items-center justify-center rounded-[4px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text"
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
          ) : null}
          {tag ? (
            <span className="font-mono text-[13px] leading-[18px] text-pg-faint">{tag}</span>
          ) : prefix === null ? (
            <span className="text-[13px] leading-[18px] text-pg-faint">Pick an object to see the full key</span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
