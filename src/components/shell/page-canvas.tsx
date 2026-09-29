"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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

export function PageCanvas({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      data-page-canvas={enabled ? "" : undefined}
      className={
        enabled
          ? cn(
              // 16px canvas margin, 12px radius, shadow/lg — the HighRise canvas.
              "relative m-[16px] flex min-h-0 flex-1 flex-col overflow-hidden",
              "rounded-[var(--shell-canvas-radius)] bg-pg-surface shadow-[var(--shell-canvas-shadow)]",
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
              "min-h-0 flex-1 overflow-y-auto p-[16px]"
            : "contents"
        }
      >
        {children}
      </div>
      {enabled ? (
        /*
          The card's edge, drawn over its contents rather than under them —
          scrolled content runs through the padding to the card's edge and
          would cover an inset shadow on the card itself. Transparent in light,
          where shadow/lg carries the float; --pg-card-border in dark, where it
          does not.
        */
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_var(--page-canvas-ring)]"
        />
      ) : null}
    </div>
  );
}
