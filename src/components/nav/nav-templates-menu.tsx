"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CopyPlus,
  EllipsisVertical,
  LayoutTemplate,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useAnchored } from "@/lib/use-anchored";
import { useNavLayout } from "./nav-layout-provider";
import { useNavTemplates } from "./nav-templates";
import { TemplateRowMenu } from "./template-row-menu";
import {
  TemplateMessage,
  TemplateMessageActions,
  TemplateMessageBody,
  TemplateMessageButton,
  TemplateMessageTitle,
} from "./template-message";

/**
 * Save this grouping, or drop a saved one on.
 *
 * Both verbs in one surface because they are two halves of one idea, and an
 * agency meeting the panel with nothing saved should still learn that saving is
 * possible — which a bare empty list would not teach.
 */
const WIDTH = 264;
const GAP = 6;

export function NavTemplatesMenu({
  accountName,
  accountId,
  anchor,
  onCreate,
  onUpdate,
  onDuplicate,
  dirty,
  onApply,
  onClose,
}: {
  accountName: string;
  /** Whose template link is read, to tell "save" from "save as". */
  accountId: string;
  /** The control that opened it, so the panel can stay attached to it. */
  anchor: HTMLElement;
  onCreate: (name: string) => void;
  onUpdate: (templateId: string) => void;
  /** Copies one onto a new template that no account is on. */
  onDuplicate: (templateId: string) => void;
  /** Whether this account has changed since it took its template. */
  dirty: boolean;
  onApply: (templateId: string) => void;
  onClose: () => void;
}) {
  const {
    templates,
    remove,
    rename,
    linkedFor,
    accountsOn,
    accountsOnIds,
    notify,
  } = useNavTemplates();
  const { revertAccounts } = useNavLayout();
  const { navTheme, templateDeleteMode } = useTheme().effective;
  /** The template a delete confirmation is open for. */
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [naming, setNaming] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  /** Which row's kebab menu is open, and the button it hangs off. */
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [menuAt, setMenuAt] = React.useState<HTMLElement | null>(null);
  /*
   * Renaming happens on the row itself.
   *
   * The same move the nav's own rows make: the thing you are naming stays where
   * it is and becomes editable, rather than a dialog showing you the name out
   * of context. It also answers the question that started this — where do I fix
   * "(copy)" — with "where you are already looking".
   */
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameDraft, setRenameDraft] = React.useState("");
  const { ref, top, left } = useAnchored(anchor, WIDTH, GAP);

  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      // The row menu is portalled out of this panel but belongs to it — see
      // data-template-row-menu.
      if (
        target instanceof Element &&
        target.closest("[data-template-row-menu], [data-template-message]")
      ) {
        return;
      }
      onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const linked = linkedFor(accountId);
  const deletingTemplate = deleting
    ? (templates.find((t) => t.id === deleting) ?? null)
    : null;
  const onIt = deleting ? accountsOn(deleting) : 0;

  const commit = () => {
    if (draft.trim() === "") return;
    onCreate(draft);
    setDraft("");
    setNaming(false);
  };

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="Grouping templates"
      // Portalled, so it carries its own nav theme — see the icon picker.
      data-nav-theme={navTheme}
      style={{ top, left, width: WIDTH }}
      className="motion-panel-in fixed z-[71] flex max-h-[340px] flex-col rounded-[10px] bg-nav p-[10px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
    >
      <span className="mb-[6px] block text-[10.5px] leading-[14px] font-semibold tracking-[0.5px] text-nav-fg-subtle uppercase">
        Apply a template
      </span>

      {templates.length === 0 ? (
        <p className="px-[2px] pb-[8px] text-[12px] leading-[16px] text-nav-fg-subtle">
          Nothing saved yet. Arrange this nav, then save it as a template to
          reuse on other accounts.
        </p>
      ) : (
        <div className="mb-[6px] flex min-h-0 flex-col gap-[2px] overflow-y-auto">
          {templates.map((t) => (
            <div key={t.id} className="group/tpl flex items-center gap-[4px]">
              {renamingId === t.id ? (
                /*
                  The row becomes the field, rather than a dialog opening over
                  it. Same width, same place — so the name you are fixing does
                  not move to be fixed.
                */
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={() => {
                    rename(t.id, renameDraft);
                    if (renameDraft.trim() !== "" && renameDraft !== t.name) {
                      notify(`Renamed to ${renameDraft.trim()}`);
                    }
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    /*
                      Enter blurs rather than committing itself.

                      Both keys and the blur used to commit, which meant two
                      paths to keep in step — and once the commit also raised a
                      toast, two chances to raise it twice. One committer.
                    */
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      setRenamingId(null);
                    }
                  }}
                  aria-label={`Rename ${t.name}`}
                  className="min-w-0 flex-1 rounded-[7px] bg-nav-hover px-[7px] py-[6px] text-[13px] leading-[17px] font-medium text-nav-fg outline-none"
                />
              ) : (
              <button
                type="button"
                onClick={() => onApply(t.id)}
                className="motion-tap flex min-w-0 flex-1 items-center gap-[8px] rounded-[7px] px-[7px] py-[6px] text-left hover:bg-nav-hover"
              >
                <LayoutTemplate
                  size={15}
                  aria-hidden="true"
                  className="shrink-0 text-nav-fg-subtle"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] leading-[17px] font-medium text-nav-fg">
                    {t.name}
                  </span>
                  <span className="block truncate text-[11.5px] leading-[15px] text-nav-fg-subtle">
                    {/*
                      Presets say so rather than claiming an origin. "From
                      HighLevel" would have read as another agency's account.
                    */}
                    {t.builtIn ? "Preset" : `From ${t.fromAccount}`} · v
                    {t.version} · {t.productCount} products
                  </span>
                </span>
              </button>
              )}
              {/*
                One kebab, not a row of glyphs.

                Two icons was already a guess — the duplicate one was literally
                `Copy`, which reads as "copy to clipboard" — and there are three
                verbs now. A menu can say the words, which is the only way
                "duplicate" and "copy" stop being the same picture. It is a
                dropdown inside a dropdown, which is a real cost and the lesser
                one: the alternative is four hover-only icons on a 264px row.
              */}
              <button
                type="button"
                aria-label={`More for ${t.name}`}
                aria-haspopup="menu"
                aria-expanded={menuFor === t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuFor((open) => (open === t.id ? null : t.id));
                  setMenuAt(e.currentTarget);
                }}
                className={cn(
                  "motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg",
                  // Held open while its own menu is up, or the row the menu
                  // belongs to loses its handle the moment you reach for it.
                  menuFor === t.id
                    ? "opacity-100"
                    : "opacity-0 group-hover/tpl:opacity-100",
                )}
              >
                <EllipsisVertical size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto border-t border-[var(--nav-divider)] pt-[8px]">
        {naming ? (
          <div className="flex items-center gap-[6px]">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setNaming(false);
                }
              }}
              placeholder="Dentist, Home services…"
              aria-label="Template name"
              className="min-w-0 flex-1 rounded-[6px] bg-nav-hover px-[8px] py-[6px] text-[12.5px] leading-[16px] text-nav-fg outline-none placeholder:text-nav-fg-subtle"
            />
            <button
              type="button"
              onClick={commit}
              aria-label="Save template"
              className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] bg-nav-fg text-nav hover:opacity-90"
            >
              <Check size={14} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            {/*
              Two verbs, the same pair the edit card's menu draws. Save means the
              template this account is already on; Create means a new one. One
              row that did both is what left agencies with three copies of the
              same nav and no way to correct the original.
            */}
            <button
              type="button"
              disabled={linked === null || !dirty}
              onClick={() => linked && onUpdate(linked.id)}
              className="motion-tap flex w-full items-center gap-[7px] rounded-[7px] px-[7px] py-[6px] text-left text-[12.5px] leading-[16px] font-medium text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg disabled:pointer-events-none disabled:opacity-40"
            >
              <Save size={14} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {linked ? `Save to ${linked.name}` : "Save template"}
              </span>
            </button>
            {linked === null ? (
              <p className="px-[7px] pb-[4px] text-[11px] leading-[15px] text-nav-fg-subtle">
                {accountName} isn&rsquo;t on a template yet.
              </p>
            ) : !dirty ? (
              // Why the row above is dead, said once. A disabled control with
              // no reason beside it reads as broken rather than as not-yet.
              <p className="px-[7px] pb-[4px] text-[11px] leading-[15px] text-nav-fg-subtle">
                Nothing to save — this nav still matches {linked.name}.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setNaming(true)}
              className="motion-tap flex w-full items-center gap-[7px] rounded-[7px] px-[7px] py-[6px] text-[12.5px] leading-[16px] font-medium text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
            >
              <Plus size={14} aria-hidden="true" className="shrink-0" />
              Create new template
            </button>
          </>
        )}
      </div>
      {/*
        The row's three verbs, as words.

        Portalled to the body rather than nested in the panel: this list hangs
        off a row inside a 340px-tall scroll region, and drawn inside it the
        menu would be clipped by the very overflow that makes the list scroll.
      */}
      {menuFor !== null && menuAt !== null ? (
        <TemplateRowMenu
          template={templates.find((t) => t.id === menuFor)!}
          anchor={menuAt}
          onRename={() => {
            const t = templates.find((x) => x.id === menuFor);
            if (t) {
              setRenameDraft(t.name);
              setRenamingId(t.id);
            }
            setMenuFor(null);
          }}
          onDuplicate={() => {
            if (menuFor) onDuplicate(menuFor);
            setMenuFor(null);
          }}
          onDelete={() => {
            setDeleting(menuFor);
            setMenuFor(null);
          }}
          onClose={() => setMenuFor(null)}
        />
      ) : null}

      {deletingTemplate ? (
        <TemplateMessage
          kind="decision"
          label={`Delete ${deletingTemplate.name}`}
          onDismiss={() => setDeleting(null)}
        >
          <TemplateMessageTitle icon={<Trash2 size={15} aria-hidden="true" />}>
            Delete {deletingTemplate.name}?
          </TemplateMessageTitle>
          <TemplateMessageBody>
            {onIt === 0 ? (
              <>No accounts are on it. This cannot be undone.</>
            ) : templateDeleteMode === "revert" ? (
              <>
                <strong className="font-medium text-nav-fg">
                  {onIt} {onIt === 1 ? "account goes" : "accounts go"}
                </strong>{" "}
                back to the default navigation. This cannot be undone.
              </>
            ) : (
              <>
                <strong className="font-medium text-nav-fg">
                  {onIt} {onIt === 1 ? "account keeps" : "accounts keep"}
                </strong>{" "}
                the navigation {onIt === 1 ? "it has" : "they have"} and stops
                receiving updates. This cannot be undone.
              </>
            )}
          </TemplateMessageBody>
          <TemplateMessageActions
            dismiss={
              <TemplateMessageButton onClick={() => setDeleting(null)}>
                Keep it
              </TemplateMessageButton>
            }
            actions={[
              <TemplateMessageButton
                key="delete"
                tone="primary"
                onClick={() => {
                  const id = deleting;
                  if (!id) return;
                  if (templateDeleteMode === "revert") {
                    revertAccounts(
                      accountsOnIds(id),
                      `Reverted to default — ${deletingTemplate.name} deleted`,
                    );
                  }
                  remove(id);
                  notify(`Deleted ${deletingTemplate.name}`);
                  setDeleting(null);
                }}
              >
                Delete template
              </TemplateMessageButton>,
            ]}
          />
        </TemplateMessage>
      ) : null}
    </div>,
    document.body,
  );
}
