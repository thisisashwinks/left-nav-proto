"use client";

/**
 * Customize theme — every door that edits the theme in place (Nov 18–19):
 *
 *   B  side panel           (proto.customizeTarget "panel")
 *   D  Brand & theme modal  (proto.customizeTarget "modal", the default)
 *   E  White label section / Branding tab (`BrandingThemeSection`)
 *   C  edit-mode palette    (inside nav edit mode)
 *
 * All of them write the theme LIVE, so the real chrome is the preview, and all
 * share one save model (`useThemeDoor`):
 *
 *   Agency-wide  (proto.saveTarget "agency", default, Nov 19) — the theme is
 *                the agency's and every sub-account gets it: a write sets the
 *                agency theme and clears any sub-account's own.
 *   With layouts (proto.saveTarget "layout", Nov 18) — at a sub-account the
 *                theme is that account's own, and "Save to <layout>" carries it
 *                to everyone on the layout (see nav-templates).
 *
 * B, D and E bring their own verbs (Reset to default / Cancel / Save); Cancel,
 * Esc and close put back what was there when the door opened. C has none: the
 * edit session's own Save and Discard decide (edit-session-theme.ts).
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Building2, Eye, LayoutTemplate, X } from "lucide-react";
import { useBranding } from "@/components/branding/branding-provider";
import {
  ColorModeField,
  ContrastWarnings,
  FontField,
  Switch,
  ThemeEditor,
  ThemePicker,
  useMinimalThemes,
  useExtendedThemes,
  ExtendedThemeFields,
} from "@/components/branding/branding-controls";
import { Section as PageSection } from "@/components/settings/white-label-parts";
import { Modal } from "@/components/page/modal";
import { accounts as ALL_ACCOUNTS } from "@/components/accounts/accounts-data";
import {
  setEditPaletteAnchor,
  useBrandingAccess,
  useEditPaletteAnchor,
  useEditPaletteSession,
} from "@/components/branding/branding-entry";
import {
  noteThemeEdit,
  registerThemeRestore,
} from "@/components/branding/edit-session-theme";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { DEFAULT_TEMPLATE_ID, useNavTemplates } from "@/components/nav/nav-templates";
import { useTheme } from "@/components/theme/theme-provider";
import {
  DEFAULT_THEME,
  MORE_OPTIONS_LABELS,
  isDefaultTheme,
  resolveTheme,
  withAgencyTheme,
  type BrandingState,
  type BrandingTheme,
} from "@/design/branding";
import { useAnchored } from "@/lib/use-anchored";
import { askThemeScope, keepThemeFor, useThemeScopeAsk, type ThemeScope } from "@/components/branding/theme-scope";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 320;
/** Wide enough for 3 theme columns, so it stays short (Nov 19). */
const PALETTE_WIDTH = 600;
/** Wide and short (Ashwin, Nov 19): 4 theme columns, height capped. */
export const MODAL_WIDTH = 760;
export const MODAL_MAX_H = 720;

/**
 * The coachmark card's edge and elevation (nav-tour.tsx), so the modal reads
 * off the canvas the way the tour does without a scrim (Ashwin, Nov 19).
 * Follows the same prototype controls (navTourBorder / navTourShadow).
 */
export function useCoachmarkFrame(dark: boolean): { edge: string; shadow: string } {
  const { navTourBorder, navTourShadow } = useTheme();
  const edge =
    navTourBorder === "stronger"
      ? dark ? "var(--hr-gray-500)" : "var(--hr-gray-400)"
      : navTourBorder === "strong"
        ? dark ? "var(--hr-gray-600)" : "var(--hr-gray-300)"
        : dark ? "var(--hr-gray-700)" : "var(--hr-gray-200)";
  const shadow =
    navTourShadow === "strong"
      ? "0 2px 4px rgba(16,24,40,0.10), 0 20px 24px -4px rgba(16,24,40,0.16), 0 8px 8px -4px rgba(16,24,40,0.08)"
      : "0 12px 16px rgba(16,24,40,0.08)";
  return { edge, shadow };
}

/** Id of the White label section, for "scroll to it" on arrival. */
export const BRANDING_SECTION_ID = "branding-theme-section";

export interface BrandingScope {
  /** Null at agency scope. */
  accountId: string | null;
  accountName?: string;
}

/* ---------------------------------------------------------------------- */
/* Snapshot: what Cancel / Discard puts back                               */
/* ---------------------------------------------------------------------- */

interface ThemeSnapshot {
  agency: BrandingTheme;
  /** Each sub-account's own theme; undefined = it had none. */
  own: Record<string, BrandingTheme | undefined>;
}

function snapshotOf(s: BrandingState): ThemeSnapshot {
  const own: ThemeSnapshot["own"] = {};
  for (const [id, o] of Object.entries(s.overrides)) own[id] = o.theme;
  return { agency: s.agency.theme, own };
}

function restoreSnapshot(s: BrandingState, snap: ThemeSnapshot): BrandingState {
  const overrides = { ...s.overrides };
  for (const id of new Set([...Object.keys(overrides), ...Object.keys(snap.own)])) {
    const cur = { ...overrides[id] };
    const theme = snap.own[id];
    if (theme) cur.theme = theme;
    else delete cur.theme;
    overrides[id] = cur;
  }
  return { ...s, agency: { ...s.agency, theme: snap.agency }, overrides };
}

/* ---------------------------------------------------------------------- */
/* The shared save model                                                   */
/* ---------------------------------------------------------------------- */

export function useThemeDoor(scope: BrandingScope) {
  const b = useBranding();
  const templates = useNavTemplates();
  const agencyWide = b.proto.saveTarget === "agency";
  const accountId = agencyWide ? null : scope.accountId;

  const value = accountId ? resolveTheme(b.live, accountId) : b.live.agency.theme;
  const [snap] = React.useState(() => snapshotOf(b.live));
  const [touched, setTouched] = React.useState(false);

  const { writeState, setOverride, setAgencyTheme, setLayoutTheme } = b;
  const write = React.useCallback(
    (theme: BrandingTheme) => {
      setTouched(true);
      if (agencyWide) writeState((s) => withAgencyTheme(s, theme));
      else if (accountId) setOverride(accountId, { theme });
      else setAgencyTheme(theme);
    },
    [agencyWide, accountId, writeState, setOverride, setAgencyTheme],
  );

  const revert = React.useCallback(() => {
    writeState((s) => restoreSnapshot(s, snap));
    setTouched(false);
  }, [writeState, snap]);

  const linked = accountId ? templates.linkedFor(accountId) : null;
  const layout = linked && linked.id !== DEFAULT_TEMPLATE_ID && !linked.immutable ? linked : null;

  /** Keep what is on screen. */
  const save = (message?: string) => {
    setTouched(false);
    templates.notify(
      message ?? (agencyWide ? "Theme saved for your agency and all sub-accounts." : "Theme saved."),
    );
  };

  /**
   * Agency-wide save for all sub-accounts, or only the picked ones (Nov 24):
   * the rest keep the theme they had when this edit began.
   */
  const saveScoped = (scope: ThemeScope, message?: string) => {
    if (scope !== "all") {
      writeState((s) => keepThemeFor(s, scope, snap));
      const n = scope.length;
      return save(message ?? `Theme applied to your agency and ${n.toLocaleString("en-US")} sub-account${n === 1 ? "" : "s"}.`);
    }
    save(message);
  };

  /** Layout mode, sub-account on a layout: everyone on it takes the theme. */
  const saveToLayout = () => {
    if (!layout || !accountId) return;
    setLayoutTheme(layout.id, value);
    const others = templates.accountsOnIds(layout.id).filter((id) => id !== accountId);
    for (const id of others) setOverride(id, { theme: value });
    const n = others.length + 1;
    setTouched(false);
    templates.notify(`${layout.name} theme saved to ${n.toLocaleString("en-US")} sub-account${n === 1 ? "" : "s"}.`);
  };

  return {
    value,
    write,
    revert,
    save,
    saveScoped,
    saveToLayout,
    changed: touched,
    agencyWide,
    accountId,
    layout,
    snap,
  };
}

/* ---------------------------------------------------------------------- */
/* Small pieces                                                            */
/* ---------------------------------------------------------------------- */

export function usePageTheme(): "light" | "dark" {
  return useTheme().effective.appTheme === "dark" ? "dark" : "light";
}

export function Btn({
  tone = "secondary",
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "motion-tap flex h-[36px] min-w-0 items-center justify-center gap-[6px] rounded-[8px] px-[14px] text-[14px] leading-[20px] font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary" &&
          "bg-[var(--hr-primary-600)] text-white hover:bg-[var(--hr-primary-700)] disabled:hover:bg-[var(--hr-primary-600)]",
        tone === "secondary" &&
          "bg-pg-surface text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg",
        tone === "ghost" && "px-[8px] text-pg-text hover:bg-pg-bg hover:text-pg-heading",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ViewOnlyNote() {
  return (
    <p className="flex items-start gap-[8px] rounded-[8px] bg-pg-bg px-[12px] py-[10px] text-[13px] leading-[18px] text-pg-text">
      <Eye size={14} aria-hidden="true" className="mt-[2px] shrink-0 text-pg-muted" />
      You have view-only access. Ask an agency admin to change the theme.
    </p>
  );
}

/**
 * Who a save reaches (Nov 19): agency-wide by default, the layout line when
 * themes ride on layouts.
 */
export function ThemeScopeNote({
  scope,
  compact,
  callout,
}: {
  scope: BrandingScope;
  compact?: boolean;
  /**
   * A callout box at the top of a body (Nov 19, the modal): who a save
   * reaches is the thing to know before picking anything, so it is not left
   * as a quiet line in the header.
   */
  callout?: boolean;
}) {
  const { proto } = useBranding();
  const templates = useNavTemplates();
  const line = callout
    ? "flex items-start gap-[8px] rounded-[8px] bg-[var(--hr-primary-50)] px-[12px] py-[10px] text-[14px] leading-[20px] text-[var(--hr-primary-800,#004eeb)] shadow-[inset_0_0_0_1px_var(--hr-primary-200)] [&>svg]:mt-[2px] [&>svg]:size-[16px] [&>svg]:text-[var(--hr-primary-600)]"
    : "flex items-start gap-[6px] text-[13px] leading-[18px] text-pg-muted";
  if (proto.saveTarget === "agency") {
    return (
      <p className={line}>
        <Building2 size={14} aria-hidden="true" className="mt-[2px] shrink-0" />
        <span>
          {compact
            ? "Applies to your agency and all its sub-accounts."
            : "For your agency. All sub-accounts under it get this theme."}
        </span>
      </p>
    );
  }
  if (!scope.accountId) {
    return (
      <p className={line}>
        <LayoutTemplate size={14} aria-hidden="true" className="mt-[2px] shrink-0" />
        <span>Default for every sub-account whose layout has no theme.</span>
      </p>
    );
  }
  const tpl = templates.linkedFor(scope.accountId);
  const real = tpl && tpl.id !== DEFAULT_TEMPLATE_ID && !tpl.immutable ? tpl : null;
  const n = real ? templates.accountsOn(real.id) : 0;
  return (
    <p className={line}>
      <LayoutTemplate size={14} aria-hidden="true" className="mt-[2px] shrink-0" />
      {real ? (
        <span className="min-w-0">
          Saved with the <span className="font-medium text-pg-text">{real.name}</span> layout
          {` · ${n.toLocaleString("en-US")} sub-account${n === 1 ? "" : "s"}`}
        </span>
      ) : (
        <span>This sub-account has no layout, so the theme is saved for it only.</span>
      )}
    </p>
  );
}

/** Reset to default · Cancel · Save — or the layout variants. */
function DoorFooter({
  door,
  canEdit,
  onCancel,
  onSaved,
  stacked,
  extra,
}: {
  /** Sits after Reset to default (the modal's White label link). */
  extra?: React.ReactNode;
  door: ReturnType<typeof useThemeDoor>;
  canEdit: boolean;
  onCancel: () => void;
  onSaved: () => void;
  /** Narrow (320px panel): buttons stack. */
  stacked?: boolean;
}) {
  if (!canEdit) {
    return (
      <div className="flex justify-end">
        <Btn onClick={onCancel}>Close</Btn>
      </div>
    );
  }
  // Secondary gray, like Cancel (Ashwin, Nov 19).
  const reset = (
    <Btn onClick={() => door.write({ ...DEFAULT_THEME })}>
      Reset to default
    </Btn>
  );
  if (door.layout) {
    return (
      <div className="flex flex-col gap-[8px]">
        <Btn
          tone="primary"
          disabled={!door.changed}
          onClick={() => {
            door.saveToLayout();
            onSaved();
          }}
          title={`Save to ${door.layout.name}`}
        >
          <span className="truncate">Save to {door.layout.name}</span>
        </Btn>
        <div className="flex gap-[12px]">
          <Btn onClick={onCancel} className="flex-none">
            Cancel
          </Btn>
          <Btn
            disabled={!door.changed}
            onClick={() => {
              door.save();
              onSaved();
            }}
            className="flex-1"
          >
            <span className="truncate">This sub-account only</span>
          </Btn>
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-[12px]", stacked && "flex-wrap")}>
      {reset}
      {extra}
      <span className="flex-1" />
      <Btn onClick={onCancel}>Cancel</Btn>
      <Btn
        tone="primary"
        disabled={!door.changed}
        onClick={() => {
          door.save();
          onSaved();
        }}
      >
        Save
      </Btn>
    </div>
  );
}

/** "Logo, CSS, and more" → Agency settings › Company › White label. */
/** A secondary gray button (Ashwin, Nov 19), not a link. */
function MoreOptionsLink({ onBefore, inline }: { onBefore: () => void; inline?: boolean }) {
  const { proto, openCompany } = useBranding();
  return (
    <Btn
      onClick={() => {
        onBefore();
        openCompany("White label");
      }}
      className={inline ? undefined : "self-start"}
    >
      {MORE_OPTIONS_LABELS[proto.moreOptions]}
      <ArrowRight size={14} aria-hidden="true" />
    </Btn>
  );
}

/** Esc = Cancel, for the doors that float over the app. */
export function useEscape(fn: () => void) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) fn();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fn]);
}

/* ---------------------------------------------------------------------- */
/* B — side panel                                                          */
/* ---------------------------------------------------------------------- */

export function CustomizePanel({ scope, onClose }: { scope: BrandingScope; onClose: () => void }) {
  const { canEdit } = useBrandingAccess();
  const pageTheme = usePageTheme();
  const door = useThemeDoor(scope);
  const { revert, changed } = door;

  const cancel = React.useCallback(() => {
    if (changed) revert();
    onClose();
  }, [changed, revert, onClose]);
  useEscape(cancel);

  return createPortal(
    <aside
      role="dialog"
      aria-label="Customize theme"
      data-page-theme={pageTheme}
      style={{ width: PANEL_WIDTH }}
      className="customize-panel-in fixed top-[8px] right-[8px] bottom-[8px] z-[85] flex max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[12px] bg-pg-surface font-sans shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),0_0_0_1px_var(--pg-border)]"
    >
      <style>{`
        @keyframes customize-panel-in {
          from { opacity: 0; transform: translate3d(24px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .customize-panel-in { animation: customize-panel-in var(--dur-base) var(--ease-out) both; }
      `}</style>

      <header className="flex shrink-0 flex-col gap-[4px] px-[16px] pt-[12px] pb-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <div className="flex h-[32px] items-center gap-[8px]">
          <h2 className="min-w-0 flex-1 truncate text-[16px] leading-[24px] font-semibold text-pg-heading">
            Brand &amp; theme
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={cancel}
            className="motion-tap -mr-[4px] flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <ThemeScopeNote scope={scope} compact />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-[16px]">
        <div className="flex flex-col gap-[20px]">
          {canEdit ? null : <ViewOnlyNote />}
          <ThemeEditor value={door.value} onChange={door.write} disabled={!canEdit} compact />
          {/* Edits so far stay: they are on screen and White label picks up from here. */}
          <MoreOptionsLink onBefore={onClose} />
        </div>
      </div>

      <footer className="shrink-0 px-[16px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
        <DoorFooter door={door} canEdit={canEdit} onCancel={cancel} onSaved={onClose} stacked />
      </footer>
    </aside>,
    document.body,
  );
}

/* ---------------------------------------------------------------------- */
/* D — Brand & theme modal (Nov 19)                                        */
/* ---------------------------------------------------------------------- */

/**
 * Centred, with NO scrim or blur (Ashwin, Nov 19): the point of the modal is
 * the chrome behind it changing, so the page stays at full strength. The
 * backdrop is transparent but still catches clicks, so the page underneath
 * cannot be used mid-edit — and a stray click does not throw edits away.
 */
export function BrandThemeModal({ scope, onClose }: { scope: BrandingScope; onClose: () => void }) {
  const { canEdit } = useBrandingAccess();
  const pageTheme = usePageTheme();
  const door = useThemeDoor(scope);
  const { revert, changed } = door;
  const frame = useCoachmarkFrame(pageTheme === "dark");

  const cancel = React.useCallback(() => {
    if (changed) revert();
    onClose();
  }, [changed, revert, onClose]);
  useEscape(cancel);

  return createPortal(
    <div data-page-theme={pageTheme} className="fixed inset-0 z-[95] flex items-center justify-center p-[16px] font-sans">
      <div aria-hidden="true" className="absolute inset-0" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Brand & theme"
        style={{
          width: MODAL_WIDTH,
          maxHeight: `min(${MODAL_MAX_H}px, calc(100dvh - 32px))`,
          borderColor: frame.edge,
          boxShadow: frame.shadow,
        }}
        // Without a scrim the edge has to come from the box itself: the
        // coachmark's border and shadow, so it lifts off the canvas.
        className="motion-panel-in relative flex max-w-full flex-col overflow-hidden rounded-[8px] border border-solid bg-pg-surface"
      >
        <header className="flex shrink-0 items-start gap-[12px] px-[16px] pt-[12px] pb-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
          <div className="flex min-w-0 flex-1 flex-col gap-[4px] pt-[4px]">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">Brand &amp; theme</h2>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              Changes preview on the sidebar, rail, and top bar behind this window.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={cancel}
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-[16px]">
          <div className="flex flex-col gap-[20px]">
            <ThemeScopeNote scope={scope} callout />
            {canEdit ? null : <ViewOnlyNote />}
            <ThemeEditor value={door.value} onChange={door.write} disabled={!canEdit} columns={4} />
          </div>
        </div>
        <footer className="shrink-0 px-[16px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
          <DoorFooter
            door={door}
            canEdit={canEdit}
            onCancel={cancel}
            onSaved={onClose}
            extra={<MoreOptionsLink onBefore={onClose} inline />}
          />
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------------- */
/* E — White label section / Branding tab (Nov 19)                         */
/* ---------------------------------------------------------------------- */

/**
 * The theme on the Company page: a section under White label, or the whole
 * of the Branding tab.
 *
 * Drawn the way the page draws everything else (Ashwin, Nov 20): a 16px
 * heading like "White label", then ONE row — label and description on the
 * left, one card on the right — whose parts sit apart on hairlines, like the
 * Brand card's, and whose footer carries the actions: Reset to default on the
 * left, Cancel and "Save and apply" on the right.
 *
 * "Save and apply" asks first (proto `applyConfirm`, on by default): the
 * theme reaches every sub-account, so that is said once more before it does,
 * and a toast confirms it landed.
 *
 * Leaving the page with unsaved edits puts back what was there.
 */
/*
 * Leaving the Branding and theme section with an unapplied theme (Nov 24,
 * 2026): the page's tabs call `requestLeave(go)`; while the section holds
 * unapplied edits it asks first, and `go` runs after Apply to all or Discard.
 */
let leaveGuard: ((go: () => void) => boolean) | null = null;
export function requestLeave(go: () => void) {
  if (leaveGuard?.(go)) return;
  go();
}

export function BrandingThemeSection({ asTab = false }: { asTab?: boolean }) {
  const { canEdit } = useBrandingAccess();
  const { proto } = useBranding();
  const scope = React.useMemo<BrandingScope>(() => ({ accountId: null }), []);
  const door = useThemeDoor(scope);
  const disabled = !canEdit;
  const minimal = useMinimalThemes();
  const extended = useExtendedThemes();
  const agencyWide = proto.saveTarget === "agency";
  const [confirming, setConfirming] = React.useState(false);
  const scopeAsk = useThemeScopeAsk() && agencyWide;
  /*
   * Preview the default theme (proto resetControl "toggle", Nov 24, 2026):
   * off writes the default theme as a preview, on puts back what was there.
   * Editing anything while it is off carries on from the default.
   */
  const [showDefault, setShowDefault] = React.useState(false);
  const stash = React.useRef<BrandingTheme | null>(null);
  const toggleCustom = (on: boolean) => {
    if (!on) {
      stash.current = door.value;
      door.write({ ...DEFAULT_THEME });
      setShowDefault(true);
    } else {
      if (stash.current) door.write(stash.current);
      stash.current = null;
      setShowDefault(false);
    }
  };
  const editField = (t: BrandingTheme) => {
    if (showDefault) {
      stash.current = null;
      setShowDefault(false);
    }
    door.write(t);
  };
  const [leaving, setLeaving] = React.useState<(() => void) | null>(null);

  const latest = React.useRef(door);
  React.useEffect(() => {
    latest.current = door;
  });
  const field = { value: door.value, onChange: editField, disabled };
  React.useEffect(() => {
    leaveGuard = (go) => {
      if (!latest.current.changed) return false;
      setLeaving(() => go);
      return true;
    };
    return () => {
      leaveGuard = null;
    };
  }, []);
  React.useEffect(
    () => () => {
      if (latest.current.changed) latest.current.revert();
    },
    [],
  );

  const reach = (what: "mode" | "font") =>
    (what === "mode" ? proto.modeScope : proto.fontScope) === "app"
      ? "Across the whole app."
      : "For the sidebar, sub-account rail, and top bar.";

  const apply = () => {
    setConfirming(false);
    setShowDefault(false);
    stash.current = null;
    door.save("Theme applied successfully.");
  };

  return (
    <div
      id={BRANDING_SECTION_ID}
      className={cn("flex scroll-mt-[16px] flex-col gap-[20px]", !asTab && "pt-[8px]")}
    >
      <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">Branding and theme</h2>
      {canEdit ? null : <ViewOnlyNote />}

      <PageSection
        title="Theme"
        sub={
          agencyWide
            ? `${minimal ? "Sidebar colors" : "Colors, mode, and font"} for your agency. All sub-accounts under it get this theme.`
            : "Your agency's default theme. Sub-accounts on a layout with its own theme keep that one."
        }
        dirty={door.changed}
        onCancel={() => {
          setShowDefault(false);
          stash.current = null;
          door.revert();
        }}
        onSave={
          canEdit
            ? () => {
                // "All or selected" is itself the confirmation (Nov 24).
                if (scopeAsk) {
                  void askThemeScope().then((r) => {
                    if (!r) return;
                    setShowDefault(false);
                    stash.current = null;
                    door.saveScoped(r, r === "all" ? "Theme applied successfully." : undefined);
                  });
                } else if (proto.applyConfirm) setConfirming(true);
                else apply();
              }
            : undefined
        }
        saveLabel="Apply"
        footerStart={
          proto.resetControl === "toggle" ? (
            <label
              className={cn(
                "flex items-center gap-[10px] text-[14px] leading-[20px] text-pg-text",
                !showDefault && isDefaultTheme(door.value) && "opacity-50",
              )}
              title={showDefault ? "Turn on to bring your theme back." : "Turn off to preview the default theme."}
            >
              <Switch
                label="Customizations"
                checked={!showDefault}
                disabled={disabled || (!showDefault && isDefaultTheme(door.value))}
                onChange={toggleCustom}
              />
              {showDefault ? "Showing default theme" : "Customizations"}
            </label>
          ) : (
            <button
              type="button"
              onClick={() => door.write({ ...DEFAULT_THEME })}
              disabled={isDefaultTheme(door.value)}
              className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset to default
            </button>
          )
        }
      >
        <div className="flex flex-col [&>*+*]:mt-[16px] [&>*+*]:border-t [&>*+*]:border-pg-border [&>*+*]:pt-[16px]">
          {minimal ? null : (
            <ThemePart label="Color mode" hint={`Light, dark, or match this device's setting. ${reach("mode")}`}>
              <ColorModeField {...field} />
            </ThemePart>
          )}
          <ThemePart label="Theme" hint="Pick a theme, or set your own colors. They preview as you edit.">
            <div className="flex flex-col gap-[16px]">
              <ThemePicker {...field} columns={4} />
              {isDefaultTheme(door.value) ? null : <ContrastWarnings theme={door.value} showPass={false} />}
            </div>
          </ThemePart>
          {minimal ? null : (<>
          <ThemePart label="Window gradient" hint="One gradient across the sidebar, rail, and top bar.">
            <label className="flex items-center justify-between gap-[12px] text-[14px] leading-[20px] text-pg-text">
              Show a window gradient
              <Switch
                label="Window gradient"
                checked={door.value.gradient}
                disabled={disabled}
                onChange={(gradient) => door.write({ ...door.value, gradient })}
              />
            </label>
          </ThemePart>
          <ThemePart label="Font" hint={reach("font")}>
            <FontField {...field} bare />
          </ThemePart>
          </>)}
          {extended ? (
            <ThemePart label="Extended" hint="Fine-tune the sidebar's text, icons, and corners.">
              <ExtendedThemeFields {...field} />
            </ThemePart>
          ) : null}
        </div>
      </PageSection>

      {confirming ? (
        <Modal
          title="Apply to all sub-accounts?"
          width={440}
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={apply}
                className="motion-tap h-[36px] rounded-[8px] bg-brand px-[14px] text-[14px] font-medium text-white hover:brightness-95 active:scale-[0.98]"
              >
                Apply
              </button>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            {agencyWide
              ? `This theme will apply to your agency and all ${SUB_ACCOUNT_COUNT.toLocaleString("en-US")} sub-accounts under it.`
              : "This theme will apply to your agency and every sub-account that isn't on a layout with its own theme."}
          </p>
        </Modal>
      ) : null}

      {leaving ? (
        <Modal
          title="Apply your theme?"
          width={440}
          onClose={() => setLeaving(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  const go = leaving;
                  setLeaving(null);
                  setShowDefault(false);
                  stash.current = null;
                  door.revert();
                  go();
                }}
                className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
              >
                Discard
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  const go = leaving;
                  setLeaving(null);
                  setShowDefault(false);
                  stash.current = null;
                  door.saveScoped("all", "Theme applied successfully.");
                  // After the save renders, so the unmount sees nothing unsaved
                  // and does not put the old theme back.
                  setTimeout(go, 0);
                }}
                className="motion-tap h-[36px] rounded-[8px] bg-brand px-[14px] text-[14px] font-medium text-white hover:brightness-95 active:scale-[0.98]"
              >
                Apply to all
              </button>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            You haven&apos;t applied your theme. If you leave, your preview switches back to the theme you have now.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}

const SUB_ACCOUNT_COUNT = ALL_ACCOUNTS.length;

/** One part of the theme card: a 13px label and hint over its control. */
function ThemePart({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <div>
        <p className="text-[14px] leading-[20px] font-medium text-pg-heading">{label}</p>
        <p className="text-[13px] leading-[18px] text-pg-muted">{hint}</p>
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* C — edit-mode palette                                                   */
/* ---------------------------------------------------------------------- */

export function EditPalette({
  scope,
  anchor,
  session,
  onClose,
}: {
  scope: BrandingScope;
  anchor: HTMLElement;
  /**
   * True: opened from the nav edit card, saved/discarded with the session.
   * False: the "Popover beside button" door, with its own Save/Cancel.
   */
  session: boolean;
  onClose: () => void;
}) {
  const { live, proto, openCompany } = useBranding();
  const { canEdit } = useBrandingAccess();
  const pageTheme = usePageTheme();
  const door = useThemeDoor(scope);
  const { ref, top, left } = useAnchored(anchor, PALETTE_WIDTH, 6);
  const agencyWide = proto.saveTarget === "agency";
  const scopeAsk = useThemeScopeAsk();

  // Every write is part of the open edit session: the first one records what
  // Discard goes back to.
  const change = (theme: BrandingTheme) => {
    if (!session) return door.write(theme);
    if (agencyWide) noteThemeEdit("all", snapshotOf(live));
    else noteThemeEdit(scope.accountId ?? "agency", scope.accountId ? live.overrides[scope.accountId]?.theme : live.agency.theme);
    door.write(theme);
  };

  // Outside the session, closing is Cancel: only Save keeps edits.
  const { revert, changed } = door;
  const dismiss = React.useCallback(() => {
    if (!session && changed) revert();
    onClose();
  }, [session, changed, revert, onClose]);

  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor.contains(t)) return;
      // The font list is portalled out of the palette but belongs to it.
      if ((t as Element).closest?.("[data-branding-portal]")) return;
      dismiss();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) dismiss();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [anchor, dismiss, ref]);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="Theme"
      data-page-theme={pageTheme}
      style={{ top, left, width: PALETTE_WIDTH }}
      className="motion-panel-in fixed z-[72] flex max-h-[calc(100vh-16px)] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[8px] bg-pg-surface font-sans shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),0_0_0_1px_var(--pg-border)]"
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-[16px]">
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[4px]">
            <h3 className="text-[16px] leading-[24px] font-semibold text-pg-heading">Brand &amp; theme</h3>
            {session ? (
              <p className="text-[13px] leading-[18px] text-pg-muted">
                {agencyWide
                  ? scopeAsk
                    ? "Saved with your navigation changes. You'll choose which sub-accounts get it when you save."
                    : "Saved with your navigation changes. Applies to your agency and all its sub-accounts."
                  : "Saved with your navigation changes, into the layout you save."}
              </p>
            ) : (
              <ThemeScopeNote scope={scope} />
            )}
          </div>
          <ThemeEditor value={door.value} onChange={change} disabled={!canEdit} />
        </div>
      </div>
      {session ? null : (
        <div className="shrink-0 px-[16px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
          <DoorFooter door={door} canEdit={canEdit} onCancel={dismiss} onSaved={onClose} />
        </div>
      )}
      <div className="flex shrink-0 items-center px-[16px] py-[10px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
        <Btn
          onClick={() => {
            onClose();
            openCompany("White label");
          }}
        >
          {MORE_OPTIONS_LABELS[proto.moreOptions]}
          <ArrowRight size={14} aria-hidden="true" />
        </Btn>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------------- */
/* Host — mounted once, in the app shell                                    */
/* ---------------------------------------------------------------------- */

/**
 * Mounts the panel, the modal and the palette, and registers how the edit
 * session puts a theme back on Discard. Rendered by AppShell, which knows the
 * scope.
 */
export function CustomizeThemeHost({ accountId, accountName }: BrandingScope) {
  const { panelOpen, setPanelOpen, themeModalOpen, setThemeModalOpen, setAgencyTheme, setOverride, writeState } =
    useBranding();
  const { visible } = useBrandingAccess();
  const anchor = useEditPaletteAnchor();
  const session = useEditPaletteSession();
  const editing = useNavLayout().state.editing;
  const scope = React.useMemo(() => ({ accountId, accountName }), [accountId, accountName]);

  const writers = React.useRef({ setAgencyTheme, setOverride, writeState });
  React.useEffect(() => {
    writers.current = { setAgencyTheme, setOverride, writeState };
  }, [setAgencyTheme, setOverride, writeState]);
  React.useEffect(() => {
    registerThemeRestore((key, original) => {
      const w = writers.current;
      if (key === "all") w.writeState((s) => restoreSnapshot(s, original as ThemeSnapshot));
      else if (key === "agency") w.setAgencyTheme((original as BrandingTheme | undefined) ?? DEFAULT_THEME);
      else w.setOverride(key, { theme: original as BrandingTheme | undefined });
    });
    return () => registerThemeRestore(null);
  }, []);

  // The session palette belongs to edit mode: leaving it (Save or Discard) closes it.
  React.useEffect(() => {
    if (!editing && anchor && session) setEditPaletteAnchor(null);
  }, [editing, anchor, session]);

  const closePanel = React.useCallback(() => setPanelOpen(false), [setPanelOpen]);
  const closeModal = React.useCallback(() => setThemeModalOpen(false), [setThemeModalOpen]);
  const closePalette = React.useCallback(() => setEditPaletteAnchor(null), []);

  return (
    <>
      {panelOpen && visible ? (
        // Keyed by scope: switching account mid-panel starts a fresh Cancel point.
        <CustomizePanel key={accountId ?? "agency"} scope={scope} onClose={closePanel} />
      ) : null}
      {themeModalOpen && visible ? (
        <BrandThemeModal key={accountId ?? "agency"} scope={scope} onClose={closeModal} />
      ) : null}
      {anchor && (session ? editing : visible) ? (
        <EditPalette
          key={session ? "session" : "door"}
          scope={scope}
          anchor={anchor}
          session={session}
          onClose={closePalette}
        />
      ) : null}
    </>
  );
}
