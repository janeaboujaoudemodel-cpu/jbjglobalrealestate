/**
 * Encryption for broker mailbox OAuth tokens stored in
 * broker_email_accounts.access_token_encrypted / refresh_token_encrypted.
 *
 * Values are AES-256-GCM encrypted with COMM_CREDENTIAL_KEY and prefixed with
 * "enc:v1:" so legacy plaintext rows keep working until they are refreshed.
 */
import { encryptCredential, decryptCredential } from "./credentialCrypto.ts";

const PREFIX = "enc:v1:";

function getSecret(): string | null {
  return (
    Deno.env.get("COMM_CREDENTIAL_KEY") ??
    Deno.env.get("HOSTINGER_CREDENTIAL_KEY") ??
    null
  );
}

/** Encrypt an OAuth token before writing it to the database. */
export async function encryptToken(
  plain: string | null | undefined,
): Promise<string | null> {
  if (!plain) return null;
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      "COMM_CREDENTIAL_KEY is not configured; refusing to store OAuth tokens unencrypted",
    );
  }
  return PREFIX + (await encryptCredential(plain, secret));
}

/** Decrypt an OAuth token read from the database (legacy plaintext passes through). */
export async function decryptToken(
  stored: string | null | undefined,
): Promise<string | null> {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext row
  const secret = getSecret();
  if (!secret) throw new Error("COMM_CREDENTIAL_KEY is not configured; cannot decrypt OAuth token");
  return await decryptCredential(stored.slice(PREFIX.length), secret);
}
