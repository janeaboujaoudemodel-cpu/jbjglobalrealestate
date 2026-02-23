import React, { useState } from 'react';
import { Command, Bell, Sparkles, Search, Home, Settings, LogOut, ChevronDown, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandPalette, useCommandPalette } from './command-palette';
import { SmartNotifications, NotificationBell } from './smart-notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Premium Backend Header - Unified header for all backend interfaces
 * Includes Command Palette trigger, Smart Notifications, and AI indicators
 */

interface PremiumBackendHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  showUserMenu?: boolean;
  backTo?: string;
  backLabel?: string;
}

export const PremiumBackendHeader: React.FC<PremiumBackendHeaderProps> = ({
  title,
  subtitle,
  children,
  className,
  showUserMenu = true,
  backTo,
  backLabel = 'Back'
}) => {
  const commandPalette = useCommandPalette();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      <header className={cn(
        'sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gold/15',
        'shadow-[0_2px_10px_rgba(200,167,102,0.05)]',
        className
      )}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title Section */}
            <div className="flex items-center gap-4">
              {backTo && (
                <button
                  onClick={() => navigate(backTo)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 hover:text-gold transition-colors rounded-lg hover:bg-gold/5"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">{backLabel}</span>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-black">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {children}
              
              {/* Search/Command Button */}
              <button
                onClick={commandPalette.open}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gold/20 rounded-xl text-zinc-500 hover:text-gold hover:border-gold/40 transition-all shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Search...</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-100 rounded text-xs font-medium">
                  <Command className="w-3 h-3" />K
                </kbd>
              </button>

              {/* AI Indicator */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/30 rounded-xl">
                <Sparkles className="w-4 h-4 text-gold animate-pulse" />
                <span className="text-xs text-gold font-semibold">AI Active</span>
              </div>

              {/* Notifications */}
              <NotificationBell 
                count={3} 
                onClick={() => setNotificationsOpen(true)} 
              />

              {/* User Menu */}
              {showUserMenu && user && (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-gold/20 rounded-xl hover:border-gold/40 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                      <User className="w-4 h-4 text-gold" />
                    </div>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-zinc-400 transition-transform",
                      userMenuOpen && "rotate-180"
                    )} />
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-gold/20 rounded-xl shadow-lg shadow-gold/10 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gold/10">
                        <p className="text-sm font-medium text-black truncate">{user.email}</p>
                        <p className="text-xs text-zinc-500">Logged in</p>
                      </div>
                      <button
                        onClick={() => navigate('/my-dashboard#tasks')}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:text-gold hover:bg-gold/5 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        My Tasks
                      </button>
                      <button
                        onClick={() => navigate('/broker-account')}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:text-gold hover:bg-gold/5 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Account Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
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
