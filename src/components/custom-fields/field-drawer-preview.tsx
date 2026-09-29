"use client";

import * as React from "react";
import { CalendarDays, ChevronDown, PenLine, UploadCloud } from "lucide-react";
import { Checkbox, Select } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import { CountedTextarea, FIELD_BOX } from "./field-drawer-controls";
import { FILE_TYPES, PLACEHOLDER_MAX, type FieldForm } from "./field-drawer-form";

/**
 * The drawer's right column: the field as a record form will draw it.
 *
 * The controls are real and can be typed into or picked from, so the preview
 * answers "what will this feel like" as well as "what will it look like".
 * Inputs that show a default are keyed on it, so a new default re-seeds them
 * without the preview having to mirror the form in state.
 */
export function FieldPreview({ form }: { form: FieldForm }) {
  const name = form.name.trim();
  return (
    <aside className="flex min-h-full flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[20px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <h3 className="text-[16px] leading-[22px] font-medium text-pg-heading">Live preview</h3>
      <div className="flex flex-col gap-[4px]">
        <span
          className={cn(
            "text-[14px] leading-[20px] font-medium break-words",
            name ? "text-pg-text-strong" : "text-pg-faint",
          )}
        >
          {name || "Field name"}
        </span>
        <PreviewControl form={form} />
        {form.description.trim() ? (
          <p className="text-[13px] leading-[18px] break-words text-pg-muted">{form.description}</p>
        ) : null}
      </div>
    </aside>
  );
}

function PreviewControl({ form }: { form: FieldForm }) {
  const placeholder = form.placeholder || "Placeholder text";
  // Deduped, so a duplicate the form is already flagging can't collide as a key here.
  const options = Array.from(new Set(form.options.map((o) => o.label.trim()).filter(Boolean)));
  const shownOptions = options.length ? options : ["Option 1"];

  switch (form.type) {
    case "multi-line":
      return <PreviewTextarea placeholder={placeholder} />;

    case "number":
      return (
        <input
          key={form.defaultValue}
          type="number"
          defaultValue={form.defaultValue}
          placeholder={placeholder}
          aria-label="Preview"
          className={cn(FIELD_BOX, "h-[36px] tabular-nums")}
        />
      );

    case "monetary":
      return (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-[14px] leading-[20px] text-pg-muted"
          >
            $
          </span>
          <input
            key={form.defaultValue}
            type="number"
            step="0.01"
            defaultValue={form.defaultValue}
            placeholder={form.placeholder || "0.00"}
            aria-label="Preview"
            className={cn(FIELD_BOX, "h-[36px] pl-[26px] tabular-nums")}
          />
        </div>
      );

    case "phone":
      return (
        <div className="flex gap-[8px]">
          <span className="flex h-[36px] shrink-0 items-center gap-[4px] rounded-[8px] bg-pg-surface px-[10px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
            +1
            <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
          </span>
          <input
            type="tel"
            placeholder={form.placeholder || "(555) 123-4567"}
            aria-label="Preview"
            className={cn(FIELD_BOX, "h-[36px] min-w-0 flex-1")}
          />
        </div>
      );

    case "email":
      return (
        <input
          type="email"
          placeholder={form.placeholder || "name@example.com"}
          aria-label="Preview"
          className={cn(FIELD_BOX, "h-[36px]")}
        />
      );

    case "text-box-list": {
      const labels = form.boxLabels.map((o) => o.label.trim()).filter(Boolean);
      return (
        <div className="flex flex-col gap-[8px]">
          {(labels.length ? labels : ["Label 1"]).map((l, i) => (
            <label key={`${l}-${i}`} className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">{l}</span>
              <input className={cn(FIELD_BOX, "h-[36px]")} />
            </label>
          ))}
        </div>
      );
    }

    case "dropdown-single":
      return <PreviewSelect options={shownOptions} />;

    case "dropdown-multiple":
      return <PreviewMultiSelect options={shownOptions} />;

    case "radio":
      return <PreviewRadios options={shownOptions} />;

    case "checkbox":
      return <PreviewChecks options={shownOptions} />;

    case "date":
      return (
        <div className="relative">
          <input
            readOnly
            placeholder={form.dateFormat}
            aria-label="Preview"
            className={cn(FIELD_BOX, "h-[36px] pr-[36px]")}
          />
          <CalendarDays
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2 text-pg-faint"
          />
        </div>
      );

    case "file-upload": {
      const exts = FILE_TYPES.filter((t) => form.fileTypes.includes(t.id)).map((t) => t.ext).join(", ");
      const max = Number(form.maxFiles) || 1;
      return (
        <div className="flex flex-col items-center gap-[8px] rounded-[8px] border border-dashed border-pg-border-strong bg-pg px-[16px] py-[20px] text-center">
          <span className="flex size-[36px] items-center justify-center rounded-full bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <UploadCloud size={18} aria-hidden="true" />
          </span>
          <p className="text-[14px] leading-[20px] text-pg-text">
            <span className="font-medium text-brand">Click to upload</span> or drag and drop
          </p>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            {exts || "No file types allowed"} · Up to {max} {max === 1 ? "file" : "files"}
          </p>
        </div>
      );
    }

    case "signature":
      return (
        <div className="relative flex h-[140px] flex-col justify-end rounded-[8px] bg-pg-surface px-[16px] pb-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <span className="absolute top-[12px] left-[12px] flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-faint">
            <PenLine size={14} aria-hidden="true" />
            Sign here
          </span>
          <span aria-hidden="true" className="block border-b border-dashed border-pg-border-strong" />
        </div>
      );

    default:
      return <input placeholder={placeholder} aria-label="Preview" className={cn(FIELD_BOX, "h-[36px]")} />;
  }
}

function PreviewTextarea({ placeholder }: { placeholder: string }) {
  const [value, setValue] = React.useState("");
  return (
    <CountedTextarea
      value={value}
      onChange={setValue}
      max={PLACEHOLDER_MAX}
      rows={6}
      placeholder={placeholder}
      aria-label="Preview"
      className="min-h-[170px]"
    />
  );
}

function PreviewSelect({ options }: { options: string[] }) {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <Select
      value={value && options.includes(value) ? value : null}
      options={options.map((o) => ({ value: o, label: o }))}
      onChange={setValue}
      placeholder="Select an option"
      aria-label="Preview"
    />
  );
}

function PreviewMultiSelect({ options }: { options: string[] }) {
  const [open, setOpen] = React.useState(false);
  const [picked, setPicked] = React.useState<string[]>([]);
  const on = picked.filter((p) => options.includes(p));
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          FIELD_BOX,
          "flex h-[36px] items-center gap-[8px] text-left motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", on.length ? "text-pg-text" : "text-pg-faint")}>
          {on.length ? on.join(", ") : "Select options"}
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
            className="absolute top-[calc(100%+4px)] left-0 z-[61] flex max-h-[240px] w-full flex-col gap-[2px] overflow-y-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {options.map((o) => (
              <Checkbox
                key={o}
                checked={on.includes(o)}
                onChange={(next) => setPicked(next ? [...on, o] : on.filter((p) => p !== o))}
                label={o}
                className="w-full rounded-[6px] px-[10px] py-[7px] hover:bg-pg"
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function PreviewRadios({ options }: { options: string[] }) {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <div role="radiogroup" aria-label="Preview" className="flex flex-col gap-[10px] pt-[2px]">
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setValue(o)}
            className="flex items-center gap-[8px] text-left motion-tap"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-[16px] shrink-0 items-center justify-center rounded-full",
                on ? "bg-brand" : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
              )}
            >
              {on ? <span className="size-[6px] rounded-full bg-brand-fg" /> : null}
            </span>
            <span className="text-[14px] leading-[20px] text-pg-text">{o}</span>
          </button>
        );
      })}
    </div>
  );
}

function PreviewChecks({ options }: { options: string[] }) {
  const [picked, setPicked] = React.useState<string[]>([]);
  return (
    <div className="flex flex-col gap-[10px] pt-[2px]">
      {options.map((o) => (
        <Checkbox
          key={o}
          checked={picked.includes(o)}
          onChange={(next) => setPicked((p) => (next ? [...p, o] : p.filter((x) => x !== o)))}
          label={o}
        />
      ))}
    </div>
  );
}
