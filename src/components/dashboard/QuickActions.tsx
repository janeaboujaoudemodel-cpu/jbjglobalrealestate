import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileCheck, 
  MapPin, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

export function QuickActions() {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      label: "Register Deal",
      description: "Submit a new closed deal",
      icon: FileCheck,
      href: "/broker-dashboard/deals",
      color: "text-emerald-400",
    },
    {
      label: "Site Check-In",
      description: "Log a developer visit",
      icon: MapPin,
      href: "/broker-dashboard/visits",
      color: "text-blue-400",
    },
    {
      label: "Training",
      description: "Continue learning",
      icon: GraduationCap,
      href: "/broker-education",
      color: "text-purple-400",
    },
    {
      label: "Resources",
      description: "Access broker tools",
      icon: BookOpen,
      href: "/broker-resources",
      color: "text-amber-400",
    },
    {
      label: "Schedule Visit",
      description: "Book a briefing",
      icon: Calendar,
      href: "/broker-dashboard/developer-visits",
      color: "text-cyan-400",
    },
    {
      label: "AI Tools",
      description: "Explore AI assistants",
      icon: Sparkles,
      href: "/broker-resources#ai-tools",
      color: "text-primary",
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-3 flex flex-col items-start gap-1 hover:border-primary/50 transition-colors"
              onClick={() => navigate(action.href)}
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className={`h-4 w-4 ${action.color}`} />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
