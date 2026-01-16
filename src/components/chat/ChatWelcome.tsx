import { MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from '@/constants/stats';
import jbjMonogramDarkBg from "@/assets/jbj-monogram-dark-bg.png";

interface ChatWelcomeProps {
  onStartChat: () => void;
}

const ChatWelcome = ({ onStartChat }: ChatWelcomeProps) => {
  return (
    <div className="flex-1 p-6 flex flex-col">
      <div className="text-center mb-4 mt-2">
        <div className="mx-auto mb-3">
          {/* JBJ logo - black box version for dark backgrounds */}
          <img 
            src={jbjMonogramDarkBg} 
            alt="JBJ Global Real Estate" 
            className="h-20 w-auto mx-auto object-contain"
          />
        </div>
        <h4 className="text-white text-lg font-semibold mb-1">Welcome to JBJ Global Real Estate 👋</h4>
        <p className="text-zinc-400 text-sm">Your premium real estate partner in Dubai</p>
      </div>

      <div className="space-y-3 flex-1 flex flex-col">
        {/* Chat with Team Option - Human Team, NOT AI */}
        <button
          onClick={onStartChat}
          className="w-full p-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border border-gold/30 hover:border-gold/50 rounded-xl text-left transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-black" />
            </div>
            <div className="flex-1">
              <h5 className="text-white text-sm font-semibold mb-1">💬 Chat with our team</h5>
              <p className="text-gold text-xs font-medium">⚡ Quick answers • Available 24/7</p>
              <p className="text-zinc-400 text-xs mt-1">One of our realty members will assist you</p>
            </div>
          </div>
        </button>

        {/* WhatsApp Option */}
        <a
          href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent("Hi! I'd like to speak with someone about property in Dubai.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl text-left transition-all duration-300 group block"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h5 className="text-white text-sm font-semibold mb-1">📱 Chat on WhatsApp</h5>
              <p className="text-green-400 text-xs font-medium">Talk directly with our team</p>
              <p className="text-zinc-400 text-xs mt-1">For urgent matters or personalized consultation</p>
            </div>
          </div>
        </a>

        {/* Spacer to push tip to bottom */}
        <div className="flex-1"></div>

        <p className="text-zinc-500 text-xs text-center px-4 pb-2">
          💡 <strong className="text-zinc-400">Tip:</strong> Our team can answer most questions right away. For complex matters, we'll connect you to a specialist!
        </p>
      </div>
    </div>
  );
};

export default ChatWelcome;
