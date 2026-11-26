"use client";

import * as React from "react";
import type { Account } from "./accounts-data";

/**
 * The logos an account has uploaded.
 *
 * Held apart from `accounts-data.ts` because that file is the seed and this is
 * session state — but merged back onto the Account before anything renders, so
 * the twelve places that draw a mark keep taking one object and know nothing
 * about uploads. A logo that only reached the settings page would prove
 * nothing; the point of the pair is what the nav does with it.
 */

export interface BrandUpload {
  /** The square mark. */
  logoSrc?: string;
  /** The wide logo. */
  wordmarkSrc?: string;
  /**
   * Dark-sidebar versions (proto darkLogos*, Nov 26, 2026): used instead of
   * the two above while the sidebar (wordmark) or rail (icon) is dark.
   */
  logoDarkSrc?: string;
  wordmarkDarkSrc?: string;
}

export type BrandKind = keyof BrandUpload;

/**
 * The initials avatar's background, when there is no square icon (Nov 20).
 * Taken from the full logo by default; `custom` once someone picked it, so
 * a new logo no longer repaints it.
 */
export interface AvatarTile {
  from: string;
  to: string;
  /** The colour it was made from — what the picker shows as selected. */
  color: string;
  custom: boolean;
}

interface BrandValue {
  uploads: Record<string, BrandUpload>;
  set: (accountId: string, kind: BrandKind, src: string) => void;
  clear: (accountId: string, kind: BrandKind) => void;
  avatars: Record<string, AvatarTile>;
  setAvatar: (accountId: string, tile: AvatarTile | null) => void;
  /**
   * The name read off an uploaded full logo (Nov 23): the account takes it,
   * and its initials avatar follows. Null puts the seeded name back.
   */
  names: Record<string, BrandName>;
  setName: (accountId: string, name: BrandName | null) => void;
}

export interface BrandName {
  name: string;
  initials: string;
}

const BrandContext = React.createContext<BrandValue | null>(null);

export function useBrand(): BrandValue {
  const ctx = React.useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside <BrandProvider>");
  return ctx;
}

/** The store, or null outside a BrandProvider. */
export function useBrandOptional(): BrandValue | null {
  return React.useContext(BrandContext);
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = React.useState<Record<string, BrandUpload>>({});
  const [avatars, setAvatars] = React.useState<Record<string, AvatarTile>>({});
  const [names, setNames] = React.useState<Record<string, BrandName>>({});
  const setName = React.useCallback(
    (accountId: string, name: BrandName | null) =>
      setNames((all) => {
        const next = { ...all };
        if (name) next[accountId] = name;
        else delete next[accountId];
        return next;
      }),
    [],
  );
  const setAvatar = React.useCallback(
    (accountId: string, tile: AvatarTile | null) =>
      setAvatars((all) => {
        const next = { ...all };
        if (tile) next[accountId] = tile;
        else delete next[accountId];
        return next;
      }),
    [],
  );

  const set = React.useCallback(
    (accountId: string, kind: BrandKind, src: string) =>
      setUploads((all) => ({
        ...all,
        [accountId]: { ...all[accountId], [kind]: src },
      })),
    [],
  );

  const clear = React.useCallback(
    (accountId: string, kind: BrandKind) =>
      setUploads((all) => {
        const next = { ...all[accountId] };
        delete next[kind];
        return { ...all, [accountId]: next };
      }),
    [],
  );

  const value = React.useMemo<BrandValue>(
    () => ({ uploads, set, clear, avatars, setAvatar, names, setName }),
    [uploads, set, clear, avatars, setAvatar, names, setName],
  );

  return <BrandContext value={value}>{children}</BrandContext>;
}

/**
 * The uploads as the current surfaces should show them: each account with
 * dark versions turned on swaps them in where its surface is dark. Returns
 * the same map when nothing changes.
 */
export function modeUploads(
  uploads: Record<string, BrandUpload>,
  dark: { sidebar: boolean; rail: boolean },
  enabled: (accountId: string) => boolean,
): Record<string, BrandUpload> {
  if (!dark.sidebar && !dark.rail) return uploads;
  let out: Record<string, BrandUpload> | null = null;
  for (const [id, up] of Object.entries(uploads)) {
    if (!enabled(id)) continue;
    const word = dark.sidebar && up.wordmarkDarkSrc ? up.wordmarkDarkSrc : up.wordmarkSrc;
    const icon = dark.rail && up.logoDarkSrc ? up.logoDarkSrc : up.logoSrc;
    if (word === up.wordmarkSrc && icon === up.logoSrc) continue;
    out ??= { ...uploads };
    out[id] = { ...up, ...(word !== undefined ? { wordmarkSrc: word } : {}), ...(icon !== undefined ? { logoSrc: icon } : {}) };
  }
  return out ?? uploads;
}

/**
 * An account wearing whatever it has uploaded this session.
 *
 * Returns the SAME object when there is nothing to apply, so the common case
 * adds no identity churn — several effects downstream compare accounts by
 * reference, and a fresh object every render would retrigger them.
 */
export function applyBrand(
  account: Account,
  uploads: Record<string, BrandUpload>,
  avatars?: Record<string, AvatarTile>,
  names?: Record<string, BrandName>,
): Account {
  const up = uploads[account.id] ?? {};
  const tile = avatars?.[account.id];
  const named = names?.[account.id];
  if (!tile && !named && (!up || (up.logoSrc === undefined && up.wordmarkSrc === undefined))) {
    return account;
  }
  const cover = up.logoSrc !== undefined;
  const logo = {
    ...account.logo,
    // The initials avatar's colour, under any square icon (which covers it).
    ...(tile ? { from: tile.from, to: tile.to, brandTile: true } : {}),
    ...(named ? { initials: named.initials } : {}),
    // An uploaded square icon fills the avatar (Nov 24).
    ...(up.logoSrc !== undefined ? { coverSrc: true } : {}),
  };
  return {
    ...account,
    ...(named ? { name: named.name } : {}),
    ...(tile || named || cover ? { logo } : {}),
    ...(up.logoSrc !== undefined ? { logoSrc: up.logoSrc, logoUploaded: true } : {}),
    ...(up.wordmarkSrc !== undefined ? { wordmarkSrc: up.wordmarkSrc, wordmarkUploaded: true } : {}),
  };
}
