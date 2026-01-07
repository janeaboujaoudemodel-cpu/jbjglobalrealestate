import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePlus, Loader2, Copy, Check, Sparkles, Download } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIDocumentGeneratorProps {
  onResponse?: (response: any) => void;
}

const DOCUMENT_TYPES = [
  { value: "listing", label: "Property Listing Description" },
  { value: "email-follow-up", label: "Follow-up Email" },
  { value: "email-introduction", label: "Introduction Email" },
  { value: "sms", label: "SMS / WhatsApp Message" },
  { value: "brochure", label: "Property Brochure Text" },
  { value: "social-media", label: "Social Media Post" },
  { value: "newsletter", label: "Newsletter Content" },
  { value: "client-report", label: "Client Report" },
  { value: "market-update", label: "Market Update" },
  { value: "testimonial-request", label: "Testimonial Request" },
];

const AIDocumentGenerator = ({ onResponse }: AIDocumentGeneratorProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    documentType: "listing",
    subject: "",
    details: "",
    tone: "professional",
    recipientName: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.details.trim()) {
      toast.error("Please provide document details");
      return;
    }

    const result = await invokeTool("ai-document-generator", formData);

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.document) {
      navigator.clipboard.writeText(response.document);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilePlus className="h-5 w-5 text-primary" />
          AI Document Generator
        </CardTitle>
        <CardDescription>
          Generate professional real estate documents, emails, and marketing content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type *</Label>
            <Select value={formData.documentType} onValueChange={(v) => handleChange("documentType", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={formData.tone} onValueChange={(v) => handleChange("tone", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="luxury">Ultra-Luxury</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject / Title</Label>
            <Input
              id="subject"
              placeholder="Document subject or title..."
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name (optional)</Label>
            <Input
              id="recipientName"
              placeholder="John Smith"
              value={formData.recipientName}
              onChange={(e) => handleChange("recipientName", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="details">Details & Context *</Label>
          <Textarea
            id="details"
            placeholder="Provide details for the document: property info, client info, key points to include..."
            value={formData.details}
            onChange={(e) => handleChange("details", e.target.value)}
            rows={5}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Document...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Document
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.subject && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <h4 className="text-sm text-muted-foreground mb-1">Subject Line</h4>
                <p className="font-semibold">{response.subject}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Generated Document</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {response.document}
            </div>

            {response.alternatives && response.alternatives.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Alternative Versions</h4>
                {response.alternatives.map((alt: string, idx: number) => (
                  <div key={idx} className="bg-muted/50 p-3 rounded-lg text-sm">
                    <span className="text-xs text-muted-foreground mb-1 block">Version {idx + 2}</span>
                    {alt}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDocumentGenerator;
