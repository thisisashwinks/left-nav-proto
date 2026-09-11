"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Copy, LayoutTemplate, Plus, Save, Trash2 } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useAnchored } from "@/lib/use-anchored";
import { useNavTemplates } from "./nav-templates";

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
  const { templates, remove, linkedFor } = useNavTemplates();
  const navTheme = useTheme().effective.navTheme;
  const [naming, setNaming] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const { ref, top, left } = useAnchored(anchor, WIDTH, GAP);

  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
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
              {/*
                Copy before delete, in that order: one of these is how you avoid
                needing the other. Both revealed on the same hover, since
                neither is something you do to a template on the way past.
              */}
              <button
                type="button"
                aria-label={`Duplicate ${t.name}`}
                title="Duplicate"
                onClick={() => onDuplicate(t.id)}
                className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle opacity-0 group-hover/tpl:opacity-100 hover:bg-nav-hover hover:text-nav-fg"
              >
                <Copy size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${t.name}`}
                onClick={() => remove(t.id)}
                className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle opacity-0 group-hover/tpl:opacity-100 hover:bg-nav-hover hover:text-nav-fg"
              >
                <Trash2 size={13} aria-hidden="true" />
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
    </div>,
    document.body,
  );
}
