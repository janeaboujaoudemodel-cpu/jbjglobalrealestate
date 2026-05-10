import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIDocumentGeneratorPremium } from "@/components/ai-tools/premium";
import {
  FileText,
  Briefcase,
  FileSignature,
  Presentation,
  ArrowRight,
  Sparkles,
  Copy,
  PenTool,
  Mail,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

const TOOL_LINKS = [
  {
    id: "cv",
    label: "CV & Resume",
    icon: Briefcase,
    description: "Build a professional CV tailored for real estate careers",
    path: "/toolkit/corporate-suite/cv-resume",
  },
  {
    id: "cover-letter",
    label: "Cover Letter",
    icon: FileSignature,
    description: "Generate compelling cover letters for any role",
    path: "/toolkit/corporate-suite/cover-letter",
  },
  {
    id: "company-profile",
    label: "Company Profile",
    icon: FileText,
    description: "Create a professional company profile document",
    path: "/toolkit/corporate-suite/company-profile",
  },
  {
    id: "presentations",
    label: "Presentations",
    icon: Presentation,
    description: "Design stunning AI-powered presentations",
    path: "/presentations",
  },
];

const DocumentStudio = () => {
  const navigate = useNavigate();
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const handleAIResponse = (response: any) => {
    if (response?.document) {
      setGeneratedContent(response.document);
    }
  };

  const handleSendForSignature = () => {
    if (!generatedContent) {
      toast.error("Generate a document first");
      return;
    }
    navigate("/e-signature/create", {
      state: {
        prefillDocument: generatedContent,
        documentName: "AI Generated Document",
      },
    });
  };

  return (
    <>
      <SEOHead
        title="Document Studio | JBJ Global Real Estate"
        description="Generate professional real estate documents, CVs, cover letters, and presentations with AI-powered tools."
        canonicalPath="/document-studio"
      />

      {/* Hero Header */}
      <div className="bg-[#1A1A1A] border-b border-[#B89555]/20">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#EFE6D6]/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Document <span className="text-[#1A1A1A]">Studio</span>
            </h1>
          </div>
          <p className="text-[#1A1A1A]/70 ml-[52px]">
            Generate professional documents, marketing content, CVs, and presentations — all in one place.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList className="bg-[#1A1A1A]/5 border border-[#B89555]/20 p-1 h-auto flex-wrap">
              <TabsTrigger value="generate" className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] gap-2">
                <Sparkles className="w-4 h-4" />
                AI Generate
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] gap-2">
                <FileText className="w-4 h-4" />
                Document Tools
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: AI Document Generator */}
            <TabsContent value="generate" className="space-y-4">
              <AIDocumentGeneratorPremium />

              {generatedContent && (
                <div className="flex gap-3 justify-end flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedContent);
                      toast.success("Copied to clipboard");
                    }}
                    className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/owner/email-client", {
                      state: {
                        prefillSubject: "AI Generated Document",
                        prefillBody: generatedContent,
                        prefillAttachment: {
                          id: crypto.randomUUID(),
                          name: "AI-Document.txt",
                          type: 'file' as const,
                          content: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(generatedContent!)))}`,
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
                        prefillMessage: `📄 Document\n\n${generatedContent!.substring(0, 500)}${generatedContent!.length > 500 ? '...' : ''}`,
                        prefillAttachment: {
                          id: crypto.randomUUID(),
                          name: "AI-Document.txt",
                          type: 'file' as const,
                          content: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(generatedContent!)))}`,
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
              )}
            </TabsContent>

            {/* Tab 2: Document Tools Grid */}
            <TabsContent value="tools">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TOOL_LINKS.map((tool) => (
                  <Card
                    key={tool.id}
                    className="border-2 border-[#B89555]/20 hover:border-[#B89555]/50 transition-all cursor-pointer group bg-[#FDFBF7]/60"
                    onClick={() => navigate(tool.path)}
                  >
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#EFE6D6]/10 flex items-center justify-center shrink-0 group-hover:bg-[#EFE6D6]/20 transition-colors">
                        <tool.icon className="w-6 h-6 text-[#1A1A1A]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-[#1A1A1A] mb-1">{tool.label}</h3>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default DocumentStudio;
