import { MessageCircle } from 'lucide-react';
import { SERVICES } from './types';
import { CONTACT_INFO } from '@/constants/stats';

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
          {isExistingUser ? `Welcome back, ${userFirstName}!` : `Hi ${userFirstName}!`}
        </h4>
        <p className="text-zinc-400 text-sm">
          {isExistingUser ? 'Great to see you again! How can we help?' : 'Which service are you looking for?'}
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
            <h5 className="text-white text-sm font-semibold">Chat on WhatsApp</h5>
            <p className="text-green-400 text-xs">Direct access • Instant response</p>
          </div>
          <div className="text-green-400 group-hover:translate-x-1 transition-transform">
            →
          </div>
        </a>
      )}

      <p className="text-zinc-500 text-xs text-center mb-3">
        {isExistingUser ? 'Or chat with our AI assistant:' : 'Select a topic to get started:'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <button
              key={service.id}
              onClick={() => onSelectService(service.id)}
              className="p-4 bg-white/5 hover:bg-gold/10 border border-zinc-700 hover:border-gold/50 rounded-xl text-left transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/10 group-hover:bg-gold/20 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-gold" />
              </div>
              <h5 className="text-white text-sm font-medium mb-1">{service.label}</h5>
              <p className="text-zinc-500 text-xs">{service.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatServiceSelector;
