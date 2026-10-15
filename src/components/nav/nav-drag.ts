import type * as React from "react";

/**
 * The nav's drag protocol, as MIME types rather than a prefix on one string.
 *
 * `dataTransfer.getData` returns "" during a drag — only `types` is readable
 * before the drop — so the kind of thing in flight has to BE the type, or a drop
 * target cannot tell whether to accept it.
 *
 * Its own module because the two ends of the gesture live in different trees: a
 * category row in the nav and a row inside a flyout. Importing one from the other
 * would drag a whole component into the other's module graph for two strings.
 */

/** A category row from the nav. Payload: the group id. */
export const L1_MIME = "application/x-nav-category";

/** A row from inside a category's panel. Payload: the product id. */
export const L2_MIME = "application/x-nav-row";

/**
 * A pinned row being reordered within the pinned run. Payload: its index.
 *
 * Its own type rather than reusing `L2_MIME`, though a pin usually names a
 * product: the payload is a POSITION, and the two runs accept different
 * moves. Sharing the type would have made every category seam in the nav
 * light up while a pin was in flight, offering a drop that means nothing —
 * "file this pin under Marketing" is not a move this nav has.
 */
export const PIN_MIME = "application/x-nav-pin";

/*
 * The agency tree drags on its own two types.
 *
 * Its buckets are not the account's categories and its panel rows are not
 * products, so they are not the same payload wearing a different label. Keeping
 * them distinct is also what makes "you cannot drag an L2 up into L1" hold by
 * construction rather than by a check somebody has to remember: an L1 seam is
 * simply not a target for a type it does not list.
 */

/** A bucket row from the agency nav. Payload: the bucket id. */
export const AGENCY_L1_MIME = "application/x-agency-bucket";

/** A row from inside an agency bucket's panel. Payload: the row id. */
export const AGENCY_L2_MIME = "application/x-agency-row";

/**
 * A child row from inside a product's own list. Payload: the child id.
 *
 * Its own type, by the same rule the others follow. Reusing `L2_MIME` would
 * have lit every category seam, every panel seam and every branch seam the
 * moment an L3 lifted — offering drops that mean nothing, because a child is
 * not a product and most of those lists cannot hold one.
 *
 * What DOES take it is deliberate and short: the seams inside its own parent's
 * child list, and the nav's own L1 seams, where dropping one means "pull this
 * page out and stand it on its own". Both ends of that are real moves the
 * store can make — see `placeAtL1` and the lifted-child branch of
 * `tailRowsFor`.
 */
export const L3_MIME = "application/x-nav-child";

/**
 * Drag the whole row, not the handle you grabbed it by.
 *
 * Every draggable row in this nav puts `draggable` on a 16px grip rather than
 * on the row, and has to: the row is made of buttons — the glyph, the label,
 * the kebab — and a mousedown inside a form control does not start an
 * ancestor's drag in Chrome. The cost of that, until Oct 15, was the drag
 * IMAGE: the browser snapshots the element the drag started from, so what
 * followed the pointer across the nav was six dots and nothing else. Ashwin's
 * report — "I can only see the drag handle" — is the whole of it. You could
 * not see what you were moving, which in a mode about rearranging is the one
 * thing the gesture has to show.
 *
 * A CLONE, and the second attempt had to be. Pointing `setDragImage` at the
 * live row gave a row-shaped picture with nothing in it, which is how the
 * origin row is deliberately drawn: `lifted` puts
 * `[&>*:not([data-drag-handle])]:invisible` on it so the slot it left reads
 * as a hole rather than as a second copy of the thing in flight. That is the
 * right treatment for the row and the wrong one for the picture, and both
 * came from one element — `setDragImage` records a REFERENCE and rasterises
 * it when dispatch ends, by which time React has committed the state the
 * handler set, so the snapshot caught the emptied row. A copy taken now, with
 * the DOM still intact, cannot be changed by what the handler does next.
 *
 * Cloned next to the row rather than into `<body>`, which is the usual
 * advice and wrong here: almost everything about these rows is painted from
 * CSS custom properties scoped to the nav — ink, fills, radii, the trailing
 * gap — and custom properties inherit down the DOM, so a node reparented to
 * the body arrives unstyled. As a sibling it inherits exactly what the
 * original did.
 *
 * Out of flow and offscreen, so an extra child cannot disturb a flex column
 * for the one frame it exists. Appended last for the same reason React is
 * happy to ignore it: it inserts before the nodes it owns, and a trailing
 * node it has never seen is not in anything's way.
 *
 * Offsets so the picture sits under the pointer exactly where the row was:
 * grab a row by its handle and the ghost's handle stays under your finger,
 * rather than the row jumping to centre itself on the cursor.
 *
 * Call it FIRST in a dragstart handler, before the handler sets any state.
 * The clone has to be taken while the row still looks like itself.
 */
/**
 * How much transparent room the stage leaves for the lift.
 *
 * A drag image is rasterised to the element's own border box, so an outer
 * `box-shadow` on the row would be cropped off at the edge and the ghost
 * would arrive flat. The clone goes inside a padded, transparent stage and
 * the STAGE is what the browser pictures, which gives the shadow somewhere
 * to fall. 14 covers the 12px blur plus its -4px offset with a pixel to
 * spare; the alpha outside the row costs nothing.
 */
const GHOST_PAD = 14;

export function setRowDragImage(event: React.DragEvent): void {
  const row = (event.currentTarget as HTMLElement).closest<HTMLElement>(
    "[data-drag-row]",
  );
  const host = row?.parentElement;
  if (!row || !host) return;

  const box = row.getBoundingClientRect();
  const ghost = row.cloneNode(true) as HTMLElement;
  /*
   * Not a drag row itself, and not reachable.
   *
   * It is a picture: nothing should match it by selector, hit-test it, or
   * try to start a second drag from the grip it happens to contain.
   */
  ghost.removeAttribute("data-drag-row");
  ghost.setAttribute("aria-hidden", "true");
  /*
   * What the globals rule keys off — see `[data-drag-ghost]` there. It is
   * how the hover-revealed affordances come back: a clone is never hovered,
   * so the eye arrived invisible while the pinned kebab beside it did not.
   */
  ghost.setAttribute("data-drag-ghost", "");

  /*
   * The picture is a CARD, not a tinted row — and that is the whole of the
   * Oct 15 fix.
   *
   * The hover fill was already being applied and was not doing the job,
   * because `--nav-hover` is a translucent grey. A drag image is rasterised
   * with its alpha intact and then composited over the page, so a
   * translucent fill means every row the ghost passes over shows THROUGH
   * it — two labels in the same pixels, which is exactly what Ashwin
   * described: text overlapping text as the thing in flight crosses the
   * list.
   *
   * So an opaque base first, in the nav's own surface colour, with the
   * row's tint painted on top of it as a gradient. Two layers rather than
   * one flattened colour because the tint is a VARIABLE — it has to stay
   * the token so the ghost tracks the theme, and `color-mix` of two
   * variables against a third is a lot of machinery for a picture that
   * exists for one frame.
   *
   * The tint is read off the live row rather than assumed, so a SELECTED
   * row keeps its own fill. Overwriting it would make the ghost of the row
   * you are on indistinguishable from the ghost of any other, and where you
   * are is exactly what a drag is about to change.
   */
  const live = getComputedStyle(row);
  const bare =
    live.backgroundColor === "transparent" ||
    live.backgroundColor === "rgba(0, 0, 0, 0)";
  const tint = bare ? "var(--nav-hover)" : live.backgroundColor;

  /*
   * A hairline and a lift, unconditionally.
   *
   * Not the `--nav-hover-ring` the resting row uses: that resolves to
   * transparent unless the Row edges axis is on, and the edge is not
   * decoration here — it is what separates the thing in flight from the row
   * underneath it. Same for the shadow. A row at rest sits IN the list and
   * needs neither; a row being carried over the list is above it, and has
   * to look it.
   *
   * shadow/lg from the design system, so the ghost lifts by the same amount
   * every other floating surface in this product does.
   */
  const lift =
    `inset 0 0 0 1px var(--nav-border),` +
    `0 12px 16px -4px rgba(16,24,40,0.08),` +
    `0 4px 6px -2px rgba(16,24,40,0.03)`;

  ghost.style.cssText +=
    `;margin:0;pointer-events:none;` +
    /*
     * The size is stated because the clone is out of its column.
     *
     * These rows are `w-full` inside a flex column, and a copy on its own
     * stage has no column to be full OF — left to itself it collapses to
     * its text and the picture comes out the wrong width.
     */
    `width:${box.width}px;height:${box.height}px;` +
    `background-color:var(--nav-bg);` +
    `background-image:linear-gradient(${tint},${tint});` +
    `box-shadow:${lift};` +
    /*
     * A sliver of transparency, on the CARD rather than on anything in it.
     *
     * The opaque surface above stops the row underneath reading through the
     * ghost's label; this lets the drop line between rows stay visible
     * under it, which is the one thing you are actually aiming at while
     * dragging. The two want opposite things and the window between them is
     * narrow, so it is a knob — Drag ghost opacity %, under Nav rows.
     *
     * On the whole card, so it fades as one object. Parts at different
     * strengths read as a rendering fault rather than as something in
     * flight, which is why the affordances inside are pinned to 1 by the
     * `[data-drag-ghost]` rule in globals.
     */
    `opacity:var(--t-drag-ghost-opacity,0.72);` +
    /*
     * Frozen. The grip animates its own width in on entering edit mode and
     * the row has transitions on fill and radius; a copy that kept them
     * would be rasterised mid-animation, which is how a ghost ends up
     * subtly the wrong shape.
     */
    `animation:none;transition:none;`;

  /*
   * The stage: offscreen, out of flow, and transparent.
   *
   * Next to the row rather than in `<body>`, which is the usual advice and
   * wrong here — almost everything about these rows is painted from CSS
   * custom properties scoped to the nav, and custom properties inherit down
   * the DOM, so a node reparented to the body arrives unstyled. As a
   * sibling it inherits exactly what the original did.
   *
   * Appended last, which is also why React is happy to ignore it: React
   * inserts before the nodes it owns, and a trailing node it has never seen
   * is not in anything's way.
   */
  const stage = document.createElement("div");
  stage.setAttribute("aria-hidden", "true");
  stage.style.cssText =
    `position:fixed;top:0;left:-99999px;margin:0;pointer-events:none;` +
    `padding:${GHOST_PAD}px;background:transparent;`;
  stage.appendChild(ghost);
  host.appendChild(stage);

  /*
   * Offsets so the picture sits under the pointer exactly where the row
   * was: grab a row by its handle and the ghost's handle stays under your
   * finger, rather than the row jumping to centre itself on the cursor.
   * Plus the stage's padding, since the stage is what is being pictured.
   */
  event.dataTransfer.setDragImage(
    stage,
    event.clientX - box.left + GHOST_PAD,
    event.clientY - box.top + GHOST_PAD,
  );

  /*
   * Gone by the next frame, which is after the rasterise.
   *
   * `setDragImage` reads the element when dispatch ends, so the stage has
   * to outlive the handler — removing it on the next line gives a blank
   * ghost. A frame is the shortest wait that is definitely long enough, and
   * the node is offscreen and inert until then.
   */
  requestAnimationFrame(() => stage.remove());
}
