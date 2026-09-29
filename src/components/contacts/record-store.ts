"use client";

import * as React from "react";

/**
 * What the record panels hold for one contact, kept above the drawer.
 *
 * The drawer mounts one panel at a time and unmounts it when you switch, so
 * anything a panel owned itself — a note, a linked company — would vanish the
 * moment you looked at another tab. Keeping it here, keyed by record, means a
 * task added on the inbox is still there on the contact's own page, and each
 * conversation keeps its own.
 *
 * A module-level map rather than context: the inbox and the record page are
 * separate trees, and both have to read the same answer.
 */

type Slices = Record<string, unknown>;

const store = new Map<string, Slices>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * One slice of one record's panel data, seeded on first read.
 *
 * `seed` runs once per record and slice; later calls read what was stored.
 */
export function useRecordSlice<T>(
  recordId: string,
  slice: string,
  seed: () => T,
): [T, (next: T) => void] {
  React.useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
  const slices = store.get(recordId) ?? {};
  if (!(slice in slices)) {
    slices[slice] = seed();
    store.set(recordId, slices);
  }
  const value = slices[slice] as T;
  const set = React.useCallback(
    (next: T) => {
      const s = store.get(recordId) ?? {};
      s[slice] = next;
      store.set(recordId, s);
      emit();
    },
    [recordId, slice],
  );
  return [value, set];
}
