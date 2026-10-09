"use client";

import * as React from "react";
import { Info, X, Plus, Pencil, Trash2, Mail } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { useTheme } from "@/components/theme/theme-provider";
import { useLabs } from "./labs-state";
import { accounts as ALL_ACCOUNTS } from "@/components/accounts/accounts-data";
import { useCustomCode } from "./custom-code-store";
import { LogoUploadField } from "./logo-upload-field";
import { useBrand } from "@/components/accounts/brand-store";
import { CodeEditorField } from "./code-editor-field";
import { cn } from "@/lib/utils";
import { Section, Field } from "./white-label-parts";
import { WhiteLabelSplit } from "./white-label-split";
import { WhiteLabelClassic } from "./white-label-classic";
import { WhiteLabelIdealCode } from "./white-label-ideal";
import { WhiteLabelIdealTab } from "./white-label-ideal-tab";

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

export function WhiteLabelTab({ agency }: { agency: Account }) {
  const { customCodeMode, whiteLabelApproach } = useTheme();
  const labs = useLabs();
  const code = useCustomCode();
  const brand = useBrand();

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


  const onOldNav = ALL_ACCOUNTS.filter((a) => !labs.accountOn(a.id));

  /*
   * The whole-tab redesign replaces the page rather than a part of it, so it
   * returns before any of production's chrome is drawn. Every other approach
   * swaps only the custom-code half, which is what keeps them comparable.
   */
  if (whiteLabelApproach === "idealAll") {
    return <WhiteLabelIdealTab agency={agency} />;
  }

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
            <div className="flex size-[120px] shrink-0 items-center justify-center rounded-[8px] bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]">
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
                  className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
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

          {/*
            The square mark, in the section that already owns the agency's
            logo rather than in a card of its own.

            Production asks for one asset at 350x180 and uses it everywhere,
            which is why the rail and the collapsed nav show a wide wordmark
            squeezed into a 32px disc. This is the second asset that problem
            needs, and the place it belongs is here — beside the logo it is
            the fallback for, not two sections away.
          */}
          <div className="border-t border-pg-border pt-[16px]">
            <LogoUploadField
              label="Square mark"
              hint="Shown in the account rail and the collapsed navigation, where a wide logo will not fit."
              aspect="square"
              {...(agency.logoSrc ? { src: agency.logoSrc } : {})}
              fallback={agency.logo}
              onPick={(src) => brand.set(agency.id, "logoSrc", src)}
              onRemove={() => brand.clear(agency.id, "logoSrc")}
            />
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

      {/*
        Only the custom-code half swaps between approaches.
        Logo, domains and policies are production's, and none of the four
        disagrees about them — swapping the whole page would make the
        comparison harder to read, not easier.
      */}
      {whiteLabelApproach === "split" ? (
        <WhiteLabelSplit agency={agency} />
      ) : whiteLabelApproach === "classic" ? (
        <WhiteLabelClassic />
      ) : whiteLabelApproach === "ideal" ? (
        <WhiteLabelIdealCode />
      ) : (
        <>
          <CustomCodeSafe
            code={code}
            legacyCount={onOldNav.length}
            newNavCount={ALL_ACCOUNTS.length - onOldNav.length}
          />
          {/*
            The theme picker belongs to the old navigation, so it travels with
            the approach that still talks about one. The other three either
            scope it, report on it, or move the question to Labs.
          */}
          <ThemeSection
            disabled={customCodeMode === "separate" && code.onNewNav}
            legacyCount={onOldNav.length}
          />
        </>
      )}

    </div>
  );
}

/**
 * Custom code, as one section that explains itself.
 *
 * The first cut of this had the shape production has: a group headed "Old
 * navigation only" with a paragraph explaining who it reached, then Custom JS
 * and Custom CSS as separate sections, then a third section with a checkbox
 * for the new navigation. Four blocks and roughly ninety words to say one
 * thing, which is: there are two navigations, and your code runs on one of
 * them.
 *
 * So say that instead. Two rows, one per navigation, each with its own answer
 * and the number of sub-accounts it reaches. The old navigation's answer is
 * fixed, so it reads as a fact rather than a control; the new one is the only
 * decision on the screen, so it is the only switch. Nothing needs a paragraph
 * because the rows ARE the explanation — Ashwin, Oct 9: simple and intuitive
 * enough that nobody has to be told how it works.
 *
 * The counts are the part that does the real work. "Turning this on may break
 * it" is a warning anyone can ignore; "12 sub-accounts" is the size of the
 * thing they are about to do.
 */
function CustomCodeSafe({
  code,
  legacyCount,
  newNavCount,
}: {
  code: ReturnType<typeof useCustomCode>;
  legacyCount: number;
  newNavCount: number;
}) {
  /*
   * The editors hold a DRAFT; the store holds what is live.
   *
   * It matters because the code really runs — typing into the CSS field
   * cannot be allowed to restyle the sidebar behind the page you are typing
   * on. Save is the commit, which is also the honest moment for the damage
   * to appear: an agency turns the new navigation on, presses Save, and
   * finds out. Before this the store was edited on every keystroke and the
   * switch took effect before anyone had agreed to it.
   */
  const { codeScopeView } = useTheme();

  const [draftCss, setDraftCss] = React.useState(code.css);
  const [draftJs, setDraftJs] = React.useState(code.js);
  const [draftOnNewNav, setDraftOnNewNav] = React.useState(code.onNewNav);

  const dirty =
    draftCss !== code.css ||
    draftJs !== code.js ||
    draftOnNewNav !== code.onNewNav;

  return (
    <Section
      title="Custom code"
      sub="Your CSS and JS, and where they run"
      dirty={dirty}
      onCancel={() => {
        setDraftCss(code.css);
        setDraftJs(code.js);
        setDraftOnNewNav(code.onNewNav);
      }}
      onSave={() => {
        code.setCss(draftCss);
        code.setJs(draftJs);
        code.setOnNewNav(draftOnNewNav);
      }}
    >
      <div className="flex flex-col gap-[16px]">
        <div>
          {/*
            Two drawings of the same fact, under `codeScopeView`.

            `rows` gives each navigation a line of its own, the old one
            reading "Always on". It reads well until you notice the two rows
            are not the same kind of thing: one is a fact that cannot be
            changed, the other is the only decision on the page. Drawn alike,
            they have to be told apart by reading them.

            `header` separates them. The fact goes up into a header — the code
            runs on the old navigation, in this many sub-accounts — and what
            is left below is one row that is purely the choice. The Theme card
            states its scope the same way, so the two cards now explain their
            reach in the same voice. Ashwin, Oct 9.
          */}
          {codeScopeView === "header" ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-[12px] gap-y-[2px] border-b border-pg-border pb-[12px]">
              <p className="text-[13px] leading-[18px] font-medium text-pg-heading">
                Running on the old navigation
              </p>
              <p className="text-[12px] leading-[17px] text-pg-muted">
                {legacyCount} sub-account{legacyCount === 1 ? "" : "s"}
              </p>
            </div>
          ) : (
            <p className="text-[13px] leading-[18px] font-medium text-pg-heading">
              Where your code runs
            </p>
          )}

          <div
            className={cn(
              "flex flex-col gap-[6px]",
              codeScopeView === "header" ? "mt-[12px]" : "mt-[8px]",
            )}
          >
            {codeScopeView === "rows" ? (
              <div className="flex items-center justify-between gap-[12px] rounded-[8px] px-[11px] py-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <span className="text-[14px] leading-[20px] text-pg-text">
                  Old navigation
                </span>
                <span className="flex items-center gap-[10px]">
                  <span className="text-[12px] text-pg-muted">
                    {legacyCount} sub-account{legacyCount === 1 ? "" : "s"}
                  </span>
                  <span className="text-[13px] font-medium text-pg-heading">
                    Always on
                  </span>
                </span>
              </div>
            ) : null}

            <label className="flex cursor-pointer items-start justify-between gap-[12px] rounded-[8px] px-[11px] py-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <span className="min-w-0">
                <span className="block text-[14px] leading-[20px] text-pg-text">
                  {codeScopeView === "header"
                    ? "Also run it on the new navigation"
                    : "New navigation"}
                </span>
                <span className="mt-[2px] block text-[12px] leading-[17px] text-pg-muted">
                  Written for the old navigation, so turning this on may break
                  it.
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-[10px]">
                <span className="text-[12px] text-pg-muted">
                  {newNavCount} sub-account{newNavCount === 1 ? "" : "s"}
                </span>
                <input
                  type="checkbox"
                  checked={draftOnNewNav}
                  onChange={(e) => setDraftOnNewNav(e.target.checked)}
                  className="size-[16px] accent-[var(--brand)]"
                />
              </span>
            </label>
          </div>

          {/*
            Said only once the switch is actually on, and said as what will
            happen rather than as a caution. It names both sidebars because
            the code reaches both — the agency's own and every sub-account's.
          */}
          {draftOnNewNav ? (
            <p className="mt-[8px] rounded-[8px] bg-brand-soft px-[11px] py-[9px] text-[12px] leading-[17px] text-pg-text">
              On save, this code runs on the new navigation in your own sidebar
              and in all {newNavCount} sub-accounts using it.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-[6px]">
          <span className="text-[13px] font-medium text-pg-text">Custom CSS</span>
          <CodeEditorField label="Custom CSS" value={draftCss} onChange={setDraftCss} />
        </div>

        <div className="flex flex-col gap-[6px]">
          <span className="text-[13px] font-medium text-pg-text">Custom JS</span>
          <CodeEditorField label="Custom JS" value={draftJs} onChange={setDraftJs} />
        </div>
      </div>
    </Section>
  );
}

/**
 * The theme picker, and the fact it only reaches half the fleet.
 *
 * Production offers Light and Dark with no qualification, which was true
 * when there was one navigation. It is not true now: the new navigation
 * ships light and has no dark theme at all, so this control reaches only
 * the accounts still on the old one. Saying nothing would leave an agency
 * choosing Dark and then finding most of their sub-accounts ignored it.
 *
 * Stated the same way the custom-code rows above state their reach — with
 * the number of accounts rather than a caution. "Old navigation only" is
 * the rule; "2 sub-accounts" is how much of their estate it covers, which
 * is the part that tells them whether to care. Ashwin, Oct 9.
 */
function ThemeSection({
  disabled,
  legacyCount,
}: {
  disabled: boolean;
  legacyCount: number;
}) {
  const { navTheme, setNavTheme } = useTheme();

  return (
    <Section
      title="Theme"
      sub="The sidebar’s colour"
      dirty={false}
      onCancel={() => {}}
      onSave={() => {}}
    >
      {/*
        A header on the card rather than a row per navigation.

        The two-row version answered a question nobody had asked: it gave the
        new navigation a line of its own, which made it look like something
        that could be chosen here. It cannot — there is no dark new nav to
        pick. So state the scope once, at the top, and let everything below it
        be the one control that exists.

        And state it about the old navigation only. Adding "the new navigation
        is always light" answered for a navigation this card does not govern,
        which is the same mistake the second row made in a shorter form —
        Ashwin, Oct 9. The scope line names what this reaches and stops.
      */}
      <div className="mb-[16px] flex flex-wrap items-baseline justify-between gap-x-[12px] gap-y-[2px] border-b border-pg-border pb-[12px]">
        <p className="text-[13px] leading-[18px] font-medium text-pg-heading">
          Applies to the old navigation only
        </p>
        <p className="text-[12px] leading-[17px] text-pg-muted">
          {legacyCount} sub-account{legacyCount === 1 ? "" : "s"}
        </p>
      </div>
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
                <span className="min-w-0 flex-1 bg-pg" />
              </span>
            </label>
          ))}
        </div>
      )}
    </Section>
  );
}
