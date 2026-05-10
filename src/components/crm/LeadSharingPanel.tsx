import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, X, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatDisplayDate } from "@/utils/formatDate";

interface Share {
  id: string;
  shared_with: string;
  permission_level: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

interface CRMMember {
  user_id: string;
  display_name: string | null;
}

interface LeadSharingPanelProps {
  leadId: string;
  isOwner: boolean;
}

export default function LeadSharingPanel({ leadId, isOwner }: LeadSharingPanelProps) {
  const { user } = useAuth();
  const [shares, setShares] = useState<Share[]>([]);
  const [members, setMembers] = useState<CRMMember[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [expiry, setExpiry] = useState("24h");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShares();
    fetchMembers();
  }, [leadId]);

  const fetchShares = async () => {
    const { data } = await supabase
      .from("crm_lead_shares")
      .select("*")
      .eq("lead_id", leadId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    if (data) setShares(data);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("crm_team_members" as any)
      .select("user_id, display_name")
      .eq("is_active", true);
    if (data) setMembers(data as any[]);
  };

  const getExpiryDate = (val: string): string | null => {
    const now = new Date();
    switch (val) {
      case "1h": now.setHours(now.getHours() + 1); break;
      case "24h": now.setHours(now.getHours() + 24); break;
      case "7d": now.setDate(now.getDate() + 7); break;
      case "30d": now.setDate(now.getDate() + 30); break;
      case "none": return null;
      default: now.setHours(now.getHours() + 24);
    }
    return now.toISOString();
  };

  const handleShare = async () => {
    if (!selectedUser || !user) return;
    setLoading(true);

    const { error } = await supabase.from("crm_lead_shares").insert([{
      lead_id: leadId,
      shared_by: user.id,
      shared_with: selectedUser,
      permission_level: "view",
      expires_at: getExpiryDate(expiry),
    }]);

    if (!error) {
      await supabase.from("crm_security_events").insert([{
        user_id: user.id,
        event_type: "lead_share",
        details: { lead_id: leadId, shared_with: selectedUser, expiry } as any,
        user_agent: navigator.userAgent,
      }]);
      toast.success("Lead shared successfully");
      setSelectedUser("");
      fetchShares();
    } else {
      toast.error("Failed to share lead");
    }
    setLoading(false);
  };

  const handleRevoke = async (shareId: string) => {
    if (!user) return;
    await supabase
      .from("crm_lead_shares")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", shareId);

    await supabase.from("crm_security_events").insert([{
      user_id: user.id,
      event_type: "lead_share_revoke",
      details: { lead_id: leadId, share_id: shareId } as any,
      user_agent: navigator.userAgent,
    }]);

    toast.success("Access revoked");
    fetchShares();
  };

  if (!isOwner) return null;

  const activeShares = shares.filter(s => !s.expires_at || new Date(s.expires_at) > new Date());

  return (
    <Card className="border-[#B89555]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#1A1A1A]" />
          Lead Sharing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Share form */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="border-[#B89555]/30">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {members.filter(m => m.user_id !== user?.id).map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.display_name || m.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={expiry} onValueChange={setExpiry}>
            <SelectTrigger className="w-24 border-[#B89555]/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="none">No expiry</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleShare} disabled={!selectedUser || loading} size="sm" className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90">
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* Active shares */}
        {activeShares.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Active Shares</p>
            {activeShares.map(share => {
              const member = members.find(m => m.user_id === share.shared_with);
              return (
                <div key={share.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{member?.display_name || share.shared_with.slice(0, 8)}</span>
                    <Badge variant="outline" className="text-xs">{share.permission_level}</Badge>
                    {share.expires_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDisplayDate(share.expires_at)}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(share.id)} className="text-destructive hover:text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
