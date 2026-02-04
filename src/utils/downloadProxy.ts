/**
 * Build a backend download-proxy URL for storage files.
 * This avoids client-side blockers that target /storage/v1 URLs.
 */

export function buildDownloadProxyUrl(originalUrl: string, filename?: string) {
  const base = import.meta.env.VITE_SUPABASE_URL;
  // Fallback to the original URL if env is missing (shouldn't happen in this project)
  if (!base) return originalUrl;

  const proxy = new URL(`${base}/functions/v1/download-file`);
  proxy.searchParams.set("url", originalUrl);
  if (filename) proxy.searchParams.set("filename", filename);
  return proxy.toString();
}

export function maybeProxyStorageUrl(url: string, filename?: string) {
  try {
    const u = new URL(url);
    // Only proxy storage endpoints; leave everything else untouched
    if (u.pathname.includes("/storage/v1/")) {
      return buildDownloadProxyUrl(url, filename);
    }
    return url;
  } catch {
    return url;
  }
}
