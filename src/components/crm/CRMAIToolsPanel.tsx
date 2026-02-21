import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveLead } from "@/contexts/ActiveLeadContext";
import { 
  Calculator, Home, Ruler, FileText, Sparkles, 
  Download, Check, Building2, Image, Send, Mail,
  TrendingUp, MessageSquare, BarChart3, Brain,
  Target, Clock, Shield, Languages, Video, Palette,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  nationality?: string | null;
  preferred_language?: string | null;
}

interface CRMAIToolsPanelProps {
  lead: Lead;
  onGeneratePDF: (toolType: string, data: any) => void;
}

const AI_TOOLS = [
  // Communication Tools
  {
    id: "email-composer",
    name: "AI Email Composer",
    icon: Mail,
    description: "Generate professional emails",
    route: "/crm/leads/{id}?tab=email",
    category: "communication",
    color: "text-blue-400"
  },
  {
    id: "whatsapp-composer",
    name: "AI WhatsApp Message",
    icon: MessageSquare,
    description: "Create WhatsApp messages",
    route: "/crm/leads/{id}?tab=whatsapp",
    category: "communication",
    color: "text-green-400"
  },
  // Property Analysis
  {
    id: "property-evaluator",
    name: "Property Evaluator",
    icon: Building2,
    description: "AI-powered investment analysis",
    route: "/property-evaluator",
    category: "analysis",
    color: "text-amber-400"
  },
  {
    id: "roi-calculator",
    name: "ROI Calculator",
    icon: TrendingUp,
    description: "Calculate investment returns",
    route: "/ai-hub",
    category: "analysis",
    color: "text-green-400"
  },
  {
    id: "price-predictor",
    name: "AI Price Predictor",
    icon: BarChart3,
    description: "Predict property prices",
    route: "/ai-hub",
    category: "analysis",
    color: "text-purple-400"
  },
  {
    id: "mortgage",
    name: "Mortgage Calculator",
    icon: Calculator,
    description: "Calculate mortgage payments",
    route: "/mortgage-calculator",
    category: "analysis",
    color: "text-cyan-400"
  },
  {
    id: "rental-index",
    name: "Rental Yield Analysis",
    icon: Home,
    description: "Analyze rental market",
    route: "/rental-index",
    category: "analysis",
    color: "text-emerald-400"
  },
  // Client Intelligence
  {
    id: "lead-qualification",
    name: "Lead Qualification",
    icon: Target,
    description: "Score and qualify leads",
    route: "/ai-hub",
    category: "intelligence",
    color: "text-red-400"
  },
  {
    id: "followup-scheduler",
    name: "Follow-up Scheduler",
    icon: Clock,
    description: "AI-suggested follow-ups",
    route: "/ai-hub",
    category: "intelligence",
    color: "text-amber-400"
  },
  {
    id: "objection-handler",
    name: "Objection Handler",
    icon: Shield,
    description: "Handle client objections",
    route: "/ai-hub",
    category: "intelligence",
    color: "text-orange-400"
  },
  // Content Creation
  {
    id: "virtual-staging",
    name: "Virtual Staging",
    icon: Image,
    description: "AI room staging",
    route: "/ai-hub",
    category: "content",
    color: "text-pink-400"
  },
  {
    id: "interior-design",
    name: "Interior Design AI",
    icon: Palette,
    description: "Generate design concepts",
    route: "/interior-design-ai",
    category: "content",
    color: "text-fuchsia-400"
  },
  {
    id: "video-tour-script",
    name: "Video Tour Script",
    icon: Video,
    description: "Generate tour scripts",
    route: "/ai-hub",
    category: "content",
    color: "text-red-400"
  },
  // Documents
  {
    id: "document-generator",
    name: "Document Generator",
    icon: FileText,
    description: "Generate contracts & docs",
    route: "/documents",
    category: "documents",
    color: "text-indigo-400"
  },
  {
    id: "translation-hub",
    name: "Translation Hub",
    icon: Languages,
    description: "Translate content",
    route: "/ai-hub",
    category: "documents",
    color: "text-sky-400"
  },
  {
    id: "property-measurement",
    name: "Property Measurement",
    icon: Ruler,
    description: "Calculate dimensions",
    route: "/property-measurement",
    category: "documents",
    color: "text-teal-400"
  }
];

const CATEGORIES = [
  { id: "communication", label: "Communication", color: "text-blue-400" },
  { id: "analysis", label: "Property Analysis", color: "text-amber-400" },
  { id: "intelligence", label: "Client Intelligence", color: "text-emerald-400" },
  { id: "content", label: "Content Creation", color: "text-pink-400" },
  { id: "documents", label: "Documents", color: "text-indigo-400" }
];

const CRMAIToolsPanel = ({ lead, onGeneratePDF }: CRMAIToolsPanelProps) => {
  const navigate = useNavigate();
  const { setActiveLead } = useActiveLead();
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [sending, setSending] = useState(false);

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(t => t !== toolId)
        : [...prev, toolId]
    );
  };

  const openTool = (tool: typeof AI_TOOLS[0]) => {
    // Set active lead context
    setActiveLead({
      id: lead.id,
      full_name: lead.full_name,
      email: lead.email_lower,
      phone: lead.phone_e164,
      nationality: lead.nationality || null,
      language: lead.preferred_language || null,
    });
    
    // Navigate to tool with lead ID if needed
    const route = tool.route.replace("{id}", lead.id);
    navigate(route);
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

  const handleSendToClient = () => {
    if (!lead.email_lower) {
      toast.error("No email address available for this lead");
      return;
    }
    if (selectedTools.length === 0) {
      toast.error("Please select at least one tool to include");
      return;
    }
    setEmailSubject(`Property Analysis for ${lead.full_name}`);
    setShowEmailDialog(true);
  };

  const sendEmailToClient = async () => {
    if (!lead.email_lower) return;
    
    setSending(true);
    try {
      // Generate PDF and send via email
      const toolNames = selectedTools.map(id => AI_TOOLS.find(t => t.id === id)?.name).filter(Boolean);
      
      // For now, open mailto with pre-filled content
      const subject = encodeURIComponent(emailSubject);
      const body = encodeURIComponent(
        `Dear ${lead.full_name},\n\n` +
        `Thank you for your interest. Please find attached the following analysis:\n\n` +
        `${toolNames.map(n => `• ${n}`).join('\n')}\n\n` +
        (emailNote ? `${emailNote}\n\n` : '') +
        `Best regards,\nJBJ Global Real Estate`
      );
      
      window.open(`mailto:${lead.email_lower}?subject=${subject}&body=${body}`, "_blank");
      
      toast.success(`Email draft opened for ${lead.full_name}`);
      setShowEmailDialog(false);
      setSelectedTools([]);
    } catch (err) {
      toast.error("Failed to prepare email");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            AI Tools for {lead.full_name.split(' ')[0]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select tools to use or generate reports for this client
          </p>

          <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-3">
              {CATEGORIES.map((category) => {
                const categoryTools = AI_TOOLS.filter(t => t.category === category.id);
                
                return (
                  <div key={category.id}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${category.color}`}>
                      {category.label}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {categoryTools.map((tool) => {
                        const Icon = tool.icon;
                        const isSelected = selectedTools.includes(tool.id);
                        
                        return (
                          <div
                            key={tool.id}
                            className={`relative p-3 border rounded-lg transition-all ${
                              isSelected 
                                ? "border-gold bg-gold/10" 
                                : "border-border hover:border-muted-foreground/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleTool(tool.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isSelected ? "bg-gold/20" : "bg-muted hover:bg-muted/80"
                                }`}
                              >
                                <Icon className={`h-4 w-4 ${isSelected ? "text-gold" : tool.color}`} />
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{tool.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {tool.description}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-gold" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => openTool(tool)}
                              >
                                Open
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {selectedTools.length > 0 && (
            <div className="flex gap-2 pt-2 border-t">
              <Button 
                onClick={handleGeneratePDF} 
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
              <Button 
                onClick={handleSendToClient} 
                className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                disabled={!lead.email_lower}
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Client
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Generation Dialog */}
      <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Client Report PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Generate a branded PDF report for <strong>{lead.full_name}</strong> including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {selectedTools.map(toolId => {
                const tool = AI_TOOLS.find(t => t.id === toolId);
                return <li key={toolId}>{tool?.name}</li>;
              })}
            </ul>
            <p className="text-sm text-muted-foreground">
              The PDF will include JBJ Global Real Estate branding.
            </p>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowPDFDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmGeneratePDF} variant="dark" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send to Client Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Report to {lead.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Input value={lead.email_lower || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input 
                value={emailSubject} 
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
            <div className="space-y-2">
              <Label>Reports Included</Label>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {selectedTools.map(toolId => {
                  const tool = AI_TOOLS.find(t => t.id === toolId);
                  return <li key={toolId}>{tool?.name}</li>;
                })}
              </ul>
            </div>
            <div className="space-y-2">
              <Label>Personal Note (optional)</Label>
              <Input 
                value={emailNote} 
                onChange={(e) => setEmailNote(e.target.value)}
                placeholder="Add a personal message..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={sendEmailToClient} 
                className="flex-1 bg-green-600 hover:bg-green-500"
                disabled={sending}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Preparing..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CRMAIToolsPanel;