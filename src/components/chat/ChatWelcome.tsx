import { MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from '@/constants/stats';
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";
import { T } from '@/components/ui/T';

interface ChatWelcomeProps {
  onStartChat: () => void;
}

const ChatWelcome = ({ onStartChat }: ChatWelcomeProps) => {
  return (
    <div className="flex-1 p-6 flex flex-col">
      {/* Logo stays at top */}
      <div className="text-center">
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
        <div className="text-center mb-4">
          <h4 className="text-black text-lg font-semibold mb-1">
            <T>Welcome to JBJ Global Real Estate</T> 👋
          </h4>
          <p className="text-zinc-600 text-sm"><T>Your premium Real Estate partner in Dubai</T></p>
        </div>

        <div className="space-y-3">
          {/* Chat with Team Option - ACTIVE COLOR */}
          <button
            onClick={onStartChat}
            className="w-full p-4 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 hover:border-gold rounded-xl text-left transition-all duration-300 group shadow-md shadow-gold/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white border border-gold/30 flex items-center justify-center shadow-sm">
                <MessageCircle className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                <h5 className="text-black text-sm font-semibold mb-1">💬 <T>Chat with our team</T></h5>
                <p className="text-gold text-xs font-medium">⚡ <T>Quick answers • Available 24/7</T></p>
                <p className="text-zinc-600 text-xs mt-1"><T>One of our realty members will assist you</T></p>
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
            className="w-full p-4 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 hover:border-gold rounded-xl text-left transition-all duration-300 group block shadow-md shadow-gold/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white border border-gold/30 flex items-center justify-center shadow-sm">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h5 className="text-green-600 text-sm font-semibold mb-1">📱 <T>Talk Directly with Our Team</T></h5>
                <p className="text-gold text-xs font-medium">⚡ <T>Instant response • WhatsApp</T></p>
                <p className="text-zinc-600 text-xs mt-1">
                  <T>For urgent matters or personalized consultation</T>
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Tip at bottom - Black text on light bg - visible on mobile with mb-safe */}
      <div className="text-center mt-2 mb-4 sm:mb-2 px-4 py-2 bg-white/80 rounded-lg border border-gold/30">
        <p className="text-xs flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          <span className="text-gold">💡</span>
          <span className="text-black font-semibold"><T>Tip:</T></span>
          <span className="text-zinc-700"><T>Our team can answer most questions right away. For complex matters, we'll connect you to a specialist!</T></span>
        </p>
      </div>
    </div>
  );
};

export default ChatWelcome;
