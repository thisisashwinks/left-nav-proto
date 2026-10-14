"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import type { BulkPath } from "@/components/bulk/bulk-config";
import { BulkHistoryModal } from "@/components/bulk/bulk-history-modal";
import { BulkModal } from "@/components/bulk/bulk-modal";
import { useBulkActions } from "@/components/bulk/bulk-provider";
import { useTheme } from "@/components/theme/theme-provider";
import { DirectoryAccountRow } from "./directory-account-row";
import { DirectoryHeader } from "./directory-header";
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
  /** Only these accounts, for a member's switcher. See useAccountSwitcher. */
  only?: readonly string[];
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
  only,
}: AccountSwitcherProps) {
  const s = useAccountSwitcher(session, onClose, only);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  /*
   * The selection layer, on the same terms as the directory's.
   *
   * This panel and All accounts are two arrangements of one list, so a mode
   * that exists in one and not the other is two products. The switches are
   * read from the same places — see RailDirectory — rather than given this
   * surface its own, because "can this agency bulk-act on its accounts" is
   * not a question whose answer should depend on which panel they opened.
   */
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [selectMode, setSelectMode] = React.useState(false);
  const [bulk, setBulk] = React.useState<{ path: BulkPath | null } | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const { settings } = useBulkActions();
  const { directorySelect, agencyEntry, directoryPlacement } =
    useTheme().effective;
  /*
   * The dropdown drawn the way a filled rail is drawn.
   *
   * There is no rail in this arrangement — that is the whole point of it —
   * but the placement axis still has something to say: `names` asks for the
   * directory to BE a column rather than a card over one. So the panel keeps
   * its width and loses everything that makes it a card: no margins, no
   * radius, no ring, and it arrives by sliding in from the left edge instead
   * of growing out of the trigger. Ashwin, Oct 14.
   */
  const asRail = directoryPlacement === "names";
  /*
   * What pressing the agency row does, said as the action rather than as the
   * destination's size. "All accounts" described what is up there; this
   * describes the move, which is what a row you press is for.
   */
  const agencyJump =
    session.scope === "agency" ? "Switch to sub-account" : "Switch to agency";
  /*
   * Never for a member. Bulk-applying templates and feature access is an
   * agency operation on its clients; `only` is exactly the member case, so it
   * stands in for the directory's `membersOnly` here.
   */
  const bulkAllowed =
    settings.enabled && settings.bulkInDirectory && only === undefined;
  const picking = bulkAllowed && (directorySelect === "always" || selectMode);
  const guided = settings.flow === "guided";

  // Cancel is not Done: a selection that outlived the mode would sit invisible
  // behind a Select button and reappear on the next press.
  const exitSelect = React.useCallback(() => {
    setSelectMode(false);
    setSelected([]);
  }, []);

  const toggleRow = React.useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectedAccounts = React.useMemo(
    () => session.accounts.filter((a) => selected.includes(a.id)),
    [session.accounts, selected],
  );

  // What the header's select-all box reaches: the rows ON SCREEN, which under
  // a query is the matches and nothing else.
  const searching = s.query.trim() !== "";
  const visibleIds = s.flat.map((a) => a.id);
  const visibleSelected = visibleIds.filter((id) => selected.includes(id));
  const allVisibleOn =
    visibleIds.length > 0 && visibleSelected.length === visibleIds.length;

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape has to work with focus on a row or the star, not just in the field.
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
        style={
          asRail
            ? /*
                 Flush to the window on three sides. See DIRECTORY_PLACEMENTS.

                 `fixed`, not `absolute`: the panel has to reach the window's
                 own top and bottom, and the shell it is rendered inside is
                 neither — it sits under the banner and inside the plane's
                 padding, so an absolutely-positioned column would stop short
                 at both ends and the "no margins" this placement is asking
                 for would quietly become "the shell's margins".
              */
              { left: 0, top: 0, width: PANEL_WIDTH, height: "100vh" }
            : {
                left: anchor.left,
                top: anchor.top,
                width: PANEL_WIDTH,
                maxHeight: `calc(100vh - ${anchor.top + VIEWPORT_GUTTER}px)`,
                // The animation grows from where the trigger's mark sits, so
                // the panel reads as the trigger's own bounding box expanding
                // — not a dropdown appearing on top of it.
                transformOrigin: "22px 22px",
              }
        }
        className={cn(
          "z-50 flex flex-col overflow-hidden bg-nav p-[8px]",
          asRail
            ? cn(
                "fixed rounded-none",
                /*
                  Shadow, no ring. The inset hairline is what gives a floating
                  card its edge, and an edge is exactly what a surface flush
                  to the window does not have — drawn here it reads as a
                  border someone forgot to remove down the left of the screen.
                  The shadow alone does the separating.
                */
                "shadow-[0_16px_32px_-8px_var(--fly-shadow),0_4px_8px_-4px_var(--fly-shadow)]",
                phase === "entering"
                  ? "motion-directory-rail-in"
                  : "motion-directory-rail-out",
              )
            : cn(
                "absolute rounded-[12px]",
                "shadow-[0_16px_32px_-8px_var(--fly-shadow),0_4px_8px_-4px_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]",
                phase === "entering" ? "motion-menu-in" : "motion-menu-out",
              ),
        )}
      >
        {/*
          The directory's header, not a second design of one.

          This row used to repeat the account you are already in — the trigger
          "continued" — which answered a question nobody holding an open
          switcher is asking, and left the panel's own controls nowhere to go
          but a band under the search field. The All accounts panel had long
          since worked this row out: a title that doubles as the count, a
          select-all box, Actions, Select/Cancel, close. Ashwin, Oct 14: same
          look, same behaviour, no second version of it.

          The account you are in is still stated — it is a row in the list
          below, wearing the selected-row treatment and a tick, which is where
          a reader scanning for it would look anyway.
        */}
        <DirectoryHeader
          title={
            selected.length === 0
              ? only === undefined
                ? `All accounts (${session.accounts.length})`
                : `My accounts (${session.accounts.length})`
              : guided
                ? `${selected.length} of ${
                    searching ? s.flat.length : session.accounts.length
                  } selected`
                : `${selected.length} selected`
          }
          picking={picking}
          allOn={allVisibleOn}
          mixed={visibleSelected.length > 0 && !allVisibleOn}
          onToggleAll={() =>
            setSelected((prev) =>
              allVisibleOn
                ? prev.filter((id) => !visibleIds.includes(id))
                : [...new Set([...prev, ...visibleIds])],
            )
          }
          toggleAllLabel={
            searching
              ? `Select all ${visibleIds.length} matching`
              : allVisibleOn
                ? "Clear the selection"
                : `Select all ${session.accounts.length} accounts`
          }
          showActions={picking && selected.length > 0}
          onActions={() => setBulk({ path: null })}
          showSelect={bulkAllowed && directorySelect === "button"}
          selectMode={selectMode}
          onToggleSelect={() => (selectMode ? exitSelect() : setSelectMode(true))}
          onClose={onClose}
          /*
            No horizontal padding of its own.

            The directory's header pads 12 because that panel's body pads 8 and
            the two together give its rows their inset. This panel is a card
            with its own 8px padding and rows that start at that edge, so the
            header's 12 landed the title 20px in — four pixels adrift of every
            account name under it, which is exactly the misalignment a reader
            notices without being able to name. Ashwin, Oct 14.
          */
          className="px-0"
        />

        <div className="motion-tap mt-[6px] flex h-[32px] shrink-0 items-center gap-[8px] rounded-[9px] px-[9px] shadow-[inset_0_0_0_1px_var(--fly-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
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

        {/*
          The selection bar, between the field and the list.

          The directory puts Select and Actions in its title row; this panel
          has no title row — its first row is the account you are in — so the
          controls go directly above the rows they govern, which is also where
          the count can sit without competing with the account's own name.

          Only while the mode can do something: under `always` the boxes stand
          on their own and there is nothing to summon, so the bar appears only
          once something is ticked.
        */}
        <div
          ref={listRef}
          className="-mx-[2px] mt-[6px] min-h-0 flex-1 overflow-y-auto px-[2px]"
        >
          {/*
            Above the list and outside the arrow-key run: a scope jump is a
            different kind of move from picking a sibling account, and it must
            not reorder under a query the way results do.

            Hidden entirely while rows are being ticked. A bulk run acts on
            sub-accounts, and an offer to leave for the agency sitting inside
            a selection is an invitation to abandon the thing you are halfway
            through choosing — so the row goes, rather than sitting there
            doing nothing. Ashwin, Oct 14.
          */}
          {showAgency && !searching && !picking ? (
            <DirectoryAccountRow
              account={session.agency}
              current={false}
              /*
                A list item like every other one here — see AGENCY_ENTRIES.
                It used to be a plated row on its own tint with a rule under
                it, which made the first thing in the panel look like a
                different kind of surface.
              */
              showLogo={agencyEntry === "plate"}
              {...(agencyEntry === "plate"
                ? {}
                : { label: agencyJump })}
              showPin={false}
              trailing={
                agencyEntry === "plate" ? (
                  <span className="shrink-0 text-[11.5px] leading-[normal] whitespace-nowrap text-nav-fg-subtle">
                    {agencyJump}
                  </span>
                ) : null
              }
              onSelect={() => {
                if (session.scope === "agency") onClose();
                else session.switchToAgency();
                if (session.scope !== "agency") onClose();
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
              {/*
                Only when a group names itself, which in this panel is never —
                the list is one ordered run and the order carries the meaning.
                See the grouping in useAccountSwitcher. Sticky when it does
                appear, so the band a row belongs to stays readable mid-scroll.
              */}
              {group.label ? (
                <div className="sticky top-0 z-10 bg-nav px-[7px] pt-[8px] pb-[4px]">
                  <span className="text-[10.5px] leading-[14px] font-semibold tracking-[0.6px] text-nav-fg-subtle uppercase">
                    {group.label}
                  </span>
                </div>
              ) : null}
              {group.accounts.map((account) => {
                const index = s.flat.indexOf(account);
                return (
                  <DirectoryAccountRow
                    key={account.id}
                    account={account}
                    current={account.id === session.current.id}
                    index={index}
                    active={account.id === s.activeId}
                    onActivate={() => s.setActiveIndex(index)}
                    onSelect={() => s.select(account.id)}
                    pinned={session.isPinned(account.id)}
                    onTogglePinned={() => session.togglePinned(account.id)}
                    picking={picking}
                    ticked={selected.includes(account.id)}
                    onToggle={() => toggleRow(account.id)}
                    // Only the summoned mode takes the row over. Under
                    // `always` the box is a separate target and the row is
                    // still the jump — see the row's own note.
                    selectRows={picking && directorySelect === "button"}
                    /*
                      The pin comes off once a selection is running: two
                      controls on one row, one of which quietly reorders the
                      list you are working down.
                    */
                    showPin={!(guided && picking && selected.length > 0)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/*
          No footer.

          It held two keyboard hints and a count — a legend for behaviour the
          panel already has (arrows walk the list whether or not a strip says
          so) and a number nobody switches accounts by. It cost a permanent
          32px band under a list that is the whole point of the panel, so the
          list gets the height back. Ashwin, Oct 14.
        */}
      </div>

      {/*
        Rendered beside the panel, not inside it: the modal is the agency
        acting on a set of accounts, and nesting it in a 320px dropdown would
        inherit that dropdown's clipping and its stacking context.
      */}
      {bulk && selectedAccounts.length > 0 ? (
        <BulkModal
          accounts={selectedAccounts}
          initialPath={bulk.path}
          onClose={() => setBulk(null)}
          /*
            A finished run ends the errand, panel and all — the same contract
            the directory keeps. The ticks existed to answer "which accounts"
            for one action, and that action has happened.
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

