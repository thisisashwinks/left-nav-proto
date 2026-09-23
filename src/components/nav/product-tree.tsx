"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  GET_APP_FLYOUT_ID,
  getAppFlyout,
} from "@/components/flyout/get-app-flyout";
import type { FlyoutChildItem, FlyoutConfig } from "@/components/flyout/types";
import { useTheme } from "@/components/theme/theme-provider";
import { childById, productById } from "./catalogue";
import type { CatalogueChild } from "./catalogue-types";
import {
  iconForProduct,
  labelForProduct,
  type NavLayoutState,
  type ResolvedGroup,
} from "./grouping";
import { useHere, type Marking } from "./here";
import { NavItemRow } from "./nav-item-row";
import { liftedChildren } from "./nav-entries";
import { isPinnable, WithPin } from "./with-pin";
import { accountSettingsFlyout, SETTINGS_FLYOUT_ID } from "./settings-config";
import type { NavItem } from "./types";

/**
 * The whole catalogue, drawn INTO the nav instead of beside it.
 *
 * The arrangement `navProductTree` switches on (see the axis in theme.ts): a
 * group is a disclosure rather than a door, so L1 → L2 → L3 are all reachable
 * in the one column and the nav can always say where you are. It is the
 * argument AGAINST the flyout model, built so the two can be looked at rather
 * than remembered.
 *
 * Everything here is additive. With the axis off nothing in this file is
 * imported at render time by either nav face — `left-nav.tsx` and
 * `collapsed-rail.tsx` both gate on the flag before they call any of it — so
 * the flyout arrangement is not merely unchanged, it is untouched.
 *
 * The branch contents come from the SAME place the "All products" panel's
 * catalogue half reads (`resolveGroups` → `group.productIds` → the catalogue's
 * own children, resolved through `labelForProduct`/`iconForProduct`). That is
 * deliberate: a second tree built from a second source is exactly the
 * duplication this arrangement exists to remove, and the two would disagree
 * the first time anyone renamed a product.
 */

/**
 * Which group is open, shared by both nav faces.
 *
 * A module store rather than context, because the two faces are SIBLINGS under
 * the shell — `app-shell.tsx` mounts the expanded nav and the 64px rail side by
 * side and hides one — and there is no component inside `nav/` that contains
 * both to hang a provider off. The rail's job in this mode is to expand the nav
 * onto the group you pointed at (it has no width to disclose anything itself),
 * and it cannot do that if the open branch is state inside the face it is
 * handing over to.
 *
 * Deliberately NOT persisted anywhere. Which branch is open is a property of
 * the session's reading position, not of the account's arrangement — writing it
 * into the layout store would make "I looked at Marketing once" a thing that
 * survives a reload and travels in a template.
 */
let openBranchId: string | null = null;
const branchListeners = new Set<() => void>();

export function openTreeBranch(id: string | null): void {
  if (openBranchId === id) return;
  openBranchId = id;
  for (const listen of branchListeners) listen();
}

function subscribeBranch(listen: () => void): () => void {
  branchListeners.add(listen);
  return () => branchListeners.delete(listen);
}

function readBranch(): string | null {
  return openBranchId;
}

/*
 * Nothing is open on the server, and nothing is open on the first client paint
 * either — the auto-open below runs after mount, so the two agree and React
 * has no hydration mismatch to complain about.
 */
function readBranchOnServer(): null {
  return null;
}

/**
 * Where the pin hangs, measured in from a tree row's trailing edge.
 *
 * 8px of row padding, the 15px chevron, the 10px gap: the same stack
 * `flyout-row.tsx` computes for the same reason, and it has to agree with the
 * spacer `NavItem.pinSlot` puts in flow or the label runs under the star.
 */
const TREE_PIN_INSET = 8 + 15 + 10;

/** One node of the tree: a product, one of its pages, or a page's page. */
export interface TreeNode {
  id: string;
  label: string;
  icon?: LucideIcon;
  children?: TreeNode[];
}

/**
 * The chrome rows that are shelves in everything but name.
 *
 * Settings and Desktop & mobile apps hold a list of destinations and open a
 * panel to show it, exactly as a product group does — so in this arrangement
 * they disclose in place with the rest. They are not `ResolvedGroup`s, so
 * `flyoutForGroup` never built them anything; their panels are authored, and
 * the authored entries are a perfectly good branch.
 *
 * Recent, Pinned, Quick Actions and AI Agents are deliberately NOT here. They
 * are not the catalogue — they are surfaces over it — and a tree that swallowed
 * them would be claiming the arrangement replaces things it does not.
 */
const CHROME_BRANCHES: Record<string, FlyoutConfig> = {
  [SETTINGS_FLYOUT_ID]: accountSettingsFlyout,
  [GET_APP_FLYOUT_ID]: getAppFlyout,
};

/**
 * A catalogue child, resolved through the override maps.
 *
 * `iconForProduct` answers for a child id as well as a product one — override
 * first, then the authored glyph, then the one the label earns. Reading
 * `kid.icon` off the catalogue directly would skip the first of those, which is
 * the bug `group-flyout.ts` records having hit: an L3's new icon changed the
 * dock and not the surface it was picked in.
 *
 * `tabs` children are dropped. They are panels on their parent's page rather
 * than places of their own (see `CatalogueChild.tabs`), and the whole point of
 * that flag is that they never earn a nav row.
 */
function nodesFromChildren(
  state: NavLayoutState,
  kids: readonly CatalogueChild[] | readonly FlyoutChildItem[] | undefined,
): TreeNode[] | undefined {
  if (!kids || kids.length === 0) return undefined;
  return kids.map((kid) => {
    const grandchildren = kid.tabs
      ? undefined
      : nodesFromChildren(state, kid.children);
    return {
      id: kid.id,
      label: kid.label,
      icon: iconForProduct(state, kid.id),
      ...(grandchildren ? { children: grandchildren } : {}),
    };
  });
}

/**
 * What is underneath this L1 row, or null if it is a leaf.
 *
 * Three sources, in the order the row itself would have resolved its panel:
 * a resolved group lists its products, a row lifted out of a category keeps the
 * layer it was lifted with, and a chrome shelf uses its authored panel. Null
 * for everything else — a flat-mode product row, an account's own link, Recent
 * — and those keep drawing exactly as they do with the axis off.
 */
export function treeBranchFor(
  state: NavLayoutState,
  groups: readonly ResolvedGroup[],
  item: NavItem,
): TreeNode[] | null {
  const group = groups.find((g) => g.id === item.id);
  if (group) {
    return group.productIds.map((id) => {
      const product = productById(id);
      const kids = product?.tabs ? undefined : product?.children;
      const children = nodesFromChildren(state, kids);
      return {
        id,
        label: labelForProduct(state, id),
        icon: iconForProduct(state, id),
        ...(children ? { children } : {}),
      };
    });
  }

  const lifted = liftedChildren(item.id);
  if (lifted.length > 0) return nodesFromChildren(state, lifted) ?? null;

  const chrome = CHROME_BRANCHES[item.flyoutId ?? item.id];
  if (chrome) {
    return chrome.entries.flatMap((entry) => {
      if (entry.kind !== "item") return [];
      /*
       * An authored panel was written against the full catalogue, so it will
       * happily offer a product this account is not on — the same filter
       * `flyoutForGroup` applies for the same reason. Rows naming nothing in
       * the catalogue (the settings menu is almost entirely those) stay.
       */
      if (
        productById(entry.item.id) !== undefined &&
        !state.enabledProducts.includes(entry.item.id)
      ) {
        return [];
      }
      const children = entry.item.tabs
        ? undefined
        : nodesFromChildren(state, entry.item.children);
      return [
        {
          id: entry.item.id,
          label: entry.item.label,
          ...(entry.item.icon ? { icon: entry.item.icon } : {}),
          ...(children ? { children } : {}),
        },
      ];
    });
  }

  return null;
}

/**
 * The tree's open state, and the rule that it opens itself.
 *
 * One hook rather than state scattered across the face, because the two halves
 * answer to each other: opening a group has to close the one that was open, and
 * arriving on a page has to open the group it is in WITHOUT that counting as a
 * click the accordion should push something else aside for.
 */
export function useProductTree(groups: readonly ResolvedGroup[]) {
  const branch = React.useSyncExternalStore(
    subscribeBranch,
    readBranch,
    readBranchOnServer,
  );
  const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const here = useHere();
  /*
   * Tied to the selected-state axis, exactly as `useAutoOpen` is.
   *
   * That hook answers the same question for a row that is already on screen —
   * "should this parent be open because the page is inside it" — and this is
   * the same feature one level up. Switching the marking off means the nav
   * stops volunteering where you are; a tree that still opened itself onto the
   * current page would be volunteering it louder than the marking ever did.
   */
  const { selectedState } = useTheme().effective;
  const volunteers = selectedState !== "off";

  const hereBranch = React.useMemo(() => {
    if (here.productId === null) return null;
    return groups.find((g) => g.productIds.includes(here.productId!))?.id ?? null;
  }, [groups, here.productId]);

  /*
   * The branch you are in opens itself, and it is the ONLY one open.
   *
   * A fifteen-product group is fifteen rows plus their pages, which pushes
   * every other group off the bottom of a 900px nav — so "expand what you
   * clicked" without "close what you had" is an arrangement that reads fine on
   * the first click and is unusable on the third. The accordion is what makes
   * the tree a nav rather than a document.
   *
   * An effect rather than the render-adjust pattern this codebase prefers,
   * because the value being adjusted lives in a module store that both nav
   * faces read — writing to it mid-render would be a side effect on a value
   * another component may already have sampled this pass.
   */
  React.useEffect(() => {
    if (!volunteers || hereBranch === null) return;
    openTreeBranch(hereBranch);
  }, [volunteers, hereBranch]);

  /*
   * And the product you are in, plus every page between it and you.
   *
   * `childById` hands back the ancestors as `path`, which is what makes an L4
   * reachable without the caller knowing how deep it went: expanding the
   * product alone would leave the current page hidden inside a closed L3.
   *
   * Adjusted during render off a changed position rather than in an effect —
   * this is derived history, it is the pattern the rest of this codebase uses
   * for exactly that, and the React 19 lint rejects the effect version as a
   * cascading render. `prevHere` starts null, which no real position can equal,
   * so the very first paint counts as a move and the tree arrives open.
   */
  const hereKey = `${here.productId ?? ""} ${here.childId ?? ""}`;
  const [prevHere, setPrevHere] = React.useState<string | null>(null);
  if (prevHere !== hereKey) {
    setPrevHere(hereKey);
    if (volunteers) {
      const open: string[] = [];
      if (here.productId) open.push(here.productId);
      if (here.childId) {
        const hit = childById(here.childId);
        if (hit) for (const ancestor of hit.path) open.push(ancestor.id);
      }
      /*
       * The new position REPLACES the open set — it does not join it.
       *
       * Merging was the bug: clicking a row in the tree went through
       * `toggleNode`, which closes siblings, but arriving from anywhere else —
       * Recents, the dock, search, a crumb menu — came through here and only
       * ever added. So the accordion held while you browsed the tree and came
       * apart the moment you used the rest of the nav, leaving Contacts,
       * Conversations and Opportunities all standing open at once.
       *
       * The ancestors of where you are IS the accordion's state: one open node
       * per level, and the levels are exactly the path. Replacing therefore
       * needs no separate closing pass — anything not on the path is, by
       * definition, a sibling that should have shut.
       */
      const same =
        open.length === expanded.size && open.every((id) => expanded.has(id));
      if (open.length > 0 && !same) setExpanded(new Set(open));
    }
  }

  const toggleBranch = React.useCallback((id: string) => {
    openTreeBranch(openBranchId === id ? null : id);
  }, []);

  /*
   * One open node per level, the same rule the L1 groups follow.
   *
   * Free multi-open was the first cut and it fails the same way the groups
   * would have: Payments and Products and Invoices all open at once is forty
   * rows, and the level below them is off the screen. Accordion at every depth
   * means the nav's height is a function of how DEEP you are, not of how many
   * things you have opened and forgotten.
   *
   * Closing a node takes its descendants with it. Leaving them in the set is
   * invisible while the parent is shut and then wrong the moment it reopens —
   * a branch coming back with three sub-branches already open, none of which
   * the reader chose this time.
   *
   * Siblings arrive from the caller rather than being re-derived from the
   * catalogue: `ProductTreeBranch` is already mapping over exactly this
   * level's nodes, so that array IS the sibling set, and it stays right for
   * rows the catalogue does not own (lifted pages, the authored panels).
   */
  const toggleNode = React.useCallback(
    (id: string, siblings: readonly TreeNode[] = []) => {
      const collect = (node: TreeNode, into: Set<string>) => {
        into.add(node.id);
        for (const kid of node.children ?? []) collect(kid, into);
      };
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          const shut = new Set<string>();
          const node = siblings.find((s) => s.id === id);
          if (node) collect(node, shut);
          else shut.add(id);
          for (const gone of shut) next.delete(gone);
          return next;
        }
        for (const sibling of siblings) {
          if (sibling.id === id) continue;
          const shut = new Set<string>();
          collect(sibling, shut);
          for (const gone of shut) next.delete(gone);
        }
        next.add(id);
        return next;
      });
    },
    [],
  );

  return { branch, toggleBranch, expanded, toggleNode };
}

/**
 * The rows under an open L1, at every depth.
 *
 * Drawn with `NavItemRow` rather than a row of its own so the tree inherits the
 * geometry, the hover fill, the truncation tooltip, the New dot and the
 * here/trail mark that the rest of the nav already has — a second row
 * component would be a second set of those to keep in step, and the first
 * retune would part them.
 */
export function ProductTreeBranch({
  nodes,
  depth,
  expanded,
  onToggle,
  onSelect,
  markFor,
}: {
  nodes: readonly TreeNode[];
  /** 1 for a product under a group, 2 for its pages, 3 for theirs. */
  depth: number;
  expanded: ReadonlySet<string>;
  onToggle: (id: string, siblings: readonly TreeNode[]) => void;
  onSelect: (id: string) => void;
  /**
   * Passed in rather than called here, because marking is decided by a hook
   * (`useMarking`) and these rows are a recursive loop — the face reads the
   * axis once and hands down the pure function it produced.
   */
  markFor: (isHere: boolean, isTrail: boolean) => Marking;
}) {
  const here = useHere();
  /*
   * What the tree draws beside its rows, read here rather than threaded down.
   *
   * This component recurses, so a prop would have to be passed at every level
   * for a value that is the same at all of them — and the axis is read from
   * context anyway, which is where `markFor`'s own hook reads from. Nothing
   * below runs with `navProductTree` off: `left-nav.tsx` never renders this.
   */
  const { treeIcons } = useTheme().effective;
  /*
   * L3 is `depth` 2 here, not 3.
   *
   * The axis counts the nav's levels — group, product, page — and this prop
   * counts INDENT steps from the group row, which is itself level one at depth
   * zero. So the products are depth 1 and the pages the axis calls L3 are
   * depth 2, with anything deeper (a page's own page) hidden alongside them:
   * "hide the pictures below the product" is the decision, and an L4 wearing a
   * glyph its parent gave up would be the exception that makes the column look
   * like a mistake.
   */
  const glyphless =
    treeIcons === "none" ||
    treeIcons === "rails" ||
    (treeIcons === "hide-l3" && depth >= 2);
  return (
    <>
      {nodes.map((node) => {
        const open = expanded.has(node.id);
        const hasKids = (node.children?.length ?? 0) > 0;
        /*
         * A product row is "here" only when nothing deeper is open — the same
         * rule the L1 rows follow, so a product and the page inside it never
         * both read as the destination.
         */
        const isHere =
          depth === 1
            ? node.id === here.productId && here.childId === null
            : node.id === here.childId;
        const isTrail =
          (depth === 1 && node.id === here.productId) ||
          (here.childId !== null &&
            (node.children?.some((kid) => kid.id === here.childId) ?? false));
        const item: NavItem = {
          id: node.id,
          label: node.label,
          ...(node.icon ? { icon: node.icon } : {}),
          depth,
          /*
           * The pin column, on every row the dock could hold.
           *
           * Not a nicety. With the axis on there is no flyout, and the flyout
           * was the ONLY surface in the nav that let you pin a product or one
           * of its pages — so a tree without this would have quietly removed
           * pinning from the arrangement while the dock above it carried on
           * showing what you had already pinned. `WithPin` no-ops on anything
           * the dock cannot hold, so the flag can go on every row rather than
           * being conditioned on a second copy of that rule.
           */
          pinSlot: isPinnable(node.id),
          ...(hasKids ? { expandable: true, expanded: open } : {}),
          /*
           * The glyph goes, and its column with it. See `NavItem.iconHidden` —
           * `icon` is left set on purpose, so the only difference between this
           * row and the same row under `treeIcons: "all"` is whether the
           * picture is drawn, not what the row is made of. The label closes the
           * 26px the glyph was using; the indent, and so the level, stays.
           */
          ...(glyphless ? { iconHidden: true } : {}),
          /*
           * With no glyphs anywhere, the indent stops paying for them.
           *
           * `hide-l3` is deliberately not in this condition though it is in
           * `glyphless`: its L1 and L2 keep their pictures, so its pages still
           * indent past a real one. See `NavItem.tightIndent`.
           */
          ...(treeIcons === "none" || treeIcons === "rails"
            ? { tightIndent: true }
            : {}),
          /*
           * One rail per level above this row, which is exactly its depth.
           *
           * A count rather than a description of the ancestors, because the
           * emphasis is not about WHICH branch — see `NavItem.rails`. The
           * accordion opens one node per level and auto-opens the one you are
           * standing in, so "the rail of the branch you are in" and "the rail
           * that is drawn at all" are the same line in every reachable state,
           * and colouring by it would have been a distinction nobody could
           * ever see.
           */
          ...(treeIcons === "rails" ? { rails: depth } : {}),
        };
        return (
          <React.Fragment key={`${depth}-${node.id}`}>
          <WithPin productId={node.id} pinInset={TREE_PIN_INSET} pinSize={12}>
            <NavItemRow
              item={item}
              marking={markFor(isHere, isTrail)}
              onSelect={() => {
                /*
                 * A parent both opens and goes.
                 *
                 * The flyout's own rule (see `onNavigate`'s `keepOpen` note in
                 * app-shell): disclosing a list and landing on its first page
                 * is one intent, and making it two clicks is the thing people
                 * complain about in tree navs. Select first, so the page the
                 * branch is opening onto is the page that gets asked for.
                 */
                /*
                 * Known limit, recorded here because it is not this file's to
                 * fix: an L2 click LANDS (the shell's `selectNavRow` resolves a
                 * catalogue product and opens its first page), an L3 click only
                 * selects. The id → page walk for a CHILD (`childById` →
                 * `setProductPage`) used to exist only inside the flyout's
                 * own `onNavigate`, so a page id selected from here — or from
                 * a pinned L3 in the dock, or the merged Recents list — lit the
                 * row and went nowhere. `selectNavRow` resolves page ids now
                 * (Sep 22), so every nav surface lands where the breadcrumb's
                 * own menu would have taken you.
                 */
                onSelect(node.id);
                if (hasKids) onToggle(node.id, nodes);
              }}
            />
          </WithPin>
            {hasKids && open ? (
              <ProductTreeBranch
                nodes={node.children!}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
                markFor={markFor}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}
