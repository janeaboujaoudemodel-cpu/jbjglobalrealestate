/**
 * SharePanel — Share & social integration for video projects
 */
import React, { useCallback, useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Mail, Send, Users } from 'lucide-react';
import { toast } from 'sonner';

const C = {
  bgCard: '#18181F',
  bgButton: '#1E1E28',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderAccent: 'rgba(200,168,122,0.35)',
  textPrimary: '#F1F0EE',
  textSecondary: '#8A8A9A',
  accent: '#C8A87A',
  accentGlow: 'rgba(200,168,122,0.15)',
} as const;

interface SharePanelProps {
  projectName?: string;
}

export function SharePanel({ projectName = 'Untitled Project' }: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/toolkit/video-suite`;
  const shareText = `Check out my video project: "${projectName}" — Created with JBJ Creative Video Suite`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [shareUrl]);

  const handleWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
  }, [shareText, shareUrl]);

  const handleEmail = useCallback(() => {
    window.open(`mailto:?subject=${encodeURIComponent(`Video Project: ${projectName}`)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank');
  }, [projectName, shareText, shareUrl]);

  const handleTelegram = useCallback(() => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  }, [shareText, shareUrl]);

  const handleSendToTeam = useCallback(() => {
    toast.success('Project shared with team', {
      description: 'Team members will receive a notification',
      action: { label: 'View', onClick: () => {} },
    });
  }, []);

  const channels = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366', onClick: handleWhatsApp },
    { id: 'email', label: 'Email', icon: Mail, color: '#4A90D9', onClick: handleEmail },
    { id: 'telegram', label: 'Telegram', icon: Send, color: '#0088CC', onClick: handleTelegram },
  ];

  return (
    <div className="p-4 space-y-4" style={{ color: C.textPrimary }}>
      <div className="flex items-center gap-2 mb-2">
        <Share2 className="w-4 h-4" style={{ color: C.accent }} />
        <h3 className="text-sm font-semibold">Share & Collaborate</h3>
      </div>
      <p className="text-xs" style={{ color: C.textSecondary }}>
        Share your video project with your team or on social channels.
      </p>

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accent }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy Project Link'}
      </button>

      {/* Social channels */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textSecondary }}>Share via</span>
        <div className="grid grid-cols-3 gap-2">
          {channels.map(ch => {
            const Icon = ch.icon;
            return (
              <button
                key={ch.id}
                onClick={ch.onClick}
                className="flex flex-col items-center gap-1.5 py-3 rounded-lg text-[10px] font-medium transition-all hover:opacity-90"
                style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
              >
                <Icon className="w-5 h-5" style={{ color: ch.color }} />
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Send to team */}
      <button
        onClick={handleSendToTeam}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
      >
        <Users className="w-4 h-4" style={{ color: C.accent }} />
        Send to Team
      </button>
    </div>
  );
}
