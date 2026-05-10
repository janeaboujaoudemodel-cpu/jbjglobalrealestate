import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, Users } from "lucide-react";

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
    <div className="jj-card-inner">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 border-2 border-[#B89555]/40">
            {broker.avatar_url ? (
              <AvatarImage src={broker.avatar_url} alt={broker.name} />
            ) : (
              <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A] font-bold text-lg">
                {getInitials(broker.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="text-[#1A1A1A] font-semibold text-lg">{broker.name}</h3>
            <p className="text-[#1A1A1A]/60 text-sm">{broker.email}</p>
            {broker.specialization && (
              <p className="text-[#1A1A1A] text-xs mt-1">{broker.specialization}</p>
            )}
          </div>
        </div>
        <Badge
          className={
            broker.status === "active"
              ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
              : broker.status === "paused"
              ? "bg-amber-500/20 text-amber-700 border-amber-500/30"
              : "bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30/30"
          }
        >
          {broker.status}
        </Badge>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#1A1A1A]/60 flex items-center gap-1">
            <Users className="h-3 w-3" /> Active Leads
          </span>
          <span className="text-[#1A1A1A] font-medium">{broker.active_leads} / {broker.capacity}</span>
        </div>
        <div className="h-2 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
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
        variant="secondary"
        className="w-full"
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
    </div>
  );
}
