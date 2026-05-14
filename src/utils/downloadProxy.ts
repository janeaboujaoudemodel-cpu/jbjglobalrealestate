import { PUBLIC_DOMAIN } from "@/config/backend";
/**
 * Build a backend download-proxy URL for storage files.
 * This avoids client-side blockers that target /storage/v1 URLs.
 */

interface ProxyOptions {
  filename?: string;
  disposition?: 'inline' | 'attachment';
}

export function buildDownloadProxyUrl(originalUrl: string, options?: string | ProxyOptions) {
  // Support legacy string-only filename parameter
  const opts: ProxyOptions = typeof options === 'string' ? { filename: options } : (options || {});

  const origin = typeof window !== "undefined" ? window.location.origin : PUBLIC_DOMAIN;
  const proxy = new URL("/api/download-file", origin);
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
