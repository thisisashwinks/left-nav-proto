"use client";

import * as React from "react";
import {
  CirclePlus,
  Clock,
  Copy,
  EllipsisVertical,
  Pencil,
  Plus,
  SquarePen,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { StatusTag } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  deleteView,
  MAX_VIEWS,
  useDetailViews,
  useObjectNames,
  userCount,
  usersOfView,
  type DetailView,
} from "./object-settings-store";
import { ManageViewUsersDrawer, ViewNameModal } from "./view-modals";

/**
 * Customize contact detail view — the cards for each saved layout.
 *
 * The Add view tile leads the grid and the views follow in the order they
 * were made, so the default always sits first after it. Everything a card
 * can do is in its kebab; the one shortcut outside it is the circle-plus
 * beside the avatars, because "who sees this?" is the question the card is
 * most often opened to answer.
 */

type Dialog =
  | { kind: "create" }
  | { kind: "rename" | "duplicate" | "delete"; view: DetailView }
  | { kind: "users"; view: DetailView | null };

/** How many faces a card shows before it counts the rest. */
const FACES = 4;

export function DetailViewsTab({ onEditView }: { onEditView: (id: string) => void }) {
  const names = useObjectNames();
  const views = useDetailViews();
  const [dialog, setDialog] = React.useState<Dialog | null>(null);
  const close = React.useCallback(() => setDialog(null), []);
  const full = views.length >= MAX_VIEWS;

  return (
    <section className="flex min-h-full w-full flex-1 flex-col gap-[16px] rounded-[12px] bg-pg-surface p-[24px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="flex items-start gap-[16px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            {names.singular} details view
          </h2>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Build up to {MAX_VIEWS} custom {names.singular} views for a cleaner, more focused user
            experience.
          </p>
        </div>
        <OutlineButton
          onClick={() => setDialog({ kind: "users", view: null })}
          className="h-[36px] text-[14px] text-brand shadow-[inset_0_0_0_1px_var(--brand)] hover:shadow-[inset_0_0_0_1px_var(--brand),0_1px_3px_0_rgba(15,23,42,0.06)]"
        >
          <Users size={16} aria-hidden="true" />
          Manage all users
        </OutlineButton>
      </div>

      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          disabled={full}
          title={full ? `You can build up to ${MAX_VIEWS} views. Delete one to add another.` : undefined}
          onClick={() => setDialog({ kind: "create" })}
          className={cn(
            "group flex min-h-[124px] flex-col items-center justify-center gap-[10px] rounded-[12px] border border-dashed border-pg-border-strong px-[16px] py-[20px] text-center motion-tap",
            full ? "cursor-not-allowed opacity-60" : "hover:border-brand hover:bg-pg",
          )}
        >
          <span
            className={cn(
              "flex size-[40px] items-center justify-center rounded-full bg-pg-surface text-brand shadow-[inset_0_0_0_1px_var(--pg-border)]",
              !full && "group-hover:shadow-[inset_0_0_0_1px_var(--brand)]",
            )}
          >
            <Plus size={20} aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-[2px]">
            <span className="text-[16px] leading-[22px] font-medium text-pg-text">Add view</span>
            {full ? (
              <span className="text-[13px] leading-[18px] text-pg-muted">
                You&rsquo;ve reached the limit of {MAX_VIEWS} views.
              </span>
            ) : null}
          </span>
        </button>

        {views.map((v) => (
          <ViewCard
            key={v.id}
            view={v}
            all={views}
            onEdit={() => onEditView(v.id)}
            onRename={() => setDialog({ kind: "rename", view: v })}
            onUsers={() => setDialog({ kind: "users", view: v })}
            onDuplicate={() => setDialog({ kind: "duplicate", view: v })}
            onDelete={() => setDialog({ kind: "delete", view: v })}
            canDuplicate={!full}
          />
        ))}
      </div>

      {dialog?.kind === "create" ? <ViewNameModal mode="create" onClose={close} /> : null}
      {dialog?.kind === "rename" || dialog?.kind === "duplicate" ? (
        <ViewNameModal mode={dialog.kind} view={dialog.view} onClose={close} />
      ) : null}
      {dialog?.kind === "users" ? <ManageViewUsersDrawer view={dialog.view} onClose={close} /> : null}
      {dialog?.kind === "delete" ? (
        <DeleteViewModal view={dialog.view} count={userCount(dialog.view, views)} onClose={close} />
      ) : null}
    </section>
  );
}

function ViewCard({
  view,
  all,
  onEdit,
  onRename,
  onUsers,
  onDuplicate,
  onDelete,
  canDuplicate,
}: {
  view: DetailView;
  all: DetailView[];
  onEdit: () => void;
  onRename: () => void;
  onUsers: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDuplicate: boolean;
}) {
  const people = usersOfView(view, all);
  const total = userCount(view, all);
  const faces = people.slice(0, FACES);
  const more = total - faces.length;

  return (
    <article className="flex min-h-[124px] min-w-0 flex-col rounded-[12px] bg-pg-surface px-[16px] pt-[12px] pb-[14px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="flex items-center gap-[8px] border-b border-pg-head-border pb-[10px]">
        <h3 className="min-w-0 truncate text-[16px] leading-[22px] font-medium text-pg-heading">
          {view.name}
        </h3>
        {view.isDefault ? <StatusTag tone="brand">Default</StatusTag> : null}
        <span className="flex-1" />
        <CardMenu
          name={view.name}
          items={[
            { label: "Edit view", icon: SquarePen, onClick: onEdit },
            { label: "Rename", icon: Pencil, onClick: onRename },
            { label: "Manage users", icon: Users, onClick: onUsers },
            {
              label: "Duplicate view",
              icon: Copy,
              onClick: onDuplicate,
              disabled: !canDuplicate,
              hint: canDuplicate ? undefined : `You can build up to ${MAX_VIEWS} views.`,
            },
            {
              label: "Delete view",
              icon: Trash2,
              onClick: onDelete,
              danger: true,
              disabled: view.isDefault,
              hint: view.isDefault ? "The default view can't be deleted." : undefined,
            },
          ]}
        />
      </div>

      <div className="flex flex-col gap-[8px] pt-[12px] text-[14px] leading-[20px]">
        <p className="flex items-center gap-[6px] text-pg-muted">
          <Clock size={15} aria-hidden="true" className="shrink-0" />
          Last updated:
          <span className="font-semibold text-pg-heading">{view.updatedAt}</span>
        </p>
        <div className="flex items-center gap-[6px] text-pg-muted">
          <Users size={15} aria-hidden="true" className="shrink-0" />
          <span>User(s):</span>
          {faces.length > 0 ? (
            <span className="flex items-center pl-[2px]" aria-label={people.map((p) => p.name).join(", ")}>
              {faces.map((u, i) => (
                <span
                  key={u.id}
                  title={u.name}
                  className={cn("flex rounded-full ring-2 ring-[var(--pg-surface)]", i > 0 && "-ml-[4px]")}
                >
                  <ToneAvatar name={u.name} tone={u.tone} size={26} round />
                </span>
              ))}
            </span>
          ) : total === 0 ? (
            <span className="text-pg-faint">None</span>
          ) : null}
          {more > 0 ? (
            <span className="text-pg-text">+{more.toLocaleString("en-US")}</span>
          ) : null}
          <button
            type="button"
            aria-label={`Manage users for ${view.name}`}
            title="Manage users"
            onClick={onUsers}
            className="flex size-[24px] shrink-0 items-center justify-center rounded-full text-pg-muted motion-tap hover:bg-pg hover:text-brand active:scale-90"
          >
            <CirclePlus size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

interface CardAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Why a disabled row is disabled — shown on hover. */
  hint?: string;
}

/** The card's kebab — the header's OverflowMenu shape, with disabled rows. */
function CardMenu({ name, items }: { name: string; items: CardAction[] }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading active:scale-90",
          open && "bg-pg text-pg-heading",
        )}
      >
        <EllipsisVertical size={16} aria-hidden="true" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label={`Actions for ${name}`}
            className="absolute top-[calc(100%+4px)] right-0 z-40 w-[200px] rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                title={item.hint}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] motion-tap",
                  item.disabled
                    ? "cursor-not-allowed text-pg-disabled"
                    : item.danger
                      ? "text-pg-danger hover:bg-pg"
                      : "text-pg-text hover:bg-pg",
                )}
              >
                <item.icon
                  size={15}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0",
                    item.disabled ? "" : item.danger ? "text-pg-danger" : "text-pg-muted",
                  )}
                />
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function DeleteViewModal({
  view,
  count,
  onClose,
}: {
  view: DetailView;
  count: number;
  onClose: () => void;
}) {
  return (
    <Modal
      width={480}
      onClose={onClose}
      title={
        <span className="flex items-center gap-[10px]">
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--pg-danger)_12%,transparent)] text-pg-danger">
            <Trash2 size={16} aria-hidden="true" />
          </span>
          <span className="min-w-0 break-words">Delete &ldquo;{view.name}&rdquo;?</span>
        </span>
      }
      footer={
        <div className="-mx-[16px] flex flex-1 justify-end gap-[12px] border-t border-pg-head-border px-[16px] pt-[16px]">
          <OutlineButton onClick={onClose} className="h-[36px] text-[14px]">
            Cancel
          </OutlineButton>
          <button
            type="button"
            onClick={() => {
              deleteView(view.id);
              showToast(`${view.name} deleted.`);
              onClose();
            }}
            className="motion-tap flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-danger px-[16px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white hover:brightness-110 active:scale-[0.97]"
          >
            Delete view
          </button>
        </div>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        {count > 0
          ? `Its ${count.toLocaleString("en-US")} ${count === 1 ? "user returns" : "users return"} to the default view, and the layout is removed. This can't be undone.`
          : "The layout is removed. Anyone assigned later sees the default view. This can't be undone."}
      </p>
    </Modal>
  );
}
