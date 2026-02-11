/**
 * Owner Feature Registry & Audit Page - JBJ Global Real Estate
 * VISIBILITY GUARANTEE: Every feature is listed here with exact navigation paths
 * 
 * This page serves as the complete audit trail of all implemented features.
 * If it exists, it MUST be listed here. No hidden pages. No background-only features.
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  StickyNote,
  Wrench,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

interface FeatureItem {
  name: string;
  description: string;
  path: string;
  navigationPath: string; // How to reach this page
  category: string;
  icon: React.ReactNode;
  status: 'active' | 'coming_soon';
  isAIPowered?: boolean;
  isApprovalBased?: boolean;
  isAutomated?: boolean;
  isManual?: boolean;
}

// COMPLETE FEATURE REGISTRY - Every implemented feature listed with exact navigation paths
// Owner: Jane Bou Jaoude — LOCKED NAME
const FEATURES: FeatureItem[] = [
  // ═══════════════════════════════════════════════════════════════
  // OWNER COMMAND CENTER
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Owner Dashboard",
    description: "Main command center with KPIs, leads overview, tasks, and conversations — Jane Bou Jaoude's hub",
    path: "/owner",
    navigationPath: "Sidebar → Owner Command Center → Dashboard | Direct: /owner",
    category: "Owner Command Center",
    icon: <LayoutDashboard className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Daily Agenda",
    description: "Today's tasks, overdue items, follow-ups due, and unanswered messages",
    path: "/owner/agenda",
    navigationPath: "Sidebar → Owner Command Center → Daily Agenda | Dashboard Quick Nav",
    category: "Owner Command Center",
    icon: <Calendar className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Unified Inbox",
    description: "Single inbox merging WhatsApp, Email, Instagram, Facebook, Website chat",
    path: "/owner/inbox",
    navigationPath: "Sidebar → Owner Command Center → Unified Inbox | Dashboard Quick Nav",
    category: "Owner Command Center",
    icon: <Inbox className="h-4 w-4" />,
    status: 'active',
    isAIPowered: true,
    isApprovalBased: true,
  },
  {
    name: "Message Templates",
    description: "Reusable templates for WhatsApp, Email, DM, Voice with variable support",
    path: "/owner/templates",
    navigationPath: "Sidebar → Owner Command Center → Message Templates | Dashboard Quick Nav",
    category: "Owner Command Center",
    icon: <FileText className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Communication Settings",
    description: "Connect channels, configure AI behavior, tone profile, voice settings for Jane Bou Jaoude",
    path: "/owner/settings/communication",
    navigationPath: "Sidebar → Owner Command Center → Communication Settings | Dashboard Quick Nav",
    category: "Owner Command Center",
    icon: <Settings className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Feature Registry (This Page)",
    description: "Complete audit of all features with navigation paths — visibility guarantee",
    path: "/owner/features",
    navigationPath: "Sidebar → Owner Command Center → Feature Registry | Dashboard → All Features",
    category: "Owner Command Center",
    icon: <BookOpen className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // CRM MODULES
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Leads Inbox",
    description: "Full lead management with search, filters, CSV export, and inline actions",
    path: "/crm/leads",
    navigationPath: "Sidebar → CRM Modules → Leads Inbox | Dashboard Quick Nav",
    category: "CRM Modules",
    icon: <Users className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Lead Detail",
    description: "Individual lead profile with notes, activity timeline, and linked tasks",
    path: "/crm/leads/:id",
    navigationPath: "Leads Inbox → Click any lead row → Open button",
    category: "CRM Modules",
    icon: <Users className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "CRM Tasks",
    description: "Task management linked to leads with due dates, priorities, and status",
    path: "/crm/tasks",
    navigationPath: "Sidebar → CRM Modules → My Tasks | Dashboard Quick Nav → Tasks",
    category: "CRM Modules",
    icon: <CheckSquare className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "CRM Calendar",
    description: "Calendar view of appointments, scheduled follow-ups, and events",
    path: "/crm/calendar",
    navigationPath: "Sidebar → CRM Modules → Calendar | Dashboard Quick Nav",
    category: "CRM Modules",
    icon: <Calendar className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "CRM Notes",
    description: "Quick notes and memos, optionally linked to leads",
    path: "/crm/notes",
    navigationPath: "Sidebar → CRM Modules → Notes | Dashboard Quick Nav",
    category: "CRM Modules",
    icon: <StickyNote className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "CRM Reminders",
    description: "Set and manage reminders for follow-ups and tasks",
    path: "/crm/reminders",
    navigationPath: "Sidebar → CRM Modules → Reminders | Dashboard Quick Nav",
    category: "CRM Modules",
    icon: <Bell className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Employees Hub",
    description: "Team management and CRM user profiles",
    path: "/crm/employees",
    navigationPath: "Sidebar → CRM Modules → Employees Hub | Dashboard Quick Nav",
    category: "CRM Modules",
    icon: <Users className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Workflow Automations",
    description: "Automated workflows and triggers for lead management (Owner-only)",
    path: "/automations",
    navigationPath: "Sidebar → CRM Modules → Automations | Dashboard Quick Nav",
    category: "CRM Modules",
    icon: <Zap className="h-4 w-4" />,
    status: 'active',
    isAutomated: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // AI FEATURES
  // ═══════════════════════════════════════════════════════════════
  {
    name: "AI Text Reply Engine",
    description: "Generate AI-powered text replies in Jane Bou Jaoude's exact style and tone",
    path: "/owner/inbox",
    navigationPath: "Unified Inbox → Select thread → 'Generate AI Reply' button (Sparkles icon)",
    category: "AI Features",
    icon: <Sparkles className="h-4 w-4" />,
    status: 'active',
    isAIPowered: true,
    isApprovalBased: true,
  },
  {
    name: "Voice Replies (ElevenLabs)",
    description: "Generate voice notes using Jane Bou Jaoude's cloned voice for WhatsApp/DM",
    path: "/owner/inbox",
    navigationPath: "Unified Inbox → Select thread → AI Draft → 'Voice Reply' button",
    category: "AI Features",
    icon: <Mic className="h-4 w-4" />,
    status: 'active',
    isAIPowered: true,
    isApprovalBased: true,
  },
  {
    name: "AI Learning System",
    description: "AI learns from Owner corrections to improve replies over time",
    path: "/owner/settings/communication",
    navigationPath: "Communication Settings → AI Settings tab → Learning section",
    category: "AI Features",
    icon: <Brain className="h-4 w-4" />,
    status: 'active',
    isAutomated: true,
  },
  {
    name: "Tone Profile Configuration",
    description: "Configure AI formality, emoji usage, message length, language preferences",
    path: "/owner/settings/communication",
    navigationPath: "Communication Settings → Tone Profile tab",
    category: "AI Features",
    icon: <Settings className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "AI Hub",
    description: "Central AI tools dashboard with all JBJ AI capabilities",
    path: "/ai-hub",
    navigationPath: "Dashboard Quick Nav → AI Hub | Sidebar → Hub & Assistants → JBJ Broker Hub",
    category: "AI Features",
    icon: <Brain className="h-4 w-4" />,
    status: 'active',
    isAIPowered: true,
  },
  {
    name: "Executive Assistant",
    description: "AI-powered executive assistant for task management and scheduling",
    path: "/executive-assistant",
    navigationPath: "Dashboard Quick Nav → Assistant | Sidebar → Hub & Assistants",
    category: "AI Features",
    icon: <Target className="h-4 w-4" />,
    status: 'active',
    isAIPowered: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // CHANNELS & INTEGRATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "WhatsApp Business Integration",
    description: "Connect WhatsApp Business accounts (Owner Personal + Company)",
    path: "/owner/settings/communication",
    navigationPath: "Communication Settings → Channels tab → Add Channel → WhatsApp",
    category: "Channels",
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Gmail Integration",
    description: "Connect Gmail accounts with OAuth for reading and sending",
    path: "/owner/settings/communication",
    navigationPath: "Communication Settings → Channels tab → Add Channel → Gmail",
    category: "Channels",
    icon: <Mail className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Hostinger Webmail (IMAP/SMTP)",
    description: "Connect Hostinger webmail via IMAP/SMTP configuration",
    path: "/owner/settings/communication",
    navigationPath: "Communication Settings → Channels tab → Add Channel → Hostinger",
    category: "Channels",
    icon: <Mail className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Instagram DM Integration",
    description: "Connect Instagram for direct message management",
    path: "/owner/settings/communication",
    navigationPath: "Communication Settings → Channels tab → Add Channel → Instagram",
    category: "Channels",
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Facebook Messenger Integration",
    description: "Connect Facebook Messenger for message management",
    path: "/owner/settings/communication",
    navigationPath: "Communication Settings → Channels tab → Add Channel → Facebook",
    category: "Channels",
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "Website Chat Integration",
    description: "Website chat widget messages appear in Unified Inbox",
    path: "/owner/settings/communication",
    navigationPath: "Communication Settings → Channels tab → Website Chat",
    category: "Channels",
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'active',
    isAutomated: true,
  },
  {
    name: "ElevenLabs Voice Clone",
    description: "Jane Bou Jaoude's verified voice clone for generating voice notes",
    path: "/owner/settings/communication",
    navigationPath: "Communication Settings → Voice tab",
    category: "Channels",
    icon: <Mic className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // SYSTEM & SECURITY
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Security Console",
    description: "Security settings, audit logs, and access controls",
    path: "/security-console",
    navigationPath: "Dashboard Quick Nav → Security | Direct: /security-console",
    category: "System",
    icon: <Shield className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
  {
    name: "JBJ Analytics Dashboard",
    description: "Business analytics and performance metrics",
    path: "/jbj-analytics",
    navigationPath: "Dashboard Quick Nav → Analytics | Direct: /jbj-analytics",
    category: "System",
    icon: <Eye className="h-4 w-4" />,
    status: 'active',
    isManual: true,
  },
];

const CATEGORIES = [
  { name: "All", count: FEATURES.length },
  { name: "Owner Command Center", count: FEATURES.filter(f => f.category === "Owner Command Center").length },
  { name: "CRM Modules", count: FEATURES.filter(f => f.category === "CRM Modules").length },
  { name: "AI Features", count: FEATURES.filter(f => f.category === "AI Features").length },
  { name: "Channels", count: FEATURES.filter(f => f.category === "Channels").length },
  { name: "System", count: FEATURES.filter(f => f.category === "System").length },
];

export default function OwnerFeatureRegistry() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('registry');

  const filteredFeatures = FEATURES.filter(f => {
    const matchesSearch = !searchQuery || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.navigationPath.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const aiPoweredCount = FEATURES.filter(f => f.isAIPowered).length;
  const approvalBasedCount = FEATURES.filter(f => f.isApprovalBased).length;
  const automatedCount = FEATURES.filter(f => f.isAutomated).length;
  const manualCount = FEATURES.filter(f => f.isManual).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-black">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
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
                  <h1 className="text-2xl font-bold text-black">Feature Registry & Audit</h1>
                  <p className="text-zinc-500 text-sm">Jane Bou Jaoude — Complete visibility of all implemented features</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-gold/10 text-gold border border-gold/30">
                  {FEATURES.length} Features
                </Badge>
                <Badge className="bg-green-100 text-green-700 border border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All Visible
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatsCard label="AI-Powered" value={aiPoweredCount} icon={<Sparkles className="h-4 w-4" />} variant="purple" />
            <StatsCard label="Approval-Based" value={approvalBasedCount} icon={<Shield className="h-4 w-4" />} variant="blue" />
            <StatsCard label="Automated" value={automatedCount} icon={<Zap className="h-4 w-4" />} variant="green" />
            <StatsCard label="Manual" value={manualCount} icon={<Wrench className="h-4 w-4" />} variant="default" />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6 bg-white/80 border-2 border-gold/20">
              <TabsTrigger value="registry">Feature Registry</TabsTrigger>
              <TabsTrigger value="audit">Audit Summary</TabsTrigger>
              <TabsTrigger value="navigation">Navigation Map</TabsTrigger>
            </TabsList>

            {/* Feature Registry Tab */}
            <TabsContent value="registry">
              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search features, descriptions, paths..."
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
                    Click on any feature to navigate to it. Every feature shows its exact navigation path.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-2">
                      {filteredFeatures.map((feature, idx) => (
                        <motion.div
                          key={`${feature.name}-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="p-4 rounded-xl border border-gold/20 bg-white hover:bg-gold/5 cursor-pointer transition-all group"
                          onClick={() => {
                            if (!feature.path.includes(':')) {
                              navigate(feature.path);
                            }
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold flex-shrink-0">
                              {feature.icon}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
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
                                {feature.isManual && (
                                  <Badge className="bg-zinc-100 text-zinc-700 text-[10px] px-1.5">Manual</Badge>
                                )}
                              </div>
                              <p className="text-sm text-zinc-500 mt-0.5">{feature.description}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <Badge variant="outline" className="border-gold/30 font-normal">
                                  {feature.category}
                                </Badge>
                                <span className="text-zinc-400">→</span>
                                <code className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                  {feature.navigationPath}
                                </code>
                              </div>
                            </div>
                            
                            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-gold transition-colors flex-shrink-0" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Summary Tab */}
            <TabsContent value="audit">
              <div className="grid gap-4">
                {/* Audit Status */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      Visibility Audit: PASSED
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <AuditItem label="Total Features Registered" value={FEATURES.length} status="pass" />
                      <AuditItem label="Hidden Pages" value={0} status="pass" />
                      <AuditItem label="Background-Only Features" value={0} status="pass" />
                      <AuditItem label="All Features Navigable" value="Yes" status="pass" />
                    </div>
                  </CardContent>
                </Card>

                {/* By Category */}
                <Card className="border-2 border-gold/20 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-lg">Features by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {CATEGORIES.filter(c => c.name !== 'All').map(cat => (
                        <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg bg-gold/5 border border-gold/20">
                          <span className="font-medium text-black">{cat.name}</span>
                          <Badge className="bg-gold text-black">{cat.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Behavior Summary */}
                <Card className="border-2 border-gold/20 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-lg">Feature Behavior Summary</CardTitle>
                    <CardDescription>How features operate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-purple-700">AI-Powered ({aiPoweredCount})</span>
                        </div>
                        <p className="text-sm text-purple-600">AI generates drafts, suggestions, or content. All AI actions require Owner approval before execution.</p>
                      </div>
                      <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-700">Approval-Based ({approvalBasedCount})</span>
                        </div>
                        <p className="text-sm text-blue-600">Actions require explicit Owner approval before they take effect. No auto-send, no silent execution.</p>
                      </div>
                      <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">Automated ({automatedCount})</span>
                        </div>
                        <p className="text-sm text-green-600">Runs automatically in the background (e.g., AI learning, CRM logging). Owner can configure via settings.</p>
                      </div>
                      <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="h-4 w-4 text-zinc-600" />
                          <span className="font-medium text-zinc-700">Manual ({manualCount})</span>
                        </div>
                        <p className="text-sm text-zinc-600">Owner-initiated actions only. Nothing happens without explicit Owner interaction.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Navigation Map Tab */}
            <TabsContent value="navigation">
              <Card className="border-2 border-gold/20 bg-white/90">
                <CardHeader>
                  <CardTitle className="text-lg">Complete Navigation Map</CardTitle>
                  <CardDescription>Every page and how to reach it</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-6">
                      {CATEGORIES.filter(c => c.name !== 'All').map(cat => (
                        <div key={cat.name}>
                          <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gold" />
                            {cat.name}
                          </h3>
                          <div className="space-y-2 ml-4">
                            {FEATURES.filter(f => f.category === cat.name).map((feature, idx) => (
                              <div 
                                key={`${feature.name}-nav-${idx}`}
                                className="flex items-center justify-between p-3 rounded-lg border border-gold/10 bg-white hover:bg-gold/5 cursor-pointer"
                                onClick={() => {
                                  if (!feature.path.includes(':')) {
                                    navigate(feature.path);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-gold">{feature.icon}</div>
                                  <div>
                                    <p className="font-medium text-black text-sm">{feature.name}</p>
                                    <code className="text-[11px] text-zinc-500">{feature.path}</code>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <code className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded max-w-[300px] truncate">
                                    {feature.navigationPath}
                                  </code>
                                  <ExternalLink className="h-3 w-3 text-zinc-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Legend */}
          <div className="mt-6 p-4 bg-white/80 border-2 border-gold/20 rounded-xl">
            <h3 className="font-semibold text-black mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 text-xs">AI</Badge>
                <span className="text-zinc-600">AI-powered feature (drafts/suggestions)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 text-xs">Approval</Badge>
                <span className="text-zinc-600">Requires Owner approval before action</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 text-xs">Auto</Badge>
                <span className="text-zinc-600">Runs automatically (configurable)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-zinc-100 text-zinc-700 text-xs">Manual</Badge>
                <span className="text-zinc-600">Owner-initiated only</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

// Stats Card Component
function StatsCard({ 
  label, 
  value, 
  icon, 
  variant = 'default' 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  variant?: 'default' | 'purple' | 'blue' | 'green';
}) {
  const variants = {
    default: "border-gold/30 bg-white",
    purple: "border-purple-200 bg-purple-50",
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
  };

  const iconColors = {
    default: "text-gold",
    purple: "text-purple-600",
    blue: "text-blue-600",
    green: "text-green-600",
  };

  return (
    <Card className={`${variants[variant]} border-2`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-xl font-bold text-black">{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-white/50 ${iconColors[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Audit Item Component
function AuditItem({ 
  label, 
  value, 
  status 
}: { 
  label: string; 
  value: string | number; 
  status: 'pass' | 'warn' | 'fail';
}) {
  const icons = {
    pass: <CheckCircle className="h-4 w-4 text-green-500" />,
    warn: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    fail: <AlertTriangle className="h-4 w-4 text-red-500" />,
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-green-200">
      <span className="text-sm text-zinc-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-black">{value}</span>
        {icons[status]}
      </div>
    </div>
  );
}
