"use client";

import * as React from "react";
import { ArrowUpRight, BookUser, CodeXml } from "lucide-react";
import { TextInput, Toggle } from "@/components/page/form-controls";
import { PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { copyText } from "./associations-settings-data";
import { saveObjectNames, useObjectNames, type ObjectNames } from "./object-settings-store";

/**
 * The merge-field key. It stays `contact` whatever the object is called —
 * renaming changes the name only, so templates written against the old one
 * keep resolving.
 */
const MERGE_KEY = "{{contact.*}}";

/**
 * Details — the object's name, as a form.
 *
 * A draft over the store rather than the store itself: every other tab label
 * and the page title follow the saved name, and letting them retitle on each
 * keystroke would make the screen shift under the person typing. Dirty is
 * measured against the store, so a save clears it without a reset.
 */
export function DetailsTab() {
  const saved = useObjectNames();
  const [draft, setDraft] = React.useState<ObjectNames>(saved);

  const singular = draft.singular.trim();
  const plural = draft.plural.trim();
  const valid = singular.length > 0 && plural.length > 0;
  const dirty =
    singular !== saved.singular || plural !== saved.plural || draft.autoSave !== saved.autoSave;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !dirty) return;
    const next = { singular, plural, autoSave: draft.autoSave };
    saveObjectNames(next);
    setDraft(next);
    showToast("Changes saved.");
  };

  return (
    <form
      onSubmit={save}
      className="mx-auto flex w-full max-w-[900px] flex-col gap-[24px] rounded-[12px] bg-pg-surface p-[24px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]"
    >
      <div className="flex items-start gap-[16px]">
        <span className="mt-[4px] flex size-[56px] shrink-0 items-center justify-center rounded-[10px] bg-pg-surface text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border),0_1px_2px_rgba(16,24,40,0.05)]">
          <BookUser size={22} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-[4px]">
          <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">
            {saved.plural} info
          </h2>
          <p className="text-[14px] leading-[20px] text-pg-muted">
            When you rename a module, the module still works the same – only its name changes.
            The new name will reflect across the platform: left navigation names, views,
            imports, field names, placeholders, reports, dashboards, and more.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
        <NameField
          id="object-singular"
          label="Object name (singular)"
          hint="Example: Customer, Client, Lead, etc."
          value={draft.singular}
          onChange={(singular) => setDraft((d) => ({ ...d, singular }))}
        />
        <NameField
          id="object-plural"
          label="Object name (plural)"
          hint="Example: Customers, Clients, Leads, etc."
          value={draft.plural}
          onChange={(plural) => setDraft((d) => ({ ...d, plural }))}
          trailing={
            <button
              type="button"
              aria-label={`Copy ${MERGE_KEY}`}
              title={`Copy ${MERGE_KEY}`}
              onClick={() => copyText(MERGE_KEY)}
              className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:bg-pg active:scale-95"
            >
              <CodeXml size={16} aria-hidden="true" />
            </button>
          }
        />
      </div>

      <div className="flex items-start gap-[12px]">
        <span className="pt-[2px]">
          <Toggle
            checked={draft.autoSave}
            onChange={(autoSave) => setDraft((d) => ({ ...d, autoSave }))}
            aria-label="Auto-save"
          />
        </span>
        <div className="flex min-w-0 flex-col gap-[4px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-heading">Auto-save</span>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            With Auto-save on, updates to {saved.singular} fields save automatically as soon as
            you leave a field. This setting applies to all users in the sub-account.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-[12px]">
        <button
          type="button"
          onClick={() => showToast("Custom fields live in Settings › Custom fields.")}
          className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-heading motion-tap hover:text-brand"
        >
          Add custom fields
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
        <PrimaryButton
          type="submit"
          disabled={!valid || !dirty}
          className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
        >
          Save changes
        </PrimaryButton>
      </div>
    </form>
  );
}

function NameField({
  id,
  label,
  hint,
  value,
  onChange,
  trailing,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
}) {
  // Only flagged once emptied — a fresh form never opens in the red.
  const empty = value.trim().length === 0;
  return (
    <div className="flex min-w-0 flex-col gap-[4px]">
      <label htmlFor={id} className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
        {label}
        <span className="text-pg-danger"> *</span>
      </label>
      <div className="flex items-center gap-[8px]">
        <TextInput
          id={id}
          value={value}
          aria-invalid={empty}
          onChange={(e) => onChange(e.target.value)}
          className={cn(empty && "shadow-[inset_0_0_0_1px_var(--pg-danger)]")}
        />
        {trailing}
      </div>
      <span
        className={cn("text-[13px] leading-[18px]", empty ? "text-pg-danger" : "text-pg-muted")}
      >
        {empty ? "Enter a name." : hint}
      </span>
    </div>
  );
}
