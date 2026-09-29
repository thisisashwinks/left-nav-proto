"use client";

import * as React from "react";
import { workflows } from "@/components/automation/workflows-data";

/**
 * Conversations ▸ Settings ▸ SLA — the saved settings, as a module store.
 *
 * A module store rather than page state, so the inbox (or anything else that
 * wants to paint "SLA due soon" / "SLA overdue") can read the same targets
 * the settings page saves, without sitting under a provider. The page edits a
 * draft copy and only `saveSlaSettings` writes here.
 */

/* ─── Terms ─────────────────────────────────────────────────────────────── */

/** The two states a waiting conversation can reach, worded once. */
export const SLA_TERMS = {
  dueSoon: "SLA due soon",
  overdue: "SLA overdue",
} as const;

/* ─── Shapes ────────────────────────────────────────────────────────────── */

export type SlaUnit = "mins" | "hrs" | "days";

export const SLA_UNITS: { value: SlaUnit; label: string }[] = [
  { value: "mins", label: "Mins" },
  { value: "hrs", label: "Hrs" },
  { value: "days", label: "Days" },
];

export interface SlaDuration {
  value: number;
  unit: SlaUnit;
}

export interface SlaTarget {
  dueSoon: SlaDuration;
  overdue: SlaDuration;
}

export type SlaChannelId =
  | "call"
  | "sms"
  | "email"
  | "whatsapp"
  | "live-chat"
  | "web-chat"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "gbm";

export const SLA_CHANNELS: { id: SlaChannelId; label: string }[] = [
  { id: "call", label: "Call" },
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "live-chat", label: "Live chat" },
  { id: "web-chat", label: "Web chat" },
  { id: "facebook", label: "Facebook Messenger" },
  { id: "instagram", label: "Instagram Messenger" },
  { id: "tiktok", label: "TikTok" },
  { id: "gbm", label: "Google Business Messages" },
];

export interface ChannelSla extends SlaTarget {
  on: boolean;
}

/** How a class of automated sender counts against the SLA timer. */
export type SenderRule = "all" | "none" | "selected";

export interface SlaSettings {
  enabled: boolean;
  mode: "common" | "channel";
  common: SlaTarget;
  channels: Record<SlaChannelId, ChannelSla>;
  automation: { rule: SenderRule; ids: string[] };
  aiAgents: { rule: SenderRule; ids: string[] };
  businessHours: boolean;
}

/* ─── Defaults ──────────────────────────────────────────────────────────── */

const mins = (value: number): SlaDuration => ({ value, unit: "mins" });
const hrs = (value: number): SlaDuration => ({ value, unit: "hrs" });

/**
 * What a channel fills in with when it is switched on.
 *
 * Real-time channels get minutes, email gets the hour people expect of it.
 */
export function defaultTargetFor(id: SlaChannelId): SlaTarget {
  switch (id) {
    case "email":
      return { dueSoon: mins(30), overdue: hrs(1) };
    case "call":
      return { dueSoon: mins(10), overdue: mins(15) };
    default:
      return { dueSoon: mins(3), overdue: mins(5) };
  }
}

const ON_BY_DEFAULT: SlaChannelId[] = ["sms", "email", "whatsapp"];

export const DEFAULT_SLA_SETTINGS: SlaSettings = {
  enabled: true,
  mode: "channel",
  common: { dueSoon: mins(15), overdue: mins(30) },
  channels: Object.fromEntries(
    SLA_CHANNELS.map((c) => [
      c.id,
      { on: ON_BY_DEFAULT.includes(c.id), ...defaultTargetFor(c.id) },
    ]),
  ) as Record<SlaChannelId, ChannelSla>,
  automation: { rule: "all", ids: [] },
  aiAgents: { rule: "all", ids: [] },
  businessHours: false,
};

/* ─── Pickable senders ──────────────────────────────────────────────────── */

export const SLA_WORKFLOWS = workflows.map((w) => ({ id: w.id, label: w.name }));

/** The Conversations AI agents a location can have answering messages. */
export const SLA_AI_AGENTS = [
  { id: "ai-front-desk", label: "Front desk intake" },
  { id: "ai-lead-qualifier", label: "Lead qualifier" },
  { id: "ai-after-hours", label: "After-hours assistant" },
  { id: "ai-booking", label: "Booking assistant" },
  { id: "ai-spanish", label: "Spanish callback" },
  { id: "ai-support", label: "Support triage" },
];

/* ─── Maths ─────────────────────────────────────────────────────────────── */

const UNIT_MINUTES: Record<SlaUnit, number> = { mins: 1, hrs: 60, days: 1440 };

export function toMinutes(d: SlaDuration): number {
  return d.value * UNIT_MINUTES[d.unit];
}

/** "3 min", "1 hr", "2 days" — for sentences, not for the pickers. */
export function formatDuration(d: SlaDuration): string {
  const word =
    d.unit === "mins" ? "min" : d.unit === "hrs" ? (d.value === 1 ? "hr" : "hrs") : d.value === 1 ? "day" : "days";
  return `${d.value} ${word}`;
}

export const OVERDUE_ORDER_ERROR = "Overdue must be later than due soon.";

export function targetError(t: SlaTarget): string | null {
  return toMinutes(t.overdue) > toMinutes(t.dueSoon) ? null : OVERDUE_ORDER_ERROR;
}

/** Every error in a draft, keyed "common" or by channel id. */
export function settingsErrors(s: SlaSettings): Record<string, string> {
  const out: Record<string, string> = {};
  if (!s.enabled) return out;
  if (s.mode === "common") {
    const e = targetError(s.common);
    if (e) out.common = e;
  } else {
    for (const c of SLA_CHANNELS) {
      const row = s.channels[c.id];
      if (!row.on) continue;
      const e = targetError(row);
      if (e) out[c.id] = e;
    }
  }
  if (s.automation.rule === "selected" && s.automation.ids.length === 0) {
    out.automation = "Select at least 1 workflow.";
  }
  if (s.aiAgents.rule === "selected" && s.aiAgents.ids.length === 0) {
    out.aiAgents = "Select at least 1 AI agent.";
  }
  return out;
}

/* ─── Store ─────────────────────────────────────────────────────────────── */

let saved: SlaSettings = DEFAULT_SLA_SETTINGS;
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getSlaSettings(): SlaSettings {
  return saved;
}

export function saveSlaSettings(next: SlaSettings) {
  saved = next;
  listeners.forEach((l) => l());
}

/** The saved settings; re-renders on every save. */
export function useSlaSettings(): SlaSettings {
  return React.useSyncExternalStore(subscribe, getSlaSettings, getSlaSettings);
}

/**
 * The target that applies to one channel, or null when the SLA is off for it.
 *
 * Pure, so a list can call it per row from one `useSlaSettings()` read.
 */
export function slaTargetFor(s: SlaSettings, channel: SlaChannelId): SlaTarget | null {
  if (!s.enabled) return null;
  if (s.mode === "common") return s.common;
  const row = s.channels[channel];
  return row?.on ? row : null;
}

export type SlaState = "on-track" | "due-soon" | "overdue";

/** Where a conversation that has waited `waitedMinutes` stands. */
export function slaStateFor(
  s: SlaSettings,
  channel: SlaChannelId,
  waitedMinutes: number,
): SlaState | null {
  const t = slaTargetFor(s, channel);
  if (!t) return null;
  if (waitedMinutes >= toMinutes(t.overdue)) return "overdue";
  if (waitedMinutes >= toMinutes(t.dueSoon)) return "due-soon";
  return "on-track";
}

/** The label for a state, in the shared terms. */
export function slaLabelFor(state: SlaState | null): string | null {
  if (state === "overdue") return SLA_TERMS.overdue;
  if (state === "due-soon") return SLA_TERMS.dueSoon;
  return null;
}

/** Hook form of `slaStateFor`, for a single thread header or badge. */
export function useSlaState(channel: SlaChannelId, waitedMinutes: number): SlaState | null {
  const s = useSlaSettings();
  return slaStateFor(s, channel, waitedMinutes);
}
