"use client";

import * as React from "react";

/**
 * Marketing ▸ Social Planner — accounts and posts as live state.
 *
 * A module store so the planner list, the calendar view and the composer all
 * read one collection: a post created in New post is on the list the moment
 * the modal closes, and a bulk delete takes it off both views.
 */

export type Network = "facebook" | "instagram" | "linkedin" | "x";
export type PostStatus = "published" | "scheduled" | "draft" | "failed";
export type PostType = "native" | "reel" | "story" | "carousel";

export const STATUS_LABEL: Record<PostStatus, string> = {
  published: "Published",
  scheduled: "Scheduled",
  draft: "Draft",
  failed: "Failed",
};

export const TYPE_LABEL: Record<PostType, string> = {
  native: "Native post",
  reel: "Reel",
  story: "Story",
  carousel: "Carousel",
};

export const NETWORK_LABEL: Record<Network, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
};

export interface SocialAccount {
  id: string;
  name: string;
  network: Network;
  /** Avatar fill — a brand-neutral hue from the HighRise ramps. */
  hue: string;
  initials: string;
}

export const ACCOUNTS: SocialAccount[] = [
  { id: "acc-1", name: "Bright Minds Daily", network: "facebook", hue: "var(--hr-primary-300, #84adff)", initials: "B" },
  { id: "acc-2", name: "Change World", network: "facebook", hue: "var(--hr-violet-400, #9b8afb)", initials: "CW" },
  { id: "acc-3", name: "Edu Wire", network: "facebook", hue: "var(--hr-gray-300)", initials: "EW" },
  { id: "acc-4", name: "Gyaan Point", network: "facebook", hue: "var(--hr-success-400)", initials: "G" },
  { id: "acc-5", name: "Campus Buzz", network: "facebook", hue: "var(--hr-warning-400)", initials: "CB" },
  { id: "acc-6", name: "Edu Wire", network: "instagram", hue: "var(--hr-error-300)", initials: "EW" },
  { id: "acc-7", name: "Edu Wire", network: "linkedin", hue: "var(--hr-gray-400)", initials: "EW" },
  { id: "acc-8", name: "Edu Wire", network: "x", hue: "var(--hr-gray-600)", initials: "EW" },
];

export const accountById = (id: string) => ACCOUNTS.find((a) => a.id === id);

export interface SocialPost {
  id: string;
  caption: string;
  /** Thumbnail tint — the prototype draws media as tiles, not photos. */
  media: { hue: string; kind: "image" | "video" } | null;
  status: PostStatus;
  type: PostType;
  /** Epoch ms. */
  at: number;
  accountIds: string[];
}

const HEADLINES = [
  "Exam reforms: Nilekani-led panel consults ex-ISRO chief on entrance test overhaul",
  "Union Education minister Pralhad Joshi holds bilateral talks on student exchange",
  "Prosecutor reopens probe into Cornell gang rape case after new evidence",
  "Maharashtra Public Service Commission postpones prelims amid flood alerts",
  "WorldSkills Shanghai 2026: India ranks 10th, wins 4 medals",
  "Canara Bank to recruit for 3500 Apprentice posts, apply by Oct 20",
  "CISCE board to launch mental health and well being programme in schools",
  "BSEB STET Dummy Admit Card 2026 out at stetresult.in; check steps",
  "‘What's the point of merit?’ Woman recalls giving up her seat to a relative",
  "AI, semiconductors, quantum tech next major frontiers, says minister",
  "NEET PG 2026 counselling schedule released; round 1 begins Oct 10",
  "IIT Madras launches free online course on generative AI for teachers",
  "CBSE announces two board exams a year from 2027; draft rules out",
  "UGC flags 21 fake universities; students urged to verify before admission",
  "Delhi University extends last date for PhD applications to Oct 15",
  "JEE Main 2027 registration window to open in November, says NTA",
  "Kerala tops literacy survey again with 96% adult literacy",
  "Study abroad: Canada caps international student permits for 2027",
  "Scholarship alert: 5,000 merit awards for first-generation learners",
  "School bags to get lighter as states adopt new weight norms",
];

const HUES = [
  "var(--hr-gray-700)", "var(--hr-error-400)", "var(--hr-warning-500)", "var(--hr-violet-500, #7a5af8)",
  "var(--hr-success-600)", "var(--hr-primary-500, #2970ff)", "var(--hr-gray-400)", "var(--hr-warning-300)",
];

/*
 * 237 posts, newest first, four a day at 7:30 PM — the live account's
 * cadence. A few near the top are still scheduled and one failed, so the
 * status filter has something to find besides Published.
 */
function seed(): SocialPost[] {
  const out: SocialPost[] = [];
  const base = new Date("2026-09-30T19:30:00");
  for (let i = 0; i < 237; i++) {
    const day = Math.floor(i / 4);
    const at = new Date(base);
    at.setDate(base.getDate() - day);
    const status: PostStatus =
      i % 53 === 17 ? "failed" : i % 41 === 9 ? "draft" : "published";
    const type: PostType = i % 19 === 6 ? "reel" : i % 23 === 11 ? "carousel" : "native";
    out.push({
      id: `post-${i + 1}`,
      caption: HEADLINES[i % HEADLINES.length]!,
      media: i % 29 === 13 ? null : { hue: HUES[i % HUES.length]!, kind: type === "reel" ? "video" : "image" },
      status,
      type,
      at: at.getTime(),
      accountIds: [ACCOUNTS[2]!.id],
    });
  }
  // Two still in the queue, ahead of the published run.
  const next = new Date("2026-10-02T09:00:00").getTime();
  out.unshift(
    { id: "post-q2", caption: "Weekend read: 7 habits of top board exam scorers", media: { hue: HUES[3]!, kind: "image" }, status: "scheduled", type: "carousel", at: next + 86_400_000, accountIds: ["acc-3", "acc-6"] },
    { id: "post-q1", caption: "Admissions open: what to check before you pay the fee", media: { hue: HUES[5]!, kind: "image" }, status: "scheduled", type: "native", at: next, accountIds: ["acc-3", "acc-7"] },
  );
  return out.sort((a, b) => b.at - a.at);
}

let posts = seed();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const usePosts = () => React.useSyncExternalStore(subscribe, () => posts, () => posts);

export function addPost(p: Omit<SocialPost, "id">) {
  posts = [{ ...p, id: `post-${Date.now()}` }, ...posts].sort((a, b) => b.at - a.at);
  emit();
}

export function updatePost(id: string, patch: Partial<SocialPost>) {
  posts = posts.map((p) => (p.id === id ? { ...p, ...patch } : p)).sort((a, b) => b.at - a.at);
  emit();
}

export function deletePosts(ids: string[]) {
  const drop = new Set(ids);
  posts = posts.filter((p) => !drop.has(p.id));
  emit();
}

export function duplicatePost(id: string) {
  const src = posts.find((p) => p.id === id);
  if (!src) return;
  addPost({ ...src, status: "draft", caption: src.caption });
}

/** "30 Sep 2026" over "07:30 PM" — the list's two-line date cell. */
export function formatPostDate(ms: number) {
  const d = new Date(ms);
  return {
    // Assembled by hand: en-GB writes September as "Sept".
    date: `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })} ${d.getFullYear()}`,
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}
