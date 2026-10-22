"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Monitor,
  Search,
  Smartphone,
} from "lucide-react";
import {
  IMPERSONATION_USERS,
  initialsOf,
  useImpersonation,
  type ImpersonationUser,
} from "@/components/shell/impersonation";
import { cn } from "@/lib/utils";
import { useAnchored } from "@/lib/use-anchored";
import { UserAvatar } from "./user-avatar";
import { type AppKind } from "./get-app-modal";
import {
  GET_APP_MENU_LABELS,
  GET_APP_ROW_BADGES,
} from "@/components/flyout/get-app-flyout";
import { BADGE_TONE } from "@/components/flyout/types";
import type { FlyoutBadge } from "@/components/flyout/types";

const WIDTH = 268;
const GAP = 8;

/**
 * The signed-in user's menu, hung off the avatar in the app bar.
 *
 * The avatar has been a button with no menu behind it since the bar was built —
 * a target that highlights on hover and does nothing. This is production's own
 * menu, plus the two rows that hand you the companion apps.
 *
 * Anchored and portalled like every other menu in the shell, so it escapes the
 * bar's own overflow and cannot be clipped by it.
 */
export function AccountMenu({
  anchor,
  name,
  email,
  initials,
  showApps,
  onOpenApp,
  onClose,
}: {
  anchor: HTMLElement;
  name: string;
  email: string;
  initials: string;
  /**
   * Whether the two companion-app rows live here.
   *
   * Off when the placement axis has moved them to the app bar or the sidebar.
   * The offer stands in exactly one place at a time — two copies of it a click
   * apart is the duplication the review objects to everywhere else.
   */
  showApps: boolean;
  onOpenApp: (kind: AppKind) => void;
  onClose: () => void;
}) {
  const { ref, top, left } = useAnchored(anchor, WIDTH, GAP);
  const { as, canLogInAs, logInAs, switchBack } = useImpersonation();
  /*
   * The "Log in as" picker, open beside the menu. Its own portal, so the
   * away-click check has to count it as inside the menu — a click in the
   * picker's search field must not close the menu it belongs to.
   */
  const [picking, setPicking] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);
  // Who the header names: the user being acted as, or you.
  const shownName = as ? as.name : name;
  const shownEmail = as ? as.email : email;
  const shownInitials = as ? initialsOf(as.name) : initials;

  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !pickerRef.current?.contains(t)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose, ref]);

  return createPortal(
    <>
    <div
      ref={ref}
      role="menu"
      aria-label="Account"
      data-page-theme="light"
      style={{ top, left, width: WIDTH }}
      className="motion-panel-in fixed z-[72] overflow-hidden rounded-[10px] bg-pg-surface py-[4px] shadow-[0_12px_32px_0_rgba(16,24,40,0.16),inset_0_0_0_1px_var(--pg-border)]"
    >
      {/*
        Who you are signed in as, stated rather than implied.
        
        The email is the useful half: agencies keep several logins and the name
        on two of them is often the same person.
      */}
      <div className="flex items-center gap-[10px] px-[14px] py-[12px]">
        <UserAvatar size={38} initials={shownInitials} drawn={as !== null} />
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] leading-[18px] font-semibold text-pg-heading">
            {shownName}
          </span>
          <span className="block truncate text-[12.5px] leading-[17px] text-pg-muted">
            {shownEmail}
          </span>
        </span>
      </div>

      <Rule />

      {/*
        The way back, while you are someone else — the menu's copy of the
        banner's own verb, so it is found wherever you look for it.
      */}
      {as ? (
        <Row
          icon={ArrowLeftRight}
          label="Switch to my account"
          onSelect={() => {
            switchBack();
            onClose();
          }}
        />
      ) : null}
      {/*
        Live since Oct 22: opens the user picker beside the menu. Agency users
        only — a plain sub-account user has nobody to log in as, and the row
        stays the inert reference it always was for them.
      */}
      <Row
        icon={picking ? ChevronLeft : ChevronRight}
        label="Log in as"
        trailing
        active={picking}
        disabled={!canLogInAs}
        onSelect={() => setPicking((open) => !open)}
      />

      {showApps ? (
        <>
          <Rule />
          {/*
            The sidebar panel's words and its pills, not a second set.

            These rows used to read "Get Android & iOS app" / "Get Windows &
            macOS app" — the platform-qualified names, written for a surface
            where one row stands alone and has to answer "is my phone in
            there?". That argument was about the app bar. Here the two rows
            sit together under a rule, exactly as they do in the Download
            apps panel, and a reader who has seen one surface should not have
            to work out that the other is the same offer. So: one pair of
            names, and the Beta and New tags travel with them, because the
            maturity of the two apps is the same fact wherever it is read.
            Ashwin, Oct 21.
          */}
          <Row
            icon={Smartphone}
            label={GET_APP_MENU_LABELS.mobile}
            badge={GET_APP_ROW_BADGES.mobile}
            onSelect={() => {
              onOpenApp("mobile");
              onClose();
            }}
          />
          <Row
            icon={Monitor}
            label={GET_APP_MENU_LABELS.desktop}
            badge={GET_APP_ROW_BADGES.desktop}
            onSelect={() => {
              onOpenApp("desktop");
              onClose();
            }}
          />
        </>
      ) : null}

      <Rule />

      <Row icon={LogOut} label="Sign out" onSelect={onClose} />
    </div>
      {picking ? (
        <LoginAsPicker
          ref={pickerRef}
          menu={ref}
          current={as}
          onPick={(user) => {
            logInAs(user);
            onClose();
          }}
        />
      ) : null}
    </>,
    document.body,
  );
}

const PICKER_WIDTH = 300;

/**
 * "Log in as" — every user this agency user may act as, searchable.
 *
 * Opens to the LEFT of the menu, as production's does: the menu is pinned to
 * the window's right edge under the avatar, so the left is the only side with
 * room. Top-aligned with the menu and capped at the window, scrolling inside.
 * Search matches name or email — agencies keep several logins per person, and
 * the email is often the only thing that tells two of them apart.
 */
const LoginAsPicker = React.forwardRef<
  HTMLDivElement,
  {
    menu: React.RefObject<HTMLDivElement | null>;
    current: ImpersonationUser | null;
    onPick: (user: ImpersonationUser) => void;
  }
>(function LoginAsPicker({ menu, current, onPick }, ref) {
  const [query, setQuery] = React.useState("");
  const [pos, setPos] = React.useState<{ top: number; left: number; max: number } | null>(null);
  React.useLayoutEffect(() => {
    const r = menu.current?.getBoundingClientRect();
    if (!r) return;
    const top = r.top;
    setPos({
      top,
      left: Math.max(8, r.left - PICKER_WIDTH - 8),
      max: Math.max(240, window.innerHeight - top - 16),
    });
  }, [menu]);
  const q = query.trim().toLowerCase();
  const users = IMPERSONATION_USERS.filter(
    (u) =>
      u.id !== current?.id &&
      (q === "" ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)),
  );
  if (!pos) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Log in as"
      data-page-theme="light"
      style={{ top: pos.top, left: pos.left, width: PICKER_WIDTH, maxHeight: pos.max }}
      className="motion-panel-in fixed z-[72] flex flex-col overflow-hidden rounded-[10px] bg-pg-surface shadow-[0_12px_32px_0_rgba(16,24,40,0.16),inset_0_0_0_1px_var(--pg-border)]"
    >
      <div className="shrink-0 p-[12px] pb-[8px]">
        <label className="flex h-[36px] items-center gap-[8px] rounded-[8px] px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--hr-primary-600)]">
          <Search size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users"
            aria-label="Search users"
            className="min-w-0 flex-1 bg-transparent text-[13.5px] leading-[18px] text-pg-text outline-none placeholder:text-pg-muted"
          />
        </label>
      </div>
      <p className="shrink-0 px-[16px] pt-[4px] pb-[6px] text-[11px] leading-[13px] font-semibold tracking-[0.4px] text-pg-muted uppercase">
        All users
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto px-[8px] pb-[8px]">
        {users.length === 0 ? (
          <p className="px-[8px] py-[12px] text-[13px] leading-[18px] text-pg-muted">
            No users match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onPick(u)}
              className="motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[8px] py-[7px] text-left hover:bg-pg"
            >
              <UserAvatar size={32} initials={initialsOf(u.name)} drawn />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] leading-[18px] text-pg-heading">
                  {u.name}
                </span>
                <span className="block truncate text-[12.5px] leading-[17px] text-pg-muted">
                  {u.email}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
});

function Rule() {
  return (
    <span
      aria-hidden="true"
      className="my-[4px] block h-px w-full bg-pg-border"
    />
  );
}

function Row({
  icon: Icon,
  label,
  badge,
  trailing = false,
  disabled = false,
  active = false,
  onSelect,
}: {
  icon: typeof LogOut;
  label: string;
  /**
   * An editorial tag after the label — Beta, New.
   *
   * The nav's own pill, through the nav's own tokens, so the tag on "Mobile
   * apps" is the same object here as it is in the Download apps panel. A
   * second set of badge colours for a menu that shows the same two rows is
   * how one fact ends up looking like two.
   */
  badge?: FlyoutBadge;
  /** The chevron sits on the right; the icon prop is that chevron. */
  trailing?: boolean;
  disabled?: boolean;
  /** Its sub-panel is open beside the menu. */
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "motion-tap flex w-full items-center gap-[10px] px-[14px] py-[9px] text-left text-[13.5px] leading-[18px] text-pg-text",
        disabled
          ? "cursor-default text-pg-muted"
          : active
            ? "bg-pg text-pg-heading"
            : "hover:bg-pg hover:text-pg-heading",
      )}
    >
      {trailing ? null : (
        <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
      )}
      <span className="min-w-0 truncate">{label}</span>
      {badge ? (
        <span
          className={cn(
            "shrink-0 rounded-[2px] px-[4px] py-[2px] text-[10px] leading-[normal] font-semibold whitespace-nowrap",
            BADGE_TONE[badge.tone],
          )}
        >
          {badge.label}
        </span>
      ) : null}
      <span className="flex-1" />
      {trailing ? (
        <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
      ) : null}
    </button>
  );
}
