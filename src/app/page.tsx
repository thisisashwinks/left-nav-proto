import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-[640px] rounded-xl border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold">Left nav prototype</h1>
          <Badge variant="secondary">Scaffold</Badge>
        </div>
        <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
          Next.js, Tailwind, and shadcn/ui are wired up. The nav prototype gets
          built from the Pencil design next.
        </p>
        <div className="mt-5 flex gap-3">
          <Button size="sm">Primary action</Button>
          <Button size="sm" variant="outline">
            Secondary action
          </Button>
        </div>
      </div>
    </main>
  );
}
