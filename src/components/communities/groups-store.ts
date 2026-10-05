"use client";

import * as React from "react";

/**
 * The community groups, as a module store.
 *
 * Module-level rather than component state so a group created, re-owned or
 * inactivated here is still that way after a trip to another tab and back —
 * the screen unmounts on navigation, the store does not.
 */

export type GroupStatus = "active" | "inactive";
export type GroupPrivacy = "public" | "private";

/** "default" is the gradient, "brand" the navy HighLevel cover; else an upload. */
export type GroupCover = { kind: "default" } | { kind: "brand" } | { kind: "upload"; src: string };

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  privacy: GroupPrivacy;
  cover: GroupCover;
  /** "rings" is the product's default glyph; "face" a custom illustrated avatar. */
  avatar: "rings" | "face";
  members: number;
  owner: string;
  status: GroupStatus;
}

export const OWNERS = ["Shivani Gera", "Ashwin K S", "Priya Nair", "Rahul Mehta", "Meera Iyer"];

let groups: CommunityGroup[] = [
  {
    id: "g1",
    name: "Public to Private test",
    description: "",
    privacy: "private",
    cover: { kind: "brand" },
    avatar: "rings",
    members: 9,
    owner: "Shivani Gera",
    status: "active",
  },
  {
    id: "g2",
    name: "Group 23",
    description: "",
    privacy: "public",
    cover: { kind: "default" },
    avatar: "rings",
    members: 2,
    owner: "Shivani Gera",
    status: "active",
  },
  {
    id: "g3",
    name: "Group name",
    description: "",
    privacy: "public",
    cover: { kind: "default" },
    avatar: "face",
    members: 2,
    owner: "Shivani Gera",
    status: "active",
  },
  {
    id: "g4",
    name: "Agency growth circle",
    description: "",
    privacy: "private",
    cover: { kind: "brand" },
    avatar: "face",
    members: 14,
    owner: "Priya Nair",
    status: "active",
  },
  {
    id: "g5",
    name: "Beta testers",
    description: "",
    privacy: "private",
    cover: { kind: "default" },
    avatar: "rings",
    members: 5,
    owner: "Shivani Gera",
    status: "active",
  },
  {
    id: "g6",
    name: "Course alumni",
    description: "",
    privacy: "public",
    cover: { kind: "default" },
    avatar: "rings",
    members: 31,
    owner: "Rahul Mehta",
    status: "active",
  },
  {
    id: "g7",
    name: "Spring cohort 2025",
    description: "",
    privacy: "public",
    cover: { kind: "default" },
    avatar: "face",
    members: 3,
    owner: "Meera Iyer",
    status: "inactive",
  },
];

let nextId = 100;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useGroups(): CommunityGroup[] {
  return React.useSyncExternalStore(subscribe, () => groups, () => groups);
}

export function updateGroup(id: string, patch: Partial<CommunityGroup>) {
  groups = groups.map((g) => (g.id === id ? { ...g, ...patch } : g));
  emit();
}

/** New groups go first, so the one you just made is the one you see. */
export function addGroup(input: Pick<CommunityGroup, "name" | "description" | "privacy" | "cover">) {
  groups = [
    {
      ...input,
      id: `g${nextId++}`,
      avatar: "rings",
      members: 1,
      owner: "Ashwin K S",
      status: "active",
    },
    ...groups,
  ];
  emit();
}
