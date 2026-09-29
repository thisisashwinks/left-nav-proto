"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { formatDuration, type CalendarDraft } from "./cal-settings-store";

/**
 * The Neo booking widget as a contact would see it, painted with the
 * draft's colours, button text and title / description / details switches,
 * so "Preview widget" shows unsaved changes without a publish.
 */

export const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
export const safeColor = (c: string, fallback: string) => (HEX.test(c.trim()) ? c.trim() : fallback);

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"];

export function WidgetPreviewModal({
  draft,
  onClose,
}: {
  draft: CalendarDraft;
  onClose: () => void;
}) {
  const primary = safeColor(draft.primaryColor, "#178af6");
  const background = safeColor(draft.backgroundColor, "#ffffff");
  // A fixed sample month keeps the preview about colours, not dates.
  const firstWeekday = 1;
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <Modal title="Widget preview" width={760} onClose={onClose}>
      <p className="text-[13px] leading-[18px] text-pg-muted">
        How the Neo widget looks with your current settings. Changes aren&apos;t published until
        you save.
      </p>
      <div
        className="mt-[4px] flex flex-col overflow-hidden rounded-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)] sm:flex-row"
        style={{ background, color: "#101828" }}
      >
        <div className="flex flex-col gap-[8px] border-b border-black/10 p-[20px] sm:w-[220px] sm:border-r sm:border-b-0">
          {draft.showTitle ? (
            <h3 className="text-[18px] leading-[26px] font-semibold">
              {draft.name.trim() || "Untitled calendar"}
            </h3>
          ) : null}
          {draft.showDescription ? (
            <p className="text-[13px] leading-[18px] opacity-70">
              {draft.description.trim() || "Your calendar description appears here."}
            </p>
          ) : null}
          {draft.showDetails ? (
            <div className="flex flex-col gap-[6px] pt-[4px] text-[13px] leading-[18px] opacity-80">
              <span className="flex items-center gap-[6px]">
                <Clock size={14} aria-hidden="true" />
                {formatDuration(draft)}
              </span>
              <span className="flex items-center gap-[6px]">
                <CalendarDays size={14} aria-hidden="true" />
                Tue, Sep 29, 2026
              </span>
            </div>
          ) : null}
          {!draft.showTitle && !draft.showDescription && !draft.showDetails ? (
            <p className="text-[13px] leading-[18px] opacity-60">
              Title, description, and details are hidden.
            </p>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-[12px] p-[20px]">
          <span className="text-[14px] leading-[20px] font-medium">Select date & time</span>
          <div className="flex items-center justify-center gap-[16px] text-[14px]">
            <ChevronLeft size={16} aria-hidden="true" className="opacity-50" />
            <span>September 2026</span>
            <ChevronRight size={16} aria-hidden="true" style={{ color: primary }} />
          </div>
          <div className="grid grid-cols-7 gap-[4px] text-center text-[12px]">
            {WEEKDAYS.map((d) => (
              <span key={d} className="pb-[4px] opacity-70">
                {d}
              </span>
            ))}
            {Array.from({ length: firstWeekday }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {days.map((d) => {
              const selected = d === 29;
              const available = d >= 29;
              return (
                <span
                  key={d}
                  className="mx-auto flex size-[30px] items-center justify-center rounded-full"
                  style={
                    selected
                      ? { background: primary, color: "#fff" }
                      : available
                        ? { boxShadow: `inset 0 0 0 1px ${primary}`, color: primary }
                        : { opacity: 0.4 }
                  }
                >
                  {d}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-[8px] p-[20px] sm:w-[180px]">
          <span className="text-[14px] leading-[20px] font-medium">Choose slot</span>
          {TIMES.map((t, i) => (
            <span
              key={t}
              className="flex h-[34px] items-center justify-center rounded-[8px] text-[13px] font-medium"
              style={
                i === 2
                  ? { background: primary, color: "#fff" }
                  : { boxShadow: `inset 0 0 0 1px ${primary}`, color: primary }
              }
            >
              {t}
            </span>
          ))}
          <span
            className="mt-[4px] flex h-[36px] items-center justify-center rounded-[8px] px-[8px] text-center text-[13px] font-medium text-white"
            style={{ background: primary }}
          >
            {draft.buttonText.trim() || "Schedule Meeting"}
          </span>
        </div>
      </div>
    </Modal>
  );
}
