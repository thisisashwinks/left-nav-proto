"use client";

import { Search } from "lucide-react";
import { AiOrb } from "@/components/ai/ai-orb";
import type { AiSession } from "@/components/ai/use-ai-session";
import { Kbd } from "@/components/search/kbd";
import { RailTooltip } from "./rail-tooltip";

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

/**
 * What the rail's cluster adds over the single search button it replaces: a second
 * 38px button, the 4px rail gap above it, and 8px of clearance below.
 *
 * The clearance is the point. Stacked, the orb ended up directly against the
 * favourites capsule with only the rail's 4px gap between them, and two round
 * things 4px apart read as one control. 8px separates the entry point from the
 * dock without opening a hole in a 64px rail.
 */
export const ENTRY_CLUSTER_RAIL_HEIGHT = 38 + 4 + 8;

export function EntryCluster({
  onSearch,
  session,
}: {
  onSearch: () => void;
  session: AiSession;
}) {
  return (
    <div className="flex w-full shrink-0 px-[12px] pb-[12px]">
      {/*
        One control, two targets.

        A field and a separate orb beside it read as two features that happen to
        be adjacent, which is the overlap the review wanted closed. Sharing one
        border makes them one thing you can either type into or ask — the "smart
        unified input" direction, without yet merging the *behaviours*, which is a
        much bigger question than placement.

        A div, not a button: it holds two controls, and nesting buttons is invalid
        markup that browsers resolve inconsistently.
      */}
      <div className="motion-tap flex h-[36px] w-full items-center rounded-[10px] pr-[10px] pl-[4px] shadow-[inset_0_0_0_1px_var(--nav-divider)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]">
        {/*
          AI leads, and it says so.

          The review's finding was that the orb alone is not identifiable as an AI
          assistant — there is no established icon for one the way there is for
          search, so a glyph on its own has nothing to trade on. The words are the
          fix. Putting it first also makes the reading order match the intent: this
          is an assistant you can also search with, not a search box with a robot
          bolted to the end.
        */}
        <button
          type="button"
          title="Ask AI"
          onClick={() => session.launch()}
          className="motion-tap relative flex h-[28px] shrink-0 items-center gap-[6px] rounded-full pr-[8px] pl-[2px] hover:bg-nav-hover active:scale-95 motion-press"
        >
          {session.open ? (
            <span
              aria-hidden="true"
              className="motion-ai-pulse absolute top-1/2 left-[2px] size-[28px] -translate-y-1/2 rounded-full ring-2 ring-[var(--ai-ring)]"
            />
          ) : null}
          <AiOrb size={28} state={session.state} glow />
          <span className="text-[13px] leading-[normal] font-medium whitespace-nowrap text-nav-fg">
            Ask AI
          </span>
        </button>

        {/* Reads as the seam between the two halves of one control. */}
        <span
          aria-hidden="true"
          className="mx-[8px] h-[16px] w-px shrink-0 bg-nav-divider"
        />

        <button
          type="button"
          onClick={onSearch}
          className="flex h-full min-w-0 flex-1 items-center gap-[8px] text-left"
        >
          <Search size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] text-nav-fg-subtle">
            Search
          </span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>
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
    <div className="flex shrink-0 flex-col items-center gap-[4px] pb-[8px]">
      {/*
        AI first here too, so the order survives collapsing. The rail has no room
        for the label, so the tooltip carries the name — which is why AI keeps the
        leading position: it is the one of the two whose glyph does not explain
        itself, and being first is the only ordering cue left.
      */}
      <RailTooltip label="Ask AI">
        <button
          type="button"
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
      </RailTooltip>

      <RailTooltip label="Search">
        <button
          type="button"
          aria-label="Search"
          onClick={onSearch}
          className="motion-tap flex size-[38px] shrink-0 items-center justify-center rounded-[9px] text-nav-fg-subtle hover:scale-105 hover:bg-nav-hover hover:text-nav-fg-muted active:scale-95"
        >
          <Search size={16} aria-hidden="true" />
        </button>
      </RailTooltip>
    </div>
  );
}
