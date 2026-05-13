/**
 * HostingerCredentialDialog — Collects IMAP/SMTP credentials for Hostinger Webmail.
 * Triggered by the custom "comm:open-hostinger-dialog" event from ChannelGrid.
 */
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Server, ShieldCheck, AlertTriangle } from "lucide-react";

interface HostingerForm {
  email: string;
  password: string;
  imap_host: string;
  imap_port: string;
  smtp_host: string;
  smtp_port: string;
  use_defaults: boolean;
}

const DEFAULT_HOSTINGER_EMAIL = "contact@jbj.ae";
const SAVED_PASSWORD_SENTINEL = "__USE_SAVED_HOSTINGER_SECRET__";

const DEFAULTS = {
  imap_host: "imap.hostinger.com",
  imap_port: "993",
  smtp_host: "smtp.hostinger.com",
  smtp_port: "465",
};

export default function HostingerCredentialDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState<HostingerForm>({
    email: DEFAULT_HOSTINGER_EMAIL,
    password: SAVED_PASSWORD_SENTINEL,
    imap_host: DEFAULTS.imap_host,
    imap_port: DEFAULTS.imap_port,
    smtp_host: DEFAULTS.smtp_host,
    smtp_port: DEFAULTS.smtp_port,
    use_defaults: true,
  });

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("comm:open-hostinger-dialog", handler);
    return () => window.removeEventListener("comm:open-hostinger-dialog", handler);
  }, []);

  const update = (field: keyof HostingerForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleDefaults = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      use_defaults: checked,
      imap_host: checked ? DEFAULTS.imap_host : prev.imap_host,
      imap_port: checked ? DEFAULTS.imap_port : prev.imap_port,
      smtp_host: checked ? DEFAULTS.smtp_host : prev.smtp_host,
      smtp_port: checked ? DEFAULTS.smtp_port : prev.smtp_port,
    }));
  };

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("comm-hostinger-connect", {
        body: {
          email: form.email.trim(),
          password: form.password,
          imap_host: form.imap_host,
          imap_port: parseInt(form.imap_port, 10),
          smtp_host: form.smtp_host,
          smtp_port: parseInt(form.smtp_port, 10),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(
        data?.used_saved_credential
          ? `Hostinger email connected with the saved mailbox credential: ${data.email}`
          : `Hostinger email connected: ${data.email}`
      );
      setOpen(false);
      setForm({
        email: DEFAULT_HOSTINGER_EMAIL,
        password: SAVED_PASSWORD_SENTINEL,
        imap_host: DEFAULTS.imap_host,
        imap_port: DEFAULTS.imap_port,
        smtp_host: DEFAULTS.smtp_host,
        smtp_port: DEFAULTS.smtp_port,
        use_defaults: true,
      });
    } catch (e: any) {
      toast.error(e.message || "Connection failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg border-2 border-[#B89555]/30 bg-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Mail className="h-5 w-5 text-[#B89555]" />
            Connect Hostinger Webmail
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Enter your Hostinger email credentials. We use them to send and receive emails through the Comm Hub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="h-email">Email address</Label>
            <Input
              id="h-email"
              type="email"
              placeholder="jane@jbj.ae"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="border-[#B89555]/30 bg-[#F7F2EA]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="h-password">App password or email password</Label>
            <Input
              id="h-password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onFocus={() => {
                if (form.password === SAVED_PASSWORD_SENTINEL) update("password", "");
              }}
              onChange={(e) => update("password", e.target.value)}
              className="border-[#B89555]/30 bg-[#F7F2EA]"
            />
            <p className="text-xs text-[#1A1A1A]/50">
              For security, use an app-specific password if Hostinger supports it.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Switch
              id="h-defaults"
              checked={form.use_defaults}
              onCheckedChange={handleToggleDefaults}
            />
            <Label htmlFor="h-defaults" className="text-sm cursor-pointer">
              Use Hostinger default server settings
            </Label>
          </div>

          {!form.use_defaults && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-[#B89555]/20 bg-[#F7F2EA]/50">
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs">
                  <Server className="h-3 w-3" /> IMAP host
                </Label>
                <Input
                  value={form.imap_host}
                  onChange={(e) => update("imap_host", e.target.value)}
                  className="border-[#B89555]/30 bg-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">IMAP port</Label>
                <Input
                  value={form.imap_port}
                  onChange={(e) => update("imap_port", e.target.value)}
                  className="border-[#B89555]/30 bg-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs">
                  <Server className="h-3 w-3" /> SMTP host
                </Label>
                <Input
                  value={form.smtp_host}
                  onChange={(e) => update("smtp_host", e.target.value)}
                  className="border-[#B89555]/30 bg-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">SMTP port</Label>
                <Input
                  value={form.smtp_port}
                  onChange={(e) => update("smtp_port", e.target.value)}
                  className="border-[#B89555]/30 bg-white text-sm"
                />
              </div>
            </div>
          )}

          {form.use_defaults && (
            <div className="flex flex-wrap gap-2 text-xs text-[#1A1A1A]/60">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F7F2EA] border border-[#B89555]/20">
                <Server className="h-3 w-3" /> IMAP: {DEFAULTS.imap_host}:{DEFAULTS.imap_port}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F7F2EA] border border-[#B89555]/20">
                <Server className="h-3 w-3" /> SMTP: {DEFAULTS.smtp_host}:{DEFAULTS.smtp_port}
              </span>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Security note</p>
              <p className="text-amber-900/80">
                Your password is encrypted with AES-256-GCM before storage. We never log or expose it in the UI.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={testing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={testing || !form.email.trim() || !form.password.trim()}
            className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing connection…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Connect
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
