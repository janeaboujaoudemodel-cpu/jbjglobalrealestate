import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Mail, Pencil, Check, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOwnerSettings } from "@/hooks/useCRMRelationships";

interface TestSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "developer" | "brokerage";
  variant: string;
  initialSubject?: string;
  initialHtml?: string;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface TestProfile {
  to: string;
  cc: string;
  from_email: string;
  sample_name: string;
  subject_override: string;
}

const DEFAULT_PROFILE: TestProfile = {
  to: "infoo.jane@gmail.com",
  cc: "",
  from_email: "jane@citideveloper.com",
  sample_name: "ABC REAL ESTATE",
  subject_override: "",
};

// Normalize legacy/wrong single-o variant -> correct double-o address.
const fixEmail = (v: string | undefined | null): string => {
  const s = (v || "").trim();
  if (!s) return "";
  return s.replace(/\binfo\.jane@gmail\.com\b/gi, "infoo.jane@gmail.com");
};

type FieldKey = keyof TestProfile;

interface LockedFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  locked: boolean;
  onUnlock: () => void;
  onCommit: (next: string) => void;
}

const LockedField = ({ label, value, placeholder, locked, onUnlock, onCommit }: LockedFieldProps) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value, locked]);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
        {label}
        {locked ? <Lock className="w-3 h-3 text-[#1A1A1A]/50" /> : null}
      </Label>
      {locked ? (
        <button
          type="button"
          onClick={onUnlock}
          className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-white border border-[#1A1A1A]/15 hover:border-[#B89555] transition-colors"
        >
          <span className={`text-sm truncate ${value ? "text-[#1A1A1A]" : "text-[#1A1A1A]/40 italic"}`}>
            {value || placeholder || "—"}
          </span>
          <Pencil className="w-3.5 h-3.5 text-[#1A1A1A]/60 shrink-0" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onCommit(draft); } }}
            placeholder={placeholder}
            className="bg-white border-[#1A1A1A]/15 focus-visible:ring-[#B89555]"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-[#B89555]/40"
            onClick={() => onCommit(draft)}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

export const TestSendDialog = ({
  open,
  onOpenChange,
  mode,
  variant,
}: TestSendDialogProps) => {
  const { data: settings } = useOwnerSettings();

  const [profile, setProfile] = useState<TestProfile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<"review" | "confirm">("review");
  const hydratedRef = useRef(false);

  // Hydrate ONCE per open, then never overwrite — preserves user edits.
  useEffect(() => {
    if (!open) {
      hydratedRef.current = false;
      setStep("review");
      setEditing(null);
      return;
    }
    if (hydratedRef.current || !settings) return;
    hydratedRef.current = true;
    const saved = ((settings as any).test_profile || {}) as Partial<TestProfile>;
    setProfile({
      to: saved.to || DEFAULT_PROFILE.to,
      cc: saved.cc || DEFAULT_PROFILE.cc,
      from_email: saved.from_email || DEFAULT_PROFILE.from_email,
      sample_name: saved.sample_name || DEFAULT_PROFILE.sample_name,
      subject_override: saved.subject_override || DEFAULT_PROFILE.subject_override,
    });
  }, [open, settings]);

  const persist = async (next: TestProfile) => {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase.from("crm_owner_settings").upsert(
        { owner_id: u.user.id, test_profile: next as any },
        { onConflict: "owner_id" },
      );
    } catch (e) {
      console.warn("persist test_profile failed", e);
    }
  };

  const commitField = (field: FieldKey, value: string) => {
    const next = { ...profile, [field]: value.trim() };
    setProfile(next);
    setEditing(null);
    void persist(next);
  };

  const handleSend = async () => {
    if (!isEmail(profile.to)) {
      toast.error("Test recipient is not a valid email — click to edit.");
      return;
    }
    setSending(true);
    try {
      const fnName = mode === "brokerage" ? "crm-send-brokerage-outreach" : "crm-send-developer-registration";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          variant,
          testRecipient: profile.to,
          testRecipients: [profile.to],
          ccEmailOverride: profile.cc,
          fromEmailOverride: profile.from_email || undefined,
          subjectOverride: profile.subject_override || undefined,
          [mode === "brokerage" ? "testBrokerageName" : "testDeveloperName"]: profile.sample_name,
        },
      });
      const v = data as any;
      if (error) throw new Error(error.message);
      if (v?.error) throw new Error(v.error.message || v.error);
      toast.success(`Test email sent to ${profile.to}`);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Test send failed:", err);
      toast.error(err.message || "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  const goToConfirm = () => {
    if (!isEmail(profile.to)) {
      toast.error("Test recipient is not a valid email — click to edit.");
      return;
    }
    setStep("confirm");
  };

  const fieldUI = (key: FieldKey, label: string, placeholder?: string) => (
    <LockedField
      label={label}
      value={profile[key]}
      placeholder={placeholder}
      locked={editing !== key}
      onUnlock={() => setEditing(key)}
      onCommit={(v) => commitField(key, v)}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Mail className="w-5 h-5 text-[#1A1A1A]" />
            {step === "review" ? "Locked Test Profile" : "Confirm & Send"} — {mode === "brokerage" ? "Brokerage" : "Developer"} pack
          </DialogTitle>
        </DialogHeader>

        {step === "review" ? (
          <>
            <div className="space-y-4 py-2">
              <p className="text-[11px] text-[#1A1A1A]/70">
                These values are saved between sends. Click the pencil on any field to change it — it will stay locked until you do.
              </p>
              {fieldUI("to", "Send test to", "info.jane@gmail.com")}
              {fieldUI("from_email", "From / Reply-to", "jane@citideveloper.com")}
              {fieldUI("sample_name", mode === "brokerage" ? "Sample brokerage name" : "Sample developer name", "ABC REAL ESTATE")}
              {fieldUI("subject_override", "Subject (override)", "Leave empty to use template subject")}
              {fieldUI("cc", "CC (optional, comma-separated)", "")}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={goToConfirm}
                className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
              >
                Continue → Review &amp; Send
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 py-2">
              <div className="bg-[#F7F2EA] border border-[#B89555]/40 rounded-lg p-4 space-y-2 text-sm">
                <div><span className="font-semibold text-[#1A1A1A]">Template:</span> <span className="text-[#1A1A1A]">{variant}</span></div>
                <div><span className="font-semibold text-[#1A1A1A]">To:</span> <span className="text-[#1A1A1A]">{profile.to}</span></div>
                <div><span className="font-semibold text-[#1A1A1A]">CC:</span> <span className="text-[#1A1A1A]">{profile.cc || <em className="text-[#1A1A1A]/60">none</em>}</span></div>
                <div><span className="font-semibold text-[#1A1A1A]">From / Reply-to:</span> <span className="text-[#1A1A1A]">{profile.from_email}</span></div>
                <div><span className="font-semibold text-[#1A1A1A]">Sample name:</span> <span className="text-[#1A1A1A]">{profile.sample_name}</span></div>
                <div><span className="font-semibold text-[#1A1A1A]">Subject:</span> <span className="text-[#1A1A1A]">{profile.subject_override || <em className="text-[#1A1A1A]/60">template default</em>}</span></div>
              </div>
              <p className="text-[11px] text-[#1A1A1A]/70 italic">
                Tagged [TEST] in the subject and never logged as real outreach.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("review")} disabled={sending}>← Back to edit</Button>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
              >
                {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</> : <><Send className="w-4 h-4 mr-2" />Send Test</>}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
