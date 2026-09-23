/**
 * The knowledge bases this account has, and what is in them.
 *
 * Dummy rows, but not arbitrary ones: the counts here are what both screens
 * count. The list's gaps column, the quota meter above it and the detail
 * screen's source cards all read this file, so a row cannot say 84 links in one
 * place and 12 in another — which is the failure mode of a prototype whose
 * screens each carry their own fixtures.
 */

export interface KnowledgeSources {
  /** Pages pulled in by the crawler. */
  links: number;
  faqs: number;
  richText: number;
  tables: number;
  files: number;
}

export interface KnowledgeBaseRow {
  id: string;
  name: string;
  /**
   * Questions the agents were asked and could not answer from this base.
   *
   * The one number on the row that is a call to action rather than a fact, and
   * the reason the column is on the list at all: a base with gaps is a base
   * that is losing conversations, and you cannot see that from inside it.
   */
  gaps: number;
  updated: string;
  created: string;
  sources: KnowledgeSources;
  /** Draws the help glyph beside the name — the seeded base every account gets. */
  seeded?: boolean;
}

export const KNOWLEDGE_QUOTA = 15;

export const knowledgeBases: KnowledgeBaseRow[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    gaps: 44,
    updated: "Sep 23, 2026, 1:18 PM",
    created: "Jul 18, 2025, 8:32 PM",
    sources: { links: 84, faqs: 1, richText: 0, tables: 0, files: 0 },
  },
  {
    id: "dealerships",
    name: "Main Street Boss KB for car dealerships",
    gaps: 0,
    updated: "Sep 12, 2026, 4:46 PM",
    created: "Oct 15, 2025, 7:28 PM",
    sources: { links: 32, faqs: 18, richText: 4, tables: 2, files: 6 },
  },
  {
    id: "existing",
    name: "Existing knowledge base",
    gaps: 0,
    updated: "Sep 8, 2026, 8:32 PM",
    created: "May 1, 2025, 11:04 AM",
    sources: { links: 0, faqs: 12, richText: 3, tables: 0, files: 1 },
    seeded: true,
  },
  {
    id: "fanatics",
    name: "Fanatics home cleaning services",
    gaps: 3,
    updated: "Jun 28, 2026, 12:44 PM",
    created: "Jun 27, 2026, 12:57 PM",
    sources: { links: 11, faqs: 24, richText: 1, tables: 1, files: 0 },
  },
  {
    id: "studybuddy",
    name: "Studybuddy JEEE",
    gaps: 0,
    updated: "Jun 21, 2026, 2:27 PM",
    created: "Jun 21, 2026, 2:27 PM",
    sources: { links: 5, faqs: 0, richText: 9, tables: 0, files: 14 },
  },
  {
    id: "sargent",
    name: "Sargent Family Dairy & Creamery KB",
    gaps: 7,
    updated: "May 20, 2026, 9:48 PM",
    created: "Oct 30, 2025, 5:14 PM",
    sources: { links: 46, faqs: 9, richText: 0, tables: 3, files: 2 },
  },
  {
    id: "devon",
    name: "Devon's knowledge base",
    gaps: 0,
    updated: "May 11, 2026, 4:48 PM",
    created: "Dec 16, 2025, 12:42 PM",
    sources: { links: 8, faqs: 2, richText: 1, tables: 0, files: 0 },
  },
  {
    id: "jacked-up",
    name: "Jacked Up Coffee Roasting Co. KB",
    gaps: 0,
    updated: "Feb 21, 2026, 1:08 AM",
    created: "Oct 27, 2025, 2:48 PM",
    sources: { links: 19, faqs: 6, richText: 2, tables: 1, files: 3 },
  },
  {
    id: "rockbox",
    name: "RockBox Fitness",
    gaps: 12,
    updated: "Feb 21, 2026, 12:06 AM",
    created: "Oct 16, 2025, 10:06 PM",
    sources: { links: 27, faqs: 31, richText: 0, tables: 0, files: 1 },
  },
  {
    id: "datacorps",
    name: "datacorps.com KB",
    gaps: 0,
    updated: "Feb 21, 2026, 12:02 AM",
    created: "Oct 16, 2025, 2:41 AM",
    sources: { links: 120, faqs: 0, richText: 0, tables: 0, files: 0 },
  },
  {
    id: "trailer-park",
    name: "Trailer Park knowledge base",
    gaps: 0,
    updated: "Feb 20, 2026, 11:58 PM",
    created: "Oct 15, 2025, 9:06 PM",
    sources: { links: 4, faqs: 7, richText: 0, tables: 0, files: 0 },
  },
  {
    id: "muller",
    name: "Muller Memorial",
    gaps: 1,
    updated: "Feb 20, 2026, 11:54 PM",
    created: "Oct 15, 2025, 2:47 AM",
    sources: { links: 16, faqs: 5, richText: 2, tables: 0, files: 8 },
  },
];

/* ─── One base, opened ──────────────────────────────────────────────────── */

export type SourceKind = "crawler" | "faq" | "tables" | "richText" | "files";

/**
 * A question the agents were asked and could not answer.
 *
 * `asked` is why the gaps list is worth a screen of its own rather than a
 * number on a row: forty-four gaps sounds like a backlog, and in practice three
 * of them are asked every day and the rest once ever. Sorting by that is the
 * whole job.
 */
export interface KnowledgeGap {
  id: string;
  question: string;
  asked: number;
  lastAsked: string;
  /** Whether someone has already written the answer this gap is waiting for. */
  status: "open" | "drafted";
}

export const knowledgeGaps: KnowledgeGap[] = [
  {
    id: "g1",
    question: "Do you deliver to PO boxes?",
    asked: 62,
    lastAsked: "2 hours ago",
    status: "open",
  },
  {
    id: "g2",
    question: "What's the refund window after a subscription renews?",
    asked: 41,
    lastAsked: "Yesterday",
    status: "drafted",
  },
  {
    id: "g3",
    question: "Can I move my appointment to another location?",
    asked: 28,
    lastAsked: "Yesterday",
    status: "open",
  },
  {
    id: "g4",
    question: "Is there a student discount?",
    asked: 17,
    lastAsked: "Sep 21, 2026",
    status: "open",
  },
  {
    id: "g5",
    question: "Which payment methods work outside the US?",
    asked: 9,
    lastAsked: "Sep 19, 2026",
    status: "drafted",
  },
  {
    id: "g6",
    question: "How long does onboarding take for a new location?",
    asked: 4,
    lastAsked: "Sep 14, 2026",
    status: "open",
  },
];
