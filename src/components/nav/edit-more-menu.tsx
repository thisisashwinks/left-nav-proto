"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  List,
  ListTree,
  Package,
  PanelLeft,
  Save,
  SquareMenu,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  NAV_GENERATIONS,
  NAV_GENERATION_LABELS,
  type NavGeneration,
} from "@/design/theme";
import { cn } from "@/lib/utils";
import { useAnchored } from "@/lib/use-anchored";
import { useNavTemplates } from "./nav-templates";

/*
 * One glyph per row, and the pairs chosen to depict the difference.
 *
 * All six of these were the same two icons repeated — the parent and both its
 * children shared one, so a drilled-in view showed two identical marks against
 * two opposite choices and the icon column carried no information at all.
 *
 * The pairs now say what the choice IS. A nested list against a flat one is
 * precisely what separates the two navigations, and it is legible at 14px in a
 * way that any two abstract marks would not be. Yours against as-shipped is a
 * person against a sealed box.
 */
const LAYOUT_ICON = PanelLeft;
const OWN_LAYOUT_ICON = UserRound;
const DEFAULT_LAYOUT_ICON = Package;
const NAVIGATION_ICON = SquareMenu;
const NEW_NAV_ICON = ListTree;
const OLD_NAV_ICON = List;

const WIDTH = 244;
const GAP = 6;

type View = "root" | "apply" | "save" | "layout" | "navigation";

/**
 * The edit card's overflow menu: templates, which layout, which navigation.
 *
 * These three were four icons on a 232px row, and the row had run out — adding
 * the fifth clipped the card's own label mid-word. But the count was the symptom.
 * The two that stayed as icons, Show / hide and Colours, change what you are
 * looking at while you arrange it, and get reached for repeatedly in one
 * sitting. These three are decisions you make once and leave: which saved
 * arrangement to use, whose layout to look at, which navigation to run. A
 * control used once per session does not deserve the same real estate as one
 * used once per minute.
 *
 * Drilling down rather than opening submenus beside itself. RowMenu already
 * argued this out for the per-row kebab and the reasoning holds harder here: the
 * card sits at the NAV'S FOOT, so a submenu would have to fly upward across the
 * list it is about, and the pointer would have to travel diagonally to reach it
 * without falling off. One box that stays where it opened, with a back arrow,
 * survives every position the card can be in.
 */
export function EditMoreMenu({
  anchor,
  accountName,
  viewingDefault,
  onShowDefault,
  onRestoreOwn,
  onApplyTemplate,
  onSaveTemplate,
  onClose,
}: {
  anchor: HTMLElement;
  /** Seeds the template name, so saving is one keystroke less. */
  accountName: string;
  viewingDefault: boolean;
  onShowDefault: () => void;
  onRestoreOwn: () => void;
  onApplyTemplate: (templateId: string) => void;
  onSaveTemplate: (name: string) => void;
  onClose: () => void;
}) {
  const { navGeneration, setNavGeneration, effective } = useTheme();
  /*
   * Both rows are behind their own axis, so the menu can be seen without either.
   * Read off `effective` like the rest of the card's chrome.
   */
  const { navSwitchInEditCard, layoutSwitchInEditCard } = effective;
  const { templates } = useNavTemplates();
  const [view, setView] = React.useState<View>("root");
  const [draft, setDraft] = React.useState(`${accountName} nav`);
  const { ref, top, left } = useAnchored(anchor, WIDTH, GAP);

  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      // Escape steps back through the views before it closes the menu — one
      // level of drilling should not cost the whole panel.
      setView((v) => (v === "root" ? (onClose(), "root") : "root"));
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc, true);
    };
  }, [onClose, ref]);

  /*
   * Switching an axis off while its view is open would leave the menu showing a
   * choice the card no longer offers. Adjusted during render rather than in an
   * effect, as elsewhere in this codebase.
   */
  const hidden =
    (view === "layout" && !layoutSwitchInEditCard) ||
    (view === "navigation" && !navSwitchInEditCard);
  const [wasHidden, setWasHidden] = React.useState(hidden);
  if (wasHidden !== hidden) {
    setWasHidden(hidden);
    if (hidden) setView("root");
  }

  const body = (() => {
    if (view === "apply") {
      return (
        <Drill title="Apply a template" onBack={() => setView("root")}>
          {templates.length === 0 ? (
            <p className="px-[7px] py-[6px] text-[12px] leading-[16px] text-nav-fg-subtle">
              Nothing saved yet. Arrange this nav, then save it as a template to
              reuse on other accounts.
            </p>
          ) : (
            templates.map((t) => (
              <MenuRow
                key={t.id}
                icon={LayoutTemplate}
                label={t.name}
                note={`${t.builtIn ? "Preset" : `From ${t.fromAccount}`} · ${t.productCount} products`}
                onSelect={() => {
                  onApplyTemplate(t.id);
                  onClose();
                }}
              />
            ))
          )}
        </Drill>
      );
    }

    if (view === "save") {
      const named = draft.trim();
      return (
        <Drill title="Save as template" onBack={() => setView("root")}>
          <p className="px-[7px] pb-[6px] text-[12px] leading-[16px] text-nav-fg-subtle">
            Keeps this arrangement so you can put it on another account.
          </p>
          <input
            type="text"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || named === "") return;
              onSaveTemplate(named);
              onClose();
            }}
            aria-label="Template name"
            className="mx-[5px] h-[32px] rounded-[7px] bg-nav px-[9px] text-[12.5px] leading-none text-nav-fg shadow-[inset_0_0_0_1px_var(--nav-divider)] focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--nav-fg-subtle)]"
          />
          <button
            type="button"
            disabled={named === ""}
            onClick={() => {
              onSaveTemplate(named);
              onClose();
            }}
            className="motion-tap mx-[5px] mt-[6px] flex h-[30px] items-center justify-center rounded-[7px] bg-nav-fg text-[12.5px] leading-none font-medium text-nav hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save template
          </button>
        </Drill>
      );
    }

    if (view === "layout") {
      return (
        <Drill title="Layout" onBack={() => setView("root")}>
          <MenuRow
            icon={OWN_LAYOUT_ICON}
            label="Your layout"
            note="The arrangement this account has now."
            checked={!viewingDefault}
            onSelect={() => {
              if (viewingDefault) onRestoreOwn();
              onClose();
            }}
          />
          <MenuRow
            icon={DEFAULT_LAYOUT_ICON}
            label="Default layout"
            note="What we ship, and what the help docs show."
            checked={viewingDefault}
            onSelect={() => {
              if (!viewingDefault) onShowDefault();
              onClose();
            }}
          />
        </Drill>
      );
    }

    if (view === "navigation") {
      return (
        <Drill title="Navigation" onBack={() => setView("root")}>
          {NAV_GENERATIONS.map((generation) => (
            <MenuRow
              key={generation}
              icon={generation === "legacy" ? OLD_NAV_ICON : NEW_NAV_ICON}
              label={NAV_GENERATION_LABELS[generation]}
              note={
                generation === "legacy"
                  ? "What ships today — one flat list, no second level."
                  : "This proposal — grouped, with flyouts and pinning."
              }
              checked={generation === navGeneration}
              onSelect={() => {
                setNavGeneration(generation);
                onClose();
              }}
            />
          ))}
        </Drill>
      );
    }

    return (
      <>
        <MenuRow
          icon={Save}
          label="Save as template"
          onSelect={() => setView("save")}
          branch
        />
        <MenuRow
          icon={LayoutTemplate}
          label="Apply a template"
          note={
            templates.length === 1 ? "1 saved" : `${templates.length} saved`
          }
          onSelect={() => setView("apply")}
          branch
        />
        {/*
          The rule only earns its place when there is something under it — with
          both axes off it would close a section that is not there.
        */}
        {layoutSwitchInEditCard || navSwitchInEditCard ? <Rule /> : null}
        {layoutSwitchInEditCard ? (
          <MenuRow
            icon={LAYOUT_ICON}
            label="Layout"
            // The current answer on the row that opens the choice, so the menu
            // says which layout is up without being drilled into.
            note={viewingDefault ? "Default layout" : "Your layout"}
            onSelect={() => setView("layout")}
            branch
          />
        ) : null}
        {navSwitchInEditCard ? (
          <MenuRow
            icon={NAVIGATION_ICON}
            label="Navigation"
            note={NAV_GENERATION_LABELS[navGeneration]}
            onSelect={() => setView("navigation")}
            branch
          />
        ) : null}
      </>
    );
  })();

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="More editing options"
      // Portalled, so it carries its own nav theme — see the icon picker.
      data-nav-theme={effective.navTheme}
      style={{ top, left, width: WIDTH }}
      className="motion-panel-in fixed z-[71] flex max-h-[360px] flex-col overflow-y-auto rounded-[10px] bg-nav p-[5px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
    >
      {body}
    </div>,
    document.body,
  );
}

/** A drilled-in view: its own title, and the way back. */
function Drill({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="motion-tap mb-[2px] flex h-[26px] shrink-0 items-center gap-[5px] rounded-[7px] px-[5px] text-left text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
      >
        <ChevronLeft size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate text-[11px] leading-none font-semibold tracking-[0.4px] uppercase">
          {title}
        </span>
      </button>
      <div className="flex flex-col">{children}</div>
    </>
  );
}

function Rule() {
  return (
    <span
      aria-hidden="true"
      className="my-[4px] h-px w-full shrink-0 bg-nav-divider"
    />
  );
}

function MenuRow({
  icon: Icon,
  label,
  note,
  checked,
  branch = false,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  /** The current answer, or what the row means. Second line, quieter. */
  note?: string;
  /** Ticked, for the rows that are a choice rather than an action. */
  checked?: boolean;
  /** Opens another view rather than acting, so it gets a chevron. */
  branch?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? undefined : "menuitemradio"}
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "motion-tap flex w-full items-start gap-[8px] rounded-[7px] px-[7px] py-[6px] text-left",
        checked ? "bg-nav-hover" : "hover:bg-nav-hover",
      )}
    >
      <Icon
        size={14}
        aria-hidden="true"
        className="mt-[2px] shrink-0 text-nav-fg-subtle"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] leading-[17px] font-medium text-nav-fg">
          {label}
        </span>
        {note ? (
          <span className="block truncate text-[11px] leading-[15px] text-nav-fg-subtle">
            {note}
          </span>
        ) : null}
      </span>
      {checked ? (
        <Check size={13} aria-hidden="true" className="mt-[2px] shrink-0 text-nav-fg" />
      ) : branch ? (
        <ChevronRight
          size={13}
          aria-hidden="true"
          className="mt-[2px] shrink-0 text-nav-fg-subtle"
        />
      ) : null}
    </button>
  );
}
