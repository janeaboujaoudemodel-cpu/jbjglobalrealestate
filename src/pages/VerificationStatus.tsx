import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Clock,
  XCircle,
  CheckCircle2,
  Copy,
  ArrowRight,
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";

interface Row {
  id: string;
  reference_code: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  full_name: string | null;
  document_type: string | null;
}

const statusMeta: Record<
  string,
  { label: string; icon: any; tone: string; bg: string }
> = {
  pending: {
    label: "Under review",
    icon: Clock,
    tone: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  approved: {
    label: "Verified",
    icon: CheckCircle2,
    tone: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  rejected: {
    label: "Action required",
    icon: XCircle,
    tone: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};

export default function VerificationStatus() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?redirect=/verification");
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("user_verifications")
        .select(
          "id, reference_code, status, submitted_at, reviewed_at, rejection_reason, full_name, document_type"
        )
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });
      if (!active) return;
      if (error) {
        toast({
          title: "Could not load verification",
          description: error.message,
          variant: "destructive",
        });
      }
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, authLoading, navigate, toast]);

  const latest = rows[0];
  const meta = latest ? statusMeta[latest.status] ?? statusMeta.pending : null;
  const Icon = meta?.icon ?? ShieldCheck;

  const copyRef = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Reference code copied" });
    } catch {}
  };

  return (
    <>
      <Helmet>
        <title>Identity Verification Status | JBJ Global Real Estate</title>
        <meta
          name="description"
          content="Track the status of your JBJ Global Real Estate identity verification, view your reference code, and see review history."
        />
        <link rel="canonical" href="/verification" />
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <main className="min-h-[70vh] bg-[#FDFBF7] px-4 sm:px-6 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B89555] mb-2">
              Identity Verification
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
              Your verification status
            </h1>
            <p className="mt-2 text-[#1A1A1A]/70 text-sm md:text-base">
              Bank-grade KYC review by the JBJ compliance desk. Most decisions
              return within 1 business day.
            </p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#B89555]" />
            </div>
          ) : !latest ? (
            <div className="rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA] p-8 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-[#B89555] mb-3" />
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                You haven't started verification yet
              </h2>
              <p className="text-sm text-[#1A1A1A]/70 mt-2 mb-5">
                Verified investors unlock priority access to off-market units,
                developer floors, and concierge tools.
              </p>
              <Button asChild>
                <Link to="/?verify=1">
                  Start verification
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Current status card */}
              <section
                className={`rounded-2xl border ${meta?.bg} p-6 md:p-8 mb-6`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-white border border-[#B89555]/30 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${meta?.tone}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-extrabold text-[#1A1A1A]">
                        {meta?.label}
                      </h2>
                      {latest.reference_code && (
                        <button
                          onClick={() => copyRef(latest.reference_code!)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDFBF7] border border-[#B89555]/40 text-[11px] font-bold tracking-wider text-[#1A1A1A] hover:bg-[#F7F2EA]"
                          title="Copy reference code"
                        >
                          {latest.reference_code}
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[#1A1A1A]/80">
                      {latest.status === "pending" &&
                        "Our compliance team is reviewing your documents. We'll email you the moment a decision is made."}
                      {latest.status === "approved" &&
                        "Your identity is verified. The Verified badge now appears across the JBJ platform."}
                      {latest.status === "rejected" &&
                        (latest.rejection_reason ||
                          "Your submission could not be approved. You may resubmit with updated documents.")}
                    </p>
                    <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex justify-between sm:block">
                        <dt className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider font-semibold">
                          Submitted
                        </dt>
                        <dd className="text-[#1A1A1A] font-medium">
                          {new Date(latest.submitted_at).toLocaleString()}
                        </dd>
                      </div>
                      {latest.reviewed_at && (
                        <div className="flex justify-between sm:block">
                          <dt className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider font-semibold">
                            Reviewed
                          </dt>
                          <dd className="text-[#1A1A1A] font-medium">
                            {new Date(latest.reviewed_at).toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {latest.document_type && (
                        <div className="flex justify-between sm:block">
                          <dt className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider font-semibold">
                            Document
                          </dt>
                          <dd className="text-[#1A1A1A] font-medium capitalize">
                            {latest.document_type.replace(/_/g, " ")}
                          </dd>
                        </div>
                      )}
                      {latest.full_name && (
                        <div className="flex justify-between sm:block">
                          <dt className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider font-semibold">
                            Name on file
                          </dt>
                          <dd className="text-[#1A1A1A] font-medium">
                            {latest.full_name}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {latest.status === "rejected" && (
                      <div className="mt-5">
                        <Button asChild>
                          <Link to="/?verify=1">
                            Resubmit verification
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* History */}
              {rows.length > 1 && (
                <section className="rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA] p-6 md:p-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A1A1A] mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#B89555]" />
                    Submission history
                  </h3>
                  <ul className="divide-y divide-[#B89555]/20">
                    {rows.slice(1).map((r) => {
                      const m = statusMeta[r.status] ?? statusMeta.pending;
                      const RowIcon = m.icon;
                      return (
                        <li key={r.id} className="py-3 flex items-center gap-3">
                          <RowIcon className={`w-4 h-4 ${m.tone}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1A1A1A]">
                              {m.label}
                              {r.reference_code && (
                                <span className="ml-2 text-xs font-mono text-[#1A1A1A]/60">
                                  {r.reference_code}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-[#1A1A1A]/60">
                              {new Date(r.submitted_at).toLocaleDateString()}
                              {r.rejection_reason && ` — ${r.rejection_reason}`}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </>
          )}

          <p className="mt-8 text-xs text-[#1A1A1A]/60 text-center">
            Questions about your submission? Email{" "}
            <a
              href="mailto:compliance@jbj.ae"
              className="underline text-[#1A1A1A]"
            >
              compliance@jbj.ae
            </a>{" "}
            with your reference code.
          </p>
        </div>
      </main>
    </>
  );
}
