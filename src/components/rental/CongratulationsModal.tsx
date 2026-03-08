/**
 * CONGRATULATIONS MODAL
 * Premium celebration modal when a rental listing is fully approved and goes live
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, ExternalLink, Home, Sparkles, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingTitle: string;
  listingId: string;
}

export function CongratulationsModal({
  isOpen,
  onClose,
  listingTitle,
  listingId,
}: CongratulationsModalProps) {
  const navigate = useNavigate();

  const handleViewListing = () => {
    navigate(`/properties/rentals/${listingId}`);
    onClose();
  };

  const handleGoToDashboard = () => {
    navigate('/my-account?tab=rentals');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-gold/10 dark:from-green-950/20 dark:via-zinc-900 dark:to-gold/5" />
        
        {/* Confetti Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: -20, 
                x: Math.random() * 400, 
                opacity: 1,
                rotate: 0 
              }}
              animate={{ 
                y: 500, 
                rotate: 360,
                opacity: 0 
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 0.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className={cn(
                'absolute w-2 h-2 rounded-full',
                i % 4 === 0 ? 'bg-gold' :
                i % 4 === 1 ? 'bg-green-500' :
                i % 4 === 2 ? 'bg-champagne' :
                'bg-amber-400'
              )}
            />
          ))}
        </div>

        <div className="relative z-10 p-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-champagne flex items-center justify-center shadow-xl"
            >
              <PartyPopper className="h-10 w-10 text-black" />
            </motion.div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-2 mb-6"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gold via-amber-500 to-champagne bg-clip-text text-transparent">
                Congratulations!
              </h2>
              <Sparkles className="h-5 w-5 text-gold" />
            </div>
            <p className="text-muted-foreground">
              Your listing is now live on JBJ Global Real Estate
            </p>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400 mb-1">
                  Your Listing Application Has Been Approved!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-500">
                  <strong>"{listingTitle}"</strong> has been approved by our team and is now visible to potential tenants across the UAE.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Approval Steps Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 mb-6"
          >
            <h4 className="text-sm font-medium text-muted-foreground">Approval Journey</h4>
            <div className="flex items-center justify-between">
              {[
                { step: 'Admin', icon: '✓' },
                { step: 'Executive', icon: '✓' },
                { step: 'CEO', icon: '✓' },
                { step: 'Live', icon: '✓' },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                      {item.icon}
                    </div>
                    <span className="text-xs mt-1 text-muted-foreground">{item.step}</span>
                  </div>
                  {index < 3 && (
                    <div className="w-8 h-0.5 bg-green-500 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={handleViewListing}
              className="w-full bg-gradient-to-r from-gold to-champagne text-black hover:opacity-90 h-12"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View My Listing
            </Button>
            <Button
              variant="outline"
              onClick={handleGoToDashboard}
              className="w-full h-12"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </motion.div>

          {/* Footer Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-muted-foreground mt-4"
          >
            You can manage your listing anytime from your dashboard
          </motion.p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CongratulationsModal;
