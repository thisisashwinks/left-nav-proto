"use client";

/**
 * "Apply theme to" — all sub-accounts, or the ones you pick (Nov 24).
 *
 * Asked at every place an agency theme is saved when the prototype control
 * "Theme applies to" is "Ask" (or Layout and theme = Combined with the theme
 * where it is today): the White label section, onboarding's Finish, and the
 * edit session's Save. The agency's own sidebar always takes the new theme;
 * sub-accounts left out keep the theme they had.
 *
 * Built from the bulk "Apply layout" modal's own parts (Ashwin, Nov 24): its
 * frame, option cards, checkbox, search field, and buttons — so picking
 * sub-accounts for a theme looks and works like picking them for a layout.
 *
 * A module store so any save site can `await askThemeScope()` without owning
 * the dialog; ThemeScopeHost (mounted once) draws it.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Building2, Search, X } from "lucide-react";
import { useBranding } from "@/components/branding/branding-provider";
import { accounts as ALL_ACCOUNTS } from "@/components/accounts/accounts-data";
import { AccountLogo } from "@/components/accounts/account-logo";
import { Box, PrimaryButton, SecondaryButton } from "@/components/bulk/bulk-modal";
import { useTheme } from "@/components/theme/theme-provider";
import type { BrandingState, BrandingTheme } from "@/design/branding";
import { cn } from "@/lib/utils";

export type ThemeScope = "all" | string[];

let pending: ((r: ThemeScope | null) => void) | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Opens the prompt; resolves with the choice, or null on Cancel. */
export function askThemeScope(): Promise<ThemeScope | null> {
  pending?.(null);
  return new Promise((resolve) => {
    pending = resolve;
    emit();
  });
}

function answer(r: ThemeScope | null) {
  const p = pending;
  pending = null;
  emit();
  p?.(r);
}

/** True when saves should ask "all or selected" (see the module note). */
export function useThemeScopeAsk(): boolean {
  const { proto } = useBranding();
  return (
    proto.applyScope === "ask" ||
    (proto.layoutTheme === "combined" && proto.combinedTheme === "current")
  );
}

/**
 * The sub-accounts NOT picked go back to the theme they had before this
 * edit: `own` (their own theme then) or the agency's theme then.
 */
export function keepThemeFor(
  s: BrandingState,
  picked: readonly string[],
  before: { agency: BrandingTheme; own: Record<string, BrandingTheme | undefined> },
): BrandingState {
  const overrides = { ...s.overrides };
  for (const a of ALL_ACCOUNTS) {
    if (picked.includes(a.id)) continue;
    overrides[a.id] = { ...overrides[a.id], theme: before.own[a.id] ?? before.agency };
  }
  return { ...s, overrides };
}

export function ThemeScopeHost() {
  const open = React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pending !== null,
    () => false,
  );
  return open ? <ThemeScopeModal /> : null;
}

/**
 * Every sub-account, ticked by default; untick to leave one out (Nov 24).
 * The bulk modal's search, header row, and checkbox. Only the list scrolls.
 */
export function SubAccountPicker({
  picked,
  onChange,
  className,
}: {
  picked: readonly string[];
  onChange: (ids: string[]) => void;
  className?: string;
}) {
  const [query, setQuery] = React.useState("");
  const total = ALL_ACCOUNTS.length;
  const q = query.trim().toLowerCase();
  const visible = q ? ALL_ACCOUNTS.filter((a) => a.name.toLowerCase().includes(q)) : ALL_ACCOUNTS;
  const visibleOn = visible.filter((a) => picked.includes(a.id)).length;
  const toggle = (id: string) =>
    onChange(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const setVisible = (on: boolean) => {
    const ids = visible.map((a) => a.id);
    onChange(on ? [...new Set([...picked, ...ids])] : picked.filter((id) => !ids.includes(id)));
  };
  return (
    <div className={cn("flex min-h-0 flex-col gap-[12px]", className)}>
      <label className="flex h-[36px] shrink-0 items-center gap-[8px] rounded-[6px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sub-accounts"
          aria-label="Search sub-accounts"
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-heading placeholder:text-pg-faint focus:outline-none"
        />
      </label>
      <div className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="flex shrink-0 items-center gap-[10px] bg-pg px-[16px] py-[8px] shadow-[inset_0_-1px_0_0_var(--pg-row-border)]">
          <span className="min-w-0 flex-1 truncate text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
            {q ? `${visible.length} match${visible.length === 1 ? "" : "es"}` : `All sub-accounts · ${total}`}
          </span>
          <Box
            checked={visible.length > 0 && visibleOn === visible.length}
            mixed={visibleOn > 0 && visibleOn < visible.length}
            onClick={() => setVisible(visibleOn !== visible.length)}
            label="Select all shown"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {visible.length === 0 ? (
            <p className="px-[16px] py-[18px] text-[13px] leading-[18px] text-pg-muted">
              No sub-accounts match “{query.trim()}”.
            </p>
          ) : null}
          {visible.map((a) => (
            <div
              key={a.id}
              role="button"
              tabIndex={-1}
              onClick={() => toggle(a.id)}
              className="flex w-full cursor-pointer items-center gap-[10px] px-[16px] py-[9px] text-left shadow-[inset_0_-1px_0_0_var(--pg-row-border)] last:shadow-none hover:bg-pg"
            >
              <AccountLogo logo={a.logo} {...(a.logoSrc ? { src: a.logoSrc } : {})} size={20} radius={999} />
              <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-heading">{a.name}</span>
              <Box checked={picked.includes(a.id)} onClick={() => toggle(a.id)} label={a.name} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** What the apply button says for a selection. */
export function scopeApplyLabel(n: number): string {
  if (n === ALL_ACCOUNTS.length) return "Apply to all sub-accounts";
  if (n === 0) return "Apply to agency only";
  return `Apply to ${n.toLocaleString("en-US")} sub-account${n === 1 ? "" : "s"}`;
}

/** A selection as a scope: everyone ticked is "all". */
export function scopeOf(picked: readonly string[]): ThemeScope {
  return picked.length === ALL_ACCOUNTS.length ? "all" : [...picked];
}

export const ALL_SUB_ACCOUNT_IDS: readonly string[] = ALL_ACCOUNTS.map((a) => a.id);

function ThemeScopeModal() {
  const { effective } = useTheme();
  const [picked, setPicked] = React.useState<string[]>(() => [...ALL_SUB_ACCOUNT_IDS]);
  const total = ALL_ACCOUNTS.length;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      answer(null);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[110] flex items-center justify-center p-[16px] font-sans">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={() => answer(null)}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Apply theme to"
        style={{ width: 520, height: "min(600px, calc(100dvh - 32px))" }}
        className="motion-panel-in relative flex max-w-full flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <header className="flex shrink-0 items-start gap-[10px] px-[16px] pt-[12px] pb-[4px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">Apply theme to</h2>
            <p className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
              <Building2 size={14} aria-hidden="true" className="shrink-0" />
              Your agency always gets it. Untick sub-accounts to keep their current theme.
            </p>
          </div>
          <button
            type="button"
            onClick={() => answer(null)}
            aria-label="Close"
            className="motion-tap -mt-[2px] flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-[16px] pt-[12px] pb-[16px]">
          <SubAccountPicker picked={picked} onChange={setPicked} className="flex-1" />
        </div>

        <footer className="flex shrink-0 items-center gap-[12px] px-[16px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-muted">
            {picked.length} of {total} selected
          </span>
          <SecondaryButton onClick={() => answer(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={() => answer(scopeOf(picked))}>{scopeApplyLabel(picked.length)}</PrimaryButton>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
