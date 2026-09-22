"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronRight,
  House,
  Monitor,
  MoreHorizontal,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CaretDown } from "@/components/icons/caret-down";
import type { CrumbCollapse, SurfaceTheme } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
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
  options?: CrumbOption[];
  onSelect?: (id: string) => void;
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
const CRUMB_LEAF_CHIP = `${CRUMB_LEAF_CHIP_BOX} bg-hdr-chip`;

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
  onOpenApp,
  entry,
  entryFills = true,
}: AppHeaderProps) {
  const { getAppPlacement, crumbEmphasis, crumbIcons, crumbCollapse } =
    useTheme().effective;
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
        // Padded to the canvas gap PLUS the page's own inset, rather than a value of
        // its own: the canvas is inset by the gap and the page inside it pads by
        // --page-inset, so summing them lands the bar on the same edges as the
        // content below. That is exact on the right, where the last utility's box IS
        // its visible edge.
        //
        // The left is that sum minus 6.5px, which is not a fudge: the Home glyph is
        // 15px inside a 28px hit target, so it sits (28-15)/2 inside its own box, and
        // aligning the BOX would leave the glyph 6.5px right of the page title.
        // Pulling the padding back by exactly that inset puts the glyph — the thing
        // you actually see — on the title's edge. Same trick the page title itself
        // uses with -mx-[6px] px-[6px] to sit flush in its container.
        "flex h-[48px] w-full shrink-0 items-center justify-between",
        // Joined, the canvas gap is already spent by the card's own margin, so the
        // bar pads by the page's inset alone and still lands on the content's edges.
        surface === "joined"
          ? "pr-[var(--page-inset)] pl-[calc(var(--page-inset)-6.5px)]"
          : "pr-[calc(var(--shell-canvas-gap)+var(--page-inset))] pl-[calc(var(--shell-canvas-gap)+var(--page-inset)-6.5px)]",
        surface === "plane"
          ? "bg-transparent"
          : "bg-hdr shadow-[inset_0_-1px_0_0_var(--hdr-border)]",
      )}
    >
      <div className="flex h-full min-w-0 items-center gap-[4px]">
        <button
          type="button"
          title="Home"
          aria-label="Home"
          onClick={onHome}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg active:scale-95"
        >
          <House size={15} aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-[4px]">
          {slots.map((slot) => {
            const last = slot.kind === "crumb" && slot.index === lastIndex;
            return (
              <React.Fragment
                key={
                  slot.kind === "overflow"
                    ? "crumb-overflow"
                    : `${slot.seg.label}-${slot.index}`
                }
              >
                <ChevronRight size={13} aria-hidden="true" className="shrink-0 text-hdr-fg-muted opacity-60" />
                {slot.kind === "overflow" ? (
                  <CrumbOverflow hidden={slot.hidden} theme={theme} />
                ) : slot.seg.options && slot.seg.options.length > 0 ? (
                  <CrumbMenu
                    seg={slot.seg}
                    last={last}
                    emphatic={last && crumbEmphasis}
                    showIcon={segIcons}
                    theme={theme}
                  />
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={cn(
                      "flex min-w-0 items-center gap-[5px] truncate text-[13px] leading-[normal] whitespace-nowrap",
                      last ? "font-semibold text-hdr-fg" : "text-hdr-fg-muted",
                      // Painted rather than merely bold, so the page below can
                      // stop printing its own title. The padding is pulled back
                      // out of the row with a negative margin on the vertical
                      // axis only: a chip that grew the 48px bar's content box
                      // would move every glyph beside it.
                      last && crumbEmphasis && CRUMB_LEAF_CHIP,
                    )}
                  >
                    {slot.seg.icon && segIcons ? (
                      <slot.seg.icon size={14} aria-hidden="true" className="shrink-0 opacity-80" />
                    ) : null}
                    <span className="truncate">{slot.seg.label}</span>
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-[12px]">
        {/*
          The merged pill, when the entry axis puts it here.

          Nothing is duplicated by it: the nav gives the control up entirely in
          this arrangement, so this is the same single entry point standing
          somewhere else. 230px — wide enough for the placeholder and the
          keycap, narrow enough to leave the breadcrumb its room on a laptop.

          A reserved width, though, only for the thing that needs one. Where the
          entry is the Ask AI button rather than the search field, 230px is
          200-odd pixels of nothing between the breadcrumb and the utilities —
          so the slot hugs and gives the room back to the trail.
        */}
        {entry ? (
          <div className={cn("shrink-0", entryFills ? "w-[230px]" : "w-auto")}>
            {entry}
          </div>
        ) : null}

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
  emphatic = false,
  showIcon = true,
}: {
  seg: Crumb;
  last: boolean;
  theme: SurfaceTheme;
  /** The leaf, painted. Only ever true on `last` — the caller enforces that. */
  emphatic?: boolean;
  /** False under `crumbIcons: "home"`, where House is the row's only glyph. */
  showIcon?: boolean;
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

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-current={last ? "page" : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-tap flex min-w-0 items-center gap-[3px] rounded-[6px] px-[5px] py-[3px] hover:bg-hdr-chip",
          open && "bg-hdr-chip",
          /*
            A switcher leaf keeps its hover and its caret and simply stops
            waiting to be hovered: the resting fill IS the hover fill, so the
            painted crumb and the plain one below are one treatment rather than
            two that happen to look alike. px overrides the 5px above — the
            chip wants the same inset a span's does, or the two leaves sit on
            different edges depending on whether the level has siblings.
          */
          emphatic && "bg-hdr-chip px-[7px]",
        )}
      >

        {seg.icon && showIcon ? (
          <seg.icon
            size={14}
            aria-hidden="true"
            className={cn(
              "shrink-0 opacity-80",
              last ? "text-hdr-fg" : "text-hdr-fg-muted",
            )}
          />
        ) : null}
        <span
          className={cn(
            "truncate text-[13px] leading-[normal] whitespace-nowrap",
            last ? "font-semibold text-hdr-fg" : "text-hdr-fg-muted",
          )}
        >
          {seg.label}
        </span>
        {/*
          A standing caret after all. The Aug 13 note dropped it because a rank
          of glyphs read as noise, but with icons now leading each segment the
          trail no longer reads as switchable at all — hover is not an
          affordance you can see. Kept small and faint so it sits under the
          label rather than beside it.
        */}
        <CaretDown
          size={11}
          className={cn(
            "-mr-[1px] shrink-0 text-hdr-fg-muted motion-move",
            open ? "rotate-180 opacity-90" : "opacity-70",
          )}
        />
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

  const options: CrumbOption[] = hidden.map(({ seg }) => ({
    id: `ov-${n++}`,
    label: seg.label,
    /*
      The menu keeps its glyphs under `crumbIcons: "home"`. That option is about
      the ROW — a rank of icons on one line at depth — and a menu is a list,
      where the glyph is doing the work it does everywhere else in this shell.
    */
    icon: seg.icon,
    children: seg.options ? walk(seg.options, seg.onSelect) : undefined,
  }));
  return { options, actions };
}

export function CrumbOverflow({
  hidden,
  theme,
  onPick,
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
}) {
  const [open, setOpen] = React.useState(false);
  const { options, actions } = React.useMemo(
    () => buildOverflowMenu(hidden),
    [hidden],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

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
