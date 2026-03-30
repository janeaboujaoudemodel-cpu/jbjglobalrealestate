import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, User, CheckCircle2, AlertCircle, Zap, Shield,
  Mail, Clock, RefreshCw, ArrowUpRight, ArrowDownLeft, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailStatus {
  company: {
    api_key_exists: boolean;
    domain: string;
    outbound_active: boolean;
    last_verified_at: string | null;
  };
  personal: {
    api_key_exists: boolean;
    is_active: boolean;
    outbound_active: boolean;
    last_verified_at: string | null;
  };
  last_sent: {
    at: string;
    method: string;
    account: string;
  } | null;
}

const EmailHubStatusPanel = () => {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-owner-email", {
        body: { action: "check_status" },
      });
      if (fnError) throw fnError;
      setStatus(data);
    } catch (err: any) {
      setError(err.message || "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const formatTime = (iso: string | null) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString("en-AE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse border border-border/20" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <div>
          <p className="text-sm font-medium text-foreground">Failed to load email status</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchStatus} className="ml-auto">
          <RefreshCw className="w-3 h-3 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  const StatusBadge = ({ active, label }: { active: boolean; label: string }) => (
    <Badge className={active
      ? "bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]"
      : "bg-amber-100 text-amber-700 border-amber-300 text-[10px]"
    }>
      {active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#B89555]" />
          Email Infrastructure Status
        </h3>
        <Button size="sm" variant="ghost" onClick={fetchStatus} className="h-7 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Company Email */}
      <div className="rounded-xl border-2 border-[#B89555]/20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] p-4">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-4 h-4 text-[#B89555]" />
          <span className="text-sm font-semibold text-foreground">Company Email (jbj.ae)</span>
          <StatusBadge active={status?.company.api_key_exists ?? false} label={status?.company.api_key_exists ? "Connected" : "Missing Key"} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Domain</p>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-500" /> {status?.company.domain ?? "jbj.ae"}
            </p>
          </div>
          <div className="bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Outbound</p>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              {status?.company.outbound_active ? "Active via Resend API" : "Inactive"}
            </p>
          </div>
          <div className="bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Inbound</p>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-emerald-500" /> Webhook Active
            </p>
          </div>
          <div className="bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">API Key</p>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-500" />
              {status?.company.api_key_exists ? "Configured" : "Missing"}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Email */}
      <div className="rounded-xl border-2 border-[#B89555]/20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] p-4">
        <div className="flex items-center gap-3 mb-3">
          <User className="w-4 h-4 text-[#B89555]" />
          <span className="text-sm font-semibold text-foreground">Personal Email</span>
          <StatusBadge
            active={status?.personal.is_active ?? false}
            label={status?.personal.is_active ? "API Connected" : status?.personal.api_key_exists ? "Key Invalid" : "Normal Mode"}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">API Key</p>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              {status?.personal.is_active ? (
                <><Shield className="w-3 h-3 text-emerald-500" /> Active</>
              ) : (
                <><AlertCircle className="w-3 h-3 text-amber-500" /> Not configured</>
              )}
            </p>
          </div>
          <div className="bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Outbound</p>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <ArrowUpRight className={`w-3 h-3 ${status?.personal.outbound_active ? "text-emerald-500" : "text-amber-500"}`} />
              {status?.personal.outbound_active ? "Active via Resend API" : "Normal / Fallback Mode"}
            </p>
          </div>
          <div className="bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2 col-span-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Verified</p>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              {formatTime(status?.personal.last_verified_at ?? null)}
            </p>
          </div>
        </div>
      </div>

      {/* Last Sent */}
      <div className="rounded-xl border-2 border-[#B89555]/20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] p-4">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-4 h-4 text-[#B89555]" />
          <span className="text-sm font-semibold text-foreground">Last Email Sent</span>
        </div>
        {status?.last_sent ? (
          <div className="bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">{formatTime(status.last_sent.at)}</span>
              <div className="flex gap-2">
                <Badge className="bg-[#B89555]/15 text-[#B89555] border-[#B89555]/30 text-[9px]">
                  {status.last_sent.method}
                </Badge>
                <Badge className="bg-[#B89555]/15 text-[#B89555] border-[#B89555]/30 text-[9px]">
                  {status.last_sent.account}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No emails sent yet</p>
        )}
      </div>

      {/* Pending Setup */}
      {(!status?.personal.is_active) && (
        <div className="rounded-xl border-2 border-amber-200/50 bg-amber-50/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-foreground">Pending Setup</span>
          </div>
          <ul className="space-y-1">
            {!status?.personal.is_active && (
              <li className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Personal Resend API key not connected — emails use fallback mode
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmailHubStatusPanel;
