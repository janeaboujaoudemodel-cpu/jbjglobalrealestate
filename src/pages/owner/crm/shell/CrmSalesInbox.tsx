/**
 * JBJ CRM (new backend) — Messages / Inbox.
 *
 * Single source of truth: the live connected JBJ mailbox (Gmail sync +
 * AI classification) backed by public.email_inbox_items. The old demo
 * "Sales Inbox" with hard-coded messages is retired — this shell route
 * renders the real Email Center so there is exactly one inbox in the product.
 */
import EmailCenter from "@/pages/owner/crm/EmailCenter";

export default function CrmSalesInbox() {
  return <EmailCenter />;
}
