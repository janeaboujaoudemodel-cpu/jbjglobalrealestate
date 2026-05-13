// Authoritative head-count for any CRM directory entity.
// Returns { total, loading } from a head:true,count:'exact' query — never from rows.length.
// Subscribes to the same table via realtime so scrape/import refreshes update the badge live.
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type EntityKey =
  | "crm_brokers"
  | "crm_brokerages"
  | "developers"
  | "developer_sales_reps"
  | "broker_profiles"
  | "crm_leads";

type Filter = (q: any) => any;

const cache = new Map<string, { at: number; total: number }>();
const TTL = 5_000;

export function useEntityTotal(table: EntityKey, filter?: Filter, deps: any[] = []) {
  const cacheKey = `${table}:${deps.join("|")}`;
  const initial = cache.get(cacheKey);
  const [total, setTotal] = useState<number | null>(initial ? initial.total : null);
  const [loading, setLoading] = useState<boolean>(!initial);
  const reqId = useRef(0);

  const load = async (force = false) => {
    const cached = cache.get(cacheKey);
    if (!force && cached && Date.now() - cached.at < TTL) {
      setTotal(cached.total);
      setLoading(false);
      return;
    }
    const myId = ++reqId.current;
    setLoading(true);
    let q: any = (supabase.from(table as any).select("*", { count: "exact", head: true }) as any);
    if (filter) q = filter(q);
    const { count, error } = await q;
    if (myId !== reqId.current) return;
    if (error) {
      setLoading(false);
      return;
    }
    const t = count || 0;
    cache.set(cacheKey, { at: Date.now(), total: t });
    setTotal(t);
    setLoading(false);
  };

  useEffect(() => {
    load(true);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { cache.delete(cacheKey); load(true); }, 600);
    };
    const channel = supabase
      .channel(`entity-total-${table}-${cacheKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, bump)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return { total, loading, refresh: () => { cache.delete(cacheKey); load(true); } };
}
