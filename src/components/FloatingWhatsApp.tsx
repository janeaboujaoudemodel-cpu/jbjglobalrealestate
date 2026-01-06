import { MessageCircle } from "lucide-react";
import { getWhatsAppUrl } from "@/constants/stats";

const FloatingWhatsApp = () => {
  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="font-medium text-sm hidden sm:inline group-hover:inline">
        Chat with us
      </span>
    </a>
  );
};

export default FloatingWhatsApp;
