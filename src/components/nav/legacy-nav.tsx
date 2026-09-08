"use client";

import * as React from "react";
import {
  Award,
  BookUser,
  Bot,
  Box,
  Calendar,
  ChevronsUpDown,
  Contact,
  GitFork,
  Globe,
  GraduationCap,
  Handshake,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  MousePointerClick,
  Monitor,
  Package,
  Moon,
  Receipt,
  PanelsTopLeft,
  Rocket,
  Search,
  Send,
  Settings,
  Shapes,
  Share2,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Store,
  TrendingUp,
  User,
  UserSearch,
  Users,
  Zap,
  CirclePlay,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import type { WorkspaceScope } from "@/components/accounts/use-accounts";
import { useTheme } from "@/components/theme/theme-provider";
import { NavGenerationModal } from "./nav-generation-modal";
import { cn } from "@/lib/utils";

/**
 * Production's sidebar, transcribed — the control group for the whole prototype.
 *
 * Not a redesign and not a straw man: the row order, the labels, the "New" and
 * "Beta" badges, the flat single-level list and the anchored Settings row are
 * production's as of the screenshots this was built from. The point of having it
 * here is that "is the proposal better" stops being a question about a memory of
 * the old nav and becomes a question you answer by pressing one control.
 *
 * What it deliberately does NOT have, because production does not:
 *
 *   - No flyouts. Every row is a leaf; there is no second level anywhere, which
 *     is the single biggest difference and the reason the list runs to 24 rows
 *     at agency scope and scrolls on most laptops.
 *   - No groups, no headings, no folding. The sub-account list has exactly one
 *     divider in it, and nothing says what either side of it means.
 *   - No pinning, no favourites, no reordering. The order is the order.
 *   - No editing. There is nothing here for an admin to shape, which is why the
 *     Editing nav card has nowhere to attach.
 *
 * Rows do not navigate. The proposal is about structure, and wiring 40 legacy
 * rows to pages the legacy nav cannot reach anyway would be work spent on the
 * thing being replaced. Selection moves so the list demonstrably responds.
 */
export function LegacyNav({
  scope,
  account,
  agency,
  onSwitchScope,
}: {
  scope: WorkspaceScope;
  /** The current sub-account, for the switcher's second line. */
  account: Account;
  /** Whose logo sits at the top — production's white-label slot. */
  agency: Account;
  /**
   * Agency ↔ sub-account, the one thing the switcher does.
   *
   * Wired where the rows are not, because hiding the account rail in this mode
   * left no other way to change scope — and a legacy nav you can only ever see
   * at one scope cannot be compared against a proposal that has two. It toggles
   * rather than opening a picker: the picker is what the rail replaced, and
   * rebuilding it here would be building the thing under review.
   */
  onSwitchScope: () => void;
}) {
  const legacyNavTheme = useTheme().legacyNavTheme;
  const agencyScope = scope === "agency";
  const rows = agencyScope ? AGENCY_ROWS : ACCOUNT_ROWS;
  // Launchpad is the selected row in both screenshots, so the transcription
  // opens where they do.
  const [selected, setSelected] = React.useState("launchpad");

  // The list differs per scope, and so does what "Launchpad" means in it, so a
  // scope change resets rather than carrying a selection into a list that may
  // not contain it.
  const scopeRef = React.useRef(scope);
  React.useEffect(() => {
    if (scopeRef.current === scope) return;
    scopeRef.current = scope;
    setSelected("launchpad");
  }, [scope]);

  return (
    <div
      // Its own light/dark, not the workspace's — see legacyNavTheme. The
      // marker is what points tokens.css at production's slate instead of the
      // prototype's near-black.
      data-legacy-nav=""
      data-nav-theme={legacyNavTheme}
      className="group/legacy relative flex h-full min-h-0 w-full flex-col bg-nav"
    >
      {/*
        The platform's logo, centred, in both scopes — production's white-label
        slot, which shows the agency's asset to its sub-accounts too. The
        proposal's header shows whose workspace you are IN; this one shows whose
        software it is, which is the older idea and worth seeing beside the new
        one.
      */}
      <div className="flex h-[56px] shrink-0 items-center justify-center px-[16px]">
        {agency.wordmarkSrc ? (
          <img
            src={agency.wordmarkSrc}
            alt={agency.name}
            className="h-[22px] w-auto max-w-[180px] object-contain"
          />
        ) : (
          <span className="flex items-center gap-[8px]">
            <AccountLogo logo={agency.logo} size={20} radius={5} />
            <span className="truncate text-[15px] leading-[21px] font-semibold text-nav-fg">
              {agency.name}
            </span>
          </span>
        )}
      </div>

      {/*
        The switcher, inside the nav rather than beside it. This is the model the
        account rail replaces: one control that means "leave here and go
        somewhere else", with no indication of where else there is until you open
        it. At agency scope it does not even name where you are — production's
        own copy is the imperative "Click here to switch".
      */}
      <div className="shrink-0 px-[12px] pb-[10px]">
        <button
          type="button"
          onClick={onSwitchScope}
          aria-label={
            agencyScope
              ? `Switch to ${account.name}`
              : "Switch to the agency"
          }
          className="motion-tap flex h-[48px] w-full items-center gap-[10px] rounded-[8px] bg-nav-hover px-[10px] text-left hover:bg-nav-rail-hover"
        >
          <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-nav-rail text-nav-fg-muted">
            {agencyScope ? (
              <MousePointerClick size={14} aria-hidden="true" />
            ) : (
              <AccountLogo logo={account.logo} size={28} radius={999} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] leading-[19px] font-semibold text-nav-fg">
              {agencyScope ? "Click here to switch" : account.name}
            </span>
            {agencyScope ? null : (
              <span className="block truncate text-[12.5px] leading-[17px] text-nav-fg-muted">
                {cityFor(account)}
              </span>
            )}
          </span>
          <ChevronsUpDown
            size={14}
            aria-hidden="true"
            className="shrink-0 text-nav-fg-subtle"
          />
        </button>
      </div>

      {/*
        Search is a sub-account-only row in production, and it sits below the
        switcher rather than at the nav's foot. The green button beside it is the
        quick-add — one of the two things production puts here that the proposal
        folds into the entry pill.
      */}
      {agencyScope ? null : (
        <div className="flex shrink-0 items-center gap-[8px] px-[12px] pb-[12px]">
          <span className="flex h-[36px] min-w-0 flex-1 items-center gap-[8px] rounded-[8px] bg-nav-hover px-[10px]">
            <Search
              size={14}
              aria-hidden="true"
              className="shrink-0 text-nav-fg-subtle"
            />
            <span className="min-w-0 flex-1 truncate text-[13px] leading-none text-nav-fg-subtle">
              Search
            </span>
            <kbd className="shrink-0 rounded-[4px] bg-nav-rail px-[4px] py-[2px] font-sans text-[10px] leading-none text-nav-fg-subtle">
              ⌘K
            </kbd>
          </span>
          <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--hr-success-600,#079455)] text-white">
            <Zap size={15} aria-hidden="true" />
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto px-[12px] pb-[8px]">
        {rows.map((row) =>
          row.kind === "divider" ? (
            <span
              key={row.id}
              aria-hidden="true"
              className="my-[10px] h-px w-full shrink-0 bg-nav-divider"
            />
          ) : (
            <LegacyRow
              key={row.id}
              row={row}
              selected={row.id === selected}
              onSelect={() => setSelected(row.id)}
            />
          ),
        )}
      </div>

      {/*
        Settings, anchored. The one row production holds out of the scroll — and
        the only structural idea in this nav that the proposal keeps.
      */}
      <div className="shrink-0 px-[12px] pt-[6px] pb-[10px] shadow-[inset_0_1px_0_0_var(--nav-divider)]">
        <LegacyRow
          row={{ kind: "item", id: "settings", label: "Settings", icon: Settings }}
          selected={selected === "settings"}
          onSelect={() => setSelected("settings")}
        />
      </div>

      {/*
        The way out, in the same place and shape the proposal puts it.

        This replaced a standing "Back to new nav" pill. Two affordances for one
        job read as two different jobs, and the pill was the more invented of the
        pair — the card at least mirrors a control the other nav already has, so
        the two navs stay comparable on how they are administered as well as on
        what they contain.
      */}
      <LegacyEditFoot />
    </div>
  );
}

/**
 * The old nav's foot: two icon buttons, and no editing.
 *
 * It used to mirror the proposal's edit card — a hidden pencil, then a card
 * with tools and a Save/Discard pair. That was built to make the two navs
 * comparable on how they are administered, and the comparison it actually
 * produced was that there is nothing here to administer: the card's own note
 * said as much, "two tools, where the proposal has three or four, and that IS
 * the finding".
 *
 * A mode with nothing in it is ceremony. Both remaining controls are single
 * clicks that need no session, no baseline and no Discard — so they are two
 * plain icon buttons at the nav's foot, named by tooltip, and the mode goes.
 * Which also removes the last thing implying this nav can be restructured.
 */
function LegacyEditFoot() {
  const { legacyNavTheme, setLegacyNavTheme } = useTheme();
  const [switching, setSwitching] = React.useState(false);

  return (
    /*
      Right-aligned, and the same pair of pills the new nav's foot carries.

      They were icon-only with a tooltip, which is a different control from the
      one doing the same job three pixels away in the other nav — and the
      comparison being run here includes how the two are administered, so a
      gratuitous difference in the chrome is noise in the result. Now both navs
      reveal on hover, grow rightward into a named pill, and sit on the same
      edge.
    */
    <div className="flex shrink-0 items-center justify-end gap-[6px] px-[12px] pb-[12px]">
      <LegacyTool
        label={
          legacyNavTheme === "dark"
            ? "Switch this navigation to light"
            : "Switch this navigation to dark"
        }
        short={legacyNavTheme === "dark" ? "Light" : "Dark"}
        width="hover:w-[74px] focus-visible:w-[74px]"
        icon={legacyNavTheme === "dark" ? Sun : Moon}
        onClick={() =>
          setLegacyNavTheme(legacyNavTheme === "dark" ? "light" : "dark")
        }
      />
      {/*
        The same modal the new nav opens, in the other direction.
        
        It used to leave immediately. Leaving is the more consequential of the
        two directions, not the less — the whole workspace rearranges, top bar
        included — so it gets the same two-card choice and the same Save. A trip
        that needs explaining one way needs explaining both ways.
      */}
      <LegacyTool
        label="Switch navigation"
        short="Switch nav"
        width="hover:w-[104px] focus-visible:w-[104px]"
        icon={PanelsTopLeft}
        onClick={() => setSwitching(true)}
      />
      {switching ? (
        <NavGenerationModal onClose={() => setSwitching(false)} />
      ) : null}
    </div>
  );
}

/**
 * One control at the old nav's foot: a circle that grows into a named pill.
 *
 * The proposal's own `SwitchNavButton`, transcribed — same 26px resting
 * circle, same reveal on the nav's hover, same growth rightward with the label
 * fading in a beat behind the box. Held here rather than shared because the two
 * navs are meant to be comparable without being coupled: this file is a
 * transcription, and importing the proposal's chrome into it would make the old
 * nav depend on the thing it is the control group for.
 */
function LegacyTool({
  label,
  short,
  width,
  icon: Icon,
  onClick,
}: {
  label: string;
  short: string;
  /** The open width, stated per label — `auto` cannot be animated. */
  width: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "group/tool relative flex h-[26px] shrink-0 items-center overflow-hidden rounded-full",
        "w-[26px] justify-center gap-0 px-0",
        "bg-nav text-nav-fg shadow-[0_2px_8px_0_var(--fly-shadow),inset_0_0_0_1px_var(--nav-divider)]",
        "transition-[width,gap,padding,opacity,color,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
        "hover:justify-start hover:gap-[6px] hover:px-[8px] hover:bg-nav-hover",
        "focus-visible:justify-start focus-visible:gap-[6px] focus-visible:px-[8px]",
        "active:scale-95",
        // Out of the furniture until the nav is looked at, and reachable by Tab
        // rather than by luck — the same pair of rules the proposal's pill uses.
        "opacity-0 group-hover/legacy:opacity-100 focus-visible:opacity-100",
        width,
      )}
    >
      <Icon size={13} aria-hidden="true" className="shrink-0" />
      {/*
        Zero-width at rest, or the glyph is pushed out of its own circle: the
        label claims its natural width as a flex item, and `justify-center`
        then overflows it equally on both sides.
      */}
      <span
        aria-hidden="true"
        className="w-0 overflow-hidden text-[12px] leading-none font-medium whitespace-nowrap opacity-0 transition-opacity duration-[var(--dur-base)] ease-[var(--ease-out)] group-hover/tool:w-auto group-hover/tool:opacity-100 group-hover/tool:delay-[90ms] group-focus-visible/tool:w-auto group-focus-visible/tool:opacity-100"
      >
        {short}
      </span>
    </button>
  );
}

function LegacyRow({
  row,
  selected,
  onSelect,
}: {
  row: LegacyItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = row.icon;
  return (
    <button
      type="button"
      aria-current={selected ? "page" : undefined}
      onClick={onSelect}
      className={cn(
        "motion-tap flex h-[40px] w-full shrink-0 items-center gap-[12px] rounded-[8px] px-[10px] text-left",
        selected
          ? // Production's selected row is a filled block, not the proposal's
            // tinted chip — a heavier treatment for the same job.
            "bg-nav-rail-hover text-nav-fg"
          : "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
      )}
    >
      <Icon size={17} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-[14px] leading-[19px]">
        {row.label}
      </span>
      {row.badge ? (
        <span className="shrink-0 rounded-[4px] bg-[color:var(--hr-warning-100,#fef0c7)] px-[5px] py-[2px] text-[10px] leading-none font-semibold text-[color:var(--hr-warning-700,#b54708)]">
          {row.badge}
        </span>
      ) : null}
    </button>
  );
}

/** "1100 Congress Ave, Austin, TX" -> "Austin, TX", production's second line. */
function cityFor(account: Account): string {
  const parts = account.meta.split(",").map((part) => part.trim());
  return parts.slice(1).join(", ");
}

interface LegacyItem {
  kind: "item";
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

type LegacyRowSpec = LegacyItem | { kind: "divider"; id: string };

/**
 * Agency scope: 24 rows, no headings, no second level.
 *
 * Kept in production's own order rather than sorted, because the order IS the
 * finding — "GHL Swag" sits between "SaaS Education" and "Ideas", four rows
 * below "University", and nothing on screen explains why any of them are
 * neighbours. Title Case throughout, also production's.
 */
const AGENCY_ROWS: readonly LegacyRowSpec[] = [
  { kind: "item", id: "get-free-ai", label: "Get Free AI", icon: Rocket },
  { kind: "item", id: "ai-suite", label: "AI Suite", icon: Sparkles, badge: "New" },
  { kind: "item", id: "ask-ai", label: "Ask AI", icon: Sparkles },
  { kind: "item", id: "launchpad", label: "Launchpad", icon: Rocket },
  { kind: "item", id: "agency-dashboard", label: "Agency Dashboard", icon: LayoutDashboard },
  { kind: "item", id: "saas-configurator", label: "SaaS Configurator", icon: SlidersHorizontal },
  { kind: "item", id: "prospecting", label: "Prospecting", icon: UserSearch },
  { kind: "item", id: "sub-accounts", label: "Sub-Accounts", icon: User },
  { kind: "item", id: "account-snapshots", label: "Account Snapshots", icon: Contact },
  { kind: "item", id: "reselling", label: "Reselling", icon: Share2 },
  { kind: "item", id: "add-ons", label: "Add-Ons", icon: ShoppingBag },
  { kind: "item", id: "affiliate-portal", label: "Affiliate Portal", icon: Users },
  { kind: "item", id: "template-library", label: "Template Library", icon: Shapes },
  { kind: "item", id: "partners", label: "Partners", icon: Handshake },
  { kind: "item", id: "university", label: "University", icon: GraduationCap },
  { kind: "item", id: "saas-education", label: "SaaS Education", icon: Package },
  { kind: "item", id: "ghl-swag", label: "GHL Swag", icon: Store },
  { kind: "item", id: "ideas", label: "Ideas", icon: Lightbulb },
  { kind: "item", id: "mobile-app", label: "Mobile App", icon: Smartphone, badge: "New" },
  { kind: "item", id: "desktop-app", label: "Desktop App", icon: Monitor, badge: "New" },
  { kind: "item", id: "app-marketplace", label: "App Marketplace", icon: LayoutGrid },
  { kind: "item", id: "message-hub", label: "Message Hub", icon: MessageSquare },
  { kind: "item", id: "content-engine", label: "Content Engine", icon: Rocket },
];

/**
 * Sub-account scope, with production's single unexplained divider.
 *
 * "Barbers" and "Barber Supplies" are this tenant's own custom objects sitting
 * inline among the platform's products, with the same generic box icon and
 * nothing marking them as the account's rather than the software's. Left in,
 * because that collision is exactly what the proposal's grouping is for.
 */
const ACCOUNT_ROWS: readonly LegacyRowSpec[] = [
  { kind: "item", id: "ask-ai", label: "Ask AI", icon: Sparkles },
  { kind: "item", id: "launchpad", label: "Launchpad", icon: Rocket },
  { kind: "item", id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { kind: "item", id: "conversations", label: "Conversations", icon: MessageCircle },
  { kind: "item", id: "calendars", label: "Calendars", icon: Calendar },
  { kind: "item", id: "contacts", label: "Contacts", icon: BookUser },
  { kind: "item", id: "opportunities", label: "Opportunities", icon: GitFork },
  { kind: "item", id: "properties", label: "Properties", icon: Home },
  { kind: "item", id: "products", label: "Products", icon: Package },
  { kind: "item", id: "barbers", label: "Barbers", icon: Box },
  { kind: "item", id: "barber-supplies", label: "Barber Supplies", icon: Box },
  { kind: "item", id: "payments", label: "Payments", icon: Receipt },
  { kind: "divider", id: "div-1" },
  { kind: "item", id: "ai-studio", label: "AI Studio", icon: Bot, badge: "Beta" },
  { kind: "item", id: "ai-agents", label: "AI Agents", icon: Sparkles },
  { kind: "item", id: "marketing", label: "Marketing", icon: Send },
  { kind: "item", id: "automation", label: "Automation", icon: CirclePlay },
  { kind: "item", id: "sites", label: "Sites", icon: Globe },
  { kind: "item", id: "memberships", label: "Memberships", icon: Award },
  { kind: "item", id: "media-storage", label: "Media Storage", icon: ImageIcon },
  { kind: "item", id: "reputation", label: "Reputation", icon: Star },
  { kind: "item", id: "reporting", label: "Reporting", icon: TrendingUp },
  { kind: "item", id: "app-marketplace", label: "App Marketplace", icon: LayoutGrid },
];
