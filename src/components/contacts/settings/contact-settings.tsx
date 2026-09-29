"use client";

import * as React from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { OverflowMenu } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { useDetailViews, useObjectNames } from "./object-settings-store";
import { DetailsTab } from "./details-tab";
import { AssociationsTab } from "./associations-tab";
import { AddFieldsTab } from "./add-fields-tab";
import { DetailViewsTab } from "./detail-views-tab";
import { ViewBuilder } from "./view-builder";

type SettingsTab = "details" | "associations" | "add-fields" | "detail-view";

/**
 * Contact settings — the object's own settings, as a sub-screen of Contacts.
 *
 * The live product keeps these under Settings › Objects › Contacts; here they
 * open from the Contacts kebab, so the way back is the list you came from.
 * Four tabs, each its own file. The view builder replaces the whole screen,
 * tabs and all, the way it does in the product — it is a builder, not a tab.
 */
export function ContactSettingsPage({ onExit }: { onExit: () => void }) {
  const names = useObjectNames();
  const views = useDetailViews();
  const [tab, setTab] = React.useState<SettingsTab>("details");
  const [editing, setEditing] = React.useState<string | null>(null);
  const editingView = views.find((v) => v.id === editing) ?? null;

  useRecordCrumb(
    editingView
      ? { name: editingView.name, kind: "Detail view" }
      : { name: `${names.singular} settings`, kind: `${names.singular} settings` },
    onExit,
  );

  if (editingView) {
    return <ViewBuilder viewId={editingView.id} onExit={() => setEditing(null)} />;
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "associations", label: "Associations" },
    { id: "add-fields", label: `Customize fields for add ${names.singular}` },
    { id: "detail-view", label: `Customize ${names.singular.toLowerCase()} detail view` },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col px-[var(--page-inset)]">
      <div className="flex shrink-0 items-center gap-[12px] pt-[4px] pb-[12px]">
        <button
          type="button"
          aria-label={`Back to ${names.plural}`}
          onClick={onExit}
          className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-pg-heading motion-tap hover:bg-pg active:scale-90"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-[24px] leading-[32px] font-semibold text-pg-heading">
          {names.plural}
        </h1>
        <OverflowMenu
          items={[
            {
              label: "Add custom fields",
              icon: Plus,
              onClick: () => showToast("Custom fields live in Settings › Custom fields."),
            },
          ]}
        />
      </div>

      <div
        role="tablist"
        aria-label={`${names.singular} settings`}
        className="flex shrink-0 gap-[32px] overflow-x-auto border-b border-pg-head-border"
      >
        {tabs.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative shrink-0 pb-[10px] text-[14px] leading-[20px] whitespace-nowrap motion-tap",
                on ? "font-medium text-brand" : "text-pg-text hover:text-pg-heading",
              )}
            >
              {t.label}
              {on ? (
                <span className="absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full bg-brand" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="flex min-h-0 flex-1 flex-col overflow-auto pt-[16px] pb-[16px]">
        {tab === "details" ? <DetailsTab /> : null}
        {tab === "associations" ? <AssociationsTab /> : null}
        {tab === "add-fields" ? <AddFieldsTab /> : null}
        {tab === "detail-view" ? <DetailViewsTab onEditView={setEditing} /> : null}
      </div>
    </div>
  );
}
