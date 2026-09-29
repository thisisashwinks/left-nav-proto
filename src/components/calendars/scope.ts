/**
 * Which kind of booking the Calendars screens are looking at.
 *
 * One value shared by the week grid and the list, owned by calendars-page, so
 * flipping `Meetings ▾` to `Rentals` on one view is still true on the other.
 * It also decides what New does: Meetings books in a modal over the grid,
 * Services and Rentals open the full-page New booking builder.
 */
export type CalendarScope = "meetings" | "services" | "rentals";

export const CALENDAR_SCOPES: { id: CalendarScope; label: string }[] = [
  { id: "meetings", label: "Meetings" },
  { id: "services", label: "Services" },
  { id: "rentals", label: "Rentals" },
];

/** Event type the New booking builder opens on, per scope. */
export type BookingEventType = "appointment" | "booking";

export function scopeLabel(scope: CalendarScope): string {
  return CALENDAR_SCOPES.find((s) => s.id === scope)?.label ?? "Meetings";
}
