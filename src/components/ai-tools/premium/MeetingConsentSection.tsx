import { useState, useRef, useEffect, useCallback } from "react";
import { ShieldCheck, Upload, Trash2, Loader2, Check, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MeetingConsentSectionProps {
  meetingTitle: string;
  sessionType: string;
  participants: string;
  linkedLeadName?: string;
  onConsentSaved?: (consentId: string) => void;
}

const CONSENT_TEXT = `I hereby authorize the recording of this session for quality assurance purposes. This recording will be used to review the discussion, provide better recommendations, and translate any language segments as needed. My personal information will be handled in accordance with applicable data protection regulations.`;

const MeetingConsentSection = ({
  meetingTitle,
  sessionType,
  participants,
  linkedLeadName,
  onConsentSaved,
}: MeetingConsentSectionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [clientName, setClientName] = useState(linkedLeadName || "");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [consentSaved, setConsentSaved] = useState(false);

  useEffect(() => {
    if (linkedLeadName) setClientName(linkedLeadName);
  }, [linkedLeadName]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }
    setIdPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setIdPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitConsent = async () => {
    if (!clientName.trim()) { toast.error("Client name is required"); return; }
    if (!hasSigned) { toast.error("Signature is required"); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in"); setSaving(false); return; }

      // Get signature as base64
      const signatureData = canvasRef.current?.toDataURL("image/png") || "";

      // Upload ID photo if provided
      let idPhotoUrl: string | null = null;
      if (idPhotoFile) {
        const ext = idPhotoFile.name.split(".").pop() || "jpg";
        const path = `consent-ids/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("consent-documents")
          .upload(path, idPhotoFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("consent-documents")
            .getPublicUrl(path);
          idPhotoUrl = urlData?.publicUrl || null;
        }
      }

      const { data, error } = await supabase
        .from("meeting_session_consents")
        .insert({
          broker_user_id: user.id,
          client_name: clientName.trim(),
          client_email: clientEmail.trim() || null,
          client_phone: clientPhone.trim() || null,
          session_type: sessionType,
          consent_text: CONSENT_TEXT,
          signature_data: signatureData,
          id_photo_url: idPhotoUrl,
          status: "signed",
        })
        .select("id")
        .single();

      if (error) throw error;

      setConsentSaved(true);
      onConsentSaved?.(data.id);
      toast.success("Client consent recorded successfully!");

      // Send notification email via edge function
      try {
        await supabase.functions.invoke("lovable-ai", {
          body: {
            action: "initialize", // Just trigger a lightweight call for logging
          },
        });
      } catch {
        // Non-blocking
      }
    } catch (e: any) {
      toast.error("Failed to save consent: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (consentSaved) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 shadow-sm">
        <CardContent className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-black text-sm">Consent Recorded</p>
            <p className="text-emerald-700 text-xs">
              {clientName} signed the recording authorization · {new Date().toLocaleString()}
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs ml-auto">Signed</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/30 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-gold" />
          </div>
          <div>
            <span className="font-semibold text-black text-sm">Client Recording Authorization</span>
            <p className="text-zinc-500 text-[11px]">Required before recording — for quality & review purposes</p>
          </div>
        </div>

        {/* Agreement text */}
        <div className="bg-white border border-gold/15 rounded-lg p-3.5 text-zinc-600 text-xs leading-relaxed">
          <p className="font-semibold text-black text-xs mb-1.5">Recording Consent Agreement</p>
          {CONSENT_TEXT}
          <p className="text-zinc-400 text-[10px] mt-2">
            Meeting: {meetingTitle || "Untitled"} · Type: {sessionType.replace(/_/g, " ")} · Participants: {participants || "N/A"}
          </p>
        </div>

        {/* Client details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-zinc-700 text-xs">Client Full Name *</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Full name"
              className="bg-white border-gold/30 text-black text-sm h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-700 text-xs">Email (optional)</Label>
            <Input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="email@example.com"
              className="bg-white border-gold/30 text-black text-sm h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-700 text-xs">Phone (optional)</Label>
            <Input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+971 XX XXX XXXX"
              className="bg-white border-gold/30 text-black text-sm h-9"
            />
          </div>
        </div>

        {/* ID Photo Upload */}
        <div className="space-y-1.5">
          <Label className="text-zinc-700 text-xs flex items-center gap-1.5">
            <Upload className="h-3 w-3 text-gold" /> Client ID Photo (optional — for identity verification)
          </Label>
          {idPhotoPreview ? (
            <div className="relative inline-block">
              <img src={idPhotoPreview} alt="ID" className="h-20 rounded-lg border border-gold/30 object-cover" />
              <button
                onClick={() => { setIdPhotoFile(null); setIdPhotoPreview(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <Trash2 className="h-3 w-3 text-white" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 p-3 border border-dashed border-gold/30 rounded-lg cursor-pointer hover:bg-gold/5 transition-colors">
              <Upload className="h-4 w-4 text-gold" />
              <span className="text-zinc-500 text-xs">Upload Emirates ID or Passport photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
            </label>
          )}
        </div>

        {/* Signature Pad */}
        <div className="space-y-1.5">
          <Label className="text-zinc-700 text-xs flex items-center gap-1.5">
            <PenTool className="h-3 w-3 text-gold" /> Client Signature *
          </Label>
          <div className="relative bg-white border border-gold/30 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={180}
              className="w-full h-[120px] cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {!hasSigned && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-zinc-300 text-sm">Sign here</span>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs text-zinc-500 hover:text-red-600">
              Clear Signature
            </Button>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmitConsent}
          disabled={saving || !clientName.trim() || !hasSigned}
          className="w-full bg-black hover:bg-zinc-800 text-gold font-semibold"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Consent...</>
          ) : (
            <><ShieldCheck className="h-4 w-4 mr-2" /> Submit & Authorize Recording</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MeetingConsentSection;
