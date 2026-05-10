import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, Users, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Broker {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  capacity: number;
  active_leads: number;
  status: string;
  specialization: string | null;
}

interface BrokerCapacityPanelProps {
  brokers: Broker[];
  onUpdate: () => void;
}

export function BrokerCapacityPanel({ brokers, onUpdate }: BrokerCapacityPanelProps) {
  const [capacities, setCapacities] = useState<Record<string, number>>(
    brokers.reduce((acc, b) => ({ ...acc, [b.id]: b.capacity }), {})
  );
  const [saving, setSaving] = useState<string | null>(null);

  const handleCapacityChange = (brokerId: string, value: number[]) => {
    setCapacities((prev) => ({ ...prev, [brokerId]: value[0] }));
  };

  const handleSave = async (brokerId: string) => {
    setSaving(brokerId);
    try {
      const { error } = await supabase
        .from("jbj_brokers")
        .update({ capacity: capacities[brokerId] })
        .eq("id", brokerId);

      if (error) throw error;

      toast.success("Capacity updated successfully");
      onUpdate();
    } catch (error) {
      console.error("Error updating capacity:", error);
      toast.error("Failed to update capacity");
    } finally {
      setSaving(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Guidance Card */}
      <div className="jj-card-inner flex items-start gap-4 p-4">
        <div className="jj-icon-box-active w-10 h-10 flex-shrink-0">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-semibold text-[#1A1A1A] mb-1">What are Capacity Settings?</h4>
          <p className="text-sm text-[#1A1A1A]/70">
            Each broker has a daily lead capacity limit. This controls how many leads can be assigned to them 
            before they are considered "at capacity." Adjust the slider or input a number to set the maximum 
            leads per day for each broker. When a broker reaches 80%+ capacity, they show a warning; at 100%, 
            new leads are redirected to available brokers.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="jj-icon-box-active w-10 h-10">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">Broker Capacity Settings</h3>
          <p className="text-sm text-[#1A1A1A]/60">{brokers.length} brokers configured</p>
        </div>
      </div>

      {/* Broker List */}
      <div className="space-y-4">
        {brokers.map((broker) => {
          const currentCapacity = capacities[broker.id] || broker.capacity;
          const usagePercent = Math.min((broker.active_leads / currentCapacity) * 100, 100);
          const hasChanged = currentCapacity !== broker.capacity;

          return (
            <div
              key={broker.id}
              className="jj-card-inner space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-[#B89555]/40">
                    {broker.avatar_url ? (
                      <AvatarImage src={broker.avatar_url} alt={broker.name} />
                    ) : (
                      <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A] font-bold">
                        {getInitials(broker.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="text-[#1A1A1A] font-medium">{broker.name}</h3>
                    <p className="text-[#1A1A1A]/60 text-sm">{broker.email}</p>
                  </div>
                </div>
                <Badge
                  className={
                    broker.status === "active"
                      ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
                      : broker.status === "paused"
                      ? "bg-amber-500/20 text-amber-700 border-amber-500/30"
                      : "bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30"
                  }
                >
                  {broker.status}
                </Badge>
              </div>

              {/* Current Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#1A1A1A]/60 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Current Load
                  </span>
                  <span className="text-[#1A1A1A] font-medium">
                    {broker.active_leads} / {currentCapacity} leads
                  </span>
                </div>
                <div className="h-2 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      usagePercent > 90
                        ? "bg-red-500"
                        : usagePercent > 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>

              {/* Capacity Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[#1A1A1A]/60 text-sm">Daily Capacity Limit</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={currentCapacity}
                      onChange={(e) =>
                        setCapacities((prev) => ({
                          ...prev,
                          [broker.id]: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-20 text-center"
                      min={1}
                      max={500}
                    />
                    <span className="text-[#1A1A1A]/60 text-sm">leads/day</span>
                  </div>
                </div>
                <Slider
                  value={[currentCapacity]}
                  onValueChange={(value) => handleCapacityChange(broker.id, value)}
                  min={50}
                  max={300}
                  step={10}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-[#1A1A1A]/40">
                  <span>50</span>
                  <span>150</span>
                  <span>200</span>
                  <span>300</span>
                </div>
              </div>

              {/* Save Button */}
              {hasChanged && (
                <Button
                  onClick={() => handleSave(broker.id)}
                  disabled={saving === broker.id}
                  variant="primary"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving === broker.id ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          );
        })}

        {brokers.length === 0 && (
          <div className="jj-card-inner text-center py-8 text-[#1A1A1A]/60">
            No brokers configured. Add brokers to manage their capacity.
          </div>
        )}
      </div>
    </div>
  );
}
