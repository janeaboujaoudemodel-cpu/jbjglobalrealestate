import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, RotateCcw, Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDisplayDate } from "@/utils/formatDate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DeletedLead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  source: string | null;
  deleted_at: string | null;
  created_at: string;
}

interface RecentlyDeletedLeadsProps {
  userId: string;
  onRefresh: () => void;
}

export default function RecentlyDeletedLeads({ userId, onRefresh }: RecentlyDeletedLeadsProps) {
  const [leads, setLeads] = useState<DeletedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetchDeletedLeads();
  }, []);

  const fetchDeletedLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("id, full_name, email_lower, phone_e164, source, deleted_at, created_at")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      console.error("Failed to fetch deleted leads:", err);
      toast.error("Failed to load deleted leads");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (leadId: string) => {
    setRestoring(leadId);
    try {
      const { error } = await supabase
        .from("crm_leads")
        .update({ deleted_at: null })
        .eq("id", leadId);

      if (error) throw error;

      toast.success("Lead restored successfully");
      setLeads(prev => prev.filter(l => l.id !== leadId));
      onRefresh();
    } catch (err: any) {
      toast.error(`Restore failed: ${err?.message || "Unknown error"}`);
    } finally {
      setRestoring(null);
    }
  };

  const filtered = search.trim()
    ? leads.filter(l => 
        l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email_lower?.toLowerCase().includes(search.toLowerCase()) ||
        l.phone_e164?.includes(search)
      )
    : leads;

  return (
    <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-black flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          Leads Management
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Recently deleted leads — auto-purged after 30 days. Restore leads before they are permanently removed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search + Stats on one line */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deleted leads..."
              className="pl-10 bg-white border-gold/30"
            />
          </div>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {leads.length} deleted lead{leads.length !== 1 ? "s" : ""}
          </Badge>
          <Button variant="ghost" size="sm" onClick={fetchDeletedLeads} className="text-gold hover:bg-gold/10">
            <RotateCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">{search ? "No matching deleted leads" : "No recently deleted leads"}</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gold/5">
                    <TableCell className="font-medium text-black">{lead.full_name}</TableCell>
                    <TableCell className="text-zinc-600 text-sm">{lead.email_lower || "—"}</TableCell>
                    <TableCell className="text-zinc-600 text-sm">{lead.phone_e164 || "—"}</TableCell>
                    <TableCell>
                      {lead.source && (
                        <Badge variant="secondary" className="text-xs bg-gold/10 border-gold/20">
                          {lead.source}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDisplayDate(lead.deleted_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRestore(lead.id)}
                        disabled={restoring === lead.id}
                        className="font-semibold"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        {restoring === lead.id ? "Restoring..." : "Restore"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
