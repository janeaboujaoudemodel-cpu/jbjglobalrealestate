import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileSpreadsheet, Inbox, UploadCloud } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Secondary Market Hub — aggregates partner inventory files uploaded against
 * brokerages and developers in the Relationship Hub. Owner-only.
 */
export default function SecondaryMarketHub() {
  const navigate = useNavigate();

  const { data: brokerages = [], isLoading: loadingBrokerages } = useQuery({
    queryKey: ["secondary-market-brokerages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_brokerages")
        .select("id, company_name, inventory_file_url, database_file_url, country, emirate, updated_at")
        .or("inventory_file_url.not.is.null,database_file_url.not.is.null")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: developers = [], isLoading: loadingDevs } = useQuery({
    queryKey: ["secondary-market-developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_developer_registry")
        .select("id, developer_name, inventory_file_url, database_file_url, country, emirate, updated_at")
        .or("inventory_file_url.not.is.null,database_file_url.not.is.null")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: liveListings = [], isLoading: loadingLive } = useQuery({
    queryKey: ["secondary-market-listings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vw_resale_with_source")
        .select("id, title, source_label, source_entity_name, asking_price, currency, emirate, updated_at")
        .not("source_entity_type", "is", null)
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isEmpty =
    !loadingBrokerages && !loadingDevs && !loadingLive &&
    brokerages.length === 0 && developers.length === 0 && liveListings.length === 0;

  return (
    <>
      <SEOHead title="Secondary Market Hub | JBJ Global" description="Partner inventory and database files" canonicalPath="/owner/crm/relationships/secondary-market" />
      <div className="min-h-screen bg-[#FDFBF7] w-full">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-[96px] pb-12">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1A1A1A]/10">
            <Button
              variant="outline"
              onClick={() => navigate("/owner/crm/relationship-hub")}
              className="h-11 px-6 bg-[#FDFBF7] border-2 border-[#1A1A1A]/10 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] rounded-full font-semibold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Relationship Hub
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-[#1A1A1A]">Secondary Market Hub</h1>
              <p className="text-sm text-[#1A1A1A]/70">Partner inventory and database files uploaded across brokerages and developers.</p>
            </div>
          </div>

          {isEmpty ? (
            <Card className="bg-[#F7F2EA] border border-[#B89555]/30">
              <CardContent className="p-12 text-center">
                <Inbox className="w-12 h-12 mx-auto text-[#1A1A1A]/40 mb-4" />
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">No partner inventory yet</h2>
                <p className="text-sm text-[#1A1A1A]/70 max-w-md mx-auto">
                  Use the "Upload inventory" button on any brokerage or developer in the Relationship Hub. Their files will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Brokerage Inventories" items={brokerages.map((b: any) => ({
                id: b.id,
                name: b.company_name,
                country: b.country,
                emirate: b.emirate,
                inventory: b.inventory_file_url,
                database: b.database_file_url,
              }))} />
              <Section title="Developer Inventories" items={developers.map((d: any) => ({
                id: d.id,
                name: d.developer_name,
                country: d.country,
                emirate: d.emirate,
                inventory: d.inventory_file_url,
                database: d.database_file_url,
              }))} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, items }: { title: string; items: Array<{ id: string; name: string; country?: string | null; emirate?: string | null; inventory?: string | null; database?: string | null }> }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map((it) => (
          <Card key={it.id} className="bg-white border border-[#B89555]/20">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-[#1A1A1A] truncate">{it.name}</p>
                <p className="text-xs text-[#1A1A1A]/60">{[it.emirate, it.country].filter(Boolean).join(", ") || "—"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {it.inventory ? (
                  <a href={it.inventory} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="border-[#B89555]/40"><FileSpreadsheet className="w-4 h-4 mr-1.5" />Inventory</Button>
                  </a>
                ) : null}
                {it.database ? (
                  <a href={it.database} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="border-[#B89555]/40"><UploadCloud className="w-4 h-4 mr-1.5" />Database</Button>
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
