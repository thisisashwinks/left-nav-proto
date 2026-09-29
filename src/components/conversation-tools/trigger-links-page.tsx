"use client";

import * as React from "react";
import { Copy, EllipsisVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { Modal } from "@/components/page/modal";
import { Toaster, showToast } from "@/components/page/toast";
import { AnchoredPopover, MenuRow } from "@/components/contacts/associated-objects";
import { cn } from "@/lib/utils";
import {
  SEED_CLICKS,
  SEED_LINKS,
  formatStamp,
  linkToken,
  makeKey,
  type TriggerLink,
} from "./trigger-links-data";
import { TriggerLinkModal } from "./trigger-links-modal";
import { TriggerLinksPager, usePager } from "./trigger-links-pager";
import { TriggerLinksAnalyze } from "./trigger-links-analyze";

export type TriggerLinksTab = "link" | "analyze";

const COLS =
  "minmax(180px,1.2fr) minmax(240px,2.2fr) minmax(280px,1.6fr) minmax(170px,1fr) 44px";
const CANVAS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]";
const TABS: { id: TriggerLinksTab; label: string }[] = [
  { id: "link", label: "Link" },
  { id: "analyze", label: "Analyze" },
];

type Overlay =
  | { kind: "add" }
  | { kind: "edit"; link: TriggerLink }
  | { kind: "delete"; link: TriggerLink }
  | null;

function copyKey(key: string) {
  const text = linkToken(key);
  if (!navigator.clipboard) {
    showToast("Can't copy right now. Try again.");
    return;
  }
  navigator.clipboard.writeText(text).then(
    () => showToast("Link key copied"),
    () => showToast("Can't copy right now. Try again."),
  );
}

function RowMenu({ link, onEdit, onDelete }: { link: TriggerLink; onEdit: () => void; onDelete: () => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  const run = (fn: () => void) => () => {
    setAnchor(null);
    fn();
  };
  return (
    <>
      <button
        type="button"
        aria-label={`Actions for ${link.name}`}
        aria-haspopup="menu"
        aria-expanded={anchor != null}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
        className={cn(
          "motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading",
          anchor && "bg-pg text-pg-heading",
        )}
      >
        <EllipsisVertical size={16} aria-hidden="true" />
      </button>
      {anchor ? (
        <AnchoredPopover anchor={anchor} onClose={close} width={180} align="end" label="Row actions">
          <div role="menu" className="flex flex-col p-[4px]">
            <MenuRow icon={Pencil} label="Edit" onClick={run(onEdit)} />
            <MenuRow icon={Copy} label="Copy link key" onClick={run(() => copyKey(link.key))} />
            <MenuRow icon={Trash2} label="Delete" danger onClick={run(onDelete)} />
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/**
 * Conversations ▸ Trigger links.
 *
 * The links live here rather than in each tab, so a link added on Link shows
 * up on Analyze and a deleted one drops out of both.
 */
export function TriggerLinksPage({ initialTab }: { initialTab: TriggerLinksTab }) {
  const [tab, setTab] = React.useState<TriggerLinksTab>(initialTab);
  const [links, setLinks] = React.useState<TriggerLink[]>(SEED_LINKS);
  const [query, setQuery] = React.useState("");
  const [overlay, setOverlay] = React.useState<Overlay>(null);
  const close = React.useCallback(() => setOverlay(null), []);

  const q = query.trim().toLowerCase();
  const rows = q
    ? links.filter((l) => l.name.toLowerCase().includes(q) || l.url.toLowerCase().includes(q))
    : links;
  const { pageRows, ...pager } = usePager(rows);

  const add = ({ name, url }: { name: string; url: string }) => {
    const link: TriggerLink = { id: `tl-${Date.now()}`, name, url, key: makeKey(), added: Date.now() };
    setLinks((list) => [link, ...list]);
    pager.setPage(1);
    showToast("Trigger link added.");
    close();
  };

  const update = (id: string, values: { name: string; url: string }) => {
    setLinks((list) => list.map((l) => (l.id === id ? { ...l, ...values } : l)));
    showToast("Trigger link updated.");
    close();
  };

  const remove = (link: TriggerLink) => {
    setLinks((list) => list.filter((l) => l.id !== link.id));
    showToast("Trigger link deleted.");
    close();
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <PageHeader
        title="Trigger links"
        description="Put trackable links in SMS and email, and trigger events when someone clicks them."
        aside={
          <PrimaryButton className="h-[36px] text-[14px]" onClick={() => setOverlay({ kind: "add" })}>
            <Plus size={16} aria-hidden="true" />
            Add link
          </PrimaryButton>
        }
      />

      <div role="tablist" aria-label="Trigger links" className="flex shrink-0 gap-[20px] border-b border-pg-head-border">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={cn(
                "motion-tap -mb-px flex h-[32px] items-center border-b-2 px-[2px] text-[14px] leading-[20px] font-medium",
                on ? "border-brand text-brand" : "border-transparent text-pg-muted hover:text-pg-text-strong",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <section className={CANVAS}>
        {tab === "analyze" ? (
          <TriggerLinksAnalyze links={links} clicks={SEED_CLICKS} />
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-end border-b border-pg-head-border px-[16px] py-[12px]">
              <label className="relative flex h-[36px] w-[260px] items-center">
                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-[12px] text-pg-faint" />
                <input
                  type="search"
                  aria-label="Search trigger links"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    pager.setPage(1);
                  }}
                  placeholder="Search"
                  className="h-full w-full rounded-[8px] bg-pg-surface pr-[12px] pl-[34px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <div className="min-w-[1080px]">
                <div
                  style={{ gridTemplateColumns: COLS }}
                  className="sticky top-0 z-10 grid h-[40px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
                >
                  {["Name", "Link URL", "Link key", "Date added", ""].map((h, i) => (
                    <span key={h || i} className="truncate text-[13px] leading-[18px] font-medium text-pg-muted">
                      {h}
                    </span>
                  ))}
                </div>

                {rows.length === 0 ? (
                  <div className="flex flex-col items-center gap-[4px] px-[16px] py-[56px] text-center">
                    <p className="text-[14px] leading-[20px] font-medium text-pg-heading">No trigger links found</p>
                    <p className="text-[13px] leading-[18px] text-pg-muted">Try a different name or URL.</p>
                  </div>
                ) : null}

                {pageRows.map((l) => (
                  <div
                    key={l.id}
                    style={{ gridTemplateColumns: COLS }}
                    className="grid h-[48px] items-center gap-[16px] border-b border-pg-row-border px-[16px] hover:bg-pg"
                  >
                    <span title={l.name} className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
                      {l.name}
                    </span>
                    <span title={l.url} className="truncate text-[14px] leading-[20px] text-pg-text">
                      {l.url}
                    </span>
                    <span className="flex min-w-0 items-center gap-[6px]">
                      <span className="truncate font-mono text-[13px] leading-[18px] text-pg-text">
                        {linkToken(l.key)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Copy link key for ${l.name}`}
                        title="Copy link key"
                        onClick={() => copyKey(l.key)}
                        className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-brand"
                      >
                        <Copy size={15} aria-hidden="true" />
                      </button>
                    </span>
                    <span className="truncate text-[14px] leading-[20px] text-pg-text">{formatStamp(l.added)}</span>
                    <span>
                      <RowMenu
                        link={l}
                        onEdit={() => setOverlay({ kind: "edit", link: l })}
                        onDelete={() => setOverlay({ kind: "delete", link: l })}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <TriggerLinksPager state={pager} />
          </>
        )}
      </section>

      {overlay?.kind === "add" ? <TriggerLinkModal onSave={add} onClose={close} /> : null}
      {overlay?.kind === "edit" ? (
        <TriggerLinkModal
          link={overlay.link}
          onSave={(values) => update(overlay.link.id, values)}
          onClose={close}
        />
      ) : null}
      {overlay?.kind === "delete" ? (
        <Modal
          title="Delete this trigger link?"
          width={440}
          onClose={close}
          footer={
            <>
              <OutlineButton className="h-[36px] text-[14px]" onClick={close}>
                Cancel
              </OutlineButton>
              <PrimaryButton
                className="h-[36px] bg-pg-danger text-[14px] hover:shadow-none"
                onClick={() => remove(overlay.link)}
              >
                Delete
              </PrimaryButton>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            This permanently deletes <span className="font-medium text-pg-text-strong">{overlay.link.name}</span>.
            Messages that already use its link key will stop tracking clicks. You can&rsquo;t undo this.
          </p>
        </Modal>
      ) : null}

      <Toaster />
    </div>
  );
}
