---
name: No JBJ emails to CITI Developers
description: Developer Portal (JBJ agency persona) must NEVER send outreach to CITI Developers. Jane is a CITI employee — any JBJ email to CITI reads as competitor solicitation and puts her job at risk.
type: constraint
---
HARD RULE — Developer Portal outreach (helpdesk@jbj.ae / JBJ Global Real Estate persona) must never target CITI Developers.

**Why:** Jane Bou Jaoude is an employee of CITI Developers. Sending JBJ agency registration/partnership emails to CITI is treated as competitor solicitation and endangers her employment.

**How to apply:**
- Block by recipient domain: citideveloper.com / .ae / .co
- Block by developer_name matching /citi\s*developer/i
- Enforced server-side in `supabase/functions/crm-send-developer-registration/index.ts` (returns 403 BLOCKED_CITI_DEVELOPERS). Do not remove.
- CITI-related outreach only flows through the Brokerage Portal (Jane's personal persona, infoo.jane@gmail.com), where she invites brokerages to register with CITI.
