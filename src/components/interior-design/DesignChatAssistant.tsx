import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Sparkles, Upload, X, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
}

interface DesignChatAssistantProps {
  onGenerateFromChat: (prompt: string, photos: string[]) => void;
  isProcessing: boolean;
  generatedImage?: string;
  generatedNotes?: string;
}

const EXAMPLE_PROMPTS = [
  "Design a luxury modern bedroom, 400 sqft, with gold accents and floor-to-ceiling windows",
  "Create a minimalist home office with natural wood and lots of plants",
  "Transform this into a cozy Scandinavian living room with warm lighting",
  "Design an elegant Dubai-style penthouse lobby with marble floors",
];

const DesignChatAssistant = ({
  onGenerateFromChat,
  isProcessing,
  generatedImage,
  generatedNotes,
}: DesignChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI Interior Design Assistant. 🎨

I can help you create beautiful interior designs. Just describe what you want:

• **Concept Designs**: "Design a luxury modern bedroom with gold accents"
• **Redesigns**: Upload a photo and say "make this more minimalist"  
• **Virtual Staging**: Upload an empty room and say "add Scandinavian furniture"

You can also include details like room size, color preferences, and specific furniture pieces.

What would you like to create today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle generated result
  useEffect(() => {
    if (generatedImage) {
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: generatedNotes || 'Your design is ready!',
        image: generatedImage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, resultMessage]);
    }
  }, [generatedImage, generatedNotes]);

  const handleSend = () => {
    if (!input.trim() && photos.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      image: photos[0],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Add processing message
    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '🎨 Analyzing your request and generating your design...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, processingMessage]);

    // Trigger generation
    onGenerateFromChat(input, photos);

    setInput('');
    setPhotos([]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large (max 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos([e.target?.result as string]);
      toast.success('Photo added! Now describe what you want.');
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full">
      <div className="bg-zinc-900/60 border border-orange-500/30 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Design Assistant</h3>
            <p className="text-xs text-zinc-500">Describe your dream space</p>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${message.role === 'user' 
                  ? 'bg-orange-500/20' 
                  : 'bg-gradient-to-br from-amber-500 to-orange-500'
                }
              `}>
                {message.role === 'user' 
                  ? <User className="w-4 h-4 text-orange-300" />
                  : <Bot className="w-4 h-4 text-white" />
                }
              </div>
              
              <div className={`
                max-w-[80%] rounded-2xl p-4
                ${message.role === 'user' 
                  ? 'bg-orange-500/20 text-white' 
                  : 'bg-zinc-800/80 text-zinc-200'
                }
              `}>
                {message.image && (
                  <img 
                    src={message.image} 
                    alt="Design" 
                    className="rounded-lg mb-3 max-h-[300px] w-auto"
                  />
                )}
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Example Prompts */}
        {messages.length === 1 && (
          <div className="px-4 pb-4">
            <p className="text-xs text-zinc-500 mb-2">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.slice(0, 2).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInput(prompt)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  {prompt.slice(0, 50)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {photos.length > 0 && (
          <div className="px-4 pb-2">
            <div className="relative inline-block">
              <img 
                src={photos[0]} 
                alt="Upload preview" 
                className="h-20 w-auto rounded-lg border border-zinc-700"
              />
              <button
                onClick={() => setPhotos([])}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-zinc-800">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="dark-outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="w-4 h-4" />
            </Button>
            
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your dream interior..."
              className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 min-h-[44px] max-h-[120px] resize-none flex-1 focus:border-orange-500/50"
              disabled={isProcessing}
            />
            
            <Button
              onClick={handleSend}
              disabled={isProcessing || (!input.trim() && photos.length === 0)}
              variant="ai-orange"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignChatAssistant;
