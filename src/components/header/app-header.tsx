"use client";

import * as React from "react";
import { Check, ChevronRight, House } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { headerConfig, type HeaderActionTone, type HeaderConfig } from "./header-config";
import { UserAvatar } from "./user-avatar";

/**
 * One breadcrumb segment. A plain string stays a label; a segment with
 * options is a switcher — its dropdown lists the SIBLINGS at that level
 * (groups beside this group, products beside this product, pages beside
 * this page), so the trail is not just orientation but a way to move
 * sideways without going back through the nav. Aug 13 ask.
 */
export interface Crumb {
  label: string;
  options?: { id: string; label: string; selected?: boolean }[];
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
   * Whether the bar paints its own surface.
   *
   * `plane` is the default arrangement: no fill and no bottom rule, so the bar is
   * a breadcrumb and a row of glyphs sitting on the shell's plane alongside the
   * nav. `filled` keeps the measured white (or near-black) bar, which is what a
   * header themed against the plane still needs to stay legible.
   */
  surface?: "plane" | "filled";
  config?: HeaderConfig;
  /** Where you are: ["Contacts", "Smart lists"]. Home renders before it. */
  crumbs?: (string | Crumb)[];
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
}: AppHeaderProps) {
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
        // Padded to the canvas gap rather than a value of its own. The canvas is
        // inset by that gap and the page inside it adds nothing, so matching it
        // here lands the bar's content on exactly the canvas's left and right
        // edges — which is what makes the Home glyph line up with the page title
        // and the utilities line up with the table's right edge.
        "flex h-[48px] w-full shrink-0 items-center justify-between px-[var(--shell-canvas-gap)]",
        surface === "filled"
          ? "bg-hdr shadow-[inset_0_-1px_0_0_var(--hdr-border)]"
          : "bg-transparent",
      )}
    >
      <div className="flex h-full min-w-0 items-center gap-[4px]">
        <button
          type="button"
          title="Home"
          aria-label="Home"
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
                  <CrumbMenu seg={seg} last={last} />
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={cn(
                      "truncate text-[13px] leading-[normal] whitespace-nowrap",
                      last ? "font-semibold text-hdr-fg" : "text-hdr-fg-muted",
                    )}
                  >
                    {seg.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-[12px]">
        {/*
          No Ask AI up here anymore: the nav's merged pill is the assistant's
          one standing entry in both arrangements now, and a second copy in the
          header was exactly the duplication the review flagged between search
          and AI.
        */}
        <div className="flex shrink-0 items-center gap-[8px]">
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
            className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-full motion-press hover:scale-110 active:scale-95"
          >
            <UserAvatar size={26} initials={config.avatarInitials} />
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * A crumb that switches. The label wears a small chevron; clicking opens the
 * sibling list, with the current one checked. Same one-menu-at-a-time,
 * Escape-and-click-away manners as every other menu in the shell.
 */
function CrumbMenu({ seg, last }: { seg: Crumb; last: boolean }) {
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
        {/*
          No standing chevron (Aug 13 note — a rank of dropdown glyphs read as
          noise): the hover wash and the open state are the affordance, and
          aria-haspopup carries it for assistive tech.
        */}
        <span
          className={cn(
            "truncate text-[13px] leading-[normal] whitespace-nowrap",
            last ? "font-semibold text-hdr-fg" : "text-hdr-fg-muted",
          )}
        >
          {seg.label}
        </span>
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
            {seg.options?.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={option.selected ?? false}
                onClick={() => {
                  setOpen(false);
                  if (!option.selected) seg.onSelect?.(option.id);
                }}
                className="motion-tap flex w-full items-center gap-[8px] rounded-[7px] px-[9px] py-[7px] text-left hover:bg-hdr-chip"
              >
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
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
