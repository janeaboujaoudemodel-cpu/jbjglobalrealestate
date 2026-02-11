import { Briefcase, Building2, Home, Paintbrush, Scale, MessageCircle, FileText } from 'lucide-react';
import { T } from '@/components/ui/T';

export type ShortcutType = 'submit_cv' | 'buy_property' | 'rent_property' | 'property_management' | 'design_services' | 'legal_partners' | 'general_inquiry';

interface ChatShortcutsProps {
  onSelectShortcut: (shortcut: ShortcutType) => void;
  userFirstName: string;
}

const SHORTCUTS = [
  { id: 'submit_cv' as ShortcutType, icon: FileText, label: 'Submit Your CV', description: 'Apply to join our team', color: 'text-blue-500' },
  { id: 'buy_property' as ShortcutType, icon: Building2, label: 'Buy Property', description: 'Explore properties for sale', color: 'text-gold' },
  { id: 'rent_property' as ShortcutType, icon: Home, label: 'Rent Property', description: 'Find your perfect rental', color: 'text-green-500' },
  { id: 'property_management' as ShortcutType, icon: Scale, label: 'Property Management', description: 'Manage your investments', color: 'text-purple-500' },
  { id: 'design_services' as ShortcutType, icon: Paintbrush, label: 'Design & Build', description: 'Interior & architecture', color: 'text-pink-500' },
  { id: 'general_inquiry' as ShortcutType, icon: MessageCircle, label: 'General Inquiry', description: 'Other questions', color: 'text-zinc-500' },
];

const ChatShortcuts = ({ onSelectShortcut, userFirstName: userFullName }: ChatShortcutsProps) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="text-center mb-4">
        <h4 className="text-black text-lg font-semibold mb-1">
          <T>{`Hi ${userFullName}! 👋`}</T>
        </h4>
        <p className="text-zinc-600 text-sm">
          <T>What would you like help with today?</T>
        </p>
      </div>

      <div className="space-y-2">
        {SHORTCUTS.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.id}
              onClick={() => onSelectShortcut(shortcut.id)}
              className="w-full p-3 bg-white border-2 border-gold/30 hover:border-gold hover:bg-gold/5 rounded-xl text-left transition-all duration-300 group flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] flex items-center justify-center border border-gold/30 shadow-sm`}>
                <Icon className={`w-5 h-5 ${shortcut.color}`} />
              </div>
              <div className="flex-1">
                <h5 className="text-black text-sm font-semibold group-hover:text-gold transition-colors">
                  <T>{shortcut.label}</T>
                </h5>
                <p className="text-zinc-500 text-xs">
                  <T>{shortcut.description}</T>
                </p>
              </div>
              <div className="text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-zinc-500 text-xs mt-4">
        <T>Select an option to get started</T>
      </p>
    </div>
  );
};

export default ChatShortcuts;
