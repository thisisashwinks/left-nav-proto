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
