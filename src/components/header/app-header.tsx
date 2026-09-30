"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  House,
  Monitor,
  MoreHorizontal,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CaretDown } from "@/components/icons/caret-down";
import {
  CRUMB_EMPHASIS_BUMP_PX,
  CRUMB_SCALE_PX,
  type CrumbCollapse,
  type CrumbEmphasis,
  type CrumbScale,
  type CrumbSeparator as CrumbSeparatorKind,
  type SurfaceTheme,
} from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import type { PageHeading } from "@/components/page/page-heading";
import { useLeafClaimed } from "@/components/page/leaf-crumb";
import { cn } from "@/lib/utils";
import { headerConfig, type HeaderActionTone, type HeaderConfig } from "./header-config";
import { UserAvatar } from "./user-avatar";
import { AccountMenu } from "./account-menu";
import { GET_APP_LABELS, type AppKind } from "./get-app-modal";

/**
 * One breadcrumb segment. A plain string stays a label; a segment with
 * options is a switcher — its dropdown lists the SIBLINGS at that level
 * (groups beside this group, products beside this product, pages beside
 * this page), so the trail is not just orientation but a way to move
 * sideways without going back through the nav. Aug 13 ask.
 */
/**
 * A row in a crumb's menu, which may itself hold a menu.
 *
 * The trail is a tree, not a list: a bucket holds products and a product holds
 * pages, so switching sideways at the bucket level should not mean landing on
 * that bucket's first product and re-opening a second menu. Rows with `children`
 * cascade to the right on hover, and clicking one still navigates.
 */
export interface CrumbOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  selected?: boolean;
  children?: CrumbOption[];
}

export interface Crumb {
  label: string;
  /** The same glyph the nav uses for this group or product, so the trail matches it. */
  icon?: LucideIcon;
  /**
   * Which rung of the nav this segment is, for the axes that care.
   *
   * Only `crumbLeaf: "none"` reads it, and only to answer one question: is
   * the thing at the end of this trail a PAGE inside a product, or is it the
   * product itself? Unset means a page, which is the common case and the
   * droppable one.
   *
   * Positional reasoning cannot answer it. Opportunities publishes CRM ▸
   * Opportunities with no child at all, so its leaf is the product; Contacts
   * publishes CRM ▸ Contacts ▸ Smart lists, where the leaf is an L3 and the
   * product sits one place to its left. Both are two or three segments long
   * depending on `crumbStart`, so counting crumbs gets one of them wrong
   * whichever floor you pick. The nav knows which rung each segment came
   * from; it just never said so.
   */
  level?: "group" | "product" | "child";
  options?: CrumbOption[];
  onSelect?: (id: string) => void;
  /**
   * Somewhere to go, for a segment with no sibling list to infer it from.
   *
   * Every link in this trail used to be derived: `crumbTargetFor` reads the
   * selected option, so a crumb could only be walked back to if it carried a
   * dropdown. That held while the only published crumbs were scope pickers,
   * and broke the moment a folder path arrived — Automation ▸ Workflows ▸
   * Intake ▸ Web forms, where Intake is plainly a place and just as plainly
   * has no menu, because Ashwin asked on Sep 28 for folders to be reached
   * from the table rather than from a switcher.
   *
   * A word in the middle of a trail that you cannot click is the one thing a
   * breadcrumb is for, so the destination can now be stated instead of
   * inferred. Ignored on the leaf, like every other target: it is the page you
   * are already on.
   */
  onNavigate?: () => void;
}

/**
 * The painted leaf, shared by the bar and by `BuilderTrail`.
 *
 * Tokens differ between the two surfaces (--hdr-* in the bar, --pg-* on a page
 * that has dropped it), so only the geometry lives here. It is deliberately the
 * hover chip's own radius and inset: emphasis should read as "this crumb is the
 * page", not as a second kind of control nobody can click. The -my keeps the
 * 48px bar's content box the height it was — a chip that grew the row would
 * shift every glyph beside it.
 */
export const CRUMB_LEAF_CHIP_BOX = "-my-[3px] rounded-[6px] px-[7px] py-[3px]";
/*
 * The bar's leaf, on its own ground.
 *
 * --hdr-crumb-leaf rather than --hdr-chip, because the chip token is the bar's
 * HOVER fill: gray/100 on white is a step you have to hunt for, and it made an
 * emphasised crumb look like one the pointer happened to be over. White, with
 * the bar's own hairline holding its edge — on a white bar the ring is what
 * makes the card, and on a tinted or dark one the fill does it.
 */
const CRUMB_LEAF_PAINT =
  "bg-hdr-crumb-leaf shadow-[inset_0_0_0_1px_var(--hdr-border)]";
const CRUMB_LEAF_CHIP = `${CRUMB_LEAF_CHIP_BOX} ${CRUMB_LEAF_PAINT}`;

/**
 * The trail's type, resolved once and handed to both renderers.
 *
 * Two axes meet here and the bar cannot read either of them alone: `crumbScale`
 * sets what every segment reads at, and `crumbEmphasis` decides whether the
 * leaf takes a further step past its ancestors. Kept as numbers rather than
 * classes because the product of two axes is eight sizes, and Tailwind scans
 * source text — `text-[${n}px]` is a class nothing ever emits.
 *
 * The bump is the same two pixels at either scale, so the distance between the
 * path and the page is a constant and the whole row simply gets bigger.
 */
export interface CrumbType {
  /** Every segment behind the leaf. */
  size: number;
  /** The leaf. */
  leafSize: number;
  /** 600 always; 700 when the leaf's emphasis is carried by the type. */
  leafWeight: number;
  /** Whether the leaf is painted. */
  chip: boolean;
}

export function crumbType(
  scale: CrumbScale,
  emphasis: CrumbEmphasis,
): CrumbType {
  const size = CRUMB_SCALE_PX[scale];
  const typed = emphasis === "type" || emphasis === "both";
  return {
    size,
    leafSize: typed ? size + CRUMB_EMPHASIS_BUMP_PX : size,
    leafWeight: typed ? 700 : 600,
    chip: emphasis === "chip" || emphasis === "both",
  };
}

/**
 * What stands between two crumbs, in whichever mark the axis asks for.
 *
 * One component for both renderers (Sep 23). The bar and `BuilderTrail` each
 * drew their own `<ChevronRight>` inline, which was fine while there was one
 * mark to draw; with a second, two inline branches would be two chances for
 * the bar and a builder to disagree about the row's rhythm — the exact class
 * of divergence lifting `planCrumbs` out of the builders was meant to end.
 *
 * The slash is sized and coloured to land where the chevron's ink lands
 * rather than to look correct on its own: 13px like the chevron's box, and the
 * caller's own muted token, so switching the axis changes the MARK and nothing
 * about the row's height, gaps or weight. It is deliberately not bolder — a
 * `/` at the same weight as the labels reads as punctuation between them,
 * which is what a separator is; heavier, it starts to read as content.
 *
 * `aria-hidden` on both, because the trail's structure is already carried by
 * the `<nav>` and `aria-current`; a screen reader announcing "slash" between
 * every segment is noise the sighted row does not have.
 */
export function CrumbSep({
  kind,
  className,
}: {
  kind: CrumbSeparatorKind;
  /** The surface's own muted ink — --hdr-* in the bar, --pg-* on a page. */
  className?: string;
}) {
  if (kind === "slash") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          // 13px wide, and the width is the point: a "/" advances about 4.7px
          // at this size where ChevronRight's box is a flat 13, so the naive
          // span made every gap in the trail 21px → 12.7px and took 25px off a
          // four-segment trail. Ashwin read that as the slash "crowding" the
          // row on Sep 23, which it is — but the crowding is the separator's
          // WIDTH changing, not its shape. Boxing the mark to the icon's width
          // means switching the option swaps the glyph and moves nothing else,
          // which is the only way the two can actually be compared.
          "flex w-[13px] shrink-0 justify-center text-[13px] leading-[normal] select-none",
          className,
        )}
      >
        /
      </span>
    );
  }
  return (
    <ChevronRight size={13} aria-hidden="true" className={cn("shrink-0", className)} />
  );
}

/**
 * How many segments stand on the row before the middle folds away.
 *
 * Four, from the Sep 22 review: three is the shortest trail the deep products
 * actually produce (bucket → product → page), so collapsing at three would fire
 * on trails nobody thinks are long. Five is where a laptop's bar starts losing
 * the leaf to the utilities, so four is the last count that always fits.
 */
export const CRUMB_VISIBLE_MAX = 4;

/**
 * How many segments `deep` leaves standing: the parent and the leaf.
 *
 * Two, because those are the two questions a trail is asked — where am I, and
 * what am I inside — and nothing above the parent answers either of them
 * without being read. Dropping to one (Home ▸ … ▸ current) was the tempting
 * version on Sep 22 and it answers only the first: you would know the page's
 * name, which the page itself already tells you, and nothing about its
 * container.
 */
export const CRUMB_DEEP_KEEP = 2;

/** A segment with the index it held in the original trail, so `last` survives collapsing. */
export interface PlacedCrumb {
  seg: Crumb;
  index: number;
}

/** One position on the row: a segment, or the button standing in for several. */
export type CrumbSlot =
  | ({ kind: "crumb" } & PlacedCrumb)
  | { kind: "overflow"; hidden: PlacedCrumb[] };

/**
 * Decide what stands on the row.
 *
 * `middle`: the first segment and the last three survive; the middle goes
 * behind the button. Collapsing from the END would be the easier code and the
 * wrong answer: the leaf is where you are and the crumb before it is what you
 * would click to step back, so those are the two the trail exists to show. The
 * root is kept for the same reason Home is — it is the only segment that says
 * which part of the product you are in at all.
 *
 * `deep`: Home ▸ … ▸ parent ▸ current at ANY depth. The root goes behind the
 * button too, which is the one place this mode disagrees with `middle` — and
 * deliberately so, since Home is already drawn (as the House button in the bar)
 * and a root that survives every fold is a second, weaker Home. Everything
 * between is in the same menu, so nothing becomes unreachable; it becomes one
 * click away instead of zero, which is the trade the option exists to show.
 *
 * The threshold under `deep` is "at least one segment to hide", not a segment
 * count: a `…` standing for nothing is a control that lies. So a two-segment
 * trail (Home ▸ Contacts ▸ Smart lists) is ALREADY the deep shape and renders
 * untouched, and Home ▸ Contacts stays a two-item row rather than growing a
 * button that opens an empty menu. Stated as `hidden.length === 0` rather than
 * `placed.length <= 2` because the rule is about the menu having contents, and
 * a count is that rule written down one step too late to survive an edit to
 * CRUMB_DEEP_KEEP.
 *
 * `collapse` off returns the trail untouched rather than a differently-shaped
 * array, so the default arrangement renders through exactly the code it did
 * before this option existed.
 */
export function planCrumbs(
  crumbs: readonly (string | Crumb)[],
  collapse: CrumbCollapse,
): CrumbSlot[] {
  const placed: PlacedCrumb[] = crumbs.map((crumb, index) => ({
    seg: typeof crumb === "string" ? { label: crumb } : crumb,
    index,
  }));
  const whole = (): CrumbSlot[] =>
    placed.map((p) => ({ kind: "crumb", ...p }));

  if (collapse === "off") return whole();

  if (collapse === "deep") {
    const hidden = placed.slice(0, placed.length - CRUMB_DEEP_KEEP);
    if (hidden.length === 0) return whole();
    return [
      { kind: "overflow", hidden },
      ...placed
        .slice(placed.length - CRUMB_DEEP_KEEP)
        .map((p) => ({ kind: "crumb" as const, ...p })),
    ];
  }

  if (placed.length <= CRUMB_VISIBLE_MAX) return whole();
  const tail = placed.slice(placed.length - (CRUMB_VISIBLE_MAX - 1));
  return [
    { kind: "crumb", ...placed[0] },
    { kind: "overflow", hidden: placed.slice(1, placed.length - (CRUMB_VISIBLE_MAX - 1)) },
    ...tail.map((p) => ({ kind: "crumb" as const, ...p })),
  ];
}

/*
 * One treatment now: no resting background on anything in this row.
 *
 * `call` used to keep a filled green disc — the last of four saturated discs,
 * held back because placing a call is irreversible. On its own it stopped
 * reading as emphasis and started reading as status: a green dot in the app
 * bar is where every other product in this industry puts "you are connected",
 * and it pulled the eye on every screen for an action almost nobody takes from
 * here. The row is now five grey glyphs, each with a disc that appears only
 * under the pointer.
 *
 * The tone survives as a field because the config still distinguishes the
 * call, and the next thing this row needs (a live-call state, say) is a real
 * reason for it to look different — one that is about what is happening rather
 * than about which button is scariest.
 */
const TONE_CLASSES: Record<HeaderActionTone, string> = {
  call: "text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg",
  plain: "text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg",
};

interface AppHeaderProps {
  /** Drives [data-header-theme], independent of the app's own theme. */
  theme: SurfaceTheme;
  /**
   * Whether the bar paints its own surface, and which edges it is inset from.
   *
   * `plane` is the default arrangement: no fill and no bottom rule, so the bar is
   * a breadcrumb and a row of glyphs sitting on the shell's plane alongside the
   * nav. `filled` keeps the measured white (or near-black) bar, which is what a
   * header themed against the plane still needs to stay legible.
   *
   * `joined` is the bar as the canvas's own top edge: the same fill, a hairline
   * under it, and the canvas gap dropped from its padding because the card it
   * lives in already carries that inset. Its corners are the card's — clipped by
   * the card, not rounded here — so the band reads as the surface's top rather
   * than a bar laid over it.
   */
  surface?: "plane" | "filled" | "joined";
  config?: HeaderConfig;
  /** Where you are: ["Contacts", "Smart lists"]. Home renders before it. */
  crumbs?: (string | Crumb)[];
  /** Home goes to the account's first product, whatever that is for this tenant. */
  onHome?: () => void;
  /**
   * The open record's own way out, when there is a record open.
   *
   * A prop and not a second read of the record-crumb context, because the bar
   * is not where that context is provided — the shell is, and it is already
   * holding this exact function (it is `useRecordCrumb`'s second argument,
   * arriving here as `recordCrumb.onExit`). Reaching back up for it would give
   * the bar a second opinion about whether a record is open, which is the one
   * thing the published-crumb model exists to prevent.
   *
   * Passed on EVERY record page, not only under the `crumb` placement: the
   * shell says whether a record is open, and the bar decides what to do with
   * that, the same division `recordCrumbShown` already runs on. So this being
   * defined means "a record is open", nothing more.
   */
  onRecordBack?: () => void;
  /**
   * The open page's title, count and description, for the no-trail case.
   *
   * A prop and not a context read, because the shell already OWNS this state:
   * PageHeadingContext exists so the page can publish upward, and the shell
   * renders AppHeader above that provider — the same arrangement pageCrumb
   * has. Reading the context here would have meant either moving the bar
   * inside the provider or keeping a second copy of the value, and both are
   * worse than handing it down the one edge that already exists.
   */
  pageHeading?: PageHeading | null;
  /**
   * Whether clicking that crumb would actually move.
   *
   * Asked of the shell rather than worked out here, because the answer needs
   * both halves of a comparison this component has neither of: what a crumb
   * id RESOLVES to (a group means its first product's first page) and where
   * the canvas currently is. The bar knows the labels; the shell knows the
   * routes.
   *
   * Absent means "assume yes", which keeps every caller that has not been
   * taught the question — `BuilderTrail`, the tests — drawing exactly as it
   * did.
   */
  crumbGoesSomewhere?: (id: string) => boolean;
  /**
   * Opens the Get the app modal.
   *
   * Owned by the shell now that the sidebar can open the same sheet. Two
   * surfaces cannot each keep their own copy of one modal's state without
   * eventually showing two of them, so neither keeps it.
   */
  onOpenApp: (kind: AppKind) => void;
  /**
   * Whether the entry is a field that wants its 230px, or a button that does
   * not. The bar cannot tell by looking — `entry` is an opaque node.
   */
  entryFills?: boolean;
  /**
   * The search + Ask AI pill, when the entry axis puts it up here.
   *
   * Passed in rather than built here: it is the nav's own control relocated,
   * and the shell already holds the session and the search opener it needs. The
   * bar just gives it a place to stand — to the LEFT of the utilities, so the
   * five glyphs keep the bar's right edge they have always held.
   */
  entry?: React.ReactNode;
}

/**
 * The 48px app bar, restructured per the header review: the tab strip is gone
 * — those destinations moved into the page title's dropdown, where the page
 * itself is the navigator — and what remains is orientation. Left: Home and
 * the breadcrumb naming where you are. Right: the utilities. Ask AI lives in
 * the nav's merged pill, and the nav's own toggle lives in the nav — the app
 * bar carries no chrome for either.
 */
export function AppHeader({
  theme,
  surface = "plane",
  config = headerConfig,
  crumbs = ["Contacts", "Smart lists"],
  onHome,
  onRecordBack,
  pageHeading,
  crumbGoesSomewhere,
  onOpenApp,
  entry,
  entryFills = true,
}: AppHeaderProps) {
  const {
    getAppPlacement,
    crumbEmphasis,
    crumbScale,
    crumbIcons,
    crumbCollapse,
    crumbShown,
    crumbHome,
    crumbSwitchers,
    crumbSeparator,
    crumbLeaf,
    recordBackButton,
    recordBackPlace,
    barPageHeading,
    barHeadingScale,
    headerEntrySide,
  } = useTheme().effective;
  /*
   * The page's own heading, drawn here only when there is no trail.
   *
   * The bar never invents this: PageHeader publishes it (page-heading.tsx) and
   * stands its own copy down in the same render, so the title exists in
   * exactly one place at a time. `crumbShown` is in the condition because
   * with a trail standing this would be the title/breadcrumb duplication the
   * Sep 22 research spent four documents arguing against — the move is only
   * on offer in the state that emptied the row.
   */
  const heading = !crumbShown && barPageHeading ? (pageHeading ?? null) : null;
  /*
   * And at what scale it is drawn once it is up here.
   *
   * Only meaningful while `heading` is non-null, so it is derived from it
   * rather than read on its own: with no heading in the bar there is no page
   * scale to grow to, and a bar that reserved the taller box for a heading it
   * is not drawing would be paying for the option twice.
   */
  const headingAtPageScale = !!heading && barHeadingScale === "page";
  /* Both axes resolved once — see `crumbType`. */
  const font = crumbType(crumbScale, crumbEmphasis);
  /*
   * The leaf's shape, after the switcher axis has had its say.
   *
   * `caret` and `dots` exist to CARRY the dropdown — they give up the word on
   * the understanding that the control is still there. With the switchers
   * off there is no control, so both would draw a glyph that opens nothing:
   * worse than either the word or no leaf at all. They fall back to the word,
   * which is the value that survives losing the menu.
   *
   * `none` and `title` are unaffected. Neither is about the menu — one
   * removes the segment and the other moves it — and both are still
   * meaningful on a trail that does not switch.
   */
  /*
   * Two questions the trail asks of the switcher axis, and they differ.
   *
   * `ancestorMenus` is the argument the option was really about — a rank of
   * carets down the row. `leafMenu` is the one segment whose menu has no
   * other home. `leaf` exists precisely so they can disagree.
   */
  const ancestorMenus = crumbSwitchers === "all" || crumbSwitchers === "ancestors";
  const leafMenu = crumbSwitchers === "all" || crumbSwitchers === "leaf";
  // "title" only holds while a page title is actually showing the leaf;
  // otherwise the crumb stays in the bar rather than vanishing.
  const leafClaimed = useLeafClaimed();
  const leaf: typeof crumbLeaf =
    crumbLeaf === "title" && !leafClaimed
      ? "full"
      : leafMenu || (crumbLeaf !== "caret" && crumbLeaf !== "dots")
        ? crumbLeaf
        : "full";
  /*
   * The back control, and the three conditions that have to agree before it
   * is drawn.
   *
   * `onRecordBack` is the shell saying a record is open — on a list or a
   * launchpad it is simply undefined and this whole branch is dead, so a
   * non-record bar renders through exactly the code it did before this
   * existed. `recordBackButton` is the master switch, and `recordBackPlace`
   * picks this placement over the page header's and the canvas's, which
   * contact-detail draws. One `&&` chain rather than a nested branch because
   * all three are the same question — "is there a back arrow on THIS row" —
   * and splitting them would let two of the three be true somewhere else.
   *
   * `crumbShown` is in the chain too, and that is a judgement, not a
   * convenience. Ashwin's reading on Sep 23, and it is the right one: the
   * left half's own note calls `crumbShown: false` "no trail at all", and
   * this arrow is chrome standing in the trail's slot wearing the trail's
   * idiom. Leaving it up would make "hide the breadcrumb" mean "hide all of
   * it but one button", which is a different option nobody asked for — the
   * same argument that already takes Home down with it. The counter-argument
   * was reachability: hide the trail on a record and there is no printed way
   * out. It loses because `recordBackPlace` is exactly the knob that answers
   * it — the placements the other agent draws are ON the page, so a bar with
   * no trail still has two working answers, and the one that costs the
   * option its meaning is not needed to supply a third.
   */
  const backInTrail =
    crumbShown && recordBackButton && recordBackPlace === "crumb" && !!onRecordBack;
  /*
   * The row is planned before it is drawn.
   *
   * Collapsing has to know the WHOLE trail — which segment is fourth from the
   * end is not something a `.map()` callback can answer without counting — and
   * the same plan has to be available to `BuilderTrail`, which draws this trail
   * when the bar has stood down. Hence a plain function over the array rather
   * than a render-time branch inside the loop: one rule, two renderers.
   */
  const slots = React.useMemo(
    () => planCrumbs(crumbs, crumbCollapse),
    [crumbs, crumbCollapse],
  );
  const lastIndex = crumbs.length - 1;
  /*
   * Home keeps its glyph in both modes and is not part of this: it is drawn
   * outside the trail, below, because it is the one crumb that is a destination
   * rather than a label. "home" therefore means "House and nothing else", which
   * is why this reads as a plain boolean over the segments.
   */
  const segIcons = crumbIcons === "all";
  /*
   * The trigger element, not a rect: useAnchored re-measures from it, and the
   * bar moves when the shell switches arrangement.
   */
  const [accountAnchor, setAccountAnchor] =
    React.useState<HTMLElement | null>(null);

  /*
   * The entry's box, defined once and stood at whichever end the axis names.
   *
   * 230px — wide enough for the placeholder and the keycap, narrow enough to
   * leave the breadcrumb its room on a laptop. A reserved width only for the
   * thing that needs one: where the entry is the Ask AI button rather than
   * the search field, 230px is 200-odd pixels of nothing, so the slot hugs
   * and gives the room back.
   *
   * One constant rather than the same JSX at both ends, so the two placements
   * can only ever differ in where they are.
   */
  const entrySlot = entry ? (
    <div className={cn("shrink-0", entryFills ? "w-[230px]" : "w-auto")}>
      {entry}
    </div>
  ) : null;

  return (
    <header
      data-header-theme={theme}
      // Inset shadows rather than borders, for the same reason as the nav:
      // Pencil overlays strokes, so a real border would shrink the 48px content
      // box and shift the content baseline. On the plane there is no rule at all
      // — the gap under the bar, and the floated canvas below it, are the
      // separation. Only the token is dropped, so the crumb menu that reads
      // --hdr-bg stays a real panel.
      className={cn(
        // The RIGHT is the canvas gap PLUS the page's own inset, rather than a value
        // of its own: the canvas is inset by the gap and the page inside it pads by
        // --page-inset, so summing them lands the bar's last utility on the same
        // edge as the content below. Exact there, because a utility's box IS its
        // visible edge.
        //
        // The LEFT is a literal 7px, set by Ashwin on Sep 23, and it is not the sum.
        // Two earlier answers were tried and both were wrong in the same direction:
        // the sum minus 6.5px (5.5px) put the Home GLYPH on the title's edge and the
        // trail's box 6.5px outside the content column, and the bare sum (12px) put
        // the box on the column and pushed the glyph 6.5px inside it. 7px splits the
        // difference deliberately — close enough to the column that the trail does
        // not read as hanging off it, close enough to the glyph that the House does
        // not read as indented. A judged number, so it is written as one rather than
        // dressed up as a calc() that would imply it falls out of the tokens.
        // 48px exactly, except under the page-scale heading, where the bar is
        // told its floor and left to grow: a 20px title over a 13px sentence
        // does not fit in 48px, and clipping it would be answering the option
        // with a worse version of the compact one. The utilities stay centred
        // on whatever height results, which is why this is min-h and not a
        // second fixed number to keep in step.
        headingAtPageScale
          ? "min-h-[48px] py-[8px]"
          : "h-[48px]",
        // `relative`, for the one placement that is positioned rather than
        // laid out: `centre` pins the entry to the middle of the WINDOW, which
        // a flex row cannot express without the two halves being equal widths.
        "relative flex w-full shrink-0 items-center justify-between pl-[7px]",
        // Joined, the canvas gap is already spent by the card's own margin, so the
        // bar pads by the page's inset alone and still lands on the content's edge.
        surface === "joined"
          ? "pr-[var(--page-inset)]"
          : "pr-[calc(var(--shell-canvas-gap)+var(--page-inset))]",
        surface === "plane"
          ? "bg-transparent"
          : "bg-hdr shadow-[inset_0_-1px_0_0_var(--hdr-border)]",
      )}
    >
      {/*
        The left half stays a box even when it holds nothing.

        `crumbShown: false` empties it rather than removing it, because the row
        is `justify-between`: with one child left, "between" becomes "at the
        start" and the five utilities would slide to the bar's LEFT edge — the
        one thing the option is not allowed to change. An empty flex item is
        zero pixels wide and keeps the utilities on the edge they have always
        held, so the trail's absence reads as space rather than as a rearranged
        bar.

        Home goes with it. The panel's own copy calls this state "no trail at
        all", and Home is a crumb — the one that is a destination rather than a
        label, but a crumb. Leaving the House standing would make "hide the
        breadcrumb" mean "hide all of it but the first segment", which is a
        different option nobody asked for.

        The record's back arrow goes with it for the same reason; the argument
        is written out at `backInTrail` above, where the condition lives.
      */}
      <div className="flex h-full min-w-0 items-center gap-[4px]">
        {/*
          The entry at the head of the row, when the axis puts it there.

          First, ahead of the record's back arrow and Home, because it is not
          part of the trail — it is a standing control that happens to be on
          the same line, and dropping it between the arrow and the path would
          put a search field inside the reading order of a breadcrumb.

          The pairing this exists for is `crumbShown: false`: with the tree in
          the column saying where you are, the trail's half of the bar is
          empty and this is what fills it. With the trail on, the two share
          the row — worth being able to look at, since "does the trail still
          fit" is the question the pairing asks.
        */}
        {entry && headerEntrySide === "left" ? entrySlot : null}
        {/*
          The page's heading, standing where the trail would have been.

          Two scales, picked by `barHeadingScale`.

          Compact is the default and the argued-for one: 13px semibold,
          matching the leaf crumb rather than the page's own 20px title,
          because this is a 48px bar shared with the utilities and a heading at
          page scale makes the bar taller. The count keeps its pill and the
          description follows on the same line.

          Page scale is the other side of that trade, asked for on Sep 23 so it
          can be seen rather than described: the heading keeps slot 05's sizes
          and its stacking, and the bar grows to hold it. Worth having on
          screen because the saving was never the heading's band — it is the
          gap between bar and canvas — and that is only visible when both are
          drawn the same size.

          `truncate` on the description and not on the title, deliberately: at
          a narrow window the sentence should lose its tail before the name
          loses a single letter.
        */}
        {heading ? (
          <div
            className={cn(
              "flex min-w-0 pl-[5px]",
              // Two arrangements of the same three strings. Compact keeps the
              // bar's line: baseline-aligned, description trailing. Page scale
              // is slot 05's own column — title and count on the first line,
              // description under them — so what moved up is the heading as
              // the page drew it, not a second design of it.
              headingAtPageScale
                ? "flex-col items-start gap-[2px]"
                : "items-baseline gap-[8px]",
            )}
          >
            <div className="flex min-w-0 items-center gap-[8px]">
              <span
                className={cn(
                  "font-semibold text-hdr-fg",
                  headingAtPageScale
                    ? "min-w-0 truncate text-[20px] leading-[normal] tracking-[-0.2px]"
                    : "shrink-0 text-[13px] leading-[normal]",
                )}
              >
                {heading.title}
              </span>
              {heading.count ? (
                <span
                  className={cn(
                    "shrink-0 rounded-[5px] bg-hdr-chip font-medium text-hdr-fg-muted tabular-nums",
                    headingAtPageScale
                      ? "rounded-[6px] px-[8px] py-[2px] text-[12.5px] leading-[18px]"
                      : "px-[6px] text-[11.5px] leading-[18px]",
                  )}
                >
                  {heading.count}
                </span>
              ) : null}
            </div>
            {heading.description ? (
              <span
                className={cn(
                  "min-w-0 truncate text-hdr-fg-muted",
                  headingAtPageScale
                    ? "text-[13px] leading-[normal]"
                    : "text-[12.5px] leading-[normal]",
                )}
              >
                {heading.description}
              </span>
            ) : null}
          </div>
        ) : null}
        {/*
          The record's exit, at the head of the row (Sep 23, Ashwin's ask for
          three placements to argue between).

          LEFT of Home, which is the only spot on this row that does not lie.
          Between Home and the first crumb was the other candidate and it is
          wrong twice: it would sit inside the <nav>'s reading order as if it
          were a segment, and it would break the row's one rhythm — House,
          mark, word, mark, word — with a second glyph that is not a place.
          Out here it reads as what it is: the way back, on the side
          navigation lives on, before the path starts.

          Deliberately NOT boxed the way the builder's exit arrow in app-shell
          is. That one is alone on a bar the builder stripped, so it needs a
          resting fill to stop reading as a naked glyph; this one stands
          beside the House, which has the same 28px target and the same 15px
          glyph and the same hover-only chip. Matching it is what makes the
          two read as one row of navigation rather than as a control and a
          decoration.

          No separator after it, and that is the `crumbHome || i > 0` rule
          below holding rather than being worked around. That rule says a
          separator points BACK at something — and what it points at has to be
          a PLACE, or "‹ ▸ Contacts" claims the arrow is an ancestor of
          Contacts. It is not; it is an action that closes the record. So the
          first mark on this row still belongs to Home exactly as before, and
          with `crumbHome: false` the row still opens with a bare word — the
          arrow changes what precedes the trail, not what the trail points at.
        */}
        {backInTrail ? (
          <button
            type="button"
            title="Back"
            aria-label="Back"
            onClick={onRecordBack}
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg active:scale-95"
          >
            <ArrowLeft size={15} aria-hidden="true" />
          </button>
        ) : null}

        {crumbShown && crumbHome ? (
        <button
          type="button"
          title="Home"
          aria-label="Home"
          onClick={onHome}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg active:scale-95"
        >
          <House size={15} aria-hidden="true" />
        </button>
        ) : null}

        {crumbShown ? (
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-[4px]">
          {slots.map((slot, i) => {
            const last = slot.kind === "crumb" && slot.index === lastIndex;
            /*
             * The leaf, under whichever reading of it is on.
             *
             * Resolved here rather than inside the branch below because two
             * of the five values remove the segment ENTIRELY, and a removed
             * segment has to take its separator with it — the mark points
             * back at something, and a chevron with nothing after it is the
             * trail claiming a level it is not showing. Only `last` is ever
             * affected; every ancestor falls through untouched, which is what
             * makes this an axis about the end of the line rather than about
             * the trail.
             */
            /*
              Both values that remove the segment, and they remove it the same
              way: the whole Fragment goes, so the separator pointing at it
              goes too and the crumb before it becomes the last, drawn as one.

              "none" left this control on Sep 29 for `crumbDepth` and came
              back on Sep 30 — see CrumbLeaf. Trimming the array upstream was
              the right shape for a path-length control and the wrong one for
              this: `crumbDepth` will not cut below two segments, which is
              most of the app's trails, so on a listing page the option did
              nothing. Removing the leaf here has no such floor, because the
              question is not how long the path is.
            */
            /*
             * `none` takes the PAGE off the end, never the product.
             *
             * Ashwin, Sep 30, on Opportunities: the trail should read CRM ▸
             * Opportunities with the header saying Opportunities, and what
             * the option is for is hiding the L3 that repeats it. Dropping
             * the leaf blindly left "CRM" — a bucket, which is a grouping
             * rather than a place, so the trail named nowhere at all.
             *
             * `title` is unaffected: that one hands the leaf to the page
             * title rather than deleting it, so a product leaf is still on
             * screen after the move.
             */
            const leafIsPage =
              slot.kind !== "overflow" &&
              slot.seg.level !== "group" &&
              slot.seg.level !== "product";
            const leafGone =
              last && (leaf === "title" || (leaf === "none" && leafIsPage));
            if (leafGone) return null;
            return (
              <React.Fragment
                key={
                  slot.kind === "overflow"
                    ? "crumb-overflow"
                    : `${slot.seg.label}-${slot.index}`
                }
              >
                {/*
                  A separator points BACK at something. The bar could draw one
                  before every crumb only because Home preceded them all; drop
                  Home and the same rule opens the row with a mark pointing at
                  the bar's left padding, which reads as a truncated trail
                  rather than a shorter one. So the leading mark is exactly the
                  Home button's mark, and dies with it — the same `i > 0` rule
                  `BuilderTrail` has always used for the same reason.
                */}
                {crumbHome || i > 0 ? (
                  <CrumbSep
                    kind={crumbSeparator}
                    className="text-hdr-fg-muted opacity-60"
                  />
                ) : null}
                {slot.kind === "overflow" ? (
                  <CrumbOverflow
                    hidden={slot.hidden}
                    theme={theme}
                    switchers={ancestorMenus}
                  />
                ) : (last ? leafMenu : ancestorMenus) &&
                  slot.seg.options &&
                  slot.seg.options.length > 0 ? (
                  <CrumbMenu
                    seg={slot.seg}
                    last={last}
                    font={font}
                    showIcon={segIcons}
                    theme={theme}
                    {...(last && (leaf === "caret" || leaf === "dots")
                      ? { shape: leaf }
                      : {})}
                  />
                ) : (
                  /*
                    Where a crumb lands with no menu of its own — every
                    segment under `crumbSwitchers: "off"`, the ancestors under
                    `"leaf"`, and any level with no siblings to offer — and the
                    reason that option needed no second renderer: a segment
                    with no siblings to offer has always drawn as a word, so
                    "no switchers" is the existing wordless branch taken by
                    every segment rather than a new, flatter trail built beside
                    the real one. `CrumbMenu` and `CrumbOptions` are simply not
                    reached — no caret, no hover chip, no menu state mounted
                    and waiting for a click that cannot come.

                    It used to be a word and never a link, on the argument that
                    a crumb's destination in this shell IS its menu — `onSelect`
                    only ever fires with an option's id, so there was no "go to
                    this level" route to call. That was true of the plumbing and
                    wrong about the object: a trail you cannot walk back up is
                    not a breadcrumb, it is a label that happens to have
                    chevrons in it, and turning the dropdowns off was never
                    meant to cost the trail its one job. Ashwin, Sep 24.

                    The route was there all along. Each crumb's `options` are
                    the siblings AT that level, and exactly one of them is the
                    crumb itself wearing `selected` — so the crumb's own id is
                    `crumbTargetFor`, and `onSelect` takes it like any other.
                    Nothing new is invented and nothing is routed twice: this
                    is the same call the menu's selected row already makes.
                  */
                  <CrumbWord
                    seg={slot.seg}
                    last={last}
                    font={font}
                    showIcon={segIcons}
                    {...(crumbGoesSomewhere ? { leadsSomewhere: crumbGoesSomewhere } : {})}
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>
        ) : null}
        {/*
          The entry travelling with the trail, when the axis asks for it.

          Inside the left box and after the `<nav>`, so it is pushed along by
          the path rather than standing at an edge: on Contacts it sits near
          the left, three crumbs deep it has moved right. Outside the `<nav>`
          element itself, because it is not a segment — a search field in the
          breadcrumb's reading order would be announced as part of the path.
        */}
        {entry && headerEntrySide === "trail" ? (
          <span className="flex shrink-0 items-center pl-[8px]">
            {entrySlot}
          </span>
        ) : null}
      </div>
      {/*
        Centred on the bar, the omnibox arrangement.

        Absolutely positioned rather than a third flex child: `justify-between`
        would centre it in the SPACE between the trail and the utilities, which
        moves every time a crumb is added — and a control that shifts as you
        navigate is the thing the other placements are avoiding. Pinned to the
        window's midline it is a fixed target.

        `pointer-events-none` on the wrapper with the slot taking them back, so
        the invisible half of a 230px box centred over the bar cannot swallow a
        click aimed at a crumb underneath it.
      */}
      {entry && headerEntrySide === "centre" ? (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 items-center">
          <span className="pointer-events-auto">{entrySlot}</span>
        </div>
      ) : null}

      <div className="flex shrink-0 items-center gap-[12px]">
        {/*
          The merged pill, when the entry axis puts it up here and leaves it
          on this edge.

          Nothing is duplicated by it: the nav gives the control up entirely
          in this arrangement, so this is the same single entry point standing
          somewhere else. The box itself is `entrySlot`, shared with the
          other placement — see its note for the width.
        */}
        {entry && headerEntrySide === "right" ? entrySlot : null}

        <div className="flex shrink-0 items-center gap-[8px]">
          {/*
            The companion apps as standing glyphs, when the axis puts them here.

            First in the row, so they read as an offer rather than as another
            utility: the five that follow are things this account DOES, and the
            phone is where that run starts. Same 26px target and the same muted
            tone, because an offer that shouts in the app bar is an ad.
          */}
          {getAppPlacement === "header" ? (
            <>
              <AppGlyph
                icon={Smartphone}
                label={GET_APP_LABELS.mobile}
                onSelect={() => onOpenApp("mobile")}
              />
              <AppGlyph
                icon={Monitor}
                label={GET_APP_LABELS.desktop}
                onSelect={() => onOpenApp("desktop")}
              />
            </>
          ) : null}

          {config.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.label}
              aria-label={action.label}
              className={cn(
                "relative flex size-[26px] shrink-0 items-center justify-center rounded-full",
                "motion-tap hover:scale-110 active:scale-95 motion-press",
                TONE_CLASSES[action.tone],
              )}
            >
              {/*
                One size, now that the call is unfilled like the rest. The 15px
                was the smaller glyph a filled disc needs; on a bare icon it
                just read as a phone drawn two points too small.
              */}
              <action.icon size={18} aria-hidden="true" />
              {action.dot ? (
                <span
                  aria-hidden="true"
                  className="absolute top-[3px] right-[3px] size-[6px] rounded-full bg-hdr-act-alert shadow-[0_0_0_1.5px_var(--hdr)]"
                />
              ) : null}
            </button>
          ))}

          <button
            type="button"
            title="Account"
            aria-label="Account"
            aria-haspopup="menu"
            aria-expanded={accountAnchor !== null}
            onClick={(e) => {
              /*
               * The element is read HERE, not inside the updater.
               *
               * React nulls `currentTarget` once the handler returns, and a
               * functional updater runs later, during the render it schedules —
               * so reading it in there yielded null and the menu opened anchored
               * to nothing, which renders as not opening at all. It worked on
               * the first click and silently stopped working on every one after,
               * which is the worst shape a bug like this can take.
               *
               * Toggling on the trigger, so a second click closes rather than
               * re-anchoring the menu already open under the pointer.
               */
              const trigger = e.currentTarget;
              setAccountAnchor((open) => (open ? null : trigger));
            }}
            className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-full motion-press hover:scale-110 active:scale-95"
          >
            <UserAvatar size={26} initials={config.avatarInitials} />
          </button>
        </div>
      </div>

      {accountAnchor ? (
        <AccountMenu
          anchor={accountAnchor}
          name={config.userName}
          email={config.userEmail}
          initials={config.avatarInitials}
          showApps={getAppPlacement === "menu"}
          onOpenApp={onOpenApp}
          onClose={() => setAccountAnchor(null)}
        />
      ) : null}

    </header>
  );
}

/**
 * A crumb that switches. The label wears a small chevron; clicking opens the
 * sibling list, with the current one checked. Same one-menu-at-a-time,
 * Escape-and-click-away manners as every other menu in the shell.
 */
/**
 * One level of a crumb menu, and every level below it.
 *
 * Submenus open on hover and close when the pointer leaves the whole row —
 * including the submenu itself, which is why the handlers sit on the wrapper
 * rather than the button. Keyboard users get the same thing from the row's own
 * focus, since a focused parent keeps its child mounted.
 */
const SUBMENU_WIDTH = 230;

function CrumbOptions({
  options,
  onPick,
  theme,
  depth = 0,
}: {
  options: CrumbOption[];
  onPick: (id: string) => void;
  /** The hdr-* tokens live under [data-header-theme], which the portal leaves. */
  theme: SurfaceTheme;
  depth?: number;
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  /*
   * Submenus are portalled to the body, not nested in the panel.
   *
   * The panel scrolls (`overflow-y-auto`), and an absolutely positioned child of
   * a scroll container is clipped by it — which is exactly what happened: the
   * cascade opened and was cropped to the parent menu's box. Fixed position from
   * the row's own rect escapes that, and flips left when the panel would run off
   * the right edge.
   */
  const [anchor, setAnchor] = React.useState<{
    left: number;
    top: number;
  } | null>(null);

  const openAt = (id: string, el: HTMLElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    /*
     * Shift to fit, do not flip.
     *
     * Flipping a third-level panel to the left of its row lands it on top of the
     * first panel, which is worse than being tight against the edge — you lose
     * the trail you walked in on. Clamping keeps every level readable and the
     * chain intact, which is what menus conventionally do when space runs out.
     */
    setAnchor({
      left: Math.max(
        8,
        Math.min(rect.right - 4, window.innerWidth - SUBMENU_WIDTH - 8),
      ),
      top: Math.max(8, Math.min(rect.top - 5, window.innerHeight - 140)),
    });
    setOpenId(id);
  };

  return (
    <>
      {options.map((option) => {
        const nested = (option.children?.length ?? 0) > 0;
        const showing = nested && openId === option.id;
        return (
          <div
            key={option.id}
            className="relative"
            onPointerEnter={(e) =>
              nested
                ? openAt(option.id, e.currentTarget as HTMLElement)
                : setOpenId(null)
            }
            onPointerLeave={() => setOpenId(null)}
          >
            <button
              type="button"
              role="menuitemradio"
              aria-checked={option.selected ?? false}
              aria-haspopup={nested ? "menu" : undefined}
              aria-expanded={nested ? showing : undefined}
              onClick={() => onPick(option.id)}
              onFocus={(e) =>
                nested
                  ? openAt(option.id, e.currentTarget.parentElement)
                  : setOpenId(null)
              }
              className="motion-tap flex w-full items-center gap-[8px] rounded-[7px] px-[9px] py-[7px] text-left hover:bg-hdr-chip"
            >
              {option.icon ? (
                <option.icon
                  size={15}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0",
                    option.selected ? "text-hdr-fg" : "text-hdr-fg-muted",
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[13px] leading-[18px]",
                  option.selected
                    ? "font-semibold text-hdr-fg"
                    : "text-hdr-fg-muted",
                )}
              >
                {option.label}
              </span>
              {option.selected ? (
                <Check size={13} aria-hidden="true" className="shrink-0 text-hdr-fg" />
              ) : null}
              {nested ? (
                <ChevronRight
                  size={13}
                  aria-hidden="true"
                  className="shrink-0 text-hdr-fg-muted opacity-70"
                />
              ) : null}
            </button>

            {showing && anchor
              ? createPortal(
                  <div
                    role="menu"
                    aria-label={option.label}
                    data-header-theme={theme}
                    style={{ left: anchor.left, top: anchor.top, width: SUBMENU_WIDTH }}
                    // Overlaps the parent by 4px so the pointer never crosses a
                    // gap on its way in.
                    className="fixed z-[60] max-h-[min(70vh,460px)] overflow-y-auto rounded-[10px] bg-hdr p-[5px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.2),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--hdr-border)]"
                    onPointerEnter={() => setOpenId(option.id)}
                    onPointerLeave={() => setOpenId(null)}
                  >
                    <CrumbOptions
                      options={option.children ?? []}
                      onPick={onPick}
                      theme={theme}
                      depth={depth + 1}
                    />
                  </div>,
                  document.body,
                )
              : null}
          </div>
        );
      })}
    </>
  );
}

/**
 * The crumb's own destination, recovered from its sibling list.
 *
 * A `Crumb` carries no id of its own — it never needed one, because the only
 * thing that ever navigated was a row in its menu. But the menu lists the
 * siblings AT this level and marks the current one, so the crumb's id is
 * simply the selected option's. Reading it back out is cheaper and safer than
 * threading a new `id` through every trail builder in the shell, each of which
 * would then be a place the id could disagree with the options beside it.
 *
 * Null when a crumb has no options — a published record crumb, a plain string
 * segment. Those have no sibling list and therefore no id to find, and they go
 * on drawing as words, which is honest: there is nowhere for them to go that
 * is not where you already are.
 */
function crumbTargetFor(seg: Crumb): string | null {
  return seg.options?.find((o) => o.selected)?.id ?? null;
}

/**
 * A crumb with no dropdown — still a step you can walk back to.
 *
 * Two renderings behind one name, because the choice between them is not a
 * design decision the caller should be making: a segment is a link when there
 * is somewhere to go and a word when there is not, and the caller cannot tell
 * which without repeating the lookup above.
 *
 * The leaf is always a word. It is the page you are on, so a link would be a
 * control that does nothing, and `aria-current="page"` already says as much to
 * anyone not looking at it.
 */
function CrumbWord({
  seg,
  last,
  font,
  showIcon,
  leadsSomewhere,
}: {
  seg: Crumb;
  last: boolean;
  font: ReturnType<typeof crumbType>;
  showIcon: boolean;
  /** See `AppHeaderProps.crumbGoesSomewhere`. Absent means "assume yes". */
  leadsSomewhere?: (id: string) => boolean;
}) {
  /*
   * A crumb whose destination is where you already are draws as a word.
   *
   * Standing on Conversations ▸ Inbox, "CRM" resolves to Contacts ▸ Smart
   * lists and "Conversations" resolves to Inbox — the page under your feet.
   * Both were links a moment ago and one of them did nothing, which is worse
   * than a plain label: the hover says "this is a way out of here", the
   * click proves it is not, and the reader is left doubting the other crumbs
   * too. So the hover is spent only where there is somewhere to go.
   *
   * Note this is a property of the PAGE, not of the level. The same
   * "Conversations" crumb lights up from Conversations ▸ Settings, because
   * from there its first page is somewhere else. Ashwin, Sep 24.
   */
  const own = last ? null : crumbTargetFor(seg);
  const target = own !== null && (leadsSomewhere?.(own) ?? true) ? own : null;
  const go = seg.onSelect;
  // A stated destination, for the crumbs that have no options to infer one
  // from. Checked before the derived target so a segment carrying both — a
  // scope picker inside a folder — walks to the place rather than re-selecting
  // the option it is already on.
  const direct = last ? undefined : seg.onNavigate;

  const inner = (
    <>
      {seg.icon && showIcon ? (
        <seg.icon size={14} aria-hidden="true" className="shrink-0 opacity-80" />
      ) : null}
      <span className="truncate">{seg.label}</span>
    </>
  );

  /*
    px-[5px] matches CrumbMenu's own chip inset, and it is here for the reason
    Ashwin gave on Sep 23: turning switchers off should remove the CARET, not
    re-space the trail. Without it this branch drew its label flush while the
    switcher branch kept its 5px, so flipping the option narrowed every gap in
    the row by 10px — one option reading as two changes.
  */
  const base = cn(
    "flex min-w-0 items-center gap-[5px] truncate px-[5px] leading-[normal] whitespace-nowrap",
    last ? "text-hdr-fg" : "text-hdr-fg-muted",
    // Painted rather than merely bold, so the page below can stop printing its
    // own title. The padding is pulled back out of the row with a negative
    // margin on the vertical axis only: a chip that grew the 48px bar's
    // content box would move every glyph beside it.
    last && font.chip && CRUMB_LEAF_CHIP,
  );

  const style = {
    fontSize: last ? font.leafSize : font.size,
    fontWeight: last ? font.leafWeight : undefined,
  };

  if (!direct && (target === null || !go)) {
    return (
      <span aria-current={last ? "page" : undefined} style={style} className={base}>
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (direct ? direct() : go?.(target!))}
      style={style}
      /*
        The switcher branch's own hover chip, minus the caret.

        Without it the row gives no sign that anything here is pressable, and
        a trail that navigates silently is only half the fix — the point of
        the change is that someone can SEE their way back up. `py-` still
        stays off: the chip's vertical padding would grow the 48px content
        box, which is the same constraint the wordless branch always had.
      */
      className={cn(base, "motion-tap rounded-[6px] hover:bg-hdr-chip hover:text-hdr-fg")}
    >
      {inner}
    </button>
  );
}

/**
 * One companion-app glyph in the app bar.
 *
 * Deliberately not a `HeaderAction`: those are authored in header-config and
 * carry tones, dots and counts because they report on the account. This reports
 * on nothing — it is a door — so it takes the quietest tone in the row and none
 * of the machinery.
 */
function AppGlyph({
  icon: Icon,
  label,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onSelect}
      className={cn(
        "relative flex size-[26px] shrink-0 items-center justify-center rounded-full",
        "motion-tap text-hdr-fg-muted hover:scale-110 hover:text-hdr-fg active:scale-95 motion-press",
      )}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}

function CrumbMenu({
  seg,
  last,
  theme,
  font,
  showIcon = true,
  shape,
}: {
  seg: Crumb;
  last: boolean;
  theme: SurfaceTheme;
  /** The trail's resolved type. Only the leaf takes the emphatic half of it. */
  font: CrumbType;
  /** False under `crumbIcons: "home"`, where House is the row's only glyph. */
  showIcon?: boolean;
  /**
   * The leaf's own shape, when it is not the full word.
   *
   * Only ever passed for the last crumb, and only for the two values that
   * keep a control: `caret` drops the word and keeps the arrow, `dots` swaps
   * both for the overflow mark. `none` and `title` never reach here — those
   * remove the segment before it is rendered.
   *
   * A prop rather than a read of the axis inside, because this component
   * draws every ancestor too and they are not affected by it. Reading the
   * theme here would mean re-deriving "am I the leaf" in a second place.
   */
  shape?: "caret" | "dots";
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /*
   * Where the WORD goes.
   *
   * EVERY level, including the leaf and including a level whose first page is
   * the one you are standing on. `CrumbWord` withholds the link in both of
   * those cases — Ashwin's Sep 24 rule, that a hover promising a way out
   * followed by a click that does nothing leaves you doubting the whole trail
   * — and that rule was written when the crumb was ONE control. It is not any
   * more. The caret beside this word is the switcher, so the word has exactly
   * one meaning left: "the place this segment names". Clicking Contacts from
   * Contacts ▸ Smart lists lands on Smart lists because that is Contacts's
   * first page, which is the answer Ashwin gave on Sep 30 and the answer a
   * reader expects; clicking the leaf lands on the leaf. A no-op navigation is
   * the honest outcome of "take me there" when you are already there, and it
   * costs nothing — where the older rule cost the trail its most predictable
   * gesture.
   */
  const own = crumbTargetFor(seg);
  const walkUp =
    seg.onNavigate ??
    (own !== null && seg.onSelect ? () => seg.onSelect!(own) : null);

  const labelStyle = {
    fontSize: last ? font.leafSize : font.size,
    fontWeight: last ? font.leafWeight : undefined,
  };
  const labelClass = cn(
    "truncate leading-[normal] whitespace-nowrap",
    last ? "text-hdr-fg" : "text-hdr-fg-muted",
  );
  /*
   * One box for the word, whether it is a link or a label.
   *
   * Shared rather than written twice so the two renderings cannot drift: a
   * crumb that changed width when it stopped being clickable would re-space
   * the whole row as you walked around the app. The leaf's chip already
   * carries the outer inset, so the halves sit inside it instead of each
   * adding their own.
   */
  const wordHalf = cn(
    "flex min-w-0 items-center gap-[5px] rounded-[6px] py-[3px] pr-[3px]",
    last && font.chip ? "pl-[7px]" : "pl-[5px]",
  );
  const icon =
    seg.icon && showIcon && !shape ? (
      <seg.icon
        size={14}
        aria-hidden="true"
        className={cn(
          "shrink-0 opacity-80",
          last ? "text-hdr-fg" : "text-hdr-fg-muted",
        )}
      />
    ) : null;
  const caret =
    shape === "dots" ? (
      /*
        The overflow mark, doing a switcher's job.

        Bigger than the caret and not rotated, because it is not an arrow
        promising a direction — it is the "there is more here" glyph the rest
        of this product already uses, and the whole point of the variant is
        to ask whether that reads as switchable where an arrow reads as
        decoration.
      */
      <MoreHorizontal
        size={14}
        aria-hidden="true"
        className={cn(
          "shrink-0 text-hdr-fg-muted",
          open ? "opacity-90" : "opacity-70",
        )}
      />
    ) : (
      /*
        A standing caret after all. The Aug 13 note dropped it because a rank
        of glyphs read as noise, but with icons now leading each segment the
        trail no longer reads as switchable at all — hover is not an
        affordance you can see. Kept small and faint so it sits under the
        label rather than beside it.
      */
      <CaretDown
        size={11}
        className={cn(
          "shrink-0 text-hdr-fg-muted motion-move",
          open ? "rotate-180 opacity-90" : "opacity-70",
        )}
      />
    );

  /*
   * TWO CONTROLS, NOT ONE (Sep 30, Ashwin).
   *
   * The crumb was a single button that opened the menu, so the one gesture
   * every reader tries first — press the word — did the one thing a
   * breadcrumb is not for. Walking back up a path was only possible on the
   * segments that had NO dropdown, which is exactly backwards: the richer a
   * crumb was, the less it behaved like a crumb.
   *
   * So the word navigates and the caret switches. They stay inside one box
   * with one rounded outline and light up separately on hover, which is what
   * says they are two halves of one crumb rather than two crumbs — and what
   * lets someone aim. The gap between them went 3px → 5px: the caret is a
   * target now and needs to be visibly beside the word rather than tucked
   * under it.
   *
   * THE WORD NEVER OPENS THE MENU, not even where it has nowhere to go.
   * That was the first cut of this and it was half a rule: the leaf, and any
   * ancestor resolving to the page you are standing on, fell back to opening
   * the dropdown, so "press the word" still meant two different things
   * depending on which crumb you pressed. Ashwin, twice.
   *
   * Where there is nothing to walk back to, the word is plain text — the
   * same answer `CrumbWord` has given since Sep 24, and the same reasoning:
   * a hover that says "this is a way out of here" followed by a click that
   * proves it is not leaves the reader doubting the other crumbs too. The
   * caret beside it is unaffected and still opens the siblings, so nothing
   * is unreachable; it is one target smaller.
   */

  return (
    <div
      className={cn(
        /*
          No flex gap: the 5px between the word and the caret (3 was the old
          figure, and Ashwin asked for two more) is the halves' own padding,
          so each one's hover chip reaches its neighbour and the two tile the
          crumb. The extra pixels matter because the caret is a target now,
          and a glyph tucked against a label reads as part of it.
        */
        "relative flex min-w-0 items-center rounded-[6px]",
        open && "bg-hdr-chip",
        // No chip behind a wordless leaf: the paint exists to mark a WORD as
        // the page's name, and wrapped around a lone glyph it reads as a
        // second kind of button rather than as emphasis.
        last && font.chip && !shape && CRUMB_LEAF_PAINT,
      )}
    >
      {/*
        The word. A link where the level is somewhere else, and the menu's
        own trigger where it is not — see `wordOpensMenu`.
      */}
      {shape ? null : walkUp ? (
        <button
          type="button"
          aria-current={last ? "page" : undefined}
          onClick={() => walkUp()}
          className={cn(wordHalf, "motion-tap hover:bg-hdr-chip hover:text-hdr-fg")}
        >
          {icon}
          <span style={labelStyle} className={labelClass}>
            {seg.label}
          </span>
        </button>
      ) : (
        <span aria-current={last ? "page" : undefined} className={wordHalf}>
          {icon}
          <span style={labelStyle} className={labelClass}>
            {seg.label}
          </span>
        </span>
      )}

      {/*
        The caret, and nothing else, opens the menu.

        Its own button with its own hit box — 11px of glyph is not a target,
        so the padding around it is doing the work. `aria-label` carries the
        level's name, because "open" on its own says nothing about what.
      */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Switch ${seg.label}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-tap flex shrink-0 items-center rounded-[6px] py-[3px] hover:bg-hdr-chip",
          // Wordless, the glyph IS the crumb and stands in the inset a word
          // would have had. Beside a word, the 3px on the word's right and
          // the 2px here are what make the 5px gap Ashwin asked for — as
          // PADDING rather than as a flex gap, so each half's hover chip
          // fills its share of the crumb and the two tile it between them.
          // Built as a gap, the highlight stopped a pixel after the word and
          // the crumb looked clipped.
          shape ? "px-[5px]" : "pr-[5px] pl-[2px]",
          last && font.chip && !shape && "pr-[7px]",
        )}
      >
        {caret}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            aria-label={`Switch ${seg.label}`}
            className="absolute top-[calc(100%+6px)] left-0 z-50 max-h-[400px] w-[240px] overflow-y-auto rounded-[10px] bg-hdr p-[5px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.2),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--hdr-border)]"
          >
            <CrumbOptions
              options={seg.options ?? []}
              theme={theme}
              onPick={(id) => {
                setOpen(false);
                seg.onSelect?.(id);
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * The hidden middle of a collapsed trail, and the button that reveals it.
 *
 * It renders through `CrumbOptions` — the same cascade the switcher crumbs use
 * — rather than a flat list of the levels that fell off the row. Flattening was
 * the first shape and it was wrong: what you lose when the middle collapses is
 * not only "which levels are up there" but "what else was beside them", and a
 * hidden level that had siblings still has them. So each hidden level is a row,
 * and its siblings cascade to the right off that row, exactly as they would
 * have from the crumb itself.
 *
 * Ids are rewritten on the way in and the picks routed back through a map,
 * because two hidden levels can perfectly well publish the same option id (a
 * bucket and a product both offering "Overview") and `CrumbOptions` reports a
 * pick as an id alone. Parsing a namespaced string back apart would work until
 * the first id with a colon in it.
 */
function buildOverflowMenu(hidden: PlacedCrumb[]) {
  const actions = new Map<string, () => void>();
  let n = 0;
  const walk = (
    options: CrumbOption[],
    onSelect: ((id: string) => void) | undefined,
  ): CrumbOption[] =>
    options.map((option) => {
      const id = `ov-${n++}`;
      if (onSelect) actions.set(id, () => onSelect(option.id));
      return {
        ...option,
        id,
        children: option.children ? walk(option.children, onSelect) : undefined,
      };
    });

  const options: CrumbOption[] = hidden.map(({ seg }) => {
    const id = `ov-${n++}`;
    /*
      The LEVEL row now navigates too.

      It used to be inert scaffolding whose only job was to hang the sibling
      cascade off — which is why switching the dropdowns off used to leave
      this whole menu unreachable. A level knows its own destination (see
      `crumbTargetFor`), so the row that names it can go there, and the
      cascade beside it stays exactly what it was.
    */
    const own = crumbTargetFor(seg);
    if (own !== null && seg.onSelect) {
      const go = seg.onSelect;
      actions.set(id, () => go(own));
    }
    return {
    id,
    label: seg.label,
    /*
      The menu keeps its glyphs under `crumbIcons: "home"`. That option is about
      the ROW — a rank of icons on one line at depth — and a menu is a list,
      where the glyph is doing the work it does everywhere else in this shell.
    */
    icon: seg.icon,
    children: seg.options ? walk(seg.options, seg.onSelect) : undefined,
    };
  });
  return { options, actions };
}

export function CrumbOverflow({
  hidden,
  theme,
  onPick,
  switchers = true,
}: {
  hidden: PlacedCrumb[];
  /** --hdr-* is scoped under [data-header-theme]; the panel portals out of it. */
  theme: SurfaceTheme;
  /**
   * Run for EVERY row instead of the crumb's own `onSelect`.
   *
   * For the builders, where the trail's only question is "get me out" and
   * honouring each ancestor's destination would smuggle a second navigation
   * model into a surface that has no room for the first one.
   */
  onPick?: () => void;
  /** False unless every crumb switches; see the note on the marker below. */
  switchers?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const { options: full, actions } = React.useMemo(
    () => buildOverflowMenu(hidden),
    [hidden],
  );
  /* Levels only, no sibling cascade — see the note below. */
  const options = React.useMemo(
    () =>
      switchers
        ? full
        : full.map((o) => ({ ...o, children: undefined })),
    [full, switchers],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /*
   * With switchers off the `…` stays, and it stays a control.
   *
   * It stays because collapsing and switching are different questions.
   * `crumbCollapse` is about the ROW's length: it takes levels off the line,
   * and the mark is the trail admitting it. Dropping the mark with the menus
   * would leave "Home ▸ Services" standing for a four-level path — a trail
   * that does not merely say less, but says something untrue about its own
   * depth.
   *
   * It used to stop being a control here, on the argument that a level row
   * had no action of its own and everything clickable inside was the sibling
   * cascade this option exists to remove. The first half of that is no longer
   * true: a level knows where it is (`crumbTargetFor`), so the rows in here
   * are destinations even with every cascade stripped out. Leaving it inert
   * would mean the middle of a collapsed trail is the one part you cannot
   * walk back to — the same hole the visible crumbs just had, hidden behind
   * a glyph. Ashwin, Sep 24.
   *
   * What the option still removes is the SIDEWAYS move: `flat` drops every
   * `children`, so the panel lists the path and nothing else.
   */
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={hidden.map((h) => h.seg.label).join(" › ")}
        aria-label={`Show ${hidden.length} hidden ${hidden.length === 1 ? "level" : "levels"}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-tap flex h-[20px] items-center rounded-[6px] px-[4px] text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg",
          open && "bg-hdr-chip text-hdr-fg",
        )}
      >
        <MoreHorizontal size={14} aria-hidden="true" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            aria-label="Hidden levels"
            /*
              The panel declares the header palette itself. The bar sets it on
              its own <header>, but this same component is mounted inside a
              builder's page where no such scope exists — and every --hdr-*
              below would resolve to nothing there, which renders as an unfilled
              rectangle with invisible text.
            */
            data-header-theme={theme}
            className="absolute top-[calc(100%+6px)] left-0 z-50 max-h-[400px] w-[240px] overflow-y-auto rounded-[10px] bg-hdr p-[5px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.2),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--hdr-border)]"
          >
            <CrumbOptions
              options={options}
              theme={theme}
              onPick={(id) => {
                setOpen(false);
                if (onPick) {
                  onPick();
                  return;
                }
                actions.get(id)?.();
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
