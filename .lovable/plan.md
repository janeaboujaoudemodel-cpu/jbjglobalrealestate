I found the CRM lockout cause: the active login email is being recognized in the role table, but the CRM profile/self-heal logic is still hardcoded to the old owner email only, so the CRM page can still redirect home and show the “CRM access required” toast. I will fix this so your owner identity is never blocked again.

Plan:

1. Stabilize Owner access everywhere
- Update the owner-verification backend to recognize all approved owner login emails:
  - janeaboujaoudenails@gmail.com
  - janeaboujaoudemodel@gmail.com
  - infoo.jane@gmail.com
- Keep this server-side, not in browser storage.
- Preserve the existing role-table security model so this is not a public bypass.

2. Repair CRM access provisioning
- Add a database migration that creates/repairs the Owner CRM profile for each approved owner account that exists.
- Ensure those owner accounts have the correct owner role rows.
- Update CRM profile lookup logic so the CRM accepts `isOwner` from the central auth context instead of checking only one hardcoded email.
- Stop redirecting the owner to the homepage when the CRM profile is temporarily missing; instead it will self-heal or continue with a safe owner profile.

3. Remove noisy/incorrect access popups
- Replace repeated “CRM access required. Contact administrator.” behavior with one controlled message only for real non-owner/non-CRM users.
- On owner verification delays, show a clean “verifying access” state instead of redirecting to the hero/home page.
- Route denied access to the proper access page only when the account is definitively not owner/authorized.

4. Fix email sync schema mismatch
- The newly added Gmail sync function writes fields that do not match the current email-log table names. I will align it to the existing table columns so inbound/outbound logs actually save correctly.
- Make message processing idempotent so the same inbox reply is not processed repeatedly.

5. Connect inbox sync for the requested addresses
- Keep `infoo.jane@gmail.com` connected through the existing Gmail connector; it already has read/send/modify permissions.
- Add support in the CRM settings/data model for multiple monitored inbox identities:
  - infoo.jane@gmail.com
  - contact@jbj.ae
- For `contact@jbj.ae` on Hostinger, I will add a mailbox source configuration path. Because Hostinger email is not a Gmail mailbox, it cannot be read by the Gmail connector directly; it needs IMAP credentials or a forward-to-Gmail setup. I will prepare the system to support it securely, and then ask for the Hostinger mailbox credentials through Lovable’s secure secret flow if needed.

6. Make reply/status synchronization more reliable
- Update the email classifier to recognize phrases like “you are already registered”, “we are registered already”, “application under review”, “pending”, “send documents”, and “rejected”.
- Match replies to developers/brokerages/clients by sender email, sender domain, previous thread/message logs, and known CRM email fields.
- Update statuses automatically:
  - already registered / approved -> Registered or Active Partner
  - pending / under review -> Pending / Under Review
  - documents requested -> Documents Required
  - rejected -> Rejected
- Log every automatic status change in the relationship status history.

7. Deploy and validate
- Deploy the updated backend functions.
- Test owner verification with the currently active owner account.
- Run the email sync function manually once to confirm the Gmail connector works and the logs/status updates no longer fail.

Technical notes:
- I will not edit generated backend client/type files.
- Owner privilege remains server-verified and role-table backed.
- For `contact@jbj.ae`, if it is not forwarded into Gmail, a second mailbox reader using Hostinger IMAP will require secure mailbox credentials before it can read that inbox.