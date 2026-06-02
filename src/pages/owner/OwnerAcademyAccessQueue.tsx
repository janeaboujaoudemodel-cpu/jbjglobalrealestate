import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, Mail, Phone, User as UserIcon } from "lucide-react";

interface Req {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  note: string | null;
  requested_item_type: string | null;
  requested_item_title: string | null;
  user_mode: string | null;
  status: string;
  created_at: string;
  decision_note: string | null;
}

export default function OwnerAcademyAccessQueue() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("academy_access_requests")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setItems((data as Req[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const decide = async (r: Req, status: "approved" | "rejected") => {
    setBusy(r.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("academy_access_requests")
        .update({
          status,
          decided_by: user?.id ?? null,
          decided_at: new Date().toISOString(),
          decision_note: notes[r.id] ?? null,
        })
        .eq("id", r.id);
      if (error) throw error;

      if (status === "approved") {
        await supabase.functions.invoke("academy-access-approved-email", {
          body: {
            email: r.email,
            full_name: r.full_name,
            requested_item_title: r.requested_item_title,
            note: notes[r.id] ?? null,
          },
        }).catch(() => {});
      }
      toast.success(status === "approved" ? "Approved & email sent" : "Rejected");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Academy Access Requests</h1>
          <p className="text-[#1A1A1A]/70 mt-1">Brokers requesting access to JBJ Academy content.</p>
        </div>

        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map(t => (
            <Button
              key={t}
              variant={tab === t ? "default" : "outline"}
              onClick={() => setTab(t)}
              className={tab === t ? "jj-cta-dark" : "jj-cta-outline"}
              data-cta
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-[#1A1A1A]/60">No {tab} requests.</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {items.map(r => (
              <Card key={r.id} className="border-[#B89555]/30">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />{r.full_name}
                    </CardTitle>
                    <div className="text-sm text-[#1A1A1A]/70 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.email}</span>
                      {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>}
                      {r.user_mode && <Badge variant="outline">{r.user_mode}</Badge>}
                    </div>
                  </div>
                  <Badge>{new Date(r.created_at).toLocaleDateString()}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {r.requested_item_title && (
                    <div className="text-sm">
                      <span className="font-semibold">Requested:</span> {r.requested_item_title}
                      {r.requested_item_type && <span className="text-[#1A1A1A]/60"> ({r.requested_item_type})</span>}
                    </div>
                  )}
                  {r.note && (
                    <div className="text-sm bg-[#F7F2EA] rounded-lg p-3 text-[#1A1A1A]">
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/60 mb-1">Note</div>
                      {r.note}
                    </div>
                  )}
                  {tab === "pending" && (
                    <>
                      <Textarea
                        placeholder="Optional decision note (sent in email)"
                        value={notes[r.id] ?? ""}
                        onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() => decide(r, "rejected")}
                          disabled={busy === r.id}
                          variant="outline"
                          className="jj-cta-outline"
                          data-cta
                        >
                          <XCircle className="w-4 h-4 mr-2" />Reject
                        </Button>
                        <Button
                          onClick={() => decide(r, "approved")}
                          disabled={busy === r.id}
                          className="jj-cta-dark"
                          data-cta
                        >
                          {busy === r.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                          Approve & email
                        </Button>
                      </div>
                    </>
                  )}
                  {r.decision_note && tab !== "pending" && (
                    <div className="text-xs text-[#1A1A1A]/60 italic">Note: {r.decision_note}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
