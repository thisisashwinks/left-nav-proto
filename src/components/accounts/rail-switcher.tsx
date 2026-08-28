"use client";

import * as React from "react";
import { Check, Minus, Pin, PinOff, Search, Sparkles, X } from "lucide-react";
import type { BulkPath } from "@/components/bulk/bulk-config";
import { BulkHistoryModal } from "@/components/bulk/bulk-history-modal";
import { BulkModal } from "@/components/bulk/bulk-modal";
import { useBulkActions } from "@/components/bulk/bulk-provider";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import { matchAccounts, type Account } from "./accounts-data";
import type { AccountsSession } from "./use-accounts";

interface RailDirectoryProps {
  session: AccountsSession;
  onClose: () => void;
}

/** How many rows the RECENT section holds — the trail, not a history page. */
const RECENT_ROWS = 5;

/**
 * The accounts directory the rail morphs into.
 *
 * Not a docked dialog any more (Aug 13 ask): clicking the waffle widens the
 * rail itself into this — one surface growing, instead of two surfaces
 * meeting at an edge, which is the seam every earlier round tripped over.
 * The rail owns the frame; this is the whole of the content, header included.
 *
 * Two sections (Aug 13, refined): RECENT on top — the current account and
 * the trail behind it — then ALL, the complete directory with the pinned
 * accounts leading it. Pinning stays a per-row action; the pin's reward is
 * rank in ALL, not a section of its own. While searching, sections drop
 * away — one flat filtered list reads faster.
 *
 * Behind a prototype switch it is also a bulk surface: every row grows a
 * checkbox and the header grows a Bulk actions button beside the close. The
 * case for it is that this panel is open far more often than the Sub-accounts
 * table, so "these four, right now" is one gesture away. The case against is
 * that a switcher which also CHANGES things is a switcher you hesitate in —
 * which is why the checkboxes are off unless someone turns them on.
 */
export function RailDirectory({ session, onClose }: RailDirectoryProps) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [bulk, setBulk] = React.useState<{ path: BulkPath | null } | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { settings } = useBulkActions();
  const picking = settings.enabled && settings.bulkInDirectory;

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Not while a bulk modal is up: that one owns Escape, and closing the
      // panel out from under it would take its selection — and itself — with
      // it mid-flow.
      if (e.key === "Escape" && bulk === null && !historyOpen) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, bulk, historyOpen]);

  const matches = matchAccounts(query, session.accounts);
  const searching = query.trim() !== "";

  const currentId = session.scope === "account" ? session.current.id : null;
  const { recentIds } = session;
  const { recent, all } = React.useMemo(() => {
    // RECENT: the current account leads (it is the most recently accessed by
    // definition), then the trail, capped so the section stays a glance.
    const recentOrder = [
      ...(currentId !== null ? [currentId] : []),
      ...recentIds.filter((id) => id !== currentId),
    ].slice(0, RECENT_ROWS);
    const recentRows = recentOrder
      .map((id) => matches.find((a) => a.id === id))
      .filter((a): a is Account => a !== undefined);
    // ALL: the COMPLETE directory (recents included — a directory with holes
    // reads as missing accounts), pinned first, then seed order.
    const allRows = [...matches].sort((a, b) => {
      const ap = session.onRail(a.id) ? 0 : 1;
      const bp = session.onRail(b.id) ? 0 : 1;
      return ap - bp;
    });
    return { recent: recentRows, all: allRows };
  }, [matches, currentId, recentIds, session]);

  /*
   * Selection is by id and the sections overlap — an account in RECENT is also
   * in ALL — so both of its rows read the same tick. That is right: there is
   * one account, ticked once, however many places the panel draws it.
   */
  const toggleRow = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const selectedAccounts = React.useMemo(
    () => session.accounts.filter((a) => selected.includes(a.id)),
    [session.accounts, selected],
  );

  const visibleIds = matches.map((a) => a.id);
  const visibleSelected = visibleIds.filter((id) => selected.includes(id));
  const allVisibleOn =
    visibleIds.length > 0 && visibleSelected.length === visibleIds.length;

  const rowProps = {
    session,
    onClose,
    picking,
    selected,
    onToggle: toggleRow,
  };

  return (
    <>
      {/*
        The panel header: title and close only. The waffle glyph is gone
        (Aug 13 ask) — once the strip has morphed, the title carries the
        identity and the icon just repeated it.

        44px under the rail's 2px top pad — centred on y=24 like the header.
      */}
      <div className="flex h-[44px] shrink-0 items-center gap-[9px] px-[12px]">
        {picking ? (
          <Box
            checked={allVisibleOn}
            mixed={visibleSelected.length > 0 && !allVisibleOn}
            onClick={() =>
              setSelected((s) =>
                allVisibleOn
                  ? s.filter((id) => !visibleIds.includes(id))
                  : [...new Set([...s, ...visibleIds])],
              )
            }
            label="Select every account shown"
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate text-[13.5px] leading-[18px] font-semibold text-nav-fg">
          {/* The count replaces the title rather than joining it: at 340px
              there is room for one thing on the left, and while rows are
              ticked the count is the more useful of the two. */}
          {selected.length > 0 ? `${selected.length} selected` : "All accounts"}
        </span>
        {picking && selected.length > 0 ? (
          /*
            Always the chooser here, whatever the Entry knob says. Straight-in
            draws a button per path, and three of those do not fit beside a
            title and a close in a 340px panel — so the directory asks once,
            in the modal, where there is room to explain the choice.
          */
          <button
            type="button"
            onClick={() => setBulk({ path: null })}
            /*
              Neutral ink, not the accent.

              Selection is not branded. The accent is the tenant's colour and it
              is already doing a job in this panel — every row wears a logo in
              it — so spending it again on a control that acts ON those rows put
              the loudest thing on screen in the same hue as the things it was
              about to change. Worse, the button changed colour per account: the
              same destructive action was red in one and violet in the next,
              which is the one place a colour ought to be constant.

              Near-black rather than mid-grey: this is the primary action of a
              selection state, and grey-on-grey reads as disabled.
            */
            className="motion-tap flex h-[26px] shrink-0 items-center gap-[5px] rounded-[7px] bg-nav-fg px-[9px] text-[12px] leading-none font-medium text-nav active:scale-[0.98]"
          >
            <Sparkles size={12} aria-hidden="true" />
            Bulk actions
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Close accounts directory"
          onClick={onClose}
          className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>

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

        <div className="-mx-[2px] mt-[6px] min-h-0 flex-1 overflow-y-auto px-[2px]">
          {matches.length === 0 ? (
            <p className="px-[7px] py-[16px] text-[13px] leading-[18px] text-nav-fg-subtle">
              No accounts match “{query.trim()}”.
            </p>
          ) : null}

          {searching ? (
            <Group accounts={matches} {...rowProps} />
          ) : (
            <>
              <Group label="RECENT" accounts={recent} {...rowProps} />
              <Group label="ALL" accounts={all} {...rowProps} />
            </>
          )}
        </div>
      </div>

      {bulk && selectedAccounts.length > 0 ? (
        <BulkModal
          accounts={selectedAccounts}
          initialPath={bulk.path}
          onClose={() => setBulk(null)}
          onOpenHistory={() => {
            setBulk(null);
            setHistoryOpen(true);
          }}
        />
      ) : null}

      {historyOpen ? <BulkHistoryModal onClose={() => setHistoryOpen(false)} /> : null}
    </>
  );
}

function Group({
  label,
  accounts,
  session,
  onClose,
  picking,
  selected,
  onToggle,
}: {
  label?: string;
  accounts: Account[];
  session: AccountsSession;
  onClose: () => void;
  picking: boolean;
  selected: readonly string[];
  onToggle: (id: string) => void;
}) {
  if (accounts.length === 0) return null;
  return (
    <>
      {label ? (
        <div className="sticky top-0 z-10 bg-nav-rail px-[7px] pt-[8px] pb-[4px]">
          <span className="text-[10.5px] leading-[14px] font-semibold tracking-[0.6px] text-nav-fg-subtle uppercase">
            {label}
          </span>
        </div>
      ) : null}
      {accounts.map((account) => {
        const current =
          session.scope === "account" && account.id === session.current.id;
        const ticked = selected.includes(account.id);
        // The row's own pin state decides its trailing action — pinning is
        // curation on the row now, not a section you file accounts into.
        const action = session.onRail(account.id) ? "remove" : "add";
        return (
          <div
            key={account.id}
            className={cn(
              "group/row flex w-full items-center gap-[10px] rounded-[8px] px-[7px] py-[6px]",
              ticked
                ? "bg-nav-active"
                : current
                  ? "bg-nav-active"
                  : "hover:bg-nav-hover",
            )}
          >
            {picking ? (
              <Box
                checked={ticked}
                onClick={() => onToggle(account.id)}
                label={`Select ${account.name}`}
              />
            ) : null}
            {/*
              The row is still the jump, ticked or not. Selecting is a separate
              target rather than a mode: a panel whose rows mean "go" until you
              tick something and then mean "tick" is how you land in the wrong
              account halfway through choosing four.
            */}
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
              {/*
                One step down across the row (Aug 28): 24px mark, 13px name,
                11px address. The panel is a LIST — seventeen rows you scan for
                a name — and at 28/13.5 it was drawn at the weight of the strip
                it replaces, where there are eleven tiles and no words at all.
                Smaller fits more of the directory on screen without the rows
                losing their hierarchy.
              */}
              <AccountLogo logo={account.logo} src={account.logoSrc} size={24} radius={999} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] leading-[17px] font-medium text-nav-fg">
                  {account.name}
                </span>
                <span className="truncate text-[11px] leading-[14px] text-nav-fg-subtle">
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
                "motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle",
                "shadow-[inset_0_0_0_1px_var(--fly-border)] hover:bg-nav-active hover:text-nav-fg",
              )}
            >
              {action === "remove" ? (
                <PinOff size={13} aria-hidden="true" />
              ) : (
                <Pin size={13} aria-hidden="true" />
              )}
            </button>
          </div>
        );
      })}
    </>
  );
}

/**
 * The same 17px box the tables draw, in the nav's own colours — this panel is
 * a nav surface, and a page-token checkbox on it goes invisible in dark.
 */
function Box({
  checked,
  mixed = false,
  onClick,
  label,
}: {
  checked: boolean;
  mixed?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "motion-tap flex size-[17px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
        // The same neutral the Bulk actions button wears — one ink for the
        // whole selection layer, and none of it the tenant's.
        checked || mixed
          ? "border-nav-fg bg-nav-fg text-nav"
          : "border-[var(--fly-border)] hover:border-nav-fg-subtle",
      )}
    >
      {mixed ? (
        <Minus size={12} aria-hidden="true" />
      ) : checked ? (
        <Check size={12} aria-hidden="true" />
      ) : null}
    </button>
  );
}
