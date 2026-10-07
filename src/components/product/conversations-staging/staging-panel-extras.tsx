"use client";

/*
 * Contact Details panel extras, measured from staging (Oct 7, 2026):
 * DND and Actions tab bodies, the Owner / Followers / Tags popovers, the
 * field-filter popover, the "Search not found" state, and the fields that
 * sit inside the collapsed folders.
 *
 * Everything here is simulated — toggles and selections are local state.
 * Colours come from the CSS vars StagingInbox sets on its root
 * (--g50..--g900, --p50..--p700).
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import * as I from "./staging-icons";

type IconProps = { size?: number; className?: string };

function Stroke({ size = 16, className, d }: IconProps & { d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("shrink-0", className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/* ---------- icons (verbatim staging paths) ---------- */

const D_MAIL =
  "M2 7l8.165 5.715c.661.463.992.695 1.351.784a2 2 0 00.968 0c.36-.09.69-.32 1.351-.784L22 7M6.8 20h10.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C22 17.72 22 16.88 22 15.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C19.72 4 18.88 4 17.2 4H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C2 6.28 2 7.12 2 8.8v6.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C4.28 20 5.12 20 6.8 20z";
const D_EDIT =
  "M11 4H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C2 6.28 2 7.12 2 8.8v8.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C4.28 22 5.12 22 6.8 22h8.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C20 19.72 20 18.88 20 17.2V13M8 16h1.675c.489 0 .733 0 .963-.055.204-.05.4-.13.579-.24.201-.123.374-.296.72-.642L21.5 5.5a2.121 2.121 0 00-3-3l-9.563 9.563c-.346.346-.519.519-.642.72a2 2 0 00-.24.579c-.055.23-.055.474-.055.963V16z";
const D_MESSAGE =
  "M7 8.5h5M7 12h8m-5.316 6H16.2c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C21 15.72 21 14.88 21 13.2V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C18.72 3 17.88 3 16.2 3H7.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C3 5.28 3 6.12 3 7.8v12.535c0 .533 0 .8.11.937a.5.5 0 00.39.188c.176 0 .384-.167.8-.5l2.385-1.908c.488-.39.731-.585 1.002-.724.241-.122.497-.212.762-.267C8.748 18 9.06 18 9.684 18z";
const D_PHONE =
  "M12 17.5h.01M8.2 22h7.6c1.12 0 1.68 0 2.108-.218a2 2 0 00.874-.874C19 20.48 19 19.92 19 18.8V5.2c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C17.48 2 16.92 2 15.8 2H8.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C5 3.52 5 4.08 5 5.2v13.6c0 1.12 0 1.68.218 2.108a2 2 0 00.874.874C6.52 22 7.08 22 8.2 22zm4.3-4.5a.5.5 0 11-1 0 .5.5 0 011 0z";
const D_ARROW_DOWN_LEFT = "M17 7L7 17m0 0h10M7 17V7";
const D_INFO = "M12 16v-4m0-4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z";
const D_PLUS = "M12 5v14m-7-7h14";
const D_SEARCH = "M21 21l-3.5-3.5m2.5-6a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z";

/** HighRise select caret (16px viewBox, filled). */
function SelectCaret({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={cn("shrink-0", className)} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.14645 5.64645C3.34171 5.45118 3.65829 5.45118 3.85355 5.64645L8 9.79289L12.1464 5.64645C12.3417 5.45118 12.6583 5.45118 12.8536 5.64645C13.0488 5.84171 13.0488 6.15829 12.8536 6.35355L8.35355 10.8536C8.15829 11.0488 7.84171 11.0488 7.64645 10.8536L3.14645 6.35355C2.95118 6.15829 2.95118 5.84171 3.14645 5.64645Z"
      />
    </svg>
  );
}

/** HighRise tag close "x" (12px viewBox). */
function TagClose({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" className={cn("shrink-0", className)} aria-hidden="true">
      <path d="M2.146 2.146a.5.5 0 01.708 0L6 5.293l3.146-3.147a.5.5 0 01.708.708L6.707 6l3.147 3.146a.5.5 0 01-.708.708L6 6.707 2.854 9.854a.5.5 0 01-.708-.708L5.293 6 2.146 2.854a.5.5 0 010-.708z" />
    </svg>
  );
}

/* ---------- shared bits ---------- */

/** 12px HighRise checkbox (border gray-400, 2px radius). */
export function StagingCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex size-3 shrink-0 items-center justify-center rounded-[2px] border",
        checked ? "border-[var(--p600)] bg-[var(--p600)] text-white" : "border-[var(--g400)] bg-white",
      )}
    >
      {checked ? (
        <svg viewBox="0 0 64 64" width={8} height={8} fill="currentColor" aria-hidden="true">
          <path d="M50.42,16.76L22.34,39.45l-8.1-11.46c-1.12-1.58-3.3-1.96-4.88-0.84c-1.58,1.12-1.95,3.3-0.84,4.88l10.26,14.51c0.56,0.79,1.42,1.31,2.38,1.45c0.16,0.02,0.32,0.03,0.48,0.03c0.8,0,1.57-0.27,2.2-0.78l30.99-25.03c1.5-1.21,1.74-3.42,0.52-4.92C54.13,15.78,51.93,15.55,50.42,16.76z" />
        </svg>
      ) : null}
    </button>
  );
}

/** Accordion item — same metrics as staging-inbox's Folder (mt-2, 12/16 header, gray-200 rule). */
function Accordion({
  title,
  open,
  onToggle,
  extra,
  children,
}: {
  title: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-md border-b border-[var(--g200)] text-[13px] leading-[19.5px]">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
        aria-expanded={open}
        className="relative flex w-full cursor-pointer items-center px-4 py-3 text-left"
      >
        <div className="mr-2 flex min-w-0 flex-1 items-center justify-between gap-2">
          {typeof title === "string" ? (
            <p className="text-[14px] leading-5 font-medium text-[var(--g900)]">{title}</p>
          ) : (
            title
          )}
          {extra}
        </div>
        <I.ChevronDown size={16} className={cn("shrink-0 text-[var(--g600)]", open && "rotate-180")} />
      </div>
      {open ? <div className="border-t border-[var(--g200)] bg-white">{children}</div> : null}
    </div>
  );
}

const popShadow = "shadow-[0_2px_4px_-2px_rgba(16,24,40,0.06),0_4px_8px_-2px_rgba(16,24,40,0.1)]";

/** Closes on outside pointerdown / Escape. Anchor = the popover's parent. */
function useDismiss(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  React.useEffect(() => {
    const down = (e: PointerEvent) => {
      const anchor = ref.current?.parentElement;
      if (anchor && !anchor.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [ref, onClose]);
}

/**
 * Places a popover against the window, under its trigger (the popover's
 * parent element), and keeps it fully on screen.
 *
 * The contact panel scrolls, so a popover positioned inside it is clipped at
 * the panel's edge and, once its search field takes focus, scrolls the whole
 * panel sideways to reveal itself. Fixed to the window, it does neither.
 */
function useFixedAnchor(
  ref: React.RefObject<HTMLElement | null>,
  { gap, align, width }: { gap: number; align: "start" | "center"; width: number },
) {
  const [style, setStyle] = React.useState<React.CSSProperties>({ visibility: "hidden" });
  React.useLayoutEffect(() => {
    const place = () => {
      const anchor = ref.current?.parentElement;
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const wanted = align === "center" ? r.left + r.width / 2 - width / 2 : r.left;
      const left = Math.max(8, Math.min(wanted, window.innerWidth - width - 8));
      setStyle({ position: "fixed", top: r.bottom + gap, left, width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [ref, gap, align, width]);
  return style;
}

/** Popover arrow: 12px rotated square, gray-300 edge, sits on the menu's top edge. */
function Arrow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute -top-[6px] size-3 rotate-45 border-t border-l border-[var(--g300)] bg-white",
        className,
      )}
    />
  );
}

function MenuSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="px-2 pt-3 pb-2">
      <div className="flex h-6 items-center rounded-[4px] border border-[var(--g300)] bg-white px-1.5 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] focus-within:border-[var(--p600)] focus-within:shadow-[0_0_0_4px_#D1E0FF,0_1px_2px_0_rgba(16,24,40,0.05)]">
        <Stroke d={D_SEARCH} size={12} className="mr-1 text-[var(--g700)]" />
        <input
          ref={(el) => el?.focus({ preventScroll: true })}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[var(--g900)] outline-none placeholder:text-[var(--g700)]"
        />
      </div>
    </div>
  );
}

/* ---------- DND tab ---------- */

const DND_CHANNELS: { id: string; label: string; d: string; manage?: boolean }[] = [
  { id: "email", label: "Email", d: D_MAIL, manage: true },
  { id: "sms", label: "Text Messages", d: D_MESSAGE },
  { id: "calls", label: "Calls & voicemail", d: D_PHONE },
];

/** Body of the DND tab (replaces the placeholder; no search box on this tab). */
export function DndTab() {
  const [open, setOpen] = React.useState(true);
  const [on, setOn] = React.useState<Record<string, boolean>>({});
  const all = DND_CHANNELS.every((c) => on[c.id]);
  const setAll = (v: boolean) => setOn((s) => ({ ...s, ...Object.fromEntries(DND_CHANNELS.map((c) => [c.id, v])) }));

  const row = (label: React.ReactNode, checked: boolean, set: (v: boolean) => void, aria: string) => (
    <div className="flex min-h-5 items-center justify-between gap-1">
      <div className="flex min-w-0 items-center gap-2">{label}</div>
      <StagingCheckbox checked={checked} onChange={set} label={aria} />
    </div>
  );

  return (
    <div className="flex flex-col">
      <Accordion title="DND" open={open} onToggle={() => setOpen((o) => !o)}>
        <div className="flex flex-col bg-white">
          <div className="border-b border-[var(--g200)] px-4 py-3">
            {row(
              <p className="text-[14px] leading-5 text-[var(--g700)]">DND All Channels</p>,
              all,
              setAll,
              "DND All Channels",
            )}
          </div>
          <div className="px-4 py-3">
            <div className="flex h-[18px] items-center gap-2">
              <span className="h-px flex-1 bg-[var(--g200)]" />
              <span className="text-[13px] leading-[18px] font-medium text-[var(--g600)]">OR</span>
              <span className="h-px flex-1 bg-[var(--g200)]" />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {DND_CHANNELS.map((c) => (
                <React.Fragment key={c.id}>
                  {row(
                    <>
                      <Stroke d={c.d} size={16} className="text-[var(--g900)]" />
                      <p className="shrink-0 text-[14px] leading-5 text-[var(--g700)]">{c.label}</p>
                      {c.manage ? (
                        <span className="flex min-w-0 cursor-pointer items-center gap-1 text-[var(--p700)]">
                          <Stroke d={D_EDIT} size={16} />
                          <span className="truncate text-[14px] leading-[22px] font-semibold">Manage subscriptions</span>
                        </span>
                      ) : null}
                    </>,
                    !!on[c.id],
                    (v) => setOn((s) => ({ ...s, [c.id]: v })),
                    c.label,
                  )}
                </React.Fragment>
              ))}
              {row(
                <>
                  <Stroke d={D_ARROW_DOWN_LEFT} size={16} className="text-[var(--g900)]" />
                  <p className="text-[14px] leading-5 text-[var(--g700)]">Inbound Calls and SMS</p>
                  <Stroke d={D_INFO} size={14} className="text-[var(--g700)]" />
                </>,
                !!on.inbound,
                (v) => setOn((s) => ({ ...s, inbound: v })),
                "Inbound Calls and SMS",
              )}
            </div>
          </div>
        </div>
      </Accordion>
    </div>
  );
}

/* ---------- Actions tab ---------- */

function SmallButton({ children, tone = "default", className }: { children: React.ReactNode; tone?: "default" | "primary-soft" | "disabled"; className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 items-center justify-center rounded-[4px] px-2 text-[14px] leading-[17px] font-semibold whitespace-nowrap",
        tone === "default" && "border border-[var(--g300)] bg-white text-[var(--g600)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]",
        tone === "primary-soft" && "bg-[var(--p50)] text-[var(--p700)]",
        tone === "disabled" && "cursor-not-allowed bg-[var(--hr-primary-200,#B2CCFF)] text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

const fieldLabel = "text-[13px] leading-5 font-medium text-[var(--g600)]";

/** Body of the Actions tab: Opps, Workflows, Client portal, Engagement Score (all collapsed by default, as on staging). */
export function ActionsTab({ email = "shubham.kushwah+admin1@gohighlevel.com" }: { email?: string }) {
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  const flip = (k: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const [course, setCourse] = React.useState(true);
  const [points, setPoints] = React.useState("0");

  return (
    <div className="flex flex-col">
      <Accordion
        title="Opps"
        open={open.has("opps")}
        onToggle={() => flip("opps")}
        extra={
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[var(--g700)]"
          >
            <Stroke d={D_PLUS} size={16} className="text-[var(--g600)]" />
            <span className="text-[12px] leading-[17px] font-semibold">Add</span>
          </span>
        }
      >
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex w-full flex-col items-center gap-2 p-2 text-center">
              <p className="text-[11px] leading-4 font-semibold text-[var(--g900)]">No Opp Found</p>
              <div className="flex w-full items-center justify-center gap-2 py-0.5">
                <SmallButton className="flex-1">Create new</SmallButton>
                <SmallButton tone="primary-soft" className="flex-1">Link existing</SmallButton>
              </div>
            </div>
          </div>
        </div>
      </Accordion>

      <Accordion title="Workflows" open={open.has("wf")} onToggle={() => flip("wf")}>
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <p className={fieldLabel}>Active workflows</p>
            <button
              type="button"
              aria-label="Add to workflow"
              className="flex size-5 items-center justify-center rounded-full border border-[var(--g300)] bg-white text-[var(--p700)]"
            >
              <Stroke d={D_PLUS} size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <p className={fieldLabel}>Past workflows</p>
            <p className="text-[15px] leading-5 font-medium text-[var(--g500)]">No past workflows</p>
          </div>
        </div>
      </Accordion>

      <Accordion title="Client portal" open={open.has("cp")} onToggle={() => flip("cp")}>
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <p className={fieldLabel}>Course Access</p>
              <p className="cursor-pointer text-[13px] leading-[18px] font-medium text-[var(--p500)]">Course progress</p>
            </div>
            <div className="relative flex h-10 items-center rounded-md border border-[var(--g300)] bg-white py-2 pr-9 pl-3">
              {course ? (
                <span className="relative flex h-6 items-center rounded-[4px] border border-[var(--g300)] bg-white pr-6 pl-2 text-[13px] leading-[18px] font-medium text-[var(--g600)]">
                  course 29 June 2026
                  <button type="button" aria-label="Remove" onClick={() => setCourse(false)} className="absolute right-1.5 text-[var(--g600)]">
                    <TagClose size={12} />
                  </button>
                </span>
              ) : null}
              <SelectCaret size={16} className="absolute right-3 text-[var(--g500)]" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className={fieldLabel}>Community groups</p>
            <div className="relative flex h-10 items-center rounded-md border border-[var(--g300)] bg-white py-2 pr-9 pl-3">
              <span className="flex h-6 max-w-[144px] cursor-not-allowed items-center truncate text-[13px] leading-[18px] font-medium text-[var(--g400)] opacity-50">
                Branded App Review Community
              </span>
              <SelectCaret size={16} className="absolute right-3 text-[var(--g500)]" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <p className={fieldLabel}>Client portal email</p>
              <Stroke d={D_INFO} size={14} className="text-[var(--g400)]" />
            </div>
            <div className="flex h-9 items-center rounded-md border border-[var(--g300)] bg-white px-2">
              <input readOnly value={email} className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[var(--g900)] outline-none" />
            </div>
          </div>
          <div className="flex gap-3 py-1">
            <p className="cursor-pointer text-[13px] leading-[18px] font-medium text-[var(--p500)]">Change password</p>
            <p className="cursor-pointer text-[13px] leading-[18px] font-medium text-[var(--p500)]">Send reset link</p>
          </div>
        </div>
      </Accordion>

      <Accordion
        title="Engagement Score"
        open={open.has("es")}
        onToggle={() => flip("es")}
        extra={
          <span className="flex items-center rounded-md border border-[var(--g200)] bg-[var(--p500)] py-0.5">
            <span className="px-2 text-[13px] leading-[18px] font-medium text-white">2</span>
          </span>
        }
      >
        <div className="px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <div className="relative flex h-7 w-[119px] items-center rounded-md border border-[var(--g300)] bg-white pr-7 pl-2 text-[14px] text-[var(--g900)]">
                Add
                <SelectCaret size={16} className="absolute right-2 text-[var(--g500)]" />
              </div>
              <input
                value={points}
                onChange={(e) => setPoints(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="h-7 w-[70px] rounded-md border border-[var(--g300)] bg-white px-2 text-[14px] text-[var(--g900)] outline-none"
              />
              <p className="text-[14px] leading-5 text-[var(--g500)]">Points</p>
            </div>
            <div className="flex items-center gap-1">
              <SmallButton className="h-7 text-[12px]">Cancel</SmallButton>
              <SmallButton tone="disabled" className="h-7 text-[12px]">Save</SmallButton>
            </div>
          </div>
        </div>
      </Accordion>
    </div>
  );
}

/* ---------- Owner / Followers ---------- */

/**
 * Owner / Followers popover. On staging both lists come back empty for this
 * account: the menu is a search box, and typing shows "No results found".
 */
/** Dummy teammates — staging's account returns none, which leaves the menu empty. */
export const STAGING_USERS = [
  "Ashwin K S",
  "Shubham Kushwah",
  "Sourav Paul",
  "Milan Katira",
  "Shrey Gupta",
  "Sai Siddhardha",
  "Maruthi L",
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function PeopleMenu({
  onClose,
  users = STAGING_USERS,
  selected = [],
  onPick,
  multi = false,
}: {
  onClose: () => void;
  users?: string[];
  selected?: string[];
  onPick?: (name: string) => void;
  multi?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  useDismiss(ref, onClose);
  const style = useFixedAnchor(ref, { gap: 4, align: "start", width: 256 });
  const [q, setQ] = React.useState("");
  const hits = users.filter((u) => u.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={style} className={cn("z-[1000] rounded-[4px] bg-white pb-1", popShadow)}>
      <MenuSearch value={q} onChange={setQ} />
      {hits.length === 0 ? (
        <p className="px-2 pb-1 text-[14px] leading-5 text-[var(--g500)]">No results found</p>
      ) : (
        <div className="max-h-[240px] overflow-y-auto">
          {hits.map((u) => {
            const on = selected.includes(u);
            return (
              <button
                key={u}
                type="button"
                onClick={() => {
                  onPick?.(u);
                  if (!multi) onClose();
                }}
                className={cn(
                  "mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-[13px] leading-[18px] text-[var(--g700)] hover:bg-[var(--g50)]",
                  on && "bg-[var(--p50)]",
                )}
              >
                {multi ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-3.5 shrink-0 items-center justify-center rounded-[2px] border",
                      on ? "border-[var(--p600)] bg-[var(--p600)] text-white" : "border-[var(--g400)] bg-white",
                    )}
                  >
                    {on ? <Stroke d="M20 6L9 17l-5-5" size={10} /> : null}
                  </span>
                ) : null}
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--g100)] text-[9px] font-medium text-[var(--g600)]">
                  {initialsOf(u)}
                </span>
                <span className="min-w-0 flex-1 truncate">{u}</span>
                {!multi && on ? (
                  <Stroke d="M20 6L9 17l-5-5" size={14} className="text-[var(--p600)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type PeopleMenuProps = {
  onClose: () => void;
  users?: string[];
  selected?: string[];
  onPick?: (name: string) => void;
};

/** Owner: one person; picking closes the menu. */
export function OwnerMenu(props: PeopleMenuProps) {
  return <PeopleMenu {...props} />;
}

/** Followers: any number; the menu stays open while you tick. */
export function FollowersMenu(props: PeopleMenuProps) {
  return <PeopleMenu {...props} multi />;
}

/* ---------- Tags ---------- */

/** The only tag option on this staging account. */
export const STAGING_TAG_OPTIONS = ["six"];

/** Tags popover: 256px, centred under the 14px "+" with an arrow; search + checkbox options. */
export function TagsMenu({ onClose, options = STAGING_TAG_OPTIONS }: { onClose: () => void; options?: string[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useDismiss(ref, onClose);
  const tagsStyle = useFixedAnchor(ref, { gap: 10, align: "center", width: 256 });
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState<Set<string>>(new Set());
  const hits = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      ref={ref}
      style={tagsStyle}
      className={cn("z-[1000] rounded-[4px] border border-[var(--g300)] bg-white pb-1", popShadow)}
    >
      <Arrow className="left-1/2 -ml-1.5" />
      <div className="relative max-h-[320px] overflow-y-auto">
        <MenuSearch value={q} onChange={setQ} />
        {hits.length === 0 ? (
          <p className="px-2 pb-1 text-[14px] leading-5 text-[var(--g500)]">No results found</p>
        ) : (
          hits.map((o) => {
            const on = sel.has(o);
            const toggle = () =>
              setSel((s) => {
                const n = new Set(s);
                if (n.has(o)) n.delete(o);
                else n.add(o);
                return n;
              });
            return (
              <div key={o} onClick={toggle} className="flex w-full cursor-pointer items-center gap-1 rounded-md px-2 py-1 hover:bg-[var(--g50)]">
                <span className="mr-1" onClick={(e) => e.stopPropagation()}>
                  <StagingCheckbox checked={on} onChange={toggle} label={o} />
                </span>
                <span className="block truncate text-[13px] leading-[19.5px] font-medium text-[var(--g700)]">{o}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------- Field filter ---------- */

export type FieldFilter = "hide-empty" | "only-empty" | null;

export const FIELD_FILTER_OPTIONS: { id: Exclude<FieldFilter, null>; label: string }[] = [
  { id: "hide-empty", label: "Hide empty fields and folders" },
  { id: "only-empty", label: "Show only empty fields and folders" },
];

/**
 * Popover from the filter icon inside "Search fields and folders".
 * Mount inside the search box (it is `relative`): menu is 247px, right-aligned
 * 8px in from the box edge, 10px below it, arrow over the icon.
 */
export function FieldFilterMenu({
  value,
  onChange,
  onClose,
}: {
  value: FieldFilter;
  onChange: (v: FieldFilter) => void;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  useDismiss(ref, onClose);
  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-[calc(100%+10px)] right-2 z-50 flex w-[247px] flex-col gap-0.5 rounded-[4px] border border-[var(--g300)] bg-white p-1",
        popShadow,
      )}
    >
      <Arrow className="right-[15px]" />
      {FIELD_FILTER_OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => {
            onChange(value === o.id ? null : o.id);
            onClose();
          }}
          className={cn(
            "relative flex h-[26px] w-full items-center rounded-[4px] px-2 py-1 text-left text-[13px] leading-[18px] text-[var(--g700)] hover:bg-[var(--g50)]",
            value === o.id && "bg-[var(--p50)] text-[var(--p700)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Search ---------- */

/** "Search not found" state shown in place of the folders when nothing matches. */
export function SearchNotFound({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 pt-10">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--g100)] p-2 text-[var(--g600)]">
          <Stroke d={D_SEARCH} size={32} />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[14px] leading-5 font-semibold text-[var(--g700)]">Search not found</p>
          <p className="max-w-[171px] text-[13px] leading-[18px] text-[var(--g500)]">
            Your search &quot;{query}&quot; did not match any results. Please try again.
          </p>
          <button
            type="button"
            onClick={onClear}
            className="h-6 rounded-[4px] border border-[var(--g300)] bg-white px-1.5 text-[11px] leading-4 font-semibold text-[var(--g600)]"
          >
            Clear search
          </button>
        </div>
      </div>
    </div>
  );
}

/** True when `label` matches the search query (staging: case-insensitive substring). */
export function fieldMatches(label: string, query: string) {
  return label.toLowerCase().includes(query.trim().toLowerCase());
}

/* ---------- Folder fields ---------- */

/**
 * Fields inside the collapsed folders (first ~8-14, in staging order).
 * `value` undefined renders as "--". Folders not listed show staging's
 * "No fields in this folder" (not verified for every folder).
 */
export const STAGING_FOLDER_FIELDS: Record<string, { label: string; value?: string }[]> = {
  "General Info": [
    { label: "Business name" },
    { label: "Street address" },
    { label: "City" },
    { label: "Country", value: "United States" },
    { label: "State" },
    { label: "Postal code" },
    { label: "Website" },
    { label: "Time zone" },
    { label: "check 99" },
    { label: "are you human?" },
    { label: "who you feel today" },
    { label: "Elephants are in zoo why?" },
    { label: "your favourite prime number?" },
    { label: "Dev Steps" },
  ],
  "Additional Info": [
    { label: "Test single option.", value: "Test single option." },
    { label: "MyCB", value: "CB" },
    { label: "largy txt" },
    { label: "Exercises you are interested in" },
    { label: "Permission 3" },
    { label: "This is only radio?", value: "This is only radio?" },
    { label: "What is your current credit score to the best of your knowledge?", value: "What is your current credit score to the best of your knowledge?" },
    { label: "This is radio?", value: "This is radio?" },
    { label: "yearly income", value: "incom" },
  ],
  "Vehicle Info": [{ label: "Vehicle No" }, { label: "vehicle make" }],
};
