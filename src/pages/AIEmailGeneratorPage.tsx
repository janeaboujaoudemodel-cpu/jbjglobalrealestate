/**
 * AI Email Generator Page
 * Generate professional real estate emails using AI
 */

import { useState } from "react";
import { Mail, Send, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AIToolPremiumLayout from "@/components/ai-tools/AIToolPremiumLayout";
import AIToolGuide from "@/components/ai-tools/AIToolGuide";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { Wand2, Sliders } from "lucide-react";

interface EmailResult {
  subject?: string;
  greeting?: string;
  body?: string;
  callToAction?: string;
  closing?: string;
  signature?: string;
  tips?: string[];
  alternativeSubjects?: string[];
}

export default function AIEmailGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [emailType, setEmailType] = useState("follow-up");
  const [recipientName, setRecipientName] = useState("");
  const [propertyDetails, setPropertyDetails] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("professional");
  const [additionalContext, setAdditionalContext] = useState("");

  const emailTypes = [
    { value: "follow-up", label: "Follow-up" },
    { value: "introduction", label: "Introduction" },
    { value: "offer", label: "Property Offer" },
    { value: "listing-alert", label: "Listing Alert" },
    { value: "market-update", label: "Market Update" },
    { value: "thank-you", label: "Thank You" },
    { value: "appointment", label: "Appointment" },
    { value: "negotiation", label: "Negotiation" },
  ];

  const handleSubmit = async () => {
    if (!emailType) {
      toast.error("Please select an email type");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-email-generator", {
        body: {
          emailType,
          context: {
            recipientName,
            propertyDetails,
            purpose,
            tone,
            additionalContext,
          },
        },
      });

      if (error) throw error;
      if (data?.success) {
        setResult(data);
        toast.success("Email generated successfully!");
      } else {
        throw new Error(data?.error || "Failed to generate");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const fullEmail = `Subject: ${result.subject}\n\n${result.greeting}\n\n${result.body}\n\n${result.callToAction}\n\n${result.closing}\n\n${result.signature}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AIToolStartGate
      headline="How would you like to write the email?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Draft from Context", Icon: Wand2, desc: "Give AI the recipient and goal — it drafts a natural, on-brand email in seconds.", bullets: ["One-click draft", "Tone-aware", "Ready to send"], cta: "Draft with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Write with Guided Fields", Icon: Sliders, desc: "Choose template, tone and CTA yourself for full control.", bullets: ["Pick template", "Custom tone", "Editable output"], cta: "Fill manually" },
      ]}
    >
    <AIToolPremiumLayout
      title="AI Email Generator"
      subtitle="Generate professional real estate emails instantly with AI"
      icon={<Mail className="w-8 h-8" />}
      accentColor="teal"
      gradientFrom=""
    >
      <AIToolGuide
        description="Create polished, professional emails for any real estate communication need."
        steps={[
          "Select the type of email you need",
          "Enter recipient name and context",
          "Add property details if relevant",
          "Choose your preferred tone",
          "Generate and customize your email"
        ]}
        benefits={[
          "Save time on email composition",
          "Maintain professional consistency",
          "Get multiple subject line options",
          "Receive personalization tips"
        ]}
        accentColor="teal"
      />

      <div className="space-y-8">
        {/* Input Form */}
        <Card className="bg-[#FDFBF7]/90 border-[color:var(--emerald-1)]/30/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-400" />
              Email Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/85">Email Type</Label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger className="bg-[#F7F2EA] border-[color:var(--emerald-1)]/30/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/85">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="bg-[#F7F2EA] border-[color:var(--emerald-1)]/30/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white/85">Recipient Name</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="John Smith"
                className="bg-[#F7F2EA] border-[color:var(--emerald-1)]/30/30 text-white"
              />
            </div>

            <div>
              <Label className="text-white/85">Property Details (if applicable)</Label>
              <Textarea
                value={propertyDetails}
                onChange={(e) => setPropertyDetails(e.target.value)}
                placeholder="2BR apartment in Dubai Marina, 1,200 sqft, sea view, AED 2.5M..."
                className="bg-[#F7F2EA] border-[color:var(--emerald-1)]/30/30 text-white"
              />
            </div>

            <div>
              <Label className="text-white/85">Purpose/Objective</Label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Schedule a viewing, follow up on inquiry..."
                className="bg-[#F7F2EA] border-[color:var(--emerald-1)]/30/30 text-white"
              />
            </div>

            <div>
              <Label className="text-white/85">Additional Context</Label>
              <Textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Any specific details or requirements..."
                className="bg-[#F7F2EA] border-[color:var(--emerald-1)]/30/30 text-white"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full jj-surface-emerald font-semibold"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Email...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="bg-[#FDFBF7]/90 border-[color:var(--emerald-1)]/30/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-400" />
                Generated Email
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="border-[color:var(--emerald-1)]/30/30 text-teal-400 jj-surface-emerald-soft"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.subject && (
                <div className="bg-[#F7F2EA]/50 rounded-lg p-4 border border-[color:var(--emerald-1)]/30/20">
                  <Label className="text-teal-400 text-xs uppercase">Subject</Label>
                  <p className="text-white font-medium">{result.subject}</p>
                </div>
              )}

              <div className="bg-[#F7F2EA]/50 rounded-lg p-4 border border-[color:var(--emerald-1)]/30/20 space-y-3">
                {result.greeting && <p className="text-white/85">{result.greeting}</p>}
                {result.body && <p className="text-white/85 whitespace-pre-wrap">{result.body}</p>}
                {result.callToAction && <p className="text-[color:var(--emerald-on)] font-medium">{result.callToAction}</p>}
                {result.closing && <p className="text-white/85">{result.closing}</p>}
                {result.signature && <p className="text-white/70 text-sm whitespace-pre-line">{result.signature}</p>}
              </div>

              {result.alternativeSubjects && result.alternativeSubjects.length > 0 && (
                <div>
                  <Label className="text-white/70 text-sm">Alternative Subject Lines</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.alternativeSubjects.map((subj, i) => (
                      <span key={i} className="text-xs px-3 py-1 bg-[#F7F2EA] rounded-full text-white/85 border border-[color:var(--emerald-1)]/30/20">
                        {subj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.tips && result.tips.length > 0 && (
                <div className="jj-surface-emerald-soft rounded-lg p-4 border border-[color:var(--emerald-1)]/30/20">
                  <Label className="text-teal-400 text-sm">Personalization Tips</Label>
                  <ul className="mt-2 space-y-1">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="text-white/85 text-sm flex items-start gap-2">
                        <span className="text-teal-400">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Placeholder */}
        {!result && !loading && (
          <div className="bg-[#FDFBF7]/50 border border-[color:var(--emerald-1)]/30/20 rounded-xl py-12 text-center">
            <Mail className="w-12 h-12 text-teal-400/50 mx-auto mb-4" />
            <p className="text-white/70">Configure your email above to generate professional content</p>
          </div>
        )}
      </div>
    </AIToolPremiumLayout>
  );
}
