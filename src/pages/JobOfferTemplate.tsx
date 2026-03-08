import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { FileSpreadsheet, Loader2, Download, Wand2, Stamp, PenTool, Calendar } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

const TONES = ["professional", "formal", "friendly", "executive"];

const JobOfferTemplate = () => {
  const [companyName, setCompanyName] = useState("JBJ Global Real Estate");
  const [applicantName, setApplicantName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [salary, setSalary] = useState("");
  const [useCurrentDate, setUseCurrentDate] = useState(true);
  const [idNumber, setIdNumber] = useState("");
  const [tone, setTone] = useState("professional");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [headerColor1, setHeaderColor1] = useState("#C8A766");
  const [headerColor2, setHeaderColor2] = useState("#8B7355");
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const letterDate = useCurrentDate ? currentDate : (startDate || currentDate);

  const stampSvg = sessionStorage.getItem('esignature_stamp_svg');

  const generateOffer = async () => {
    if (!applicantName || !jobTitle) {
      toast.error("Please fill in applicant name and job title");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: {
          messages: [
            { role: "system", content: `You are a professional HR document writer. Generate a ${tone} job offer letter in HTML format. Use clean, semantic HTML with inline styles. Include the company letterhead placeholder, date, addressee, body, terms, and signature block. Do not include <html>, <head>, or <body> tags — just the letter content HTML.` },
            { role: "user", content: `Generate a job offer letter with these details:
- Company: ${companyName}
- Date: ${letterDate}
- Applicant: ${applicantName}
- Position: ${jobTitle}
- Start Date: ${startDate || 'To be discussed'}
- Salary: ${salary || 'As per company policy'}
- ID/Passport: ${idNumber || 'N/A'}
${additionalPrompt ? `- Additional instructions: ${additionalPrompt}` : ''}

Make it professional and ready to print. Include placeholders for [SIGNATURE] and [STAMP] at the bottom.` },
          ],
        },
      });
      if (error) throw error;
      const result = data?.choices?.[0]?.message?.content?.trim() || "";
      // Strip markdown code blocks
      const cleaned = result.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim();
      setGeneratedHtml(cleaned);
      toast.success("Job offer generated!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && generatedHtml) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Job Offer - ${applicantName}</title><style>body{font-family:Georgia,serif;padding:40px;max-width:700px;margin:0 auto;color:#1a1a1a;}@media print{body{padding:20px;}}</style></head><body>
        <div style="height:6px;background:linear-gradient(90deg,${headerColor1},${headerColor2});border-radius:3px;margin-bottom:30px;"></div>
        ${generatedHtml}
        <div style="height:6px;background:linear-gradient(90deg,${headerColor1},${headerColor2});border-radius:3px;margin-top:30px;"></div>
      </body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="border-b-2 border-gold/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-full px-4 py-1 mb-4">
              <FileSpreadsheet className="w-4 h-4 text-[#8B7355]" />
              <span className="text-black text-sm font-medium">Job Offer Template</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">Job Offer Generator</h1>
            <p className="text-zinc-600">Generate professional job offers with auto-filled company info, stamps, and signatures</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white/80 border border-gold/20 rounded-xl p-6 space-y-4">
              <div><Label className="font-semibold text-black">Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
              <div><Label className="font-semibold text-black">Applicant Full Name *</Label><Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="John Doe" /></div>
              <div><Label className="font-semibold text-black">Job Title *</Label><Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Senior Sales Manager" /></div>
              <div><Label className="font-semibold text-black">Start Date</Label>
                <div className="flex gap-2 items-center">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={useCurrentDate} className="flex-1" />
                  <label className="flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={useCurrentDate} onChange={(e) => setUseCurrentDate(e.target.checked)} className="rounded" />
                    <Calendar className="h-3 w-3" /> Current
                  </label>
                </div>
              </div>
              <div><Label className="font-semibold text-black">Salary / Package</Label><Input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="AED 25,000 per month" /></div>
              <div><Label className="font-semibold text-black">ID / Passport Number</Label><Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Optional" /></div>
              <div><Label className="font-semibold text-black">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TONES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <div><Label className="text-xs">Color 1</Label><input type="color" value={headerColor1} onChange={(e) => setHeaderColor1(e.target.value)} className="w-8 h-8 rounded cursor-pointer border" /></div>
                <div><Label className="text-xs">Color 2</Label><input type="color" value={headerColor2} onChange={(e) => setHeaderColor2(e.target.value)} className="w-8 h-8 rounded cursor-pointer border" /></div>
                <div className="flex-1 flex items-end"><div className="w-full h-3 rounded" style={{ background: `linear-gradient(90deg,${headerColor1},${headerColor2})` }} /></div>
              </div>
              <div><Label className="font-semibold text-black">Additional Prompt</Label><Textarea value={additionalPrompt} onChange={(e) => setAdditionalPrompt(e.target.value)} placeholder="e.g. Include relocation package, mention 30-day probation..." rows={3} /></div>
              <Button onClick={generateOffer} disabled={generating} className="w-full bg-black text-white hover:bg-zinc-800">
                {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Wand2 className="h-4 w-4 mr-2" /> Generate Job Offer</>}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gold/20 rounded-xl shadow-lg overflow-hidden">
              <div className="h-3" style={{ background: `linear-gradient(90deg,${headerColor1},${headerColor2})` }} />
              <div ref={previewRef} className="p-10 min-h-[700px]" style={{ fontFamily: 'Georgia, serif' }}>
                {generatedHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatedHtml) }} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                    <FileSpreadsheet className="h-16 w-16 mb-4 opacity-20" />
                    <p className="font-medium">Fill in the details and click Generate</p>
                    <p className="text-sm mt-1">Your job offer will appear here</p>
                  </div>
                )}
              </div>
              <div className="h-3" style={{ background: `linear-gradient(90deg,${headerColor1},${headerColor2})` }} />
            </div>
            {generatedHtml && (
              <div className="flex gap-3 mt-4">
                <Button onClick={handlePrint} className="flex-1 bg-black text-white hover:bg-zinc-800"><Download className="h-4 w-4 mr-2" /> Print / Save PDF</Button>
                <Button variant="outline" className="border-gold/30" onClick={() => {
                  const content = previewRef.current?.innerText || "";
                  navigator.clipboard.writeText(content);
                  toast.success("Copied to clipboard");
                }}>Copy Text</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobOfferTemplate;
