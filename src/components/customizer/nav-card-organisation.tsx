"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import {
  GROUPING_BLURBS,
  GROUPING_LABELS,
  GROUPING_MODES,
  isGroupRenamed,
  isIconOverridden,
  permissionsFor,
  resolveGroups,
  seedCustomGroups,
  type GroupingMode,
  type NavLayoutState,
  type ResolvedGroup,
} from "@/components/nav/grouping";
import { nameForIcon } from "@/components/nav/icon-catalogue";
import { IconPicker, useIconPicker } from "@/components/nav/icon-picker";
import { InlineRename } from "@/components/nav/inline-rename";
import { LABEL_MAX, useNavLayout } from "@/components/nav/nav-layout-provider";
import { cn } from "@/lib/utils";
import { Card, Chip, SettingRow, Switch } from "./controls";

/**
 * How the nav is organised, and what the groups are called.
 *
 * Bound to the edited account's layout profile — not the session nav — so
 * customizing one client never rearranges another. When that account is also
 * the active session, updateProfile writes the live store and the real nav
 * moves with it.
 */
export function NavOrganisationCard({ account }: { account: Account }) {
  const layout = useNavLayout();
  const state = layout.profileFor(account.id);

  return (
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
            onSelect={() =>
              layout.updateProfile(account.id, (s) =>
                s.grouping === mode
                  ? s
                  : {
                      ...s,
                      grouping: mode,
                      customGroups:
                        mode === "custom" ? seedCustomGroups(s) : s.customGroups,
                    },
              )
            }
          />
        ))}
      </div>
    </Card>
  );
}

/**
 * Group rename and icons edit in this list; reorder still happens in the nav
 * itself while edit mode is on.
 */
export function NavGroupsCard({ account }: { account: Account }) {
  const layout = useNavLayout();
  const state = layout.profileFor(account.id);
  const groups = resolveGroups(state);
  const can = permissionsFor(state.role);
  const picker = useIconPicker();
  const patch = (recipe: (s: NavLayoutState) => NavLayoutState) =>
    layout.updateProfile(account.id, recipe);

  const pickerTarget = picker.targetId;
  const pickerProps =
    pickerTarget && picker.anchor
      ? {
          anchor: picker.anchor,
          selected: nameForIcon(
            groups.find((g) => g.id === pickerTarget)?.icon,
          ),
          onPick: (iconName: string) => {
            patch((s) =>
              s.icons[pickerTarget] === iconName
                ? s
                : { ...s, icons: { ...s.icons, [pickerTarget]: iconName } },
            );
          },
          ...(isIconOverridden(state, pickerTarget)
            ? {
                onReset: () => {
                  patch((s) => {
                    if (!(pickerTarget in s.icons)) return s;
                    const icons = { ...s.icons };
                    delete icons[pickerTarget];
                    return { ...s, icons };
                  });
                },
              }
            : {}),
          onClose: picker.close,
        }
      : null;

  return (
    <>
      <Card
        title="Groups"
        sub="Rename or change an icon here. Turn on Edit in the nav to reorder groups in the live rail."
        aside={
          <label className="flex shrink-0 items-center gap-[8px] text-[12px] font-medium text-pg-text">
            Edit in the nav
            <Switch
              on={state.editing}
              onToggle={() => patch((s) => ({ ...s, editing: !s.editing }))}
              label="Edit mode"
            />
          </label>
        }
      >
        {groups.map((group, i) => (
          <GroupOverrideRow
            key={group.id}
            group={group}
            state={state}
            canRegroup={can.regroup}
            last={i === groups.length - 1}
            onRename={(next) => {
              const trimmed = next.trim().slice(0, LABEL_MAX);
              if (!trimmed) return;
              patch((s) => {
                if (s.customGroups.some((g) => g.id === group.id)) {
                  return {
                    ...s,
                    customGroups: s.customGroups.map((g) =>
                      g.id === group.id ? { ...g, label: trimmed } : g,
                    ),
                  };
                }
                const scope =
                  s.labelScope === "agency" &&
                  permissionsFor(s.role).writeAgencyScope
                    ? "agency"
                    : "account";
                const key =
                  scope === "agency" ? "agencyLabels" : "accountLabels";
                if (s[key][group.id] === trimmed) return s;
                return { ...s, [key]: { ...s[key], [group.id]: trimmed } };
              });
            }}
            onResetLabel={() =>
              patch((s) => {
                const accountLabels = { ...s.accountLabels };
                delete accountLabels[group.id];
                const agencyLabels = { ...s.agencyLabels };
                if (permissionsFor(s.role).writeAgencyScope) {
                  delete agencyLabels[group.id];
                }
                return { ...s, accountLabels, agencyLabels };
              })
            }
            onPickIcon={(el) => picker.open(group.id, el)}
          />
        ))}
      </Card>

      {pickerProps ? <IconPicker {...pickerProps} /> : null}
    </>
  );
}

function GroupOverrideRow({
  group,
  state,
  canRegroup,
  last,
  onRename,
  onResetLabel,
  onPickIcon,
}: {
  group: ResolvedGroup;
  state: NavLayoutState;
  canRegroup: boolean;
  last: boolean;
  onRename: (next: string) => void;
  onResetLabel: () => void;
  onPickIcon: (trigger: HTMLElement) => void;
}) {
  const [renaming, setRenaming] = React.useState(false);
  const renamed = isGroupRenamed(state, group.id);
  const Icon = group.icon;

  return (
    <SettingRow
      label={
        <span className="group/row flex items-center gap-[8px]">
          {canRegroup ? (
            <button
              type="button"
              aria-label={`Change the ${group.label} icon`}
              title="Change icon"
              onClick={(e) => onPickIcon(e.currentTarget)}
              className="motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted outline-[1px] outline-offset-0 outline-transparent hover:bg-pg-bg hover:text-pg-heading hover:outline-dashed hover:outline-[var(--pg-border)]"
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          ) : (
            <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
          )}
          {renaming ? (
            <InlineRename
              value={group.label}
              ariaLabel={`Rename ${group.label}`}
              onCommit={(next) => {
                onRename(next);
                setRenaming(false);
              }}
              onCancel={() => setRenaming(false)}
              className="bg-pg-bg text-[13px] leading-[18px] font-medium text-pg-heading"
            />
          ) : (
            <>
              <span className="min-w-0 truncate">{group.label}</span>
              <button
                type="button"
                aria-label={`Rename ${group.label}`}
                title="Rename"
                onClick={() => setRenaming(true)}
                className="motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[5px] text-pg-muted opacity-0 hover:bg-pg-bg hover:text-pg-heading group-hover/row:opacity-100 focus-visible:opacity-100"
              >
                <Pencil size={11} aria-hidden="true" />
              </button>
            </>
          )}
        </span>
      }
      desc={`${group.productIds.length} products${
        group.label === group.defaultLabel
          ? ""
          : ` · shipped as “${group.defaultLabel}”`
      }`}
      last={last}
    >
      {renamed ? (
        <>
          <Chip tone="overridden">Renamed</Chip>
          <button
            type="button"
            onClick={onResetLabel}
            className="motion-tap text-[12px] leading-none font-medium text-pg-muted hover:text-pg-heading"
          >
            Reset
          </button>
        </>
      ) : (
        <Chip tone="inherit">Default</Chip>
      )}
    </SettingRow>
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
