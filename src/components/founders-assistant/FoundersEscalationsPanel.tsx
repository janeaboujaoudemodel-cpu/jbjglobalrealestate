/**
 * Founders Escalations Panel
 * Central hub for viewing and managing all AI-triggered escalations
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Phone,
  Mail,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Zap,
  Eye,
  Send,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSmartEscalation } from '@/hooks/useSmartEscalation';
import { SentimentBadge, UrgencyIndicator } from '@/components/ai/SentimentIndicator';
import { type EscalationEvent } from '@/services/smart-escalation-service';
import { getEmotionIcon, getUrgencyLabel } from '@/config/emotion-detection-engine';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

type FilterStatus = 'all' | 'pending' | 'acknowledged' | 'resolved';
type FilterUrgency = 'all' | 'critical' | 'high' | 'normal' | 'low';

export function FoundersEscalationsPanel() {
  const {
    escalationQueue,
    refreshEscalationQueue,
    acknowledgeEscalation,
    resolveEscalation,
    isProcessing,
  } = useSmartEscalation();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<FilterUrgency>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationEvent | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [draftResponse, setDraftResponse] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Demo data for showcase (in production, this comes from escalationQueue)
  const demoEscalations: EscalationEvent[] = [
    {
      id: 'esc-001',
      triggeredAt: new Date(Date.now() - 10 * 60 * 1000),
      sourceChannel: 'whatsapp',
      senderId: 'client-001',
      senderName: 'Ahmed Al-Rashid',
      senderType: 'client',
      originalMessage: "I've been waiting for this update for a week — this is unacceptable! I need answers now.",
      emotionAnalysis: {
        emotion: 'angry',
        confidence: 94,
        urgency: 'critical',
        sentiment: -0.85,
        keywords: ['unacceptable', 'waiting', 'need now'],
        suggestedTone: { style: 'empathetic', prefix: '', suffix: '', responseDeadlineMinutes: 10 },
        shouldEscalate: true,
        escalationReason: 'Client expressed significant dissatisfaction',
      },
      escalatedTo: ['christopher_adams', 'amanda', 'founder'],
      status: 'pending',
      responseDeadline: new Date(Date.now() + 5 * 60 * 1000),
    },
    {
      id: 'esc-002',
      triggeredAt: new Date(Date.now() - 45 * 60 * 1000),
      sourceChannel: 'email',
      senderId: 'client-002',
      senderName: 'Sarah Thompson',
      senderType: 'client',
      originalMessage: 'The property viewing was amazing! The team was incredibly professional. Thank you so much for the excellent service.',
      emotionAnalysis: {
        emotion: 'positive',
        confidence: 88,
        urgency: 'normal',
        sentiment: 0.9,
        keywords: ['amazing', 'excellent', 'thank you'],
        suggestedTone: { style: 'warm', prefix: '', suffix: '', responseDeadlineMinutes: 60 },
        shouldEscalate: false,
      },
      escalatedTo: ['sales_team'],
      status: 'acknowledged',
      responseDeadline: new Date(Date.now() + 60 * 60 * 1000),
    },
    {
      id: 'esc-003',
      triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sourceChannel: 'chat',
      senderId: 'team-001',
      senderName: 'James Morgan (AI Broker)',
      senderType: 'ai',
      originalMessage: 'Client Mr. Patel needs urgent legal clarification on the mortgage terms. He mentioned potential legal action if not resolved.',
      emotionAnalysis: {
        emotion: 'urgent',
        confidence: 92,
        urgency: 'high',
        sentiment: -0.4,
        keywords: ['urgent', 'legal action'],
        suggestedTone: { style: 'professional', prefix: '', suffix: '', responseDeadlineMinutes: 15 },
        shouldEscalate: true,
        escalationReason: 'Critical urgency detected',
      },
      escalatedTo: ['jessica', 'founder'],
      status: 'resolved',
      responseDeadline: new Date(Date.now() - 1 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 30 * 60 * 1000),
      resolvedBy: 'Jessica Parker',
      resolutionNotes: 'Contacted legal team and provided clarification to client. Issue resolved.',
    },
  ];

  const allEscalations = [...demoEscalations, ...escalationQueue];

  // Filter escalations
  const filteredEscalations = allEscalations.filter(event => {
    if (statusFilter !== 'all' && event.status !== statusFilter) return false;
    if (urgencyFilter !== 'all' && event.emotionAnalysis.urgency !== urgencyFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        event.senderName?.toLowerCase().includes(query) ||
        event.originalMessage.toLowerCase().includes(query) ||
        event.emotionAnalysis.emotion.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: allEscalations.length,
    pending: allEscalations.filter(e => e.status === 'pending').length,
    acknowledged: allEscalations.filter(e => e.status === 'acknowledged').length,
    resolved: allEscalations.filter(e => e.status === 'resolved').length,
    critical: allEscalations.filter(e => e.emotionAnalysis.urgency === 'critical' && e.status === 'pending').length,
  };

  const handleAcknowledge = (eventId: string) => {
    acknowledgeEscalation(eventId, 'founder');
    toast.success('Escalation acknowledged');
  };

  const handleResolve = () => {
    if (!selectedEscalation) return;
    resolveEscalation(selectedEscalation.id, 'founder', resolutionNotes);
    setResolveDialogOpen(false);
    setResolutionNotes('');
    setSelectedEscalation(null);
    toast.success('Escalation resolved');
  };

  const handleLetAmandaHandle = (event: EscalationEvent) => {
    toast.success('Amanda will handle this escalation', {
      description: `Auto-response will be sent to ${event.senderName}`,
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive" className="animate-pulse">Pending</Badge>;
      case 'acknowledged':
        return <Badge className="bg-amber-500">Acknowledged</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#0E0E0E] border-gold/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-red-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400">🔴 Critical</p>
            <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-amber-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400">⏳ Pending</p>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-blue-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400">👁️ Acknowledged</p>
            <p className="text-2xl font-bold text-blue-400">{stats.acknowledged}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400">✅ Resolved</p>
            <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#0E0E0E] border-gold/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search escalations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1A1A1A] border-gold/20 text-white"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
              <SelectTrigger className="w-[150px] bg-[#1A1A1A] border-gold/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={(v) => setUrgencyFilter(v as FilterUrgency)}>
              <SelectTrigger className="w-[150px] bg-[#1A1A1A] border-gold/20 text-white">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">🔴 Critical</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="normal">🟢 Normal</SelectItem>
                <SelectItem value="low">⚪ Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={refreshEscalationQueue}
              disabled={isProcessing}
              className="border-gold/20 text-gold hover:bg-gold/10"
            >
              <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Escalation List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          <AnimatePresence>
            {filteredEscalations.length === 0 ? (
              <Card className="bg-[#0E0E0E] border-gold/20">
                <CardContent className="p-12 text-center">
                  <Zap className="h-12 w-12 text-gold/20 mx-auto mb-4" />
                  <p className="text-gray-400">No escalations found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {statusFilter !== 'all' || urgencyFilter !== 'all' || searchQuery
                      ? 'Try adjusting your filters'
                      : 'All systems running smoothly!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredEscalations.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card
                    className={`bg-[#0E0E0E] transition-all ${
                      event.status === 'pending'
                        ? event.emotionAnalysis.urgency === 'critical'
                          ? 'border-red-500/50 shadow-red-500/10 shadow-lg'
                          : 'border-amber-500/30'
                        : event.status === 'resolved'
                        ? 'border-green-500/20'
                        : 'border-gold/20'
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {/* Emotion Icon */}
                          <div className={`text-3xl ${
                            event.emotionAnalysis.urgency === 'critical' ? 'animate-pulse' : ''
                          }`}>
                            {getEmotionIcon(event.emotionAnalysis.emotion)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white">
                                {event.senderName || 'Unknown Sender'}
                              </span>
                              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                {getChannelIcon(event.sourceChannel)}
                                <span className="ml-1 capitalize">{event.sourceChannel}</span>
                              </Badge>
                              <SentimentBadge
                                emotion={event.emotionAnalysis.emotion}
                                confidence={event.emotionAnalysis.confidence}
                              />
                              {getStatusBadge(event.status)}
                            </div>
                            
                            <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                              "{event.originalMessage}"
                            </p>
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(event.triggeredAt, { addSuffix: true })}
                              </span>
                              <UrgencyIndicator
                                urgency={event.emotionAnalysis.urgency}
                                deadline={event.responseDeadline}
                                showCountdown={event.status === 'pending'}
                              />
                              <span className="text-gray-400">
                                Assigned to: {event.escalatedTo.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expand/Collapse */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          {expandedId === event.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {expandedId === event.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gold/10"
                          >
                            {/* Full Message */}
                            <div className="bg-[#1A1A1A] rounded-lg p-4 mb-4">
                              <p className="text-sm text-gray-400 mb-1">Original Message:</p>
                              <p className="text-white">{event.originalMessage}</p>
                            </div>

                            {/* Analysis Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-[#1A1A1A] rounded-lg p-3">
                                <p className="text-xs text-gray-400">Emotion</p>
                                <p className="text-lg font-semibold text-white capitalize">
                                  {event.emotionAnalysis.emotion}
                                </p>
                              </div>
                              <div className="bg-[#1A1A1A] rounded-lg p-3">
                                <p className="text-xs text-gray-400">Confidence</p>
                                <p className="text-lg font-semibold text-gold">
                                  {event.emotionAnalysis.confidence}%
                                </p>
                              </div>
                              <div className="bg-[#1A1A1A] rounded-lg p-3">
                                <p className="text-xs text-gray-400">Sentiment</p>
                                <p className="text-lg font-semibold text-white">
                                  {event.emotionAnalysis.sentiment > 0 ? '+' : ''}
                                  {(event.emotionAnalysis.sentiment * 100).toFixed(0)}%
                                </p>
                              </div>
                              <div className="bg-[#1A1A1A] rounded-lg p-3">
                                <p className="text-xs text-gray-400">Keywords</p>
                                <p className="text-sm text-white truncate">
                                  {event.emotionAnalysis.keywords.slice(0, 3).join(', ')}
                                </p>
                              </div>
                            </div>

                            {/* Escalation Reason */}
                            {event.emotionAnalysis.escalationReason && (
                              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                                <p className="text-sm text-amber-400">
                                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                                  Escalation Reason: {event.emotionAnalysis.escalationReason}
                                </p>
                              </div>
                            )}

                            {/* Resolution Notes (if resolved) */}
                            {event.status === 'resolved' && event.resolutionNotes && (
                              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                                <p className="text-xs text-gray-400 mb-1">Resolution:</p>
                                <p className="text-sm text-green-400">{event.resolutionNotes}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Resolved by {event.resolvedBy} {event.resolvedAt && formatDistanceToNow(event.resolvedAt, { addSuffix: true })}
                                </p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {event.status === 'pending' && (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedEscalation(event)}
                                  className="border-gold/20 text-white hover:bg-gold/10"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Full Message
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAcknowledge(event.id)}
                                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Acknowledge
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEscalation(event);
                                    setResolveDialogOpen(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleLetAmandaHandle(event)}
                                  className="border-gold/30 text-gold hover:bg-gold/10"
                                >
                                  <Zap className="h-4 w-4 mr-1" />
                                  Let Amanda Handle
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="bg-[#0E0E0E] border-gold/20 text-white">
          <DialogHeader>
            <DialogTitle>Resolve Escalation</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add resolution notes for this escalation from {selectedEscalation?.senderName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEscalation && (
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-1">Original Message:</p>
                <p className="text-white text-sm">{selectedEscalation.originalMessage}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Resolution Notes</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this was resolved..."
                  className="bg-[#1A1A1A] border-gold/20 text-white min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)} className="border-gold/20 text-white">
              Cancel
            </Button>
            <Button onClick={handleResolve} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve Escalation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FoundersEscalationsPanel;
