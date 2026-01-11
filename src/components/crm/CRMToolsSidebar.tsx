import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Scale, Calculator, FileText, Ruler, Palette, Video, 
  CreditCard, Users, UserCheck, Briefcase, Camera, 
  Share2, Brain, Layers, BarChart3, Table2, Calendar,
  MessageSquare, Target, GraduationCap, Wrench, Building2,
  X
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
      { name: "Business Card Scanner", href: "/business-card-scanner", icon: CreditCard, color: "text-gold" },
      { name: "AI Calendar", href: "/ai-calendar", icon: Calendar, color: "text-pink-400" },
    ]
  },
  {
    name: "HR & Team",
    tools: [
      { name: "HR Manager", href: "/hr-agent", icon: Users, color: "text-orange-400" },
      { name: "Employees Hub", href: "/crm", icon: UserCheck, color: "text-teal-400", tab: "employees" },
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
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 w-80 bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-gold" />
          <h3 className="font-semibold text-white">CRM Tools</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tools List */}
      <ScrollArea className="h-[calc(100vh-64px)]">
        <div className="p-4 space-y-6">
          {toolCategories.map((category) => (
            <div key={category.name}>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                {category.name}
              </h4>
              <div className="space-y-1">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.name}
                    to={tool.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all group"
                  >
                    <tool.icon className={cn("w-4 h-4", tool.color)} />
                    <span>{tool.name}</span>
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
