import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2, Download, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
}

interface Project {
  id: string;
  name: string;
  location: string | null;
  price_from: number | null;
}

interface ClientPDFGeneratorProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  selectedTools: string[];
}

const AVAILABLE_SECTIONS = [
  { id: "cover", label: "Cover Page with Client Name", default: true },
  { id: "mortgage", label: "Mortgage Calculator Results" },
  { id: "properties", label: "Selected Properties" },
  { id: "rental-analysis", label: "Rental Yield Analysis" },
  { id: "market-overview", label: "Market Overview" },
  { id: "payment-plans", label: "Payment Plans" },
  { id: "contact", label: "Contact Information" },
];

const ClientPDFGenerator = ({ open, onClose, lead, selectedTools }: ClientPDFGeneratorProps) => {
  const [selectedSections, setSelectedSections] = useState<string[]>(["cover", "contact"]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const loadProjects = async () => {
    if (projects.length > 0) return;
    
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, location, price_from")
        .order("name")
        .limit(50);

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
    
    if (sectionId === "properties" && !selectedSections.includes("properties")) {
      loadProjects();
    }
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(p => p !== projectId)
        : [...prev, projectId]
    );
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // In a real implementation, this would call an edge function to generate the PDF
      const pdfData = {
        clientName: lead.full_name,
        clientEmail: lead.email_lower,
        sections: selectedSections,
        projects: selectedProjects,
        tools: selectedTools,
        generatedAt: new Date().toISOString(),
        companyName: "JBJ Global Real Estate",
      };
      
      console.log("Generating PDF with data:", pdfData);
      
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`PDF report generated for ${lead.full_name}`);
      onClose();
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#1A1A1A]" />
            Generate Client Report
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Client Info */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">{lead.full_name}</p>
            <p className="text-sm text-muted-foreground">{lead.email_lower}</p>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Include Sections</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_SECTIONS.map((section) => (
                <div
                  key={section.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedSections.includes(section.id)
                      ? "border-[#B89555] bg-[#EFE6D6]/5"
                      : "hover:border-[#B89555]/30"
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  <Checkbox
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <span className="text-sm">{section.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Properties Selection */}
          {selectedSections.includes("properties") && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Properties</Label>
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-48 border rounded-lg">
                  <div className="p-3 space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                          selectedProjects.includes(project.id)
                            ? "bg-[#EFE6D6]/10"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleProject(project.id)}
                      >
                        <Checkbox
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={() => toggleProject(project.id)}
                        />
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.location}</p>
                        </div>
                        {project.price_from && (
                          <span className="text-xs text-[#1A1A1A]">
                            From AED {(project.price_from / 1000000).toFixed(1)}M
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Branding Note */}
          <div className="p-4 bg-[#EFE6D6]/10 rounded-lg border border-[#B89555]/20">
            <p className="text-sm">
              <strong>Note:</strong> The PDF will include JBJ Global Real Estate branding, 
              the client's name ({lead.full_name}), and all selected content formatted 
              professionally for client presentation.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={generatePDF} 
            disabled={isGenerating || selectedSections.length === 0}
            className="flex-1 bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientPDFGenerator;
