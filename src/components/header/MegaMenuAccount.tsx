import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { User, Heart, Sparkles, Briefcase, Users, FolderOpen, Monitor, Settings, LogOut, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MegaMenuShell, MegaMenuSectionDivider } from './mega-menu-primitives';
import ModeSwitcher from '@/components/ModeSwitcher';
import { useTierProgress } from '@/hooks/useTierProgress';
import { useUserModeContext } from '@/contexts/UserModeContext';

interface MegaMenuAccountProps {
  onClose: () => void;
}

const MegaMenuAccount = React.forwardRef<HTMLDivElement, MegaMenuAccountProps>(({ onClose }, ref) => {
  const { user, isOwner, signOut } = useAuth();
  const { t } = useLanguage();
  const { tierProgress } = useTierProgress();
  const { mode } = useUserModeContext();
  
  const { data: crmProfile, isLoading: crmLoading } = useQuery({
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
    staleTime: 60000, // Cache for 1 minute to prevent flicker
  });

  // Check if user has listing manager access (owner, admin role, or in listing_admins table)
  const { data: hasListingAdminAccess } = useQuery({
    queryKey: ['listing-admin-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // Check roles in parallel
      const [ownerResult, adminResult, listingAdminResult] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "owner" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase
          .from("listing_admins")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle(),
      ]);

      return ownerResult.data === true || adminResult.data === true || !!listingAdminResult.data;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const hasCRMAccess = crmProfile?.is_active && 
    ['owner_admin', 'broker_member', 'sales_director', 'admin', 'founder'].includes(crmProfile?.crm_role || '');

  const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  
  // Use STABLE fallback immediately from user_metadata (available sync)
  // Only use CRM profile if it's already loaded to prevent flicker
  const stableDisplayName = useMemo(() => {
    const metaName = (typeof userMeta.full_name === "string" ? userMeta.full_name : null) ||
                     (typeof userMeta.name === "string" ? userMeta.name : null) ||
                     (user?.email ? user.email.split("@")[0] : null) ||
                     "My Account";
    return metaName;
  }, [userMeta.full_name, userMeta.name, user?.email]);

  // Only update display name from CRM if loaded and different
  const accountDisplayName = useMemo(() => {
    if (!crmLoading && (crmProfile as any)?.display_name) {
      return (crmProfile as any).display_name;
    }
    return stableDisplayName;
  }, [crmProfile, crmLoading, stableDisplayName]);
  
  const accountPhotoUrl = useMemo(() => {
    // Prioritize immediate user_metadata, then CRM if loaded
    const metaPhoto = (typeof (userMeta as any).avatar_url === "string" ? (userMeta as any).avatar_url : null) ||
                      (typeof (userMeta as any).picture === "string" ? (userMeta as any).picture : null);
    if (!crmLoading && (crmProfile as any)?.photo_url) {
      return (crmProfile as any).photo_url;
    }
    return metaPhoto;
  }, [crmProfile, crmLoading, userMeta]);

  // Compute initials from STABLE name to prevent JB→J flicker
  const avatarInitials = useMemo(() => {
    // Always use the stable name for initials to prevent flicker
    const name = String(stableDisplayName);
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, [stableDisplayName]);

  const authHref = '/auth';

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  const accountLinks = [
    { href: '/my-dashboard', label: 'My Dashboard', icon: LayoutDashboard, description: 'Your personalized dashboard' },
    { href: '/profile', label: 'My Profile', icon: User, description: 'View and edit your profile' },
    { href: '/favorites', label: 'Favorites', icon: Heart, description: 'Your saved properties' },
  ];

  // Filter admin links based on actual access
  const adminLinks = useMemo(() => {
    const links = [
      { href: '/founder-assistant', label: 'My Assistant', icon: Sparkles, requiresAdmin: true },
      { href: '/employee-hub', label: 'Employee Hub', icon: Briefcase, requiresAdmin: true },
      { href: '/hr-dashboard', label: 'HR Hub', icon: Users, requiresAdmin: true },
      { href: '/listing-admin', label: 'Listing Admin', icon: FolderOpen, requiresListingAdmin: true },
      { href: '/it-department', label: 'IT Department', icon: Monitor, requiresAdmin: true },
    ];
    
    return links.filter(link => {
      if (link.requiresListingAdmin) {
        return hasListingAdminAccess;
      }
      return isOwner || hasCRMAccess;
    });
  }, [isOwner, hasCRMAccess, hasListingAdminAccess]);

  // Get mode label for display
  const getModeLabel = () => {
    switch (mode) {
      case 'broker': return 'Broker';
      case 'investor_broker': return 'Investor + Broker';
      default: return 'Investor';
    }
  };

  return (
    <MegaMenuShell 
      ref={ref}
      className="!left-auto !right-6 !w-[640px]"
      noScroll
      style={{ minHeight: '440px' }}
    >
      {/* Fixed dimensions container to prevent layout shift */}
      <div className="p-6" style={{ minHeight: '420px', minWidth: '600px' }}>
        {user ? (
          <>
            {/* Premium User Header - Horizontal Layout */}
            <div className="flex items-center gap-5 pb-5 mb-5 border-b-2 border-gold/40">
              {/* Fixed-size avatar container to prevent layout shift */}
              <div className="w-16 h-16 flex-shrink-0">
                <Avatar className="h-16 w-16 border-2 border-gold/60">
                  <AvatarImage src={accountPhotoUrl ?? ""} alt={`${accountDisplayName} profile photo`} className="object-cover" />
                  <AvatarFallback className="bg-transparent border-2 border-gold text-gold text-xl font-bold">
                    {avatarInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-black font-bold text-lg truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {accountDisplayName}
                </p>
                <p className="text-black/60 text-sm truncate">{user.email}</p>
                {/* Show mode + points instead of tier name */}
                <Badge 
                  className="mt-1.5 text-xs font-semibold border-gold/40 bg-gold/10 text-gold"
                >
                  {getModeLabel()} • {tierProgress?.totalPoints?.toLocaleString() || 0} pts earned
                </Badge>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <ModeSwitcher variant="header" />
                <Link 
                  to="/profile" 
                  onClick={onClose} 
                  className="flex items-center gap-1.5 text-gold text-sm font-semibold hover:underline transition-colors"
                >
                  Edit Profile
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Two-Column Layout for Links */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Account Links */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold px-2 py-1.5 mb-2">
                  Your Account
                </p>
                <div className="space-y-1">
                  {accountLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={onClose}
                      className="flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-gold/15 hover:to-gold/5 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-transparent border-2 border-gold/40 flex items-center justify-center group-hover:border-gold group-hover:bg-gold/10 transition-colors">
                        <link.icon className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-black font-semibold text-sm group-hover:text-gold transition-colors block">
                          {link.label}
                        </span>
                        {link.description && (
                          <span className="text-black/50 text-xs truncate block">
                            {link.description}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Sign Out Button */}
                <div className="mt-4 pt-4 border-t border-gold/30">
                  <button 
                    onClick={handleSignOut} 
                    className="flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-500/5 group w-full"
                  >
                    <div className="w-9 h-9 rounded-lg bg-transparent border-2 border-red-500/30 flex items-center justify-center group-hover:border-red-500 group-hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4 text-red-600 group-hover:text-red-500" />
                    </div>
                    <span className="text-black font-semibold text-sm group-hover:text-red-600 transition-colors">
                      {t('nav.signOut')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Column - Owner Links (only show if user has Owner access) */}
              <div>
                {(isOwner || hasCRMAccess || hasListingAdminAccess) && adminLinks.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold px-2 py-1.5 mb-2">
                      Owner Shortcuts
                    </p>
                    <div className="space-y-1">
                      {adminLinks.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={onClose}
                          className="flex items-center gap-2.5 py-2 px-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-gold/15 hover:to-gold/5 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-transparent border-2 border-gold/30 flex items-center justify-center group-hover:border-gold group-hover:bg-gold/10 transition-colors">
                            <link.icon className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                          </div>
                          <span className="text-black font-medium text-xs group-hover:text-gold transition-colors truncate">
                            {link.label}
                          </span>
                        </Link>
                      ))}
                      {hasCRMAccess && (
                        <Link 
                          to="/crm" 
                          onClick={onClose} 
                          className="flex items-center gap-2.5 py-2 px-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-gold/15 hover:to-gold/5 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-transparent border-2 border-gold/30 flex items-center justify-center group-hover:border-gold group-hover:bg-gold/10 transition-colors">
                            <Users className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                          </div>
                          <span className="text-black font-medium text-xs group-hover:text-gold transition-colors truncate">
                            {t('nav.crm') || 'CRM Dashboard'}
                          </span>
                        </Link>
                      )}
                      {isOwner && (
                        <Link 
                          to="/admin" 
                          onClick={onClose} 
                          className="flex items-center gap-2.5 py-2 px-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-gold/15 hover:to-gold/5 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-transparent border-2 border-gold/30 flex items-center justify-center group-hover:border-gold group-hover:bg-gold/10 transition-colors">
                            <Settings className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                          </div>
                          <span className="text-black font-medium text-xs group-hover:text-gold transition-colors truncate">
                            Owner Panel
                          </span>
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Logged Out State */
          <>
            <div className="pb-5 mb-5 border-b-2 border-gold/40">
              <p className="text-black font-bold text-xl tracking-wide" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {t('nav.myAccount')}
              </p>
              <p className="text-black/60 text-sm mt-2">
                Sign in to access your account and saved properties
              </p>
            </div>
            <Link
              to={authHref}
              onClick={onClose}
              className="flex items-center gap-4 py-4 px-5 rounded-xl transition-all duration-300 bg-gradient-to-r from-gold/20 via-gold/15 to-gold/20 hover:from-gold/30 hover:via-gold/25 hover:to-gold/30 shadow-[0_6px_20px_rgba(200,167,102,0.3)] border-2 border-gold/50 hover:border-gold group"
            >
              <div className="w-14 h-14 rounded-xl bg-black border-2 border-gold/60 flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-gold" />
              </div>
              <div className="flex-1">
                <span className="text-gold font-bold text-base block">Sign In / Create Account</span>
                <span className="text-black/60 text-xs">Access exclusive features</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gold" />
            </Link>
          </>
        )}
      </div>
    </MegaMenuShell>
  );
});

MegaMenuAccount.displayName = 'MegaMenuAccount';

export default MegaMenuAccount;
