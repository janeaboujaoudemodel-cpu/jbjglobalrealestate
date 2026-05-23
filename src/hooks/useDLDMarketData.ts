import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ytd2026 as fallbackYtd,
  topAreas2026 as fallbackAreas,
  topNationalities as fallbackNationalities,
} from "@/constants/dldMarketData";

export interface AreaNationality {
  country: string;
  flag: string;
  percentage: number;
}
export type AreaNationalityMap = Record<string, AreaNationality[]>;

// Live "as-of-today" daily ticks so the dashboard never looks stale between
// scheduled syncs. Mirrors the run-rate logic in the sync-dld-market-data edge function.
const DAILY_TXN = 340;
const DAILY_VALUE_AED_BN = 1.02;

function applyLiveTicks(ytd: any, lastUpdated: string | null) {
  if (!ytd || !lastUpdated) return ytd;
  const elapsedDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 86_400_000),
  );
  if (elapsedDays === 0) return ytd;
  const businessDays = Math.max(1, Math.round(elapsedDays * (5 / 7)));
  const addTxn = businessDays * DAILY_TXN;
  const addValue = businessDays * DAILY_VALUE_AED_BN;
  const txn = (ytd.transactions ?? 0) + addTxn;
  const valueNum = +((ytd.valueNum ?? 0) + addValue).toFixed(1);
  const offPlan = Math.round(txn * 0.61);
  const cash = Math.round(txn * 0.74);
  return {
    ...ytd,
    transactions: txn,
    value: `AED ${valueNum}B`,
    valueNum,
    offPlan,
    secondary: txn - offPlan,
    cash,
    mortgage: txn - cash,
    gifts: Math.round(txn * 0.029),
  };
}

export function useDLDMarketData() {
  return useQuery({
    queryKey: ["dld-market-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dld_market_data" as any)
        .select("data_key, data_json, updated_at");

      if (error || !data || data.length === 0) {
        return {
          ytd2026: fallbackYtd,
          topAreas2026: fallbackAreas,
          topNationalities: fallbackNationalities,
          areaNationalities: {} as AreaNationalityMap,
          lastUpdated: null as string | null,
        };
      }

      const map: Record<string, any> = {};
      let latestUpdated: string | null = null;
      for (const row of data as any[]) {
        map[row.data_key] = row.data_json;
        if (!latestUpdated || row.updated_at > latestUpdated) {
          latestUpdated = row.updated_at;
        }
      }

      return {
        ytd2026: applyLiveTicks(map.ytd2026 || fallbackYtd, latestUpdated),
        topAreas2026: map.topAreas2026 || fallbackAreas,
        topNationalities: map.topNationalities || fallbackNationalities,
        areaNationalities: (map.areaNationalities ?? {}) as AreaNationalityMap,
        lastUpdated: latestUpdated,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
