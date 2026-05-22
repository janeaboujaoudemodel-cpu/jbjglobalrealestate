import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Key, CheckCircle2, AlertCircle, Zap, Shield, Mail, Building2, User, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EmailHubStatusPanel from "./EmailHubStatusPanel";

interface EmailSettingsPanelProps {
  onClose?: () => void;
}

const EmailSettingsPanel = ({ onClose }: EmailSettingsPanelProps) => {
  const [personalApiKey, setPersonalApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [personalKeyStatus, setPersonalKeyStatus] = useState<"loading" | "active" | "missing" | "invalid">("loading");
  const [lastVerified, setLastVerified] = useState<string | null>(null);

  // Load status from backend on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setPersonalKeyStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("send-owner-email", {
        body: { action: "check_status" },
      });
      if (error) throw error;
      if (data?.personal?.is_active) {
        setPersonalKeyStatus("active");
        setLastVerified(data.personal.last_verified_at);
      } else if (data?.personal?.api_key_exists) {
        setPersonalKeyStatus("invalid");
      } else {
        setPersonalKeyStatus("missing");
      }
    } catch {
      setPersonalKeyStatus("missing");
    }
  };

  const savePersonalApiKey = async () => {
    if (!personalApiKey.trim() || !personalApiKey.startsWith("re_")) {
      toast.error("Please enter a valid Resend API key (starts with re_)");
      return;
    }
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-owner-email", {
        body: {
          action: "save_personal_key",
          apiKey: personalApiKey.trim(),
        },
      });
      if (error) throw error;
      if (data?.valid) {
        setPersonalKeyStatus("active");
        setLastVerified(new Date().toISOString());
        setPersonalApiKey("");
        toast.success("Personal Resend API key connected! Personal emails will now use the API.");
      } else {
        setPersonalKeyStatus("invalid");
        toast.error(data?.error || "API key validation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const removePersonalKey = async () => {
    setIsRemoving(true);
    try {
      const { error } = await supabase.functions.invoke("send-owner-email", {
        body: { action: "remove_personal_key" },
      });
      if (error) throw error;
      setPersonalKeyStatus("missing");
      setLastVerified(null);
      toast.success("Personal API key removed. Personal emails will use normal mode.");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove key");
    } finally {
      setIsRemoving(false);
    }
  };

  const personalKeyConnected = personalKeyStatus === "active";

  return (
    <div className="space-y-6">
      {/* Status Panel */}
      <EmailHubStatusPanel />

      {/* Company Email Status */}
      <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] rounded-xl border-2 border-[#B89555]/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-5 h-5 text-[#B89555]" />
          <h3 className="font-semibold text-foreground">Company Email (jbj.ae)</h3>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Resend API is active for all company email addresses (@jbj.ae). Emails are sent through verified domain with full deliverability.
        </p>
        <div className="flex items-center gap-2 bg-[#FDFBF7]/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
          <Zap className="w-4 h-4 text-emerald-500" />
          <span className="text-xs text-muted-foreground">Domain verified: <strong className="text-foreground">jbj.ae</strong></span>
        </div>
      </div>

      {/* Personal Email Setup */}
      <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] rounded-xl border-2 border-[#B89555]/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <User className="w-5 h-5 text-[#B89555]" />
          <h3 className="font-semibold text-foreground">Personal Email</h3>
          {personalKeyStatus === "loading" ? (
            <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Checking…
            </Badge>
          ) : (
            <Badge className={
              personalKeyConnected
                ? "bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]"
                : personalKeyStatus === "invalid"
                  ? "bg-red-100 text-red-700 border-red-300 text-[10px]"
                  : "bg-amber-100 text-amber-700 border-amber-300 text-[10px]"
            }>
              {personalKeyConnected ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> API Connected</>
              ) : personalKeyStatus === "invalid" ? (
                <><AlertCircle className="w-3 h-3 mr-1" /> Invalid Key</>
              ) : (
                <><AlertCircle className="w-3 h-3 mr-1" /> Normal Mode</>
              )}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {personalKeyConnected
            ? "Personal emails are sent via Resend API with full tracking and deliverability."
            : personalKeyStatus === "invalid"
              ? "The stored API key failed validation. Please enter a new valid key."
              : "Personal emails are sent in normal mode. Connect your personal Resend API key to enable API delivery with tracking."
          }
        </p>

        {!personalKeyConnected && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Personal Resend API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <PasswordInput
                    placeholder="re_xxxxxxxxxxxx"
                    value={personalApiKey}
                    onChange={(e) => setPersonalApiKey(e.target.value)}
                    className="pl-9"
                    visibilityLabel="API key"
                  />
                </div>
                <Button
                  onClick={savePersonalApiKey}
                  disabled={isSaving || !personalApiKey.trim()}
                  className="bg-gradient-to-r from-[#B89555] to-[#A68444] hover:from-[#A68444] hover:to-[#957539] text-white"
                >
                  {isSaving ? "Validating…" : "Submit"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#B89555] underline">resend.com/api-keys</a>. 
                Your key is securely stored and never exposed client-side.
              </p>
            </div>
          </div>
        )}

        {personalKeyConnected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-[#FDFBF7]/70 rounded-lg border border-emerald-200 px-3 py-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">
                API key securely stored · Full delivery tracking enabled
                {lastVerified && (
                  <> · Verified {new Date(lastVerified).toLocaleDateString("en-AE", { dateStyle: "medium" })}</>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setPersonalKeyStatus("missing"); }}
                className="text-xs border-[#B89555]/30 text-[#B89555]"
              >
                <Key className="w-3 h-3 mr-1" /> Update Key
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removePersonalKey}
                disabled={isRemoving}
                className="text-xs border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" /> {isRemoving ? "Removing…" : "Remove Key"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Send Defaults */}
      <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] rounded-xl border-2 border-[#B89555]/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Mail className="w-5 h-5 text-[#B89555]" />
          <h3 className="font-semibold text-foreground">Default Send Preferences</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-foreground">Company: Use Resend API by default</Label>
              <p className="text-[10px] text-muted-foreground">Toggle off to send normally</p>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-foreground">Personal: Use Resend API by default</Label>
              <p className="text-[10px] text-muted-foreground">
                {personalKeyConnected ? "API key connected" : "Requires API key to enable"}
              </p>
            </div>
            <Switch defaultChecked={false} disabled={!personalKeyConnected} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettingsPanel;
