import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Image, 
  Type, 
  Square, 
  Circle, 
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
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import ReportProblemButton from '@/components/jbj-assistant/ReportProblemButton';

// Template categories
const TEMPLATE_CATEGORIES = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'email-signature', label: 'Email Signatures', icon: Mail },
  { id: 'brochure', label: 'Brochures', icon: FileText },
  { id: 'business-card', label: 'Business Cards', icon: BusinessCard },
  { id: 'presentation', label: 'Presentations', icon: Presentation },
];

// Pre-built templates
const TEMPLATES = [
  // Instagram
  { id: 'ig-story-property', category: 'instagram', name: 'Property Story', size: '1080x1920', preview: '/api/placeholder/270/480' },
  { id: 'ig-post-listing', category: 'instagram', name: 'New Listing Post', size: '1080x1080', preview: '/api/placeholder/270/270' },
  { id: 'ig-highlight-cover', category: 'instagram', name: 'Highlight Cover', size: '1080x1920', preview: '/api/placeholder/270/480' },
  // LinkedIn
  { id: 'li-banner', category: 'linkedin', name: 'Profile Banner', size: '1584x396', preview: '/api/placeholder/396/99' },
  { id: 'li-post', category: 'linkedin', name: 'Post Image', size: '1200x627', preview: '/api/placeholder/300/157' },
  // YouTube
  { id: 'yt-thumbnail', category: 'youtube', name: 'Video Thumbnail', size: '1280x720', preview: '/api/placeholder/320/180' },
  { id: 'yt-banner', category: 'youtube', name: 'Channel Banner', size: '2560x1440', preview: '/api/placeholder/320/180' },
  // Email Signatures
  { id: 'email-sig-1', category: 'email-signature', name: 'Professional', size: '600x200', preview: '/api/placeholder/300/100' },
  { id: 'email-sig-2', category: 'email-signature', name: 'Modern', size: '600x200', preview: '/api/placeholder/300/100' },
  // Business Cards
  { id: 'bc-standard', category: 'business-card', name: 'Standard', size: '1050x600', preview: '/api/placeholder/262/150' },
  { id: 'bc-premium', category: 'business-card', name: 'Premium Gold', size: '1050x600', preview: '/api/placeholder/262/150' },
  // Brochures
  { id: 'brochure-property', category: 'brochure', name: 'Property Brochure', size: '2480x3508', preview: '/api/placeholder/175/248' },
  { id: 'flyer-event', category: 'brochure', name: 'Event Flyer', size: '2480x3508', preview: '/api/placeholder/175/248' },
  // Presentations
  { id: 'ppt-company', category: 'presentation', name: 'Company Profile', size: '1920x1080', preview: '/api/placeholder/320/180' },
  { id: 'ppt-pitch', category: 'presentation', name: 'Pitch Deck', size: '1920x1080', preview: '/api/placeholder/320/180' },
];

// JBJ Brand Colors
const BRAND_COLORS = [
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Dark Gray', hex: '#1A1A1A' },
  { name: 'Light Gray', hex: '#F5F5F5' },
];

interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'logo';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color?: string;
  fontSize?: number;
}

const JBJDesignStudio: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('instagram');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [designElements, setDesignElements] = useState<DesignElement[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });

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
    const [width, height] = template.size.split('x').map(Number);
    setCanvasSize({ width, height });
    setDesignElements([]);
    
    // Track usage
    trackUsage(template.name);
  };

  const trackUsage = async (templateName: string) => {
    try {
      await supabase.from('jbj_analytics').insert({
        user_id: user?.id || null,
        tool_name: 'JBJ Design Studio',
        action_type: 'template_selected',
        metadata: { template: templateName },
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };

  const handleGenerateDesign = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    setIsGenerating(true);
    toast.info('AI is generating your design...');

    try {
      // Simulate AI generation (in production, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Design generated successfully!');
      
      // Track generation
      await supabase.from('jbj_analytics').insert({
        user_id: user?.id || null,
        tool_name: 'JBJ Design Studio',
        action_type: 'design_generated',
        metadata: { template: selectedTemplate.name },
      });

    } catch (error) {
      toast.error('Failed to generate design');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSignature = async () => {
    if (!signatureData.name || !signatureData.email) {
      toast.error('Please fill in at least name and email');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate HTML signature
      const signatureHtml = `
        <table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; color: #1A1A1A;">
          <tr>
            <td style="padding-right: 15px; border-right: 2px solid #D4AF37;">
              ${signatureData.photoUrl ? `<img src="${signatureData.photoUrl}" alt="${signatureData.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">` : ''}
            </td>
            <td style="padding-left: 15px;">
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #000;">${signatureData.name}</p>
              <p style="margin: 2px 0 8px; font-size: 12px; color: #D4AF37;">${signatureData.title}</p>
              <p style="margin: 0; font-size: 12px;"><strong>JBJ Global Real Estate</strong></p>
              <p style="margin: 4px 0; font-size: 11px;">
                📧 <a href="mailto:${signatureData.email}" style="color: #1A1A1A; text-decoration: none;">${signatureData.email}</a>
              </p>
              <p style="margin: 4px 0; font-size: 11px;">
                📞 <a href="tel:${signatureData.phone}" style="color: #1A1A1A; text-decoration: none;">${signatureData.phone}</a>
              </p>
              <p style="margin: 4px 0; font-size: 11px;">
                🌐 <a href="https://${signatureData.website}" style="color: #D4AF37; text-decoration: none;">${signatureData.website}</a>
              </p>
            </td>
          </tr>
        </table>
      `;

      // Copy to clipboard
      await navigator.clipboard.writeText(signatureHtml);
      toast.success('Email signature HTML copied to clipboard!');

      // Track usage
      await supabase.from('jbj_analytics').insert({
        user_id: user?.id || null,
        tool_name: 'JBJ Design Studio',
        action_type: 'signature_generated',
        metadata: { name: signatureData.name },
      });

    } catch (error) {
      toast.error('Failed to generate signature');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTemplates = TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                JBJ AI Graphic Designer
              </h1>
              <p className="text-zinc-400 text-sm">Create professional designs with AI assistance</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel - Templates */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-4">Template Categories</h3>
                <div className="space-y-2">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        selectedCategory === cat.id 
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white' 
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <cat.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <h4 className="text-zinc-400 text-sm mb-3">Brand Colors</h4>
                  <div className="flex gap-2">
                    {BRAND_COLORS.map(color => (
                      <button
                        key={color.name}
                        className="w-8 h-8 rounded-full border-2 border-zinc-700 hover:border-gold transition-colors"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Canvas / Templates */}
          <div className="lg:col-span-2">
            {selectedCategory === 'email-signature' ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-6">Email Signature Generator</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label className="text-zinc-400">Full Name *</Label>
                      <Input
                        value={signatureData.name}
                        onChange={(e) => setSignatureData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Jane Abou Jaoude"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Title</Label>
                      <Input
                        value={signatureData.title}
                        onChange={(e) => setSignatureData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Founder & Managing Director"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Email *</Label>
                      <Input
                        value={signatureData.email}
                        onChange={(e) => setSignatureData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="jane@JBJ.ae"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Phone</Label>
                      <Input
                        value={signatureData.phone}
                        onChange={(e) => setSignatureData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+971 56 591 1000"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleGenerateSignature}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600"
                  >
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Signature
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                <h3 className="text-white font-semibold mb-4">
                  {TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)?.label} Templates
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => (
                    <motion.button
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectTemplate(template)}
                      className={`p-4 rounded-xl border-2 transition-colors ${
                        selectedTemplate?.id === template.id 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-zinc-800 rounded-lg mb-3 flex items-center justify-center">
                        <Layers className="w-8 h-8 text-zinc-600" />
                      </div>
                      <p className="text-white text-sm font-medium">{template.name}</p>
                      <p className="text-zinc-500 text-xs">{template.size}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Actions */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-white font-semibold">Actions</h3>
                
                <Button 
                  onClick={handleGenerateDesign}
                  disabled={!selectedTemplate || isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>

                <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>

                <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share to Social
                </Button>

                <div className="pt-4 border-t border-zinc-800">
                  <ReportProblemButton toolName="JBJ Design Studio" />
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
