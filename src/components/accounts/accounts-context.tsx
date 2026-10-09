"use client";

import * as React from "react";

/**
 * Which sub-account the session is in, for pages that are rendered too far
 * from the shell to be handed it.
 *
 * `useAccounts` is called once, in the shell, and everything that needed
 * the answer used to be close enough to take it as a prop. Settings pages
 * reached through the product registry are not: they are rendered by
 * `product-page.tsx` from a `(view) => ReactNode` signature that carries no
 * account, and threading one through would mean widening that signature for
 * every page in the registry to serve the two that care.
 *
 * Deliberately the ID and nothing else. A page that needed the account's
 * name, logo or plan would be a page doing something this context was not
 * opened for, and the fix then is to pass the account — not to widen this
 * until it is a second copy of the session.
 */
const CurrentAccountContext = React.createContext<string>("");

export function CurrentAccountProvider({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return <CurrentAccountContext value={id}>{children}</CurrentAccountContext>;
}

/** The sub-account the session is in. Empty string outside the shell. */
export function useCurrentAccountId(): string {
  return React.useContext(CurrentAccountContext);
}
