/**
 * CompanyHubPage — full-screen route for /owner/crm/company/:type/:name
 */
import { useParams, Link } from "react-router-dom";
import { CompanyHub, type CompanyType } from "@/components/crm/CompanyHub";
import { ChevronLeft } from "lucide-react";

export default function CompanyHubPage() {
  const { type, name } = useParams<{ type: string; name: string }>();
  const safeType: CompanyType = type === "developer" ? "developer" : "brokerage";
  const companyName = decodeURIComponent(name ?? "");

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px] px-6 pb-12">
      <div className="max-w-[1200px] mx-auto">
        <Link
          to="/owner/crm/network"
          className="inline-flex items-center gap-1 text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A] mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to CRM Network
        </Link>
        {companyName ? (
          <CompanyHub type={safeType} companyName={companyName} />
        ) : (
          <div className="text-sm text-[#1A1A1A]/70">No company specified.</div>
        )}
      </div>
    </div>
  );
}
