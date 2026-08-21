import { icons, type LucideIcon } from "lucide-react";

/**
 * The icons a user can choose from when relabelling a group or a row.
 *
 * All of Lucide, in one order: the fifty-odd nav-shaped glyphs first, then
 * everything else alphabetically. It used to be the curated fifty alone, on the
 * grounds that the picker is for making a renamed group legible rather than for
 * browsing a library — but an agency naming a category for their own trade
 * ("Fleet", "Claims", "Kilns") kept finding the one icon they wanted was the one
 * missing, and the shortlist offers no way to say so.
 *
 * Keeping the curated names at the top is what makes the long list usable: the
 * picker still opens on the fifty answers that are usually right, and searching
 * reaches the other seventeen hundred. It is also still licence-clean — the whole
 * set is Lucide (ISC), so nothing here can drift into a font we cannot
 * redistribute.
 *
 * Names are stored, not components: state has to survive being serialised. And
 * because every Lucide icon now HAS a name here, `nameForIcon` round-trips for
 * all of them — which is what lets a seeded group keep the glyph it was authored
 * with instead of falling back to a folder.
 */
export interface PickerIcon {
  name: string;
  icon: LucideIcon;
  /** Extra words the search matches, so "money" finds Wallet. */
  keywords: string;
}

/**
 * The nav-shaped shortlist, and the hints that make it searchable by intent
 * rather than by name — "money" for Wallet, "convert" for Target.
 */
const CURATED: readonly (readonly [string, string])[] = [
  ["MessageCircle", "chat talk conversation"],
  ["MessagesSquare", "chat threads engage"],
  ["Inbox", "mail queue unread"],
  ["Mail", "email campaign send"],
  ["Send", "email broadcast deliver"],
  ["Phone", "call dial voice"],
  ["Headphones", "support service calls"],
  ["Users", "contacts people audience crm"],
  ["Handshake", "deal partner close"],
  ["Target", "convert opportunity pipeline goal"],
  ["TrendingUp", "growth revenue up"],
  ["Megaphone", "market ads promote announce"],
  ["Rocket", "launch growth start"],
  ["Sparkles", "ai magic new"],
  ["Wand", "ai magic generate"],
  ["Bot", "ai agent assistant"],
  ["Workflow", "automate flow trigger"],
  ["Zap", "automate instant trigger"],
  ["Puzzle", "integration app addon"],
  ["Link", "integration connect url"],
  ["CreditCard", "payment card billing money"],
  ["Wallet", "payment money balance payout"],
  ["Receipt", "invoice estimate billing"],
  ["ShoppingCart", "store ecommerce checkout"],
  ["Store", "shop storefront retail"],
  ["Package", "product catalogue inventory"],
  ["Tag", "price label category"],
  ["Ticket", "event registration admission"],
  ["Calendar", "schedule booking appointment"],
  ["Clock", "time recent schedule"],
  ["Video", "meeting call webinar"],
  ["LayoutTemplate", "site funnel page"],
  ["Globe", "website membership public"],
  ["FileText", "template document form"],
  ["Folder", "group collection files"],
  ["Layers", "group stack sections"],
  ["Boxes", "library collection modules"],
  ["Database", "records data objects"],
  ["ChartLine", "analyze report trend"],
  ["ChartPie", "analyze breakdown share"],
  ["Gauge", "dashboard metric monitor"],
  ["Filter", "segment view saved"],
  ["CheckCheck", "tasks done complete"],
  ["Flag", "priority milestone mark"],
  ["Star", "favorite reputation review"],
  ["Heart", "loyalty favourite retention"],
  ["Award", "reputation badge quality"],
  ["Trophy", "win goal leaderboard"],
  ["Briefcase", "business work agency"],
  ["Building2", "company account location"],
  ["MapPin", "location place address"],
  ["Compass", "explore discover guide"],
  ["Lightbulb", "idea tips learn"],
  ["Bell", "alert notification remind"],
  ["Share2", "social share network"],
  ["Smartphone", "mobile app device"],
  ["Settings", "config preferences admin"],
];

/** "ChartNoAxesColumn" → "chart no axes column", so search works on words. */
function words(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase();
}

const CURATED_HINTS = new Map(CURATED);

/**
 * Lucide's own registry, not a hand-kept import list.
 *
 * `icons` is the canonical map — one entry per glyph, no deprecated aliases — and
 * its components are the very same objects the named exports give you, so a
 * reverse lookup by component is exact.
 */
const ALL: PickerIcon[] = Object.entries(icons).map(([name, icon]) => ({
  name,
  icon: icon as LucideIcon,
  keywords: `${words(name)} ${CURATED_HINTS.get(name) ?? ""}`.trimEnd(),
}));

const ALL_BY_NAME = new Map(ALL.map((i) => [i.name, i]));

export const ICON_CATALOGUE: PickerIcon[] = [
  // The shortlist, in its authored order — it reads as a sentence about what a
  // nav category can be, and sorting it alphabetically would lose that.
  ...CURATED.map(([name]) => ALL_BY_NAME.get(name)).filter(
    (i): i is PickerIcon => i !== undefined,
  ),
  ...ALL.filter((i) => !CURATED_HINTS.has(i.name)).sort((a, b) =>
    a.name.localeCompare(b.name),
  ),
];

const BY_NAME = new Map(ICON_CATALOGUE.map((i) => [i.name, i.icon]));
const BY_COMPONENT = new Map<LucideIcon, string>(
  ICON_CATALOGUE.map((i) => [i.icon, i.name]),
);

/** Resolves a stored icon name. Unknown names fall back rather than crash. */
export function iconByName(name: string | undefined): LucideIcon | undefined {
  return name ? BY_NAME.get(name) : undefined;
}

/**
 * The picker name for an icon component, so a group seeded from the shipped
 * catalogue starts on the same icon the picker would show as selected.
 *
 * Reverse lookup by component rather than Lucide's `displayName`: the picker can
 * only select what is in the list, so a name it does not know is a name it could
 * not round-trip. Now that the list IS Lucide, that is every icon — which is
 * what a seeded nav depends on to keep its authored glyphs.
 */
export function nameForIcon(icon: LucideIcon | undefined): string | undefined {
  return icon ? BY_COMPONENT.get(icon) : undefined;
}

/**
 * How many results the picker will draw at once.
 *
 * Seventeen hundred 30px tiles is around forty thousand DOM nodes, and the
 * popover opens on a keystroke — the cap is what keeps it instant. The list is
 * ordered so the cut falls past the whole shortlist, and the picker says when it
 * has cut, because a silent truncation reads as "that icon does not exist".
 */
export const SEARCH_LIMIT = 240;

export interface IconResults {
  icons: PickerIcon[];
  /** How many matched but were not drawn. Zero when everything fitted. */
  hidden: number;
}

export function searchIcons(query: string): IconResults {
  const q = query.trim().toLowerCase();
  const matched = q
    ? ICON_CATALOGUE.filter(
        (i) => i.name.toLowerCase().includes(q) || i.keywords.includes(q),
      )
    : ICON_CATALOGUE;
  return {
    icons: matched.slice(0, SEARCH_LIMIT),
    hidden: Math.max(0, matched.length - SEARCH_LIMIT),
  };
}
