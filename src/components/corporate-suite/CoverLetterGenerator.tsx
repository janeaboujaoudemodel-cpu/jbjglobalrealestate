import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileEdit, Sparkles, Download, RefreshCw, ImageIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandAssetLibrary, BrandAsset } from "@/components/corporate-suite/BrandAssetLibrary";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

type Tone = "professional" | "confident" | "casual";
type Template = "standard" | "modern" | "executive";

export default function CoverLetterGenerator() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState<Tone>("professional");
  const [template, setTemplate] = useState<Template>("standard");
  const [letter, setLetter] = useState("");
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(60);
  const [form, setForm] = useState({
    yourName: "", yourTitle: "", jobTitle: "", companyName: "", skills: "", experience: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const generate = async () => {
    if (!form.jobTitle || !form.companyName || !form.yourName) {
      toast.error("Please fill in your name, the job title, and company name.");
      return;
    }
    setGenerating(true);
    try {
      const toneDesc = { professional: "formal and professional", confident: "confident and assertive", casual: "warm and personable" }[tone];
      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Write a ${toneDesc} cover letter for:
- Applicant: ${form.yourName} (${form.yourTitle || "Professional"})
- Job: ${form.jobTitle} at ${form.companyName}
- Key skills: ${form.skills || "leadership, communication, problem-solving"}
- Experience: ${form.experience || "5+ years in the industry"}

Write 3-4 paragraphs: Opening (why this role), Middle (key qualifications), Middle (specific achievement), Closing (call to action). Do NOT include date or address headers — just the body paragraphs. Keep it under 350 words.`
          }]
        }
      });
      if (error) throw error;
      const content = data?.content || data?.message || "";
      if (content) setLetter(content);
      else toast.error("Failed to generate. Please try again.");
    } catch {
      toast.error("AI generation failed. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const templateStyles: Record<Template, { bg: string; accent: string }> = {
    standard: { bg: "bg-white", accent: "#374151" },
    modern: { bg: "bg-white", accent: "#1e40af" },
    executive: { bg: "bg-white", accent: "#334155" },
  };

  const style = templateStyles[template];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/toolkit/corporate-suite")} className="gap-1.5">
              <ArrowLeft size={15} /> Back
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))]" />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <FileEdit size={15} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[hsl(var(--foreground))] text-sm">Cover Letter Generator</h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">AI-Powered · Instant · Professional</p>
            </div>
          </div>
          <Button onClick={() => window.print()} className="gap-2 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 h-8 text-xs">
            <Download size={13} /> Export PDF
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-5">
          {/* Brand Assets */}
          <Collapsible open={brandAssetOpen} onOpenChange={setBrandAssetOpen}>
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={12} className="text-[hsl(var(--gold))]" />
                    <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Brand Assets</span>
                    {logoUrl && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                  </div>
                  <ChevronDown size={12} className={`text-[hsl(var(--muted-foreground))] transition-transform ${brandAssetOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 border-t border-[hsl(var(--border))]">
                  <BrandAssetLibrary
                    assetTypes={["monogram", "logo"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url)}
                    showSizeControl
                    sizeValue={logoSize}
                    onSizeChange={setLogoSize}
                    sizeLabel="Logo Size"
                    sizeMin={30}
                    sizeMax={100}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Template */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3 block">Style</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["standard", "modern", "executive"] as Template[]).map(t => (
                <button key={t} onClick={() => setTemplate(t)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                    template === t
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.5)]"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3 block">Tone</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["professional", "confident", "casual"] as Tone[]).map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                    tone === t
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.5)]"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Your Information</p>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs mb-1 block">Your Name *</Label><Input value={form.yourName} onChange={set("yourName")} placeholder="Ahmed Al-Mansoori" className="h-8 text-xs" /></div>
              <div><Label className="text-xs mb-1 block">Your Current Title</Label><Input value={form.yourTitle} onChange={set("yourTitle")} placeholder="Senior Consultant" className="h-8 text-xs" /></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Job Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs mb-1 block">Job Title *</Label><Input value={form.jobTitle} onChange={set("jobTitle")} placeholder="Head of Sales" className="h-8 text-xs" /></div>
              <div><Label className="text-xs mb-1 block">Company *</Label><Input value={form.companyName} onChange={set("companyName")} placeholder="JBJ Global" className="h-8 text-xs" /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Key Skills</Label><Input value={form.skills} onChange={set("skills")} placeholder="Negotiation, CRM, Market Analysis, Leadership" className="h-8 text-xs" /></div>
            <div><Label className="text-xs mb-1 block">Experience Highlight</Label><Input value={form.experience} onChange={set("experience")} placeholder="8 years in real estate, closed 200M AED in deals" className="h-8 text-xs" /></div>
          </div>

          <Button onClick={generate} disabled={generating} className="w-full gap-2 bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:opacity-90">
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? "Generating Cover Letter…" : "Generate with AI"}
          </Button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block">Letter Preview</Label>
          <motion.div
            key={template}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${style.bg} rounded-xl shadow-xl p-8 min-h-[500px]`}
          >
            {/* Letter Header */}
            <div className="mb-6 pb-4 border-b-2" style={{ borderColor: style.accent }}>
              <h2 className="text-lg font-bold" style={{ color: style.accent }}>{form.yourName || "Your Name"}</h2>
              <p className="text-sm text-gray-500">{form.yourTitle || "Professional Title"}</p>
            </div>

            {/* Salutation */}
            <div className="mb-4">
              <p className="text-sm text-gray-700">Dear Hiring Manager,</p>
              {form.jobTitle && form.companyName && (
                <p className="text-xs text-gray-500 mt-1">Re: Application for {form.jobTitle} — {form.companyName}</p>
              )}
            </div>

            {/* Body */}
            {letter ? (
              <div className="space-y-3">
                {letter.split("\n\n").filter(Boolean).map((para, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">{para.trim()}</p>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Sparkles size={32} className="text-purple-300 mb-3" />
                <p className="text-sm text-gray-400">Fill in the form and click Generate to create your cover letter</p>
              </div>
            )}

            {letter && (
              <div className="mt-6">
                <p className="text-sm text-gray-700">Sincerely,</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">{form.yourName || "Your Name"}</p>
              </div>
            )}
          </motion.div>

          {letter && (
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4">
              <Label className="text-xs font-semibold text-[hsl(var(--foreground))] mb-2 block">Edit Letter</Label>
              <Textarea
                value={letter}
                onChange={e => setLetter(e.target.value)}
                className="text-xs min-h-[120px]"
                placeholder="Edit your generated letter here…"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
