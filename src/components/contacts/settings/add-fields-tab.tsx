"use client";

import * as React from "react";
import {
  Eye,
  GripVertical,
  Info,
  RotateCcw,
  Search,
  SlidersHorizontal,
  SquareCheckBig,
  Trash2,
  TriangleAlert,
  Type,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { Checkbox, TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { useObjectNames } from "./object-settings-store";
import {
  DEFAULT_FORM,
  KIND_LABEL,
  fieldDef,
  moveItem,
  sameForm,
  saveForm,
  useSavedForm,
  type FormField,
} from "./add-fields-data";
import {
  DISABLED_BTN,
  ManageFormFieldsDrawer,
  PreviewDrawer,
  useRowDrag,
} from "./add-fields-drawers";

const COLS = "minmax(0,3fr) minmax(0,1fr) 168px 112px";
const HEAD =
  "flex h-full items-center gap-[6px] px-[16px] text-[14px] leading-[20px] font-medium text-pg-heading";

/** The T-in-a-box the live table heads its text columns with. */
function TypeGlyph() {
  return (
    <span
      aria-hidden="true"
      className="flex size-[16px] shrink-0 items-center justify-center rounded-[4px] text-pg-text-strong shadow-[inset_0_0_0_1.5px_currentColor]"
    >
      <Type size={10} strokeWidth={2.5} />
    </span>
  );
}

/**
 * Customize fields for add Contact — which fields the add-contact form asks
 * for, in what order, and which it insists on.
 *
 * Everything on the tab edits a DRAFT; the sticky footer's Save commits it to
 * the module store and Cancel throws it away. Manage fields and the row
 * trash both change the draft only, so the footer is the one place a change
 * becomes real. Reset to default is the exception — it confirms first, then
 * saves the defaults outright, because "undo my customizations" is a
 * decision, not an edit.
 */
export function AddFieldsTab() {
  const { singular } = useObjectNames();
  const saved = useSavedForm();
  const [draft, setDraft] = React.useState<FormField[]>(saved);
  const [query, setQuery] = React.useState("");
  const [panel, setPanel] = React.useState<"preview" | "manage" | "reset" | null>(null);

  const dirty = !sameForm(draft, saved);
  const atDefaults = sameForm(saved, DEFAULT_FORM);

  const q = query.trim().toLowerCase();
  const rows = draft.filter((f) => !q || fieldDef(f.id)?.label.toLowerCase().includes(q));

  const drag = useRowDrag(
    draft.map((f) => f.id),
    (id, to) => setDraft((cur) => moveItem(cur, cur.findIndex((f) => f.id === id), to)),
  );

  const setRequired = (id: string, required: boolean) =>
    setDraft((cur) => cur.map((f) => (f.id === id ? { ...f, required } : f)));
  const remove = (id: string) => setDraft((cur) => cur.filter((f) => f.id !== id));

  const closePanel = React.useCallback(() => setPanel(null), []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[16px]">
      <div className="flex shrink-0 items-start justify-between gap-[16px]">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            Customize fields for add {singular}
          </h2>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Control which fields show up when adding a {singular.toLowerCase()}. Mark required
            fields, change their order, or remove them.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-[12px]">
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              disabled={atDefaults}
              onClick={() => setPanel("reset")}
              className="flex h-[36px] items-center gap-[6px] rounded-[8px] px-[10px] text-[14px] leading-[20px] font-medium text-pg-text-strong motion-tap hover:bg-pg hover:text-pg-heading disabled:cursor-not-allowed disabled:text-pg-disabled disabled:hover:bg-transparent"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset to default
            </button>
            <OutlineButton onClick={() => setPanel("preview")} className="h-[36px] text-[14px]">
              <Eye size={15} aria-hidden="true" />
              Preview
            </OutlineButton>
            <PrimaryButton onClick={() => setPanel("manage")} className="h-[36px] text-[14px]">
              <SlidersHorizontal size={15} aria-hidden="true" />
              Manage fields
            </PrimaryButton>
          </div>
          <label className="relative w-[228px]">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-pg-faint"
            />
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search fields"
              className="pl-[34px]"
            />
          </label>
        </div>
      </div>

      <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="min-h-0 flex-1 overflow-auto">
          <div
            role="row"
            style={{ gridTemplateColumns: COLS }}
            className="sticky top-0 z-10 grid h-[40px] border-b border-pg-head-border bg-pg-surface"
          >
            <span role="columnheader" className={cn(HEAD, "border-r border-pg-head-border")}>
              <TypeGlyph />
              Field name
            </span>
            <span role="columnheader" className={cn(HEAD, "border-r border-pg-head-border")}>
              <TypeGlyph />
              Field type
            </span>
            <span
              role="columnheader"
              className={cn(HEAD, "justify-center border-r border-pg-head-border")}
            >
              <SquareCheckBig size={15} aria-hidden="true" className="text-pg-text-strong" />
              Required
              <span className="group relative flex">
                <Info
                  size={14}
                  tabIndex={0}
                  aria-label="About required fields"
                  className="text-pg-faint outline-none hover:text-pg-text-strong focus-visible:text-pg-text-strong"
                />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-20 w-[220px] -translate-x-1/2 rounded-[8px] bg-pg-overlay px-[10px] py-[8px] text-[13px] leading-[18px] font-normal text-pg-surface opacity-0 shadow-[0_8px_24px_0_rgba(16,24,40,0.28)] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  A {singular.toLowerCase()} can&apos;t be saved until required fields are
                  filled in.
                </span>
              </span>
            </span>
            <span role="columnheader" className={cn(HEAD, "justify-center")}>
              Action
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-[4px]">
              <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                {q ? "No fields found" : "No fields on this form"}
              </p>
              <p className="text-[13px] leading-[18px] text-pg-muted">
                {q ? "Try a different field name." : "Add fields from Manage fields."}
              </p>
            </div>
          ) : null}

          {rows.map((f) => {
            const def = fieldDef(f.id);
            if (!def) return null;
            return (
              <div
                key={f.id}
                role="row"
                style={{ gridTemplateColumns: COLS }}
                {...drag.rowProps(f.id)}
                className={cn(
                  "group grid h-[42px] items-center odd:bg-pg hover:bg-pg",
                  drag.rowClass(f.id),
                )}
              >
                <span className="relative flex h-full min-w-0 items-center px-[16px]">
                  <span
                    {...drag.handleProps(f.id, def.label)}
                    className="absolute top-1/2 left-0 flex h-[24px] w-[16px] -translate-y-1/2 cursor-grab items-center justify-center rounded-[4px] text-pg-faint opacity-0 group-hover:opacity-100 hover:text-pg-text-strong focus-visible:opacity-100 focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none active:cursor-grabbing"
                  >
                    <GripVertical size={14} aria-hidden="true" />
                  </span>
                  <span className="truncate text-[14px] leading-[20px] text-pg-text">
                    {def.label}
                  </span>
                </span>
                <span className="truncate px-[16px] text-[14px] leading-[20px] text-pg-text">
                  {KIND_LABEL[def.kind]}
                </span>
                <span className="flex justify-center">
                  <Checkbox
                    checked={f.required}
                    disabled={def.locked || def.noRequired}
                    onChange={(v) => setRequired(f.id, v)}
                  />
                </span>
                <span className="flex justify-center">
                  <button
                    type="button"
                    aria-label={`Remove ${def.label}`}
                    disabled={def.locked}
                    onClick={() => remove(f.id)}
                    className="flex size-[32px] items-center justify-center rounded-[6px] text-pg-text-strong motion-tap hover:bg-pg-surface hover:text-pg-danger disabled:cursor-not-allowed disabled:text-pg-disabled disabled:hover:bg-transparent"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/*
       * Sticky to the tab's scroll column, and pulled out over its bottom
       * padding and side insets so it reads as the page's footer, not a
       * strip inside the content.
       */}
      <div className="sticky bottom-0 -mx-[var(--page-inset)] -mb-[16px] flex shrink-0 items-center justify-end gap-[12px] border-t border-pg-head-border bg-pg-surface px-[var(--page-inset)] py-[12px]">
        <OutlineButton
          disabled={!dirty}
          onClick={() => {
            setDraft(saved);
            setQuery("");
          }}
          className={cn("h-[36px] text-[14px]", DISABLED_BTN)}
        >
          Cancel
        </OutlineButton>
        <PrimaryButton
          disabled={!dirty}
          onClick={() => {
            saveForm(draft);
            showToast(`Add ${singular.toLowerCase()} form saved.`);
          }}
          className={cn("h-[36px] text-[14px]", DISABLED_BTN)}
        >
          Save
        </PrimaryButton>
      </div>

      {panel === "preview" ? (
        <PreviewDrawer singular={singular} fields={draft} onClose={closePanel} />
      ) : null}
      {panel === "manage" ? (
        <ManageFormFieldsDrawer
          fields={draft}
          onClose={closePanel}
          onApply={(next) => {
            setDraft(next);
            setPanel(null);
          }}
        />
      ) : null}
      {panel === "reset" ? (
        <Modal
          width={480}
          onClose={closePanel}
          title={
            <span className="flex items-center gap-[12px]">
              <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[var(--hr-warning-100)] text-[var(--pg-warn-icon)]">
                <TriangleAlert size={16} aria-hidden="true" />
              </span>
              Reset to default?
            </span>
          }
          footer={
            <>
              <OutlineButton onClick={closePanel} className="h-[36px] text-[14px]">
                Cancel
              </OutlineButton>
              <button
                type="button"
                onClick={() => {
                  saveForm(DEFAULT_FORM);
                  setDraft(DEFAULT_FORM);
                  setPanel(null);
                  showToast("Default fields restored.");
                }}
                className="flex h-[36px] shrink-0 items-center rounded-[8px] bg-[var(--hr-warning-600)] px-[16px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white motion-tap hover:bg-[var(--hr-warning-700)] active:scale-[0.97]"
              >
                Restore defaults
              </button>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-muted">
            You&apos;ve made changes to this {singular} form. Resetting will remove all
            customizations and restore the original default fields.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
