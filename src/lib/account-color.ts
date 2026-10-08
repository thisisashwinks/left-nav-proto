/**
 * Deterministic avatar colours.
 *
 * Every sub-account tile used to carry a hand-picked pair of hexes in
 * `accounts-data.ts` — seventeen guesses, drawn from Tailwind rather than
 * HighRise, with no rule anyone could restate. Production has thousands of
 * accounts and no designer picking for each, so the prototype now derives the
 * pair the way production would have to: hash the id, index a fixed palette.
 *
 * The rule, so it can be shared as prose:
 *
 *   1. Hash the account id.
 *   2. Index the palette below — twelve HighRise hues, chosen to be
 *      distinguishable at 26px.
 *   3. The tile runs that hue's 600 into its 400, matching the pairing the
 *      agency mark already used.
 *
 * Three hues are deliberately absent. `primary` is the accent, and a tile in
 * the accent colour reads as selected. `purple` and `violet` sit too close to
 * Ask AI's `--ai-base` (#9333ea) to risk a tenant mark being mistaken for an
 * AI affordance.
 *
 * `gray` IS assignable, as of Oct 8, and it is the one entry that needs a
 * word. It is also the agency's hue — so one tenant in twelve now wears the
 * platform's colour. That is tolerable where the two are never confusable by
 * anything else: the agency plate is larger, sits alone above a divider at
 * the top of the rail, and carries the product's own mark rather than a
 * monogram. What it buys is a neutral in the rotation, which a palette of
 * saturated hues otherwise lacks — twelve tenants all shouting is its own
 * kind of unreadable. Ashwin, Oct 8. Dropping it again is one line.
 */

/** A hue's 600/400 pair, as CSS custom-property references. */
export interface AccountColor {
  from: string;
  to: string;
}

/**
 * The assignable hues, spread around the wheel so neighbours in the list are
 * not neighbours in colour — an account and the one seeded after it should not
 * look alike.
 */
export const ACCOUNT_HUES = [
  "indigo",
  "teal",
  "rose",
  "cyan",
  "orange",
  "fuchsia",
  "success",
  "error",
  "blue-light",
  "pink",
  "warning",
  "gray",
] as const;

export type AccountHue = (typeof ACCOUNT_HUES)[number];

/**
 * The agency's hue, assigned rather than hashed.
 *
 * Still declared separately although `gray` is now in the rotation: the
 * agency's tile is neutral BY RULE, not by the luck of its id, and the two
 * facts have to be able to change independently.
 */
const AGENCY_HUE = "gray";

/**
 * 600 into 400, the pairing the agency mark already used. See the contrast note
 * in `account-logo.tsx`: 700→500 is the stronger choice for white marks and is
 * a change to these two lines alone.
 */
const pair = (hue: string): AccountColor => ({
  from: `var(--hr-${hue}-600)`,
  to: `var(--hr-${hue}-400)`,
});

/**
 * The rail's own ten, pinned.
 *
 * The hash is the right rule for a fleet and the wrong one for a demo. Ten
 * ids drawn from a twelve-hue palette collide by the birthday problem, not
 * by bad luck — and they do: `pinnacle` and `fadeco` both land on fuchsia,
 * `meadowlark` lands on the agency's gray. A reviewer looking at the strip
 * reads that as the palette being short or the assignment being broken,
 * which is a conversation about the fixtures rather than about the design.
 *
 * So the ten accounts that are always on screen get a hand-ordered spread:
 * ten distinct hues, warm alternating with cool, no two neighbours alike,
 * and no gray — which leaves the agency plate the only neutral in the
 * column, as it was before gray joined the rotation.
 *
 * This is a FIXTURE, not a second rule. Everything not listed here — the
 * forty-odd accounts behind All accounts, and every real tenant — still
 * goes through the hash, which is what the handoff documents. Production
 * ships the rule and no table. Ashwin, Oct 8.
 */
const PINNED: Record<string, AccountHue> = {
  fieldstone: "indigo",
  acme: "orange",
  northwind: "blue-light",
  pinnacle: "fuchsia",
  veritas: "success",
  riverstone: "rose",
  meadowlark: "cyan",
  brightpath: "warning",
  fadeco: "pink",
  ironwood: "teal",
};

/**
 * A small stable string hash. Lifted from the customizer's `ownerFor` before
 * that file was removed — the `* 31` walk is the only hashing this app does, so
 * it lives here now and everything that needs one calls this.
 */
export function hashId(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return hash;
}

/**
 * The tile colours for an account id. Stable across reloads and across
 * machines, because nothing here reads state — the id is the whole input.
 */
export function accountColorFor(id: string): AccountColor {
  return pair(accountHueFor(id));
}

/**
 * The hue's name, for tests and for explaining an assignment.
 *
 * One place decides, and `accountColorFor` reads it — the two used to carry
 * the same three branches and could have disagreed about any of them.
 */
export function accountHueFor(id: string): AccountHue | typeof AGENCY_HUE {
  if (id === "agency") return AGENCY_HUE;
  return PINNED[id] ?? ACCOUNT_HUES[hashId(id) % ACCOUNT_HUES.length]!;
}
