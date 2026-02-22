import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Heart, Sparkles, Users, FolderOpen, LogOut, ChevronRight, LayoutDashboard, Shield, Headphones, Loader2, Bell, DollarSign, Ruler } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MegaMenuShell, MegaMenuSectionDivider } from './mega-menu-primitives';
import { Skeleton } from '@/components/ui/skeleton';
import ModeSwitcher from '@/components/ModeSwitcher';
import { useTierProgress } from '@/hooks/useTierProgress';
import { useUserModeContext } from '@/contexts/UserModeContext';
import { SUPPORTED_CURRENCIES } from '@/components/CurrencySwitcher';
import { cn } from '@/lib/utils';

interface MegaMenuAccountProps {
  onClose: () => void;
}

const MegaMenuAccount = React.forwardRef<HTMLDivElement, MegaMenuAccountProps>(({ onClose }, ref) => {
  // IMPORTANT: Get ownerLoading from AuthContext to handle owner verification timing
  const { user, isOwner, ownerLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const { tierProgress, isCombinedMode, investorTierProgress, brokerTierProgress } = useTierProgress();
  const { mode } = useUserModeContext();

  // Currency & unit state synced with localStorage
  const [activeCurrency, setActiveCurrency] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('jj_currency') || 'AED' : 'AED'
  );
  const [areaUnit, setAreaUnit] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('jj_area_unit') || 'sqft' : 'sqft'
  );

  useEffect(() => {
    const onCurrency = (e: Event) => setActiveCurrency((e as CustomEvent).detail);
    const onUnit = (e: Event) => setAreaUnit((e as CustomEvent).detail);
    window.addEventListener('currencyChange', onCurrency);
    window.addEventListener('areaUnitChange', onUnit);
    return () => {
      window.removeEventListener('currencyChange', onCurrency);
      window.removeEventListener('areaUnitChange', onUnit);
    };
  }, []);

  const handleCurrencyChange = (code: string) => {
    setActiveCurrency(code);
    localStorage.setItem('jj_currency', code);
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: code }));
  };

  const handleAreaUnitChange = (unit: string) => {
    setAreaUnit(unit);
    localStorage.setItem('jj_area_unit', unit);
    window.dispatchEvent(new CustomEvent('areaUnitChange', { detail: unit }));
  };
  
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

  // Extract first and last name for display
  const firstName = useMemo(() => {
    const fn = userMeta.first_name as string | null;
    if (fn) return fn;
    // Fallback: first word of full_name
    const fullName = String(accountDisplayName);
    return fullName.split(' ')[0] || fullName;
  }, [userMeta.first_name, accountDisplayName]);

  const lastName = useMemo(() => {
    const ln = userMeta.last_name as string | null;
    if (ln) return ln;
    // Fallback: rest of full_name
    const fullName = String(accountDisplayName);
    const parts = fullName.split(' ');
    return parts.slice(1).join(' ') || '';
  }, [userMeta.last_name, accountDisplayName]);
  
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
    { href: '/my-dashboard', label: t('account.myDashboard', 'My Dashboard'), icon: LayoutDashboard, description: t('account.myDashboardDesc', 'Your personalized dashboard') },
    { href: '/my-dashboard#notifications', label: t('account.notifications', 'Notification Inbox'), icon: Bell, description: t('account.notificationsDesc', 'View your notifications') },
    { href: '/profile', label: t('account.myProfile', 'My Profile'), icon: User, description: t('account.myProfileDesc', 'View and edit your profile') },
    { href: '/favorites', label: t('nav.favorites', 'Favorites'), icon: Heart, description: t('account.favoritesDesc', 'Your saved properties') },
    { href: '/toolkit', label: t('account.aiTools', 'AI Tools'), icon: Sparkles, description: t('account.aiToolsDesc', 'Professional AI-powered tools') },
  ];

  // Filter admin links based on actual access - consolidated shortcuts
  const adminLinks = useMemo(() => {
    const links = [
      { href: '/founder-assistant', label: t('account.myAssistant', 'My Assistant'), icon: Sparkles, requiresAdmin: true },
      { href: '/listing-admin', label: t('account.listingAdmin', 'Listing Admin'), icon: FolderOpen, requiresListingAdmin: true },
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
      case 'broker': return t('account.modeBroker', 'Broker');
      case 'investor_broker': return t('account.modeInvestorBroker', 'Investor + Broker');
      default: return t('account.modeInvestor', 'Investor');
    }
  };

  // Unified loading: show skeleton until ALL critical queries resolve
  const isDataLoading = ownerLoading || crmLoading;

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
              {/* Fixed-size avatar container - clickable to profile */}
              <Link to="/profile" onClick={onClose} className="w-16 h-16 flex-shrink-0 cursor-pointer group">
                <Avatar className="h-16 w-16 border border-gold bg-transparent group-hover:border-gold/80 transition-all group-hover:ring-2 group-hover:ring-gold/30">
                  <AvatarImage src={accountPhotoUrl ?? ""} alt={`${accountDisplayName} profile photo`} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold text-black text-xl font-bold">
                    {avatarInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <Link to="/profile" onClick={onClose} className="block hover:text-gold transition-colors">
                  <p className="text-black font-bold text-lg truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {accountDisplayName}
                  </p>
                </Link>
                <p className="text-black/60 text-sm truncate">{user.email}</p>
                {/* Show mode + tier badges + points */}
                {isCombinedMode && investorTierProgress && brokerTierProgress ? (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Badge className="text-xs font-semibold bg-emerald-500/20 text-emerald-600 border-emerald-500/40">
                      {investorTierProgress.currentTier?.tier_name || 'Explorer'}
                    </Badge>
                    <Badge className="text-xs font-semibold bg-blue-500/20 text-blue-600 border-blue-500/40">
                      {brokerTierProgress.currentTier?.tier_name || 'Starter'}
                    </Badge>
                    <span className="text-xs text-black/60">
                      • {tierProgress?.totalPoints?.toLocaleString() || 0} pts
                    </span>
                  </div>
                ) : (
                  <Badge 
                    className="mt-1.5 text-xs font-semibold border-gold/40 bg-gold/10 text-gold"
                  >
                    {getModeLabel()} • {tierProgress?.totalPoints?.toLocaleString() || 0} pts earned
                  </Badge>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {/* Mode selector card */}
                <div 
                  className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border border-gold/30 bg-gradient-to-br from-[#FDFBF7]/10 via-[#F5F0E6]/5 to-[#EDE4D3]/10"
                  onClick={(e) => e.stopPropagation()} 
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <p className="text-[10px] text-gold font-semibold uppercase tracking-wider">
                    {t('account.selectYourMode', 'Select your mode')}
                  </p>
                  <ModeSwitcher variant="header" />
                </div>
                {/* Edit Profile with more spacing below mode switcher */}
                <Link 
                  to="/profile" 
                  onClick={onClose} 
                  className="flex items-center gap-1.5 text-gold text-sm font-semibold hover:underline transition-colors mt-4"
                >
                  {t('account.editProfile', 'Edit Profile')}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Section Headers Row - Full Width */}
            <div className="grid grid-cols-2 gap-6 mb-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold px-2 py-1.5">
                {t('account.yourAccount', 'Your Account')}
              </p>
              {/* LOCK: Owner shortcuts header - Always reserve space for Owner Shortcuts column when verifying or when owner has access */}
              {(ownerLoading || isOwner || hasCRMAccess || hasListingAdminAccess) && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold px-2 py-1.5">
                  {t('account.ownerShortcuts', 'Owner Shortcuts')}
                </p>
              )}
            </div>

            {/* Full-width divider under headers */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-4" />

            {/* Two-Column Layout for Links */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Account Links */}
              <div>
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

                {/* Currency & Unit Settings */}
                <div className="mt-4 pt-4 border-t border-gold/30">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold px-2 mb-2">
                    {t('account.preferences', 'Preferences')}
                  </p>
                  {/* Currency */}
                  <div className="px-2 mb-3">
                    <p className="text-xs font-semibold text-black/50 mb-1.5 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Currency</p>
                    <div className="grid grid-cols-5 gap-1">
                      {SUPPORTED_CURRENCIES.map((cur) => (
                        <button
                          key={cur.code}
                          onClick={(e) => { e.stopPropagation(); handleCurrencyChange(cur.code); }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className={cn(
                            "py-1.5 rounded-lg text-[10px] font-medium transition-colors text-center",
                            activeCurrency === cur.code
                              ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C8A766]/60 shadow-sm"
                              : "bg-champagne-light text-black hover:bg-champagne"
                          )}
                        >
                          {cur.code}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Area Unit */}
                  <div className="px-2 mb-3">
                    <p className="text-xs font-semibold text-black/50 mb-1.5 flex items-center gap-1"><Ruler className="w-3 h-3" /> Area Unit</p>
                    <div className="flex gap-2">
                      {(['sqft', 'sqm'] as const).map((unit) => (
                        <button
                          key={unit}
                          onClick={(e) => { e.stopPropagation(); handleAreaUnitChange(unit); }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            areaUnit === unit
                              ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C8A766]/60 shadow-sm"
                              : "bg-champagne-light text-black hover:bg-champagne"
                          )}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <div className="mt-2 pt-3 border-t border-gold/30">
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

              {/* Right Column - Owner Links (LOCKED: Always show during loading or when owner has access) */}
              <div>
              {/* Show skeleton while verifying owner status to prevent layout shift */}
              {isDataLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              )}
              
              {/* LOCK: Do not remove owner shortcuts - Show when owner verified */}
              {!isDataLoading && (isOwner || hasCRMAccess || hasListingAdminAccess) && adminLinks.length > 0 && (
                  <>
                    <div className="space-y-1">
                      {/* Owner Dashboard - Primary Link */}
                      {isOwner && (
                        <Link 
                          to="/owner" 
                          onClick={onClose} 
                          className="flex items-center gap-2.5 py-2.5 px-2 rounded-xl transition-all duration-300 bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/40 hover:border-gold group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gold/20 border-2 border-gold/60 flex items-center justify-center group-hover:bg-gold/30 transition-colors">
                            <LayoutDashboard className="w-5 h-5 text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-black font-bold text-sm group-hover:text-gold transition-colors block">
                              {t('account.ownerDashboard', 'Owner Dashboard')}
                            </span>
                            <span className="text-black/50 text-[10px]">{t('account.commandCenter', 'Command Center')}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gold" />
                        </Link>
                      )}
                      {/* Admin Panel - Second Primary Link (Consolidated Hub) */}
                      {isOwner && (
                        <Link 
                          to="/admin" 
                          onClick={onClose} 
                          className="flex items-center gap-2.5 py-2 px-2 rounded-xl transition-all duration-300 bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/30 hover:border-purple-500/60 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border-2 border-purple-500/40 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                            <Shield className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-black font-semibold text-xs group-hover:text-purple-600 transition-colors block">
                              {t('account.adminPanel', 'Admin Panel')}
                            </span>
                            <span className="text-black/50 text-[10px]">{t('account.adminPanelDesc', 'HR, IT, Support, All')}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
                        </Link>
                      )}
                      {/* Customer Happiness Hub - Direct Admin Access */}
                      {isOwner && (
                        <Link 
                          to="/admin?tab=customer-happiness" 
                          onClick={onClose} 
                          className="flex items-center gap-2.5 py-2 px-2 rounded-xl transition-all duration-300 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 hover:border-emerald-500/60 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <Headphones className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-black font-semibold text-xs group-hover:text-emerald-600 transition-colors block">
                              {t('account.customerHappiness', 'Customer Happiness Hub')}
                            </span>
                            <span className="text-black/50 text-[10px]">{t('account.customerHappinessDesc', 'Reviews, Tickets & Ideas')}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                        </Link>
                      )}
                      {/* Other Admin Links */}
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
                {t('account.signInPrompt', 'Sign in to access your account and saved properties')}
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
                <span className="text-gold font-bold text-base block">{t('account.signInCreate', 'Sign In / Create Account')}</span>
                <span className="text-black/60 text-xs">{t('account.accessExclusive', 'Access exclusive features')}</span>
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
