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

/** Agency settings — the flat 21 rows, sorted the same way. */
export const agencySettingsFlyout: FlyoutConfig = {
  id: SETTINGS_FLYOUT_ID,
  title: "Settings",
  variant: "compact",
  entries: [
  ...entry("Organisation", [
    ["profile", "My profile", CircleUser],
    ["company", "Company", Building2],
    ["team", "Team", Users],
    ["billing", "Billing", Receipt],
  ]),
  ...entry("Automation", [
    ["workflow", "Workflow settings", Workflow],
    ["workflow-premium", "Premium features", Zap],
    ["workflow-ai", "External AI models", Bot],
  ]),
  ...entry("Channels", [
    ["phone", "Phone integration", Phone],
    ["email", "Email services", Mail],
    ["system-emails", "System emails", MailCheck],
    ["announcements", "Announcements", Megaphone],
  ]),
  ...entry("Revenue", [
    ["stripe", "Stripe", CreditCard],
    ["affiliates", "Affiliates", UsersRound],
    ["domains", "Domain purchase", Globe],
  ]),
  ...entry("Platform & security", [
    ["nav-branding", "Navigation & branding", Brush],
    ["menu-links", "Custom menu links", Link2],
    ["private-integrations", "Private integrations", Plug],
    ["api-keys", "API keys", KeyRound],
    ["compliance", "Compliance", ShieldCheck],
    ["labs", "Labs", FlaskConical],
    ["audit-logs", "Audit logs", ScrollText],
    ["media-storage", "Media storage usage", Database],
  ]),
  ],
};
