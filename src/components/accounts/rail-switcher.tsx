"use client";

import * as React from "react";
import { Pin, PinOff, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import { matchAccounts, type Account } from "./accounts-data";
import type { AccountsSession } from "./use-accounts";

interface RailDirectoryProps {
  session: AccountsSession;
  onClose: () => void;
}

/** How the one list is ordered. Recency is the default per the Aug 13 review. */
type DirectorySort = "recent" | "alpha";

/**
 * The accounts directory the rail morphs into.
 *
 * Not a docked dialog any more (Aug 13 ask): clicking the waffle widens the
 * rail itself into this — one surface growing, instead of two surfaces
 * meeting at an edge, which is the seam every earlier round tripped over.
 * The rail owns the frame; this is only the content.
 *
 * ONE list, not Pinned/Recent/All (Aug 13 review): the groups made the
 * panel a filing exercise. Sorting carries the recency signal instead —
 * default is recently accessed, A–Z one click away — and pinning stays a
 * per-row action rather than a section.
 */
export function RailDirectory({ session, onClose }: RailDirectoryProps) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<DirectorySort>("recent");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const matches = matchAccounts(query, session.accounts);

  /*
   * Recency order: the current account first (it is the most recently
   * accessed by definition), then the recents trail, then everyone else in
   * their stable seed order. Alphabetical is a plain locale sort.
   */
  const currentId = session.scope === "account" ? session.current.id : null;
  const { recentIds } = session;
  const ordered = React.useMemo(() => {
    if (sort === "alpha") {
      return [...matches].sort((a, b) => a.name.localeCompare(b.name));
    }
    const rank = new Map<string, number>();
    if (currentId !== null) rank.set(currentId, -1);
    recentIds.forEach((id, i) => {
      if (!rank.has(id)) rank.set(id, i);
    });
    return [...matches].sort(
      (a, b) =>
        (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [matches, sort, currentId, recentIds]);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-[8px] pb-[8px]">
      <div className="motion-tap flex h-[34px] shrink-0 items-center gap-[8px] rounded-[9px] px-[9px] shadow-[inset_0_0_0_1px_var(--fly-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
        <Search size={15} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${session.accounts.length} accounts`}
          aria-label="Search accounts"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg caret-[var(--brand)] placeholder:text-nav-fg-subtle focus:outline-none"
        />
      </div>

      {/* The sort IS the old grouping, made explicit and optional. */}
      <div
        role="radiogroup"
        aria-label="Sort accounts"
        className="mt-[8px] flex shrink-0 items-center gap-[4px] px-[2px]"
      >
        {(
          [
            ["recent", "Recently accessed"],
            ["alpha", "A–Z"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={sort === id}
            onClick={() => setSort(id)}
            className={cn(
              "motion-tap flex h-[24px] items-center rounded-full px-[10px] text-[11.5px] leading-none font-medium",
              sort === id
                ? "bg-nav-active text-nav-fg shadow-[inset_0_0_0_1px_var(--fly-border)]"
                : "text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="-mx-[2px] mt-[6px] min-h-0 flex-1 overflow-y-auto px-[2px]">
        {ordered.length === 0 ? (
          <p className="px-[7px] py-[16px] text-[13px] leading-[18px] text-nav-fg-subtle">
            No accounts match “{query.trim()}”.
          </p>
        ) : null}

        <Group accounts={ordered} session={session} onClose={onClose} />
      </div>
    </div>
  );
}

function Group({
  accounts,
  session,
  onClose,
}: {
  accounts: Account[];
  session: AccountsSession;
  onClose: () => void;
}) {
  if (accounts.length === 0) return null;
  return (
    <>
      {accounts.map((account) => {
        const current =
          session.scope === "account" && account.id === session.current.id;
        // The row's own pin state decides its trailing action — pinning is
        // curation on the row now, not a section you file accounts into.
        const action = session.onRail(account.id) ? "remove" : "add";
        return (
          <div
            key={account.id}
            className={cn(
              "group/row flex w-full items-center gap-[10px] rounded-[8px] px-[7px] py-[6px]",
              current ? "bg-nav-active" : "hover:bg-nav-hover",
            )}
          >
            {/* The row is the jump; the trailing button is the curation. */}
            <button
              type="button"
              onClick={() => {
                // Jumping into an account opens it on the rail too — you are
                // working in it now, so it has earned a tile (space allowing).
                session.addToRail(account.id);
                session.switchTo(account.id);
                onClose();
              }}
              className="flex min-w-0 flex-1 items-center gap-[10px] text-left outline-none"
            >
              <AccountLogo logo={account.logo} src={account.logoSrc} size={28} radius={999} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13.5px] leading-[18px] font-medium text-nav-fg">
                  {account.name}
                </span>
                <span className="truncate text-[11.5px] leading-[15px] text-nav-fg-subtle">
                  {account.meta}
                </span>
              </span>
            </button>
            {/* Said, not implied: the tinted row alone failed the review. */}
            {current ? (
              <span className="shrink-0 rounded-[5px] bg-nav-hover px-[6px] py-[2px] text-[10px] leading-[14px] font-semibold text-nav-fg-muted">
                Current
              </span>
            ) : null}
            <button
              type="button"
              aria-label={
                action === "remove"
                  ? `Unpin ${account.name}`
                  : `Pin ${account.name}`
              }
              title={action === "remove" ? "Unpin" : "Pin"}
              onClick={() => {
                // Pure curation now: with one sorted list, the pin toggles
                // the rail tile and nothing else — the ROW is the jump. The
                // old add-and-go behaviour belonged to the "All accounts"
                // section this list replaced.
                if (action === "remove") session.removeFromRail(account.id);
                else session.addToRail(account.id);
              }}
              className={cn(
                // Visible at rest — a hover-only affordance made the panel
                // read as a plain list until you happened to mouse a row.
                "motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle",
                "shadow-[inset_0_0_0_1px_var(--fly-border)] hover:bg-nav-active hover:text-nav-fg",
              )}
            >
              {action === "remove" ? (
                <PinOff size={14} aria-hidden="true" />
              ) : (
                <Pin size={14} aria-hidden="true" />
              )}
            </button>
          </div>
        );
      })}
    </>
  );
}
