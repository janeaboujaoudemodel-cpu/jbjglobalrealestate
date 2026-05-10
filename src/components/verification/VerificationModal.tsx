import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Upload, Camera, CheckCircle2, Loader2, AlertCircle, Eye, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "intro" | "id-front" | "id-back" | "selfie-upload" | "liveness" | "submitting" | "success" | "error";

type LivenessStage = "blink" | "turn-left" | "turn-right";

const LIVENESS_INSTRUCTIONS: Record<LivenessStage, { text: string; icon: string }> = {
  "blink": { text: "Blink slowly 2-3 times", icon: "👁️" },
  "turn-left": { text: "Turn your head to the left", icon: "⬅️" },
  "turn-right": { text: "Turn your head to the right", icon: "➡️" },
};

const VerificationModal = ({ open, onOpenChange }: VerificationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("intro");
  const [fullName, setFullName] = useState("");
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Liveness state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [livenessStage, setLivenessStage] = useState<LivenessStage>("blink");
  const [livenessFrames, setLivenessFrames] = useState<Blob[]>([]);
  const [livenessCapturing, setLivenessCapturing] = useState(false);
  const [livenessComplete, setLivenessComplete] = useState(false);

  const handleFileSelect = (file: File, type: "id-front" | "id-back" | "selfie") => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === "id-front") { setIdFrontFile(file); setIdFrontPreview(url); }
    else if (type === "id-back") { setIdBackFile(file); setIdBackPreview(url); }
    else { setSelfieFile(file); setSelfiePreview(url); }
  };

  // Start webcam for liveness
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      toast({ title: "Camera access denied", description: "Please allow camera access for liveness verification.", variant: "destructive" });
      setStep("selfie-upload");
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // Capture a frame from webcam
  const captureFrame = useCallback((): Blob | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    let blob: Blob | null = null;
    canvas.toBlob(b => { blob = b; }, "image/jpeg", 0.85);
    // Synchronous fallback
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const byteString = atob(dataUrl.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: "image/jpeg" });
  }, []);

  const handleLivenessCapture = useCallback(() => {
    setLivenessCapturing(true);
    const frame = captureFrame();
    if (frame) {
      const newFrames = [...livenessFrames, frame];
      setLivenessFrames(newFrames);

      if (livenessStage === "blink") {
        setLivenessStage("turn-left");
      } else if (livenessStage === "turn-left") {
        setLivenessStage("turn-right");
      } else {
        setLivenessComplete(true);
        stopCamera();
      }
    }
    setTimeout(() => setLivenessCapturing(false), 500);
  }, [captureFrame, livenessFrames, livenessStage, stopCamera]);

  // Cleanup camera on unmount or step change
  useEffect(() => {
    if (step === "liveness") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  const handleSubmit = async () => {
    if (!user || !idFrontFile || !selfieFile || !fullName.trim()) return;
    setStep("submitting");

    try {
      const userId = user.id;
      const ts = Date.now();

      // Upload ID front
      const idFrontPath = `${userId}/id-front-${ts}.${idFrontFile.name.split(".").pop() || "jpg"}`;
      const { error: e1 } = await supabase.storage.from("verification-documents").upload(idFrontPath, idFrontFile, { contentType: idFrontFile.type });
      if (e1) throw e1;

      // Upload ID back (optional)
      let idBackPath: string | null = null;
      if (idBackFile) {
        idBackPath = `${userId}/id-back-${ts}.${idBackFile.name.split(".").pop() || "jpg"}`;
        const { error: e2 } = await supabase.storage.from("verification-documents").upload(idBackPath, idBackFile, { contentType: idBackFile.type });
        if (e2) throw e2;
      }

      // Upload selfie
      const selfiePath = `${userId}/selfie-${ts}.${selfieFile.name.split(".").pop() || "jpg"}`;
      const { error: e3 } = await supabase.storage.from("verification-documents").upload(selfiePath, selfieFile, { contentType: selfieFile.type });
      if (e3) throw e3;

      // Upload liveness frames
      const livenessPaths: string[] = [];
      for (let i = 0; i < livenessFrames.length; i++) {
        const path = `${userId}/liveness-${ts}-${i}.jpg`;
        const { error } = await supabase.storage.from("verification-documents").upload(path, livenessFrames[i], { contentType: "image/jpeg" });
        if (!error) livenessPaths.push(path);
      }

      // Insert verification record
      const { error: insertErr } = await supabase
        .from("user_verifications")
        .insert({
          user_id: userId,
          id_document_url: idFrontPath,
          selfie_url: selfiePath,
          full_name: fullName.trim(),
          status: "pending",
        });
      if (insertErr) throw insertErr;

      // Update profile
      await supabase.from("profiles").update({ verification_status: "pending" }).eq("id", userId);

      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      setStep("success");
    } catch (err: any) {
      console.error("Verification submission error:", err);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setStep("error");
    }
  };

  const resetModal = () => {
    setStep("intro");
    setFullName("");
    setIdFrontFile(null); setIdBackFile(null); setSelfieFile(null);
    setIdFrontPreview(null); setIdBackPreview(null); setSelfiePreview(null);
    setErrorMsg("");
    setLivenessStage("blink");
    setLivenessFrames([]);
    setLivenessComplete(false);
    stopCamera();
  };

  const handleClose = (open: boolean) => {
    if (!open) resetModal();
    onOpenChange(open);
  };

  const renderFileUpload = (
    preview: string | null,
    inputRef: React.RefObject<HTMLInputElement>,
    onFile: (f: File) => void,
    label: string,
    icon: React.ReactNode
  ) => (
    <>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {preview ? (
        <div className="relative rounded-none overflow-hidden border-2 border-[hsl(var(--gold)/0.3)]">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <button onClick={() => inputRef.current?.click()} className="absolute bottom-2 right-2 px-3 py-1.5 rounded-none bg-[#1A1A1A]/70 text-white text-xs font-medium hover:bg-[#1A1A1A]/90 transition">Change</button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} className="w-full h-40 border-2 border-dashed border-[hsl(var(--gold)/0.4)] rounded-none flex flex-col items-center justify-center gap-2 text-white/90 hover:border-[hsl(var(--gold)/0.6)] hover:bg-[hsl(var(--gold)/0.05)] transition-all">
          {icon}
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-white/70">JPG, PNG up to 10MB</span>
        </button>
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[hsl(var(--gold)/0.3)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <ShieldCheck className="w-5 h-5 text-[hsl(var(--gold))]" />
            Identity Verification
          </DialogTitle>
          <DialogDescription>
            Verify your identity to earn a trusted badge on your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[280px]">
          {/* Step: Intro */}
          {step === "intro" && (
            <div className="space-y-4 pt-2">
              <div className="bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.2)] rounded-none p-4 text-sm text-[#1A1A1A]/70 leading-relaxed">
                <p className="font-medium text-[#1A1A1A] mb-2">What you'll need:</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>A clear photo of your government-issued ID (front & back)</li>
                  <li>A selfie of you holding your ID</li>
                  <li>A quick liveness check via your camera</li>
                </ul>
                <p className="mt-3 text-xs text-white/90">We review submissions within 24–48 hours. Your documents are stored securely.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Full Name (as on ID)</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full legal name" />
              </div>
              <Button onClick={() => fullName.trim() ? setStep("id-front") : toast({ title: "Please enter your name", variant: "destructive" })} className="w-full bg-[#1A1A1A] text-white font-semibold hover:bg-[#1A1A1A] border border-[#1A1A1A]">
                Continue
              </Button>
            </div>
          )}

          {/* Step: ID Front */}
          {step === "id-front" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-[#1A1A1A]/70">Upload a clear photo of the <strong>front</strong> of your government-issued ID.</p>
              {renderFileUpload(idFrontPreview, idFrontRef, (f) => handleFileSelect(f, "id-front"), "Upload ID Front", <Upload className="w-8 h-8 text-[hsl(var(--gold))]" />)}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("intro")} className="flex-1 border-[hsl(var(--gold)/0.3)] text-[#1A1A1A]">Back</Button>
                <Button onClick={() => idFrontFile ? setStep("id-back") : toast({ title: "Please upload ID front", variant: "destructive" })} className="flex-1 bg-[#1A1A1A] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]">Next</Button>
              </div>
            </div>
          )}

          {/* Step: ID Back */}
          {step === "id-back" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-[#1A1A1A]/70">Upload a clear photo of the <strong>back</strong> of your ID (optional but recommended).</p>
              {renderFileUpload(idBackPreview, idBackRef, (f) => handleFileSelect(f, "id-back"), "Upload ID Back", <RotateCcw className="w-8 h-8 text-[hsl(var(--gold))]" />)}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("id-front")} className="flex-1 border-[hsl(var(--gold)/0.3)] text-[#1A1A1A]">Back</Button>
                <Button onClick={() => setStep("selfie-upload")} className="flex-1 bg-[#1A1A1A] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]">{idBackFile ? "Next" : "Skip"}</Button>
              </div>
            </div>
          )}

          {/* Step: Selfie Upload */}
          {step === "selfie-upload" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-[#1A1A1A]/70">Take a selfie while holding your ID next to your face.</p>
              {renderFileUpload(selfiePreview, selfieInputRef, (f) => handleFileSelect(f, "selfie"), "Upload Selfie with ID", <Camera className="w-8 h-8 text-[hsl(var(--gold))]" />)}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("id-back")} className="flex-1 border-[hsl(var(--gold)/0.3)] text-[#1A1A1A]">Back</Button>
                <Button onClick={() => selfieFile ? setStep("liveness") : toast({ title: "Please upload your selfie", variant: "destructive" })} className="flex-1 bg-[#1A1A1A] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]">Next: Liveness Check</Button>
              </div>
            </div>
          )}

          {/* Step: Liveness Detection */}
          {step === "liveness" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-[#1A1A1A]/70 font-medium">Liveness Verification — follow the instructions below</p>
              
              <div className="relative rounded-none overflow-hidden border-2 border-[hsl(var(--gold)/0.3)] bg-[#1A1A1A] aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Instruction overlay */}
                {!livenessComplete && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-center gap-3">
                      <Eye className="w-5 h-5 text-[hsl(var(--gold))]" />
                      <span className="text-white text-sm font-medium">
                        {LIVENESS_INSTRUCTIONS[livenessStage].text}
                      </span>
                    </div>
                    <div className="flex justify-center gap-2 mt-2">
                      {(["blink", "turn-left", "turn-right"] as LivenessStage[]).map((s, i) => (
                        <div key={s} className={`w-2 h-2 rounded-full ${i < livenessFrames.length ? "bg-emerald-500" : s === livenessStage ? "bg-[hsl(var(--gold))] animate-pulse" : "bg-[#1A1A1A]"}`} />
                      ))}
                    </div>
                  </div>
                )}
                
                {livenessComplete && (
                  <div className="absolute inset-0 bg-[#1A1A1A]/70 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <span className="text-white text-sm font-medium">Liveness verified</span>
                  </div>
                )}
              </div>

              {!livenessComplete ? (
                <Button onClick={handleLivenessCapture} disabled={livenessCapturing} className="w-full bg-[#1A1A1A] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]">
                  {livenessCapturing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Capture — {LIVENESS_INSTRUCTIONS[livenessStage].text}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setLivenessStage("blink"); setLivenessFrames([]); setLivenessComplete(false); setStep("liveness"); }} className="flex-1 border-[hsl(var(--gold)/0.3)] text-[#1A1A1A]">Redo</Button>
                  <Button onClick={handleSubmit} className="flex-1 bg-[#1A1A1A] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)] font-semibold">Submit for Review</Button>
                </div>
              )}
            </div>
          )}

          {/* Step: Submitting */}
          {step === "submitting" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="w-10 h-10 text-[hsl(var(--gold))] animate-spin" />
              <p className="text-sm text-[#1A1A1A]/70 font-medium">Uploading your documents...</p>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A]">Verification Submitted!</h3>
              <p className="text-sm text-[#1A1A1A]/70 max-w-xs">We'll review your documents within 24–48 hours. You'll be notified once verified.</p>
              <Button onClick={() => handleClose(false)} className="mt-2 bg-[#1A1A1A] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)] font-semibold">Done</Button>
            </div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A]">Submission Failed</h3>
              <p className="text-sm text-[#1A1A1A]/70 max-w-xs">{errorMsg}</p>
              <Button onClick={() => setStep("selfie-upload")} variant="outline" className="mt-2 border-[hsl(var(--gold)/0.3)] text-[#1A1A1A]">Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationModal;
