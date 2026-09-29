/**
 * The records a contact can be associated with, for the Associations panel
 * and the "Add new …" drawers it opens.
 *
 * One module so the panel and the drawers agree on shape: the drawers return
 * a record of this type, the panel links it.
 */

export type AssociationKind = "contacts" | "companies" | "properties";

export interface AssocContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface AssocCompany {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  state?: string;
  city?: string;
  description?: string;
  postalCode?: string;
}

export interface AssocProperty {
  id: string;
  address: string;
}

export interface Associations {
  contacts: AssocContact[];
  companies: AssocCompany[];
  properties: AssocProperty[];
}

export const EMPTY_ASSOCIATIONS: Associations = {
  contacts: [],
  companies: [],
  properties: [],
};

/** What "Link existing" picks from. */
export const LINKABLE: Associations = {
  contacts: [
    { id: "ac-maya", name: "Maya Fischer", email: "maya@northwind.io" },
    { id: "ac-leo", name: "Leo Martins", phone: "(415) 555-0118" },
    { id: "ac-hana", name: "Hana Kim", email: "hana.kim@brightpath.co", phone: "(206) 555-0143" },
    { id: "ac-omar", name: "Omar Haddad", email: "omar@haddadlaw.com" },
  ],
  companies: [
    { id: "co-golden", name: "Golden Boost", website: "goldenboost.com", city: "Austin", state: "TX" },
    { id: "co-northwind", name: "Northwind Traders", website: "northwind.io", city: "Seattle", state: "WA" },
    { id: "co-clario", name: "Clario24", website: "clario24.com", city: "London" },
    { id: "co-nissaa", name: "Nissaa Salon", website: "nissaa.in", city: "Bengaluru" },
  ],
  properties: [
    { id: "pr-elm", address: "1428 Elm Street, Springfield, IL 62704" },
    { id: "pr-ocean", address: "77 Ocean Drive, Miami Beach, FL 33139" },
    { id: "pr-pine", address: "310 Pine Avenue, Portland, OR 97204" },
  ],
};
