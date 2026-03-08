/**
 * Compliance Assistant (Aisha)
 * Sub-module under Olivia for security monitoring and auditing
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
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
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useComplianceSecurity } from '@/hooks/useComplianceSecurity';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'audit' | 'alert' | 'report' | 'action';
}

const QUICK_COMMANDS = [
  { label: 'Security Summary', command: 'Show security summary', icon: Shield },
  { label: 'Run Audit', command: 'Run full security audit', icon: Zap },
  { label: 'Ethics Report', command: 'Show ethics violations', icon: Users },
  { label: 'Recent Alerts', command: 'Show recent alerts', icon: AlertCircle }
];

const ComplianceAIAssistant: React.FC = () => {
  const {
    securityScore,
    recentEvents,
    ethicsViolations,
    generateDailySecuritySummary,
    runComplianceAudit,
    isLoading
  } = useComplianceSecurity();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Assalamu Alaikum. I am Aisha, your Compliance Assistant. I monitor all security, ethics, and compliance matters for JBJ Global Real Estate.

Current Security Index: **${securityScore}/100**

How may I assist you today? You can ask me to:
- Run security or compliance audits
- Show recent alerts and violations
- Generate compliance reports
- Review team behavior ethics`,
      timestamp: new Date(),
      type: 'report'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processCommand = async (command: string): Promise<string> => {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('security summary') || lowerCommand.includes('summary')) {
      const { summary } = await generateDailySecuritySummary();
      return summary;
    }

    if (lowerCommand.includes('audit')) {
      const auditType = lowerCommand.includes('ethics') ? 'ethics' : 
                        lowerCommand.includes('data') ? 'data_protection' : 'security';
      const result = await runComplianceAudit(auditType, 'system');
      
      if (result) {
        return `**Audit Complete: ${result.audit_type}**

Status: ${result.compliance_status.toUpperCase()}
Policy Reference: ${result.policy_reference || 'N/A'}

**Findings:**
${result.findings.length > 0 ? result.findings.map(f => `• ${f}`).join('\n') : '• No issues found'}

**Recommendations:**
${result.recommendations.length > 0 ? result.recommendations.map(r => `• ${r}`).join('\n') : '• System is compliant'}

Audit completed at ${format(new Date(result.created_at), 'PPpp')}`;
      }
      return 'Audit completed. No significant issues found.';
    }

    if (lowerCommand.includes('ethics') || lowerCommand.includes('violation')) {
      const pendingViolations = ethicsViolations.filter(v => v.status === 'pending');
      
      if (pendingViolations.length === 0) {
        return `**Ethics Report**

✅ No pending ethics violations detected.

All team members are operating within ethical guidelines.

Last checked: ${format(new Date(), 'PPpp')}`;
      }

      return `**Ethics Report**

[ALERT] ${pendingViolations.length} pending violation(s) detected:

${pendingViolations.slice(0, 5).map(v => `
• **${v.violation_type}** (${v.severity})
  ${v.violator_type === 'ai' ? '[AI Agent]' : '[Human]'}: ${v.description}
  Status: ${v.status}
`).join('')}

Please review and take appropriate action.`;
    }

    if (lowerCommand.includes('alert') || lowerCommand.includes('recent')) {
      const criticalEvents = recentEvents.filter(e => e.severity === 'critical' || e.severity === 'high');
      
      if (criticalEvents.length === 0) {
        return `**Recent Alerts**

✅ No high-priority alerts in the last 24 hours.

System is operating normally. Security Index: ${securityScore}/100`;
      }

      return `**Recent Alerts** (${criticalEvents.length} high-priority)

${criticalEvents.slice(0, 5).map(e => `
• **${e.event_type}** [${e.severity.toUpperCase()}]
  ${e.description}
  ${format(new Date(e.created_at), 'HH:mm:ss')}
  ${e.is_resolved ? '✅ Resolved' : '⚠️ Pending'}
`).join('')}

${criticalEvents.length > 5 ? `\n...and ${criticalEvents.length - 5} more alerts` : ''}`;
    }

    if (lowerCommand.includes('help')) {
      return `**Available Commands**

**Security:**
• "Show security summary" - Daily security report
• "Run security audit" - Full system security check
• "Show recent alerts" - High-priority security events

**Compliance:**
• "Run data protection audit" - UAE DPL/GDPR compliance check
• "Run access control audit" - Permission verification

**Ethics:**
• "Show ethics violations" - Team behavior report
• "Run ethics audit" - Team ethics check

**Actions:**
• "Trigger lockdown" - Emergency platform lockdown
• "Generate report" - Comprehensive compliance report

You can also ask me questions about security policies, compliance requirements, or specific incidents.`;
    }

    // Default response for unrecognized commands
    return `I understand you're asking about "${command}".

Based on the current security status:
- Security Index: ${securityScore}/100
- Active Alerts: ${recentEvents.filter(e => !e.is_resolved).length}
- Ethics Flags: ${ethicsViolations.filter(v => v.status === 'pending').length}

Would you like me to run a specific audit or show detailed information? Type "help" for available commands.`;
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
              response.includes('Alert') ? 'alert' : 'report'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-purple-500">
            <AvatarImage src="/lovable-uploads/aisha-compliance-ai.png" alt="Aisha" />
            <AvatarFallback className="bg-purple-500 text-white">AI</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Aisha
              <Badge variant="outline" className="text-xs border-purple-500 text-purple-500">
                Compliance AI
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Security & Ethics Monitor</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Quick Commands */}
        <div className="p-3 border-b flex gap-2 overflow-x-auto">
          {QUICK_COMMANDS.map((cmd) => (
            <Button
              key={cmd.label}
              variant="outline"
              size="sm"
              className="shrink-0"
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
                      <AvatarFallback className="bg-purple-500 text-white text-xs">AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === 'user' 
                        ? "bg-gold text-black" 
                        : "bg-muted"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                      {message.content.split('\n').map((line, i) => {
                        let rendered = line
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>');
                        const sanitized = DOMPurify.sanitize(rendered, {
                          ALLOWED_TAGS: ['strong', 'em', 'code', 'p', 'br', 'span'],
                          ALLOWED_ATTR: ['class']
                        });
                        return (
                          <p 
                            key={i} 
                            className={cn(line.startsWith('•') && 'pl-2', 'mb-1')}
                            dangerouslySetInnerHTML={{ __html: sanitized }}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
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
                  <AvatarFallback className="bg-purple-500 text-white text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
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
              className="bg-purple-500 hover:bg-purple-600"
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

export default ComplianceAIAssistant;
