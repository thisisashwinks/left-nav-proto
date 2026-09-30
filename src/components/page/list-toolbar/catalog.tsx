"use client";

import * as React from "react";
import { Inbox, Star, User } from "lucide-react";
import { LIST_TOOLBARS, LIST_TOOLBAR_LABELS } from "@/design/theme";
import type { ListToolbarModel } from "./types";
import { ListToolbarVariantView } from "./variants";

/** A fully loaded model with local state — every slice present. */
function useDemoModel(): ListToolbarModel {
  const [view, setView] = React.useState("open");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string[]>([]);
  const [owner, setOwner] = React.useState<string[]>([]);
  const [advanced, setAdvanced] = React.useState<{ id: string; label: string }[]>([]);
  const [sort, setSort] = React.useState<{ field: string; dir: "asc" | "desc" } | null>(null);
  const [columns, setColumns] = React.useState([
    { id: "name", label: "Opportunity name", visible: true, locked: true },
    { id: "stage", label: "Stage", visible: true },
    { id: "value", label: "Value", visible: true },
    { id: "owner", label: "Owner", visible: true },
    { id: "source", label: "Source", visible: false },
    { id: "updated", label: "Last updated", visible: true },
  ]);

  return {
    views: {
      items: [
        { id: "open", label: "Open opportunities", count: 128, icon: Inbox },
        { id: "mine", label: "Assigned to me", count: 24, icon: User },
        { id: "won", label: "Won this quarter", count: 1250 },
        { id: "starred", label: "Starred", count: 6, icon: Star },
        { id: "stale", label: "No activity in 30 days", count: 41 },
        { id: "lost", label: "Lost", count: 312 },
        { id: "web", label: "Mobile app web form submissions", count: 9 },
      ],
      activeId: view,
      onSelect: setView,
      onCreate: () => {},
      noun: "view",
    },
    search: { value: query, onChange: setQuery, placeholder: "Search opportunities" },
    quickFilters: [
      {
        id: "status",
        label: "Status",
        options: [
          { value: "open", label: "Open" },
          { value: "won", label: "Won" },
          { value: "lost", label: "Lost" },
          { value: "abandoned", label: "Abandoned" },
        ],
        value: status,
        multiple: true,
        onChange: setStatus,
      },
      {
        id: "owner",
        label: "Owner",
        options: ["Ashwin K", "Priya S", "Marcus L", "Dana W", "Jordan P", "Lee C", "Sam R", "Taylor B", "Unassigned"].map(
          (n) => ({ value: n.toLowerCase(), label: n }),
        ),
        value: owner,
        onChange: setOwner,
      },
    ],
    advanced: {
      count: advanced.length,
      onOpen: () =>
        setAdvanced((a) => [...a, { id: String(a.length + 1), label: a.length ? "Tag is VIP" : "Value > $1,000" }]),
      onClear: () => setAdvanced([]),
      chips: advanced.map((c) => ({ ...c, onRemove: () => setAdvanced((a) => a.filter((x) => x.id !== c.id)) })),
    },
    sort: {
      fields: [
        { value: "name", label: "Opportunity name" },
        { value: "value", label: "Value" },
        { value: "updated", label: "Last updated" },
      ],
      value: sort,
      onChange: setSort,
    },
    columns: { items: columns, onChange: setColumns },
    resultCount: { value: 128, noun: "opportunities" },
  };
}

function Stub() {
  return (
    <div className="flex h-[120px] items-center justify-center rounded-[8px] bg-pg text-[13px] leading-[18px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
      List content
    </div>
  );
}

/**
 * All six toolbars stacked, each on its own live model — for looking at the
 * variants side by side without switching the prototype control.
 */
export function ListToolbarPreviewCatalog() {
  const model = useDemoModel();
  return (
    <div className="flex flex-col gap-[24px]">
      {LIST_TOOLBARS.filter((v) => v !== "page").map((variant) => (
        <section
          key={variant}
          className="flex flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[16px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]"
        >
          <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">{LIST_TOOLBAR_LABELS[variant]}</h3>
          <div className={variant === "side-views" ? "flex h-[320px] flex-col" : "flex flex-col gap-[12px]"}>
            <ListToolbarVariantView variant={variant} model={model}>
              <Stub />
            </ListToolbarVariantView>
          </div>
        </section>
      ))}
    </div>
  );
}
