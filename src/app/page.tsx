import { AppShell } from "@/components/shell/app-shell";

export default function Home() {
  return (
    <AppShell>
      {/* The Contacts page lands here next; only the nav and header are built so far. */}
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-[13px] leading-[18px] text-app-fg-muted">
          Contacts page goes here.
        </p>
      </div>
    </AppShell>
  );
}
