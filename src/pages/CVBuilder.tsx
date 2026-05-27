/**
 * Standalone CV Builder — completely separate from Document Studio.
 *
 * Rules (do NOT change without owner approval):
 *  - NO JBJ letterhead, NO JBJ footer, NO signatures, NO stamps.
 *  - NO contract send/sign flow.
 *  - Left rail: fillable CV sections with add/delete/edit per item.
 *  - Center: live A4 preview that adds a NEW page only when content overflows.
 *  - Right: simple AI helper notes (optional).
 *  - Export: clean, unbranded PDF in true A4.
 *
 * Visibility on the public frontend is controlled via the AI Tools
 * Control Panel under tool id `cv-resume`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Download, FileText, ArrowLeft, Save, Loader2,
  Mail, Phone, MapPin, Globe, Linkedin, Briefcase, GraduationCap,
  Wrench, Languages as LangIcon, Award, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

/* ────────────── Types ────────────── */

interface Experience { id: string; role: string; company: string; location: string; start: string; end: string; bullets: string }
interface Education  { id: string; degree: string; school: string; location: string; start: string; end: string; notes: string }
interface Skill      { id: string; name: string; level?: string }
interface Language   { id: string; name: string; level?: string }
interface Cert       { id: string; name: string; issuer: string; date: string }

interface CVData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  certifications: Cert[];
  accent: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_DATA: CVData = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  summary: "",
  experience: [{ id: uid(), role: "", company: "", location: "", start: "", end: "", bullets: "" }],
  education: [{ id: uid(), degree: "", school: "", location: "", start: "", end: "", notes: "" }],
  skills: [],
  languages: [],
  certifications: [],
  accent: "#1A1A1A",
};

const STORAGE_KEY = "jbj:cv-builder:draft:v1";

/* ────────────── Page ────────────── */

export default function CVBuilder() {
  const navigate = useNavigate();
  const [data, setData] = useState<CVData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_DATA, ...JSON.parse(raw) } : DEFAULT_DATA;
    } catch { return DEFAULT_DATA; }
  });
  const [exporting, setExporting] = useState(false);
  const pagesHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("jbj:cv-builder:prefill");
      if (!raw) return;
      const prefill = JSON.parse(raw);
      sessionStorage.removeItem("jbj:cv-builder:prefill");
      setData((current) => ({
        ...current,
        fullName: prefill.fullName || current.fullName,
        headline: prefill.targetRole || current.headline,
        email: prefill.email || current.email,
        phone: prefill.phone || current.phone,
        location: prefill.location || current.location,
        linkedin: prefill.linkedin || current.linkedin,
        website: prefill.sourceCvUrl || current.website,
        summary: prefill.summary || current.summary,
        skills: typeof prefill.skills === "string" && prefill.skills.trim()
          ? prefill.skills.split(",").map((name: string) => ({ id: uid(), name: name.trim() })).filter((s: Skill) => s.name)
          : current.skills,
        languages: typeof prefill.languages === "string" && prefill.languages.trim()
          ? prefill.languages.split(",").map((name: string) => ({ id: uid(), name: name.trim() })).filter((l: Language) => l.name)
          : current.languages,
      }));
      toast.success("Applicant details loaded into CV Builder");
    } catch {}
  }, []);

  // Auto-save draft
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [data]);

  const patch = useCallback(<K extends keyof CVData>(k: K, v: CVData[K]) => setData((d) => ({ ...d, [k]: v })), []);

  /* ────────────── PDF export — section-aware A4 pagination ────────────── */
  const handleExportPDF = async () => {
    const host = pagesHostRef.current;
    if (!host) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 12;
      const CONTENT_W = A4_W - MARGIN * 2;

      const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
      const sections = Array.from(host.querySelectorAll<HTMLElement>("[data-cv-section]"));
      if (sections.length === 0) {
        toast.error("Nothing to export yet");
        return;
      }

      let y = MARGIN;
      let first = true;

      for (const sec of sections) {
        const canvas = await html2canvas(sec, { backgroundColor: "#ffffff", scale: 2, useCORS: true, logging: false });
        const widthPx = canvas.width;
        const heightPx = canvas.height;
        const scale = CONTENT_W / (widthPx / 2);
        const renderH = (heightPx / 2) * scale;
        const remaining = A4_H - MARGIN - y;

        if (renderH > remaining && y > MARGIN) {
          pdf.addPage();
          y = MARGIN;
        }
        if (!first && y === MARGIN) {
          // already on a fresh page
        }
        const img = canvas.toDataURL("image/jpeg", 0.95);

        // If a single section is taller than a full A4 content area,
        // slice it across multiple pages without cropping.
        const PAGE_CONTENT_H = A4_H - MARGIN * 2;
        if (renderH <= PAGE_CONTENT_H) {
          pdf.addImage(img, "JPEG", MARGIN, y, CONTENT_W, renderH);
          y += renderH + 4;
        } else {
          // Slice this oversized section
          let consumed = 0;
          while (consumed < renderH) {
            if (!first) pdf.addPage();
            const sliceMm = Math.min(PAGE_CONTENT_H, renderH - consumed);
            const sourceY = (consumed / renderH) * heightPx;
            const sourceH = (sliceMm / renderH) * heightPx;
            const slice = document.createElement("canvas");
            slice.width = widthPx;
            slice.height = sourceH;
            const ctx = slice.getContext("2d")!;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, slice.width, slice.height);
            ctx.drawImage(canvas, 0, sourceY, widthPx, sourceH, 0, 0, widthPx, sourceH);
            pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", MARGIN, MARGIN, CONTENT_W, sliceMm);
            consumed += sliceMm;
            first = false;
            y = MARGIN + sliceMm + 4;
          }
          continue;
        }
        first = false;
      }

      const name = (data.fullName || "My-CV").replace(/[^\w\-]+/g, "_");
      pdf.save(`${name}.pdf`);
      toast.success("CV downloaded");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  /* ────────────── Render ────────────── */

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px]">
      <SEOHead
        title="My CV Builder — JBJ Global Real Estate"
        description="Build a professional CV. Add your experience, education, skills and download a clean A4 PDF."
        canonicalPath="/cv-builder"
      />

      {/* Sub-header */}
      <div
        className="sticky top-[88px] z-30 bg-[#F7F2EA]/95 backdrop-blur"
        style={{ borderBottom: "1px solid rgba(184,149,85,0.35)" }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="h-8 w-8 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] hover:bg-[#EFE6D6] flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-[#1A1A1A]" />
            </button>
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#1A1A1A]/60">My CV Builder</p>
              <h1 className="text-xl md:text-2xl font-semibold text-[#1A1A1A]">Build your professional CV</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); toast.success("Draft saved"); }}>
              <Save className="w-4 h-4 mr-1.5" /> Save Draft
            </Button>
            <Button size="sm" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* ────────── LEFT — Editor ────────── */}
        <aside className="space-y-4">
          <SectionCard title="Personal details" icon={FileText}>
            <Field label="Full name"><Input value={data.fullName} onChange={(e) => patch("fullName", e.target.value)} placeholder="e.g., Jane Bou Jaoude" className="bg-white" /></Field>
            <Field label="Headline / Job title"><Input value={data.headline} onChange={(e) => patch("headline", e.target.value)} placeholder="e.g., Senior Real Estate Consultant" className="bg-white" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Email"><Input value={data.email} onChange={(e) => patch("email", e.target.value)} placeholder="you@email.com" className="bg-white" /></Field>
              <Field label="Phone"><Input value={data.phone} onChange={(e) => patch("phone", e.target.value)} placeholder="+971…" className="bg-white" /></Field>
            </div>
            <Field label="Location"><Input value={data.location} onChange={(e) => patch("location", e.target.value)} placeholder="Dubai, UAE" className="bg-white" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Website"><Input value={data.website} onChange={(e) => patch("website", e.target.value)} placeholder="https://…" className="bg-white" /></Field>
              <Field label="LinkedIn"><Input value={data.linkedin} onChange={(e) => patch("linkedin", e.target.value)} placeholder="linkedin.com/in/…" className="bg-white" /></Field>
            </div>
            <Field label="Accent colour">
              <div className="flex items-center gap-2">
                {["#1A1A1A", "#102540", "#1f6f5c", "#7c2d12", "#5b21b6", "#B89555"].map((c) => (
                  <button
                    key={c}
                    onClick={() => patch("accent", c)}
                    className="w-7 h-7 rounded-full border-2"
                    style={{ background: c, borderColor: data.accent === c ? "#1A1A1A" : "rgba(0,0,0,0.15)" }}
                    aria-label={`Accent ${c}`}
                  />
                ))}
              </div>
            </Field>
          </SectionCard>

          <SectionCard title="Professional summary" icon={Sparkles}>
            <Textarea
              rows={5}
              value={data.summary}
              onChange={(e) => patch("summary", e.target.value)}
              placeholder="3–5 sentences. What you do, your strongest skills, what you’re looking for."
              className="bg-white resize-none"
            />
          </SectionCard>

          <SectionCard
            title="Experience"
            icon={Briefcase}
            onAdd={() => patch("experience", [...data.experience, { id: uid(), role: "", company: "", location: "", start: "", end: "", bullets: "" }])}
          >
            {data.experience.map((x, i) => (
              <RepeaterCard key={x.id} onDelete={() => patch("experience", data.experience.filter((_, j) => j !== i))}>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Role"><Input value={x.role} onChange={(e) => updateAt(data.experience, i, { role: e.target.value }, (n) => patch("experience", n))} className="bg-white" /></Field>
                  <Field label="Company"><Input value={x.company} onChange={(e) => updateAt(data.experience, i, { company: e.target.value }, (n) => patch("experience", n))} className="bg-white" /></Field>
                </div>
                <Field label="Location"><Input value={x.location} onChange={(e) => updateAt(data.experience, i, { location: e.target.value }, (n) => patch("experience", n))} className="bg-white" /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="From"><Input value={x.start} placeholder="Jan 2022" onChange={(e) => updateAt(data.experience, i, { start: e.target.value }, (n) => patch("experience", n))} className="bg-white" /></Field>
                  <Field label="To"><Input value={x.end} placeholder="Present" onChange={(e) => updateAt(data.experience, i, { end: e.target.value }, (n) => patch("experience", n))} className="bg-white" /></Field>
                </div>
                <Field label="Highlights (one per line)">
                  <Textarea rows={3} value={x.bullets} onChange={(e) => updateAt(data.experience, i, { bullets: e.target.value }, (n) => patch("experience", n))} className="bg-white resize-none" />
                </Field>
              </RepeaterCard>
            ))}
          </SectionCard>

          <SectionCard
            title="Education"
            icon={GraduationCap}
            onAdd={() => patch("education", [...data.education, { id: uid(), degree: "", school: "", location: "", start: "", end: "", notes: "" }])}
          >
            {data.education.map((x, i) => (
              <RepeaterCard key={x.id} onDelete={() => patch("education", data.education.filter((_, j) => j !== i))}>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Degree"><Input value={x.degree} onChange={(e) => updateAt(data.education, i, { degree: e.target.value }, (n) => patch("education", n))} className="bg-white" /></Field>
                  <Field label="School"><Input value={x.school} onChange={(e) => updateAt(data.education, i, { school: e.target.value }, (n) => patch("education", n))} className="bg-white" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="From"><Input value={x.start} onChange={(e) => updateAt(data.education, i, { start: e.target.value }, (n) => patch("education", n))} className="bg-white" /></Field>
                  <Field label="To"><Input value={x.end} onChange={(e) => updateAt(data.education, i, { end: e.target.value }, (n) => patch("education", n))} className="bg-white" /></Field>
                </div>
                <Field label="Notes"><Input value={x.notes} onChange={(e) => updateAt(data.education, i, { notes: e.target.value }, (n) => patch("education", n))} className="bg-white" /></Field>
              </RepeaterCard>
            ))}
          </SectionCard>

          <SectionCard
            title="Skills"
            icon={Wrench}
            onAdd={() => patch("skills", [...data.skills, { id: uid(), name: "" }])}
          >
            {data.skills.length === 0 && <p className="text-[11px] text-[#1A1A1A]/55">Add the skills you want to highlight.</p>}
            <div className="space-y-1.5">
              {data.skills.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <Input value={s.name} placeholder="e.g., Negotiation" onChange={(e) => updateAt(data.skills, i, { name: e.target.value }, (n) => patch("skills", n))} className="bg-white" />
                  <button onClick={() => patch("skills", data.skills.filter((_, j) => j !== i))} className="text-[#1A1A1A]/50 hover:text-red-600 p-1" aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Languages"
            icon={LangIcon}
            onAdd={() => patch("languages", [...data.languages, { id: uid(), name: "", level: "" }])}
          >
            {data.languages.map((l, i) => (
              <div key={l.id} className="flex items-center gap-1.5 mb-1.5">
                <Input value={l.name} placeholder="Language" onChange={(e) => updateAt(data.languages, i, { name: e.target.value }, (n) => patch("languages", n))} className="bg-white" />
                <Input value={l.level || ""} placeholder="Level" onChange={(e) => updateAt(data.languages, i, { level: e.target.value }, (n) => patch("languages", n))} className="bg-white w-32" />
                <button onClick={() => patch("languages", data.languages.filter((_, j) => j !== i))} className="text-[#1A1A1A]/50 hover:text-red-600 p-1" aria-label="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="Certifications"
            icon={Award}
            onAdd={() => patch("certifications", [...data.certifications, { id: uid(), name: "", issuer: "", date: "" }])}
          >
            {data.certifications.map((c, i) => (
              <RepeaterCard key={c.id} onDelete={() => patch("certifications", data.certifications.filter((_, j) => j !== i))}>
                <Field label="Certification"><Input value={c.name} onChange={(e) => updateAt(data.certifications, i, { name: e.target.value }, (n) => patch("certifications", n))} className="bg-white" /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Issuer"><Input value={c.issuer} onChange={(e) => updateAt(data.certifications, i, { issuer: e.target.value }, (n) => patch("certifications", n))} className="bg-white" /></Field>
                  <Field label="Date"><Input value={c.date} onChange={(e) => updateAt(data.certifications, i, { date: e.target.value }, (n) => patch("certifications", n))} className="bg-white" /></Field>
                </div>
              </RepeaterCard>
            ))}
          </SectionCard>
        </aside>

        {/* ────────── RIGHT — A4 Preview ────────── */}
        <main className="min-w-0">
          <div className="bg-[#EFE6D6]/40 rounded-xl p-4 lg:p-6 border border-[#B89555]/20">
            <div
              ref={pagesHostRef}
              className="mx-auto bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)]"
              style={{
                width: "100%",
                maxWidth: 794, // ≈ A4 width @ 96dpi
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#1A1A1A",
                padding: 48,
              }}
            >
              {/* Header */}
              <div data-cv-section style={{ borderBottom: `2px solid ${data.accent}`, paddingBottom: 16, marginBottom: 18 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.01em", color: data.accent }}>
                  {data.fullName || "Your Name"}
                </h2>
                {data.headline && (
                  <p style={{ fontSize: 14, margin: "4px 0 0", color: "#1A1A1A", opacity: 0.85 }}>{data.headline}</p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10, fontSize: 11, color: "#1A1A1A", opacity: 0.8 }}>
                  {data.email && <InlineMeta icon={Mail} label={data.email} />}
                  {data.phone && <InlineMeta icon={Phone} label={data.phone} />}
                  {data.location && <InlineMeta icon={MapPin} label={data.location} />}
                  {data.website && <InlineMeta icon={Globe} label={data.website} />}
                  {data.linkedin && <InlineMeta icon={Linkedin} label={data.linkedin} />}
                </div>
              </div>

              {data.summary && (
                <PrintSection title="Profile" accent={data.accent}>
                  <p style={{ fontSize: 12, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{data.summary}</p>
                </PrintSection>
              )}

              {data.experience.some((x) => x.role || x.company) && (
                <PrintSection title="Experience" accent={data.accent}>
                  {data.experience.filter((x) => x.role || x.company).map((x) => (
                    <div key={x.id} style={{ marginBottom: 12 }} data-cv-section>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{x.role || "Role"} <span style={{ fontWeight: 400, opacity: 0.7 }}>{x.company && ` · ${x.company}`}</span></div>
                        <div style={{ fontSize: 11, opacity: 0.65, whiteSpace: "nowrap" }}>{[x.start, x.end].filter(Boolean).join(" – ")}</div>
                      </div>
                      {x.location && <div style={{ fontSize: 11, opacity: 0.6 }}>{x.location}</div>}
                      {x.bullets && (
                        <ul style={{ margin: "6px 0 0 18px", padding: 0, fontSize: 12, lineHeight: 1.55 }}>
                          {x.bullets.split("\n").map((b, k) => b.trim() && <li key={k}>{b.trim()}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </PrintSection>
              )}

              {data.education.some((x) => x.degree || x.school) && (
                <PrintSection title="Education" accent={data.accent}>
                  {data.education.filter((x) => x.degree || x.school).map((x) => (
                    <div key={x.id} style={{ marginBottom: 10 }} data-cv-section>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{x.degree || "Degree"} <span style={{ fontWeight: 400, opacity: 0.7 }}>{x.school && ` · ${x.school}`}</span></div>
                        <div style={{ fontSize: 11, opacity: 0.65 }}>{[x.start, x.end].filter(Boolean).join(" – ")}</div>
                      </div>
                      {x.notes && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{x.notes}</div>}
                    </div>
                  ))}
                </PrintSection>
              )}

              {data.skills.filter((s) => s.name).length > 0 && (
                <PrintSection title="Skills" accent={data.accent}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {data.skills.filter((s) => s.name).map((s) => (
                      <span key={s.id} style={{ fontSize: 11, padding: "3px 8px", border: `1px solid ${data.accent}66`, borderRadius: 999 }}>{s.name}</span>
                    ))}
                  </div>
                </PrintSection>
              )}

              {data.languages.filter((l) => l.name).length > 0 && (
                <PrintSection title="Languages" accent={data.accent}>
                  <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                    {data.languages.filter((l) => l.name).map((l) => (
                      <div key={l.id}><strong>{l.name}</strong>{l.level ? <span style={{ opacity: 0.7 }}>{" — "}{l.level}</span> : null}</div>
                    ))}
                  </div>
                </PrintSection>
              )}

              {data.certifications.filter((c) => c.name).length > 0 && (
                <PrintSection title="Certifications" accent={data.accent}>
                  {data.certifications.filter((c) => c.name).map((c) => (
                    <div key={c.id} style={{ fontSize: 12, marginBottom: 4 }} data-cv-section>
                      <strong>{c.name}</strong>{c.issuer && <span style={{ opacity: 0.75 }}> — {c.issuer}</span>}{c.date && <span style={{ opacity: 0.6 }}> · {c.date}</span>}
                    </div>
                  ))}
                </PrintSection>
              )}

              {!data.fullName && !data.summary && data.experience.every((x) => !x.role && !x.company) && (
                <p style={{ marginTop: 40, fontSize: 12, color: "#1A1A1A", opacity: 0.5, textAlign: "center", fontStyle: "italic" }}>
                  Start filling the form on the left — your CV preview will build itself here.
                </p>
              )}
            </div>

            <p className="text-[11px] text-[#1A1A1A]/55 text-center mt-3">
              A new page is added automatically when content overflows. The exported PDF has no company letterhead, footer, signature or stamp — it is a clean personal CV.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ────────────── helpers & sub-components ────────────── */

function updateAt<T>(arr: T[], i: number, patch: Partial<T>, set: (n: T[]) => void) {
  const next = arr.slice();
  next[i] = { ...next[i], ...patch };
  set(next);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <Label className="text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/60 mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function SectionCard({
  title, icon: Icon, children, onAdd,
}: { title: string; icon: typeof FileText; children: React.ReactNode; onAdd?: () => void }) {
  return (
    <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-[#1A1A1A]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#1A1A1A]">{title}</h3>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="text-[11px] text-[#1A1A1A] hover:text-[#B89555] inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function RepeaterCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="rounded-lg border border-[#B89555]/20 bg-[#FDFBF7] p-3 mb-2 relative">
      <button onClick={onDelete} className="absolute top-2 right-2 text-[#1A1A1A]/50 hover:text-red-600 p-0.5" aria-label="Remove">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      {children}
    </div>
  );
}

function InlineMeta({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Icon style={{ width: 11, height: 11 }} /> {label}
    </span>
  );
}

function PrintSection({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div data-cv-section style={{ marginBottom: 16, breakInside: "avoid" }}>
      <h3 style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
        color: accent, margin: "0 0 8px", borderBottom: `1px solid ${accent}33`, paddingBottom: 4,
      }}>{title}</h3>
      {children}
    </div>
  );
}
