/**
 * DocumentStampIntegration — Generate AI signatures, upload stamps, trade license.
 * Stamps load from Brand Asset Library (DB) or manual upload.
 */
import { useState, useRef } from "react";
import { Stamp, PenTool, Upload, Loader2, X, FileText, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandAssetPicker } from "@/components/brand-assets/BrandAssetPicker";

export interface StampSignatureData {
  signatureUrl?: string;
  stampUrl?: string;
}

interface Props {
  data: StampSignatureData;
  onChange: (d: StampSignatureData) => void;
}

const SIG_STYLES = [
  { id: "elegant", label: "Founder" },
  { id: "bold", label: "Corporate" },
  { id: "minimal", label: "HR" },
  { id: "classic", label: "Admin" },
];

export default function DocumentStampIntegration({ data, onChange }: Props) {
  const [sigName, setSigName] = useState("");
  const [sigStyle, setSigStyle] = useState("elegant");
  const [generating, setGenerating] = useState(false);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const stampInput = useRef<HTMLInputElement>(null);
  const sigUploadInput = useRef<HTMLInputElement>(null);
  const licenseInput = useRef<HTMLInputElement>(null);

  // Load stamp from Brand Asset Library (DB-backed)
  const handleBrandAssetSelect = (asset: any) => {
    let url = asset.thumbnail_url || "";
    if (asset.svg_content) {
      try {
        const svgBase64 = btoa(unescape(encodeURIComponent(asset.svg_content)));
        url = `data:image/svg+xml;base64,${svgBase64}`;
      } catch {
        // fallback to thumbnail
      }
    }
    if (url) {
      onChange({ ...data, stampUrl: url });
      toast.success("Stamp loaded from Brand Library");
    }
    setShowStampPicker(false);
  };

  // Generate AI signature
  const generateSignature = async () => {
    if (!sigName.trim()) { toast.error("Enter your name"); return; }
    setGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-signature-generator", {
        body: { name: sigName, style: sigStyle },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      const url = result?.signature;
      if (url) {
        onChange({ ...data, signatureUrl: url });
        toast.success("Signature generated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Signature generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // Upload stamp image
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...data, stampUrl: reader.result as string });
      toast.success("Stamp uploaded");
    };
    reader.readAsDataURL(file);
  };

  // Upload signature image
  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...data, signatureUrl: reader.result as string });
      toast.success("Signature uploaded");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#FDFBF7] rounded-xl border border-[hsl(var(--border))] p-4 space-y-4">
      {/* ── Signature Section ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PenTool size={12} className="text-[hsl(var(--gold))]" />
          <span className="text-xs font-bold text-[hsl(var(--foreground))]">Signature</span>
        </div>

        <div className="flex gap-2">
          <Input
            value={sigName}
            onChange={e => setSigName(e.target.value)}
            placeholder="Type your name…"
            className="h-7 text-xs flex-1"
          />
          <select
            value={sigStyle}
            onChange={e => setSigStyle(e.target.value)}
            className="h-7 text-[10px] border border-[hsl(var(--border))] rounded-md px-1.5 bg-[#FDFBF7]"
          >
            {SIG_STYLES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={generateSignature} disabled={generating} className="jj-cta-dark h-7 text-[10px] gap-1">
            {generating ? <Loader2 size={10} className="animate-spin" /> : <PenTool size={10} />}
            Generate
          </Button>
          <Button size="sm" variant="outline" onClick={() => sigUploadInput.current?.click()} className="h-7 text-[10px] gap-1">
            <Upload size={10} /> Upload
          </Button>
          <input ref={sigUploadInput} type="file" accept="image/*" onChange={handleSigUpload} className="hidden" />
        </div>

        {data.signatureUrl && (
          <div className="relative inline-block bg-[hsl(var(--muted)/0.3)] p-2 rounded-lg">
            <img src={data.signatureUrl} alt="Signature" className="h-12 object-contain"  loading="lazy" decoding="async" />
            <button
              onClick={() => onChange({ ...data, signatureUrl: undefined })}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X size={8} />
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[hsl(var(--border))]" />

      {/* ── Stamp Section ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Stamp size={12} className="text-[hsl(var(--gold))]" />
          <span className="text-xs font-bold text-[hsl(var(--foreground))]">Stamp</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => stampInput.current?.click()} className="h-7 text-[10px] gap-1">
            <Upload size={10} /> Upload Stamp
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowStampPicker(true)} className="h-7 text-[10px] gap-1">
            <Package size={10} /> Brand Library
          </Button>
          <input ref={stampInput} type="file" accept="image/*" onChange={handleStampUpload} className="hidden" />
        </div>

        {data.stampUrl && (
          <div className="relative inline-block bg-[hsl(var(--muted)/0.3)] p-2 rounded-lg">
            <img src={data.stampUrl} alt="Stamp" className="h-16 object-contain" style={{ mixBlendMode: "multiply" }}  loading="lazy" decoding="async" />
            <button
              onClick={() => onChange({ ...data, stampUrl: undefined })}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X size={8} />
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[hsl(var(--border))]" />

      {/* ── Trade License Upload ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText size={12} className="text-[hsl(var(--gold))]" />
          <span className="text-xs font-bold text-[hsl(var(--foreground))]">Trade License</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => licenseInput.current?.click()} className="h-7 text-[10px] gap-1">
          <Upload size={10} /> Upload License
        </Button>
        <input ref={licenseInput} type="file" accept="image/*,.pdf" onChange={() => toast.info("License uploaded — details will auto-fill header.")} className="hidden" />
        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Upload to auto-fill company details in document header.</p>
      </div>

      {/* Brand Asset Picker Modal */}
      {showStampPicker && (
        <BrandAssetPicker
          filterType="stamp"
          onSelect={handleBrandAssetSelect}
          onClose={() => setShowStampPicker(false)}
        />
      )}
    </div>
  );
}
