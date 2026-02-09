import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Camera, 
  Sofa, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export type DesignMode = 'concept' | 'redesign' | 'staging' | 'chat';

interface DesignModeSelectorProps {
  selectedMode: DesignMode | null;
  onSelectMode: (mode: DesignMode) => void;
}

const modes = [
  {
    id: 'concept' as DesignMode,
    title: 'Concept Render',
    description: 'Describe your dream space and get a luxury AI-generated design',
    icon: Sparkles,
    color: 'from-fuchsia-500 to-purple-500',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    hint: 'No photo required',
  },
  {
    id: 'redesign' as DesignMode,
    title: 'Redesign Photo',
    description: 'Upload your current room and transform it with AI',
    icon: Camera,
    color: 'from-blue-500 to-cyan-500',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    hint: 'Upload existing room',
  },
  {
    id: 'staging' as DesignMode,
    title: 'Virtual Staging',
    description: 'Stage an empty room with furniture and decor',
    icon: Sofa,
    color: 'from-emerald-500 to-teal-500',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    hint: 'Upload empty room',
  },
  {
    id: 'chat' as DesignMode,
    title: 'AI Chat Assistant',
    description: 'Describe what you want in natural language',
    icon: MessageSquare,
    color: 'from-amber-500 to-orange-500',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    hint: 'Talk to design AI',
  },
];

const DesignModeSelector = ({ selectedMode, onSelectMode }: DesignModeSelectorProps) => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Choose Your Design Mode
        </h2>
        <p className="text-zinc-400 text-lg">
          All AI design tools are <span className="text-green-400 font-bold">FREE</span> to use
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`
                  relative cursor-pointer overflow-hidden
                  transition-all duration-300 h-full
                  ${isSelected 
                    ? 'ring-2 ring-offset-2 ring-offset-black ring-white/50 bg-zinc-900/80' 
                    : 'bg-zinc-900/50 hover:bg-zinc-900/70 hover:scale-[1.02]'
                  }
                  border border-zinc-800 hover:border-zinc-700
                `}
                onClick={() => onSelectMode(mode.id)}
              >
                {/* Gradient overlay on hover/select */}
                <div className={`
                  absolute inset-0 opacity-0 transition-opacity duration-300
                  bg-gradient-to-br ${mode.color}
                  ${isSelected ? 'opacity-10' : 'group-hover:opacity-5'}
                `} />
                
                <CardContent className="p-5 md:p-6 relative z-10">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center mb-4
                    bg-gradient-to-br ${mode.color}
                  `}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {mode.title}
                  </h3>
                  
                  <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                    {mode.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge className={`${mode.badgeColor} text-xs`}>
                      {mode.hint}
                    </Badge>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <ArrowRight className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DesignModeSelector;
