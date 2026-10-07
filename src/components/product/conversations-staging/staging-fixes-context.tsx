"use client";

/*
 * Which checkpoint fixes the staging copy is drawn with (design/staging-fixes.ts).
 * Empty for "Staging", the ticked leaves for "Staging fixed".
 */

import * as React from "react";

const FixesContext = React.createContext<ReadonlySet<string>>(new Set());

export function StagingFixesProvider({
  fixes,
  children,
}: {
  fixes: readonly string[];
  children: React.ReactNode;
}) {
  const set = React.useMemo(() => new Set(fixes), [fixes]);
  return <FixesContext.Provider value={set}>{children}</FixesContext.Provider>;
}

/** Whether a fix is on. Always false on "Staging", which stays as built. */
export function useFix(id: string): boolean {
  return React.useContext(FixesContext).has(id);
}
