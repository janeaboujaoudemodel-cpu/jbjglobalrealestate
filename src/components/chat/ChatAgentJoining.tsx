import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Loader2 } from 'lucide-react';
import { T } from '@/components/ui/T';

interface Agent {
  name: string;
  fullName: string;
  title: string;
  photo: string;
}

interface ChatAgentJoiningProps {
  agent: Agent;
  userFirstName: string;
  onAgentReady: () => void;
}

const ChatAgentJoining = ({ agent, userFirstName, onAgentReady }: ChatAgentJoiningProps) => {
  const [stage, setStage] = useState<'connecting' | 'joined' | 'ready'>('connecting');

  useEffect(() => {
    // Simulate agent joining process
    const connectTimer = setTimeout(() => setStage('joined'), 1500);
    const readyTimer = setTimeout(() => {
      setStage('ready');
      setTimeout(onAgentReady, 800);
    }, 3000);

    return () => {
      clearTimeout(connectTimer);
      clearTimeout(readyTimer);
    };
  }, [onAgentReady]);

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        {/* Company Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h3 className="text-gold text-lg font-semibold">JBJ GLOBAL REAL ESTATE</h3>
          <p className="text-zinc-400 text-sm"><T>Chat Support</T></p>
        </motion.div>

        {/* Status Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <AnimatePresence mode="wait">
            {stage === 'connecting' && (
              <motion.p
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-black/70 text-sm"
              >
                <T>Connecting you to one of our realty members...</T>
              </motion.p>
            )}
            {stage === 'joined' && (
              <motion.p
                key="joined"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-emerald-400 text-sm font-medium"
              >
                <T>{`${agent.name} has joined your chat`}</T>
              </motion.p>
            )}
            {stage === 'ready' && (
              <motion.p
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gold text-sm font-medium"
              >
                <T>Starting conversation...</T>
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Agent Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          {/* Agent Photo */}
          <div className="relative">
            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${
              stage === 'connecting' ? 'border-gold/30' : 'border-gold'
            } transition-colors duration-500 shadow-xl`}>
              <img 
                src={agent.photo} 
                alt={agent.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center ${
              stage === 'connecting' ? 'bg-gold/20' : 'bg-emerald-500'
            } transition-colors duration-500 border-2 border-gold/40`}>
              {stage === 'connecting' ? (
                <Loader2 className="w-4 h-4 text-black/60 animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </div>

          {/* Agent Info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-4"
          >
            <h4 className="text-black font-semibold text-lg">{agent.fullName}</h4>
            <p className="text-gold text-sm">{agent.title}</p>
          </motion.div>
        </motion.div>

        {/* Typing Indicator */}
        {stage !== 'connecting' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex items-center gap-2"
          >
            <span className="text-black/60 text-sm"><T>{`${agent.name} is typing`}</T></span>
            <div className="flex gap-1">
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                className="w-1.5 h-1.5 bg-gold rounded-full"
              />
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-gold rounded-full"
              />
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-gold rounded-full"
              />
            </div>
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatAgentJoining;