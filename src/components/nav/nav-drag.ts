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
