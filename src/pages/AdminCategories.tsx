import { useEffect, useState } from "react";
import { TrendingUp, Briefcase, Building2, Search, Download, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CatRow {
  user_id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  country?: string | null;
  status?: string | null;
  created_at?: string | null;
}

export default function AdminCategories() {
  const [tab, setTab] = useState<"investors" | "brokers" | "developers">("investors");
  const [search, setSearch] = useState("");
  const [investors, setInvestors] = useState<CatRow[]>([]);
  const [brokers, setBrokers] = useState<CatRow[]>([]);
  const [developers, setDevelopers] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Investors: pull from user_categories_v + investor_intake
        const { data: invCat } = await supabase
          .from("user_categories_v" as any)
          .select("*")
          .eq("category", "investor")
          .order("created_at", { ascending: false });

        setInvestors(
          (invCat || []).map((r: any) => ({
            user_id: r.user_id,
            email: r.email,
            full_name: r.full_name,
            phone: r.phone_e164,
            country: r.current_location_country || r.nationality,
            status: "registered",
            created_at: r.created_at,
          }))
        );

        // Brokers
        const { data: brk } = await supabase
          .from("broker_profiles")
          .select("user_id, display_name, email, phone, custom_label, verification_status, created_at")
          .order("created_at", { ascending: false });
        setBrokers(
          (brk || []).map((r: any) => ({
            user_id: r.user_id,
            email: r.email,
            full_name: r.display_name,
            phone: r.phone,
            country: r.custom_label,
            status: r.verification_status || "pending",
            created_at: r.created_at,
          }))
        );

        // Developers
        const { data: dev } = await supabase
          .from("developer_registrations")
          .select("user_id, company_name, company_email, company_phone, emirate, status, created_at")
          .order("created_at", { ascending: false });
        setDevelopers(
          (dev || []).map((r: any) => ({
            user_id: r.user_id,
            email: r.company_email,
            full_name: r.company_name,
            phone: r.company_phone,
            country: r.emirate,
            status: r.status,
            created_at: r.created_at,
          }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filter = (rows: CatRow[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.full_name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.country || "").toLowerCase().includes(q)
    );
  };

  const exportCsv = (rows: CatRow[], name: string) => {
    const headers = ["Name", "Email", "Phone", "Location", "Status", "Registered"];
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      lines.push(
        [r.full_name, r.email, r.phone, r.country, r.status, r.created_at]
          .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
          .join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTable = (rows: CatRow[], label: string) => {
    const filtered = filter(rows);
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#1A1A1A]/80">
            <span className="font-semibold text-[#1A1A1A]">{filtered.length}</span> of {rows.length} {label.toLowerCase()}
          </p>
          <Button variant="outline" size="sm" onClick={() => exportCsv(filtered, label.toLowerCase())}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto bg-[#FDFBF7] border border-[#B89555]/30 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F2EA] text-[#1A1A1A]/80 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Location / Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#1A1A1A]/70">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#1A1A1A]/70">No results</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.user_id} className="border-t border-[#B89555]/30 hover:bg-[#F7F2EA]">
                    <td className="px-4 py-3 text-[#1A1A1A] font-medium">{r.full_name || "—"}</td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80">
                      <div className="flex flex-col gap-0.5">
                        {r.email && <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{r.email}</span>}
                        {r.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{r.phone}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80">{r.country || "—"}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{r.status || "—"}</Badge></td>
                    <td className="px-4 py-3 text-[#1A1A1A]/70 text-xs">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4">
      <SEOHead title="User Categories | Admin" description="Manage investors, brokers, and developers" />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A]">User Categories</h1>
          <p className="text-[#1A1A1A]/80 text-sm mt-1">All registered users grouped by category</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard icon={TrendingUp} label="Investors" count={investors.length} />
          <StatCard icon={Briefcase} label="Brokers" count={brokers.length} />
          <StatCard icon={Building2} label="Developers" count={developers.length} />
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/70" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="investors">Investors ({investors.length})</TabsTrigger>
            <TabsTrigger value="brokers">Brokers ({brokers.length})</TabsTrigger>
            <TabsTrigger value="developers">Developers ({developers.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="investors">{renderTable(investors, "Investors")}</TabsContent>
          <TabsContent value="brokers">{renderTable(brokers, "Brokers")}</TabsContent>
          <TabsContent value="developers">{renderTable(developers, "Developers")}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, count }: { icon: typeof TrendingUp; label: string; count: number }) {
  return (
    <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#1A1A1A]/80">{label}</span>
        <Icon className="w-5 h-5 text-[#1A1A1A]" />
      </div>
      <div className="text-3xl font-bold text-[#1A1A1A]">{count}</div>
    </div>
  );
}
