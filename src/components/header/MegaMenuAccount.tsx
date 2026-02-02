import React from 'react';
import { Link } from 'react-router-dom';
import { User, Heart, Sparkles, Briefcase, Users, FolderOpen, Monitor, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface MegaMenuAccountProps {
  onClose: () => void;
}

const MegaMenuAccount = React.forwardRef<HTMLDivElement, MegaMenuAccountProps>(({ onClose }, ref) => {
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useLanguage();
  
  const { data: crmProfile } = useQuery({
    queryKey: ['crm-profile-account-menu', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('crm_users_profile')
        .select('crm_role, is_active, display_name, photo_url, job_title')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const hasCRMAccess = crmProfile?.is_active && 
    ['owner_admin', 'broker_member', 'sales_director', 'admin', 'founder'].includes(crmProfile?.crm_role || '');

  const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const accountDisplayName =
    (crmProfile as any)?.display_name ||
    (typeof userMeta.full_name === "string" ? userMeta.full_name : null) ||
    (typeof userMeta.name === "string" ? userMeta.name : null) ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "My Account";
  const accountPhotoUrl =
    (crmProfile as any)?.photo_url ||
    (typeof (userMeta as any).avatar_url === "string" ? (userMeta as any).avatar_url : null) ||
    (typeof (userMeta as any).picture === "string" ? (userMeta as any).picture : null) ||
    null;

  const authHref = '/auth';

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  const accountLinks = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/favorites', label: 'Favorites', icon: Heart },
  ];

  const adminLinks = [
    { href: '/founder-assistant', label: 'My Assistant', icon: Sparkles },
    { href: '/employee-hub', label: 'Employee Hub', icon: Briefcase },
    { href: '/hr-dashboard', label: 'HR Hub', icon: Users },
    { href: '/listing-admin', label: 'Listing Admin', icon: FolderOpen },
    { href: '/it-department', label: 'IT Department', icon: Monitor },
  ];

  return (
    <div
      ref={ref}
      className={cn(
        "relative z-[9999] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden w-[380px]",
      )}
      style={{
        background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)',
        // Prevent bottom cropping on shorter viewports by enabling internal scroll.
        maxHeight: 'calc(100vh - var(--header-height, 128px) - 24px)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}
    >
      <div className="absolute inset-0 rounded-xl border-2 border-gold/40 pointer-events-none" />
      
      <div className="px-6 py-6">
        {user ? (
          <>
            <div className="flex items-center gap-4 pb-4 border-b border-gold/30 mb-4">
              <Avatar className="h-14 w-14 border-2 border-gold/50 shadow-lg">
                <AvatarImage src={accountPhotoUrl ?? ""} alt={`${accountDisplayName} profile photo`} />
                <AvatarFallback className="bg-black text-gold text-lg font-bold">
                  {String(accountDisplayName).split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-black font-bold text-base truncate">{accountDisplayName}</p>
                <p className="text-black/60 text-sm truncate">{user.email}</p>
                <Link to="/profile" onClick={onClose} className="text-gold text-xs font-medium hover:underline mt-1 inline-block">
                  Edit Profile & Photo
                </Link>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8] group"
                >
                  <div className="w-8 h-8 rounded-lg bg-black border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                    <link.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="text-black font-medium text-sm group-hover:text-gold transition-colors">{link.label}</span>
                </Link>
              ))}
            </div>

            {(isAdmin || hasCRMAccess) && (
              <>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent my-3" />
                <p className="text-[10px] uppercase tracking-wider text-gold font-medium px-3 py-1.5">Admin Shortcuts</p>
                <div className="space-y-1">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={onClose}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8] group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-black border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                        <link.icon className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-black font-medium text-sm group-hover:text-gold transition-colors">{link.label}</span>
                    </Link>
                  ))}
                  {hasCRMAccess && (
                    <Link to="/crm" onClick={onClose} className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8] group">
                      <div className="w-8 h-8 rounded-lg bg-black border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                        <Users className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-black font-medium text-sm group-hover:text-gold transition-colors">{t('nav.crm') || 'CRM Dashboard'}</span>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={onClose} className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8] group">
                      <div className="w-8 h-8 rounded-lg bg-black border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                        <Settings className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-black font-medium text-sm group-hover:text-gold transition-colors">Admin Panel</span>
                    </Link>
                  )}
                </div>
              </>
            )}

            <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent my-3" />
            <button onClick={handleSignOut} className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8] group w-full">
              <div className="w-8 h-8 rounded-lg bg-champagne border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                <LogOut className="w-4 h-4 text-black" />
              </div>
              <span className="text-black font-medium text-sm">{t('nav.signOut')}</span>
            </button>
          </>
        ) : (
          <>
            <div className="pb-4 border-b border-gold/30 mb-4">
              <p className="text-gold font-bold text-base tracking-wide">{t('nav.myAccount')}</p>
              <p className="text-black/70 text-sm mt-1">Sign in to access your account</p>
            </div>
            <Link
              to={authHref}
              onClick={onClose}
              className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 bg-gradient-to-r from-gold/20 via-gold/15 to-gold/20 hover:from-gold/30 hover:via-gold/25 hover:to-gold/30 shadow-[0_4px_15px_rgba(200,167,102,0.25)] border border-gold/40 group"
            >
              <div className="w-10 h-10 rounded-lg bg-black border border-gold/60 flex items-center justify-center">
                <User className="w-5 h-5 text-gold" />
              </div>
              <span className="text-gold font-semibold text-sm">Sign In / Create Account</span>
            </Link>
          </>
        )}
      </div>
      
      <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
    </div>
  );
});

MegaMenuAccount.displayName = 'MegaMenuAccount';

export default MegaMenuAccount;
