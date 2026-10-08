"use client";

import * as React from "react";
import { Info, X, Plus, Pencil, Trash2, Mail } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { useTheme } from "@/components/theme/theme-provider";
import { useLabs, SEEDED_LEGACY } from "./labs-state";
import { useCustomCode } from "./custom-code-store";
import { CodeEditorField } from "./code-editor-field";
import { BrandCard } from "./brand-card";
import { cn } from "@/lib/utils";

/**
 * Agency › Settings › Company › White Label, as production draws it.
 *
 * Transcribed from the real page rather than improved, because the argument
 * this screen is here to make depends on it being recognisable: an agency
 * looking at it has to see their own settings page, not our idea of one.
 * That includes the parts the proposal disagrees with — five separate Save
 * buttons, each owning a different slice of one form, which is exactly the
 * confusion the BrandCard above it was written to avoid. Both are on this
 * page on purpose (Ashwin, Oct 8): the proposal first, production under it,
 * so the comparison is a scroll rather than a toggle.
 *
 * THE OLD-NAV SECTIONS. Custom CSS, Custom JS and the light/dark picker only
 * mean anything while an account is on the old navigation — they are written
 * against its markup and its themes. So they are grouped and gated rather
 * than shown unconditionally, which is the thing production cannot do yet
 * because production has only one navigation.
 */

/** A section, with production's own header-left / card-right arrangement. */
function Section({
  title,
  sub,
  children,
  onSave,
  dirty = false,
  onCancel,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  onSave?: () => void;
  dirty?: boolean;
  onCancel?: () => void;
}) {
  return (
    <section className="flex flex-col gap-[12px] border-t border-pg-border pt-[20px] md:flex-row md:gap-[24px]">
      <header className="shrink-0 md:w-[200px] md:pt-[2px]">
        <h3 className="text-[14px] leading-[20px] font-medium text-pg-heading">
          {title}
        </h3>
        <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
          {sub}
        </p>
      </header>

      <div className="min-w-0 flex-1 rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <div className="p-[16px]">{children}</div>
        {onSave ? (
          <footer className="flex justify-end gap-[12px] border-t border-pg-border px-[16px] py-[12px]">
            <button
              type="button"
              onClick={onCancel}
              className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!dirty}
              className={cn(
                "motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-white active:scale-[0.98]",
                dirty
                  ? "bg-brand hover:brightness-95"
                  : "cursor-not-allowed bg-brand opacity-50",
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

function Field({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-[4px]">
      <span className="text-[13px] leading-[18px] text-pg-text">{label}</span>
      <span className="flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
        {icon ? <span className="shrink-0 text-pg-faint">{icon}</span> : null}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-pg-text outline-none"
        />
      </span>
    </label>
  );
}

export function WhiteLabelTab({ agency }: { agency: Account }) {
  const { customCodeMode } = useTheme();
  const labs = useLabs();
  const code = useCustomCode();

  const [bannerOn, setBannerOn] = React.useState(true);

  // Brand identity — one card, production's three fields.
  const [brandName, setBrandName] = React.useState(agency.name);
  const [brandEmail, setBrandEmail] = React.useState(
    "korada.chowhan@gohighlevel.com",
  );
  const [brandPhone, setBrandPhone] = React.useState("+1 775 980 2006");
  const [brandSaved, setBrandSaved] = React.useState({
    brandName: agency.name,
    brandEmail: "korada.chowhan@gohighlevel.com",
    brandPhone: "+1 775 980 2006",
  });
  const brandDirty =
    brandName !== brandSaved.brandName ||
    brandEmail !== brandSaved.brandEmail ||
    brandPhone !== brandSaved.brandPhone;

  const [privacy, setPrivacy] = React.useState(
    "http://www.freeprivacypolicy.com/live/cb4fec29-c7b0-4bd1-90d7-4e3aa62b657c",
  );
  const [terms, setTerms] = React.useState(
    "http://www.freeprivacypolicy.com/live/cb4fec29-c7b0-4bd1-90d7-4e3aa62b657c",
  );
  const [policySaved, setPolicySaved] = React.useState({ privacy, terms });
  const policyDirty =
    privacy !== policySaved.privacy || terms !== policySaved.terms;

  /*
   * Whether the old-nav sections have anyone left to serve.
   *
   * Labs first, the panel's override second — `navGeneration` alone stopped
   * being the answer once it became a one-way override that can only FORCE
   * the old nav. The agency's own sidebar asks `agencyOn`; a sub-account asks
   * `accountOn(id)`, and asking the wrong one is the single way to misuse
   * that API: `accountOn("agency")` returns the default `true` and looks
   * like it worked.
   */
  const anyoneOnOldNav =
    !labs.agencyOn || SEEDED_LEGACY.some((id) => !labs.accountOn(id));

  const legacyIds = SEEDED_LEGACY.filter((id) => !labs.accountOn(id));

  return (
    <div className="flex w-full flex-col gap-[20px] pb-[32px]">
      {bannerOn ? (
        <div className="flex gap-[12px] rounded-[8px] bg-brand-soft p-[16px]">
          <Info size={18} aria-hidden="true" className="mt-[1px] shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] leading-[20px] font-semibold text-brand">
              You can now create and manage multiple white label brands!
            </p>
            <p className="mt-[4px] text-[13px] leading-[18px] text-brand">
              Create up to two unique white label brands, which can be assigned
              to SaaS plans as well as sub-accounts.
            </p>
            <button
              type="button"
              className="motion-tap mt-[8px] text-[13px] font-medium text-brand hover:underline"
            >
              Learn more →
            </button>
          </div>
          <button
            type="button"
            onClick={() => setBannerOn(false)}
            aria-label="Dismiss"
            className="motion-tap size-[20px] shrink-0 text-brand hover:opacity-70"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {/*
        The proposal's own card, first.

        Ashwin asked for both on one page rather than behind a switch. The
        cost is that this page now has two logo fields that disagree about
        what a logo is for, which is a fair thing for a comparison page to
        show and a bad thing to leave unexplained — hence the heading.
      */}
      <div className="flex flex-col gap-[8px]">
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          Proposed
        </h2>
        <BrandCard account={agency} />
      </div>

      <div className="flex items-center justify-between pt-[8px]">
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          White Label
        </h2>
        <button
          type="button"
          className="motion-tap flex h-[36px] items-center gap-[6px] rounded-[8px] bg-brand px-[12px] text-[14px] font-medium text-white opacity-60"
          // Static: the banner promises two brands and the second one is a
          // whole flow. Ashwin scoped this to the first brand only.
          disabled
        >
          <Plus size={16} aria-hidden="true" />
          Add new brand
        </button>
      </div>

      <Section
        title="Logo"
        sub="Update brand logo"
        dirty={brandDirty}
        onCancel={() => {
          setBrandName(brandSaved.brandName);
          setBrandEmail(brandSaved.brandEmail);
          setBrandPhone(brandSaved.brandPhone);
        }}
        onSave={() => setBrandSaved({ brandName, brandEmail, brandPhone })}
      >
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-wrap items-center gap-[16px]">
            <div className="flex size-[120px] shrink-0 items-center justify-center rounded-[8px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <span className="font-mono text-[28px] font-semibold text-pg-text">
                1:1
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
                Drag a file to this area to upload
              </p>
              <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
                The proposed size is 350px * 180px. No bigger than 2.5 MB
              </p>
              <div className="mt-[10px] flex gap-[8px]">
                <button
                  type="button"
                  className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg"
                >
                  Replace
                </button>
                <button
                  type="button"
                  aria-label="Remove logo"
                  className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] bg-pg-danger text-white hover:brightness-95"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-[16px]">
            <Field label="Brand name" value={brandName} onChange={setBrandName} />
            <Field
              label="Brand email"
              value={brandEmail}
              onChange={setBrandEmail}
              icon={<Mail size={15} aria-hidden="true" />}
            />
            <Field
              label="Brand phone number"
              value={brandPhone}
              onChange={setBrandPhone}
            />
          </div>
        </div>
      </Section>

      <Section title="Domains" sub="Update your domains and URLs">
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[4px]">
            <span className="text-[13px] leading-[18px] text-pg-text">
              White Label Domain
            </span>
            <div className="flex gap-[8px]">
              <input
                placeholder="Please enter your white label domain and click on Add Domain"
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
              API Domain
            </span>
            <div className="flex gap-[8px]">
              <div className="flex h-[36px] min-w-0 flex-1 items-center rounded-[8px] bg-pg-bg px-[11px] text-[14px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
                racingbulls.vinitaitesting.store
              </div>
              <button
                type="button"
                aria-label="Edit API domain"
                className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg"
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Remove API domain"
                className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] bg-pg-danger text-white hover:brightness-95"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Policies"
        sub="Update your privacy policies and T&C URLs"
        dirty={policyDirty}
        onCancel={() => {
          setPrivacy(policySaved.privacy);
          setTerms(policySaved.terms);
        }}
        onSave={() => setPolicySaved({ privacy, terms })}
      >
        <div className="flex flex-col gap-[16px]">
          <Field
            label="Privacy Policy URL"
            value={privacy}
            onChange={setPrivacy}
          />
          <Field
            label="Terms & Conditions URL"
            value={terms}
            onChange={setTerms}
          />
        </div>
      </Section>

      <OldNavGroup
        anyoneOnOldNav={anyoneOnOldNav}
        legacyIds={legacyIds}
        code={code}
        mode={customCodeMode}
      />
    </div>
  );
}

/**
 * Custom JS, Custom CSS and the theme picker — the three old-nav sections.
 *
 * Grouped under one heading that says who they apply to, because that is the
 * fact the page could not previously state: production shows these to every
 * agency unconditionally, and an agency whose accounts have all moved to the
 * new navigation is editing code that reaches nobody.
 */
function OldNavGroup({
  anyoneOnOldNav,
  legacyIds,
  code,
  mode,
}: {
  anyoneOnOldNav: boolean;
  legacyIds: readonly string[];
  code: ReturnType<typeof useCustomCode>;
  mode: "inherit" | "separate";
}) {
  const [savedCss, setSavedCss] = React.useState(code.css);
  const [savedJs, setSavedJs] = React.useState(code.js);

  return (
    <div className="mt-[8px] flex flex-col gap-[20px]">
      <div className="border-t border-pg-border pt-[20px]">
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          Old navigation only
        </h2>
        <p className="mt-[2px] max-w-[640px] text-[13px] leading-[18px] text-pg-muted">
          {anyoneOnOldNav
            ? `Custom code and the theme picker are written against the old sidebar's markup, so they only reach accounts still on it${
                legacyIds.length
                  ? ` — ${legacyIds.length} right now.`
                  : "."
              }`
            : "Every account is on the new navigation, so nothing below reaches anyone. It is kept visible rather than hidden: code that still exists and no longer applies is worth seeing."}
        </p>
      </div>

      <Section
        title="Custom JS"
        sub="Customize the platform with JS"
        dirty={code.js !== savedJs}
        onCancel={() => code.setJs(savedJs)}
        onSave={() => setSavedJs(code.js)}
      >
        <CodeEditorField
          label="Custom JS"
          value={code.js}
          onChange={code.setJs}
        />
      </Section>

      <Section
        title="Custom CSS"
        sub="Customize the platform with CSS"
        dirty={code.css !== savedCss}
        onCancel={() => code.setCss(savedCss)}
        onSave={() => setSavedCss(code.css)}
      >
        <CodeEditorField
          label="Custom CSS"
          value={code.css}
          onChange={code.setCss}
        />
      </Section>

      <ThemeSection disabled={mode === "separate" && code.onNewNav} />

      <NewNavCodeSection code={code} mode={mode} />
    </div>
  );
}

/** The light/dark picker. Drives the prototype's own nav theme. */
function ThemeSection({ disabled }: { disabled: boolean }) {
  const { navTheme, setNavTheme } = useTheme();

  return (
    <Section
      title="Theme"
      sub="Choose a default theme"
      dirty={false}
      onCancel={() => {}}
      onSave={() => {}}
    >
      {disabled ? (
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Unavailable while the new navigation is taking its own CSS. A theme
          the agency is overriding by hand is not a theme the product can
          still promise.
        </p>
      ) : (
        <div className="flex flex-wrap gap-[16px]">
          {(["light", "dark"] as const).map((t) => (
            <label
              key={t}
              className="flex min-w-[220px] flex-1 cursor-pointer flex-col gap-[8px]"
            >
              <span className="flex items-center gap-[8px]">
                <input
                  type="radio"
                  name="wl-theme"
                  checked={navTheme === t}
                  onChange={() => setNavTheme(t)}
                  className="size-[16px] accent-[var(--brand)]"
                />
                <span className="text-[14px] font-medium text-pg-heading">
                  {t === "light" ? "Light Theme" : "Dark Theme"}
                </span>
              </span>
              <span
                className={cn(
                  "flex h-[130px] overflow-hidden rounded-[8px]",
                  navTheme === t
                    ? "shadow-[0_0_0_2px_var(--brand)]"
                    : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
                )}
              >
                <span
                  className={cn(
                    "w-[76px] shrink-0",
                    t === "light" ? "bg-[#f8fafc]" : "bg-[#101828]",
                  )}
                />
                <span className="min-w-0 flex-1 bg-pg-bg" />
              </span>
            </label>
          ))}
        </div>
      )}
    </Section>
  );
}

/**
 * The new section: whether custom code reaches the new navigation at all.
 *
 * Today it does not, and that is not an oversight — the code is written
 * against a sidebar that is being replaced. The two modes are two ways of
 * shipping the option, and they are not cosmetic variants of each other:
 * one hands the agency a toggle that breaks their platform, the other hands
 * them a second pair of editors.
 */
function NewNavCodeSection({
  code,
  mode,
}: {
  code: ReturnType<typeof useCustomCode>;
  mode: "inherit" | "separate";
}) {
  return (
    <Section
      title="New navigation"
      sub="Custom code on Switchyard"
    >
      <div className="flex flex-col gap-[16px]">
        <label className="flex cursor-pointer items-start gap-[10px]">
          <input
            type="checkbox"
            checked={code.onNewNav}
            onChange={(e) => code.setOnNewNav(e.target.checked)}
            className="mt-[2px] size-[16px] shrink-0 accent-[var(--brand)]"
          />
          <span className="min-w-0">
            <span className="block text-[14px] leading-[20px] font-medium text-pg-heading">
              Enable custom code on the new navigation
            </span>
            <span className="mt-[2px] block text-[13px] leading-[18px] text-pg-muted">
              {mode === "inherit"
                ? "Applies the CSS and JS above to accounts on the new navigation. That code was written against the old sidebar, so expect it to need rewriting."
                : "Gives the new navigation its own CSS and JS. The code above stays on the old sidebar and is not applied here."}
            </span>
          </span>
        </label>

        {mode === "separate" && code.onNewNav ? (
          <div className="flex flex-col gap-[16px] border-t border-pg-border pt-[16px]">
            <div className="flex flex-col gap-[6px]">
              <span className="text-[13px] font-medium text-pg-text">
                Custom CSS — new navigation
              </span>
              <CodeEditorField
                label="Custom CSS for the new navigation"
                value={code.newCss}
                onChange={code.setNewCss}
                placeholder="/* Written against the new sidebar. */"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <span className="text-[13px] font-medium text-pg-text">
                Custom JS — new navigation
              </span>
              <CodeEditorField
                label="Custom JS for the new navigation"
                value={code.newJs}
                onChange={code.setNewJs}
                placeholder="// Written against the new sidebar."
              />
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
