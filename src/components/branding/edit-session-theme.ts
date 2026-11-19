"use client";

/**
 * The edit-mode palette's theme is part of the nav edit session (Nov 18).
 *
 * The palette (entry C) writes the theme live, so the chrome previews as you
 * pick — but it belongs to the session: Save keeps it (and "Save to <layout>"
 * captures it into the layout via nav-templates), Discard puts back what was
 * there when the palette first touched it.
 *
 * A module store, not a context, because the session's two exits live in
 * NavLayoutProvider, which sits ABOVE BrandingProvider: it can call
 * `endThemeSession` without needing the branding store, and the palette host
 * (inside both) registers the function that actually restores a theme.
 */

import * as React from "react";
/**
 * "agency" for the agency default theme, "all" for an agency-wide edit
 * (proto.saveTarget "agency", Nov 19), else a sub-account id.
 */
export type ThemeSessionKey = string;

interface Session {
  key: ThemeSessionKey;
  /** What to restore on discard — whatever the registered restorer expects for `key`. */
  original: unknown;
}

let session: Session | null = null;
let restore: ((key: ThemeSessionKey, original: unknown) => void) | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Called by the palette before its first write in a session. */
export function noteThemeEdit(key: ThemeSessionKey, original: unknown) {
  if (session && session.key === key) return;
  // A second scope in one session (rare: switching account mid-edit) — the
  // first one's edits are kept, like the nav edits that came with them.
  session = { key, original };
  emit();
}

/** Called by NavLayoutProvider when the edit session ends. */
export function endThemeSession(kind: "save" | "discard") {
  if (!session) return;
  const s = session;
  session = null;
  if (kind === "discard") restore?.(s.key, s.original);
  emit();
}

export function registerThemeRestore(
  fn: ((key: ThemeSessionKey, original: unknown) => void) | null,
) {
  restore = fn;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** True while the palette has changed the theme in the open edit session. */
export function useThemeSessionPending(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => session !== null,
    () => false,
  );
}
