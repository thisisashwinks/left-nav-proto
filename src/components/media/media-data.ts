/**
 * What the account has uploaded, and the folders it filed some of it in.
 *
 * Dummy rows with real proportions: mostly images, a handful of PDFs and one
 * video, named the way files actually arrive — a download from a design tool,
 * a screenshot with a timestamp, a logo someone exported twice. A fixture list
 * of tidy names would make the grid look like a design system's asset page
 * rather than a media library, which is the thing this screen has to survive.
 */

export type MediaKind = "image" | "pdf" | "video" | "doc";

export interface MediaFile {
  id: string;
  name: string;
  kind: MediaKind;
  /** Printed as-is. Prototype fixture, so no byte maths at render time. */
  size: string;
  modified: string;
  /**
   * The tile's artwork, since a prototype ships no images.
   *
   * `poster` is the gradient and `caption` the line drawn on it — together
   * they stand in for a thumbnail well enough that the grid reads as a grid of
   * different things, which a wall of identical placeholders does not.
   */
  poster: string;
  caption?: string;
  folderId?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  /** Files inside, including the ones this fixture does not list. */
  count: number;
}

export const mediaFolders: MediaFolder[] = [
  { id: "brand", name: "Brand kit", count: 24 },
  { id: "campaigns", name: "Campaign creative", count: 61 },
  { id: "proposals", name: "Proposals and PDFs", count: 12 },
  { id: "screens", name: "Product screenshots", count: 38 },
  { id: "video", name: "Video", count: 7 },
];

const SLATE = "linear-gradient(160deg,#0f172a 0%,#1e293b 70%,#334155 100%)";

export const mediaFiles: MediaFile[] = [
  {
    id: "f08",
    name: "08-the-final-test-promo-square.png",
    kind: "image",
    size: "412 KB",
    modified: "Sep 22, 2026",
    poster: SLATE,
    caption: "The one-time final test",
    folderId: "campaigns",
  },
  {
    id: "f07",
    name: "07-does-it-recite-promo-square.png",
    kind: "image",
    size: "388 KB",
    modified: "Sep 22, 2026",
    poster: SLATE,
    caption: "Does it recite?",
    folderId: "campaigns",
  },
  {
    id: "f06",
    name: "06-choosing-the-tokenizer-promo.png",
    kind: "image",
    size: "455 KB",
    modified: "Sep 21, 2026",
    poster: SLATE,
    caption: "Choosing the tokenizer",
    folderId: "campaigns",
  },
  {
    id: "f05",
    name: "05-training-promo-square.png",
    kind: "image",
    size: "501 KB",
    modified: "Sep 21, 2026",
    poster: SLATE,
    caption: "Training, and what it costs",
    folderId: "campaigns",
  },
  {
    id: "f04",
    name: "04-the-model-promo-square.png",
    kind: "image",
    size: "478 KB",
    modified: "Sep 20, 2026",
    poster: SLATE,
    caption: "The model",
    folderId: "campaigns",
  },
  {
    id: "f03",
    name: "03-teaching-a-computer-to-read.png",
    kind: "image",
    size: "390 KB",
    modified: "Sep 20, 2026",
    poster: SLATE,
    caption: "Teaching a computer to read",
    folderId: "campaigns",
  },
  {
    id: "f02",
    name: "02-the-data-promo-square.png",
    kind: "image",
    size: "366 KB",
    modified: "Sep 19, 2026",
    poster: SLATE,
    caption: "The data",
    folderId: "campaigns",
  },
  {
    id: "headshot",
    name: "1707371286986 (3).jpeg",
    kind: "image",
    size: "2.4 MB",
    modified: "Sep 18, 2026",
    poster: "linear-gradient(160deg,#334155 0%,#64748b 60%,#cbd5e1 100%)",
  },
  {
    id: "f01",
    name: "01-prerequisites-and-setup.png",
    kind: "image",
    size: "402 KB",
    modified: "Sep 18, 2026",
    poster: SLATE,
    caption: "Prerequisites and setup",
    folderId: "campaigns",
  },
  {
    id: "logo",
    name: "LeadConnector-Icon-ClearBG.png",
    kind: "image",
    size: "88 KB",
    modified: "Sep 15, 2026",
    poster: "linear-gradient(160deg,#fff7ed 0%,#fed7aa 55%,#fb923c 100%)",
    caption: "Logo, transparent",
    folderId: "brand",
  },
  {
    id: "nav-1",
    name: "nav-dark-crm-expanded.png",
    kind: "image",
    size: "224 KB",
    modified: "Sep 14, 2026",
    poster: "linear-gradient(160deg,#111827 0%,#1f2937 100%)",
    caption: "Nav, dark",
    folderId: "screens",
  },
  {
    id: "nav-2",
    name: "nav-dark-crm-collapsed.png",
    kind: "image",
    size: "198 KB",
    modified: "Sep 14, 2026",
    poster: "linear-gradient(160deg,#111827 0%,#1f2937 100%)",
    caption: "Nav, collapsed",
    folderId: "screens",
  },
  {
    id: "cal-1",
    name: "booking-page-september.png",
    kind: "image",
    size: "310 KB",
    modified: "Sep 12, 2026",
    poster: "linear-gradient(160deg,#eef2ff 0%,#e0e7ff 60%,#c7d2fe 100%)",
    caption: "Booking page",
    folderId: "screens",
  },
  {
    id: "proposal",
    name: "Fieldstone-retainer-2026.pdf",
    kind: "pdf",
    size: "1.1 MB",
    modified: "Sep 11, 2026",
    poster: "linear-gradient(160deg,#fef2f2 0%,#fee2e2 100%)",
    folderId: "proposals",
  },
  {
    id: "onboarding",
    name: "client-onboarding-checklist.pdf",
    kind: "pdf",
    size: "640 KB",
    modified: "Sep 9, 2026",
    poster: "linear-gradient(160deg,#fef2f2 0%,#fee2e2 100%)",
    folderId: "proposals",
  },
  {
    id: "walkthrough",
    name: "agent-walkthrough-cut02.mp4",
    kind: "video",
    size: "38.2 MB",
    modified: "Sep 8, 2026",
    poster: "linear-gradient(160deg,#0c4a6e 0%,#0369a1 60%,#38bdf8 100%)",
    caption: "Agent walkthrough",
    folderId: "video",
  },
  {
    id: "tone",
    name: "brand-tone-of-voice.docx",
    kind: "doc",
    size: "72 KB",
    modified: "Sep 4, 2026",
    poster: "linear-gradient(160deg,#eff6ff 0%,#dbeafe 100%)",
    folderId: "brand",
  },
  {
    id: "palette",
    name: "fieldstone-palette-export.png",
    kind: "image",
    size: "141 KB",
    modified: "Sep 2, 2026",
    poster: "linear-gradient(160deg,#155eef 0%,#7c3aed 55%,#f472b6 100%)",
    caption: "Palette",
    folderId: "brand",
  },
];

/** What the type filter offers, and what each answer keeps. */
export const MEDIA_KINDS: { id: MediaKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Video" },
  { id: "pdf", label: "PDFs" },
  { id: "doc", label: "Documents" },
];

/** What the extension badge says, for everything that is not a picture. */
export const KIND_BADGE: Record<MediaKind, string> = {
  image: "IMG",
  pdf: "PDF",
  video: "MP4",
  doc: "DOC",
};
