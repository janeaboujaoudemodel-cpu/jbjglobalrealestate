import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, Users, TrendingUp } from "lucide-react";

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

interface BrokerPerformanceCardProps {
  broker: Broker;
  onToggleStatus: () => void;
}

export function BrokerPerformanceCard({ broker, onToggleStatus }: BrokerPerformanceCardProps) {
  const usagePercent = Math.min((broker.active_leads / broker.capacity) * 100, 100);

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-gold/30">
              {broker.avatar_url ? (
                <AvatarImage src={broker.avatar_url} alt={broker.name} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-gold to-gold-dark text-black font-bold text-lg">
                  {getInitials(broker.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="text-white font-semibold text-lg">{broker.name}</h3>
              <p className="text-gray-400 text-sm">{broker.email}</p>
              {broker.specialization && (
                <p className="text-gold text-xs mt-1">{broker.specialization}</p>
              )}
            </div>
          </div>
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

        {/* Capacity Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400 flex items-center gap-1">
              <Users className="h-3 w-3" /> Active Leads
            </span>
            <span className="text-white">{broker.active_leads} / {broker.capacity}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={onToggleStatus}
          variant="outline"
          className={`w-full ${
            broker.status === "active"
              ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          }`}
        >
          {broker.status === "active" ? (
            <>
              <Pause className="h-4 w-4 mr-2" /> Pause Broker
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" /> Resume Broker
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
