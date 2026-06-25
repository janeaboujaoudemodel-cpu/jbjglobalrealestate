import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { Archive, Search, Download, FileSignature, Stamp, Upload, Sparkles, FileText, Building2, Users, Home, FileCheck, Megaphone, Lock, Briefcase, Folder, Pencil } from "lucide-react";
import { AgreementUploadDrawer } from "@/components/owner/contracts/AgreementUploadDrawer";
import { AgreementEditDrawer } from "@/components/owner/contracts/AgreementEditDrawer";
import { openAgreement } from "@/lib/contracts/agreementUrl";
import { toast } from "sonner";
import DeveloperSelectDropdown from "@/components/developer-portal/DeveloperSelectDropdown";

interface SignedRow {
  signed_document_id: string;
  envelope_id: string;
  envelope_name: string;
  envelope_status: string;
  document_url: string;
  document_filename: string;
  signed_at: string;
  primary_recipient_name: string | null;
  primary_recipient_email: string | null;
  developer_id: string | null;
  developer_name: string | null;
  contract_type: string | null;
  emirate: string | null;
  area: string | null;
}

type ContractType =
  | "all"
  | "developer_registration"
  | "developer_agency"
  | "client_sales"
  | "client_reservation"
  | "leasing"
  | "advertising"
  | "nda"
  | "service"
  | "other";

const TYPES: { key: ContractType; label: string; icon: typeof Folder; description: string }[] = [
  { key: "all", label: "All Contracts", icon: Folder, description: "Every signed agreement" },
  { key: "developer_registration", label: "Developer Registration", icon: Building2, description: "Brokerage ↔ Developer registration" },
  { key: "developer_agency", label: "Developer ↔ Agency (A↔A)", icon: Users, description: "Agency-to-agency cooperation" },
  { key: "client_sales", label: "Client Sales Contracts", icon: FileSignature, description: "Sales & purchase agreements" },
  { key: "client_reservation", label: "Reservation / Booking", icon: FileCheck, description: "Client reservation forms" },
  { key: "leasing", label: "Leasing Contracts", icon: Home, description: "Tenancy / Ejari contracts" },
  { key: "advertising", label: "Property Advertising", icon: Megaphone, description: "Listing & marketing permits" },
  { key: "nda", label: "NDAs", icon: Lock, description: "Confidentiality agreements" },
  { key: "service", label: "Service / Consulting", icon: Briefcase, description: "Service & vendor agreements" },
  { key: "other", label: "Other", icon: FileText, description: "Uncategorised" },
];

// Infer a contract type when the row has no explicit contract_type column.
function inferType(raw: any): ContractType {
  const explicit = (raw?.contract_type || "").toString().toLowerCase();
  if (explicit) {
    if (explicit.includes("registration")) return "developer_registration";
    if (explicit.includes("a2a") || explicit.includes("agency")) return "developer_agency";
    if (explicit.includes("sales") || explicit.includes("spa")) return "client_sales";
    if (explicit.includes("reserv") || explicit.includes("booking")) return "client_reservation";
    if (explicit.includes("lease") || explicit.includes("ejari") || explicit.includes("tenancy")) return "leasing";
    if (explicit.includes("advert") || explicit.includes("marketing") || explicit.includes("listing")) return "advertising";
    if (explicit.includes("nda") || explicit.includes("confidential")) return "nda";
    if (explicit.includes("service") || explicit.includes("consult")) return "service";
  }
  const name = `${raw?.envelope_name || raw?.file_name || ""}`.toLowerCase();
  if (name.includes("registration")) return "developer_registration";
  if (name.includes("a2a") || name.includes("agency")) return "developer_agency";
  if (name.includes("lease") || name.includes("ejari") || name.includes("tenancy")) return "leasing";
  if (name.includes("nda")) return "nda";
  if (name.includes("advert") || name.includes("listing")) return "advertising";
  if (name.includes("reserv") || name.includes("booking")) return "client_reservation";
  if (name.includes("sales") || name.includes("spa") || name.includes("purchase")) return "client_sales";
  if (name.includes("service") || name.includes("consult")) return "service";
  return "other";
}

export default function ContractVault() {
  const [q, setQ] = useState("");
  const [developerName, setDeveloperName] = useState<string>("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [activeType, setActiveType] = useState<ContractType>("all");

  const { data: agreements = [] } = useQuery({
    queryKey: ["external_agreements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_agreements" as any)
        .select("id, developer_id, developer_name_raw, contract_type, file_url, file_path, file_name, effective_date, expiry_date, commission_pct, ai_confidence, status, uploaded_at, deleted_at")
        .is("deleted_at", null)
        .order("uploaded_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["signed_contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signed_contracts_index" as any)
        .select("*")
        .order("signed_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as SignedRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Resolve picked developer name → canonical developer id (for both filters).
  const { data: devLookup } = useQuery({
    queryKey: ["developers-id-by-name"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("developers").select("id, name").limit(2000);
      const map = new Map<string, string>();
      (data ?? []).forEach((d: any) => map.set((d.name || "").toLowerCase(), d.id));
      return map;
    },
  });
  const devLower = developerName.trim().toLowerCase();
  const selectedDeveloperId = devLower ? devLookup?.get(devLower) ?? null : null;

  // Counts per type for sidebar badges (combine both sources)
  const typeCounts = useMemo(() => {
    const counts: Record<ContractType, number> = {
      all: 0,
      developer_registration: 0,
      developer_agency: 0,
      client_sales: 0,
      client_reservation: 0,
      leasing: 0,
      advertising: 0,
      nda: 0,
      service: 0,
      other: 0,
    };
    [...agreements, ...data].forEach((row: any) => {
      const t = inferType(row);
      counts[t] += 1;
      counts.all += 1;
    });
    return counts;
  }, [agreements, data]);

  const filteredAgreements = useMemo(() => {
    return agreements.filter((a) => {
      if (activeType !== "all" && inferType(a) !== activeType) return false;
      if (devLower) {
        // Prefer canonical developer_id; fall back to raw name match for legacy rows.
        if (selectedDeveloperId) {
          if (a.developer_id !== selectedDeveloperId) return false;
        } else if ((a.developer_name_raw || "").toLowerCase() !== devLower) {
          return false;
        }
      }
      return true;
    });
  }, [agreements, devLower, selectedDeveloperId, activeType]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.filter((r) => {
      if (activeType !== "all" && inferType(r) !== activeType) return false;
      if (devLower) {
        if (selectedDeveloperId) {
          if (r.developer_id !== selectedDeveloperId) return false;
        } else if ((r.developer_name || "").toLowerCase() !== devLower) {
          return false;
        }
      }
      if (!term) return true;
      return (
        r.envelope_name?.toLowerCase().includes(term) ||
        r.developer_name?.toLowerCase().includes(term) ||
        r.primary_recipient_name?.toLowerCase().includes(term) ||
        r.primary_recipient_email?.toLowerCase().includes(term) ||
        r.area?.toLowerCase().includes(term)
      );
    });
  }, [data, q, devLower, selectedDeveloperId, activeType]);

  const handleOpen = async (row: { file_path?: string | null; file_url?: string | null }) => {
    try { await openAgreement(row); }
    catch (e: any) { toast.error(e.message || "Could not open file"); }
  };


  // Show developer combobox only for types where it makes sense
  const showDeveloperPicker =
    activeType === "all" ||
    activeType === "developer_registration" ||
    activeType === "developer_agency" ||
    activeType === "advertising";

  return (
    <div className="p-6 space-y-6 bg-[#FDFBF7] min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <IconTile icon={Archive} tone="gold" />
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Contract Vault</h1>
            <p className="text-sm text-[#1A1A1A]/70">Every signed contract — filed by type, searchable by developer, area, recipient.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setUploadOpen(true)} variant="gold">
            <Upload className="h-4 w-4 mr-2" />
            Upload Agreement
          </Button>
          <Button asChild variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
            <Link to="/owner/sign">
              <Stamp className="h-4 w-4 mr-2" />
              Manage signature & stamp
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Type sidebar */}
        <Card className="bg-[#F7F2EA] border-[#B89555]/20 h-fit lg:sticky lg:top-[104px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#1A1A1A] text-sm uppercase tracking-wider font-bold">
              Contract Types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="flex flex-col gap-1">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const active = activeType === t.key;
                const count = typeCounts[t.key];
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      setActiveType(t.key);
                      // Clicking "All Contracts" also clears search + developer
                      // so the user sees a deliberate state reset instead of
                      // a click that appears to do nothing when already on All.
                      if (t.key === "all") {
                        setQ("");
                        setDeveloperName("");
                      }
                    }}
                    className={
                      "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border " +
                      (active
                        ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555] font-semibold"
                        : "bg-transparent text-[#1A1A1A]/80 border-transparent hover:bg-[#EFE6D6]/60")
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{t.label}</span>
                    {count > 0 && (
                      <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] text-[10px] h-5 px-1.5">
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Filters */}
          <Card className="bg-[#F7F2EA] border-[#B89555]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#1A1A1A] text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[hsl(var(--gold))]" />
                {TYPES.find((t) => t.key === activeType)?.label}
                <span className="text-xs font-normal text-[#1A1A1A]/60 ml-2">
                  {TYPES.find((t) => t.key === activeType)?.description}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/50" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search developer, area, recipient…"
                  className="pl-9 bg-[#FDFBF7] border-[#B89555]/25 text-[#1A1A1A]"
                />
              </div>
              {showDeveloperPicker && (
                <div className="min-w-[260px]">
                  <DeveloperSelectDropdown
                    value={developerName}
                    onChange={setDeveloperName}
                    placeholder="All developers"
                  />
                </div>
              )}
              {developerName && (
                <Button variant="outline" size="sm" className="border-[#B89555]/40 text-[#1A1A1A]" onClick={() => setDeveloperName("")}>
                  Clear
                </Button>
              )}
              <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                {filtered.length + filteredAgreements.length} match{(filtered.length + filteredAgreements.length) === 1 ? "" : "es"}
              </Badge>
            </CardContent>
          </Card>

          {/* External agreements (uploaded developer contracts) */}
          {filteredAgreements.length > 0 && (
            <Card className="bg-[#F7F2EA] border-[#B89555]/20">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-[#1A1A1A] text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[hsl(var(--gold))]" />
                  Uploaded Agreements
                  <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] ml-2">
                    {filteredAgreements.length}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-[#1A1A1A]/60">AI-matched, filed by type</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Developer</th>
                        <th className="text-left px-4 py-3 font-semibold">Type</th>
                        <th className="text-left px-4 py-3 font-semibold">Effective</th>
                        <th className="text-left px-4 py-3 font-semibold">Expires</th>
                        <th className="text-left px-4 py-3 font-semibold">Status</th>
                        <th className="text-right px-4 py-3 font-semibold">File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgreements.map((a) => (
                        <tr key={a.id} className="border-t border-[#B89555]/15 hover:bg-[#FDFBF7]">
                          <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                            {a.developer_name_raw ?? "—"}
                            {a.ai_confidence != null && (
                              <span className="ml-2 text-[10px] text-[#1A1A1A]/50">
                                {Math.round(a.ai_confidence * 100)}%
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">{a.contract_type ?? "—"}</td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">{a.effective_date ?? "—"}</td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">{a.expiry_date ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={a.status === "filed" ? "border-[color:var(--emerald-1)]/30/40 text-[color:var(--emerald-1)]" : "border-amber-500/50 text-amber-700"}>
                              {a.status?.replace("_", " ") ?? "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleOpen(a)} className="border-[#B89555]/40 text-[#1A1A1A]">
                                <Download className="h-3 w-3 mr-1" />
                                Open
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditing(a)} className="border-[#B89555]/40 text-[#1A1A1A]">
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signed contracts */}
          <Card className="bg-[#F7F2EA] border-[#B89555]/20">
            <CardContent className="p-0">
              {isLoading && <p className="p-6 text-sm text-[#1A1A1A]/60">Loading…</p>}
              {!isLoading && filtered.length === 0 && filteredAgreements.length === 0 && (
                <div className="p-12 text-center space-y-4">
                  <FileSignature className="h-10 w-10 mx-auto text-[#1A1A1A]/30" />
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">
                      No contracts in <strong>{TYPES.find((t) => t.key === activeType)?.label}</strong> yet.
                    </p>
                    <p className="text-xs text-[#1A1A1A]/60 mt-1">
                      {activeType === "all"
                        ? "Upload a developer agreement or send a contract for signature to start filling this vault."
                        : "Try a different contract type, or upload an agreement classified under this category."}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Button variant="gold" size="sm" onClick={() => setUploadOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Agreement
                    </Button>
                    {activeType !== "all" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#B89555]/40 text-[#1A1A1A]"
                        onClick={() => { setActiveType("all"); setQ(""); setDeveloperName(""); }}
                      >
                        Show all contracts
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {filtered.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Document</th>
                        <th className="text-left px-4 py-3 font-semibold">Developer / Recipient</th>
                        <th className="text-left px-4 py-3 font-semibold">Emirate</th>
                        <th className="text-left px-4 py-3 font-semibold">Area</th>
                        <th className="text-left px-4 py-3 font-semibold">Signed</th>
                        <th className="text-right px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => (
                        <tr key={row.signed_document_id} className="border-t border-[#B89555]/15 hover:bg-[#FDFBF7]">
                          <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                            {row.envelope_name}
                            <div className="text-xs text-[#1A1A1A]/60">{row.document_filename}</div>
                          </td>
                          <td className="px-4 py-3 text-[#1A1A1A]">
                            {row.developer_name ?? row.primary_recipient_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">{row.emirate ?? "—"}</td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">{row.area ?? "—"}</td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">
                            {new Date(row.signed_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button asChild size="sm" variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                                <a href={row.document_url} target="_blank" rel="noreferrer">
                                  <Download className="h-3 w-3 mr-1" />
                                  Open
                                </a>
                              </Button>
                              <Button asChild size="sm" variant="gold">
                                <Link to={`/owner/documents/forms/${row.envelope_id}`}>
                                  <Stamp className="h-3 w-3 mr-1" />
                                  Re-send
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AgreementUploadDrawer open={uploadOpen} onOpenChange={setUploadOpen} />
      <AgreementEditDrawer open={!!editing} onOpenChange={(o) => !o && setEditing(null)} agreement={editing} />
    </div>
  );
}
