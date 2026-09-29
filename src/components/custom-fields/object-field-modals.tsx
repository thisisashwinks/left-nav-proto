"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import type { SelectOption } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  OBJECTS,
  fieldTypeLabel,
  objectById,
  setSearchable,
  setUnique,
  useCustomFields,
  type FieldType,
  type ObjectId,
} from "./custom-fields-data";
import { DISABLED_PRIMARY, FoldersLabel, FoldersModalFooter, FoldersSelect } from "./folders-select";

const BUTTON = "h-[36px] text-[14px]";
const OBJECT_OPTIONS: SelectOption[] = OBJECTS.map((o) => ({ value: o.id, label: o.label }));

/* ─── Searchable fields ─────────────────────────────────────────────────── */

/** Built-in fields every object can search on, beside its own custom ones. */
const STANDARD: SelectOption[] = [
  { value: "std:business-name", label: "Business name" },
  { value: "std:tags", label: "Tags" },
  { value: "std:city", label: "City" },
  { value: "std:source", label: "Source" },
  { value: "std:website", label: "Website" },
];

const MAX_SEARCHABLE = 10;

/**
 * A slot in the list: a locked default the product always searches on, or
 * an editable pick. The locked ones sit where the live modal puts them —
 * Contact's phone row comes after its two editable defaults, not before.
 */
type Slot = { kind: "locked"; label: string } | { kind: "pick"; value: string; index: number };

const DEFAULT_PICKS: Partial<Record<ObjectId, string[]>> = {
  contact: ["std:business-name", "std:tags"],
};

function layout(object: ObjectId, picks: string[]): Slot[] {
  const lock = (label: string): Slot => ({ kind: "locked", label });
  const chosen = picks.map((value, index): Slot => ({ kind: "pick", value, index }));
  if (object === "contact") {
    return [
      lock("Name"),
      lock("Email (primary + additional)"),
      ...chosen.slice(0, 2),
      lock("Phone (primary + additional)"),
      ...chosen.slice(2),
    ];
  }
  return [lock(`${objectById(object).label} name`), ...chosen];
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Edit searchable fields — which fields global search looks in, per object.
 *
 * The store keeps only the editable picks; the locked rows are the object's
 * own identity fields and are drawn back in by `layout`. There is always one
 * empty select at the end while there is room, so adding is just picking.
 */
export function SearchableFieldsModal({ onClose }: { onClose: () => void }) {
  const { fields, searchable } = useCustomFields();
  const [object, setObject] = React.useState<ObjectId | null>(null);
  const [picks, setPicks] = React.useState<string[]>([]);

  const saved = object ? (searchable[object] ?? DEFAULT_PICKS[object] ?? []) : [];
  const dirty = object !== null && !sameList(picks, saved);

  const options = React.useMemo<SelectOption[]>(
    () =>
      object
        ? [
            ...STANDARD,
            ...fields
              .filter((f) => f.object === object)
              .map((f) => ({ value: f.id, label: f.name, hint: fieldTypeLabel(f.type) })),
          ]
        : [],
    [fields, object],
  );
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  const choose = (id: ObjectId) => {
    setObject(id);
    setPicks(searchable[id] ?? DEFAULT_PICKS[id] ?? []);
  };

  const slots = object ? layout(object, picks) : [];
  const room = slots.length < MAX_SEARCHABLE;

  const save = () => {
    if (!object) return;
    setSearchable(object, picks);
    showToast(`Searchable fields updated for ${objectById(object).label}.`);
    onClose();
  };

  return (
    <Modal
      width={580}
      title="Edit searchable fields"
      onClose={onClose}
      footer={
        <FoldersModalFooter
          leading={
            <button
              type="button"
              disabled={!object}
              onClick={() => object && setPicks(DEFAULT_PICKS[object] ?? [])}
              className="motion-tap text-[14px] leading-[20px] font-medium text-pg-text-strong hover:text-brand disabled:cursor-not-allowed disabled:text-pg-disabled"
            >
              Reset to default
            </button>
          }
        >
          <OutlineButton className={BUTTON} onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton className={cn(BUTTON, DISABLED_PRIMARY)} disabled={!dirty} onClick={save}>
            Save
          </PrimaryButton>
        </FoldersModalFooter>
      }
    >
      <p className="-mt-[8px] text-[14px] leading-[20px] text-pg-text">
        Changes to searchable fields will affect search functionality for all users and apply globally{" "}
        <button
          type="button"
          onClick={() => showToast("Search help opens in a new tab.")}
          className="font-medium text-brand hover:underline"
        >
          Learn more
        </button>
      </p>

      <div className="flex flex-col gap-[4px] pt-[8px]">
        <FoldersLabel required>Select object</FoldersLabel>
        <FoldersSelect
          aria-label="Select object"
          value={object}
          options={OBJECT_OPTIONS}
          onChange={(v) => choose(v as ObjectId)}
        />
      </div>

      {object ? (
        <div className="flex flex-col gap-[4px] pt-[8px]">
          <FoldersLabel>Searchable fields</FoldersLabel>
          <div className="flex flex-col gap-[8px]">
            {slots.map((slot) => {
              if (slot.kind === "locked") {
                return (
                  <FoldersSelect
                    key={`lock-${slot.label}`}
                    disabled
                    value="locked"
                    options={[{ value: "locked", label: slot.label }]}
                    onChange={() => {}}
                    aria-label={`${slot.label} (always searchable)`}
                  />
                );
              }
              // The locked rows interleave, so a slot carries its own index
              // into `picks` rather than using its position in the list.
              const at = slot.index;
              return (
                <div key={`pick-${at}-${slot.value}`} className="group relative">
                  <FoldersSelect
                    aria-label={`Searchable field ${at + 1}`}
                    value={slot.value}
                    options={options.filter((o) => o.value === slot.value || !picks.includes(o.value))}
                    onChange={(v) => setPicks((p) => p.map((x, k) => (k === at ? v : x)))}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${labelOf(slot.value)}`}
                    onClick={() => setPicks((p) => p.filter((_, k) => k !== at))}
                    className="motion-tap absolute top-1/2 right-[32px] flex size-[22px] -translate-y-1/2 items-center justify-center rounded-[5px] text-pg-faint opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-pg hover:text-pg-heading"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
            {room ? (
              <FoldersSelect
                // Re-keyed on every add, so the fresh trailing select is empty.
                key={`empty-${picks.length}`}
                aria-label="Add searchable field"
                value={null}
                options={options.filter((o) => !picks.includes(o.value))}
                onChange={(v) => setPicks((p) => [...p, v])}
              />
            ) : (
              <p className="text-[13px] leading-[18px] text-pg-muted">
                You can make up to {MAX_SEARCHABLE} fields searchable.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

/* ─── Unique fields ─────────────────────────────────────────────────────── */

/** The types whose values can be compared for duplicates. */
const UNIQUE_TYPES: FieldType[] = ["single-line", "number", "email"];
const MAX_UNIQUE = 3;
const CUSTOM_OBJECT_OPTIONS = OBJECTS.filter((o) => o.custom).map((o) => ({ value: o.id, label: o.label }));

/**
 * Edit unique fields — custom objects only, because the standard objects
 * dedupe on their own identity fields and do not let you change that.
 */
export function UniqueFieldsModal({ onClose }: { onClose: () => void }) {
  const { fields, unique } = useCustomFields();
  const [object, setObject] = React.useState<ObjectId | null>(null);
  const [ids, setIds] = React.useState<string[]>([]);

  const saved = object ? (unique[object] ?? []) : [];
  const dirty = object !== null && !sameList(ids, saved);

  const eligible = object
    ? fields.filter((f) => f.object === object && UNIQUE_TYPES.includes(f.type))
    : [];
  const chosen = ids
    .map((id) => fields.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const addable = eligible
    .filter((f) => !ids.includes(f.id))
    .map((f) => ({ value: f.id, label: f.name, hint: fieldTypeLabel(f.type) }));

  const choose = (id: ObjectId) => {
    setObject(id);
    setIds(unique[id] ?? []);
  };

  const save = () => {
    if (!object) return;
    setUnique(object, ids);
    showToast(`Unique fields updated for ${objectById(object).label}.`);
    onClose();
  };

  return (
    <Modal
      width={560}
      title="Edit unique fields"
      onClose={onClose}
      footer={
        <FoldersModalFooter>
          <OutlineButton className={BUTTON} onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton className={cn(BUTTON, DISABLED_PRIMARY)} disabled={!dirty} onClick={save}>
            Save
          </PrimaryButton>
        </FoldersModalFooter>
      }
    >
      <p className="-mt-[8px] text-[14px] leading-[20px] text-pg-text">
        Choose a custom object to manage its unique fields. Changes will apply to all records
      </p>

      <div className="flex flex-col gap-[4px] pt-[8px]">
        <FoldersLabel required>Select object</FoldersLabel>
        <FoldersSelect
          aria-label="Select object"
          value={object}
          options={CUSTOM_OBJECT_OPTIONS}
          onChange={(v) => choose(v as ObjectId)}
        />
      </div>

      {object ? (
        <div className="flex flex-col gap-[4px] pt-[8px]">
          <FoldersLabel>Unique fields</FoldersLabel>
          {chosen.length === 0 ? (
            <p className="text-[13px] leading-[18px] text-pg-muted">
              No unique fields are currently set for this object
            </p>
          ) : (
            <ul className="flex flex-col gap-[8px]">
              {chosen.map((f) => (
                <li
                  key={f.id}
                  className="flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface pr-[6px] pl-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
                >
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">{f.name}</span>
                  <span className="shrink-0 text-[13px] leading-[18px] text-pg-faint">{fieldTypeLabel(f.type)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setIds((p) => p.filter((x) => x !== f.id))}
                    className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-[4px]">
            {eligible.length === 0 ? (
              <p className="text-[13px] leading-[18px] text-pg-muted">
                Add a single line, number, or email field to {objectById(object).label} to make it unique.
              </p>
            ) : ids.length >= MAX_UNIQUE ? (
              <p className="text-[13px] leading-[18px] text-pg-muted">
                You can set up to {MAX_UNIQUE} unique fields per object.
              </p>
            ) : addable.length > 0 ? (
              <FoldersSelect
                key={`add-${ids.length}`}
                aria-label="Add unique field"
                value={null}
                placeholder="Add unique field"
                leading={<Plus size={15} aria-hidden="true" className="shrink-0 text-brand" />}
                options={addable}
                onChange={(v) => setIds((p) => [...p, v])}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
