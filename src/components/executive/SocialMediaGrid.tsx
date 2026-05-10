import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Twitter,
  ExternalLink,
  Check,
  Plus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Custom icons for platforms without lucide support
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.4-5.97s-.36-.72-.36-1.78c0-1.67.97-2.92 2.18-2.92 1.03 0 1.52.77 1.52 1.7 0 1.04-.66 2.6-1 4.04-.28 1.2.6 2.18 1.78 2.18 2.14 0 3.78-2.26 3.78-5.52 0-2.88-2.07-4.9-5.03-4.9-3.43 0-5.44 2.57-5.44 5.23 0 1.04.4 2.14.9 2.74.1.12.11.22.08.34l-.34 1.36c-.05.22-.18.27-.4.16-1.5-.69-2.43-2.87-2.43-4.63 0-3.77 2.74-7.23 7.9-7.23 4.15 0 7.38 2.96 7.38 6.92 0 4.12-2.6 7.44-6.2 7.44-1.21 0-2.35-.63-2.74-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z"/>
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12.17 2c3.24 0 5.66 2.52 5.79 5.65l.01.17v1.44c.28.07.53.17.76.3.82.46.87 1.09.56 1.78-.27.6-.82.98-1.5 1.05l-.16.01c-.28 0-.54-.05-.78-.13a8.6 8.6 0 0 1-.76 1.73c-.68 1.18-1.64 2.14-2.76 2.76a6.69 6.69 0 0 1-2.56.85c-.25.03-.51.05-.77.05-.26 0-.52-.02-.77-.05a6.69 6.69 0 0 1-2.56-.85c-1.12-.62-2.08-1.58-2.76-2.76a8.6 8.6 0 0 1-.76-1.73c-.24.08-.5.13-.78.13l-.16-.01c-.68-.07-1.23-.45-1.5-1.05-.31-.69-.26-1.32.56-1.78.23-.13.48-.23.76-.3V7.82c0-3.22 2.62-5.82 5.8-5.82h.34z"/>
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.8-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.812-.675 1.89-1.082 3.108-1.161.913-.06 1.77.043 2.548.243-.01-.567-.1-1.088-.272-1.564-.324-.896-.907-1.398-1.778-1.536-.674-.106-1.403-.012-2.046.266l-.807-1.852c.972-.423 2.018-.59 3.035-.485 1.423.147 2.56.75 3.285 1.744.622.852.938 1.95.975 3.252v.023c.004.161.003.322-.003.481 1.124.589 2.016 1.42 2.584 2.42.924 1.627.99 4.324-1.212 6.485-1.872 1.835-4.225 2.63-7.403 2.654zM12.6 13.14c-.71.047-1.29.227-1.702.541-.467.356-.686.793-.653 1.3.031.472.287.864.738 1.13.517.307 1.212.447 1.958.395 1.013-.055 1.8-.41 2.343-1.058.428-.51.713-1.191.848-2.026-.46-.094-.953-.15-1.476-.17-.362-.012-.718-.002-1.056.09z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  connected: boolean;
  followers?: string;
  apiUrl?: string;
}

interface SocialMediaGridProps {
  onConnectPlatform: (platform: string) => void;
}

const SocialMediaGrid: React.FC<SocialMediaGridProps> = ({ onConnectPlatform }) => {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-5 h-5" />, color: 'text-pink-500', bgColor: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400', connected: false },
    { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-5 h-5" />, color: 'text-blue-500', bgColor: 'bg-blue-600', connected: false },
    { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, color: 'text-blue-600', bgColor: 'bg-blue-700', connected: false },
    { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-5 h-5" />, color: 'text-red-500', bgColor: 'bg-red-600', connected: false },
    { id: 'tiktok', name: 'TikTok', icon: <TikTokIcon />, color: 'text-white', bgColor: 'bg-[#1A1A1A]', connected: false },
    { id: 'pinterest', name: 'Pinterest', icon: <PinterestIcon />, color: 'text-red-600', bgColor: 'bg-red-600', connected: false },
    { id: 'twitter', name: 'X (Twitter)', icon: <Twitter className="w-5 h-5" />, color: 'text-white', bgColor: 'bg-[#1A1A1A]', connected: false },
    { id: 'snapchat', name: 'Snapchat', icon: <SnapchatIcon />, color: 'text-[#1A1A1A]', bgColor: 'bg-yellow-400', connected: false },
    { id: 'threads', name: 'Threads', icon: <ThreadsIcon />, color: 'text-white', bgColor: 'bg-[#1A1A1A]', connected: false },
    { id: 'telegram', name: 'Telegram', icon: <TelegramIcon />, color: 'text-white', bgColor: 'bg-blue-500', connected: false },
  ]);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Load connected status from database
  useEffect(() => {
    if (user) {
      loadConnectedPlatforms();
    }
  }, [user]);

  const loadConnectedPlatforms = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('assistant_integrations')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      const connectedPlatforms = data.filter(d => d.is_active).map(d => {
        const cfg = d.config as Record<string, any> | null;
        return cfg?.platform || d.channel;
      });
      setPlatforms(prev => prev.map(p => ({
        ...p,
        connected: connectedPlatforms.includes(p.id)
      })));
    }
  };

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Note: Only some channels are supported in DB, we store as instagram for social
      const supportedChannels = ['email', 'phone', 'whatsapp', 'instagram', 'facebook', 'linkedin', 'sms'];
      const channel = supportedChannels.includes(platformId) 
        ? platformId as 'email' | 'phone' | 'whatsapp' | 'instagram' | 'facebook' | 'linkedin' | 'sms'
        : 'instagram'; // Default to instagram for unsupported

      if (user) {
        await supabase.from('assistant_integrations').upsert({
          user_id: user.id,
          channel: channel,
          is_active: true,
          sync_status: 'connected',
          last_sync_at: new Date().toISOString(),
          config: { platform: platformId, connected_at: new Date().toISOString() }
        });
      }

      setPlatforms(prev => prev.map(p => 
        p.id === platformId ? { ...p, connected: true } : p
      ));
      
      const platform = platforms.find(p => p.id === platformId);
      toast.success(`${platform?.name} connected successfully!`);
    } catch (error) {
      toast.error('Failed to connect. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    if (user) {
      // Get the channel from config or use fallback
      const { data } = await supabase
        .from('assistant_integrations')
        .select('id, config')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      const integration = data?.find((d: any) => d.config?.platform === platformId);
      if (integration) {
        await supabase
          .from('assistant_integrations')
          .update({ is_active: false })
          .eq('id', integration.id);
      }
    }

    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, connected: false } : p
    ));
    
    const platform = platforms.find(p => p.id === platformId);
    toast.success(`${platform?.name} disconnected`);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {platforms.map((platform, index) => (
        <motion.div
          key={platform.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`relative p-4 rounded-xl border transition-all ${
            platform.connected 
              ? 'border-green-500/50 bg-green-500/5' 
              : 'border-[#B89555]/20 bg-[#0E0E0E] hover:border-[#B89555]/40'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center mb-3 text-white`}>
              {platform.icon}
            </div>
            <h4 className="text-white font-medium text-sm mb-1">{platform.name}</h4>
            
            {platform.connected ? (
              <>
                <Badge className="bg-green-500/20 text-green-400 border-0 mb-2">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
                <button
                  onClick={() => handleDisconnect(platform.id)}
                  className="text-xs text-[#1A1A1A]/70 hover:text-red-400 transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleConnect(platform.id)}
                disabled={connecting === platform.id}
                className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10 mt-1"
              >
                {connecting === platform.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Connect
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Connection indicator */}
          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
            platform.connected ? 'bg-green-500' : 'bg-[#1A1A1A]'
          }`} />
        </motion.div>
      ))}
    </div>
  );
};

export default SocialMediaGrid;
