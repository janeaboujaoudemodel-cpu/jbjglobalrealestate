import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle2,
  Loader2,
  Eye,
  RotateCcw,
  ChevronLeft,
  Lock,
  Copy,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type StepId =
  | "consent"
  | "document"
  | "personal"
  | "id-front"
  | "id-back"
  | "selfie"
  | "liveness"
  | "review"
  | "submitting"
  | "success"
  | "error";

const STEP_ORDER: StepId[] = [
  "consent",
  "document",
  "personal",
  "id-front",
  "id-back",
  "selfie",
  "liveness",
  "review",
];

const DOC_TYPES = [
  { value: "passport", label: "Passport", needsBack: false },
  { value: "emirates_id", label: "Emirates ID", needsBack: true },
  { value: "national_id", label: "National ID", needsBack: true },
  { value: "driver_license", label: "Driver License", needsBack: true },
];

const COUNTRIES = [
  "AE", "SA", "KW", "QA", "BH", "OM", "EG", "JO", "LB", "GB", "US", "CA",
  "IN", "PK", "FR", "DE", "IT", "ES", "RU", "CN", "JP", "AU", "ZA", "TR",
];

const LIVENESS_POOL = [
  { id: "blink", text: "Blink slowly 2-3 times", icon: "👁️" },
  { id: "turn-left", text: "Turn your head to the left", icon: "⬅️" },
  { id: "turn-right", text: "Turn your head to the right", icon: "➡️" },
  { id: "smile", text: "Smile naturally", icon: "🙂" },
  { id: "nod", text: "Nod your head slowly", icon: "⬇️" },
];

async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const s = reader.result as string;
      resolve(s.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const VerificationModal = ({ open, onOpenChange }: VerificationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<StepId>("consent");

  // Consent
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [consentTruth, setConsentTruth] = useState(false);

  // Document
  const [docType, setDocType] = useState<string>("passport");
  const [docCountry, setDocCountry] = useState<string>("AE");

  // Personal
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("AE");
  const [phone, setPhone] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateField] = useState("");
  const [postal, setPostal] = useState("");
  const [addrCountry, setAddrCountry] = useState("AE");

  // Files
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  // Liveness
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const livenessChallenges = useMemo(
    () => [...LIVENESS_POOL].sort(() => Math.random() - 0.5).slice(0, 3),
    [open],
  );
  const [livenessIdx, setLivenessIdx] = useState(0);
  const [livenessFrames, setLivenessFrames] = useState<Blob[]>([]);
  const [livenessCapturing, setLivenessCapturing] = useState(false);
  const [livenessComplete, setLivenessComplete] = useState(false);

  // Submit state
  const [errorMsg, setErrorMsg] = useState("");
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  const docMeta = DOC_TYPES.find((d) => d.value === docType)!;
  const needsBack = docMeta.needsBack;

  // ---------- Reset on close ----------
  const fullReset = useCallback(() => {
    setStep("consent");
    setConsentTerms(false);
    setConsentData(false);
    setConsentTruth(false);
    setDocType("passport");
    setDocCountry("AE");
    setFullName("");
    setDob("");
    setNationality("AE");
    setPhone("");
    setAddr1("");
    setAddr2("");
    setCity("");
    setStateField("");
    setPostal("");
    setAddrCountry("AE");
    setIdFrontFile(null);
    setIdBackFile(null);
    setSelfieFile(null);
    setIdFrontPreview(null);
    setIdBackPreview(null);
    setSelfiePreview(null);
    setLivenessIdx(0);
    setLivenessFrames([]);
    setLivenessComplete(false);
    setErrorMsg("");
    setReferenceCode(null);
  }, []);

  const handleClose = (o: boolean) => {
    if (!o) {
      stopCamera();
      // Only reset if not on success (let user keep reference code if reopened)
      if (step !== "success") fullReset();
    }
    onOpenChange(o);
  };

  // ---------- Camera ----------
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access for liveness verification.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (step === "liveness") startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  const captureFrame = useCallback((): Blob | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const byteString = atob(dataUrl.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: "image/jpeg" });
  }, []);

  const handleCaptureLiveness = () => {
    setLivenessCapturing(true);
    const frame = captureFrame();
    if (frame) {
      const next = [...livenessFrames, frame];
      setLivenessFrames(next);
      if (livenessIdx + 1 < livenessChallenges.length) {
        setLivenessIdx(livenessIdx + 1);
      } else {
        setLivenessComplete(true);
        stopCamera();
      }
    }
    setTimeout(() => setLivenessCapturing(false), 400);
  };

  // ---------- File handlers ----------
  const handleFile = (file: File, type: "id-front" | "id-back" | "selfie") => {
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 8MB", variant: "destructive" });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Invalid type", description: "Use JPG, PNG, or WebP", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === "id-front") {
      setIdFrontFile(file);
      setIdFrontPreview(url);
    } else if (type === "id-back") {
      setIdBackFile(file);
      setIdBackPreview(url);
    } else {
      setSelfieFile(file);
      setSelfiePreview(url);
    }
  };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!user) return;
    setStep("submitting");
    try {
      const idFrontB64 = await fileToBase64(idFrontFile!);
      const idBackB64 = idBackFile ? await fileToBase64(idBackFile) : null;
      const selfieB64 = await fileToBase64(selfieFile!);
      const livenessB64 = await Promise.all(
        livenessFrames.map(async (b, i) => ({
          filename: `liveness-${i}.jpg`,
          contentType: "image/jpeg",
          base64: await fileToBase64(b),
        })),
      );

      const payload = {
        fullName: fullName.trim(),
        documentType: docType,
        documentCountry: docCountry,
        dateOfBirth: dob,
        nationality,
        phone: phone.trim(),
        address: {
          line1: addr1.trim(),
          line2: addr2.trim() || undefined,
          city: city.trim(),
          state: state.trim() || undefined,
          postalCode: postal.trim() || undefined,
          country: addrCountry,
        },
        consent: { terms: consentTerms, dataProcessing: consentData, truthful: consentTruth },
        idFront: {
          filename: idFrontFile!.name,
          contentType: idFrontFile!.type,
          base64: idFrontB64,
        },
        idBack: idBackFile
          ? {
              filename: idBackFile.name,
              contentType: idBackFile.type,
              base64: idBackB64!,
            }
          : null,
        selfie: {
          filename: selfieFile!.name,
          contentType: selfieFile!.type,
          base64: selfieB64,
        },
        livenessFrames: livenessB64,
        livenessChallenges: livenessChallenges.map((c) => c.id),
      };

      const { data, error } = await supabase.functions.invoke("submit-verification", {
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(Array.isArray(data.details) ? data.details.join("\n") : data.error);

      setReferenceCode(data?.reference_code ?? null);
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      setStep("success");
    } catch (err: any) {
      console.error("Verification submission error:", err);
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
      setStep("error");
    }
  };

  // ---------- Validation gates ----------
  const consentOk = consentTerms && consentData && consentTruth;
  const documentOk = !!docType && !!docCountry;
  const personalOk =
    fullName.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(dob) &&
    !!nationality &&
    phone.trim().length >= 6 &&
    addr1.trim() &&
    city.trim() &&
    !!addrCountry;
  const idFrontOk = !!idFrontFile;
  const idBackOk = !needsBack || !!idBackFile;
  const selfieOk = !!selfieFile;
  const livenessOk = livenessComplete;
  const allOk = consentOk && documentOk && personalOk && idFrontOk && idBackOk && selfieOk && livenessOk;

  // ---------- Progress ----------
  const visibleSteps = STEP_ORDER.filter((s) => s !== "id-back" || needsBack);
  const currentIdx = Math.max(0, visibleSteps.indexOf(step as StepId));

  const goBack = () => {
    const idx = visibleSteps.indexOf(step as StepId);
    if (idx > 0) setStep(visibleSteps[idx - 1]);
  };
  const goNext = (next: StepId) => setStep(next);

  // ---------- Render helpers ----------
  const FileBlock = ({
    preview,
    inputRef,
    onFile,
    label,
    icon,
  }: {
    preview: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onFile: (f: File) => void;
    label: string;
    icon: React.ReactNode;
  }) => (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-[#B89555]/60">
          <img src={preview} alt="" className="w-full h-48 object-cover"  loading="lazy" decoding="async" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-[#FDFBF7]/95 text-[#1A1A1A] text-xs font-medium border border-[#B89555]/50 hover:bg-[#FDFBF7]"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-44 border-2 border-dashed border-[#B89555]/55 rounded-xl flex flex-col items-center justify-center gap-2 text-[#1A1A1A] hover:bg-[#F7F2EA] transition-all"
        >
          {icon}
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-[#1A1A1A]/55">JPG, PNG or WebP · up to 8 MB</span>
        </button>
      )}
    </>
  );

  function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="w-full text-left px-3 py-2.5 rounded-lg border border-[#B89555]/25 hover:border-[#B89555]/55 bg-[#FDFBF7] hover:bg-[#F7F2EA] transition-colors flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#1A1A1A]/55">{label}</div>
          <div className="text-sm text-[#1A1A1A] truncate">{value || "—"}</div>
        </div>
        <span className="text-xs text-[#B89555] font-medium shrink-0">Edit</span>
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-no-contrast-guard
        className="sm:max-w-lg bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] p-0 overflow-hidden"
      >
        <div className="px-6 pt-6 pb-3 border-b border-[#B89555]/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1A1A1A] text-lg">
              <ShieldCheck className="w-5 h-5 text-[#B89555]" />
              Identity Verification
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1A1A1A]/60">
                <Lock className="w-3 h-3" /> Bank-grade
              </span>
            </DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/65 text-sm">
              We collect only what's required by KYC/AML rules. Your documents are encrypted in transit and at rest.
            </DialogDescription>
          </DialogHeader>

          {/* Progress rail */}
          {!["submitting", "success", "error"].includes(step) && (
            <div className="mt-4 flex items-center gap-1.5">
              {visibleSteps.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
 i <= currentIdx ? "bg-[#B89555]" : "bg-[#EFE6D6]"
 }`}
                />
              ))}
              <span className="ml-2 text-[11px] font-semibold text-[#1A1A1A]/60 tabular-nums">
                {currentIdx + 1}/{visibleSteps.length}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* CONSENT */}
          {step === "consent" && (
            <div className="space-y-4">
              <p className="text-sm text-[#1A1A1A]/80 leading-relaxed">
                Before we begin, please confirm:
              </p>
              <div className="space-y-3">
                <label className="flex gap-3 items-start cursor-pointer">
                  <Checkbox checked={consentTerms} onCheckedChange={(v) => setConsentTerms(!!v)} />
                  <span className="text-sm text-[#1A1A1A]">
                    I agree to the <a href="/legal/terms" target="_blank" className="underline text-[#B89555]">Terms of Service</a> and{" "}
                    <a href="/legal/aml-kyc-policy" target="_blank" className="underline text-[#B89555]">AML/KYC Policy</a>.
                  </span>
                </label>
                <label className="flex gap-3 items-start cursor-pointer">
                  <Checkbox checked={consentData} onCheckedChange={(v) => setConsentData(!!v)} />
                  <span className="text-sm text-[#1A1A1A]">
                    I consent to the processing of my personal data and identity documents for verification purposes, in line with the{" "}
                    <a href="/legal/privacy" target="_blank" className="underline text-[#B89555]">Privacy Policy</a>.
                  </span>
                </label>
                <label className="flex gap-3 items-start cursor-pointer">
                  <Checkbox checked={consentTruth} onCheckedChange={(v) => setConsentTruth(!!v)} />
                  <span className="text-sm text-[#1A1A1A]">
                    I declare that all information and documents I provide are true, complete, and belong to me.
                  </span>
                </label>
              </div>
              <Button disabled={!consentOk} onClick={() => goNext("document")} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {/* DOCUMENT */}
          {step === "document" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Country issuing the document</Label>
                <Select value={docCountry} onValueChange={setDocCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Document type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DOC_TYPES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDocType(d.value)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
 docType === d.value
 ? "border-[#B89555] bg-[#EFE6D6] text-[#1A1A1A]"
 : "border-[#B89555]/30 bg-[#FDFBF7] text-[#1A1A1A]/80 hover:border-[#B89555]/60"
 }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button disabled={!documentOk} onClick={() => goNext("personal")} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* PERSONAL */}
          {step === "personal" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full legal name (as on ID)</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jane Anna Smith" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date of birth</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nationality</Label>
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971…" />
              </div>
              <div className="space-y-1.5">
                <Label>Address line 1</Label>
                <Input value={addr1} onChange={(e) => setAddr1(e.target.value)} placeholder="Street, building, apt" />
              </div>
              <div className="space-y-1.5">
                <Label>Address line 2 (optional)</Label>
                <Input value={addr2} onChange={(e) => setAddr2(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>State / Emirate</Label>
                  <Input value={state} onChange={(e) => setStateField(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Postal code</Label>
                  <Input value={postal} onChange={(e) => setPostal(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={addrCountry} onValueChange={setAddrCountry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button disabled={!personalOk} onClick={() => goNext("id-front")} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* ID FRONT */}
          {step === "id-front" && (
            <div className="space-y-4">
              <p className="text-sm text-[#1A1A1A]/75">
                Upload a clear photo of the <strong>front</strong> of your {docMeta.label.toLowerCase()}. All four corners must be visible.
              </p>
              <FileBlock
                preview={idFrontPreview}
                inputRef={idFrontRef}
                onFile={(f) => handleFile(f, "id-front")}
                label="Upload front of document"
                icon={<Upload className="w-7 h-7 text-[#B89555]" />}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button disabled={!idFrontOk} onClick={() => goNext(needsBack ? "id-back" : "selfie")} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* ID BACK */}
          {step === "id-back" && needsBack && (
            <div className="space-y-4">
              <p className="text-sm text-[#1A1A1A]/75">
                Upload the <strong>back</strong> of your {docMeta.label.toLowerCase()}.
              </p>
              <FileBlock
                preview={idBackPreview}
                inputRef={idBackRef}
                onFile={(f) => handleFile(f, "id-back")}
                label="Upload back of document"
                icon={<RotateCcw className="w-7 h-7 text-[#B89555]" />}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button disabled={!idBackOk} onClick={() => goNext("selfie")} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* SELFIE */}
          {step === "selfie" && (
            <div className="space-y-4">
              <p className="text-sm text-[#1A1A1A]/75">
                Take a clear selfie holding your ID next to your face. Both your face and the document must be readable.
              </p>
              <FileBlock
                preview={selfiePreview}
                inputRef={selfieRef}
                onFile={(f) => handleFile(f, "selfie")}
                label="Take selfie with ID"
                icon={<Camera className="w-7 h-7 text-[#B89555]" />}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button disabled={!selfieOk} onClick={() => goNext("liveness")} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* LIVENESS */}
          {step === "liveness" && (
            <div className="space-y-4">
              <p className="text-sm text-[#1A1A1A]/80 font-medium">Liveness check</p>
              <div className="relative rounded-xl overflow-hidden border border-[#B89555]/40 bg-[#1A1A1A] aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                {!livenessComplete && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-center gap-3">
                      <Eye className="w-5 h-5 text-[#B89555]" />
                      <span className="text-white text-sm font-medium">
                        {livenessChallenges[livenessIdx]?.icon} {livenessChallenges[livenessIdx]?.text}
                      </span>
                    </div>
                    <div className="flex justify-center gap-1.5 mt-2">
                      {livenessChallenges.map((c, i) => (
                        <div
                          key={c.id}
                          className={`w-2 h-2 rounded-full ${
 i < livenessFrames.length
 ? "jj-surface-emerald"
 : i === livenessIdx
 ? "bg-[#B89555] animate-pulse"
 : "bg-white/30"
 }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {livenessComplete && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    <span className="text-white text-sm font-medium">Liveness captured</span>
                  </div>
                )}
              </div>
              {!livenessComplete ? (
                <Button onClick={handleCaptureLiveness} disabled={livenessCapturing} className="w-full">
                  {livenessCapturing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Capture frame {livenessIdx + 1} / {livenessChallenges.length}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLivenessIdx(0);
                      setLivenessFrames([]);
                      setLivenessComplete(false);
                      startCamera();
                    }}
                    className="flex-1"
                  >
                    Redo
                  </Button>
                  <Button onClick={() => goNext("review")} className="flex-1">
                    Continue
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* REVIEW */}
          {step === "review" && (
            <div className="space-y-3">
              <p className="text-sm text-[#1A1A1A]/80">
                Please review your information. Tap any row to edit.
              </p>
              <ReviewRow label="Document" value={`${docMeta.label} · ${docCountry}`} onEdit={() => setStep("document")} />
              <ReviewRow label="Full name" value={fullName} onEdit={() => setStep("personal")} />
              <ReviewRow label="Date of birth" value={dob} onEdit={() => setStep("personal")} />
              <ReviewRow label="Nationality" value={nationality} onEdit={() => setStep("personal")} />
              <ReviewRow label="Phone" value={phone} onEdit={() => setStep("personal")} />
              <ReviewRow
                label="Address"
                value={`${addr1}${addr2 ? ", " + addr2 : ""}, ${city}${state ? ", " + state : ""}, ${addrCountry}`}
                onEdit={() => setStep("personal")}
              />
              <ReviewRow label="ID front" value={idFrontFile?.name ?? ""} onEdit={() => setStep("id-front")} />
              {needsBack && <ReviewRow label="ID back" value={idBackFile?.name ?? ""} onEdit={() => setStep("id-back")} />}
              <ReviewRow label="Selfie" value={selfieFile?.name ?? ""} onEdit={() => setStep("selfie")} />
              <ReviewRow label="Liveness" value={`${livenessFrames.length} frames captured`} onEdit={() => setStep("liveness")} />

              <div className="flex gap-2 pt-3">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button disabled={!allOk} onClick={handleSubmit} className="flex-1">
                  Submit for review
                </Button>
              </div>
            </div>
          )}

          {/* SUBMITTING */}
          {step === "submitting" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-10 h-10 text-[#B89555] animate-spin" />
              <p className="text-sm text-[#1A1A1A]/75 font-medium">Uploading your documents securely…</p>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full jj-surface-emerald-soft border border-[color:var(--emerald-1)]/30/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[color:var(--emerald-1)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Submission received</h3>
                <p className="text-sm text-[#1A1A1A]/70 mt-1">
                  Our compliance team will review your documents within 24–48 hours. You'll receive an email once a decision is made.
                </p>
              </div>
              {referenceCode && (
                <div className="w-full mt-2 p-4 rounded-xl bg-[#F7F2EA] border border-[#B89555]/50">
                  <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#1A1A1A]/60">Reference</div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="font-mono font-semibold text-[#1A1A1A]">{referenceCode}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(referenceCode);
                        toast({ title: "Copied" });
                      }}
                      className="text-[#B89555] hover:text-[#1A1A1A] transition-colors"
                      aria-label="Copy reference"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <Button onClick={() => { fullReset(); handleClose(false); window.location.assign("/verification"); }} className="w-full mt-2">
                Track status
              </Button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-600 text-xl">!</div>
              <p className="text-sm text-[#1A1A1A] font-medium">Submission failed</p>
              <p className="text-xs text-[#1A1A1A]/70 whitespace-pre-line">{errorMsg}</p>
              <Button onClick={() => setStep("review")} variant="outline" className="mt-2">Try again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationModal;
