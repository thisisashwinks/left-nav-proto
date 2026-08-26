"use client";

import * as React from "react";
import {
  Award,
  BookUser,
  Bot,
  Box,
  Calendar,
  ChevronsUpDown,
  Check,
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
  Replace,
  Rocket,
  Search,
  Send,
  Settings,
  Shapes,
  Share2,
  ShoppingBag,
  Smartphone,
  Sparkles,
  SquarePen,
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
import type { SurfaceTheme } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
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
  onLeave,
  onSwitchScope,
}: {
  scope: WorkspaceScope;
  /** The current sub-account, for the switcher's second line. */
  account: Account;
  /** Whose logo sits at the top — production's white-label slot. */
  agency: Account;
  /** Back to the proposal. Not production's; see the pill at the foot. */
  onLeave: () => void;
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
      <LegacyEditFoot onLeave={onLeave} />
    </div>
  );
}

/**
 * The edit affordance, and the card it becomes.
 *
 * Deliberately the proposal's own shape — hidden until the nav is hovered, then
 * a card with its tools on one line and the two exits on the next — because the
 * comparison being run here includes "what is it like to administer this thing".
 * A different treatment would make that comparison about the treatment.
 *
 * Two tools, where the proposal has three or four, and that IS the finding: there
 * is no structure to show, hide, group or template. What is left is how it looks
 * and whether you want it at all.
 */
function LegacyEditFoot({ onLeave }: { onLeave: () => void }) {
  const { legacyNavTheme, setLegacyNavTheme } = useTheme();
  const [editing, setEditing] = React.useState(false);

  /*
   * What Discard puts back.
   *
   * Captured when the session opens rather than read at Discard time, which is
   * the whole point: the buttons mean the same here as they do on the proposal's
   * card, where Discard undoes a session rather than the last thing you touched.
   *
   * Only the theme is in it. Switching to the new nav also ends the session — it
   * unmounts this entire nav, card included — so it is committed by definition
   * and there would be nothing left on screen to press Discard with.
   */
  const [baseline, setBaseline] = React.useState<SurfaceTheme>(legacyNavTheme);

  if (!editing) {
    return (
      <div className="shrink-0 px-[12px] pb-[12px]">
        <button
          type="button"
          onClick={() => {
            setBaseline(legacyNavTheme);
            setEditing(true);
          }}
          aria-label="Edit navigation"
          /*
           * Revealed on hover and on focus, as the proposal's pencil is: an
           * editing affordance should not be part of the furniture you look at
           * all day, and one reachable by Tab but invisible while focused is a
           * keyboard trap in reverse.
           */
          className="motion-tap flex h-[30px] w-full items-center justify-center gap-[6px] rounded-[8px] text-[12px] leading-none font-medium text-nav-fg-subtle opacity-0 transition-opacity duration-[var(--dur-fast)] group-hover/legacy:opacity-100 hover:bg-nav-hover hover:text-nav-fg focus-visible:opacity-100"
        >
          <SquarePen size={13} aria-hidden="true" />
          Edit nav
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-[12px] pb-[12px]">
      <div className="flex flex-col gap-[6px] rounded-[10px] bg-nav p-[8px] shadow-[0_4px_12px_0_var(--fly-shadow),inset_0_0_0_1px_var(--nav-divider)]">
        <div className="flex items-center gap-[6px]">
          <span
            role="status"
            className="flex min-w-0 flex-1 items-center gap-[5px] truncate text-[11.5px] leading-[15px] font-semibold whitespace-nowrap text-nav-fg"
          >
            <SquarePen size={11} aria-hidden="true" className="shrink-0" />
            Editing nav
          </span>
          <LegacyTool
            label={
              legacyNavTheme === "dark"
                ? "Switch this navigation to light"
                : "Switch this navigation to dark"
            }
            short={legacyNavTheme === "dark" ? "Light" : "Dark"}
            icon={legacyNavTheme === "dark" ? Sun : Moon}
            onClick={() =>
              setLegacyNavTheme(legacyNavTheme === "dark" ? "light" : "dark")
            }
          />
          <LegacyTool
            label="Switch to the new navigation"
            short="New nav"
            icon={Replace}
            /*
             * Ends the session by leaving the surface it belongs to. No need to
             * clear `editing` — this unmounts the whole nav — but it is cleared
             * anyway so that coming back does not land straight in the mode.
             */
            onClick={() => {
              setEditing(false);
              onLeave();
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-[6px]">
          <button
            type="button"
            onClick={() => {
              setLegacyNavTheme(baseline);
              setEditing(false);
            }}
            className="motion-tap flex h-[26px] shrink-0 items-center rounded-[7px] px-[10px] text-[12px] leading-none font-medium text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg active:scale-95"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="motion-tap flex h-[26px] shrink-0 items-center gap-[5px] rounded-[7px] bg-nav-fg px-[10px] text-[12px] leading-none font-medium text-nav hover:opacity-90 active:scale-95"
          >
            <Check size={13} aria-hidden="true" />
            {legacyNavTheme === baseline ? "Done" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LegacyTool({
  label,
  short,
  icon: Icon,
  onClick,
}: {
  label: string;
  short: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={short}
      onClick={onClick}
      className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95"
    >
      <Icon size={14} aria-hidden="true" />
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
