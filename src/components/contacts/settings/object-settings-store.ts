"use client";

import * as React from "react";
import type { AvatarTone } from "../contacts-data";

/**
 * Contact settings as live state — the object's names and its detail views.
 *
 * Module stores like the smart lists: the Details tab renames the object and
 * every other tab's label follows ("Customize fields for add Contact"), and
 * the detail-view cards and the builder edit the same views.
 */

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      listeners.forEach((l) => l());
    },
    use: () => React.useSyncExternalStore(subscribe, () => value, () => value),
  };
}

/* ─── Object names ──────────────────────────────────────────────────────── */

export interface ObjectNames {
  singular: string;
  plural: string;
  autoSave: boolean;
}

const names = createStore<ObjectNames>({
  singular: "Contact",
  plural: "Contacts",
  autoSave: false,
});

export const useObjectNames = names.use;
export const saveObjectNames = (next: ObjectNames) => names.set(next);

/* ─── Users ─────────────────────────────────────────────────────────────── */

export type UserGroup =
  | "account-admin"
  | "account-user"
  | "agency-admin"
  | "agency-user";

export const USER_GROUPS: { id: UserGroup; label: string }[] = [
  { id: "account-admin", label: "Account Admin(s)" },
  { id: "account-user", label: "Account User(s)" },
  { id: "agency-admin", label: "Agency Admin(s)" },
  { id: "agency-user", label: "Agency User(s)" },
];

export interface SettingsUser {
  id: string;
  name: string;
  email: string;
  group: UserGroup;
  tone: AvatarTone;
}

const TONES: AvatarTone[] = ["orange", "purple", "green", "yellow", "blue", "pink", "teal"];
const USER_NAMES = [
  "Aaron Brooks", "Aisha Siddiqui", "Alex Stone", "Amara Reyes", "Ashwin KS",
  "Ben Carter", "Chloe Nguyen", "Daniel Park", "Devon Lane", "Elena Rossi",
  "Farah Khan", "Grace Kim", "Hector Ruiz", "Isla Morgan", "Jamal Wright",
  "Jenna Ortiz", "Kai Tanaka", "Liam Walsh", "Maya Patel", "Noah Fischer",
  "Olivia John", "Priya Menon", "Quinn Harper", "Ravi Shah", "Sofia Lopez",
  "Tom Becker", "Uma Rao", "Victor Hale", "Wendy Cho", "Zane Ellis",
];
const GROUP_CYCLE: UserGroup[] = [
  "account-admin", "account-user", "account-user", "agency-admin", "agency-user",
];

export const USERS: SettingsUser[] = USER_NAMES.map((name, i) => ({
  id: `u${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@gohighlevel.com`,
  group: GROUP_CYCLE[i % GROUP_CYCLE.length],
  tone: TONES[i % TONES.length],
}));

/**
 * The account has more users than the roster above names — the live Default
 * view card reads "+311". The unnamed rest always sit on the default view.
 */
export const UNNAMED_USERS = 285;

export const userById = (id: string) => USERS.find((u) => u.id === id);

/* ─── Detail views ──────────────────────────────────────────────────────── */

export type ModuleId =
  | "conversations"
  | "activity"
  | "associations"
  | "opportunities"
  | "tasks"
  | "notes"
  | "appointments"
  | "documents"
  | "payments"
  | "agent-logs";

export const MODULES: { id: ModuleId; label: string }[] = [
  { id: "conversations", label: "Conversations" },
  { id: "activity", label: "Activity" },
  { id: "associations", label: "Associations" },
  { id: "opportunities", label: "Opportunities" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "appointments", label: "Appointments" },
  { id: "documents", label: "Documents" },
  { id: "payments", label: "Payments" },
  { id: "agent-logs", label: "Agent Logs" },
];

export interface FieldFolder {
  id: string;
  name: string;
  /** Fields shown out of the folder's total. */
  shown: number;
  total: number;
}

export interface ViewLayout {
  /** 3 = contact | center | right. 2 = contact | modules (dropdown in one pane). */
  columns: 3 | 2;
  displayMode: "tabs" | "dropdown";
  /** Conversations is always first here and cannot leave. */
  center: ModuleId[];
  right: ModuleId[];
  /** The Contact card: its field rows, visible toggles, custom fields, actions. */
  card: {
    fields: string[];
    actions: string[];
    visible: { engagement: boolean; owner: boolean; followers: boolean };
    customFields: string[];
  };
  /** Edit tabs: All fields | dynamic tab (a module, or none) | Actions. */
  dynamicTab: string | null;
  folders: FieldFolder[];
}

export interface DetailView {
  id: string;
  name: string;
  isDefault: boolean;
  /** "Apr 2, 2026" — the heading date format. */
  updatedAt: string;
  /** Named users assigned explicitly. Default view also holds everyone else. */
  userIds: string[];
  layout: ViewLayout;
}

export const DEFAULT_FOLDERS: FieldFolder[] = [
  { id: "contact", name: "Contact", shown: 12, total: 12 },
  { id: "general", name: "General Info", shown: 49, total: 51 },
  { id: "extended", name: "Extended info", shown: 239, total: 241 },
  { id: "saas", name: "SaaS FastTrack", shown: 8, total: 8 },
  { id: "cp-beta", name: "CP Beta", shown: 4, total: 4 },
  { id: "form-93", name: "Form | Form 93", shown: 6, total: 6 },
  { id: "survey-21", name: "Survey | Survey 21", shown: 9, total: 9 },
  { id: "form-115", name: "Form | Form 115", shown: 0, total: 0 },
  { id: "quiz-2", name: "Quiz | Quiz 2", shown: 5, total: 5 },
];

export const defaultLayout = (): ViewLayout => ({
  columns: 3,
  displayMode: "tabs",
  center: ["conversations"],
  right: MODULES.filter((m) => m.id !== "conversations").map((m) => m.id),
  card: {
    fields: ["Owner & Followers", "Tags"],
    actions: ["Delete"],
    visible: { engagement: true, owner: true, followers: true },
    customFields: [],
  },
  dynamicTab: "DND",
  folders: DEFAULT_FOLDERS.map((f) => ({ ...f })),
});

const views = createStore<DetailView[]>([
  {
    id: "default",
    name: "Default view",
    isDefault: true,
    updatedAt: "Apr 2, 2026",
    userIds: [],
    layout: defaultLayout(),
  },
  {
    id: "sales",
    name: "Sales",
    isDefault: false,
    updatedAt: "Apr 2, 2026",
    userIds: ["u7"],
    layout: defaultLayout(),
  },
]);

export const MAX_VIEWS = 5;
export const useDetailViews = views.use;
export const getDetailViews = views.get;

const TODAY = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** A user sits in one view only, so assigning them anywhere lifts them out of the rest. */
function withUsers(list: DetailView[], id: string, userIds: string[]) {
  return list.map((v) =>
    v.id === id
      ? { ...v, userIds, updatedAt: TODAY() }
      : { ...v, userIds: v.userIds.filter((u) => !userIds.includes(u)) },
  );
}

export function createView(name: string, userIds: string[], from?: string): DetailView {
  const src = views.get().find((v) => v.id === from);
  const view: DetailView = {
    id: `view-${Date.now()}`,
    name,
    isDefault: false,
    updatedAt: TODAY(),
    userIds: [],
    layout: src ? structuredClone(src.layout) : defaultLayout(),
  };
  views.set(withUsers([...views.get(), view], view.id, userIds));
  return view;
}

export function renameView(id: string, name: string) {
  views.set(views.get().map((v) => (v.id === id ? { ...v, name, updatedAt: TODAY() } : v)));
}

export function setViewUsers(id: string, userIds: string[]) {
  views.set(withUsers(views.get(), id, userIds));
}

export function saveViewLayout(id: string, layout: ViewLayout) {
  views.set(views.get().map((v) => (v.id === id ? { ...v, layout, updatedAt: TODAY() } : v)));
}

/** The default view cannot be deleted; its users fall back to it. */
export function deleteView(id: string) {
  views.set(views.get().filter((v) => v.id !== id || v.isDefault));
}

/** Everyone not explicitly placed elsewhere sees the default view. */
export function usersOfView(view: DetailView, all: DetailView[]): SettingsUser[] {
  if (!view.isDefault) return view.userIds.map(userById).filter(Boolean) as SettingsUser[];
  const placed = new Set(all.filter((v) => !v.isDefault).flatMap((v) => v.userIds));
  return USERS.filter((u) => !placed.has(u.id));
}

export function userCount(view: DetailView, all: DetailView[]): number {
  return usersOfView(view, all).length + (view.isDefault ? UNNAMED_USERS : 0);
}

/** Groups default to the default view unless re-pointed in Manage users. */
const groups = createStore<Record<UserGroup, string>>({
  "account-admin": "default",
  "account-user": "default",
  "agency-admin": "default",
  "agency-user": "default",
});
export const useGroupViews = groups.use;
export const saveGroupViews = (next: Record<UserGroup, string>) => groups.set(next);
