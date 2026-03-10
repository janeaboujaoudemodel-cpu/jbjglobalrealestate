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
  esign_recipients: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
}

const statusConfig: Record<EnvelopeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <FileSignature className="w-3 h-3" /> },
  sent: { label: "Sent", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Send className="w-3 h-3" /> },
  viewed: { label: "Viewed", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Eye className="w-3 h-3" /> },
  partially_signed: { label: "Partially Signed", color: "bg-orange-50 text-orange-700 border-orange-200", icon: <Clock className="w-3 h-3" /> },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  declined: { label: "Declined", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="w-3 h-3" /> },
  expired: { label: "Expired", color: "bg-zinc-100 text-zinc-500 border-zinc-200", icon: <Clock className="w-3 h-3" /> },
  voided: { label: "Voided", color: "bg-zinc-100 text-zinc-500 border-zinc-200", icon: <XCircle className="w-3 h-3" /> },
};

export default function ESignatureDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnvelopeStatus | "all">("all");

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

  const filteredEnvelopes = envelopes?.filter(envelope => {
    const matchesSearch = 
      envelope.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      envelope.esign_recipients.some(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = statusFilter === "all" || envelope.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/esign-send-reminder`,
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
    <div className="min-h-screen bg-black">
      {/* Premium Page Header — aligned with sidebar logo divider */}
      <div className="bg-black border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-6 flex items-end h-[84px] pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <FileSignature className="w-6 h-6 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              E-<span className="text-gold">Signature</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-3 md:mx-4 lg:mx-6 mb-6 mt-0 rounded-b-2xl rounded-t-none border border-t-0 border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
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
              className={`cursor-pointer transition-all border-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] ${statusFilter === "all" ? "border-gold ring-2 ring-gold/20" : "border-gold/20 hover:border-gold/40"}`}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-foreground">{envelopes?.length || 0}</p>
                  </div>
                  <FileSignature className="w-8 h-8 text-gold/50" />
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all border-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] ${statusFilter === "draft" ? "border-gold ring-2 ring-gold/20" : "border-gold/20 hover:border-gold/40"}`}
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
              className={`cursor-pointer transition-all border-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] ${statusFilter === "sent" ? "border-gold ring-2 ring-gold/20" : "border-gold/20 hover:border-gold/40"}`}
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
              className={`cursor-pointer transition-all border-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] ${statusFilter === "completed" ? "border-gold ring-2 ring-gold/20" : "border-gold/20 hover:border-gold/40"}`}
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

          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search envelopes or recipients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 border-gold/20 focus:border-gold"
              />
            </div>
          </div>

          {/* Envelopes List */}
          <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/20">
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
                <div className="divide-y divide-gold/10">
                  {filteredEnvelopes?.map((envelope) => {
                    const config = statusConfig[envelope.status];
                    return (
                      <div key={envelope.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/e-signature/${envelope.id}`}
                            className="font-medium text-foreground hover:text-gold transition-colors"
                          >
                            {envelope.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>
                              {envelope.esign_recipients.map(r => r.name).join(", ")}
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(envelope.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        <Badge className={`${config.color} border flex items-center gap-1`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
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
