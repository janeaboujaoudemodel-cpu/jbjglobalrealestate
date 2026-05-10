import React, { useState } from 'react';
import { Share2, Instagram, Youtube, Linkedin, Music2, Send, Calendar, Copy, Check, Clock, Hash, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSocialPublishing } from '../hooks/useSocialPublishing';
import type { PropertySnapshot, ExportPreset } from '../types';
import { toast } from 'sonner';

interface PublishPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  property?: PropertySnapshot | null;
  exportedUrl?: string;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500', formats: ['Reel', 'Story', 'Post'] },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: 'text-white', formats: ['Video'] },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500', formats: ['Short', 'Video'] },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-500', formats: ['Post', 'Video'] },
];

export function PublishPanel({ isOpen, onClose, projectId, property, exportedUrl }: PublishPanelProps) {
  const { connections, generateCaption, generateHashtags, schedulePost, connectPlatform } = useSocialPublishing();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [hashtags, setHashtags] = useState<Record<string, string[]>>({});
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState('professional');

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleGenerateCaptions = () => {
    const newCaptions: Record<string, string> = {};
    const newHashtags: Record<string, string[]> = {};

    selectedPlatforms.forEach((platform) => {
      newCaptions[platform] = generateCaption(property, platform, tone);
      newHashtags[platform] = generateHashtags(property, platform);
    });

    setCaptions(newCaptions);
    setHashtags(newHashtags);
    toast.success('Captions generated!');
  };

  const handleCopyShareLink = () => {
    const shareUrl = exportedUrl || `${window.location.origin}/studio/share/${projectId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Share link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please select date and time');
      return;
    }

    setIsScheduling(true);
    try {
      for (const platform of selectedPlatforms) {
        await schedulePost({
          project_id: projectId,
          platform,
          post_type: 'reel',
          content_url: exportedUrl,
          caption: captions[platform],
          hashtags: hashtags[platform],
          scheduled_for: `${scheduleDate}T${scheduleTime}:00`,
          timezone: 'Asia/Dubai',
        });
      }
      toast.success('Posts scheduled!');
      onClose();
    } catch (err) {
      toast.error('Failed to schedule posts');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-[#1A1A1A] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#1A1A1A]" />
            Publish & Share
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="platforms" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1A1A1A]">
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="captions">Captions</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isConnected = connections.some((c) => c.platform === platform.id && c.is_active);
                const isSelected = selectedPlatforms.includes(platform.id);

                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#EFE6D6]/10 border-[#B89555]'
                        : 'bg-[#1A1A1A]/50 border-[#1A1A1A] hover:border-slate-600'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${platform.color}`} />
                    <p className="text-sm font-medium text-white">{platform.name}</p>
                    <p className="text-[10px] text-[#1A1A1A]/70 mt-1">
                      {isConnected ? 'Connected' : 'Use share link'}
                    </p>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#1A1A1A] mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-[#1A1A1A]/50 border border-[#1A1A1A]">
              <p className="text-sm text-[#1A1A1A]/70 mb-3">Quick Share Link</p>
              <div className="flex gap-2">
                <Input
                  value={exportedUrl || `${window.location.origin}/studio/share/${projectId}`}
                  readOnly
                  className="bg-[#1A1A1A] border-slate-600 text-[#1A1A1A]/70 text-sm"
                />
                <Button onClick={handleCopyShareLink} variant="outline" className="border-[#B89555] text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="captions" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="w-40 bg-[#1A1A1A] border-[#1A1A1A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateCaptions} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                <MessageSquare className="w-4 h-4 mr-2" />
                Generate All
              </Button>
            </div>

            {selectedPlatforms.map((platform) => {
              const platformInfo = PLATFORMS.find((p) => p.id === platform);
              const Icon = platformInfo?.icon || Share2;

              return (
                <div key={platform} className="space-y-2">
                  <label className="text-sm text-[#1A1A1A]/70 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${platformInfo?.color}`} />
                    {platformInfo?.name} Caption
                  </label>
                  <Textarea
                    value={captions[platform] || ''}
                    onChange={(e) => setCaptions({ ...captions, [platform]: e.target.value })}
                    placeholder={`Write caption for ${platformInfo?.name}...`}
                    className="min-h-[100px] bg-[#1A1A1A] border-[#1A1A1A] text-white"
                  />
                  <div className="flex flex-wrap gap-1">
                    {(hashtags[platform] || []).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-[#EFE6D6]/20 text-[#1A1A1A]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="p-6 rounded-xl bg-[#1A1A1A]/50 border border-[#1A1A1A] space-y-4">
              <div className="flex items-center gap-2 text-[#1A1A1A]/70">
                <Calendar className="w-5 h-5 text-[#1A1A1A]" />
                <span className="font-medium">Schedule Posts</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#1A1A1A]/70">Date</label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="bg-[#1A1A1A] border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#1A1A1A]/70">Time (Dubai)</label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-[#1A1A1A] border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-[#1A1A1A]">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Direct publishing requires connected accounts. Use share links for immediate sharing.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-[#1A1A1A]/70">
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={isScheduling || selectedPlatforms.length === 0}
            className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
          >
            {isScheduling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Schedule Posts
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
