"use client";

import * as React from "react";
import { Mail, Plus, Pencil, Trash2 } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { accounts as ALL_ACCOUNTS } from "@/components/accounts/accounts-data";
import { useTheme } from "@/components/theme/theme-provider";
import { useBrand } from "@/components/accounts/brand-store";
import { useLabs } from "./labs-state";
import { useCustomCode } from "./custom-code-store";
import { LogoUploadField } from "./logo-upload-field";
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
 * One Save, not five. Production gives each section its own Cancel and Save
 * over one form, so an agency who edits the logo, a domain and the CSS has to
 * find and press three buttons, and nothing on screen says which of their
 * edits are committed and which are not. Here the page has one bar; it
 * appears when anything is unsaved, counts what is pending, and commits the
 * lot. The count is the part that does the work — "2 unsaved changes" is a
 * fact a person can check against what they remember doing.
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
    oldCss !== code.css,
    oldJs !== code.js,
    theme !== navTheme,
    newCss !== code.newCss,
    newJs !== code.newJs,
  ].filter(Boolean).length;

  const revert = () => {
    setForm(saved);
    setOldCss(code.css);
    setOldJs(code.js);
    setTheme(navTheme);
    setNewCss(code.newCss);
    setNewJs(code.newJs);
  };

  const commit = () => {
    setSaved(form);
    code.setCss(oldCss);
    code.setJs(oldJs);
    setNavTheme(theme);
    code.setNewCss(newCss);
    code.setNewJs(newJs);
  };

  return (
    <div className="flex w-full flex-col pb-[96px]">
      <header className="flex items-start justify-between gap-[16px] pt-[8px] pb-[20px]">
        <div className="min-w-0">
          <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            White label
          </h2>
          <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
            Everything your clients see instead of HighLevel.
          </p>
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
      >
        <div className="flex flex-wrap items-center gap-[16px]">
          <div className="flex h-[96px] w-[180px] shrink-0 items-center justify-center rounded-[8px] bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <span className="font-mono text-[22px] font-semibold text-pg-text">
              1:1
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
              Wide logo
            </p>
            <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
              350 × 180px, up to 2.5 MB. Shown in the header and the expanded
              navigation.
            </p>
            <div className="mt-[10px] flex gap-[8px]">
              <button
                type="button"
                className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
              >
                Replace
              </button>
              <button
                type="button"
                aria-label="Remove logo"
                className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <LogoUploadField
          label="Square mark"
          hint="Shown in the account rail and the collapsed navigation, where a wide logo will not fit."
          aspect="square"
          {...(agency.logoSrc ? { src: agency.logoSrc } : {})}
          fallback={agency.logo}
          onPick={(src) => brand.set(agency.id, "logoSrc", src)}
          onRemove={() => brand.clear(agency.id, "logoSrc")}
        />

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

      <Group title="Domains" sub="Where your platform lives.">
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

      <Group title="Policies" sub="Linked from your sign-up and footer.">
        <div className="flex flex-wrap gap-[16px]">
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
      >
        {oldCount > 0 ? (
          <NavBlock name="Old navigation" count={oldCount}>
            <CodeBlock label="Custom CSS" value={oldCss} onChange={setOldCss} />
            <CodeBlock label="Custom JS" value={oldJs} onChange={setOldJs} />
            <div className="flex flex-col gap-[8px]">
              <span className="text-[13px] leading-[18px] font-medium text-pg-text">
                Theme
              </span>
              <ThemeChoice value={theme} onChange={setTheme} />
            </div>
          </NavBlock>
        ) : null}

        {newCount > 0 ? (
          <NavBlock name="New navigation" count={newCount}>
            <CodeBlock label="Custom CSS" value={newCss} onChange={setNewCss} />
            <CodeBlock label="Custom JS" value={newJs} onChange={setNewJs} />
          </NavBlock>
        ) : null}
      </Group>

      <SaveBar pending={pending} onCancel={revert} onSave={commit} />
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
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[16px] border-t border-pg-border py-[24px]">
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
}: {
  name: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
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
 * The page's one Save.
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
