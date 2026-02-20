import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Plus, Trash2, Sparkles, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Template = "executive" | "modern" | "classic" | "creative";

interface Experience { title: string; company: string; period: string; description: string; }
interface Education { degree: string; institution: string; year: string; }

interface CVData {
  name: string; title: string; email: string; phone: string; location: string; linkedin: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string;
  languages: string;
}

const TEMPLATES: { id: Template; label: string; color: string }[] = [
  { id: "executive", label: "Executive", color: "from-slate-700 to-slate-900" },
  { id: "modern", label: "Modern", color: "from-blue-600 to-indigo-700" },
  { id: "classic", label: "Classic", color: "from-gray-600 to-gray-800" },
  { id: "creative", label: "Creative", color: "from-purple-600 to-violet-700" },
];

function CVPreview({ data, template }: { data: CVData; template: Template }) {
  const accentColors: Record<Template, string> = {
    executive: "#334155",
    modern: "#1e40af",
    classic: "#374151",
    creative: "#7c3aed",
  };
  const accent = accentColors[template];

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden text-[11px] leading-snug" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ background: accent, color: "white" }}>
        <h1 className="text-lg font-bold">{data.name || "Your Name"}</h1>
        <p className="text-xs opacity-80 mt-0.5">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] opacity-70">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {data.summary && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Summary</h2>
            <p className="text-gray-600 text-[10px]">{data.summary}</p>
          </div>
        )}

        {data.experience.some(e => e.title) && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Experience</h2>
            <div className="space-y-2">
              {data.experience.filter(e => e.title).map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <p className="font-semibold text-gray-800">{exp.title}</p>
                    <p className="text-gray-400 text-[9px]">{exp.period}</p>
                  </div>
                  <p className="text-gray-500">{exp.company}</p>
                  {exp.description && <p className="text-gray-500 mt-0.5">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.education.some(e => e.degree) && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Education</h2>
            <div className="space-y-1.5">
              {data.education.filter(e => e.degree).map((edu, i) => (
                <div key={i} className="flex justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{edu.degree}</p>
                    <p className="text-gray-500">{edu.institution}</p>
                  </div>
                  <p className="text-gray-400 text-[9px]">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.skills && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Skills</h2>
            <div className="flex flex-wrap gap-1">
              {data.skills.split(",").map((s, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${accent}18`, color: accent }}>{s.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {data.languages && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Languages</h2>
            <p className="text-gray-600">{data.languages}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CVResumeBuilder() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template>("modern");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [data, setData] = useState<CVData>({
    name: "", title: "", email: "", phone: "", location: "", linkedin: "",
    summary: "",
    experience: [{ title: "", company: "", period: "", description: "" }],
    education: [{ degree: "", institution: "", year: "" }],
    skills: "",
    languages: "",
  });

  const set = (k: keyof CVData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData(prev => ({ ...prev, [k]: e.target.value }));

  const setExp = (i: number, k: keyof Experience, v: string) =>
    setData(prev => {
      const exp = [...prev.experience];
      exp[i] = { ...exp[i], [k]: v };
      return { ...prev, experience: exp };
    });

  const setEdu = (i: number, k: keyof Education, v: string) =>
    setData(prev => {
      const edu = [...prev.education];
      edu[i] = { ...edu[i], [k]: v };
      return { ...prev, education: edu };
    });

  const generateSummary = async () => {
    if (!data.name || !data.title) {
      toast.error("Please enter your name and title first.");
      return;
    }
    setGeneratingSummary(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Write a professional CV summary (3-4 sentences) for: Name: ${data.name}, Title: ${data.title}, Skills: ${data.skills || "real estate, sales"}, Experience: ${data.experience.map(e => e.title).filter(Boolean).join(", ") || "professional"}. Keep it concise and impactful.`
          }]
        }
      });
      if (error) throw error;
      const summary = fnData?.content || fnData?.message || "";
      if (summary) setData(prev => ({ ...prev, summary }));
      else toast.error("Could not generate summary. Please try again.");
    } catch {
      toast.error("AI summary generation failed. Please write manually.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const printCV = () => {
    toast.info("Use Ctrl+P → Save as PDF to export your CV.");
    window.print();
  };

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FileText size={15} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[hsl(var(--foreground))] text-sm">CV / Resume Builder</h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Professional · AI-Powered · Export Ready</p>
            </div>
          </div>
          <Button onClick={printCV} className="gap-2 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 h-8 text-xs">
            <Download size={13} /> Export PDF
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          {/* Template */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3 block">Template</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${
                    template === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.5)]"
                  }`}>
                  <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${t.color}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Personal Information</p>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs mb-1 block">Full Name</Label><Input value={data.name} onChange={set("name")} placeholder="Ahmed Al-Mansoori" className="h-8 text-xs" /></div>
              <div><Label className="text-xs mb-1 block">Title</Label><Input value={data.title} onChange={set("title")} placeholder="Real Estate Consultant" className="h-8 text-xs" /></div>
              <div><Label className="text-xs mb-1 block">Email</Label><Input value={data.email} onChange={set("email")} placeholder="ahmed@email.com" className="h-8 text-xs" /></div>
              <div><Label className="text-xs mb-1 block">Phone</Label><Input value={data.phone} onChange={set("phone")} placeholder="+971 50 000 0000" className="h-8 text-xs" /></div>
              <div><Label className="text-xs mb-1 block">Location</Label><Input value={data.location} onChange={set("location")} placeholder="Dubai, UAE" className="h-8 text-xs" /></div>
              <div><Label className="text-xs mb-1 block">LinkedIn</Label><Input value={data.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/ahmed" className="h-8 text-xs" /></div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Professional Summary</p>
              <Button size="sm" variant="outline" onClick={generateSummary} disabled={generatingSummary} className="h-7 text-xs gap-1.5">
                <Sparkles size={11} className={generatingSummary ? "animate-spin" : ""} />
                {generatingSummary ? "Generating…" : "AI Generate"}
              </Button>
            </div>
            <Textarea value={data.summary} onChange={set("summary")} placeholder="Write a compelling professional summary…" className="text-xs min-h-[80px]" />
          </div>

          {/* Experience */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Experience</p>
              <Button size="sm" variant="outline" onClick={() => setData(prev => ({ ...prev, experience: [...prev.experience, { title: "", company: "", period: "", description: "" }] }))} className="h-7 text-xs gap-1">
                <Plus size={11} /> Add
              </Button>
            </div>
            {data.experience.map((exp, i) => (
              <div key={i} className="space-y-2 pb-3 border-b border-[hsl(var(--border))] last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Position {i + 1}</p>
                  {i > 0 && <button onClick={() => setData(prev => ({ ...prev, experience: prev.experience.filter((_, j) => j !== i) }))} className="text-destructive hover:opacity-70"><Trash2 size={11} /></button>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={exp.title} onChange={e => setExp(i, "title", e.target.value)} placeholder="Job Title" className="h-7 text-xs" />
                  <Input value={exp.company} onChange={e => setExp(i, "company", e.target.value)} placeholder="Company" className="h-7 text-xs" />
                  <Input value={exp.period} onChange={e => setExp(i, "period", e.target.value)} placeholder="2020 – Present" className="h-7 text-xs col-span-2" />
                </div>
                <Textarea value={exp.description} onChange={e => setExp(i, "description", e.target.value)} placeholder="Key achievements and responsibilities…" className="text-xs min-h-[50px]" />
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Education</p>
              <Button size="sm" variant="outline" onClick={() => setData(prev => ({ ...prev, education: [...prev.education, { degree: "", institution: "", year: "" }] }))} className="h-7 text-xs gap-1">
                <Plus size={11} /> Add
              </Button>
            </div>
            {data.education.map((edu, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input value={edu.degree} onChange={e => setEdu(i, "degree", e.target.value)} placeholder="Degree / Field" className="h-7 text-xs col-span-2" />
                <Input value={edu.year} onChange={e => setEdu(i, "year", e.target.value)} placeholder="Year" className="h-7 text-xs" />
                <Input value={edu.institution} onChange={e => setEdu(i, "institution", e.target.value)} placeholder="University / Institution" className="h-7 text-xs col-span-3" />
              </div>
            ))}
          </div>

          {/* Skills & Languages */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Skills (comma-separated)</Label>
              <Input value={data.skills} onChange={set("skills")} placeholder="Sales, Negotiation, CRM, Market Analysis" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Languages</Label>
              <Input value={data.languages} onChange={set("languages")} placeholder="Arabic (Native), English (Fluent), French (Intermediate)" className="h-8 text-xs" />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block">Live Preview</Label>
          <motion.div key={template} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <CVPreview data={data} template={template} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
