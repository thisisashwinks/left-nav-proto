"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SNAPSHOT_TEMPLATES,
  type SnapshotTab,
  type SnapshotTemplate,
} from "./flow-data";
import {
  AccountKindTabs,
  FlowButton,
  FlowDialog,
  PlusMark,
  type AccountKind,
} from "./parts";

/**
 * "Start from a snapshot" — the whole library, reached from Browse all
 * snapshots on the first screen.
 *
 * Only the templates tab has anything in it: an agency on this demo has saved
 * and been sent nothing yet, and the two empty tabs say so rather than
 * pretending to.
 */
export function SnapshotDialog({
  accountKind,
  onAccountKind,
  initialId,
  onBack,
  onClose,
  onContinue,
}: {
  accountKind: AccountKind;
  onAccountKind: (kind: AccountKind) => void;
  initialId?: string | null;
  onBack: () => void;
  onClose: () => void;
  onContinue: (template: SnapshotTemplate) => void;
}) {
  const [tab, setTab] = React.useState<SnapshotTab>("templates");
  const [query, setQuery] = React.useState("");
  // Caterer opens chosen, as the Figma frame does — it is the restaurant one.
  const [pickedId, setPickedId] = React.useState<string>(initialId ?? "caterer");

  const q = query.trim().toLowerCase();
  const visible =
    tab === "templates"
      ? SNAPSHOT_TEMPLATES.filter(
          (t) =>
            q === "" ||
            t.label.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q),
        )
      : [];
  const picked = SNAPSHOT_TEMPLATES.find((t) => t.id === pickedId) ?? null;

  const tabs: { id: SnapshotTab; label: string }[] = [
    { id: "templates", label: `Snapshot templates (123)` },
    { id: "mine", label: "My snapshots" },
    { id: "imported", label: "Imported snapshots" },
  ];

  return (
    <FlowDialog
      label="Start from a snapshot"
      onClose={onClose}
      header={
        <div className="flex flex-col items-start gap-[12px] px-[24px] py-[16px] md:flex-row">
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-[18px] leading-[28px] font-medium text-pg-heading">
              Start from a snapshot
            </h2>
            <p className="text-[16px] leading-[24px] text-pg-text-strong">
              Templates and saved copies of your accounts are called snapshots.
              Pick one you&rsquo;ve used, or browse them all.
            </p>
          </div>
          <AccountKindTabs value={accountKind} onChange={onAccountKind} />
        </div>
      }
      footer={
        <>
          <FlowButton size="sm" onClick={onBack}>
            Back
          </FlowButton>
          <span className="min-w-0 flex-1" />
          <FlowButton size="sm" onClick={onClose}>
            Cancel
          </FlowButton>
          <FlowButton
            size="sm"
            variant="primary"
            disabled={!picked}
            onClick={() => picked && onContinue(picked)}
          >
            Continue
          </FlowButton>
        </>
      }
    >
      <div className="flex flex-col gap-[24px] p-[24px]">
        <div className="mt-[16px] flex flex-col-reverse items-stretch justify-between gap-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)] md:flex-row md:items-end">
          <div role="tablist" aria-label="Snapshot library" className="flex gap-[18px] overflow-x-auto">
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
                    "motion-tap flex h-[40px] shrink-0 items-center px-[2px] text-[14px] leading-[20px] font-semibold whitespace-nowrap",
                    on
                      ? "text-brand shadow-[inset_0_-2px_0_0_var(--brand)]"
                      : "text-pg-text-strong hover:text-pg-heading",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <label className="mb-[8px] flex h-[36px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border-strong)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)] md:w-[260px]">
            <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search snapshots"
              aria-label="Search snapshots"
              className="min-w-0 flex-1 bg-transparent text-[14px] leading-none text-pg-heading placeholder:text-pg-faint focus:outline-none"
            />
          </label>
        </div>

        {visible.length > 0 ? (
          <div role="radiogroup" className="grid grid-cols-1 gap-[24px] sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((t) => (
              <SnapshotCard
                key={t.id}
                template={t}
                selected={t.id === pickedId}
                onSelect={() => setPickedId(t.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-[240px] flex-col items-center justify-center gap-[6px] text-center">
            <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
              {tab === "templates" ? "No snapshots match that search" : "Nothing here yet"}
            </p>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              {tab === "templates"
                ? "Try another name or industry."
                : tab === "mine"
                  ? "Snapshots you save from your own accounts show up here."
                  : "Snapshots another agency shares with you show up here."}
            </p>
          </div>
        )}
      </div>
    </FlowDialog>
  );
}

function SnapshotCard({
  template: t,
  selected,
  onSelect,
}: {
  template: SnapshotTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  const blank = t.id === "blank";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "motion-tap relative flex min-w-0 flex-col gap-[10px] rounded-[8px] bg-pg-surface p-[10px] text-left",
        selected
          ? "shadow-[inset_0_0_0_2px_var(--hr-primary-600),0_0_0_4px_var(--hr-primary-100)]"
          : "shadow-[inset_0_0_0_1px_var(--pg-border),0_1px_1px_rgba(16,24,40,0.05)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_1px_rgba(16,24,40,0.05)]",
      )}
    >
      <span className="flex">
        <span
          className={cn(
            "rounded-[4px] px-[8px] py-[2px] text-[12px] leading-[18px] font-medium",
            blank
              ? "bg-[#f2f4f7] text-[#344054] shadow-[inset_0_0_0_1px_var(--pg-border)]"
              : "bg-brand-soft text-[var(--hr-primary-700)] shadow-[inset_0_0_0_1px_var(--hr-primary-100)]",
          )}
        >
          {t.category}
        </span>
      </span>

      <span className="flex h-[152px] items-center justify-center">
        <span
          aria-hidden="true"
          className="relative shrink-0"
          style={{ width: t.boxWidth, height: t.boxHeight }}
        >
          {t.blob ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              src={t.blob.src}
              className="absolute max-w-none"
              style={{ left: t.blob.left, top: t.blob.top, width: t.blob.width, height: t.blob.height }}
            />
          ) : null}
          <span
            className="absolute overflow-hidden"
            style={{ left: t.art.left, top: t.art.top, width: t.art.width, height: t.art.height }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src={t.art.src}
              className={cn("absolute max-w-none", t.blob && !t.art.crop && "object-cover")}
              style={
                t.art.crop
                  ? { width: t.art.crop.width, height: t.art.crop.height, left: t.art.crop.left, top: t.art.crop.top }
                  : { inset: 0, width: "100%", height: "100%" }
              }
            />
          </span>
          {blank ? <PlusMark scale={1} left={68.27} top={53} /> : null}
        </span>
      </span>

      <span className="truncate text-center text-[14px] leading-[20px] font-medium text-pg-heading">
        {t.label}
      </span>

      {selected ? (
        <span className="absolute top-[10px] right-[10px] flex size-[22px] items-center justify-center rounded-[11px] bg-brand text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src="/create-account/card-check.svg" width={12} height={12} />
        </span>
      ) : null}
    </button>
  );
}
