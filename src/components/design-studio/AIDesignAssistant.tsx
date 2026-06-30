import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Upload, 
  X, 
  Loader2,
  Wand2,
  Image,
  Palette,
  Type,
  Layout,
  RefreshCw,
  Copy,
  MessageSquare,
  Bot,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

interface AIDesignAssistantProps {
  selectedTemplate: { name: string; size: string; category: string } | null;
  uploadedImage: string | null;
  onImageUploaded: (imageUrl: string) => void;
  onImageGenerated: (imageUrl: string) => void;
  onPaletteGenerated?: (colors: { hex: string; name: string }[]) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  projectContext?: {
    name: string;
    description: string;
    palette?: { hex: string; name: string }[];
  };
}

// Quick prompt suggestions
const QUICK_PROMPTS = [
  { label: 'Generate color palette', icon: Palette, prompt: 'Generate a professional color palette for this project' },
  { label: 'Create layout', icon: Layout, prompt: 'Create a balanced, professional layout for this design' },
  { label: 'Add luxury elements', icon: Sparkles, prompt: 'Add luxurious gold accents and premium styling' },
  { label: 'Property showcase', icon: Image, prompt: 'Design a stunning property showcase with modern aesthetics' },
];

export const AIDesignAssistant: React.FC<AIDesignAssistantProps> = ({
  selectedTemplate,
  uploadedImage,
  onImageUploaded,
  onImageGenerated,
  onPaletteGenerated,
  isGenerating,
  setIsGenerating,
  projectContext
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `👋 Hi! I'm your AI Design Assistant. I can help you create stunning designs, generate color palettes, and build professional marketing materials.\n\n${selectedTemplate ? `You've selected: **${selectedTemplate.name}** (${selectedTemplate.size})\n\n` : ''}Tell me what you'd like to create, or upload a reference image to get started!`,
        timestamp: new Date()
      }]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !uploadedImage) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      imageUrl: uploadedImage || undefined,
      timestamp: new Date()
    }]);

    setIsGenerating(true);

    try {
      // Check if this is a palette generation request
      const isPaletteRequest = userMessage.toLowerCase().includes('palette') || 
                               userMessage.toLowerCase().includes('color');

      if (isPaletteRequest && !userMessage.toLowerCase().includes('design')) {
        // Generate color palette with AI
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            messages: [
              {
                role: 'system',
                content: `You are a professional color palette designer for luxury real estate marketing. 
                Generate color palettes that are sophisticated, elegant, and work well for JBJ Global Real Estate branding.
                Always respond with a JSON array of colors with hex codes and names.
                Format: [{"hex": "#D4AF37", "name": "Gold"}, ...]
                Include 5-6 colors that work harmoniously together.`
              },
              {
                role: 'user',
                content: userMessage
              }
            ]
          }
        });

        if (error) throw error;

        // Try to parse colors from response
        const responseContent = data?.content || data?.message || '';
        const jsonMatch = responseContent.match(/\[[\s\S]*?\]/);
        
        if (jsonMatch) {
          try {
            const colors = JSON.parse(jsonMatch[0]);
            onPaletteGenerated?.(colors);
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `🎨 I've generated a color palette for you!\n\n${colors.map((c: any) => `• **${c.name}**: ${c.hex}`).join('\n')}\n\nWould you like me to create a design using this palette?`,
              timestamp: new Date()
            }]);
          } catch {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: responseContent,
              timestamp: new Date()
            }]);
          }
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
          }]);
        }
      } else {
        // Generate design
        if (!selectedTemplate) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '⚠️ Please select a template first before I can generate a design. Choose from the templates panel on the left.',
            timestamp: new Date()
          }]);
          return;
        }

        const { data, error } = await supabase.functions.invoke('generate-design', {
          body: {
            prompt: userMessage,
            templateType: selectedTemplate.name,
            size: selectedTemplate.size,
            referenceImage: uploadedImage || undefined,
            paletteColors: projectContext?.palette?.map(c => c.hex),
          }
        });

        if (error) throw error;

        if (data?.imageUrl) {
          onImageGenerated(data.imageUrl);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✨ Your design is ready! ${data.message || 'I\'ve created the design based on your requirements.'}\n\nWant me to make any changes? Just describe what you'd like to modify.`,
            imageUrl: data.imageUrl,
            timestamp: new Date()
          }]);
        } else {
          throw new Error('No image generated');
        }
      }
    } catch (error: any) {
      console.error('AI error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error.message || 'Please try again.'}`,
        timestamp: new Date()
      }]);
      toast.error(error.message || 'Failed to process request');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        onImageUploaded(imageUrl);
        toast.success('Reference image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle voice transcript from VoiceInputButton
  const handleVoiceTranscript = (text: string) => {
    setInputMessage(prev => prev ? `${prev} ${text}` : text);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-[#1A1A1A]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold">AI Design Assistant</h3>
          <p className="text-white/90 text-xs">Powered by Lovable AI</p>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="p-3 border-b border-[#1A1A1A]">
        <p className="text-white/90 text-xs mb-2">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleQuickPrompt(prompt.prompt)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#1A1A1A]/80 hover:bg-[#EFE6D6]/20 text-white hover:text-[#1A1A1A] border border-[#1A1A1A] hover:border-[#B89555]/50 transition-all"
            >
              <prompt.icon className="w-3 h-3" />
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-[#EFE6D6]' 
                    : 'bg-gradient-to-br from-purple-500 to-fuchsia-500'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-[#1A1A1A]" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#EFE6D6] text-[#1A1A1A] rounded-tr-none'
                      : 'bg-[#1A1A1A] text-white rounded-tl-none'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.imageUrl && (
                      <img 
                        src={message.imageUrl} 
                        alt="Generated design"
                        className="mt-2 rounded-lg max-w-full"
                       loading="lazy" decoding="async" />
                    )}
                  </div>
                  <p className="text-[#1A1A1A]/70 text-[10px] mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-[#1A1A1A] rounded-2xl rounded-tl-none p-3">
                <p className="text-white/70 text-sm">Creating your design...</p>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Uploaded Image Preview */}
      {uploadedImage && (
        <div className="px-4 py-2 border-t border-[#1A1A1A]">
          <div className="relative inline-block">
            <img src={uploadedImage} alt="Reference" className="h-16 rounded-lg"  loading="lazy" decoding="async" />
            <button
              onClick={() => onImageUploaded('')}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-[#1A1A1A]">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="text-white/70 hover:text-white hover:bg-[#1A1A1A]"
          >
            <Upload className="w-5 h-5" />
          </Button>
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            disabled={isGenerating}
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-[#1A1A1A]"
          />
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Describe your design or ask for changes..."
            className="flex-1 bg-[#1A1A1A] border-[#1A1A1A] text-white resize-none min-h-[44px] max-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isGenerating || (!inputMessage.trim() && !uploadedImage)}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIDesignAssistant;
