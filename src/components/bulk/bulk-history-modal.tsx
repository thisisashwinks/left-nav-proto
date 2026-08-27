"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Clock, LayoutTemplate, SlidersHorizontal, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { FEATURE_ACTION_LABELS, featureLabel } from "./bulk-config";
import { plural, useBulkActions } from "./bulk-provider";

/**
 * Bulk action history.
 *
 * The other half of what makes a bulk action safe. The modal states the blast
 * radius before it commits; this is where it can be checked afterwards — which
 * accounts, which features, which way. Production files it as its own screen;
 * here it is a modal off the success card and off the table header, because the
 * question it answers ("what did that just do?") is always asked from one of
 * those two places.
 */
export function BulkHistoryModal({ onClose }: { onClose: () => void }) {
  const { effective } = useTheme();
  const { history, clearHistory } = useBulkActions();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[95] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bulk action history"
        className="motion-panel-in relative flex max-h-[calc(100dvh-32px)] w-[620px] max-w-full flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <header className="flex shrink-0 items-center gap-[12px] px-[16px] pt-[12px] pb-[10px]">
          <h2 className="min-w-0 flex-1 text-[16px] leading-[22px] font-semibold text-pg-heading">
            Bulk action history
          </h2>
          {history.length > 0 ? (
            <button
              type="button"
              onClick={clearHistory}
              className="motion-tap shrink-0 rounded-[6px] px-[8px] py-[4px] text-[13px] leading-[18px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[16px] pb-[16px]">
          {history.length === 0 ? (
            <p className="py-[24px] text-center text-[14px] leading-[20px] text-pg-muted">
              Nothing yet. Select sub-accounts and run a bulk action.
            </p>
          ) : null}

          {history.map((run) => {
            const Icon = run.path === "template" ? LayoutTemplate : SlidersHorizontal;
            return (
              <article
                key={run.id}
                className="flex flex-col gap-[6px] rounded-[8px] bg-pg px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
              >
                <div className="flex items-center gap-[8px]">
                  <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-pg-heading">
                    {run.title}
                  </span>
                  <span
                    className={
                      run.status === "queued"
                        ? "flex shrink-0 items-center gap-[4px] rounded-[5px] bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] px-[6px] py-[3px] text-[11px] leading-none font-semibold text-brand"
                        : "shrink-0 rounded-[5px] bg-[color-mix(in_oklab,#16a34a_12%,transparent)] px-[6px] py-[3px] text-[11px] leading-none font-semibold text-[#15803d]"
                    }
                  >
                    {run.status === "queued" ? (
                      <>
                        <Clock size={11} aria-hidden="true" />
                        Queued
                      </>
                    ) : (
                      "Applied"
                    )}
                  </span>
                </div>

                <p className="text-[13px] leading-[18px] text-pg-text">{run.detail}</p>

                {run.decisions.length > 0 ? (
                  <div className="flex flex-wrap gap-[4px]">
                    {run.decisions.map((d) => (
                      <span
                        key={d.featureId}
                        className="rounded-[5px] bg-pg-surface px-[6px] py-[3px] text-[12px] leading-none text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
                      >
                        {featureLabel(d.featureId)} ·{" "}
                        <span className="text-pg-muted">
                          {d.action === "keep" ? "Mixed" : FEATURE_ACTION_LABELS[d.action]}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="truncate text-[12px] leading-[16px] text-pg-faint">
                  {plural(run.accountIds.length, "sub-account")} ·{" "}
                  {run.accountNames.slice(0, 4).join(", ")}
                  {run.accountNames.length > 4
                    ? ` +${run.accountNames.length - 4} more`
                    : ""}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
