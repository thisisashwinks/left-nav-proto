"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
 * products" field, kept at the same 36px/9px/inset-ring shape, because it
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
 * 2. Nothing below matched but its own label did → keep it as a LEAF, children
 *    dropped. Searching "Payments" and being handed Payments' nine pages is the
 *    unfiltered tree with extra steps; the row you asked for is the answer, and
 *    it opens normally once the query goes.
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
         * Rebuilt field by field rather than spread-minus-`children`: the rest
         * pattern leaves a bound name nothing reads, and `TreeNode` is three
         * fields, so naming them costs less than the lint suppression would.
         */
        out.push({
          id: node.id,
          label: node.label,
          ...(node.icon ? { icon: node.icon } : {}),
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
  className,
}: {
  query: string;
  onQuery: (next: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[36px] w-full shrink-0 items-center gap-[9px] rounded-[9px] px-[10px] shadow-[inset_0_0_0_1px_var(--nav-divider)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]",
        className,
      )}
    >
      <Search size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
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
 */
export function TreeSearchEmpty({ query }: { query: string }) {
  return (
    <p className="w-full px-[2px] py-[14px] text-[13px] text-nav-fg-subtle">
      No products match “{query}”
    </p>
  );
}
