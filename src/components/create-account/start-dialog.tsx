"use client";

import * as React from "react";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  INDUSTRIES,
  QUICK_SNAPSHOTS,
  type IndustryId,
  type StartOption,
} from "./flow-data";
import {
  AccountKindTabs,
  ArtTile,
  DialogClose,
  FlowButton,
  FlowDialog,
  type AccountKind,
} from "./parts";

/**
 * "How do you want to start this sub-account?" — the flow's first screen.
 *
 * Two parallel panels rather than a list, because they are two different
 * products: an industry builds the whole workspace for a trade, a snapshot
 * copies a setup into the standard one. Picking a card in either panel
 * highlights that panel, so it is always clear which kind of account Continue
 * is about to make.
 */

export type StartPick =
  | { kind: "industry"; id: IndustryId }
  | { kind: "snapshot"; id: string };

export function StartDialog({
  accountKind,
  onAccountKind,
  onClose,
  onContinue,
  onBrowseSnapshots,
}: {
  accountKind: AccountKind;
  onAccountKind: (kind: AccountKind) => void;
  onClose: () => void;
  onContinue: (pick: StartPick) => void;
  onBrowseSnapshots: () => void;
}) {
  // Restaurant is the one industry that is live, so it opens chosen.
  const [pick, setPick] = React.useState<StartPick>({
    kind: "industry",
    id: "restaurant",
  });

  const continueWith = () => {
    if (pick.kind === "industry") {
      const industry = INDUSTRIES.find((i) => i.id === pick.id);
      if (industry && !industry.available) {
        showToast(`${industry.label} workspaces are coming soon. Start from a snapshot for now.`);
        return;
      }
    }
    onContinue(pick);
  };

  return (
    <FlowDialog
      label="Create Sub-Account"
      onClose={onClose}
      header={
        <div className="flex items-center gap-[12px] px-[24px] py-[16px]">
          <h2 className="min-w-0 flex-1 text-[18px] leading-[28px] font-medium text-pg-heading">
            Create Sub-Account
          </h2>
          <DialogClose onClose={onClose} />
        </div>
      }
      bodyClassName="bg-[var(--hr-gray-25,#fcfcfd)]"
      footer={
        <>
          <span className="min-w-0 flex-1" />
          <FlowButton onClick={onClose}>Cancel</FlowButton>
          <FlowButton variant="primary" onClick={continueWith}>
            Continue
          </FlowButton>
        </>
      }
    >
      <div className="flex flex-col gap-[24px] px-[16px] py-[24px] sm:px-[48px] sm:py-[32px]">
        <div className="flex flex-col items-start gap-[16px] md:flex-row md:justify-end md:gap-[8px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <h3 className="text-[24px] leading-[32px] font-semibold text-pg-heading">
              How do you want to start this sub-account?
            </h3>
            <p className="max-w-[610px] text-[14px] leading-[20px] text-pg-text-strong">
              Start from an industry for a workspace built for how your
              client&rsquo;s business actually runs. Start from a snapshot for a
              ready-made templates from HighLevel or your own library.
            </p>
          </div>
          <AccountKindTabs value={accountKind} onChange={onAccountKind} />
        </div>

        <div className="flex flex-col gap-[24px] lg:flex-row">
          <Panel
            active={pick.kind === "industry"}
            icon="/create-account/icon-building.svg"
            title="Start from an industry"
            tag="New"
            explanation="A workspace built for how your client’s business actually runs, with tools made for their industry"
          >
            <OptionList
              options={INDUSTRIES}
              selectedId={pick.kind === "industry" ? pick.id : null}
              onSelect={(id) => setPick({ kind: "industry", id: id as IndustryId })}
            />
          </Panel>

          <Panel
            active={pick.kind === "snapshot"}
            icon="/create-account/icon-camera.svg"
            title="Start from a snapshot"
            explanation="Your client gets the standard workspace with a ready-made setup inside it. Begin with a HighLevel template, or reuse a setup you’ve saved or been sent"
            footer={
              <div className="flex items-end justify-between gap-[12px]">
                <p className="text-[12px] leading-[17px] text-pg-muted">
                  123 pre-built templates, plus yours
                </p>
                <button
                  type="button"
                  onClick={onBrowseSnapshots}
                  className="motion-tap text-[12px] leading-[17px] font-medium text-brand hover:underline"
                >
                  Browse all snapshots
                </button>
              </div>
            }
          >
            <OptionList
              options={QUICK_SNAPSHOTS}
              selectedId={pick.kind === "snapshot" ? pick.id : null}
              onSelect={(id) => setPick({ kind: "snapshot", id })}
              blankId="blank"
            />
          </Panel>
        </div>
      </div>
    </FlowDialog>
  );
}

function Panel({
  active,
  icon,
  title,
  tag,
  explanation,
  children,
  footer,
}: {
  active: boolean;
  icon: string;
  title: string;
  tag?: string;
  explanation: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-[24px] rounded-[12px] bg-pg-surface p-[24px] motion-move",
        active
          ? "shadow-[inset_0_0_0_1px_var(--hr-primary-200),0_5px_18px_-2px_rgba(51,70,109,0.05)]"
          : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      <div className="flex flex-col gap-[16px]">
        <span className="flex size-[48px] items-center justify-center rounded-[24px] bg-[#eaecf5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={icon} width={24} height={24} />
        </span>
        <div className="flex flex-col gap-[8px]">
          <h4 className="flex flex-wrap items-center gap-[12px] text-[24px] leading-[32px] font-semibold text-pg-heading">
            {title}
            {tag ? (
              <span className="flex h-[28px] items-center rounded-[4px] bg-[#eaecf5] px-[8px] text-[13px] leading-[18px] font-medium text-[#293056]">
                {tag}
              </span>
            ) : null}
          </h4>
          <p className="text-[14px] leading-[20px] text-pg-text-strong">{explanation}</p>
        </div>
      </div>
      <div className="flex flex-col gap-[12px]">
        <p className="text-[12px] leading-[17px] font-medium text-pg-muted">Get started with</p>
        {children}
      </div>
      {footer ? <div className="mt-auto pt-[4px]">{footer}</div> : null}
    </section>
  );
}

function OptionList({
  options,
  selectedId,
  onSelect,
  blankId,
}: {
  options: StartOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The option whose tile carries the drawn plus. */
  blankId?: string;
}) {
  return (
    <div role="radiogroup" className="flex flex-col gap-[12px]">
      {options.map((o) => {
        const on = o.id === selectedId;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(o.id)}
            className={cn(
              "motion-tap flex min-h-[96px] w-full items-center gap-[16px] rounded-[8px] bg-pg-surface p-[16px] text-left shadow-[0_2px_5px_rgba(51,70,109,0.05)]",
              on
                ? "shadow-[inset_0_0_0_1px_var(--hr-primary-700),0_2px_5px_rgba(51,70,109,0.05)]"
                : "shadow-[inset_0_0_0_1px_#e0e6f1,0_2px_5px_rgba(51,70,109,0.05)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_2px_5px_rgba(51,70,109,0.05)]",
            )}
          >
            <ArtTile art={o.art} blank={o.id === blankId} />
            <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
              <span className="text-[16px] leading-[24px] font-semibold text-pg-heading">
                {o.label}
              </span>
              <span className="text-[14px] leading-[20px] text-pg-text-strong">
                {o.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
