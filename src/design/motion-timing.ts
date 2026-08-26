/**
 * Durations that JavaScript has to agree with CSS on.
 *
 * Most motion in the app lives entirely in motion.css and needs nothing here.
 * These are the exceptions: a timer decides when the outgoing content unmounts,
 * and if it disagrees with the stylesheet the element either vanishes mid-slide
 * or sits finished and invisible for a beat. Keep them equal to their `--dur-*`
 * counterparts.
 */

/** Matches `--dur-fast`, the duration of the `nav-swap-out` animation. */
export const NAV_SWAP_OUT_MS = 140;
