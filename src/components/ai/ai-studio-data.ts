/**
 * The strings AI Studio's two screens are made of.
 *
 * Split out of the components for the reason `funnels-data.ts` was: the point
 * of these screens is their SHAPE, and a reviewer arguing about the shell
 * takeover should not have to scroll past fifteen project names to reach the
 * layout that is actually under review. Nothing here is generated and nothing
 * is dated against the clock — see the note on `editedLabel` below.
 */

/**
 * The recents rail, ~15 deep, as the real product shows it.
 *
 * The LENGTH is the evidence, not the names. A takeover earns its keep by
 * giving a working list room to breathe, and a recents list of four would have
 * quietly won the argument for the platform sidebar by never testing it. These
 * are the names from the Sep 22 screenshots, in their order, so the two can be
 * held side by side.
 */
export const STUDIO_RECENTS: readonly string[] = [
  "Fruit Picker Landing",
  "Cafe Landing Page",
  "Task Tracker",
  "PLDT 1499",
  "Game Builder",
  "Golden Eagle Flight",
  "Social Feed",
  "Chat Agent",
  "Invoice Portal",
  "Recipe Box",
  "Gym Class Booking",
  "Pet Adoption Form",
  "Podcast Landing",
  "Realtor One-Pager",
  "Support Widget",
];

export interface StudioProject {
  id: string;
  name: string;
  /**
   * Pre-written, never computed from `Date.now()`.
   *
   * `funnel-ai-preview` hard-codes its month for this reason and it applies
   * harder to a card grid: a screenshot of this page taken next week has to
   * match the one in the review doc, and "Edited 1 day ago" that silently
   * becomes "Edited 8 days ago" is a diff nobody made.
   */
  edited: string;
  /** Initials for the avatar chip. The owner is a person, not the account. */
  owner: string;
}

/**
 * The card grid under the tabs.
 *
 * Eight rather than the full recents list: the grid is a "recently viewed"
 * cut, and a grid that simply repeated the rail would make the rail look
 * redundant — which is an argument about THIS page's information design, not
 * about the shell, and would muddy the thing being reviewed.
 */
export const STUDIO_PROJECTS: readonly StudioProject[] = [
  { id: "task-tracker", name: "Task Tracker", edited: "Edited 1 day ago", owner: "AK" },
  { id: "fruit-picker", name: "Fruit Picker Landing", edited: "Edited 1 day ago", owner: "AK" },
  { id: "cafe-landing", name: "Cafe Landing Page", edited: "Edited 2 days ago", owner: "RS" },
  { id: "game-builder", name: "Game Builder", edited: "Edited 3 days ago", owner: "AK" },
  { id: "social-feed", name: "Social Feed", edited: "Edited 4 days ago", owner: "MD" },
  { id: "golden-eagle", name: "Golden Eagle Flight", edited: "Edited 6 days ago", owner: "RS" },
  { id: "chat-agent", name: "Chat Agent", edited: "Edited 1 week ago", owner: "AK" },
  { id: "pldt-1499", name: "PLDT 1499", edited: "Edited 2 weeks ago", owner: "MD" },
];

/**
 * The tabs over the grid. Filters on one list, so none of them is a place —
 * the same rule the product page's in-page tabs follow, and the reason none of
 * these ever reaches a breadcrumb (there is no breadcrumb here to reach).
 */
export const STUDIO_TABS = [
  "Recently viewed",
  "My projects",
  "Starred",
  "Templates",
] as const;

/**
 * The assistant's reply, the run it is reporting, and the follow-up offered
 * under it. One conversation, written out, because the builder is a picture of
 * a finished turn rather than a chat that runs.
 */
export const BUILDER_TURN = {
  stamp: "Today, 10:42 AM",
  prompt: "Build a to-do list",
  thought: "Thought for 3s",
  runTitle: "Built a to-do list app",
  runMeta: "6 tools used",
  reply: [
    "I built a to-do list app with a clean, focused layout. You can add tasks, mark them complete, and filter by All, Active, or Completed.",
    "Completed tasks stay in the list with a strikethrough so you can undo them, and the counter under the filters tracks what is left. Nothing is stored yet — say the word and I will persist tasks so they survive a refresh.",
  ],
  suggestion: "Add due dates and sort by them",
} as const;
