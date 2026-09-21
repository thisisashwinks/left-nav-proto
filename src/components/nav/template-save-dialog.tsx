"use client";

import * as React from "react";
import { ChevronDown, Save } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  AffectedAccounts,
  AffectedAccountsTable,
  TemplateMessage,
  TemplateMessageActions,
  TemplateMessageBody,
  TemplateMessageButton,
  TemplateMessageTitle,
} from "./template-message";
import { nameTaken, useNavTemplates, type NavTemplate } from "./nav-templates";

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
  const { templatePropagation: propagation, templateSaveLayout } =
    useTheme().effective;
  const accordion = templateSaveLayout === "accordion";
  /**
   * Whether the update option's table is open.
   *
   * Its own state, not "is this option selected": the table is detail you may
   * not want, and selecting the answer should not force it on you. Choosing the
   * other option closes it, because a disclosure hanging open under an answer
   * nobody picked is just clutter with a chevron on it.
   */
  const [showing, setShowing] = React.useState(false);
  const { accountsOn, accountsOnIds, templates } = useNavTemplates();
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

  /**
   * Whether this name is already in the list.
   *
   * Checked as you type rather than on press: the store refuses a duplicate
   * either way, and a refusal that arrives only after you commit is a dialog
   * that closes on some presses and not others for a reason it never gave.
   */
  const taken = nameTaken(templates, name);
  const canName = name.trim() !== "" && !taken;

  const commitNew = () => {
    if (!canName) return;
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
      {/*
        Titled by the DECISION, not by the object.

        "Save Fieldstone Group's arrangement" named a thing — and the thing was
        never in doubt, since you just spent five minutes arranging it. What is
        in doubt is where it goes, and on the fork that is a question with two
        answers and very different blast radii. The title asks it.

        The body then says the one thing the options cannot say for themselves:
        from the default there is no fork at all, and the reader needs to know
        that is the model rather than a control that failed to appear.
      */}
      <TemplateMessageTitle icon={<Save size={15} aria-hidden="true" />}>
        {linked ? "Where should these changes go?" : "Name this template"}
      </TemplateMessageTitle>
      <TemplateMessageBody>
        {linked
          ? `Update ${linked.name} for everyone on it, or keep this as a template of its own.`
          : `The HighLevel default can't be edited. Save these changes as a new template and ${accountName} moves onto it.`}
      </TemplateMessageBody>

      {linked ? (
        <div className="mt-[10px] flex flex-col gap-[2px]">
          <SaveOption
            selected={saveAs === "update"}
            disabled={!templateDirty}
            onSelect={() => {
              setSaveAs("update");
              if (accordion) setShowing(true);
            }}
            label={`Update ${linked.name}`}
            /*
              The chevron lives on the option, not under it.

              Its body is a disclosure — who this reaches — and the row that
              opens it should be the row it belongs to. A separate "Which ones?"
              button underneath was a second control for one question, and it
              sat between the two answers, which is the one place in the dialog
              that belongs to neither.
            */
            {...(accordion && templateDirty && reaches > 1
              ? {
                  expanded: saveAs === "update" && showing,
                  onToggle: () => {
                    setSaveAs("update");
                    setShowing((o) => (saveAs === "update" ? !o : true));
                  },
                }
              : {})}
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
            No `to` in either layout: an update does not MOVE anybody. Every
            account here is already on this template and stays on it — what
            changes is the template under them. A "new template" column would
            name the one they are on and read as a move that is not happening.
          */}
          {saveAs === "update" && templateDirty && reaches > 1 ? (
            accordion ? (
              showing ? (
                <div className="mt-[4px] mb-[2px] ml-[30px]">
                  <AffectedAccountsTable ids={reachedIds} />
                </div>
              ) : null
            ) : (
              <div className="ml-[30px]">
                <AffectedAccounts ids={reachedIds} />
              </div>
            )
          ) : null}
          <SaveOption
            selected={saveAs === "new"}
            onSelect={() => {
              setSaveAs("new");
              // The other option's disclosure is not about this answer.
              setShowing(false);
            }}
            label="Create a new template"
            note={`Only ${accountName} moves onto it. Everyone else stays where they are.`}
          />
          {/*
            The name field opens under its own option, and carries no chevron.

            It is not optional detail — it is the rest of the answer, and there
            is nothing to collapse to: an unnamed new template cannot be saved.
            A chevron over a required input invites you to shut the one thing
            the dialog is waiting for.
          */}
          {saveAs === "new" ? (
            <div
              className={cn(
                "ml-[30px] flex flex-col gap-[4px]",
                accordion ? "mt-[4px] mb-[2px]" : "mt-[6px]",
              )}
            >
              <SaveNameField
                value={name}
                onChange={setName}
                onCommit={commitNew}
                taken={taken}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-[12px] flex flex-col gap-[4px]">
          <SaveNameField
            value={name}
            onChange={setName}
            onCommit={commitNew}
            taken={taken}
          />
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
            disabled={saveAs === "new" && !canName}
            onClick={() => {
              if (saveAs === "update" && linked) onUpdate(linked.id);
              else if (canName) onCreate(name.trim());
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
  taken = false,
}: {
  value: string;
  onChange: (next: string) => void;
  onCommit: () => void;
  /** Whether a template already carries this name. */
  taken?: boolean;
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
        aria-invalid={taken || undefined}
        className={cn(
          "rounded-[7px] bg-nav-hover px-[10px] py-[7px] text-[12.5px] leading-[16px] text-nav-fg outline-none placeholder:text-nav-fg-subtle",
          taken && "shadow-[inset_0_0_0_1.5px_var(--hr-warning-500)]",
        )}
      />
      {/*
        Said under the field, not in a toast.

        The fix is a keystroke away and the cursor is already in the box — a
        message anywhere else would be describing a problem you have to go back
        to solve.
      */}
      {taken ? (
        <span
          role="status"
          className="text-[11.5px] leading-[15px] text-[var(--hr-warning-700)]"
        >
          A template already has this name. Pick another.
        </span>
      ) : null}
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
  expanded,
  onToggle,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  label: string;
  note: string;
  /**
   * Whether this option's disclosure is open. Omit for an option that has
   * nothing behind it — the chevron then does not appear at all, which is how
   * "Create a new template" stays a plain answer with a field under it.
   */
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const disclosing = expanded !== undefined && onToggle !== undefined;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      {...(disclosing ? { "aria-expanded": expanded } : {})}
      disabled={disabled}
      onClick={disclosing ? onToggle : onSelect}
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
      {disclosing ? (
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={cn(
            "mt-[2px] shrink-0 text-nav-fg-subtle motion-move",
            expanded && "rotate-180",
          )}
        />
      ) : null}
    </button>
  );
}
