import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Phone,
  Clock,
  User,
  Mail,
  AlertTriangle,
  CheckCircle,
  Flag,
  Play,
  MessageSquare,
  TrendingUp,
  Target,
  Star,
  RefreshCw,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Masked call log - PII fields are encrypted and show masked values
interface CallLogMasked {
  id: string;
  call_id: string;
  caller_phone_masked: string | null;
  caller_name_masked: string | null;
  duration_seconds: number | null;
  transcript_masked: string;
  // `summary` plaintext column removed — use `ai_summary` instead.
  recording_url: string | null;
  ai_score: number | null;
  ai_issues: string[] | null;
  ai_highlights: string[] | null;
  ai_sentiment: string | null;
  ai_lead_quality: string | null;
  ai_summary: string | null;
  ai_follow_up_recommended: boolean | null;
  extracted_name_masked: string;
  extracted_phone_masked: string;
  extracted_email_masked: string;
  extracted_interest: string | null;
  extracted_budget: string | null;
  lead_id: string | null;
  needs_review: boolean | null;
  is_flagged: boolean | null;
  flag_reason: string | null;
  notes: string | null;
  assistant_name: string | null;
  created_at: string;
  access_count: number | null;
}

// Decrypted PII data - only available to owner/founder
interface DecryptedPII {
  id: string;
  extracted_name: string | null;
  extracted_phone: string | null;
  extracted_email: string | null;
  transcript: string | null;
  recording_url: string | null;
  created_at: string;
}

export default function CallReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallLogMasked[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallLogMasked | null>(null);
  const [decryptedPII, setDecryptedPII] = useState<DecryptedPII | null>(null);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'needs_review'>('all');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCalls();
  }, [user, filter]);

  // Fetch from masked view for security
  const fetchCalls = async () => {
    setLoading(true);
    try {
      // Use the masked view - it doesn't have the plaintext sensitive columns
      const { data, error } = await supabase
        .from('vapi_call_logs_masked')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Apply client-side filtering since the view may not support .eq on all columns
      let filteredData = data || [];
      if (filter === 'flagged') {
        filteredData = filteredData.filter(c => c.is_flagged === true);
      } else if (filter === 'needs_review') {
        filteredData = filteredData.filter(c => c.needs_review === true);
      }
      
      setCalls(filteredData);
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  // Decrypt PII for selected call - only for owner/founder
  const decryptCallPII = async (callId: string) => {
    setDecrypting(true);
    setDecryptedPII(null);
    try {
      const { data, error } = await supabase
        .rpc('get_vapi_call_decrypted_pii', { p_call_id: callId });

      if (error) {
        if (error.message.includes('Unauthorized')) {
          toast.error('Access denied: Only executives can view decrypted data');
        } else {
          throw error;
        }
        return;
      }

      if (data && data.length > 0) {
        setDecryptedPII(data[0]);
        toast.success('PII decrypted - access logged');
      }
    } catch (error) {
      console.error('Error decrypting PII:', error);
      toast.error('Failed to decrypt call data');
    } finally {
      setDecrypting(false);
    }
  };

  const updateCallNotes = async () => {
    if (!selectedCall) return;
    
    try {
      const { error } = await supabase
        .from('vapi_call_logs')
        .update({ 
          notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          needs_review: false
        })
        .eq('id', selectedCall.id);

      if (error) throw error;
      toast.success('Notes saved');
      fetchCalls();
    } catch (error) {
      toast.error('Failed to save notes');
    }
  };

  const toggleFlag = async (callId: string, currentFlag: boolean) => {
    try {
      const { error } = await supabase
        .from('vapi_call_logs')
        .update({ is_flagged: !currentFlag })
        .eq('id', callId);

      if (error) throw error;
      toast.success(currentFlag ? 'Flag removed' : 'Call flagged');
      fetchCalls();
    } catch (error) {
      toast.error('Failed to update flag');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-muted';
    if (score >= 80) return 'jj-surface-emerald';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLeadQualityBadge = (quality: string | null) => {
    switch (quality) {
      case 'hot':
        return <Badge className="bg-red-500 text-white">🔥 Hot Lead</Badge>;
      case 'warm':
        return <Badge className="bg-orange-500 text-white">Warm Lead</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500 text-white">Cold Lead</Badge>;
      default:
        return <Badge variant="outline">Unqualified</Badge>;
    }
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <ThumbsDown className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">📞 Call Review Dashboard</h1>
          <p className="text-muted-foreground">
            AI-audited call recordings with lead extraction and quality scoring
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Phone className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{calls.length}</p>
                  <p className="text-sm text-muted-foreground">Total Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Flag className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {calls.filter(c => c.is_flagged).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Flagged</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {calls.filter(c => c.ai_lead_quality === 'hot' || c.ai_lead_quality === 'warm').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Hot/Warm Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {calls.length > 0 
                      ? Math.round(calls.reduce((acc, c) => acc + (c.ai_score || 0), 0) / calls.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Calls
          </Button>
          <Button
            variant={filter === 'flagged' ? 'default' : 'outline'}
            onClick={() => setFilter('flagged')}
            className="gap-2"
          >
            <Flag className="w-4 h-4" /> Flagged
          </Button>
          <Button
            variant={filter === 'needs_review' ? 'default' : 'outline'}
            onClick={() => setFilter('needs_review')}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" /> Needs Review
          </Button>
          <Button variant="outline" onClick={fetchCalls} className="ml-auto gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Call History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading calls...
                    </div>
                  ) : calls.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No calls found. Calls will appear here after someone calls John.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {calls.map((call) => (
                        <button
                          key={call.id}
                          onClick={() => {
                            setSelectedCall(call);
                            setNotes(call.notes || '');
                            setDecryptedPII(null); // Clear previous decryption
                          }}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
 selectedCall?.id === call.id ? 'bg-muted' : ''
 }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {call.is_flagged && (
                                <Flag className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-medium">
                                {call.caller_name_masked || call.caller_phone_masked || 'Unknown Caller'}
                              </span>
                            </div>
                            <div className={`w-8 h-8 rounded-full ${getScoreColor(call.ai_score)} flex items-center justify-center text-white text-xs font-bold`}>
                              {call.ai_score || '?'}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(call.duration_seconds)}
                            </span>
                            <span>
                              {format(new Date(call.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <div className="mt-2">
                            {getLeadQualityBadge(call.ai_lead_quality)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Call Detail */}
          <div className="lg:col-span-2">
            {selectedCall ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {decryptedPII?.extracted_name || selectedCall.caller_name_masked || 'Unknown Caller'}
                        {getSentimentIcon(selectedCall.ai_sentiment)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(selectedCall.created_at), 'MMMM d, yyyy at h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFlag(selectedCall.id, selectedCall.is_flagged || false)}
                      >
                        <Flag className={`w-4 h-4 ${selectedCall.is_flagged ? 'text-red-500 fill-red-500' : ''}`} />
                      </Button>
                      {selectedCall.recording_url && (
                        <Button size="sm" asChild>
                          <a href={selectedCall.recording_url} target="_blank" rel="noopener noreferrer">
                            <Play className="w-4 h-4 mr-2" /> Listen
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="transcript">Transcript</TabsTrigger>
                      <TabsTrigger value="lead">Lead Info</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      {/* AI Score */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className={`w-16 h-16 mx-auto rounded-full ${getScoreColor(selectedCall.ai_score)} flex items-center justify-center text-white text-xl font-bold mb-2`}>
                            {selectedCall.ai_score || '?'}
                          </div>
                          <p className="text-sm font-medium">AI Score</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="font-bold">{formatDuration(selectedCall.duration_seconds)}</p>
                          <p className="text-sm text-muted-foreground">Duration</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          {getLeadQualityBadge(selectedCall.ai_lead_quality)}
                          <p className="text-sm text-muted-foreground mt-2">Lead Quality</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <Badge variant={selectedCall.ai_follow_up_recommended ? 'default' : 'outline'}>
                            {selectedCall.ai_follow_up_recommended ? '✓ Follow-up' : 'No follow-up'}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-2">Recommendation</p>
                        </div>
                      </div>

                      {/* AI Summary */}
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">AI Summary</h4>
                        <p className="text-sm">{selectedCall.ai_summary || 'No summary available'}</p>
                      </div>

                      {/* Issues & Highlights */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {selectedCall.ai_issues && selectedCall.ai_issues.length > 0 && (
                          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-red-600">
                              <AlertTriangle className="w-4 h-4" /> Issues Found
                            </h4>
                            <ul className="space-y-1">
                              {selectedCall.ai_issues.map((issue, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="text-red-500">•</span> {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedCall.ai_highlights && selectedCall.ai_highlights.length > 0 && (
                          <div className="p-4 jj-emerald-soft dark:bg-green-950/20 rounded-lg">
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-[color:var(--emerald-1)]">
                              <CheckCircle className="w-4 h-4" /> Highlights
                            </h4>
                            <ul className="space-y-1">
                              {selectedCall.ai_highlights.map((highlight, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="text-green-500">•</span> {highlight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <h4 className="font-medium mb-2">Your Notes</h4>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes about this call..."
                          rows={3}
                        />
                        <Button onClick={updateCallNotes} className="mt-2">
                          Save Notes
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="transcript">
                      <div className="mb-4">
                        {!decryptedPII ? (
                          <Button 
                            onClick={() => decryptCallPII(selectedCall.id)} 
                            disabled={decrypting}
                            variant="secondary"
                            className="gap-2"
                          >
                            {decrypting ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Decrypting...
                              </>
                            ) : (
                              <>
                                🔓 Decrypt Transcript (Executive Only)
                              </>
                            )}
                          </Button>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle className="w-3 h-3" /> Decrypted - Access Logged
                          </Badge>
                        )}
                      </div>
                      <ScrollArea className="h-[400px]">
                        <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                          {decryptedPII?.transcript || selectedCall.transcript_masked || 'No transcript available'}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="lead" className="space-y-4">
                      {/* Decrypt button for PII */}
                      <div className="mb-4">
                        {!decryptedPII ? (
                          <Button 
                            onClick={() => decryptCallPII(selectedCall.id)} 
                            disabled={decrypting}
                            variant="secondary"
                            className="gap-2"
                          >
                            {decrypting ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Decrypting...
                              </>
                            ) : (
                              <>
                                🔓 Decrypt Contact Info (Executive Only)
                              </>
                            )}
                          </Button>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle className="w-3 h-3" /> Decrypted - Access Logged
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Name</span>
                          </div>
                          <p className="font-medium">
                            {decryptedPII?.extracted_name || selectedCall.extracted_name_masked || 'Not provided'}
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Phone</span>
                          </div>
                          <p className="font-medium">
                            {decryptedPII?.extracted_phone || selectedCall.caller_phone_masked || 'Not provided'}
                          </p>
                          {decryptedPII?.extracted_phone && (
                            <Button size="sm" variant="outline" className="mt-2" asChild>
                              <a href={`tel:${decryptedPII.extracted_phone}`}>
                                <Phone className="w-3 h-3 mr-1" /> Call
                              </a>
                            </Button>
                          )}
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Email</span>
                          </div>
                          <p className="font-medium">
                            {decryptedPII?.extracted_email || selectedCall.extracted_email_masked || 'Not provided'}
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Interest</span>
                          </div>
                          <p className="font-medium">{selectedCall.extracted_interest || 'Not specified'}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg md:col-span-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Budget</span>
                          </div>
                          <p className="font-medium">{selectedCall.extracted_budget || 'Not mentioned'}</p>
                        </div>
                      </div>

                      {selectedCall.lead_id ? (
                        <Button asChild>
                          <a href={`/crm/lead/${selectedCall.lead_id}`}>
                            <ExternalLink className="w-4 h-4 mr-2" /> View in CRM
                          </a>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No CRM lead created for this call yet.
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-20 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Call</h3>
                  <p className="text-muted-foreground">
                    Click on a call from the list to view details, transcript, and AI analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
