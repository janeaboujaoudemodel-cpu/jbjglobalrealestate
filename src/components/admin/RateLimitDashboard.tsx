import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Trash2,
  Activity,
  Ban,
  TrendingUp,
  Radio
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface RateLimitEntry {
  id: string;
  function_name: string;
  rate_key: string;
  request_count: number;
  window_start: string;
  created_at: string;
}

interface RateLimitConfig {
  [key: string]: { limit: number; windowMinutes: number };
}

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  "user-registration": { limit: 5, windowMinutes: 15 },
  "ai-chat-support": { limit: 30, windowMinutes: 5 },
  "validate-discount-code": { limit: 10, windowMinutes: 5 },
};

export const RateLimitDashboard = () => {
  const { logAction } = useAuditLog();
  const [rateLimits, setRateLimits] = useState<RateLimitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);

  const fetchRateLimits = async () => {
    try {
      let query = supabase
        .from("function_rate_limits")
        .select("*")
        .order("window_start", { ascending: false })
        .limit(100);

      if (selectedFunction !== "all") {
        query = query.eq("function_name", selectedFunction);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRateLimits(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch rate limits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimits();
  }, [selectedFunction]);

  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel('rate-limits-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'function_rate_limits'
        },
        (payload) => {
          console.log('Rate limit update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newEntry = payload.new as RateLimitEntry;
            if (selectedFunction === 'all' || newEntry.function_name === selectedFunction) {
              setRateLimits(prev => [newEntry, ...prev.slice(0, 99)]);
              toast.info(`New rate limit entry: ${newEntry.function_name}`, {
                duration: 2000,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedEntry = payload.new as RateLimitEntry;
            setRateLimits(prev => 
              prev.map(entry => 
                entry.id === updatedEntry.id ? updatedEntry : entry
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedEntry = payload.old as RateLimitEntry;
            setRateLimits(prev => 
              prev.filter(entry => entry.id !== deletedEntry.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive, selectedFunction]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRateLimits();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleClearOldEntries = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: entriesToDelete, error: countError } = await supabase
        .from("function_rate_limits")
        .select("id")
        .lt("window_start", oneHourAgo);

      if (countError) throw countError;

      const entriesCount = entriesToDelete?.length || 0;
      
      const { error } = await supabase
        .from("function_rate_limits")
        .delete()
        .lt("window_start", oneHourAgo);

      if (error) throw error;

      await logAction({
        actionType: "delete",
        resourceType: "rate_limit",
        description: `Cleared ${entriesCount} old rate limit entries`,
        details: {
          entries_deleted: entriesCount,
          cleared_before: oneHourAgo,
        },
      });

      toast.success(`Cleared ${entriesCount} old entries`);
      fetchRateLimits();
    } catch (error: any) {
      toast.error("Failed to clear entries");
    }
  };

  const getBlockedAttempts = () => {
    return rateLimits.filter((entry) => {
      const config = RATE_LIMIT_CONFIG[entry.function_name];
      return config && entry.request_count >= config.limit;
    });
  };

  const getTotalRequests = () => {
    return rateLimits.reduce((sum, entry) => sum + entry.request_count, 0);
  };

  const getUniqueIPs = () => {
    return new Set(rateLimits.map((entry) => entry.rate_key)).size;
  };

  const getStatusBadge = (entry: RateLimitEntry) => {
    const config = RATE_LIMIT_CONFIG[entry.function_name];
    if (!config) return <Badge variant="outline">Unknown</Badge>;

    const percentage = (entry.request_count / config.limit) * 100;
    
    if (percentage >= 100) {
      return <Badge variant="destructive" className="gap-1"><Ban className="w-3 h-3" /> Blocked</Badge>;
    } else if (percentage >= 80) {
      return <Badge className="bg-amber-100 text-amber-700 gap-1"><AlertTriangle className="w-3 h-3" /> Warning</Badge>;
    } else {
      return <Badge className="bg-emerald-100 text-emerald-700 gap-1"><Activity className="w-3 h-3" /> Normal</Badge>;
    }
  };

  const blockedAttempts = getBlockedAttempts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-black text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" />
            Rate Limit Monitor
          </h2>
          <p className="text-black/60 text-sm mt-1">
            Monitor API rate limiting and blocked attempts
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={isLive 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
              : "border-gold/30 text-black hover:bg-gold/10"
            }
          >
            <Radio className={`w-4 h-4 mr-2 ${isLive ? "animate-pulse" : ""}`} />
            {isLive ? "Live" : "Paused"}
          </Button>
          <Select value={selectedFunction} onValueChange={setSelectedFunction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by function" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Functions</SelectItem>
              <SelectItem value="user-registration">User Registration</SelectItem>
              <SelectItem value="ai-chat-support">AI Chat Support</SelectItem>
              <SelectItem value="validate-discount-code">Validate Discount</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-gold/30 text-black hover:bg-gold/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearOldEntries}
            className="border-gold/30 text-black hover:bg-gold/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Old
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-gold/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-black/60">Total Requests</span>
          </div>
          <p className="text-black text-3xl font-bold">{getTotalRequests()}</p>
        </Card>
        <Card className="bg-white border-2 border-gold/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-black/60">Unique IPs</span>
          </div>
          <p className="text-black text-3xl font-bold">{getUniqueIPs()}</p>
        </Card>
        <Card className="bg-white border-2 border-gold/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Ban className="w-5 h-5 text-red-500" />
            <span className="text-black/60">Blocked Attempts</span>
          </div>
          <p className="text-black text-3xl font-bold">{blockedAttempts.length}</p>
        </Card>
        <Card className="bg-white border-2 border-gold/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-gold" />
            <span className="text-black/60">Active Windows</span>
          </div>
          <p className="text-black text-3xl font-bold">{rateLimits.length}</p>
        </Card>
      </div>

      {/* Blocked Attempts Alert */}
      {blockedAttempts.length > 0 && (
        <Card className="bg-red-50 border-2 border-red-300 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-red-700 font-medium">Active Blocked IPs</h3>
              <p className="text-red-600/70 text-sm mt-1">
                {blockedAttempts.length} IP(s) have exceeded rate limits and are currently blocked.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {blockedAttempts.slice(0, 5).map((entry) => (
                  <Badge key={entry.id} variant="destructive" className="font-mono text-xs">
                    {entry.rate_key} ({entry.function_name})
                  </Badge>
                ))}
                {blockedAttempts.length > 5 && (
                  <Badge variant="outline" className="text-red-500 border-red-300">
                    +{blockedAttempts.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Rate Limits Table */}
      <Card className="bg-white border-2 border-gold/30 overflow-hidden">
        <div className="p-4 border-b border-gold/20">
          <h3 className="text-black font-medium">Rate Limit Entries</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
          </div>
        ) : rateLimits.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gold/40 mx-auto mb-3" />
            <p className="text-black/60">No rate limit entries found</p>
            <p className="text-black/40 text-sm mt-1">
              Rate limit data will appear here when API requests are made
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6] sticky top-0">
                <tr>
                  <th className="text-left text-black/60 font-medium px-6 py-3 text-sm">Function</th>
                  <th className="text-left text-black/60 font-medium px-6 py-3 text-sm">IP / Key</th>
                  <th className="text-left text-black/60 font-medium px-6 py-3 text-sm">Requests</th>
                  <th className="text-left text-black/60 font-medium px-6 py-3 text-sm">Status</th>
                  <th className="text-left text-black/60 font-medium px-6 py-3 text-sm">Window Started</th>
                </tr>
              </thead>
              <tbody>
                {rateLimits.map((entry) => {
                  const config = RATE_LIMIT_CONFIG[entry.function_name];
                  const limit = config?.limit || 0;
                  const percentage = limit > 0 ? Math.min((entry.request_count / limit) * 100, 100) : 0;
                  
                  return (
                    <tr key={entry.id} className="border-t border-gold/10 hover:bg-gold/5">
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-black border-gold/30">
                          {entry.function_name}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-black text-sm font-mono bg-gold/5 px-2 py-1 rounded border border-gold/20">
                          {entry.rate_key}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                percentage >= 100 ? "bg-red-500" :
                                percentage >= 80 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-black text-sm">
                            {entry.request_count}{config ? `/${config.limit}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(entry)}
                      </td>
                      <td className="px-6 py-4 text-black/60 text-sm">
                        <div className="flex flex-col">
                          <span>{format(new Date(entry.window_start), "MMM d, HH:mm:ss")}</span>
                          <span className="text-black/40 text-xs">
                            {formatDistanceToNow(new Date(entry.window_start), { addSuffix: true })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </Card>

      {/* Rate Limit Configuration Info */}
      <Card className="bg-white border-2 border-gold/30 p-6">
        <h3 className="text-black font-medium mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold" />
          Rate Limit Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(RATE_LIMIT_CONFIG).map(([fn, config]) => (
            <div key={fn} className="bg-gold/5 rounded-lg p-4 border border-gold/20">
              <code className="text-gold text-sm">{fn}</code>
              <div className="mt-2 text-black/60 text-sm">
                <span className="text-black font-medium">{config.limit}</span> requests per{" "}
                <span className="text-black font-medium">{config.windowMinutes}</span> minutes
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
