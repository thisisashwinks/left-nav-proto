"use client";

import { brandInitials, logoName, trimLogo } from "@/lib/logo-trim";
import { AvatarEditor } from "@/components/branding/switchyard-onboarding";
import { useAgencyLogoColors } from "@/components/branding/branding-controls";
import { avatarTile } from "@/design/branding";
import { AccountLogo } from "@/components/accounts/account-logo";

/** The seeded rule (two words → both first letters), for names not read off a logo. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return brandInitials(words[0] ?? "?");
}
import * as React from "react";
import { ChevronDown, Code, Info, Mail, Plus, Pencil, Trash2, TriangleAlert, X } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { accounts as ALL_ACCOUNTS, agency as SEED_AGENCY } from "@/components/accounts/accounts-data";
import { useTheme } from "@/components/theme/theme-provider";
import { useBrand } from "@/components/accounts/brand-store";
import { useLabs } from "./labs-state";
import { useCustomCode } from "./custom-code-store";
import { BrandAssetRow } from "./logo-upload-field";
import { Field, HeaderSave } from "./white-label-parts";
import { CodeBlock, ThemeChoice } from "./white-label-ideal";
import { cn } from "@/lib/utils";
import { useBrandingOptional } from "@/components/branding/branding-provider";

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

export function WhiteLabelIdealTab({
  agency,
  themeSlot = null,
}: {
  agency: Account;
  /** Sidebar theme, drawn right under Brand (Nov 26, 2026). */
  themeSlot?: React.ReactNode;
}) {
  // Custom code stays folded until asked for (Nov 26, 2026).
  const [codeOpen, setCodeOpen] = React.useState(false);
  /*
   * Sections (Nov 26, 2026): all open, everything but Brand and Theme
   * folded, or every section a full accordion — with or without a side
   * menu that scrolls to each one (proto wlSections, wlNav).
   */
  const wlProto = useBrandingOptional()?.proto;
  const sectionsMode = wlProto?.wlSections ?? "open";
  const collapse = sectionsMode === "fold";
  const acc = sectionsMode === "accordion";
  const navMode = wlProto?.wlNav ?? "side";
  const navOn = navMode !== "none";
  // Tabs (Nov 26, 2026): the menu shows one section at a time.
  const tabs = navMode === "tabs";
  const [activeSec, setActiveSec] = React.useState("wl-brand");
  const off = (id: string) => tabs && activeSec !== id;
  // Save and Cancel in each accordion's header instead of its foot.
  const saveTop = acc && wlProto?.wlSavePlace === "top";
  const advancedOn = wlProto?.themeSet === "advanced";
  const labs = useLabs();
  const code = useCustomCode();
  const brand = useBrand();
  const { navTheme, setNavTheme } = useTheme();
  /*
   * Production's look, or the flat form. See WHITE_LABEL_LAYOUTS.
   * Same fields and copy either way; only the frame changes. Ashwin, Nov 9.
   */
  const cards = useTheme().effective.whiteLabelLayout === "cards";
  // Hidden by default (Nov 26, 2026): the multiple-brands notice is noise here.
  const [noticeOn, setNoticeOn] = React.useState(false);

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

  /*
   * The two logos are part of the Brand card's draft (Nov 23): picking one
   * previews here, and only Save changes puts it in the sidebar; Cancel
   * drops it. `undefined` = untouched, `null` = removed.
   *
   * A full logo is trimmed of empty margin on the way in, and the name it
   * carries fills Brand name — which, saved, renames the agency and its
   * initials avatar.
   */
  const [logoDraft, setLogoDraft] = React.useState<{ wordmark?: string | null; icon?: string | null }>({});
  const [iconError, setIconError] = React.useState<string | null>(null);
  /*
   * The avatar's initials (Nov 24): follow Brand name until edited here.
   */
  const [initialsDraft, setInitialsDraft] = React.useState<string | null>(null);
  const savedInitials = brand.names[agency.id]?.initials ?? initialsOf(saved.brandName);
  const shownInitials =
    initialsDraft ??
    (form.brandName !== saved.brandName ? brandInitials(form.brandName.trim().split(/\s+/)[0] || "?") : savedInitials);
  const shownWordmark = logoDraft.wordmark === undefined ? agency.wordmarkSrc : logoDraft.wordmark ?? undefined;
  const shownIcon = logoDraft.icon === undefined ? agency.logoSrc : logoDraft.icon ?? undefined;
  // Sidebar avatar colour (Nov 26, 2026): the brand store's tile, as onboarding sets it.
  const logoColors = useAgencyLogoColors();
  const avatarStyle = useBrandingOptional()?.proto.avatarStyle ?? "solid";
  const avatarTileNow = brand.avatars[agency.id];
  const avatarLogo = {
    ...agency.logo,
    initials: shownInitials,
    ...(avatarTileNow ? { from: avatarTileNow.from, to: avatarTileNow.to, brandTile: true } : {}),
  };
  const logosDirty =
    logoDraft.wordmark !== undefined || logoDraft.icon !== undefined || (initialsDraft !== null && initialsDraft !== savedInitials);

  const pickWordmark = async (src: string, fileName?: string) => {
    const [trimmed, name] = await Promise.all([trimLogo(src), logoName(src, fileName)]);
    setLogoDraft((d) => ({ ...d, wordmark: trimmed }));
    if (name) set("brandName", name);
  };
  const pickIcon = (src: string) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (Math.abs(w - h) > 2) return setIconError("Use a square image, like 512 × 512 px.");
      if (w < 128) return setIconError("Use an image at least 128 × 128 px.");
      setIconError(null);
      setLogoDraft((d) => ({ ...d, icon: src }));
    };
    img.src = src;
  };

  /** What Save does for the Brand card: logos to the store, name to the agency. */
  const commitBrand = () => {
    if (logoDraft.wordmark !== undefined) {
      if (logoDraft.wordmark) brand.set(agency.id, "wordmarkSrc", logoDraft.wordmark);
      else brand.clear(agency.id, "wordmarkSrc");
    }
    if (logoDraft.icon !== undefined) {
      if (logoDraft.icon) brand.set(agency.id, "logoSrc", logoDraft.icon);
      else brand.clear(agency.id, "logoSrc");
    }
    const name = form.brandName.trim() || saved.brandName;
    const initials = shownInitials || brandInitials(name.split(/\s+/)[0]!);
    if (name !== SEED_AGENCY.name || initials !== initialsOf(SEED_AGENCY.name)) {
      brand.setName(agency.id, { name, initials });
    } else {
      brand.setName(agency.id, null);
    }
    setInitialsDraft(null);
    setLogoDraft({});
    setIconError(null);
  };
  const cancelBrand = () => {
    setInitialsDraft(null);
    setLogoDraft({});
    setIconError(null);
  };

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
    logoDraft.wordmark !== undefined,
    logoDraft.icon !== undefined,
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
  const revert = () => {
    setForm(saved);
    cancelBrand();
  };
  const commit = () => {
    commitBrand();
    setSaved(form);
  };

  /* Per-card Cancel and Save, for the cards layout: each owns its keys. */
  const sectionSave = (keys: (keyof typeof initial)[]) => ({
    dirty: keys.some((k) => form[k] !== saved[k]),
    onCancel: () =>
      setForm((f) => ({ ...f, ...Object.fromEntries(keys.map((k) => [k, saved[k]])) })),
    onSave: () =>
      setSaved((sv) => ({ ...sv, ...Object.fromEntries(keys.map((k) => [k, form[k]])) })),
  });
  const brandKeys = sectionSave(["brandName", "brandEmail", "brandPhone"]);
  const brandSave = {
    dirty: brandKeys.dirty || logosDirty,
    onCancel: () => {
      brandKeys.onCancel();
      cancelBrand();
    },
    onSave: () => {
      commitBrand();
      brandKeys.onSave();
    },
  };
  const policySave = sectionSave(["privacy", "terms"]);

  // Theme and Advanced come from the branding section; frame them to match.
  const themedSlot = React.isValidElement(themeSlot)
    ? React.cloneElement(themeSlot as React.ReactElement<{ frame?: ThemeFrame }>, {
        frame: (part, node, save) =>
          off(`wl-${part}`) ? null : acc ? (
            <AccordionSection
              key={`${part}-acc`}
              id={`wl-${part}`}
              title={part === "theme" ? "Theme" : "Advanced"}
              sub={part === "theme" ? "Sidebar colors for every sub-account." : "Font, text size, colors, and corners."}
              defaultOpen={part === "theme" || tabs}
              {...(saveTop && save ? { save } : {})}
            >
              {node(true, saveTop)}
            </AccordionSection>
          ) : (
            <div key={part} id={`wl-${part}`} className="scroll-mt-[16px]">
              {node(false)}
            </div>
          ),
      })
    : themeSlot;
  // Static: the second brand is a whole flow (Ashwin scoped this to one).
  const addBrand = (
    <button
      type="button"
      disabled
      className="motion-tap flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] px-[12px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] opacity-60"
    >
      <Plus size={16} aria-hidden="true" />
      Add brand
    </button>
  );
  const navItems = [
    { id: "wl-brand", label: "Brand" },
    ...(themeSlot ? [{ id: "wl-theme", label: "Theme" }] : []),
    ...(themeSlot && advancedOn ? [{ id: "wl-advanced", label: "Advanced" }] : []),
    { id: "wl-domains", label: "Domains" },
    { id: "wl-policies", label: "Policies" },
    { id: "wl-code", label: "Custom code" },
  ];

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

      {/* Accordions: "Add brand" sits in the Brand header instead (Nov 26, 2026). */}
      {acc ? null : (
      <header
        className={cn(
          "flex items-center justify-between gap-[16px]",
          cards ? "-mb-[8px] pt-[4px]" : "pt-[8px] pb-[20px]",
        )}
      >
        {/* No "White label" title: the tab above already says it (Nov 26, 2026). */}
        <span aria-hidden="true" />
        {addBrand}
      </header>
      )}

      <div className={cn(navOn && "flex items-start gap-[24px]")}>
      {navOn ? <SectionNav items={navItems} tabs={tabs} active={activeSec} onSelect={setActiveSec} /> : null}
      <div className={cn("flex min-w-0 flex-1 flex-col", (cards || acc) && (acc ? "gap-[12px]" : "gap-[20px]"))}>
      <Group
        id="wl-brand"
        key={`brand-${sectionsMode}`}
        off={off("wl-brand")}
        saveTop={saveTop}
        accordion={acc}
        defaultOpen
        action={addBrand}
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
            // Each asset is its own card now (Nov 26, 2026): stacked, no rules.
            wlProto?.assetFrame === "cards"
              ? "flex flex-col gap-[16px]"
              : // Dividers: between the assets, and one under them before the brand fields.
                "flex flex-col divide-y divide-pg-border border-b border-pg-border pb-[20px]",
          )}
        >
          <BrandAssetRow
            label="Full logo"
            hint="Your primary logo, displayed in emails and the classic sidebar."
            spec="Ideal: 540 × 84 px, 3:1 to 6:1 · Max 2.5 MB"
            aspect="wide"
            darkFor={{ accountId: agency.id, kind: "wordmark" }}
              guide
            {...(shownWordmark ? { src: shownWordmark } : {})}
            onPick={(src, fileName) => void pickWordmark(src, fileName)}
            onRemove={() => setLogoDraft((d) => ({ ...d, wordmark: null }))}
          />

          <BrandAssetRow
            label="Sidebar icon"
            hint="A compact version of your logo, shown in the new sidebar and as your browser tab’s favicon."
            spec="Square · Min 128 × 128 px · Max 2.5 MB"
            aspect="square"
            darkFor={{ accountId: agency.id, kind: "logo" }}
            {...(shownIcon ? { src: shownIcon } : {})}
            fallback={{ ...agency.logo, initials: shownInitials }}
            {...(iconError ? { error: iconError } : {})}
            onPick={(src) => pickIcon(src)}
            onRemove={() => {
              setIconError(null);
              setLogoDraft((d) => ({ ...d, icon: null }));
            }}
            footer={
              /*
                Sidebar avatar, inside the icon's card (Nov 26, 2026): title,
                then the avatar, then initials and colour. Stays visible once
                an icon is uploaded, dimmed and inert, so it is clear what
                comes back if the icon is removed.
              */
              <div
                aria-disabled={shownIcon ? true : undefined}
                className={cn(
                  "flex flex-col gap-y-[12px] @[620px]:flex-row @[620px]:items-center @[620px]:gap-x-[32px]",
                  shownIcon && "pointer-events-none opacity-50 select-none",
                )}
              >
                <div className="flex min-w-0 flex-col gap-[2px] @[620px]:max-w-[400px] @[620px]:flex-1">
                  <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Sidebar avatar</span>
                  <p className="text-[13px] leading-[18px] text-pg-muted">
                    {shownIcon ? "Not shown while you have an icon uploaded." : "Shown as your sidebar icon until you upload one."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-[16px] @[620px]:shrink-0">
                  <AccountLogo logo={avatarLogo} size={40} radius={10} />
                  <AvatarEditor
                    initials={shownInitials}
                    onInitials={setInitialsDraft}
                    onResetInitials={() => setInitialsDraft(null)}
                    color={avatarTileNow?.color ?? "#475467"}
                    logoColors={logoColors}
                    style={avatarStyle}
                    onColor={(c) =>
                      brand.setAvatar(agency.id, { ...avatarTile(c, avatarStyle), color: c, custom: true })
                    }
                  />
                </div>
              </div>
            }
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

      {themeSlot ? (
        <div className={cn(!cards && !acc && "border-t border-pg-border py-[24px]", acc && "contents")}>
          {themedSlot}
        </div>
      ) : null}

      <Group title="Domains" sub="Where your platform lives." cards={cards} key={`domains-${sectionsMode}-${tabs}`} id="wl-domains" off={off("wl-domains")} saveTop={saveTop} defaultOpen={tabs} accordion={acc} collapsed={collapse}>
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
        key={`policies-${sectionsMode}-${tabs}`} id="wl-policies" off={off("wl-policies")} saveTop={saveTop} defaultOpen={tabs} accordion={acc} collapsed={collapse}
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
        title="Custom code"
        sub="Your code runs on the navigation it was written for, and only that one."
        cards={cards}
        key={`code-${sectionsMode}-${tabs}`} id="wl-code" off={off("wl-code")} saveTop={saveTop} defaultOpen={tabs} accordion={acc} collapsed={collapse}
      >
        <div className="flex gap-[8px] rounded-[8px] bg-[var(--hr-warning-50)] px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--hr-warning-200)]">
          <TriangleAlert size={16} aria-hidden="true" className="mt-[1px] shrink-0 text-[var(--hr-warning-600)]" />
          <p className="text-[13px] leading-[18px] text-pg-text">
            Custom CSS and JS can break or conflict with new features as we release them. Use them only when you need to, and check your pages after each update.
          </p>
        </div>
        {/* Accordions: the section itself folds, so no second toggle (Nov 26, 2026). */}
        {acc ? null : (
        <button
          type="button"
          aria-expanded={codeOpen}
          onClick={() => setCodeOpen((o) => !o)}
          className="motion-tap flex h-[36px] items-center gap-[6px] self-start rounded-[8px] px-[12px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
        >
          <Code size={16} aria-hidden="true" className="text-pg-muted" />
          {codeOpen ? "Hide custom code" : "Show custom code"}
          <ChevronDown size={16} aria-hidden="true" className={cn("text-pg-muted transition-transform", codeOpen && "rotate-180")} />
        </button>
        )}
        {codeOpen || acc ? (
        <div className="motion-panel-in flex flex-col gap-[16px]">
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
        </div>
        ) : null}
      </Group>
      </div>
      </div>

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
  collapsed = false,
  id,
  accordion = false,
  defaultOpen = false,
  action,
  off = false,
  saveTop = false,
}: {
  /** Tabs mode: another section is showing. */
  off?: boolean;
  /** Save and Cancel go in the accordion header. */
  saveTop?: boolean;
  /** In an accordion's header, beside the chevron. */
  action?: React.ReactNode;
  /** Anchor for the side menu. */
  id?: string;
  /** A full accordion section (proto wlSections "accordion"). */
  accordion?: boolean;
  defaultOpen?: boolean;
  title: string;
  sub: string;
  children: React.ReactNode;
  /** Starts folded; the heading opens it (prototype control, Nov 26, 2026). */
  collapsed?: boolean;
  /**
   * Production's frame: title on the left, fields in a card on the right,
   * and — when `save` is given — that card's own Cancel and Save.
   */
  cards?: boolean;
  save?: { dirty: boolean; onCancel: () => void; onSave: () => void };
}) {
  const [open, setOpen] = React.useState(!collapsed);
  if (off) return null;
  if (accordion) {
    return (
      <AccordionSection
        id={id}
        title={title}
        sub={sub}
        defaultOpen={defaultOpen}
        action={action}
        {...(saveTop && save
          ? { save: <HeaderSave dirty={save.dirty} onCancel={save.onCancel} onSave={save.onSave} divider={Boolean(action)} /> }
          : {})}
      >
        <div className="flex flex-col gap-[16px] p-[16px]">{children}</div>
        {save && !saveTop ? <SaveFooter save={save} /> : null}
      </AccordionSection>
    );
  }
  if (collapsed) {
    return (
      <section id={id} className="flex scroll-mt-[16px] flex-col border-t border-pg-border first-of-type:border-t-0">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="motion-tap -mx-[8px] flex items-center gap-[12px] rounded-[8px] px-[8px] py-[16px] text-left hover:bg-pg"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] leading-[21px] font-semibold text-pg-heading">{title}</span>
            <span className="mt-[2px] block text-[13px] leading-[18px] text-pg-muted">{sub}</span>
          </span>
          <ChevronDown size={16} aria-hidden="true" className={cn("shrink-0 text-pg-muted transition-transform", open && "rotate-180")} />
        </button>
        {open ? <div className="motion-panel-in flex flex-col gap-[16px] pb-[24px]">{children}</div> : null}
      </section>
    );
  }
  if (cards) {
    return (
      <section id={id} className="flex scroll-mt-[16px] flex-col gap-[12px] border-t border-pg-border pt-[20px] first-of-type:border-t-0 first-of-type:pt-0 md:flex-row md:gap-[24px]">
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
    <section id={id} className="flex scroll-mt-[16px] flex-col gap-[16px] border-t border-pg-border py-[24px] first-of-type:border-t-0 first-of-type:pt-[4px]">
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

type ThemeFrame = (
  part: "theme" | "advanced",
  node: (bare: boolean, hideFooter?: boolean) => React.ReactNode,
  save?: React.ReactNode,
) => React.ReactNode;

const OPEN_EVENT = "wl-open-section";

/**
 * A whole section as an accordion (Nov 26, 2026): the card is the section,
 * its header row the toggle. The side menu opens one before scrolling to it.
 */
function AccordionSection({
  id,
  title,
  sub,
  defaultOpen = false,
  action,
  save,
  children,
}: {
  /** Save and Cancel in the header (proto wlSavePlace "top"): a HeaderSave. */
  save?: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
  title: string;
  sub: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const bodyId = React.useId();
  React.useEffect(() => {
    if (!id) return;
    const on = (e: Event) => {
      if ((e as CustomEvent<string>).detail === id) setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, on);
    return () => window.removeEventListener(OPEN_EVENT, on);
  }, [id]);
  return (
    <section
      id={id}
      className="scroll-mt-[16px] rounded-[12px] bg-pg-surface shadow-[0_1px_2px_rgba(16,24,40,0.05),inset_0_0_0_1px_var(--pg-border)]"
    >
      <div
        className={cn(
          "flex items-center gap-[12px] rounded-[12px] pr-[16px] hover:bg-pg",
          open && "rounded-b-none shadow-[inset_0_-1px_0_0_var(--pg-border)]",
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className="motion-tap flex min-w-0 flex-1 items-center gap-[12px] py-[14px] pl-[16px] text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] leading-[24px] font-semibold text-pg-heading">{title}</span>
            <span className="block text-[13px] leading-[18px] text-pg-muted">{sub}</span>
          </span>
        </button>
        {action}
        {save}
        <button
          type="button"
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted"
        >
          <ChevronDown size={18} aria-hidden="true" className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open ? (
        <div id={bodyId} className="motion-panel-in">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function SaveFooter({ save }: { save: { dirty: boolean; onCancel: () => void; onSave: () => void } }) {
  return (
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
          save.dirty ? "hover:brightness-95 active:scale-[0.98]" : "cursor-not-allowed opacity-50",
        )}
      >
        Save changes
      </button>
    </footer>
  );
}

/**
 * The side menu (proto wlNav "side", Nov 26, 2026): one item per section,
 * click to scroll there (and open it, when sections are accordions). The
 * item for the section in view is highlighted.
 */
function SectionNav({
  items,
  tabs = false,
  active: tabActive,
  onSelect,
}: {
  items: { id: string; label: string }[];
  /** Tabs: the item picks the one section shown; no scrolling. */
  tabs?: boolean;
  active?: string;
  onSelect?: (id: string) => void;
}) {
  const [scrollActive, setActive] = React.useState(items[0]?.id ?? "");
  const active = tabs ? (tabActive ?? "") : scrollActive;
  const ids = items.map((i) => i.id).join(",");
  React.useEffect(() => {
    if (tabs) return;
    // The last section whose top has passed a line near the top of the view.
    const update = () => {
      const all = ids.split(",");
      let hit = all[0] ?? "";
      for (const id of all) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) hit = id;
      }
      setActive(hit);
    };
    update();
    window.addEventListener("scroll", update, true);
    return () => window.removeEventListener("scroll", update, true);
  }, [ids, tabs]);
  const go = (id: string) => {
    if (tabs) {
      onSelect?.(id);
      return;
    }
    setActive(id);
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <nav aria-label="White label sections" className="sticky top-[16px] hidden w-[176px] shrink-0 flex-col gap-[2px] lg:flex">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          aria-current={active === i.id ? "true" : undefined}
          onClick={() => go(i.id)}
          className={cn(
            "motion-tap flex h-[32px] items-center rounded-[6px] px-[12px] text-left text-[14px] leading-[20px]",
            active === i.id
              ? "bg-[var(--hr-primary-50)] font-medium text-[var(--hr-primary-700)]"
              : "text-pg-text hover:bg-pg",
          )}
        >
          {i.label}
        </button>
      ))}
    </nav>
  );
}
