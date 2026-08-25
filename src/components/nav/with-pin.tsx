"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";
import { childById, productById } from "./catalogue";
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
export function WithPin({
  productId,
  pinClass,
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
  children: React.ReactNode;
}) {
  if (!productById(productId) && !childById(productId)) return children;

  return (
    <div className="group/row relative w-full shrink-0">
      {children}
      <span className={cn("absolute right-[8px] z-10", pinClass ?? "top-1/2 -translate-y-1/2")}>
        <PinButton productId={productId} />
      </span>
    </div>
  );
}
