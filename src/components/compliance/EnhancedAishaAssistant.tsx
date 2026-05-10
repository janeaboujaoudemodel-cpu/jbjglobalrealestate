/**
 * Enhanced Aisha - Compliance AI Assistant
 * Full-featured security monitoring, auditing, and compliance assistant
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Lock,
  Database,
  Zap,
  MessageSquare,
  Brain,
  Eye,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Scan,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useComplianceSecurity } from '@/hooks/useComplianceSecurity';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'audit' | 'alert' | 'report' | 'action' | 'analysis';
}

const QUICK_COMMANDS = [
  { label: 'Security Summary', command: 'Show security summary', icon: Shield },
  { label: 'Full Audit', command: 'Run comprehensive audit', icon: Zap },
  { label: 'AI Integrity', command: 'Check AI integrity scores', icon: Brain },
  { label: 'Risk Analysis', command: 'Show department risk scores', icon: TrendingUp },
  { label: 'Training Status', command: 'Show my training status', icon: BookOpen },
  { label: 'Scan Content', command: 'Scan for sensitive data', icon: Scan }
];

const EnhancedAishaAssistant: React.FC = () => {
  const { user } = useAuth();
  const {
    securityScore,
    recentEvents,
    ethicsViolations,
    isLockdownActive,
    generateDailySecuritySummary,
    runComplianceAudit,
    runComprehensiveSecurityAudit,
    getAIIntegrityScore,
    getDepartmentRiskScores,
    getTrainingStatus,
    scanForSensitiveData,
    triggerEmergencyLockdown,
    isLoading
  } = useComplianceSecurity();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Assalamu Alaikum. I am **Aisha**, your Compliance AI Assistant. I serve as the guardian of JBJ Global's data integrity, ethical conduct, and security compliance.

**Current Security Index: ${securityScore}/100**

I can assist you with:
• 🔒 **Security Monitoring** - Real-time threat detection
• 📋 **Compliance Audits** - UAE DPL, GDPR, ISO 27001
• 🤖 **AI Integrity Checks** - Verify AI behavior
• 📊 **Risk Analysis** - Department risk scores
• 📚 **Training Compliance** - Track certifications
• 🔍 **Data Scanning** - Detect sensitive information

Type **"help"** for all available commands or use the quick buttons above.`,
      timestamp: new Date(),
      type: 'report'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processCommand = async (command: string): Promise<string> => {
    const lowerCommand = command.toLowerCase();

    // Security Summary
    if (lowerCommand.includes('security summary') || lowerCommand.includes('summary')) {
      const { summary } = await generateDailySecuritySummary();
      return `**📊 Daily Security Summary**\n\n${summary}`;
    }

    // Comprehensive Audit
    if (lowerCommand.includes('comprehensive audit') || lowerCommand.includes('full audit')) {
      const result = await runComprehensiveSecurityAudit();
      
      let response = `**🔍 Comprehensive Security Audit**\n\n`;
      response += `**Overall Status:** ${result.overallStatus.toUpperCase()}\n`;
      response += `**Security Score:** ${result.score}/100\n\n`;
      
      for (const [category, data] of Object.entries(result.categories)) {
        const icon = data.status === 'compliant' ? '✅' : data.status === 'warning' ? '⚠️' : '❌';
        response += `${icon} **${category.replace('_', ' ').toUpperCase()}:** ${data.status}\n`;
        if (data.findings.length > 0) {
          response += `   Findings: ${data.findings.slice(0, 2).join('; ')}\n`;
        }
      }
      
      response += `\n_Audit completed at ${format(new Date(result.generatedAt), 'PPpp')}_`;
      return response;
    }

    // Standard Audit
    if (lowerCommand.includes('audit')) {
      const auditType = lowerCommand.includes('ethics') ? 'ethics' : 
                        lowerCommand.includes('data') ? 'data_protection' : 'security';
      const result = await runComplianceAudit(auditType, 'system');
      
      if (result) {
        return `**✅ Audit Complete: ${result.audit_type}**

**Status:** ${result.compliance_status.toUpperCase()}
**Policy Reference:** ${result.policy_reference || 'N/A'}

**Findings:**
${result.findings.length > 0 ? result.findings.map(f => `• ${f}`).join('\n') : '• No issues found'}

**Recommendations:**
${result.recommendations.length > 0 ? result.recommendations.map(r => `• ${r}`).join('\n') : '• System is compliant'}

_Audit completed at ${format(new Date(result.created_at), 'PPpp')}_`;
      }
      return 'Audit completed. No significant issues found.';
    }

    // AI Integrity Check
    if (lowerCommand.includes('ai integrity') || lowerCommand.includes('integrity score')) {
      const aiAgents = ['amanda_ai', 'hr_ai', 'broker_ai', 'admin_ai', 'finance_ai'];
      let response = '**🤖 AI Integrity Scores**\n\n';
      
      for (const agent of aiAgents) {
        const score = await getAIIntegrityScore(agent);
        const icon = score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌';
        response += `${icon} **${agent.replace('_', ' ').toUpperCase()}:** ${score}/100\n`;
      }
      
      response += '\n_AI integrity is verified through cross-decision validation and ethics compliance monitoring._';
      return response;
    }

    // Department Risk Scores
    if (lowerCommand.includes('risk') || lowerCommand.includes('department')) {
      const risks = await getDepartmentRiskScores();
      
      let response = '**📊 Department Risk Analysis**\n\n';
      for (const [dept, data] of Object.entries(risks)) {
        const icon = data.level === 'low' ? '🟢' : data.level === 'medium' ? '🟡' : data.level === 'high' ? '🟠' : '🔴';
        response += `${icon} **${dept.toUpperCase()}:** ${data.score}% risk (${data.level})\n`;
        if (data.topRisks.length > 0) {
          response += `   _Top risks: ${data.topRisks.join(', ')}_\n`;
        }
      }
      
      return response;
    }

    // Training Status
    if (lowerCommand.includes('training')) {
      if (!user?.id) return 'Please log in to check your training status.';
      
      const status = await getTrainingStatus(user.id);
      
      return `**📚 Your Training Compliance Status**

**Completion Rate:** ${status.overallCompletionRate.toFixed(0)}%

**✅ Completed:**
${status.completedTrainings.length > 0 ? status.completedTrainings.map(t => `• ${t.replace('_', ' ')}`).join('\n') : '• None yet'}

**⏳ Pending:**
${status.pendingTrainings.length > 0 ? status.pendingTrainings.map(t => `• ${t.replace('_', ' ')}`).join('\n') : '• All trainings completed!'}

${status.overdueTrainings.length > 0 ? `\n**⚠️ Overdue:**\n${status.overdueTrainings.map(t => `• ${t.replace('_', ' ')}`).join('\n')}` : ''}`;
    }

    // Scan Content
    if (lowerCommand.includes('scan') && !lowerCommand.includes('show')) {
      // Extract content to scan (everything after "scan")
      const contentToScan = command.replace(/scan\s*(for)?\s*(sensitive)?\s*(data)?\s*/i, '').trim();
      
      if (!contentToScan) {
        return `**🔍 Content Scanner**

To scan content for sensitive data, use:
\`scan [your content here]\`

I will detect:
• Credit card numbers
• Emirates ID
• Passport numbers
• Bank account numbers
• Email addresses
• Phone numbers

All detected data will be automatically redacted for security.`;
      }
      
      const result = await scanForSensitiveData(contentToScan);
      
      if (result.containsSensitive) {
        return `**⚠️ Sensitive Data Detected**

**Patterns Found:** ${result.detectedPatterns.join(', ')}

**Redacted Content:**
${result.redactedContent}

_Warning: This content contains PII and should not be shared externally._`;
      }
      
      return `**✅ Content Scan Complete**

No sensitive data patterns detected. Content is safe to share.`;
    }

    // Ethics Violations
    if (lowerCommand.includes('ethics') || lowerCommand.includes('violation')) {
      const pendingViolations = ethicsViolations.filter(v => v.status === 'pending');
      
      if (pendingViolations.length === 0) {
        return `**✅ Ethics Report**

No pending ethics violations detected.

All AI agents and human employees are operating within ethical guidelines.

_Last checked: ${format(new Date(), 'PPpp')}_`;
      }

      return `**⚠️ Ethics Report**

${pendingViolations.length} pending violation(s) detected:

${pendingViolations.slice(0, 5).map(v => `
• **${v.violation_type}** (${v.severity})
  ${v.violator_type === 'ai' ? '🤖 AI Agent' : '👤 Human'}: ${v.description}
  Status: ${v.status}
`).join('')}

Please review and take appropriate action.`;
    }

    // Recent Alerts
    if (lowerCommand.includes('alert') || lowerCommand.includes('recent')) {
      const criticalEvents = recentEvents.filter(e => e.severity === 'critical' || e.severity === 'high');
      
      if (criticalEvents.length === 0) {
        return `**✅ Recent Alerts**

No high-priority alerts in the last 24 hours.

System is operating normally. Security Index: ${securityScore}/100`;
      }

      return `**⚠️ Recent Alerts** (${criticalEvents.length} high-priority)

${criticalEvents.slice(0, 5).map(e => `
• **${e.event_type}** [${e.severity.toUpperCase()}]
  ${e.description}
  ${format(new Date(e.created_at), 'HH:mm:ss')}
  ${e.is_resolved ? '✅ Resolved' : '⚠️ Pending'}
`).join('')}

${criticalEvents.length > 5 ? `\n...and ${criticalEvents.length - 5} more alerts` : ''}`;
    }

    // Lockdown
    if (lowerCommand.includes('lockdown') && lowerCommand.includes('trigger')) {
      return `**🚨 Emergency Lockdown**

To trigger a lockdown, please confirm:
- This will revoke all non-founder access
- All data transfers will be frozen
- The founder will be notified immediately

Type "CONFIRM LOCKDOWN" to proceed.

_This action is logged and should only be used in genuine security emergencies._`;
    }

    if (lowerCommand === 'confirm lockdown') {
      const result = await triggerEmergencyLockdown('Manual lockdown triggered via Aisha');
      if (result) {
        return `**🚨 LOCKDOWN ACTIVATED**

All systems are now in emergency lockdown mode.
- Non-founder access revoked
- Data transfers frozen
- Founder notified

Lockdown ID: ${result.id}
Time: ${format(new Date(), 'PPpp')}`;
      }
      return 'Failed to trigger lockdown. Please contact system administrator.';
    }

    // Help
    if (lowerCommand.includes('help')) {
      return `**📖 Available Commands**

**🔒 Security:**
• "Show security summary" - Daily security report
• "Run security audit" - System security check
• "Run comprehensive audit" - Full audit across all categories
• "Show recent alerts" - High-priority security events

**🤖 AI Monitoring:**
• "Check AI integrity scores" - Verify AI agent integrity
• "Run ethics audit" - AI behavior ethics check

**📊 Risk Analysis:**
• "Show department risk scores" - Risk by department
• "Show leak probability" - Data leak risk assessment

**📚 Compliance:**
• "Run data protection audit" - UAE DPL/GDPR compliance
• "Show my training status" - Your training compliance

**🔍 Tools:**
• "Scan [content]" - Detect sensitive data in content

**🚨 Emergency:**
• "Trigger lockdown" - Emergency platform lockdown

_You can also ask me questions about security policies, compliance requirements, or specific incidents._`;
    }

    // Default response
    return `I understand you're asking about "${command}".

Based on the current security status:
- **Security Index:** ${securityScore}/100
- **Active Alerts:** ${recentEvents.filter(e => !e.is_resolved).length}
- **Ethics Flags:** ${ethicsViolations.filter(v => v.status === 'pending').length}
- **Lockdown Status:** ${isLockdownActive ? '🔴 ACTIVE' : '🟢 Inactive'}

Would you like me to run a specific audit or show detailed information? Type **"help"** for available commands.`;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await processCommand(inputValue.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: response.includes('Audit') ? 'audit' : 
              response.includes('Alert') ? 'alert' : 
              response.includes('Analysis') ? 'analysis' : 'report'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again or contact the system administrator.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickCommand = (command: string) => {
    setInputValue(command);
  };

  const renderMessageContent = (content: string) => {
    // Convert markdown-like syntax to HTML
    const html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
      .replace(/\n/g, '<br/>');
    
    return (
      <div 
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    );
  };

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-purple-500">
            <AvatarImage src="/lovable-uploads/aisha-compliance-ai.png" alt="Aisha" />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">AI</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Aisha
              <Badge variant="outline" className="text-xs border-purple-500 text-purple-500">
                Compliance AI
              </Badge>
              {isLockdownActive && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  LOCKDOWN
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Security & Ethics Intelligence Monitor</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Security Index</p>
              <p className={cn(
                "text-lg font-bold",
                securityScore >= 90 ? "text-green-500" :
                securityScore >= 70 ? "text-yellow-500" :
                securityScore >= 50 ? "text-orange-500" : "text-red-500"
              )}>
                {securityScore}/100
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Quick Commands */}
        <div className="p-3 border-b flex gap-2 overflow-x-auto bg-muted/30">
          {QUICK_COMMANDS.map((cmd) => (
            <Button
              key={cmd.label}
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => handleQuickCommand(cmd.command)}
            >
              <cmd.icon className="h-3 w-3 mr-1" />
              {cmd.label}
            </Button>
          ))}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' && "flex-row-reverse"
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg p-3",
                      message.role === 'user' 
                        ? "bg-[#EFE6D6] text-[#1A1A1A]" 
                        : "bg-muted"
                    )}
                  >
                    <div className="text-sm">
                      {renderMessageContent(message.content)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 opacity-70">
                      {format(message.timestamp, 'HH:mm')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  <span className="text-sm">Analyzing security data...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Aisha about security, compliance, or ethics..."
              disabled={isProcessing}
              className="flex-1"
            />
            <Button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isProcessing}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAishaAssistant;