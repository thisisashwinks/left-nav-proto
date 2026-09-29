"use client";

import * as React from "react";

/**
 * Pipelines as Settings sees them — configuration, not the board's scope.
 *
 * One module-level store so the list, the editor modals, the pipeline detail
 * page and its smart tags all read and write the same rows; a pipeline
 * created in the modal is on the list the moment it closes.
 */

export type StageColorMode = "none" | "dot" | "tint";

export interface PipelineStage {
  id: string;
  name: string;
  /** Hex, only drawn when the pipeline's colour mode is not "none". */
  color: string;
  /** 0–100. */
  probability: number;
  /** Which report charts the stage appears in. */
  showInFunnel: boolean;
  showInPie: boolean;
}

export interface SmartTagRule {
  field: string;
  operator: string;
  value: string;
}

export interface SmartTag {
  id: string;
  name: string;
  description: string;
  color: string;
  applyToAll: boolean;
  /** Groups are AND'ed; rules inside a group are OR'ed (nested filters). */
  groups: SmartTagRule[][];
  modifiedAt: string; // ISO
}

export type AccessMode = "all" | "selected" | "exclude";
export interface PipelinePermissions {
  mode: AccessMode;
  level: "view" | "edit";
  userIds: string[];
}

export interface PipelineConfig {
  id: string;
  name: string;
  opportunityProbability: boolean;
  colorMode: StageColorMode;
  stages: PipelineStage[];
  smartTags: SmartTag[];
  permissions: PipelinePermissions;
  updatedAt: string; // ISO
}

export const STAGE_COLORS = [
  "#667085", "#dc6803", "#155eef", "#079455", "#d92d20",
  "#6938ef", "#dd2590", "#2d3282", "#344054",
];

export const TAG_COLORS = [
  "#dc6803", "#155eef", "#079455", "#d92d20",
  "#6938ef", "#dd2590", "#2d3282", "#344054",
];

let seq = 0;
export function newId(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export function makeStage(name: string, probability: number, color = STAGE_COLORS[0]!): PipelineStage {
  return { id: newId("st"), name, color, probability, showInFunnel: true, showInPie: true };
}

function seed(name: string, stages: [string, number][], updatedAt: string): PipelineConfig {
  return {
    id: newId("pl"),
    name,
    opportunityProbability: false,
    colorMode: "none",
    stages: stages.map(([n, p], i) => makeStage(n, p, STAGE_COLORS[i % STAGE_COLORS.length])),
    smartTags: [],
    permissions: { mode: "all", level: "view", userIds: [] },
    updatedAt,
  };
}

let pipelines: PipelineConfig[] = [
  seed("AC services", [["Reached out", 20], ["Appointment booked", 40], ["House visit done", 60], ["Payment collected", 80]], "2026-09-24T12:22:00"),
  seed("New installs", [["New lead", 10], ["Site survey", 30], ["Quote sent", 50], ["Deposit paid", 75], ["Installed", 100]], "2026-08-14T12:39:00"),
  seed("Hot leads", [["Enquiry", 20], ["Call booked", 50], ["Closed", 90]], "2026-07-20T18:21:00"),
  seed("Winter service", [["Reminder sent", 15], ["Booked", 50], ["Serviced", 90]], "2026-06-01T18:04:00"),
  seed("Commercial retrofit", [["Discovery", 10], ["Audit", 30], ["Proposal", 55], ["Negotiation", 75], ["Signed", 100]], "2026-05-18T16:07:00"),
  seed("Maintenance plans", [["Trial", 30], ["Renewal due", 60], ["Renewed", 100]], "2026-03-02T16:39:00"),
  seed("Referral partners", [["Introduced", 25], ["Meeting held", 50], ["Partnered", 90]], "2025-12-13T00:25:00"),
  seed("Warranty claims", [["Reported", 20], ["Inspected", 50], ["Resolved", 100]], "2025-10-16T20:29:00"),
];

const listeners = new Set<() => void>();
let version = 0;
function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

export function getPipelines() {
  return pipelines;
}

export function setPipelines(next: PipelineConfig[]) {
  pipelines = next;
  emit();
}

export function upsertPipeline(p: PipelineConfig) {
  const exists = pipelines.some((x) => x.id === p.id);
  setPipelines(
    exists
      ? pipelines.map((x) => (x.id === p.id ? { ...p, updatedAt: new Date().toISOString() } : x))
      : [...pipelines, { ...p, updatedAt: new Date().toISOString() }],
  );
}

export function removePipeline(id: string) {
  setPipelines(pipelines.filter((p) => p.id !== id));
}

export function movePipeline(id: string, toIndex: number) {
  const from = pipelines.findIndex((p) => p.id === id);
  if (from < 0) return;
  const next = [...pipelines];
  const [row] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, row!);
  setPipelines(next);
}

/** Subscribe a component to the store. */
export function usePipelines(): PipelineConfig[] {
  React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => version,
  );
  return pipelines;
}

/** "May 5, 2025" and "12:22 PM", parsed by hand so SSR and client agree. */
export function formatUpdated(iso: string): { date: string; time: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return { date: iso, time: "" };
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const h = Number(m[4]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return {
    date: `${months[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`,
    time: `${h12}:${m[5]} ${h < 12 ? "AM" : "PM"}`,
  };
}
