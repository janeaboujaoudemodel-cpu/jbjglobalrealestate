import { PUBLIC_DOMAIN } from "@/config/backend";
/**
 * Build a backend download-proxy URL for storage files.
 * This avoids client-side blockers that target /storage/v1 URLs.
 */

interface ProxyOptions {
  filename?: string;
  disposition?: 'inline' | 'attachment';
}

function toBase64Url(input: string): string {
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildDownloadProxyUrl(originalUrl: string, options?: string | ProxyOptions) {
  // Support legacy string-only filename parameter
  const opts: ProxyOptions = typeof options === 'string' ? { filename: options } : (options || {});

  const origin = typeof window !== "undefined" ? window.location.origin : PUBLIC_DOMAIN;
  const proxy = new URL("/api/download-file", origin);
  proxy.searchParams.set("u", toBase64Url(originalUrl));
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

/**
 * Force-proxy ANY URL (own storage OR third-party CDN like provident.ae,
 * propertyfinder.ae, emaar.com etc.) through the backend download-file
 * edge function. The function validates the host against ALLOWED_DOMAINS
 * server-side and streams the file back with Content-Disposition:
 * attachment, so Chrome's cross-origin "download blocked" page never fires.
 * Use this for brochures, floor plans and any external PDF download.
 */
export function proxyAnyDownloadUrl(url: string, options?: string | ProxyOptions) {
  if (!url) return url;
  try {
    new URL(url);
    return buildDownloadProxyUrl(url, options);
  } catch {
    return url;
  }
}
