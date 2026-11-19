"use client";

import * as React from "react";
import {
  DEFAULT_BRANDING,
  DEFAULT_BRANDING_PROTO,
  type AgencyBranding,
  type BrandingProto,
  type BrandingState,
  type BrandingTheme,
  type BrandAssets,
  type Mode,
  type SubAccountBranding,
} from "@/design/branding";

/**
 * The branding store (Nov 18). One source for every door into branding:
 *
 *   A  Settings › Branding  edits a DRAFT. The live app paints the draft so
 *                           the preview is the real chrome; Save commits,
 *                           Discard drops it, leaving with edits prompts.
 *   B  Customize panel      writes `saved` directly — Slack-style, instant.
 *   C  Edit-mode palette    writes `saved` directly.
 *
 * `live` is what the app should paint right now: the draft while one is open,
 * else what was saved. The applier (branding-applier.tsx) reads only `live`.
 *
 * Everything here is session-only: a reload (⌘R) puts the theme AND the
 * branding prototype controls (`proto`) back to their defaults (Ashwin,
 * Nov 18 for the theme, Nov 19 for the controls). Nothing is read from or
 * written to storage.
 */

export interface BrandingContextValue {
  /** Committed branding. */
  saved: BrandingState;
  /** Open draft from the settings page, or null. */
  draft: BrandingState | null;
  /** What the app paints: draft ?? saved. */
  live: BrandingState;
  /** True when a draft exists and differs from saved. */
  dirty: boolean;

  /* --- draft lifecycle (settings page) --- */
  beginDraft: () => void;
  updateDraft: (fn: (d: BrandingState) => BrandingState) => void;
  /**
   * Saves the draft. `transform` (additive, Nov 18) adjusts what is saved —
   * the settings page uses it to copy a changed layout theme onto the accounts
   * linked to that layout in the same commit.
   */
  commitDraft: (transform?: (d: BrandingState) => BrandingState) => void;
  discardDraft: () => void;

  /* --- direct writes (customize panel, edit palette) --- */
  /** Writes to the draft if one is open, else straight to saved. */
  setAgencyTheme: (theme: BrandingTheme) => void;
  setAgencyAssets: (patch: Partial<BrandAssets>) => void;
  setOverride: (accountId: string, patch: SubAccountBranding | null) => void;
  /** Theme a layout (nav template) carries; null removes it. */
  setLayoutTheme: (layoutId: string, theme: BrandingTheme | null) => void;
  resetAll: () => void;
  /** Any change to the whole state, through the same draft-or-saved route. */
  writeState: (fn: (s: BrandingState) => BrandingState) => void;

  /** Brand & theme modal (Nov 19). */
  themeModalOpen: boolean;
  setThemeModalOpen: (open: boolean) => void;
  /**
   * Opens Agency settings › Company on a tab ("White label" or "Branding"),
   * optionally scrolled to an element id. The shell registers the navigator.
   */
  openCompany: (tab: string, anchorId?: string) => void;
  registerOpenCompany: (fn: ((tab: string, anchorId?: string) => void) | null) => void;

  /**
   * Preview-only appearance. Null = follow the app's own light/dark. The
   * settings page and panel set it so a reviewer can see dark without
   * switching the whole prototype.
   */
  previewMode: Mode | null;
  setPreviewMode: (m: Mode | null) => void;

  /** Customize side panel (B) open state. */
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;

  /**
   * Open Settings › Branding from anywhere (panel B, palette C). The app shell
   * registers the real navigator; until it does this is a no-op.
   */
  openSettings: () => void;
  registerOpenSettings: (fn: (() => void) | null) => void;

  /** Prototype-control axes. */
  proto: BrandingProto;
  setProto: (patch: Partial<BrandingProto>) => void;
}

const BrandingContext = React.createContext<BrandingContextValue | null>(null);

/** Null outside <BrandingProvider> instead of throwing — for shared hooks. */
export function useBrandingOptional(): BrandingContextValue | null {
  return React.useContext(BrandingContext);
}

export function useBranding(): BrandingContextValue {
  const ctx = React.useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used inside <BrandingProvider>");
  return ctx;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = React.useState<BrandingState>(DEFAULT_BRANDING);
  const [proto, setProtoState] = React.useState<BrandingProto>(DEFAULT_BRANDING_PROTO);
  const [draft, setDraft] = React.useState<BrandingState | null>(null);
  const [previewMode, setPreviewMode] = React.useState<Mode | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const openSettingsRef = React.useRef<(() => void) | null>(null);
  const openCompanyRef = React.useRef<((tab: string, anchorId?: string) => void) | null>(null);
  const [themeModalOpen, setThemeModalOpen] = React.useState(false);

  // Writes go to the draft when one is open so the settings page's Save/Discard
  // covers them; otherwise they are instant.
  const draftOpen = draft !== null;
  const write = React.useCallback(
    (fn: (s: BrandingState) => BrandingState) => {
      if (draftOpen) setDraft((d) => (d ? fn(d) : d));
      else setSaved(fn);
    },
    [draftOpen],
  );

  const value = React.useMemo<BrandingContextValue>(() => {
    const live = draft ?? saved;
    return {
      saved,
      draft,
      live,
      dirty: draft !== null && !same(draft, saved),
      beginDraft: () => setDraft((d) => d ?? saved),
      updateDraft: (fn) => setDraft((d) => fn(d ?? saved)),
      commitDraft: (transform) => {
        if (draft) setSaved(transform ? transform(draft) : draft);
        setDraft(null);
      },
      discardDraft: () => setDraft(null),
      setAgencyTheme: (theme) =>
        write((s) => ({ ...s, agency: { ...s.agency, theme } satisfies AgencyBranding })),
      setAgencyAssets: (patch) =>
        write((s) => ({ ...s, agency: { ...s.agency, assets: { ...s.agency.assets, ...patch } } })),
      setOverride: (accountId, patch) =>
        write((s) => {
          const overrides = { ...s.overrides };
          if (patch === null) delete overrides[accountId];
          else overrides[accountId] = { ...overrides[accountId], ...patch };
          return { ...s, overrides };
        }),
      setLayoutTheme: (layoutId, theme) =>
        write((s) => {
          const layoutThemes = { ...s.layoutThemes };
          if (theme === null) delete layoutThemes[layoutId];
          else layoutThemes[layoutId] = theme;
          return { ...s, layoutThemes };
        }),
      resetAll: () => {
        setDraft(null);
        setSaved(DEFAULT_BRANDING);
      },
      writeState: (fn) => write(fn),
      themeModalOpen,
      setThemeModalOpen,
      openCompany: (tab, anchorId) => openCompanyRef.current?.(tab, anchorId),
      registerOpenCompany: (fn) => {
        openCompanyRef.current = fn;
      },
      previewMode,
      setPreviewMode,
      panelOpen,
      setPanelOpen,
      openSettings: () => openSettingsRef.current?.(),
      registerOpenSettings: (fn) => {
        openSettingsRef.current = fn;
      },
      proto,
      setProto: (patch) => setProtoState((p) => ({ ...p, ...patch })),
    };
  }, [saved, draft, previewMode, panelOpen, themeModalOpen, proto, write]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
