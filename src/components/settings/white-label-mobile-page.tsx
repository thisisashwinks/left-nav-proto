"use client";

import { CircleAlert, Settings2, Wrench, X } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { QrPlaceholder } from "@/components/header/get-app-modal";
import { AccountLogo } from "@/components/accounts/account-logo";
import { cn } from "@/lib/utils";

/**
 * Agency ▸ Desktop and mobile apps ▸ Mobile app — production's page,
 * transcribed.
 *
 * Static, for the same reason the desktop customizer is: the thing under review
 * is whether an agency can FIND this, and what the L2 panel above it should
 * hold. The builds, the store listings and the QR codes behind it are shipped
 * work, and a prototype that half-rebuilds them invites feedback on a screen it
 * has no business redesigning.
 *
 * What it is faithful about is the page's argument, which is a three-part one:
 * the two free apps you can hand out today, the branded app you are paying to
 * build, and — first, because it is the thing you came to check — whether the
 * last build worked.
 */
export function WhiteLabelMobilePage({ agency }: { agency: Account }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-[14px] overflow-y-auto px-[var(--page-inset)] pb-[16px]">
      <header className="flex shrink-0 items-start gap-[12px] pt-[2px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <h1 className="truncate text-[17px] leading-[23px] font-semibold text-pg-heading">
            Agency mobile app
          </h1>
          <p className="text-[12.5px] leading-[17px] text-pg-muted italic">
            Your agency mobile app made easy — choose from our free offerings or
            create your own whitelabel app, and start nurturing clients right
            away.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <GhostButton icon={Settings2} label="Mobile app settings" />
          <GhostButton label="Need help?" />
        </div>
      </header>

      {/*
        The build banner leads, because it is the answer to why anyone opens
        this page twice. Partial failure is its own state: iOS shipped, Android
        did not, and one red banner saying "failed" would be wrong about half of
        it — which is why the detail line names the platform.
      */}
      <div className="flex shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--hr-error-50,#fef3f2)] px-[14px] py-[12px] shadow-[inset_0_0_0_1px_var(--hr-error-200,#fecdca)]">
        <CircleAlert
          size={18}
          aria-hidden="true"
          className="shrink-0 text-[var(--hr-error-600,#d92d20)]"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] leading-[18px] font-semibold text-[var(--hr-error-700,#b42318)]">
            Builds have failed partially
          </span>
          <span className="text-[12.5px] leading-[17px] text-[var(--hr-error-700,#b42318)] opacity-80">
            Your Android build has failed
          </span>
        </div>
        <span className="flex h-[30px] shrink-0 items-center rounded-[8px] bg-pg-surface px-[12px] text-[12.5px] leading-none font-semibold text-brand shadow-[inset_0_0_0_1px_var(--pg-border)]">
          View progress
        </span>
        <X size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </div>

      <div className="grid shrink-0 grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)] gap-[16px]">
        {/* The two free apps, stacked — what you can hand a client today. */}
        <div className="flex min-w-0 flex-col gap-[16px]">
          <OfferCard
            title="HighLevel app"
            subtitle="With HighLevel brand guidelines"
            badge="Lifetime free"
            tint="#eff4ff"
          />
          <OfferCard
            title="Lead Connector app"
            subtitle="With grey labelled brand guidelines"
            badge="Lifetime free"
            tint="#f0f9ff"
          />
        </div>

        {/* The branded build: what it is called, when it last shipped, and the
            two store listings it shipped to. */}
        <div className="relative flex min-w-0 flex-col items-center gap-[14px] rounded-[12px] bg-pg-surface px-[20px] py-[22px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <Badge label="Quarterly plan" className="absolute top-[12px] right-[14px]" />

          <span className="mt-[8px] flex size-[64px] items-center justify-center overflow-hidden rounded-[10px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
            {/* The agency's own mark, which is the whole point of the page. */}
            <AccountLogo
              logo={agency.logo}
              {...(agency.logoSrc ? { src: agency.logoSrc } : {})}
              size={48}
              radius={10}
            />
          </span>

          <div className="flex flex-col items-center gap-[3px]">
            <h2 className="text-[18px] leading-[24px] font-semibold text-pg-heading">
              {agency.name} app
            </h2>
            <p className="text-[12.5px] leading-[17px] text-pg-muted">
              Last updated on 07/09/2026
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-[14px]">
            <StoreListing store="App Store" version="iOS · 3.103.2" ok />
            <StoreListing store="Google Play" version="Android · 4.55.0" />
          </div>

          <span className="mt-[2px] flex h-[34px] items-center gap-[7px] rounded-[8px] bg-brand px-[16px] text-[13px] leading-none font-semibold text-brand-fg">
            <Wrench size={14} aria-hidden="true" />
            Customise app
          </span>
        </div>
      </div>

      {/* The support strip, kept because it is on the shipped page and because
          it is the one row here that is not about a build. */}
      <div className="flex shrink-0 items-center gap-[12px] rounded-[12px] bg-pg-surface px-[16px] py-[14px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <span
          aria-hidden="true"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          <SlackGlyph />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] leading-[18px] font-semibold text-brand">
            Join our Slack channel for priority support
          </span>
          <span className="truncate text-[12.5px] leading-[17px] text-brand opacity-80">
            Connect directly with our expert support team on Slack for real-time
            assistance and faster resolutions.
          </span>
        </div>
        <span className="flex h-[30px] shrink-0 items-center rounded-[8px] bg-pg-surface px-[12px] text-[12.5px] leading-none font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]">
          Join now
        </span>
      </div>
    </div>
  );
}

function OfferCard({
  title,
  subtitle,
  badge,
  tint,
}: {
  title: string;
  subtitle: string;
  badge: string;
  tint: string;
}) {
  return (
    <div className="relative flex min-w-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <Badge label={badge} className="absolute top-[10px] right-[12px] z-10" />

      <div className="flex min-w-0 flex-col gap-[2px] px-[16px] pt-[16px]">
        <h3 className="truncate text-[15px] leading-[21px] font-semibold text-pg-heading">
          {title}
        </h3>
        <p className="truncate text-[12.5px] leading-[17px] text-pg-muted">
          {subtitle}
        </p>
      </div>

      {/*
        The screenshot of the app, as a phone standing half out of the card.
        Cropped rather than shrunk: production's card does the same, and a whole
        phone at this size shows nothing legible anyway.
      */}
      <div className="relative mt-[12px] h-[128px] min-w-0">
        <span
          aria-hidden="true"
          style={{ background: tint }}
          className="absolute inset-x-[16px] bottom-0 top-[10px] rounded-t-[10px]"
        />
        <PhoneShot className="absolute right-[18px] -bottom-[6px]" />
        <span className="absolute bottom-[14px] left-[16px] flex h-[30px] items-center rounded-[8px] bg-pg-surface px-[12px] text-[12.5px] leading-none font-semibold text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
          Learn more
        </span>
      </div>
    </div>
  );
}

/** A phone with a plausible inbox in it, drawn rather than screenshotted. */
function PhoneShot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-[122px] w-[172px] flex-col gap-[5px] overflow-hidden rounded-t-[10px] bg-pg-surface p-[8px] shadow-[0_2px_10px_-4px_rgba(15,23,42,0.25),inset_0_0_0_1px_var(--pg-border)]",
        className,
      )}
    >
      <span className="flex items-center justify-between">
        <span className="h-[5px] w-[42px] rounded-full bg-pg-border" />
        <span className="h-[5px] w-[22px] rounded-full bg-pg-border" />
      </span>
      <span className="h-[16px] w-full rounded-[4px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]" />
      <span className="flex gap-[4px]">
        {["36%", "24%", "28%"].map((w) => (
          <span
            key={w}
            style={{ width: w }}
            className="h-[12px] rounded-[3px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]"
          />
        ))}
      </span>
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className="flex items-center gap-[6px]">
          <span className="size-[16px] shrink-0 rounded-full bg-pg-bg" />
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="h-[4px] w-[60%] rounded-full bg-pg-border" />
            <span className="h-[4px] w-[85%] rounded-full bg-pg-row-border" />
          </span>
        </span>
      ))}
    </span>
  );
}

function StoreListing({
  store,
  version,
  ok = false,
}: {
  store: string;
  version: string;
  ok?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[10px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <span className="flex justify-center px-[10px] pt-[12px]">
        <QrPlaceholder />
      </span>
      <span className="mt-[10px] flex items-center gap-[8px] bg-pg-surface px-[10px] py-[9px]">
        <span
          aria-hidden="true"
          className={cn(
            "size-[14px] shrink-0 rounded-[4px]",
            ok ? "bg-brand" : "bg-[var(--hr-success-500,#12b76a)]",
          )}
        />
        <span className="min-w-0 flex-1 truncate text-[12.5px] leading-none font-medium text-pg-text">
          {store}
        </span>
        <span className="shrink-0 rounded-[6px] bg-pg-bg px-[7px] py-[4px] text-[11px] leading-none text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {version}
        </span>
      </span>
    </div>
  );
}

function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-[6px] bg-[var(--brand-soft,var(--pg-bg))] px-[8px] py-[4px] text-[11px] leading-none font-semibold text-brand",
        className,
      )}
    >
      {label}
    </span>
  );
}

function GhostButton({
  icon: Icon,
  label,
}: {
  icon?: typeof Settings2;
  label: string;
}) {
  return (
    <span className="flex h-[32px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[13px] text-[12.5px] leading-none font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
      {Icon ? <Icon size={14} aria-hidden="true" className="text-pg-muted" /> : null}
      {label}
    </span>
  );
}

/** Slack's four petals, at the one size this page needs them. */
function SlackGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 15a2 2 0 1 1-2-2h2zm1 0a2 2 0 0 1 4 0v5a2 2 0 1 1-4 0z"
        fill="#e01e5a"
      />
      <path
        d="M9 6a2 2 0 1 1 2 2H9zm0 1a2 2 0 0 1 0 4H4a2 2 0 1 1 0-4z"
        fill="#36c5f0"
      />
      <path
        d="M18 9a2 2 0 1 1 2 2h-2zm-1 0a2 2 0 0 1-4 0V4a2 2 0 1 1 4 0z"
        fill="#2eb67d"
      />
      <path
        d="M15 18a2 2 0 1 1-2-2h2zm0-1a2 2 0 0 1 0-4h5a2 2 0 1 1 0 4z"
        fill="#ecb22e"
      />
    </svg>
  );
}
