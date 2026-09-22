/**
 * The name of a screen, said once.
 *
 * Every screen in this prototype that has a real page is named twice: the nav
 * tree gives the row a label, which becomes the last crumb of the trail, and
 * the page gives `PageHeader` a title. Nothing joined the two, so they drifted
 * — by Sep 22 the trail read "Sites ▸ Funnel" over a page headed "Funnels",
 * and "Contacts ▸ List" over a page headed "Smart lists". A trail whose tail
 * disagrees with the heading under it is worse than no trail: the whole claim
 * of the breadcrumb study is that the last crumb IS the page header by another
 * name (Aug 18), and a reviewer who spots the two words disagreeing has been
 * handed a reason to distrust every other crumb on the bar.
 *
 * So the name lives here and both sides read it.
 *
 * DIRECTION: the PAGE's word wins, not the tree's. The tree labels were
 * written as an IA spec — "Funnel", "List" — where the surrounding structure
 * supplies the sense; the page titles were written for someone looking at the
 * screen. Only one of those two audiences is a user with a mouse. So where
 * they disagreed, the tree was corrected to the page's word and never the
 * other way round: renaming the Funnels page to "Funnel" to match the tree
 * would have made the two agree on a word no operator uses.
 *
 * WHAT IS NOT HERE: funnels-page, voice-ai-page and ai-studio-page still
 * carry their titles as literals. Those three files are under `sites/` and
 * `ai/`, owned by a concurrent Sep 22 study, and reaching into them to swap a
 * string for an import would have collided with it. The values below are
 * exactly those literals, so the trees agree with those pages today; the
 * import is the follow-up, and it is a one-line change per page.
 */
export const SCREEN_NAMES = {
  /**
   * Contacts' list screen.
   *
   * Read twice: by `contacts-area.tsx`, whose page-title MENU this is the
   * first entry of, and by the proposed tree's `ia-crm-contacts-list`. That
   * menu is also what the shell hangs on the last crumb, so the title, the
   * crumb and its dropdown now cannot name the screen three ways.
   */
  contactsSmartLists: "Smart lists",
  /** Conversations' inbox. The page draws no title (it is full-bleed), so
   *  this only has to be the word both trees use for the row. */
  inbox: "Inbox",
  /** `opportunities-page.tsx` — its `PageHeader` title reads this. */
  opportunities: "Opportunities",
  /** `workflows-page.tsx` — its `PageHeader` title reads this. */
  workflows: "Workflows",
  /** `sites/funnels-page.tsx` — literal, see WHAT IS NOT HERE above. */
  funnels: "Funnels",
  /** `ai/voice-ai-page.tsx` — literal, see WHAT IS NOT HERE above. */
  voiceAi: "Voice AI",
  /** `ai/ai-studio-page.tsx` — a takeover with no page header at all, so this
   *  is the product row's name in both trees and nothing else. */
  aiStudio: "AI Studio",
} as const;
