/**
 * Founders Escalations Panel
 * Central hub for viewing and managing all AI-triggered escalations
 * Champagne Gold Theme
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Phone,
  Mail,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Zap,
  Eye,
  Send,
  FileText,
  AlertCircle,
  Bell,
  ShieldAlert,
  Smile,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useSmartEscalation } from '@/hooks/useSmartEscalation';
import { type EscalationEvent } from '@/services/smart-escalation-service';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

type FilterStatus = 'all' | 'pending' | 'acknowledged' | 'resolved';
type FilterUrgency = 'all' | 'critical' | 'high' | 'normal' | 'low';

const getEmotionLucideIcon = (emotion: string) => {
  switch (emotion) {
    case 'angry': return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'urgent': return <ShieldAlert className="h-5 w-5 text-orange-500" />;
    case 'frustrated': return <AlertCircle className="h-5 w-5 text-amber-500" />;
    case 'positive': return <Smile className="h-5 w-5 text-green-500" />;
    case 'grateful': return <Heart className="h-5 w-5 text-pink-500" />;
    default: return <Bell className="h-5 w-5 text-[#5A4A2E]" />;
  }
};

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allEscalations = escalationQueue;

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
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-red-100 text-red-700 border border-red-200 animate-pulse whitespace-nowrap">Pending</Badge>;
      case 'acknowledged':
        return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">Acknowledged</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">Resolved</Badge>;
      default:
        return <Badge variant="outline" className="whitespace-nowrap">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <Badge className="bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-700 border border-orange-200 whitespace-nowrap">High</Badge>;
      case 'normal': return <Badge className="bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">Normal</Badge>;
      case 'low': return <Badge className="bg-[#F7F2EA] text-[#5A4A2E] border border-[#B89555]/30 whitespace-nowrap">Low</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#5A4A2E]">Total</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7] border-2 border-red-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <p className="text-xs text-[#5A4A2E]">Critical</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7] border-2 border-amber-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-amber-500" />
              <p className="text-xs text-[#5A4A2E]">Pending</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7] border-2 border-blue-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="h-3 w-3 text-blue-500" />
              <p className="text-xs text-[#5A4A2E]">Acknowledged</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.acknowledged}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7] border-2 border-green-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <p className="text-xs text-[#5A4A2E]">Resolved</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A4A2E]" />
              <Input
                placeholder="Search escalations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#F7F2EA] border-[#B89555]/20 text-[#1A1A1A]"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
              <SelectTrigger className="w-[150px] bg-[#F7F2EA] border-[#B89555]/20 text-[#1A1A1A]">
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
              <SelectTrigger className="w-[150px] bg-[#F7F2EA] border-[#B89555]/20 text-[#1A1A1A]">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={refreshEscalationQueue}
              disabled={isProcessing}
              className="border-[#B89555]/30 text-[#B89555] hover:bg-[#B89555]/10"
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
              <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/20">
                <CardContent className="p-12 text-center">
                  <Zap className="h-12 w-12 text-[#B89555]/30 mx-auto mb-4" />
                  <p className="text-[#5A4A2E]">No escalations found</p>
                  <p className="text-sm text-[#5A4A2E] mt-1">
                    {statusFilter !== 'all' || urgencyFilter !== 'all' || searchQuery
                      ? 'Try adjusting your filters'
                      : 'All systems running smoothly'}
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
                    className={`bg-[#FDFBF7] transition-all border-2 ${
                      event.status === 'pending'
                        ? event.emotionAnalysis.urgency === 'critical'
                          ? 'border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                          : 'border-amber-300'
                        : event.status === 'resolved'
                        ? 'border-green-200'
                        : 'border-[#B89555]/20'
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            event.emotionAnalysis.urgency === 'critical' ? 'bg-red-50 animate-pulse' : 'bg-[#F7F2EA]'
                          }`}>
                            {getEmotionLucideIcon(event.emotionAnalysis.emotion)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#1A1A1A]">
                                {event.senderName || 'Unknown Sender'}
                              </span>
                              <Badge variant="outline" className="text-xs text-[#5A4A2E] border-[#B89555]/30">
                                {getChannelIcon(event.sourceChannel)}
                                <span className="ml-1 capitalize">{event.sourceChannel}</span>
                              </Badge>
                              {getUrgencyBadge(event.emotionAnalysis.urgency)}
                              {getStatusBadge(event.status)}
                            </div>

                            <p className="text-sm text-[#5A4A2E] mt-2 line-clamp-2">
                              &ldquo;{event.originalMessage}&rdquo;
                            </p>

                            <div className="flex items-center gap-4 mt-3 text-xs text-[#5A4A2E]">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(event.triggeredAt, { addSuffix: true })}
                              </span>
                              <span className="text-[#5A4A2E]">
                                Confidence: {event.emotionAnalysis.confidence}%
                              </span>
                              <span className="text-[#5A4A2E]">
                                Assigned to: {event.escalatedTo.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                          className="text-[#5A4A2E] hover:text-[#1A1A1A]"
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
                            className="mt-4 pt-4 border-t border-[#B89555]/10"
                          >
                            <div className="bg-[#F7F2EA] rounded-lg p-4 mb-4 border border-[#B89555]/30">
                              <p className="text-sm text-[#5A4A2E] mb-1">Original Message:</p>
                              <p className="text-[#1A1A1A]">{event.originalMessage}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-[#F7F2EA] rounded-lg p-3 border border-[#B89555]/30">
                                <p className="text-xs text-[#5A4A2E]">Emotion</p>
                                <p className="text-lg font-semibold text-[#1A1A1A] capitalize">
                                  {event.emotionAnalysis.emotion}
                                </p>
                              </div>
                              <div className="bg-[#F7F2EA] rounded-lg p-3 border border-[#B89555]/30">
                                <p className="text-xs text-[#5A4A2E]">Confidence</p>
                                <p className="text-lg font-semibold text-[#B89555]">
                                  {event.emotionAnalysis.confidence}%
                                </p>
                              </div>
                              <div className="bg-[#F7F2EA] rounded-lg p-3 border border-[#B89555]/30">
                                <p className="text-xs text-[#5A4A2E]">Sentiment</p>
                                <p className="text-lg font-semibold text-[#1A1A1A]">
                                  {event.emotionAnalysis.sentiment > 0 ? '+' : ''}
                                  {(event.emotionAnalysis.sentiment * 100).toFixed(0)}%
                                </p>
                              </div>
                              <div className="bg-[#F7F2EA] rounded-lg p-3 border border-[#B89555]/30">
                                <p className="text-xs text-[#5A4A2E]">Keywords</p>
                                <p className="text-sm text-[#1A1A1A] truncate">
                                  {event.emotionAnalysis.keywords.slice(0, 3).join(', ')}
                                </p>
                              </div>
                            </div>

                            {event.emotionAnalysis.escalationReason && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-amber-700">
                                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                                  Escalation Reason: {event.emotionAnalysis.escalationReason}
                                </p>
                              </div>
                            )}

                            {event.status === 'resolved' && event.resolutionNotes && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <p className="text-xs text-[#5A4A2E] mb-1">Resolution:</p>
                                <p className="text-sm text-green-700">{event.resolutionNotes}</p>
                                <p className="text-xs text-[#5A4A2E] mt-2">
                                  Resolved by {event.resolvedBy} {event.resolvedAt && formatDistanceToNow(event.resolvedAt, { addSuffix: true })}
                                </p>
                              </div>
                            )}

                            {event.status === 'pending' && (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedEscalation(event)}
                                  className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#B89555]/10"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Full Message
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAcknowledge(event.id)}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
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
                                  className="border-[#B89555]/30 text-[#B89555] hover:bg-[#B89555]/10"
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

      {/* Customer Happiness Center */}
      <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
        <CardHeader>
          <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#B89555]" />
            Customer Happiness Center
          </CardTitle>
          <CardDescription className="text-[#5A4A2E]">
            Track satisfaction scores and client sentiment across all interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
              <Smile className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">
                {allEscalations.filter(e => e.emotionAnalysis.sentiment > 0).length}
              </p>
              <p className="text-xs text-[#5A4A2E]">Positive</p>
            </div>
            <div className="bg-[#F7F2EA] rounded-lg p-4 border border-[#B89555]/30 text-center">
              <Bell className="h-6 w-6 text-[#5A4A2E] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#5A4A2E]">
                {allEscalations.filter(e => e.emotionAnalysis.sentiment === 0).length}
              </p>
              <p className="text-xs text-[#5A4A2E]">Neutral</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center">
              <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">
                {allEscalations.filter(e => e.emotionAnalysis.sentiment < 0 && e.emotionAnalysis.sentiment >= -0.5).length}
              </p>
              <p className="text-xs text-[#5A4A2E]">Concerned</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700">
                {allEscalations.filter(e => e.emotionAnalysis.sentiment < -0.5).length}
              </p>
              <p className="text-xs text-[#5A4A2E]">Unhappy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">Resolve Escalation</DialogTitle>
            <DialogDescription className="text-[#5A4A2E]">
              Add resolution notes for this escalation from {selectedEscalation?.senderName}
            </DialogDescription>
          </DialogHeader>

          {selectedEscalation && (
            <div className="space-y-4">
              <div className="bg-[#F7F2EA] rounded-lg p-3 border border-[#B89555]/30">
                <p className="text-sm text-[#5A4A2E] mb-1">Original Message:</p>
                <p className="text-[#1A1A1A] text-sm">{selectedEscalation.originalMessage}</p>
              </div>

              <div>
                <label className="text-sm text-[#5A4A2E] mb-1 block">Resolution Notes</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this was resolved..."
                  className="bg-[#F7F2EA] border-[#B89555]/20 text-[#1A1A1A] min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)} className="border-[#B89555]/20 text-[#1A1A1A]">
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
