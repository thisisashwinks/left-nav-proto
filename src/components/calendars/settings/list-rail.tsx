"use client";

import * as React from "react";
import {
  EllipsisVertical,
  Forward,
  Hexagon,
  Move,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarGroup } from "./cal-settings-store";
import { AnchoredMenu } from "./list-menu";

/** "All" | "Not grouped" | a group id — what the rail has selected. */
export type RailScope = "all" | "ungrouped" | (string & {});

export type GroupAction = "edit" | "share" | "rearrange" | "toggle-active" | "delete";

/**
 * The live product pads single digits ("01") but leaves an empty count as a
 * bare "0" — kept, since the rail is read against the screenshot.
 */
export const padCount = (n: number) => (n === 0 ? "0" : n < 10 ? `0${n}` : String(n));

/**
 * The group rail: All calendars, Not grouped, each group, New group.
 *
 * No card around it — on the live screen the rail sits on the page plane and
 * only the table gets a surface, which is what makes the table read as the
 * thing the rail filters.
 */
export function ListRail({
  groups,
  scope,
  counts,
  onScope,
  onGroupAction,
  onNewGroup,
}: {
  groups: CalendarGroup[];
  scope: RailScope;
  counts: { all: number; ungrouped: number; byGroup: Record<string, number> };
  onScope: (s: RailScope) => void;
  onGroupAction: (action: GroupAction, groupId: string) => void;
  onNewGroup: () => void;
}) {
  const [menu, setMenu] = React.useState<{ id: string; rect: DOMRect } | null>(null);
  const closeMenu = React.useCallback(() => setMenu(null), []);
  const menuGroup = menu ? groups.find((g) => g.id === menu.id) : undefined;

  return (
    <aside aria-label="Calendar groups" className="flex w-[232px] shrink-0 flex-col">
      <button
        type="button"
        aria-pressed={scope === "all"}
        onClick={() => onScope("all")}
        className={cn(
          "motion-tap flex h-[38px] w-full items-center rounded-[8px] px-[10px] text-left text-[14px] leading-[20px]",
          scope === "all"
            ? "bg-brand-soft font-medium text-brand"
            : "text-pg-text hover:bg-pg",
        )}
      >
        All calendars ({padCount(counts.all)})
      </button>

      <div aria-hidden="true" className="mt-[10px] h-px bg-[var(--pg-border)]" />

      <h3 className="mt-[16px] mb-[6px] px-[6px] text-[16px] leading-[22px] font-medium text-pg-heading">
        Groups
      </h3>

      <ul className="flex flex-col gap-[2px]">
        <li>
          <RailRow
            name="Not grouped"
            count={counts.ungrouped}
            selected={scope === "ungrouped"}
            onSelect={() => onScope("ungrouped")}
          />
        </li>
        {groups.map((g) => (
          <li key={g.id}>
            <RailRow
              name={g.name}
              count={counts.byGroup[g.id] ?? 0}
              inactive={!g.active}
              selected={scope === g.id}
              menuOpen={menu?.id === g.id}
              onSelect={() => onScope(g.id)}
              onMenu={(rect) => setMenu(menu?.id === g.id ? null : { id: g.id, rect })}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onNewGroup}
        className="motion-tap mt-[10px] flex h-[36px] w-full items-center justify-center gap-[6px] rounded-[8px] bg-brand-soft text-[14px] leading-[20px] font-medium text-brand hover:brightness-95"
      >
        <Plus size={15} aria-hidden="true" />
        New group
      </button>

      {menu && menuGroup ? (
        <AnchoredMenu
          anchor={menu.rect}
          width={252}
          side="top"
          align="end"
          label={`Actions for ${menuGroup.name}`}
          onClose={closeMenu}
          items={[
            { label: "Edit group", icon: Pencil, onSelect: () => onGroupAction("edit", menuGroup.id) },
            { label: "Share group", icon: Forward, onSelect: () => onGroupAction("share", menuGroup.id) },
            {
              label: "Rearrange calendars",
              icon: Move,
              onSelect: () => onGroupAction("rearrange", menuGroup.id),
            },
            {
              label: menuGroup.active
                ? "Deactivate all calendars in group"
                : "Activate all calendars in group",
              icon: Hexagon,
              onSelect: () => onGroupAction("toggle-active", menuGroup.id),
            },
            {
              label: "Delete",
              icon: Trash2,
              danger: true,
              onSelect: () => onGroupAction("delete", menuGroup.id),
            },
          ]}
        />
      ) : null}
    </aside>
  );
}

function RailRow({
  name,
  count,
  selected,
  inactive,
  menuOpen,
  onSelect,
  onMenu,
}: {
  name: string;
  count: number;
  selected: boolean;
  inactive?: boolean;
  menuOpen?: boolean;
  onSelect: () => void;
  onMenu?: (rect: DOMRect) => void;
}) {
  return (
    <div
      className={cn(
        "flex h-[38px] items-center gap-[4px] rounded-[8px] pr-[4px]",
        selected ? "bg-brand-soft" : "hover:bg-pg",
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="flex h-full min-w-0 flex-1 items-center gap-[8px] pl-[6px] text-left"
      >
        <span
          className={cn(
            "truncate text-[14px] leading-[20px]",
            selected ? "font-medium text-brand" : inactive ? "text-pg-faint" : "text-pg-text",
          )}
        >
          {name}
        </span>
        <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--pg-border)_75%,transparent)] px-[5px] text-[10.5px] leading-none font-medium text-pg-muted tabular-nums">
          {padCount(count)}
        </span>
        {inactive ? (
          <span className="shrink-0 text-[12px] leading-[16px] text-pg-faint">Inactive</span>
        ) : null}
      </button>
      {onMenu ? (
        <button
          type="button"
          aria-label={`Actions for ${name}`}
          title="Group actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => onMenu(e.currentTarget.getBoundingClientRect())}
          className={cn(
            "motion-tap flex size-[30px] shrink-0 items-center justify-center rounded-full text-pg-text-strong hover:bg-[color-mix(in_srgb,var(--pg-border)_60%,transparent)]",
            menuOpen && "bg-[color-mix(in_srgb,var(--pg-border)_60%,transparent)]",
          )}
        >
          <EllipsisVertical size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
