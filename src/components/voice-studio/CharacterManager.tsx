/**
 * Multi-Character Voice System
 * Create and manage voice characters with persona presets
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, X, Edit2, Trash2, Play, Pause, Volume2, Save,
  Mic, Globe, MessageSquare, Video, Radio, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// Voice library using ElevenLabs voice IDs
const VOICE_LIBRARY = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", gender: "male", accent: "British" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "female", accent: "American" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "male", accent: "British" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female", accent: "American" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male", accent: "Australian" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female", accent: "British" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "male", accent: "American" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "female", accent: "Australian" },
];

const PERSONA_PRESETS = [
  { id: 'podcast', name: 'Podcast Host', icon: Radio, description: 'Conversational, engaging tone' },
  { id: 'narrator', name: 'Narrator', icon: BookOpen, description: 'Storytelling, clear diction' },
  { id: 'presenter', name: 'Presenter', icon: Video, description: 'Professional, authoritative' },
  { id: 'interviewer', name: 'Interviewer', icon: MessageSquare, description: 'Curious, friendly' },
];

const NATIONALITIES = [
  'American', 'British', 'Australian', 'Canadian', 'Indian', 
  'Irish', 'Scottish', 'South African', 'New Zealand', 'Other'
];

const LANGUAGES = [
  'English', 'Arabic', 'French', 'Spanish', 'German', 
  'Italian', 'Portuguese', 'Russian', 'Chinese', 'Hindi'
];

export interface VoiceCharacter {
  id: string;
  name: string;
  nationality: string;
  languages: string[];
  voiceId: string;
  voiceName: string;
  persona: string;
  description?: string;
}

interface CharacterManagerProps {
  characters: VoiceCharacter[];
  onAddCharacter: (character: VoiceCharacter) => void;
  onUpdateCharacter: (id: string, character: Partial<VoiceCharacter>) => void;
  onDeleteCharacter: (id: string) => void;
  selectedCharacterId?: string;
  onSelectCharacter?: (id: string) => void;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({
  characters,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  selectedCharacterId,
  onSelectCharacter,
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<VoiceCharacter | null>(null);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nationality: 'American',
    languages: ['English'],
    voiceId: VOICE_LIBRARY[0].id,
    persona: 'narrator',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nationality: 'American',
      languages: ['English'],
      voiceId: VOICE_LIBRARY[0].id,
      persona: 'narrator',
      description: '',
    });
  };

  const handleCreateCharacter = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a character name');
      return;
    }

    const selectedVoice = VOICE_LIBRARY.find(v => v.id === formData.voiceId);
    
    const newCharacter: VoiceCharacter = {
      id: `char_${Date.now()}`,
      name: formData.name,
      nationality: formData.nationality,
      languages: formData.languages,
      voiceId: formData.voiceId,
      voiceName: selectedVoice?.name || 'Unknown',
      persona: formData.persona,
      description: formData.description,
    };

    onAddCharacter(newCharacter);
    toast.success(`Character "${newCharacter.name}" created!`);
    setShowCreateDialog(false);
    resetForm();
  };

  const handlePreviewVoice = (voiceId: string) => {
    if (previewingVoice === voiceId) {
      setPreviewingVoice(null);
      // Stop preview
      return;
    }
    setPreviewingVoice(voiceId);
    // Would trigger ElevenLabs preview API
    toast.info('Voice preview playing...');
    setTimeout(() => setPreviewingVoice(null), 2000);
  };

  const getPersonaIcon = (personaId: string) => {
    const preset = PERSONA_PRESETS.find(p => p.id === personaId);
    return preset?.icon || MessageSquare;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="text-white font-semibold">Voice Characters</h3>
          <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
            {characters.length} created
          </Badge>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
              <Plus className="w-4 h-4 mr-1" />
              New Character
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#1A1A1A]" />
                Create Voice Character
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              {/* Character Name */}
              <div>
                <Label className="text-white/70">Character Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Alex the Host"
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>

              {/* Nationality */}
              <div>
                <Label className="text-white/70">Nationality</Label>
                <Select 
                  value={formData.nationality} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
                >
                  <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#1A1A1A]">
                    {NATIONALITIES.map(nat => (
                      <SelectItem key={nat} value={nat} className="text-white hover:bg-[#EFE6D6]/20">
                        {nat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Languages */}
              <div>
                <Label className="text-white/70">Languages</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {LANGUAGES.slice(0, 5).map(lang => (
                    <Badge
                      key={lang}
                      variant="outline"
                      className={`cursor-pointer transition-all ${
                        formData.languages.includes(lang)
                          ? 'bg-[#EFE6D6]/20 border-[#B89555] text-[#1A1A1A]'
                          : 'border-[#1A1A1A] text-white/70 hover:border-[#B89555]/50'
                      }`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          languages: prev.languages.includes(lang)
                            ? prev.languages.filter(l => l !== lang)
                            : [...prev.languages, lang]
                        }));
                      }}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Voice Selection */}
              <div>
                <Label className="text-white/70">Voice</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {VOICE_LIBRARY.map(voice => (
                    <button
                      key={voice.id}
                      onClick={() => setFormData(prev => ({ ...prev, voiceId: voice.id }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.voiceId === voice.id
                          ? 'border-[#B89555] bg-[#EFE6D6]/10'
                          : 'border-[#1A1A1A] bg-[#1A1A1A] hover:border-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{voice.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6"
                          onClick={(e) => { e.stopPropagation(); handlePreviewVoice(voice.id); }}
                        >
                          {previewingVoice === voice.id ? (
                            <Pause className="w-3 h-3 text-[#1A1A1A]" />
                          ) : (
                            <Play className="w-3 h-3 text-white/70" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-[#1A1A1A] text-white/70">
                          {voice.gender}
                        </Badge>
                        <span className="text-xs text-white/90">{voice.accent}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona Selection */}
              <div>
                <Label className="text-white/70">Persona</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PERSONA_PRESETS.map(preset => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setFormData(prev => ({ ...prev, persona: preset.id }))}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.persona === preset.id
                            ? 'border-[#B89555] bg-[#EFE6D6]/10'
                            : 'border-[#1A1A1A] bg-[#1A1A1A] hover:border-[#1A1A1A]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${formData.persona === preset.id ? 'text-[#1A1A1A]' : 'text-white/70'}`} />
                          <span className="text-white text-sm">{preset.name}</span>
                        </div>
                        <p className="text-xs text-white/90 mt-1">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-white/70">Description (Optional)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional character notes..."
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>

              <Button
                onClick={handleCreateCharacter}
                disabled={!formData.name.trim()}
                className="w-full bg-gradient-to-r from-gold to-amber-600 text-[#1A1A1A] font-semibold"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Character
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Characters List */}
      {characters.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-[#1A1A1A] rounded-lg">
          <Users className="w-10 h-10 text-[#1A1A1A]/70 mx-auto mb-2" />
          <p className="text-white/90 text-sm">No characters created yet</p>
          <p className="text-[#1A1A1A]/70 text-xs">Create characters for multi-voice scripts</p>
        </div>
      ) : (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-2">
            {characters.map((character) => {
              const PersonaIcon = getPersonaIcon(character.persona);
              const isSelected = selectedCharacterId === character.id;
              
              return (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#B89555] bg-[#EFE6D6]/10'
                      : 'border-[#1A1A1A] bg-[#1A1A1A]/50 hover:border-[#1A1A1A]'
                  }`}
                  onClick={() => onSelectCharacter?.(character.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-[#EFE6D6]/20' : 'bg-[#1A1A1A]'
                      }`}>
                        <PersonaIcon className={`w-5 h-5 ${isSelected ? 'text-[#1A1A1A]' : 'text-white/70'}`} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{character.name}</p>
                        <div className="flex items-center gap-2 text-xs text-white/90">
                          <Globe className="w-3 h-3" />
                          <span>{character.nationality}</span>
                          <span>•</span>
                          <Volume2 className="w-3 h-3" />
                          <span>{character.voiceName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handlePreviewVoice(character.voiceId); }}
                        className="w-8 h-8 text-white/70 hover:text-[#1A1A1A]"
                      >
                        {previewingVoice === character.voiceId ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onDeleteCharacter(character.id); }}
                        className="w-8 h-8 text-white/70 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {character.languages.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {character.languages.slice(0, 3).map(lang => (
                        <Badge key={lang} variant="outline" className="text-xs border-[#1A1A1A] text-white/70">
                          {lang}
                        </Badge>
                      ))}
                      {character.languages.length > 3 && (
                        <Badge variant="outline" className="text-xs border-[#1A1A1A] text-white/70">
                          +{character.languages.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default CharacterManager;
