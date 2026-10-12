import { redirect } from "next/navigation";

// Unlisted slug: presentation deck for the loading-experience work.
export function GET() {
  redirect("/loading-experience/slides.html");
}
