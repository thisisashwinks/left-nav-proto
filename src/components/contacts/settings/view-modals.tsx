"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Checkbox, TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  createView,
  renameView,
  saveGroupViews,
  setViewUsers,
  useDetailViews,
  useGroupViews,
  USER_GROUPS,
  USERS,
  type DetailView,
  type SettingsUser,
  type UserGroup,
} from "./object-settings-store";

/**
 * The dialogs the detail-view cards open — and the builder too, which borrows
 * the rename modal from here rather than drawing a second one.
 *
 * Both hold a draft and commit on the primary button. Nothing touches the
 * store until then, so Cancel is always a true cancel.
 */

/* ─── Shared bits ───────────────────────────────────────────────────────── */

const DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100";

/** The 36px pair every footer here ends in. */
const BTN = "h-[36px] text-[14px]";

/** Footer with the divider the live modals draw above their buttons. */
function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-[16px] flex flex-1 justify-end gap-[12px] border-t border-pg-head-border px-[16px] pt-[16px]">
      {children}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[14px] leading-[20px] font-medium text-pg-text-strong"
    >
      {children}
      {required ? <span className="text-pg-danger"> *</span> : null}
    </label>
  );
}

/** Where a floating menu sits, in viewport pixels. */
interface Anchor {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
}

/** Below the trigger, or above it when the viewport runs out. */
function anchorOf(el: HTMLElement, menuHeight = 300): Anchor {
  const r = el.getBoundingClientRect();
  const flip = r.bottom + menuHeight + 8 > window.innerHeight && r.top > menuHeight;
  return flip
    ? { bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width }
    : { top: r.bottom + 4, left: r.left, width: r.width };
}

/**
 * A menu portalled to the body.
 *
 * The modal body and the drawer body both scroll, so an absolutely placed
 * menu would be clipped by them — the Select in form-controls has exactly
 * that problem at the bottom of a drawer. Out on the body it floats clear,
 * re-stamped with the page theme like the modal is. Any scroll closes it,
 * since a fixed menu would otherwise drift off its trigger.
 */
function FloatingMenu({
  anchor,
  minWidth = 0,
  onClose,
  className,
  children,
}: {
  anchor: Anchor;
  minWidth?: number;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    const onScroll = (e: Event) => {
      // Scrolling the menu's own list is not a reason to shut it.
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[96]">
      <button
        type="button"
        aria-label="Close options"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={menuRef}
        style={{
          top: anchor.top,
          bottom: anchor.bottom,
          left: anchor.left,
          width: Math.max(anchor.width, minWidth),
        }}
        className={cn(
          "absolute flex max-h-[300px] flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Which non-default view a user sits in, if any. */
function homeOf(userId: string, views: DetailView[]) {
  return views.find((v) => !v.isDefault && v.userIds.includes(userId));
}

/* ─── Assign user(s) ────────────────────────────────────────────────────── */

/**
 * The multi-select the create and duplicate modals share.
 *
 * Each row notes the view a user already sits in, because picking them here
 * lifts them out of it — a user is in one view only, and the hint under the
 * field says so, but the row is where the consequence is visible.
 */
function UserMultiSelect({
  value,
  onChange,
  views,
  exceptViewId,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  views: DetailView[];
  /** The view being edited — its own members are not "elsewhere". */
  exceptViewId?: string;
}) {
  const [anchor, setAnchor] = React.useState<Anchor | null>(null);
  const [query, setQuery] = React.useState("");
  const listId = React.useId();
  const chosen = value.map((id) => USERS.find((u) => u.id === id)).filter(Boolean) as SettingsUser[];
  const q = query.trim().toLowerCase();
  const shown = q
    ? USERS.filter((u) => u.name.toLowerCase().includes(q) || u.email.includes(q))
    : USERS;

  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...value, id] : value.filter((v) => v !== id));

  const open = (el: HTMLElement) => {
    setQuery("");
    setAnchor(anchorOf(el, 320));
  };

  return (
    <>
      <div
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        aria-controls={listId}
        aria-label="Assign user(s)"
        onClick={(e) => (anchor ? setAnchor(null) : open(e.currentTarget))}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            open(e.currentTarget);
          }
        }}
        className={cn(
          "flex h-[36px] w-full cursor-pointer items-center gap-[6px] rounded-[8px] bg-pg-surface pr-[12px] pl-[12px] text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus:outline-none",
          anchor
            ? "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]"
            : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] focus-visible:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          chosen.length > 0 && "pl-[6px]",
        )}
      >
        {chosen.length === 0 ? (
          <span className="min-w-0 flex-1 truncate text-pg-faint">Select users</span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-[4px] overflow-hidden">
            {chosen.slice(0, 2).map((u) => (
              <span
                key={u.id}
                className="flex h-[24px] min-w-0 shrink items-center gap-[4px] rounded-[6px] bg-pg pr-[2px] pl-[4px] text-[13px] leading-[18px] text-pg-text-strong"
              >
                <ToneAvatar name={u.name} tone={u.tone} size={16} round />
                <span className="truncate">{u.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${u.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(u.id, false);
                  }}
                  className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] text-pg-faint motion-tap hover:bg-pg-surface hover:text-pg-text-strong"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))}
            {chosen.length > 2 ? (
              <span className="shrink-0 text-[13px] leading-[18px] font-medium text-pg-muted">
                +{chosen.length - 2}
              </span>
            ) : null}
          </span>
        )}
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </div>

      {anchor ? (
        <FloatingMenu anchor={anchor} onClose={() => setAnchor(null)} className="max-h-[320px]">
          <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
            <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users"
              aria-label="Search users"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
          <div id={listId} role="listbox" aria-multiselectable="true" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
            {shown.length === 0 ? (
              <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                No users match &ldquo;{query}&rdquo;
              </p>
            ) : null}
            {shown.map((u) => {
              const on = value.includes(u.id);
              const home = homeOf(u.id, views);
              const elsewhere = home && home.id !== exceptViewId ? home : null;
              return (
                <div
                  key={u.id}
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(u.id, !on)}
                  className="flex w-full cursor-pointer items-center gap-[10px] rounded-[6px] px-[10px] py-[6px] motion-tap hover:bg-pg"
                >
                  <Checkbox checked={on} onChange={(next) => toggle(u.id, next)} />
                  <ToneAvatar name={u.name} tone={u.tone} size={24} round />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] leading-[20px] text-pg-text-strong">
                      {u.name}
                    </span>
                    <span className="truncate text-[12px] leading-[16px] text-pg-muted">
                      {u.email}
                    </span>
                  </span>
                  {elsewhere ? (
                    <span className="max-w-[120px] shrink-0 truncate text-[12px] leading-[16px] text-pg-faint">
                      In {elsewhere.name}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center justify-between border-t border-pg-head-border px-[12px] py-[8px] text-[13px] leading-[18px]">
            <span className="text-pg-muted">{value.length} selected</span>
            {value.length > 0 ? (
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-medium text-brand motion-tap hover:underline"
              >
                Clear all
              </button>
            ) : null}
          </div>
        </FloatingMenu>
      ) : null}
    </>
  );
}

/* ─── Create / rename / duplicate ───────────────────────────────────────── */

const TITLE = { create: "Create view", rename: "Rename view", duplicate: "Duplicate view" };

/**
 * One modal, three jobs. Create and duplicate both assign users; duplicate
 * also copies the source's layout. Rename is the name field alone, and its
 * Save stays off until the name actually changes.
 */
export function ViewNameModal({
  mode,
  view,
  onClose,
  onDone,
}: {
  mode: "create" | "rename" | "duplicate";
  view?: DetailView;
  onClose: () => void;
  onDone?: (view: DetailView) => void;
}) {
  const views = useDetailViews();
  const [name, setName] = React.useState(() =>
    mode === "rename" ? (view?.name ?? "") : mode === "duplicate" && view ? `${view.name} copy` : "",
  );
  const [userIds, setUserIds] = React.useState<string[]>([]);
  const trimmed = name.trim();
  const canSubmit = trimmed !== "" && (mode !== "rename" || trimmed !== view?.name);

  const submit = () => {
    if (!canSubmit) return;
    if (mode === "rename" && view) {
      renameView(view.id, trimmed);
      showToast("View renamed.");
      onDone?.({ ...view, name: trimmed });
    } else {
      const created = createView(trimmed, userIds, mode === "duplicate" ? view?.id : undefined);
      showToast(mode === "duplicate" ? "View duplicated." : "View created.");
      onDone?.(created);
    }
    onClose();
  };

  return (
    <Modal
      width={560}
      title={TITLE[mode]}
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <ModalFooter>
          <OutlineButton onClick={onClose} className={BTN}>
            Cancel
          </OutlineButton>
          <PrimaryButton disabled={!canSubmit} onClick={submit} className={cn(BTN, DISABLED)}>
            {mode === "rename" ? "Save" : "Create"}
          </PrimaryButton>
        </ModalFooter>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-[4px]"
      >
        <FieldLabel htmlFor="view-name" required>
          Name
        </FieldLabel>
        <TextInput
          id="view-name"
          autoFocus
          value={name}
          maxLength={60}
          placeholder="Enter a name for your view"
          onChange={(e) => setName(e.target.value)}
        />
      </form>

      {mode !== "rename" ? (
        <div className="flex flex-col gap-[4px]">
          <FieldLabel>Assign user(s)</FieldLabel>
          <UserMultiSelect value={userIds} onChange={setUserIds} views={views} />
          <p className="text-[13px] leading-[18px] text-pg-muted">
            A user can be in only one view. If removed, they return to the default view.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

/* ─── Manage users ──────────────────────────────────────────────────────── */

type UsersTab = "groups" | "admins" | "users";

const ADMIN_GROUPS: UserGroup[] = ["account-admin", "agency-admin"];

/** The small rounded dropdown in each "Assigned view" cell. */
function ViewPill({
  value,
  views,
  onChange,
  label,
}: {
  value: string;
  views: DetailView[];
  onChange: (viewId: string) => void;
  label: string;
}) {
  const [anchor, setAnchor] = React.useState<Anchor | null>(null);
  const current = views.find((v) => v.id === value) ?? views.find((v) => v.isDefault);

  return (
    <>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        aria-label={`Assigned view for ${label}`}
        onClick={(e) => setAnchor(anchor ? null : anchorOf(e.currentTarget, 220))}
        className={cn(
          "flex h-[26px] max-w-[200px] items-center gap-[4px] rounded-full bg-pg-surface pr-[8px] pl-[10px] text-[13px] leading-[18px] text-pg-text-strong motion-tap",
          anchor
            ? "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]"
            : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        <span className="truncate">{current?.name}</span>
        <ChevronDown size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {anchor ? (
        <FloatingMenu anchor={anchor} minWidth={200} onClose={() => setAnchor(null)}>
          <div role="listbox" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
            {views.map((v) => {
              const on = v.id === current?.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(v.id);
                    setAnchor(null);
                  }}
                  className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                      on ? "font-medium text-pg-heading" : "text-pg-text",
                    )}
                  >
                    {v.name}
                  </span>
                  {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
                </button>
              );
            })}
          </div>
        </FloatingMenu>
      ) : null}
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="h-[40px] px-[14px] text-left text-[14px] leading-[20px] font-medium text-pg-heading">
      {children}
    </th>
  );
}

/**
 * Who sees which view — by group, then person by person.
 *
 * Groups are the fallback: a group points at a view, and its members see it
 * unless they are assigned one directly. The Admin(s) and User(s) tabs are
 * those direct assignments, and moving a pill moves the person, since a user
 * sits in one view only.
 *
 * Opened from a card, that card's people come first and carry a tint, so the
 * drawer answers the question it was opened with before the rest of the
 * roster. The order is fixed at open — rows do not jump as pills change.
 */
export function ManageViewUsersDrawer({
  view,
  onClose,
}: {
  view: DetailView | null;
  onClose: () => void;
}) {
  const views = useDetailViews();
  const savedGroups = useGroupViews();
  const [tab, setTab] = React.useState<UsersTab>("groups");

  const defaultId = views.find((v) => v.isDefault)?.id ?? "default";

  // The committed assignment, per user — the default view for anyone not placed.
  const saved = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of USERS) map[u.id] = homeOf(u.id, views)?.id ?? defaultId;
    return map;
  }, [views, defaultId]);

  const [groups, setGroups] = React.useState(() => ({ ...savedGroups }));
  const [assigned, setAssigned] = React.useState<Record<string, string>>(() => ({ ...saved }));

  const [{ order, highlight }] = React.useState(() => {
    const mine = new Set(
      view
        ? USERS.filter((u) =>
            view.isDefault ? !homeOf(u.id, views) : view.userIds.includes(u.id),
          ).map((u) => u.id)
        : [],
    );
    return {
      order: [...USERS.filter((u) => mine.has(u.id)), ...USERS.filter((u) => !mine.has(u.id))],
      highlight: mine,
    };
  });

  const dirty =
    USER_GROUPS.some((g) => groups[g.id] !== savedGroups[g.id]) ||
    USERS.some((u) => assigned[u.id] !== saved[u.id]);

  const save = () => {
    saveGroupViews(groups);
    // Only re-stamp the views whose membership actually moved.
    const touched = new Set<string>();
    for (const u of USERS) {
      if (assigned[u.id] === saved[u.id]) continue;
      touched.add(assigned[u.id]);
      touched.add(saved[u.id]);
    }
    for (const v of views) {
      if (v.isDefault || !touched.has(v.id)) continue;
      setViewUsers(
        v.id,
        USERS.filter((u) => assigned[u.id] === v.id).map((u) => u.id),
      );
    }
    showToast("User assignments saved.");
    onClose();
  };

  const tabs: { id: UsersTab; label: string }[] = [
    { id: "groups", label: "Groups" },
    { id: "admins", label: "Admin(s)" },
    { id: "users", label: "User(s)" },
  ];

  const people = order.filter((u) =>
    tab === "admins" ? ADMIN_GROUPS.includes(u.group) : !ADMIN_GROUPS.includes(u.group),
  );

  return (
    <SideDrawer
      width={720}
      onClose={onClose}
      title={
        <span className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
          {view ? `Manage users for ${view.name}` : "Manage all users"}
        </span>
      }
      bodyClassName="px-[16px] pb-[16px]"
      footer={
        <div className="flex flex-1 justify-end gap-[12px] py-[2px]">
          <OutlineButton onClick={onClose} className={BTN}>
            Cancel
          </OutlineButton>
          <PrimaryButton disabled={!dirty} onClick={save} className={cn(BTN, DISABLED)}>
            Save
          </PrimaryButton>
        </div>
      }
    >
      <div
        role="tablist"
        aria-label="Assign by"
        className="sticky top-0 z-[1] flex gap-[24px] border-b border-pg-head-border bg-pg-surface pt-[12px]"
      >
        {tabs.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative shrink-0 px-[2px] pb-[8px] text-[14px] leading-[20px] whitespace-nowrap motion-tap",
                on ? "font-medium text-brand" : "text-pg-text hover:text-pg-heading",
              )}
            >
              {t.label}
              {on ? (
                <span className="absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full bg-brand" />
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="pt-[16px] pb-[12px] text-[13px] leading-[18px] text-pg-muted">
        {tab === "groups"
          ? "Users in this group will see the selected view unless another view is explicitly assigned to them."
          : "A user can be in only one view. Assigning them here moves them out of any other view."}
      </p>

      <div className="overflow-hidden rounded-[8px] border border-pg-border">
        <table className="w-full border-collapse">
          <thead className="bg-pg">
            <tr>
              {tab === "groups" ? <Th>Group</Th> : <Th>{tab === "admins" ? "Admin" : "User"}</Th>}
              <Th>Assigned view</Th>
            </tr>
          </thead>
          <tbody>
            {tab === "groups"
              ? USER_GROUPS.map((g) => (
                  <tr key={g.id} className="border-t border-pg-row-border">
                    <td className="h-[44px] w-1/2 px-[14px] text-[14px] leading-[20px] text-pg-text-strong">
                      {g.label}
                    </td>
                    <td className="px-[14px]">
                      <ViewPill
                        label={g.label}
                        value={groups[g.id]}
                        views={views}
                        onChange={(id) => setGroups((prev) => ({ ...prev, [g.id]: id }))}
                      />
                    </td>
                  </tr>
                ))
              : people.map((u) => (
                  <tr
                    key={u.id}
                    className={cn(
                      "border-t border-pg-row-border",
                      highlight.has(u.id) && "bg-[color-mix(in_oklab,var(--brand)_5%,var(--pg-surface))]",
                    )}
                  >
                    <td className="w-1/2 px-[14px] py-[8px]">
                      <span className="flex min-w-0 items-center gap-[10px]">
                        <ToneAvatar name={u.name} tone={u.tone} size={28} round />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-[14px] leading-[20px] text-pg-text-strong">
                            {u.name}
                          </span>
                          <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                            {u.email}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-[14px]">
                      <ViewPill
                        label={u.name}
                        value={assigned[u.id]}
                        views={views}
                        onChange={(id) => setAssigned((prev) => ({ ...prev, [u.id]: id }))}
                      />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </SideDrawer>
  );
}
