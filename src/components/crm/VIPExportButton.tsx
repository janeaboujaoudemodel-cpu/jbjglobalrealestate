import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Crown, Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { useStepUpAuth } from "@/hooks/useStepUpAuth";
import ReAuthModal from "@/components/security/ReAuthModal";
import { logExportEvent, maskExportField } from "@/utils/dlpExportLogger";

const VIPExportButton = () => {
  const [exporting, setExporting] = useState(false);
  const stepUp = useStepUpAuth();

  const fetchVIPLeads = async () => {
    const { data, error } = await supabase
      .from("crm_leads")
      .select(`
        id, full_name, phone_e164, email_lower, nationality, 
        preferred_language, current_location_country, source, 
        tags, vip, vip_tagged_at, created_at, company_name
      `)
      .eq("vip", true)
      .order("vip_tagged_at", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const leads = await fetchVIPLeads();
      
      if (leads.length === 0) {
        toast.error("No VIP leads to export");
        return;
      }

      const masked = !stepUp.isElevated;
      const fieldsMasked = masked ? ["phone_e164", "email_lower"] : [];

      const headers = [
        "Full Name", "Phone", "Email", "Company", "Nationality", 
        "Language", "Country", "Source", "Tags", "VIP Tagged At", "Created At"
      ];
      
      const csvRows = [
        headers.join(","),
        ...leads.map(lead => [
          `"${(lead.full_name || '').replace(/"/g, '""')}"`,
          masked ? maskExportField("phone_e164", lead.phone_e164) : (lead.phone_e164 || ''),
          masked ? maskExportField("email_lower", lead.email_lower) : (lead.email_lower || ''),
          `"${(lead.company_name || '').replace(/"/g, '""')}"`,
          lead.nationality || '',
          lead.preferred_language || '',
          lead.current_location_country || '',
          lead.source || '',
          `"${(lead.tags || []).join(', ')}"`,
          lead.vip_tagged_at ? new Date(lead.vip_tagged_at).toLocaleDateString() : '',
          lead.created_at ? new Date(lead.created_at).toLocaleDateString() : ''
        ].join(","))
      ];
      
      const csv = csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jbj_vip_leads_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      await logExportEvent({
        exportType: "vip_leads",
        exportFormat: "csv",
        recordCount: leads.length,
        containsPii: true,
        fieldsExported: ["full_name", "phone_e164", "email_lower", "company_name", "nationality"],
        fieldsMasked,
        requiredStepUp: true,
      });
      
      toast.success(`Exported ${leads.length} VIP leads to CSV${masked ? " (PII masked)" : ""}`);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export VIP leads");
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = async () => {
    setExporting(true);
    try {
      const leads = await fetchVIPLeads();
      
      if (leads.length === 0) {
        toast.error("No VIP leads to export");
        return;
      }

      const masked = !stepUp.isElevated;
      const fieldsMasked = masked ? ["phone_e164", "email_lower"] : [];

      const jsonData = {
        export_date: new Date().toISOString(),
        total_vip_leads: leads.length,
        pii_masked: masked,
        leads: leads.map(lead => ({
          id: lead.id,
          full_name: lead.full_name,
          phone: masked ? maskExportField("phone_e164", lead.phone_e164) : lead.phone_e164,
          email: masked ? maskExportField("email_lower", lead.email_lower) : lead.email_lower,
          company: lead.company_name,
          nationality: lead.nationality,
          language: lead.preferred_language,
          country: lead.current_location_country,
          source: lead.source,
          tags: lead.tags,
          vip_tagged_at: lead.vip_tagged_at,
          created_at: lead.created_at
        }))
      };

      const json = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jbj_vip_leads_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await logExportEvent({
        exportType: "vip_leads",
        exportFormat: "json",
        recordCount: leads.length,
        containsPii: true,
        fieldsExported: ["full_name", "phone_e164", "email_lower", "company_name", "nationality"],
        fieldsMasked,
        requiredStepUp: true,
      });
      
      toast.success(`Exported ${leads.length} VIP leads to JSON${masked ? " (PII masked)" : ""}`);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export VIP leads");
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    stepUp.requireStepUp("Export VIP Leads (CSV)", "critical", exportToCSV);
  };

  const handleExportJSON = () => {
    stepUp.requireStepUp("Export VIP Leads (JSON)", "critical", exportToJSON);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="text-[#1A1A1A] border-[#B89555]/50 hover:bg-[#EFE6D6]/20"
            disabled={exporting}
          >
            <Crown className="h-4 w-4 mr-2 text-[#1A1A1A]" />
            Export VIP
            <ChevronDown className="h-3 w-3 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
          <DropdownMenuItem 
            onClick={handleExportCSV}
            className="text-[#1A1A1A] hover:bg-[#EFE6D6]/20 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleExportJSON}
            className="text-[#1A1A1A] hover:bg-[#EFE6D6]/20 cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReAuthModal
        open={stepUp.modalOpen}
        onOpenChange={stepUp.onModalOpenChange}
        onSuccess={stepUp.onModalSuccess}
        actionLabel={stepUp.modalActionLabel}
        severity={stepUp.modalSeverity}
      />
    </>
  );
};

export default VIPExportButton;
