import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { ActionStrip } from "@/components/ui/ActionStrip";
import { AIDocumentGeneratorPremium } from "@/components/ai-tools/premium";
import {
  FileText,
  Briefcase,
  FileSignature,
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
    description: "Build a professional CV tailored for real estate careers.",
    path: "/cv-builder",
  },
  {
    id: "cover-letter",
    label: "Cover Letter",
    icon: FileSignature,
    description: "Generate compelling cover letters for any role.",
    path: "/toolkit/corporate-suite/cover-letter",
  },
  {
    id: "company-profile",
    label: "Company Profile",
    icon: FileText,
    description: "Create a professional company profile document.",
    path: "/toolkit/corporate-suite/company-profile",
  },
];

const DocumentStudio = () => {
  const navigate = useNavigate();
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const handleSendForSignature = () => {
    if (!generatedContent) {
      toast.error("Generate a document first");
      return;
    }
    navigate("/e-signature/create", {
      state: { prefillDocument: generatedContent, documentName: "AI Generated Document" },
    });
  };

  const attachment = generatedContent
    ? {
        id: crypto.randomUUID(),
        name: "AI-Document.txt",
        type: "file" as const,
        content: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(generatedContent)))}`,
        mimeType: "text/plain",
      }
    : null;

  return (
    <>
      <SEOHead
        title="Document Studio | JBJ Global Real Estate"
        description="Generate professional real estate documents, CVs, cover letters, and presentations with AI-powered tools."
        canonicalPath="/document-studio"
      />

      <div data-surface="champagne" className="min-h-screen bg-[#FDFBF7]">
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8 lg:px-10 py-8 md:py-10">
          {/* Header */}
          <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-8">
            <div className="flex items-start gap-4 min-w-0">
              <IconTile icon={Sparkles} tone="emerald" size="lg" />
              <div className="min-w-0">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1A1A1A]">
                  Document Studio
                </h1>
                <p className="mt-1 text-sm md:text-base text-[#1A1A1A]/70 max-w-2xl">
                  Generate professional documents, marketing content, CVs, and presentations — all in one place.
                </p>
              </div>
            </div>
            <ActionStrip align="end" className="md:flex-nowrap">
              <Button variant="secondary" onClick={() => navigate("/owner/documents")}>
                <FileText className="w-4 h-4" />
                My Documents
              </Button>
              <Button variant="primary" onClick={() => navigate("/e-signature/create")}>
                <PenTool className="w-4 h-4" />
                New Signature Doc
              </Button>
            </ActionStrip>
          </header>

          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList>
              <TabsTrigger value="generate" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Generate
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-2">
                <FileText className="w-4 h-4" />
                Document Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="rounded-2xl border border-[#B89555]/25 bg-[#F7F2EA] p-4 md:p-6 shadow-[0_1px_2px_rgba(26,26,26,0.04)]">
                <AIDocumentGeneratorPremium />
              </div>

              {generatedContent && (
                <ActionStrip align="end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedContent);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate("/owner/email-client", {
                        state: {
                          prefillSubject: "AI Generated Document",
                          prefillBody: generatedContent,
                          prefillAttachment: attachment,
                        },
                      })
                    }
                  >
                    <Mail className="w-4 h-4" />
                    Send by Email
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate("/team-chat", {
                        state: {
                          prefillMessage: `📄 Document\n\n${generatedContent.substring(0, 500)}${generatedContent.length > 500 ? "..." : ""}`,
                          prefillAttachment: attachment,
                        },
                      })
                    }
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send to Chat
                  </Button>
                  <Button variant="primary" onClick={handleSendForSignature}>
                    <PenTool className="w-4 h-4" />
                    Send for E-Signature
                  </Button>
                </ActionStrip>
              )}
            </TabsContent>

            <TabsContent value="tools">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {TOOL_LINKS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    data-surface="champagne"
                    onClick={() => navigate(tool.path)}
                    className="group flex min-h-[148px] items-start gap-4 rounded-2xl border border-[#B89555]/25 bg-[#F7F2EA] p-5 text-left transition-all duration-200 hover:border-[#B89555]/55 hover:shadow-[0_8px_24px_-12px_rgba(6,78,59,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-2"
                  >
                    <IconTile icon={tool.icon} tone="emerald" size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[#1A1A1A]">{tool.label}</h3>
                      <p className="mt-1 text-sm text-[#1A1A1A]/65">{tool.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#064E3B] opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
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
