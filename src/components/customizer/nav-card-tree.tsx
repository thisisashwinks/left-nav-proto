"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, FolderPlus, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import {
  customTreeFor,
  GROUPING_LABELS,
  groupIdForProduct,
  isGroupRenamed,
  nextGroupIdFor,
  isIconOverridden,
  permissionsFor,
  resolveGroups,
  UNGROUPED_ID,
  withGroupDeleted,
  withGroupMoved,
  withNewGroup,
  withProductFiled,
  withProductOrdered,
  type NavLayoutState,
  type ResolvedGroup,
} from "@/components/nav/grouping";
import { nameForIcon } from "@/components/nav/icon-catalogue";
import { IconPicker, useIconPicker } from "@/components/nav/icon-picker";
import { InlineRename } from "@/components/nav/inline-rename";
import { LABEL_MAX, useNavLayout } from "@/components/nav/nav-layout-provider";
import { cn } from "@/lib/utils";
import { Card, Chip } from "./controls";
import { AddProductsPanel, NudgeButtons, ProductRow } from "./nav-tree-parts";

/**
 * The tree: what the nav contains, group by group, and what sits outside them.
 *
 * The one card in this tab that edits structure rather than presentation, so it
 * carries the four verbs the old customizer had no answer for — move a product
 * between groups, add a group, delete one, and pull a product out of every group
 * so it draws as a plain top-level row.
 *
 * Structure is only editable in the custom tree. Product, Jobs and Flat are
 * views of what HighLevel ships, and rewriting them per account would leave the
 * account silently diverged with no way back — so those modes show the tree,
 * keep rename and icons live, and offer one button that seeds a custom copy of
 * exactly what is on screen. Nothing is lost, and the divergence is a decision
 * somebody made rather than a side effect of dragging a row.
 */
export function NavTreeCard({ account }: { account: Account }) {
  const layout = useNavLayout();
  const state = layout.profileFor(account.id);
  const groups = resolveGroups(state);
  const can = permissionsFor(state.role);
  const editable = state.grouping === "custom" && can.customise;
  const picker = useIconPicker();
  const [addingTo, setAddingTo] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  /**
   * The group whose rename field should open on mount. Set by Add group, so a
   * new shelf asks for its name instead of sitting there called "New group"
   * until somebody finds the pencil.
   */
  const [namingId, setNamingId] = React.useState<string | null>(null);

  const patch = (recipe: (s: NavLayoutState) => NavLayoutState) =>
    layout.updateProfile(account.id, recipe);

  /*
   * Flat has one pseudo-group holding everything, which the nav draws as bare
   * rows. Drawing it here as a shelf called "All products" would contradict the
   * mode's whole claim, so in flat the products are listed as what they are:
   * top-level rows, no shelf above them.
   */
  const flat = state.grouping === "flat";
  const shelves = flat ? [] : groups.filter((g) => g.id !== UNGROUPED_ID);
  const loose = flat
    ? (groups[0]?.productIds ?? [])
    : (groups.find((g) => g.id === UNGROUPED_ID)?.productIds ?? []);
  const destinations = shelves;

  const pickerTarget = picker.targetId;
  const pickerProps =
    pickerTarget && picker.anchor
      ? {
          anchor: picker.anchor,
          selected: nameForIcon(groups.find((g) => g.id === pickerTarget)?.icon),
          onPick: (iconName: string) =>
            patch((s) =>
              s.icons[pickerTarget] === iconName
                ? s
                : { ...s, icons: { ...s.icons, [pickerTarget]: iconName } },
            ),
          ...(isIconOverridden(state, pickerTarget)
            ? {
                onReset: () =>
                  patch((s) => {
                    if (!(pickerTarget in s.icons)) return s;
                    const icons = { ...s.icons };
                    delete icons[pickerTarget];
                    return { ...s, icons };
                  }),
              }
            : {}),
          onClose: picker.close,
        }
      : null;

  /** Renames a group: custom groups own their label, shipped ones get an override. */
  const rename = (group: ResolvedGroup, next: string) => {
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
        s.labelScope === "agency" && permissionsFor(s.role).writeAgencyScope
          ? "agencyLabels"
          : "accountLabels";
      if (s[scope][group.id] === trimmed) return s;
      return { ...s, [scope]: { ...s[scope], [group.id]: trimmed } };
    });
  };

  const resetLabel = (groupId: string) =>
    patch((s) => {
      const accountLabels = { ...s.accountLabels };
      delete accountLabels[groupId];
      const agencyLabels = { ...s.agencyLabels };
      if (permissionsFor(s.role).writeAgencyScope) delete agencyLabels[groupId];
      return { ...s, accountLabels, agencyLabels };
    });

  return (
    <>
      <Card
        title="Groups and rows"
        sub="What the nav contains, and how it is filed. Every change here shows in the nav on the left."
        aside={<Chip tone="inherit">{GROUPING_LABELS[state.grouping]} tree</Chip>}
      >
        {!editable ? (
          <div className="mb-[12px] flex items-center gap-[10px] rounded-[10px] bg-pg-bg px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <Wand2 size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
            <p className="min-w-0 flex-1 text-[12px] leading-[16px] text-pg-text">
              {state.grouping === "flat"
                ? "Flat has no groups — every product is its own row. "
                : `This is the ${GROUPING_LABELS[state.grouping]} tree that ships. Renaming and icons apply straight away. `}
              Moving products, adding groups and pulling rows out of groups need
              this account&apos;s own tree.
            </p>
            {can.customise ? (
              <button
                type="button"
                onClick={() => patch(customTreeFor)}
                className="motion-tap h-[30px] shrink-0 rounded-[8px] bg-brand px-[11px] text-[12.5px] leading-none font-medium text-brand-fg active:scale-[0.98]"
              >
                Customize this tree
              </button>
            ) : null}
          </div>
        ) : null}

        {shelves.map((group, i) => {
          const isOpen = !collapsed[group.id];
          const renamed = isGroupRenamed(state, group.id);
          const Icon = group.icon;
          return (
            <div
              key={group.id}
              className={cn(
                "py-[4px]",
                i === shelves.length - 1 ? "" : "shadow-[inset_0_-1px_0_0_var(--pg-border)]",
              )}
            >
              <div className="group/row flex items-center gap-[8px] py-[7px]">
                <button
                  type="button"
                  aria-label={isOpen ? `Collapse ${group.label}` : `Expand ${group.label}`}
                  aria-expanded={isOpen}
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [group.id]: isOpen }))
                  }
                  className="motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[5px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
                >
                  {isOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                </button>

                {can.regroup ? (
                  <button
                    type="button"
                    aria-label={`Change the ${group.label} icon`}
                    title="Change icon"
                    onClick={(e) => picker.open(group.id, e.currentTarget)}
                    className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted outline-[1px] outline-offset-0 outline-transparent hover:bg-pg-bg hover:text-pg-heading hover:outline-dashed hover:outline-[var(--pg-border)]"
                  >
                    <Icon size={15} aria-hidden="true" />
                  </button>
                ) : (
                  <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
                )}

                <GroupName
                  group={group}
                  canRename={can.renameForEveryone}
                  startNaming={group.id === namingId}
                  onRename={(next) => rename(group, next)}
                />

                <span className="shrink-0 text-[11.5px] leading-none text-pg-faint tabular-nums">
                  {group.productIds.length}
                </span>

                {renamed ? (
                  <>
                    <Chip tone="overridden">Renamed</Chip>
                    <button
                      type="button"
                      onClick={() => resetLabel(group.id)}
                      className="motion-tap text-[12px] leading-none font-medium text-pg-muted hover:text-pg-heading"
                    >
                      Reset
                    </button>
                  </>
                ) : null}

                {editable ? (
                  <>
                    <NudgeButtons
                      label={group.label}
                      onMove={(delta) => patch((s) => withGroupMoved(s, group.id, delta))}
                      canUp={i > 0}
                      canDown={i < shelves.length - 1}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAddingTo((current) => (current === group.id ? null : group.id))
                      }
                      className="motion-tap flex h-[28px] shrink-0 items-center gap-[5px] rounded-[7px] px-[9px] text-[12px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
                    >
                      <Plus size={12} aria-hidden="true" />
                      Add products
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${group.label}`}
                      title="Delete group — its products move to top level"
                      onClick={() => patch((s) => withGroupDeleted(s, group.id))}
                      className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted opacity-0 hover:bg-pg-bg hover:text-[#b42318] group-hover/row:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </div>

              {addingTo === group.id ? (
                <AddProductsPanel
                  state={state}
                  groups={destinations}
                  targetGroupId={group.id}
                  onAdd={(productId) =>
                    patch((s) => withProductFiled(s, productId, group.id))
                  }
                  onClose={() => setAddingTo(null)}
                />
              ) : null}

              {isOpen ? (
                <div className="pb-[4px]">
                  {group.productIds.length === 0 ? (
                    <p className="py-[7px] pl-[28px] text-[12.5px] leading-[17px] text-pg-muted">
                      Empty shelf. Add products, or delete the group — nothing is
                      filed here yet.
                    </p>
                  ) : null}
                  {group.productIds.map((productId, pi) => (
                    <ProductRow
                      key={productId}
                      state={state}
                      productId={productId}
                      groups={destinations}
                      currentGroupId={group.id}
                      editable={editable}
                      onMove={(target) =>
                        patch((s) => withProductFiled(s, productId, target))
                      }
                      nudge={{
                        onMove: (delta) =>
                          patch((s) => withProductOrdered(s, group.id, productId, delta)),
                        canUp: pi > 0,
                        canDown: pi < group.productIds.length - 1,
                      }}
                      last={pi === group.productIds.length - 1}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        {editable ? (
          <button
            type="button"
            onClick={() => {
              // The id is derivable before the group exists, which is what lets
              // the new row mount straight into its rename field.
              setNamingId(nextGroupIdFor(customTreeFor(state)));
              patch((s) => withNewGroup(s));
            }}
            className="motion-tap mt-[10px] flex h-[32px] items-center gap-[6px] rounded-[8px] px-[11px] text-[12.5px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
          >
            <FolderPlus size={13} aria-hidden="true" />
            Add group
          </button>
        ) : null}

      </Card>

      {pickerProps ? <IconPicker {...pickerProps} /> : null}

      <Card
        title="Top level rows"
        sub={
          flat
            ? "Flat files nothing, so every product this account is on is a row — that is the mode, not a leftover."
            : "Products no group claims. They draw as plain rows in the nav — no heading, no flyout, one click."
        }
      >
        {loose.length === 0 ? (
          <p className="py-[6px] text-[12.5px] leading-[17px] text-pg-muted">
            {editable
              ? "Nothing at top level. Set a product's group to “Top level” above to pull it out of every group."
              : "Every product this account is on is filed in a group."}
          </p>
        ) : (
          loose.map((productId, i) => (
            <ProductRow
              key={productId}
              state={state}
              productId={productId}
              groups={destinations}
              currentGroupId={groupIdForProduct(state, productId)}
              editable={editable}
              onMove={(target) => patch((s) => withProductFiled(s, productId, target))}
              last={i === loose.length - 1}
            />
          ))
        )}
        {loose.length > 0 ? (
          <p className="mt-[10px] text-[11.5px] leading-[16px] text-pg-faint">
            {loose.length} row{loose.length === 1 ? "" : "s"}, in catalogue order
            — a top-level row has no shelf to be first on.
          </p>
        ) : null}
      </Card>
    </>
  );
}

/** The group's name, with rename in place for whoever is allowed to. */
function GroupName({
  group,
  canRename,
  startNaming = false,
  onRename,
}: {
  group: ResolvedGroup;
  canRename: boolean;
  /** True for a group that was just created, which mounts asking for its name. */
  startNaming?: boolean;
  onRename: (next: string) => void;
}) {
  const [renaming, setRenaming] = React.useState(startNaming && canRename);

  if (renaming) {
    return (
      <InlineRename
        value={group.label}
        ariaLabel={`Rename ${group.label}`}
        onCommit={(next) => {
          onRename(next);
          setRenaming(false);
        }}
        onCancel={() => setRenaming(false)}
        className="min-w-0 flex-1 bg-pg-bg text-[13px] leading-[18px] font-medium text-pg-heading"
      />
    );
  }

  return (
    <span className="flex min-w-0 flex-1 items-center gap-[6px]">
      <span className="min-w-0 truncate text-[13px] leading-[18px] font-medium text-pg-heading">
        {group.label}
      </span>
      {canRename ? (
        <button
          type="button"
          aria-label={`Rename ${group.label}`}
          title="Rename"
          onClick={() => setRenaming(true)}
          className="motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[5px] text-pg-muted opacity-0 hover:bg-pg-bg hover:text-pg-heading group-hover/row:opacity-100 focus-visible:opacity-100"
        >
          <Pencil size={11} aria-hidden="true" />
        </button>
      ) : null}
      {group.label !== group.defaultLabel ? (
        <span className="shrink-0 truncate text-[11px] leading-[15px] text-pg-faint">
          ships as “{group.defaultLabel}”
        </span>
      ) : null}
    </span>
  );
}
