import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Link as LinkIcon, Upload, PencilLine, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface ExtractedProject {
  projectName?: string | null;
  developer?: string | null;
  location?: string | null;
  priceFromAed?: number | null;
  priceToAed?: number | null;
  bedrooms?: string | null;
  sizeFromSqft?: number | null;
  sizeToSqft?: number | null;
  pricePerSqftAed?: number | null;
  handover?: string | null;
  paymentPlan?: string | null;
  serviceChargeAedPerSqft?: number | null;
  rentalYieldPct?: number | null;
  amenities?: string[];
  keyFeatures?: string[];
  sourceUrl?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (project: ExtractedProject) => void;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      // strip "data:...;base64,"
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function AddProjectDialog({ open, onOpenChange, onAdd }: Props) {
  const [tab, setTab] = useState<"link" | "file" | "manual">("link");
  const [busy, setBusy] = useState(false);

  // link
  const [url, setUrl] = useState("");
  // manual
  const [m, setM] = useState<ExtractedProject>({ amenities: [], keyFeatures: [] });

  const runExtract = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("compare-extract", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const extracted: ExtractedProject = data?.data || {};
      onAdd(extracted);
      toast.success(`Added ${extracted.projectName || "project"} to comparison`);
      onOpenChange(false);
      setUrl("");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to extract — try a different source");
    } finally {
      setBusy(false);
    }
  };

  const submitLink = () => {
    if (!url.trim()) {
      toast.error("Paste a brochure / project page URL");
      return;
    }
    runExtract({ url: url.trim() });
  };

  const submitFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large (max 8MB)");
      return;
    }
    const b64 = await fileToBase64(file);
    runExtract({ fileBase64: b64, mimeType: file.type });
  };

  const submitManual = () => {
    if (!m.projectName) {
      toast.error("Project name is required");
      return;
    }
    onAdd({ ...m, amenities: m.amenities || [], keyFeatures: m.keyFeatures || [] });
    toast.success(`Added ${m.projectName} to comparison`);
    setM({ amenities: [], keyFeatures: [] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#B89555]" />
            Add a project to compare
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-3 bg-[#F7F2EA] border border-[#B89555]/30">
            <TabsTrigger value="link" data-cta="champagne"><LinkIcon className="w-4 h-4 mr-1.5" />Paste link</TabsTrigger>
            <TabsTrigger value="file" data-cta="champagne"><Upload className="w-4 h-4 mr-1.5" />Upload brochure</TabsTrigger>
            <TabsTrigger value="manual" data-cta="champagne"><PencilLine className="w-4 h-4 mr-1.5" />Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-3 pt-4">
            <Label className="text-[#1A1A1A]">Brochure or project page URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://developer.ae/brochures/atlantis-residences.pdf"
              className="bg-white text-[#1A1A1A]"
            />
            <p className="text-xs text-[#1A1A1A]/65">AI will read the source and pre-fill price, sqft, handover, amenities, and yield.</p>
            <Button aria-label="AI assist" onClick={submitLink} disabled={busy} className="w-full" data-cta="dark">
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extracting…</> : <><Sparkles className="w-4 h-4 mr-2" />Extract & Add</>}
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-3 pt-4">
            <Label className="text-[#1A1A1A]">Upload a PDF brochure or floor-plan image</Label>
            <Input
              type="file"
              accept="application/pdf,image/*"
              disabled={busy}
              onChange={(e) => submitFile(e.target.files?.[0] || null)}
              className="bg-white text-[#1A1A1A]"
            />
            <p className="text-xs text-[#1A1A1A]/65">PDFs and PNG/JPG up to 8MB. Vision AI extracts the canonical fields.</p>
            {busy && <div className="flex items-center text-sm text-[#1A1A1A]/70"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extracting from file…</div>}
          </TabsContent>

          <TabsContent value="manual" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-[#1A1A1A]">Project name *</Label>
                <Input value={m.projectName || ""} onChange={(e) => setM({ ...m, projectName: e.target.value })} className="bg-white text-[#1A1A1A]" />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Developer</Label>
                <Input value={m.developer || ""} onChange={(e) => setM({ ...m, developer: e.target.value })} className="bg-white text-[#1A1A1A]" />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Location</Label>
                <Input value={m.location || ""} onChange={(e) => setM({ ...m, location: e.target.value })} className="bg-white text-[#1A1A1A]" />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Price from (AED)</Label>
                <Input type="number" value={m.priceFromAed ?? ""} onChange={(e) => setM({ ...m, priceFromAed: e.target.value ? Number(e.target.value) : null })} className="bg-white text-[#1A1A1A]" />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Bedrooms</Label>
                <Input value={m.bedrooms || ""} onChange={(e) => setM({ ...m, bedrooms: e.target.value })} placeholder="1-3" className="bg-white text-[#1A1A1A]" />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Handover</Label>
                <Input value={m.handover || ""} onChange={(e) => setM({ ...m, handover: e.target.value })} placeholder="Q4 2026" className="bg-white text-[#1A1A1A]" />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Payment plan</Label>
                <Input value={m.paymentPlan || ""} onChange={(e) => setM({ ...m, paymentPlan: e.target.value })} placeholder="60/40" className="bg-white text-[#1A1A1A]" />
              </div>
              <div className="col-span-2">
                <Label className="text-[#1A1A1A]">Key amenities (comma-separated)</Label>
                <Textarea
                  value={(m.amenities || []).join(", ")}
                  onChange={(e) => setM({ ...m, amenities: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="bg-white text-[#1A1A1A]"
                  rows={2}
                />
              </div>
            </div>
            <Button onClick={submitManual} className="w-full" data-cta="dark">Add to comparison</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
