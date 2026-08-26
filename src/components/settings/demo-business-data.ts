import type { Account } from "@/components/accounts/accounts-data";
import { hashId } from "@/lib/account-color";

/**
 * Stand-in business details, shared by the settings pages that show them.
 *
 * Production reads all of this off the account record. The prototype has no such
 * record, so it is derived from the account id — stable per account, so a
 * screenshot taken twice shows the same business, and two pages showing the same
 * account never disagree about who they are describing.
 *
 * It lives here rather than in either page because Basic Details (the agency
 * editing a sub-account) and Business Profile (the sub-account editing itself)
 * describe one business from two sides. Duplicating the tables would let them
 * drift, and a demo where the same account has two addresses is worse than no
 * demo.
 */

/** Stand-in account owners. */
const OWNERS = [
  { first: "Dana", last: "Whitfield", line: "34" },
  { first: "Marcus", last: "Reed", line: "86" },
  { first: "Priya", last: "Raman", line: "17" },
  { first: "Elena", last: "Vasquez", line: "52" },
  { first: "Tom", last: "Byrne", line: "73" },
] as const;

export type Owner = (typeof OWNERS)[number];

/** Postal code, area code and time zone per demo city, so an address reads as one place. */
export const LOCALES: Record<
  string,
  { zip: string; area: string; zone: string }
> = {
  Austin: { zip: "78701", area: "512", zone: "America/Chicago" },
  Denver: { zip: "80202", area: "303", zone: "America/Denver" },
  Phoenix: { zip: "85018", area: "602", zone: "America/Phoenix" },
  "San Diego": { zip: "92101", area: "619", zone: "America/Los_Angeles" },
  Nashville: { zip: "37219", area: "615", zone: "America/Chicago" },
  "Kansas City": { zip: "64105", area: "816", zone: "America/Chicago" },
  Portland: { zip: "97204", area: "503", zone: "America/Los_Angeles" },
  Boise: { zip: "83702", area: "208", zone: "America/Boise" },
  Hartford: { zip: "06103", area: "860", zone: "America/New_York" },
  Miami: { zip: "33131", area: "305", zone: "America/New_York" },
  Columbus: { zip: "43215", area: "614", zone: "America/New_York" },
  Charleston: { zip: "29401", area: "843", zone: "America/New_York" },
  Raleigh: { zip: "27601", area: "919", zone: "America/New_York" },
  "New Orleans": { zip: "70130", area: "504", zone: "America/Chicago" },
  Boulder: { zip: "80302", area: "720", zone: "America/Denver" },
  Madison: { zip: "53703", area: "608", zone: "America/Chicago" },
  Houston: { zip: "77002", area: "713", zone: "America/Chicago" },
};

/** US format, per the copy guidelines: +1 (###) ###-####. */
export function phoneFor(city: string, line: string): string {
  const area = LOCALES[city]?.area;
  return area ? `+1 (${area}) 555-01${line}` : "";
}

export function ownerFor(account: Account): Owner {
  return OWNERS[hashId(account.id) % OWNERS.length];
}

/** "1100 Congress Ave, Austin, TX" -> street, city, region. */
export function splitAddress(meta: string): [string, string, string] {
  const parts = meta.split(",").map((part) => part.trim());
  return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""];
}

/** A slug for building demo emails and domains off the account name. */
export function slugFor(account: Account): string {
  return account.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
