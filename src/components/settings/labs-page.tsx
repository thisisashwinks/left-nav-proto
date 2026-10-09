"use client";

import * as React from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { accounts as ALL_ACCOUNTS } from "@/components/accounts/accounts-data";
import { Modal } from "@/components/page/modal";
import { useLabs, type AccountAccess } from "./labs-state";
import { PageTitle, usePageChrome } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { LabsRolloutConsole } from "./labs-rollout-console";
import { cn } from "@/lib/utils";
import {
  AGENCY_FLAGS,
  BLURB_CLAMP,
  REACH_LABELS,
  SUB_ACCOUNT_FLAGS,
  SWITCHYARD_PREVIEW,
  type LabsFlag,
  type SubAccountFlag,
} from "./labs-data";

/**
 * Agency › Labs.
 *
 * The beta programme: a banner, two tabs, and a card per feature flag. Built
 * from the production screens rather than redesigned, because the point of
 * having it here is to put Switchyard on the page people will actually find
 * it on — a prettier Labs would be a different screen, and the question is
 * what the real one does when our flag is in it.
 *
 * ONE FLAG IS REAL. Switchyard's card is wired to the prototype: switching
 * it on at agency scope is what makes it appear on the Sub-Account tab,
 * which is the dependency the real rollout has and the one thing a static
 * mock cannot show. Everything else is a picture — the toggles move and
 * nothing happens, which is honest about what this page is for.
 *
 * The gate runs one way only. Turning the agency flag back off takes the
 * sub-account card away with it, because an agency that has not taken a beta
 * cannot be deciding who among its accounts gets it. That is a real rule
 * rather than a convenience: the alternative is a sub-account row offering
 * to enable something the agency itself is not on.
 */
/**
 * Rows per page in the access sheet.
 *
 * Ten, because the real table pages at ten and because a modal that grows
 * with the fixture is a modal that looks right here and overflows in
 * production. The prototype has forty-odd accounts; production has tens of
 * thousands, and the control has to be the same either way.
 */
const SHEET_PAGE = 10;

export function LabsPage() {
  const { title: showTitle, description: showDesc } = usePageChrome();
  /*
   * Approach 4 replaces this page wholesale rather than adding to it.
   *
   * Its argument is that Labs should own ONE question — who is on the new
   * navigation — and a console sitting below the existing flag list would be
   * two answers to that question on one screen, which is the confusion the
   * approach exists to remove. So it swaps, and the flag list is what every
   * other approach leaves standing. See WHITE_LABEL_APPROACHES.
   */
  const { whiteLabelApproach } = useTheme();
  const [tab, setTab] = React.useState<"agency" | "sub">("agency");
  const [query, setQuery] = React.useState("");

  const rolloutConsole = whiteLabelApproach === "split";

  /*
   * Switchyard's own state, held here because both tabs read it.
   *
   * Agency-off is the starting point on purpose: the page's one real
   * behaviour is the moment the sub-account card APPEARS, and a screen that
   * opens with it already there has nothing to demonstrate.
   */
  /*
   * The rollout, read from the store the SHELL reads — see `labs-state`.
   *
   * Local state here would have made the page a picture of a decision
   * rather than the place the decision is made, which is the one thing
   * this screen exists to be: switching the agency flag off has to take
   * the new sidebar away on the left of this very page.
   */
  const { agencyOn, setAgencyOn, access, setAccess, accountOn, startTrial } =
    useLabs();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  /*
   * The Sub-Account card's own summary: on when any account has it.
   *
   * Derived rather than stored. A second boolean beside the table could
   * disagree with it, and the pill would then be reporting a rollout that
   * had not happened.
   */
  const subOn = ALL_ACCOUNTS.some((a) => accountOn(a.id));
  /*
   * Per-account answers, empty until someone opens the sheet.
   *
   * Absent means the default — visible, not enabled — rather than a row
   * seeded for all forty accounts up front: the sheet writes only what was
   * actually touched, so "nothing decided yet" and "decided to leave it"
   * stay distinguishable.
   */


  const q = query.trim().toLowerCase();
  const matches = (f: LabsFlag) =>
    q === "" ||
    f.name.toLowerCase().includes(q) ||
    f.headline.toLowerCase().includes(q);

  const agencyFlags = AGENCY_FLAGS.filter(matches);
  /*
   * The sub-account list, minus a Switchyard the agency has not taken.
   *
   * Filtered rather than disabled. A greyed-out card would say "you could
   * have this", which is true and is the agency tab's job to say; here it
   * would be a second place making the same offer, and the reader would
   * reasonably try to accept it in the wrong one.
   */
  const subFlags = SUB_ACCOUNT_FLAGS.filter(
    (f) => matches(f) && (f.id !== "switchyard" || agencyOn),
  );

  if (rolloutConsole) return <LabsRolloutConsole />;

  return (
    /*
      One scroller, and it is not this one.
      
      The page used to pin its header and scroll only the cards beneath the
      tabs, which put a second scrollbar inside the canvas's own and left
      the banner stranded at the top of a list it is not part of. Labs is a
      document — an introduction, then a list — so the whole thing moves
      together and the canvas scrolls it, which also puts the bar back at
      the window's right edge where a page-level scrollbar belongs.
      
      Capped and not full bleed: these cards are one column of prose and a
      switch, and at 1900px the switch ends up a hand's width from the
      sentence it answers.
      
      1160 is HighRise's own body content width — the house figure for the
      content column inside this shell. It replaced a 1100 I had picked by
      eye; the White Label session cited the system and was right to. Two
      agency pages agreeing is worth something, but agreeing on a number
      from the design system is worth more than agreeing on each other's.
      
      It only engages on wide screens: at 1440 the canvas's padding binds
      first and the content comes out around 1068. Centred, with that
      padding still outside it.
    */
    <div className="mx-auto w-full max-w-[1160px] px-[var(--page-inset)] pb-[24px]">
      <header>
        {showTitle ? (
          <>
            <PageTitle
              title="Labs"
              className="text-[20px] leading-[28px] font-semibold text-pg-heading"
            />
            {showDesc ? (
              <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
                Test out the new features before everyone else
              </p>
            ) : null}
          </>
        ) : null}

        <BetaBanner className={showTitle ? "mt-[16px]" : undefined} />

        {/*
          The tab row carries the page's controls as well as its tabs.

          Search belongs beside them rather than above: it filters the list
          under the tabs, not the banner over them, and a field on its own
          line would have claimed to search the page.
        */}
        <div className="mt-[20px] flex flex-wrap items-end justify-between gap-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
          <nav aria-label="Labs scopes" className="flex gap-[18px]">
            {(
              [
                ["agency", "Agency"],
                ["sub", "Sub-Account"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-current={id === tab ? "page" : undefined}
                onClick={() => setTab(id)}
                className={cn(
                  "motion-tap shrink-0 pb-[10px] text-[14px] leading-[20px] font-medium whitespace-nowrap",
                  id === tab
                    ? "text-brand shadow-[inset_0_-2px_0_0_var(--brand)]"
                    : "text-pg-muted hover:text-pg-text",
                )}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 flex-wrap items-center gap-[10px] pb-[8px]">
            {/*
              Preferences is the Sub-Account tab's own control.

              It sets the defaults a new sub-account inherits, which is a
              question that does not exist at agency scope — there is one
              agency, and it is the thing being configured.
            */}
            {tab === "sub" ? (
              <button
                type="button"
                onClick={() => showToast("Labs preferences are a stub here")}
                className="motion-tap flex h-[36px] items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
              >
                <Settings2 size={15} aria-hidden="true" className="text-pg-faint" />
                Preferences
              </button>
            ) : null}
            <div className="flex h-[36px] w-[230px] items-center gap-[9px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search features"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="pt-[16px]">
        <div className="flex flex-col gap-[16px]">
          {tab === "agency"
            ? agencyFlags.map((flag) => (
                <FlagCard
                  key={flag.id}
                  flag={flag}
                  {...(flag.live
                    ? {
                        on: agencyOn,
                        onToggle: setAgencyOn,
                        onTry: () => startTrial("agency"),
                      }
                    : {})}
                />
              ))
            : subFlags.map((flag) => (
                <FlagCard
                  key={flag.id}
                  flag={flag}
                  sub={flag}
                  {...(flag.live
                    ? {
                        on: subOn,
                        onPickAccounts: () => setSheetOpen(true),
                        onTry: () => startTrial("account"),
                      }
                    : {})}
                />
              ))}

          {(tab === "agency" ? agencyFlags : subFlags).length === 0 ? (
            <p className="py-[32px] text-center text-[13px] leading-[18px] text-pg-muted">
              {q
                ? `No features match “${query}”`
                : "Nothing in this programme yet."}
            </p>
          ) : null}
        </div>
      </div>

      {sheetOpen ? (
        <AccountAccessSheet
          flag={SUB_ACCOUNT_FLAGS.find((f) => f.id === "switchyard")!}
          rows={access}
          onChange={setAccess}
          onClose={() => setSheetOpen(false)}
          onSave={() => {
            /*
              Nothing to commit — the switches write straight through to the
              store the shell reads, so the sidebar has already changed
              behind this modal. Save closes it and reports the reach.

              A staged copy with a real Save was the other shape and it is
              the wrong one here: the whole point of putting this in the
              prototype is that you can watch a sub-account's nav change as
              you flip its row.
            */
            const live = ALL_ACCOUNTS.filter((a) => accountOn(a.id)).length;
            setSheetOpen(false);
            showToast(
              live === 0
                ? "Switchyard is off for every sub-account"
                : `Switchyard enabled for ${live} sub-account${live === 1 ? "" : "s"}`,
            );
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Who gets the flag, one sub-account at a time.
 *
 * Two switches per row and they are not independent: VISIBILITY is whether
 * the account can see the beta exists, ENABLE is whether it is on for them.
 * Enable is dead while the row is hidden, because enabling something nobody
 * can see is a state the product cannot describe — the account would have
 * the feature and no way to know, and the agency would have no way to tell
 * from this table which of its accounts were in that position.
 *
 * Hiding a row that is already enabled turns it off as well. That is the
 * same rule read backwards, and doing it silently is wrong, so the row says
 * so: the Enable switch visibly drops as the Visibility one does.
 *
 * Paged rather than scrolled, at ten a page, because the real list runs to
 * tens of thousands and an infinite scroll over a table of switches is a
 * place to lose your work. The page count here is honest about the fixture:
 * it reports the accounts this prototype actually has.
 */
function AccountAccessSheet({
  flag,
  rows,
  onChange,
  onClose,
  onSave,
}: {
  flag: LabsFlag;
  rows: Record<string, AccountAccess>;
  onChange: (next: Record<string, AccountAccess>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [picked, setPicked] = React.useState<readonly string[]>([]);

  const q = query.trim().toLowerCase();
  const all = React.useMemo(
    () => ALL_ACCOUNTS.filter((a) => a.name.toLowerCase().includes(q)),
    [q],
  );
  const pages = Math.max(1, Math.ceil(all.length / SHEET_PAGE));
  const here = Math.min(page, pages - 1);
  const shown = all.slice(here * SHEET_PAGE, here * SHEET_PAGE + SHEET_PAGE);

  const set = (id: string, next: Partial<AccountAccess>) => {
    const was = rows[id] ?? { visible: true, enabled: false };
    const merged = { ...was, ...next };
    onChange({
      ...rows,
      // The dependency, enforced in the one place that writes a row rather
      // than at each of the two switches that can break it.
      [id]: merged.visible ? merged : { visible: false, enabled: false },
    });
  };

  return (
    <Modal
      width={880}
      onClose={onClose}
      title={
        <span className="flex min-w-0 flex-wrap items-center gap-[10px]">
          <span className="text-[18px] leading-[26px] font-semibold text-pg-heading">
            {flag.name}
          </span>
          <span className="flex h-[28px] items-center rounded-[8px] px-[10px] text-[12.5px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
            Activate now - Live in {flag.liveIn ?? 0}{" "}
            {flag.liveIn === 1 ? "day" : "days"}
          </span>
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="motion-tap flex h-[36px] items-center rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="motion-tap flex h-[36px] items-center rounded-[8px] bg-brand px-[16px] text-[13px] leading-[normal] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]"
          >
            Save
          </button>
        </>
      }
    >
      <p className="text-[13px] leading-[18px] text-pg-muted">
        Enable or disable this feature and control its visibility for your
        sub-accounts.
      </p>

      <div className="mt-[14px] overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="flex flex-wrap items-center gap-[12px] px-[12px] py-[10px]">
          <div className="flex h-[34px] w-[220px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]">
            <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search"
              aria-label="Search sub-accounts"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
          <span className="text-[13px] leading-[18px] text-pg-muted">
            {picked.length} sub-accounts selected
          </span>
          <button
            type="button"
            onClick={() => setPicked(all.map((a) => a.id))}
            className="motion-tap text-[13px] leading-[18px] font-medium text-brand hover:underline"
          >
            Select All ({all.length})
          </button>
          {picked.length > 0 ? (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={() => setPicked([])}
              className="motion-tap flex size-[24px] items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg-bg hover:text-pg-text"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => showToast("Bulk actions are a stub here")}
            className="motion-tap flex h-[34px] items-center rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
          >
            Bulk Actions
          </button>
        </div>

        <div className="flex h-[38px] items-center bg-pg px-[12px] shadow-[inset_0_-1px_0_0_var(--pg-head-border),inset_0_1px_0_0_var(--pg-head-border)]">
          <span className="w-[28px] shrink-0" />
          <span className="min-w-0 flex-1 text-[13px] leading-[normal] font-medium text-pg-text-strong">
            Sub-Accounts
          </span>
          <ColumnHead label="Visibility" hint="Whether the sub-account can see this feature at all." />
          <ColumnHead label="Enable" hint="Whether it is switched on. Needs visibility first." />
        </div>

        <div>
          {shown.map((account, i) => {
            const row = rows[account.id] ?? { visible: true, enabled: false };
            return (
              <div
                key={account.id}
                className={cn(
                  "flex h-[48px] items-center px-[12px]",
                  i % 2 === 1 && "bg-pg",
                )}
              >
                <span className="flex w-[28px] shrink-0 items-center">
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
                <span className="min-w-0 flex-1 truncate pr-[12px] text-[13.5px] leading-[normal] text-pg-text-strong">
                  {account.name}
                </span>
                <span className="flex w-[180px] shrink-0 items-center gap-[10px]">
                  <Toggle
                    label={`Visibility for ${account.name}`}
                    on={row.visible}
                    onChange={(next) => set(account.id, { visible: next })}
                  />
                  <span className="text-[13px] leading-[normal] text-pg-text">
                    {row.visible ? "Visible" : "Hidden"}
                  </span>
                </span>
                <span className="flex w-[180px] shrink-0 items-center gap-[10px]">
                  <Toggle
                    label={`Enable for ${account.name}`}
                    on={row.enabled}
                    disabled={!row.visible}
                    onChange={(next) => set(account.id, { enabled: next })}
                  />
                  <span
                    className={cn(
                      "text-[13px] leading-[normal]",
                      row.visible ? "text-pg-text" : "text-pg-disabled",
                    )}
                  >
                    {row.enabled ? "Enabled" : "Disabled"}
                  </span>
                </span>
              </div>
            );
          })}
          {shown.length === 0 ? (
            <p className="px-[12px] py-[28px] text-center text-[13px] leading-[18px] text-pg-muted">
              No sub-accounts match &ldquo;{query}&rdquo;
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-[6px] px-[12px] py-[10px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
          <PageButton
            label="Previous"
            disabled={here === 0}
            onClick={() => setPage(here - 1)}
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </PageButton>
          {Array.from({ length: pages }, (_, n) => n).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === here ? "page" : undefined}
              onClick={() => setPage(n)}
              className={cn(
                "motion-tap flex h-[30px] min-w-[30px] items-center justify-center rounded-[6px] px-[8px] text-[13px] leading-[normal] tabular-nums",
                n === here
                  ? "font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                  : "text-pg-muted hover:bg-pg-bg hover:text-pg-text",
              )}
            >
              {n + 1}
            </button>
          ))}
          <PageButton
            label="Next"
            disabled={here >= pages - 1}
            onClick={() => setPage(here + 1)}
          >
            <ChevronRight size={14} aria-hidden="true" />
          </PageButton>
        </div>
      </div>
    </Modal>
  );
}

/** A column heading with the info glyph the real table carries. */
function ColumnHead({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="flex w-[180px] shrink-0 items-center gap-[6px] text-[13px] leading-[normal] font-medium text-pg-text-strong">
      {label}
      <Info
        size={13}
        aria-hidden="true"
        className="shrink-0 text-pg-faint"
      />
      <span className="sr-only">{hint}</span>
    </span>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="motion-tap flex h-[30px] items-center justify-center rounded-[6px] px-[8px] text-pg-muted hover:bg-pg-bg hover:text-pg-text disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * The programme's own introduction.
 *
 * Kept as a painted band rather than a card on the page's grey, because it
 * is the one thing here that is not a feature — a white card would have put
 * it in the same class as the rows below it.
 */
export function BetaBanner({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[10px] bg-[var(--hr-primary-600)] px-[32px] py-[28px]",
        className,
      )}
    >
      <div className="relative z-[1] max-w-[560px]">
        <h2 className="text-[22px] leading-[30px] font-semibold text-white">
          Welcome to our Beta Program
        </h2>
        <p className="mt-[10px] text-[14px] leading-[22px] text-white/85">
          Experiment with our latest and greatest features before they&rsquo;re
          available to everyone. These features are in early access and may
          change as we develop them. Your feedback will help shape what they
          become.
        </p>
      </div>
      {/*
        The illustration, as geometry rather than an asset.

        The real banner carries a drawn monitor-and-cogs scene. Shipping a PNG
        for it would mean a file nobody can retheme and a 404 the first time
        this prototype is served from somewhere else, so the slot is filled
        with the same shapes in CSS — it reads as artwork at a glance and
        makes no claim to be the final one. Hidden under 900px, where the
        copy needs the whole band.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[40px] hidden h-[150px] w-[220px] -translate-y-1/2 lg:block"
      >
        <span className="absolute inset-x-[22px] top-[14px] bottom-[34px] rounded-[8px] bg-white/15 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]" />
        <span className="absolute inset-x-[38px] top-[30px] bottom-[50px] rounded-[4px] bg-white/25" />
        <span className="absolute bottom-[16px] left-1/2 h-[18px] w-[12px] -translate-x-1/2 bg-white/30" />
        <span className="absolute bottom-[8px] left-1/2 h-[6px] w-[90px] -translate-x-1/2 rounded-full bg-white/30" />
        <span className="absolute top-[6px] right-[14px] size-[26px] rounded-full shadow-[inset_0_0_0_6px_rgba(255,255,255,0.4)]" />
        <span className="absolute top-[40px] right-0 size-[16px] rounded-full shadow-[inset_0_0_0_4px_rgba(255,255,255,0.3)]" />
        <span className="absolute bottom-[26px] left-[2px] size-[20px] rounded-full shadow-[inset_0_0_0_5px_rgba(255,255,255,0.3)]" />
      </div>
    </section>
  );
}

/**
 * One feature flag.
 *
 * Three bands: the name and its controls, the description, and a footer
 * holding the action and the feedback door. The real page draws every card
 * this way whatever state the flag is in, which is what makes a list of
 * eight scannable — the eye learns one shape and then reads only what
 * differs.
 */
export function FlagCard({
  flag,
  sub,
  on,
  onToggle,
  onPickAccounts,
  onTry,
}: {
  flag: LabsFlag;
  /** Present on the Sub-Account tab: visibility and reach ride along. */
  sub?: SubAccountFlag;
  /** Set only for the flag this prototype actually honours. */
  on?: boolean;
  onToggle?: (next: boolean) => void;
  /** Opens the per-sub-account sheet. Sub-Account tab, wired flag only. */
  onPickAccounts?: () => void;
  /** Starts a trial of the new nav in this workspace. See SWITCHYARD_TRIES. */
  onTry?: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const { switchyardTry } = useTheme().effective;
  const long = flag.blurb.length > BLURB_CLAMP;
  const wired = onToggle !== undefined;
  /*
   * Only Switchyard carries a preview, and only because only Switchyard is
   * a thing this prototype can actually show. A link on a pictured flag
   * would open a tab onto nothing.
   */
  /*
   * A toggle, or the footer's Activate button — never both.
   *
   * The agency tab gives a flag one switch: the real page draws
   * Implementation Experts that way. The Sub-Account tab never does,
   * because "on" there is a per-account answer and a single switch would
   * be claiming otherwise.
   */
  const hasToggle = !sub && (flag.state === "on" || wired);
  const preview = flag.id === "switchyard"
    ? sub
      ? SWITCHYARD_PREVIEW.sub
      : SWITCHYARD_PREVIEW.agency
    : null;
  /*
   * A real flag reports the state it is actually in; a pictured one reports
   * the state its fixture claims. Same card either way — the difference is
   * which source is telling the truth, not which treatment is drawn.
   */
  const live = wired ? Boolean(on) : flag.state === "on";

  return (
    <article className="overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="flex flex-wrap items-start justify-between gap-[12px] px-[20px] py-[16px]">
        <div className="flex min-w-0 flex-col gap-[4px]">
          <h3 className="text-[18px] leading-[26px] font-semibold text-pg-heading">
            {flag.name}
          </h3>
          {sub ? (
            <span className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
              {sub.visible === "all" ? (
                <Eye size={14} aria-hidden="true" className="shrink-0" />
              ) : (
                <EyeOff size={14} aria-hidden="true" className="shrink-0" />
              )}
              {sub.visible === "all"
                ? "Visible for all sub-accounts"
                : "Hidden from sub-accounts"}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
          {/*
            The reach pill and its button are one control in two parts: the
            pill states where activation has got to, the button is how you
            change it. Only the Sub-Account tab has them, because only there
            is "who gets this" a question.
          */}
          {sub?.reach && !live ? (
            <>
              <span className="flex h-[32px] items-center rounded-[8px] px-[12px] text-[13px] leading-[normal] font-medium text-brand shadow-[inset_0_0_0_1px_var(--brand)]">
                {REACH_LABELS[sub.reach]}
              </span>
              <button
                type="button"
                onClick={() =>
                  onPickAccounts
                    ? onPickAccounts()
                    : showToast(`${flag.name} is a picture here`)
                }
                className="motion-tap flex h-[32px] items-center rounded-[8px] bg-brand px-[14px] text-[13px] leading-[normal] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]"
              >
                Activate Feature
              </button>
            </>
          ) : null}

          {/* The toggle, where the flag is a straight on/off for the agency. */}
          {hasToggle ? (
            <Toggle
              label={flag.name}
              on={live}
              onChange={(next) =>
                wired
                  ? onToggle(next)
                  : showToast(`${flag.name} is a picture here`)
              }
            />
          ) : null}
        </div>
      </div>

      <div className="px-[20px] py-[16px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
        <p className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
          {flag.headline}
        </p>
        <p className="mt-[8px] text-[13px] leading-[20px] text-pg-muted">
          {long && !expanded ? `${flag.blurb.slice(0, BLURB_CLAMP)}…` : flag.blurb}
          {/*
            The preview, inline at the end of the description rather than
            down in the footer beside Activate.

            It belongs to the sentence that describes the feature, not to
            the row of things that CHANGE it — a reader deciding whether to
            take a beta wants to look before they reach the switch, and a
            link sitting next to Activate reads as a second way to activate.

            Which sidebar it opens depends on the tab: see
            SWITCHYARD_PREVIEW. `rel=noreferrer` with `_blank` because the
            opened tab gets a `window.opener` handle otherwise.
          */}
          {preview && switchyardTry !== "trial" ? (
            <>
              {" "}
              <a
                href={preview}
                target="_blank"
                rel="noreferrer"
                className="motion-tap inline-flex items-center gap-[4px] font-medium text-brand hover:underline"
              >
                Preview {sub ? "the sub-account nav" : "the agency nav"}
                <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
              </a>
            </>
          ) : null}
          {/*
            The second offer, where the axis asks for it.

            Both read as links in the same sentence rather than one being
            a button, because they are two ways of answering one question
            and a button beside a link would rank them. Order matters:
            preview first, because "what is this" comes before "what would
            this be like for me" — and the second is the one that changes
            your own workspace. See SWITCHYARD_TRIES.
          */}
          {preview && switchyardTry !== "preview" && onTry ? (
            <>
              {switchyardTry === "both" ? " · " : " "}
              <button
                type="button"
                onClick={onTry}
                className="motion-tap inline-flex items-center gap-[4px] font-medium text-brand hover:underline"
              >
                Try it in this account
                <ArrowRight size={12} aria-hidden="true" className="shrink-0" />
              </button>
            </>
          ) : null}
        </p>
        {long ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="motion-tap mt-[6px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
          >
            {expanded ? "Show Less" : "Show More"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[12px] px-[20px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
        <FlagAction
          flag={flag}
          live={live}
          wired={wired}
          /*
            Where the header already carries a switch, the footer states the
            countdown rather than offering a second way to take the beta.
            Two controls for one decision is how a reader ends up unsure
            which one they just used.
          */
          inert={hasToggle}
          {...(onToggle ? { onToggle } : {})}
        />
        <button
          type="button"
          onClick={() => showToast("Feedback goes nowhere in the prototype")}
          className="motion-tap flex h-[32px] items-center rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
        >
          Submit Feedback
        </button>
      </div>
    </article>
  );
}

/**
 * The footer's left side: where this flag has got to, or the way in.
 *
 * `live` states it, `available` offers it and says how long the offer has
 * left. The countdown is the part worth keeping from the real page — it is
 * the only thing on the card that explains why a beta is worth taking now
 * rather than waiting.
 */
export function FlagAction({
  flag,
  live,
  wired,
  inert = false,
  onToggle,
}: {
  flag: LabsFlag;
  live: boolean;
  wired: boolean;
  /** State it, do not offer it — a switch above is already the offer. */
  inert?: boolean;
  onToggle?: (next: boolean) => void;
}) {
  if (flag.state === "live") {
    return (
      <span className="flex h-[32px] items-center gap-[7px] rounded-full px-[12px] text-[13px] leading-[normal] font-medium text-[var(--hr-success-700)] shadow-[inset_0_0_0_1px_var(--hr-success-600)]">
        <span
          aria-hidden="true"
          className="size-[6px] shrink-0 rounded-full bg-[var(--hr-success-600)]"
        />
        Live
      </span>
    );
  }

  if (live) {
    return (
      <span className="flex h-[32px] items-center gap-[7px] rounded-full px-[12px] text-[13px] leading-[normal] font-medium text-[var(--hr-success-700)] shadow-[inset_0_0_0_1px_var(--hr-success-600)]">
        <span
          aria-hidden="true"
          className="size-[6px] shrink-0 rounded-full bg-[var(--hr-success-600)]"
        />
        Active
      </span>
    );
  }

  const days = flag.liveIn ?? 0;
  const label = `Activate now - Live in ${days} ${days === 1 ? "day" : "days"}`;

  if (inert) {
    return (
      <span className="flex h-[32px] items-center rounded-[8px] px-[12px] text-[13px] leading-[normal] font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
        Live in {days} {days === 1 ? "day" : "days"}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        wired && onToggle
          ? onToggle(true)
          : showToast(`${flag.name} is a picture here`)
      }
      className="motion-tap flex h-[32px] items-center rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
    >
      {label}
    </button>
  );
}

/** The page's own switch. Same geometry as the SaaS editor's feature rows. */
export function Toggle({
  label,
  on,
  disabled = false,
  onChange,
}: {
  label: string;
  on: boolean;
  /**
   * Dead, and visibly so. Used by Enable while its row is hidden — see the
   * sheet: `disabled` rather than hidden, because the column has to keep
   * saying what it is for on every row, and a gap where a switch should be
   * reads as a row that is missing something rather than as one that is not
   * eligible yet.
   */
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        "motion-tap relative h-[22px] w-[40px] shrink-0 rounded-full",
        on ? "bg-brand" : "bg-pg-disabled",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[3px] size-[16px] rounded-full bg-white transition-[left] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
          on ? "left-[21px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
