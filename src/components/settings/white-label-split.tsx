"use client";

import * as React from "react";
import { ArrowUpRight, AlertTriangle, Code2, LifeBuoy } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { accounts } from "@/components/accounts/accounts-data";
import { useLabs, SEEDED_LEGACY } from "./labs-state";
import { useCustomCode } from "./custom-code-store";
import { CodeEditorField } from "./code-editor-field";
import { Section } from "./white-label-parts";

/**
 * Approach 4 — "Code here, flag in Labs".
 *
 * The other three approaches each invent a MECHANISM for the mismatch between
 * one agency-wide block of code and two navigations. This one invents nothing.
 * It takes the position that the mismatch is mostly a filing problem: the
 * settings are organised by screen rather than by question, so answering
 * "why did my sidebar change" means hopping between White Label and Labs and
 * assembling the answer yourself.
 *
 * There are only two questions. WHO is on the new navigation is a rollout
 * decision and belongs to Labs. WHAT code runs on the old one is a branding
 * decision and belongs here. Today both screens answer a little of each, which
 * is the single largest source of confusion we found, so this screen gives up
 * its half of the rollout entirely — no flag, no per-account anything, not
 * even a read-only mirror of the Labs table. A read-only mirror was the
 * tempting middle path and it was rejected on purpose: a toggle-shaped thing
 * on this page is a toggle to the person reading it, however it is styled.
 *
 * What is left is a screen with one job, which is the point. The hardest part
 * is not what it holds, it is what it says to the person who came here wrong —
 * see WrongGuess below.
 */

export function WhiteLabelSplit({ agency }: { agency: Account }) {
  const labs = useLabs();
  const code = useCustomCode();

  /*
   * The counts, from the store rather than from a sentence someone typed.
   *
   * `accountOn(id)` answers for SUB-ACCOUNTS only — the agency's own sidebar
   * is `agencyOn`, a separate boolean. Asking `accountOn(agency.id)` returns
   * the default `true` and reads as correct, which is exactly why it is worth
   * naming here: this screen's whole argument is that it states the truth
   * about reach, and a number quietly computed from the wrong field would
   * make it a worse liar than the page it replaces.
   */
  const onOldNav = accounts.filter((a) => !labs.accountOn(a.id));
  const onSwitchyard = accounts.length - onOldNav.length;

  /*
   * The seeded legacy pair, named rather than counted, when they are still
   * legacy. Two names are more use than "2" to someone deciding whether an
   * edit here is worth making, and the list is short by construction.
   */
  const seededStillLegacy = SEEDED_LEGACY.filter((id) => !labs.accountOn(id));
  const seededNames = seededStillLegacy
    .map((id) => accounts.find((a) => a.id === id)?.name ?? id)
    .join(", ");

  const [savedCss, setSavedCss] = React.useState(code.css);
  const [savedJs, setSavedJs] = React.useState(code.js);

  const appliesTo =
    onOldNav.length === 0
      ? `Applies to 0 sub-accounts: all ${accounts.length} are on Switchyard, so nothing saved here runs anywhere today.`
      : `Applies to ${onOldNav.length} sub-account${
          onOldNav.length === 1 ? "" : "s"
        } on the previous navigation. Skipped on the ${onSwitchyard} using Switchyard.`;

  return (
    <div className="flex w-full flex-col gap-[20px] pb-[32px]">
      <div className="flex items-center justify-between pt-[8px]">
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          Custom code
        </h2>
      </div>

      {/*
        The scope statement, first and in plain language.

        Phrased as what this page DOES and what it does not, in that order,
        because the complaint behind this approach was never "I could not find
        the setting" — it was "I changed something here and it did nothing".
      */}
      <div className="flex gap-[12px] rounded-[8px] bg-brand-soft p-[16px]">
        <Code2
          size={18}
          aria-hidden="true"
          className="mt-[1px] shrink-0 text-brand"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-[20px] font-semibold text-brand">
            This page holds {agency.name}&rsquo;s custom code, and nothing else
          </p>
          <p className="mt-[4px] text-[13px] leading-[18px] text-brand">
            Custom CSS and JS are agency-level, so one copy reaches every
            sub-account still on the previous navigation. Which sub-accounts
            those are is a rollout question, and rollout lives in Labs.
          </p>
          <button
            type="button"
            className="motion-tap mt-[8px] inline-flex h-[36px] items-center gap-[6px] rounded-[8px] bg-brand px-[12px] text-[14px] font-medium text-white hover:brightness-95 active:scale-[0.98]"
          >
            Open Labs
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/*
        One reach line above both editors rather than a copy inside each.

        They share a scope — there is no world where the CSS reaches a
        different set of accounts than the JS — and printing the same count
        twice invites a reader to look for the difference between them.
      */}
      <div className="rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
          {appliesTo}
        </p>
        {seededStillLegacy.length > 0 ? (
          <p className="mt-[4px] text-[13px] leading-[18px] text-pg-muted">
            On the previous navigation right now: {seededNames}.
          </p>
        ) : null}
        <p className="mt-[4px] text-[13px] leading-[18px] text-pg-faint">
          Custom code is off by default wherever Switchyard is on.
        </p>
      </div>

      {/*
        The compatibility warning.

        Dark mode is called out by name rather than folded into "may not work",
        because it is the failure that costs an agency a support ticket instead
        of a shrug: Switchyard has no dark mode, so a rule written to lighten
        text on the old dark sidebar paints light text onto a light sidebar and
        the navigation reads as empty. "Items can be invisible" is the only
        phrasing of that we found which nobody had to re-read.
      */}
      <div className="flex gap-[12px] rounded-[8px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <AlertTriangle
          size={18}
          aria-hidden="true"
          className="mt-[1px] shrink-0 text-pg-muted"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
            Most of this code was written for the previous sidebar
          </p>
          <p className="mt-[4px] text-[13px] leading-[18px] text-pg-muted">
            It targets markup Switchyard no longer has, such as{" "}
            <code className="font-mono text-[12.5px]">#sidebar-v2</code> and{" "}
            <code className="font-mono text-[12.5px]">.nav-link</code>, and it
            leans on <code className="font-mono text-[12.5px]">!important</code>{" "}
            to win. Dark mode is the worst case: Switchyard has no dark theme,
            so rules written for a dark sidebar can leave navigation items
            invisible against a light one.
          </p>
        </div>
      </div>

      <Section
        title="Custom CSS"
        sub="Styles for the previous navigation"
        dirty={code.css !== savedCss}
        onCancel={() => code.setCss(savedCss)}
        onSave={() => setSavedCss(code.css)}
      >
        <CodeEditorField
          label="Custom CSS"
          value={code.css}
          onChange={code.setCss}
          placeholder="/* Styles for the previous navigation. */"
        />
      </Section>

      <Section
        title="Custom JS"
        sub="Scripts for the previous navigation"
        dirty={code.js !== savedJs}
        onCancel={() => code.setJs(savedJs)}
        onSave={() => setSavedJs(code.js)}
      >
        <CodeEditorField
          label="Custom JS"
          value={code.js}
          onChange={code.setJs}
          placeholder="// Scripts for the previous navigation."
        />
      </Section>

      <WrongGuess />
    </div>
  );
}

/**
 * The note for the person who guessed wrong, and the reason this approach
 * earns a slot.
 *
 * Their navigation changed, so they came looking for the code, because the
 * code is the only part of the navigation they have ever been able to edit.
 * The thing they actually need is in Labs. This note is the hand-off, and it
 * is the single hardest sentence on the screen, because it has to do two
 * things that pull against each other: send them to Labs, and never once read
 * as an offer to turn Switchyard off here.
 *
 * Drafts we rejected, since the failures are instructive:
 *
 *   "To turn Switchyard off, go to Labs."  — scanned, the eye lands on "turn
 *   Switchyard off" next to a page full of controls and stops there.
 *
 *   "Switchyard cannot be disabled from this page."  — true, and it reads as
 *   a refusal; people answer a refusal by hunting for the real switch on the
 *   same screen, which is the opposite of what we want.
 *
 *   "Looking for the navigation setting? It is in Labs."  — fine, and it
 *   leaves them unsure whether editing the code below might also help, so
 *   half of them do both and then cannot tell which one worked.
 *
 * What survived names the destination first and this page's limits second,
 * as a statement of where the control IS rather than where it is not.
 */
function WrongGuess() {
  return (
    <div className="flex gap-[12px] rounded-[8px] bg-pg p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <LifeBuoy
        size={18}
        aria-hidden="true"
        className="mt-[1px] shrink-0 text-pg-muted"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
          Navigation changed for a sub-account?
        </p>
        <p className="mt-[4px] max-w-[640px] text-[13px] leading-[18px] text-pg-muted">
          That is the Switchyard rollout, and it is set in Labs, one
          sub-account at a time. Open Labs, find the sub-account, and put it
          back on the previous navigation there. Editing the code below will
          not move it, because this code only runs on the previous navigation
          in the first place.
        </p>
        <button
          type="button"
          className="motion-tap mt-[10px] inline-flex h-[36px] items-center gap-[6px] rounded-[8px] px-[12px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-surface active:scale-[0.98]"
        >
          Open Labs
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
