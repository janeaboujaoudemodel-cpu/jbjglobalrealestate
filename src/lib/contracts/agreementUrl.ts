import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve an "open" URL for a stored developer-agreement file at click time.
 * We no longer store long-lived signed URLs in the row (they used to be
 * minted for 1 year and 404'd on day 366). Instead the row keeps only
 * `file_path`; this helper generates a short-lived signed URL when the
 * owner clicks "Open".
 *
 * Falls back to `file_url` for legacy rows that only have the long URL.
 */
export async function openAgreement(row: { file_path?: string | null; file_url?: string | null }) {
  const path = row?.file_path?.trim();
  if (path) {
    const { data, error } = await supabase.storage
      .from("developer-agreements")
      .createSignedUrl(path, 60 * 10); // 10 minutes
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }
  }
  const legacy = row?.file_url?.trim();
  if (legacy) {
    window.open(legacy, "_blank", "noopener,noreferrer");
    return;
  }
  throw new Error("This agreement has no file attached.");
}
