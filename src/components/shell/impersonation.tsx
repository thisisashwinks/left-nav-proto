"use client";

import * as React from "react";
import { UserRoundCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";
import type { ImpersonationBannerColor } from "@/design/theme";

/**
 * "Log in as" — an agency user acting as one of the account's users.
 *
 * What it is in production: an agency admin picks a user from the avatar
 * menu and the session becomes that user's, so everything they do from then
 * on is recorded against that user. That is the whole reason the state has
 * to be loud and unclosable — see ImpersonationBanner. Ashwin, Oct 22.
 *
 * What it is here: identity only. The avatar, the account menu's header and
 * the banner switch to the chosen user; the account and the nav stay as they
 * are, because what is under review is how the state is shown and left, not
 * a second account switcher.
 */

export interface ImpersonationUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Who an agency user can log in as. Invented people at invented addresses —
 * the prototype has no user directory, and real colleagues' names have no
 * business in a demo list.
 */
export const IMPERSONATION_USERS: ImpersonationUser[] = [
  { id: "u-ada", name: "Ada Brennan", email: "ada.brennan@fieldstonegroup.co" },
  { id: "u-bilal", name: "Bilal Hassan", email: "bilal@northwindauto.com" },
  { id: "u-carmen", name: "Carmen Ortiz", email: "carmen.ortiz@coastaldental.com" },
  { id: "u-dev", name: "Dev Malhotra", email: "dev@summitrealty.io" },
  { id: "u-elena", name: "Elena Petrova", email: "elena.p@brightsmile.clinic" },
  { id: "u-felix", name: "Felix Wagner", email: "felix.wagner@fieldstonegroup.co" },
  { id: "u-grace", name: "Grace Kim", email: "grace@lumenyoga.studio" },
  { id: "u-hugo", name: "Hugo Laurent", email: "hugo@laurentbistro.fr" },
  { id: "u-isla", name: "Isla Murray", email: "isla.murray@northwindauto.com" },
  { id: "u-jonas", name: "Jonas Berg", email: "jonas@bergplumbing.no" },
  { id: "u-kavya", name: "Kavya Iyer", email: "kavya.iyer@summitrealty.io" },
  { id: "u-leo", name: "Leo Santos", email: "leo@santosfitness.com" },
  { id: "u-maya", name: "Maya Chen", email: "maya.chen@coastaldental.com" },
  { id: "u-nora", name: "Nora Whitfield", email: "nora@whitfieldlaw.com" },
];

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")
  ).toUpperCase();
}

interface ImpersonationState {
  /** The user being acted as, or null when you are yourself. */
  as: ImpersonationUser | null;
  /** Whether this person may log in as anyone — agency users only. */
  canLogInAs: boolean;
  logInAs: (user: ImpersonationUser) => void;
  switchBack: () => void;
}

const ImpersonationContext = React.createContext<ImpersonationState>({
  as: null,
  canLogInAs: false,
  logInAs: () => {},
  switchBack: () => {},
});

export function ImpersonationProvider({
  value,
  children,
}: {
  value: ImpersonationState;
  children: React.ReactNode;
}) {
  return <ImpersonationContext value={value}>{children}</ImpersonationContext>;
}

export function useImpersonation(): ImpersonationState {
  return React.useContext(ImpersonationContext);
}

/**
 * The banner's grounds. See IMPERSONATION_BANNER_COLORS.
 *
 * Literal colours through the HighRise tokens, for the same reason the other
 * banners use literals: this is a statement from outside the account's
 * chrome, and it must not rebrand with the tenant. Solid grounds carry white
 * ink; the washes carry the tone's own dark ink. `cta` is the hollow chip,
 * drawn in one colour like the other banners' verbs.
 */
const GROUNDS: Record<
  ImpersonationBannerColor,
  { bar: string; cta: string }
> = {
  red: {
    bar: "bg-[var(--hr-error-600)] text-white",
    cta: "text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] hover:bg-white/15",
  },
  redSoft: {
    bar: "bg-[var(--hr-error-50)] text-[var(--hr-error-800)]",
    cta: "text-[var(--hr-error-700)] shadow-[inset_0_0_0_1px_var(--hr-error-300)] hover:bg-white/50",
  },
  amber: {
    bar: "bg-[var(--hr-warning-100)] text-[var(--hr-warning-900)]",
    cta: "text-[var(--hr-warning-800)] shadow-[inset_0_0_0_1px_var(--hr-warning-300)] hover:bg-white/50",
  },
  ink: {
    bar: "bg-[var(--hr-gray-900)] text-white",
    cta: "text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] hover:bg-white/10",
  },
  primary: {
    bar: "bg-[var(--hr-primary-600)] text-white",
    cta: "text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] hover:bg-white/15",
  },
  blueSoft: {
    bar: "bg-[var(--hr-primary-50)] text-[var(--hr-gray-900)]",
    cta: "text-[var(--hr-primary-700)] shadow-[inset_0_0_0_1px_var(--hr-primary-200)] hover:bg-white/50",
  },
  purple: {
    bar: "bg-[var(--hr-purple-600)] text-white",
    cta: "text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] hover:bg-white/15",
  },
  green: {
    bar: "bg-[var(--hr-success-700)] text-white",
    cta: "text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] hover:bg-white/15",
  },
};

/**
 * "Logged in as …" — the first strip at the top of the window, always.
 *
 * Three rules, all Ashwin's (Oct 22):
 * - It cannot be closed. Everything done in this session is recorded as the
 *   other user's, so the one thing it must never be is out of sight.
 * - It sits ABOVE any other banner, and the others still show under it — an
 *   account's payment warning is not less true because you are acting as
 *   someone. The usual "one strip at a time" rule is about promos; this is
 *   not one.
 * - It stays in builders, which otherwise take every banner's height back.
 *
 * Same anatomy as the other strips (32px, glyph, centred sentence, one
 * verb), minus the pager and the close button.
 */
export function ImpersonationBanner() {
  const { as, switchBack } = useImpersonation();
  const { impersonationBannerColor } = useTheme().effective;
  if (!as) return null;
  const ground = GROUNDS[impersonationBannerColor];
  return (
    <div
      role="status"
      aria-live="polite"
      data-impersonation-banner=""
      className={cn(
        "flex h-[32px] shrink-0 items-center gap-[8px] overflow-hidden px-[10px]",
        ground.bar,
      )}
    >
      <div aria-hidden="true" className="min-w-0 flex-1" />
      <UserRoundCheck size={14} aria-hidden="true" className="shrink-0" />
      <p className="min-w-0 shrink truncate text-[12.5px] leading-[16px]">
        <span className="opacity-90">Logged in as </span>
        <span className="font-semibold">{as.name}</span>
        <span className="opacity-80"> ({as.email})</span>
      </p>
      <button
        type="button"
        onClick={switchBack}
        className={cn(
          "motion-tap flex h-[20px] shrink-0 items-center rounded-[6px] bg-transparent px-[8px]",
          "text-[10.5px] leading-none font-semibold tracking-[0.7px] uppercase active:scale-[0.98]",
          ground.cta,
        )}
      >
        Switch to my account
      </button>
      <div aria-hidden="true" className="min-w-0 flex-1" />
    </div>
  );
}
