"use client";

import * as React from "react";
import {
  TUNING_DEFAULTS,
  tuningToCssVars,
  type TuningState,
} from "@/design/tuning";

interface TuningContextValue {
  /** The active account's knobs — what the live nav renders. */
  state: TuningState;
  set: <K extends keyof TuningState>(key: K, value: TuningState[K]) => void;
  reset: () => void;
  /** True when nothing has been changed from the measured design values. */
  isDefault: boolean;
  /** Whose knobs the live nav wears. The shell sets it on every switch. */
  setActiveAccount: (accountId: string | null) => void;
  /** Per-account access: each account carries its own tuning. */
  stateFor: (accountId: string) => TuningState;
  setFor: <K extends keyof TuningState>(
    accountId: string,
    key: K,
    value: TuningState[K],
  ) => void;
}

const TuningContext = React.createContext<TuningContextValue | null>(null);

export function useTuning(): TuningContextValue {
  const ctx = React.useContext(TuningContext);
  if (!ctx) throw new Error("useTuning must be used inside <TuningProvider>");
  return ctx;
}

/** The anonymous profile used before any account is active. */
const BASE_ID = "__platform__";

/**
 * The design defaults as a stylesheet, so the FIRST paint already wears them.
 *
 * The knobs are written to <html> in an effect, which runs after the server's
 * HTML has painted — and until then every `var(--t-nav-py, 9px)` fell back to
 * its inline fallback, which is not the default (8). Rows painted 38px tall and
 * snapped to 36 a third of a second later; Ashwin caught the whole nav
 * shrinking on reload, Oct 19. Rendered by the server, this block is there
 * before any script runs. The effect still writes the live values inline on
 * <html>, which outranks it, so a tuned account wins once it is active.
 */
const DEFAULTS_CSS = `:root{${Object.entries(tuningToCssVars(TUNING_DEFAULTS))
  .map(([name, value]) => `${name}:${value}`)
  .join(";")}}`;

/**
 * Writes the tuning knobs to <html> as CSS custom properties.
 *
 * Values live on the document rather than in React props so a knob repaints the
 * whole app through CSS alone — no component re-renders, which keeps dragging a
 * slider smooth even with the table mounted.
 *
 * Knobs are kept per account: density is part of a tenant's own look, so
 * every account carries its own profile and switching accounts swaps the
 * variables. Accounts that were never tuned share the design defaults.
 */
export function TuningProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = React.useState<Record<string, TuningState>>(
    {},
  );
  const [activeId, setActiveId] = React.useState<string>(BASE_ID);

  const state = profiles[activeId] ?? TUNING_DEFAULTS;

  React.useEffect(() => {
    const root = document.documentElement;
    const vars = tuningToCssVars(state);
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
  }, [state]);

  const setFor = React.useCallback(
    <K extends keyof TuningState>(
      accountId: string,
      key: K,
      value: TuningState[K],
    ) =>
      setProfiles((all) => ({
        ...all,
        [accountId]: { ...(all[accountId] ?? TUNING_DEFAULTS), [key]: value },
      })),
    [],
  );

  const value = React.useMemo<TuningContextValue>(
    () => ({
      state,
      set: (key, v) => setFor(activeId, key, v),
      reset: () =>
        setProfiles((all) => ({ ...all, [activeId]: TUNING_DEFAULTS })),
      isDefault: (Object.keys(TUNING_DEFAULTS) as (keyof TuningState)[]).every(
        (k) => state[k] === TUNING_DEFAULTS[k],
      ),
      setActiveAccount: (accountId) => setActiveId(accountId ?? BASE_ID),
      stateFor: (accountId) => profiles[accountId] ?? TUNING_DEFAULTS,
      setFor,
    }),
    [state, activeId, profiles, setFor],
  );

  return (
    <TuningContext value={value}>
      <style>{DEFAULTS_CSS}</style>
      {children}
    </TuningContext>
  );
}
