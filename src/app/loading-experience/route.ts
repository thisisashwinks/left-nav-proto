import { redirect } from "next/navigation";

// Unlisted slug for the loading-experience playground. The files themselves are
// static and live in public/loading-experience/; this route only gives them a
// clean URL. Nothing in the prototype links here.
export function GET() {
  redirect("/loading-experience/playground.html");
}
