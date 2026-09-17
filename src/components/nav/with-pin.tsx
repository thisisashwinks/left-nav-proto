"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";
import { childById, productById } from "./catalogue";
import { isChromePlace } from "./chrome-places";
import { PinButton } from "./pin-button";

/**
 * Hangs a favourite star over a row that is itself a `<button>`.
 *
 * Every surface that lists products wants the star on the row — the flyouts,
 * both search treatments — and every one of them draws the row as a single
 * button. Putting the star inside that button nests one control in another, which
 * is invalid HTML, reported as a hydration error, and resolved differently by
 * different browsers.
 *
 * So the star becomes a sibling, positioned over the row's trailing edge, and this
 * wrapper carries `group/row` because PinButton reveals itself on a hovered
 * ancestor with that name.
 *
 * The caller keeps one responsibility: the row needs right padding equal to the
 * star plus the gap it used to sit behind, or its text will run underneath.
 */
/** Whether this id names something the dock can hold. */
export function isPinnable(productId: string): boolean {
  return (
    productById(productId) !== undefined ||
    childById(productId) !== undefined ||
    // The nav's own rows are destinations too, and a destination can be kept.
    isChromePlace(productId)
  );
}

export function WithPin({
  productId,
  pinClass,
  pinSize,
  pinInset = 8,
  children,
}: {
  /**
   * Ignored when it names nothing pinnable, so callers need no guard.
   *
   * An L3 row counts: it is a destination, and the dock resolves child ids the
   * same way it resolves products.
   */
  productId: string;
  /** Vertical placement — centred on single-line rows, top-aligned on stacked. */
  pinClass?: string;
  /** The glyph's size, when this surface's rows want a different one. */
  pinSize?: number;
  /**
   * How far in from the row's trailing edge the pin sits, in px.
   *
   * 8 by default, which puts it flush at the edge. A surface whose rows also
   * carry a disclosure chevron passes the chevron's column instead, so the
   * chevron stays the last thing on the row and the pins still land on one
   * line whether a row discloses or not.
   *
   * A style rather than a class: two `right-*` utilities on one element resolve
   * by source order in the generated sheet, which is not something a caller can
   * reason about.
   */
  pinInset?: number;
  children: React.ReactNode;
}) {
  if (!isPinnable(productId)) return children;

  return (
    /*
      `data-pin-row` is what the flying chip reads its label from — the row's
      own text, whatever surface drew it. See PIN_FEEDBACKS.
    */
    <div data-pin-row="" className="group/row relative w-full shrink-0">
      {children}
      <span
        style={{ right: pinInset }}
        className={cn("absolute z-10", pinClass ?? "top-1/2 -translate-y-1/2")}
      >
        <PinButton
          productId={productId}
          {...(pinSize !== undefined ? { size: pinSize } : {})}
        />
      </span>
    </div>
  );
}
