import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  AlertTriangle,
  RefreshCw,
  Zap,
  Users,
  ArrowRight,
  Settings,
  Bell,
  Loader2,
} from "lucide-react";

interface Broker {
  id: string;
  name: string;
  email: string;
  capacity: number;
  active_leads: number;
  status: string;
}

interface CapacityAlert {
  brokerId: string;
  brokerName: string;
  usage: number;
  capacity: number;
  activeLeads: number;
  severity: "warning" | "critical";
}

interface CapacityAutomationProps {
  brokers: Broker[];
  onReassign: (fromBrokerId: string, toBrokerId: string) => Promise<void>;
}

export function CapacityAutomation({ brokers, onReassign }: CapacityAutomationProps) {
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
  const [autoReassign, setAutoReassign] = useState(true);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkCapacityAlerts();
  }, [brokers]);

  const checkCapacityAlerts = () => {
    const newAlerts: CapacityAlert[] = [];

    brokers.forEach((broker) => {
      if (broker.status !== "active") return;
      
      const usage = broker.capacity > 0 ? (broker.active_leads / broker.capacity) * 100 : 0;

      if (usage >= 100) {
        newAlerts.push({
          brokerId: broker.id,
          brokerName: broker.name,
          usage,
          capacity: broker.capacity,
          activeLeads: broker.active_leads,
          severity: "critical",
        });
      } else if (usage >= 80) {
        newAlerts.push({
          brokerId: broker.id,
          brokerName: broker.name,
          usage,
          capacity: broker.capacity,
          activeLeads: broker.active_leads,
          severity: "warning",
        });
      }
    });

    setAlerts(newAlerts);
  };

  const getAvailableBroker = (excludeId: string): Broker | null => {
    const available = brokers
      .filter(
        (b) =>
          b.id !== excludeId &&
          b.status === "active" &&
          b.active_leads < b.capacity * 0.8
      )
      .sort((a, b) => {
        const aUsage = a.active_leads / a.capacity;
        const bUsage = b.active_leads / b.capacity;
        return aUsage - bUsage;
      });

    return available[0] || null;
  };

  const handleAutoReassign = async (alert: CapacityAlert) => {
    const targetBroker = getAvailableBroker(alert.brokerId);
    
    if (!targetBroker) {
      toast.error("No available brokers with capacity");
      return;
    }

    setReassigning(alert.brokerId);
    try {
      await onReassign(alert.brokerId, targetBroker.id);
      toast.success(
        `Leads reassigned from ${alert.brokerName} to ${targetBroker.name}`
      );
      checkCapacityAlerts();
    } catch (error) {
      toast.error("Failed to reassign leads");
    } finally {
      setReassigning(null);
    }
  };

  const sendCapacityAlert = async () => {
    setLoading(true);
    try {
      // Trigger the daily report with capacity alerts
      const { error } = await supabase.functions.invoke("broker-daily-report");
      if (error) throw error;
      toast.success("Capacity alert report sent to admins");
    } catch (error) {
      console.error("Failed to send alert:", error);
      toast.error("Failed to send capacity alert");
    } finally {
      setLoading(false);
    }
  };

  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const warningAlerts = alerts.filter((a) => a.severity === "warning");

  return (
    <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Zap className="h-5 w-5 text-[#1A1A1A]" />
            </div>
            <div>
              <CardTitle className="text-white">Capacity Automation</CardTitle>
              <p className="text-[#1A1A1A]/70 text-sm mt-1">
                Auto-manage lead distribution when capacity is reached
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#1A1A1A]/70 text-sm">Auto-reassign</span>
              <Switch
                checked={autoReassign}
                onCheckedChange={setAutoReassign}
                className="data-[state=checked]:bg-[#EFE6D6]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={sendCapacityAlert}
              disabled={loading || alerts.length === 0}
              className="border-[#1A1A1A] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Send Alert Report
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1A1A1A] rounded-lg p-4 text-center">
            <p className="text-[#1A1A1A]/70 text-xs mb-1">ACTIVE BROKERS</p>
            <p className="text-white text-2xl font-bold">
              {brokers.filter((b) => b.status === "active").length}
            </p>
          </div>
          <div className="bg-[#1A1A1A] rounded-lg p-4 text-center">
            <p className="text-[#1A1A1A] text-xs mb-1">WARNINGS</p>
            <p className="text-[#1A1A1A] text-2xl font-bold">
              {warningAlerts.length}
            </p>
          </div>
          <div className="bg-[#1A1A1A] rounded-lg p-4 text-center">
            <p className="text-red-400 text-xs mb-1">CRITICAL</p>
            <p className="text-red-400 text-2xl font-bold">
              {criticalAlerts.length}
            </p>
          </div>
        </div>

        {/* Alerts List */}
        {alerts.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-white font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#1A1A1A]" />
              Capacity Alerts
            </h4>

            {alerts.map((alert) => {
              const targetBroker = getAvailableBroker(alert.brokerId);

              return (
                <div
                  key={alert.brokerId}
                  className={`p-4 rounded-lg border ${
                    alert.severity === "critical"
                      ? "bg-red-950/30 border-red-500/30"
                      : "bg-amber-950/30 border-amber-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          alert.severity === "critical"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-amber-500/20 text-[#1A1A1A] border-amber-500/30"
                        }
                      >
                        {alert.severity === "critical" ? "CRITICAL" : "WARNING"}
                      </Badge>
                      <div>
                        <p className="text-white font-medium">
                          {alert.brokerName}
                        </p>
                        <p className="text-[#1A1A1A]/70 text-sm">
                          {alert.activeLeads}/{alert.capacity} leads (
                          {Math.round(alert.usage)}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {targetBroker && autoReassign && (
                        <Button
                          size="sm"
                          onClick={() => handleAutoReassign(alert)}
                          disabled={reassigning === alert.brokerId}
                          className="bg-[#EFE6D6] hover:bg-[#EFE6D6]-dark text-[#1A1A1A]"
                        >
                          {reassigning === alert.brokerId ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-2" />
                          )}
                          Reassign to {targetBroker.name.split(" ")[0]}
                        </Button>
                      )}
                      {!targetBroker && (
                        <span className="text-red-400 text-sm">
                          No available brokers
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-emerald-400 font-medium">All brokers operating normally</p>
            <p className="text-[#1A1A1A]/70 text-sm mt-1">
              No capacity alerts at this time
            </p>
          </div>
        )}

        {/* Default Capacity Info */}
        <div className="mt-4 p-4 bg-[#1A1A1A]/50 rounded-lg border border-[#1A1A1A]">
          <div className="flex items-center gap-2 text-[#1A1A1A]/70 text-sm">
            <Settings className="h-4 w-4" />
            <span>
              Default daily capacity: <strong className="text-white">150 leads/day</strong>
            </span>
          </div>
          <p className="text-[#1A1A1A]/70 text-xs mt-2">
            When a broker reaches 100% capacity, new leads are automatically
            assigned to the next available broker with the lowest load.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
