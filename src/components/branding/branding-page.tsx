"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Eye,
  ImageUp,
  Info,
  Lock,
  Palette,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { AccountLogo } from "@/components/accounts/account-logo";
import { DEFAULT_TEMPLATE_ID, useNavTemplates } from "@/components/nav/nav-templates";
import { PageTitle, usePageChrome } from "@/components/page/page-header";
import { Modal } from "@/components/page/modal";
import { SideDrawer } from "@/components/page/side-drawer";
import { Chip } from "@/components/settings/controls";
import { Section } from "@/components/settings/white-label-parts";
import {
  registerNavigationGuard,
  resolvePendingNavigation,
} from "@/components/shell/navigation-guard";
import {
  CHROME_STYLE_LABELS,
  type BrandAssets,
  type BrandingState,
  type BrandingTheme,
  type SubAccountBranding,
  withAgencyTheme,
} from "@/design/branding";
import { cn } from "@/lib/utils";
import {
  ThemeEditor,
  useEffectiveMode,
} from "./branding-controls";
import { ThemeScopeNote } from "./customize-panel";
import { BrandingInlinePreview } from "./branding-inline-preview";
import { useBranding } from "./branding-provider";

/**
 * Agency › Settings › Branding (Nov 18) — the home for agency branding.
 *
 * Edits a DRAFT (`beginDraft` on mount, every field through `updateDraft`).
 * Under `previewTarget: "live"` the app chrome around this page paints the
 * draft, so the preview is the real nav; under "inline" the page draws a mock.
 * Save commits, Discard drops, and leaving with edits asks first — through the
 * shell's leave-guard (shell/navigation-guard.ts), so a nav row, a breadcrumb
 * or an account switch all stop at the same prompt.
 *
 * Themes per sub-account ride on LAYOUTS: a layout can carry a theme, and an
 * account takes it when the layout is applied (nav edit mode) — or, for
 * accounts already on it, when this page is saved.
 */

export const BRANDING_PLACE_ID = "agency-branding";

type AssetKey = keyof BrandAssets;
type AssetPatch = Partial<Record<AssetKey, string | null>>;

const PRIMARY_BTN =
  "motion-tap flex h-[36px] items-center gap-[6px] rounded-[8px] bg-brand px-[14px] text-[14px] font-medium whitespace-nowrap text-white hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY_BTN =
  "motion-tap flex h-[36px] items-center gap-[6px] rounded-[8px] bg-pg-surface px-[14px] text-[14px] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
const DANGER_BTN =
  "motion-tap flex h-[36px] items-center rounded-[8px] bg-[var(--hr-error-600,#d92d20)] px-[14px] text-[14px] font-medium whitespace-nowrap text-white hover:brightness-95 active:scale-[0.98]";
const LINK_BTN =
  "motion-tap text-[13px] leading-[18px] font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50";

/* ---------------------------------------------------------------------- */
/* Pure helpers                                                            */
/* ---------------------------------------------------------------------- */

function patchAssets(a: BrandAssets, patch: AssetPatch): BrandAssets {
  const out: BrandAssets = { ...a };
  for (const [k, v] of Object.entries(patch) as [AssetKey, string | null | undefined][]) {
    if (v) out[k] = v;
    else delete out[k];
  }
  return out;
}

/** Writes one account's override, dropping it entirely once it holds nothing. */
function putOverride(
  overrides: BrandingState["overrides"],
  id: string,
  next: SubAccountBranding,
): BrandingState["overrides"] {
  const out = { ...overrides };
  const clean: SubAccountBranding = {};
  if (next.theme) clean.theme = next.theme;
  if (next.assets && Object.keys(next.assets).length > 0) clean.assets = next.assets;
  if (clean.theme || clean.assets) out[id] = clean;
  else delete out[id];
  return out;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/* ---------------------------------------------------------------------- */
/* Page                                                                    */
/* ---------------------------------------------------------------------- */

export function BrandingPage({
  agency,
  accounts,
}: {
  agency: Account;
  accounts: readonly Account[];
}) {
  const b = useBranding();
  const { templates, linkedIdFor } = useNavTemplates();
  const { title: showTitle, description: showDesc } = usePageChrome();
  const mode = useEffectiveMode();
  const editable = b.proto.access === "edit";
  const disabled = !editable;
  const state = b.draft ?? b.saved;
  const agencyAssets = state.agency.assets;

  /* --- draft lifecycle --------------------------------------------------- */

  const bRef = React.useRef(b);
  React.useEffect(() => {
    bRef.current = b;
  });

  // Open a draft while editable (again after each save or discard); drop it
  // the moment access turns view-only.
  React.useEffect(() => {
    if (editable && b.draft === null) b.beginDraft();
    if (!editable && b.draft !== null) b.discardDraft();
  }, [editable, b]);

  // Leaving drops whatever was not saved — the prompt has already asked.
  // The light/dark preview is this page's too, so it ends with it.
  React.useEffect(
    () => () => {
      bRef.current.discardDraft();
      bRef.current.setPreviewMode(null);
    },
    [],
  );

  /* --- leave-guard ------------------------------------------------------- */

  const [leaving, setLeaving] = React.useState(false);
  const dirtyRef = React.useRef(false);
  React.useEffect(() => {
    dirtyRef.current = b.dirty;
  }, [b.dirty]);

  React.useEffect(
    () =>
      registerNavigationGuard({
        isBlocking: (target) => dirtyRef.current && target !== BRANDING_PLACE_ID,
        onBlocked: () => setLeaving(true),
      }),
    [],
  );

  // A reload or closed tab loses the draft too.
  React.useEffect(() => {
    if (!b.dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [b.dirty]);

  /* --- writes ------------------------------------------------------------ */

  const setAgencyAssets = (patch: AssetPatch) =>
    b.updateDraft((d) => ({
      ...d,
      agency: { ...d.agency, assets: patchAssets(d.agency.assets, patch) },
    }));

  const setAgencyTheme = (theme: BrandingTheme) =>
    b.updateDraft((d) => ({ ...d, agency: { ...d.agency, theme } }));

  const setAccountAssets = (id: string, patch: AssetPatch | null) =>
    b.updateDraft((d) => {
      const cur = d.overrides[id] ?? {};
      const assets = patch === null ? {} : patchAssets(cur.assets ?? {}, patch);
      return { ...d, overrides: putOverride(d.overrides, id, { ...cur, assets }) };
    });

  const setLayoutTheme = (id: string, theme: BrandingTheme | null) =>
    b.updateDraft((d) => {
      const layoutThemes = { ...d.layoutThemes };
      if (theme) layoutThemes[id] = theme;
      else delete layoutThemes[id];
      return { ...d, layoutThemes };
    });

  /* --- save -------------------------------------------------------------- */

  const [toast, setToast] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /**
   * Commit, linking changed layout themes onto the accounts already on them.
   * The layout flow itself is untouched: this only reaches accounts whose
   * layout's theme changed in this draft.
   */
  const save = () => {
    const before = b.saved.layoutThemes;
    // Agency-wide (default, Nov 19): one theme for the agency and every
    // sub-account, so no sub-account keeps its own.
    if (b.proto.saveTarget === "agency") {
      b.commitDraft((d) => withAgencyTheme(d, d.agency.theme));
      return;
    }
    b.commitDraft((d) => {
      const ids = new Set([...Object.keys(before), ...Object.keys(d.layoutThemes)]);
      let overrides = d.overrides;
      for (const layoutId of ids) {
        const theme = d.layoutThemes[layoutId];
        if (same(theme, before[layoutId])) continue;
        for (const a of accounts) {
          if (linkedIdFor(a.id) !== layoutId) continue;
          const cur = overrides[a.id] ?? {};
          overrides = putOverride(overrides, a.id, { ...cur, theme });
        }
      }
      return { ...d, overrides };
    });
  };

  const onSave = () => {
    save();
    setToast("Branding saved.");
  };

  /* --- drawers ----------------------------------------------------------- */

  const [editingAccount, setEditingAccount] = React.useState<string | null>(null);
  const [editingLayout, setEditingLayout] = React.useState<string | null>(null);
  const openAccount = (id: string) => {
    setEditingLayout(null);
    setEditingAccount(id);
  };
  const openLayout = (id: string) => {
    setEditingAccount(null);
    setEditingLayout(id);
  };

  const showBar = editable && b.dirty && b.proto.unsavedUi === "bar-and-modal";
  const editingAcc = accounts.find((a) => a.id === editingAccount) ?? null;
  const editingTpl = templates.find((t) => t.id === editingLayout) ?? null;

  return (
    <div className="w-full px-[var(--page-inset)] pb-[24px]">
      {/* Header ---------------------------------------------------------- */}
      <header className="flex flex-wrap items-start gap-[16px]">
        <div className="min-w-0 flex-1">
          {showTitle ? (
            <>
              <PageTitle title="Branding" className="text-[20px] leading-[28px] font-semibold text-pg-heading" />
              {showDesc ? (
                <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
                  Your logo, colors, and browser tab across the app.
                </p>
              ) : null}
            </>
          ) : null}
          {b.proto.saveTarget === "agency" ? (
            <div className="mt-[8px]">
              <ThemeScopeNote scope={{ accountId: null }} />
            </div>
          ) : (
            <p className="mt-[8px] flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
              <Info size={14} aria-hidden="true" className="shrink-0" />
              Applies to all sub-accounts unless their layout has its own theme.
            </p>
          )}
        </div>
        <div className="flex items-start gap-[12px]">
          {editable && b.proto.unsavedUi === "modal" ? (
            <div className="flex items-center gap-[12px]">
              <button type="button" className={SECONDARY_BTN} disabled={!b.dirty} onClick={b.discardDraft}>
                Discard
              </button>
              <button type="button" className={PRIMARY_BTN} disabled={!b.dirty} onClick={onSave}>
                Save changes
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Notices --------------------------------------------------------- */}
      <div className="mt-[16px] flex flex-col gap-[8px]">
        {!editable ? (
          <Notice icon={<Lock size={16} aria-hidden="true" />}>
            You have view access. Ask an admin to make changes.
          </Notice>
        ) : b.proto.previewTarget === "live" ? (
          <Notice icon={<Eye size={16} aria-hidden="true" />}>
            The sidebar, rail, and top bar around this page show your changes as you edit. Nothing
            changes for your sub-accounts until you save.
          </Notice>
        ) : null}
      </div>

      <div className="mt-[16px] flex flex-col gap-[20px]">
        {/* Logo -------------------------------------------------------- */}
        <Section title="Logo" sub="Add a light and a dark version. We show whichever reads on the sidebar's color.">
          <div className="grid grid-cols-1 gap-[16px] lg:grid-cols-2">
            <AssetSlot
              label="Logo for light backgrounds"
              hint="Shown on light sidebars."
              spec="PNG or SVG · 540 × 84 px, 3:1 to 6:1 · Max 2.5 MB"
              surface="light"
              src={agencyAssets.logoLight}
              disabled={disabled}
              onPick={(v) => setAgencyAssets({ logoLight: v })}
              onRemove={() => setAgencyAssets({ logoLight: null })}
            />
            <AssetSlot
              label="Logo for dark backgrounds"
              hint="Shown on dark and brand-colored sidebars."
              spec="PNG or SVG · 540 × 84 px, 3:1 to 6:1 · Max 2.5 MB"
              surface="dark"
              src={agencyAssets.logoDark}
              disabled={disabled}
              onPick={(v) => setAgencyAssets({ logoDark: v })}
              onRemove={() => setAgencyAssets({ logoDark: null })}
            />
          </div>
        </Section>

        {/* Browser tab ------------------------------------------------- */}
        <Section title="Browser tab" sub="The icon and title people see in their browser tab.">
          <div className="flex flex-col gap-[16px]">
            <AssetSlot
              label="Favicon"
              hint="The small icon beside the tab title."
              spec="Square · 32 × 32 px or larger · PNG, ICO, or SVG"
              surface="light"
              square
              src={agencyAssets.favicon}
              disabled={disabled}
              onPick={(v) => setAgencyAssets({ favicon: v })}
              onRemove={() => setAgencyAssets({ favicon: null })}
            />
            <TextField
              label="Tab title"
              hint="Shown before the page name."
              placeholder={agency.name}
              value={agencyAssets.tabTitle ?? ""}
              disabled={disabled}
              onChange={(v) => setAgencyAssets({ tabTitle: v })}
            />
            <TabPreview favicon={agencyAssets.favicon} title={agencyAssets.tabTitle} />
          </div>
        </Section>

        {/* Theme ------------------------------------------------------- */}
        <Section
          title="Theme"
          sub={
            b.proto.saveTarget === "agency"
              ? "Colors and font for the sidebar, sub-account rail, and top bar."
              : "Colors and font for the sidebar, sub-account rail, and top bar. Sub-accounts use it unless their layout has its own theme."
          }
        >
          <div
            className={cn(
              "grid grid-cols-1 gap-[24px]",
              b.proto.previewTarget === "inline" && "xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]",
            )}
          >
            <div className="max-w-[640px]">
              <ThemeEditor value={state.agency.theme} onChange={setAgencyTheme} disabled={disabled} />
            </div>
            {b.proto.previewTarget === "inline" ? (
              <div className="xl:sticky xl:top-[16px] xl:self-start">
                <BrandingInlinePreview
                  theme={state.agency.theme}
                  assets={agencyAssets}
                  mode={mode}
                  accounts={accounts}
                />
              </div>
            ) : null}
          </div>
        </Section>

        {/* Layouts (only when themes ride on layouts) ------------------ */}
        {b.proto.saveTarget === "layout" ? (
        <Section
          title="Layouts"
          sub="Give a layout its own theme. Sub-accounts on that layout switch to it when you save."
          tag="Apply layouts from nav edit mode"
        >
          <ul className="flex flex-col">
            {templates.map((t, i) => {
              const isDefault = t.id === DEFAULT_TEMPLATE_ID || t.immutable;
              const theme = isDefault ? undefined : state.layoutThemes[t.id];
              const count = accounts.filter((a) => {
                const linked = linkedIdFor(a.id);
                return isDefault ? linked === null || linked === t.id : linked === t.id;
              }).length;
              return (
                <li
                  key={t.id}
                  className={cn(
                    "flex flex-wrap items-center gap-[12px] py-[10px]",
                    i > 0 && "border-t border-pg-border",
                  )}
                >
                  <ThemeSwatch theme={theme ?? state.agency.theme} faded={!theme} />
                  <div className="min-w-[160px] flex-1">
                    <div className="text-[14px] leading-[20px] font-medium text-pg-heading">{t.name}</div>
                    <div className="text-[13px] leading-[18px] text-pg-muted">
                      {theme
                        ? `${CHROME_STYLE_LABELS[theme.together ? theme.chrome.style : "custom"]} theme`
                        : "Uses agency theme"}
                      {" · "}
                      {count === 1 ? "1 sub-account" : `${count.toLocaleString("en-US")} sub-accounts`}
                    </div>
                  </div>
                  {isDefault ? (
                    <span className="text-[13px] leading-[18px] text-pg-faint">Locked</span>
                  ) : (
                    <div className="flex items-center gap-[12px]">
                      {theme && editable ? (
                        <button type="button" className={LINK_BTN} onClick={() => setLayoutTheme(t.id, null)}>
                          Use agency theme
                        </button>
                      ) : null}
                      <button type="button" className={SECONDARY_BTN} onClick={() => openLayout(t.id)}>
                        {editable ? "Edit theme" : "View theme"}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
        ) : null}

        {/* Sub-account overrides --------------------------------------- */}
        <Section
          title="Sub-account overrides"
          sub="Use a different logo, favicon, or tab title for specific sub-accounts."
        >
          <AccountOverrides
            accounts={accounts}
            state={state}
            editable={editable}
            layoutName={(id) => {
              const linked = linkedIdFor(id);
              return templates.find((t) => t.id === linked)?.name ?? null;
            }}
            onCustomize={openAccount}
            onReset={(id) => setAccountAssets(id, null)}
          />
        </Section>
      </div>

      {/* Save bar ------------------------------------------------------- */}
      {showBar ? (
        <div className="sticky bottom-[16px] z-[20] mt-[20px]">
          <div
            role="region"
            aria-label="Unsaved changes"
            className="motion-panel-in flex flex-wrap items-center gap-[12px] rounded-[12px] bg-pg-surface px-[16px] py-[12px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            <span className="flex-1 text-[14px] leading-[20px] font-medium text-pg-heading">
              Unsaved changes
            </span>
            <button type="button" className={SECONDARY_BTN} onClick={b.discardDraft}>
              Discard
            </button>
            <button type="button" className={PRIMARY_BTN} onClick={onSave}>
              Save changes
            </button>
          </div>
        </div>
      ) : null}

      {/* Drawers -------------------------------------------------------- */}
      {editingAcc ? (
        <AccountDrawer
          account={editingAcc}
          agencyAssets={agencyAssets}
          own={state.overrides[editingAcc.id]?.assets ?? {}}
          disabled={disabled}
          onPatch={(p) => setAccountAssets(editingAcc.id, p)}
          onReset={() => setAccountAssets(editingAcc.id, null)}
          onClose={() => setEditingAccount(null)}
        />
      ) : null}
      {editingTpl ? (
        <SideDrawer
          title={editingTpl.name}
          subtitle="Layout theme"
          width={360}
          onClose={() => setEditingLayout(null)}
          bodyClassName="py-[16px]"
          footer={
            <>
              {editable && state.layoutThemes[editingTpl.id] ? (
                <button
                  type="button"
                  className={SECONDARY_BTN}
                  onClick={() => setLayoutTheme(editingTpl.id, null)}
                >
                  Use agency theme
                </button>
              ) : null}
              <span className="flex-1" />
              <button type="button" className={PRIMARY_BTN} onClick={() => setEditingLayout(null)}>
                Done
              </button>
            </>
          }
        >
          {!state.layoutThemes[editingTpl.id] ? (
            <p className="mb-[12px] text-[13px] leading-[18px] text-pg-muted">
              This layout uses the agency theme. Change anything below to give it its own.
            </p>
          ) : null}
          <ThemeEditor
            compact
            value={state.layoutThemes[editingTpl.id] ?? state.agency.theme}
            onChange={(t) => setLayoutTheme(editingTpl.id, t)}
            disabled={disabled}
          />
        </SideDrawer>
      ) : null}

      {/* Leave prompt --------------------------------------------------- */}
      {leaving ? (
        <Modal
          title="Discard unsaved changes?"
          width={480}
          onClose={() => {
            setLeaving(false);
            resolvePendingNavigation(false);
          }}
          footer={
            <>
              <button
                type="button"
                className={cn(SECONDARY_BTN, "mr-auto")}
                onClick={() => {
                  setLeaving(false);
                  save();
                  resolvePendingNavigation(true);
                }}
              >
                Save and leave
              </button>
              <button
                type="button"
                className={SECONDARY_BTN}
                onClick={() => {
                  setLeaving(false);
                  resolvePendingNavigation(false);
                }}
              >
                Keep editing
              </button>
              <button
                type="button"
                className={DANGER_BTN}
                onClick={() => {
                  setLeaving(false);
                  b.discardDraft();
                  resolvePendingNavigation(true);
                }}
              >
                Discard changes
              </button>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            Your branding changes haven&apos;t been saved.
          </p>
        </Modal>
      ) : null}

      {toast ? <SavedToast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Pieces                                                                  */
/* ---------------------------------------------------------------------- */

function Notice({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-[10px] rounded-[8px] bg-brand-soft px-[12px] py-[10px] text-[13px] leading-[18px] text-pg-text">
      <span className="mt-[1px] shrink-0 text-brand">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

/**
 * One upload, previewed on the background it is for: the light logo on white,
 * the dark logo on near-black — so a white-on-transparent mark is visible
 * where it will actually be used.
 */
function AssetSlot({
  label,
  hint,
  spec,
  surface,
  square = false,
  src,
  inherited,
  disabled,
  onPick,
  onRemove,
  resetLabel,
}: {
  label: string;
  hint?: string;
  spec?: string;
  surface: "light" | "dark";
  square?: boolean;
  src?: string;
  /** The agency's value, drawn faded when this slot has none of its own. */
  inherited?: string;
  disabled?: boolean;
  onPick: (dataUrl: string) => void;
  onRemove: () => void;
  /** Overrides only: the reset reads "Use agency …" instead of "Remove". */
  resetLabel?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const read = (file: File | undefined) => {
    if (disabled || !file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onPick(String(reader.result));
    reader.readAsDataURL(file);
  };
  const shown = src ?? inherited;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-[16px] gap-y-[8px]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          read(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-[10px]",
          square ? "size-[72px]" : "h-[72px] w-[156px]",
          surface === "dark"
            ? "bg-[#101828] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "bg-white shadow-[inset_0_0_0_1px_var(--pg-border)]",
          !shown && "border border-dashed border-pg-border-strong shadow-none",
          over && "shadow-[inset_0_0_0_2px_var(--brand)]",
        )}
      >
        {shown ? (
          <img
            src={shown}
            alt=""
            className={cn("max-h-full max-w-full object-contain p-[10px]", !src && "opacity-50")}
          />
        ) : (
          <ImageUp
            size={20}
            aria-hidden="true"
            className={surface === "dark" ? "text-white/40" : "text-pg-faint"}
          />
        )}
      </div>
      <div className="flex min-w-[160px] flex-1 flex-col gap-[2px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">{label}</span>
        {hint ? <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span> : null}
        {spec ? <span className="text-[13px] leading-[18px] text-pg-faint">{spec}</span> : null}
        {!src && inherited ? (
          <span className="text-[13px] leading-[18px] text-pg-faint">Using agency {label.toLowerCase()}.</span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-[8px]">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={SECONDARY_BTN}
        >
          {src ? "Replace" : "Upload"}
        </button>
        {resetLabel ? (
          src ? (
            <button type="button" disabled={disabled} onClick={onRemove} className={LINK_BTN}>
              {resetLabel}
            </button>
          ) : null
        ) : (
          <button
            type="button"
            disabled={disabled || !src}
            onClick={onRemove}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-[color:var(--hr-error-600)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          read(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function TextField({
  label,
  hint,
  placeholder,
  value,
  disabled,
  onChange,
  trailing,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center gap-[8px]">
        <label htmlFor={id} className="flex-1 text-[14px] leading-[20px] font-medium text-pg-heading">
          {label}
        </label>
        {trailing}
      </div>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={60}
        onChange={(e) => onChange(e.target.value)}
        className="h-[36px] w-full max-w-[400px] rounded-[8px] bg-pg-surface px-[11px] text-[14px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] outline-none placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1.5px_var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
      />
      {hint ? <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span> : null}
    </div>
  );
}

/** A browser tab strip, so the favicon and title are judged at their real size. */
function TabPreview({ favicon, title }: { favicon?: string; title?: string }) {
  const text = title ? `${title} · Contacts` : "Contacts · HighLevel";
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[13px] leading-[18px] text-pg-muted">Preview</span>
      <div
        aria-hidden="true"
        className="flex h-[40px] max-w-[400px] items-end gap-[4px] rounded-[8px] bg-[#dee1e6] px-[8px] pt-[6px]"
      >
        <div className="flex h-[34px] w-[220px] items-center gap-[8px] rounded-t-[8px] bg-white px-[10px]">
          <img src={favicon ?? "/hl-logo.png"} alt="" className="size-[16px] shrink-0 object-contain" />
          <span className="min-w-0 flex-1 truncate text-[12px] text-[#202124]">{text}</span>
          <X size={12} className="shrink-0 text-[#5f6368]" />
        </div>
        <span className="mb-[9px] ml-[4px] text-[16px] leading-none text-[#5f6368]">+</span>
      </div>
    </div>
  );
}

function ThemeSwatch({ theme, faded }: { theme: BrandingTheme; faded?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex size-[36px] shrink-0 items-center justify-center rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
        faded && "opacity-50",
      )}
      style={{ background: theme.brand }}
    >
      {theme.accent ? (
        <span
          className="absolute right-[4px] bottom-[4px] size-[10px] rounded-full shadow-[0_0_0_1.5px_rgba(255,255,255,0.9)]"
          style={{ background: theme.accent }}
        />
      ) : (
        <Palette size={14} className="text-white/80" />
      )}
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/* Sub-account overrides                                                   */
/* ---------------------------------------------------------------------- */

const OVERRIDE_CHIPS: [AssetKey, string][] = [
  ["logoLight", "Light logo"],
  ["logoDark", "Dark logo"],
  ["favicon", "Favicon"],
  ["tabTitle", "Tab title"],
];

function AccountOverrides({
  accounts,
  state,
  editable,
  layoutName,
  onCustomize,
  onReset,
}: {
  accounts: readonly Account[];
  state: BrandingState;
  editable: boolean;
  layoutName: (id: string) => string | null;
  onCustomize: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const rows = accounts.filter((a) => !q || a.name.toLowerCase().includes(q));
  const overridden = accounts.filter((a) => Object.keys(state.overrides[a.id]?.assets ?? {}).length > 0).length;

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex flex-wrap items-center gap-[12px]">
        <label className="flex h-[36px] w-full max-w-[320px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
          <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sub-accounts"
            aria-label="Search sub-accounts"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-pg-text outline-none placeholder:text-pg-faint"
          />
        </label>
        <span className="text-[13px] leading-[18px] text-pg-muted">
          {overridden === 0
            ? "All sub-accounts use agency branding."
            : `${overridden.toLocaleString("en-US")} of ${accounts.length.toLocaleString("en-US")} have overrides.`}
        </span>
      </div>

      <ul className="flex max-h-[480px] flex-col overflow-y-auto">
        {rows.length === 0 ? (
          <li className="py-[16px] text-[14px] leading-[20px] text-pg-muted">No sub-accounts match.</li>
        ) : null}
        {rows.map((a, i) => {
          const own = state.overrides[a.id]?.assets ?? {};
          const chips = OVERRIDE_CHIPS.filter(([k]) => own[k]);
          const layout = layoutName(a.id);
          return (
            <li
              key={a.id}
              className={cn("flex flex-wrap items-center gap-[12px] py-[10px]", i > 0 && "border-t border-pg-border")}
            >
              <AccountLogo logo={a.logo} size={32} radius={8} {...(a.logoSrc ? { src: a.logoSrc } : {})} />
              <div className="min-w-[160px] flex-1">
                <div className="truncate text-[14px] leading-[20px] font-medium text-pg-heading">{a.name}</div>
                <div className="truncate text-[13px] leading-[18px] text-pg-muted">
                  {layout ? `Layout: ${layout}` : "Default layout"}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-[6px]">
                {chips.length === 0 ? (
                  <Chip tone="inherit">Agency branding</Chip>
                ) : (
                  chips.map(([k, l]) => (
                    <Chip key={k} tone="overridden">
                      {l}
                    </Chip>
                  ))
                )}
              </div>
              <div className="flex items-center gap-[12px]">
                {chips.length > 0 && editable ? (
                  <button type="button" className={LINK_BTN} onClick={() => onReset(a.id)}>
                    Use agency branding
                  </button>
                ) : null}
                <button type="button" className={SECONDARY_BTN} onClick={() => onCustomize(a.id)}>
                  {editable ? "Customize" : "View"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AccountDrawer({
  account,
  agencyAssets,
  own,
  disabled,
  onPatch,
  onReset,
  onClose,
}: {
  account: Account;
  agencyAssets: BrandAssets;
  own: BrandAssets;
  disabled: boolean;
  onPatch: (p: AssetPatch) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const any = Object.keys(own).length > 0;
  return (
    <SideDrawer
      title={account.name}
      subtitle="Branding for this sub-account"
      width={400}
      onClose={onClose}
      bodyClassName="py-[16px]"
      lead={<AccountLogo logo={account.logo} size={28} radius={7} {...(account.logoSrc ? { src: account.logoSrc } : {})} />}
      footer={
        <>
          {any && !disabled ? (
            <button type="button" className={SECONDARY_BTN} onClick={onReset}>
              Use agency branding
            </button>
          ) : null}
          <span className="flex-1" />
          <button type="button" className={PRIMARY_BTN} onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-[20px]">
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Anything you leave empty uses the agency&apos;s branding.
        </p>
        <AssetSlot
          label="Light logo"
          surface="light"
          src={own.logoLight}
          inherited={agencyAssets.logoLight}
          disabled={disabled}
          resetLabel="Use agency logo"
          onPick={(v) => onPatch({ logoLight: v })}
          onRemove={() => onPatch({ logoLight: null })}
        />
        <AssetSlot
          label="Dark logo"
          surface="dark"
          src={own.logoDark}
          inherited={agencyAssets.logoDark}
          disabled={disabled}
          resetLabel="Use agency logo"
          onPick={(v) => onPatch({ logoDark: v })}
          onRemove={() => onPatch({ logoDark: null })}
        />
        <AssetSlot
          label="Favicon"
          surface="light"
          square
          src={own.favicon}
          inherited={agencyAssets.favicon}
          disabled={disabled}
          resetLabel="Use agency favicon"
          onPick={(v) => onPatch({ favicon: v })}
          onRemove={() => onPatch({ favicon: null })}
        />
        <TextField
          label="Tab title"
          placeholder={agencyAssets.tabTitle || account.name}
          value={own.tabTitle ?? ""}
          disabled={disabled}
          onChange={(v) => onPatch({ tabTitle: v })}
          trailing={
            own.tabTitle && !disabled ? (
              <button type="button" className={LINK_BTN} onClick={() => onPatch({ tabTitle: null })}>
                Use agency title
              </button>
            ) : null
          }
        />
        <TabPreview
          favicon={own.favicon ?? agencyAssets.favicon}
          title={own.tabTitle || agencyAssets.tabTitle}
        />
      </div>
    </SideDrawer>
  );
}

/* ---------------------------------------------------------------------- */
/* Toast                                                                   */
/* ---------------------------------------------------------------------- */

function SavedToast({ message, onClose }: { message: string; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="status"
      className="motion-panel-in fixed bottom-[24px] left-1/2 z-[96] flex -translate-x-1/2 items-center gap-[8px] rounded-[8px] bg-[#101828] px-[12px] py-[10px] text-[14px] leading-[20px] text-white shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]"
    >
      <Check size={16} aria-hidden="true" className="text-[#47cd89]" />
      {message}
      <button type="button" aria-label="Dismiss" onClick={onClose} className="motion-tap ml-[4px] text-white/70 hover:text-white">
        <X size={14} aria-hidden="true" />
      </button>
    </div>,
    document.body,
  );
}
