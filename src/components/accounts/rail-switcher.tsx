"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { BulkPath } from "@/components/bulk/bulk-config";
import { BulkHistoryModal } from "@/components/bulk/bulk-history-modal";
import { BulkModal } from "@/components/bulk/bulk-modal";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import { useTheme } from "@/components/theme/theme-provider";
import { useBulkActions } from "@/components/bulk/bulk-provider";
import { DirectoryAccountRow } from "./directory-account-row";
import { RAIL_PIN_MAX } from "./account-rail";
import { DIRECTORY_NAME_LABELS, SELECT_LABEL_LABELS } from "@/design/theme";
import { DirectoryHeader } from "./directory-header";
import { SelectStripRow } from "./select-strip";
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


/**
 * The accounts directory the rail morphs into.
 *
 * Not a docked dialog any more (Aug 13 ask): clicking the waffle widens the
 * rail itself into this — one surface growing, instead of two surfaces
 * meeting at an edge, which is the seam every earlier round tripped over.
 * The rail owns the frame; this is the whole of the content, header included.
 *
 * ONE list, unlabelled (Oct 6). It carried a RECENT section above the
 * directory, which was right at seventeen sub-accounts and wrong at forty:
 * the first screen became four rows of trail and a heading, and the list you
 * came for started below the fold. Recents are also the one thing this panel
 * does not need to say — the current account is marked as such, and the four
 * behind it are the four you could have reached by not opening this at all.
 *
 * The headings went with it. Two of them were only ever there to tell the
 * sections apart, and "ALL" over the whole list when the title already says
 * "All accounts (40)" is the same word twice in forty pixels.
 *
 * Pinning stays a per-row action, and the pin's reward is rank: pinned
 * accounts lead the list. That is the one piece of the old RECENT section's
 * job worth keeping, and it is done by order rather than by a section.
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
  /** The scrolling list, for the hover-only scrollbar. See the region below. */
  const listRef = React.useRef<HTMLDivElement>(null);
  // Writes data-overflowing / data-scrollbar-active onto it. The return value
  // is unused — every rule that reads them is CSS.
  useScrollEdges(listRef);
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
  const {
    directorySelect,
    directoryExit,
    selectSpot,
    selectLabel,
    selectStrip,
    directoryName,
  } = useTheme().effective;
  // See SELECT_LABELS. The word only ever labels the START of the mode; the
  // way out is Cancel whatever this says.
  //
  // Read from the map rather than tested against one value. It used to be
  // `selectLabel === "edit" ? "Edit account" : "Select"`, which hard-coded
  // the fallback — so the moment a third word was added to the axis this
  // surface silently kept saying "Select" while every other said the new
  // one. "Edit" keeps its qualifier here, where the row it acts on is not
  // otherwise named. Ashwin, Oct 15.
  const selectWord =
    selectLabel === "edit" ? "Edit account" : SELECT_LABEL_LABELS[selectLabel];
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

  /*
   * The directory, pinned accounts first.
   *
   * One list rather than the RECENT/ALL pair this used to build — see the
   * note at the top. Losing the second section also loses the de-dupe that
   * went with it: an account could be drawn twice, which under checkboxes
   * meant one account showing two ticks and a count that disagreed with the
   * boxes on screen. One row, one tick, by construction now.
   */
  const all = React.useMemo(
    () =>
      [...matches].sort((a, b) => {
        const ap = session.onRail(a.id) ? 0 : 1;
        const bp = session.onRail(b.id) ? 0 : 1;
        return ap - bp;
      }),
    [matches, session],
  );

  /* Selection is by id: one account, ticked once. */
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

        Shared with the header dropdown — see DirectoryHeader. The row was
        worked out here; the dropdown now wears the same one rather than a
        second version of it.
      */}
      <DirectoryHeader
        title={
          selected.length === 0
            ? membersOnly
              ? `My accounts (${session.accounts.length})`
              : DIRECTORY_NAME_LABELS[directoryName]
            : guided
              ? /*
                   A count against a total, because a bare "17 selected" does
                   not say whether that is all of them or a sixth of them —
                   and which of those it is changes whether you press the
                   button. While searching the total is what you can see,
                   since that is what the header box would act on.
                */
                `${selected.length} of ${
                  searching ? matches.length : session.accounts.length
                } selected`
              : `${selected.length} selected`
        }
        picking={picking}
        allOn={allVisibleOn}
        mixed={visibleSelected.length > 0 && !allVisibleOn}
        onToggleAll={() =>
          setSelected((s) =>
            allVisibleOn
              ? s.filter((id) => !visibleIds.includes(id))
              : [...new Set([...s, ...visibleIds])],
          )
        }
        toggleAllLabel={
          searching
            ? `Select all ${matches.length} matching`
            : allVisibleOn
              ? "Clear the selection"
              : `Select all ${session.accounts.length} accounts`
        }
        showActions={picking && selected.length > 0 && selectSpot === "header"}
        keepCloseWhilePicking={selectSpot === "below"}
        onActions={() => setBulk({ path: null })}
        showSelect={
          bulkAllowed && directorySelect === "button" && selectSpot === "header"
        }
        showSelectAll={picking && selectSpot === "header"}
        selectLabel={selectWord}
        selectMode={selectMode}
        onToggleSelect={() => (selectMode ? exitSelect() : setSelectMode(true))}
        exit={directoryExit === "back" ? "back" : "close"}
        onClose={onClose}
        closeLabel="Close accounts directory"
      />

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

        {/*
          The same strip the header dropdown uses — see SelectStripRow. Both
          panels are arrangements of one list, so the selection controls are
          one component rather than two that agree for now.
        */}
        {bulkAllowed && directorySelect === "button" && selectSpot === "below" ? (
          <SelectStripRow
            strip={selectStrip}
            picking={picking}
            allOn={allVisibleOn}
            mixed={visibleSelected.length > 0 && !allVisibleOn}
            onToggleAll={() =>
              setSelected((s) =>
                allVisibleOn
                  ? s.filter((id) => !visibleIds.includes(id))
                  : [...new Set([...s, ...visibleIds])],
              )
            }
            toggleAllLabel={
              searching
                ? `Select all ${matches.length} matching`
                : allVisibleOn
                  ? "Clear the selection"
                  : `Select all ${session.accounts.length} accounts`
            }
            selectedCount={selected.length}
            totalCount={session.accounts.length}
            selectMode={selectMode}
            onToggleSelect={() => (selectMode ? exitSelect() : setSelectMode(true))}
            selectWord={selectWord}
            showActions={picking && selected.length > 0}
            onActions={() => setBulk({ path: null })}
          />
        ) : null}

        {/*
          A scroll region, not a plain overflow box.

          At seventeen rows this scrolled in silence; at forty it needs to say
          so — and to say it the way the rest of this shell does. The shared
          rules give the thumb a transparent resting state and paint it only
          while `data-scrollbar-active` is set, which `useScrollEdges` writes
          on pointer movement and clears shortly after. So the bar appears
          when you reach for it and leaves again, instead of standing in a
          list of names permanently. See globals.css.
        */}
        <div
          ref={listRef}
          data-scroll-region=""
          /*
            The gutter is the panel's own padding, not a margin off the rows.

            A scroll region reserves its scrollbar INSIDE itself — the strip is
            the element's right padding in all but name — so a list that
            started where the search field starts ended ten pixels short of
            where it ends. Every row was narrower than the field above it, for
            a bar that is invisible until you reach for it.

            So the region is widened past its column by exactly the gutter and
            the gutter is narrowed to the panel's 8px inset. The rows' content
            box lands back on the search field's edges, and the bar rides in
            the padding beside them rather than taking a bite out of them.

            8 rather than the shared 10 because that is what the panel pads by:
            any other number and the bar is either clipped by the panel's edge
            or floating short of it. Ashwin, Oct 6.
          */
          style={{ "--nav-scroll-gutter": "8px" } as React.CSSProperties}
          className="mt-[6px] -mr-[8px] -ml-[2px] min-h-0 flex-1 overflow-y-auto pl-[2px]"
        >
          {matches.length === 0 ? (
            <p className="px-[7px] py-[16px] text-[13px] leading-[18px] text-nav-fg-subtle">
              No accounts match “{query.trim()}”.
            </p>
          ) : null}

          {/*
            One unlabelled group, searching or not. The search no longer has
            sections to collapse — the list it filters is already the only
            one there is.
          */}
          <Group accounts={searching ? matches : all} {...rowProps} />
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
        // The row's own pin state decides its trailing action — pinning is
        // curation on the row now, not a section you file accounts into.
        const onRail = session.onRail(account.id);
        return (
          <DirectoryAccountRow
            key={account.id}
            account={account}
            current={
              session.scope === "account" && account.id === session.current.id
            }
            picking={picking}
            selectRows={selectRows}
            ticked={selected.includes(account.id)}
            onToggle={() => onToggle(account.id)}
            onSelect={() => {
              // Jumping into an account opens it on the rail too — you are
              // working in it now, so it has earned a tile (space allowing).
              session.addToRail(account.id);
              session.switchTo(account.id);
              onClose();
            }}
            showPin={showPin}
            pinned={onRail}
            // The rail holds ten; past that an unpinned row says so rather
            // than failing silently. See RAIL_PIN_MAX.
            pinBlocked={!onRail && session.railIds.length >= RAIL_PIN_MAX}
            onTogglePinned={() => {
              // Pure curation now: with one sorted list, the pin toggles the
              // rail tile and nothing else — the ROW is the jump. The old
              // add-and-go behaviour belonged to the "All accounts" section
              // this list replaced.
              if (onRail) session.removeFromRail(account.id);
              else session.addToRail(account.id);
            }}
          />
        );
      })}
    </>
  );
}

