import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Flag, Search, AlertTriangle, Phone, Mail, User, 
  CheckCircle, X, Edit, Save, RefreshCw, FileText,
  ExternalLink
} from "lucide-react";

interface FlaggedLead {
  id: string;
  full_name: string;
  phone_e164: string | null;
  phone_raw: string | null;
  email_lower: string | null;
  email_normalized: string | null;
  flagged: boolean;
  flag_reasons: string[];
  source_row_index: number | null;
  import_batch_id: string | null;
  raw_import: Record<string, any> | null;
  source_id: string | null;
  created_at: string;
  source?: {
    source_name: string;
    source_group: string;
  } | null;
}

interface FlaggedLeadsViewProps {
  userId: string;
  onRefresh: () => void;
}

const FLAG_REASON_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  missing_phone: { label: "Missing Phone", icon: Phone, color: "text-amber-400" },
  missing_email: { label: "Missing Email", icon: Mail, color: "text-amber-400" },
  invalid_phone_format: { label: "Invalid Phone", icon: Phone, color: "text-red-400" },
  invalid_email_format: { label: "Invalid Email", icon: Mail, color: "text-red-400" },
  duplicate_phone: { label: "Duplicate Phone", icon: Phone, color: "text-blue-400" },
  duplicate_email: { label: "Duplicate Email", icon: Mail, color: "text-blue-400" },
};

const FlaggedLeadsView = ({ userId, onRefresh }: FlaggedLeadsViewProps) => {
  const [leads, setLeads] = useState<FlaggedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<FlaggedLead | null>(null);
  const [editingLead, setEditingLead] = useState<FlaggedLead | null>(null);
  const [editForm, setEditForm] = useState({ phone: "", email: "", full_name: "" });
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    fetchFlaggedLeads();
  }, [userId]);

  // Handle URL hash for direct navigation to a lead
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#lead-")) {
      const leadId = hash.replace("#lead-", "");
      setHighlightedId(leadId);
      
      // Wait for leads to load then scroll
      setTimeout(() => {
        const row = rowRefs.current.get(leadId);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [leads]);

  const fetchFlaggedLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("crm_leads")
        .select(`
          id, full_name, phone_e164, phone_raw, email_lower, email_normalized,
          flagged, flag_reasons, source_row_index, import_batch_id, raw_import,
          source_id, created_at
        `)
        .eq("flagged", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch source info for each lead
      const sourceIds = [...new Set((data || []).map(l => l.source_id).filter(Boolean))];
      let sourcesMap = new Map();
      
      if (sourceIds.length > 0) {
        const { data: sources } = await supabase
          .from("crm_lead_sources")
          .select("id, source_name, source_group")
          .in("id", sourceIds);
        
        sources?.forEach(s => sourcesMap.set(s.id, s));
      }

      const leadsWithSource = (data || []).map(lead => ({
        ...lead,
        flag_reasons: lead.flag_reasons || [],
        source: lead.source_id ? sourcesMap.get(lead.source_id) : null
      }));

      setLeads(leadsWithSource as FlaggedLead[]);
    } catch (err) {
      console.error("Failed to fetch flagged leads:", err);
      toast.error("Failed to load flagged leads");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (lead: FlaggedLead) => {
    setSelectedLead(lead);
    setHighlightedId(lead.id);
    // Update URL hash for shareable link
    window.history.replaceState(null, "", `#lead-${lead.id}`);
  };

  const handleEditLead = (lead: FlaggedLead) => {
    setEditingLead(lead);
    setEditForm({
      full_name: lead.full_name || "",
      phone: lead.phone_raw || lead.phone_e164 || "",
      email: lead.email_lower || ""
    });
  };

  const normalizePhone = (phone: string): string | null => {
    if (!phone) return null;
    
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, "");
    
    // Handle various UAE phone formats
    if (!normalized.startsWith("+")) {
      // Starts with 0 (e.g., 0501234567) -> +971501234567
      if (normalized.startsWith("0") && normalized.length >= 9) {
        normalized = "+971" + normalized.slice(1);
      }
      // Starts with 971 without + (e.g., 971501234567)
      else if (normalized.startsWith("971") && normalized.length >= 12) {
        normalized = "+" + normalized;
      }
      // Starts with 5 (UAE mobile, e.g., 501234567) -> +971501234567
      else if (normalized.startsWith("5") && normalized.length >= 9 && normalized.length <= 10) {
        normalized = "+971" + normalized;
      }
      // UAE landline or other formats
      else if (/^[23467890]/.test(normalized) && normalized.length >= 7) {
        normalized = "+971" + normalized;
      }
      // International number without + (10+ digits)
      else if (normalized.length >= 10) {
        normalized = "+" + normalized;
      }
      // Shorter but might be valid
      else if (normalized.length >= 7) {
        normalized = "+971" + normalized;
      }
    }
    
    // E.164 validation - be lenient for UAE (9-15 digits after +)
    if (/^\+[1-9]\d{8,14}$/.test(normalized)) {
      return normalized;
    }
    
    return null;
  };

  const normalizeEmail = (email: string): string | null => {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
      return normalized;
    }
    return null;
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;

    const normalizedPhone = normalizePhone(editForm.phone);
    const normalizedEmail = normalizeEmail(editForm.email);

    // Recalculate flag reasons
    const newFlagReasons: string[] = [];
    if (!editForm.phone && !editForm.email) {
      newFlagReasons.push("missing_phone", "missing_email");
    } else {
      if (!editForm.phone) newFlagReasons.push("missing_phone");
      if (!editForm.email) newFlagReasons.push("missing_email");
      if (editForm.phone && !normalizedPhone) newFlagReasons.push("invalid_phone_format");
      if (editForm.email && !normalizedEmail) newFlagReasons.push("invalid_email_format");
    }

    const isFlagged = newFlagReasons.length > 0;

    try {
      const { error } = await supabase
        .from("crm_leads")
        .update({
          full_name: editForm.full_name,
          phone_e164: normalizedPhone,
          phone_raw: editForm.phone,
          phone_normalized: normalizedPhone?.replace(/\D/g, '') || null,
          email_lower: normalizedEmail,
          email_normalized: normalizedEmail,
          flagged: isFlagged,
          flag_reasons: newFlagReasons
        })
        .eq("id", editingLead.id);

      if (error) throw error;

      toast.success(isFlagged ? "Lead updated (still flagged)" : "Lead fixed and unflagged!");
      setEditingLead(null);
      setSelectedLead(null);
      fetchFlaggedLeads();
      onRefresh();
    } catch (err) {
      console.error("Failed to update lead:", err);
      toast.error("Failed to update lead");
    }
  };

  const handleMarkResolved = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("crm_leads")
        .update({
          flagged: false,
          flag_reasons: []
        })
        .eq("id", leadId);

      if (error) throw error;

      toast.success("Lead marked as resolved");
      setSelectedLead(null);
      fetchFlaggedLeads();
      onRefresh();
    } catch (err) {
      console.error("Failed to resolve lead:", err);
      toast.error("Failed to resolve lead");
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.full_name?.toLowerCase().includes(query) ||
      lead.phone_e164?.includes(query) ||
      lead.phone_raw?.includes(query) ||
      lead.email_lower?.includes(query) ||
      lead.source_row_index?.toString().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Flag className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-black">Flagged Leads</h2>
            <p className="text-sm text-muted-foreground">
              {leads.length} leads need attention
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFlaggedLeads}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email, or row number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card text-foreground border-border"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(FLAG_REASON_LABELS).map(([key, { label, icon: Icon, color }]) => {
          const count = leads.filter(l => l.flag_reasons?.includes(key)).length;
          return (
            <Card key={key} className="bg-card/50 border-border">
              <CardContent className="p-3 flex items-center gap-2">
                <Icon className={cn("h-4 w-4", color)} />
                <div>
                  <p className="text-lg font-bold text-black">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card/50">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-b border-border">
              <TableHead className="text-black font-bold w-16">Row</TableHead>
              <TableHead className="text-black font-bold">Name</TableHead>
              <TableHead className="text-black font-bold">Contact</TableHead>
              <TableHead className="text-black font-bold">Issues</TableHead>
              <TableHead className="text-black font-bold">Source</TableHead>
              <TableHead className="text-black font-bold w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {leads.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <p>No flagged leads! All data is clean.</p>
                    </div>
                  ) : (
                    "No results found"
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  ref={(el) => { if (el) rowRefs.current.set(lead.id, el); }}
                  className={cn(
                    "border-b border-border/50 cursor-pointer transition-colors",
                    highlightedId === lead.id 
                      ? "bg-red-500/20 border-red-500/50 animate-pulse" 
                      : "hover:bg-muted/30"
                  )}
                  onClick={() => handleRowClick(lead)}
                >
                  <TableCell className="font-mono text-amber-400">
                    #{lead.source_row_index || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-white font-medium">
                        {lead.full_name || "(No name)"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lead.phone_raw || lead.phone_e164 ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className={lead.flag_reasons?.includes("invalid_phone_format") ? "text-red-400 line-through" : "text-muted-foreground"}>
                            {lead.phone_raw || lead.phone_e164}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-amber-400">
                          <Phone className="h-3 w-3" />
                          <span>Missing</span>
                        </div>
                      )}
                      {lead.email_lower ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className={lead.flag_reasons?.includes("invalid_email_format") ? "text-red-400 line-through" : "text-muted-foreground"}>
                            {lead.email_lower}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-amber-400">
                          <Mail className="h-3 w-3" />
                          <span>Missing</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lead.flag_reasons?.map((reason) => {
                        const info = FLAG_REASON_LABELS[reason];
                        if (!info) return null;
                        return (
                          <Badge 
                            key={reason} 
                            variant="outline" 
                            className={cn("text-xs border-current", info.color)}
                          >
                            {info.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.source ? (
                      <div className="text-sm">
                        <p className="text-white">{lead.source.source_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {lead.source.source_group.replace(/_/g, " ")}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleEditLead(lead); }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead && !editingLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-400" />
              Flagged Lead Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-4">
              {/* Row Info */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-amber-300">
                  <strong>Source Row:</strong> #{selectedLead.source_row_index}
                  {selectedLead.source && (
                    <span className="ml-2 text-muted-foreground">
                      from {selectedLead.source.source_name}
                    </span>
                  )}
                </p>
              </div>

              {/* Lead Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <p className="text-white font-medium">{selectedLead.full_name || "(No name)"}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <p className={cn(
                    "font-mono",
                    selectedLead.flag_reasons?.includes("missing_phone") && "text-amber-400",
                    selectedLead.flag_reasons?.includes("invalid_phone_format") && "text-red-400"
                  )}>
                    {selectedLead.phone_raw || selectedLead.phone_e164 || "Missing"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <p className={cn(
                    selectedLead.flag_reasons?.includes("missing_email") && "text-amber-400",
                    selectedLead.flag_reasons?.includes("invalid_email_format") && "text-red-400"
                  )}>
                    {selectedLead.email_lower || "Missing"}
                  </p>
                </div>
              </div>

              {/* Issues */}
              <div>
                <label className="text-xs text-muted-foreground">Issues</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedLead.flag_reasons?.map((reason) => {
                    const info = FLAG_REASON_LABELS[reason];
                    return (
                      <Badge key={reason} className={cn("bg-amber-500/20 border-amber-500/50", info?.color || "text-amber-400")}>
                        {info?.label || reason}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Raw Data */}
              {selectedLead.raw_import && (
                <div>
                  <label className="text-xs text-muted-foreground">Original Import Data</label>
                  <div className="bg-muted/30 rounded-lg p-3 mt-1 max-h-32 overflow-auto">
                    <pre className="text-xs text-muted-foreground">
                      {JSON.stringify(selectedLead.raw_import, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleEditLead(selectedLead)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit & Fix
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleMarkResolved(selectedLead.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingLead} onOpenChange={() => setEditingLead(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="h-5 w-5 text-gold" />
              Fix Lead Data
            </DialogTitle>
          </DialogHeader>
          
          {editingLead && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white">Full Name</label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className="bg-muted border-border text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white">Phone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+971501234567"
                  className="bg-muted border-border text-white"
                />
                <p className="text-xs text-muted-foreground">
                  Enter full international format (e.g., +971501234567)
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white">Email</label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="example@email.com"
                  className="bg-muted border-border text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingLead(null)}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleSaveEdit}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlaggedLeadsView;