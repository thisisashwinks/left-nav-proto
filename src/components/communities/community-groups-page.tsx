"use client";

import * as React from "react";
import { ChevronDown, Pencil, Plus, Upload } from "lucide-react";
import { PageHeader, PrimaryButton, OutlineButton } from "@/components/page/page-header";
import { Modal } from "@/components/page/modal";
import { Select, TextInput } from "@/components/page/form-controls";
import { showToast } from "@/components/page/toast";
import { usePrototypeEmpty } from "@/components/page/empty-state-axis";
import { useTheme } from "@/components/theme/theme-provider";
import {
  CommunityIllustration,
  FaceAvatar,
  GroupCoverArt,
  RingsAvatar,
} from "@/components/communities/group-art";
import {
  addGroup,
  OWNERS,
  updateGroup,
  useGroups,
  type CommunityGroup,
  type GroupCover,
  type GroupPrivacy,
  type GroupStatus,
} from "@/components/communities/groups-store";
import { cn } from "@/lib/utils";

type StatusFilter = GroupStatus | "all";

const FILTER_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

const STATUS_LABEL: Record<GroupStatus, string> = { active: "Active", inactive: "Inactive" };

/**
 * Creator Hub ▸ Communities ▸ Groups.
 *
 * Empty when the prototype's Empty state toggle is on, or when the account
 * genuinely has no groups. Creating a group while the toggle is on still
 * writes it to the store (and toasts) — but the grid keeps showing the empty
 * state, because the toggle means "render as a brand-new account" and wins
 * over the data. Switch it off to see the new group.
 */
export function CommunityGroupsPage() {
  const empty = usePrototypeEmpty("community-groups");
  const { effective } = useTheme();
  const stored = useGroups();
  const groups = empty ? [] : stored;
  const [filter, setFilter] = React.useState<StatusFilter>("active");
  const [creating, setCreating] = React.useState(false);
  const [ownerFor, setOwnerFor] = React.useState<CommunityGroup | null>(null);

  const shown = filter === "all" ? groups : groups.filter((g) => g.status === filter);
  const isEmpty = groups.length === 0;

  const changeStatus = (group: CommunityGroup, status: GroupStatus) => {
    if (status === group.status) return;
    updateGroup(group.id, { status });
    showToast(status === "inactive" ? "Group set to inactive" : "Group set to active");
  };

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[16px] px-[var(--page-inset)]"
    >
      {/* The screenshot's empty header is title-only: the CTA lives in the canvas. */}
      {isEmpty ? (
        <PageHeader title="Community groups" />
      ) : (
        <PageHeader
          title="Community groups"
          aside={
            <Select
              aria-label="Filter by status"
              value={filter}
              options={FILTER_OPTIONS}
              onChange={(v) => setFilter(v as StatusFilter)}
              className="w-[132px]"
            />
          }
          primary={{ label: "Create group", icon: Plus, onClick: () => setCreating(true) }}
        />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto pb-[24px]">
        {isEmpty ? (
          <EmptyGroups onCreate={() => setCreating(true)} />
        ) : shown.length === 0 ? (
          <p className="rounded-[12px] bg-pg-surface px-[16px] py-[40px] text-center text-[13px] leading-[18px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            No {filter === "inactive" ? "inactive" : "active"} groups
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2 xl:grid-cols-3">
            {shown.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                onEditOwner={() => setOwnerFor(g)}
                onStatus={(s) => changeStatus(g, s)}
              />
            ))}
          </div>
        )}
      </div>

      {creating ? <CreateGroupModal onClose={() => setCreating(false)} /> : null}
      {ownerFor ? <ChangeOwnerModal group={ownerFor} onClose={() => setOwnerFor(null)} /> : null}
    </div>
  );
}

function EmptyGroups({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-[12px] px-[16px] py-[48px] text-center">
      <CommunityIllustration />
      <h2 className="mt-[12px] text-[16px] leading-[22px] font-semibold text-pg-heading">
        You don&apos;t have a community yet
      </h2>
      <p className="max-w-[620px] text-[14px] leading-[20px] text-pg-muted">
        Connect with others by creating your own community space! Here, you can share insights,
        discuss ideas, and build connections with people who share your interests.
      </p>
      <PrimaryButton className="mt-[8px] h-[36px]" onClick={onCreate}>
        Create a community
      </PrimaryButton>
    </div>
  );
}

function GroupCard({
  group,
  onEditOwner,
  onStatus,
}: {
  group: CommunityGroup;
  onEditOwner: () => void;
  onStatus: (s: GroupStatus) => void;
}) {
  return (
    // No overflow-hidden on the card itself: the status menu has to escape it.
    <article className="flex flex-col rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.04)]">
      <div className="relative">
        <div className="h-[200px] overflow-hidden rounded-t-[12px]">
          <GroupCoverArt cover={group.cover} />
        </div>
        <div className="absolute bottom-0 left-1/2 size-[110px] -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-full shadow-[0_0_0_4px_var(--pg-surface),0_4px_10px_-2px_rgba(16,24,40,0.18)]">
          {group.avatar === "face" ? <FaceAvatar /> : <RingsAvatar />}
        </div>
      </div>

      <div className="flex flex-col gap-[14px] px-[20px] pt-[70px] pb-[20px]">
        <h3 className="truncate text-center text-[16px] leading-[22px] font-semibold text-pg-heading">
          {group.name}
        </h3>

        <dl className="flex flex-col gap-[10px] text-[14px] leading-[20px]">
          <Row label="Members">
            <span className="font-semibold text-pg-heading">{group.members.toLocaleString("en-US")}</span>
          </Row>
          <Row label="Owner">
            <button
              type="button"
              onClick={onEditOwner}
              className="motion-tap flex items-center gap-[6px] font-medium text-brand hover:underline"
            >
              {group.owner}
              <Pencil size={13} aria-hidden="true" />
              <span className="sr-only">Change owner</span>
            </button>
          </Row>
          <Row label="Status">
            <StatusMenu status={group.status} onChange={onStatus} />
          </Row>
        </dl>

        <PrimaryButton
          className="mt-[4px] h-[36px] self-center px-[28px]"
          onClick={() => showToast(`Opening ${group.name} as admin…`)}
        >
          Login
        </PrimaryButton>
      </div>
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[12px]">
      <dt className="text-pg-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/** Brand text that opens a two-item menu — the card's inline status switch. */
function StatusMenu({ status, onChange }: { status: GroupStatus; onChange: (s: GroupStatus) => void }) {
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
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status: ${STATUS_LABEL[status]}`}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex items-center gap-[4px] font-medium text-brand"
      >
        {STATUS_LABEL[status]}
        <ChevronDown size={14} aria-hidden="true" className={cn("motion-move", open && "rotate-180")} />
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
            className="absolute top-[calc(100%+6px)] right-0 z-40 w-[140px] rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {(["active", "inactive"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="menuitemradio"
                aria-checked={s === status}
                onClick={() => {
                  setOpen(false);
                  onChange(s);
                }}
                className={cn(
                  "motion-tap flex w-full rounded-[6px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] hover:bg-pg",
                  s === status ? "font-medium text-pg-heading" : "text-pg-text",
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ChangeOwnerModal({ group, onClose }: { group: CommunityGroup; onClose: () => void }) {
  const [owner, setOwner] = React.useState(group.owner);
  return (
    <Modal
      title="Change owner"
      width={420}
      onClose={onClose}
      footer={
        <>
          <OutlineButton className="h-[36px]" onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton
            className="h-[36px]"
            onClick={() => {
              updateGroup(group.id, { owner });
              showToast(`${owner} now owns ${group.name}`);
              onClose();
            }}
          >
            Save changes
          </PrimaryButton>
        </>
      }
    >
      <Field label="Owner">
        <Select
          aria-label="Owner"
          value={owner}
          options={OWNERS.map((o) => ({ value: o, label: o }))}
          onChange={setOwner}
        />
      </Field>
    </Modal>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
        {label}
        {hint ? <span className="font-normal text-pg-muted"> {hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

function RadioRow<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex items-center gap-[20px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="motion-tap flex items-center gap-[8px] text-[14px] leading-[20px] text-pg-text"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-[16px] items-center justify-center rounded-full",
                on ? "bg-brand" : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
              )}
            >
              {on ? <span className="size-[6px] rounded-full bg-brand-fg" /> : null}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [privacy, setPrivacy] = React.useState<GroupPrivacy>("public");
  const [coverMode, setCoverMode] = React.useState<"default" | "upload">("default");
  const [upload, setUpload] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);
  const nameError = touched && name.trim() === "";

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUpload(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const create = () => {
    setTouched(true);
    if (name.trim() === "") return;
    const cover: GroupCover =
      coverMode === "upload" && upload ? { kind: "upload", src: upload } : { kind: "default" };
    addGroup({ name: name.trim(), description: description.trim(), privacy, cover });
    showToast(`${name.trim()} created`);
    onClose();
  };

  return (
    <Modal
      title="Create group"
      width={520}
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton className="h-[36px]" onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton className="h-[36px]" onClick={create}>
            Create group
          </PrimaryButton>
        </>
      }
    >
      <Field label="Group name">
        <TextInput
          autoFocus
          value={name}
          placeholder="e.g. Agency growth circle"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
          aria-invalid={nameError}
          className={cn(nameError && "shadow-[inset_0_0_0_1px_var(--hr-error-500)]")}
        />
        {nameError ? (
          <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">Add a group name.</span>
        ) : null}
      </Field>

      <Field label="Description" hint="(optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What is this group about?"
          className="w-full resize-none rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
        />
      </Field>

      <Field label="Privacy">
        <RadioRow
          name="Privacy"
          value={privacy}
          onChange={setPrivacy}
          options={[
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
          ]}
        />
      </Field>

      <Field label="Cover">
        <RadioRow
          name="Cover"
          value={coverMode}
          onChange={setCoverMode}
          options={[
            { value: "default", label: "Default gradient" },
            { value: "upload", label: "Upload" },
          ]}
        />
        <div className="mt-[8px] h-[120px] overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          {coverMode === "upload" && !upload ? (
            <label className="motion-tap flex size-full cursor-pointer flex-col items-center justify-center gap-[6px] bg-pg text-[13px] leading-[18px] text-pg-muted hover:text-pg-text">
              <Upload size={18} aria-hidden="true" />
              Choose an image
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </label>
          ) : (
            <GroupCoverArt
              cover={coverMode === "upload" && upload ? { kind: "upload", src: upload } : { kind: "default" }}
            />
          )}
        </div>
        {coverMode === "upload" && upload ? (
          <button
            type="button"
            onClick={() => setUpload(null)}
            className="motion-tap self-start text-[13px] leading-[18px] font-medium text-brand"
          >
            Replace image
          </button>
        ) : null}
      </Field>
    </Modal>
  );
}
