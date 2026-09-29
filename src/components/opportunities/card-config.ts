/**
 * What a board card shows, as Customize card edits it.
 *
 * One shape shared by the card, which reads it, and the drawer, which writes
 * it, so the preview in the drawer is the real card rather than a picture of
 * one.
 */

export type CardLayout = "default" | "compact" | "unlabeled";

export type CardFieldId =
  | "name"
  | "smartTags"
  | "owner"
  | "business"
  | "source"
  | "value"
  | "lostReason"
  // Addable from the "Add fields" groups.
  | "contact"
  | "phone"
  | "stage"
  | "status"
  | "expectedClose"
  | "updated"
  | "followers";

export type QuickActionId = "call" | "unread" | "tags" | "notes" | "tasks" | "appointment";

export interface CardConfig {
  layout: CardLayout;
  /** In display order. `name` is always first and cannot be removed. */
  fields: CardFieldId[];
  /** In display order; only the ones listed are drawn. */
  actions: QuickActionId[];
}

export const CARD_FIELD_LABEL: Record<CardFieldId, string> = {
  name: "Opportunity name",
  smartTags: "Smart tags",
  owner: "Opportunity owner",
  business: "Business name",
  source: "Source",
  value: "Value",
  lostReason: "Lost reason",
  contact: "Primary contact",
  phone: "Phone",
  stage: "Stage",
  status: "Status",
  expectedClose: "Expected close date",
  updated: "Last updated",
  followers: "Followers",
};

/** The "Add fields" groups, and which fields each one offers. */
export const CARD_FIELD_GROUPS: { label: string; fields: CardFieldId[] }[] = [
  { label: "Other details", fields: ["updated", "followers"] },
  { label: "Primary contact details", fields: ["contact", "phone"] },
  { label: "Associations", fields: [] },
  { label: "Opportunity details", fields: ["stage", "status", "expectedClose"] },
];

export const QUICK_ACTION_LABEL: Record<QuickActionId, string> = {
  call: "Call",
  unread: "Unread conversations",
  tags: "Tags",
  notes: "Notes",
  tasks: "Tasks",
  appointment: "Next confirmed appointment",
};

export const DEFAULT_CARD_CONFIG: CardConfig = {
  layout: "default",
  fields: ["name", "smartTags", "owner", "business", "value"],
  actions: ["call", "unread", "tags", "notes", "tasks", "appointment"],
};
