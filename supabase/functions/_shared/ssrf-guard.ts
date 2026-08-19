/**
 * SSRF guard for edge functions that fetch a URL supplied by a caller or read
 * back out of a user-writable DB column (`website_url`, `cv_url`, a pasted
 * listing link…).
 *
 * Without this, `fetch(userUrl)` runs from inside the Supabase network with
 * whatever reachability that grants: `http://169.254.169.254/…` (cloud
 * instance metadata), `http://localhost:…` (co-located services), and RFC1918
 * addresses are all one request away, and the response body is usually handed
 * straight back to the caller.
 *
 * Three layers, all of which must pass:
 *
 *  1. Scheme — http/https only. No `file:`, `gopher:`, `data:`.
 *  2. Shape  — no embedded credentials, no non-standard ports.
 *  3. Target — literal IPs in private/loopback/link-local/CGNAT/unique-local
 *              ranges are rejected, as are hostnames that only resolve inside
 *              a network (`localhost`, `*.internal`, `*.local`,
 *              `metadata.google.internal`).
 *
 * DNS rebinding is not fully solvable here — Deno Deploy gives no hook between
 * resolution and connection — so a hostname that resolves to a private address
 * still gets through layer 3. The mitigation that does work in this
 * environment is `allowedHosts`: pass it wherever the set of legitimate hosts
 * is known, and rely on the range checks only for genuinely open-ended input.
 *
 * Redirects are the other half of the problem: an allowed host can 302 to
 * `http://169.254.169.254/`. Use {@link safeFetch}, which resolves redirects
 * manually and re-validates every hop, instead of calling `fetch` directly.
 *
 * @see src/test/ssrf-guard.test.ts
 */

export class SsrfBlockedError extends Error {
  readonly reason: string;
  readonly target: string;

  constructor(reason: string, target: string) {
    super(`Blocked outbound request to ${target}: ${reason}`);
    this.name = "SsrfBlockedError";
    this.reason = reason;
    this.target = target;
  }
}

export interface SsrfGuardOptions {
  /**
   * Restrict to these hostnames — exact match or a subdomain of one. This is
   * the strongest control available here; use it whenever the legitimate hosts
   * are known ahead of time.
   */
  allowedHosts?: readonly string[];
  /** Ports permitted in addition to the scheme default. Default: none. */
  allowedPorts?: readonly number[];
  /** Maximum redirects {@link safeFetch} will follow. Default 5. */
  maxRedirects?: number;
}

/** Hostnames that never point anywhere a public request should reach. */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "instance-data",
]);

/** Hostname suffixes that only resolve inside a private network. */
const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home.arpa",
];

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** True for an IPv4 literal that must never be contacted. */
function isBlockedIpv4(host: string): boolean {
  const m = IPV4.exec(host);
  if (!m) return false;
  const [a, b, c, d] = m.slice(1).map(Number);
  if ([a, b, c, d].some((n) => Number.isNaN(n) || n > 255)) return true; // malformed → refuse

  if (a === 0) return true;                                  // 0.0.0.0/8  "this network"
  if (a === 10) return true;                                 // 10/8       private
  if (a === 127) return true;                                // 127/8      loopback
  if (a === 100 && b >= 64 && b <= 127) return true;         // 100.64/10  CGNAT
  if (a === 169 && b === 254) return true;                   // 169.254/16 link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;          // 172.16/12  private
  if (a === 192 && b === 0 && c === 0) return true;          // 192.0.0/24 IETF protocol assignments
  if (a === 192 && b === 168) return true;                   // 192.168/16 private
  if (a === 198 && (b === 18 || b === 19)) return true;      // 198.18/15  benchmarking
  if (a >= 224) return true;                                 // 224/4 multicast, 240/4 reserved, 255.255.255.255
  return false;
}

/**
 * Expand an IPv6 literal to its 16 bytes, or null if it does not parse.
 *
 * Range checks run on the bytes rather than on the text: `URL` normalizes
 * `[::ffff:169.254.169.254]` to `[::ffff:a9fe:a9fe]`, so any prefix-matching on
 * the string form misses IPv4-mapped metadata addresses.
 */
function parseIpv6(raw: string): Uint8Array | null {
  const lower = raw.toLowerCase();
  if (!lower.includes(":")) return null;

  // A trailing dotted quad (::ffff:1.2.3.4) becomes two hextets.
  let text = lower;
  const dotted = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(text);
  if (dotted) {
    const m = IPV4.exec(dotted[1]);
    if (!m) return null;
    const q = m.slice(1).map(Number);
    if (q.some((n) => Number.isNaN(n) || n > 255)) return null;
    const hi = ((q[0] << 8) | q[1]).toString(16);
    const lo = ((q[2] << 8) | q[3]).toString(16);
    text = text.slice(0, dotted.index) + `${hi}:${lo}`;
  }

  const halves = text.split("::");
  if (halves.length > 2) return null;

  const toHextets = (part: string): number[] | null => {
    if (!part) return [];
    const out: number[] = [];
    for (const piece of part.split(":")) {
      if (!/^[0-9a-f]{1,4}$/.test(piece)) return null;
      out.push(parseInt(piece, 16));
    }
    return out;
  };

  const head = toHextets(halves[0]);
  const tail = halves.length === 2 ? toHextets(halves[1]) : [];
  if (head === null || tail === null) return null;

  let hextets: number[];
  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 0) return null;
    hextets = [...head, ...new Array(fill).fill(0), ...tail];
  } else {
    hextets = head;
  }
  if (hextets.length !== 8) return null;

  const bytes = new Uint8Array(16);
  hextets.forEach((h, i) => {
    bytes[i * 2] = (h >> 8) & 0xff;
    bytes[i * 2 + 1] = h & 0xff;
  });
  return bytes;
}

/** True for an IPv6 literal that must never be contacted. */
function isBlockedIpv6(host: string): boolean {
  // URL.hostname keeps the brackets on an IPv6 literal.
  const raw = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
  const bytes = parseIpv6(raw);
  if (!bytes) return raw.includes(":"); // looks like IPv6 but does not parse → refuse

  const allZero = bytes.every((b) => b === 0);
  if (allZero) return true;                                          // ::  unspecified
  if (bytes.slice(0, 15).every((b) => b === 0) && bytes[15] === 1) return true; // ::1 loopback
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) return true;  // fe80::/10 link-local
  if ((bytes[0] & 0xfe) === 0xfc) return true;                       // fc00::/7  unique-local
  if (bytes[0] === 0xff) return true;                                // ff00::/8  multicast

  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d): apply the
  // IPv4 rules to the embedded address.
  const first10Zero = bytes.slice(0, 10).every((b) => b === 0);
  const isMapped = first10Zero && bytes[10] === 0xff && bytes[11] === 0xff;
  const isCompat = bytes.slice(0, 12).every((b) => b === 0);
  if (isMapped || isCompat) {
    const v4 = `${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`;
    if (isBlockedIpv4(v4)) return true;
  }

  return false;
}

function hostAllowed(hostname: string, allowedHosts?: readonly string[]): boolean {
  if (!allowedHosts || allowedHosts.length === 0) return true;
  const host = hostname.toLowerCase();
  return allowedHosts.some((allowed) => {
    const a = allowed.toLowerCase();
    return host === a || host.endsWith(`.${a}`);
  });
}

/**
 * Validate an outbound URL.
 *
 * @throws {SsrfBlockedError} when the URL must not be requested.
 * @returns the parsed URL, for the caller to pass on to `fetch`.
 */
export function assertPublicHttpUrl(raw: string, options: SsrfGuardOptions = {}): URL {
  if (!raw || typeof raw !== "string") {
    throw new SsrfBlockedError("empty URL", String(raw));
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new SsrfBlockedError("not a valid absolute URL", raw);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfBlockedError(`scheme ${url.protocol} is not allowed`, raw);
  }

  // `https://allowed.example@169.254.169.254/` — the host is the part after @.
  if (url.username || url.password) {
    throw new SsrfBlockedError("URL contains embedded credentials", raw);
  }

  if (url.port) {
    const port = Number(url.port);
    const isDefault = (url.protocol === "http:" && port === 80) ||
      (url.protocol === "https:" && port === 443);
    if (!isDefault && !(options.allowedPorts ?? []).includes(port)) {
      throw new SsrfBlockedError(`port ${port} is not allowed`, raw);
    }
  }

  const hostname = url.hostname.toLowerCase();
  if (!hostname) {
    throw new SsrfBlockedError("URL has no host", raw);
  }
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new SsrfBlockedError("host resolves only inside the private network", raw);
  }
  if (BLOCKED_HOST_SUFFIXES.some((s) => hostname.endsWith(s))) {
    throw new SsrfBlockedError("host resolves only inside the private network", raw);
  }
  if (isBlockedIpv4(hostname) || isBlockedIpv6(hostname)) {
    throw new SsrfBlockedError("host is a private, loopback or link-local address", raw);
  }
  if (!hostAllowed(hostname, options.allowedHosts)) {
    throw new SsrfBlockedError("host is not in the allowlist for this function", raw);
  }

  return url;
}

/** Non-throwing form of {@link assertPublicHttpUrl}. */
export function isPublicHttpUrl(raw: string, options?: SsrfGuardOptions): boolean {
  try {
    assertPublicHttpUrl(raw, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * `fetch` with the SSRF guard applied to the initial URL *and* to every
 * redirect hop.
 *
 * Plain `fetch` follows redirects internally, so an allowed host can bounce
 * the request to `http://169.254.169.254/` and the guard never sees it. This
 * resolves them manually instead.
 *
 * @throws {SsrfBlockedError} when any hop fails validation, or when the
 * redirect budget is exhausted.
 */
export async function safeFetch(
  raw: string,
  init: RequestInit = {},
  options: SsrfGuardOptions = {},
): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? 5;
  let target = assertPublicHttpUrl(raw, options).toString();

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const response = await fetch(target, { ...init, redirect: "manual" });

    const isRedirect = response.status >= 300 && response.status < 400;
    if (!isRedirect) return response;

    const location = response.headers.get("location");
    if (!location) return response;

    // Cancel the redirect body so the connection is not left open.
    await response.body?.cancel().catch(() => {});

    // Relative Location headers are resolved against the current hop.
    const next = new URL(location, target).toString();
    target = assertPublicHttpUrl(next, options).toString();
  }

  throw new SsrfBlockedError(`exceeded ${maxRedirects} redirects`, raw);
}
