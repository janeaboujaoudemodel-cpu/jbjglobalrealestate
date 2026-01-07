import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calculator, Home, Ruler, FileText, Sparkles, 
  Download, Check, Building2, Image
} from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
}

interface CRMAIToolsPanelProps {
  lead: Lead;
  onGeneratePDF: (toolType: string, data: any) => void;
}

const AI_TOOLS = [
  {
    id: "mortgage",
    name: "Mortgage Calculator",
    icon: Calculator,
    description: "Calculate mortgage payments and affordability",
    route: "/mortgage-calculator"
  },
  {
    id: "property-evaluator",
    name: "Property Evaluator",
    icon: Building2,
    description: "AI-powered property investment analysis",
    route: "/ai-hub"
  },
  {
    id: "interior-design",
    name: "Interior Design AI",
    icon: Image,
    description: "Generate interior design visualizations",
    route: "/interior-design-ai"
  },
  {
    id: "rental-index",
    name: "Rental Index",
    icon: Home,
    description: "Analyze rental yields and market trends",
    route: "/rental-index"
  },
  {
    id: "property-measurement",
    name: "Property Measurement",
    icon: Ruler,
    description: "Calculate property dimensions",
    route: "/property-measurement"
  },
  {
    id: "document-scanner",
    name: "Document Scanner",
    icon: FileText,
    description: "AI document analysis",
    route: "/document-scanner"
  }
];

const CRMAIToolsPanel = ({ lead, onGeneratePDF }: CRMAIToolsPanelProps) => {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [showPDFDialog, setShowPDFDialog] = useState(false);

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(t => t !== toolId)
        : [...prev, toolId]
    );
  };

  const openToolInNewTab = (route: string) => {
    window.open(route, "_blank");
  };

  const handleGeneratePDF = () => {
    if (selectedTools.length === 0) {
      toast.error("Please select at least one tool");
      return;
    }
    
    setShowPDFDialog(true);
  };

  const confirmGeneratePDF = () => {
    onGeneratePDF("multi-tool", { tools: selectedTools });
    setShowPDFDialog(false);
    setSelectedTools([]);
    toast.success("PDF generation started");
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            AI Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Use AI tools for {lead.full_name} and generate client reports
          </p>

          <div className="grid grid-cols-2 gap-2">
            {AI_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTools.includes(tool.id);
              
              return (
                <div
                  key={tool.id}
                  className={`relative p-3 border rounded-lg cursor-pointer transition-all hover:border-gold/50 ${
                    isSelected ? "border-gold bg-gold/10" : ""
                  }`}
                  onClick={() => toggleTool(tool.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`p-1.5 rounded ${isSelected ? "bg-gold/20" : "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${isSelected ? "text-gold" : ""}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tool.name}</p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-gold absolute top-2 right-2" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      openToolInNewTab(tool.route);
                    }}
                  >
                    Open Tool →
                  </Button>
                </div>
              );
            })}
          </div>

          {selectedTools.length > 0 && (
            <Button 
              onClick={handleGeneratePDF} 
              className="w-full mt-4 bg-gold hover:bg-gold/90 text-black"
            >
              <Download className="h-4 w-4 mr-2" />
              Generate PDF ({selectedTools.length} tool{selectedTools.length > 1 ? "s" : ""})
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Client Report PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This will generate a branded PDF report for <strong>{lead.full_name}</strong> including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {selectedTools.map(toolId => {
                const tool = AI_TOOLS.find(t => t.id === toolId);
                return <li key={toolId}>{tool?.name}</li>;
              })}
            </ul>
            <p className="text-sm text-muted-foreground">
              The PDF will include the client's name and JJ Global Capital branding.
            </p>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowPDFDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmGeneratePDF} className="flex-1 bg-gold text-black hover:bg-gold/90">
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CRMAIToolsPanel;
