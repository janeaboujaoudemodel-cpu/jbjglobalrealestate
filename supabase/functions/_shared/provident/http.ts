export async function sleep(ms: number, jitter = 0.2): Promise<void> {
  const jitterMs = ms * jitter * Math.random();
  return new Promise((r) => setTimeout(r, ms + jitterMs));
}

/**
 * Fetch helper with retry/backoff for Firecrawl + source portal requests.
 * Retries on 429/5xx and network errors.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      // 429 + transient upstream errors
      if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
        const baseWait = res.status === 429 ? 10_000 : 3_000;
        const wait = baseWait * Math.pow(2, attempt - 1) + Math.random() * 5_000;
        if (attempt === maxRetries) return res;
        console.warn(`[fetchWithRetry] ${res.status} for ${url} (attempt ${attempt}/${maxRetries}) - waiting ${Math.round(wait)}ms`);
        await sleep(wait, 0);
        continue;
      }

      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const wait = attempt * 5_000;
      console.warn(`[fetchWithRetry] Network error for ${url} (attempt ${attempt}/${maxRetries}): ${lastError.message} - waiting ${wait}ms`);
      await sleep(wait, 0);
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
