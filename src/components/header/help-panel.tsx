"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarDays,
  Check,
  Compass,
  Copy,
  Crown,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  LifeBuoy,
  Mail,
  Megaphone,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  NAV_TOUR_RESTART_FLOWS,
  startNavTour,
  useNavTourRestart,
  type RestartableFlowId,
} from "@/components/nav/nav-tour";
import { cn } from "@/lib/utils";

const WIDTH = 460;
const RELATIONSHIP_NUMBER = "0-001-323";
/** How long the in-panel notice stays. */
const NOTICE_MS = 2400;

/** A row in the list: an illustrative icon on a soft tint, a title, a line. */
interface HelpLink {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  /** The tint, as a token family: `--hr-<tint>-50` behind `--hr-<tint>-600`. */
  tint: string;
  external?: boolean;
}

const LINKS: readonly HelpLink[] = [
  {
    id: "help-center",
    title: "Visit our help center",
    body: "View your support tickets, support articles, and FAQs.",
    icon: LifeBuoy,
    tint: "teal",
    external: true,
  },
  {
    id: "certified-admin",
    title: "Connect with a certified admin",
    body: "Find HighLevel experts who can set up your system, automate workflows, or customize your project.",
    icon: BadgeCheck,
    tint: "indigo",
    external: true,
  },
  {
    id: "courses",
    title: "HighLevel courses",
    body: "Browse courses in HighLevel University.",
    icon: GraduationCap,
    tint: "purple",
    external: true,
  },
  {
    id: "facebook",
    title: "Join our Facebook group",
    body: "Be part of the fastest-growing community.",
    icon: Users,
    tint: "primary",
    external: true,
  },
  {
    id: "announcements",
    title: "Announcements",
    body: "Keep up with the latest news and releases.",
    icon: Megaphone,
    tint: "orange",
    external: true,
  },
  {
    id: "events",
    title: "HighLevel events",
    body: "Join upcoming webinars, meetups, and conferences.",
    icon: CalendarDays,
    tint: "success",
    external: true,
  },
  {
    id: "contact",
    title: "Contact us",
    body: "Reach our support team by email or phone.",
    icon: Mail,
    tint: "pink",
    external: true,
  },
];

/**
 * Help & support, from the app bar's Help.
 *
 * Production's panel, drawn in the SideDrawer's shape — a card floating clear
 * of the window on three sides, no scrim — at the panel's own 460. Nothing in
 * it goes anywhere: the links and the three support buttons say so in a
 * notice rather than opening a page this prototype does not have.
 *
 * It is also where two of the tour-restart options live: a "Take the
 * navigation tour" row heading the list, or a "New navigation" card under
 * Support access. See NAV_TOUR_RESTARTS. Ashwin, Oct 28.
 */
export function HelpPanel({ onClose }: { onClose: () => void }) {
  const tourRow = useNavTourRestart("helpRow");
  const tourCard = useNavTourRestart("helpCard");
  const [supportAccess, setSupportAccess] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [notice, setNotice] = React.useState<{ text: string; id: number } | null>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  React.useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const say = (text: string) => setNotice({ text, id: Date.now() });
  const nowhere = () => say("This prototype doesn’t open external pages.");
  const tour = (flow: RestartableFlowId) => {
    onClose();
    startNavTour(flow);
  };

  return createPortal(
    <aside
      role="dialog"
      aria-label="Help & support"
      data-page-theme="light"
      style={{ width: WIDTH }}
      className="help-panel-in fixed top-[8px] right-[8px] bottom-[8px] z-[80] flex max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.22),0_0_0_1px_var(--hr-gray-200)]"
    >
      {/* The SideDrawer's arrival, from the right edge it is pinned to. */}
      <style>{`
        @keyframes help-panel-in {
          from { opacity: 0; transform: translate3d(24px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .help-panel-in { animation: help-panel-in var(--dur-base) var(--ease-out) both; }
      `}</style>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col gap-[4px] px-[16px] pt-[16px] pb-[12px]">
          <div className="flex items-center gap-[8px]">
            <h2 className="min-w-0 flex-1 text-[16px] leading-[24px] font-semibold text-[var(--hr-gray-900)]">
              Help &amp; support
            </h2>
            <button
              type="button"
              aria-label="Close help and support"
              onClick={onClose}
              className="motion-tap -mr-[4px] flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-[var(--hr-gray-500)] hover:bg-[var(--hr-gray-100)] hover:text-[var(--hr-gray-700)]"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <p className="text-[14px] leading-[20px] text-[var(--hr-gray-600)]">
            Whether you want to talk to us, the community, or learn on your own,
            we’ve got you covered.
          </p>
        </div>

        <div className="flex flex-col gap-[12px] px-[16px] pb-[16px]">
          {/* Relationship number */}
          <div className="flex items-center gap-[8px]">
            <span className="text-[14px] leading-[20px] font-medium text-[var(--hr-gray-900)]">
              Relationship number
            </span>
            <span className="group/tip relative flex">
              <HelpCircle
                size={14}
                tabIndex={0}
                aria-label="Share this number when you contact support"
                className="text-[var(--hr-gray-400)] outline-none"
              />
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 rounded-[4px] bg-[var(--hr-gray-900)] px-[8px] py-[4px] text-[12px] leading-[16px] font-medium whitespace-nowrap text-white opacity-0 shadow-[0_4px_12px_0_rgba(15,23,42,0.24)] transition-opacity group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
              >
                Share this number when you contact support
              </span>
            </span>
            <span className="text-[14px] leading-[20px] text-[var(--hr-gray-600)]">
              {RELATIONSHIP_NUMBER}
            </span>
            <button
              type="button"
              aria-label={copied ? "Copied" : "Copy relationship number"}
              onClick={() => {
                void navigator.clipboard?.writeText(RELATIONSHIP_NUMBER).catch(() => {});
                setCopied(true);
              }}
              className={cn(
                "motion-tap flex h-[24px] items-center gap-[4px] rounded-[4px] px-[4px] text-[13px] leading-[18px]",
                copied
                  ? "text-[var(--hr-success-600)]"
                  : "text-[var(--hr-gray-500)] hover:bg-[var(--hr-gray-100)] hover:text-[var(--hr-gray-700)]",
              )}
            >
              {copied ? (
                <>
                  <Check size={14} aria-hidden="true" />
                  Copied
                </>
              ) : (
                <Copy size={14} aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Support access */}
          <div className="flex items-start gap-[12px] rounded-[8px] border border-[var(--hr-gray-200)] p-[12px]">
            <ShieldCheck
              size={20}
              aria-hidden="true"
              className="mt-[2px] shrink-0 text-[var(--hr-gray-600)]"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
              <p className="text-[14px] leading-[20px] font-semibold text-[var(--hr-gray-900)]">
                Support access
              </p>
              <p className="text-[13px] leading-[18px] text-[var(--hr-gray-600)]">
                {supportAccess ? (
                  <>
                    Authorized HighLevel support specialists can access your
                    account until{" "}
                    <strong className="font-semibold text-[var(--hr-gray-900)]">
                      Nov 30, 2030
                    </strong>
                    .
                  </>
                ) : (
                  "HighLevel support specialists can’t access your account."
                )}
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  say("Support access settings aren’t in this prototype.");
                }}
                className="motion-tap flex items-center gap-[4px] self-start text-[13px] leading-[18px] font-medium text-[var(--hr-primary-600)] hover:text-[var(--hr-primary-700)]"
              >
                Manage support access
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
            <Switch
              checked={supportAccess}
              onChange={setSupportAccess}
              label="Support access"
            />
          </div>

          {tourCard ? (
            <div className="flex flex-col gap-[8px] rounded-[8px] border border-[var(--hr-primary-200)] bg-[var(--hr-primary-50)] p-[12px]">
              <div className="flex flex-col gap-[2px]">
                <p className="text-[14px] leading-[20px] font-semibold text-[var(--hr-gray-900)]">
                  New navigation
                </p>
                <p className="text-[13px] leading-[18px] text-[var(--hr-gray-600)]">
                  Take a quick tour of the new sidebar.
                </p>
              </div>
              <div className="flex flex-wrap gap-[8px]">
                {NAV_TOUR_RESTART_FLOWS.map((flow) => (
                  <button
                    key={flow.id}
                    type="button"
                    onClick={() => tour(flow.id)}
                    className="motion-tap h-[28px] rounded-[4px] border border-[var(--hr-gray-300)] bg-white px-[10px] text-[13px] leading-[18px] font-medium text-[var(--hr-gray-700)] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[var(--hr-gray-50)] hover:text-[var(--hr-gray-900)]"
                  >
                    {flow.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <span aria-hidden="true" className="block h-px w-full bg-[var(--hr-gray-200)]" />

        {/* Highly */}
        <div className="flex flex-col items-center gap-[4px] px-[16px] pt-[20px] pb-[16px] text-center">
          <span
            aria-hidden="true"
            className="mb-[8px] flex size-[56px] items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--hr-primary-500),var(--hr-purple-500))] text-white shadow-[0_4px_12px_rgba(16,24,40,0.12)]"
          >
            <Bot size={28} strokeWidth={1.75} />
          </span>
          <p className="text-[16px] leading-[24px] font-semibold text-[var(--hr-gray-900)]">
            Hi, I’m Highly
          </p>
          <p className="text-[14px] leading-[20px] text-[var(--hr-gray-600)]">
            Your support specialist
          </p>
          <p className="text-[13px] leading-[18px] text-[var(--hr-gray-600)]">
            Use any of these buttons to get help.
          </p>
          <div className="mt-[12px] flex w-full gap-[8px]">
            {(["Start Zoom", "Start chat", "Raise ticket"] as const).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => say(`${label} isn’t wired up in this prototype.`)}
                className="motion-tap h-[36px] flex-1 rounded-[6px] bg-[var(--hr-primary-600)] px-[12px] text-[14px] leading-[20px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[var(--hr-primary-700)] active:scale-[0.98]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* The list */}
        <ul className="border-t border-[var(--hr-gray-200)]">
          {tourRow ? (
            <li className="flex gap-[12px] border-b border-[var(--hr-gray-200)] px-[16px] py-[12px]">
              <Tint icon={Compass} tint="primary" />
              <div className="flex min-w-0 flex-col gap-[2px]">
                <p className="text-[14px] leading-[20px] font-medium text-[var(--hr-gray-900)]">
                  Take the navigation tour
                </p>
                <p className="text-[13px] leading-[18px] text-[var(--hr-gray-600)]">
                  A short walkthrough of the new sidebar.
                </p>
                <p className="flex flex-wrap items-center gap-x-[6px] text-[13px] leading-[18px]">
                  {NAV_TOUR_RESTART_FLOWS.map((flow, i) => (
                    <React.Fragment key={flow.id}>
                      {i > 0 ? (
                        <span aria-hidden="true" className="text-[var(--hr-gray-400)]">
                          ·
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => tour(flow.id)}
                        className="motion-tap font-medium text-[var(--hr-primary-600)] underline-offset-2 hover:text-[var(--hr-primary-700)] hover:underline"
                      >
                        {flow.label}
                      </button>
                    </React.Fragment>
                  ))}
                </p>
              </div>
            </li>
          ) : null}
          <li className="border-b border-[var(--hr-gray-200)] bg-[var(--hr-gray-50)]">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                say("Premium support isn’t in this prototype.");
              }}
              className="flex gap-[12px] px-[16px] py-[12px] hover:bg-[var(--hr-gray-100)]"
            >
              <Tint icon={Crown} tint="warning" />
              <span className="flex min-w-0 flex-col gap-[2px]">
                <span className="flex items-center gap-[8px] text-[14px] leading-[20px] font-medium text-[var(--hr-gray-900)]">
                  Premium support
                  <span className="rounded-full bg-[var(--hr-warning-100)] px-[8px] py-[1px] text-[12px] leading-[16px] font-medium text-[var(--hr-warning-700)]">
                    Upgrade
                  </span>
                </span>
                <span className="text-[13px] leading-[18px] text-[var(--hr-gray-600)]">
                  Get priority troubleshooting, expert guidance, and direct
                  access to our technical team via Slack.
                </span>
              </span>
            </a>
          </li>
          {LINKS.map((link) => (
            <li
              key={link.id}
              className="border-b border-[var(--hr-gray-200)] last:border-b-0"
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  nowhere();
                }}
                className="flex gap-[12px] px-[16px] py-[12px] hover:bg-[var(--hr-gray-50)]"
              >
                <Tint icon={link.icon} tint={link.tint} />
                <span className="flex min-w-0 flex-col gap-[2px]">
                  <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-[var(--hr-gray-900)]">
                    {link.title}
                    {link.external ? (
                      <ExternalLink
                        size={14}
                        aria-label="Opens in a new tab"
                        className="shrink-0 text-[var(--hr-gray-400)]"
                      />
                    ) : null}
                  </span>
                  <span className="text-[13px] leading-[18px] text-[var(--hr-gray-600)]">
                    {link.body}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {notice ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[16px] flex justify-center px-[16px]">
          <div
            key={notice.id}
            role="status"
            className="motion-slot-in flex h-[38px] max-w-full items-center rounded-[10px] bg-pg-overlay px-[14px] shadow-[0_8px_24px_0_rgba(15,23,42,0.28)]"
          >
            <span className="truncate text-[13px] leading-none whitespace-nowrap text-pg-surface">
              {notice.text}
            </span>
          </div>
        </div>
      ) : null}
    </aside>,
    document.body,
  );
}

/** A 40px illustrative mark: the icon on a soft circle of its own tint. */
function Tint({ icon: Icon, tint }: { icon: LucideIcon; tint: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        background: `var(--hr-${tint}-50)`,
        color: `var(--hr-${tint}-600)`,
      }}
      className="flex size-[40px] shrink-0 items-center justify-center rounded-full"
    >
      <Icon size={20} strokeWidth={1.75} />
    </span>
  );
}

/** HighRise's toggle: 36×20, primary-600 when on. */
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "motion-tap relative mt-[2px] inline-flex h-[20px] w-[36px] shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[var(--hr-primary-600)]" : "bg-[var(--hr-gray-200)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[2px] left-[2px] size-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.12)] transition-transform duration-150",
          checked && "translate-x-[16px]",
        )}
      />
    </button>
  );
}
