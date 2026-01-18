import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Image, 
  Type, 
  Download, 
  Share2, 
  Undo, 
  Redo,
  Layers,
  Sparkles,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  FileText,
  CreditCard as BusinessCard,
  Presentation,
  Plus,
  Mic,
  MicOff,
  Send,
  Upload,
  Camera,
  MessageSquare,
  Users,
  Settings,
  Link2,
  Facebook,
  Twitter,
  Phone,
  RefreshCw,
  Check,
  X,
  Loader2,
  ArrowUpRight,
  Globe,
  Wand2,
  Maximize2,
  Square,
  Star,
  Bookmark,
  LayoutTemplate,
  ImagePlus,
  Video,
  Newspaper,
  Building2,
  Megaphone,
  Calendar,
  Gift,
  Crown,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import ReportProblemButton from '@/components/jbj-assistant/ReportProblemButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Template categories with icons
const TEMPLATE_CATEGORIES = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-800' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-700' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-700' },
  { id: 'whatsapp', label: 'WhatsApp', icon: Phone, color: 'from-green-500 to-green-700' },
  { id: 'email-signature', label: 'Email Signatures', icon: Mail, color: 'from-gold to-gold-dark' },
  { id: 'business-card', label: 'Business Cards', icon: BusinessCard, color: 'from-zinc-700 to-black' },
  { id: 'brochure', label: 'Brochures & Flyers', icon: FileText, color: 'from-indigo-500 to-indigo-700' },
  { id: 'presentation', label: 'Presentations', icon: Presentation, color: 'from-orange-500 to-orange-700' },
  { id: 'logo', label: 'Logos & Branding', icon: Crown, color: 'from-amber-500 to-amber-700' },
  { id: 'property', label: 'Property Marketing', icon: Building2, color: 'from-emerald-500 to-emerald-700' },
  { id: 'events', label: 'Events & Campaigns', icon: Megaphone, color: 'from-rose-500 to-rose-700' },
];

// Pre-built templates with real sizes
const TEMPLATES = [
  // Instagram
  { id: 'ig-story-property', category: 'instagram', name: 'Property Story', size: '1080x1920', aspect: '9:16' },
  { id: 'ig-post-listing', category: 'instagram', name: 'New Listing Post', size: '1080x1080', aspect: '1:1' },
  { id: 'ig-highlight-cover', category: 'instagram', name: 'Highlight Cover', size: '1080x1920', aspect: '9:16' },
  { id: 'ig-reel-cover', category: 'instagram', name: 'Reel Cover', size: '1080x1920', aspect: '9:16' },
  { id: 'ig-carousel', category: 'instagram', name: 'Carousel Post', size: '1080x1080', aspect: '1:1' },
  // LinkedIn
  { id: 'li-banner', category: 'linkedin', name: 'Profile Banner', size: '1584x396', aspect: '4:1' },
  { id: 'li-post', category: 'linkedin', name: 'Post Image', size: '1200x627', aspect: '1.91:1' },
  { id: 'li-company-cover', category: 'linkedin', name: 'Company Cover', size: '1128x191', aspect: '5.9:1' },
  // YouTube
  { id: 'yt-thumbnail', category: 'youtube', name: 'Video Thumbnail', size: '1280x720', aspect: '16:9' },
  { id: 'yt-banner', category: 'youtube', name: 'Channel Banner', size: '2560x1440', aspect: '16:9' },
  { id: 'yt-end-screen', category: 'youtube', name: 'End Screen', size: '1920x1080', aspect: '16:9' },
  // Facebook
  { id: 'fb-cover', category: 'facebook', name: 'Cover Photo', size: '820x312', aspect: '2.63:1' },
  { id: 'fb-post', category: 'facebook', name: 'Post Image', size: '1200x630', aspect: '1.91:1' },
  { id: 'fb-story', category: 'facebook', name: 'Story', size: '1080x1920', aspect: '9:16' },
  // WhatsApp
  { id: 'wa-status', category: 'whatsapp', name: 'Status Image', size: '1080x1920', aspect: '9:16' },
  { id: 'wa-profile', category: 'whatsapp', name: 'Profile Picture', size: '500x500', aspect: '1:1' },
  // Email Signatures
  { id: 'email-sig-1', category: 'email-signature', name: 'Professional', size: '600x200', aspect: '3:1' },
  { id: 'email-sig-2', category: 'email-signature', name: 'Modern', size: '600x200', aspect: '3:1' },
  { id: 'email-sig-3', category: 'email-signature', name: 'Minimal', size: '500x150', aspect: '3.3:1' },
  // Business Cards
  { id: 'bc-standard', category: 'business-card', name: 'Standard', size: '1050x600', aspect: '1.75:1' },
  { id: 'bc-premium', category: 'business-card', name: 'Premium Gold', size: '1050x600', aspect: '1.75:1' },
  { id: 'bc-vertical', category: 'business-card', name: 'Vertical', size: '600x1050', aspect: '0.57:1' },
  // Brochures
  { id: 'brochure-property', category: 'brochure', name: 'Property Brochure', size: '2480x3508', aspect: 'A4' },
  { id: 'flyer-event', category: 'brochure', name: 'Event Flyer', size: '2480x3508', aspect: 'A4' },
  { id: 'flyer-a5', category: 'brochure', name: 'A5 Flyer', size: '1748x2480', aspect: 'A5' },
  // Presentations
  { id: 'ppt-company', category: 'presentation', name: 'Company Profile', size: '1920x1080', aspect: '16:9' },
  { id: 'ppt-pitch', category: 'presentation', name: 'Pitch Deck', size: '1920x1080', aspect: '16:9' },
  { id: 'ppt-rate-card', category: 'presentation', name: 'Rate Card', size: '1920x1080', aspect: '16:9' },
  { id: 'ppt-portfolio', category: 'presentation', name: 'Portfolio', size: '1920x1080', aspect: '16:9' },
  // Logos
  { id: 'logo-main', category: 'logo', name: 'Main Logo', size: '1000x1000', aspect: '1:1' },
  { id: 'logo-horizontal', category: 'logo', name: 'Horizontal Logo', size: '2000x500', aspect: '4:1' },
  { id: 'logo-icon', category: 'logo', name: 'Icon/Favicon', size: '512x512', aspect: '1:1' },
  // Property Marketing
  { id: 'prop-listing', category: 'property', name: 'Property Listing', size: '1200x800', aspect: '3:2' },
  { id: 'prop-virtual-tour', category: 'property', name: 'Virtual Tour Promo', size: '1080x1080', aspect: '1:1' },
  { id: 'prop-comparison', category: 'property', name: 'Comparison Chart', size: '1920x1080', aspect: '16:9' },
  // Events
  { id: 'event-invite', category: 'events', name: 'Event Invitation', size: '1080x1080', aspect: '1:1' },
  { id: 'event-banner', category: 'events', name: 'Event Banner', size: '1920x600', aspect: '3.2:1' },
  { id: 'holiday-greeting', category: 'events', name: 'Holiday Greeting', size: '1080x1080', aspect: '1:1' },
];

// JBJ Brand Colors
const BRAND_COLORS = [
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Dark Gray', hex: '#1A1A1A' },
  { name: 'Champagne', hex: '#F5F0E6' },
];

interface ConnectedAccount {
  id: string;
  platform: string;
  username: string;
  connected: boolean;
}

const JBJDesignStudio: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('instagram');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Email signature form
  const [signatureData, setSignatureData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    website: 'www.JBJ.ae',
    photoUrl: '',
  });

  // Connected social accounts (mock for now - would need OAuth integration)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    { id: '1', platform: 'instagram', username: '', connected: false },
    { id: '2', platform: 'linkedin', username: '', connected: false },
    { id: '3', platform: 'facebook', username: '', connected: false },
    { id: '4', platform: 'youtube', username: '', connected: false },
    { id: '5', platform: 'twitter', username: '', connected: false },
  ]);

  // Zapier webhook for social publishing
  const [zapierWebhook, setZapierWebhook] = useState('');

  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setGeneratedImage(null);
    trackUsage('template_selected', { template: template.name });
  };

  const trackUsage = async (action: string, metadata?: Record<string, any>) => {
    try {
      await supabase.from('jbj_analytics').insert({
        user_id: user?.id || null,
        tool_name: 'JBJ Design Studio',
        action_type: action,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        toast.success('Reference image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDesign = async (prompt: string) => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    setIsGenerating(true);
    setChatHistory(prev => [...prev, { role: 'user', content: prompt }]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-design', {
        body: {
          prompt,
          templateType: selectedTemplate.name,
          size: selectedTemplate.size,
          referenceImage: uploadedImage || undefined,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: `I've created your ${selectedTemplate.name} design! ${data.message || 'The design is ready for download or sharing.'}` 
        }]);
        toast.success('Design generated successfully!');
        trackUsage('design_generated', { template: selectedTemplate.name, prompt });
      } else {
        throw new Error('No image generated');
      }

    } catch (error: any) {
      console.error('Generation error:', error);
      const errorMessage = error.message || 'Failed to generate design';
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` }]);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditDesign = async (editPrompt: string) => {
    if (!generatedImage) {
      toast.error('Please generate a design first');
      return;
    }

    setIsGenerating(true);
    setChatHistory(prev => [...prev, { role: 'user', content: editPrompt }]);

    try {
      const { data, error } = await supabase.functions.invoke('edit-design', {
        body: {
          prompt: editPrompt,
          imageUrl: generatedImage,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: `I've updated the design as requested! ${data.message || ''}` 
        }]);
        toast.success('Design updated!');
        trackUsage('design_edited', { prompt: editPrompt });
      }

    } catch (error: any) {
      console.error('Edit error:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't make that edit. ${error.message}` }]);
      toast.error(error.message || 'Failed to edit design');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    const message = chatMessage.trim();
    setChatMessage('');

    if (generatedImage) {
      handleEditDesign(message);
    } else {
      handleGenerateDesign(message);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // For now, show a message that voice is recorded
        // In production, this would be sent to a speech-to-text service
        toast.info('Voice note recorded. Processing...');
        setChatMessage(prev => prev + ' [Voice note attached]');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info('Recording... Click again to stop');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `jbj-design-${selectedTemplate?.name || 'custom'}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Design downloaded!');
    trackUsage('design_downloaded', { template: selectedTemplate?.name });
  };

  const handleShareToSocial = async () => {
    if (!generatedImage) {
      toast.error('Please generate a design first');
      return;
    }

    if (!zapierWebhook) {
      toast.info('Connect your Zapier webhook to enable social sharing');
      return;
    }

    try {
      await fetch(zapierWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          imageUrl: generatedImage,
          template: selectedTemplate?.name,
          timestamp: new Date().toISOString(),
          platform: selectedCategory,
        }),
      });

      toast.success('Design sent to social publishing workflow!');
      trackUsage('social_share_triggered', { platform: selectedCategory });
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share. Check your webhook URL.');
    }
  };

  const handleGenerateSignature = async () => {
    if (!signatureData.name || !signatureData.email) {
      toast.error('Please fill in at least name and email');
      return;
    }

    setIsGenerating(true);

    try {
      const signatureHtml = `
        <table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; color: #1A1A1A;">
          <tr>
            <td style="padding-right: 15px; border-right: 2px solid #D4AF37;">
              ${signatureData.photoUrl ? `<img src="${signatureData.photoUrl}" alt="${signatureData.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; object-position: center 15%;">` : '<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #D4AF37, #B8960C); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">' + signatureData.name.charAt(0) + '</div>'}
            </td>
            <td style="padding-left: 15px;">
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #000;">${signatureData.name}</p>
              <p style="margin: 2px 0 8px; font-size: 12px; color: #D4AF37;">${signatureData.title || 'Real Estate Consultant'}</p>
              <p style="margin: 0; font-size: 12px;"><strong>JBJ Global Real Estate</strong></p>
              <p style="margin: 4px 0; font-size: 11px;">
                ✉️ <a href="mailto:${signatureData.email}" style="color: #1A1A1A; text-decoration: none;">${signatureData.email}</a>
              </p>
              ${signatureData.phone ? `<p style="margin: 4px 0; font-size: 11px;">📞 <a href="tel:${signatureData.phone}" style="color: #1A1A1A; text-decoration: none;">${signatureData.phone}</a></p>` : ''}
              <p style="margin: 4px 0; font-size: 11px;">
                🌐 <a href="https://${signatureData.website}" style="color: #D4AF37; text-decoration: none;">${signatureData.website}</a>
              </p>
            </td>
          </tr>
        </table>
      `;

      await navigator.clipboard.writeText(signatureHtml);
      toast.success('Email signature HTML copied to clipboard! Share with IT for implementation.');
      trackUsage('signature_generated', { name: signatureData.name });

    } catch (error) {
      toast.error('Failed to generate signature');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTemplates = TEMPLATES.filter(t => t.category === selectedCategory);
  const currentCategory = TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  JBJ AI Graphic Designer
                </h1>
                <p className="text-zinc-400 text-sm">Create professional designs with AI assistance</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect Accounts
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Social Media Integration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-zinc-400 text-sm">
                      Connect your Zapier webhook to automatically publish designs to social media.
                    </p>
                    <div>
                      <Label className="text-zinc-400 text-sm">Zapier Webhook URL</Label>
                      <Input
                        value={zapierWebhook}
                        onChange={(e) => setZapierWebhook(e.target.value)}
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <p className="text-zinc-500 text-xs">
                      Create a Zap with a webhook trigger to connect to Instagram, Facebook, LinkedIn, etc.
                    </p>
                    <Button 
                      onClick={() => toast.success('Webhook saved!')}
                      className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600"
                      disabled={!zapierWebhook}
                    >
                      Save Connection
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <ReportProblemButton toolName="JBJ Design Studio" />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Category Tabs */}
        <div className="mb-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-4">
              {TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedTemplate(null);
                    setGeneratedImage(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === cat.id 
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-lg` 
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Templates */}
          <div className="lg:col-span-3">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-gold" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCategory === 'email-signature' ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-zinc-400 text-sm">Full Name *</Label>
                      <Input
                        value={signatureData.name}
                        onChange={(e) => setSignatureData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Jane Abou Jaoude"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-sm">Title</Label>
                      <Input
                        value={signatureData.title}
                        onChange={(e) => setSignatureData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Senior Consultant"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-sm">Email *</Label>
                      <Input
                        value={signatureData.email}
                        onChange={(e) => setSignatureData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="name@JBJ.ae"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-sm">Phone</Label>
                      <Input
                        value={signatureData.phone}
                        onChange={(e) => setSignatureData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+971 56 591 1000"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleGenerateSignature}
                      disabled={isGenerating || !signatureData.name || !signatureData.email}
                      className="w-full bg-gradient-to-r from-gold to-gold-dark text-black font-semibold"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Generate & Copy to Clipboard
                    </Button>
                    <p className="text-zinc-500 text-xs text-center">
                      HTML will be copied. Share with IT for email implementation.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-2">
                    <div className="grid grid-cols-2 gap-2">
                      {filteredTemplates.map(template => (
                        <motion.button
                          key={template.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSelectTemplate(template)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                            selectedTemplate?.id === template.id 
                              ? 'border-gold bg-gold/10' 
                              : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'
                          }`}
                        >
                          <div className={`aspect-[${template.aspect.replace(':', '/')}] bg-zinc-700 rounded mb-2 flex items-center justify-center min-h-[60px]`}>
                            <Layers className="w-6 h-6 text-zinc-500" />
                          </div>
                          <p className="text-white text-xs font-medium truncate">{template.name}</p>
                          <p className="text-zinc-500 text-[10px]">{template.size}</p>
                        </motion.button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Brand Colors */}
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <h4 className="text-zinc-400 text-xs font-medium mb-2">Brand Colors</h4>
                  <div className="flex gap-2">
                    {BRAND_COLORS.map(color => (
                      <button
                        key={color.name}
                        className="w-7 h-7 rounded-full border-2 border-zinc-700 hover:border-gold transition-colors shadow-sm"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        onClick={() => toast.info(`${color.name}: ${color.hex}`)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Canvas / Preview */}
          <div className="lg:col-span-6">
            <Card className="bg-zinc-900 border-zinc-800 h-full">
              <CardContent className="p-4 h-full flex flex-col">
                {/* Canvas Area */}
                <div className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center min-h-[400px] relative overflow-hidden">
                  {generatedImage ? (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={generatedImage}
                      alt="Generated design"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : selectedTemplate ? (
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                        <Wand2 className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">{selectedTemplate.name}</h3>
                      <p className="text-zinc-500 text-sm mb-4">Size: {selectedTemplate.size}</p>
                      <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                        Describe what you want to create in the chat below, or upload a reference image.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
                        <ImagePlus className="w-10 h-10 text-zinc-600" />
                      </div>
                      <h3 className="text-zinc-400 font-medium mb-2">Select a Template</h3>
                      <p className="text-zinc-500 text-sm">Choose a template from the left panel to get started</p>
                    </div>
                  )}

                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/80 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
                        <p className="text-white font-medium">AI is creating your design...</p>
                        <p className="text-zinc-400 text-sm">This may take a few seconds</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Action Buttons */}
                {generatedImage && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={handleDownload}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      onClick={handleShareToSocial}
                      variant="outline"
                      className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share to Social
                    </Button>
                    <Button 
                      onClick={() => {
                        setGeneratedImage(null);
                        setChatHistory([]);
                      }}
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Chat & Upload */}
          <div className="lg:col-span-3">
            <Card className="bg-zinc-900 border-zinc-800 h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gold" />
                  Design Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Upload Reference */}
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-zinc-700 rounded-xl hover:border-gold/50 transition-colors group"
                  >
                    {uploadedImage ? (
                      <div className="relative">
                        <img src={uploadedImage} alt="Reference" className="w-full h-24 object-cover rounded-lg" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2 group-hover:text-gold transition-colors" />
                        <p className="text-zinc-400 text-sm">Upload reference image</p>
                        <p className="text-zinc-500 text-xs">or template you want to recreate</p>
                      </div>
                    )}
                  </button>
                </div>

                {/* Chat History */}
                <ScrollArea className="flex-1 mb-4 pr-2">
                  <div className="space-y-3">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Sparkles className="w-8 h-8 text-gold/50 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">
                          Tell me what you want to create!
                        </p>
                        <p className="text-zinc-600 text-xs mt-1">
                          E.g., "Create a New Year post with JBJ logo"
                        </p>
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-xl text-sm ${
                            msg.role === 'user' 
                              ? 'bg-gold/20 text-gold ml-4' 
                              : 'bg-zinc-800 text-zinc-300 mr-4'
                          }`}
                        >
                          {msg.content}
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <button
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={`p-3 rounded-xl transition-colors ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Describe your design..."
                    className="bg-zinc-800 border-zinc-700 text-white flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || isGenerating || (!selectedTemplate && selectedCategory !== 'email-signature')}
                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>

                {/* Quick Prompts */}
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-zinc-500 text-xs mb-2">Quick prompts:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'New Listing',
                      'Happy New Year',
                      'Property Sold',
                      'Open House',
                      'Market Update'
                    ].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => setChatMessage(`Create a ${prompt} post for JBJ Global Real Estate`)}
                        className="px-2.5 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JBJDesignStudio;
