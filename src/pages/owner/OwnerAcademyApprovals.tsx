import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Submission {
  id: string;
  user_id: string;
  reflection_text: string;
  status: string;
  validator_passed: boolean;
  validator_report: any;
  required_module_ids: string[];
  created_at: string;
  decision_notes?: string | null;
}

export default function OwnerAcademyApprovals() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("broker_certification_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    else setItems((data as Submission[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("broker_certification_submissions")
      .update({
        status,
        decided_by: user?.id ?? null,
        decided_at: new Date().toISOString(),
        decision_notes: notes[id] ?? null,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Submission ${status}`);
    load();
  };

  return (
    <div data-marketing-page className="min-h-screen bg-[#FDFBF7] p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#1A1A1A]">Academy — Certification Approvals</h1>
          <p className="text-[#1A1A1A]/70 mt-1">
            Review broker certification requests. Approving generates the quiz; rejecting locks the certificate.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <Card><CardContent className="py-10 text-center text-[#1A1A1A]/60">No certification requests yet.</CardContent></Card>
        )}

        <div className="space-y-4">
          {items.map((s) => (
            <Card key={s.id} className="border-[#B89555]/30">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base text-[#1A1A1A]">
                    Broker: <span className="font-mono text-xs">{s.user_id.slice(0, 8)}…</span>
                  </CardTitle>
                  <div className="text-xs text-[#1A1A1A]/60 mt-1">
                    {new Date(s.created_at).toLocaleString()} · {s.required_module_ids?.length ?? 0} modules
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-[#B89555]/40">{s.status}</Badge>
                  {s.validator_passed ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Telemetry OK
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-300">
                      <XCircle className="w-3 h-3 mr-1" /> Telemetry failed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-[#1A1A1A]/80 bg-[#F7F2EA] p-3 rounded-lg whitespace-pre-wrap">
                  {s.reflection_text}
                </div>
                {!s.validator_passed && (
                  <details className="text-xs text-[#1A1A1A]/70">
                    <summary className="cursor-pointer">Validator report</summary>
                    <pre className="mt-2 bg-[#F7F2EA] p-2 rounded overflow-auto">{JSON.stringify(s.validator_report, null, 2)}</pre>
                  </details>
                )}
                {s.status === "pending" && (
                  <>
                    <Textarea
                      placeholder="Decision notes (optional)"
                      value={notes[s.id] ?? ""}
                      onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => decide(s.id, "approved")}
                        className="jj-cta-dark"
                        data-cta="cert-approve"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & generate quiz
                      </Button>
                      <Button
                        onClick={() => decide(s.id, "rejected")}
                        variant="outline"
                        className="jj-cta-outline"
                        data-cta="cert-reject"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </>
                )}
                {s.decision_notes && (
                  <div className="text-xs text-[#1A1A1A]/60 italic">Notes: {s.decision_notes}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
