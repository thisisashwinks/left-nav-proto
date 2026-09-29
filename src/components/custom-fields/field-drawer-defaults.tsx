"use client";

import * as React from "react";
import { GripVertical, Info, Plus, Trash2 } from "lucide-react";
import { Checkbox, InfoCallout, Select } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import { HAS_OPTIONS } from "./custom-fields-data";
import {
  CountedTextarea,
  FIELD_BOX,
  FieldLabel,
  FieldNote,
} from "./field-drawer-controls";
import {
  DATE_FORMATS,
  FILE_TYPES,
  HAS_DEFAULT,
  HAS_PLACEHOLDER,
  PLACEHOLDER_MAX,
  blankItem,
  duplicateIds,
  type FieldForm,
  type FormErrors,
  type ListItem,
} from "./field-drawer-form";

type Patch = (next: Partial<FieldForm>) => void;

const PLACEHOLDER_TIP = "Shown inside the field until someone enters a value.";
const PLACEHOLDER_HINT = "Provide a hint for users to know what kind of information to provide";

/**
 * The "Set default value" card's body, which is a different form per type:
 * a placeholder for anything typed into, a default for numbers, an option
 * list for anything picked from, and the few settings dates and uploads need.
 */
export function DefaultValueBody({
  form,
  patch,
  errors,
}: {
  form: FieldForm;
  patch: Patch;
  errors: FormErrors;
}) {
  const { type } = form;
  return (
    <div className="flex flex-col gap-[16px]">
      {HAS_PLACEHOLDER.includes(type) ? (
        <div className="flex flex-col gap-[4px]">
          <FieldLabel htmlFor="cf-placeholder" tip={PLACEHOLDER_TIP}>
            Placeholder text
          </FieldLabel>
          {type === "multi-line" ? (
            <CountedTextarea
              id="cf-placeholder"
              value={form.placeholder}
              onChange={(placeholder) => patch({ placeholder })}
              max={PLACEHOLDER_MAX}
              placeholder={PLACEHOLDER_HINT}
            />
          ) : (
            <input
              id="cf-placeholder"
              value={form.placeholder}
              maxLength={PLACEHOLDER_MAX}
              onChange={(e) => patch({ placeholder: e.target.value })}
              placeholder={PLACEHOLDER_HINT}
              className={cn(FIELD_BOX, "h-[36px]")}
            />
          )}
        </div>
      ) : null}

      {HAS_DEFAULT.includes(type) ? (
        <div className="flex flex-col gap-[4px]">
          <FieldLabel htmlFor="cf-default">Default value</FieldLabel>
          <div className="relative max-w-[320px]">
            {type === "monetary" ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-[14px] leading-[20px] text-pg-muted"
              >
                $
              </span>
            ) : null}
            <input
              id="cf-default"
              type="number"
              inputMode="decimal"
              step={type === "monetary" ? "0.01" : "any"}
              value={form.defaultValue}
              onChange={(e) => patch({ defaultValue: e.target.value })}
              placeholder={type === "monetary" ? "0.00" : "Enter a number"}
              className={cn(FIELD_BOX, "h-[36px] tabular-nums", type === "monetary" && "pl-[26px]")}
            />
          </div>
        </div>
      ) : null}

      {HAS_OPTIONS.includes(type) ? (
        <div className="flex flex-col gap-[4px]">
          <FieldLabel required>Options</FieldLabel>
          <ItemListEditor
            items={form.options}
            onChange={(options) => patch({ options })}
            noun="option"
            flagDuplicates
          />
          {errors.options ? <FieldNote tone="error">{errors.options}</FieldNote> : null}
        </div>
      ) : null}

      {type === "text-box-list" ? (
        <div className="flex flex-col gap-[4px]">
          <FieldLabel tip="Each label gets its own short text box under this field.">Text box labels</FieldLabel>
          <ItemListEditor
            items={form.boxLabels}
            onChange={(boxLabels) => patch({ boxLabels })}
            noun="label"
          />
        </div>
      ) : null}

      {type === "date" ? (
        <div className="flex max-w-[320px] flex-col gap-[4px]">
          <FieldLabel>Date format</FieldLabel>
          <Select
            value={form.dateFormat}
            options={DATE_FORMATS}
            onChange={(dateFormat) => patch({ dateFormat })}
            aria-label="Date format"
          />
        </div>
      ) : null}

      {type === "file-upload" ? (
        <>
          <div className="flex flex-col gap-[8px]">
            <FieldLabel required>Allowed file types</FieldLabel>
            <div className="grid grid-cols-2 gap-x-[20px] gap-y-[10px] sm:grid-cols-3">
              {FILE_TYPES.map((t) => (
                <Checkbox
                  key={t.id}
                  checked={form.fileTypes.includes(t.id)}
                  onChange={(on) =>
                    patch({
                      fileTypes: on
                        ? FILE_TYPES.map((x) => x.id).filter((id) => id === t.id || form.fileTypes.includes(id))
                        : form.fileTypes.filter((id) => id !== t.id),
                    })
                  }
                  label={
                    <>
                      {t.label} <span className="text-[13px] text-pg-faint">{t.ext}</span>
                    </>
                  }
                />
              ))}
            </div>
            {errors.fileTypes ? <FieldNote tone="error">{errors.fileTypes}</FieldNote> : null}
          </div>
          <div className="flex max-w-[160px] flex-col gap-[4px]">
            <FieldLabel htmlFor="cf-max-files" required tip="How many files one record can hold in this field, up to 10.">
              Max files
            </FieldLabel>
            <input
              id="cf-max-files"
              type="number"
              min={1}
              max={10}
              value={form.maxFiles}
              onChange={(e) => patch({ maxFiles: e.target.value })}
              className={cn(FIELD_BOX, "h-[36px] tabular-nums")}
            />
          </div>
          {errors.maxFiles ? <FieldNote tone="error">{errors.maxFiles}</FieldNote> : null}
        </>
      ) : null}

      {type === "signature" ? (
        <InfoCallout icon={<Info size={16} aria-hidden="true" />}>
          Signature fields have no default value. People draw their signature when they fill it in.
        </InfoCallout>
      ) : null}
    </div>
  );
}

/**
 * An editable, reorderable list of labels — options, text box labels.
 *
 * Drag by the grip, or focus it and use the arrow keys, the same idiom as
 * Manage smart lists. The last row can't be removed, so the list never
 * empties under the user.
 */
function ItemListEditor({
  items,
  onChange,
  noun,
  flagDuplicates,
}: {
  items: ListItem[];
  onChange: (next: ListItem[]) => void;
  noun: string;
  flagDuplicates?: boolean;
}) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const dup = flagDuplicates ? duplicateIds(items) : new Set<string>();

  const move = (id: string, to: number) => {
    const from = items.findIndex((o) => o.id === id);
    if (from < 0 || to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-[8px]">
      {items.map((o, i) => (
        <div
          key={o.id}
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (overId !== o.id) setOverId(o.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragId && dragId !== o.id) move(dragId, i);
            setDragId(null);
            setOverId(null);
          }}
          className={cn(
            "flex items-center gap-[8px] rounded-[8px]",
            dragId === o.id && "opacity-40",
            overId === o.id && dragId !== o.id && "shadow-[0_-2px_0_0_var(--brand)]",
          )}
        >
          <span
            role="button"
            tabIndex={0}
            draggable
            aria-label={`Reorder ${o.label || `${noun} ${i + 1}`}. Use the arrow keys to move it.`}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", o.id);
              setDragId(o.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                move(o.id, i + (e.key === "ArrowUp" ? -1 : 1));
              }
            }}
            className="flex size-[24px] shrink-0 cursor-grab items-center justify-center rounded-[6px] text-pg-faint hover:text-pg-text-strong focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none active:cursor-grabbing"
          >
            <GripVertical size={16} aria-hidden="true" />
          </span>
          <input
            value={o.label}
            aria-label={`${noun[0].toUpperCase()}${noun.slice(1)} ${i + 1}`}
            aria-invalid={dup.has(o.id) || undefined}
            onChange={(e) => onChange(items.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)))}
            onKeyDown={(e) => {
              // Enter adds the next row, the way people type a list.
              if (e.key === "Enter" && i === items.length - 1 && o.label.trim()) {
                e.preventDefault();
                onChange([...items, blankItem()]);
              }
            }}
            placeholder={`${noun[0].toUpperCase()}${noun.slice(1)} ${i + 1}`}
            className={cn(
              FIELD_BOX,
              "h-[36px] min-w-0 flex-1",
              dup.has(o.id) && "shadow-[inset_0_0_0_1px_var(--pg-danger)]",
            )}
          />
          <button
            type="button"
            aria-label={`Remove ${noun} ${i + 1}`}
            disabled={items.length === 1}
            onClick={() => onChange(items.filter((x) => x.id !== o.id))}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-pg-muted"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, blankItem()])}
        className="flex h-[32px] w-fit items-center gap-[6px] rounded-[8px] px-[8px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:bg-[color-mix(in_oklab,var(--brand)_8%,transparent)]"
      >
        <Plus size={16} aria-hidden="true" />
        Add {noun}
      </button>
    </div>
  );
}

