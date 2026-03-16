import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Upload, Camera, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "intro" | "id-upload" | "selfie-upload" | "submitting" | "success" | "error";

const VerificationModal = ({ open, onOpenChange }: VerificationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("intro");
  const [fullName, setFullName] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File, type: "id" | "selfie") => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === "id") {
      setIdFile(file);
      setIdPreview(url);
    } else {
      setSelfieFile(file);
      setSelfiePreview(url);
    }
  };

  const handleSubmit = async () => {
    if (!user || !idFile || !selfieFile || !fullName.trim()) return;
    setStep("submitting");

    try {
      const userId = user.id;
      const timestamp = Date.now();

      // Upload ID document
      const idExt = idFile.name.split(".").pop() || "jpg";
      const idPath = `${userId}/id-${timestamp}.${idExt}`;
      const { error: idUploadErr } = await supabase.storage
        .from("verification-documents")
        .upload(idPath, idFile, { contentType: idFile.type });
      if (idUploadErr) throw idUploadErr;

      // Upload selfie
      const selfieExt = selfieFile.name.split(".").pop() || "jpg";
      const selfiePath = `${userId}/selfie-${timestamp}.${selfieExt}`;
      const { error: selfieUploadErr } = await supabase.storage
        .from("verification-documents")
        .upload(selfiePath, selfieFile, { contentType: selfieFile.type });
      if (selfieUploadErr) throw selfieUploadErr;

      // Insert verification record
      const { error: insertErr } = await supabase
        .from("user_verifications")
        .insert({
          user_id: userId,
          id_document_url: idPath,
          selfie_url: selfiePath,
          full_name: fullName.trim(),
          status: "pending",
        });
      if (insertErr) throw insertErr;

      // Update profile verification_status
      await supabase
        .from("profiles")
        .update({ verification_status: "pending" })
        .eq("id", userId);

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
    setIdFile(null);
    setSelfieFile(null);
    setIdPreview(null);
    setSelfiePreview(null);
    setErrorMsg("");
  };

  const handleClose = (open: boolean) => {
    if (!open) resetModal();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <ShieldCheck className="w-5 h-5 text-gold" />
            Identity Verification
          </DialogTitle>
          <DialogDescription>
            Verify your identity to earn a trusted badge on your profile.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step: Intro */}
          {step === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-2">
              <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 text-sm text-zinc-700 leading-relaxed">
                <p className="font-medium text-black mb-2">What you'll need:</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>A clear photo of your government-issued ID</li>
                  <li>A selfie of you holding your ID</li>
                </ul>
                <p className="mt-3 text-xs text-zinc-500">We review submissions within 24–48 hours. Your documents are stored securely and only accessible to our verification team.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Full Name (as on ID)</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full legal name"
                />
              </div>

              <Button
                onClick={() => fullName.trim() ? setStep("id-upload") : toast({ title: "Please enter your name", variant: "destructive" })}
                className="w-full bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:shadow-lg"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* Step: ID Upload */}
          {step === "id-upload" && (
            <motion.div key="id-upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-2">
              <p className="text-sm text-zinc-600">Upload a clear photo of the front of your government-issued ID (passport, driver's license, or national ID).</p>
              
              <input
                ref={idInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f, "id");
                }}
              />

              {idPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-gold/30">
                  <img src={idPreview} alt="ID preview" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => idInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium hover:bg-black/90 transition"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => idInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-gold/40 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-gold/60 hover:bg-gold/5 transition-all"
                >
                  <Upload className="w-8 h-8 text-gold" />
                  <span className="text-sm font-medium">Upload ID Photo</span>
                  <span className="text-xs text-zinc-400">JPG, PNG up to 10MB</span>
                </button>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("intro")} className="flex-1 border-gold/30 text-black">
                  Back
                </Button>
                <Button
                  onClick={() => idFile ? setStep("selfie-upload") : toast({ title: "Please upload your ID", variant: "destructive" })}
                  className="flex-1 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold"
                >
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step: Selfie Upload */}
          {step === "selfie-upload" && (
            <motion.div key="selfie-upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-2">
              <p className="text-sm text-zinc-600">Take a selfie while holding your ID next to your face. Make sure both your face and the ID are clearly visible.</p>
              
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f, "selfie");
                }}
              />

              {selfiePreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-gold/30">
                  <img src={selfiePreview} alt="Selfie preview" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => selfieInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium hover:bg-black/90 transition"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => selfieInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-gold/40 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-gold/60 hover:bg-gold/5 transition-all"
                >
                  <Camera className="w-8 h-8 text-gold" />
                  <span className="text-sm font-medium">Upload Selfie with ID</span>
                  <span className="text-xs text-zinc-400">JPG, PNG up to 10MB</span>
                </button>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("id-upload")} className="flex-1 border-gold/30 text-black">
                  Back
                </Button>
                <Button
                  onClick={() => selfieFile ? handleSubmit() : toast({ title: "Please upload your selfie", variant: "destructive" })}
                  className="flex-1 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold"
                >
                  Submit for Review
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step: Submitting */}
          {step === "submitting" && (
            <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="w-10 h-10 text-gold animate-spin" />
              <p className="text-sm text-zinc-600 font-medium">Uploading your documents...</p>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-black">Verification Submitted!</h3>
              <p className="text-sm text-zinc-600 max-w-xs">We'll review your documents within 24–48 hours. You'll be notified once your account is verified.</p>
              <Button onClick={() => handleClose(false)} className="mt-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold">
                Done
              </Button>
            </motion.div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-black">Submission Failed</h3>
              <p className="text-sm text-zinc-600 max-w-xs">{errorMsg}</p>
              <Button onClick={() => setStep("selfie-upload")} variant="outline" className="mt-2 border-gold/30 text-black">
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationModal;
