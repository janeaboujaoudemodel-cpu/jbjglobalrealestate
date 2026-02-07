/**
 * Owner Feature Registry - JBJ Global Real Estate
 * Lists all implemented features with navigation paths
 * VISIBILITY GUARANTEE: Every feature is listed here
 */

import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ExternalLink,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Settings,
  Sparkles,
  Mic,
  Mail,
  LayoutDashboard,
  Target,
  Bell,
  CheckSquare,
  Inbox,
  Brain,
  Shield,
  ChevronRight,
  BookOpen,
  Zap,
} from "lucide-react";

interface FeatureItem {
  name: string;
  description: string;
  path: string;
  category: string;
  icon: React.ReactNode;
  status: 'active' | 'coming_soon';
  isAIPowered?: boolean;
  isApprovalBased?: boolean;
  isAutomated?: boolean;
}

const FEATURES: FeatureItem[] = [
  // Owner Dashboard & CRM
  {
    name: "Owner Dashboard",
    description: "Main command center with KPIs, leads, tasks, and conversations",
    path: "/owner",
    category: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    status: 'active',
  },
  {
    name: "Daily Agenda",
    description: "Today's tasks, follow-ups, overdue items, and messages needing reply",
    path: "/owner/agenda",
    category: "Dashboard",
    icon: <Calendar className="h-4 w-4" />,
    status: 'active',
  },
  {
    name: "Leads Inbox",
    description: "Full lead management with search, filters, and inline actions",
    path: "/crm/leads",
    category: "CRM",
    icon: <Users className="h-4 w-4" />,
    status: 'active',
  },
  {
    name: "Lead Detail",
    description: "Individual lead profile with notes, activity, and tasks",
    path: "/crm/leads/:id",
    category: "CRM",
    icon: <Users className="h-4 w-4" />,
    status: 'active',
  },
  {
    name: "CRM Tasks",
    description: "Task management linked to leads with due dates and priorities",
    path: "/crm/tasks",
    category: "CRM",
    icon: <CheckSquare className="h-4 w-4" />,
    status: 'active',
  },
  {
    name: "CRM Calendar",
    description: "Calendar view of appointments and scheduled follow-ups",
    path: "/crm/calendar",
    category: "CRM",
    icon: <Calendar className="h-4 w-4" />,
    status: 'active',
  },
  {
    name: "CRM Notes",
    description: "Quick notes and memos linked to leads",
    path: "/crm/notes",
    category: "CRM",
    icon: <FileText className="h-4 w-4" />,
    status: 'active',
  },
  {
    name: "CRM Reminders",
    description: "Set and manage reminders for follow-ups",
    path: "/crm/reminders",
    category: "CRM",
    icon: <Bell className="h-4 w-4" />,
    status: 'active',
  },
  
  // Communication
  {
    name: "Unified Inbox",
    description: "All channels (WhatsApp, Email, Instagram, Facebook) in one place",
    path: "/owner/inbox",
    category: "Communication",
    icon: <Inbox className="h-4 w-4" />,
    status: 'active',
    isAIPowered: true,
  },
  {
    name: "Message Templates",
    description: "Reusable templates for WhatsApp, Email, DM, and Voice",
    path: "/owner/templates",
    category: "Communication",
    icon: <FileText className="h-4 w-4" />,
    status: 'active',
  },
  {
    name: "Communication Settings",
    description: "Connect channels, configure AI behavior, tone profile, voice settings",
    path: "/owner/settings/communication",
    category: "Communication",
    icon: <Settings className="h-4 w-4" />,
    status: 'active',
  },
  
  // AI Features
  {
    name: "AI Reply Engine",
    description: "Generate AI-powered text replies in Owner's style",
    path: "/owner/inbox",
    category: "AI Assistant",
    icon: <Sparkles className="h-4 w-4" />,
    status: 'active',
    isAIPowered: true,
    isApprovalBased: true,
  },
  {
    name: "Voice Replies (ElevenLabs)",
    description: "Generate voice notes using Owner's cloned voice",
    path: "/owner/inbox",
    category: "AI Assistant",
    icon: <Mic className="h-4 w-4" />,
    status: 'active',
    isAIPowered: true,
    isApprovalBased: true,
  },
  {
    name: "AI Learning System",
    description: "AI learns from Owner corrections to improve over time",
    path: "/owner/settings/communication",
    category: "AI Assistant",
    icon: <Brain className="h-4 w-4" />,
    status: 'active',
    isAutomated: true,
  },
  {
    name: "Tone Profile",
    description: "Configure AI formality, emoji usage, message length preferences",
    path: "/owner/settings/communication",
    category: "AI Assistant",
    icon: <Settings className="h-4 w-4" />,
    status: 'active',
  },
  
  // Automations
  {
    name: "Workflow Automations",
    description: "Create automated workflows and triggers",
    path: "/automations",
    category: "Automation",
    icon: <Zap className="h-4 w-4" />,
    status: 'active',
  },
  
  // System
  {
    name: "Feature Registry",
    description: "This page - lists all implemented features",
    path: "/owner/features",
    category: "System",
    icon: <BookOpen className="h-4 w-4" />,
    status: 'active',
  },
  {
    name: "Security Console",
    description: "Security settings and audit logs",
    path: "/security-console",
    category: "System",
    icon: <Shield className="h-4 w-4" />,
    status: 'active',
  },
];

const CATEGORIES = [
  { name: "All", count: FEATURES.length },
  { name: "Dashboard", count: FEATURES.filter(f => f.category === "Dashboard").length },
  { name: "CRM", count: FEATURES.filter(f => f.category === "CRM").length },
  { name: "Communication", count: FEATURES.filter(f => f.category === "Communication").length },
  { name: "AI Assistant", count: FEATURES.filter(f => f.category === "AI Assistant").length },
  { name: "Automation", count: FEATURES.filter(f => f.category === "Automation").length },
  { name: "System", count: FEATURES.filter(f => f.category === "System").length },
];

export default function OwnerFeatureRegistry() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFeatures = FEATURES.filter(f => {
    const matchesSearch = !searchQuery || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const aiPoweredCount = FEATURES.filter(f => f.isAIPowered).length;
  const approvalBasedCount = FEATURES.filter(f => f.isApprovalBased).length;
  const automatedCount = FEATURES.filter(f => f.isAutomated).length;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white/80 backdrop-blur-sm border-2 border-gold/30 rounded-2xl p-4 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/30">
                  <BookOpen className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Feature Registry</h1>
                  <p className="text-zinc-500 text-sm">Complete list of all implemented features</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-gold/10 text-gold border border-gold/30">
                  {FEATURES.length} Features
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-purple-700">AI-Powered</span>
                </div>
                <p className="text-xl font-bold text-purple-900">{aiPoweredCount}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">Approval-Based</span>
                </div>
                <p className="text-xl font-bold text-blue-900">{approvalBasedCount}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Automated</span>
                </div>
                <p className="text-xl font-bold text-green-900">{automatedCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gold/30"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Badge
                  key={cat.name}
                  variant={selectedCategory === cat.name ? 'default' : 'outline'}
                  className={`cursor-pointer ${selectedCategory === cat.name ? 'bg-gold text-black' : 'border-gold/30 hover:bg-gold/10'}`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  {cat.name} ({cat.count})
                </Badge>
              ))}
            </div>
          </div>

          {/* Features List */}
          <Card className="border-2 border-gold/20 bg-white/90">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedCategory === 'All' ? 'All Features' : selectedCategory} ({filteredFeatures.length})
              </CardTitle>
              <CardDescription>
                Click on any feature to navigate to it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-2">
                  {filteredFeatures.map((feature, idx) => (
                    <motion.div
                      key={feature.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gold/20 bg-white hover:bg-gold/5 cursor-pointer transition-all group"
                      onClick={() => {
                        if (!feature.path.includes(':')) {
                          navigate(feature.path);
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                        {feature.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-black">{feature.name}</p>
                          {feature.isAIPowered && (
                            <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5">AI</Badge>
                          )}
                          {feature.isApprovalBased && (
                            <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5">Approval</Badge>
                          )}
                          {feature.isAutomated && (
                            <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5">Auto</Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 truncate">{feature.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gold/30 text-xs">
                          {feature.category}
                        </Badge>
                        <code className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded hidden md:block">
                          {feature.path}
                        </code>
                        <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-gold transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="mt-6 p-4 bg-white/80 border-2 border-gold/20 rounded-xl">
            <h3 className="font-semibold text-black mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 text-xs">AI</Badge>
                <span className="text-zinc-600">AI-powered feature</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 text-xs">Approval</Badge>
                <span className="text-zinc-600">Requires Owner approval before action</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 text-xs">Auto</Badge>
                <span className="text-zinc-600">Runs automatically</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
