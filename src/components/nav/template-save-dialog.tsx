"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  AffectedAccounts,
  TemplateMessage,
  TemplateMessageActions,
  TemplateMessageBody,
  TemplateMessageButton,
  TemplateMessageTitle,
} from "./template-message";
import { useNavTemplates, type NavTemplate } from "./nav-templates";

/**
 * Where an edited arrangement goes — update the template, or name a new one.
 *
 * Lifted out of the ⋯ menu because it stopped belonging to the ⋯ menu. Under
 * `one-template` this is what Save changes on the edit card opens: there is
 * nowhere else for an edit to land, so the question "which template is this"
 * is the save, not a thing you go and do afterwards in a menu.
 *
 * Two answers, and only when there are two. With no named template to update —
 * an account on the HighLevel default — there is exactly one thing this dialog
 * can do, and a single radio beside a single option asks you to confirm that
 * you meant the only door in the room. The field is the dialog then.
 */
export function TemplateSaveDialog({
  accountName,
  linked,
  templateDirty,
  onCreate,
  onUpdate,
  onClose,
}: {
  accountName: string;
  /**
   * The template this arrangement could be saved INTO, or null.
   *
   * Null covers both "on no template" and "on the HighLevel default", which
   * behave identically here: the default cannot be written to, so from it the
   * only possible outcome is a new template — the fork never appears.
   */
  linked: NavTemplate | null;
  /** Whether anything has actually moved since the template was taken. */
  templateDirty: boolean;
  onCreate: (name: string) => void;
  onUpdate: (templateId: string) => void;
  onClose: () => void;
}) {
  const { templatePropagation: propagation } = useTheme().effective;
  const { accountsOn, accountsOnIds } = useNavTemplates();
  const [saveAs, setSaveAs] = React.useState<"update" | "new">(
    linked && templateDirty ? "update" : "new",
  );
  const [name, setName] = React.useState(`${accountName} nav`);

  /*
   * Who an update actually lands on.
   *
   * The account being edited is in here, deliberately: it is one of the navs
   * that changes, and a count that quietly excluded it would disagree with the
   * list directly under it. Names rather than ids, ordered as the fleet is —
   * this is read as "is my worst client in this", which is a scan, not a lookup.
   */
  const reachedIds = linked && propagation === "managed" ? accountsOnIds(linked.id) : [];
  const reaches = linked ? accountsOn(linked.id) : 0;

  const commitNew = () => {
    if (name.trim() === "") return;
    onCreate(name.trim());
    onClose();
  };

  return (
    <TemplateMessage
      kind="decision"
      label="Save template"
      width={440}
      onDismiss={onClose}
    >
      <TemplateMessageTitle icon={<Save size={15} aria-hidden="true" />}>
        Save {accountName}&rsquo;s arrangement
      </TemplateMessageTitle>
      <TemplateMessageBody>
        {/*
          The difference between the two answers is how far each one reaches,
          and that is the only thing worth saying up here. The rest is on the
          options themselves, beside the option it is about.
        */}
        {linked
          ? "Update the template this account is on, or keep this as a new one."
          : "This layout can't be saved to the HighLevel default. Name it, and this account moves onto it."}
      </TemplateMessageBody>

      {linked ? (
        <div className="mt-[10px] flex flex-col gap-[2px]">
          <SaveOption
            selected={saveAs === "update"}
            disabled={!templateDirty}
            onSelect={() => setSaveAs("update")}
            label={`Update ${linked.name}`}
            /*
              A count, not a version.

              "v1 → v2" is bookkeeping: it names something that moved inside the
              product rather than something that happens to anybody, and it was
              sitting in the one line a reader gets before pressing the most
              destructive button in the feature. What that line has to carry is
              how far the press reaches — and a number, because a category is
              skimmed past and a number is read.
            */
            note={
              !templateDirty
                ? "Nothing to save — this nav already matches it"
                : reaches > 1
                  ? `This will change ${reaches} sub-accounts.`
                  : "No other sub-account is on it."
            }
          />
          {/*
            And WHICH ones, a click away — see `AffectedAccounts`, which the
            delete dialog shares so the two ask the question the same way.
          */}
          {saveAs === "update" && templateDirty && reaches > 1 ? (
            <div className="ml-[30px]">
              <AffectedAccounts ids={reachedIds} />
            </div>
          ) : null}
          <SaveOption
            selected={saveAs === "new"}
            onSelect={() => setSaveAs("new")}
            label="Save as a new template"
            note={`Touches nobody else. ${accountName} moves onto the new one.`}
          />
          {saveAs === "new" ? (
            <div className="mt-[6px] ml-[30px] flex flex-col gap-[4px]">
              <SaveNameField value={name} onChange={setName} onCommit={commitNew} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-[12px] flex flex-col gap-[4px]">
          <SaveNameField value={name} onChange={setName} onCommit={commitNew} />
        </div>
      )}

      <TemplateMessageActions
        dismiss={
          <TemplateMessageButton onClick={onClose}>Cancel</TemplateMessageButton>
        }
        actions={[
          <TemplateMessageButton
            key="save"
            tone="primary"
            disabled={saveAs === "new" && name.trim() === ""}
            onClick={() => {
              if (saveAs === "update" && linked) onUpdate(linked.id);
              else if (name.trim() !== "") onCreate(name.trim());
              else return;
              onClose();
            }}
          >
            {/*
              The button says what it will do, so the sentence finishes wherever
              the eye happens to be — on the options or on the footer.
            */}
            {saveAs === "update" && linked
              ? reaches > 1
                ? `Update ${reaches} sub-accounts`
                : `Update ${linked.name}`
              : "Save template"}
          </TemplateMessageButton>,
        ]}
      />
    </TemplateMessage>
  );
}

function SaveNameField({
  value,
  onChange,
  onCommit,
}: {
  value: string;
  onChange: (next: string) => void;
  onCommit: () => void;
}) {
  return (
    <>
      <span className="text-[11px] leading-[15px] font-medium text-nav-fg-subtle">
        Template name
      </span>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
        }}
        placeholder="Dentist, Home services…"
        aria-label="Template name"
        className="rounded-[7px] bg-nav-hover px-[10px] py-[7px] text-[12.5px] leading-[16px] text-nav-fg outline-none placeholder:text-nav-fg-subtle"
      />
    </>
  );
}

/**
 * One of the two answers in the save dialog.
 *
 * The same radio the delete dialog uses, and for the same reason: two outcomes
 * that differ in how far they reach, where the reach has to be readable beside
 * each one rather than discovered by pressing it. A disabled option keeps its
 * place and says why — "nothing to save" is information, and hiding the row
 * would make the dialog change shape between two visits.
 */
function SaveOption({
  selected,
  disabled = false,
  onSelect,
  label,
  note,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  label: string;
  note: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "motion-tap flex items-start gap-[8px] rounded-[7px] px-[8px] py-[7px] text-left",
        "disabled:pointer-events-none disabled:opacity-40",
        selected ? "bg-nav-hover" : "hover:bg-nav-hover",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-[2px] flex size-[14px] shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_var(--nav-fg-subtle)]",
          selected && "bg-nav-fg",
        )}
      >
        {selected ? <span className="size-[5px] rounded-full bg-nav" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] leading-[17px] font-medium text-nav-fg">
          {label}
        </span>
        <span className="mt-[1px] block text-[11.5px] leading-[16px] text-nav-fg-subtle">
          {note}
        </span>
      </span>
    </button>
  );
}
