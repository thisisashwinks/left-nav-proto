"use client";

/*
 * Conversations ▸ Inbox as the staging build draws it.
 *
 * A measured copy of switchyard-v4 staging (Oct 7, 2026, 1728px viewport):
 * every size, gap, colour and weight below was read off the live page's
 * computed styles rather than estimated from a screenshot, and the icons are
 * its own SVGs (staging-icons.tsx). Where staging is inconsistent with itself
 * (13px Email/Phone labels beside 14px ones, a 10px card radius on a
 * `rounded-md` class) the copy keeps the inconsistency, because the point of
 * it is to show what shipped.
 *
 * Two variants, one tree. "before" is staging as built and stays frozen. "after"
 * is where fixes go: change a value in AFTER_TOKENS, or branch on `after` for
 * a structural change, so the before/after switch in the prototype controls
 * always compares the two honestly. Ashwin, Oct 7.
 *
 * Light only, as staging is. Colours come from the raw HighRise palette
 * (`--hr-*`, tokens.css) through the short local aliases below, so the copy
 * never follows the prototype's theme or accent.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import * as I from "./staging-icons";
import { StagingFixesProvider, useFix } from "./staging-fixes-context";
import { DocumentsPanel, PaymentsPanel } from "./staging-documents-payments";
import { AppointmentsPanel, TasksPanel } from "./staging-tasks-appointments";
import {
  NewConversationModal,
  ShortcutsModal,
  type RailPanelId,
} from "./staging-rail-panels";
import {
  BulkBar,
  CaughtUpEmpty,
  ExpandedInboxRail,
  FilterDrawer,
  NoConversationSelected,
  NoInternalChatSelected,
  SortMenu,
  ViewsMenu,
  type InboxMenuId,
} from "./staging-list-extras";
import {
  ActionsTab,
  DndTab,
  FieldFilterMenu,
  FollowersMenu,
  OwnerMenu,
  SearchNotFound,
  STAGING_FOLDER_FIELDS,
  TagsMenu,
  fieldMatches,
  type FieldFilter,
} from "./staging-panel-extras";
import {
  ActivityTab,
  AssociationsTab,
  ChannelFilterMenu,
  ChannelPickerMenu,
  DeleteConversationModal,
  EmailCardExpanded,
  EmailMoreMenu,
  ExpandedComposer,
  NotesTab,
  SendOptionsMenu,
  COMPOSER_MODES,
  composerModesFor,
  type ComposerMode,
} from "./staging-thread-extras";
import {
  AVATAR_TONES,
  STAGING_CLIENT_FIELDS,
  STAGING_CONVERSATIONS,
  STAGING_CREATED_ON,
  STAGING_FOLDERS,
  type AvatarTone,
  type StagingConversation,
  type StagingField,
  type StagingItem,
} from "./staging-data";

export type StagingVariant = "before" | "after";

/** Staging's colours, as aliases over the HighRise palette. */
const BEFORE_TOKENS = {
  "--g900": "var(--hr-gray-900)",
  "--g800": "var(--hr-gray-800)",
  "--g700": "var(--hr-gray-700)",
  "--g600": "var(--hr-gray-600)",
  "--g500": "var(--hr-gray-500)",
  "--g400": "var(--hr-gray-400)",
  "--g300": "var(--hr-gray-300)",
  "--g200": "var(--hr-gray-200)",
  "--g100": "var(--hr-gray-100)",
  "--g50": "var(--hr-gray-50)",
  "--p700": "var(--hr-primary-700)",
  "--p600": "var(--hr-primary-600)",
  "--p500": "var(--hr-primary-500)",
  "--p300": "var(--hr-primary-300)",
  "--p50": "var(--hr-primary-50)",
  // The tab underlines and the unread tab's badge are HighRise blue, not
  // primary — one step off the primary the pills and buttons use.
  "--b600": "var(--hr-blue-600)",
  // The list rows' rule, an older gray-200 than the rest of the page's.
  "--row-rule": "#e4e7ec",
  // The thread's composer and its seams.
  "--composer-edge": "#d0d5dd",
  // The internal comment's yellow.
  "--note-bg": "#faecc3",
  "--note-edge": "#feee95",
  "--note-ink": "#a15c07",
  "--wa": "#25c661",
  "--mail-badge": "#6b7280",
  // The root's inherited ink, which only the footnote ends up wearing.
  "--root-ink": "#607179",
  // The contact panel's tab strip, and the "Created by" link.
  "--panel-tabs-bg": "#f8f9fd",
  "--link-ink": "#1864ab",
} as const;

/** Fixes land here first. Starts identical to staging. */
const AFTER_TOKENS: Partial<Record<keyof typeof BEFORE_TOKENS, string>> = {};

export function StagingInbox({
  variant,
  fixes,
}: {
  variant: StagingVariant;
  /** The checkpoint fixes to draw with; empty for "before". */
  fixes: readonly string[];
}) {
  return (
    <StagingFixesProvider fixes={fixes}>
      <StagingInboxBody variant={variant} />
    </StagingFixesProvider>
  );
}

function StagingInboxBody({ variant }: { variant: StagingVariant }) {
  const after = variant === "after";
  const tokens = after ? { ...BEFORE_TOKENS, ...AFTER_TOKENS } : BEFORE_TOKENS;

  const [menu, setMenu] = React.useState<InboxMenuId>("team-inbox");
  const [railOpen, setRailOpen] = React.useState(false);
  const [railSearch, setRailSearch] = React.useState(false);
  const [tab, setTab] = React.useState<ListTab>("unread");
  const [activeId, setActiveId] = React.useState(STAGING_CONVERSATIONS[0]!.id);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [starred, setStarred] = React.useState<Set<string>>(new Set());
  const [threadTab, setThreadTab] = React.useState("conversations");
  const [panel, setPanel] = React.useState<RailPanelId | null>("contact");
  const [shortcuts, setShortcuts] = React.useState(false);
  const [newConv, setNewConv] = React.useState(false);

  // Read state is local: marking a conversation read here never reaches staging.
  const [read, setRead] = React.useState<Set<string>>(new Set());
  const all = STAGING_CONVERSATIONS.map((c) =>
    read.has(c.id) ? { ...c, unread: 0 } : c,
  );
  // Only the team inbox has conversations on the staging account; My inbox
  // and Internal chat come up empty there, so they do here.
  const team = menu === "team-inbox";
  const internal = menu === "internal-chat";
  const conversations = !team
    ? []
    : tab === "starred"
      ? all.filter((c) => starred.has(c.id))
      : tab === "unread"
        ? // The open conversation stays put after it is read, as on staging.
          all.filter((c) => c.unread > 0 || c.id === activeId)
        : all;
  const active = team ? all.find((c) => c.id === activeId) : undefined;
  const pickMenu = (id: InboxMenuId) => {
    setMenu(id);
    setTab("unread");
    setChecked(new Set());
  };

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  return (
    <div
      data-cursor="default"
      data-staging-inbox={variant}
      style={tokens as React.CSSProperties}
      className="flex h-full w-full overflow-hidden bg-white font-sans text-[14px] leading-[21px] font-normal text-[var(--root-ink)]"
    >
      {railOpen ? (
        <ExpandedInboxRail
          menu={menu}
          onMenu={pickMenu}
          onCollapse={() => {
            setRailOpen(false);
            setRailSearch(false);
          }}
          autoFocusSearch={railSearch}
          actionsDisabled={checked.size > 0}
        />
      ) : (
        <SubRail
          menu={menu}
          onMenu={pickMenu}
          onNew={() => setNewConv(true)}
          onExpand={() => setRailOpen(true)}
          onSearch={() => {
            setRailOpen(true);
            setRailSearch(true);
          }}
        />
      )}

      <div className="flex min-h-0 w-full flex-row overflow-hidden bg-white">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="my-2 flex min-h-0 w-full flex-1 flex-row overflow-hidden">
            <div className="flex h-full min-h-0 w-full flex-1 flex-row overflow-hidden rounded-lg">
              <ListPane
                title={team ? "Team inbox" : internal ? "Internal chat" : "My inbox"}
                internal={internal}
                conversations={conversations}
                tab={tab}
                onTab={setTab}
                activeId={activeId}
                onSelect={setActiveId}
                checked={checked}
                onCheck={(id) => setChecked((s) => toggle(s, id))}
                onCheckAll={() =>
                  setChecked((s) =>
                    s.size === conversations.length
                      ? new Set()
                      : new Set(conversations.map((c) => c.id)),
                  )
                }
                starred={starred}
                onStar={(id) => setStarred((s) => toggle(s, id))}
                unreadCount={all.filter((c) => c.unread > 0).length}
              />
              <div className="relative h-full min-w-0 flex-1">
                {active ? (
                  <Thread
                    // Keyed, so the composer's channel and drafts reset per conversation.
                    key={active.id}
                    conversation={active}
                    tab={threadTab}
                    onTab={setThreadTab}
                    starred={starred.has(active.id)}
                    onStar={() => setStarred((s) => toggle(s, active.id))}
                    read={active.unread === 0}
                    onRead={() => setRead((s) => toggle(s, active.id))}
                    compactTabs={railOpen}
                  />
                ) : (
                  <CaughtUpEmpty
                    scope={internal ? "Internal chat" : "All"}
                    onViewAll={() => pickMenu("team-inbox")}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/*
          The right column runs 8px past the canvas's foot: it takes the
          workspace's 8px vertical margin on top of a full height, and the
          root clips it. Staging does the same, so the panel's bottom edge is
          never seen.
        */}
        <div className="my-2 h-full min-h-0 shrink-0 overflow-hidden shadow-[inset_1px_0_0_0_var(--g200)]">
          <div className="ml-3 flex h-full flex-col border-r border-[var(--g200)]">
            <div className="flex h-full w-full">
              {panel === "contact" && active ? (
                <ContactPanel conversation={active} onClose={() => setPanel(null)} />
              ) : null}
              {panel === "contact" && !active ? (
                internal ? <NoInternalChatSelected /> : <NoConversationSelected />
              ) : null}
              {panel === "tasks" ? <TasksPanel onClose={() => setPanel(null)} /> : null}
              {panel === "appointments" ? <AppointmentsPanel onClose={() => setPanel(null)} /> : null}
              {panel === "documents" ? <DocumentsPanel onClose={() => setPanel(null)} /> : null}
              {panel === "payments" ? <PaymentsPanel onClose={() => setPanel(null)} /> : null}
              <RightRail
                panel={panel}
                onPanel={setPanel}
                onShortcuts={() => setShortcuts((v) => !v)}
              />
            </div>
          </div>
        </div>
      </div>

      {shortcuts ? <ShortcutsModal onClose={() => setShortcuts(false)} /> : null}
      {newConv ? <NewConversationModal onClose={() => setNewConv(false)} /> : null}
    </div>
  );
}

/* ─── The inbox's own rail ──────────────────────────────────────────────── */

const MENU: { id: InboxMenuId; label: string; icon: typeof I.User }[] = [
  { id: "my-inbox-all", label: "My inbox", icon: I.User },
  { id: "team-inbox", label: "Team inbox", icon: I.Users },
  { id: "internal-chat", label: "Internal chat", icon: I.Dataflow },
];

function SubRail({
  menu,
  onMenu,
  onNew,
  onExpand,
  onSearch,
}: {
  menu: InboxMenuId;
  onMenu: (id: InboxMenuId) => void;
  onNew: () => void;
  onExpand: () => void;
  onSearch: () => void;
}) {
  const [viewsOpen, setViewsOpen] = React.useState(false);
  return (
    <div className="relative flex h-full w-[52px] shrink-0 flex-col items-center bg-white px-2 pt-4 pb-2 shadow-[inset_-1px_0_0_0_var(--g200)]">
      <button
        type="button"
        aria-label="Expand inbox menu"
        onClick={onExpand}
        className="absolute top-1/2 -right-3 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--g900)] shadow-md"
      >
        <I.ChevronRight size={16} />
      </button>

      <div className="mb-2 flex shrink-0 flex-col items-center gap-3">
        <button
          type="button"
          aria-label="New conversation"
          onClick={onNew}
          className="flex size-9 items-center justify-center rounded-lg border border-[var(--p600)] bg-[var(--p600)] text-white shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
        >
          <I.MessagePlus size={20} />
        </button>
        <button type="button" aria-label="Import" className="text-[var(--g700)] hover:text-[var(--g900)]">
          <I.Download size={20} />
        </button>
        <button type="button" aria-label="Search" onClick={onSearch} className="text-[var(--g700)] hover:text-[var(--g900)]">
          <I.Search size={20} />
        </button>
      </div>

      <div className="flex w-full flex-col items-center gap-1 pt-1">
        {MENU.map((m) => {
          // My inbox's three sub-views all light the one icon.
          const on =
            m.id === menu ||
            (m.id === "my-inbox-all" &&
              (menu === "assigned-to-me" || menu === "followed-by-me"));
          return (
            <button
              key={m.id}
              type="button"
              aria-label={m.label}
              aria-pressed={on}
              onClick={() => onMenu(m.id)}
              className={cn(
                "flex h-[38px] w-9 items-center justify-center rounded-[4px] border p-2 font-medium",
                on
                  ? "border-[var(--p700)] bg-white text-[var(--p700)] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
                  : "border-transparent text-[var(--g700)] hover:bg-[var(--g50)]",
              )}
            >
              <m.icon size={20} />
            </button>
          );
        })}
        <div className="my-1 h-px w-9 bg-[var(--g300)]" />
        <div className="relative">
          <button
            type="button"
            aria-label="Views"
            aria-expanded={viewsOpen}
            onClick={() => setViewsOpen((v) => !v)}
            className="flex size-[38px] items-center justify-center rounded-[4px] border border-transparent p-2 text-[var(--g700)] hover:bg-[var(--g50)]"
          >
            <I.ViewBox size={20} />
          </button>
          <ViewsMenu open={viewsOpen} onClose={() => setViewsOpen(false)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Conversation list ─────────────────────────────────────────────────── */

type ListTab = "unread" | "all" | "recent" | "starred";

const LIST_TABS: { id: ListTab; label: string; icon: typeof I.Mail }[] = [
  { id: "unread", label: "Unread", icon: I.Mail },
  { id: "all", label: "All", icon: I.Inbox },
  { id: "recent", label: "Recent", icon: I.ClockRewind },
  { id: "starred", label: "Starred", icon: I.Star },
];

function ListPane({
  title,
  internal,
  conversations,
  tab,
  onTab,
  activeId,
  onSelect,
  checked,
  onCheck,
  onCheckAll,
  starred,
  onStar,
  unreadCount: unread,
}: {
  title: string;
  internal: boolean;
  unreadCount: number;
  conversations: StagingConversation[];
  tab: ListTab;
  onTab: (t: ListTab) => void;
  activeId: string;
  onSelect: (id: string) => void;
  checked: Set<string>;
  onCheck: (id: string) => void;
  onCheckAll: () => void;
  starred: Set<string>;
  onStar: (id: string) => void;
}) {
  const allChecked = conversations.length > 0 && checked.size === conversations.length;
  const [sortOpen, setSortOpen] = React.useState(false);
  const [sort, setSort] = React.useState("latest-all");
  const [filterOpen, setFilterOpen] = React.useState(false);
  // Internal chat keeps only Unread and All, and drops filter, sort and Select all.
  const tabs = internal ? LIST_TABS.filter((t) => t.id === "unread" || t.id === "all") : LIST_TABS;
  return (
    <div className="flex w-[320px] shrink-0 flex-col rounded-tl-[4px] border-r border-[var(--g200)]">
      <div className="flex h-full w-full flex-col items-start">
        <div className="flex h-full w-full flex-col bg-white p-4">
          <div className="sticky top-0 z-10 w-full border-b border-[var(--g200)] bg-inherit">
            <div className="flex flex-col gap-3">
              <div className="flex h-6 w-full items-center justify-between">
                <div className="mr-2 flex min-w-0 flex-1 items-center gap-2">
                  <h1 className="m-0.5 min-w-0 truncate text-[16px] leading-[1.2] font-semibold text-[var(--g900)]">
                    {title}
                  </h1>
                </div>
                {internal ? null : (
                <div className="relative flex items-center">
                  <button type="button" aria-label="Filter" onClick={() => setFilterOpen(true)} className="mr-[9px] flex items-center text-[var(--g600)] hover:bg-[var(--g50)]">
                    <I.FilterLines size={24} />
                  </button>
                  <button type="button" aria-label="Sort" onClick={() => setSortOpen((o) => !o)} className="flex items-center text-[var(--g600)] hover:bg-[var(--g50)]">
                    <I.SwitchVertical size={24} />
                  </button>
                  <SortMenu
                    open={sortOpen}
                    onClose={() => setSortOpen(false)}
                    value={sort}
                    onChange={setSort}
                  />
                </div>
                )}
              </div>

              <div className="flex w-full flex-nowrap overflow-hidden rounded-lg">
                {tabs.map((t) => {
                  const on = t.id === tab;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onTab(t.id)}
                      className={cn(
                        "flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden border-b-2 bg-white px-1 py-1.5",
                        on ? "border-[var(--b600)]" : "border-transparent",
                      )}
                    >
                      <div className="relative mb-1">
                        <t.icon size={20} className={on ? "text-[var(--g900)]" : "text-[var(--g500)]"} />
                        {t.id === "unread" && unread > 0 ? (
                          <span className="absolute -top-1 -right-2.5 min-w-[18px] rounded-[4px] bg-[var(--b600)] px-1 text-center text-[10px] leading-[15px] font-semibold text-white">
                            {unread}
                          </span>
                        ) : null}
                      </div>
                      <div
                        className={cn(
                          "w-full min-w-0 overflow-hidden text-center text-[14px] leading-5 font-medium",
                          on ? "text-[var(--g900)]" : "text-[var(--g600)]",
                        )}
                      >
                        {t.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {internal ? null : (
          <div className="flex w-full flex-col items-stretch bg-white py-2.5 pl-4">
            <div className="flex min-h-[28px] w-full items-center justify-between">
              {checked.size > 0 ? (
                <BulkBar
                  count={checked.size}
                  checkbox={<Checkbox on={allChecked} onChange={onCheckAll} />}
                />
              ) : (
              <label className="flex cursor-pointer items-center gap-1">
                <Checkbox on={allChecked} onChange={onCheckAll} />
                <span className="truncate pl-1 text-[14px] leading-5 font-medium text-[var(--g600)] select-none">
                  Select all
                </span>
              </label>
              )}
            </div>
          </div>
          )}
          <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} />

          <div className="min-h-0 w-full flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                active={c.id === activeId}
                checked={checked.has(c.id)}
                starred={starred.has(c.id)}
                onSelect={() => onSelect(c.id)}
                onCheck={() => onCheck(c.id)}
                onStar={() => onStar(c.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationRow({
  conversation: c,
  active,
  checked,
  starred,
  onSelect,
  onCheck,
  onStar,
}: {
  conversation: StagingConversation;
  active: boolean;
  checked: boolean;
  starred: boolean;
  onSelect: () => void;
  onCheck: () => void;
  onStar: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      className={cn(
        // A fixed 90px: staging's list is virtualised at a set row height,
        // so the selected row's extra border never changes the rhythm.
        "flex h-[90px] w-full cursor-pointer flex-col p-4 text-left transition-colors",
        active
          ? // Staging's selected row: a 2px grey ring with rounded corners.
            "overflow-hidden rounded-[4px] border border-transparent bg-[var(--p50)] shadow-[0_0_0_1px_#d0d0d0,inset_0_0_0_1px_#c8cacf]"
          : "border-b border-[var(--row-rule)] bg-white hover:bg-[var(--g50)]",
      )}
    >
      <div className="flex w-full min-w-0 items-center">
        <div
          className="flex shrink-0 items-center justify-center pr-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox on={checked} onChange={onCheck} />
        </div>
        {/*
          min-w-0 down the chain, so the name truncates instead of pushing the
          date and count past the row's edge.
        */}
        <div className="flex w-full min-w-0 flex-col pl-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
              <div className="relative h-[30px] w-6 shrink-0">
                <Avatar initials={c.initials} tone={c.tone} size="xs" />
                <div className="absolute -right-2 -bottom-0.5 flex items-center justify-center rounded-full bg-white p-px">
                  {c.channel === "whatsapp" ? (
                    <I.WhatsApp size={14} className="text-[var(--wa)]" />
                  ) : (
                    <I.Mail size={14} className="text-[var(--mail-badge)]" />
                  )}
                </div>
              </div>
              <div className="ml-3 flex min-w-0 flex-1 flex-col gap-[2px] overflow-hidden">
                <div
                  className={cn(
                    "truncate text-[14px] text-[var(--g600)]",
                    c.unread > 0 ? "font-bold" : "font-normal",
                  )}
                >
                  {c.name}
                </div>
              </div>
            </div>
            <div className="ml-2 flex min-w-[40px] shrink-0 items-center justify-end gap-1">
              <span className="text-[12px] leading-[18px] whitespace-nowrap text-[var(--g500)]">
                {c.date}
              </span>
              {c.unread > 0 ? (
                <div className="ml-2 flex shrink-0 items-center justify-end gap-1">
                  <div className="flex shrink-0 items-center justify-center rounded-[4px] bg-[var(--p600)] px-1.5 py-px text-[12px] leading-[18px] whitespace-nowrap text-white">
                    {c.unread}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-1 ml-6 flex min-w-0 items-center justify-between overflow-hidden">
        <div
          className={cn(
            "w-full truncate",
            active ? "rounded-[5px] text-[var(--g700)]" : "text-[var(--g500)]",
          )}
        >
          <div className="flex items-center overflow-hidden whitespace-nowrap">
            {c.internalPreview ? (
              <I.Eye size={14} className="mr-1 shrink-0 rounded-full bg-[var(--note-edge)] text-[var(--note-ink)]" />
            ) : null}
            <div className="max-w-[250px] truncate text-[14px]">{c.preview}</div>
          </div>
        </div>
        <button
          type="button"
          aria-label={starred ? "Unstar" : "Star"}
          aria-pressed={starred}
          onClick={(e) => {
            e.stopPropagation();
            onStar();
          }}
          className="-mr-[3px] flex size-5 shrink-0 cursor-pointer items-center justify-center"
        >
          <I.Star
            size={14}
            className={starred ? "fill-[var(--hr-warning-400)] text-[var(--hr-warning-400)]" : "text-[var(--g400)]"}
          />
        </button>
      </div>
    </div>
  );
}

/* ─── Thread ────────────────────────────────────────────────────────────── */

const THREAD_TABS = [
  { id: "conversations", label: "Conversations", icon: I.MessageChat },
  { id: "notes", label: "Notes", icon: I.Edit },
  { id: "activity", label: "Activity", icon: I.ClockRefresh },
  { id: "associations", label: "Associations", icon: I.Associations },
];

function Thread({
  conversation: c,
  tab,
  onTab,
  starred,
  onStar,
  read,
  onRead,
  compactTabs = false,
}: {
  compactTabs?: boolean;
  conversation: StagingConversation;
  tab: string;
  onTab: (t: string) => void;
  starred: boolean;
  onStar: () => void;
  read: boolean;
  onRead: () => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [moreTabs, setMoreTabs] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [channelOpen, setChannelOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const modes = composerModesFor(c.channel);
  const [mode, setMode] = React.useState<ComposerMode>(modes[0]!);
  const Mode = COMPOSER_MODES[mode];
  return (
    <div className="flex h-full w-full flex-col">
      <div className="w-full flex-none">
        <div className="flex flex-col overflow-hidden rounded-tr-xl bg-white">
          <div className="flex min-w-0 items-center border-b border-[var(--g200)] px-2">
            {(compactTabs ? THREAD_TABS.slice(0, 3) : THREAD_TABS).map((t) => {
              const on = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[14px] leading-5 font-medium whitespace-nowrap transition-colors",
                    on
                      ? "border-[var(--b600)] text-[var(--b600)]"
                      : "border-transparent text-[var(--g500)] hover:text-[var(--g700)]",
                  )}
                >
                  <t.icon size={16} />
                  <span>{t.label}</span>
                </button>
              );
            })}
            {/*
              With the inbox menu expanded the thread is too narrow for four
              tabs, and staging folds the last one into a ⋮ menu.
            */}
            {compactTabs ? (
              <div className="relative">
                <button
                  type="button"
                  aria-label="More tabs"
                  onClick={() => setMoreTabs((v) => !v)}
                  className={cn(
                    "flex items-center border-b-2 px-3 py-2.5",
                    tab === "associations"
                      ? "border-[var(--b600)] text-[var(--b600)]"
                      : "border-transparent text-[var(--g500)] hover:text-[var(--g700)]",
                  )}
                >
                  <I.DotsVertical size={20} />
                </button>
                {moreTabs ? (
                  <div className="absolute top-full left-0 z-50 mt-1 min-w-[180px] rounded-[4px] border border-[var(--g300)] bg-white py-1 shadow-[0_4px_8px_-2px_rgba(16,24,40,0.1),0_2px_4px_-2px_rgba(16,24,40,0.06)]">
                    {THREAD_TABS.slice(3).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onTab(t.id);
                          setMoreTabs(false);
                        }}
                        className="flex w-full items-center gap-2 px-2 py-1 text-[14px] leading-[18px] text-[var(--g700)] hover:bg-[var(--g50)]"
                      >
                        <t.icon size={16} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 w-full flex-1 overflow-hidden">
        <div className="relative flex h-full flex-col rounded-br-xl bg-white">
          {/* Notes, Activity and Associations take the whole column, header and composer included. */}
          {tab === "notes" ? (
            <NotesTab />
          ) : tab === "activity" ? (
            <ActivityTab />
          ) : tab === "associations" ? (
            <AssociationsTab />
          ) : (
          <>
          <div className="relative flex h-full min-h-0 flex-1 flex-col bg-white">
            <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--g200)] px-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar initials={c.initials} tone={c.tone} size="sm" />
                <div className="flex max-w-[24rem] min-w-0 flex-1 items-baseline gap-1">
                  <div className="min-w-0 truncate text-[16px] leading-6 font-medium text-[var(--g900)]">
                    {c.name}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Filter channels"
                    onClick={() => setFilterOpen((o) => !o)}
                    className="flex cursor-pointer items-center gap-2 transition-colors hover:bg-[var(--g50)]"
                  >
                    <I.MessageChat size={24} className="text-[var(--g600)]" />
                    <I.ChevronDown size={16} className="text-[var(--g800)]" />
                  </button>
                  {filterOpen ? <ChannelFilterMenu onClose={() => setFilterOpen(false)} /> : null}
                </div>
                <button
                  type="button"
                  aria-label={starred ? "Unstar" : "Star"}
                  aria-pressed={starred}
                  onClick={onStar}
                  className="flex items-center text-[var(--g600)] transition-colors hover:bg-[var(--g50)]"
                >
                  <I.Star size={24} className={starred ? "fill-[var(--hr-warning-400)] text-[var(--hr-warning-400)]" : undefined} />
                </button>
                <button
                  type="button"
                  aria-label={read ? "Mark as unread" : "Mark as read"}
                  onClick={onRead}
                  className="flex items-center text-[var(--g600)] transition-colors hover:bg-[var(--g50)]"
                >
                  {read ? <I.Mail size={24} /> : <I.MailOpen size={24} />}
                </button>
                <button type="button" aria-label="Delete conversation" onClick={() => setDeleteOpen(true)} className="flex items-center text-[var(--g600)] transition-colors hover:bg-[var(--hr-error-50,#fef3f2)]">
                  <I.Trash size={24} />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto bg-white">
              <div className="relative mx-4 mt-4 flex flex-col pb-4">
                {c.items.map((item, i) => (
                  <ThreadItem
                    key={i}
                    item={item}
                    first={i === 0}
                    onReply={() => setComposerOpen(true)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex flex-none flex-col rounded-br-xl bg-white">
            <div className="relative mx-4 my-2">
              {composerOpen ? (
                <ExpandedComposer
                  mode={mode}
                  modes={modes}
                  onMode={setMode}
                  toEmail={c.email ?? c.name}
                  toInitials={c.initials}
                  onCollapse={() => setComposerOpen(false)}
                />
              ) : (
              <div className="overflow-hidden rounded-[4px] border border-[var(--composer-edge)] bg-white">
                <div className="flex h-10 items-center">
                  <div className="relative flex h-full w-[54px] shrink-0 items-center justify-center border-r border-[var(--composer-edge)]">
                    <button
                      type="button"
                      aria-label="Channel"
                      onClick={() => setChannelOpen((o) => !o)}
                      className="flex items-center justify-between gap-0.5 rounded-md"
                    >
                      <Mode.icon size={16} className={Mode.tone} />
                      <I.ChevronDown size={14} className="text-[var(--g600)]" />
                    </button>
                    {channelOpen ? (
                      <ChannelPickerMenu
                        value={mode}
                        modes={modes}
                        onPick={setMode}
                        onClose={() => setChannelOpen(false)}
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex h-10 w-full cursor-text items-start overflow-hidden bg-white py-2.5">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onFocus={() => setComposerOpen(true)}
                        placeholder="Type a message"
                        className="h-5 w-full flex-1 bg-transparent pl-1 text-[14px] leading-5 text-[var(--g900)] outline-none placeholder:text-[var(--g500)]"
                      />
                    </div>
                  </div>
                  <div className="relative flex h-full shrink-0 items-center gap-1 border-l border-[var(--composer-edge)] p-2">
                    <div className={cn("flex items-center", !draft && "opacity-50")}>
                      <div className="flex items-center overflow-hidden rounded-md bg-[var(--p600)]">
                        <button
                          type="button"
                          aria-label="Send"
                          className={cn(
                            "flex items-center justify-center px-1.5 py-1 hover:bg-[var(--p700)]",
                            !draft && "opacity-50",
                          )}
                        >
                          <I.Send size={16} className="text-white" />
                        </button>
                        <div className="h-6 w-px bg-[var(--p500)]" />
                        <button
                          type="button"
                          aria-label="Send options"
                          onClick={() => setSendOpen((o) => !o)}
                          className={cn(
                            "flex items-center justify-center p-1 hover:bg-[var(--p700)]",
                            !draft && "opacity-50",
                          )}
                        >
                          <I.ChevronDown size={12} className="text-white" />
                        </button>
                      </div>
                    </div>
                    {sendOpen ? <SendOptionsMenu onClose={() => setSendOpen(false)} /> : null}
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
      {deleteOpen ? (
        <DeleteConversationModal name={c.name} onClose={() => setDeleteOpen(false)} />
      ) : null}
    </div>
  );
}

function ThreadItem({
  item,
  first,
  onReply,
}: {
  item: StagingItem;
  first: boolean;
  onReply: () => void;
}) {
  if (item.kind === "date") {
    return (
      <div className={cn("flex items-center justify-center", first ? "pt-3" : "mt-4")}>
        <div className="flex h-6 cursor-default items-center rounded-[12px] bg-[var(--g100)] px-2 text-[13px] leading-[18px] font-medium whitespace-nowrap text-[var(--g600)]">
          <I.Calendar size={16} className="mr-2" />
          {item.label}
        </div>
      </div>
    );
  }

  if (item.kind === "email") return <EmailItem item={item} onReply={onReply} />;

  if (item.kind === "comment") {
    return (
      <div className="mt-4 flex">
        <div className="ml-auto flex w-fit max-w-[80%] flex-row-reverse gap-3">
          <div className="shrink-0">
            <div className="relative inline-block h-[38px]">
              <Avatar initials={item.initials} tone={item.tone} size="sm" />
              <div className="absolute -right-2 bottom-1 flex size-5 items-center justify-center rounded-full bg-[var(--note-edge)] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                <I.Eye size={16} className="text-[var(--note-ink)]" />
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="relative mr-[2px] flex flex-col rounded-[4px_0_4px_4px] border border-[var(--note-edge)] bg-[var(--note-bg)] px-3 py-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] [word-break:break-word]">
              <div className="text-[14px] text-[var(--g900)]">{item.body}</div>
              {/*
                The tail, the way staging builds it: a 16×10 notch in the
                bubble's own colour off its top-right corner, then a white
                block turned 43° over it, which cuts the diagonal.
              */}
              <span
                aria-hidden="true"
                className="absolute -top-px -right-[9px] z-[8] h-[10px] w-4 border-t border-r border-[var(--note-edge)] bg-[var(--note-bg)]"
              />
              <span
                aria-hidden="true"
                className="absolute top-[6px] -right-[25px] z-[9] h-3 w-6 rotate-[43deg] border-l border-[var(--note-edge)] bg-white"
              />
            </div>
            <div className="flex w-fit items-center gap-2 self-end">
              <div className="flex h-[13px] items-center justify-end pt-1">
                <span className="text-[12px] leading-[13px] text-[var(--g600)]">{item.time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // An inbound chat message. Not read off staging (see staging-data.ts), so
  // it is the comment's layout mirrored, in the neutral bubble.
  return (
    <div className="mt-4 flex">
      <div className="flex w-fit max-w-[80%] gap-3">
        <div className="shrink-0">
          <Avatar initials={item.initials} tone={item.tone} size="sm" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-col rounded-[0_4px_4px_4px] border border-[var(--g200)] bg-[var(--g100)] px-3 py-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.08)]">
            <div className="text-[14px] text-[var(--g900)]">{item.body}</div>
          </div>
          <span className="pt-1 text-[12px] leading-[13px] text-[var(--g600)]">{item.time}</span>
        </div>
      </div>
    </div>
  );
}

type EmailEntry = Extract<StagingItem, { kind: "email" }>;

/** One email card: collapsed as the list shows it, or opened in place. */
function EmailItem({ item, onReply }: { item: EmailEntry; onReply: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const more = (
    <span className="relative flex">
      <button
        type="button"
        aria-label="More actions"
        onClick={() => setMoreOpen((o) => !o)}
        className="shrink-0 text-[var(--g900)]"
      >
        <I.DotsVertical size={16} />
      </button>
      {moreOpen ? <EmailMoreMenu onClose={() => setMoreOpen(false)} /> : null}
    </span>
  );
  if (expanded) {
    return (
      <div className="mt-4">
        <EmailCardExpanded
          subject={item.subject}
          from={item.from}
          to="shubham.kushwah+admin1@gohighlevel.com, souravpaulghl@yahoo.com"
          time={item.time}
          avatar={
                  <div className="relative flex shrink-0 items-center">
                    <Avatar initials={item.initials} tone={item.tone} size="sm" />
                    <div className="absolute -right-[5px] -bottom-[2px] flex size-5 items-center justify-center rounded-full bg-white">
                      {item.opened ? (
                        <I.MailOpen size={12} className="text-[var(--p600)]" />
                      ) : (
                        <I.MailUnread size={12} className="text-[var(--p600)]" />
                      )}
                    </div>
                  </div>
          }
          onCollapse={() => setExpanded(false)}
          onReply={onReply}
          more={more}
        />
      </div>
    );
  }
  return (
      <div className="mt-4">
        <div className="flex w-full cursor-pointer flex-col overflow-hidden rounded-[10px] border border-[var(--g200)] bg-white">
          <div
            onClick={() => setExpanded(true)}
            className="relative flex min-w-0 cursor-pointer gap-2 border-b border-[var(--g200)] bg-[var(--g50)] px-4 py-2"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[14px] font-medium text-[var(--g900)]">{item.subject}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-[var(--g600)]">
              <I.Expand size={14} className="rounded-[2px]" />
              <I.ChevronDown size={16} />
            </div>
          </div>
          <div className="w-full border-b border-[var(--g200)]">
            <div className="cursor-default p-4">
              <div className="flex w-full cursor-pointer justify-between gap-2 overflow-hidden">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="relative flex shrink-0 items-center">
                    <Avatar initials={item.initials} tone={item.tone} size="sm" />
                    <div className="absolute -right-[5px] -bottom-[2px] flex size-5 items-center justify-center rounded-full bg-white">
                      {item.opened ? (
                        <I.MailOpen size={12} className="text-[var(--p600)]" />
                      ) : (
                        <I.MailUnread size={12} className="text-[var(--p600)]" />
                      )}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="h-4 truncate text-[14px] leading-[16.8px] font-medium text-[var(--g900)]">
                      {item.from}
                    </span>
                    <span className="h-4 truncate text-[14px] leading-[16.8px] text-[var(--g600)]">
                      {item.preview}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end leading-normal">
                  <div className="flex items-center gap-2">
                    <p className="shrink-0 cursor-default text-[14px] text-[var(--g600)]">{item.time}</p>
                    <button type="button" aria-label="Reply" onClick={onReply} className="text-[var(--g900)]">
                      <I.Reply size={16} />
                    </button>
                    {more}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

/* ─── Contact panel ─────────────────────────────────────────────────────── */

const PANEL_TABS = [
  { id: "all", label: "All fields" },
  { id: "dnd", label: "DND" },
  { id: "actions", label: "Actions" },
];

function ContactPanel({
  conversation: c,
  onClose,
}: {
  conversation: StagingConversation;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState("all");
  // Checkpoint "Contact panel → Edges and spacing" (design/staging-fixes.ts).
  const rightBorder = useFix("contact-panel.edges.right-border");
  const edge = useFix("contact-panel.edges.layout.edge-to-edge");
  const cards = useFix("contact-panel.edges.layout.cards");
  const noFolderGap = useFix("contact-panel.edges.no-folder-gap");
  const [open, setOpen] = React.useState<Set<string>>(new Set(["Client"]));
  const [tagsOpen, setTagsOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<FieldFilter>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  // Search and the empty-field filter, applied to every folder alike.
  const shown = (list: StagingField[]) =>
    list.filter(
      (f) =>
        fieldMatches(f.label, q) &&
        (filter === "hide-empty" ? !!f.value : filter === "only-empty" ? !f.value : true),
    );
  const flip = (name: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  // Only the staging contact has fields filled in; the stand-ins show their
  // name and leave the rest as staging's empty "--".
  const fields: StagingField[] =
    c.id === STAGING_CONVERSATIONS[0]!.id
      ? STAGING_CLIENT_FIELDS
      : STAGING_CLIENT_FIELDS.map((f) =>
          f.label === "First name"
            ? { ...f, value: c.name }
            : f.label === "Email"
              ? { ...f, value: undefined }
              : f,
        );

  return (
    <div
      className={cn(
        "relative h-full w-[299px] shrink-0 overflow-hidden rounded-lg",
        rightBorder && "rounded-r-none border-r border-[var(--g200)]",
      )}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col rounded-lg pt-2 pb-4",
          edge ? "px-0" : "px-4",
          "bg-white",
        )}
      >
        <div className={cn("flex h-8 items-center justify-between", edge && "px-4")}>
          <div className="flex items-center gap-1">
            <p className="text-[14px] leading-5 font-medium text-[var(--g900)]">Contact Details</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-[4px] text-[var(--g600)] hover:bg-[var(--g50)]"
          >
            <I.Close size={16} />
          </button>
        </div>

        <div className={cn("min-h-0 flex-1 overflow-hidden", edge ? "mx-0" : "-mx-4")}>
          <div
            className={cn(
              "relative flex h-full w-full flex-col overflow-y-auto",
              edge ? "px-0" : "px-4",
              "bg-white",
            )}
          >
            <div className="flex flex-1 flex-col pb-4">
              <div className="flex flex-col gap-2">
                <div
                  className={cn(
                    "flex flex-col gap-4 bg-white",
                    cards
                      ? "mt-1 rounded-lg border border-[var(--g200)] p-3"
                      : "border-b border-[var(--g200)]",
                    !cards && (edge ? "px-4 py-3" : "p-3"),
                  )}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="relative size-8 shrink-0 cursor-pointer">
                        <Avatar initials={c.initials} tone={c.tone} size="sm" />
                      </div>
                      <div className="flex w-full min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-[2px] overflow-hidden">
                          <p className="min-w-0 flex-1 cursor-pointer truncate text-[14px] leading-5 font-semibold text-[var(--g900)]">
                            {c.name}
                          </p>
                          <div className="flex cursor-pointer items-center gap-1 rounded-md border border-[var(--g200)] bg-[var(--p500)] py-0.5">
                            <p className="px-2 text-[13px] leading-[18px] font-medium text-white">2</p>
                          </div>
                          {c.email ? (
                            <span className="basis-full truncate text-[13px] leading-[18px] text-[var(--g500)]">
                              {c.email}
                            </span>
                          ) : null}
                        </div>
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          aria-label="View contact details"
                          className="flex shrink-0 rounded-md text-[var(--g600)] hover:bg-[var(--g100)]"
                        >
                          <I.ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className={cards ? "grid grid-cols-2 gap-3" : "flex flex-col items-start gap-[10px]"}>
                    <PeopleRow label="Owner" text="Unassigned" menu="owner" stacked={cards} />
                    <PeopleRow label="Followers" menu="followers" stacked={cards} />
                  </div>

                  <div className="flex h-6 items-start gap-2">
                    <p className={cn("text-[13px] leading-5 text-[var(--g600)]", cards ? "w-auto" : "w-[72px]")}>Tags</p>
                    <div className="relative mt-[3px]">
                      <button
                        type="button"
                        aria-label="Add tag"
                        onClick={() => setTagsOpen((o) => !o)}
                        className="flex size-[14px] items-center justify-center rounded-full border border-[var(--p300)] bg-white text-[var(--p700)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
                      >
                        <I.Plus size={10} />
                      </button>
                      {tagsOpen ? <TagsMenu onClose={() => setTagsOpen(false)} /> : null}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "sticky top-0 z-10 flex flex-col gap-2 pb-3",
                    edge ? "mx-0 px-0" : "-mx-4 px-4",
                    cards
                      ? "bg-white pt-1"
                      : "bg-white shadow-[0_1px_0_0_var(--g200)]",
                  )}
                >
                  {/*
                    Staging tints the tab strip and the gap under it with the
                    conversations background, and fills the active tab with
                    primary-50 — read off staging, Oct 7.
                  */}
                  <div className={cn("-mb-2 flex flex-col", !(edge || cards) && "bg-[var(--panel-tabs-bg)]")}>
                  <div
                    className={cn(
                      "relative flex items-center",
                      cards
                        ? "h-8 overflow-hidden rounded-md border border-[var(--g200)] bg-white"
                        : "h-10 border-b border-[var(--g200)]",
                    )}
                  >
                    {PANEL_TABS.map((t) => {
                      const on = t.id === tab;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTab(t.id)}
                          className={cn(
                            "flex flex-1 items-center justify-center px-2 text-[14px] leading-[18px] font-medium whitespace-nowrap",
                            cards
                              ? cn(
                                  "h-full border-l border-[var(--g200)] first:border-l-0",
                                  on ? "bg-[var(--g100)] text-[var(--g900)]" : "bg-white text-[var(--g700)]",
                                )
                              : cn(
                                  "h-10",
                                  on
                                    ? cn(
                                        "text-[var(--g900)] shadow-[inset_0_-2px_0_0_var(--p600)]",
                                        !edge && "bg-[var(--p50)]",
                                      )
                                    : "text-[var(--g600)]",
                                ),
                          )}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="h-2" />
                  </div>
                  {/* Staging shows the search only on All fields. */}
                  {tab === "all" ? (
                  <div className={cn("relative flex h-9 items-center rounded-md border border-[var(--g300)] bg-white px-2 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]", edge && "mx-4")}>
                    <I.SearchSm size={14} className="mr-1 shrink-0 text-[var(--g600)]" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search fields and folders"
                      className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[var(--g900)] outline-none placeholder:text-[var(--g700)]"
                    />
                    <div className="ml-1 flex items-center">
                      <span className="w-4" />
                      <button
                        type="button"
                        aria-label="Filter fields"
                        onClick={() => setFilterOpen((o) => !o)}
                        className="flex items-center"
                      >
                        <I.FilterLines size={14} className="text-[var(--g600)]" />
                      </button>
                    </div>
                    {filterOpen ? (
                      <FieldFilterMenu
                        value={filter}
                        onChange={setFilter}
                        onClose={() => setFilterOpen(false)}
                      />
                    ) : null}
                  </div>
                  ) : null}
                </div>

                {tab === "all" ? (
                  q &&
                  shown(fields).length === 0 &&
                  STAGING_FOLDERS.every(
                    (n) =>
                      !fieldMatches(n, q) && shown(STAGING_FOLDER_FIELDS[n] ?? []).length === 0,
                  ) ? (
                    <SearchNotFound query={q} onClear={() => setQ("")} />
                  ) : (
                  <div className={noFolderGap ? "-mt-2" : "mt-1.5 pt-0.5"}>
                    <Folder card={cards} flush={noFolderGap} name="Client" open={open.has("Client")} onToggle={() => flip("Client")}>
                      {shown(fields).map((f, i) => (
                        <Field key={i} field={f} />
                      ))}
                    </Folder>
                    {STAGING_FOLDERS.map((name) => {
                      const inFolder = shown(STAGING_FOLDER_FIELDS[name] ?? []);
                      return (
                        <Folder card={cards} key={name} name={name} open={open.has(name)} onToggle={() => flip(name)}>
                          {inFolder.length ? (
                            inFolder.map((f, i) => <Field key={i} field={f} />)
                          ) : (
                            <p className="text-[14px] text-[var(--g500)]">No fields in this folder</p>
                          )}
                        </Folder>
                      );
                    })}
                  </div>
                  )
                ) : tab === "dnd" ? (
                  <div className={edge ? "px-4" : undefined}><DndTab /></div>
                ) : (
                  <div className={edge ? "px-4" : undefined}><ActionsTab email={c.email} /></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/*
          Staging's record footer: who created the contact, when, and the
          audit log. Held at the foot of the panel so it is always on screen.
        */}
        <div className="flex shrink-0 flex-col gap-1 border-t border-[var(--g300)] bg-[var(--g50)] px-4 py-2 text-[11px] leading-4 text-[var(--root-ink)]">
          <p>
            Created by: <span className="text-[var(--link-ink)]">CLIENTPORTAL</span>
          </p>
          <p>{STAGING_CREATED_ON}</p>
          <button
            type="button"
            className="flex h-7 w-full items-center justify-center rounded-[4px] border border-[var(--g300)] bg-white p-2 text-[var(--g600)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[var(--g50)]"
          >
            <span className="text-[12px] leading-[17px] font-semibold">Audit logs</span>
            <I.ExternalLink size={14} className="ml-1.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PeopleRow({
  label,
  text,
  menu,
  stacked = false,
}: {
  label: string;
  text?: string;
  menu: "owner" | "followers";
  /** Label above the pill instead of beside it (the bordered-cards layout). */
  stacked?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  // Local only: picking an owner or followers never reaches staging.
  const [picked, setPicked] = React.useState<string[]>([]);
  const pick = (name: string) =>
    setPicked((p) =>
      menu === "owner"
        ? p[0] === name
          ? []
          : [name]
        : p.includes(name)
          ? p.filter((n) => n !== name)
          : [...p, name],
    );
  const pillText =
    menu === "owner"
      ? (picked[0] ?? text)
      : picked.length === 0
        ? text
        : picked.length === 1
          ? picked[0]
          : `${picked.length} followers`;
  return (
    <div className={cn("grid w-full items-center", stacked ? "grid-cols-1 gap-1" : "grid-cols-[72px_1fr]")}>
      <p className="text-[13px] leading-5 text-[var(--g600)]">{label}</p>
      <div className="relative flex h-[26px] items-start">
        {open ? (
          menu === "owner" ? (
            <OwnerMenu onClose={() => setOpen(false)} selected={picked} onPick={pick} />
          ) : (
            <FollowersMenu onClose={() => setOpen(false)} selected={picked} onPick={pick} />
          )
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="relative inline-flex h-6 items-center rounded-[12px] border border-[var(--g300)] bg-white px-2 text-[13px] leading-[13px] whitespace-nowrap text-[var(--g600)]"
        >
          <span className="flex items-center gap-[2px]">
            <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-[var(--g100)] p-0.5">
              <I.User size={14} />
            </span>
            {pillText ? (
              <span className="max-w-[120px] truncate text-[13px] leading-[18px] font-medium">{pillText}</span>
            ) : null}
            <I.ChevronDown size={16} />
          </span>
        </button>
      </div>
    </div>
  );
}

function Folder({
  name,
  open,
  onToggle,
  card = false,
  flush = false,
  children,
}: {
  /** No top margin — the first folder, under "No gap above folders". */
  flush?: boolean;
  /** Its own bordered white card with a grey header (the bordered-cards layout). */
  card?: boolean;
  name: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden text-[13px] leading-[19.5px]",
        card
          ? "mt-3 rounded-lg border border-[var(--g200)] bg-white"
          : "mt-2 rounded-md border-b border-[var(--g200)]",
        flush && "mt-0",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn("relative flex w-full items-center px-4 py-3 text-left", card && "bg-[var(--g100)]")}
      >
        <div className="flex flex-1 items-center">
          <p className="text-[14px] leading-5 font-medium text-[var(--g900)]">{name}</p>
        </div>
        <I.ChevronDown size={16} className={cn("text-[var(--g600)]", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="border-t border-[var(--g200)] bg-white px-4 py-3">
          <div className="flex flex-col gap-4">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ field: f }: { field: StagingField }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
      <div className="mb-1 flex items-start text-[14px] leading-5 text-[var(--g600)]">
        {f.addable ? (
          <div className="flex items-center gap-1">
            <p className="text-[13px]">{f.label}</p>
            <span className="flex size-[14px] items-center justify-center rounded-full border border-[var(--p300)] text-[var(--p500)]">
              <I.Plus size={11} />
            </span>
          </div>
        ) : (
          <span>{f.label}</span>
        )}
      </div>
      <div className="flex h-[23px] items-center">
        <span className="min-w-0 flex-1 overflow-hidden text-[14px] leading-[23px] font-medium whitespace-nowrap text-[var(--g900)]">
          {f.value ?? "--"}
        </span>
        {f.kind === "phone" ? (
          <span className="ml-1 flex cursor-not-allowed items-center">
            <span className="text-[13px] leading-5 font-semibold text-[var(--g500)]">Select</span>
            <I.ChevronDown size={14} className="ml-1 text-[var(--g300)]" />
          </span>
        ) : null}
        {f.kind === "select" ? (
          <I.ChevronDownSolid size={16} className="shrink-0 text-[var(--g600)]" />
        ) : null}
      </div>
    </div>
  );
}

/* ─── The contact's rail ────────────────────────────────────────────────── */

const RAIL: { id: RailPanelId; label: string; icon: typeof I.UserCircle }[] = [
  { id: "contact", label: "Contact", icon: I.UserCircle },
  { id: "tasks", label: "Tasks", icon: I.ClipboardCheck },
  { id: "appointments", label: "Appointments", icon: I.Calendar },
  { id: "documents", label: "Documents", icon: I.File },
  { id: "payments", label: "Payments", icon: I.CurrencyCircle },
];

function RightRail({
  panel,
  onPanel,
  onShortcuts,
}: {
  panel: RailPanelId | null;
  onPanel: (p: RailPanelId | null) => void;
  onShortcuts: () => void;
}) {
  return (
    <nav className="flex h-full w-[52px] shrink-0 flex-col items-center justify-between px-2.5 pb-2">
      <div className="flex flex-col items-center gap-2 rounded-lg">
        {RAIL.map((r) => {
          const on = r.id === panel;
          return (
            <button
              key={r.id}
              type="button"
              aria-label={r.label}
              aria-pressed={on}
              onClick={() => onPanel(panel === r.id ? null : r.id)}
              className={cn(
                "relative flex size-8 items-center justify-center rounded-lg",
                on ? "bg-white text-[var(--b600)]" : "text-[var(--g900)] hover:bg-[var(--g50)]",
              )}
            >
              <r.icon size={22} />
            </button>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          aria-label="Keyboard shortcuts"
          onClick={onShortcuts}
          className="flex size-8 items-center justify-center rounded-lg bg-white text-[var(--g900)]"
        >
          <I.Keyboard size={22} />
        </button>
      </div>
    </nav>
  );
}

/* ─── Shared ────────────────────────────────────────────────────────────── */

function Avatar({
  initials,
  tone,
  size,
}: {
  initials: string;
  tone: AvatarTone;
  size: "xs" | "sm";
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full text-[var(--g600)]",
        size === "xs" ? "size-6 text-[10px] leading-[15px]" : "size-8 text-[11px] leading-4",
      )}
      style={{ backgroundColor: AVATAR_TONES[tone] }}
    >
      {initials}
    </span>
  );
}

function Checkbox({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <span
      role="checkbox"
      aria-checked={on}
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        onChange();
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange();
        }
      }}
      className={cn(
        "flex size-[14px] shrink-0 cursor-pointer items-center justify-center rounded-[2px] border",
        on
          ? "border-[var(--p600)] bg-[var(--p600)] text-white"
          : "border-[var(--g400)] bg-white",
      )}
    >
      {on ? <I.Check size={8} /> : null}
    </span>
  );
}
