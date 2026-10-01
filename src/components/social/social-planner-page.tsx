"use client";

import * as React from "react";
import { Image as ImageIcon, MessageSquareWarning, Plus, Settings, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { Checkbox } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { usePageCrumb } from "@/components/page/page-crumb";
import { showToast } from "@/components/page/toast";
import { ViewBar } from "@/components/page/view-bar";
import { cn } from "@/lib/utils";
import {
  ACCOUNTS,
  NETWORK_LABEL,
  TYPE_LABEL,
  addPost,
  updatePost,
  type Network,
  type PostType,
  type SocialPost,
} from "./social-data";
import { PlannerTab } from "./planner-tab";
import { AccountAvatar, MediaTile, NetworkBadge } from "./social-ui";

const TABS = [
  { id: "planner", label: "Planner" },
  { id: "content", label: "Content" },
  { id: "comments", label: "Comments" },
  { id: "stats", label: "Statistics" },
  { id: "listening", label: "Social listening" },
  { id: "settings", label: "Settings" },
];

/**
 * Marketing ▸ Social Planner.
 *
 * The six tabs are the product's own strip and the nav files them as its
 * tab rows, so a row seeds the tab and the lit tab is the trail's last crumb —
 * the Prospecting arrangement. Planner is built; the other five hold their
 * place.
 */
export function SocialPlannerPage({ initialTab }: { initialTab?: string | null }) {
  const { effective } = useTheme();
  const [tab, setTab] = React.useState(
    TABS.some((t) => t.id === initialTab) ? initialTab! : "planner",
  );
  const [composer, setComposer] = React.useState<{ post: SocialPost | null } | null>(null);
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  const active = TABS.find((t) => t.id === tab)!;
  usePageCrumb(
    tab === "planner"
      ? null
      : {
          label: active.label,
          options: TABS.map((t) => ({ id: t.id, label: t.label, selected: t.id === tab })),
          onSelect: setTab,
        },
  );

  const glyph =
    "flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:bg-pg";

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Social Planner"
        aside={
          <span className="flex items-center gap-[8px]">
            <button type="button" title="Share feedback" aria-label="Share feedback" onClick={() => setFeedbackOpen(true)} className={glyph}>
              <MessageSquareWarning size={17} aria-hidden="true" />
            </button>
            <button type="button" title="Social Planner settings" aria-label="Social Planner settings" onClick={() => setTab("settings")} className={glyph}>
              <Settings size={17} aria-hidden="true" />
            </button>
            <OutlineButton onClick={() => setConnectOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              Socials
            </OutlineButton>
            <PrimaryButton onClick={() => setComposer({ post: null })}>
              <Plus size={16} aria-hidden="true" />
              New post
            </PrimaryButton>
          </span>
        }
      />

      <ViewBar label="Social Planner" views={TABS} activeId={tab} onSelect={setTab} />

      {tab === "planner" ? (
        <PlannerTab onEdit={(post) => setComposer({ post })} />
      ) : (
        <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-[6px] rounded-[12px] bg-pg-surface text-center shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <p className="text-[16px] leading-[22px] font-semibold text-pg-heading">{active.label}</p>
          <p className="text-[13px] leading-[18px] text-pg-muted">This tab isn&apos;t built in the prototype yet.</p>
        </div>
      )}

      {composer ? <Composer post={composer.post} onClose={() => setComposer(null)} /> : null}
      {connectOpen ? <ConnectModal onClose={() => setConnectOpen(false)} /> : null}
      {feedbackOpen ? <FeedbackModal onClose={() => setFeedbackOpen(false)} /> : null}
    </div>
  );
}

/* ─── Composer ──────────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MEDIA_HUES = [
  "var(--hr-primary-500)",
  "var(--hr-violet-500)",
  "var(--hr-success-600)",
  "var(--hr-warning-500)",
  "var(--hr-error-400)",
];

/** X's limit is the tightest of the four, so it's the one the counter warns on. */
const X_LIMIT = 280;

function Composer({ post, onClose }: { post: SocialPost | null; onClose: () => void }) {
  const readOnly = post?.status === "published";
  const [accounts, setAccounts] = React.useState<string[]>(post?.accountIds ?? []);
  const [caption, setCaption] = React.useState(post?.caption ?? "");
  const [type, setType] = React.useState<PostType>(post?.type ?? "native");
  const [media, setMedia] = React.useState(post?.media ?? null);
  const [when, setWhen] = React.useState<"now" | "later">(post?.status === "scheduled" ? "later" : "now");
  const [at, setAt] = React.useState(() => toLocalInput(post?.at ?? Date.now() + 3_600_000));
  const [errors, setErrors] = React.useState<{ accounts?: string; caption?: string; at?: string }>({});

  const hasX = accounts.some((id) => ACCOUNTS.find((a) => a.id === id)?.network === "x");
  const over = hasX && caption.length > X_LIMIT;

  const submit = (status: "draft" | "go") => {
    const next: typeof errors = {};
    if (status === "go") {
      if (accounts.length === 0) next.accounts = "Choose at least 1 account.";
      if (!caption.trim() && !media) next.caption = "Add a caption or media.";
      if (over) next.caption = `X posts can be up to ${X_LIMIT} characters.`;
      if (when === "later" && new Date(at).getTime() <= Date.now()) next.at = "Pick a time in the future.";
    } else if (!caption.trim() && !media) {
      next.caption = "Add a caption or media to save a draft.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    const fields = {
      caption: caption.trim(),
      accountIds: accounts.length ? accounts : [ACCOUNTS[2]!.id],
      type,
      media,
      status: status === "draft" ? ("draft" as const) : when === "now" ? ("published" as const) : ("scheduled" as const),
      at: status === "go" && when === "now" ? Date.now() : new Date(at).getTime(),
    };
    if (post) updatePost(post.id, fields);
    else addPost(fields);
    showToast(
      fields.status === "draft" ? "Draft saved" : fields.status === "published" ? "Post published" : "Post scheduled",
    );
    onClose();
  };

  return (
    <Modal
      title={readOnly ? "View post" : post ? "Edit post" : "New post"}
      width={640}
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        readOnly ? (
          <PrimaryButton onClick={onClose}>Done</PrimaryButton>
        ) : (
          <>
            <OutlineButton onClick={onClose}>Cancel</OutlineButton>
            <span className="flex-1" />
            <OutlineButton onClick={() => submit("draft")}>Save as draft</OutlineButton>
            <PrimaryButton onClick={() => submit("go")}>{when === "now" ? "Post now" : "Schedule"}</PrimaryButton>
          </>
        )
      }
    >
      <div className="flex flex-col gap-[6px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Post to</span>
        <div className="flex flex-wrap gap-[8px]">
          {ACCOUNTS.map((a) => {
            const on = accounts.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                disabled={readOnly}
                aria-pressed={on}
                onClick={() => setAccounts(on ? accounts.filter((x) => x !== a.id) : [...accounts, a.id])}
                className={cn(
                  "flex h-[40px] items-center gap-[8px] rounded-[8px] pr-[12px] pl-[6px] text-[13px] leading-[18px] motion-tap disabled:cursor-default",
                  on
                    ? "bg-brand-soft text-pg-heading shadow-[inset_0_0_0_1px_var(--brand)]"
                    : "text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] enabled:hover:bg-pg",
                )}
              >
                <AccountAvatar account={a} size={26} />
                {a.name}
              </button>
            );
          })}
        </div>
        {errors.accounts ? <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">{errors.accounts}</span> : null}
      </div>

      <div className="flex flex-col gap-[6px]">
        <span className="flex items-center justify-between text-[14px] leading-[20px] font-medium text-pg-text-strong">
          Caption
          <span className={cn("text-[13px] font-normal tabular-nums", over ? "text-[var(--hr-error-600)]" : "text-pg-muted")}>
            {caption.length.toLocaleString("en-US")}
            {hasX ? ` / ${X_LIMIT}` : ""}
          </span>
        </span>
        <textarea
          value={caption}
          readOnly={readOnly}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          placeholder="What do you want to share?"
          className={cn(
            "w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[10px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none",
            errors.caption
              ? "shadow-[inset_0_0_0_1px_var(--hr-error-500)]"
              : "shadow-[inset_0_0_0_1px_var(--pg-border)] focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          )}
        />
        {errors.caption ? <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">{errors.caption}</span> : null}
      </div>

      <div className="flex flex-wrap items-end gap-[16px]">
        <div className="flex flex-col gap-[6px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Media</span>
          {media ? (
            <span className="relative inline-flex">
              <MediaTile media={media} size={64} />
              {readOnly ? null : (
                <button
                  type="button"
                  aria-label="Remove media"
                  onClick={() => setMedia(null)}
                  className="absolute -top-[6px] -right-[6px] flex size-[20px] items-center justify-center rounded-full bg-pg-surface text-pg-text shadow-[0_0_0_1px_var(--pg-border)]"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </span>
          ) : (
            <OutlineButton
              disabled={readOnly}
              onClick={() =>
                setMedia({ hue: MEDIA_HUES[Math.floor(Math.random() * MEDIA_HUES.length)]!, kind: type === "reel" ? "video" : "image" })
              }
            >
              <ImageIcon size={15} aria-hidden="true" />
              Add media
            </OutlineButton>
          )}
        </div>
        <label className="flex flex-col gap-[6px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Type</span>
          <select
            value={type}
            disabled={readOnly}
            onChange={(e) => setType(e.target.value as PostType)}
            className="h-[36px] w-[180px] rounded-[8px] bg-pg-surface px-[10px] text-[14px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none"
          >
            {(Object.keys(TYPE_LABEL) as PostType[]).map((k) => (
              <option key={k} value={k}>
                {TYPE_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {readOnly ? (
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Published posts can&apos;t be edited here. Duplicate it to post a new version.
        </p>
      ) : (
        <div className="flex flex-col gap-[8px] border-t border-pg-head-border pt-[16px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">When</span>
          <div className="flex flex-wrap items-center gap-[16px]">
            {(
              [
                ["now", "Post now"],
                ["later", "Schedule for later"],
              ] as const
            ).map(([id, label]) => (
              <label key={id} className="flex cursor-pointer items-center gap-[8px] text-[14px] leading-[20px] text-pg-text">
                <input type="radio" name="when" checked={when === id} onChange={() => setWhen(id)} className="accent-[var(--brand)]" />
                {label}
              </label>
            ))}
            {when === "later" ? (
              <input
                type="datetime-local"
                value={at}
                onChange={(e) => setAt(e.target.value)}
                aria-label="Schedule date and time"
                className={cn(
                  "h-[36px] rounded-[8px] bg-pg-surface px-[10px] text-[14px] text-pg-text focus:outline-none",
                  errors.at ? "shadow-[inset_0_0_0_1px_var(--hr-error-500)]" : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
                )}
              />
            ) : null}
          </div>
          {errors.at ? <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">{errors.at}</span> : null}
        </div>
      )}
    </Modal>
  );
}

/* ─── Small modals ──────────────────────────────────────────────────────── */

const NETWORKS: Network[] = ["facebook", "instagram", "linkedin", "x"];

function ConnectModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Connect social accounts" width={480} onClose={onClose} bodyClassName="gap-[8px]" footer={<OutlineButton onClick={onClose}>Done</OutlineButton>}>
      <p className="pb-[4px] text-[14px] leading-[20px] text-pg-muted">
        Connect a profile or page to post to it from the planner.
      </p>
      {NETWORKS.map((n) => {
        const count = ACCOUNTS.filter((a) => a.network === n).length;
        return (
          <div key={n} className="flex h-[56px] items-center gap-[12px] rounded-[8px] px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <NetworkBadge network={n} size={28} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[14px] leading-[20px] font-medium text-pg-heading">{NETWORK_LABEL[n]}</span>
              <span className="text-[13px] leading-[18px] text-pg-muted">
                {count} {count === 1 ? "account" : "accounts"} connected
              </span>
            </span>
            <OutlineButton onClick={() => showToast(`Opening ${NETWORK_LABEL[n]} to connect an account`)}>Connect</OutlineButton>
          </div>
        );
      })}
    </Modal>
  );
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = React.useState("");
  const [contact, setContact] = React.useState(true);
  return (
    <Modal
      title="Share feedback"
      width={480}
      onClose={onClose}
      bodyClassName="gap-[12px]"
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton
            disabled={!text.trim()}
            className="disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              showToast("Thanks for the feedback!");
              onClose();
            }}
          >
            Send feedback
          </PrimaryButton>
        </>
      }
    >
      <textarea
        autoFocus
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's working, and what isn't?"
        className="w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[10px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]"
      />
      <Checkbox checked={contact} onChange={setContact} label="You can contact me about this feedback" />
    </Modal>
  );
}
