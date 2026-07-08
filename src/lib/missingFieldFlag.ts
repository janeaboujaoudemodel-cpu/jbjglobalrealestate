/**
 * flagMissingField — records a "Not specified" fallback so the owner has
 * a chase-list of fields to fill in with real developer data.
 *
 * Safe to call from anywhere (public visits log too). Silently fails —
 * never throws — because a logging bug must never break a card render.
 *
 * De-duplicated per entity+field via 5-minute in-memory throttle to avoid
 * hammering the API when a list re-renders.
 */
import { supabase } from "@/integrations/supabase/client";

type EntityType = "project" | "developer" | "area" | "community";

interface FlagInput {
  entityType: EntityType;
  entityId?: string | null;
  entitySlug?: string | null;
  entityName?: string | null;
  fieldName: string;
  surface?: string;
}

const THROTTLE_MS = 5 * 60 * 1000;
const recent = new Map<string, number>();

export function flagMissingField(input: FlagInput): void {
  try {
    if (!input.entityId || !input.fieldName) return;
    const key = `${input.entityType}:${input.entityId}:${input.fieldName}`;
    const now = Date.now();
    const last = recent.get(key) ?? 0;
    if (now - last < THROTTLE_MS) return;
    recent.set(key, now);

    // Fire-and-forget; ignore errors. Never throw.

    void supabase
      .from("missing_field_flags")
      .upsert(
        {
          entity_type: input.entityType,
          entity_id: input.entityId,
          entity_slug: input.entitySlug ?? null,
          entity_name: input.entityName ?? null,
          field_name: input.fieldName,
          surface: input.surface ?? null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "entity_type,entity_id,field_name", ignoreDuplicates: false }
      )
      .then(() => {}, () => {});
  } catch {
    /* silent */
  }
}
