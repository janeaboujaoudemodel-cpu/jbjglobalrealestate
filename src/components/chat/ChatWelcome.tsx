import { MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from '@/constants/stats';
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatWelcomeProps {
  onStartChat: () => void;
}

const ChatWelcome = ({ onStartChat }: ChatWelcomeProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex-1 px-4 pt-4 pb-6 flex flex-col items-center text-center overflow-y-auto">
      {/* Logo - at TOP now */}
      <div className="mb-4">
        <img
          src={jbjMonogramLightBg}
          alt="JBJ Global Real Estate"
          className="h-24 w-auto mx-auto object-contain"
        />
      </div>

      {/* Welcome text - centered */}
      <div className="mb-4">
        <h4 className="text-gold text-xl font-bold mb-2">
          {t('chat.welcomeTitle', 'Chat with our team')} 👋
        </h4>
        <p className="text-black text-sm font-medium">{t('chat.welcomeSubtitle', 'Talk directly with our experts')}</p>
      </div>

      {/* Action buttons - full width, centered */}
      <div className="w-full space-y-3 mb-4">
        {/* Chat with Team Option */}
        <button
          onClick={onStartChat}
          className="w-full p-4 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 hover:border-gold rounded-xl transition-all duration-300 group shadow-md shadow-gold/20"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white border border-gold/30 flex items-center justify-center shadow-sm">
              <MessageCircle className="w-6 h-6 text-gold" />
            </div>
            <div className="text-left">
              <h5 className="text-black text-base font-bold mb-0.5">💬 {t('chat.chatWithTeam', 'Chat with our team')}</h5>
              <p className="text-gold text-sm font-medium">⚡ {t('chat.quickAnswers', 'Quick answers • Available 24/7')}</p>
            </div>
          </div>
        </button>

        {/* WhatsApp Option */}
        <a
          href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(
            "Hi! I'd like to speak with someone about property in Dubai."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-4 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 hover:border-gold rounded-xl transition-all duration-300 group block shadow-md shadow-gold/20"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white border border-gold/30 flex items-center justify-center shadow-sm">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-left">
              <h5 className="text-green-600 text-base font-bold mb-0.5">📱 {t('chat.talkDirectly', 'Talk Directly with Our Team')}</h5>
              <p className="text-gold text-sm font-medium">⚡ {t('chat.instantResponse', 'Instant response • WhatsApp')}</p>
            </div>
          </div>
        </a>
      </div>

      {/* Tip at BOTTOM now */}
      <div className="w-full mt-auto px-4 py-3 bg-white/80 rounded-lg border border-gold/30">
        <p className="text-sm flex flex-wrap items-center justify-center gap-1">
          <span className="text-gold">💡</span>
          <span className="text-black font-bold">{t('chat.tip', 'Tip:')}</span>
          <span className="text-zinc-700">{t('chat.tipText', "Most of your questions can be answered through the chat with our team section for faster response.")}</span>
        </p>
      </div>
    </div>
  );
};

export default ChatWelcome;
