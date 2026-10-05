"use client";

import * as React from "react";
import { Check, Minus, Pin, Search, X } from "lucide-react";
import type { BulkPath } from "@/components/bulk/bulk-config";
import { BulkHistoryModal } from "@/components/bulk/bulk-history-modal";
import { BulkModal } from "@/components/bulk/bulk-modal";
import { useTheme } from "@/components/theme/theme-provider";
import { useBulkActions } from "@/components/bulk/bulk-provider";
import { usePinnedInk } from "@/components/nav/pin-button";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import { matchAccounts, type Account } from "./accounts-data";
import type { AccountsSession } from "./use-accounts";

interface RailDirectoryProps {
  session: AccountsSession;
  /**
   * Opened from a member's rail rather than the agency's.
   *
   * Only two things follow from it, because only two things should: the panel
   * is named for the set it holds, and it is never a bulk surface. WHICH
   * accounts it lists is not decided here at all — the session arrives already
   * scoped, so this component cannot leak an account the member has no access
   * to even if someone later forgets this flag exists.
   */
  membersOnly?: boolean;
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
export function RailDirectory({
  session,
  membersOnly = false,
  onClose,
}: RailDirectoryProps) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [bulk, setBulk] = React.useState<{ path: BulkPath | null } | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { settings } = useBulkActions();
  /*
   * Never for a member. Bulk-applying templates and feature access is an agency
   * operation on its clients — a member selecting four of the businesses they
   * work in and pushing settings across them is not a smaller version of that,
   * it is a different and unauthorised thing. The prototype switch turns the
   * agency's checkboxes on; it has nothing to say about this panel.
   */
  const bulkAllowed = settings.enabled && settings.bulkInDirectory && !membersOnly;
  /*
   * Select mode, when the checkboxes are summoned rather than standing.
   *
   * Held here rather than derived from `selected.length`, because leaving the
   * mode has to be possible with rows still ticked — and because an empty
   * selection is the state you START in, so a length test would close the
   * mode the moment you unticked the last row.
   */
  const [selectMode, setSelectMode] = React.useState(false);
  const { directorySelect } = useTheme().effective;
  /*
   * Whether rows are wearing checkboxes right now.
   *
   * Under `always` this is just the bulk switch, as it always was. Under
   * `button` it additionally waits for Select — and everything downstream
   * reads THIS rather than the switch, so the header's own box, the row
   * checkboxes and the guided flow's de-dupe all appear and leave together.
   */
  const picking = bulkAllowed && (directorySelect === "always" || selectMode);
  /*
   * Leaving the mode clears what it collected.
   *
   * Cancel is not Done. A selection that survived the mode being switched off
   * would sit invisible behind a Select button, and the next press would
   * reveal rows ticked by a decision the reader had already abandoned.
   */
  const exitSelect = React.useCallback(() => {
    setSelectMode(false);
    setSelected([]);
  }, []);
  /*
   * The guided flow's selection rules. See BULK_FLOWS.
   *
   * They are all one fix: a list you SELECT from has different obligations
   * from a list you jump from. One row per account, a count you can read
   * against a total, a way out that is not the same checkbox that got you in,
   * and nothing else on the row competing for the click.
   */
  const guided = settings.flow === "guided";

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
    /*
     * ALL: the complete directory, or everything the RECENT run did not
     * already show.
     *
     * Recents are repeated on purpose when this panel is a JUMP list — a
     * directory with holes in it reads as missing accounts. With checkboxes on
     * it is the opposite: the same account drew two rows and two ticks, so a
     * reader saw nineteen boxes checked over a count that said seventeen and
     * had no way to know which of the pair was "the" one. One account, one
     * row, one tick.
     */
    const dedupe = guided && picking;
    const recentSet = new Set(recentRows.map((a) => a.id));
    const allRows = [...matches]
      .filter((a) => !dedupe || !recentSet.has(a.id))
      .sort((a, b) => {
        const ap = session.onRail(a.id) ? 0 : 1;
        const bp = session.onRail(b.id) ? 0 : 1;
        return ap - bp;
      });
    return { recent: recentRows, all: allRows };
  }, [matches, currentId, recentIds, session, guided, picking]);

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
    // Only the summoned mode takes the row over — see the note on the row.
    selectRows: picking && directorySelect === "button",
    selected,
    onToggle: toggleRow,
    /*
      The pin comes off the row once rows are being ticked.

      Two controls on a 34px row, one of which quietly reorders the list you
      are working down — tick, tick, miss, and the next row has moved. Pinning
      is curation you do while browsing; it is there whenever nothing is
      selected, which is whenever you are browsing.
    */
    showPin: !(guided && picking && selected.length > 0),
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
            /*
              Says what it will do to what is on screen, not "everything".
              While a query is up this box reaches the matches and nothing
              else — and an admin who has just filtered to three of four
              hundred needs that stated before they press it, not discovered
              after.
            */
            label={
              searching
                ? `Select all ${matches.length} matching`
                : allVisibleOn
                  ? "Clear the selection"
                  : `Select all ${session.accounts.length} accounts`
            }
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate text-[13.5px] leading-[18px] font-semibold text-nav-fg">
          {/* The count replaces the title rather than joining it: at 340px
              there is room for one thing on the left, and while rows are
              ticked the count is the more useful of the two. */}
          {selected.length === 0
            ? membersOnly
              ? "My accounts"
              : "All accounts"
            : guided
              ? /*
                   A count against a total, because a bare "17 selected" does
                   not say whether that is all of them or a sixth of them —
                   and which of those it is changes whether you press the
                   button. While searching the total is what you can see, since
                   that is what the header box would act on.
                */
                `${selected.length} of ${
                  searching ? matches.length : session.accounts.length
                } selected`
              : `${selected.length} selected`}
        </span>
        {/*
          Clear is gone (Oct 5).

          It was the way out of a large selection — the header box only
          reaches what is VISIBLE, so filtering then clearing stranded the
          rest. Cancel does that job now and does it better: it leaves the
          mode as well as the selection, which is what someone pressing "get
          me out of this" actually wants. Two abandon buttons side by side was
          the real problem.
        */}
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
            className="motion-tap flex h-[26px] shrink-0 items-center rounded-[7px] bg-[var(--hr-primary-600)] px-[9px] text-[12px] leading-none font-medium text-white active:scale-[0.98]"
          >
            {/* No glyph. Sparkles reads as AI everywhere else in this shell —
                it is the Ask AI mark — and a bulk run is the one thing here
                that is emphatically not that. The words are the label. */}
            Bulk actions
          </button>
        ) : null}
        {/*
          Select, iOS-style — and Cancel once you are in it.

          Before the close rather than after: this is the panel's own action
          and ✕ is the way out of the panel, so the one that changes what the
          panel IS should not sit outboard of the one that dismisses it.
          Hidden entirely under `always`, where the boxes need no summoning,
          and under a selection the guided flow is already driving.
        */}
        {bulkAllowed && directorySelect === "button" ? (
          <button
            type="button"
            onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
            className={cn(
              "motion-tap shrink-0 rounded-[6px] px-[7px] py-[4px] text-[12px] leading-none font-medium",
              selectMode
                ? "text-nav-fg hover:bg-nav-hover"
                : "text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg",
            )}
          >
            {selectMode ? "Cancel" : "Select"}
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
            /*
              "Search 17 accounts" beside "17 selected" read as searching
              WITHIN the selection — two seventeens on one surface meaning
              different things. The field searches the directory; it always
              did.
            */
            placeholder="Search sub-accounts"
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
              {/* Named for what it holds: with the recents deduped out of it,
                  "ALL" would be a heading over all-but-five. */}
              <Group
                label={guided && picking ? "ALL OTHERS" : "ALL"}
                accounts={all}
                {...rowProps}
              />
            </>
          )}
        </div>
      </div>

      {bulk && selectedAccounts.length > 0 ? (
        <BulkModal
          accounts={selectedAccounts}
          initialPath={bulk.path}
          onClose={() => setBulk(null)}
          /*
            A finished run ends the errand, panel and all.

            The selection existed to answer "which sub-accounts" for one action,
            and that action has happened — leaving three ticks standing over a
            list is an invitation to run something else on a set that was chosen
            for something else. Another run starts from a clean pick. Cancel and
            Back leave it all exactly as it was.
          */
          onCompleted={() => {
            setSelected([]);
            onClose();
          }}
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
  selectRows = false,
  selected,
  onToggle,
  showPin = true,
}: {
  label?: string;
  accounts: Account[];
  session: AccountsSession;
  onClose: () => void;
  picking: boolean;
  /** The row itself ticks rather than jumping. See the note on the row. */
  selectRows?: boolean;
  selected: readonly string[];
  onToggle: (id: string) => void;
  /** Off while a selection is in progress — see rowProps. */
  showPin?: boolean;
}) {
  /*
    The same ink a set pin wears in the nav, through the same axis — a pinned
    account and a pinned product are one gesture, and a mark that is grey in
    one list and branded in the other would be two.
  */
  const pinnedInk = usePinnedInk();
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
              What the row means depends on whether a mode is running.

              Under `always` the checkbox is a separate target and the row is
              still the jump, ticked or not — a panel whose rows mean "go"
              until you tick something and then mean "tick" is how you land in
              the wrong account halfway through choosing four.

              Under `button` that ambiguity cannot arise, because the mode is
              declared before any of it: you pressed Select, so every row ticks
              and nothing jumps until you Cancel. That is the whole reason the
              iOS pattern works, and taking the mode without taking this would
              be the worst of both — a button announcing a mode that the rows
              then do not honour. Ashwin, Oct 5.
            */}
            <button
              type="button"
              onClick={() => {
                if (selectRows) {
                  onToggle(account.id);
                  return;
                }
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
            {showPin ? (
              /*
                The nav's pin, on an account row — see PinButton, which this
                deliberately mirrors rather than imports (that one pins a
                PRODUCT through the nav layout store; this pins an account to
                the rail through the session).
                
                Two things changed here (Sep 16). The state is now in the GLYPH
                rather than in which glyph: a filled pin is pinned, an outline
                pin is not, the way the pin reads everywhere else in the nav.
                Pin/PinOff put the state in a diagonal slash that is 13px wide
                and easy to miss, and worse, showed every row the icon for what
                pressing it would DO — so a column of pinned accounts wore
                "unpin" marks and read as the unpinned ones.
                
                And an unpinned row only shows it on hover. Drawn at rest on
                every row, seventeen identical outlined boxes ran down the panel
                as a second column competing with the logos — which made the
                four that mattered impossible to pick out. Pinned stays visible,
                because that one is not an affordance, it is the row telling you
                what it is.
              */
              <button
                type="button"
                aria-label={
                  action === "remove"
                    ? `Unpin ${account.name}`
                    : `Pin ${account.name}`
                }
                aria-pressed={action === "remove"}
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
                  "motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px]",
                  "hover:bg-nav-active active:scale-90 motion-press",
                  action === "remove"
                    ? cn(pinnedInk, "opacity-100")
                    : "text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 hover:text-nav-fg focus-visible:opacity-100",
                )}
              >
                <Pin
                  size={13}
                  fill={action === "remove" ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              </button>
            ) : null}
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
        /*
          Primary blue, with the Bulk actions button beside it — one ink for
          the whole selection layer. Oct 5, Ashwin.

          It was near-black, on the argument that selection is not branded and
          the accent is the tenant's colour. That argument was about the
          ACCENT, which changes per account; `--hr-primary-600` is the
          product's own blue and does not move, so the objection it answered
          does not apply to it. A tick is a system affordance and the system's
          colour for "on" is blue.
        */
        checked || mixed
          ? "border-[var(--hr-primary-600)] bg-[var(--hr-primary-600)] text-white"
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
