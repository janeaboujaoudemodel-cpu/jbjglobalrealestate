import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Download, 
  Share2, 
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
  Send,
  Upload,
  X,
  Loader2,
  Wand2,
  LayoutTemplate,
  ImagePlus,
  Video,
  Newspaper,
  Building2,
  Megaphone,
  Crown,
  FolderOpen,
  RefreshCw,
  ChevronRight,
  GraduationCap,
  Phone,
  Facebook,
  Book,
  FileUp,
  Globe,
  Settings,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import ReportProblemButton from '@/components/jbj-assistant/ReportProblemButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Import new design studio components
import { ColorPaletteManager, DesignProjectManager, AIDesignAssistant } from '@/components/design-studio';

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
  { id: 'video', label: 'Video Thumbnails', icon: Video, color: 'from-cyan-500 to-cyan-700' },
  { id: 'print', label: 'Print Materials', icon: Newspaper, color: 'from-slate-500 to-slate-700' },
  { id: 'portfolio', label: 'Portfolios', icon: GraduationCap, color: 'from-violet-500 to-violet-700' },
  { id: 'books', label: 'Books & Reports', icon: Book, color: 'from-amber-600 to-amber-800' },
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
  // Video Thumbnails
  { id: 'video-property-tour', category: 'video', name: 'Property Tour Thumb', size: '1280x720', aspect: '16:9' },
  { id: 'video-market-update', category: 'video', name: 'Market Update', size: '1280x720', aspect: '16:9' },
  { id: 'video-shorts', category: 'video', name: 'Shorts/Reels', size: '1080x1920', aspect: '9:16' },
  // Print Materials
  { id: 'print-poster-a3', category: 'print', name: 'A3 Poster', size: '3508x4961', aspect: 'A3' },
  { id: 'print-banner-large', category: 'print', name: 'Roll-up Banner', size: '2000x5000', aspect: '1:2.5' },
  { id: 'print-magazine-ad', category: 'print', name: 'Magazine Ad', size: '2480x3508', aspect: 'A4' },
  // Portfolios
  { id: 'portfolio-broker', category: 'portfolio', name: 'Broker Portfolio', size: '1920x1080', aspect: '16:9' },
  { id: 'portfolio-modeling', category: 'portfolio', name: 'Modeling Book', size: '1080x1350', aspect: '4:5' },
  { id: 'portfolio-rate-card', category: 'portfolio', name: 'Rate Card', size: '1920x1080', aspect: '16:9' },
  // Books & Reports
  { id: 'book-market-report', category: 'books', name: 'Market Report', size: '2480x3508', aspect: 'A4' },
  { id: 'book-investor-guide', category: 'books', name: 'Investor Guide', size: '2480x3508', aspect: 'A4' },
  { id: 'book-company-profile', category: 'books', name: 'Company Profile Book', size: '2480x3508', aspect: 'A4' },
  { id: 'book-area-guide', category: 'books', name: 'Area Guide', size: '2480x3508', aspect: 'A4' },
  // Documents (CV, Cover Letter, LinkedIn)
  { id: 'cv-professional', category: 'brochure', name: 'Professional CV', size: '2480x3508', aspect: 'A4' },
  { id: 'cv-modern', category: 'brochure', name: 'Modern Resume', size: '2480x3508', aspect: 'A4' },
  { id: 'cv-creative', category: 'brochure', name: 'Creative Resume', size: '2480x3508', aspect: 'A4' },
  { id: 'cover-letter-standard', category: 'brochure', name: 'Cover Letter', size: '2480x3508', aspect: 'A4' },
  { id: 'cover-letter-modern', category: 'brochure', name: 'Modern Cover Letter', size: '2480x3508', aspect: 'A4' },
  { id: 'li-cover-personal', category: 'linkedin', name: 'Personal Cover Photo', size: '1584x396', aspect: '4:1' },
];

interface SelectedPalette {
  id: string;
  name: string;
  colors: { hex: string; name: string }[];
}

const JBJDesignStudio: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [selectedCategory, setSelectedCategory] = useState('instagram');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<SelectedPalette | null>(null);
  const [showUploadToWebsite, setShowUploadToWebsite] = useState(false);
  const [websiteUploadPrompt, setWebsiteUploadPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Email signature form
  const [signatureData, setSignatureData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    website: 'www.JBJ.ae',
    photoUrl: '',
  });

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
                <a href="mailto:${signatureData.email}" style="color: #1A1A1A; text-decoration: none;">${signatureData.email}</a>
              </p>
              ${signatureData.phone ? `<p style="margin: 4px 0; font-size: 11px;"><a href="tel:${signatureData.phone}" style="color: #1A1A1A; text-decoration: none;">${signatureData.phone}</a></p>` : ''}
              <p style="margin: 4px 0; font-size: 11px;">
                <a href="https://${signatureData.website}" style="color: #D4AF37; text-decoration: none;">${signatureData.website}</a>
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

  const handleUploadToWebsite = async () => {
    if (!generatedImage || !websiteUploadPrompt.trim()) {
      toast.error('Please generate a design and describe where to place it');
      return;
    }

    try {
      // Save the request to database for admin/developer review
      const { error } = await supabase.from('design_website_requests').insert({
        user_id: user?.id as string,
        design_url: generatedImage,
        request_type: 'upload_design',
        ai_instructions: websiteUploadPrompt,
        target_page: 'homepage',
        target_section: websiteUploadPrompt,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Website upload request submitted! Your assistant will process this shortly.');
      setShowUploadToWebsite(false);
      setWebsiteUploadPrompt('');
      trackUsage('website_upload_requested', { instructions: websiteUploadPrompt });
    } catch (error) {
      console.error('Upload request error:', error);
      toast.error('Failed to submit upload request');
    }
  };

  const handlePaletteGenerated = (colors: { hex: string; name: string }[]) => {
    setSelectedPalette({
      id: 'ai-generated',
      name: 'AI Generated Palette',
      colors
    });
  };

  const filteredTemplates = TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 lg:top-[48px] z-50">
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
            
            <div className="flex items-center gap-3">
              <ReportProblemButton toolName="JBJ Design Studio" />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
            <TabsTrigger value="create" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
              <Wand2 className="w-4 h-4 mr-2" />
              Create Design
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
              <FolderOpen className="w-4 h-4 mr-2" />
              My Projects
            </TabsTrigger>
            <TabsTrigger value="palettes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
              <Palette className="w-4 h-4 mr-2" />
              Color Palettes
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
              <Users className="w-4 h-4 mr-2" />
              Design Team
            </TabsTrigger>
          </TabsList>

          {/* CREATE TAB */}
          <TabsContent value="create" className="space-y-6">
            {/* Category Tabs */}
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
                            placeholder="Jane Bou Jaoude"
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
                              <div className="aspect-video bg-zinc-700 rounded mb-2 flex items-center justify-center min-h-[60px]">
                                <Layers className="w-6 h-6 text-zinc-500" />
                              </div>
                              <p className="text-white text-xs font-medium truncate">{template.name}</p>
                              <p className="text-zinc-500 text-[10px]">{template.size}</p>
                            </motion.button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {/* Selected Palette Display */}
                    {selectedPalette && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-zinc-400 text-xs font-medium">Active Palette</h4>
                          <button 
                            onClick={() => setSelectedPalette(null)}
                            className="text-zinc-500 hover:text-zinc-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-white text-sm mb-2">{selectedPalette.name}</p>
                        <div className="flex gap-1">
                          {selectedPalette.colors.map((color, idx) => (
                            <div
                              key={idx}
                              className="flex-1 h-6 rounded"
                              style={{ backgroundColor: color.hex }}
                              title={`${color.name}: ${color.hex}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Center - Canvas / Preview */}
              <div className="lg:col-span-5">
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
                            Describe what you want to create in the AI Assistant panel.
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
                        <Dialog open={showUploadToWebsite} onOpenChange={setShowUploadToWebsite}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline"
                              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Upload to Website
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-900 border-zinc-800">
                            <DialogHeader>
                              <DialogTitle className="text-white">Upload to Website</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <p className="text-zinc-400 text-sm">
                                Describe where you want this design to appear on the website. Your assistant will process the request.
                              </p>
                              <textarea
                                value={websiteUploadPrompt}
                                onChange={(e) => setWebsiteUploadPrompt(e.target.value)}
                                placeholder="e.g., Replace the book in the 'Download Free Market Report' section on the homepage with this new design. Make it 3D style."
                                className="w-full h-32 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 resize-none"
                              />
                              <Button
                                onClick={handleUploadToWebsite}
                                disabled={!websiteUploadPrompt.trim()}
                                className="w-full bg-gradient-to-r from-gold to-gold-dark text-black font-semibold"
                              >
                                <FileUp className="w-4 h-4 mr-2" />
                                Submit Request
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          onClick={() => {
                            setGeneratedImage(null);
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

              {/* Right Panel - AI Assistant */}
              <div className="lg:col-span-4">
                <Card className="bg-zinc-900 border-zinc-800 h-[600px]">
                  <AIDesignAssistant
                    selectedTemplate={selectedTemplate ? {
                      name: selectedTemplate.name,
                      size: selectedTemplate.size,
                      category: selectedTemplate.category
                    } : null}
                    uploadedImage={uploadedImage}
                    onImageUploaded={setUploadedImage}
                    onImageGenerated={setGeneratedImage}
                    onPaletteGenerated={handlePaletteGenerated}
                    isGenerating={isGenerating}
                    setIsGenerating={setIsGenerating}
                    projectContext={selectedPalette ? {
                      name: 'Current Project',
                      description: '',
                      palette: selectedPalette.colors
                    } : undefined}
                  />
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* PROJECTS TAB */}
          <TabsContent value="projects">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <DesignProjectManager
                  onSelectProject={(project) => {
                    toast.info(`Loading project: ${project.name}`);
                    // Load project data into the editor
                    if (project.final_design_url) {
                      setGeneratedImage(project.final_design_url);
                    }
                    setActiveTab('create');
                  }}
                  onCreateNew={() => {
                    setActiveTab('create');
                    setGeneratedImage(null);
                    setSelectedTemplate(null);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* PALETTES TAB */}
          <TabsContent value="palettes">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <ColorPaletteManager
                  onSelectPalette={(palette) => {
                    setSelectedPalette({
                      id: palette.id,
                      name: palette.name,
                      colors: palette.colors
                    });
                    toast.success(`Selected palette: ${palette.name}`);
                  }}
                  selectedPaletteId={selectedPalette?.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEAM TAB */}
          <TabsContent value="team">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Design Team</h3>
                  <p className="text-zinc-400 max-w-md mx-auto mb-6">
                    Meet your AI design team members who work together to create stunning visuals for JBJ Global Real Estate.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    {/* AI Designer Persona */}
                    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-white font-medium">Maya Chen</h4>
                      <p className="text-gold text-sm">Lead AI Designer</p>
                      <p className="text-zinc-500 text-xs mt-2">Specializes in luxury real estate marketing and premium brand aesthetics</p>
                    </div>

                    {/* Brand Manager Persona */}
                    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-3">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-white font-medium">Victoria Reynolds</h4>
                      <p className="text-gold text-sm">Brand Director</p>
                      <p className="text-zinc-500 text-xs mt-2">Ensures all designs align with JBJ's premium brand standards</p>
                    </div>

                    {/* Content Designer Persona */}
                    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-3">
                        <Book className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-white font-medium">James Porter</h4>
                      <p className="text-gold text-sm">Content Designer</p>
                      <p className="text-zinc-500 text-xs mt-2">Creates books, reports, and long-form visual content</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default JBJDesignStudio;
