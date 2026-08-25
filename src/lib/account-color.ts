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
 *   2. Index the palette below — eleven HighRise hues, chosen to be
 *      distinguishable at 26px.
 *   3. The tile runs that hue's 600 into its 400, matching the pairing the
 *      agency mark already used.
 *
 * Three hues are deliberately absent. `gray` belongs to the agency, which is a
 * platform rather than a tenant and reads neutral on purpose. `primary` is the
 * accent, and a tile in the accent colour reads as selected. `purple` and
 * `violet` sit too close to Ask AI's `--ai-base` (#9333ea) to risk a tenant
 * mark being mistaken for an AI affordance.
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
] as const;

export type AccountHue = (typeof ACCOUNT_HUES)[number];

/** The agency's hue. Neutral, and never assigned to a tenant. */
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
  if (id === "agency") return pair(AGENCY_HUE);
  return pair(ACCOUNT_HUES[hashId(id) % ACCOUNT_HUES.length]);
}

/** The hue's name, for tests and for explaining an assignment. */
export function accountHueFor(id: string): string {
  if (id === "agency") return AGENCY_HUE;
  return ACCOUNT_HUES[hashId(id) % ACCOUNT_HUES.length];
}
