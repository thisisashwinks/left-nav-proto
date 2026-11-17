"use client";

import * as React from "react";
import { ArrowUpRight, History, Search, X } from "lucide-react";
import { announce } from "@/lib/a11y";
import { cn } from "@/lib/utils";
import type { ProductSearchDismiss } from "@/design/theme";
import type { TreeNode } from "./product-tree";

/**
 * The field the tree owes the catalogue panel it replaced.
 *
 * `navProductTree` drew the whole catalogue into the column and, in doing so,
 * removed the "All products" panel — which had a search. Without one the only
 * route to the tail of a twelve-group tree is to open groups until you find
 * it, which is the scrolling problem the flyout model was built to avoid,
 * reintroduced by the arrangement meant to answer it. See `ThemeState.
 * treeSearchPlace`, which is the axis this file serves.
 *
 * Deliberately NOT the entry cluster's Search + Ask AI pill. That one is a door
 * to the shell's global search — everything the account has, records included —
 * and a second control with the same shape doing something much smaller is how
 * people learn not to trust either. This is the launcher's OWN "Search
 * products" field, kept at the same 32px/9px/inset-ring shape, because it
 * searches the same corpus the launcher's copy did.
 *
 * Nothing here is imported at render time with the axis off — `left-nav.tsx`
 * gates the whole block on `productTree`, exactly as it gates the tree rows —
 * so the flyout arrangement is untouched rather than merely unchanged.
 */

/** Empty once, so a branch with nothing forced open is not a fresh Set a memo would see as new. */
const NOTHING_OPEN: ReadonlySet<string> = new Set<string>();

/**
 * Case-insensitive substring, and nothing cleverer.
 *
 * Not fuzzy, not word-prefix, not the launcher's `context`-scored hit list. A
 * nav filter is read while you type and its job is to be PREDICTABLE — a
 * ranking that surfaces "Opportunities" for "inv" is a delight in a command
 * palette and a lie in a tree, where the rows that survive claim to be the
 * whole of what matched.
 */
export function matchesQuery(label: string, query: string): boolean {
  return label.toLowerCase().includes(query);
}

/** A branch, pruned to what matched. */
export interface TreeSearchHit {
  /** The surviving nodes — matches, plus every ancestor that leads to one. */
  nodes: TreeNode[];
  /** Ancestors of matches, which the tree must draw OPEN. */
  open: ReadonlySet<string>;
  /** True when something inside matched, as opposed to only the L1 row's label. */
  deep: boolean;
}

/**
 * Prune a branch to the matches and the paths that reach them.
 *
 * Three cases per node, in the order they are tested:
 *
 * 1. Something below it matched → keep it, keep only the surviving children,
 *    and add it to `open`. A match hidden inside a closed parent is a match the
 *    reader has to go looking for, which is the failure the field exists to
 *    remove — so "show its ancestors" is not enough on its own, the ancestors
 *    have to be standing open.
 * 2. Nothing below matched but its own label did → keep it AND everything
 *    under it, standing open. Ashwin, Nov 17.
 *
 *    This used to drop the children, on the argument that searching
 *    "Payments" and being handed Payments' nine pages is the unfiltered tree
 *    with extra steps. The argument is real and it lost to the picture: the
 *    row you matched is rarely the destination — "calendar" means one of the
 *    six pages inside Calendars, and the reader has to be able to see which.
 *    A match is a place you have ARRIVED at, so it shows you what is there.
 * 3. Neither → drop it. A branch with no match in it is noise in a list whose
 *    whole claim is that everything in it matched.
 *
 * Pure, and it copies rather than mutating: the nodes come from
 * `treeBranchFor`, which rebuilds them from the catalogue each render, and a
 * prune that edited them in place would be editing the only copy.
 */
export function searchTreeBranch(
  nodes: readonly TreeNode[],
  query: string,
): TreeSearchHit {
  const open = new Set<string>();
  const walk = (level: readonly TreeNode[]): TreeNode[] => {
    const out: TreeNode[] = [];
    for (const node of level) {
      const kids = node.children ? walk(node.children) : [];
      if (kids.length > 0) {
        open.add(node.id);
        out.push({ ...node, children: kids });
        continue;
      }
      if (matchesQuery(node.label, query)) {
        /*
         * Its whole subtree, untouched, and the node opened to show it.
         * Copied rather than referenced for the reason in the header: these
         * nodes are rebuilt each render and must not be edited in place.
         */
        if (node.children?.length) open.add(node.id);
        out.push({
          id: node.id,
          label: node.label,
          ...(node.icon ? { icon: node.icon } : {}),
          ...(node.children?.length ? { children: [...node.children] } : {}),
        });
      }
    }
    return out;
  };
  const found = walk(nodes);
  return {
    nodes: found,
    open: open.size > 0 ? open : NOTHING_OPEN,
    deep: found.length > 0,
  };
}

/** An L1 row kept only because its own label matched — its branch is untouched. */
export function wholeBranchHit(nodes: readonly TreeNode[]): TreeSearchHit {
  return { nodes: [...nodes], open: NOTHING_OPEN, deep: false };
}

/**
 * How many rows a query found, for the spoken result count: each matching
 * node in a searched branch, and one for an L1 row kept for its own label.
 */
export function countTreeHits(
  hits: ReadonlyMap<string, TreeSearchHit>,
  query: string,
): number {
  const count = (level: readonly TreeNode[]): number =>
    level.reduce(
      (n, node) =>
        n +
        (matchesQuery(node.label, query) ? 1 : 0) +
        (node.children ? count(node.children) : 0),
      0,
    );
  let total = 0;
  for (const hit of hits.values()) total += hit.deep ? count(hit.nodes) : 1;
  return total;
}

/**
 * The field itself.
 *
 * Controlled from `left-nav.tsx` rather than holding the query here, because
 * the query is not the field's business: it decides which rows the nav draws,
 * whether a click clears it, and whether the accordion is being overridden. A
 * field that owned it would have to hand all of that back up anyway, and the
 * four placements would each have needed their own instance with its own copy.
 *
 * `type="search"` for the semantics and the Escape handling browsers give it;
 * the native cancel button is hidden and replaced, because Safari's only
 * appears once you have typed and Chrome's is a different size again — the
 * same swap `pinned-launcher.tsx` makes for the same reason.
 */
export function TreeSearchField({
  query,
  onQuery,
  onClose,
  dismiss = "icon",
  autoFocus = false,
  resultCount,
  className,
}: {
  query: string;
  onQuery: (next: string) => void;
  /**
   * Put the field away, where it was summoned rather than standing.
   *
   * Absent for the placements that are always there — those have nothing to
   * dismiss, and an inert second X beside the live one would be two controls
   * for one gesture. See TreeSearchPlace.
   */
  onClose?: () => void;
  /** Which dismiss affordance is drawn. See PRODUCT_SEARCH_DISMISSES. */
  dismiss?: ProductSearchDismiss;
  /**
   * Take the caret on mount.
   *
   * True only where the field was SUMMONED. Pressing a glyph to search and
   * then having to click the thing you just conjured is the gesture failing
   * halfway. A standing field does not take focus, for the opposite reason:
   * it is there on every page load, and stealing the caret would mean
   * arriving in the nav unable to type anywhere else.
   */
  autoFocus?: boolean;
  /** What the query found, said aloud once typing settles. */
  resultCount?: number | null;
  className?: string;
}) {
  React.useEffect(() => {
    if (!query.trim() || resultCount == null) return;
    const t = window.setTimeout(
      () =>
        announce(
          resultCount === 0
            ? "No products match"
            : `${resultCount} ${resultCount === 1 ? "product" : "products"}`,
        ),
      400,
    );
    return () => window.clearTimeout(t);
  }, [query, resultCount]);
  const field = (
    <div
      className={cn(
        "flex h-[32px] items-center gap-[9px] rounded-[9px] px-[10px] shadow-[inset_0_0_0_1px_var(--nav-field-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]",
        /*
          The field gives way to the control beside it.
          
          `w-full shrink-0` is right when the field IS the row, and actively
          harmful once something shares that row: 100% of the width plus a
          button that cannot be shrunk pushes the button past the nav's edge,
          where it is clipped. It was in the DOM the whole time — which is
          why checking for its presence kept saying it was fine — and never
          once on screen. Ashwin had to report it three times. Nov 16.
        */
        onClose && dismiss !== "esc"
          ? "min-w-0 flex-1"
          : "w-full shrink-0",
        /*
          The caller's spacing belongs to whichever box is the outermost
          one. Applied here AND on the wrapper below, a `my-[4px]` was
          counted twice and the field sat 8px down instead of 4 — which is
          most of why it did not line up with the canvas. Ashwin, Nov 16.
        */
        onClose && dismiss !== "esc" ? null : className,
      )}
    >
      <Search size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
      <input
        type="search"
        // eslint-disable-next-line jsx-a11y/no-autofocus -- summoned, see above
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        /*
         * Escape, in two stages: clear, then close. Ashwin, Nov 16.
         *
         * One press with text in the field empties it; a second, on an empty
         * field, puts the search away. That is the order the two undos
         * actually come in — you far more often want to retype than to leave
         * — and it is the same pair of outcomes the two drawn controls give,
         * so the keyboard tells the same story the pointer does instead of
         * being a shortcut for only half of it.
         *
         * Both stages work under every dismiss variant. The axis decides what
         * is DRAWN, never what works: a shortcut that only exists while its
         * own hint is on screen is a shortcut nobody can rely on.
         *
         * `stopPropagation` because the shell listens for Escape too. Without
         * it the first press would clear the field AND shut whatever is open
         * behind it, which is one gesture doing two people's jobs.
         */
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          if (query.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            onQuery("");
            return;
          }
          if (!onClose) return;
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        /*
         * Says what it searches, because it does not search everything.
         *
         * The cluster's pill above it promises the account; this promises the
         * catalogue. Naming the corpus is the only thing that keeps two fields
         * in one column from reading as one field drawn twice.
         */
        placeholder="Search products"
        aria-label="Search products"
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {query.length > 0 ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onQuery("")}
          className="motion-tap flex size-[18px] shrink-0 items-center justify-center rounded-full text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95"
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );

  /*
   * The dismiss sits OUTSIDE the field, whichever form it takes.
   * Ashwin, Nov 16: "Why is there a collapse icon inside the search?"
   *
   * Inside, it was a second glyph sharing a corner with the X and reading as
   * part of the input — a control that ENDS the search looked like one more
   * thing acting on the text. Out here the two scopes are plain: what is in
   * the box acts on what you typed, what is beside it acts on the box.
   *
   * `esc` draws nothing beside the field, so there is nothing to wrap.
   */
  if (!onClose || dismiss === "esc") return field;
  return (
    /*
      The worded variant, beside the field rather than inside it.

      In the box it would be a second control competing with the X for the
      same corner; out here it is plainly a different thing acting on a
      different scope — the field, not the text.
    */
    <div className={cn("flex w-full items-center gap-[8px]", className)}>
      {field}
      {dismiss === "cancel" ? (
        <button
          type="button"
          onClick={onClose}
          /*
            A hairline, the field's own. Ashwin, Nov 16.
            
            Bare, it read as a link that had wandered out of a paragraph —
            the one control on the row with no edge, sitting next to a boxed
            field. The two are a pair acting on the same thing, so they wear
            the same border and the same radius and the same height; what
            differs between them is what is inside, which is the only thing
            that should.
          */
          className="motion-tap h-[32px] shrink-0 rounded-[9px] px-[12px] text-[13px] leading-none font-medium text-nav-fg-subtle shadow-[inset_0_0_0_1px_var(--nav-field-border)] hover:bg-nav-hover hover:text-nav-fg active:scale-[0.98]"
        >
          Cancel
        </button>
      ) : (
        <button
          type="button"
          aria-label="Close search"
          title="Close search"
          onClick={onClose}
          /* The same edge the worded variant wears, for the same reason. */
          className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[9px] text-nav-fg-subtle shadow-[inset_0_0_0_1px_var(--nav-field-border)] hover:bg-nav-hover hover:text-nav-fg active:scale-[0.98]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * What a query with nothing behind it says.
 *
 * A filtered nav that matched nothing is an empty column, and an empty column
 * reads as a nav that broke rather than a search that missed — the one
 * ambiguity a filter must never leave, because the reader's next move is
 * completely different in the two cases. Quotes the query back for the same
 * reason the launcher's own miss does: it is usually a typo, and seeing it
 * spelled out is faster than re-reading the field.
 *
 * 6 above and 10 below, not 14 both ways. Ashwin, Nov 16: the gap read as a
 * list that had loaded and come back empty rather than as an answer to the
 * field above it. A miss is the field SPEAKING, so it sits close enough to
 * be read as its reply — the asymmetry is the same one a caption under an
 * image takes, and for the same reason.
 *
 * The same figures everywhere this message appears, which is four places:
 * the sidebar search, the column search's own list, and both halves of the
 * All products panel.
 */
export function TreeSearchEmpty({ query }: { query: string }) {
  return (
    <p className="w-full px-[2px] pt-[6px] pb-[10px] text-[13px] leading-[18px] text-nav-fg-subtle">
      No products match “{query}”
    </p>
  );
}

/**
 * What the summoned field shows before anything is typed.
 *
 * Only the `toggle` placement has this state. Pressing its glyph takes the
 * column away — that is the whole gesture — and an empty field over an empty
 * column reads as a nav that has broken rather than one waiting for a query.
 * So the space the rows left is given to the searches already made.
 *
 * The TERMS, not the products they found. A list of product rows here would
 * be a second All products list, which is the thing the field exists to save
 * you from — and it is not what anyone reaches for anyway: the words you
 * typed last time are rarely a product's exact name. The sub-account search
 * one column over shows the same thing, and this mirrors it down to the
 * clock and the arrow.
 *
 * No explanatory line. The heading and five terms say what this is; a
 * sentence under them would be the surface apologising for itself.
 */
export function ProductSearchResting({
  terms,
  homes,
  reveal = "none",
  closing = false,
  onPick,
}: {
  terms: readonly string[];
  /**
   * The category each term lands in, keyed by the term — "CRM" for
   * "calendar". Ashwin, Nov 17.
   *
   * Optional, and a term with no entry simply draws one line. A missing home
   * is not an error: a term that matches a category itself has none, and a
   * term that matches nothing any more is exactly the row you want to keep
   * showing rather than hide.
   */
  homes?: Readonly<Record<string, string>>;
  /**
   * How the list arrives, as the other half of the field's own entrance.
   * See SEARCH_REVEALS — the pairing lives in the theme so the two halves
   * cannot be tuned into something that stops reading as one event.
   */
  reveal?: "cascade" | "fade" | "slide" | "none";
  /**
   * On the way out, which runs the arrival backwards.
   *
   * The rows take their REVERSE index while this is true, so the last row
   * leaves first and the whole thing reads as the entrance rewound rather
   * than as a second animation that happens to go the other way.
   */
  closing?: boolean;
  onPick: (term: string) => void;
}) {
  if (terms.length === 0) return null;
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-[2px] py-[6px]",
        reveal !== "none" &&
          (closing
            ? `motion-search-list-${reveal}-out`
            : `motion-search-list-${reveal}`),
      )}
    >
      {/*
        The heading rides at index 0, so the label leads its own list rather
        than arriving after the rows it describes.
      */}
      <span
        /* Leads on the way in, and is last out — index 0 either way. */
        style={
          { "--row": closing ? terms.length : 0 } as React.CSSProperties
        }
        className="px-[8px] pb-[4px] text-[11px] leading-[14px] font-semibold tracking-[0.04em] text-nav-fg-subtle uppercase"
      >
        Recent searches
      </span>
      {terms.map((term, i) => (
        <button
          key={term}
          type="button"
          /* Its place in the cascade. Ignored by every other treatment. */
          style={
            {
              "--row": closing ? terms.length - 1 - i : i + 1,
            } as React.CSSProperties
          }
          onClick={() => onPick(term)}
          aria-label={`Search for ${term}`}
          /*
            Height comes from the content rather than a number, because the
            rows are not all the same height any more: a term with a home is
            two lines, one without is one. Stating 34 would have cropped the
            second line on the rows that have it.
          */
          className="motion-tap group/term flex w-full items-center gap-[10px] rounded-[7px] px-[8px] py-[6px] text-left text-[13px] leading-[normal] text-nav-fg hover:bg-nav-hover"
        >
          <History
            size={15}
            aria-hidden="true"
            className="shrink-0 text-nav-fg-subtle"
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate leading-[18px]">{term}</span>
            {/*
              Where the term takes you, in the result rows' own caption
              treatment — the resting list and the results are two states of
              one surface, so a home named in one should look like a home
              named in the other.
            */}
            {homes?.[term] ? (
              <span className="truncate text-[12px] leading-[16px] text-nav-fg-subtle">
                {homes[term]}
              </span>
            ) : null}
          </span>
          {/*
            The arrow says the row RE-RUNS the search rather than opening a
            product — the same promise the sub-account list makes with it.
          */}
          <ArrowUpRight
            size={15}
            aria-hidden="true"
            className="shrink-0 text-nav-fg-subtle"
          />
        </button>
      ))}
    </div>
  );
}

/*
 * ProductHit and ProductSearchResults lived here until Nov 17.
 *
 * They drew the column's results as a flat list, each hit captioned with the
 * branch it lives in. Ashwin replaced that with the pruned tree so all three
 * placements and the All products tab draw one shape — see the note at the
 * results' render site in left-nav. The caption survived the move: it is now
 * the second line on a RECENT SEARCH, where a bare word genuinely says
 * nothing about where it leads. See ProductSearchResting's `homes`.
 */
