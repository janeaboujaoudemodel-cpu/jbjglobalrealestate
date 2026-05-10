import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Users,
  Bell,
  BellOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrokerAvailabilityToggleProps {
  brokerId: string;
  initialStatus?: "available" | "busy" | "offline";
  onStatusChange?: (status: "available" | "busy" | "offline") => void;
  compact?: boolean;
}

export function BrokerAvailabilityToggle({ 
  brokerId, 
  initialStatus = "available",
  onStatusChange,
  compact = false 
}: BrokerAvailabilityToggleProps) {
  const [status, setStatus] = useState<"available" | "busy" | "offline">(initialStatus);
  const [autoReceiveLeads, setAutoReceiveLeads] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchCurrentStatus();
  }, [brokerId]);

  const fetchCurrentStatus = async () => {
    const { data, error } = await supabase
      .from("jbj_brokers")
      .select("availability_status, auto_receive_leads")
      .eq("id", brokerId)
      .single();

    if (data && !error) {
      setStatus(data.availability_status as "available" | "busy" | "offline");
      setAutoReceiveLeads(data.auto_receive_leads ?? true);
    }
  };

  const updateStatus = async (newStatus: "available" | "busy" | "offline") => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("jbj_brokers")
        .update({ 
          availability_status: newStatus,
          availability_updated_at: new Date().toISOString()
        })
        .eq("id", brokerId);

      if (error) throw error;

      setStatus(newStatus);
      onStatusChange?.(newStatus);
      
      const statusMessages = {
        available: "You're now available to receive leads",
        busy: "You're marked as busy - no new leads will be assigned",
        offline: "You're offline - no new leads will be assigned"
      };
      toast.success(statusMessages[newStatus]);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update availability");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleAutoReceive = async () => {
    setIsUpdating(true);
    try {
      const newValue = !autoReceiveLeads;
      const { error } = await supabase
        .from("jbj_brokers")
        .update({ auto_receive_leads: newValue })
        .eq("id", brokerId);

      if (error) throw error;

      setAutoReceiveLeads(newValue);
      toast.success(newValue 
        ? "Auto lead assignment enabled" 
        : "Auto lead assignment disabled"
      );
    } catch (error) {
      console.error("Error updating auto receive:", error);
      toast.error("Failed to update setting");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusConfig = {
    available: {
      icon: CheckCircle,
      label: "Available",
      color: "bg-green-500",
      textColor: "text-green-500",
      borderColor: "border-green-500",
      description: "Receiving new leads automatically"
    },
    busy: {
      icon: Clock,
      label: "Busy",
      color: "bg-amber-500",
      textColor: "text-amber-500",
      borderColor: "border-amber-500",
      description: "Not receiving new leads"
    },
    offline: {
      icon: XCircle,
      label: "Offline",
      color: "bg-[#B89555]",
      textColor: "text-[#1A1A1A]/70",
      borderColor: "border-[#B89555]/30",
      description: "Not receiving new leads"
    }
  };

  const currentConfig = statusConfig[status];
  const StatusIcon = currentConfig.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", currentConfig.color)} />
        <span className={cn("text-sm font-medium", currentConfig.textColor)}>
          {currentConfig.label}
        </span>
        <div className="flex gap-1 ml-2">
          {(["available", "busy", "offline"] as const).map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={isUpdating || status === s}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                status === s 
                  ? cn(statusConfig[s].color, "text-white scale-110")
                  : "bg-[#EFE6D6] hover:bg-[#EFE6D6] text-[#1A1A1A]/70"
              )}
            >
              {s === "available" && <CheckCircle className="w-3 h-3" />}
              {s === "busy" && <Clock className="w-3 h-3" />}
              {s === "offline" && <XCircle className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 transition-all duration-300 hover:shadow-md" style={{ borderColor: `var(--${status === 'available' ? 'green' : status === 'busy' ? 'amber' : 'gray'}-500)` }}>
      <CardContent className="p-4">
        {/* Status Display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              currentConfig.color
            )}>
              <StatusIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={cn("font-semibold text-lg", currentConfig.textColor)}>
                {currentConfig.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentConfig.description}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs", currentConfig.textColor, currentConfig.borderColor)}>
            <div className={cn("w-2 h-2 rounded-full mr-1.5 animate-pulse", currentConfig.color)} />
            Status Active
          </Badge>
        </div>

        {/* Status Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(["available", "busy", "offline"] as const).map((s) => {
            const config = statusConfig[s];
            const Icon = config.icon;
            const isActive = status === s;
            
            return (
              <Button
                key={s}
                variant={isActive ? "default" : "outline"}
                onClick={() => updateStatus(s)}
                disabled={isUpdating}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3 transition-all",
                  isActive && config.color,
                  isActive && "text-white border-transparent"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{config.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Auto Receive Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {autoReceiveLeads ? (
              <Bell className="w-4 h-4 text-[#1A1A1A]" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">Auto-receive Leads</p>
              <p className="text-xs text-muted-foreground">
                Automatically receive website leads
              </p>
            </div>
          </div>
          <Switch
            checked={autoReceiveLeads}
            onCheckedChange={toggleAutoReceive}
            disabled={isUpdating}
          />
        </div>

        {/* Warning when not available */}
        {status !== "available" && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ⚠️ You won't receive new leads while {status}
          </div>
        )}
      </CardContent>
    </Card>
  );
}