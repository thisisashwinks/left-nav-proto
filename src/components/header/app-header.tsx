"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, House, Monitor, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CaretDown } from "@/components/icons/caret-down";
import type { SurfaceTheme } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { headerConfig, type HeaderActionTone, type HeaderConfig } from "./header-config";
import { UserAvatar } from "./user-avatar";
import { AccountMenu } from "./account-menu";
import type { AppKind } from "./get-app-modal";

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

const TONE_CLASSES: Record<HeaderActionTone, string> = {
  call: "bg-hdr-act-call text-white hover:shadow-[0_2px_8px_0_rgba(15,23,42,0.2)]",
  // No resting background at all — the disc only appears under the pointer, so at
  // rest the row is four grey glyphs and one green button.
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
}: AppHeaderProps) {
  const { getAppPlacement } = useTheme().effective;
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
          {crumbs.map((crumb, i) => {
            const seg: Crumb =
              typeof crumb === "string" ? { label: crumb } : crumb;
            const last = i === crumbs.length - 1;
            return (
              <React.Fragment key={`${seg.label}-${i}`}>
                <ChevronRight size={13} aria-hidden="true" className="shrink-0 text-hdr-fg-muted opacity-60" />
                {seg.options && seg.options.length > 0 ? (
                  <CrumbMenu seg={seg} last={last} theme={theme} />
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={cn(
                      "flex min-w-0 items-center gap-[5px] truncate text-[13px] leading-[normal] whitespace-nowrap",
                      last ? "font-semibold text-hdr-fg" : "text-hdr-fg-muted",
                    )}
                  >
                    {seg.icon ? (
                      <seg.icon size={14} aria-hidden="true" className="shrink-0 opacity-80" />
                    ) : null}
                    <span className="truncate">{seg.label}</span>
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
        */}
        {entry ? <div className="w-[230px] shrink-0">{entry}</div> : null}

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
                label="Mobile app"
                onSelect={() => onOpenApp("mobile")}
              />
              <AppGlyph
                icon={Monitor}
                label="Desktop app"
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
              {/* Unfilled icons need a touch more weight to hold the row. */}
              <action.icon
                size={action.tone === "call" ? 15 : 17}
                aria-hidden="true"
              />
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
}: {
  seg: Crumb;
  last: boolean;
  theme: SurfaceTheme;
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
        )}
      >

        {seg.icon ? (
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
