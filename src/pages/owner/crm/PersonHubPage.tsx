/**
 * PersonHubPage — full-screen route for /owner/crm/person/:variant/:id
 * Loads minimal identity from the appropriate table and renders <PersonHub />.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PersonHub, type PersonVariant } from "@/components/crm/PersonHub";
import { Skeleton } from "@/components/ui/skeleton";

export default function PersonHubPage() {
  const { variant, id } = useParams<{ variant: string; id: string }>();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const safeVariant: PersonVariant =
    (["lead", "investor", "broker", "sales-rep", "employee"] as PersonVariant[]).includes(variant as PersonVariant)
      ? (variant as PersonVariant)
      : "lead";

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      let table = "crm_leads";
      if (safeVariant === "broker") table = "broker_profiles";
      if (safeVariant === "sales-rep") table = "developer_sales_reps";
      if (safeVariant === "employee") table = "crm_employees";
      const { data } = await supabase
        .from(table as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (alive) { setRow(data); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id, safeVariant]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px] px-6 pb-12">
      <div className="max-w-[1100px] mx-auto">
        <Link
          to="/owner/crm"
          className="inline-flex items-center gap-1 text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A] mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to CRM
        </Link>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : !row ? (
          <div className="text-sm text-[#1A1A1A]/70">Record not found.</div>
        ) : (
          <PersonHub
            variant={safeVariant}
            id={String(row.id)}
            name={row.full_name || row.name || row.display_name || "—"}
            email={row.email || row.email_lower || null}
            phone={row.phone_e164 || row.phone || null}
            company={row.current_company || row.company_name || null}
            title={row.title || row.job_title || null}
          />
        )}
      </div>
    </div>
  );
}
