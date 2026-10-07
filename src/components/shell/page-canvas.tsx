"use client";

import * as React from "react";
import type { PageCanvasEdge } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { CanvasBg } from "@/design/theme";

/**
 * The HighRise centre canvas: one white card holding everything below the
 * breadcrumb row, the page header included.
 *
 * Behind the `pageCanvas` prototype setting (theme.ts), off by default. The
 * shell decides WHETHER a page gets the card — builders and the Conversations
 * inbox never do — and this file only draws it.
 *
 * The element tree is the same whether the card is on or off. Off, both
 * wrappers are `display: contents`, so they generate no box and the page lays
 * out against the shell's scroller exactly as it did before this file existed:
 * pixel-identical, `h-full` still resolving against the same box. Keeping the
 * tree fixed matters for more than the pixels. A builder publishes its ask to
 * the shell from an effect, one render after it mounts, and that ask is what
 * switches the card off — a wrapper that came and went with the flag would
 * remount the builder at that moment and throw away its first render's state.
 *
 * On, the tokens the pages read are re-pointed under `[data-page-canvas]` in
 * globals.css rather than by editing any page:
 *  - `--page-inset` goes to 0, because the card's 16px padding replaces the
 *    gutter every page pads itself by;
 *  - `--pg-card-border` is restored inside the card. The joined shell
 *    arrangements blank it (tokens.css, `[data-shell-joined] [data-page-theme]`)
 *    because there the page's cards sat on a bordered grey card of their own;
 *    in here they sit on white, and without their ring a TableCard would be a
 *    white box on white.
 *  - the page's grey ground is NOT remapped. Page roots draw no ground of their
 *    own — the grey came from the shell — and `bg-pg` inside a page is a
 *    recessed fill (chips, segmented controls, drawer sections) that has to
 *    stay grey on white.
 */

/** The shell's page scroller, while the card is on: the card scrolls, it does not. */
export const PAGE_CANVAS_HOST = "flex min-h-0 flex-1 flex-col overflow-hidden";

/** Products and places that are the Conversations inbox. See product-page.tsx. */
const INBOX_PRODUCTS = ["conversations", "ia-crm-conversations"];
const INBOX_CHILDREN = ["ia-crm-conversations-inbox"];

/**
 * Whether a canvas place is the Conversations inbox.
 *
 * Mirrors the inbox's entry in product-page.tsx's REAL_PAGES: either tree's
 * Conversations product, opened bare or at its Inbox child. The inbox is a
 * three-pane app surface that manages its own edges, so it keeps the shell's
 * layout rather than being boxed into a card.
 */
export function isInboxPlace(
  place: { productId: string; childId: string | null } | null,
): boolean {
  if (!place || !INBOX_PRODUCTS.includes(place.productId)) return false;
  return place.childId === null || INBOX_CHILDREN.includes(place.childId);
}

/*
 * Pages built from columns opt out.
 *
 * A contact record (identity, activity, panels, rail) or Ask AI (history,
 * chat) is already a row of cards on the plane — each column IS a canvas, and
 * a card around them would be a card holding cards. Those pages say so by
 * calling `useNoPageCanvas()`; the shell reads `usePageCanvasExempt()`.
 * A page with a sidebar or menu INSIDE one surface is not this — it keeps
 * the canvas.
 *
 * A counter rather than a flag, so two exempt components mounting and
 * unmounting in either order never leave the card switched off by mistake.
 */
let exemptCount = 0;
const exemptListeners = new Set<() => void>();
function emitExempt() {
  exemptListeners.forEach((l) => l());
}

/** Call from a column-layout page: the centre canvas stands down while it is mounted. */
export function useNoPageCanvas(active = true) {
  React.useEffect(() => {
    if (!active) return;
    exemptCount += 1;
    emitExempt();
    return () => {
      exemptCount -= 1;
      emitExempt();
    };
  }, [active]);
}

/** Whether a mounted page has opted out of the centre canvas. */
export function usePageCanvasExempt(): boolean {
  return React.useSyncExternalStore(
    (l) => {
      exemptListeners.add(l);
      return () => exemptListeners.delete(l);
    },
    () => exemptCount > 0,
    () => false,
  );
}

/*
 * Whether the open page has a canvas tint of its own (CANVAS_TINTS).
 *
 * Published by the shell and read by the tuning panel, which is mounted
 * outside the shell's tree and so cannot ask where it is. The panel shows the
 * canvas-background controls only when this is true or the all-pages preview
 * is on.
 */
let tintedPage = false;
const tintListeners = new Set<() => void>();

/** Called by the shell with whether the open product has its own tint. */
export function usePublishCanvasTint(hasTint: boolean) {
  React.useEffect(() => {
    tintedPage = hasTint;
    tintListeners.forEach((l) => l());
  }, [hasTint]);
}

/** Whether the open page has its own canvas tint — read by the tuning panel. */
export function useCanvasTintedPage(): boolean {
  return React.useSyncExternalStore(
    (l) => {
      tintListeners.add(l);
      return () => tintListeners.delete(l);
    },
    () => tintedPage,
    () => false,
  );
}

export function PageCanvas({
  enabled,
  edge = "shadow",
  bg = "white",
  tint,
  framePadding = true,
  staging = false,
  children,
}: {
  /**
   * Draw the card the way the staging build does, for the staging inbox copy
   * (conversations-staging): white, 12px on the top corners only, 8px off the
   * right edge, run to the window's foot, a 1px #e5e7eb edge on top and both
   * sides, no padding or shadow. Measured
   * off switchyard-v4 staging, Oct 7.
   */
  staging?: boolean;
  /** Under the tinted frame, whether the white sheet pads its content. */
  framePadding?: boolean;
  enabled: boolean;
  /** How the card marks its edge. See PAGE_CANVAS_EDGES in theme.ts. */
  edge?: PageCanvasEdge;
  /** What the card is filled with. See CANVAS_BGS in theme.ts. */
  bg?: CanvasBg;
  /** The product's tint; without one the card stays white whatever `bg` says. */
  tint?: string;
  children: React.ReactNode;
}) {
  const fill: CanvasBg = enabled && tint && !staging ? bg : "white";
  if (enabled && staging) {
    return (
      <div
        data-page-canvas=""
        data-page-canvas-staging=""
        // 1px #e5e7eb on top and both sides; the foot runs off-screen, so no rule there.
        className="relative mr-[8px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[12px] border border-b-0 border-[#e5e7eb] bg-white"
      >
        <div data-page-canvas-body="" className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div
      data-page-canvas={enabled ? "" : undefined}
      data-page-canvas-edge={enabled ? edge : undefined}
      // Same hook the shell's other two canvas surfaces carry, so the flush
      // seam reaches whichever of the three is drawing. See PLANE_SEAMS.
      {...(enabled ? { "data-canvas-surface": "" } : {})}
      data-page-canvas-bg={enabled && fill !== "white" ? fill : undefined}
      // The tint is a light-mode colour; globals.css mixes it into the dark
      // surface under [data-page-theme="dark"] so it never glares.
      style={
        enabled && fill !== "white"
          ? ({ "--page-canvas-tint-src": tint } as React.CSSProperties)
          : undefined
      }
      className={
        enabled
          ? cn(
              // 12px canvas margin on the sides and bottom, none on top — the
              // breadcrumb row above already spaces it — 12px radius, and
              // shadow/lg unless the edge is the hairline alone.
              "relative mx-[12px] mt-0 mb-[12px] flex min-h-0 flex-1 flex-col overflow-hidden",
              "rounded-[var(--shell-canvas-radius)]",
              fill === "white" ? "bg-pg-surface" : "bg-[var(--page-canvas-tint)]",
              edge !== "border" && "shadow-[var(--shell-canvas-shadow)]",
            )
          : "contents"
      }
    >
      <div
        data-page-canvas-body={enabled ? "" : undefined}
        className={
          enabled
            ? // The content scrolls, inside the card's 16px padding. A block
              // box, like the shell scroller it stands in for, and flex-1 in
              // the card's column gives it a definite height — so pages that
              // are `h-full flex-col` still fill the card and boards keep
              // scrolling their own columns.
              fill === "frame"
              ? // The tinted 16px band stays put; the white sheet inside it
                // is what scrolls, so the frame reads as a frame.
                "flex min-h-0 flex-1 flex-col p-[16px]"
              : "min-h-0 flex-1 overflow-y-auto p-[16px]"
            : "contents"
        }
      >
        {fill === "frame" ? (
          <div
            data-page-canvas-sheet=""
            // No ring: the tinted band is the only edge the sheet needs.
            className={cn(
              "min-h-0 flex-1 overflow-y-auto rounded-[10px] bg-pg-surface",
              framePadding && "p-[16px]",
            )}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
      {enabled ? (
        /*
          The card's edge, drawn over its contents rather than under them —
          scrolled content runs through the padding to the card's edge and
          would cover an inset shadow on the card itself. Transparent in light
          under the shadow-only edge, where shadow/lg carries the float; the
          card hairline for Border and Border + shadow, and always in dark.
        */
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_var(--page-canvas-ring)]"
        />
      ) : null}
    </div>
  );
}
