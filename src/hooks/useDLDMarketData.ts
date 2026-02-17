import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ytd2026 as fallbackYtd, topAreas2026 as fallbackAreas, topNationalities as fallbackNationalities } from "@/constants/dldMarketData";

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
          lastUpdated: null,
        };
      }

      const map: Record<string, any> = {};
      for (const row of data as any[]) {
        map[row.data_key] = row.data_json;
      }

      return {
        ytd2026: map.ytd2026 || fallbackYtd,
        topAreas2026: map.topAreas2026 || fallbackAreas,
        topNationalities: map.topNationalities || fallbackNationalities,
        lastUpdated: (data as any[])[0]?.updated_at || null,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
