"use client";

import * as React from "react";
import { ExternalLink, Plus, TriangleAlert } from "lucide-react";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import {
  GROUPING_BLURBS,
  GROUPING_LABELS,
  GROUPING_MODES,
  type GroupingMode,
} from "@/components/nav/grouping";
import { cn } from "@/lib/utils";
import { Card, Chip, SettingRow, Switch } from "./controls";

/**
 * Navigation: what the nav contains and how it is organised.
 *
 * Bound to the same store the nav renders from, so choosing a grouping mode
 * here rearranges the real nav on the left mid-click. Group-level rename,
 * icons and reordering stay in the nav itself (click a row while editing) —
 * one place to edit a thing, and it is the thing.
 */
export function NavigationSection() {
  const layout = useNavLayout();
  const { state, groups } = layout;

  return (
    <div className="flex flex-col gap-[14px]">
      <Card
        title="How the nav is organised"
        sub="Four views of one catalogue. Switching is lossless — nothing has to be re-filed."
      >
        <div className="grid grid-cols-2 gap-[10px] pt-[4px] xl:grid-cols-4">
          {GROUPING_MODES.map((mode) => (
            <ModeCard
              key={mode}
              mode={mode}
              selected={state.grouping === mode}
              onSelect={() => layout.setGrouping(mode)}
            />
          ))}
        </div>
      </Card>

      <Card
        title="Groups"
        sub="Rename, re-icon and reorder in the nav itself — click any group while edit mode is on. Changes land here as overrides."
        aside={
          <label className="flex shrink-0 items-center gap-[8px] text-[12px] font-medium text-pg-text">
            Edit in the nav
            <Switch on={state.editing} onToggle={() => layout.setEditing(!state.editing)} label="Edit mode" />
          </label>
        }
      >
        {groups.map((group, i) => (
          <SettingRow
            key={group.id}
            label={
              <span className="flex items-center gap-[8px]">
                <group.icon size={15} aria-hidden="true" className="text-pg-muted" />
                {group.label}
              </span>
            }
            desc={`${group.productIds.length} products${group.label === group.defaultLabel ? "" : ` · shipped as “${group.defaultLabel}”`}`}
            last={i === groups.length - 1}
          >
            {layout.isRenamed(group.id) ? (
              <>
                <Chip tone="overridden">Renamed</Chip>
                <button
                  type="button"
                  onClick={() => layout.resetLabel(group.id)}
                  className="motion-tap text-[12px] leading-none font-medium text-pg-muted hover:text-pg-heading"
                >
                  Reset
                </button>
              </>
            ) : (
              <Chip tone="inherit">Default</Chip>
            )}
          </SettingRow>
        ))}
      </Card>

      <Card
        title="Custom links"
        sub="A link must declare a name, destination and audience before it can be saved — the rule production never had."
        aside={
          <button
            type="button"
            className="motion-tap flex h-[30px] shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] text-[12.5px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
          >
            <Plus size={13} aria-hidden="true" />
            Add link
          </button>
        }
      >
        {(
          [
            ["Client portal", "portal.wpp-clients.com", "Everyone"],
            ["Support desk", "help.wpp.com", "Everyone"],
            ["Billing portal", "billing.wpp.com", "Admins only"],
          ] as const
        ).map(([name, url, who], i, arr) => (
          <SettingRow
            key={name}
            label={
              <span className="flex items-center gap-[8px]">
                <ExternalLink size={14} aria-hidden="true" className="text-pg-muted" />
                {name}
              </span>
            }
            desc={url}
            last={i === arr.length - 1}
          >
            <Chip tone="inherit">{who}</Chip>
          </SettingRow>
        ))}
        <div className="mt-[12px] flex items-center gap-[9px] rounded-[9px] bg-[color-mix(in_oklab,#f59e0b_10%,var(--pg-surface))] px-[12px] py-[9px]">
          <TriangleAlert size={14} aria-hidden="true" className="shrink-0 text-[#8a5a00]" />
          <p className="flex-1 text-[12px] leading-[16px] text-[#8a5a00]">
            2 links migrated from the old menu editor have no destination group. They show at the bottom of the nav until filed.
          </p>
          <button type="button" className="motion-tap shrink-0 text-[12px] leading-none font-semibold text-[#8a5a00] hover:underline">
            Review
          </button>
        </div>
      </Card>
    </div>
  );
}

function ModeCard({
  mode,
  selected,
  onSelect,
}: {
  mode: GroupingMode;
  selected: boolean;
  onSelect: () => void;
}) {
  const lines = mode === "flat" ? 6 : 3;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "motion-tap flex flex-col gap-[8px] rounded-[10px] p-[11px] text-left",
        selected
          ? "bg-[color-mix(in_oklab,var(--brand)_6%,var(--pg-surface))] shadow-[inset_0_0_0_1.5px_var(--brand)]"
          : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      <span className="flex h-[52px] w-full flex-col justify-center gap-[4px] overflow-hidden rounded-[7px] bg-pg-bg px-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-[4px] shrink-0 rounded-full",
              i % 3 === 0 && lines < 6 ? "w-full bg-[color-mix(in_oklab,var(--brand)_35%,var(--pg-border))]" : "w-2/3 bg-pg-border",
            )}
          />
        ))}
      </span>
      <span className="text-[12.5px] leading-[16px] font-semibold text-pg-heading">
        {GROUPING_LABELS[mode]}
      </span>
      <span className="text-[11px] leading-[15px] text-pg-muted">
        {GROUPING_BLURBS[mode]}
      </span>
    </button>
  );
}
