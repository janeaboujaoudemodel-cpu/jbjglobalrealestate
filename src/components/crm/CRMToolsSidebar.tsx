import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Scale, Calculator, FileText, Ruler, Palette, Video, 
  CreditCard, Users, UserCheck, Briefcase, Camera, 
  Share2, Brain, Layers, BarChart3, Table2, Calendar,
  MessageSquare, Target, GraduationCap, Wrench, Building2,
  X, Zap, CheckSquare, Bell, StickyNote, LayoutDashboard, Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CRMToolsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const toolCategories = [
  {
    name: "Owner Command Center",
    tools: [
      { name: "Dashboard", href: "/owner", icon: LayoutDashboard, color: "text-[#1A1A1A]" },
      { name: "Daily Agenda", href: "/owner/agenda", icon: Calendar, color: "text-blue-400" },
      { name: "Unified Inbox", href: "/owner/inbox", icon: MessageSquare, color: "text-emerald-400" },
      { name: "Message Templates", href: "/owner/templates", icon: FileText, color: "text-purple-400" },
      { name: "Media Ingestion", href: "/admin/media-ingestion", icon: Inbox, color: "text-[#1A1A1A]" },
      { name: "Communication Settings", href: "/owner/settings/communication", icon: Wrench, color: "text-white/70" },
      { name: "Feature Registry", href: "/owner/features", icon: Layers, color: "text-pink-400" },
    ]
  },
  {
    name: "CRM Modules",
    tools: [
      { name: "Leads Inbox", href: "/crm/leads", icon: Users, color: "text-[#1A1A1A]" },
      { name: "Automations", href: "/automations", icon: Zap, color: "text-amber-400", adminOnly: true },
      { name: "My Tasks", href: "/crm/tasks", icon: CheckSquare, color: "text-emerald-400" },
      { name: "Calendar", href: "/crm/calendar", icon: Calendar, color: "text-blue-400" },
      { name: "Notes", href: "/crm/notes", icon: StickyNote, color: "text-purple-400" },
      { name: "Reminders", href: "/crm/reminders", icon: Bell, color: "text-rose-400" },
    ]
  },
  {
    name: "Property Tools",
    tools: [
      { name: "Property Comparison", href: "/compare", icon: Scale, color: "text-blue-400" },
      { name: "Property Evaluator", href: "/property-evaluator", icon: BarChart3, color: "text-emerald-400" },
      { name: "Mortgage Calculator", href: "/mortgage-calculator", icon: Calculator, color: "text-amber-400" },
      { name: "Property Map", href: "/map", icon: Building2, color: "text-cyan-400" },
    ]
  },
  {
    name: "Documents & Signatures",
    tools: [
      { name: "Scan & Sign", href: "/document-scanner", icon: FileText, color: "text-purple-400" },
      { name: "JBJ Documents", href: "/documents", icon: Layers, color: "text-indigo-400" },
      { name: "Spreadsheet", href: "/spreadsheet", icon: Table2, color: "text-green-400" },
    ]
  },
  {
    name: "Communication",
    tools: [
      { name: "VideoMeet", href: "/video-meeting", icon: Video, color: "text-red-400" },
      { name: "Business Card Scanner", href: "/business-card-scanner", icon: CreditCard, color: "text-[#1A1A1A]" },
      { name: "AI Calendar", href: "/ai-calendar", icon: Calendar, color: "text-pink-400" },
    ]
  },
  {
    name: "HR & Team",
    tools: [
      { name: "HR Manager", href: "/hr-agent", icon: Users, color: "text-orange-400" },
      { name: "Employees Hub", href: "/crm/employees", icon: UserCheck, color: "text-teal-400" },
      { name: "Onboarding", href: "/onboarding", icon: GraduationCap, color: "text-violet-400" },
    ]
  },
  {
    name: "Hub & Assistants",
    tools: [
      { name: "JBJ Broker Hub", href: "/ai-hub", icon: Brain, color: "text-fuchsia-400" },
      { name: "Executive Assistant", href: "/executive-assistant", icon: Briefcase, color: "text-sky-400" },
      { name: "Property Coach", href: "/quiz", icon: Target, color: "text-lime-400" },
    ]
  },
  {
    name: "Media & Marketing",
    tools: [
      { name: "Design Studio", href: "/jbj-design-studio", icon: Palette, color: "text-rose-400" },
      { name: "Video Builder", href: "/video-builder", icon: Camera, color: "text-amber-500" },
      { name: "Social Workshop", href: "/broker-toolkit", icon: Share2, color: "text-blue-500" },
    ]
  },
];

const CRMToolsSidebar = ({ isOpen, onClose }: CRMToolsSidebarProps) => {
  const location = useLocation();
  
  if (!isOpen) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed left-0 top-0 bottom-0 w-72 bg-[#FDFBF7] border-r border-[#B89555]/30 z-50 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#B89555]/30 bg-[#F7F2EA]">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="font-semibold text-[#1A1A1A]">CRM Navigation</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tools List */}
      <ScrollArea className="h-[calc(100vh-64px)]">
        <div className="p-4 space-y-6">
          {toolCategories.map((category) => (
            <div key={category.name}>
              <h4 className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider mb-3">
                {category.name}
              </h4>
              <div className="space-y-1">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.name}
                    to={tool.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                      isActive(tool.href)
                        ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40"
                        : "text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#F7F2EA]"
                    )}
                  >
                    <tool.icon className={cn("w-4 h-4", isActive(tool.href) ? "text-[#1A1A1A]" : "text-[#1A1A1A]/70")} />
                    <span>{tool.name}</span>
                    {'adminOnly' in tool && tool.adminOnly && (
                      <span className="ml-auto text-[10px] text-amber-700 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

export default CRMToolsSidebar;
