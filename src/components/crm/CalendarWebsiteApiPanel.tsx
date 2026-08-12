import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";

type ApiClient = { id: string; name: string; key_prefix: string; permissions: string[]; allowed_origins: string[]; is_active: boolean; last_used_at: string | null; created_at: string };

export default function CalendarWebsiteApiPanel() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [endpoint, setEndpoint] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [read, setRead] = useState(true);
  const [write, setWrite] = useState(true);
  const [createdKey, setCreatedKey] = useState("");
  const call = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("owner-calendar-api", { body });
    if (error) throw new Error(error.message);
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as { clients?: ApiClient[]; endpoint?: string; api_key?: string };
  }, []);
  const load = useCallback(async () => { try { const d = await call({ action: "list" }); setClients(d.clients ?? []); setEndpoint(d.endpoint ?? ""); } catch (e) { toast.error((e as Error).message); } }, [call]);
  useEffect(() => { void load(); }, [load]);
  const create = async () => {
    try {
      const d = await call({ action: "create", name, allowed_origins: origin ? [origin.replace(/\/$/, "")] : [], permissions: [read && "events:read", write && "events:write"].filter(Boolean) });
      setCreatedKey(d.api_key ?? ""); setEndpoint(d.endpoint ?? endpoint); await load();
    } catch (e) { toast.error((e as Error).message); }
  };
  const revoke = async (id: string) => { try { await call({ action: "revoke", id }); await load(); toast.success("Website calendar access revoked"); } catch (e) { toast.error((e as Error).message); } };
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast.success("Copied securely"); };
  return <>
    <Card className="border-border/60 bg-card"><CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0"><div><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />Website calendar API</CardTitle><p className="mt-1 text-xs text-muted-foreground">Give each website a separate, revocable connection.</p></div><Button size="sm" variant="outline" onClick={() => { setOpen(true); setCreatedKey(""); setName(""); setOrigin(""); }}><Plus className="mr-2 h-4 w-4" />Connect website</Button></CardHeader>
      <CardContent className="space-y-2">{clients.filter((c) => c.is_active).length === 0 ? <p className="text-sm text-muted-foreground">No websites connected.</p> : clients.filter((c) => c.is_active).map((client) => <div key={client.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/50 p-3"><div className="min-w-0"><p className="font-medium break-words">{client.name}</p><p className="text-xs text-muted-foreground">{client.allowed_origins.join(", ") || "Server access only"} · {client.permissions.map((p) => p.endsWith("read") ? "read" : "write").join(" + ")}</p></div><Button aria-label={`Revoke ${client.name}`} size="icon" variant="ghost" onClick={() => revoke(client.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent>
    </Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Connect another website calendar</DialogTitle></DialogHeader>{createdKey ? <div className="space-y-4"><p className="text-sm">Copy this key now. For security, it will not be shown again.</p><div className="flex gap-2"><Input readOnly value={createdKey} className="font-mono text-xs" /><Button size="icon" variant="outline" onClick={() => copy(createdKey)}><Copy className="h-4 w-4" /></Button></div><div><p className="mb-1 text-xs font-medium">Calendar endpoint</p><div className="flex gap-2"><Input readOnly value={endpoint} className="font-mono text-xs" /><Button size="icon" variant="outline" onClick={() => copy(endpoint)}><Copy className="h-4 w-4" /></Button></div></div></div> : <div className="space-y-4"><div><label className="mb-1 block text-sm font-medium">Website name</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Personal website" /></div><div><label className="mb-1 block text-sm font-medium">Allowed website origin</label><Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="https://example.com" /><p className="mt-1 text-xs text-muted-foreground">Leave empty only for a private server-to-server integration.</p></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={read} onCheckedChange={(v) => setRead(v === true)} />Read calendar events</label><label className="flex items-center gap-2 text-sm"><Checkbox checked={write} onCheckedChange={(v) => setWrite(v === true)} />Create meetings</label></div>}<DialogFooter>{createdKey ? <Button variant="primary" onClick={() => setOpen(false)}>Done</Button> : <Button variant="primary" disabled={!name.trim() || (!read && !write)} onClick={create}><KeyRound className="mr-2 h-4 w-4" />Generate secure key</Button>}</DialogFooter></DialogContent></Dialog>
  </>;
}