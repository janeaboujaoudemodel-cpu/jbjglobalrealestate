import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Key, CheckCircle2, AlertCircle, Zap, Shield, Mail, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailSettingsPanelProps {
  onClose?: () => void;
}

const EmailSettingsPanel = ({ onClose }: EmailSettingsPanelProps) => {
  const [personalApiKey, setPersonalApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [personalKeyConnected, setPersonalKeyConnected] = useState(false);

  const savePersonalApiKey = async () => {
    if (!personalApiKey.trim() || !personalApiKey.startsWith("re_")) {
      toast.error("Please enter a valid Resend API key (starts with re_)");
      return;
    }
    setIsSaving(true);
    try {
      // Store via edge function that saves to vault
      const { error } = await supabase.functions.invoke("send-owner-email", {
        body: {
          action: "save_personal_key",
          apiKey: personalApiKey.trim(),
        },
      });
      if (error) throw error;
      setPersonalKeyConnected(true);
      setPersonalApiKey("");
      toast.success("Personal Resend API key connected successfully! Personal emails will now use the API.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Email Status */}
      <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] rounded-xl border-2 border-[#C9A84C]/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-5 h-5 text-[#C9A84C]" />
          <h3 className="font-semibold text-black">Company Email (jbj.ae)</h3>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
          </Badge>
        </div>
        <p className="text-sm text-black/60 mb-2">
          Resend API is active for all company email addresses (@jbj.ae). Emails are sent through verified domain with full deliverability.
        </p>
        <div className="flex items-center gap-2 bg-white/70 rounded-lg border border-[#C9A84C]/15 px-3 py-2">
          <Zap className="w-4 h-4 text-emerald-500" />
          <span className="text-xs text-black/70">Domain verified: <strong>jbj.ae</strong></span>
        </div>
      </div>

      {/* Personal Email Setup */}
      <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] rounded-xl border-2 border-[#C9A84C]/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <User className="w-5 h-5 text-[#C9A84C]" />
          <h3 className="font-semibold text-black">Personal Email</h3>
          <Badge className={personalKeyConnected
            ? "bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]"
            : "bg-amber-100 text-amber-700 border-amber-300 text-[10px]"
          }>
            {personalKeyConnected ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> API Connected</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" /> Normal Mode</>
            )}
          </Badge>
        </div>
        <p className="text-sm text-black/60 mb-4">
          {personalKeyConnected
            ? "Personal emails are being sent via Resend API with full tracking and deliverability."
            : "Personal emails are sent in normal mode. Connect your personal Resend API key to enable API delivery with tracking."
          }
        </p>

        {!personalKeyConnected && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-black mb-1.5 block">Personal Resend API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <Input
                    type="password"
                    placeholder="re_xxxxxxxxxxxx"
                    value={personalApiKey}
                    onChange={(e) => setPersonalApiKey(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={savePersonalApiKey}
                  disabled={isSaving || !personalApiKey.trim()}
                  className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:from-[#B8973F] hover:to-[#A78636] text-white"
                >
                  {isSaving ? "Saving…" : "Submit"}
                </Button>
              </div>
              <p className="text-[10px] text-black/40 mt-1.5">
                Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] underline">resend.com/api-keys</a>. 
                Your key is securely stored and never exposed client-side.
              </p>
            </div>
          </div>
        )}

        {personalKeyConnected && (
          <div className="flex items-center gap-2 bg-white/70 rounded-lg border border-emerald-200 px-3 py-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-black/70">API key securely stored · Full delivery tracking enabled</span>
          </div>
        )}
      </div>

      {/* Send Defaults */}
      <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] rounded-xl border-2 border-[#C9A84C]/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Mail className="w-5 h-5 text-[#C9A84C]" />
          <h3 className="font-semibold text-black">Default Send Preferences</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-black">Company: Use Resend API by default</Label>
              <p className="text-[10px] text-black/40">Toggle off to send normally</p>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-black">Personal: Use Resend API by default</Label>
              <p className="text-[10px] text-black/40">{personalKeyConnected ? "API key connected" : "Requires API key to enable"}</p>
            </div>
            <Switch defaultChecked={false} disabled={!personalKeyConnected} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettingsPanel;
