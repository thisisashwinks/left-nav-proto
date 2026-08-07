import {
  Camera,
  ChartLine,
  Compass,
  GraduationCap,
  Grid2x2,
  Puzzle,
  Rocket,
  Scale,
  Settings,
  UserCog,
  Users,
  UserSearch,
} from "lucide-react";
import type { FlyoutConfig } from "@/components/flyout/types";
import type { NavEntry, NavItem } from "./types";

/**
 * The nav's contents at agency scope.
 *
 * Same shape as the client nav — job-first groups that open flyouts, a
 * divider, then standing destinations — so switching scope changes what the
 * nav is about without changing how it reads. The jobs are the agency's own:
 * win clients, get them launched, bill for it, keep it consistent, see how
 * it is going.
 *
 * Static rather than derived from the grouping store on purpose. The
 * grouping modes, renames and custom groups are a sub-account exercise; the
 * agency IA has its own open questions (what a product row even means across
 * 148 accounts) that the exploration board tracks. This config is the
 * honest current answer, kept as data so it can graduate to the same
 * catalogue treatment later without touching the components.
 */

export const agencyEntries: NavEntry[] = [
  ...(
    [
      { id: "agency-win", label: "Win clients", icon: UserSearch, hasFlyout: true },
      { id: "agency-launch", label: "Onboard & launch", icon: Rocket, hasFlyout: true },
      { id: "agency-bill", label: "Bill & resell", icon: Scale, hasFlyout: true },
      { id: "agency-standardise", label: "Standardise", icon: Camera, hasFlyout: true },
      { id: "agency-measure", label: "See how it's going", icon: ChartLine, hasFlyout: true },
    ] satisfies NavItem[]
  ).map((item): NavEntry => ({ kind: "item", item })),
  { kind: "divider", id: "div-agency-groups" },
  ...(
    [
      { id: "agency-sub-accounts", label: "Sub-accounts", icon: Users },
      { id: "agency-team", label: "Team & access", icon: UserCog },
    ] satisfies NavItem[]
  ).map((item): NavEntry => ({ kind: "item", item })),
];

/**
 * The agency's own favourites dock. Static for now — the pin/unpin store is
 * catalogue-scoped — but the dock itself renders identically at both scopes.
 */
export const agencyPinned = [
  { id: "prospecting", label: "Prospecting", icon: UserSearch },
  { id: "snapshots", label: "Snapshots", icon: Camera },
  { id: "saas-configurator", label: "SaaS configurator", icon: Scale },
  { id: "agency-reporting", label: "Rollup reporting", icon: ChartLine },
  { id: "agency-sub-accounts-pin", label: "Sub-accounts", icon: Users },
];

/** The agency's Settings row — same chrome position as the client one. */
export const agencySettings: NavItem = {
  id: "agency-settings",
  label: "Settings",
  icon: Settings,
  hasFlyout: true,
  flyoutId: "settings-menu",
};

const explore = (id: string, label: string): FlyoutConfig["cta"] => ({
  id: `explore-${id}`,
  icon: Compass,
  title: `Explore ${label}`,
  subtitle: "See everything in this area",
});

/**
 * The panels behind the agency groups. Authored like the generated client
 * panels — icon, title, one line of what it is — because the agency products
 * are not in the sub-account catalogue and must not leak into it.
 */
export const agencyFlyouts: Record<string, FlyoutConfig> = {
  "agency-win": {
    id: "agency-win",
    title: "Win clients",
    variant: "product",
    entries: [
      { kind: "item", item: { id: "prospecting", label: "Prospecting", icon: UserSearch, description: "Audit any business and pitch the gap." } },
      { kind: "item", item: { id: "affiliate-portal", label: "Affiliate portal", icon: Users, description: "Your referral engine and payouts." } },
      { kind: "item", item: { id: "university", label: "University", icon: GraduationCap, description: "Sales and fulfilment training." } },
    ],
    cta: explore("agency-win", "Win clients"),
  },
  "agency-launch": {
    id: "agency-launch",
    title: "Onboard & launch",
    variant: "product",
    entries: [
      { kind: "item", item: { id: "new-sub-account", label: "New sub-account", icon: Users, description: "Spin a client up from scratch or a snapshot." } },
      { kind: "item", item: { id: "snapshots", label: "Snapshots", icon: Camera, description: "Reusable account setups — your playbook." } },
      { kind: "item", item: { id: "template-library", label: "Template library", icon: Grid2x2, description: "Funnels, emails and sites to start from." } },
    ],
    cta: explore("agency-launch", "Onboard & launch"),
  },
  "agency-bill": {
    id: "agency-bill",
    title: "Bill & resell",
    variant: "product",
    entries: [
      { kind: "item", item: { id: "saas-configurator", label: "SaaS configurator", icon: Scale, description: "Plans, pricing and re-billing." } },
      { kind: "item", item: { id: "reselling", label: "Reselling", icon: Scale, description: "Phone, email and premium re-sale margins." } },
      { kind: "item", item: { id: "add-ons", label: "Add-ons", icon: Puzzle, description: "Extras you can attach to any plan." } },
    ],
    cta: explore("agency-bill", "Bill & resell"),
  },
  "agency-standardise": {
    id: "agency-standardise",
    title: "Standardise",
    variant: "product",
    entries: [
      { kind: "item", item: { id: "snapshots-2", label: "Snapshots", icon: Camera, description: "Push a change to every account at once." } },
      { kind: "item", item: { id: "nav-branding", label: "Navigation & branding", icon: Grid2x2, description: "The customizer — what every account inherits." } },
      { kind: "item", item: { id: "marketplace", label: "App marketplace", icon: Grid2x2, description: "Approve the apps accounts can install." } },
    ],
    cta: explore("agency-standardise", "Standardise"),
  },
  "agency-measure": {
    id: "agency-measure",
    title: "See how it's going",
    variant: "product",
    entries: [
      { kind: "item", item: { id: "agency-reporting", label: "Rollup reporting", icon: ChartLine, description: "Every account's numbers, one view." } },
      { kind: "item", item: { id: "account-health", label: "Account health", icon: ChartLine, description: "Who is thriving, who is about to churn." } },
    ],
    cta: explore("agency-measure", "See how it's going"),
  },
};
