import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface IncompleteLead {
  id: string;
  full_name: string | null;
  email_lower: string | null;
  phone_e164: string | null;
  upload_source: string | null;
  created_at: string;
  missing: string[];
}
interface IncompletePortfolio {
  id: string;
  client_name: string | null;
  project_name: string | null;
  unit_number: string | null;
  purchase_price: number | null;
  created_at: string;
  missing: string[];
}
interface Report {
  ranAt: string;
  leads: { total: number; complete: number; incomplete: IncompleteLead[] };
  portfolios: { total: number; complete: number; incomplete: IncompletePortfolio[] };
}

const PAGE = 1000;

async function fetchAll<T>(table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  // page through up to ~50k rows defensively
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from(table as any)
      .select(columns)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data as unknown as T[]) ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  return true;
}

export default function DataIntegrityCheck() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const runCheck = async () => {
    setRunning(true);
    try {
      const [leads, portfolios] = await Promise.all([
        fetchAll<any>(
          "crm_leads",
          "id, full_name, email_lower, phone_e164, upload_source, created_at",
        ),
        fetchAll<any>(
          "client_investors",
          "id, client_name, project_name, project_id, unit_number, purchase_price, created_at",
        ),
      ]);

      const incompleteLeads: IncompleteLead[] = [];
      let leadsComplete = 0;
      for (const r of leads) {
        const missing: string[] = [];
        if (!isFilled(r.full_name)) missing.push("name");
        if (!isFilled(r.email_lower) && !isFilled(r.phone_e164))
          missing.push("email or phone");
        if (missing.length === 0) leadsComplete++;
        else incompleteLeads.push({ ...r, missing });
      }

      const incompletePortfolios: IncompletePortfolio[] = [];
      let portfoliosComplete = 0;
      for (const r of portfolios) {
        const missing: string[] = [];
        if (!isFilled(r.client_name)) missing.push("client name");
        if (!isFilled(r.project_name) && !isFilled(r.project_id))
          missing.push("project");
        if (missing.length === 0) portfoliosComplete++;
        else incompletePortfolios.push({ ...r, missing });
      }

      setReport({
        ranAt: new Date().toISOString(),
        leads: {
          total: leads.length,
          complete: leadsComplete,
          incomplete: incompleteLeads.slice(0, 200),
        },
        portfolios: {
          total: portfolios.length,
          complete: portfoliosComplete,
          incomplete: incompletePortfolios.slice(0, 200),
        },
      });
      toast.success("Integrity check complete");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Integrity check failed");
    } finally {
      setRunning(false);
    }
  };

  const pct = (a: number, b: number) =>
    b === 0 ? 100 : Math.round((a / b) * 1000) / 10;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px] px-6 pb-12">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">
              Data Integrity Check
            </h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              Verifies that CRM leads and investor portfolios are fully populated
              after upload and sync.
            </p>
          </div>
          <Button onClick={runCheck} disabled={running} variant="gold">
            {running ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" /> Run check
              </>
            )}
          </Button>
        </div>

        {!report && !running && (
          <Card className="p-12 text-center bg-[#F7F2EA] border-[#B89555]/20">
            <p className="text-[#1A1A1A]/70">
              Click <strong>Run check</strong> to scan all CRM leads and investor
              portfolios.
            </p>
          </Card>
        )}

        {report && (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SummaryCard
                title="CRM Leads"
                total={report.leads.total}
                complete={report.leads.complete}
                pct={pct(report.leads.complete, report.leads.total)}
                rule="Required: name + (email or phone)"
              />
              <SummaryCard
                title="Investor Portfolios"
                total={report.portfolios.total}
                complete={report.portfolios.complete}
                pct={pct(report.portfolios.complete, report.portfolios.total)}
                rule="Required: client name + project"
              />
            </div>

            <IncompleteSection
              title="Incomplete leads"
              count={report.leads.incomplete.length}
              empty="All leads have the required data."
            >
              {report.leads.incomplete.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Missing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.leads.incomplete.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.full_name || "—"}</TableCell>
                        <TableCell>{r.email_lower || "—"}</TableCell>
                        <TableCell>{r.phone_e164 || "—"}</TableCell>
                        <TableCell>{r.upload_source || "—"}</TableCell>
                        <TableCell>
                          {r.missing.map((m) => (
                            <Badge
                              key={m}
                              variant="outline"
                              className="mr-1 border-red-500/40 text-red-700"
                            >
                              {m}
                            </Badge>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </IncompleteSection>

            <IncompleteSection
              title="Incomplete portfolios"
              count={report.portfolios.incomplete.length}
              empty="All portfolios have the required data."
            >
              {report.portfolios.incomplete.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Missing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.portfolios.incomplete.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.client_name || "—"}</TableCell>
                        <TableCell>{r.project_name || "—"}</TableCell>
                        <TableCell>{r.unit_number || "—"}</TableCell>
                        <TableCell>
                          {r.purchase_price ? r.purchase_price.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell>
                          {r.missing.map((m) => (
                            <Badge
                              key={m}
                              variant="outline"
                              className="mr-1 border-red-500/40 text-red-700"
                            >
                              {m}
                            </Badge>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </IncompleteSection>

            <p className="text-xs text-[#1A1A1A]/60 text-right">
              Last run: {new Date(report.ranAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title, total, complete, pct, rule,
}: {
  title: string; total: number; complete: number; pct: number; rule: string;
}) {
  const allGood = complete === total;
  return (
    <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#1A1A1A]/60">
            {title}
          </p>
          <p className="text-3xl font-semibold text-[#1A1A1A] mt-1">
            {complete}
            <span className="text-base text-[#1A1A1A]/60"> / {total}</span>
          </p>
          <p className="text-xs text-[#1A1A1A]/70 mt-2">{rule}</p>
        </div>
        {allGood ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        )}
      </div>
      <div className="mt-3 h-2 rounded-full bg-[#EFE6D6] overflow-hidden">
        <div
          className={`h-full ${allGood ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-[#1A1A1A]/70 mt-2">{pct}% complete</p>
    </Card>
  );
}

function IncompleteSection({
  title, count, empty, children,
}: {
  title: string; count: number; empty: string; children: React.ReactNode;
}) {
  return (
    <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">{title}</h2>
        <Badge variant="outline" className="border-[#B89555]/40">
          {count}
        </Badge>
      </div>
      {count === 0 ? (
        <p className="text-sm text-[#1A1A1A]/70">{empty}</p>
      ) : (
        children
      )}
    </Card>
  );
}
