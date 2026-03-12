import { Briefcase, Building2, Home, Paintbrush, Scale, MessageCircle, FileText, Plane, Compass, Ruler, Settings, Users, LayoutDashboard, Mail, ClipboardList, Shield, BookOpen, Heart, Bell, Star, Inbox } from 'lucide-react';
import { T } from '@/components/ui/T';
import { useUserRole, VisitorRole } from '@/hooks/useUserRole';
import { useOwnerVerification } from '@/hooks/useOwnerVerification';

export type ShortcutType = 'submit_cv' | 'buy_property' | 'sell_property' | 'rent_property' | 'list_for_rent' | 'property_management' | 'design_services' | 'guides' | 'ai_tools' | 'general_inquiry'
  | 'owner_command' | 'crm_dashboard' | 'admin_panel' | 'listing_admin' | 'inbox' | 'cv_center' | 'email_client' | 'team_chat' | 'automations' | 'customer_happiness'
  | 'broker_dashboard' | 'broker_toolkit' | 'my_tasks' | 'notifications'
  | 'investor_hub' | 'investor_dashboard' | 'portfolio'
  | 'dashboard' | 'favorites' | 'shortlists' | 'books';

interface ShortcutItem {
  id: ShortcutType;
  icon: any;
  label: string;
  description: string;
  color: string;
}

interface ChatShortcutsProps {
  onSelectShortcut: (shortcut: ShortcutType) => void;
  userFirstName: string;
}

const BASE_SHORTCUTS: ShortcutItem[] = [
  { id: 'buy_property', icon: Building2, label: 'Buy Property', description: 'Explore properties for sale', color: 'text-gold' },
  { id: 'sell_property', icon: Building2, label: 'Sell Your Property', description: 'List your property for sale', color: 'text-amber-600' },
  { id: 'rent_property', icon: Home, label: 'Rent Property', description: 'Find your perfect rental', color: 'text-green-500' },
  { id: 'list_for_rent', icon: Home, label: 'List for Rent', description: 'List your property for rent', color: 'text-emerald-600' },
  { id: 'property_management', icon: Scale, label: 'Property Management', description: 'Manage your investments', color: 'text-purple-500' },
  { id: 'design_services', icon: Paintbrush, label: 'Design & Build', description: 'Interior & architecture', color: 'text-pink-500' },
  { id: 'guides', icon: Plane, label: 'Guides & Resources', description: 'Dubai guides, visa, golden visa', color: 'text-sky-500' },
  { id: 'ai_tools', icon: Compass, label: 'AI Tools & Features', description: 'Property finder, measure, explore', color: 'text-indigo-500' },
  { id: 'submit_cv', icon: FileText, label: 'Submit Your CV', description: 'Career opportunities with us', color: 'text-blue-500' },
  { id: 'general_inquiry', icon: MessageCircle, label: 'General Inquiry', description: 'Other questions', color: 'text-zinc-500' },
];

const OWNER_SHORTCUTS: ShortcutItem[] = [
  { id: 'owner_command', icon: Shield, label: 'Owner Command Center', description: 'Full control panel', color: 'text-gold' },
  { id: 'crm_dashboard', icon: Users, label: 'CRM Dashboard', description: 'Leads, deals & pipeline', color: 'text-blue-600' },
  { id: 'admin_panel', icon: Settings, label: 'Admin Panel', description: 'System administration', color: 'text-red-500' },
  { id: 'listing_admin', icon: ClipboardList, label: 'Listing Admin', description: 'Manage all listings', color: 'text-orange-500' },
  { id: 'inbox', icon: Inbox, label: 'Inbox & Enquiries', description: 'Messages & lead enquiries', color: 'text-cyan-500' },
  { id: 'customer_happiness', icon: Heart, label: 'Customer Happiness', description: 'Support & satisfaction', color: 'text-rose-500' },
  { id: 'cv_center', icon: FileText, label: 'CV Center', description: 'Review applications', color: 'text-teal-500' },
  { id: 'email_client', icon: Mail, label: 'Email Client', description: 'Send & manage emails', color: 'text-violet-500' },
  { id: 'team_chat', icon: MessageCircle, label: 'Team Chat', description: 'Internal messaging', color: 'text-emerald-500' },
  { id: 'automations', icon: Compass, label: 'Automations', description: 'Workflows & triggers', color: 'text-amber-500' },
];

const JBJ_BROKER_SHORTCUTS: ShortcutItem[] = [
  { id: 'crm_dashboard', icon: Users, label: 'CRM Dashboard', description: 'Your leads & pipeline', color: 'text-blue-600' },
  { id: 'my_tasks', icon: ClipboardList, label: 'My Tasks', description: 'Tasks & follow-ups', color: 'text-orange-500' },
  { id: 'inbox', icon: Inbox, label: 'Inbox', description: 'Messages & notifications', color: 'text-cyan-500' },
  { id: 'broker_dashboard', icon: LayoutDashboard, label: 'Broker Dashboard', description: 'Performance & stats', color: 'text-indigo-500' },
];

const PARTNER_BROKER_SHORTCUTS: ShortcutItem[] = [
  { id: 'broker_toolkit', icon: Briefcase, label: 'Broker Portal', description: 'Tools & resources', color: 'text-blue-600' },
  { id: 'broker_dashboard', icon: LayoutDashboard, label: 'Broker Dashboard', description: 'Your performance', color: 'text-indigo-500' },
];

const INVESTOR_SHORTCUTS: ShortcutItem[] = [
  { id: 'investor_hub', icon: Star, label: 'Investor Hub', description: 'Investment opportunities', color: 'text-gold' },
  { id: 'investor_dashboard', icon: LayoutDashboard, label: 'Investor Dashboard', description: 'Track your portfolio', color: 'text-emerald-500' },
  { id: 'portfolio', icon: Briefcase, label: 'Portfolio Views', description: 'Manage investments', color: 'text-blue-600' },
];

const CLIENT_SHORTCUTS: ShortcutItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'My Dashboard', description: 'Your overview', color: 'text-blue-600' },
  { id: 'favorites', icon: Heart, label: 'Favorites', description: 'Saved properties', color: 'text-rose-500' },
  { id: 'notifications', icon: Bell, label: 'Notifications', description: 'Updates & alerts', color: 'text-amber-500' },
  { id: 'books', icon: BookOpen, label: 'Books Library', description: 'Guides & resources', color: 'text-teal-500' },
];

function getShortcutsForRole(isOwner: boolean, role: VisitorRole): ShortcutItem[] {
  if (isOwner) {
    return [...OWNER_SHORTCUTS, ...BASE_SHORTCUTS];
  }

  switch (role) {
    case 'broker_jbj':
      return [...JBJ_BROKER_SHORTCUTS, ...BASE_SHORTCUTS];
    case 'broker_partner':
    case 'broker':
      return [...PARTNER_BROKER_SHORTCUTS, ...BASE_SHORTCUTS];
    case 'investor':
      return [...INVESTOR_SHORTCUTS, ...BASE_SHORTCUTS];
    case 'owner':
    case 'client':
      return [...CLIENT_SHORTCUTS, ...BASE_SHORTCUTS];
    default:
      return [...CLIENT_SHORTCUTS, ...BASE_SHORTCUTS];
  }
}

const ChatShortcuts = ({ onSelectShortcut, userFirstName: userFullName }: ChatShortcutsProps) => {
  const { role } = useUserRole();
  const { isOwner } = useOwnerVerification();
  const shortcuts = getShortcutsForRole(isOwner, role);

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
        {shortcuts.map((shortcut) => {
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
