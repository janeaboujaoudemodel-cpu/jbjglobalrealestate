import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Plus, 
  X, 
  Check, 
  Copy, 
  Trash2, 
  Edit2, 
  Save, 
  Star,
  Loader2,
  Pipette,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Color {
  hex: string;
  name: string;
}

interface ColorPalette {
  id: string;
  name: string;
  description: string | null;
  colors: Color[];
  is_default: boolean;
  is_public: boolean;
  created_at: string;
}

interface ColorPaletteManagerProps {
  onSelectPalette?: (palette: ColorPalette) => void;
  selectedPaletteId?: string;
  projectId?: string;
}

// JBJ Brand Default Palette
const JBJ_BRAND_PALETTE: Color[] = [
  { hex: '#D4AF37', name: 'JBJ Gold' },
  { hex: '#000000', name: 'Black' },
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#1A1A1A', name: 'Dark Gray' },
  { hex: '#F7F2EA', name: 'Champagne' },
  { hex: '#B8860B', name: 'Dark Gold' },
];

export const ColorPaletteManager: React.FC<ColorPaletteManagerProps> = ({
  onSelectPalette,
  selectedPaletteId,
  projectId
}) => {
  const { user } = useAuth();
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPalette, setEditingPalette] = useState<ColorPalette | null>(null);
  
  // New palette form
  const [newPaletteName, setNewPaletteName] = useState('');
  const [newPaletteDescription, setNewPaletteDescription] = useState('');
  const [newPaletteColors, setNewPaletteColors] = useState<Color[]>([
    { hex: '#D4AF37', name: 'Primary' },
    { hex: '#000000', name: 'Secondary' },
    { hex: '#FFFFFF', name: 'Background' },
  ]);

  useEffect(() => {
    if (user) {
      fetchPalettes();
    }
  }, [user]);

  const fetchPalettes = async () => {
    try {
      const { data, error } = await supabase
        .from('design_color_palettes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse colors from JSON
      const parsedPalettes = (data || []).map(p => ({
        ...p,
        colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors
      }));

      setPalettes(parsedPalettes);
    } catch (error) {
      console.error('Error fetching palettes:', error);
      toast.error('Failed to load color palettes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePalette = async () => {
    if (!newPaletteName.trim()) {
      toast.error('Please enter a palette name');
      return;
    }

    if (newPaletteColors.length < 2) {
      toast.error('Please add at least 2 colors');
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from('design_color_palettes')
        .insert({
          user_id: user?.id as string,
          name: newPaletteName,
          description: newPaletteDescription || null,
          colors: JSON.stringify(newPaletteColors),
          is_default: palettes.length === 0,
        })
        .select()
        .single();

      if (error) throw error;

      const newPalette = {
        ...data,
        colors: typeof data.colors === 'string' ? JSON.parse(data.colors) : data.colors
      };

      setPalettes(prev => [newPalette, ...prev]);
      toast.success('Color palette created!');
      setShowCreateDialog(false);
      resetForm();

      if (onSelectPalette) {
        onSelectPalette(newPalette);
      }
    } catch (error) {
      console.error('Error creating palette:', error);
      toast.error('Failed to create palette');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePalette = async (paletteId: string) => {
    try {
      const { error } = await supabase
        .from('design_color_palettes')
        .delete()
        .eq('id', paletteId);

      if (error) throw error;

      setPalettes(prev => prev.filter(p => p.id !== paletteId));
      toast.success('Palette deleted');
    } catch (error) {
      console.error('Error deleting palette:', error);
      toast.error('Failed to delete palette');
    }
  };

  const handleSetDefault = async (paletteId: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from('design_color_palettes')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // Set the new default
      const { error } = await supabase
        .from('design_color_palettes')
        .update({ is_default: true })
        .eq('id', paletteId);

      if (error) throw error;

      setPalettes(prev => prev.map(p => ({
        ...p,
        is_default: p.id === paletteId
      })));
      
      toast.success('Default palette updated');
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default palette');
    }
  };

  const resetForm = () => {
    setNewPaletteName('');
    setNewPaletteDescription('');
    setNewPaletteColors([
      { hex: '#D4AF37', name: 'Primary' },
      { hex: '#000000', name: 'Secondary' },
      { hex: '#FFFFFF', name: 'Background' },
    ]);
  };

  const addColorToNewPalette = () => {
    setNewPaletteColors(prev => [...prev, { hex: '#888888', name: `Color ${prev.length + 1}` }]);
  };

  const removeColorFromNewPalette = (index: number) => {
    setNewPaletteColors(prev => prev.filter((_, i) => i !== index));
  };

  const updateColorInNewPalette = (index: number, field: 'hex' | 'name', value: string) => {
    setNewPaletteColors(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const copyColorCode = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast.success(`Copied ${hex}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="text-white font-semibold">Color Palettes</h3>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Create Color Palette</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-white/70">Palette Name *</Label>
                <Input
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  placeholder="e.g., Luxury Property Campaign"
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white/70">Description</Label>
                <Input
                  value={newPaletteDescription}
                  onChange={(e) => setNewPaletteDescription(e.target.value)}
                  placeholder="Optional description"
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
              
              {/* Colors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white/70">Colors</Label>
                  <Button size="sm" variant="ghost" onClick={addColorToNewPalette} className="text-[#1A1A1A] hover:text-[#1A1A1A]">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Color
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newPaletteColors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color.hex}
                        onChange={(e) => updateColorInNewPalette(index, 'hex', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={color.name}
                        onChange={(e) => updateColorInNewPalette(index, 'name', e.target.value)}
                        placeholder="Color name"
                        className="flex-1 bg-[#1A1A1A] border-[#1A1A1A] text-white text-sm"
                      />
                      <Input
                        value={color.hex}
                        onChange={(e) => updateColorInNewPalette(index, 'hex', e.target.value)}
                        className="w-24 bg-[#1A1A1A] border-[#1A1A1A] text-white text-sm font-mono"
                      />
                      {newPaletteColors.length > 2 && (
                        <Button size="icon" variant="ghost" onClick={() => removeColorFromNewPalette(index)} className="text-red-400 hover:text-red-300">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label className="text-white/70 mb-2 block">Preview</Label>
                <div className="flex gap-1 p-2 bg-[#1A1A1A] rounded-lg">
                  {newPaletteColors.map((color, index) => (
                    <div
                      key={index}
                      className="flex-1 h-12 rounded first:rounded-l-lg last:rounded-r-lg"
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name}: ${color.hex}`}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreatePalette}
                disabled={isCreating || !newPaletteName.trim()}
                className="w-full bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] font-semibold"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create Palette
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Brand Colors */}
      <div className="p-3 bg-[#1A1A1A]/50 rounded-lg">
        <p className="text-white/70 text-xs mb-2">JBJ Brand Colors</p>
        <div className="flex gap-1">
          {JBJ_BRAND_PALETTE.map((color, index) => (
            <button
              key={index}
              onClick={() => copyColorCode(color.hex)}
              className="flex-1 h-8 rounded hover:scale-105 transition-transform group relative"
              style={{ backgroundColor: color.hex, border: color.hex === '#FFFFFF' ? '1px solid #333' : 'none' }}
              title={`${color.name}: ${color.hex}`}
            >
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#1A1A1A]/50 rounded">
                <Copy className="w-3 h-3 text-white" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* User Palettes */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#1A1A1A] animate-spin" />
        </div>
      ) : palettes.length === 0 ? (
        <div className="text-center py-6">
          <FolderOpen className="w-10 h-10 text-[#1A1A1A]/70 mx-auto mb-2" />
          <p className="text-white/90 text-sm">No custom palettes yet</p>
          <p className="text-[#1A1A1A]/70 text-xs">Create your first palette above</p>
        </div>
      ) : (
        <ScrollArea className="h-[250px]">
          <div className="space-y-2 pr-2">
            {palettes.map((palette) => (
              <motion.div
                key={palette.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedPaletteId === palette.id
                    ? 'border-[#B89555] bg-[#EFE6D6]/10'
                    : 'border-[#1A1A1A] bg-[#1A1A1A]/50 hover:border-[#1A1A1A]'
                }`}
                onClick={() => onSelectPalette?.(palette)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {palette.is_default && (
                      <Star className="w-3 h-3 text-[#1A1A1A] fill-gold" />
                    )}
                    <span className="text-white text-sm font-medium truncate max-w-[150px]">
                      {palette.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!palette.is_default && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleSetDefault(palette.id); }}
                        className="w-6 h-6 text-white/90 hover:text-[#1A1A1A]"
                        title="Set as default"
                      >
                        <Star className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleDeletePalette(palette.id); }}
                      className="w-6 h-6 text-white/90 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1">
                  {palette.colors.slice(0, 6).map((color: Color, index: number) => (
                    <div
                      key={index}
                      className="flex-1 h-6 rounded"
                      style={{ backgroundColor: color.hex, border: color.hex === '#FFFFFF' ? '1px solid #333' : 'none' }}
                      title={`${color.name}: ${color.hex}`}
                    />
                  ))}
                </div>
                {palette.description && (
                  <p className="text-white/90 text-xs mt-2 truncate">{palette.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ColorPaletteManager;
