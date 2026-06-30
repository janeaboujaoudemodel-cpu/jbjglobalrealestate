/**
 * DevSalesRepsDirectory — single-entity view of public.developer_sales_reps.
 * No shared role-tab bar. Empty-state surfaces an Import CTA rather than fake data.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Phone, Mail, MessageCircle, Upload, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useEntityTotal } from "@/hooks/useEntityTotal";
import { UnifiedCRMExportModal } from "@/components/crm/UnifiedCRMExportModal";

interface RepRow {
  id: string;
  developer_id: string;
  full_name: string;
  title: string | null;
  phone_e164: string | null;
  email: string | null;
  whatsapp_number: string | null;
  is_primary: boolean | null;
  is_active: boolean | null;
  nationality: string | null;
  languages: string[] | null;
  developer?: { name: string | null; logo_url: string | null } | null;
}

export default function DevSalesRepsDirectory() {
  const [rows, setRows] = useState<RepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const { total: dbTotal } = useEntityTotal("developer_sales_reps", (q) => q.eq("is_active", true));

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const { data, error } = await supabase
          .from("developer_sales_reps")
          .select("id,developer_id,full_name,title,phone_e164,email,whatsapp_number,is_primary,is_active,nationality,languages, developer:developers!developer_sales_reps_developer_id_fkey(name,logo_url)")
          .eq("is_active", true)
          .order("is_primary", { ascending: false })
          .order("full_name", { ascending: true })
          .limit(2000);
        if (error) throw error;
        if (alive) setRows((data || []) as unknown as RepRow[]);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load sales reps");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.full_name || "").toLowerCase().includes(q) ||
      (r.developer?.name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.title || "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-6 text-center">
        <p className="text-sm text-[#1A1A1A]">Could not load sales reps.</p>
        <p className="text-xs text-[#1A1A1A]/60 mt-1">{err}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Developer Sales Representatives</h2>
          <p className="text-xs text-[#1A1A1A]/60">
            {filtered.length.toLocaleString()} of {(dbTotal ?? rows.length).toLocaleString()} reps
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, developer, email…"
            className="h-9 w-72 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
          />
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-10 text-center">
          <BadgeCheck className="h-8 w-8 text-[#B89555] mx-auto mb-2" />
          <p className="text-sm text-[#1A1A1A] mb-1">
            No developer sales representatives have been imported yet.
          </p>
          <p className="text-xs text-[#1A1A1A]/60 mb-4">
            Add reps from the Provident Portal or upload directly via the developer page.
          </p>
          <Link
            to="/owner/provident"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#EFE6D6] border border-[#B89555] text-[#1A1A1A] text-sm font-semibold hover:bg-[#EFE6D6]/80"
          >
            <Upload className="h-4 w-4" /> Import sales reps
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
              <tr>
                <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Sales Rep</th>
                <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Title</th>
                <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Developer</th>
                <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Phone</th>
                <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Email</th>
                <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">WhatsApp</th>
                <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Languages</th>
                <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B89555]/15">
              {filtered.map((r) => {
                const telHref = r.phone_e164 ? `tel:${r.phone_e164}` : null;
                const waHref = r.whatsapp_number ? `https://wa.me/${r.whatsapp_number.replace(/\D/g, "")}` : null;
                const mailHref = r.email ? `mailto:${r.email}` : null;
                return (
                  <tr key={r.id} className="hover:bg-[#F7F2EA]/60">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#F7F2EA] border border-[#B89555]/20 flex items-center justify-center overflow-hidden flex-none">
                          {r.developer?.logo_url
                            ? <img src={r.developer.logo_url} alt="" className="max-w-full max-h-full object-contain"  loading="lazy" decoding="async" />
                            : <BadgeCheck className="h-4 w-4 text-[#B89555]" />}
                        </div>
                        <span className="font-semibold text-[#1A1A1A]">{r.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{r.title || "—"}</td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                      {r.developer?.name ? (
                        <Link
                          to={`/owner/crm/relationship-hub?tab=developers&developer=${r.developer_id}`}
                          className="hover:underline decoration-[#B89555] underline-offset-2"
                          title="Open developer in Relationships Hub"
                        >
                          {r.developer.name}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                      {telHref ? <a href={telHref} className="inline-flex items-center gap-1 hover:underline"><Phone className="h-3 w-3" />{r.phone_e164}</a> : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap max-w-[220px]">
                      {mailHref ? <a href={mailHref} className="inline-flex items-center gap-1 hover:underline truncate" title={r.email || ''}><Mail className="h-3 w-3 flex-shrink-0" /><span className="truncate">{r.email}</span></a> : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                      {waHref ? <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline"><MessageCircle className="h-3 w-3" />{r.whatsapp_number}</a> : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{(r.languages || []).join(", ") || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.is_primary && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]">PRIMARY</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <UnifiedCRMExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        kind="developers"
        rows={filtered as any[]}
        filenameStem="crm-developer-reps"
      />
    </div>
  );
}
