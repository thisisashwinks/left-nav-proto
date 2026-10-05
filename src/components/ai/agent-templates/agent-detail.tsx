"use client";

import * as React from "react";
import { Download, Headphones, Play } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { AgentBand, PricePill, Rating } from "./agent-card";
import { formatListens, type AgentTemplate } from "./data";

/**
 * One listing, opened over the grid.
 *
 * A modal rather than a page so the filters and scroll position survive the
 * look — browsing a marketplace is open, glance, close, next. It carries what
 * the card cannot: the actions the agent will take on the account, what it
 * ships with, and who is allowed to install it.
 */
export function AgentDetail({
  agent,
  onClose,
}: {
  agent: AgentTemplate;
  onClose: () => void;
}) {
  const facts = [
    { label: "Channel", value: agent.channel === "voice" ? "Voice AI" : "Conversation AI" },
    { label: "Categories", value: agent.categories.join(", ") },
    { label: "Use cases", value: agent.useCases.join(", ") },
    { label: "Business niche", value: agent.niches.join(", ") },
    { label: "Who can install", value: agent.installers.join(", ") },
  ];

  return (
    <Modal
      title={agent.title}
      width={600}
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton onClick={() => showToast(`Playing a demo of ${agent.title}…`)}>
            <Play size={14} aria-hidden="true" />
            Hear a demo
          </OutlineButton>
          <PrimaryButton
            onClick={() => {
              showToast(`Installing ${agent.title}…`);
              onClose();
            }}
          >
            <Download size={14} aria-hidden="true" />
            Install agent
          </PrimaryButton>
        </>
      }
    >
      <div className="-mt-[4px] flex flex-wrap items-center gap-x-[12px] gap-y-[6px] text-[13px] leading-[18px] text-pg-muted">
        <span>By {agent.author}</span>
        <Rating rating={agent.rating} reviews={agent.reviews} />
        <span className="flex items-center gap-[4px] tabular-nums">
          <Headphones size={14} aria-hidden="true" />
          {formatListens(agent.listens)} listens
        </span>
        <PricePill paid={agent.paid} />
      </div>

      <AgentBand agent={agent} className="rounded-[8px] aspect-[600/220]" />

      <p className="text-[14px] leading-[20px] text-pg-text">{agent.description}</p>

      <ChipGroup title="Actions it uses" items={agent.actions} />
      <ChipGroup title="Agent contains" items={agent.contains} />

      <dl className="flex flex-col gap-[8px] border-t border-pg-row-border pt-[16px]">
        {facts.map((f) => (
          <div key={f.label} className="flex items-baseline gap-[12px]">
            <dt className="w-[120px] shrink-0 text-[13px] leading-[18px] text-pg-muted">
              {f.label}
            </dt>
            <dd className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text-strong">
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

function ChipGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="flex flex-col gap-[8px]">
      <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">{title}</h3>
      <ul className="flex flex-wrap gap-[8px]">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-[6px] bg-pg px-[8px] py-[2px] text-[13px] leading-[18px] text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
