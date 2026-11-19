"use client";

/**
 * Doors into branding from the shell (Nov 18): who sees them, and the small
 * pieces other files drop in — the top-bar icon, the account-menu row's
 * visibility, and the nav edit-mode tool.
 *
 * No plan gate here: the prototype already gates agency features by plan, and
 * this does not add a second one. What is checked:
 *   - the prototype axes (`proto.entryPoints`, `proto.panelEntry`)
 *   - the role: only an agency admin picks a theme (sub-accounts never do)
 *   - `proto.access`: view-only still opens the panel, read-only; it never
 *     offers the edit-mode palette, which only exists to edit.
 */

import * as React from "react";
import { Palette } from "lucide-react";
import { useBranding } from "@/components/branding/branding-provider";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import type { CustomizePanelEntry } from "@/design/branding";
import { cn } from "@/lib/utils";

export function useBrandingAccess(): { visible: boolean; canEdit: boolean } {
  const { proto } = useBranding();
  const { state } = useNavLayout();
  const visible = state.role === "agency";
  return { visible, canEdit: visible && proto.access === "edit" };
}

/**
 * "Customize theme", wherever it is pressed (Nov 19): goes where
 * `proto.customizeTarget` says — the modal (default), the side panel, the
 * White label section, the tab beside White label, or Settings › Branding.
 */
export function useOpenThemeDoor(): (trigger?: HTMLElement | null) => void {
  const { proto, setPanelOpen, setThemeModalOpen, openSettings, openCompany } = useBranding();
  return React.useCallback((trigger?: HTMLElement | null) => {
    switch (proto.customizeTarget) {
      case "popover":
        // Beside whatever was pressed; a trigger that is going away (a menu
        // row) has nothing to sit beside, so it gets the modal.
        if (trigger && trigger.isConnected && !trigger.closest('[role="menu"]')) {
          return setEditPaletteAnchor(trigger, false);
        }
        return setThemeModalOpen(true);
      case "modal":
        return setThemeModalOpen(true);
      case "panel":
        return setPanelOpen(true);
      case "white-label-section":
        return openCompany("White label", BRANDING_SECTION_ANCHOR);
      case "branding-tab":
        return openCompany("Branding");
      case "settings-page":
        return openSettings();
    }
  }, [proto.customizeTarget, setPanelOpen, setThemeModalOpen, openSettings, openCompany]);
}

/** Mirrors customize-panel's BRANDING_SECTION_ID (kept here to avoid an import cycle). */
const BRANDING_SECTION_ANCHOR = "branding-theme-section";

/** The theme door's opener if `where` is the configured entry, else null. */
export function useCustomizeEntry(where: CustomizePanelEntry): ((trigger?: HTMLElement | null) => void) | null {
  const { proto } = useBranding();
  const { visible } = useBrandingAccess();
  const open = useOpenThemeDoor();
  if (!visible || !proto.entryPoints.customizePanel || proto.panelEntry !== where) return null;
  return open;
}

/* ---------------------------------------------------------------------- */
/* Agency › Company: which tab to land on (Nov 19)                         */
/* ---------------------------------------------------------------------- */

export interface CompanyTabRequest {
  tab: string;
  anchorId?: string;
  /** Bumps so the same request twice still lands. */
  n: number;
}

let companyReq: CompanyTabRequest | null = null;
let companyN = 0;
const companyListeners = new Set<() => void>();

export function requestCompanyTab(tab: string, anchorId?: string) {
  companyReq = { tab, anchorId, n: ++companyN };
  companyListeners.forEach((l) => l());
}

export function clearCompanyTabRequest() {
  companyReq = null;
}

export function useCompanyTabRequest(): CompanyTabRequest | null {
  return React.useSyncExternalStore(
    (l) => {
      companyListeners.add(l);
      return () => companyListeners.delete(l);
    },
    () => companyReq,
    () => null,
  );
}

/* ---------------------------------------------------------------------- */
/* Edit-mode palette (C): where it is anchored                             */
/* ---------------------------------------------------------------------- */

let paletteAnchor: HTMLElement | null = null;
/**
 * True when the popover belongs to the nav edit session (opened from the edit
 * card): its edits save and discard with the session. False when it is the
 * theme door (proto.customizeTarget "popover"): it brings its own Save/Cancel.
 */
let paletteSession = true;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function setEditPaletteAnchor(el: HTMLElement | null, session = true) {
  paletteAnchor = el;
  paletteSession = session;
  listeners.forEach((l) => l());
}

export function useEditPaletteAnchor(): HTMLElement | null {
  return React.useSyncExternalStore(subscribe, () => paletteAnchor, () => null);
}

export function useEditPaletteSession(): boolean {
  return React.useSyncExternalStore(subscribe, () => paletteSession, () => true);
}

/**
 * The nav edit card's branding tool, or null.
 *
 * C on: opens the palette popover. C off but the Customize panel's door is
 * "Nav edit mode": opens the panel. Neither: null, and the edit card keeps
 * its existing colour control.
 */
export function useBrandingEditTool(): { label: string; short: string; onOpen: (trigger: HTMLElement) => void } | null {
  const { proto } = useBranding();
  const { canEdit } = useBrandingAccess();
  const openDoor = useOpenThemeDoor();
  const openPanel = useCustomizeEntry("edit-mode");
  if (proto.entryPoints.editPalette && canEdit) {
    return {
      label: "Customize theme",
      short: "Theme",
      // Follows "Customize theme opens" (Nov 19). As a popover it sits on the
      // card and saves with the edit session; anything else is the door.
      onOpen: (trigger) =>
        proto.customizeTarget === "popover"
          ? setEditPaletteAnchor(paletteAnchor === trigger ? null : trigger, true)
          : openDoor(trigger),
    };
  }
  if (openPanel) {
    return { label: "Customize theme", short: "Theme", onOpen: (trigger) => openPanel(trigger) };
  }
  return null;
}

/**
 * True when the edit card should show NO theme/colour tool at all (Nov 19):
 * with agency-wide themes the theme is not part of a layout, so it has no
 * business on the layout's edit card. Only "With layouts" brings it back.
 */
export function useBrandingEditToolHidden(): boolean {
  const { proto } = useBranding();
  const { visible } = useBrandingAccess();
  return visible && proto.saveTarget === "agency";
}

/** The palette glyph in the top bar, when the panel's door is "Top bar icon". */
export function CustomizeThemeHeaderButton() {
  const open = useCustomizeEntry("top-bar");
  const { panelOpen, themeModalOpen } = useBranding();
  if (!open) return null;
  return (
    <button
      type="button"
      title="Customize theme"
      aria-label="Customize theme"
      aria-haspopup="dialog"
      aria-expanded={panelOpen || themeModalOpen}
      onClick={(e) => open(e.currentTarget)}
      className={cn(
        "relative flex size-[26px] shrink-0 items-center justify-center rounded-full",
        "motion-tap motion-press text-hdr-fg-muted hover:scale-110 hover:bg-hdr-chip hover:text-hdr-fg active:scale-95",
        (panelOpen || themeModalOpen) && "bg-hdr-chip text-hdr-fg",
      )}
    >
      <Palette size={18} aria-hidden="true" />
    </button>
  );
}
