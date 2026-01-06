import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ShieldBan, 
  Plus, 
  Trash2, 
  Clock, 
  AlertTriangle,
  Radio,
  RefreshCw,
  Search
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_by: string | null;
  blocked_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  block_count: number;
  last_attempt_at: string | null;
  created_at: string;
}

export const IPBlocklistDashboard = () => {
  const { user } = useAuth();
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlockedIPs = async () => {
    try {
      const { data, error } = await supabase
        .from("ip_blocklist")
        .select("*")
        .order("blocked_at", { ascending: false });

      if (error) throw error;
      setBlockedIPs(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch blocked IPs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel('ip-blocklist-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ip_blocklist'
        },
        (payload) => {
          console.log('IP blocklist update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newEntry = payload.new as BlockedIP;
            setBlockedIPs(prev => [newEntry, ...prev]);
            toast.info(`IP blocked: ${newEntry.ip_address}`, { duration: 2000 });
          } else if (payload.eventType === 'UPDATE') {
            const updatedEntry = payload.new as BlockedIP;
            setBlockedIPs(prev => 
              prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedEntry = payload.old as BlockedIP;
            setBlockedIPs(prev => prev.filter(entry => entry.id !== deletedEntry.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBlockedIPs();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleAddIP = async () => {
    if (!newIP.trim()) {
      toast.error("Please enter an IP address");
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIP.trim())) {
      toast.error("Please enter a valid IP address");
      return;
    }

    setIsSubmitting(true);
    try {
      const expiresAt = isPermanent 
        ? null 
        : new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from("ip_blocklist")
        .insert({
          ip_address: newIP.trim(),
          reason: newReason.trim() || null,
          blocked_by: user?.id,
          is_permanent: isPermanent,
          expires_at: expiresAt,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("This IP is already blocked");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`IP ${newIP} has been blocked`);
      setNewIP("");
      setNewReason("");
      setIsPermanent(true);
      setIsAddDialogOpen(false);
      fetchBlockedIPs();
    } catch (error: any) {
      toast.error(error.message || "Failed to block IP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIP = async (id: string, ipAddress: string) => {
    try {
      const { error } = await supabase
        .from("ip_blocklist")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success(`IP ${ipAddress} has been unblocked`);
      fetchBlockedIPs();
    } catch (error: any) {
      toast.error("Failed to remove IP from blocklist");
    }
  };

  const handleBlockFromRateLimit = async (ipAddress: string) => {
    setNewIP(ipAddress);
    setNewReason("Exceeded rate limits");
    setIsAddDialogOpen(true);
  };

  const filteredIPs = blockedIPs.filter(ip => 
    ip.ip_address.includes(searchQuery) || 
    ip.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const permanentBlocks = blockedIPs.filter(ip => ip.is_permanent).length;
  const temporaryBlocks = blockedIPs.filter(ip => !ip.is_permanent).length;
  const recentBlocks = blockedIPs.filter(ip => {
    const blockedDate = new Date(ip.blocked_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return blockedDate > oneDayAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-semibold flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            <ShieldBan className="w-5 h-5 text-red-400" />
            IP Blocklist
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage permanently blocked IP addresses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={isLive 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
              : "border-zinc-700 text-white hover:bg-zinc-800"
            }
          >
            <Radio className={`w-4 h-4 mr-2 ${isLive ? "animate-pulse" : ""}`} />
            {isLive ? "Live" : "Paused"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-zinc-700 text-white hover:bg-zinc-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Block IP
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldBan className="w-5 h-5 text-red-400" />
                  Block IP Address
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">IP Address</Label>
                  <Input
                    placeholder="e.g., 192.168.1.1"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Reason (optional)</Label>
                  <Textarea
                    placeholder="Why is this IP being blocked?"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-300">Permanent Block</Label>
                    <p className="text-gray-500 text-xs">
                      {isPermanent ? "This IP will be blocked forever" : "Block will expire automatically"}
                    </p>
                  </div>
                  <Switch
                    checked={isPermanent}
                    onCheckedChange={setIsPermanent}
                  />
                </div>
                {!isPermanent && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Expires in (days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                      className="bg-zinc-950 border-zinc-700 text-white"
                    />
                  </div>
                )}
                <Button
                  onClick={handleAddIP}
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? "Blocking..." : "Block IP"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldBan className="w-5 h-5 text-red-400" />
            <span className="text-gray-400">Total Blocked</span>
          </div>
          <p className="text-white text-3xl font-bold">{blockedIPs.length}</p>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-gray-400">Permanent Blocks</span>
          </div>
          <p className="text-white text-3xl font-bold">{permanentBlocks}</p>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400">Temporary Blocks</span>
          </div>
          <p className="text-white text-3xl font-bold">{temporaryBlocks}</p>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <span className="text-gray-400">Blocked Today</span>
          </div>
          <p className="text-white text-3xl font-bold">{recentBlocks}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search by IP or reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Blocklist Table */}
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-white font-medium">Blocked IP Addresses</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500" />
          </div>
        ) : filteredIPs.length === 0 ? (
          <div className="text-center py-12">
            <ShieldBan className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-400">No blocked IPs found</p>
            <p className="text-gray-500 text-sm mt-1">
              Add IPs to the blocklist to prevent malicious access
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <table className="w-full">
              <thead className="bg-zinc-950 sticky top-0">
                <tr>
                  <th className="text-left text-gray-400 font-medium px-6 py-3 text-sm">IP Address</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-3 text-sm">Reason</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-3 text-sm">Status</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-3 text-sm">Blocked At</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-3 text-sm">Attempts</th>
                  <th className="text-right text-gray-400 font-medium px-6 py-3 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIPs.map((entry) => (
                  <tr key={entry.id} className="border-t border-zinc-800 hover:bg-zinc-950/50">
                    <td className="px-6 py-4">
                      <code className="text-red-400 text-sm font-mono bg-red-950/30 px-2 py-1 rounded">
                        {entry.ip_address}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm max-w-48 truncate">
                      {entry.reason || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {entry.is_permanent ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" /> Permanent
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400 gap-1">
                          <Clock className="w-3 h-3" /> 
                          {entry.expires_at 
                            ? `Expires ${formatDistanceToNow(new Date(entry.expires_at), { addSuffix: true })}`
                            : "Temporary"
                          }
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      <div className="flex flex-col">
                        <span>{format(new Date(entry.blocked_at), "MMM d, HH:mm")}</span>
                        <span className="text-gray-500 text-xs">
                          {formatDistanceToNow(new Date(entry.blocked_at), { addSuffix: true })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {entry.block_count}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIP(entry.id, entry.ip_address)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
};
