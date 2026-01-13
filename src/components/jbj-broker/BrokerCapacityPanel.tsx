import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, Users } from "lucide-react";
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
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Settings className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-white">Broker Capacity Settings</CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              Configure daily lead capacity for each broker
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {brokers.map((broker) => {
          const currentCapacity = capacities[broker.id] || broker.capacity;
          const usagePercent = Math.min((broker.active_leads / currentCapacity) * 100, 100);
          const hasChanged = currentCapacity !== broker.capacity;

          return (
            <div
              key={broker.id}
              className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-zinc-600">
                    {broker.avatar_url ? (
                      <AvatarImage src={broker.avatar_url} alt={broker.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-gold to-gold-dark text-black font-bold">
                        {getInitials(broker.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="text-white font-medium">{broker.name}</h3>
                    <p className="text-gray-400 text-sm">{broker.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      broker.status === "active"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : broker.status === "paused"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }
                  >
                    {broker.status}
                  </Badge>
                </div>
              </div>

              {/* Current Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Current Load
                  </span>
                  <span className="text-white">
                    {broker.active_leads} / {currentCapacity} leads
                  </span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
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
                  <label className="text-gray-400 text-sm">Daily Capacity Limit</label>
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
                      className="w-20 bg-zinc-700 border-zinc-600 text-white text-center"
                      min={1}
                      max={500}
                    />
                    <span className="text-gray-400 text-sm">leads/day</span>
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
                <div className="flex justify-between text-xs text-gray-500">
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
                  className="w-full bg-gold hover:bg-gold-dark text-black"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving === broker.id ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          );
        })}

        {brokers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No brokers configured
          </div>
        )}
      </CardContent>
    </Card>
  );
}
