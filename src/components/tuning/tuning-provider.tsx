"use client";

import * as React from "react";
import {
  TUNING_DEFAULTS,
  tuningToCssVars,
  type TuningState,
} from "@/design/tuning";

interface TuningContextValue {
  state: TuningState;
  set: <K extends keyof TuningState>(key: K, value: TuningState[K]) => void;
  reset: () => void;
  /** True when nothing has been changed from the measured design values. */
  isDefault: boolean;
}

const TuningContext = React.createContext<TuningContextValue | null>(null);

export function useTuning(): TuningContextValue {
  const ctx = React.useContext(TuningContext);
  if (!ctx) throw new Error("useTuning must be used inside <TuningProvider>");
  return ctx;
}

/**
 * Writes the tuning knobs to <html> as CSS custom properties.
 *
 * Values live on the document rather than in React props so a knob repaints the
 * whole app through CSS alone — no component re-renders, which keeps dragging a
 * slider smooth even with the table mounted.
 */
export function TuningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<TuningState>(TUNING_DEFAULTS);

  React.useEffect(() => {
    const root = document.documentElement;
    const vars = tuningToCssVars(state);
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
  }, [state]);

  const value = React.useMemo<TuningContextValue>(
    () => ({
      state,
      set: (key, v) => setState((s) => ({ ...s, [key]: v })),
      reset: () => setState(TUNING_DEFAULTS),
      isDefault: (Object.keys(TUNING_DEFAULTS) as (keyof TuningState)[]).every(
        (k) => state[k] === TUNING_DEFAULTS[k],
      ),
    }),
    [state],
  );

  return <TuningContext value={value}>{children}</TuningContext>;
}
