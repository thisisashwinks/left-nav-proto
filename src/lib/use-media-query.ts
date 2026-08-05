"use client";

import * as React from "react";

/**
 * Whether a media query currently matches.
 *
 * Built on `useSyncExternalStore` rather than an effect that calls setState. The
 * effect version is what shadcn's use-mobile shipped, and Next 16 rejects it
 * outright — `react-hooks/set-state-in-effect` is an error, not a warning — because
 * it renders once with the wrong answer and then corrects itself.
 *
 * The server snapshot is always `false`, so a query that matches on load renders
 * unmatched on the server and matched on the client. That is the correct trade for
 * a media query: there is no viewport during SSR, and guessing would be worse than
 * hydrating once with a known-neutral default.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
