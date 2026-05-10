import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MessageSquare } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Shield,
  Sparkles,
  Loader2,
  Copy,
  Check,
  PenTool,
  Download,
  ScrollText,
  Users,
  Scale,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─── Template Categories ─────────────────────────────────────────────────────

interface Template {
  id: string;
  label: string;
  category: string;
  description: string;
  promptPrefix: string;
}

const TEMPLATES: Template[] = [
  // Contracts
  { id: "offer-letter", label: "Offer Letter", category: "contracts", description: "Employment offer with salary, commission, and terms", promptPrefix: "Generate a professional employment offer letter" },
  { id: "employment-contract", label: "Employment Contract", category: "contracts", description: "Full employment agreement with terms and conditions", promptPrefix: "Generate a full employment contract" },
  { id: "commission-agreement", label: "Commission Agreement", category: "contracts", description: "Sales commission structure and payment terms", promptPrefix: "Generate a commission agreement" },
  { id: "mou", label: "Memorandum of Understanding", category: "contracts", description: "MOU between parties for collaboration or deal", promptPrefix: "Generate a Memorandum of Understanding" },

  // HR Letters
  { id: "recommendation", label: "Recommendation Letter", category: "hr", description: "Professional recommendation for an employee", promptPrefix: "Generate a recommendation letter" },
  { id: "termination", label: "Termination Letter", category: "hr", description: "Employment termination notice with terms", promptPrefix: "Generate a termination letter" },
  { id: "salary-certificate", label: "Salary Certificate", category: "hr", description: "Official salary verification document", promptPrefix: "Generate a salary certificate" },
  { id: "noc", label: "No Objection Certificate", category: "hr", description: "NOC for employee requests", promptPrefix: "Generate a No Objection Certificate (NOC)" },

  // Legal
  { id: "nda", label: "Non-Disclosure Agreement", category: "legal", description: "Confidentiality agreement between parties", promptPrefix: "Generate a Non-Disclosure Agreement (NDA)" },
  { id: "non-compete", label: "Non-Compete Agreement", category: "legal", description: "Non-competition clause document", promptPrefix: "Generate a Non-Compete Agreement" },
  { id: "vendor-agreement", label: "Vendor Agreement", category: "legal", description: "Service provider or vendor contract", promptPrefix: "Generate a Vendor Agreement" },

  // RERA Forms
  { id: "form-f", label: "Form F", category: "rera", description: "RERA Listing Agreement (Exclusive)", promptPrefix: "Generate a RERA Form F listing agreement" },
  { id: "form-a", label: "Form A", category: "rera", description: "RERA Contract of Sale (Buyer)", promptPrefix: "Generate a RERA Form A contract of sale" },
  { id: "form-b", label: "Form B", category: "rera", description: "RERA Sale Agreement (Seller)", promptPrefix: "Generate a RERA Form B sale agreement" },
  { id: "form-i", label: "Form I", category: "rera", description: "RERA Tenancy Contract", promptPrefix: "Generate a RERA Form I tenancy contract" },
];

const CATEGORIES = [
  { id: "contracts", label: "Contracts", icon: ScrollText },
  { id: "hr", label: "HR Letters", icon: Users },
  { id: "legal", label: "Legal", icon: Scale },
  { id: "rera", label: "RERA Forms", icon: Building2 },
];

const ExclusiveDocuments = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customDetails, setCustomDetails] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDocType, setAiDocType] = useState("contract-prompt");
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [generatedSubject, setGeneratedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateFromTemplate = async (template: Template) => {
    if (!customDetails.trim()) {
      toast.error("Please provide details for the document");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-document-generator", {
        body: {
          documentType: "contract-prompt",
          tone: "professional",
          typeFields: {
            templateType: template.label,
            instructions: `${template.promptPrefix} with the following details:`,
            details: customDetails,
          },
        },
      });
      if (error) throw error;
      setGeneratedDocument(data.document || "No content generated");
      setGeneratedSubject(data.subject || null);
      toast.success("Document generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  const generateFromPrompt = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-document-generator", {
        body: {
          documentType: "contract-prompt",
          tone: "professional",
          typeFields: {
            templateType: aiDocType,
            instructions: "Generate a professional legal/HR document based on this prompt:",
            details: aiPrompt,
          },
        },
      });
      if (error) throw error;
      setGeneratedDocument(data.document || "No content generated");
      setGeneratedSubject(data.subject || null);
      toast.success("Document generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedDocument) {
      navigator.clipboard.writeText(generatedDocument);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendForSignature = () => {
    if (!generatedDocument) return;
    navigate("/e-signature/create", {
      state: {
        prefillDocument: generatedDocument,
        documentName: generatedSubject || selectedTemplate?.label || "Contract",
      },
    });
  };

  return (
    <>
      <SEOHead
        title="JBJ Exclusive Documents | JBJ Global Real Estate"
        description="Generate contracts, NDAs, HR letters, and RERA forms with AI-powered document generation."
        canonicalPath="/owner/exclusive-documents"
      />

      {/* Hero Header */}
      <div className="bg-[#1A1A1A] border-b border-[#B89555]/20">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#EFE6D6]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              JBJ <span className="text-[#1A1A1A]">Exclusive Documents</span>
            </h1>
          </div>
          <p className="text-[#1A1A1A]/70 ml-[52px]">
            Contracts, HR letters, NDAs, and RERA forms — AI-generated and ready for signature.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-[#1A1A1A]/5 border border-[#B89555]/20 p-1 h-auto flex-wrap">
              <TabsTrigger value="templates" className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] gap-2">
                <FileText className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="ai-generate" className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] gap-2">
                <Sparkles className="w-4 h-4" />
                AI Generate
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Templates Grid */}
            <TabsContent value="templates" className="space-y-8">
              {CATEGORIES.map((cat) => {
                const items = TEMPLATES.filter((t) => t.category === cat.id);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <cat.icon className="w-5 h-5 text-[#1A1A1A]" />
                      <h2 className="text-xl font-bold text-[#1A1A1A]">{cat.label}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((template) => (
                        <Card
                          key={template.id}
                          className={`border-2 transition-all cursor-pointer ${
                            selectedTemplate?.id === template.id
                              ? "border-[#B89555] bg-[#EFE6D6]/5"
                              : "border-[#B89555]/20 hover:border-[#B89555]/40 bg-[#FDFBF7]/60"
                          }`}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setGeneratedDocument(null);
                          }}
                        >
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-[#1A1A1A]">{template.label}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Template Generation Form */}
              {selectedTemplate && (
                <Card className="border-2 border-[#B89555]/30 bg-[#FDFBF7]/80">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-[#1A1A1A]">
                      Generate: {selectedTemplate.label}
                    </h3>
                    <div className="space-y-2">
                      <Label className="text-[#1A1A1A]">Details & Requirements *</Label>
                      <Textarea
                        placeholder={`e.g. Employee: John Smith, Passport: AB1234567, Start Date: 1 April 2026, Commission: 20%...`}
                        value={customDetails}
                        onChange={(e) => setCustomDetails(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <Button
                      onClick={() => generateFromTemplate(selectedTemplate)}
                      disabled={loading}
                      className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate {selectedTemplate.label}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab 2: Free-form AI Prompt */}
            <TabsContent value="ai-generate" className="space-y-6">
              <Card className="border-2 border-[#B89555]/30 bg-[#FDFBF7]/80">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
                    AI Contract & Document Generator
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Describe what you need in plain language. The AI will generate a professional document.
                  </p>

                  <div className="space-y-2">
                    <Label className="text-[#1A1A1A]">Document Category</Label>
                    <Select value={aiDocType} onValueChange={setAiDocType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract-prompt">Contract / Agreement</SelectItem>
                        <SelectItem value="hr-letter">HR Letter</SelectItem>
                        <SelectItem value="legal-document">Legal Document</SelectItem>
                        <SelectItem value="rera-form">RERA Form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#1A1A1A]">Your Prompt *</Label>
                    <Textarea
                      placeholder="Generate an offer letter for John Smith with 20% commission, start date 1 April 2026, base salary AED 8,000..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <Button
                    onClick={generateFromPrompt}
                    disabled={loading}
                    className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Document...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Document
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generated Document Output */}
          {generatedDocument && (
            <div className="mt-8 space-y-4">
              {generatedSubject && (
                <div className="bg-[#EFE6D6]/10 border border-[#B89555]/30 p-4 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Document Title</p>
                  <p className="font-bold text-[#1A1A1A] text-lg">{generatedSubject}</p>
                </div>
              )}

              <Card className="border-2 border-[#B89555]/30 bg-[#FDFBF7]/90">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#1A1A1A] text-lg">Generated Document</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy} className="border-[#B89555]/40">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-[#FDFBF7] border border-[#B89555]/10 p-6 rounded-lg prose prose-sm max-w-none whitespace-pre-wrap text-[#1A1A1A]">
                    {generatedDocument}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-end flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => navigate("/owner/email-client", {
                    state: {
                      prefillSubject: generatedSubject || selectedTemplate?.label || "Document",
                      prefillBody: generatedDocument,
                      prefillAttachment: {
                        id: crypto.randomUUID(),
                        name: `${generatedSubject || selectedTemplate?.label || "Document"}.txt`,
                        type: 'file' as const,
                        content: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(generatedDocument!)))}`,
                        mimeType: 'text/plain',
                      },
                    },
                  })}
                  className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send by Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/team-chat", {
                    state: {
                      prefillMessage: `📄 ${generatedSubject || "Document"}\n\n${generatedDocument!.substring(0, 500)}${generatedDocument!.length > 500 ? '...' : ''}`,
                      prefillAttachment: {
                        id: crypto.randomUUID(),
                        name: `${generatedSubject || selectedTemplate?.label || "Document"}.txt`,
                        type: 'file' as const,
                        content: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(generatedDocument!)))}`,
                        mimeType: 'text/plain',
                      },
                    },
                  })}
                  className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send to Chat
                </Button>
                <Button
                  onClick={handleSendForSignature}
                  className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold"
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Send for E-Signature
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExclusiveDocuments;
