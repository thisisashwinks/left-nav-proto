"use client";

import { GetAppContent, type AppKind } from "@/components/header/get-app-modal";

/**
 * The companion-app offer as a page rather than a sheet.
 *
 * What a sub-account gets when the nav's Desktop & mobile apps panel is the
 * way in: the same artwork, the same QR and the same store buttons the modal
 * shows, in the canvas instead of over it. It is the same component — see `GetAppContent` —
 * because a page and a sheet that drift apart on their download links is a bug
 * nobody would notice until a customer did.
 *
 * A page, and not a modal, because of how it is reached. A glyph in the app bar
 * or a row in the avatar menu is an aside: you are in the middle of something,
 * the sheet answers you, and you carry on. A row in the nav is a destination —
 * you went there — and a destination that opens a dialog over the page you were
 * already on leaves the nav's selection pointing at somewhere you cannot see.
 */
export function GetAppPage({ kind }: { kind: AppKind }) {
  return (
    <div className="flex h-full min-h-0 flex-col px-[var(--page-inset)] pb-[16px]">
      {/*
        One card filling the canvas, with the two columns inside it. The modal
        sized itself to its contents because it floated; here the contents sit
        in the space the canvas already has, which is what "full screen" means
        on a surface that is itself inset.
      */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[12px] bg-pg shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <GetAppContent kind={kind} />
      </div>
    </div>
  );
}
