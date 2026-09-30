"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { LayoutTemplate, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * How many accounts an attach reaches, and what it does to each of them.
 *
 * Counted by the page, because only it can ask the template store which
 * accounts are on the plan and whether each still holds its template's
 * arrangement. Handed over as four numbers so this component does no
 * reasoning about provenance — it draws a receipt, it does not compute one.
 *
 * Lived in `attach-template-dialog.tsx` until Sep 30, alongside a confirm
 * dialog for the tier-card picker this feature started as. Production has no
 * such picker — the decision is made inside a modal the agency opened on
 * purpose — so the dialog went and the type it defined came here, to the one
 * surface still asking the question.
 */
export interface AttachReach {
  /** Everyone on the plan. The other three sum to this. */
  total: number;
  /** Already on this template and still holding it. Nothing happens to them. */
  unchanged: number;
  /** On this template but since edited, or never reached by a push. Reset. */
  drifted: number;
  /** On another template, or on none. Overwritten. */
  replaced: number;
}

export interface TemplateChoice {
  id: string;
  name: string;
  /** How many sub-accounts are on it already, for the row's second line. */
  accounts: number;
  /** True for the platform's own row, which cannot be renamed or deleted. */
  builtIn?: boolean;
}

/**
 * Attaching a navigation template to a SaaS plan, from the Features tab.
 *
 * Deliberately the same object as the two attachments already on that tab —
 * Attach snapshot and Custom menu links — because to the agency it is the
 * same errand: decide what a new sub-account on this plan arrives holding.
 * A template that opened a different kind of surface would be telling them it
 * is a different kind of decision, which it is not.
 *
 * SINGLE SELECT, where custom links are multi. A plan hands out one
 * navigation, so the list is radios and the footer commits one choice. The
 * links modal's select-all checkbox has no meaning here and its absence is
 * the clearest way to say so.
 *
 * WHAT MAKES IT DIFFERENT from the other two, and why the footer carries a
 * warning the others do not: a snapshot is copied into an account once, at
 * creation, and never touched again. A template keeps being managed — saving
 * it later re-arranges every account on it. So attaching is not just a
 * decision about joiners; it reaches the accounts already on the plan, and
 * the count of those is the thing worth reading before pressing.
 */
export function AttachTemplateModal({
  planName,
  templates,
  attachedId,
  reachFor,
  onAttach,
  onClose,
}: {
  planName: string;
  templates: readonly TemplateChoice[];
  attachedId: string | null;
  /** What attaching this one would do, counted by the page. */
  reachFor: (templateId: string) => AttachReach;
  onAttach: (templateId: string | null) => void;
  onClose: () => void;
}) {
  const { appTheme } = useTheme().effective;
  const [picked, setPicked] = React.useState<string | null>(attachedId);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const changed = picked !== attachedId;
  const reach = picked ? reachFor(picked) : null;
  const changing = reach ? reach.drifted + reach.replaced : 0;

  return createPortal(
    <div
      data-page-theme={appTheme}
      className="fixed inset-0 z-[90] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Attach a navigation template to ${planName}`}
        className="motion-panel-in relative flex max-h-[80vh] w-[720px] max-w-full flex-col rounded-[12px] bg-pg-surface p-[24px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]"
      >
        {/*
          The icon tile, the title, the one-line promise, the ✕ — the header
          the other two attachment modals wear. Copied on purpose: three
          attachments on one tab that open three differently-shaped surfaces
          would make the tab look assembled rather than designed.
        */}
        <span
          aria-hidden="true"
          className="flex size-[32px] items-center justify-center rounded-[8px] bg-[var(--pg-av-green-bg)] text-[var(--pg-av-green-fg)]"
        >
          <LayoutTemplate size={17} />
        </span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="motion-tap absolute top-[22px] right-[22px] flex size-[28px] items-center justify-center rounded-full text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
        >
          <X size={17} aria-hidden="true" />
        </button>

        <h2 className="mt-[14px] text-[16px] leading-[22px] font-semibold text-pg-heading">
          Navigation template
        </h2>
        <p className="mt-[4px] text-[13px] leading-[19px] text-pg-muted">
          The selected template becomes the navigation for every sub-account on{" "}
          {planName}, and for every one that joins later.
        </p>

        {/*
          NO EMPTY STATE, by Ashwin's call on Sep 30. There is never nothing to
          choose from: the HighLevel default is always attachable, and it is
          what a plan hands out until the agency says otherwise. An empty box
          said "this feature is not available to you yet", when the truth is
          "you already have one, and here it is, selected".

          So the list always draws, and an agency with no saved templates sees
          exactly one row — the one they are on. The note under it says where
          the others come from, which is the only thing that state is missing.
        */}
        <div className="mt-[18px] min-h-0 flex-1 overflow-y-auto rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <div className="sticky top-0 z-10 grid grid-cols-[44px_1fr_150px] items-center gap-[10px] border-b border-pg-head-border bg-pg-bg px-[14px] py-[9px]">
            <span />
            <span className="text-[12px] leading-[16px] font-medium text-pg-muted">
              Template
            </span>
            <span className="text-[12px] leading-[16px] font-medium text-pg-muted">
              In use
            </span>
          </div>

          {/*
            The default as a row rather than a Remove button in the footer.
            Detaching is a choice between arrangements — this plan hands out
            the HighLevel default instead — not a destructive act needing its
            own control, and as a row it sits in the same list as every other
            answer.
          */}
          <TemplateRow
            name="HighLevel default"
            detail="Sub-accounts keep the layout they arrive with"
            checked={picked === null}
            onPick={() => setPicked(null)}
          />

          {templates.map((t) => (
            <TemplateRow
              key={t.id}
              name={t.name}
              detail={
                t.accounts === 0
                  ? "Not in use"
                  : `${t.accounts} sub-account${t.accounts === 1 ? "" : "s"}`
              }
              checked={picked === t.id}
              onPick={() => setPicked(t.id)}
            />
          ))}

          {templates.length === 0 ? (
            <p className="border-t border-pg-row-border px-[14px] py-[11px] text-[12.5px] leading-[18px] text-pg-muted">
              To attach a different navigation, arrange a sub-account&rsquo;s
              navigation and save it as a template. It appears here once saved.
            </p>
          ) : null}
        </div>

        {/*
          The reach, stated in the modal rather than behind a second dialog.

          The tier picker this feature started as put the count behind a
          confirm step, because there the gesture was a select that ran on
          change — a press nobody had agreed to. Here the agency is already
          in a modal they opened on purpose and will press a button labelled
          with what it does, so a second dialog over it would be a
          confirmation of a confirmation. The count moves next to the button
          instead, where it is read before the press rather than after it.
        */}
        {changed && changing > 0 ? (
          <p className="mt-[14px] rounded-[8px] bg-[var(--pg-av-yellow-bg)] px-[12px] py-[9px] text-[12.5px] leading-[18px] text-[var(--pg-av-yellow-fg)]">
            This rewrites the navigation of {changing} sub-account
            {changing === 1 ? "" : "s"} already on {planName}. It cannot be
            undone, and leaving the plan later will not restore what they had.
          </p>
        ) : null}

        <div className="mt-[16px] flex shrink-0 justify-end gap-[10px]">
          <button
            type="button"
            onClick={onClose}
            className="motion-tap flex h-[36px] items-center rounded-[8px] px-[14px] text-[13.5px] leading-[20px] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!changed}
            onClick={() => {
              onAttach(picked);
              onClose();
            }}
            className={cn(
              "motion-tap flex h-[36px] items-center rounded-[8px] px-[14px] text-[13.5px] leading-[20px] font-medium",
              changed
                ? "bg-brand text-brand-fg hover:opacity-90 active:scale-[0.98]"
                : // Nothing picked that is not already attached. Greyed rather
                  // than hidden: the button is where the eye goes to finish,
                  // and its absence reads as the modal having no way out.
                  "cursor-not-allowed bg-pg-bg text-pg-faint",
            )}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** One radio row: the mark, the name, and what it is doing today. */
function TemplateRow({
  name,
  detail,
  checked,
  onPick,
}: {
  name: string;
  detail: string;
  checked: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onPick}
      className="motion-tap grid w-full grid-cols-[44px_1fr_150px] items-center gap-[10px] border-b border-pg-row-border px-[14px] py-[11px] text-left last:border-b-0 hover:bg-pg-bg"
    >
      <span className="flex justify-center">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-[16px] items-center justify-center rounded-full",
            checked
              ? "bg-brand shadow-[inset_0_0_0_1px_var(--brand)]"
              : "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          )}
        >
          {checked ? (
            <span className="size-[6px] rounded-full bg-brand-fg" />
          ) : null}
        </span>
      </span>
      <span className="min-w-0 truncate text-[13.5px] leading-[19px] font-medium text-pg-text-strong">
        {name}
      </span>
      <span className="truncate text-[12.5px] leading-[17px] text-pg-muted">
        {detail}
      </span>
    </button>
  );
}
