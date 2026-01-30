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
    <div className="flex-1 p-4 flex flex-col">
      {/* Logo at top - reduced size for better spacing */}
      <div className="text-center mb-2">
        <div className="mx-auto">
          <img
            src={jbjMonogramLightBg}
            alt="JBJ Global Real Estate"
            className="h-28 w-auto mx-auto object-contain"
          />
        </div>
      </div>

      {/* Centered content: Welcome text + buttons */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-3">
          <h4 className="text-gold text-lg font-semibold mb-1">
            {t('chat.welcomeTitle', 'Welcome to JBJ Global Real Estate')} 👋
          </h4>
          <p className="text-zinc-600 text-sm">{t('chat.welcomeSubtitle', 'Your premium Real Estate partner in Dubai')}</p>
        </div>

        <div className="space-y-2">
          {/* Chat with Team Option - ACTIVE COLOR */}
          <button
            onClick={onStartChat}
            className="w-full p-3 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 hover:border-gold rounded-xl text-left transition-all duration-300 group shadow-md shadow-gold/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-gold/30 flex items-center justify-center shadow-sm">
                <MessageCircle className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1">
                <h5 className="text-black text-sm font-semibold mb-0.5">💬 {t('chat.chatWithTeam', 'Chat with our team')}</h5>
                <p className="text-gold text-xs font-medium">⚡ {t('chat.quickAnswers', 'Quick answers • Available 24/7')}</p>
              </div>
            </div>
          </button>

          {/* WhatsApp Option - ACTIVE COLOR */}
          <a
            href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(
              "Hi! I'd like to speak with someone about property in Dubai."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-3 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 hover:border-gold rounded-xl text-left transition-all duration-300 group block shadow-md shadow-gold/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-gold/30 flex items-center justify-center shadow-sm">
                <MessageCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h5 className="text-green-600 text-sm font-semibold mb-0.5">📱 {t('chat.talkDirectly', 'Talk Directly with Our Team')}</h5>
                <p className="text-gold text-xs font-medium">⚡ {t('chat.instantResponse', 'Instant response • WhatsApp')}</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Tip at bottom - reduced padding, black text */}
      <div className="text-center mt-2 px-3 py-2 bg-white/80 rounded-lg border border-gold/30">
        <p className="text-xs flex flex-wrap items-center justify-center gap-1">
          <span className="text-gold">💡</span>
          <span className="text-black font-semibold">{t('chat.tip', 'Tip:')}</span>
          <span className="text-zinc-700">{t('chat.tipText', "Our team can answer most questions right away!")}</span>
        </p>
      </div>
    </div>
  );
};

export default ChatWelcome;
