import { useEffect, useState } from "react";
import { zohoCrm } from "@/services/zohoCrm";
import type { ZohoListResponse, ZohoModuleName } from "@/types/zohoCrm";

/**
 * Backend-ready fetch hook for any Zoho CRM module.
 * Intentionally UI-agnostic — module pages plug this into the existing
 * Zoho-parity table layout in `CrmModulePage.tsx` without shape changes.
 *
 * Note: requires the Zoho CRM connector to be linked and the
 * `zoho-crm-proxy` edge function deployed.
 */
export interface UseZohoModuleState<T> {
  rows: T[];
  info: ZohoListResponse<T>["info"] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useZohoCrmModule<T = Record<string, unknown>>(
  module: ZohoModuleName,
  opts: { fields?: string[]; page?: number; per_page?: number; enabled?: boolean } = {},
): UseZohoModuleState<T> {
  const { fields, page = 1, per_page = 50, enabled = true } = opts;
  const [rows, setRows] = useState<T[]>([]);
  const [info, setInfo] = useState<ZohoListResponse<T>["info"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    zohoCrm
      .list<T>(module, { fields, page, per_page })
      .then((res) => {
        if (cancelled) return;
        setRows(res?.data ?? []);
        setInfo(res?.info ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setRows([]);
        setInfo(null);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [module, page, per_page, enabled, tick, JSON.stringify(fields ?? null)]);

  return { rows, info, loading, error, refetch: () => setTick((t) => t + 1) };
}
