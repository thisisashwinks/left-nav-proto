"use client";

import * as React from "react";
import { FolderPlus, KeyRound, Plus, Search } from "lucide-react";
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  PrimaryButton,
} from "@/components/page/page-header";
import { Toaster } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  ALL_ICON,
  OBJECTS,
  useCustomFields,
  type CustomField,
  type ObjectId,
} from "./custom-fields-data";
import { FieldsTab } from "./fields-tab";
import { FoldersTab } from "./folders-tab";
import { FolderModal } from "./folder-modals";
import { SearchableFieldsModal, UniqueFieldsModal } from "./object-field-modals";
import { FieldDrawer } from "./field-drawer";

export type ObjectScope = ObjectId | "all";

type Overlay =
  | { kind: "create-field" }
  | { kind: "edit-field"; field: CustomField }
  | { kind: "create-folder" }
  | { kind: "searchable" }
  | { kind: "unique" }
  | null;

/**
 * CRM ▸ Custom fields — every object's fields and folders on one page.
 *
 * The object cards are the page's scope, not a filter: they re-cut both
 * tables and seed the object in every create flow, so picking Opportunity
 * then Create field starts an Opportunity field. The two tables own their
 * own filters, columns and paging; this shell owns the scope, the tab and
 * the overlays, because the header's buttons open them from either tab.
 */
export function CustomFieldsPage({ initialObject }: { initialObject?: string | null }) {
  const { effective } = useTheme();
  const { fields, folders } = useCustomFields();
  const [scope, setScope] = React.useState<ObjectScope>(
    OBJECTS.some((o) => o.id === initialObject) ? (initialObject as ObjectId) : "all",
  );
  const [tab, setTab] = React.useState<"fields" | "folders">("fields");
  const [overlay, setOverlay] = React.useState<Overlay>(null);
  const close = React.useCallback(() => setOverlay(null), []);

  const inScope = <T extends { object: ObjectId }>(rows: T[]) =>
    scope === "all" ? rows : rows.filter((r) => r.object === scope);
  const fieldCount = inScope(fields).length;
  const folderCount = inScope(folders).length;
  const defaultObject = scope === "all" ? undefined : scope;

  const cards: { id: ObjectScope; label: string; icon: typeof ALL_ICON; count: number }[] = [
    { id: "all", label: "All", icon: ALL_ICON, count: fields.length },
    ...OBJECTS.map((o) => ({
      id: o.id as ObjectScope,
      label: o.label,
      icon: o.icon,
      count: fields.filter((f) => f.object === o.id).length,
    })),
  ];

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Custom fields"
        description="Create and manage custom fields for your objects to capture and organize data"
      />

      <div role="tablist" aria-label="Object" className="-mx-[2px] flex shrink-0 gap-[10px] overflow-x-auto px-[2px] py-[2px]">
        {cards.map((c) => {
          const on = c.id === scope;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setScope(c.id)}
              className={cn(
                "flex h-[48px] shrink-0 items-center gap-[10px] rounded-[10px] bg-pg-surface pr-[12px] pl-[14px] motion-tap",
                on
                  ? "shadow-[inset_0_0_0_1.5px_var(--brand)] bg-[color-mix(in_oklab,var(--brand)_5%,var(--pg-surface))]"
                  : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
              )}
            >
              <Icon size={18} aria-hidden="true" className={on ? "text-brand" : "text-pg-muted"} />
              <span className={cn("text-[14px] leading-[20px] font-medium", on ? "text-brand" : "text-pg-text-strong")}>
                {c.label}
              </span>
              <CountPill on={on}>{c.count.toLocaleString("en-US")}</CountPill>
            </button>
          );
        })}
      </div>

      <section className="flex min-h-0 flex-1 flex-col rounded-[12px] bg-pg-surface p-[16px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="flex shrink-0 flex-wrap items-center gap-[10px] pb-[12px]">
          <div role="tablist" aria-label="Show" className="flex h-[36px] overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            {(
              [
                ["fields", "Fields", fieldCount],
                ["folders", "Folders", folderCount],
              ] as const
            ).map(([id, label, n], i) => {
              const on = id === tab;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-[8px] px-[12px] text-[14px] leading-[20px] font-medium motion-tap",
                    i > 0 && "shadow-[inset_1px_0_0_0_var(--pg-border)]",
                    on
                      ? "bg-[color-mix(in_oklab,var(--brand)_8%,var(--pg-surface))] text-brand"
                      : "text-pg-text hover:bg-pg",
                  )}
                >
                  {label}
                  <CountPill on={on}>{n.toLocaleString("en-US")}</CountPill>
                </button>
              );
            })}
          </div>
          <span className="flex-1" />
          <OutlineButton className="h-[36px] text-[14px]" onClick={() => setOverlay({ kind: "create-folder" })}>
            <FolderPlus size={16} aria-hidden="true" />
            Create folder
          </OutlineButton>
          <PrimaryButton className="h-[36px] text-[14px]" onClick={() => setOverlay({ kind: "create-field" })}>
            <Plus size={16} aria-hidden="true" />
            Create field
          </PrimaryButton>
          <OverflowMenu
            items={[
              { label: "Edit searchable fields", icon: Search, onClick: () => setOverlay({ kind: "searchable" }) },
              { label: "Edit unique fields", icon: KeyRound, onClick: () => setOverlay({ kind: "unique" }) },
            ]}
          />
        </div>

        {tab === "fields" ? (
          <FieldsTab
            key={scope}
            scope={scope}
            onEditField={(field) => setOverlay({ kind: "edit-field", field })}
          />
        ) : (
          <FoldersTab key={scope} scope={scope} />
        )}
      </section>

      {overlay?.kind === "create-field" ? (
        <FieldDrawer defaultObject={defaultObject} onClose={close} />
      ) : null}
      {overlay?.kind === "edit-field" ? <FieldDrawer field={overlay.field} onClose={close} /> : null}
      {overlay?.kind === "create-folder" ? (
        <FolderModal mode="create" defaultObject={defaultObject} onClose={close} />
      ) : null}
      {overlay?.kind === "searchable" ? <SearchableFieldsModal onClose={close} /> : null}
      {overlay?.kind === "unique" ? <UniqueFieldsModal onClose={close} /> : null}

      <Toaster />
    </div>
  );
}

function CountPill({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-[6px] px-[6px] py-[1px] text-[13px] leading-[18px] font-medium",
        on ? "bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] text-brand" : "bg-pg text-pg-muted",
      )}
    >
      {children}
    </span>
  );
}
