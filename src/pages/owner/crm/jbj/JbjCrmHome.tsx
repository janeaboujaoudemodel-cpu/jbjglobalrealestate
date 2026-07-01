import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Handshake, Contact, Building2, FileText, ReceiptText } from "lucide-react";

const KPIS: { key: string; label: string; zohoModule: string; icon: typeof UserPlus; path: string }[] = [
  { key: "leads", label: "Leads", zohoModule: "Leads", icon: UserPlus, path: "/owner/crm/jbj/leads" },
  { key: "contacts", label: "Contacts", zohoModule: "Contacts", icon: Contact, path: "/owner/crm/jbj/contacts" },
  { key: "accounts", label: "Accounts", zohoModule: "Accounts", icon: Building2, path: "/owner/crm/jbj/accounts" },
  { key: "deals", label: "Deals", zohoModule: "Deals", icon: Handshake, path: "/owner/crm/jbj/deals" },
  { key: "quotes", label: "Quotes", zohoModule: "Quotes", icon: FileText, path: "/owner/crm/jbj/quotes" },
  { key: "invoices", label: "Invoices", zohoModule: "Invoices", icon: ReceiptText, path: "/owner/crm/jbj/invoices" },
];

export default function JbjCrmHome() {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          KPIS.map(async (k) => {
            const { data, error } = await supabase.functions.invoke("zoho-crm-proxy", {
              body: { module: k.zohoModule, page: 1, per_page: 100 },
            });
            if (error || data?.error) return [k.key, null] as const;
            return [k.key, Array.isArray(data?.data) ? data.data.length : 0] as const;
          })
        );
        if (cancelled) return;
        const map: Record<string, number | null> = {};
        results.forEach(([k, v]) => { map[k] = v; });
        setCounts(map);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load KPIs");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="jbj-crm-stage" aria-label="Home">
      <div className="jbj-crm-stage-toolbar">
        <h1>Home</h1>
      </div>
      <div className="jbj-crm-home">
        {error && <div className="jbj-crm-home-error">{error}</div>}
        <div className="jbj-crm-kpi-grid">
          {KPIS.map((k) => {
            const Icon = k.icon;
            const v = counts[k.key];
            return (
              <Link key={k.key} to={k.path} className="jbj-crm-kpi-card">
                <div className="jbj-crm-kpi-icon"><Icon size={16} /></div>
                <div className="jbj-crm-kpi-body">
                  <div className="jbj-crm-kpi-label">{k.label}</div>
                  <div className="jbj-crm-kpi-value">{v == null ? "—" : v}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
