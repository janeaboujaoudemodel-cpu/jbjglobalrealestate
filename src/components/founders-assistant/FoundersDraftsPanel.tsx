import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileEdit,
  Mail,
  MessageSquare,
  FileText,
  Send,
  Trash2,
  Edit,
  Clock,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Draft {
  id: string;
  draft_type: string;
  subject: string | null;
  content: string;
  status: string;
  created_at: string;
  lead_id: string | null;
  ai_employee_id: string | null;
}

const draftTypeIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  whatsapp: <MessageSquare className="w-4 h-4" />,
  proposal: <FileText className="w-4 h-4" />,
  report: <FileEdit className="w-4 h-4" />,
};

const draftTypeColors: Record<string, string> = {
  email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  whatsapp: 'bg-green-500/20 text-green-400 border-green-500/30',
  proposal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  report: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const FoundersDraftsPanel: React.FC = () => {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_ai_drafts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDraft = (draft: Draft) => {
    setSelectedDraft(draft);
    setEditedContent(draft.content);
  };

  const handleSaveDraft = async () => {
    if (!selectedDraft) return;

    try {
      const { error } = await supabase
        .from('crm_ai_drafts')
        .update({ content: editedContent })
        .eq('id', selectedDraft.id);

      if (error) throw error;
      toast.success('Draft saved');
      fetchDrafts();
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_ai_drafts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Draft deleted');
      if (selectedDraft?.id === id) {
        setSelectedDraft(null);
      }
      fetchDrafts();
    } catch (error) {
      toast.error('Failed to delete draft');
    }
  };

  const handleSendDraft = async (draft: Draft) => {
    try {
      const { error } = await supabase
        .from('crm_ai_drafts')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', draft.id);

      if (error) throw error;
      toast.success('Draft sent successfully!');
      fetchDrafts();
    } catch (error) {
      toast.error('Failed to send draft');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
      {/* Drafts List - White Pearl Theme */}
      <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)] lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-black text-lg flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-gold" />
            Work in Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 p-4 pt-0">
              {drafts.length === 0 ? (
                <div className="text-center py-8">
                  <FileEdit className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                  <p className="text-zinc-500">No drafts yet</p>
                  <p className="text-sm text-zinc-400 mt-1">Ask Amanda to draft messages for you</p>
                </div>
              ) : (
                drafts.map((draft) => (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDraft?.id === draft.id 
                        ? 'bg-gold/10 border-gold/40' 
                        : 'bg-white border-gold/20 hover:border-gold/40 hover:shadow-[0_4px_15px_rgba(200,167,102,0.1)]'
                    }`}
                    onClick={() => handleSelectDraft(draft)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={draftTypeColors[draft.draft_type]}>
                          {draftTypeIcons[draft.draft_type]}
                        </Badge>
                        <span className="text-sm font-medium text-black capitalize">
                          {draft.draft_type}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs border ${
                          draft.status === 'sent' 
                            ? 'border-green-200 text-green-600 bg-green-50' 
                            : 'border-gold/30 text-zinc-500 bg-zinc-50'
                        }`}
                      >
                        {draft.status === 'sent' ? 'Sent' : 'Draft'}
                      </Badge>
                    </div>
                    {draft.subject && (
                      <p className="text-sm text-zinc-600 mt-2 truncate">{draft.subject}</p>
                    )}
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{draft.content}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                      <Clock className="w-3 h-3" />
                      {format(new Date(draft.created_at), 'MMM d, h:mm a')}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Draft Editor - White Pearl Theme */}
      <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)] lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-black text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-gold" />
              {selectedDraft ? 'Edit Draft' : 'Select a Draft'}
            </span>
            {selectedDraft && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDeleteDraft(selectedDraft.id)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveDraft}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSendDraft(selectedDraft)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDraft ? (
            <div className="space-y-4">
              {selectedDraft.subject && (
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Subject</label>
                  <p className="text-black bg-zinc-50 p-3 rounded-lg border-2 border-gold/20">
                    {selectedDraft.subject}
                  </p>
                </div>
              )}
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Content</label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[300px] bg-white border-2 border-gold/30 text-black resize-none placeholder:text-zinc-400"
                  placeholder="Draft content..."
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-center">
              <div>
                <FileEdit className="w-16 h-16 text-gold/20 mx-auto mb-4" />
                <p className="text-zinc-500">Select a draft to edit</p>
                <p className="text-sm text-zinc-400 mt-1">Or ask Amanda to create a new one</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FoundersDraftsPanel;
