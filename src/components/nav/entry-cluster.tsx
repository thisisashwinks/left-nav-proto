"use client";

import { Search } from "lucide-react";
import { AiOrb } from "@/components/ai/ai-orb";
import type { AiSession } from "@/components/ai/use-ai-session";
import { Kbd } from "@/components/search/kbd";

/**
 * Search and Ask AI together, directly under the logo.
 *
 * The review's open question: should Ask AI be the very first thing a user meets
 * on entry, above Favorites, rather than holding the nav's bottom edge? And
 * separately — should search come down out of the logo row and sit next to it?
 * This answers both at once, because the two only make sense together: search in
 * the header and AI at the bottom are the *same* job at opposite ends of the nav,
 * which is exactly the overlap the review flagged.
 *
 * They stay two controls rather than one merged input. Merging is the long-term
 * direction, but a single field that is sometimes a filter and sometimes a
 * conversation is a bigger question than placement, and answering both at once
 * would make the placement test unreadable.
 */

/** 36px row plus 12px below it. The nav's absolute geometry needs this exact. */
export const ENTRY_CLUSTER_HEIGHT = 48;

/** Stacked 38px buttons with 4px between them, in the 64px rail. */
export const ENTRY_CLUSTER_RAIL_HEIGHT = 42;

export function EntryCluster({
  onSearch,
  session,
}: {
  onSearch: () => void;
  session: AiSession;
}) {
  return (
    <div className="flex w-full shrink-0 items-center gap-[8px] px-[12px] pb-[12px]">
      <button
        type="button"
        onClick={onSearch}
        className="motion-tap flex h-[36px] min-w-0 flex-1 items-center gap-[9px] rounded-[10px] px-[10px] text-left shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover"
      >
        <Search size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
        <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] text-nav-fg-subtle">
          Search
        </span>
        <Kbd>⌘K</Kbd>
      </button>

      <button
        type="button"
        title="Ask AI"
        aria-label="Ask AI"
        onClick={() => session.launch()}
        // The orb is the button at this size, as in the rail — chrome around it
        // would make it the third bordered box in a 248px row.
        className="motion-tap relative flex size-[36px] shrink-0 items-center justify-center rounded-full hover:scale-105 active:scale-95 motion-press"
      >
        {session.open ? (
          <span
            aria-hidden="true"
            className="motion-ai-pulse absolute inset-[-3px] rounded-full ring-2 ring-[var(--ai-ring)]"
          />
        ) : null}
        <AiOrb size={36} state={session.state} glow />
      </button>
    </div>
  );
}

/**
 * The same pair for the 64px rail, stacked because two 38px buttons will not sit
 * side by side in it.
 */
export function EntryClusterRail({
  onSearch,
  session,
}: {
  onSearch: () => void;
  session: AiSession;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-[4px]">
      <button
        type="button"
        title="Search"
        aria-label="Search"
        onClick={onSearch}
        className="motion-tap flex size-[38px] shrink-0 items-center justify-center rounded-[9px] text-nav-fg-subtle hover:scale-105 hover:bg-nav-hover hover:text-nav-fg-muted active:scale-95"
      >
        <Search size={16} aria-hidden="true" />
      </button>

      <button
        type="button"
        title="Ask AI"
        aria-label="Ask AI"
        onClick={() => session.launch()}
        className="motion-tap relative flex size-[38px] shrink-0 items-center justify-center rounded-full hover:scale-105 active:scale-95 motion-press"
      >
        {session.open ? (
          <span
            aria-hidden="true"
            className="motion-ai-pulse absolute inset-[-3px] rounded-full ring-2 ring-[var(--ai-ring)]"
          />
        ) : null}
        <AiOrb size={38} state={session.state} glow />
      </button>
    </div>
  );
}
