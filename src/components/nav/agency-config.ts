import {
  Antenna,
  AudioLines,
  BadgeDollarSign,
  Bell,
  BookOpen,
  Boxes,
  Brush,
  Building2,
  Camera,
  ChartPie,
  CircleUser,
  ClipboardList,
  CreditCard,
  Download,
  FlaskConical,
  Gift,
  GraduationCap,
  Grid2x2,
  Handshake,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  Link2,
  type LucideIcon,
  Mail,
  Megaphone,
  Monitor,
  Phone,
  Plug,
  Puzzle,
  Receipt,
  Rocket,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  Users,
  UserSearch,
  Wallet,
  Workflow,
} from "lucide-react";
import type { FlyoutConfig } from "@/components/flyout/types";
import type { NavEntry, NavItem } from "./types";

/**
 * The nav's contents at agency scope — the Aug 25 mapping.
 *
 * Source of truth is the "Agency - New Mapping" tab of the nav architecture
 * sheet: column A is L1, column B is L2, C–F are L3. It replaces the five
 * job-first buckets this file used to carry, which were an invented IA; these
 * thirteen are the real inventory, regrouped.
 *
 * Two things the mapping does at once, worth keeping distinct when reading it:
 *
 *  1. It NESTS. Production's agency nav is twenty-four flat rows with no
 *     children at all — "Mobile App", "GHL Swag", "Ideas" and "University" are
 *     each a top-level destination. Here they are two levels under Resources.
 *  2. It PROMOTES. Workflow Settings, Phone Integration, Email Services, Domain
 *     Purchase, Private Integrations, API Keys, Custom Menu Links, Labs, Audit
 *     Logs, Media Storage Usage and Launchpad currently live inside the agency
 *     Settings nav-swap, not the nav tree. Pulling them up is a permissions
 *     change as much as a layout one — each carries its own v1/v2 scopes in
 *     `nav-architecture/01_full_menu_tree.csv`.
 *
 * Every L1 with children opens a FLYOUT, and L3 discloses inside that panel on
 * the row that owns it. Nothing expands inside the nav itself: a sub-account's
 * product groups open panels, and the agency nav should not be a second
 * interaction to learn. An L1 with no children is a plain destination.
 */

export interface AgencyChild extends NavItem {
  /** One line of what it is, as the panel rows show. */
  description: string;
  /**
   * The sheet's columns C–F. Disclosed by the panel row, never by the nav.
   *
   * Each carries an icon: an L3 row is a destination, a destination can be
   * pinned, and a pinned row with no glyph is an empty tile in the dock.
   */
  l3?: AgencyL3[];
}

export interface AgencyBucket {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Shown under the title on the bucket's own page, when it has one. */
  description?: string;
  /** Empty for the four buckets that are destinations rather than panels. */
  children: AgencyChild[];
}

export interface AgencyL3 {
  label: string;
  icon: LucideIcon;
}

const l3 = (label: string, icon: LucideIcon): AgencyL3 => ({ label, icon });

const child = (
  id: string,
  label: string,
  icon: LucideIcon,
  description: string,
  sub?: AgencyL3[],
): AgencyChild => ({
  id,
  label,
  icon,
  description,
  ...(sub ? { l3: sub } : {}),
});

export const agencyBuckets: AgencyBucket[] = [
  {
    // Dynamic slot. "Get Free AI" is what production shows today; the sheet
    // notes this becomes Black Friday and the like later, so the row is named
    // by its occupant rather than by the slot.
    id: "agency-promo",
    label: "Get Free AI",
    icon: Gift,
    children: [],
  },
  {
    id: "agency-launchpad",
    label: "Launchpad",
    icon: Rocket,
    children: [],
    // The agency has its own account to finish, so its Launchpad reads like a
    // sub-account's rather than being a different kind of page.
    description: "Finish setting the agency up.",
  },
  {
    id: "agency-ai-suite",
    label: "AI Suite",
    icon: Sparkles,
    children: [
      child("agency-ai-overviews", "Overviews", ChartPie, "What the AI is doing across your accounts."),
    ],
  },
  {
    id: "agency-dashboard",
    label: "Agency Dashboard",
    icon: LayoutDashboard,
    children: [
      child("agency-dash-summary", "Summary", ChartPie, "The whole book of business, one view."),
      child("agency-dash-saas", "SaaS", Scale, "Plan take-up and recurring revenue."),
      child("agency-dash-reselling", "Reselling", BadgeDollarSign, "Margin on phone, email and premium."),
    ],
  },
  {
    id: "agency-saas",
    label: "SaaS",
    icon: Scale,
    children: [
      child("agency-saas-configurator", "SaaS configurator", Settings, "Plans, pricing and re-billing."),
      child("agency-saas-reselling", "Reselling", BadgeDollarSign, "What you re-sell, and at what markup."),
      child("agency-saas-addons", "Add-ons", Puzzle, "Extras you can attach to any plan."),
      child("agency-saas-education", "SaaS education", GraduationCap, "How to sell and run the SaaS model."),
    ],
  },
  {
    id: "agency-sub-accounts",
    label: "Sub-accounts",
    icon: Users,
    children: [
      child("agency-accounts", "Accounts", Users, "Every client you run, and their status."),
      child("agency-account-snapshot", "Account snapshot", Camera, "Capture an account's setup to reuse."),
      child("agency-template-library", "Template library", Grid2x2, "Funnels, emails and sites to start from."),
      child("agency-media-storage", "Media storage usage", Boxes, "What every account is holding, and the cap."),
      child("agency-workflow-settings", "Workflow settings", Workflow, "Builder defaults and the AI models workflows may call.", [
        l3("Builder settings", Settings),
        l3("Workflow premium features", Sparkles),
        l3("Workflow external AI models", Boxes),
      ]),
      child("agency-domain-purchase", "Domain purchase", Antenna, "Buy and assign domains to accounts."),
      child("agency-launchpad-settings", "Launchpad settings", Rocket, "What a new account is asked to finish."),
    ],
  },
  { id: "agency-prospecting", label: "Prospecting", icon: UserSearch, children: [] },
  {
    id: "agency-communications",
    label: "Communications",
    icon: AudioLines,
    children: [
      child("agency-phone-integration", "Phone integration", Phone, "Numbers, carriers and call routing."),
      child("agency-email-services", "Email services", Mail, "Sending domains and providers."),
    ],
  },
  { id: "agency-labs", label: "Labs", icon: FlaskConical, children: [] },
  {
    id: "agency-affiliate",
    label: "Affiliate portal",
    icon: Handshake,
    children: [
      child("agency-affiliate-program", "Affiliate program", Handshake, "Your referral engine and its terms."),
      child("agency-affiliates", "Affiliates", Users, "Who refers you, and what they are owed."),
    ],
  },
  {
    /*
     * The apps the agency SHIPS, not the ones it installs.
     *
     * Resources ▸ Download apps is the other half of the pair and is
     * deliberately left alone: that one hands the agency's own staff a client
     * to install, this one is where the agency brands the client its customers
     * will download. Production keeps them apart for the same reason — one is
     * a link, the other is a build pipeline with a queue and two store
     * listings behind it.
     */
    id: "agency-white-label-apps",
    label: "White label apps",
    icon: Smartphone,
    description: "Your own mobile and desktop apps, under your own brand.",
    children: [
      child(
        "agency-app-mobile",
        "Mobile App",
        Smartphone,
        "iOS and Android builds, and where they are in the queue.",
      ),
      child(
        "agency-app-desktop",
        "Desktop App",
        Monitor,
        "Theme, icon and copy for the desktop client.",
      ),
    ],
  },
  {
    id: "agency-marketplace",
    label: "App marketplace",
    icon: Store,
    children: [
      child("agency-marketplace-browse", "Marketplace", Store, "Apps your accounts can install."),
      child("agency-private-integration", "Private integration", Plug, "Your own apps, kept off the marketplace."),
      child("agency-api-keys", "API keys", KeyRound, "Credentials for everything you build."),
    ],
  },
  {
    id: "agency-resources",
    label: "Resources",
    icon: BookOpen,
    children: [
      child("agency-university", "University", GraduationCap, "Sales and fulfilment training."),
      child("agency-partner", "Partner", Handshake, "The partner programme and its perks."),
      child("agency-ideas", "Ideas", Lightbulb, "Request features and vote on them."),
      child("agency-status", "Status", Antenna, "Live platform health and incidents."),
      child("agency-download-apps", "Download apps", Download, "The mobile and desktop clients.", [
        l3("Mobile app", Smartphone),
        l3("Desktop app", Monitor),
      ]),
      child("agency-swag", "GHL swag", Shirt, "Branded merchandise."),
    ],
  },
];

/**
 * Settings, the sheet's thirteenth bucket.
 *
 * Kept out of `agencyBuckets` because the nav anchors Settings as its last row
 * with a rule above it, the same as at sub-account scope — that is chrome, not
 * tree. Its panel lives in `settings-config.ts` beside the sub-account one.
 */
export const agencySettings: NavItem = {
  id: "agency-settings",
  label: "Settings",
  icon: Settings,
  hasFlyout: true,
  // The shared SETTINGS_FLYOUT_ID, so the shell's settings special-case keeps
  // routing it — the panel behind it differs by scope, the id does not.
  flyoutId: "settings-menu",
};

/**
 * Settings' contents, as a bucket like any other.
 *
 * Declared here rather than in `settings-config.ts` so that `agencyPlaces`
 * below can index it: a Settings row needs a page and a breadcrumb exactly as
 * an AI Suite row does, and two lists would have drifted. `settings-config.ts`
 * projects the panel from this.
 */
export const agencySettingsBucket: AgencyBucket = {
  id: "agency-settings",
  label: "Settings",
  icon: Settings,
  children: [
    child("agency-my-profile", "My profile", CircleUser, "Your own account and sign-in."),
    child("agency-company", "Company", Building2, "Who the agency is, and how it is branded.", [
      l3("Basic details", ClipboardList),
      l3("White label", Brush),
      l3("Advanced settings", Settings),
      l3("Single sign-on (SSO)", KeyRound),
      l3("Compliance", ShieldCheck),
    ]),
    child("agency-users", "Users", Users, "Who can get in, and what they can reach."),
    child("agency-billing", "Billing", Receipt, "What you pay, and what you collect.", [
      l3("Subscription", Receipt),
      l3("Payments", CreditCard),
      l3("Wallet & transactions", Wallet),
      l3("Notifications", Bell),
      l3("Stripe integration", Plug),
    ]),
    child("agency-settings-email", "Email services", Mail, "The sending domains and providers."),
    child("agency-system-messages", "System messages", Megaphone, "What the platform sends on your behalf.", [
      l3("System emails", Mail),
      l3("Announcements", Megaphone),
    ]),
    child("agency-menu-links", "Custom menu links", Link2, "Your own tools, in the nav."),
    child("agency-audit-logs", "Audit logs", ScrollText, "Who changed what, and when."),
  ],
};

/**
 * An L3's id: its parent plus a slug of its label.
 *
 * Exported because the breadcrumb has to offer the L3s beside the one you are
 * on, and an option's id has to be the key `agencyPlaces` was built with — so
 * the trail derives it with the same function the index did rather than with a
 * second copy of the rule.
 */
export const agencyL3Id = (parentId: string, label: string) =>
  `${parentId}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * The panels, derived rather than authored.
 *
 * They were hand-written beside `agencyBuckets` for one revision, which meant
 * Sub-accounts and Resources existed twice and could drift apart by a rename.
 * One list owns the mapping now; a panel is a projection of it.
 */
export function panelFor(bucket: AgencyBucket, id = bucket.id): FlyoutConfig {
  return {
    id,
    title: bucket.label,
    variant: "product",
    entries: bucket.children.map((c) => ({
          kind: "item",
          item: {
            id: c.id,
            label: c.label,
            ...(c.icon ? { icon: c.icon } : {}),
            description: c.description,
            ...(c.l3
              ? {
                  /*
                   * `tabs` makes this row a destination rather than a
                   * disclosure — `flyout-row.tsx` reads it and lets the row
                   * navigate like a leaf, because its children live on its page
                   * instead of in a nested list. That is what gives Workflow
                   * settings, Company, Billing, System messages and Download
                   * apps a page of their own, with the sheet's L3 as its tabs.
                   *
                   * The children stay declared: the `tabsInNav` axis flips the
                   * same rows back to disclosing, so both readings survive.
                   */
                  tabs: true,
                  children: c.l3.map((x) => ({
                    id: agencyL3Id(c.id, x.label),
                    label: x.label,
                    icon: x.icon,
                  })),
                }
              : {}),
      },
    })),
  };
}

export const agencyFlyouts: Record<string, FlyoutConfig> = Object.fromEntries(
  agencyBuckets
    .filter((bucket) => bucket.children.length > 0)
    .map((bucket): [string, FlyoutConfig] => [bucket.id, panelFor(bucket)]),
);

/**
 * Every place the agency tree can put you, by id — L1, L2 and L3 alike.
 *
 * One index so the nav row, the canvas page and the breadcrumb all read the
 * same record. `tabs` is the row's own third level, which the page draws as a
 * tab strip.
 */
export interface AgencyPlace {
  label: string;
  /**
   * The row's own glyph.
   *
   * Added when agency pins became real: a pin is stored as an id, and every
   * surface that draws one — the capsule, the merged list, the panel — needs a
   * label and an icon back out of it. Everything except the icon was already
   * here, so the icon was the one thing each caller had to go and find by
   * walking the bucket tree itself.
   */
  icon: LucideIcon;
  description?: string;
  /** The L1 this place sits under. Equal to the place itself for a bucket row. */
  bucket: AgencyBucket;
  /** The L2 above an L3 row. Absent for L1 and L2. */
  parent?: AgencyChild;
  tabs: readonly string[];
}

export const agencyPlaces: Record<string, AgencyPlace> = (() => {
  const out: Record<string, AgencyPlace> = {};
  for (const bucket of [...agencyBuckets, agencySettingsBucket]) {
    out[bucket.id] = {
      label: bucket.label,
      icon: bucket.icon,
      ...(bucket.description ? { description: bucket.description } : {}),
      bucket,
      tabs: [],
    };
    for (const c of bucket.children) {
      out[c.id] = {
        label: c.label,
        // `NavItem.icon` is optional, so a child that never declared one
        // borrows its bucket's rather than leaving a pinned row blank.
        icon: c.icon ?? bucket.icon,
        description: c.description,
        bucket,
        tabs: (c.l3 ?? []).map((x) => x.label),
      };
      for (const x of c.l3 ?? []) {
        out[agencyL3Id(c.id, x.label)] = {
          label: x.label,
          icon: x.icon,
          bucket,
          parent: c,
          tabs: [],
        };
      }
    }
  }
  return out;
})();

/** How the agency has edited its own tree. Everything is optional. */
export interface AgencyOverrides {
  order?: readonly string[];
  labels?: Record<string, string>;
  icons?: Record<string, LucideIcon>;
  hidden?: readonly string[];
  /** Editing shows hidden rows, faded, so they can be brought back. */
  showHidden?: boolean;
}

/**
 * The flat entry list. Every bucket with children opens a panel.
 *
 * Overrides are applied here rather than baked into `agencyBuckets` so the
 * config stays the shipped tree and the store stays the diff against it —
 * which is what makes "reset to default" a deletion rather than a second
 * source of truth.
 */
export function agencyEntriesFor(o: AgencyOverrides = {}): NavEntry[] {
  const byId = new Map(agencyBuckets.map((b) => [b.id, b]));
  const ordered = o.order
    ? o.order.map((id) => byId.get(id)).filter((b): b is AgencyBucket => !!b)
    : agencyBuckets;

  return ordered
    .filter((b) => o.showHidden || !o.hidden?.includes(b.id))
    .map((bucket) => ({
      kind: "item",
      item: {
        id: bucket.id,
        label: o.labels?.[bucket.id] ?? bucket.label,
        icon: o.icons?.[bucket.id] ?? bucket.icon,
        ...(bucket.children.length > 0 ? { hasFlyout: true } : {}),
      },
    }));
}

/** Every bucket's top row, for the 64px rail, which shows L1 and nothing else. */
export const agencyRailItems: NavItem[] = agencyBuckets.map((b) => ({
  id: b.id,
  label: b.label,
  icon: b.icon,
}));

/**
 * What the agency starts pinned with.
 *
 * Ids of real places, not a hand-written list of labels and icons. It was the
 * latter for as long as agency pins were decorative: the capsule drew five
 * chips and nothing could be pinned or unpinned, so the chips did not have to
 * name anywhere you could actually go — and none of them did. Now that the
 * agency has a pin store, every one of these has to resolve, or the row it
 * draws is a dead end.
 *
 * The same five concepts, pointed at the places that exist.
 */
export const agencyPinnedSeed: string[] = [
  "agency-prospecting",
  "agency-account-snapshot",
  "agency-saas-configurator",
  "agency-dash-summary",
  "agency-sub-accounts",
];
