import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { OWNER_BACKEND_EMAILS } from "./ownerEmails";

/**
 * Audit finding 3.4 — "who is the owner" was defined twice, independently:
 * this file, and a hardcoded list of the same addresses inside the
 * `rel_is_owner()` Postgres function. Two hardcoded copies of a security
 * boundary drift eventually, and the failure is silent both ways — the owner
 * loses CRM access, or someone keeps it after being removed here.
 *
 * The server side now reads `public.owner_email_allowlist` instead of a literal.
 * This test is what keeps that table's seed and this file in step: it fails the
 * moment they disagree, which is the check that never existed.
 *
 * Adding or removing an owner address means editing BOTH this file and a new
 * migration that updates the allowlist table. That is deliberate — owner is an
 * allow-list rather than a role precisely so it cannot be granted by writing a
 * row at runtime.
 */

const MIGRATIONS = resolve(__dirname, "..", "..", "supabase", "migrations");

/** Every address ever inserted into or deleted from the allowlist table. */
function allowlistFromMigrations(): Set<string> {
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
  const emails = new Set<string>();

  for (const file of files) {
    const sql = readFileSync(resolve(MIGRATIONS, file), "utf8");
    const insertBlocks = sql.match(
      /INSERT\s+INTO\s+public\.owner_email_allowlist[\s\S]*?;/gi,
    );
    for (const block of insertBlocks ?? []) {
      for (const [, email] of block.matchAll(/\(\s*'([^']+@[^']+)'/g)) {
        emails.add(email.toLowerCase());
      }
    }
    for (const block of sql.match(/DELETE\s+FROM\s+public\.owner_email_allowlist[\s\S]*?;/gi) ?? []) {
      for (const [, email] of block.matchAll(/'([^']+@[^']+)'/g)) {
        emails.delete(email.toLowerCase());
      }
    }
  }
  return emails;
}

describe("owner email allow-list stays in step with the database", () => {
  const fromSql = allowlistFromMigrations();
  const fromCode = new Set(OWNER_BACKEND_EMAILS.map((e) => e.toLowerCase()));

  it("the migrations actually seed an allow-list", () => {
    expect(
      fromSql.size,
      "no INSERT INTO public.owner_email_allowlist found — did the migration get renamed or reverted?",
    ).toBeGreaterThan(0);
  });

  it("every frontend owner email exists server-side", () => {
    const missing = [...fromCode].filter((e) => !fromSql.has(e));
    expect(
      missing,
      `these are in ownerEmails.ts but not in owner_email_allowlist, so they pass OwnerGuard ` +
        `and are then refused by the database: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("every server-side owner email exists in the frontend list", () => {
    const extra = [...fromSql].filter((e) => !fromCode.has(e));
    expect(
      extra,
      `these are in owner_email_allowlist but not in ownerEmails.ts, so they hold database ` +
        `owner rights while being redirected out of /owner: ${extra.join(", ")}`,
    ).toEqual([]);
  });

  it("rel_is_owner() reads the table rather than hardcoding addresses again", () => {
    const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
    let latest = "";
    for (const file of files) {
      const sql = readFileSync(resolve(MIGRATIONS, file), "utf8");
      if (/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.rel_is_owner/i.test(sql)) latest = sql;
    }
    const body = latest.slice(latest.search(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.rel_is_owner/i));
    const definition = body.slice(0, body.indexOf("$$;") + 3);

    expect(definition).toContain("owner_email_allowlist");
    expect(
      definition.match(/'[^']+@[^']+'/g) ?? [],
      "the newest rel_is_owner() still hardcodes email addresses — that is the drift this table replaced",
    ).toEqual([]);
  });
});
