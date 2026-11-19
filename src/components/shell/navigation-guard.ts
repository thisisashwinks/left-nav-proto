/**
 * A leave-guard for the shell (Nov 18).
 *
 * One page at a time can hold unsaved work the shell would throw away by
 * navigating — Settings › Branding is the first. That page registers a guard;
 * the shell routes every move that would unmount it (selecting a row, opening
 * a product page, switching account) through `guardNavigation`.
 *
 * While the guard is blocking, the moves are QUEUED rather than dropped, and
 * every move made in the same handler joins the same queue — a nav row's click
 * sets the selection, the product page and the managed account together, and
 * replaying half of that would land somewhere no click goes. The page shows
 * its prompt once, then calls `resolvePendingNavigation(true)` to replay the
 * whole batch or `(false)` to drop it.
 *
 * A plain module, not context: the account switcher and the shell both call
 * it, and neither should need a provider to ask "may I leave?".
 */

export interface NavigationGuard {
  /**
   * True while leaving would lose work. Read at the moment of the move.
   * `target` is the place being selected, when the move names one — a page
   * re-selecting itself is not leaving.
   */
  isBlocking: (target?: string | null) => boolean;
  /** Called once per blocked batch. Show the prompt here. */
  onBlocked: () => void;
}

let guard: NavigationGuard | null = null;
let queue: (() => void)[] | null = null;
let replaying = false;

/** Registers the page's guard. Returns the unregister. */
export function registerNavigationGuard(g: NavigationGuard): () => void {
  guard = g;
  return () => {
    if (guard === g) {
      guard = null;
      queue = null;
    }
  };
}

/** Runs `go` now, or holds it until the page's prompt is answered. */
export function guardNavigation(go: () => void, target?: string | null): void {
  if (replaying || !guard || !guard.isBlocking(target)) {
    go();
    return;
  }
  if (queue) {
    queue.push(go);
    return;
  }
  queue = [go];
  guard.onBlocked();
}

/** Answers the prompt: replay the held moves, or drop them. */
export function resolvePendingNavigation(proceed: boolean): void {
  const held = queue;
  queue = null;
  if (!proceed || !held) return;
  replaying = true;
  try {
    for (const go of held) go();
  } finally {
    replaying = false;
  }
}
