// RETIRED — and this one mattered.
//
// The previous implementation was a dated one-off importer that accepted an
// arbitrary `rows` array and upserted it straight into the `developers` table
// using a SERVICE-ROLE client, with no authentication of any kind. Any caller
// holding the public anon key could inject or overwrite developer records.
//
// It was first deleted from the repo, which was the wrong fix: deletion does
// not undeploy, so the vulnerable code kept serving. This inert stub replaces
// it, so a redeploy actually closes the hole (JBJ-027). It opens no Supabase
// client and touches no table.
//
// If a bulk developer import is ever needed again, write a new function that
// uses requireOwnerAuth from _shared/owner-auth-middleware.ts and validates
// its input — do not resurrect this one.
import { serveRetired } from "../_shared/retired.ts";

serveRetired("bulk-import-devs-2027-6");
