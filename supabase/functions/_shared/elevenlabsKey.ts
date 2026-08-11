/**
 * ElevenLabs API key resolver (shared).
 *
 * Two secrets can hold an ElevenLabs credential in this project:
 *   - ELEVENLABS_API_KEY    (manually added)
 *   - ELEVENLABS_API_KEY_1  (synced by the ElevenLabs connector)
 *
 * A real ElevenLabs key always starts with `sk_`. An "API key ID" (the public
 * identifier shown in the dashboard next to a key) does NOT, and ElevenLabs
 * rejects it with:
 *   400 authentication_error / api_key_id_used_as_api_key
 *
 * That is exactly what voice-studio-tts hit: the manual secret contained the
 * key ID. So never blindly take the first env var that is set — prefer any
 * value that looks like a real key, and fail with an actionable message when
 * none does.
 */
const CANDIDATE_ENV_VARS = ["ELEVENLABS_API_KEY", "ELEVENLABS_API_KEY_1"] as const;

const looksLikeRealKey = (value: string) => value.startsWith("sk_");

export function resolveElevenLabsKey(): string {
  const found: Array<{ name: string; value: string }> = [];
  for (const name of CANDIDATE_ENV_VARS) {
    const value = Deno.env.get(name)?.trim();
    if (value) found.push({ name, value });
  }

  const valid = found.find((entry) => looksLikeRealKey(entry.value));
  if (valid) return valid.value;

  if (found.length === 0) {
    throw new Error(
      "ElevenLabs is not configured: no ELEVENLABS_API_KEY / ELEVENLABS_API_KEY_1 secret is set.",
    );
  }

  throw new Error(
    "The stored ElevenLabs credential is an API key ID, not an API key. " +
      "Real keys start with 'sk_' and are only shown when the key is created or rotated. " +
      "Create/rotate a key in the ElevenLabs dashboard (Profile → API Keys) and save the 'sk_…' " +
      `value into ${found.map((f) => f.name).join(" or ")}.`,
  );
}

export default resolveElevenLabsKey;
