import { MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from '@/constants/stats';
import jbjMonogramLightBg from "@/assets/jbj-monogram-nobuffer.png";
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatWelcomeProps {
  onStartChat: () => void;
}

const ChatWelcome = ({ onStartChat }: ChatWelcomeProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex-1 px-4 py-5 flex flex-col items-center text-center overflow-y-auto">
      {/* Logo */}
      <div className="mb-3">
        <img
          src={jbjMonogramLightBg}
          alt="JBJ Global Real Estate"
          className="h-20 w-auto mx-auto object-contain"
         loading="lazy" decoding="async" />
      </div>

      {/* Welcome text */}
      <div className="mb-5">
        <h4 className="text-[#1A1A1A] text-xl font-bold mb-1.5">
          {t('chat.welcomeTitle', 'Chat with our team')} 👋
        </h4>
        <p className="text-[#1A1A1A] text-sm font-medium">{t('chat.welcomeSubtitle', 'Talk directly with our experts')}</p>
      </div>

      {/* Action buttons — centered, balanced */}
      <div className="w-full flex-1 flex flex-col justify-center gap-3">
        {/* Chat with Team Option */}
        <button
          onClick={onStartChat}
          className="w-full p-4 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border-2 border-[#B89555]/40 hover:border-[#B89555] rounded-xl transition-all duration-300 group shadow-md shadow-gold/20"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FDFBF7] border border-[#B89555]/30 flex items-center justify-center shadow-sm">
              <MessageCircle className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <div className="text-left">
              <h5 className="text-[#1A1A1A] text-base font-bold mb-0.5">💬 {t('chat.chatWithTeam', 'Chat with our team')}</h5>
              <p className="text-[#1A1A1A] text-sm font-medium">⚡ {t('chat.quickAnswers', 'Quick answers • Available 24/7')}</p>
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
          className="w-full p-4 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border-2 border-[#B89555]/40 hover:border-[#B89555] rounded-xl transition-all duration-300 group block shadow-md shadow-gold/20"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FDFBF7] border border-[#B89555]/30 flex items-center justify-center shadow-sm">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-left">
              <h5 className="text-[color:var(--emerald-1)] text-base font-bold mb-0.5">📱 {t('chat.talkDirectly', 'Talk Directly with Our Team')}</h5>
              <p className="text-[#1A1A1A] text-sm font-medium">⚡ {t('chat.instantResponse', 'Instant response • WhatsApp')}</p>
            </div>
          </div>
        </a>
      </div>

      {/* Tip — sits naturally below CTAs, no forced spacer */}
      <div className="w-full mt-5 px-4 py-3 bg-[#FDFBF7]/80 rounded-lg border border-[#B89555]/30">
        <p className="text-sm flex flex-wrap items-center justify-center gap-1">
          <span className="text-[#1A1A1A]">💡</span>
          <span className="text-[#1A1A1A] font-bold">{t('chat.tip', 'Tip:')}</span>
          <span className="text-[#1A1A1A]/70">{t('chat.tipText', "Most of your questions can be answered through the chat with our team section for faster response.")}</span>
        </p>
      </div>
    </div>

  );
};

export default ChatWelcome;
