import {
  Award,
  Bell,
  Bot,
  Boxes,
  Briefcase,
  Building2,
  Calendar,
  ChartLine,
  ChartPie,
  CheckCheck,
  Clock,
  Compass,
  CreditCard,
  Database,
  FileText,
  Filter,
  Flag,
  Folder,
  Gauge,
  Globe,
  Handshake,
  Headphones,
  Heart,
  Inbox,
  Layers,
  LayoutTemplate,
  Lightbulb,
  Link,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Package,
  Phone,
  Puzzle,
  Receipt,
  Rocket,
  Send,
  Settings,
  Share2,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Tag,
  Target,
  Ticket,
  TrendingUp,
  Trophy,
  Users,
  Video,
  Wallet,
  Wand,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * The icons a user can choose from when relabelling a group.
 *
 * Deliberately a curated list rather than all ~1,600 of Lucide: the picker is
 * for making a renamed group legible, not for browsing an icon library, and a
 * short list keeps every option recognisable at 16px in a 272px rail. It is also
 * how the set stays licence-clean — every entry is Lucide (ISC), so nothing here
 * can drift into a font we cannot redistribute.
 *
 * Names are stored, not components: state has to survive being serialised.
 */
export interface PickerIcon {
  name: string;
  icon: LucideIcon;
  /** Extra words the search matches, so "money" finds Wallet. */
  keywords: string;
}

export const ICON_CATALOGUE: PickerIcon[] = [
  { name: "MessageCircle", icon: MessageCircle, keywords: "chat talk conversation" },
  { name: "MessagesSquare", icon: MessagesSquare, keywords: "chat threads engage" },
  { name: "Inbox", icon: Inbox, keywords: "mail queue unread" },
  { name: "Mail", icon: Mail, keywords: "email campaign send" },
  { name: "Send", icon: Send, keywords: "email broadcast deliver" },
  { name: "Phone", icon: Phone, keywords: "call dial voice" },
  { name: "Headphones", icon: Headphones, keywords: "support service calls" },
  { name: "Users", icon: Users, keywords: "contacts people audience crm" },
  { name: "Handshake", icon: Handshake, keywords: "deal partner close" },
  { name: "Target", icon: Target, keywords: "convert opportunity pipeline goal" },
  { name: "TrendingUp", icon: TrendingUp, keywords: "growth revenue up" },
  { name: "Megaphone", icon: Megaphone, keywords: "market ads promote announce" },
  { name: "Rocket", icon: Rocket, keywords: "launch growth start" },
  { name: "Sparkles", icon: Sparkles, keywords: "ai magic new" },
  { name: "Wand", icon: Wand, keywords: "ai magic generate" },
  { name: "Bot", icon: Bot, keywords: "ai agent assistant" },
  { name: "Workflow", icon: Workflow, keywords: "automate flow trigger" },
  { name: "Zap", icon: Zap, keywords: "automate instant trigger" },
  { name: "Puzzle", icon: Puzzle, keywords: "integration app addon" },
  { name: "Link", icon: Link, keywords: "integration connect url" },
  { name: "CreditCard", icon: CreditCard, keywords: "payment card billing money" },
  { name: "Wallet", icon: Wallet, keywords: "payment money balance payout" },
  { name: "Receipt", icon: Receipt, keywords: "invoice estimate billing" },
  { name: "ShoppingCart", icon: ShoppingCart, keywords: "store ecommerce checkout" },
  { name: "Store", icon: Store, keywords: "shop storefront retail" },
  { name: "Package", icon: Package, keywords: "product catalogue inventory" },
  { name: "Tag", icon: Tag, keywords: "price label category" },
  { name: "Ticket", icon: Ticket, keywords: "event registration admission" },
  { name: "Calendar", icon: Calendar, keywords: "schedule booking appointment" },
  { name: "Clock", icon: Clock, keywords: "time recent schedule" },
  { name: "Video", icon: Video, keywords: "meeting call webinar" },
  { name: "LayoutTemplate", icon: LayoutTemplate, keywords: "site funnel page" },
  { name: "Globe", icon: Globe, keywords: "website membership public" },
  { name: "FileText", icon: FileText, keywords: "template document form" },
  { name: "Folder", icon: Folder, keywords: "group collection files" },
  { name: "Layers", icon: Layers, keywords: "group stack sections" },
  { name: "Boxes", icon: Boxes, keywords: "library collection modules" },
  { name: "Database", icon: Database, keywords: "records data objects" },
  { name: "ChartLine", icon: ChartLine, keywords: "analyze report trend" },
  { name: "ChartPie", icon: ChartPie, keywords: "analyze breakdown share" },
  { name: "Gauge", icon: Gauge, keywords: "dashboard metric monitor" },
  { name: "Filter", icon: Filter, keywords: "segment view saved" },
  { name: "CheckCheck", icon: CheckCheck, keywords: "tasks done complete" },
  { name: "Flag", icon: Flag, keywords: "priority milestone mark" },
  { name: "Star", icon: Star, keywords: "favorite reputation review" },
  { name: "Heart", icon: Heart, keywords: "loyalty favourite retention" },
  { name: "Award", icon: Award, keywords: "reputation badge quality" },
  { name: "Trophy", icon: Trophy, keywords: "win goal leaderboard" },
  { name: "Briefcase", icon: Briefcase, keywords: "business work agency" },
  { name: "Building2", icon: Building2, keywords: "company account location" },
  { name: "MapPin", icon: MapPin, keywords: "location place address" },
  { name: "Compass", icon: Compass, keywords: "explore discover guide" },
  { name: "Lightbulb", icon: Lightbulb, keywords: "idea tips learn" },
  { name: "Bell", icon: Bell, keywords: "alert notification remind" },
  { name: "Share2", icon: Share2, keywords: "social share network" },
  { name: "Smartphone", icon: Smartphone, keywords: "mobile app device" },
  { name: "Settings", icon: Settings, keywords: "config preferences admin" },
];

const BY_NAME = new Map(ICON_CATALOGUE.map((i) => [i.name, i.icon]));
const BY_COMPONENT = new Map<LucideIcon, string>(
  ICON_CATALOGUE.map((i) => [i.icon, i.name]),
);

/** Resolves a stored icon name. Unknown names fall back rather than crash. */
export function iconByName(name: string | undefined): LucideIcon | undefined {
  return name ? BY_NAME.get(name) : undefined;
}

/**
 * The picker name for an icon component, so a group seeded from the shipped
 * catalogue starts on the same icon the picker would show as selected.
 *
 * Reverse lookup against the curated list rather than Lucide's `displayName`:
 * the picker can only select what is in the list, so a name it does not know is
 * a name it could not round-trip.
 */
export function nameForIcon(icon: LucideIcon | undefined): string | undefined {
  return icon ? BY_COMPONENT.get(icon) : undefined;
}

export function searchIcons(query: string): PickerIcon[] {
  const q = query.trim().toLowerCase();
  if (!q) return ICON_CATALOGUE;
  return ICON_CATALOGUE.filter(
    (i) =>
      i.name.toLowerCase().includes(q) || i.keywords.includes(q),
  );
}
