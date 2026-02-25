/**
 * Build a backend download-proxy URL for storage files.
 * This avoids client-side blockers that target /storage/v1 URLs.
 */

interface ProxyOptions {
  filename?: string;
  disposition?: 'inline' | 'attachment';
}

export function buildDownloadProxyUrl(originalUrl: string, options?: string | ProxyOptions) {
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) return originalUrl;

  // Support legacy string-only filename parameter
  const opts: ProxyOptions = typeof options === 'string' ? { filename: options } : (options || {});

  const proxy = new URL(`${base}/functions/v1/download-file`);
  proxy.searchParams.set("url", originalUrl);
  if (opts.filename) proxy.searchParams.set("filename", opts.filename);
  if (opts.disposition) proxy.searchParams.set("disposition", opts.disposition);
  return proxy.toString();
}

export function maybeProxyStorageUrl(url: string, options?: string | ProxyOptions) {
  try {
    const u = new URL(url);
    if (u.pathname.includes("/storage/v1/")) {
      return buildDownloadProxyUrl(url, options);
    }
    return url;
  } catch {
    return url;
  }
}
