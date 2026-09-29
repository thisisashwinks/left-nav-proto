"use client";

import * as React from "react";
import { CircleAlert, Clock, ExternalLink } from "lucide-react";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { Toggle } from "@/components/page/form-controls";
import { showToast, Toaster } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  defaultTargetFor,
  getSlaSettings,
  saveSlaSettings,
  settingsErrors,
  SLA_AI_AGENTS,
  SLA_CHANNELS,
  SLA_TERMS,
  SLA_WORKFLOWS,
  useSlaSettings,
  type SenderRule,
  type SlaChannelId,
  type SlaSettings,
  type SlaTarget,
} from "./sla-settings-data";
import { DurationField, MultiPicker, RadioGroup } from "./sla-settings-controls";

/**
 * Conversations ▸ Settings — SLA settings.
 *
 * The page edits a draft; the module store only changes on Save, which is
 * what lets the save bar say "unsaved" honestly and Discard mean something.
 */
export function SlaSettingsPage() {
  const { effective } = useTheme();
  const saved = useSlaSettings();
  const [draft, setDraft] = React.useState<SlaSettings>(getSlaSettings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const errors = settingsErrors(draft);
  const errorCount = Object.keys(errors).length;

  const patch = (p: Partial<SlaSettings>) => setDraft((d) => ({ ...d, ...p }));
  const setChannel = (id: SlaChannelId, next: Partial<SlaSettings["channels"][SlaChannelId]>) =>
    setDraft((d) => ({
      ...d,
      channels: { ...d.channels, [id]: { ...d.channels[id], ...next } },
    }));
  const switchChannel = (id: SlaChannelId, on: boolean) =>
    // Switching on fills the channel's defaults, per the live product; the
    // off state shows "--" rather than a stale value.
    setChannel(id, on ? { on: true, ...defaultTargetFor(id) } : { on: false });

  const allOn = SLA_CHANNELS.every((c) => draft.channels[c.id].on);
  const setAll = (on: boolean) =>
    setDraft((d) => ({
      ...d,
      channels: Object.fromEntries(
        SLA_CHANNELS.map((c) => {
          const row = d.channels[c.id];
          if (row.on === on) return [c.id, row];
          return [c.id, on ? { on: true, ...defaultTargetFor(c.id) } : { ...row, on: false }];
        }),
      ) as SlaSettings["channels"],
    }));

  const save = () => {
    saveSlaSettings(draft);
    showToast("SLA settings saved.");
  };

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col overflow-y-auto px-[var(--page-inset)]"
    >
      <div className="flex shrink-0 flex-col gap-[14px] pb-[24px]">
        <PageHeader title="Settings" description="Manage how your team responds to conversations." />

        <UnderlineTabs tabs={["SLA settings"]} />

        <div className="flex flex-col gap-[4px]">
          <div className="flex items-center gap-[10px]">
            <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">SLA settings</h2>
            <Toggle
              aria-label="Turn SLA tracking on or off"
              checked={draft.enabled}
              onChange={(enabled) => patch({ enabled })}
            />
          </div>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Set how quickly your team should respond to customer messages.
          </p>
        </div>

        {draft.enabled ? (
          <section className="flex flex-col rounded-[12px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]">
            <Section
              title="How should SLAs apply across channels?"
              description="Apply the same SLA to all channels, or set one for each channel."
            >
              <RadioGroup
                name="SLA scope"
                value={draft.mode}
                onChange={(mode) => patch({ mode })}
                options={[
                  { value: "common", label: "Common SLA" },
                  { value: "channel", label: "Channel-specific SLA" },
                ]}
              />

              {draft.mode === "common" ? (
                <CommonTarget
                  value={draft.common}
                  error={errors.common}
                  onChange={(common) => patch({ common })}
                />
              ) : (
                <div className="flex flex-col gap-[12px] pt-[8px]">
                  <div className="flex flex-col gap-[2px]">
                    <h4 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                      Define SLA targets
                    </h4>
                    <p className="text-[13px] leading-[18px] text-pg-muted">
                      How quickly your team should reply on each channel.
                    </p>
                  </div>
                  <ChannelTable
                    draft={draft}
                    errors={errors}
                    allOn={allOn}
                    onAll={setAll}
                    onSwitch={switchChannel}
                    onTarget={(id, t) => setChannel(id, t)}
                  />
                </div>
              )}
            </Section>

            <SenderSection
              title="How should automation (workflow) messages affect SLA?"
              description="Choose whether automated messages count as a response."
              name="Automation messages"
              value={draft.automation}
              onChange={(automation) => patch({ automation })}
              error={errors.automation}
              items={SLA_WORKFLOWS}
              noun="workflows"
              labels={{
                all: "Count all automation messages as a response (stops the SLA timer)",
                none: "Count no automation messages as a response (the timer runs until a person replies)",
                selected: "Count messages only from selected workflows",
              }}
            />

            <SenderSection
              title="How should Conversations AI agent messages affect SLA?"
              description="Choose whether replies from AI agents count as a response."
              name="AI agent messages"
              value={draft.aiAgents}
              onChange={(aiAgents) => patch({ aiAgents })}
              error={errors.aiAgents}
              items={SLA_AI_AGENTS}
              noun="AI agents"
              labels={{
                all: "Count all AI agent messages as a response (stops the SLA timer)",
                none: "Count no AI agent messages as a response (the timer runs until a person replies)",
                selected: "Count messages only from selected AI agents",
              }}
            />

            <Section
              title="Business hours"
              description="Pause SLA timers outside your business hours, so overnight messages aren't counted against your team."
            >
              <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[8px]">
                <label className="flex items-center gap-[10px]">
                  <Toggle
                    aria-label="Only count time during business hours"
                    checked={draft.businessHours}
                    onChange={(businessHours) => patch({ businessHours })}
                  />
                  <span className="text-[14px] leading-[20px] text-pg-text">
                    Only count time during business hours
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => showToast("Business hours are set in Business profile.")}
                  className="flex items-center gap-[4px] text-[14px] leading-[20px] font-medium text-brand hover:underline"
                >
                  Edit business hours
                  <ExternalLink size={13} aria-hidden="true" />
                </button>
              </div>
              {draft.businessHours ? (
                <p className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
                  <Clock size={13} aria-hidden="true" className="shrink-0" />
                  Mon–Fri, 9:00 AM–6:00 PM (America/Chicago)
                </p>
              ) : null}
            </Section>
          </section>
        ) : (
          <section className="flex items-center gap-[10px] rounded-[12px] bg-pg-surface px-[16px] py-[14px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            <CircleAlert size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <p className="text-[14px] leading-[20px] text-pg-muted">
              SLA tracking is off. Conversations won&apos;t show {SLA_TERMS.dueSoon.toLowerCase()} or{" "}
              {SLA_TERMS.overdue.toLowerCase()}. Turn it on to set response targets.
            </p>
          </section>
        )}
      </div>

      {dirty ? (
        <div className="motion-slot-in sticky bottom-0 z-20 -mx-[var(--page-inset)] mt-auto flex shrink-0 flex-wrap items-center gap-[12px] border-t border-pg-head-border bg-pg-surface px-[var(--page-inset)] py-[12px] shadow-[0_-8px_16px_-8px_rgba(16,24,40,0.08)]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
            You have unsaved changes
          </span>
          {errorCount > 0 ? (
            <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
              Fix {errorCount} {errorCount === 1 ? "issue" : "issues"} above to save.
            </span>
          ) : null}
          <span className="flex-1" />
          <OutlineButton className="h-[36px] text-[14px]" onClick={() => setDraft(saved)}>
            Discard
          </OutlineButton>
          <PrimaryButton
            className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:hover:shadow-none"
            disabled={errorCount > 0}
            onClick={save}
          >
            Save changes
          </PrimaryButton>
        </div>
      ) : null}

      <Toaster />
    </div>
  );
}

/* ─── Pieces ────────────────────────────────────────────────────────────── */

export function UnderlineTabs({ tabs }: { tabs: string[] }) {
  return (
    <div role="tablist" className="flex shrink-0 gap-[16px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
      {tabs.map((t, i) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={i === 0}
          className={cn(
            "h-[32px] px-[4px] text-[14px] leading-[20px] font-medium",
            i === 0 ? "text-brand shadow-[inset_0_-2px_0_0_var(--brand)]" : "text-pg-muted hover:text-pg-text",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[12px] border-b border-pg-row-border p-[20px] last:border-b-0">
      <div className="flex flex-col gap-[2px]">
        <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">{title}</h3>
        <p className="text-[13px] leading-[18px] text-pg-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Dot({ tone }: { tone: "warning" | "error" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-[8px] shrink-0 rounded-full",
        tone === "warning" ? "bg-[var(--hr-warning-500)]" : "bg-[var(--hr-error-500)]",
      )}
    />
  );
}

function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-center gap-[6px] text-[13px] leading-[18px] text-[var(--hr-error-600)]">
      <CircleAlert size={13} aria-hidden="true" className="shrink-0" />
      {children}
    </p>
  );
}

function CommonTarget({
  value,
  error,
  onChange,
}: {
  value: SlaTarget;
  error?: string;
  onChange: (next: SlaTarget) => void;
}) {
  return (
    <div className="flex flex-col gap-[8px] pt-[4px]">
      <div className="flex flex-wrap items-end gap-x-[32px] gap-y-[12px]">
        <div className="flex flex-col gap-[4px]">
          <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-text">
            <Dot tone="warning" />
            {SLA_TERMS.dueSoon}
          </span>
          <DurationField
            label={`All channels ${SLA_TERMS.dueSoon}`}
            value={value.dueSoon}
            onChange={(dueSoon) => onChange({ ...value, dueSoon })}
          />
        </div>
        <div className="flex flex-col gap-[4px]">
          <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-text">
            <Dot tone="error" />
            {SLA_TERMS.overdue}
          </span>
          <DurationField
            label={`All channels ${SLA_TERMS.overdue}`}
            value={value.overdue}
            onChange={(overdue) => onChange({ ...value, overdue })}
          />
        </div>
      </div>
      {error ? <InlineError>{error}</InlineError> : null}
    </div>
  );
}

function ChannelTable({
  draft,
  errors,
  allOn,
  onAll,
  onSwitch,
  onTarget,
}: {
  draft: SlaSettings;
  errors: Record<string, string>;
  allOn: boolean;
  onAll: (on: boolean) => void;
  onSwitch: (id: SlaChannelId, on: boolean) => void;
  onTarget: (id: SlaChannelId, t: SlaTarget) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-head-border)]">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
        <thead>
          <tr className="bg-pg">
            <th scope="col" className="h-[40px] w-[72px] rounded-tl-[8px] border-b border-pg-head-border px-[16px]">
              <Toggle aria-label="Turn every channel on or off" checked={allOn} onChange={onAll} />
            </th>
            <HeadCell>Channel</HeadCell>
            <HeadCell>
              <span className="flex items-center gap-[6px]">
                <Dot tone="warning" />
                {SLA_TERMS.dueSoon}
              </span>
            </HeadCell>
            <HeadCell last>
              <span className="flex items-center gap-[6px]">
                <Dot tone="error" />
                {SLA_TERMS.overdue}
              </span>
            </HeadCell>
          </tr>
        </thead>
        <tbody>
          {SLA_CHANNELS.map((c, i) => {
            const row = draft.channels[c.id];
            const error = errors[c.id];
            const lastRow = i === SLA_CHANNELS.length - 1;
            const cell = cn("px-[16px] py-[8px] align-top", !lastRow && "border-b border-pg-row-border");
            return (
              <tr key={c.id}>
                <td className={cn(cell, "pt-[16px]")}>
                  <Toggle
                    aria-label={`SLA for ${c.label}`}
                    checked={row.on}
                    onChange={(on) => onSwitch(c.id, on)}
                  />
                </td>
                <td className={cn(cell, "pt-[16px]")}>
                  <span className={cn("text-[14px] leading-[20px]", row.on ? "text-pg-text" : "text-pg-muted")}>
                    {c.label}
                  </span>
                </td>
                <td className={cell}>
                  <DurationField
                    label={`${c.label} ${SLA_TERMS.dueSoon}`}
                    value={row.dueSoon}
                    disabled={!row.on}
                    onChange={(dueSoon) => onTarget(c.id, { dueSoon, overdue: row.overdue })}
                  />
                </td>
                <td className={cell}>
                  <div className="flex flex-col gap-[6px]">
                    <DurationField
                      label={`${c.label} ${SLA_TERMS.overdue}`}
                      value={row.overdue}
                      disabled={!row.on}
                      onChange={(overdue) => onTarget(c.id, { dueSoon: row.dueSoon, overdue })}
                    />
                    {error ? <InlineError>{error}</InlineError> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HeadCell({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "h-[40px] border-b border-pg-head-border px-[16px] text-[13px] leading-[18px] font-medium text-pg-text-strong",
        last && "rounded-tr-[8px]",
      )}
    >
      {children}
    </th>
  );
}

function SenderSection({
  title,
  description,
  name,
  value,
  onChange,
  error,
  items,
  noun,
  labels,
}: {
  title: string;
  description: string;
  name: string;
  value: { rule: SenderRule; ids: string[] };
  onChange: (next: { rule: SenderRule; ids: string[] }) => void;
  error?: string;
  items: { id: string; label: string }[];
  noun: string;
  labels: Record<SenderRule, string>;
}) {
  return (
    <Section title={title} description={description}>
      <RadioGroup
        name={name}
        value={value.rule}
        onChange={(rule) => onChange({ ...value, rule })}
        options={[
          { value: "all", label: labels.all },
          { value: "none", label: labels.none },
          { value: "selected", label: labels.selected },
        ]}
      />
      {value.rule === "selected" ? (
        <div className="flex flex-col gap-[4px] pl-[24px]">
          <MultiPicker
            items={items}
            selected={value.ids}
            onChange={(ids) => onChange({ ...value, ids })}
            placeholder={`Select ${noun}`}
            noun={noun}
            invalid={Boolean(error)}
          />
          {error ? <InlineError>{error}</InlineError> : null}
        </div>
      ) : null}
    </Section>
  );
}
