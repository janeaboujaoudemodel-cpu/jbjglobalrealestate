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
  Phone,
  MessageSquare,
  MoreVertical,
  Play,
  Pause,
  Settings,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AIBroker {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  gender: string;
  avatar_url: string | null;
  bio: string | null;
  status: "active" | "paused" | "offline";
  specialization: string[] | null;
  languages: string[] | null;
  total_leads_handled: number | null;
  total_conversions: number | null;
  average_response_time_seconds: number | null;
  current_daily_interactions: number | null;
  daily_interaction_limit: number | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
}

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
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-zinc-700">
                <AvatarImage src={broker.avatar_url || undefined} alt={broker.name} />
                <AvatarFallback className="bg-zinc-800 text-gold text-lg">
                  {broker.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-zinc-900 ${
                  broker.status === "active"
                    ? "bg-emerald-500"
                    : broker.status === "paused"
                    ? "bg-amber-500"
                    : "bg-zinc-500"
                }`}
              />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{broker.name}</h3>
              <p className="text-gray-400 text-sm">{broker.email}</p>
              <div className="flex gap-2 mt-1">
                {broker.specialization?.slice(0, 2).map((spec) => (
                  <Badge
                    key={spec}
                    variant="outline"
                    className="border-zinc-700 text-gray-400 text-xs"
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {isActive ? "Active" : "Paused"}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) =>
                  onStatusChange(broker.id, checked ? "active" : "paused")
                }
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-zinc-900 border-zinc-700"
              >
                <DropdownMenuItem
                  onClick={() => onEdit(broker)}
                  className="text-gray-300 focus:bg-zinc-800"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onViewStats(broker.id)}
                  className="text-gray-300 focus:bg-zinc-800"
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
            <span className="text-gray-400">Daily Capacity</span>
            <span className="text-white">
              {capacityUsed} / {capacityLimit}
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
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
          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 text-gold mx-auto mb-1" />
            <p className="text-white font-semibold">
              {broker.total_leads_handled || 0}
            </p>
            <p className="text-gray-500 text-xs">Leads</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-white font-semibold">{conversionRate}%</p>
            <p className="text-gray-500 text-xs">Conversion</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <Clock className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <p className="text-white font-semibold">
              {formatResponseTime(broker.average_response_time_seconds)}
            </p>
            <p className="text-gray-500 text-xs">Avg Response</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <MessageSquare className="h-4 w-4 text-purple-500 mx-auto mb-1" />
            <p className="text-white font-semibold">
              {broker.working_hours_start?.slice(0, 5) || "09:00"} -{" "}
              {broker.working_hours_end?.slice(0, 5) || "18:00"}
            </p>
            <p className="text-gray-500 text-xs">Hours</p>
          </div>
        </div>

        {/* Languages */}
        {broker.languages && broker.languages.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Languages:</span>
            <div className="flex gap-1">
              {broker.languages.map((lang) => (
                <Badge
                  key={lang}
                  className="bg-zinc-800 text-gray-300 text-xs"
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800"
          >
            <Mail className="h-4 w-4 mr-2" />
            Test Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Test Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
