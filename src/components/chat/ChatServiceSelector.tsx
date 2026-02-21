import { MessageCircle } from 'lucide-react';
import { SERVICES } from './types';
import { CONTACT_INFO } from '@/constants/stats';
import { T } from '@/components/ui/T';

interface ChatServiceSelectorProps {
  userFirstName: string;
  isExistingUser: boolean;
  onSelectService: (serviceId: string) => void;
}

const ChatServiceSelector = ({ userFirstName, isExistingUser, onSelectService }: ChatServiceSelectorProps) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-semibold mb-1">
          {isExistingUser ? <T>{`Welcome back, ${userFirstName}!`}</T> : <T>{`Hi ${userFirstName}!`}</T>}
        </h4>
        <p className="text-zinc-400 text-sm">
          {isExistingUser ? <T>Great to see you again! How can we help?</T> : <T>Which service are you looking for?</T>}
        </p>
      </div>

      {/* WhatsApp Direct Access for Existing Users */}
      {isExistingUser && (
        <a
          href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm ${userFirstName}. I'd like to chat about my property inquiry.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 mb-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h5 className="text-white text-sm font-semibold"><T>Chat on WhatsApp</T></h5>
            <p className="text-green-400 text-xs"><T>Direct access • Instant response</T></p>
          </div>
          <div className="text-green-400 group-hover:translate-x-1 transition-transform">
            →
          </div>
        </a>
      )}

      <p className="text-zinc-500 text-xs text-center mb-3">
        {isExistingUser ? <T>Or chat with our team:</T> : <T>Select a topic to get started:</T>}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <button
              key={service.id}
              onClick={() => onSelectService(service.id)}
              className="p-3 bg-white/5 hover:bg-gold/10 border border-zinc-700 hover:border-gold/50 rounded-xl text-left transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gold/10 group-hover:bg-gold/20 flex items-center justify-center mb-2">
                <Icon className="w-4 h-4 text-gold" />
              </div>
              <h5 className="text-white text-xs font-medium mb-0.5"><T>{service.label}</T></h5>
              <p className="text-zinc-500 text-[10px] leading-tight"><T>{service.description}</T></p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatServiceSelector;
