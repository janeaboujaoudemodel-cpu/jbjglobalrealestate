/**
 * Owner Templates Page - JBJ Global Real Estate
 * Manage message templates for all channels
 */

import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Copy,
  MessageSquare,
  Mail,
  Instagram,
  Mic,
  Search,
  Tag,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const categories = [
  { value: 'new_lead', label: 'New Lead', color: 'bg-blue-500' },
  { value: 'no_reply', label: 'No Reply', color: 'bg-yellow-500' },
  { value: 'follow_up', label: 'Follow-up', color: 'bg-orange-500' },
  { value: 'viewing', label: 'Viewing', color: 'bg-purple-500' },
  { value: 'offer', label: 'Offer', color: 'bg-green-500' },
  { value: 'closing', label: 'Closing', color: 'bg-gold' },
  { value: 'nurture', label: 'Nurture', color: 'bg-pink-500' },
  { value: 'support', label: 'Support', color: 'bg-cyan-500' },
  { value: 'custom', label: 'Custom', color: 'bg-zinc-500' },
];

const variables = [
  '{{lead_name}}',
  '{{property_name}}',
  '{{price}}',
  '{{location}}',
  '{{handover}}',
  '{{whatsapp_link}}',
  '{{calendar_link}}',
];

interface Template {
  id: string;
  name: string;
  category: string;
  channel_types: string[];
  subject: string | null;
  content: string;
  voice_script: string | null;
  is_active: boolean;
  use_count: number;
  created_at: string;
}

export default function OwnerTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('new_lead');
  const [formChannels, setFormChannels] = useState<string[]>(['whatsapp', 'email']);
  const [formSubject, setFormSubject] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVoiceScript, setFormVoiceScript] = useState('');

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['owner-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owner_comm_templates')
        .select('*')
        .order('use_count', { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
    enabled: !!user?.id,
  });

  // Create/Update template
  const saveMutation = useMutation({
    mutationFn: async (isEdit: boolean) => {
      const templateData = {
        user_id: user!.id,
        name: formName,
        category: formCategory,
        channel_types: formChannels,
        subject: formSubject || null,
        content: formContent,
        voice_script: formVoiceScript || null,
      };

      if (isEdit && editingTemplate) {
        const { error } = await supabase
          .from('owner_comm_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('owner_comm_templates')
          .insert(templateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-templates'] });
      toast.success(editingTemplate ? 'Template updated' : 'Template created');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to save template');
    },
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('owner_comm_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-templates'] });
      toast.success('Template deleted');
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormCategory('new_lead');
    setFormChannels(['whatsapp', 'email']);
    setFormSubject('');
    setFormContent('');
    setFormVoiceScript('');
    setEditingTemplate(null);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormCategory(template.category);
    setFormChannels(template.channel_types);
    setFormSubject(template.subject || '');
    setFormContent(template.content);
    setFormVoiceScript(template.voice_script || '');
    setIsDialogOpen(true);
  };

  const insertVariable = (variable: string) => {
    setFormContent(prev => prev + ' ' + variable);
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
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
                  <FileText className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Message Templates</h1>
                  <p className="text-zinc-500 text-sm">Jane Bou Jaoude — Reusable templates for all channels</p>
                </div>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button variant="primary">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? 'Edit Template' : 'Create Template'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Template Name</Label>
                        <Input
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g., Welcome New Lead"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select value={formCategory} onValueChange={setFormCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Channels</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['whatsapp', 'email', 'instagram', 'facebook', 'voice'].map(ch => (
                          <Badge
                            key={ch}
                            variant={formChannels.includes(ch) ? 'default' : 'outline'}
                            className={`cursor-pointer ${formChannels.includes(ch) ? 'bg-gold text-black' : ''}`}
                            onClick={() => {
                              setFormChannels(prev => 
                                prev.includes(ch) 
                                  ? prev.filter(c => c !== ch)
                                  : [...prev, ch]
                              );
                            }}
                          >
                            {ch}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {formChannels.includes('email') && (
                      <div>
                        <Label>Email Subject</Label>
                        <Input
                          value={formSubject}
                          onChange={(e) => setFormSubject(e.target.value)}
                          placeholder="Subject line for emails"
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Message Content</Label>
                        <div className="flex gap-1">
                          {variables.map(v => (
                            <Button
                              key={v}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => insertVariable(v)}
                            >
                              {v.replace(/[{}]/g, '')}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Type your message template..."
                        className="mt-1 min-h-[150px]"
                      />
                    </div>

                    {formChannels.includes('voice') && (
                      <div>
                        <Label>Voice Script (optional)</Label>
                        <Textarea
                          value={formVoiceScript}
                          onChange={(e) => setFormVoiceScript(e.target.value)}
                          placeholder="Script optimized for voice delivery..."
                          className="mt-1 min-h-[100px]"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => saveMutation.mutate(!!editingTemplate)}
                        disabled={!formName || !formContent || saveMutation.isPending}
                      >
                        {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editingTemplate ? 'Save Changes' : 'Create Template'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gold/30"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                className={`cursor-pointer ${selectedCategory === 'all' ? 'bg-gold text-black' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Badge>
              {categories.map(cat => (
                <Badge
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  className={`cursor-pointer ${selectedCategory === cat.value ? 'bg-gold text-black' : ''}`}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="border-2 border-gold/20 animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-zinc-100 rounded w-full mb-1" />
                    <div className="h-3 bg-zinc-100 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="border-2 border-gold/20 bg-white/90">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gold/30 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">No templates found</p>
                <p className="text-zinc-400 text-sm mt-1">Create your first template to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const category = categories.find(c => c.value === template.category);
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-2 border-gold/20 bg-white/90 hover:border-gold/40 transition-all group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-black">{template.name}</h3>
                            <Badge 
                              variant="outline" 
                              className={`mt-1 text-xs ${category?.color} text-white border-0`}
                            >
                              {category?.label}
                            </Badge>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                navigator.clipboard.writeText(template.content);
                                toast.success('Copied to clipboard');
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500"
                              onClick={() => deleteMutation.mutate(template.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-zinc-600 line-clamp-3 mb-3">
                          {template.content}
                        </p>

                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <div className="flex gap-1">
                            {template.channel_types.includes('whatsapp') && <MessageSquare className="h-3 w-3" />}
                            {(template.channel_types.includes('email') || template.channel_types.includes('email_gmail')) && <Mail className="h-3 w-3" />}
                            {template.channel_types.includes('instagram') && <Instagram className="h-3 w-3" />}
                            {template.channel_types.includes('voice') && <Mic className="h-3 w-3" />}
                          </div>
                          <span>Used {template.use_count}x</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
