import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Camera, 
  Sofa, 
  MessageSquare
} from 'lucide-react';

export type DesignMode = 'concept' | 'redesign' | 'staging' | 'chat';

interface DesignModeSelectorProps {
  selectedMode: DesignMode;
  onSelectMode: (mode: DesignMode) => void;
}

const modes = [
  {
    id: 'concept' as DesignMode,
    title: 'Concept',
    icon: Sparkles,
    color: 'fuchsia',
    activeClasses: 'data-[state=active]:bg-fuchsia-500/20 data-[state=active]:text-fuchsia-300 data-[state=active]:border-fuchsia-500/50',
  },
  {
    id: 'redesign' as DesignMode,
    title: 'Redesign',
    icon: Camera,
    color: 'blue',
    activeClasses: 'data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 data-[state=active]:border-blue-500/50',
  },
  {
    id: 'staging' as DesignMode,
    title: 'Staging',
    icon: Sofa,
    color: 'emerald',
    activeClasses: 'data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/50',
  },
  {
    id: 'chat' as DesignMode,
    title: 'AI Chat',
    icon: MessageSquare,
    color: 'orange',
    activeClasses: 'data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300 data-[state=active]:border-orange-500/50',
  },
];

const DesignModeSelector = ({ selectedMode, onSelectMode }: DesignModeSelectorProps) => {
  return (
    <div className="w-full">
      <Tabs value={selectedMode} onValueChange={(value) => onSelectMode(value as DesignMode)} className="w-full">
        <TabsList className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-1.5 h-auto flex gap-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <TabsTrigger
                key={mode.id}
                value={mode.id}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                  text-zinc-400 border border-transparent
                  hover:text-white hover:bg-zinc-800/50
                  transition-all duration-200
                  ${mode.activeClasses}
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{mode.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default DesignModeSelector;
