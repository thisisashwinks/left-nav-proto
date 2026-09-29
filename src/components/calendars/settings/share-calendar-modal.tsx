"use client";

import * as React from "react";
import { Calendar, Clock, RefreshCw } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { newRef, SCHEDULING_BASE } from "./cal-settings-store";
import { CopyField, EmbedBlock, embedSnippet, UnderlineTabs } from "./modal-kit";

type Tab = "link" | "one-time" | "embed";

const TABS: { id: Tab; label: string }[] = [
  { id: "link", label: "Scheduling link" },
  { id: "one-time", label: "One time link" },
  { id: "embed", label: "Embed code" },
];

/**
 * 100–102 — Share calendar: Scheduling link | One time link | Embed code.
 * `slug`/`name` let the builder share an unsaved draft, which is why the
 * permanent link can honestly read ".../booking/null" until it is saved.
 */
export function ShareCalendarModal({
  calendarId,
  slug,
  durationLabel,
  typeLabel,
  onClose,
}: {
  calendarId: string | null;
  name: string;
  slug: string;
  durationLabel: string;
  typeLabel: string;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<Tab>("link");
  // One time links are minted server-side in the product; the short wait
  // keeps the "Loading..." beat the live field shows.
  const [oneTime, setOneTime] = React.useState<string | null>(null);
  const [stamp] = React.useState(() => Date.now());
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const generate = () => {
    setOneTime(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setOneTime(`${SCHEDULING_BASE}/bookings/${slug || "null"}/otl/${newRef()}`),
      700,
    );
  };

  const selectTab = (next: Tab) => {
    setTab(next);
    if (next === "one-time" && oneTime === null && !timer.current) generate();
  };

  const id = calendarId ?? "null";
  const permanent = `${SCHEDULING_BASE}/booking/${id}`;

  return (
    <Modal title="Share calendar" width={630} onClose={onClose} bodyClassName="gap-[16px]">
      <div className="flex items-center gap-[24px] border-b border-pg-head-border pt-[8px] pb-[20px] text-[14px] leading-[20px] text-pg-text">
        <span className="flex items-center gap-[8px]">
          <Clock size={15} aria-hidden="true" className="text-pg-muted" />
          {durationLabel}
        </span>
        <span className="flex items-center gap-[8px]">
          <Calendar size={15} aria-hidden="true" className="text-pg-muted" />
          {typeLabel}
        </span>
      </div>

      <UnderlineTabs tabs={TABS} value={tab} onChange={selectTab} />

      <div role="tabpanel" className="flex flex-col pt-[4px] pb-[8px]">
        {tab === "link" ? (
          <div className="flex flex-col gap-[40px]">
            <CopyField
              label="Scheduling link"
              value={`${SCHEDULING_BASE}/bookings/${slug}`}
              hint="The scheduling link is determined by the slug. Adjust the slug, and the scheduling link automatically adapts to the modification."
            />
            <CopyField
              label="Permanent link"
              value={permanent}
              hint="Ideal for funnels, website redirects, or ads, the permanent link remains constant, unaffected by slug changes."
            />
          </div>
        ) : tab === "one-time" ? (
          <div className="flex flex-col gap-[12px]">
            <CopyField value={oneTime ?? ""} loading={oneTime === null} />
            <button
              type="button"
              onClick={generate}
              className="flex w-fit items-center gap-[8px] px-[8px] py-[4px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Generate new link
            </button>
            <div className="flex flex-col gap-[8px] pt-[8px]">
              <h3 className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
                One time link
              </h3>
              <p className="text-[14px] leading-[20px] text-pg-muted">
                Share your availability every time with a unique link that expires after a
                booking, ensuring controlled access.
              </p>
            </div>
          </div>
        ) : (
          <EmbedBlock what="calendar" code={embedSnippet(permanent, id, stamp)} />
        )}
      </div>
    </Modal>
  );
}
