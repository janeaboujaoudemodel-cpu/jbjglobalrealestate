import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileSignature, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  Eye,
  Send,
  MoreVertical,
  Trash2,
  Bell,
  Upload,
  PenTool,
  Scale,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { SUPABASE_URL } from "@/config/backend";
import { computeDisplayStatus, pickClientName, pickPropertyContext, maskPhone, maskEmail, getTemplateKind, getTemplateKindLabel, normaliseBedrooms, buildSearchHaystack, type TemplateKind } from "@/pages/e-signature/envelopeStatus";

type EnvelopeStatus = 'draft' | 'sent' | 'viewed' | 'partially_signed' | 'completed' | 'declined' | 'expired' | 'voided';

interface Envelope {
  id: string;
  name: string;
  description: string | null;
  status: EnvelopeStatus;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  completed_at: string | null;
  sender_email: string;
  sender_name: string | null;
  template_key: string | null;
  template_field_values: Record<string, string> | null;
  metadata: Record<string, any> | null;
  esign_recipients: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Forms Generated", color: "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/50", icon: <FileSignature className="w-3 h-3" /> },
  ready: { label: "Forms Generated", color: "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/50", icon: <CheckCircle2 className="w-3 h-3" /> },
  sent: { label: "Pending Signature", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Send className="w-3 h-3" /> },
  viewed: { label: "Pending Signature · Viewed", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Eye className="w-3 h-3" /> },
  partially_signed: { label: "Pending Signature · Partial", color: "bg-orange-50 text-orange-700 border-orange-200", icon: <Clock className="w-3 h-3" /> },
  completed: { label: "Signed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  declined: { label: "Declined", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="w-3 h-3" /> },
  expired: { label: "Expired", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30", icon: <Clock className="w-3 h-3" /> },
  voided: { label: "Voided", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30", icon: <XCircle className="w-3 h-3" /> },
};

export default function ESignatureDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnvelopeStatus | "all">("all");
  const [kindFilter, setKindFilter] = useState<TemplateKind | "all">("all");
  const [bedroomsFilter, setBedroomsFilter] = useState<string>("all");
  const [propTypeFilter, setPropTypeFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [nationalityFilter, setNationalityFilter] = useState<string>("");

  const { data: envelopes, isLoading, refetch } = useQuery({
    queryKey: ["esign-envelopes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esign_envelopes")
        .select(`
          *,
          esign_recipients (
            id,
            name,
            email,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Envelope[];
    },
    enabled: !!user?.id,
  });

  const stats = {
    draft: envelopes?.filter(e => e.status === "draft").length || 0,
    pending: envelopes?.filter(e => ["sent", "viewed", "partially_signed"].includes(e.status)).length || 0,
    completed: envelopes?.filter(e => e.status === "completed").length || 0,
    expired: envelopes?.filter(e => ["expired", "declined", "voided"].includes(e.status)).length || 0,
  };

  const q = searchQuery.trim().toLowerCase();
  const loc = locationFilter.trim().toLowerCase();
  const nat = nationalityFilter.trim().toLowerCase();

  const filteredEnvelopes = envelopes?.filter(envelope => {
    const v = (envelope.template_field_values as any) || {};
    const haystack = buildSearchHaystack(envelope);
    if (q && !haystack.includes(q)) return false;
    if (statusFilter !== "all" && envelope.status !== statusFilter) return false;
    if (kindFilter !== "all" && getTemplateKind(envelope) !== kindFilter) return false;
    if (bedroomsFilter !== "all" && normaliseBedrooms(v.bedrooms) !== bedroomsFilter) return false;
    if (propTypeFilter !== "all") {
      const pt = String(v.property_type || "").toLowerCase();
      if (pt !== propTypeFilter.toLowerCase()) return false;
    }
    if (loc) {
      const place = `${v.building_name || ""} ${v.community || ""} ${v.street_name || ""} ${v.unit_number || ""}`.toLowerCase();
      if (!place.includes(loc)) return false;
    }
    if (nat) {
      const blob = `${v.nationality || ""} ${v.passport_number || ""} ${v.additional_notes || ""}`.toLowerCase();
      if (!blob.includes(nat)) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setKindFilter("all");
    setBedroomsFilter("all");
    setPropTypeFilter("all");
    setLocationFilter("");
    setNationalityFilter("");
  };
  const hasActiveAdvancedFilters =
    kindFilter !== "all" || bedroomsFilter !== "all" || propTypeFilter !== "all" || !!loc || !!nat;

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("esign_envelopes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Envelope deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete envelope");
    }
  };

  const handleSendReminder = async (id: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/esign-send-reminder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ envelope_id: id }),
        }
      );

      if (!response.ok) throw new Error("Failed to send reminder");
      toast.success("Reminder sent successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to send reminder");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      {/* Premium Page Header — aligned with sidebar logo divider */}
      <div className="border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-6 flex items-end h-[84px] pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <FileSignature className="w-6 h-6 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              E-<span className="text-gold">Signature</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-0 mb-0 mt-0 rounded-none border-0 bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-muted-foreground">
              Upload, sign, and track documents for electronic signature
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/e-signature/create">
                <Button className="bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-white shadow-lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Sign
                </Button>
              </Link>
              <Link to="/e-signature/signature-studio">
                <Button variant="outline" className="border-[hsl(var(--gold)/.3)] hover:border-[hsl(var(--gold))]">
                  <PenTool className="w-4 h-4 mr-2" />
                  Signature Studio
                </Button>
              </Link>
              <Link to="/e-signature/contract-review">
                <Button variant="outline" className="border-[hsl(var(--gold)/.3)] hover:border-[hsl(var(--gold))]">
                  <Scale className="w-4 h-4 mr-2" />
                  Contract Lawyer AI
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card 
              className={`cursor-pointer transition-all border-2 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] ${statusFilter === "all" ? "border-gold ring-2 ring-gold/20" : "border-gold/20 hover:border-gold/40"}`}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-foreground">{envelopes?.length || 0}</p>
                  </div>
                  <FileSignature className="w-8 h-8 text-[#1A1A1A]/70" />
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all border-2 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] ${statusFilter === "draft" ? "border-gold ring-2 ring-gold/20" : "border-gold/20 hover:border-gold/40"}`}
              onClick={() => setStatusFilter("draft")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Drafts</p>
                    <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all border-2 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] ${statusFilter === "sent" ? "border-gold ring-2 ring-gold/20" : "border-gold/20 hover:border-gold/40"}`}
              onClick={() => setStatusFilter("sent")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  </div>
                  <Send className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all border-2 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] ${statusFilter === "completed" ? "border-gold ring-2 ring-gold/20" : "border-gold/20 hover:border-gold/40"}`}
              onClick={() => setStatusFilter("completed")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-2">
            {([
              { key: "all", label: "All" },
              { key: "draft", label: "Draft" },
              { key: "sent", label: "Sent" },
              { key: "completed", label: "Signed" },
              { key: "expired", label: "Expired" },
            ] as { key: EnvelopeStatus | "all"; label: string }[]).map((c) => {
              const active = statusFilter === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setStatusFilter(c.key)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition ${
                    active
                      ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A] font-medium"
                      : "bg-[#FDFBF7]/80 border-[#B89555]/30 text-[#1A1A1A]/80 hover:border-[#B89555]"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, location, doc no., 3 bed, leasing…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#FDFBF7]/80 border-gold/20 focus:border-gold"
              />
            </div>
          </div>

          {/* Advanced filter bar */}
          <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]/70 p-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as TemplateKind | "all")}
                className="h-9 rounded-md border border-[#B89555]/30 bg-white/80 px-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#B89555]"
                aria-label="Agreement type"
              >
                <option value="all">All types</option>
                <option value="leasing">Leasing</option>
                <option value="selling">Selling</option>
                <option value="other">Other</option>
              </select>
              <select
                value={propTypeFilter}
                onChange={(e) => setPropTypeFilter(e.target.value)}
                className="h-9 rounded-md border border-[#B89555]/30 bg-white/80 px-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#B89555]"
                aria-label="Property type"
              >
                <option value="all">Any property</option>
                <option value="Villa">Villa</option>
                <option value="Apartment">Apartment</option>
                <option value="Office">Office</option>
                <option value="Warehouse">Warehouse</option>
              </select>
              <select
                value={bedroomsFilter}
                onChange={(e) => setBedroomsFilter(e.target.value)}
                className="h-9 rounded-md border border-[#B89555]/30 bg-white/80 px-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#B89555]"
                aria-label="Bedrooms"
              >
                <option value="all">Any bedrooms</option>
                <option value="studio">Studio</option>
                <option value="1">1 bed</option>
                <option value="2">2 bed</option>
                <option value="3">3 bed</option>
                <option value="4">4 bed</option>
                <option value="5+">5+ bed</option>
              </select>
              <Input
                placeholder="Location (building / area)"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="h-9 bg-white/80 border-[#B89555]/30 focus:border-[#B89555] text-sm"
              />
              <Input
                placeholder="Nationality"
                value={nationalityFilter}
                onChange={(e) => setNationalityFilter(e.target.value)}
                className="h-9 bg-white/80 border-[#B89555]/30 focus:border-[#B89555] text-sm"
              />
            </div>
            {hasActiveAdvancedFilters && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#B89555]/20">
                <span className="text-[11px] text-[#1A1A1A]/70">
                  Showing {filteredEnvelopes?.length ?? 0} of {envelopes?.length ?? 0}
                </span>
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-[#1A1A1A] underline-offset-2 hover:underline"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          {/* Envelopes List */}
          <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-gold/20">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredEnvelopes?.length === 0 ? (
                <div className="text-center py-12">
                  <FileSignature className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" 
                      ? "No documents match your search"
                      : "No documents yet. Upload your first one!"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Link to="/e-signature/create">
                      <Button className="mt-4 bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-white">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload & Sign
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredEnvelopes?.map((envelope) => {
                    const displayStatus = computeDisplayStatus(envelope as any);
                    const config = statusConfig[displayStatus] || statusConfig.draft;
                    const docNumber =
                      (envelope.metadata as any)?.doc_number ||
                      (envelope.template_field_values as any)?.doc_number ||
                      "";
                    const clientName = pickClientName(envelope);
                    const propertyCtx = pickPropertyContext(envelope);
                    const v = (envelope.template_field_values as any) || {};
                    const phoneMasked = maskPhone(v.mobile_number);
                    const emailMasked = maskEmail(v.email_address);
                    const kind = getTemplateKind(envelope);
                    const kindLabel = getTemplateKindLabel(kind);
                    const templateLabel =
                      envelope.template_key === "jbj-property-advertising-agreement"
                        ? "Property Advertising Agreement — Leasing"
                        : envelope.template_key === "jbj-listing-authorisation-selling"
                          ? "Listing Authorisation — Selling"
                          : envelope.name;
                    const bedsRaw = String(v.bedrooms || "").trim();
                    const beds = bedsRaw
                      ? (/^stu/i.test(bedsRaw) || bedsRaw === "0" ? "Studio" : `${bedsRaw} bed`)
                      : "";
                    const bua = v.bua_sqft ? `${v.bua_sqft} sqft` : "";
                    const sizeLine = [beds, bua].filter(Boolean).join(" · ");
                    return (
                      <div
                        key={envelope.id}
                        className="rounded-lg border border-gold/20 bg-white/70 hover:border-gold/60 hover:shadow-md transition p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {docNumber ? (
                              <span className="text-[10px] tracking-[0.16em] uppercase text-[#1A1A1A]/70 border border-[#B89555]/50 rounded px-2 py-0.5 bg-[#F7F2EA]">
                                {docNumber}
                              </span>
                            ) : (
                              <span className="text-[10px] tracking-[0.16em] uppercase text-[#1A1A1A]/40">
                                No doc no.
                              </span>
                            )}
                            {kind !== "other" && (
                              <span className="text-[10px] tracking-[0.14em] uppercase text-[#1A1A1A] border border-[#B89555]/50 rounded px-2 py-0.5 bg-[#EFE6D6]">
                                {kindLabel}
                              </span>
                            )}
                            {v.property_reference_no && (
                              <span className="text-[10px] tracking-[0.10em] uppercase text-[#1A1A1A]/70">
                                Ref {v.property_reference_no}
                              </span>
                            )}
                          </div>
                          <Badge className={`${config.color} border flex items-center gap-1 text-[10px]`}>
                            {config.icon}
                            {config.label}
                          </Badge>
                        </div>
                        <Link
                          to={`/e-signature/${envelope.id}`}
                          className="block group"
                        >
                          <div className="text-base font-semibold text-foreground group-hover:text-gold transition truncate">
                            {clientName}
                          </div>
                          {propertyCtx && (
                            <div className="text-xs text-[#1A1A1A]/80 truncate">{propertyCtx}</div>
                          )}
                          {sizeLine && (
                            <div className="text-[11px] text-[#1A1A1A]/70 truncate">{sizeLine}</div>
                          )}
                          {(phoneMasked || emailMasked) && (
                            <div className="text-[11px] text-[#1A1A1A]/60 truncate">
                              {[phoneMasked, emailMasked].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {templateLabel}
                          </div>
                        </Link>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                          <span>
                            {envelope.esign_recipients.length} recipient
                            {envelope.esign_recipients.length === 1 ? "" : "s"}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(envelope.updated_at || envelope.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-[#B89555]/20">
                          <Link to={`/e-signature/${envelope.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-[11px]">
                              <Eye className="w-3 h-3 mr-1" /> Open
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/e-signature/${envelope.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {["sent", "viewed", "partially_signed"].includes(envelope.status) && (
                                <DropdownMenuItem onClick={() => handleSendReminder(envelope.id)}>
                                  <Bell className="w-4 h-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                              )}
                              {envelope.status === "draft" && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(envelope.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
