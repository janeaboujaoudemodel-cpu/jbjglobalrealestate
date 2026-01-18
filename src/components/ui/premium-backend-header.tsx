import React, { useState } from 'react';
import { Command, Bell, Sparkles, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandPalette, useCommandPalette } from './command-palette';
import { SmartNotifications, NotificationBell } from './smart-notifications';

/**
 * Premium Backend Header - Unified header for all backend interfaces
 * Includes Command Palette trigger, Smart Notifications, and AI indicators
 */

interface PremiumBackendHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PremiumBackendHeader: React.FC<PremiumBackendHeaderProps> = ({
  title,
  subtitle,
  children,
  className
}) => {
  const commandPalette = useCommandPalette();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <>
      <header className={cn(
        'sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gold/10',
        className
      )}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div>
              <h1 className="text-2xl font-bold text-black">{title}</h1>
              {subtitle && (
                <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {children}
              
              {/* Search/Command Button */}
              <button
                onClick={commandPalette.open}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-white to-[#FDFBF7] border border-gold/20 rounded-xl text-zinc-500 hover:text-gold hover:border-gold/40 transition-all"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Search...</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-100 rounded text-xs font-medium">
                  <Command className="w-3 h-3" />K
                </kbd>
              </button>

              {/* AI Indicator */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-xl">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-xs text-gold font-medium">AI Active</span>
              </div>

              {/* Notifications */}
              <NotificationBell 
                count={3} 
                onClick={() => setNotificationsOpen(true)} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />

      {/* Smart Notifications */}
      <SmartNotifications 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </>
  );
};

export default PremiumBackendHeader;
