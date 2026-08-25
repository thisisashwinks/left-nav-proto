import {
  Activity,
  Brush,
  Bot,
  Boxes,
  Braces,
  Building2,
  Calendar,
  CircleUser,
  CreditCard,
  Database,
  FlaskConical,
  Gauge,
  Globe,
  KeyRound,
  Link2,
  ListChecks,
  Mail,
  MailCheck,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Palette,
  Phone,
  Plug,
  Receipt,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Tag,
  Target,
  Upload,
  Users,
  UsersRound,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { FlyoutConfig, FlyoutEntry } from "@/components/flyout/types";
import { agencySettingsBucket, panelFor } from "./agency-config";

/**
 * The Settings takeover menus, transcribed from production and regrouped.
 *
 * Production's agency list is 21 rows with no headings at all, and the
 * sub-account list hides two thirds of itself under "Other settings" — a
 * heading that means "we stopped sorting". The regrouping rule here: a
 * heading must answer "what kind of problem sends me here", so every group
 * is a errand — who we are, how we reach people, what our data looks like,
 * what we're connected to, and the admin drawer.
 */

const entry = (
  group: string,
  items: [id: string, label: string, icon: LucideIcon][],
): FlyoutEntry[] => [
  { kind: "label", id: `label-${group.toLowerCase().replace(/[^a-z]+/g, "-")}`, text: group },
  ...items.map(
    ([id, label, icon]): FlyoutEntry => ({
      kind: "item",
      item: { id: `setting-${id}`, label, icon },
    }),
  ),
];

/** The id both scopes' Settings rows point their flyout at. */
export const SETTINGS_FLYOUT_ID = "settings-menu";

/** Sub-account settings — production's list, sorted into errands. */
export const accountSettingsFlyout: FlyoutConfig = {
  id: SETTINGS_FLYOUT_ID,
  title: "Settings",
  variant: "compact",
  entries: [
  ...entry("My business", [
    ["business-profile", "Business profile", Store],
    ["billing", "Billing", Receipt],
    ["team", "Team", Users],
    ["pipelines", "Pipelines", Target],
  ]),
  ...entry("Channels", [
    ["calendars", "Calendars", Calendar],
    ["phone", "Phone system", Phone],
    ["email", "Email services", Mail],
    ["whatsapp", "WhatsApp", MessageCircle],
    ["conversation-providers", "Conversation providers", MessagesSquare],
    ["preferences", "Preference management", SlidersHorizontal],
  ]),
  ...entry("Data", [
    ["objects", "Objects", Boxes],
    ["custom-fields", "Custom fields", ListChecks],
    ["custom-values", "Custom values", Braces],
    ["tags", "Tags", Tag],
    ["import", "Import data", Upload],
    ["scoring", "Manage scoring", Gauge],
  ]),
  ...entry("Connected", [
    ["integrations", "Integrations", Plug],
    ["private-integrations", "Private integrations", KeyRound],
    ["tracking", "External tracking", Activity],
    ["domains", "Domains & redirects", Globe],
  ]),
  ...entry("Admin", [
    ["brand-boards", "Brand boards", Palette],
    ["labs", "Labs", FlaskConical],
    ["audit-logs", "Audit logs", ScrollText],
  ]),
  ],
};

/**
 * Agency settings — the Aug 25 mapping's thirteenth bucket.
 *
 * Eight rows, not the flat twenty-one this used to hold. Eleven of those rows
 * were promoted out of Settings and into the nav tree proper (Phone
 * integration, Labs, API keys, Domain purchase, Media storage usage and the
 * rest), and what remains regroups under Company, Billing and System messages,
 * which each carry their own third level as page tabs.
 *
 * Projected from `agencySettingsBucket` rather than authored, so the panel and
 * the breadcrumb index cannot disagree about what Settings contains. Only the
 * id differs: the shell routes Settings by SETTINGS_FLYOUT_ID at both scopes.
 */
export const agencySettingsFlyout: FlyoutConfig = panelFor(
  agencySettingsBucket,
  SETTINGS_FLYOUT_ID,
);
