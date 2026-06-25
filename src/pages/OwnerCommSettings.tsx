/**
 * Owner Communication Settings - JBJ Global Real Estate
 * Manage channels, AI settings, and integrations
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChannelGrid from "@/components/owner-comm/ChannelGrid";
import HostingerCredentialDialog from "@/components/owner-comm/HostingerCredentialDialog";

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
  ArrowLeft,
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
  { value: 'website_chat', label: 'Website Chat', icon: Globe, color: 'text-[#1A1A1A]' },
  { value: 'voice', label: 'Voice (ElevenLabs)', icon: Mic, color: 'text-purple-500' },
];

export default function OwnerCommSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('channels');
  const [addChannelType, setAddChannelType] = useState<string | null>(null);
  const autoConnectFiredRef = useRef(false);

  // Auto-connect Hostinger using server-stored secrets when ?autoconnect=hostinger
  useEffect(() => {
    if (autoConnectFiredRef.current) return;
    if (!user?.id) return;
    if (searchParams.get('autoconnect') !== 'hostinger') return;
    autoConnectFiredRef.current = true;
    (async () => {
      const t = toast.loading('Connecting Hostinger…');
      try {
        const { data, error } = await supabase.functions.invoke('comm-hostinger-autoconnect', { body: {} });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        toast.success(`Hostinger connected: ${(data as any)?.email ?? 'mailbox active'}`, { id: t });
        queryClient.invalidateQueries({ queryKey: ['owner-channels'] });
      } catch (e) {
        toast.error(`Hostinger connect failed: ${e instanceof Error ? e.message : String(e)}`, { id: t });
      } finally {
        const next = new URLSearchParams(searchParams);
        next.delete('autoconnect');
        setSearchParams(next, { replace: true });
      }
    })();
  }, [user?.id, searchParams, setSearchParams, queryClient]);

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
    staleTime: 60000,
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
          .update(newSettings as any)
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
          .update(newProfile as any)
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-4 bg-[#FDFBF7]/80 backdrop-blur-sm border-2 border-[#B89555]/30 rounded-2xl p-4 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10 rounded-xl border border-[#B89555]/20 hover:bg-[#EFE6D6]/10"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </Button>
              <div className="p-3 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-[#B89555]/30">
                <Settings className="h-6 w-6 text-[#1A1A1A]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A]">Communication Settings</h1>
                <p className="text-[#1A1A1A]/70 text-sm">Jane Bou Jaoude — Manage channels, AI behavior, and integrations</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6 bg-[#FDFBF7]/80 border-2 border-[#B89555]/20">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="ai">AI Settings</TabsTrigger>
              <TabsTrigger value="tone">Tone Profile</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
            </TabsList>

            {/* Channels Tab */}
            <TabsContent value="channels">
              <div className="grid gap-4">
                <Card className="border-2 border-[#B89555]/20 bg-[#FDFBF7]/90">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1A1A1A]">Connected Channels</CardTitle>
                    <CardDescription className="text-[#1A1A1A]/70">
                      One-click connect. We auto-detect what's already linked at the workspace level.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChannelGrid />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Settings Tab */}
            <TabsContent value="ai">
              <div className="grid gap-4">
                <Card className="border-2 border-[#B89555]/20 bg-[#FDFBF7]/90">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5 text-[#1A1A1A]" />
                      AI Behavior
                    </CardTitle>
                    <CardDescription>Control how the AI assistant handles communications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Auto-Send Replies</Label>
                        <p className="text-sm text-[#1A1A1A]/70">AI sends responses automatically without approval</p>
                      </div>
                      <Switch
                        checked={settings?.auto_send_enabled || false}
                        onCheckedChange={(checked) => updateSettings.mutate({ auto_send_enabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Draft by Default</Label>
                        <p className="text-sm text-[#1A1A1A]/70">Automatically generate AI drafts for new messages</p>
                      </div>
                      <Switch
                        checked={settings?.ai_draft_by_default ?? true}
                        onCheckedChange={(checked) => updateSettings.mutate({ ai_draft_by_default: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Auto-Link to CRM</Label>
                        <p className="text-sm text-[#1A1A1A]/70">Automatically link conversations to matching leads</p>
                      </div>
                      <Switch
                        checked={settings?.auto_link_leads ?? true}
                        onCheckedChange={(checked) => updateSettings.mutate({ auto_link_leads: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Log to CRM</Label>
                        <p className="text-sm text-[#1A1A1A]/70">Record all communications in CRM activity</p>
                      </div>
                      <Switch
                        checked={settings?.auto_log_to_crm ?? true}
                        onCheckedChange={(checked) => updateSettings.mutate({ auto_log_to_crm: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#B89555]/20 bg-[#FDFBF7]/90">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#1A1A1A]" />
                      AI Learning
                    </CardTitle>
                    <CardDescription>The AI learns from your corrections to improve over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#EFE6D6]/5 border border-[#B89555]/20">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Learning Enabled</p>
                        <p className="text-sm text-[#1A1A1A]/70">AI adapts to your writing style and preferences</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tone Profile Tab */}
            <TabsContent value="tone">
              <Card className="border-2 border-[#B89555]/20 bg-[#FDFBF7]/90">
                <CardHeader>
                  <CardTitle className="text-lg">Your Tone Profile</CardTitle>
                  <CardDescription>Define how the AI should communicate in your style</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base mb-3 block">Formality Level</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[#1A1A1A]/70 w-16">Casual</span>
                      <Slider
                        value={[toneProfile?.formality_level || 3]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={([v]) => updateToneProfile.mutate({ formality_level: v })}
                        className="flex-1"
                      />
                      <span className="text-sm text-[#1A1A1A]/70 w-16 text-right">Formal</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-3 block">Emoji Usage</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[#1A1A1A]/70 w-16">Never</span>
                      <Slider
                        value={[toneProfile?.emoji_usage || 2]}
                        min={0}
                        max={5}
                        step={1}
                        onValueChange={([v]) => updateToneProfile.mutate({ emoji_usage: v })}
                        className="flex-1"
                      />
                      <span className="text-sm text-[#1A1A1A]/70 w-16 text-right">Often</span>
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
                      <p className="text-sm text-[#1A1A1A]/70">Reply in the same language as the sender</p>
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
              <Card className="border-2 border-[#B89555]/20 bg-[#FDFBF7]/90">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-[#1A1A1A]" />
                    Voice Settings
                  </CardTitle>
                  <CardDescription>Configure ElevenLabs voice for voice notes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Voice Enabled</Label>
                      <p className="text-sm text-[#1A1A1A]/70">Generate voice replies using your cloned voice</p>
                    </div>
                    <Switch
                      checked={settings?.voice_enabled ?? true}
                      onCheckedChange={(checked) => updateSettings.mutate({ voice_enabled: checked })}
                    />
                  </div>

                  <div className="p-4 rounded-xl jj-emerald-soft border border-[color:var(--emerald-1)]/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[color:var(--emerald-1)]" />
                      <div>
                        <p className="font-medium text-[color:var(--emerald-1)]">ElevenLabs Connected</p>
                        <p className="text-sm text-[color:var(--emerald-1)]">Voice ID configured and ready</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#EFE6D6]/5 border border-[#B89555]/20">
                    <p className="text-sm text-[#1A1A1A]/70">
                      <Shield className="h-4 w-4 inline mr-1 text-[#1A1A1A]" />
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
      <HostingerCredentialDialog />
    </>
  );
}
