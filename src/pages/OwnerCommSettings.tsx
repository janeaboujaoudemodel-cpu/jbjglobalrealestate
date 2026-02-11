/**
 * Owner Communication Settings - JBJ Global Real Estate
 * Manage channels, AI settings, and integrations
 */

import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Settings,
  MessageSquare,
  Mail,
  Instagram,
  Facebook,
  Globe,
  Mic,
  Plus,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Trash2,
  Volume2,
  Brain,
  Sparkles,
  Shield,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const channelTypes = [
  { value: 'whatsapp', label: 'WhatsApp Business', icon: MessageSquare, color: 'text-green-500' },
  { value: 'email_gmail', label: 'Gmail', icon: Mail, color: 'text-red-500' },
  { value: 'email_hostinger', label: 'Hostinger Webmail', icon: Mail, color: 'text-blue-500' },
  { value: 'instagram', label: 'Instagram DM', icon: Instagram, color: 'text-pink-500' },
  { value: 'facebook', label: 'Facebook Messenger', icon: Facebook, color: 'text-blue-600' },
  { value: 'website_chat', label: 'Website Chat', icon: Globe, color: 'text-gold' },
  { value: 'voice', label: 'Voice (ElevenLabs)', icon: Mic, color: 'text-purple-500' },
];

export default function OwnerCommSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('channels');
  const [addChannelType, setAddChannelType] = useState<string | null>(null);

  // Fetch channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['owner-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owner_comm_channels')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['owner-comm-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owner_comm_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch tone profile
  const { data: toneProfile } = useQuery({
    queryKey: ['owner-tone-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owner_comm_tone_profiles')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update settings
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Record<string, unknown>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('owner_comm_settings')
          .update(newSettings)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('owner_comm_settings')
          .insert({ user_id: user!.id, ...newSettings });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-comm-settings'] });
      toast.success('Settings saved');
    },
  });

  // Update tone profile
  const updateToneProfile = useMutation({
    mutationFn: async (newProfile: Record<string, unknown>) => {
      if (toneProfile?.id) {
        const { error } = await supabase
          .from('owner_comm_tone_profiles')
          .update(newProfile)
          .eq('id', toneProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('owner_comm_tone_profiles')
          .insert({ 
            user_id: user!.id, 
            profile_name: 'default',
            ...newProfile 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-tone-profile'] });
      toast.success('Tone profile updated');
    },
  });

  // Delete channel
  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('owner_comm_channels')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-channels'] });
      toast.success('Channel disconnected');
    },
  });

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm border-2 border-gold/30 rounded-2xl p-4 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <div className="p-3 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/30">
                <Settings className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Communication Settings</h1>
                <p className="text-zinc-500 text-sm">Jane Bou Jaoude — Manage channels, AI behavior, and integrations</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6 bg-white/80 border-2 border-gold/20">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="ai">AI Settings</TabsTrigger>
              <TabsTrigger value="tone">Tone Profile</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
            </TabsList>

            {/* Channels Tab */}
            <TabsContent value="channels">
              <div className="grid gap-4">
                {/* Connected Channels */}
                <Card className="border-2 border-gold/20 bg-white/90">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Connected Channels</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="primary" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Channel
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Connect a Channel</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            {channelTypes.map(ch => {
                              const Icon = ch.icon;
                              return (
                                <Button
                                  key={ch.value}
                                  variant="outline"
                                  className="h-auto py-4 flex-col gap-2 border-gold/20"
                                  onClick={() => setAddChannelType(ch.value)}
                                >
                                  <Icon className={`h-6 w-6 ${ch.color}`} />
                                  <span className="text-sm">{ch.label}</span>
                                </Button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-zinc-500 text-center mt-4">
                            Note: OAuth integrations coming soon. Manual setup available.
                          </p>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {channelsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gold" />
                      </div>
                    ) : channels.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gold/30 mx-auto mb-3" />
                        <p className="text-zinc-500">No channels connected</p>
                        <p className="text-zinc-400 text-sm">Add your first channel to start receiving messages</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {channels.map((channel) => {
                          const chType = channelTypes.find(c => c.value === channel.channel_type);
                          const Icon = chType?.icon || Globe;
                          return (
                            <div
                              key={channel.id}
                              className="flex items-center justify-between p-3 rounded-xl border border-gold/20 bg-white"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-zinc-50 ${chType?.color || 'text-zinc-500'}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium text-black">{channel.display_name}</p>
                                  <p className="text-xs text-zinc-500">{channel.identifier}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={channel.is_active ? 'default' : 'outline'} className={channel.is_active ? 'bg-green-500' : ''}>
                                  {channel.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline">
                                  {channel.assistant_type === 'owner' ? 'Personal' : 'Company'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => deleteChannel.mutate(channel.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Settings Tab */}
            <TabsContent value="ai">
              <div className="grid gap-4">
                <Card className="border-2 border-gold/20 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5 text-gold" />
                      AI Behavior
                    </CardTitle>
                    <CardDescription>Control how the AI assistant handles communications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Auto-Send Replies</Label>
                        <p className="text-sm text-zinc-500">AI sends responses automatically without approval</p>
                      </div>
                      <Switch
                        checked={settings?.auto_send_enabled || false}
                        onCheckedChange={(checked) => updateSettings.mutate({ auto_send_enabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Draft by Default</Label>
                        <p className="text-sm text-zinc-500">Automatically generate AI drafts for new messages</p>
                      </div>
                      <Switch
                        checked={settings?.ai_draft_by_default ?? true}
                        onCheckedChange={(checked) => updateSettings.mutate({ ai_draft_by_default: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Auto-Link to CRM</Label>
                        <p className="text-sm text-zinc-500">Automatically link conversations to matching leads</p>
                      </div>
                      <Switch
                        checked={settings?.auto_link_leads ?? true}
                        onCheckedChange={(checked) => updateSettings.mutate({ auto_link_leads: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Log to CRM</Label>
                        <p className="text-sm text-zinc-500">Record all communications in CRM activity</p>
                      </div>
                      <Switch
                        checked={settings?.auto_log_to_crm ?? true}
                        onCheckedChange={(checked) => updateSettings.mutate({ auto_log_to_crm: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gold/20 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-gold" />
                      AI Learning
                    </CardTitle>
                    <CardDescription>The AI learns from your corrections to improve over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gold/5 border border-gold/20">
                      <div>
                        <p className="font-medium text-black">Learning Enabled</p>
                        <p className="text-sm text-zinc-500">AI adapts to your writing style and preferences</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tone Profile Tab */}
            <TabsContent value="tone">
              <Card className="border-2 border-gold/20 bg-white/90">
                <CardHeader>
                  <CardTitle className="text-lg">Your Tone Profile</CardTitle>
                  <CardDescription>Define how the AI should communicate in your style</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base mb-3 block">Formality Level</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-500 w-16">Casual</span>
                      <Slider
                        value={[toneProfile?.formality_level || 3]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={([v]) => updateToneProfile.mutate({ formality_level: v })}
                        className="flex-1"
                      />
                      <span className="text-sm text-zinc-500 w-16 text-right">Formal</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-3 block">Emoji Usage</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-500 w-16">Never</span>
                      <Slider
                        value={[toneProfile?.emoji_usage || 2]}
                        min={0}
                        max={5}
                        step={1}
                        onValueChange={([v]) => updateToneProfile.mutate({ emoji_usage: v })}
                        className="flex-1"
                      />
                      <span className="text-sm text-zinc-500 w-16 text-right">Often</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-2">Message Length</Label>
                    <Select 
                      value={toneProfile?.message_length || 'medium'}
                      onValueChange={(v) => updateToneProfile.mutate({ message_length: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (1-2 sentences)</SelectItem>
                        <SelectItem value="medium">Medium (2-4 sentences)</SelectItem>
                        <SelectItem value="long">Long (detailed responses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base mb-2">Signature</Label>
                    <Input
                      value={toneProfile?.signature || ''}
                      onChange={(e) => updateToneProfile.mutate({ signature: e.target.value })}
                      placeholder="e.g., Best regards, Jane"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Language Switching</Label>
                      <p className="text-sm text-zinc-500">Reply in the same language as the sender</p>
                    </div>
                    <Switch
                      checked={toneProfile?.language_switching ?? true}
                      onCheckedChange={(checked) => updateToneProfile.mutate({ language_switching: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice">
              <Card className="border-2 border-gold/20 bg-white/90">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-gold" />
                    Voice Settings
                  </CardTitle>
                  <CardDescription>Configure ElevenLabs voice for voice notes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Voice Enabled</Label>
                      <p className="text-sm text-zinc-500">Generate voice replies using your cloned voice</p>
                    </div>
                    <Switch
                      checked={settings?.voice_enabled ?? true}
                      onCheckedChange={(checked) => updateSettings.mutate({ voice_enabled: checked })}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">ElevenLabs Connected</p>
                        <p className="text-sm text-green-600">Voice ID configured and ready</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gold/5 border border-gold/20">
                    <p className="text-sm text-zinc-600">
                      <Shield className="h-4 w-4 inline mr-1 text-gold" />
                      Your voice clone is used exclusively for generating voice notes. 
                      It is never used for phone calls or real-time conversations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
