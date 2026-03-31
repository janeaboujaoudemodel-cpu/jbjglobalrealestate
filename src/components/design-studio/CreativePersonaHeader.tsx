import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Languages, 
  Palette, 
  Sparkles,
  Globe,
  ChevronDown,
  Send,
  Loader2
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Import persona image
import marcusBennettDesigner from '@/assets/team/marcus-bennett-creative-v2.png';

interface CreativePersonaHeaderProps {
  personaType: 'designer' | 'content-editor' | 'video-producer';
  onIdeaSubmit?: (idea: string, language: string) => void;
  isProcessing?: boolean;
}

const PERSONAS = {
  'designer': {
    name: 'Marcus Bennett',
    role: 'Creative Design Lead',
    avatar: marcusBennettDesigner,
    specializations: ['Brand Identity', 'Social Media', 'Print Materials'],
    bio: 'Expert designer with 8+ years crafting premium visual content for luxury real estate brands.',
  },
  'content-editor': {
    name: 'Henry Crawford',
    role: 'Content Editor',
    avatar: '/team/henry-crawford-editor.png',
    specializations: ['Video Editing', 'Color Grading', 'Motion Graphics'],
    bio: 'Skilled editor transforming raw footage into visually compelling narratives.',
  },
  'video-producer': {
    name: 'Oliver Wright',
    role: 'Video Producer',
    avatar: '/team/oliver-wright-video.png',
    specializations: ['Property Tours', 'Brand Films', 'Drone Cinematography'],
    bio: 'Cinematic production specialist crafting immersive property tours and brand documentaries.',
  },
};

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇦🇪' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', translator: true },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', translator: true },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', translator: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', translator: true },
];

export const CreativePersonaHeader: React.FC<CreativePersonaHeaderProps> = ({
  personaType,
  onIdeaSubmit,
  isProcessing = false,
}) => {
  const persona = PERSONAS[personaType];
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [ideaText, setIdeaText] = useState('');
  const [showIdeaBox, setShowIdeaBox] = useState(false);

  const handleSubmitIdea = () => {
    if (!ideaText.trim()) {
      toast.error('Please describe your design idea');
      return;
    }
    onIdeaSubmit?.(ideaText, selectedLanguage.code);
    setIdeaText('');
    setShowIdeaBox(false);
  };

  return (
    <div className="bg-gradient-to-r from-[#F5E6E0] via-[#FDFBF7] to-[#F5E6E0] rounded-2xl p-6 border border-rose-200/50 shadow-lg shadow-rose-100/30">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Persona Info */}
        <div className="flex items-start gap-4 flex-1">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-white shadow-xl shadow-rose-200/50">
              <AvatarImage src={persona.avatar} alt={persona.name} className="object-cover object-top" />
              <AvatarFallback className="bg-gradient-to-br from-rose-400 to-rose-600 text-white text-xl font-bold">
                {persona.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-md" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-black">
                {persona.name}
              </h2>
              <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 text-xs">
                <Palette className="w-3 h-3 mr-1" />
                {persona.role}
              </Badge>
            </div>
            
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {persona.bio}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {persona.specializations.map((spec) => (
                <Badge 
                  key={spec} 
                  variant="outline" 
                  className="bg-white/80 border-rose-200 text-rose-700 text-xs"
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Language Selector & Chat */}
        <div className="flex flex-col gap-3 lg:w-64">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between bg-white border-rose-200 hover:bg-rose-50 text-black"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedLanguage.flag}</span>
                  <span>{selectedLanguage.name}</span>
                  {selectedLanguage.translator && (
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                      <Languages className="w-3 h-3 mr-1" />
                      Translator
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    <span className="text-gray-500 text-xs">({lang.native})</span>
                  </div>
                  {lang.translator && (
                    <Globe className="h-3 w-3 text-amber-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={() => setShowIdeaBox(!showIdeaBox)}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-200/50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Describe Your Idea
          </Button>
        </div>
      </div>

      {/* Idea Input Box */}
      <AnimatePresence>
        {showIdeaBox && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div className="bg-white rounded-xl p-4 border border-rose-100 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5 text-rose-500" />
                <span className="font-medium text-black">Describe your design idea</span>
                {selectedLanguage.translator && (
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                    Using translator for {selectedLanguage.name}
                  </Badge>
                )}
              </div>
              
              <Textarea
                placeholder={`Tell ${persona.name} what you want to create... Be specific about colors, style, and purpose.`}
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                className="min-h-[100px] bg-gray-50 border-rose-100 focus:border-rose-300 text-black"
              />
              
              <div className="flex justify-end gap-2 mt-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowIdeaBox(false)}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitIdea}
                  disabled={isProcessing || !ideaText.trim()}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Generate Design
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreativePersonaHeader;
