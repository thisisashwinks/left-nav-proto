/*
 * Checkpoints for the "Staging fixed" inbox build.
 *
 * Each checkpoint is a group of fixes to the staging copy
 * (components/product/conversations-staging) that can be discussed and handed
 * to the devs on its own. The tree runs area → checkpoint → sub-checkpoint;
 * only the leaves are switches, and a parent is simply all of its leaves.
 *
 * "Staging fixed" is staging plus whichever leaves are ticked, in any
 * combination. Fixes are written so that no two leaves touch the same
 * property, which is what lets them be ticked independently without clashing.
 * Ashwin, Oct 7.
 *
 * Adding a fix: add a leaf here, then read it in the copy with `useFix(id)`.
 */

export type StagingFixNode = {
  id: string;
  label: string;
  /** One line on what changes, staging → fixed, shown in the panel. */
  note?: string;
  /**
   * The children are alternatives to each other — they change the same
   * properties two ways — so at most one can be on. The panel draws them as a
   * choice, and "All checkpoints" takes the first.
   */
  oneOf?: boolean;
  children?: StagingFixNode[];
};

export const STAGING_FIX_TREE: StagingFixNode[] = [
  {
    id: "contact-panel",
    label: "Contact panel",
    children: [
      {
        id: "contact-panel.edges",
        label: "Edges and spacing",
        children: [
          {
            id: "contact-panel.edges.right-border",
            label: "Right border",
            note: "No edge between the panel and the icon rail → 1px gray-200 rule.",
          },
          {
            id: "contact-panel.edges.no-folder-gap",
            label: "No gap above folders",
            note: "~36px between the tabs/search block and the first folder (8px gap + 6px margin + 2px padding + 8px folder margin) → none.",
          },
          {
            id: "contact-panel.edges.layout",
            label: "Layout",
            oneOf: true,
            children: [
              {
                id: "contact-panel.edges.layout.edge-to-edge",
                label: "Edge to edge",
                note: "16px side padding → none, so tabs, rules, folders and footer run to the panel's edges; tab strip and active-tab fills removed.",
              },
              {
                id: "contact-panel.edges.layout.cards",
                label: "Bordered cards",
                note: "Padding stays; each section — identity, tabs, folders — becomes its own bordered card on the white panel.",
              },
            ],
          },
        ],
      },
    ],
  },
];

/** Every leaf id under a node (the node itself, if it is a leaf). */
export function fixLeaves(node: StagingFixNode): string[] {
  return node.children ? node.children.flatMap(fixLeaves) : [node.id];
}

/**
 * The fullest compatible set under a node: every leaf, except that a one-of
 * group contributes only its first option.
 */
export function fixDefaults(node: StagingFixNode): string[] {
  if (!node.children) return [node.id];
  if (node.oneOf) return fixDefaults(node.children[0]!);
  return node.children.flatMap(fixDefaults);
}

/** The one-of group a leaf belongs to, if any, so ticking it can untick its siblings. */
export function oneOfSiblings(id: string, nodes = STAGING_FIX_TREE): string[] {
  for (const n of nodes) {
    if (!n.children) continue;
    if (n.oneOf && n.children.some((c) => fixLeaves(c).includes(id))) {
      return n.children.filter((c) => !fixLeaves(c).includes(id)).flatMap(fixLeaves);
    }
    const found = oneOfSiblings(id, n.children);
    if (found.length) return found;
  }
  return [];
}

/** Every fix "Staging fixed" starts with — all of them, first choice of each one-of. */
export const ALL_STAGING_FIXES: string[] = STAGING_FIX_TREE.flatMap(fixDefaults);
