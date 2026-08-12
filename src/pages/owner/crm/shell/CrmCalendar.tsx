/**
 * JBJ CRM (new backend) — Calendar.
 *
 * Single source of truth: the live owner calendar backed by
 * public.owner_calendar_events, including two-way Google / Outlook sync.
 * The old champagne CRM calendar is retired; this shell route renders the
 * real calendar so there is exactly one calendar in the product.
 */
import OwnerCalendar from "@/pages/CRMCalendar";

export default function CrmCalendar() {
  return <OwnerCalendar />;
}
