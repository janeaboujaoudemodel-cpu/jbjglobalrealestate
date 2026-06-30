import { useEffect, useState } from "react";
import { useBrokerOAuthApps, useSaveBrokerOAuthApp, useDeleteBrokerOAuthApp, getOAuthRedirectUri, type OAuthProvider } from "@/hooks/useBrokerOAuthApps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Mail, Shield, ExternalLink, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function BrokerEmailSetup() {
  const apps = useBrokerOAuthApps();
  const save = useSaveBrokerOAuthApp();
  const del = useDeleteBrokerOAuthApp();
  const redirect = getOAuthRedirectUri();
  const [copied, setCopied] = useState(false);

  const gmailApp = apps.data?.find((a) => a.provider === "gmail");
  const outlookApp = apps.data?.find((a) => a.provider === "outlook");

  const copyRedirect = async () => {
    await navigator.clipboard.writeText(redirect);
    setCopied(true);
    toast.success("Redirect URI copied");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto jj-scrollbar-gold">
      <div className="space-y-5 p-4 md:p-6 pb-24">
        {/* Hero — emerald metallic header strip */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[image:var(--jj-emerald-ombre)] p-5 md:p-7 text-white shadow-[0_24px_60px_-30px_rgba(6,78,59,0.65)]"
          data-surface="emerald"
          data-allow-dark-cta
          data-no-contrast-guard
        >
          <div className="absolute inset-0 pointer-events-none opacity-[0.18] [background:radial-gradient(120%_60%_at_0%_0%,#FFFFFF_0%,transparent_55%)]" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/75">JBJ GLOBAL REAL ESTATE</div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white mt-1 flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-white" /> Email Setup
            </h1>
            <p className="text-sm text-white/85 mt-2 max-w-3xl">
              To connect your <strong className="text-white">own</strong> Gmail or Outlook mailbox to JBJ, you create a small OAuth app on
              your Google or Microsoft developer console, then paste the <em>Client ID</em> and <em>Client Secret</em> below.
              Each broker uses their own credentials — JBJ never sees your password.
            </p>

            <div className="mt-4 rounded-lg bg-white/10 border border-white/15 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/80">
                <Shield className="h-3.5 w-3.5 text-white" /> Redirect URI (paste this into Google / Microsoft)
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 text-xs md:text-sm bg-white/95 border border-white/20 rounded px-3 py-2 break-all text-[#1A1A1A]">{redirect}</code>
                <Button
                  size="sm"
                  onClick={copyRedirect}
                  className="jj-surface-emerald allow-white text-white border border-white/30 hover:brightness-110 shrink-0"
                  data-allow-dark-cta
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="gmail" className="space-y-4">
          <TabsList className="h-auto p-1 rounded-xl gap-1">
            <TabsTrigger value="gmail" className="rounded-lg px-5 py-2 text-sm font-semibold">
              Gmail
            </TabsTrigger>
            <TabsTrigger value="outlook" className="rounded-lg px-5 py-2 text-sm font-semibold">
              Outlook
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gmail">
            <ProviderPanel
              provider="gmail"
              title="Connect Gmail (Google Workspace or personal Gmail)"
              existing={gmailApp}
              onSave={(v) => save.mutate(v)}
              onDelete={(id) => del.mutate(id)}
              steps={[
                <>Open the <a className="underline text-[#B89555]" href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">Google Cloud Console <ExternalLink className="inline h-3 w-3" /></a> and create a new project (or use an existing one).</>,
                <>Go to <strong>APIs &amp; Services → Library</strong>, search for <em>Gmail API</em>, and click <strong>Enable</strong>.</>,
                <>Go to <strong>APIs &amp; Services → OAuth consent screen</strong>. Choose <em>External</em>, fill in app name/email, and add yourself as a Test User.</>,
                <>Go to <strong>APIs &amp; Services → Credentials → Create Credentials → OAuth client ID</strong>. Application type: <em>Web application</em>.</>,
                <>Under <strong>Authorized redirect URIs</strong>, paste the redirect URI shown above and save.</>,
                <>Copy the generated <strong>Client ID</strong> and <strong>Client Secret</strong> and paste them below.</>,
              ]}
              saving={save.isPending}
            />
          </TabsContent>

          <TabsContent value="outlook">
            <ProviderPanel
              provider="outlook"
              title="Connect Outlook (Microsoft 365 or personal Outlook.com)"
              existing={outlookApp}
              onSave={(v) => save.mutate(v)}
              onDelete={(id) => del.mutate(id)}
              steps={[
                <>Open <a className="underline text-[#B89555]" href="https://entra.microsoft.com/" target="_blank" rel="noreferrer">Microsoft Entra admin center <ExternalLink className="inline h-3 w-3" /></a> → <strong>App registrations → New registration</strong>.</>,
                <>Name it (e.g. "JBJ Email"), choose <em>Accounts in any organizational directory and personal Microsoft accounts</em>, and set the Redirect URI to <em>Web</em> + paste the URI above.</>,
                <>Open the new app → <strong>Certificates &amp; secrets → New client secret</strong>. Copy the <strong>Value</strong> immediately (you can't see it again).</>,
                <>Go to <strong>API permissions → Add a permission → Microsoft Graph → Delegated</strong>. Add: <code>Mail.ReadWrite</code>, <code>Mail.Send</code>, <code>User.Read</code>, <code>offline_access</code>.</>,
                <>Copy the <strong>Application (client) ID</strong> from the app overview and paste both below.</>,
              ]}
              saving={save.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProviderPanel({
  provider, title, existing, onSave, onDelete, steps, saving,
}: {
  provider: OAuthProvider;
  title: string;
  existing?: { id: string; client_id: string; label: string | null };
  onSave: (v: { provider: OAuthProvider; client_id: string; client_secret: string; label?: string }) => void;
  onDelete: (id: string) => void;
  steps: React.ReactNode[];
  saving: boolean;
}) {
  const [clientId, setClientId] = useState(existing?.client_id ?? "");
  // SECURITY: client_secret is write-only — it is never returned by the API.
  // The field stays empty on edit; supplying a value rewrites the stored secret.
  const [clientSecret, setClientSecret] = useState("");
  const [label, setLabel] = useState(existing?.label ?? "");

  useEffect(() => {
    setClientId(existing?.client_id ?? "");
    setClientSecret("");
    setLabel(existing?.label ?? "");
  }, [existing?.client_id, existing?.label]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) {
      toast.error("Client ID is required");
      return;
    }
    if (!existing && !clientSecret.trim()) {
      toast.error("Client Secret is required");
      return;
    }
    onSave({ provider, client_id: clientId, client_secret: clientSecret, label });
  };

  return (
    <Card className="bg-[#F7F2EA] border border-[#B89555]/25 p-5 md:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Mail className="h-5 w-5" /> {title}
        </h2>
        {existing && (
          <div className="text-xs text-[color:var(--emerald-1)] mt-1">✓ Credentials saved · ready to connect mailboxes</div>
        )}
      </div>

      <div className="rounded-lg bg-white border border-[#B89555]/20 p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 mb-2">Setup steps</div>
        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-[#1A1A1A]/85">
          {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </div>

      <form onSubmit={submit} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${provider}-client-id`}>Client ID</Label>
          <Input id={`${provider}-client-id`} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder={provider === "gmail" ? "xxxx.apps.googleusercontent.com" : "Application (client) ID"} className="bg-white" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${provider}-client-secret`}>Client Secret {existing ? <span className="text-[11px] text-[#1A1A1A]/55">(leave blank to keep current)</span> : null}</Label>
          <Input id={`${provider}-client-secret`} type="password" autoComplete="new-password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder={existing ? "•••••••• (stored — hidden for security)" : "••••••••••••"} className="bg-white" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${provider}-label`}>Label (optional)</Label>
          <Input id={`${provider}-label`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My work Google project" className="bg-white" />
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={saving} className="jj-surface-emerald allow-white text-white hover:-translate-y-0.5 hover:brightness-110" data-surface="emerald">
            {existing ? "Update" : "Save credentials"}
          </Button>
          {existing && (
            <Button type="button" variant="outline" onClick={() => onDelete(existing.id)} className="border-red-300 text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1.5" /> Remove
            </Button>
          )}
        </div>
      </form>

      {existing && (
        <p className="text-xs text-[#1A1A1A]/65">
          Next: go to <strong>Smart Inbox</strong> and click <em>Connect {provider === "gmail" ? "Gmail" : "Outlook"}</em>.
        </p>
      )}
    </Card>
  );
}
