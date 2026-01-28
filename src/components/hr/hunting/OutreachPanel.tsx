import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Send, 
  Sparkles,
  Mail,
  MessageSquare,
  Phone,
  Linkedin,
  Clock,
  CheckCircle,
  Eye,
  Reply
} from 'lucide-react';
import { useHuntingSystem, HuntTargetType, HuntProspect } from '@/hooks/useHuntingSystem';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OutreachPanelProps {
  targetType: HuntTargetType;
}

export function OutreachPanel({ targetType }: OutreachPanelProps) {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<string>('');
  const [channel, setChannel] = useState<string>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outreachHistory, setOutreachHistory] = useState<any[]>([]);

  const { 
    prospects, 
    templates,
    fetchProspects, 
    fetchTemplates,
    createOutreach 
  } = useHuntingSystem();

  useEffect(() => {
    fetchProspects(undefined, targetType);
    fetchTemplates(targetType);
    fetchOutreachHistory();
  }, [targetType, fetchProspects, fetchTemplates]);

  const fetchOutreachHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('hunt_outreach')
        .select(`
          *,
          prospect:hunt_prospects(full_name, email, company)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOutreachHistory(data || []);
    } catch (error) {
      console.error('Error fetching outreach history:', error);
    }
  };

  const filteredProspects = prospects.filter(p => 
    p.target_type === targetType && 
    p.status !== 'converted' && 
    p.status !== 'not_interested'
  );

  const selectedProspectData = prospects.find(p => p.id === selectedProspect);

  const handleGenerateMessage = async () => {
    if (!selectedProspectData) {
      toast.error('Please select a prospect first');
      return;
    }

    setIsGenerating(true);
    try {
      // Use template as base if available
      const template = templates.find(t => t.target_type === targetType);
      if (template) {
        let generatedMessage = template.content;
        generatedMessage = generatedMessage.replace('{{name}}', selectedProspectData.full_name.split(' ')[0]);
        generatedMessage = generatedMessage.replace('{{company}}', selectedProspectData.company || 'your company');
        generatedMessage = generatedMessage.replace('{{role}}', selectedProspectData.job_title || 'your role');
        
        setMessage(generatedMessage);
        setSubject(template.subject || '');
        toast.success('Message generated from template');
      } else {
        // Generate a basic message
        const targetMessages = {
          investor: `Dear ${selectedProspectData.full_name.split(' ')[0]},\n\nI hope this message finds you well. I'm reaching out from JBJ Global Real Estate regarding exclusive investment opportunities in Dubai's premium real estate market.\n\nWould you be interested in learning more about our current offerings?\n\nBest regards,\nJBJ Global Real Estate`,
          broker: `Hi ${selectedProspectData.full_name.split(' ')[0]},\n\nI noticed your work at ${selectedProspectData.company || 'your company'} and wanted to discuss a potential partnership opportunity.\n\nAt JBJ Global Real Estate, we're always looking to work with talented brokers. Would you be open to a quick conversation?\n\nBest,\nJBJ Global Team`,
          employee: `Hi ${selectedProspectData.full_name.split(' ')[0]},\n\nYour profile caught my attention, and I believe you would be a great fit for our team at JBJ Global Real Estate.\n\nWe're currently looking for talented professionals like yourself. Would you be interested in learning more about this opportunity?\n\nBest regards,\nHR Team, JBJ Global Real Estate`,
        };
        
        setMessage(targetMessages[targetType]);
        setSubject(`Opportunity at JBJ Global Real Estate`);
        toast.success('Message generated');
      }
    } catch (error) {
      console.error('Error generating message:', error);
      toast.error('Failed to generate message');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedProspect || !message) {
      toast.error('Please select a prospect and compose a message');
      return;
    }

    const prospect = prospects.find(p => p.id === selectedProspect);
    const campaign = prospect?.campaign_id;

    await createOutreach({
      prospect_id: selectedProspect,
      campaign_id: campaign || null,
      channel,
      subject,
      content: message,
      message_type: 'initial',
      ai_generated: false,
    });

    setIsComposeOpen(false);
    setSelectedProspect('');
    setMessage('');
    setSubject('');
    fetchOutreachHistory();
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (outreach: any) => {
    if (outreach.responded_at) return <Reply className="h-4 w-4 text-green-500" />;
    if (outreach.opened_at) return <Eye className="h-4 w-4 text-blue-500" />;
    if (outreach.delivered_at) return <CheckCircle className="h-4 w-4 text-cyan-500" />;
    if (outreach.sent_at) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Compose Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Outreach Messages</h3>
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose Outreach Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Prospect</Label>
                  <Select value={selectedProspect} onValueChange={setSelectedProspect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a prospect" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProspects.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name} {p.company ? `(${p.company})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="linkedin">
                        <div className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {channel === 'email' && (
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Email subject line"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Message</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateMessage}
                    disabled={isGenerating || !selectedProspect}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {isGenerating ? 'Generating...' : 'AI Generate'}
                  </Button>
                </div>
                <Textarea
                  placeholder="Type your message or use AI to generate..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                />
              </div>

              {selectedProspectData && (
                <Card className="bg-muted/50">
                  <CardContent className="py-3">
                    <div className="text-sm">
                      <p className="font-medium">{selectedProspectData.full_name}</p>
                      <p className="text-muted-foreground">
                        {selectedProspectData.job_title} {selectedProspectData.company && `at ${selectedProspectData.company}`}
                      </p>
                      {selectedProspectData.email && (
                        <p className="text-muted-foreground">{selectedProspectData.email}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={handleSendMessage} 
                className="w-full"
                disabled={!selectedProspect || !message}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Outreach History */}
      <div className="space-y-3">
        <h4 className="font-medium text-muted-foreground">Recent Outreach</h4>
        
        {outreachHistory.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Send className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
              <p className="text-muted-foreground text-center">
                Start reaching out to prospects to see your message history here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {outreachHistory.map((outreach) => (
              <Card key={outreach.id} className="bg-card/50 backdrop-blur-sm">
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {getChannelIcon(outreach.channel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {outreach.prospect?.full_name || 'Unknown'}
                        </span>
                        {outreach.prospect?.company && (
                          <Badge variant="outline" className="text-xs">
                            {outreach.prospect.company}
                          </Badge>
                        )}
                        {getStatusIcon(outreach)}
                      </div>
                      {outreach.subject && (
                        <p className="text-sm font-medium text-muted-foreground">
                          {outreach.subject}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {outreach.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Sent {formatDistanceToNow(new Date(outreach.sent_at || outreach.created_at))} ago
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OutreachPanel;
