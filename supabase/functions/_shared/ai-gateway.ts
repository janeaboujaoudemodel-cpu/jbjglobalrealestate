// Lovable AI Gateway provider for edge functions (chat/completions path).
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

/**
 * Hard ceiling on any single AI-gateway request (backend audit, §6
 * reliability). Without it, a hung upstream call blocks until the platform's
 * own function timeout fires and the user just watches a stuck spinner.
 * A caller that already passes its own `init.signal` keeps control — this
 * only supplies a timeout when none was given.
 */
const AI_GATEWAY_TIMEOUT_MS = 60_000;

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });

  const publishRunId = (value?: string) => {
    const nextRunId = value?.trim() || undefined;
    if (!runId && nextRunId) runId = nextRunId;
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      // Only impose our timeout when the caller didn't bring its own signal.
      const timeoutSignal = init?.signal
        ? undefined
        : AbortSignal.timeout(AI_GATEWAY_TIMEOUT_MS);
      try {
        const response = await fetch(input, {
          ...init,
          headers,
          ...(timeoutSignal && { signal: timeoutSignal }),
        });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        if (error instanceof DOMException && error.name === "TimeoutError") {
          throw new Error(
            `AI gateway request timed out after ${AI_GATEWAY_TIMEOUT_MS}ms`,
          );
        }
        throw error;
      }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  };
}

export function createLovableAiGatewayProvider(
  lovableApiKey: string,
  initialRunId?: string,
  options?: { structuredOutputs?: boolean },
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: options?.structuredOutputs ?? false,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch as typeof fetch,
  });

  return Object.assign(provider, {
    getRunId: runIdFetch.getRunId,
    waitForRunId: runIdFetch.waitForRunId,
  });
}
