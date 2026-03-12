/**
 * DocumentESignIntegration — E-Signature panel for Document Designer.
 * All users: Upload doc + sign/stamp
 * Owner only: Send for signature via email
 */
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FileSignature, Upload, Send, Loader2, X, Mail, Bell, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  documentReady: boolean;
  onSignDocument: () => void;
}

export default function DocumentESignIntegration({ documentReady, onSignDocument }: Props) {
  const { isOwner } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  // Owner-only: Send for Signature
  const [sendMode, setSendMode] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Max 20MB.");
      return;
    }
    setUploadedFile(file);
    if (file.type === "application/pdf") {
      setUploadedPreview("pdf");
    } else if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setUploadedPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    toast.success("Document uploaded — ready to sign");
  };

  const goToESignature = () => {
    navigate("/e-signature/create");
  };

  const handleSendForSignature = async () => {
    if (!recipientEmail.trim()) { toast.error("Enter recipient email"); return; }
    setSending(true);
    try {
      // This would integrate with the existing esign-send-for-signature edge function
      // For now, navigate to the e-signature create page with pre-filled data
      toast.success(`Redirecting to E-Sign to send to ${recipientEmail}...`);
      navigate("/e-signature/create");
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const sendReminder = async () => {
    toast.info("Reminder feature available in the E-Signature dashboard.");
    navigate("/e-signature");
  };

  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileSignature size={12} className="text-[hsl(var(--gold))]" />
        <span className="text-xs font-bold text-[hsl(var(--foreground))]">E-Signature</span>
      </div>

      {/* ── Upload & Sign (All users) ── */}
      <div className="space-y-2">
        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
          Upload a document to sign it or add your stamp.
        </p>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInput.current?.click()}
            className="h-7 text-[10px] gap-1"
          >
            <Upload size={10} /> Upload Document
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {documentReady && (
            <Button
              size="sm"
              onClick={onSignDocument}
              className="h-7 text-[10px] gap-1 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white"
            >
              <FileSignature size={10} /> Sign This Document
            </Button>
          )}
        </div>

        {uploadedFile && (
          <div className="flex items-center gap-2 bg-[hsl(var(--muted)/0.3)] p-2 rounded-lg">
            <FileSignature size={12} className="text-[hsl(var(--gold))]" />
            <span className="text-[10px] text-[hsl(var(--foreground))] flex-1 truncate">{uploadedFile.name}</span>
            <button onClick={() => { setUploadedFile(null); setUploadedPreview(null); }}>
              <X size={10} className="text-[hsl(var(--muted-foreground))]" />
            </button>
          </div>
        )}

        <Button size="sm" variant="outline" onClick={goToESignature} className="w-full h-7 text-[10px] gap-1 border-[hsl(var(--gold)/0.3)]">
          <FileSignature size={10} /> Open Full E-Signature Studio
        </Button>
      </div>

      {/* ── Owner-Only: Send for Signature ── */}
      <div className="border-t border-[hsl(var(--border))] pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Send size={12} className="text-[hsl(var(--gold))]" />
          <span className="text-xs font-bold text-[hsl(var(--foreground))]">Send for Signature</span>
          {!isOwner && <Lock size={10} className="text-[hsl(var(--muted-foreground))]" />}
        </div>

        {isOwner ? (
          <>
            {!sendMode ? (
              <Button
                size="sm"
                onClick={() => setSendMode(true)}
                className="w-full h-7 text-[10px] gap-1 bg-gradient-to-r from-indigo-600 to-blue-700 text-white"
              >
                <Mail size={10} /> Send Document for Signature
              </Button>
            ) : (
              <div className="space-y-2">
                <div>
                  <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Recipient Email *</Label>
                  <Input
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="h-7 text-xs"
                    type="email"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Recipient Name</Label>
                  <Input
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="John Smith"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Message (optional)</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={e => setEmailMessage(e.target.value)}
                    placeholder="Please sign this document at your earliest convenience."
                    className="text-xs min-h-[40px] resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSendForSignature}
                    disabled={sending}
                    className="flex-1 h-7 text-[10px] gap-1 bg-gradient-to-r from-indigo-600 to-blue-700 text-white"
                  >
                    {sending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                    Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={sendReminder}
                    className="h-7 text-[10px] gap-1"
                  >
                    <Bell size={10} /> Reminders
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSendMode(false)}
                    className="h-7 text-[10px]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-[9px] text-[hsl(var(--muted-foreground))] italic">
            Send for Signature is available for the account owner. You can still upload and sign documents above.
          </p>
        )}
      </div>
    </div>
  );
}
