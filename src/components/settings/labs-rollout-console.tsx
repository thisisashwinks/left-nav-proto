"use client";

import * as React from "react";
import { ExternalLink, Search, X } from "lucide-react";
import { accounts as ALL_ACCOUNTS } from "@/components/accounts/accounts-data";
import { cn } from "@/lib/utils";
import { SWITCHYARD_PREVIEW } from "./labs-data";
import { Toggle } from "./labs-page";
import { useLabs, type AccountAccess } from "./labs-state";

/**
 * The rollout, as one table.
 *
 * Approach 4 splits the Switchyard settings by SCREEN rather than by
 * question, because there are only two questions and they have different
 * owners: WHO is on the new navigation, and WHAT code runs on it. This is
 * the WHO, entire. White Label is the WHAT, and nothing here edits code.
 *
 * The thing it replaces is the access sheet on the Labs page — a modal of
 * forty rows with two switches each, opened from a card that already said
 * "Activate Feature". That shape asks the reader to hold three things at
 * once: which flag they are in, which of two switches a row needs, and what
 * the row's two switches mean together. A table whose rows each answer ONE
 * question, on the page rather than over it, is the whole proposal.
 *
 * It is also deliberately not a FlagCard. The card is the right shape for a
 * list of eight betas you are scanning; it is the wrong shape for the one
 * beta you have already chosen and are now rolling out, where the content is
 * a fleet and not a description. `Toggle` is imported rather than redrawn,
 * so the one switch here is the switch the rest of Labs uses.
 */

/**
 * What an account absent from `access` actually gets.
 *
 * MIRRORS `DEFAULT_ACCESS` in labs-state, which does not export it. The
 * duplication is deliberate and is the dangerous kind, so it is worth being
 * blunt about why: reading `access[id]?.enabled` directly is the bug this
 * constant exists to prevent. Absent means visible AND enabled — a fleet
 * mid-rollout is mostly ON — so a table that treated absent as off would
 * report almost every account as Legacy while the sidebar beside it showed
 * Switchyard. Plausible, and wrong, which is the worst way to be wrong.
 *
 * If labs-state ever reseeds its default, this has to move with it. A row
 * resolved through one function, below, so there is one place to change.
 */
const DEFAULT_ACCESS: AccountAccess = { visible: true, enabled: true };

/**
 * Where public beta enrollment has got to, and where it stops.
 *
 * Both invented: the prototype has no backend, and nothing in the store
 * knows how many OTHER agencies have enrolled. Named constants rather than
 * numbers in the markup so the one unsourced pair on this screen is
 * obvious — everything else on it is derived from the store.
 *
 * The cap is the part worth drawing. Public beta launches at a conference,
 * which is the one day the enrollment curve is not gradual, and the
 * rollout plan is to pause new enrollments at a threshold so the fleet can
 * stabilise before the next tranche. An agency reading this screen is
 * entitled to know that the offer has a floor under it.
 */
const PUBLIC_BETA_CAP = 1000;
const PUBLIC_BETA_ENROLLED = 842;

export function LabsRolloutConsole() {
  const { agencyOn, setAgencyOn, access, setAccess, accountOn } = useLabs();
  const [query, setQuery] = React.useState("");
  const [picked, setPicked] = React.useState<readonly string[]>([]);

  /*
   * One resolver, used by every read on this screen.
   *
   * Not `access[id]` at the call site, ever. See DEFAULT_ACCESS above.
   */
  const agencyRow = React.useCallback(
    (id: string): AccountAccess => access[id] ?? DEFAULT_ACCESS,
    [access],
  );

  /*
   * The agency's answer for one account, as a single boolean.
   *
   * Visibility is the gate in the store, so an account that cannot see the
   * flag is not on it whatever `enabled` says — collapsing the pair here
   * rather than at each of the four places that ask keeps the table and the
   * counts agreeing with the shell.
   */
  const agencySaysOn = React.useCallback(
    (id: string) => {
      const row = agencyRow(id);
      return row.visible && row.enabled;
    },
    [agencyRow],
  );

  /*
   * The counts, all three derived.
   *
   * `enabled` is what the AGENCY set; `effective` is what each account
   * actually gets, which folds in the account's own answer from its Labs
   * page (and reads as on for everyone during a trial). They are different
   * questions and they are allowed to disagree — an agency that enabled a
   * beta for an account that then handed it back is a real state, not a
   * sync bug, and a console that showed only one number would be hiding the
   * thing the two columns exist to express.
   */
  const total = ALL_ACCOUNTS.length;
  const enabled = ALL_ACCOUNTS.filter((a) => agencySaysOn(a.id)).length;
  const differing = ALL_ACCOUNTS.filter(
    (a) => accountOn(a.id) !== agencySaysOn(a.id),
  ).length;

  const q = query.trim().toLowerCase();
  const shown = React.useMemo(
    () =>
      ALL_ACCOUNTS.filter(
        (a) =>
          q === "" ||
          a.name.toLowerCase().includes(q) ||
          a.meta.toLowerCase().includes(q),
      ),
    [q],
  );

  /*
   * The one write on this screen.
   *
   * Two rules enforced here rather than at the controls that can break
   * them, which is how the access sheet does it too:
   *
   * 1. Enabled is only meaningful where visible, so a hidden row is written
   *    flat off. The store re-checks this on read; doing it on write as
   *    well is what keeps the table from displaying a state the model
   *    cannot hold.
   * 2. Moving an account ONTO Switchyard sets visible as well. The store
   *    gates enablement behind visibility, so writing `enabled` alone onto
   *    a hidden row would land as a no-op — the row would go on saying
   *    Legacy after a click that reported success, which is exactly the
   *    silent failure this console is meant to end.
   *
   * Visibility has no control of its own here on purpose. During the beta
   * the flag is not offered inside sub-account Labs at all: the agency
   * admin keeps the decision, and a per-row visibility switch would be
   * offering to hand it over. The rows that are hidden say so.
   */
  const writeNav = React.useCallback(
    (ids: readonly string[], on: boolean) => {
      const next = { ...access };
      for (const id of ids) {
        next[id] = on
          ? { visible: true, enabled: true }
          : { visible: (access[id] ?? DEFAULT_ACCESS).visible, enabled: false };
      }
      setAccess(next);
    },
    [access, setAccess],
  );

  const allShownPicked =
    shown.length > 0 && shown.every((a) => picked.includes(a.id));

  return (
    <section className="flex flex-col gap-[16px]">
      <header className="rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="flex flex-wrap items-start justify-between gap-[16px]">
          <div className="min-w-0">
            <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">
              Switchyard rollout
            </h2>
            {/*
              The count first, in the heading's own voice, because it is the
              only sentence on this screen that answers "where are we" — and
              an agency mid-rollout asks that before it asks anything else.
            */}
            <p className="mt-[4px] text-[13px] leading-[18px] text-pg-muted">
              Switchyard enabled for {enabled} of {total} sub-accounts.
              {differing > 0 ? (
                <>
                  {" "}
                  {differing} {differing === 1 ? "account has" : "accounts have"}{" "}
                  since changed it from their own Labs.
                </>
              ) : null}
            </p>
          </div>

          {/*
            The agency's own sidebar, fenced off from the table.

            It is a different scope, not a summary of the rows: switching it
            on puts the AGENCY VIEW on the new navigation and reaches no
            sub-account at all. Sitting it in the header beside a count of
            sub-accounts is the risk, so it carries its own label and its own
            sentence rather than a bare switch.
          */}
          <div className="flex shrink-0 items-start gap-[12px] rounded-[8px] bg-pg px-[12px] py-[10px]">
            <div className="max-w-[240px]">
              <p className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
                Agency view
              </p>
              <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
                Switchyard for your own sidebar. Sub-accounts are unaffected.
              </p>
            </div>
            <span className="pt-[2px]">
              <Toggle
                label="Switchyard for the agency view"
                on={agencyOn}
                onChange={setAgencyOn}
              />
            </span>
          </div>
        </div>

        <EnrollmentMeter />
      </header>

      <div className="overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        {/*
          Filter and bulk bar share one row, and the bulk half only appears
          with a selection. A permanently-drawn bar of dead buttons teaches
          people to stop reading it, which is the opposite of what a control
          that changes forty accounts at once should do.
        */}
        <div className="flex flex-wrap items-center gap-[12px] p-[16px]">
          <div className="flex h-[36px] w-[240px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
            <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter sub-accounts"
              aria-label="Filter sub-accounts"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>

          {picked.length > 0 ? (
            <>
              <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong tabular-nums">
                {picked.length} selected
              </span>
              <button
                type="button"
                onClick={() => {
                  writeNav(picked, true);
                  setPicked([]);
                }}
                className="motion-tap flex h-[36px] items-center rounded-[8px] bg-brand px-[14px] text-[13px] leading-[normal] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]"
              >
                Enable Switchyard
              </button>
              <button
                type="button"
                onClick={() => {
                  writeNav(picked, false);
                  setPicked([]);
                }}
                className="motion-tap flex h-[36px] items-center rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
              >
                Switch to legacy
              </button>
              <button
                type="button"
                aria-label="Clear selection"
                onClick={() => setPicked([])}
                className="motion-tap flex size-[24px] items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg hover:text-pg-text"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </>
          ) : (
            <p className="text-[13px] leading-[18px] text-pg-muted">
              Select sub-accounts to move them together.
            </p>
          )}
        </div>

        <div className="flex h-[40px] items-center gap-[12px] bg-pg px-[16px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_-1px_0_0_var(--pg-head-border),inset_0_1px_0_0_var(--pg-head-border)]">
          <span className="flex w-[20px] shrink-0 items-center">
            <input
              type="checkbox"
              aria-label="Select all filtered sub-accounts"
              checked={allShownPicked}
              onChange={(e) =>
                setPicked(e.target.checked ? shown.map((a) => a.id) : [])
              }
              className="size-[15px] accent-[var(--brand)]"
            />
          </span>
          <span className="min-w-0 flex-1">Sub-account</span>
          <span className="w-[200px] shrink-0">Navigation</span>
          <span className="w-[180px] shrink-0">Custom code</span>
          <span className="w-[96px] shrink-0 text-right">Preview</span>
        </div>

        <div>
          {shown.map((account) => {
            const row = agencyRow(account.id);
            const on = row.visible && row.enabled;
            /*
             * What the account actually gets, which is not always what the
             * agency set — see the counts above. Drawn as a line under the
             * name rather than a fifth column, because it is the exception
             * and a column of blanks would spend table width on it.
             */
            const effective = accountOn(account.id);

            return (
              <div
                key={account.id}
                className="flex min-h-[52px] items-center gap-[12px] px-[16px] py-[8px] shadow-[inset_0_-1px_0_0_var(--pg-row-border)]"
              >
                <span className="flex w-[20px] shrink-0 items-center">
                  <input
                    type="checkbox"
                    aria-label={`Select ${account.name}`}
                    checked={picked.includes(account.id)}
                    onChange={(e) =>
                      setPicked((p) =>
                        e.target.checked
                          ? [...p, account.id]
                          : p.filter((x) => x !== account.id),
                      )
                    }
                    className="size-[15px] accent-[var(--brand)]"
                  />
                </span>

                <span className="flex min-w-0 flex-1 flex-col pr-[12px]">
                  <span className="truncate text-[14px] leading-[20px] text-pg-text-strong">
                    {account.name}
                  </span>
                  {effective !== on ? (
                    <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                      {effective
                        ? "On Switchyard by the account's own choice"
                        : "Switched back to legacy by the account"}
                    </span>
                  ) : !row.visible ? (
                    <span className="truncate text-[13px] leading-[18px] text-pg-faint">
                      Hidden from this account
                    </span>
                  ) : null}
                </span>

                <span className="w-[200px] shrink-0">
                  <NavChoice
                    account={account.name}
                    on={on}
                    onChange={(next) => writeNav([account.id], next)}
                  />
                </span>

                {/*
                  Custom code, read off the navigation rather than stored.

                  There is no per-account code setting to read: custom CSS
                  and JS are an AGENCY-level thing written once under White
                  Label, and what varies per account is only whether the nav
                  they are on runs it. So this cell is derived — moving a row
                  to Switchyard turns its code off in the same gesture, which
                  is the rule stated rather than a second switch to find.
                */}
                <span
                  className={cn(
                    "w-[180px] shrink-0 text-[13px] leading-[18px]",
                    on ? "text-pg-muted" : "text-pg-text",
                  )}
                >
                  {on ? "Off on Switchyard" : "Running on legacy nav"}
                </span>

                <span className="flex w-[96px] shrink-0 justify-end">
                  {/*
                    A look, and nothing else: the preview opens the new nav
                    in a tab with a scope param, enabling no flag and
                    applying no custom code. `rel=noreferrer` because a
                    `_blank` tab gets a `window.opener` handle otherwise.
                  */}
                  <a
                    href={SWITCHYARD_PREVIEW.sub}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-tap inline-flex h-[32px] items-center gap-[5px] rounded-[8px] px-[10px] text-[13px] leading-[normal] font-medium text-brand hover:bg-brand-soft"
                  >
                    Preview
                    <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
                    <span className="sr-only">{account.name}</span>
                  </a>
                </span>
              </div>
            );
          })}

          {shown.length === 0 ? (
            <p className="px-[16px] py-[32px] text-center text-[13px] leading-[18px] text-pg-muted">
              No sub-accounts match &ldquo;{query}&rdquo;
            </p>
          ) : null}
        </div>

        {/*
          The two rules that are not controls, kept at the foot of the table
          they describe rather than in a tooltip on a column head: both are
          consequences of a decision made above them, and a reader meets them
          at the moment they have finished making it.
        */}
        <footer className="flex flex-col gap-[4px] p-[16px]">
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Enabling Switchyard turns custom code off for that sub-account.
            Code written against the old sidebar does not apply to the new
            one, so it is dropped rather than half-applied.
          </p>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            The code itself lives in White Label, under Custom CSS and JS.
            This screen decides who is on Switchyard; that one decides what
            runs on it.
          </p>
        </footer>
      </div>
    </section>
  );
}

/**
 * One row's navigation, as a two-state choice rather than a switch.
 *
 * A toggle would have been smaller and would have made Legacy the absence of
 * something. It is not: it is the navigation almost every account is on
 * today and the one half this table can move people back to, so both states
 * are named and both are reachable in one click. The agency header above
 * still uses the house `Toggle`, because up there the off state really is
 * "not taking the beta".
 */
function NavChoice({
  account,
  on,
  onChange,
}: {
  account: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <span
      role="group"
      aria-label={`Navigation for ${account}`}
      className="inline-flex h-[32px] items-center rounded-[8px] bg-pg p-[2px]"
    >
      {(
        [
          [false, "Legacy"],
          [true, "Switchyard"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={label}
          type="button"
          aria-pressed={on === value}
          onClick={() => onChange(value)}
          className={cn(
            "motion-tap flex h-[28px] items-center rounded-[6px] px-[10px] text-[13px] leading-[normal] font-medium",
            on === value
              ? "bg-pg-surface text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]"
              : "text-pg-muted hover:text-pg-text",
          )}
        >
          {label}
        </button>
      ))}
    </span>
  );
}

/**
 * Where public beta enrollment stands against its cap.
 *
 * Drawn as a meter rather than written into a paragraph of release notes,
 * because the cap is a thing that will stop working for you — enrollments
 * pause at the threshold and the next tranche waits for the fleet to
 * settle. A number an agency has to find in a help article is a number it
 * finds out about on the day it is turned away.
 *
 * Private beta, by contrast, gets no meter: it is a hardcoded whitelist of
 * agencies and locations, so there is no quantity to run out of and a bar
 * at 100 percent would be answering a question nobody asked.
 */
function EnrollmentMeter() {
  const pct = Math.min(100, (PUBLIC_BETA_ENROLLED / PUBLIC_BETA_CAP) * 100);

  return (
    <div className="mt-[16px] border-t border-pg-border pt-[12px]">
      <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
        <p className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
          Public beta enrollment: {PUBLIC_BETA_ENROLLED.toLocaleString("en-US")}{" "}
          of {PUBLIC_BETA_CAP.toLocaleString("en-US")} agencies
        </p>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Private beta is invite only.
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Public beta enrollment"
        aria-valuenow={PUBLIC_BETA_ENROLLED}
        aria-valuemin={0}
        aria-valuemax={PUBLIC_BETA_CAP}
        className="mt-[8px] h-[6px] overflow-hidden rounded-full bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]"
      >
        <span
          aria-hidden="true"
          className="block h-full rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-[6px] text-[13px] leading-[18px] text-pg-muted">
        New enrollments pause at the cap so the rollout can stabilise, then
        reopen for the next group.
      </p>
    </div>
  );
}
