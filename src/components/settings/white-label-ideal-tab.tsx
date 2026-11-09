"use client";

import * as React from "react";
import { Info, Mail, Plus, Pencil, Trash2, X } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { accounts as ALL_ACCOUNTS } from "@/components/accounts/accounts-data";
import { useTheme } from "@/components/theme/theme-provider";
import { useBrand } from "@/components/accounts/brand-store";
import { useLabs } from "./labs-state";
import { useCustomCode } from "./custom-code-store";
import { BrandAssetRow } from "./logo-upload-field";
import { Field } from "./white-label-parts";
import { CodeBlock, ThemeChoice } from "./white-label-ideal";
import { cn } from "@/lib/utils";

/**
 * White label, redesigned whole.
 *
 * The code half is the same idea as the code-only option — one group per
 * navigation, each with its own CSS and JS — and everything around it is
 * rebuilt, because the page the groups sit in has its own problems that
 * predate Switchyard entirely.
 *
 * WHAT CHANGED, AND WHY.
 *
 * One Save for the FORM, and one per editor. Production gives every section
 * its own Cancel and Save over one form, so an agency who edits the logo, a
 * domain and the CSS has to find and press three buttons, and nothing says
 * which of their edits are committed. The form half of this page answers that
 * with one bar: it appears when anything is unsaved, counts what is pending,
 * and commits the lot. "2 unsaved changes" is a fact a person can check
 * against what they remember doing.
 *
 * Appearance is the exception, and it is deliberate — Ashwin, Oct 27. A
 * stylesheet, a script and a theme are three separate pieces of work that
 * happen to share a page: you write the CSS, look at it, then start on the
 * JS. Folding them into the page's Save means committing two of them to
 * check one, and it puts the control for a 200-line editor at the bottom of
 * a scroll, where it is out of sight at the moment it is wanted. So each
 * editor and the theme carry their own Save, shown only while that one piece
 * is dirty, and the page's bar counts the form alone.
 *
 * Headings above their content, not beside it. Production spends a 224px
 * column on a two-word label and then runs a code editor in what is left.
 * Stacking gives the editors and the domain rows the full width, and a
 * heading directly above its fields is read as belonging to them without the
 * reader having to track across a gap.
 *
 * Four groups, in the order the questions get asked: who you are, where you
 * live, what you promise, how it looks. Appearance comes last because it is
 * the only part that differs per navigation, and putting the one complicated
 * thing at the end means the first three are a form rather than a decision.
 *
 * Nothing warns. There is no toggle, no "may break it", no greyed control —
 * the whole category of warning on this page exists because one set of fields
 * served two navigations, and that is the thing this undoes.
 */

export function WhiteLabelIdealTab({ agency }: { agency: Account }) {
  const labs = useLabs();
  const code = useCustomCode();
  const brand = useBrand();
  const { navTheme, setNavTheme } = useTheme();
  /*
   * Production's look, or the flat form. See WHITE_LABEL_LAYOUTS.
   * Same fields and copy either way; only the frame changes. Ashwin, Nov 9.
   */
  const cards = useTheme().effective.whiteLabelLayout === "cards";
  const [noticeOn, setNoticeOn] = React.useState(true);

  const onOldNav = ALL_ACCOUNTS.filter((a) => !labs.accountOn(a.id));
  const oldCount = onOldNav.length;
  const newCount = ALL_ACCOUNTS.length - oldCount;

  /*
   * One draft for the page.
   *
   * Held flat rather than per-section because the Save is per-page: a
   * section-shaped state would have to be reassembled on every save and
   * every cancel, and the count below reads more honestly off one object.
   */
  const initial = React.useMemo(
    () => ({
      brandName: agency.name,
      brandEmail: "korada.chowhan@gohighlevel.com",
      brandPhone: "+1 775 980 2006",
      privacy:
        "http://www.freeprivacypolicy.com/live/cb4fec29-c7b0-4bd1-90d7-4e3aa62b657c",
      terms:
        "http://www.freeprivacypolicy.com/live/cb4fec29-c7b0-4bd1-90d7-4e3aa62b657c",
    }),
    [agency.name],
  );

  const [form, setForm] = React.useState(initial);
  const [saved, setSaved] = React.useState(initial);
  const set = (k: keyof typeof initial, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const [oldCss, setOldCss] = React.useState(code.css);
  const [oldJs, setOldJs] = React.useState(code.js);
  const [theme, setTheme] = React.useState(navTheme);
  const [newCss, setNewCss] = React.useState(code.newCss);
  const [newJs, setNewJs] = React.useState(code.newJs);

  // The theme is also driven from the prototype's controls; adjust during
  // render so a change there is not overwritten by a stale draft on save.
  const [seenTheme, setSeenTheme] = React.useState(navTheme);
  if (seenTheme !== navTheme) {
    setSeenTheme(navTheme);
    setTheme(navTheme);
  }

  /*
   * What is pending, itemised.
   *
   * Counted as fields rather than as sections, because that is what the
   * person did. "2 unsaved changes" after editing a brand name and a URL is
   * checkable; "2 sections" is not.
   */
  const pending = [
    form.brandName !== saved.brandName,
    form.brandEmail !== saved.brandEmail,
    form.brandPhone !== saved.brandPhone,
    form.privacy !== saved.privacy,
    form.terms !== saved.terms,
  ].filter(Boolean).length;

  /*
   * The form's own Cancel and Save. Appearance is not in either: each editor
   * commits itself, so counting a dirty stylesheet here would offer two ways
   * to save one thing and disagree about whether it was saved.
   */
  const revert = () => setForm(saved);
  const commit = () => setSaved(form);

  /* Per-card Cancel and Save, for the cards layout: each owns its keys. */
  const sectionSave = (keys: (keyof typeof initial)[]) => ({
    dirty: keys.some((k) => form[k] !== saved[k]),
    onCancel: () =>
      setForm((f) => ({ ...f, ...Object.fromEntries(keys.map((k) => [k, saved[k]])) })),
    onSave: () =>
      setSaved((sv) => ({ ...sv, ...Object.fromEntries(keys.map((k) => [k, form[k]])) })),
  });
  const brandSave = sectionSave(["brandName", "brandEmail", "brandPhone"]);
  const policySave = sectionSave(["privacy", "terms"]);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        /*
          The 96px exists to let the sticky SaveBar float over the last
          section instead of resting on it — so it is only owed while that
          bar is on screen, and the bar renders only when something is
          pending. Unconditional, it left a blank sixth of a screen under
          the tab at rest, which is what Ashwin photographed: nothing below
          the Theme cards but scroll. Ashwin, Oct 28.
          
          The per-section Saves do not need it. They sit in the flow under
          their own editor and cover nothing.
        */
        !cards && pending > 0 ? "pb-[96px]" : "pb-[16px]",
        cards && "gap-[20px]",
      )}
    >
      {cards && noticeOn ? (
        <div className="flex gap-[12px] rounded-[8px] bg-brand-soft p-[16px] shadow-[inset_0_0_0_1px_var(--hr-primary-200)]">
          <Info size={18} aria-hidden="true" className="mt-[1px] shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] leading-[20px] font-semibold text-brand">
              You can now create and manage multiple white label brands
            </p>
            <p className="mt-[4px] text-[13px] leading-[18px] text-brand">
              Create up to 2 white label brands, and assign them to SaaS plans
              and sub-accounts.
            </p>
            <button
              type="button"
              className="motion-tap mt-[8px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
            >
              Learn more →
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNoticeOn(false)}
            aria-label="Dismiss"
            className="motion-tap grid size-[24px] shrink-0 place-items-center rounded-[6px] text-brand hover:bg-[var(--hr-primary-100)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <header
        className={cn(
          "flex items-center justify-between gap-[16px]",
          cards ? "-mb-[8px] pt-[4px]" : "pt-[8px] pb-[20px]",
        )}
      >
        <div className="min-w-0">
          <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            White label
          </h2>
        </div>
        <button
          type="button"
          disabled
          className="motion-tap flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] px-[12px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] opacity-60"
        >
          <Plus size={16} aria-hidden="true" />
          Add brand
        </button>
      </header>

      <Group
        title="Brand"
        sub="What your clients think they are using."
        cards={cards}
        save={brandSave}
      >
        {/*
          The same two rows Business profile draws, from the same component.
          Ashwin, Nov 6.
          
          The wide logo here was a dead placeholder — a box with "1:1" in it
          and a Replace that did nothing — sitting next to a square mark that
          was fully wired. Two assets, one real. Both are real now and both
          write to the brand store, so what the agency uploads here is what
          the nav draws.
        */}
        {/*
          Side by side on the agency's full-width page. Ashwin, Nov 6.
        
          Stacked, each row spans the whole tab — so the preview sits at the
          far left and its own Upload and Remove end up most of a screen away
          at the far right, with nothing in between. The buttons stop reading
          as belonging to the asset beside them.
        
          Two columns put each asset's controls back within reach of its
          preview, and the pair reads as one decision taken twice rather than
          two stacked settings. One column under `lg`, where half a tab is no
          longer wide enough to hold the row without wrapping.
        
          The sub-account's Business profile stays stacked: that card shares
          its page with a second column already, so it is never full width.
        */}
        <div
          className={cn(
            "grid grid-cols-1 gap-y-[20px]",
            /*
              In a card the pair stacks: the card is the page minus the title
              column, too narrow for two rows side by side without wrapping.
            */
            cards && "[&>*+*]:border-t [&>*+*]:border-pg-border [&>*+*]:pt-[20px]",
            /* And one under the square mark, before the brand fields. Ashwin, Nov 9. */
            cards && "border-b border-pg-border pb-[20px]",
            !cards && "lg:grid-cols-2",
            /*
              A rule between the columns, drawn by the SECOND one.
        
              The gap goes to zero and each column pads itself instead, so the
              line lands exactly halfway between them. Left as a 24px gap with a
              border laid on top of it, the rule would sit hard against the right
              column and read as that column's edge rather than as the seam
              between two.
        
              Only at `lg`, where the two columns exist. Stacked below that, a
              vertical rule would be a line down the side of a single column.
            */
            !cards && "lg:gap-x-0 lg:[&>*:first-child]:pr-[28px]",
            !cards && "lg:[&>*+*]:border-l lg:[&>*+*]:border-pg-border lg:[&>*+*]:pl-[28px]",
            /* And a little air before whatever follows the pair. */
            cards ? "mb-[4px]" : "mb-[12px]",
          )}
        >
          <BrandAssetRow
            label="Full logo"
            hint="Your primary logo, displayed in emails and the classic sidebar."
            spec="Ideal: 350 × 180 px · Max 2.5 MB"
            aspect="wide"
            {...(agency.wordmarkSrc ? { src: agency.wordmarkSrc } : {})}
            onPick={(src) => brand.set(agency.id, "wordmarkSrc", src)}
            onRemove={() => brand.clear(agency.id, "wordmarkSrc")}
          />

          <BrandAssetRow
            label="Sidebar icon"
            hint="A compact version of your logo, displayed in the new sidebar."
            spec="Square · Min 128 × 128 px · Max 2.5 MB"
            aspect="square"
            {...(agency.logoSrc ? { src: agency.logoSrc } : {})}
            fallback={agency.logo}
            onPick={(src) => brand.set(agency.id, "logoSrc", src)}
            onRemove={() => brand.clear(agency.id, "logoSrc")}
          />
        </div>

        <div className="flex flex-wrap gap-[16px]">
          <Field
            label="Brand name"
            value={form.brandName}
            onChange={(v) => set("brandName", v)}
          />
          <Field
            label="Brand email"
            value={form.brandEmail}
            onChange={(v) => set("brandEmail", v)}
            icon={<Mail size={15} aria-hidden="true" />}
          />
          <Field
            label="Brand phone number"
            value={form.brandPhone}
            onChange={(v) => set("brandPhone", v)}
          />
        </div>
      </Group>

      <Group title="Domains" sub="Where your platform lives." cards={cards}>
        <div className="flex flex-col gap-[4px]">
          <span className="text-[13px] leading-[18px] text-pg-text">
            White label domain
          </span>
          <div className="flex gap-[8px]">
            <input
              placeholder="yourdomain.com"
              className="h-[36px] min-w-0 flex-1 rounded-[8px] bg-pg-surface px-[11px] text-[14px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] outline-none placeholder:text-pg-faint"
            />
            <button
              type="button"
              disabled
              className="motion-tap flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] px-[12px] text-[14px] font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] opacity-60"
            >
              <Plus size={15} aria-hidden="true" />
              Add domain
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[4px]">
          <span className="text-[13px] leading-[18px] text-pg-text">
            API domain
          </span>
          <div className="flex gap-[8px]">
            <div className="flex h-[36px] min-w-0 flex-1 items-center rounded-[8px] bg-pg px-[11px] text-[14px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
              racingbulls.vinitaitesting.store
            </div>
            <button
              type="button"
              aria-label="Edit API domain"
              className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Remove API domain"
              className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Group>

      <Group
        title="Policies"
        sub="Linked from your sign-up and footer."
        cards={cards}
        save={policySave}
      >
        {/* Stacked in a card, as production has them; paired in the flat form. */}
        <div className={cn("flex gap-[16px]", cards ? "flex-col" : "flex-wrap")}>
          <Field
            label="Privacy policy URL"
            value={form.privacy}
            onChange={(v) => set("privacy", v)}
          />
          <Field
            label="Terms and conditions URL"
            value={form.terms}
            onChange={(v) => set("terms", v)}
          />
        </div>
      </Group>

      {/*
        Appearance, split by navigation.

        The same two groups the code-only option draws, without the section
        shell or its buttons. The sub-heading row carries the navigation's
        name and its reach, which is the only labelling this needs: a reader
        who knows which sub-accounts are on which navigation knows which
        editor they are typing into.
      */}
      <Group
        title="Appearance"
        sub="Your code runs on the navigation it was written for, and only that one."
        cards={cards}
      >
        {/*
          The NEW navigation leads. Ashwin, Oct 28.
          
          Legacy was first because it is the older of the two and the list
          read as a timeline. That is the wrong axis: 38 sub-accounts are on
          the new navigation and 2 are on the legacy one, so the block almost
          everyone is editing was below the block almost nobody is. Ordered
          by where the work is, not by when it shipped — and the counts on
          the right say which is which anyway.
        */}
        {newCount > 0 ? (
          <NavBlock name="New navigation (released Oct 2027)" count={newCount} flat={cards}>
            <CodeBlock
              label="Custom CSS"
              sub="Customize the platform with CSS"
              value={newCss}
              onChange={setNewCss}
              action={
                <SectionSave
                  what="new CSS"
                  dirty={newCss !== code.newCss}
                  onSave={() => code.setNewCss(newCss)}
                  onCancel={() => setNewCss(code.newCss)}
                />
              }
            />
            <CodeBlock
              label="Custom JS"
              sub="Customize the platform with JS"
              value={newJs}
              onChange={setNewJs}
              action={
                <SectionSave
                  what="new JS"
                  dirty={newJs !== code.newJs}
                  onSave={() => code.setNewJs(newJs)}
                  onCancel={() => setNewJs(code.newJs)}
                />
              }
            />
          </NavBlock>
        ) : null}
        {oldCount > 0 ? (
          <NavBlock name="Legacy navigation (before Oct 2027)" count={oldCount} flat={cards}>
            <CodeBlock
              label="Custom CSS"
              sub="Customize the platform with CSS"
              value={oldCss}
              onChange={setOldCss}
              action={
                <SectionSave
                  what="legacy CSS"
                  dirty={oldCss !== code.css}
                  onSave={() => code.setCss(oldCss)}
                  onCancel={() => setOldCss(code.css)}
                />
              }
            />
            <CodeBlock
              label="Custom JS"
              sub="Customize the platform with JS"
              value={oldJs}
              onChange={setOldJs}
              action={
                <SectionSave
                  what="legacy JS"
                  dirty={oldJs !== code.js}
                  onSave={() => code.setJs(oldJs)}
                  onCancel={() => setOldJs(code.js)}
                />
              }
            />
            {/* The same two columns the editors above take, so the block
                reads as one list of settings rather than two shapes. */}
            <div className="flex flex-col gap-[12px] sm:flex-row sm:gap-[24px]">
              <div className="flex shrink-0 flex-col gap-[2px] sm:w-[220px]">
                <span className="text-[13px] leading-[18px] font-medium text-pg-text">
                  Theme
                </span>
                <span className="text-[13px] leading-[18px] text-pg-muted">
                  How the sidebar is painted
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
                <ThemeChoice value={theme} onChange={setTheme} />
                <div className="flex justify-end">
                  <SectionSave
                    what="legacy theme"
                    dirty={theme !== navTheme}
                    onSave={() => setNavTheme(theme)}
                    onCancel={() => setTheme(navTheme)}
                  />
                </div>
              </div>
            </div>
          </NavBlock>
        ) : null}

      </Group>

      {cards ? null : <SaveBar pending={pending} onCancel={revert} onSave={commit} />}
    </div>
  );
}

/**
 * A group: heading above its fields, hairline above the heading.
 *
 * No card. Production wraps every section in a bordered surface, which on a
 * page of five sections draws five boxes inside the canvas's own box and
 * leaves the fields floating in the middle of each. A rule and a heading
 * separate content just as well and cost nothing.
 */
function Group({
  title,
  sub,
  children,
  cards = false,
  save,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  /**
   * Production's frame: title on the left, fields in a card on the right,
   * and — when `save` is given — that card's own Cancel and Save.
   */
  cards?: boolean;
  save?: { dirty: boolean; onCancel: () => void; onSave: () => void };
}) {
  if (cards) {
    return (
      <section className="flex flex-col gap-[12px] border-t border-pg-border pt-[20px] first-of-type:border-t-0 first-of-type:pt-0 md:flex-row md:gap-[24px]">
        <header className="shrink-0 md:w-[224px] md:pt-[2px]">
          <h3 className="text-[14px] leading-[20px] font-medium text-pg-heading">
            {title}
          </h3>
          <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
            {sub}
          </p>
        </header>
        <div className="min-w-0 flex-1 rounded-[12px] bg-pg-surface shadow-[0_1px_2px_rgba(16,24,40,0.05),inset_0_0_0_1px_var(--pg-border)]">
          <div className="flex flex-col gap-[16px] p-[16px]">{children}</div>
          {save ? (
            <footer className="flex justify-end gap-[12px] border-t border-pg-border px-[16px] py-[12px]">
              <button
                type="button"
                onClick={save.onCancel}
                className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save.onSave}
                disabled={!save.dirty}
                className={cn(
                  "motion-tap h-[36px] rounded-[8px] bg-brand px-[14px] text-[14px] font-medium text-white",
                  save.dirty
                    ? "hover:brightness-95 active:scale-[0.98]"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                Save changes
              </button>
            </footer>
          ) : null}
        </div>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-[16px] border-t border-pg-border py-[24px] first-of-type:border-t-0 first-of-type:pt-[4px]">
      <header>
        <h3 className="text-[15px] leading-[21px] font-semibold text-pg-heading">
          {title}
        </h3>
        <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
          {sub}
        </p>
      </header>
      {children}
    </section>
  );
}

/** One navigation's code, inside Appearance. */
function NavBlock({
  name,
  count,
  children,
  flat = false,
}: {
  name: string;
  count: number;
  children: React.ReactNode;
  /** Inside a card already: a ruled subsection, not a card in a card. */
  flat?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[12px]",
        flat
          ? "border-t border-pg-border pt-[16px] first:border-t-0 first:pt-0"
          : "rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      <div className="flex items-baseline justify-between gap-[12px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
          {name}
        </span>
        <span className="text-[12px] leading-[17px] text-pg-muted">
          {count} sub-account{count === 1 ? "" : "s"}
        </span>
      </div>
      {children}
    </div>
  );
}

/**
 * One editor's own Cancel and Save, on its label row.
 *
 * Absent until that editor is dirty, for the reason the page's bar is: a
 * permanent pair of dead buttons above every code box is four controls that
 * are wrong three-quarters of the time, and a reader stops checking them.
 * Appearing is also the signal — the row changing is what says this editor
 * now holds something uncommitted, which is the fact a page of five editors
 * otherwise cannot state.
 *
 * `what` is for the screen reader alone. Four buttons all called "Save" is
 * a list with no information in it, and the visible label cannot carry the
 * difference without getting long enough to crowd the row.
 */
function SectionSave({
  what,
  dirty,
  onSave,
  onCancel,
}: {
  what: string;
  dirty: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  /*
   * Save is always on screen; Cancel arrives with the edit.
   *
   * The whole control used to vanish when clean, on the reasoning that a
   * dead button is furniture. That reasoning holds for the page's own
   * SaveBar — it is a bar that appears when there is something to commit —
   * and it fails here, because these Saves are the thing that TELLS you the
   * parts commit separately. Absent, the section reads as belonging to the
   * form at the foot, which is the opposite of what it does: each editor
   * writes on its own. Ashwin asked for them twice, which is the symptom.
   *
   * Cancel still comes and goes, because it is not making a claim about the
   * model — there is simply nothing to discard until you have typed.
   * Ashwin, Oct 28.
   */
  return (
    <span className="flex shrink-0 items-center gap-[8px]">
      {dirty ? (
        <button
          type="button"
          onClick={onCancel}
          aria-label={`Discard changes to ${what}`}
          className="motion-tap h-[28px] rounded-[7px] px-[10px] text-[13px] font-medium text-pg-muted hover:bg-pg hover:text-pg-text active:scale-[0.98]"
        >
          Cancel
        </button>
      ) : null}
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty}
        aria-label={`Save ${what}`}
        className={cn(
          "motion-tap h-[28px] rounded-[7px] px-[10px] text-[13px] font-medium",
          dirty
            ? "bg-brand text-white hover:brightness-95 active:scale-[0.98]"
            : /*
                 Greyed and inert rather than hidden — it says "this part
                 saves on its own" even with nothing to save, which is the
                 only job it has when clean.
               */
              "cursor-not-allowed bg-pg-row-border text-pg-faint",
        )}
      >
        {/* "Save changes", as every other commit on this page says it. */}
        Save changes
      </button>
    </span>
  );
}

/**
 * The form's Save.
 *
 * Sticky, and present only when there is something to commit — a bar that is
 * always there with a dead button in it is furniture, and furniture stops
 * being read. Arriving when the first edit is made is also the moment the
 * person most needs to know that something is now pending.
 */
function SaveBar({
  pending,
  onCancel,
  onSave,
}: {
  pending: number;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (pending === 0) return null;

  return (
    <div
      className={cn(
        "sticky bottom-[16px] z-10 mt-[8px] flex items-center justify-between gap-[16px]",
        "rounded-[12px] bg-pg-surface px-[16px] py-[12px]",
        "shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      <span className="text-[13px] leading-[18px] text-pg-text">
        {pending} unsaved change{pending === 1 ? "" : "s"}
      </span>
      <span className="flex shrink-0 gap-[12px]">
        <button
          type="button"
          onClick={onCancel}
          className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="motion-tap h-[36px] rounded-[8px] bg-brand px-[14px] text-[14px] font-medium text-white hover:brightness-95 active:scale-[0.98]"
        >
          Save changes
        </button>
      </span>
    </div>
  );
}
