"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Mail,
  MessageCircle,
  MessageSquareText,
  MoveDownLeft,
  Plus,
  Smartphone,
  SquarePen,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useCustomFields } from "@/components/custom-fields/custom-fields-data";
import { Checkbox, StatusTag } from "@/components/page/form-controls";
import { OutlineButton } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import type { Contact } from "./contacts-data";
import { useRecordSlice } from "./record-store";
import { USERS, userById } from "./settings/object-settings-store";
import {
  TAG_POOL,
  engagementScore,
  formatCreatedOn,
  seedRecordCard,
  type RecordCardState,
} from "./contact-record-data";
import { AllFieldsPane, OwnAccordion, type Patch } from "./contact-record-fields";
import { UserPicker, anchorOf, type Anchor } from "./contact-record-popover";
import { ContactRecordDeleteModal } from "./contact-record-delete-modal";

/**
 * The contact's own column: who it is, who owns it, its tags, and three cuts
 * of its data — every field, its DND, and the actions it is enrolled in.
 *
 * The record lives in record-store keyed by contact id, so an edit survives
 * paging to the next contact and back. Local UI state (open folders, the
 * current tab) is keyed on the id too, and resets per contact.
 */
export function ContactRecordCard({
  contact,
  heading,
  onDelete,
}: {
  contact: Contact;
  heading: React.ReactNode;
  onDelete: () => void;
}) {
  const { fields } = useCustomFields();
  const [state, setState] = useRecordSlice<RecordCardState>(contact.id, "record-card", () =>
    seedRecordCard(
      contact.id,
      fields.filter((f) => f.object === "contact"),
    ),
  );
  const patch: Patch = (fn) => setState(fn(state));
  const [deleting, setDeleting] = React.useState(false);

  return (
    <aside className="flex w-[340px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="shrink-0 px-[16px] pb-[10px]">{heading}</div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[16px] pb-[16px]">
        <CardBody
          key={contact.id}
          contact={contact}
          state={state}
          patch={patch}
          onAskDelete={() => setDeleting(true)}
        />
      </div>

      {/* Fixed under the scroll: provenance does not move with the fields. */}
      <footer className="flex shrink-0 flex-col gap-[4px] border-t border-pg-head-border px-[16px] pt-[10px] pb-[12px]">
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Created by: <span className="text-brand">CSV import</span>
        </p>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Created on: {formatCreatedOn(contact.created, contact.id)}
        </p>
        <OutlineButton
          className="mt-[6px] w-full justify-center"
          onClick={() => showToast("Audit logs open in a new tab")}
        >
          Audit logs
          <ExternalLink size={14} aria-hidden="true" />
        </OutlineButton>
      </footer>

      {deleting ? (
        <ContactRecordDeleteModal
          contact={contact}
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            setDeleting(false);
            onDelete();
          }}
        />
      ) : null}
    </aside>
  );
}

type Pane = "fields" | "dnd" | "actions";

function CardBody({
  contact,
  state,
  patch,
  onAskDelete,
}: {
  contact: Contact;
  state: RecordCardState;
  patch: Patch;
  onAskDelete: () => void;
}) {
  const [pane, setPane] = React.useState<Pane>("fields");
  const score = engagementScore(contact.id);

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex flex-col gap-[14px] rounded-[8px] p-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <div className="flex items-center gap-[10px]">
          <ToneAvatar name={contact.name} tone={contact.tone} size={36} round />
          <span
            title={contact.name}
            className="min-w-0 flex-1 truncate text-[16px] leading-[22px] font-semibold text-pg-heading"
          >
            {contact.name}
          </span>
          <ScoreBadge score={score} />
          <button
            type="button"
            aria-label="Delete contact"
            title="Delete contact"
            onClick={onAskDelete}
            className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-danger"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="flex gap-[12px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <span className="text-[14px] leading-[20px] text-pg-text">Owner</span>
            <OwnerControl state={state} patch={patch} />
          </div>
          <div className="flex shrink-0 flex-col gap-[4px]">
            <span className="text-[14px] leading-[20px] text-pg-text">Followers</span>
            <FollowersControl state={state} patch={patch} />
          </div>
        </div>

        <Tags state={state} patch={patch} />
      </div>

      {/*
        Three cuts of the record's own data. They stay inside the card they
        re-cut, which is why they are not in the view bar upstairs.
      */}
      <div
        role="tablist"
        aria-label="Record fields"
        className="flex shrink-0 overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
      >
        {(
          [
            ["fields", "All fields"],
            ["dnd", "DND"],
            ["actions", "Actions"],
          ] as const
        ).map(([id, label], i) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pane === id}
            onClick={() => setPane(id)}
            className={cn(
              "h-[32px] flex-1 text-[14px] leading-none motion-tap",
              i > 0 && "border-l border-pg-head-border",
              pane === id
                ? "bg-pg font-medium text-pg-heading"
                : "text-pg-text hover:text-pg-heading",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {pane === "fields" ? <AllFieldsPane state={state} patch={patch} /> : null}
      {pane === "dnd" ? <DndPane state={state} patch={patch} /> : null}
      {pane === "actions" ? (
        <ActionsPane contact={contact} state={state} patch={patch} score={score} />
      ) : null}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      title="Engagement score"
      className="flex h-[22px] min-w-[26px] shrink-0 items-center justify-center rounded-[6px] bg-brand px-[6px] text-[13px] leading-none font-semibold text-brand-fg tabular-nums"
    >
      {score}
    </span>
  );
}

/* ─── Owner & followers ─────────────────────────────────────────────────── */

function OwnerControl({ state, patch }: { state: RecordCardState; patch: Patch }) {
  const [menu, setMenu] = React.useState<Anchor | null>(null);
  const owner = state.ownerId ? userById(state.ownerId) : undefined;
  const open = (e: React.MouseEvent<HTMLElement>) =>
    setMenu(anchorOf(e.currentTarget.closest("[data-owner-pill]") ?? e.currentTarget));

  return (
    <>
      <span
        data-owner-pill
        className="flex h-[28px] w-fit max-w-full items-center gap-[6px] rounded-[6px] pr-[4px] pl-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
      >
        <button
          type="button"
          aria-label={owner ? `Owner: ${owner.name}. Change owner` : "Assign owner"}
          onClick={open}
          className="flex min-w-0 items-center gap-[6px] motion-tap"
        >
          {owner ? (
            <ToneAvatar name={owner.name} tone={owner.tone} size={18} round />
          ) : (
            <UserRound size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
          )}
          <span
            className={cn(
              "truncate text-[14px] leading-[20px]",
              owner ? "text-pg-heading" : "text-pg-muted",
            )}
          >
            {owner?.name ?? "Unassigned"}
          </span>
          {owner ? null : (
            <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-pg-muted" />
          )}
        </button>
        {owner ? (
          <button
            type="button"
            aria-label="Remove owner"
            onClick={() => patch((s) => ({ ...s, ownerId: null }))}
            className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] text-pg-faint motion-tap hover:text-pg-heading"
          >
            <X size={13} aria-hidden="true" />
          </button>
        ) : null}
      </span>
      {menu ? (
        <UserPicker
          anchor={menu}
          onClose={() => setMenu(null)}
          selected={state.ownerId ? [state.ownerId] : []}
          onChange={([id]) => patch((s) => ({ ...s, ownerId: id ?? null }))}
        />
      ) : null}
    </>
  );
}

function FollowersControl({ state, patch }: { state: RecordCardState; patch: Patch }) {
  const [menu, setMenu] = React.useState<Anchor | null>(null);
  const followers = state.followerIds
    .map((id) => USERS.find((u) => u.id === id))
    .filter((u) => u !== undefined);
  const shown = followers.slice(0, 3);

  return (
    <>
      <button
        type="button"
        aria-label={`Followers: ${followers.length}`}
        onClick={(e) => setMenu(anchorOf(e.currentTarget))}
        className="flex h-[28px] items-center gap-[6px] rounded-[6px] px-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
      >
        {shown.length === 0 ? (
          <UserRound size={15} aria-hidden="true" />
        ) : (
          <span className="flex items-center">
            {shown.map((u, i) => (
              <span
                key={u.id}
                className={cn("rounded-full ring-2 ring-[var(--pg-surface)]", i > 0 && "-ml-[6px]")}
              >
                <ToneAvatar name={u.name} tone={u.tone} size={18} round />
              </span>
            ))}
            {followers.length > 3 ? (
              <span className="pl-[4px] text-[12px] leading-none font-medium text-pg-text">
                +{followers.length - 3}
              </span>
            ) : null}
          </span>
        )}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {menu ? (
        <UserPicker
          anchor={menu}
          onClose={() => setMenu(null)}
          multiple
          selected={state.followerIds}
          onChange={(ids) => patch((s) => ({ ...s, followerIds: ids }))}
        />
      ) : null}
    </>
  );
}

/* ─── Tags ──────────────────────────────────────────────────────────────── */

const TAGS_SHOWN = 6;

function Tags({ state, patch }: { state: RecordCardState; patch: Patch }) {
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);
  const { tags } = state;
  const q = draft.trim().toLowerCase();
  const suggestions = TAG_POOL.filter((t) => !tags.includes(t) && t.includes(q)).slice(0, 6);
  const shown = expanded ? tags : tags.slice(0, TAGS_SHOWN);
  const hidden = tags.length - TAGS_SHOWN;

  const add = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (!t) return;
    if (!tags.includes(t)) patch((s) => ({ ...s, tags: [t, ...s.tags] }));
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-[8px]">
      <span className="flex items-center gap-[6px]">
        <span className="text-[14px] leading-[20px] text-pg-text">Tags ({tags.length})</span>
        <button
          type="button"
          aria-label="Add tag"
          onClick={() => setAdding(true)}
          className="flex size-[16px] items-center justify-center rounded-full text-brand shadow-[inset_0_0_0_1.25px_var(--brand)] motion-tap hover:bg-brand-soft"
        >
          <Plus size={11} aria-hidden="true" />
        </button>
      </span>

      {adding ? (
        <div className="flex flex-col gap-[4px]">
          <input
            autoFocus
            value={draft}
            placeholder="Add a tag and press Enter"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setAdding(false);
              setDraft("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Escape") {
                e.stopPropagation();
                setAdding(false);
                setDraft("");
              }
            }}
            className="h-[32px] w-full rounded-[6px] bg-pg-surface px-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] placeholder:text-pg-faint focus:outline-none"
          />
          {suggestions.length > 0 ? (
            <div className="flex flex-col rounded-[6px] p-[4px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              {suggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  // mousedown, so the input's blur does not close the list first.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(t);
                  }}
                  className="truncate rounded-[4px] px-[8px] py-[5px] text-left text-[13px] leading-[18px] text-pg-text motion-tap hover:bg-pg"
                >
                  {t}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-[6px]">
          {shown.map((t) => (
            <span
              key={t}
              className="flex h-[24px] max-w-full items-center gap-[4px] rounded-[6px] bg-pg pr-[4px] pl-[8px] text-[13px] leading-none text-pg-text"
            >
              <span className="truncate" title={t}>
                {t}
              </span>
              <button
                type="button"
                aria-label={`Remove tag ${t}`}
                onClick={() => patch((s) => ({ ...s, tags: s.tags.filter((x) => x !== t) }))}
                className="flex size-[16px] shrink-0 items-center justify-center rounded-[4px] text-pg-muted motion-tap hover:text-pg-heading"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[13px] leading-[18px] text-pg-muted">No tags yet</p>
      )}

      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-fit items-center gap-[4px] text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
        >
          {expanded ? "Show less" : `${hidden} more`}
          {expanded ? (
            <ChevronUp size={14} aria-hidden="true" />
          ) : (
            <ChevronDown size={14} aria-hidden="true" />
          )}
        </button>
      ) : null}
    </div>
  );
}

/* ─── DND ───────────────────────────────────────────────────────────────── */

const DND_CHANNELS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "email", label: "Email", icon: <Mail size={16} aria-hidden="true" /> },
  { id: "sms", label: "Text / RCS messages", icon: <MessageSquareText size={16} aria-hidden="true" /> },
  { id: "calls", label: "Calls & voicemail", icon: <Smartphone size={16} aria-hidden="true" /> },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: (
      <MessageCircle
        size={16}
        aria-hidden="true"
        className="text-[var(--hr-success-600)]"
      />
    ),
  },
  { id: "inbound", label: "Inbound Calls and SMS", icon: <MoveDownLeft size={16} aria-hidden="true" /> },
];

function DndPane({ state, patch }: { state: RecordCardState; patch: Patch }) {
  return (
    <OwnAccordion label="DND" defaultOpen>
      <div className="-mx-[16px] -mt-[6px] flex h-[48px] items-center gap-[8px] border-b border-pg-row-border px-[16px]">
        <span className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-heading">
          DND All Channels
        </span>
        <Checkbox
          checked={state.dndAll}
          onChange={(v) => patch((s) => ({ ...s, dndAll: v }))}
        />
      </div>
      <div className="flex items-center gap-[10px] py-[10px]" aria-hidden="true">
        <span className="h-px flex-1 bg-[var(--pg-border)]" />
        <span className="text-[13px] leading-none text-pg-muted">OR</span>
        <span className="h-px flex-1 bg-[var(--pg-border)]" />
      </div>
      <div className="flex flex-col pb-[4px]">
        {DND_CHANNELS.map((c) => {
          // DND all wins over each channel, so the boxes read checked and locked.
          const on = state.dndAll || state.dnd.includes(c.id);
          return (
            <div key={c.id} className="flex h-[34px] items-center gap-[10px]">
              <span className="shrink-0 text-pg-text">{c.icon}</span>
              <span
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-[8px] text-[14px] leading-[20px]",
                  state.dndAll ? "text-pg-muted" : "text-pg-heading",
                )}
              >
                <span className="truncate">{c.label}</span>
                {c.id === "email" ? (
                  <button
                    type="button"
                    onClick={() => showToast("Subscription preferences open in a new tab")}
                    className="flex shrink-0 items-center gap-[4px] font-medium text-brand motion-tap hover:brightness-110"
                  >
                    <SquarePen size={14} aria-hidden="true" />
                    Manage subscriptions
                  </button>
                ) : null}
                {c.id === "inbound" ? (
                  <span className="group relative flex shrink-0">
                    <Info
                      size={14}
                      tabIndex={0}
                      aria-label="About inbound DND"
                      className="text-pg-muted outline-none"
                    />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 w-[220px] -translate-x-[60%] rounded-[6px] bg-pg-overlay px-[10px] py-[6px] text-[12px] leading-[16px] text-pg-overlay-fg opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                    >
                      Blocks inbound calls and SMS from this contact. Replies from your team still go
                      out.
                    </span>
                  </span>
                ) : null}
              </span>
              <Checkbox
                checked={on}
                disabled={state.dndAll}
                onChange={(v) =>
                  patch((s) => ({
                    ...s,
                    dnd: v ? [...s.dnd, c.id] : s.dnd.filter((x) => x !== c.id),
                  }))
                }
              />
            </div>
          );
        })}
      </div>
    </OwnAccordion>
  );
}

/* ─── Actions ───────────────────────────────────────────────────────────── */

function CtaLink({
  children,
  onClick,
  plus = true,
}: {
  children: React.ReactNode;
  onClick: () => void;
  plus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-fit items-center gap-[4px] py-[6px] text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
    >
      {plus ? <Plus size={14} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="pt-[8px] text-[13px] leading-[18px] text-pg-muted">{children}</p>;
}

function ActionsPane({
  contact,
  state,
  patch,
  score,
}: {
  contact: Contact;
  state: RecordCardState;
  patch: Patch;
  score: number;
}) {
  const addOpportunity = () => {
    patch((s) => ({
      ...s,
      opportunities: [
        ...s.opportunities,
        {
          id: `o${Date.now()}`,
          name: `${contact.name} – new deal`,
          stage: "New lead",
          value: 0,
        },
      ],
    }));
    showToast("Opportunity added");
  };
  const band = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";

  return (
    <div className="flex flex-col gap-[12px]">
      <OwnAccordion
        label={`Opportunities (${state.opportunities.length})`}
        defaultOpen
        extra={
          <button
            type="button"
            onClick={addOpportunity}
            className="flex shrink-0 items-center gap-[3px] text-[13px] leading-none font-medium text-brand motion-tap hover:brightness-110"
          >
            <Plus size={14} aria-hidden="true" />
            Add
          </button>
        }
      >
        {state.opportunities.length === 0 ? (
          <Empty>No opportunities yet</Empty>
        ) : (
          state.opportunities.map((o) => (
            <div
              key={o.id}
              className="flex flex-col gap-[2px] border-b border-pg-row-border py-[8px] last:border-b-0"
            >
              <span className="truncate text-[14px] leading-[20px] font-medium text-pg-heading">
                {o.name}
              </span>
              <span className="text-[13px] leading-[18px] text-pg-muted">
                {o.stage} · ${o.value.toLocaleString("en-US")}
              </span>
            </div>
          ))
        )}
      </OwnAccordion>

      <OwnAccordion label={`Workflows (${state.workflows.length})`}>
        {state.workflows.length === 0 ? <Empty>Not in any workflows</Empty> : null}
        {state.workflows.map((w) => (
          <div key={w.id} className="flex items-center gap-[8px] py-[8px]">
            <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-heading">
              {w.name}
            </span>
            <StatusTag tone={w.status === "Active" ? "success" : "neutral"}>{w.status}</StatusTag>
          </div>
        ))}
        <CtaLink onClick={() => showToast("Choose a workflow to add this contact to")}>
          Add to workflow
        </CtaLink>
      </OwnAccordion>

      <OwnAccordion label="Client portal">
        {state.portalInvited ? (
          <>
            <div className="flex items-center gap-[8px] pt-[8px]">
              <span className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-heading">
                Invite sent
              </span>
              <StatusTag tone="warning">Pending</StatusTag>
            </div>
            <CtaLink plus={false} onClick={() => showToast("Invite resent")}>Resend invite</CtaLink>
          </>
        ) : (
          <>
            <Empty>No client portal access yet</Empty>
            <CtaLink
              onClick={() => {
                patch((s) => ({ ...s, portalInvited: true }));
                showToast("Portal invite sent");
              }}
            >
              Send invite
            </CtaLink>
          </>
        )}
      </OwnAccordion>

      <OwnAccordion label="Engagement score" extra={<ScoreBadge score={score} />}>
        <div className="flex flex-col gap-[6px] pt-[8px]">
          <div className="flex items-center justify-between text-[13px] leading-[18px]">
            <span className="text-pg-muted">{band} engagement</span>
            <span className="font-medium text-pg-heading tabular-nums">{score} / 100</span>
          </div>
          <div className="h-[6px] overflow-hidden rounded-full bg-pg">
            <div className="h-full rounded-full bg-brand" style={{ width: `${score}%` }} />
          </div>
        </div>
        <CtaLink plus={false} onClick={() => showToast("Score history opens in a new tab")}>
          View score history
        </CtaLink>
      </OwnAccordion>
    </div>
  );
}
