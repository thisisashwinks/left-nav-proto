"use client";

import * as React from "react";
import {
  Check,
  ChevronRight,
  History,
  LayoutTemplate,
  Minus,
  Plus,
  Search,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import { matchAccounts } from "@/components/accounts/accounts-data";
import type { AccountsSession } from "@/components/accounts/use-accounts";
import {
  BULK_PATH_LABELS,
  pathsFor,
  type BulkPath,
} from "@/components/bulk/bulk-config";
import { BulkHistoryModal } from "@/components/bulk/bulk-history-modal";
import { BulkModal } from "@/components/bulk/bulk-modal";
import { plural, useBulkActions } from "@/components/bulk/bulk-provider";
import { industryFor } from "@/components/nav/account-nav-profiles";
import { useNavProfiles } from "@/components/nav/nav-profiles";
import { productsFor } from "@/components/nav/saas-tiers";
import { SAAS_TIER_LABELS, SAAS_TIER_PRICES, type SaasTier } from "@/design/plans";
import { SaasTierDialog } from "./saas-tier-dialog";
import { withProduct } from "@/components/nav/grouping";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The Sub-accounts page: pick an account, then manage it — or tick several and
 * change them all at once.
 *
 * It used to be the door to the nav customizer, and the row action said
 * "Customize" because the page behind it could reshape a client's navigation.
 * That tab is gone (Aug 25 — editing happens in place, in the account), so the
 * action promises only what the page still delivers: its settings.
 *
 * Selection is what came back in its place, and it is a different idea rather
 * than the same one restored. The customizer let you edit ONE other account
 * from here, which is how the wrong client's nav gets changed. Bulk actions ask
 * you to tick the rows first, apply the same decision to every one of them, and
 * state how many things will actually move before they do. An agency running
 * forty dentists wants to shape one and say "the rest like that" — this is the
 * page where they say it.
 */

const PATH_ICONS: Record<BulkPath, typeof LayoutTemplate> = {
  template: LayoutTemplate,
  features: SlidersHorizontal,
  "per-account": Sparkles,
};

export function AccountsIndexPage({
  session,
  onManage,
}: {
  session: AccountsSession;
  onManage: (accountId: string) => void;
}) {
  const { effective } = useTheme();
  const layout = useNavLayout();
  const { settings, history } = useBulkActions();
  const { saasTierFor, setSaasTier } = useNavProfiles();
  /** The account whose plan is being changed, if any. */
  const [tierFor, setTierFor] = React.useState<string | null>(null);
  const appTheme = effective.appTheme;
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [bulk, setBulk] = React.useState<{ path: BulkPath | null } | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const accounts = matchAccounts(query, session.accounts);
  const visibleIds = accounts.map((a) => a.id);

  /*
   * Selection survives filtering.
   *
   * Typing in the search box is narrowing the view, not un-ticking rows — an
   * admin who selects three dentists, searches for a roofer and adds it expects
   * four selected, not one. So the count and the modal read from `selected`
   * whole, and only the header checkbox reasons about what is on screen.
   */
  const selectedAccounts = React.useMemo(
    () => session.accounts.filter((a) => selected.includes(a.id)),
    [session.accounts, selected],
  );

  const visibleSelected = visibleIds.filter((id) => selected.includes(id));
  const allVisibleOn =
    visibleIds.length > 0 && visibleSelected.length === visibleIds.length;

  const toggleRow = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAllVisible = () =>
    setSelected((s) =>
      allVisibleOn
        ? s.filter((id) => !visibleIds.includes(id))
        : [...new Set([...s, ...visibleIds])],
    );

  const bulkBar =
    settings.enabled && selected.length > 0 ? (
      <BulkBar
        count={selected.length}
        total={session.accounts.length}
        allSelected={selected.length === session.accounts.length}
        selectAllMatching={settings.selectAllMatching}
        entry={settings.entry}
        paths={pathsFor(settings)}
        onSelectAll={() => setSelected(session.accounts.map((a) => a.id))}
        onClear={() => setSelected([])}
        onOpen={(path) => setBulk({ path })}
        floating={settings.bar === "floating"}
      />
    ) : null;

  return (
    <div
      data-page-theme={appTheme}
      // `relative` so the floating variant of the bulk bar anchors to the page
      // rather than to whatever ancestor happens to be positioned.
      className="relative flex h-full min-h-0 flex-col bg-pg-bg"
    >
      <header className="flex shrink-0 items-center gap-[12px] px-[24px] pt-[18px] pb-[14px]">
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] leading-[22px] font-semibold text-pg-heading">
            Sub-accounts
          </h1>
          <p className="text-[12px] leading-[16px] text-pg-muted">
            {session.accounts.length} accounts · pick one to manage its details and settings.
          </p>
        </div>
        <label className="flex h-[32px] w-[240px] shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or address"
            aria-label="Search sub-accounts"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-none text-pg-heading placeholder:text-pg-faint focus:outline-none"
          />
        </label>
        {settings.enabled && settings.keepHistory ? (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="motion-tap flex h-[32px] shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] text-[12.5px] leading-none font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-surface"
          >
            <History size={13} aria-hidden="true" />
            Bulk action history
            {history.length > 0 ? (
              <span className="rounded-full bg-brand px-[5px] py-[2px] font-mono text-[9px] leading-none text-brand-fg tabular-nums">
                {history.length}
              </span>
            ) : null}
          </button>
        ) : null}
        <button
          type="button"
          className="motion-tap flex h-[32px] shrink-0 items-center gap-[6px] rounded-[8px] bg-brand px-[12px] text-[12.5px] leading-none font-medium text-brand-fg active:scale-[0.98]"
        >
          <Plus size={13} aria-hidden="true" />
          Create sub-account
        </button>
      </header>

      {settings.bar === "inline" ? bulkBar : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-[24px] pb-[24px]">
        <div className="overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <div className="flex items-center gap-[14px] px-[16px] py-[9px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
            {settings.enabled ? (
              <Box
                checked={allVisibleOn}
                mixed={visibleSelected.length > 0 && !allVisibleOn}
                onClick={toggleAllVisible}
                label="Select every sub-account shown"
              />
            ) : null}
            <span className="w-[300px] text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Name
            </span>
            <span className="flex-1 text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Address
            </span>
            {/*
              The two columns that decide what an operator opens: what trade
              this client is in, and how much of the catalogue they are on.
              Both are what makes their nav look the way it does.
            */}
            <span className="w-[170px] text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Industry
            </span>
            <span className="w-[130px] text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              {/* Their plan, not yours — see saas-tier-dialog.tsx. */}
              Client plan
            </span>
            <span className="w-[80px] text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Products
            </span>
            <span className="w-[70px] text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Status
            </span>
            <span className="w-[110px]" />
          </div>
          {accounts.length === 0 ? (
            <p className="px-[16px] py-[18px] text-[13px] text-pg-muted">
              No accounts match “{query.trim()}”.
            </p>
          ) : null}
          {accounts.map((account, i) => {
            const on = selected.includes(account.id);
            return (
              <div
                key={account.id}
                className={cn(
                  "group/row flex w-full items-center gap-[14px] px-[16px]",
                  i === accounts.length - 1
                    ? ""
                    : "shadow-[inset_0_-1px_0_0_var(--pg-border)]",
                  on ? "bg-pg-row-selected" : "hover:bg-pg-bg",
                )}
              >
                {settings.enabled ? (
                  <Box
                    checked={on}
                    onClick={() => toggleRow(account.id)}
                    label={`Select ${account.name}`}
                  />
                ) : null}
                {/*
                  The row still opens the account. Ticking it is a separate
                  target rather than a mode: an admin selecting four accounts
                  and an admin opening one are doing different things, and a
                  row that means "open" until you have selected something and
                  then means "tick" is how you open the wrong client mid-run.
                */}
                <button
                  type="button"
                  onClick={() => onManage(account.id)}
                  className="flex min-w-0 flex-1 items-center gap-[14px] py-[10px] text-left"
                >
                  <span className="flex w-[300px] items-center gap-[10px]">
                    <AccountLogo
                      logo={account.logo}
                      src={account.logoSrc}
                      size={26}
                      radius={999}
                    />
                    <span className="truncate text-[13.5px] leading-[18px] font-medium text-pg-heading">
                      {account.name}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-pg-muted">
                    {account.meta}
                  </span>
                  <span className="w-[170px] truncate text-[12.5px] text-pg-muted">
                    {industryFor(account.id) ?? "—"}
                  </span>
                  {/*
                    A span with a role, not a button.
                    
                    The row IS a button — it opens the account — and nesting a
                    control inside one is invalid markup that browsers resolve
                    differently. The same trick `flyout-row.tsx` uses for its
                    icon picker, for the same reason.
                  */}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Change ${account.name}'s plan`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setTierFor(account.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.stopPropagation();
                      e.preventDefault();
                      setTierFor(account.id);
                    }}
                    className="motion-tap flex w-[130px] cursor-pointer items-center gap-[6px] rounded-[6px] px-[6px] py-[4px] hover:bg-pg-row-border"
                  >
                    <span className="truncate text-[12.5px] leading-none font-medium text-pg-heading">
                      {SAAS_TIER_LABELS[saasTierFor(account.id)]}
                    </span>
                    <span className="shrink-0 text-[11.5px] leading-none text-pg-faint tabular-nums">
                      {SAAS_TIER_PRICES[saasTierFor(account.id)]}
                    </span>
                  </span>
                  <span className="w-[80px] text-[12.5px] text-pg-muted tabular-nums">
                    {layout.profileFor(account.id).enabledProducts.length}
                  </span>
                  <span className="w-[70px]">
                    <span className="rounded-[5px] bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] px-[6px] py-[3px] text-[10.5px] leading-none font-semibold text-[var(--hr-success-700)]">
                      Active
                    </span>
                  </span>
                  <span className="flex w-[110px] items-center justify-end gap-[5px] text-[12.5px] leading-none font-medium text-brand opacity-0 group-hover/row:opacity-100">
                    <SlidersHorizontal size={13} aria-hidden="true" />
                    Manage
                    <ChevronRight size={13} aria-hidden="true" />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {settings.bar === "floating" ? bulkBar : null}

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

      {tierFor ? (
        <SaasTierDialog
          account={session.accounts.find((a) => a.id === tierFor)!}
          current={saasTierFor(tierFor)}
          onClose={() => setTierFor(null)}
          onChoose={(tier: SaasTier) => {
            setSaasTier(tierFor, tier);
            /*
              An upgrade GRANTS the tier's products, it does not replace the
              account's tree.
              
              The whole texture of this prototype is that a dental practice and
              a roofer have different navs; a tier that overwrote the tree would
              trade that for a demo of three identical ones. So the tier decides
              what the client is entitled to, and their own arrangement of it
              survives — which is also how HighLevel's SaaS tiers actually work.
            */
            layout.applyToAccounts(
              [tierFor],
              `Upgraded to ${SAAS_TIER_LABELS[tier]}`,
              (state) =>
                productsFor(tier).reduce(
                  (acc, id) => withProduct(acc, id, true),
                  state,
                ),
            );
          }}
        />
      ) : null}

      {historyOpen ? <BulkHistoryModal onClose={() => setHistoryOpen(false)} /> : null}
    </div>
  );
}

/**
 * The selection toolbar.
 *
 * Two placements, because the argument is real: above the table it is stable
 * and never covers a row, but it pushes the table down the moment you tick
 * something; floating it holds the table still at the cost of sitting over the
 * last row. Both are switchable in the prototype controls rather than settled
 * in a doc.
 */
function BulkBar({
  count,
  total,
  allSelected,
  selectAllMatching,
  entry,
  paths,
  onSelectAll,
  onClear,
  onOpen,
  floating,
}: {
  count: number;
  total: number;
  allSelected: boolean;
  selectAllMatching: boolean;
  entry: "chooser" | "direct";
  /** The paths on offer, so the toolbar and the chooser cannot disagree. */
  paths: readonly BulkPath[];
  onSelectAll: () => void;
  onClear: () => void;
  onOpen: (path: BulkPath | null) => void;
  floating: boolean;
}) {
  return (
    <div
      className={cn(
        "z-20 flex shrink-0 items-center gap-[8px]",
        floating
          ? // Centred with `mx-auto` rather than a translate: `motion-panel-in`
            // animates `transform`, so a `-translate-x-1/2` on the same element
            // is overwritten the moment the bar animates in and the bar lands
            // off to the right, clipping its last button.
            "motion-panel-in pointer-events-auto absolute inset-x-[24px] bottom-[24px] mx-auto w-fit max-w-[calc(100%-48px)] rounded-[10px] bg-pg-surface px-[12px] py-[10px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.16),0_4px_6px_-2px_rgba(16,24,40,0.06),inset_0_0_0_1px_var(--pg-card-border)]"
          : "mx-[24px] mb-[12px] rounded-[10px] bg-pg-surface px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]",
      )}
    >
      <span className="flex shrink-0 items-center rounded-[6px] bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] px-[8px] py-[5px] text-[12.5px] leading-none font-semibold text-brand">
        {plural(count, "sub-account")} selected
      </span>
      {selectAllMatching && !allSelected ? (
        <button
          type="button"
          onClick={onSelectAll}
          className="motion-tap shrink-0 rounded-[6px] px-[6px] py-[5px] text-[12.5px] leading-none font-medium text-brand hover:bg-pg-bg"
        >
          Select all {total}
        </button>
      ) : null}

      <span aria-hidden="true" className="h-[18px] w-px shrink-0 bg-pg-border" />

      {entry === "chooser" ? (
        <BarButton primary onClick={() => onOpen(null)}>
          <Sparkles size={13} aria-hidden="true" />
          Bulk actions
        </BarButton>
      ) : (
        paths.map((path) => {
          const Icon = PATH_ICONS[path];
          return (
            <BarButton key={path} onClick={() => onOpen(path)}>
              <Icon size={13} aria-hidden="true" />
              {BULK_PATH_LABELS[path]}
            </BarButton>
          );
        })
      )}

      {/* Inline, the bar is the table's width and Clear belongs at its far
          end; floating, the bar is only as wide as its buttons, so a spacer
          would just stretch it. */}
      {floating ? null : <span aria-hidden="true" className="min-w-0 flex-1" />}

      <button
        type="button"
        onClick={onClear}
        className="motion-tap shrink-0 rounded-[6px] px-[8px] py-[5px] text-[12.5px] leading-none font-medium text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
      >
        Clear
      </button>
    </div>
  );
}

function BarButton({
  children,
  primary = false,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "motion-tap flex h-[30px] shrink-0 items-center gap-[6px] rounded-[7px] px-[10px] text-[12.5px] leading-none font-medium active:scale-[0.98]",
        primary
          ? "bg-brand text-brand-fg"
          : "text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg",
      )}
    >
      {children}
    </button>
  );
}

/** 17px box, 5px radius — the same checkbox the contacts table draws. */
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
        checked || mixed
          ? "border-brand bg-brand text-white"
          : "border-pg-disabled bg-pg-surface hover:border-pg-muted",
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
