import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  MessageSquare,
  MoreVertical,
  Settings,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AIBroker } from "./types";

interface AIBrokerCardProps {
  broker: AIBroker;
  onStatusChange: (brokerId: string, status: "active" | "paused") => void;
  onEdit: (broker: AIBroker) => void;
  onViewStats: (brokerId: string) => void;
}

export function AIBrokerCard({
  broker,
  onStatusChange,
  onEdit,
  onViewStats,
}: AIBrokerCardProps) {
  const isActive = broker.status === "active";
  const conversionRate =
    broker.total_leads_handled && broker.total_conversions
      ? ((broker.total_conversions / broker.total_leads_handled) * 100).toFixed(1)
      : "0";

  const capacityUsed = broker.current_daily_interactions || 0;
  const capacityLimit = broker.daily_interaction_limit || 150;
  const capacityPercent = Math.min((capacityUsed / capacityLimit) * 100, 100);

  const formatResponseTime = (seconds: number | null) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <Card className="bg-white border-2 border-gold/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-gold/30">
                <AvatarImage src={broker.avatar_url || undefined} alt={broker.name} />
                <AvatarFallback className="bg-gold/10 text-gold text-lg">
                  {broker.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                  broker.status === "active"
                    ? "bg-emerald-500"
                    : broker.status === "paused"
                    ? "bg-amber-500"
                    : "bg-zinc-400"
                }`}
              />
            </div>
            <div>
              <h3 className="text-black font-semibold text-lg">{broker.name}</h3>
              <p className="text-black/60 text-sm">{broker.email}</p>
              <div className="flex gap-2 mt-1">
                {broker.specialization?.slice(0, 2).map((spec) => (
                  <Badge
                    key={spec}
                    variant="outline"
                    className="border-gold/30 text-black/60 text-xs"
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2 flex-shrink-0">
            <span className="text-sm text-black/60 whitespace-nowrap">
              {isActive ? "Active" : "Paused"}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) =>
                onStatusChange(broker.id, checked ? "active" : "paused")
              }
              className="data-[state=checked]:bg-emerald-500"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-black/60">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white border-2 border-gold/30 z-50"
              >
                <DropdownMenuItem
                  onClick={() => onEdit(broker)}
                  className="text-black hover:bg-gold/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onViewStats(broker.id)}
                  className="text-black hover:bg-gold/10"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Capacity Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-black/60">Daily Capacity</span>
            <span className="text-black">
              {capacityUsed} / {capacityLimit}
            </span>
          </div>
          <div className="h-2 bg-gold/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                capacityPercent > 90
                  ? "bg-red-500"
                  : capacityPercent > 70
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 text-gold mx-auto mb-1" />
            <p className="text-black font-semibold">
              {broker.total_leads_handled || 0}
            </p>
            <p className="text-black/50 text-xs">Leads</p>
          </div>
          <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-black font-semibold">{conversionRate}%</p>
            <p className="text-black/50 text-xs">Conversion</p>
          </div>
          <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 text-center">
            <Clock className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <p className="text-black font-semibold">
              {formatResponseTime(broker.average_response_time_seconds)}
            </p>
            <p className="text-black/50 text-xs">Avg Response</p>
          </div>
          <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 text-center">
            <MessageSquare className="h-4 w-4 text-purple-500 mx-auto mb-1" />
            <p className="text-black font-semibold">
              {broker.working_hours_start?.slice(0, 5) || "09:00"} -{" "}
              {broker.working_hours_end?.slice(0, 5) || "18:00"}
            </p>
            <p className="text-black/50 text-xs">Hours</p>
          </div>
        </div>

        {/* Languages */}
        {broker.languages && broker.languages.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-black/60">Languages:</span>
            <div className="flex gap-1">
              {broker.languages.map((lang) => (
                <Badge
                  key={lang}
                  className="bg-gold/10 text-black/70 text-xs border border-gold/20"
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-gold/20">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gold/30 text-black hover:bg-gold/10"
          >
            <Mail className="h-4 w-4 mr-2" />
            Test Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gold/30 text-black hover:bg-gold/10"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Test Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
