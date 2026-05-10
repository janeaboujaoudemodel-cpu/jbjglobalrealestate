/**
 * Security Dashboard Component
 * Real-time security monitoring and compliance overview
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  Eye,
  FileWarning,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Bell,
  XCircle,
  Clock,
  Zap,
  Database,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useComplianceSecurity } from '@/hooks/useComplianceSecurity';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const SecurityDashboard: React.FC = () => {
  const {
    securityScore,
    isLockdownActive,
    recentEvents,
    ethicsViolations,
    healthMetrics,
    activeLockdowns,
    isLoading,
    resolveSecurityEvent,
    runComplianceAudit,
    generateDailySecuritySummary,
    deactivateLockdown,
    refreshData
  } = useComplianceSecurity();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    const loadSummary = async () => {
      const { summary } = await generateDailySecuritySummary();
      setDailySummary(summary);
    };
    loadSummary();
  }, [generateDailySecuritySummary]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      default: return 'text-[#1A1A1A]/70 bg-[#B89555]/10 border-[#B89555]/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const filteredEvents = recentEvents.filter(event => {
    const matchesSearch = 
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.event_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || event.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const criticalEvents = recentEvents.filter(e => e.severity === 'critical' && !e.is_resolved);
  const unresolvedCount = recentEvents.filter(e => !e.is_resolved).length;
  const todayMetrics = healthMetrics[0];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Lockdown Banner */}
      <AnimatePresence>
        {isLockdownActive && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-red-500 animate-pulse" />
              <div>
                <p className="font-bold text-red-500">🚨 EMERGENCY LOCKDOWN ACTIVE</p>
                <p className="text-sm text-red-400">
                  Platform access restricted. Founder authorization required.
                </p>
              </div>
            </div>
            {activeLockdowns[0] && (
              <Button
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-500/20"
                onClick={() => deactivateLockdown(activeLockdowns[0].id)}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
            <Shield className="h-7 w-7 text-[#1A1A1A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Security & Compliance Console</h1>
            <p className="text-muted-foreground">AI-Powered Intelligence Layer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => runComplianceAudit('security', 'system')}
          >
            <Zap className="h-4 w-4 mr-2" />
            Run Audit
          </Button>
        </div>
      </div>

      {/* Security Score & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Security Score */}
        <Card className="col-span-1 bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Index</p>
                <p className={cn("text-4xl font-bold", getScoreColor(securityScore))}>
                  {securityScore}
                  <span className="text-lg text-muted-foreground">/100</span>
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={175.93}
                    strokeDashoffset={175.93 * (1 - securityScore / 100)}
                    className={getScoreColor(securityScore)}
                  />
                </svg>
                <Shield className={cn("h-6 w-6", getScoreColor(securityScore))} />
              </div>
            </div>
            <Progress value={securityScore} className="mt-4 h-2" />
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {criticalEvents.length}
              </Badge>
            </div>
            <p className="mt-4 font-semibold">Critical Alerts</p>
            <p className="text-sm text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>

        {/* Unresolved Events */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Clock className="h-8 w-8 text-yellow-500" />
              <Badge variant="outline" className="text-lg px-3 py-1 border-yellow-500 text-yellow-500">
                {unresolvedCount}
              </Badge>
            </div>
            <p className="mt-4 font-semibold">Unresolved</p>
            <p className="text-sm text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>

        {/* Ethics Violations */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-purple-500" />
              <Badge variant="outline" className="text-lg px-3 py-1 border-purple-500 text-purple-500">
                {ethicsViolations.filter(v => v.status === 'pending').length}
              </Badge>
            </div>
            <p className="mt-4 font-semibold">Ethics Flags</p>
            <p className="text-sm text-muted-foreground">Behavior monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="ethics">Ethics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1A1A1A]" />
                  Daily Security Summary
                </CardTitle>
                <CardDescription>Automated report from Amanda Clarke</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg font-mono">
                  {dailySummary || 'Loading summary...'}
                </pre>
              </CardContent>
            </Card>

            {/* Real-time Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#1A1A1A]" />
                  Real-time Activity
                </CardTitle>
                <CardDescription>Latest security events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {recentEvents.slice(0, 10).map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-3 rounded-lg border flex items-start gap-3",
                          getSeverityColor(event.severity)
                        )}
                      >
                        {getSeverityIcon(event.severity)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), 'HH:mm:ss')} • {event.event_type}
                          </p>
                        </div>
                        {!event.is_resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveSecurityEvent(event.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Grid */}
          {todayMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Unauthorized</span>
                </div>
                <p className="text-2xl font-bold mt-2">{todayMetrics.unauthorized_attempts}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Blocked</span>
                </div>
                <p className="text-2xl font-bold mt-2">{todayMetrics.blocked_activities}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Violations</span>
                </div>
                <p className="text-2xl font-bold mt-2">{todayMetrics.policy_violations}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Leaks Prevented</span>
                </div>
                <p className="text-2xl font-bold mt-2">{todayMetrics.data_leaks_prevented}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Encryption</span>
                </div>
                <p className="text-2xl font-bold mt-2">{todayMetrics.encryption_compliance_percent}%</p>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Security Events</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="bg-muted border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-4 rounded-lg border flex items-center gap-4",
                        getSeverityColor(event.severity)
                      )}
                    >
                      {getSeverityIcon(event.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.event_type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {event.severity}
                          </Badge>
                          {event.is_resolved && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 font-medium">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.created_at), 'PPpp')}
                          {event.department && ` • ${event.department}`}
                          {event.ai_agent_id && ` • AI: ${event.ai_agent_id}`}
                        </p>
                      </div>
                      {!event.is_resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveSecurityEvent(event.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ethics Tab */}
        <TabsContent value="ethics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Ethics Violations
              </CardTitle>
              <CardDescription>Team behavior monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {ethicsViolations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No ethics violations recorded</p>
                      <p className="text-sm">All team activities are compliant</p>
                    </div>
                  ) : (
                    ethicsViolations.map((violation) => (
                      <div
                        key={violation.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          getSeverityColor(violation.severity)
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{violation.violation_type}</Badge>
                            <Badge variant="secondary">
                              {violation.violator_type === 'ai' ? '🤖 AI' : '👤 Human'}
                            </Badge>
                            <Badge
                              variant={violation.status === 'pending' ? 'destructive' : 'default'}
                            >
                              {violation.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(violation.created_at), 'PPp')}
                          </span>
                        </div>
                        <p className="mt-2">{violation.description}</p>
                        {violation.action_required && (
                          <p className="mt-2 text-sm text-orange-500">
                            Action Required: {violation.action_required}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                UAE Data Protection Law
              </h3>
              <p className="text-sm text-muted-foreground mt-2">DPL 2021 Compliance</p>
              <div className="mt-4 flex items-center gap-2">
                <Progress value={95} className="flex-1" />
                <span className="text-sm font-medium text-green-500">95%</span>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                GDPR Standards
              </h3>
              <p className="text-sm text-muted-foreground mt-2">EU Data Protection</p>
              <div className="mt-4 flex items-center gap-2">
                <Progress value={92} className="flex-1" />
                <span className="text-sm font-medium text-green-500">92%</span>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#1A1A1A]" />
                ISO 27001
              </h3>
              <p className="text-sm text-muted-foreground mt-2">Security Practices</p>
              <div className="mt-4 flex items-center gap-2">
                <Progress value={88} className="flex-1" />
                <span className="text-sm font-medium text-yellow-500">88%</span>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Run Compliance Audit</CardTitle>
              <CardDescription>Execute on-demand audits by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => runComplianceAudit('data_protection', 'system')}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Data Protection Audit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runComplianceAudit('security', 'system')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security Audit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runComplianceAudit('ethics', 'ai_agents')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  AI Ethics Audit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runComplianceAudit('access', 'permissions')}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Access Control Audit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1A1A1A]" />
                File Provenance Tracking
              </CardTitle>
              <CardDescription>
                Encrypted file tracking with watermark protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>File provenance tracking active</p>
                <p className="text-sm">All file operations are monitored and logged</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
