/**
 * DevSalesRepsDirectory — single-entity view of public.developer_sales_reps.
 * No shared role-tab bar. Empty-state surfaces an Import CTA rather than fake data.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Phone, Mail, MessageCircle, Upload } from "lucide-react";
import { Link } from "react-router-dom";

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
            {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} reps
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, developer, email…"
          className="h-9 w-72 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
        />
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
                <th className="text-left px-4 py-2 font-semibold">Name</th>
                <th className="text-left px-4 py-2 font-semibold">Title</th>
                <th className="text-left px-4 py-2 font-semibold">Developer</th>
                <th className="text-left px-4 py-2 font-semibold">Phone</th>
                <th className="text-left px-4 py-2 font-semibold">Email</th>
                <th className="text-left px-4 py-2 font-semibold">WhatsApp</th>
                <th className="text-left px-4 py-2 font-semibold">Languages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B89555]/15">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#F7F2EA]/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.is_primary && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]">
                          PRIMARY
                        </span>
                      )}
                      <span className="font-semibold text-[#1A1A1A]">{r.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{r.title || "—"}</td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{r.developer?.name || "—"}</td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                    {r.phone_e164 ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone_e164}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                    {r.email ? <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                    {r.whatsapp_number ? <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{r.whatsapp_number}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                    {(r.languages || []).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
