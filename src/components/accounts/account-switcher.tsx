"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { AccountLogo } from "./account-logo";
import { AccountRow } from "./account-row";
import { useAccountSwitcher } from "./use-account-switcher";
import type { AccountsSession } from "./use-accounts";

interface AccountSwitcherProps {
  session: AccountsSession;
  /** Anchored to the trigger, so the panel grows out of what was clicked. */
  anchor: { left: number; top: number };
  theme: SurfaceTheme;
  phase: TransitionPhase;
  onClose: () => void;
  /**
   * Model A: the agency is a standing row above the groups, symmetric with the
   * account rows — not a link buried where production hides it. Off in the
   * rail model, where the agency is a tile that is always on screen.
   */
  showAgency?: boolean;
}

const PANEL_WIDTH = 320;

/** Breathing room kept below the panel when the list is long enough to scroll. */
const VIEWPORT_GUTTER = 24;

/**
 * The sub-account switcher, anchored under the nav's workspace trigger.
 *
 * Follows the production panel — a search field over grouped account rows — with
 * Favorites added between Recent and All accounts, and the whole thing keyboard
 * driven: the field takes focus on open, ↑ ↓ walk every row across groups, ↵
 * switches, Escape closes.
 */
export function AccountSwitcher({
  session,
  anchor,
  theme,
  phase,
  onClose,
  showAgency = false,
}: AccountSwitcherProps) {
  const s = useAccountSwitcher(session, onClose);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape has to work with focus on a row or the star, not just in the field.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Keeps the keyboard highlight in view once the list scrolls. `nearest` means
  // this is a no-op when the row is already on screen, so pointer moves don't
  // cause the list to creep.
  React.useEffect(() => {
    listRef.current
      ?.querySelector("[data-active]")
      ?.scrollIntoView({ block: "nearest" });
  }, [s.activeId]);

  return (
    <>
      <button
        type="button"
        aria-label="Close account switcher"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 z-40 cursor-default"
      />

      <div
        role="dialog"
        aria-label="Switch sub-account"
        data-nav-theme={theme}
        data-cursor="menu"
        style={{
          left: anchor.left,
          top: anchor.top,
          width: PANEL_WIDTH,
          maxHeight: `calc(100vh - ${anchor.top + VIEWPORT_GUTTER}px)`,
        }}
        className={cn(
          "absolute z-50 flex flex-col overflow-hidden rounded-[12px] bg-nav p-[8px]",
          "shadow-[0_16px_32px_-8px_var(--fly-shadow),0_4px_8px_-4px_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]",
          phase === "entering" ? "motion-menu-in" : "motion-menu-out",
        )}
      >
        <div className="motion-tap flex h-[34px] shrink-0 items-center gap-[8px] rounded-[9px] px-[9px] shadow-[inset_0_0_0_1px_var(--fly-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
          <Search size={15} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
          <input
            ref={inputRef}
            type="text"
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            onKeyDown={s.onKeyDown}
            placeholder="Search for a sub-account"
            aria-label="Search for a sub-account"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg caret-[var(--brand)] placeholder:text-nav-fg-subtle focus:outline-none"
          />
        </div>

        <div
          ref={listRef}
          className="-mx-[2px] mt-[6px] min-h-0 flex-1 overflow-y-auto px-[2px]"
        >
          {/*
            Above the groups and outside the arrow-key list: scope is a
            different kind of jump from picking a sibling account, and it must
            not reorder under a query the way search results do.
          */}
          {showAgency && s.query.trim() === "" ? (
            <AgencyRow
              session={session}
              onSelect={() => {
                session.switchToAgency();
                onClose();
              }}
            />
          ) : null}

          {s.flat.length === 0 ? (
            <p className="px-[7px] py-[16px] text-[13px] leading-[18px] text-nav-fg-subtle">
              No sub-accounts match “{s.query.trim()}”.
            </p>
          ) : null}

          {s.groups.map((group) => (
            <React.Fragment key={group.id}>
              {/* Sticky so the group a row belongs to stays readable mid-scroll. */}
              <div className="sticky top-0 z-10 bg-nav px-[7px] pt-[8px] pb-[4px]">
                <span className="text-[10.5px] leading-[14px] font-semibold tracking-[0.6px] text-nav-fg-subtle uppercase">
                  {group.label}
                </span>
              </div>
              {group.accounts.map((account) => {
                const index = s.flat.indexOf(account);
                return (
                  <AccountRow
                    key={account.id}
                    account={account}
                    index={index}
                    active={account.id === s.activeId}
                    current={account.id === session.current.id}
                    favorite={session.isFavorite(account.id)}
                    onActivate={() => s.setActiveIndex(index)}
                    onSelect={() => s.select(account.id)}
                    onToggleFavorite={() => session.toggleFavorite(account.id)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-[8px] flex shrink-0 items-center gap-[10px] px-[7px] pt-[8px] shadow-[inset_0_1px_0_0_var(--fly-border)]">
          <Hint keys="↑↓" label="Navigate" />
          <Hint keys="↵" label="Switch" />
          <span className="flex-1" />
          <span className="text-[11px] leading-[normal] whitespace-nowrap text-nav-fg-subtle">
            {s.query.trim() === ""
              ? `${session.accounts.length} accounts`
              : `${s.flat.length} of ${session.accounts.length}`}
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * The agency as a row: squircle mark, AGENCY eyebrow, and the current-scope
 * treatment when the session is already there. Mirrors the account rows'
 * geometry so the panel reads as one list with a marked first entry.
 */
function AgencyRow({
  session,
  onSelect,
}: {
  session: AccountsSession;
  onSelect: () => void;
}) {
  const current = session.scope === "agency";
  return (
    <>
      <button
        type="button"
        onClick={onSelect}
        aria-current={current ? "true" : undefined}
        className={cn(
          "flex w-full items-center gap-[10px] rounded-[8px] px-[7px] py-[7px] text-left outline-none",
          current ? "bg-nav-active" : "hover:bg-nav-hover",
        )}
      >
        <AccountLogo logo={session.agency.logo} size={28} radius={8} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[9px] leading-[11px] font-bold tracking-[0.08em] text-nav-fg-muted">
            AGENCY
          </span>
          <span className="truncate text-[13.5px] leading-[17px] font-semibold text-nav-fg">
            {session.agency.name}
          </span>
        </span>
        <span className="shrink-0 text-[11px] leading-[normal] text-nav-fg-subtle">
          {current ? "Current" : "All accounts"}
        </span>
      </button>
      <div className="mx-[7px] my-[6px] h-px bg-nav-divider" />
    </>
  );
}

/**
 * Local keycap rather than the shared `Kbd`: that one is painted with the search
 * surface's tokens, which do not resolve inside this nav-themed panel.
 */
function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-[5px]">
      <span
        aria-hidden="true"
        className="flex h-[16px] shrink-0 items-center justify-center rounded-[3px] bg-nav-active px-[4px] text-[10px] font-medium whitespace-nowrap text-nav-fg-subtle"
      >
        {keys}
      </span>
      <span className="text-[11px] leading-[normal] whitespace-nowrap text-nav-fg-subtle">
        {label}
      </span>
    </span>
  );
}
