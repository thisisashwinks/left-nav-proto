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
}

export type BrandKind = keyof BrandUpload;

interface BrandValue {
  uploads: Record<string, BrandUpload>;
  set: (accountId: string, kind: BrandKind, src: string) => void;
  clear: (accountId: string, kind: BrandKind) => void;
}

const BrandContext = React.createContext<BrandValue | null>(null);

export function useBrand(): BrandValue {
  const ctx = React.useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside <BrandProvider>");
  return ctx;
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = React.useState<Record<string, BrandUpload>>({});

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
    () => ({ uploads, set, clear }),
    [uploads, set, clear],
  );

  return <BrandContext value={value}>{children}</BrandContext>;
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
): Account {
  const up = uploads[account.id];
  if (!up || (up.logoSrc === undefined && up.wordmarkSrc === undefined)) {
    return account;
  }
  return {
    ...account,
    ...(up.logoSrc !== undefined ? { logoSrc: up.logoSrc } : {}),
    ...(up.wordmarkSrc !== undefined ? { wordmarkSrc: up.wordmarkSrc } : {}),
  };
}
