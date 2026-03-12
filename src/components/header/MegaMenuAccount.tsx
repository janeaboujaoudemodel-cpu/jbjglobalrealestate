import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Heart, Sparkles, Users, FolderOpen, LogOut, ChevronRight, LayoutDashboard, Shield, Headphones, Loader2, Bell, DollarSign, Ruler, Check, Globe, Search, Clock, ListChecks, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/contexts/LanguageContext';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { searchItems } from '@/config/globalSearchIndex';
import { useUserAlerts } from '@/hooks/useUserAlerts';

interface MegaMenuAccountProps {
  onClose: () => void;
}

const SEARCH_SHORTCUTS = [
  { path: '/my-dashboard', label: 'My Dashboard', icon: LayoutDashboard, keywords: ['dashboard', 'home'] },
  { path: '/favorites', label: 'Favorites & Shortlist', icon: Heart, keywords: ['favorites', 'shortlist', 'saved'] },
  { path: '/toolkit', label: 'AI Tools', icon: Sparkles, keywords: ['ai', 'tools', 'toolkit'] },
  { path: '/profile', label: 'My Profile', icon: User, keywords: ['profile', 'account', 'settings'] },
  { path: '/crm', label: 'CRM Dashboard', icon: Users, keywords: ['crm', 'leads', 'clients'] },
  { path: '/ai-calendar', label: 'AI Calendar & Notes', icon: Bell, keywords: ['calendar', 'notes', 'events'] },
  { path: '/support-tickets', label: 'Support Tickets', icon: Headphones, keywords: ['support', 'tickets', 'help'] },
  { path: '/market-intelligence', label: 'Market Intelligence', icon: LayoutDashboard, keywords: ['market', 'analytics', 'data'] },
  { path: '/area-guides', label: 'Area Guides', icon: Globe, keywords: ['areas', 'guides', 'locations'] },
  { path: '/owner', label: 'Owner Dashboard', icon: Shield, keywords: ['owner', 'admin', 'command'] },
];

const MegaMenuAccount = React.forwardRef<HTMLDivElement, MegaMenuAccountProps>(({ onClose }, ref) => {
  // IMPORTANT: Get ownerLoading from AuthContext to handle owner verification timing
  const { user, isOwner, ownerLoading, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { tierProgress, isCombinedMode, investorTierProgress, brokerTierProgress } = useTierProgress();
  const { mode } = useUserModeContext();
  const { data: alertCounts } = useUserAlerts();

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

  const navigate = useNavigate();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchTab, setSearchTab] = useState<'search' | 'recent'>('search');
  const [searchQuery, setSearchQuery] = useState('');

  // Recently viewed pages from localStorage
  const recentlyViewed = useMemo(() => {
    try {
      const stored = localStorage.getItem('jj_recent_pages');
      return stored ? (JSON.parse(stored) as Array<{ path: string; title: string; timestamp: number }>).slice(0, 6) : [];
    } catch { return []; }
  }, []);

  const quickSearchResults = useMemo(() => {
    const q = searchQuery.trim();

    if (!q) return SEARCH_SHORTCUTS.slice(0, 10);

    const dynamic = searchItems(q, {
      isOwner,
      hasCRMAccess: !!hasCRMAccess,
      hasListingAdminAccess: !!hasListingAdminAccess,
      isBroker: false,
      isAuthenticated: !!user,
      limit: 20,
    }).map((item) => ({
      path: item.route,
      label: item.label,
      icon: item.icon,
      keywords: item.keywords,
    }));

    const staticMatches = SEARCH_SHORTCUTS.filter((s) =>
      s.label.toLowerCase().includes(q.toLowerCase()) ||
      s.keywords.some((k) => k.toLowerCase().includes(q.toLowerCase()))
    );

    const merged = [...dynamic, ...staticMatches];
    const unique = merged.filter((item, idx, arr) => arr.findIndex((x) => x.path === item.path) === idx);
    return unique.slice(0, 12);
  }, [searchQuery, isOwner, hasCRMAccess, hasListingAdminAccess, user]);

  const accountLinks = [
    { href: '/my-dashboard', label: t('account.myDashboard', 'My Dashboard'), icon: LayoutDashboard, description: t('account.myDashboardDesc', 'Your personalized dashboard'), badge: 0 },
    { href: '/my-dashboard#notifications', label: t('account.notifications', 'Notifications'), icon: Bell, description: t('account.notificationsDesc', 'Ticket & system alerts'), badge: (alertCounts?.unreadTicketNotifications || 0) + (alertCounts?.unreadListingNotifications || 0) + (alertCounts?.unreadSystemNotifications || 0) },
    { href: '/my-dashboard#inbox', label: t('account.inbox', 'Inbox'), icon: Headphones, description: t('account.inboxDesc', 'Messages from JBJ'), badge: 0 },
    { href: '/my-dashboard#tasks', label: t('account.myTasks', 'My Tasks'), icon: ListChecks, description: t('account.myTasksDesc', 'View and manage your tasks'), badge: alertCounts?.pendingTasks || 0 },
    { href: '/profile', label: t('account.myProfile', 'My Profile'), icon: User, description: t('account.myProfileDesc', 'View and edit your profile'), badge: 0 },
    { href: '/favorites', label: t('nav.favorites', 'Favorites') + ' / ' + t('nav.shortlist', 'Shortlist'), icon: Heart, description: t('account.favoritesDesc', 'Your saved & shortlisted properties'), badge: 0 },
    { href: '/toolkit', label: t('account.aiTools', 'AI Tools'), icon: Sparkles, description: t('account.aiToolsDesc', 'Professional AI-powered tools'), badge: 0 },
  ];

  // Filter admin links based on actual access - consolidated shortcuts
  const adminLinks = useMemo(() => {
    const ownerLinks = [
      { href: '/owner', label: 'Command Center', icon: Shield, requiresOwner: true },
      { href: '/owner/crm', label: 'CRM Dashboard', icon: Users, requiresOwner: true },
      { href: '/owner/admin', label: 'Admin Panel', icon: LayoutDashboard, requiresOwner: true },
      { href: '/owner/listing-admin', label: 'Listing Admin', icon: FolderOpen, requiresOwner: true },
      { href: '/ticket-hub', label: 'Customer Happiness', icon: Headphones, requiresOwner: true },
      { href: '/hr-dashboard?tab=cv-center', label: 'CV Center', icon: ListChecks, requiresOwner: true },
      { href: '/owner/team-chat', label: 'Team Chat', icon: Bell, requiresOwner: true },
      { href: '/founder-assistant', label: 'My Assistant', icon: Sparkles, requiresAdmin: true },
    ];

    const sharedLinks = [
      { href: '/listing-admin', label: t('account.listingAdmin', 'Listing Admin'), icon: FolderOpen, requiresListingAdmin: true },
    ];
    
    const all = [...ownerLinks, ...sharedLinks];
    
    return all.filter(link => {
      if ((link as any).requiresOwner) return isOwner;
      if ((link as any).requiresListingAdmin) return hasListingAdminAccess && !isOwner;
      if ((link as any).requiresAdmin) return isOwner || hasCRMAccess;
      return false;
    });
  }, [isOwner, hasCRMAccess, hasListingAdminAccess, t]);

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
                      <div className="w-9 h-9 rounded-lg bg-transparent border-2 border-gold/40 flex items-center justify-center group-hover:border-gold group-hover:bg-gold/10 transition-colors relative">
                        <link.icon className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                        {link.badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] min-h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                            {link.badge > 9 ? '9+' : link.badge}
                          </span>
                        )}
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
                      {/* Admin Panel */}
                      {isOwner && (
                        <Link 
                          to="/admin" 
                          onClick={onClose} 
                          className="flex items-center gap-2.5 py-2 px-2 rounded-xl transition-all duration-300 bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/30 hover:border-gold/60 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gold/10 border-2 border-gold/40 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                            <Shield className="w-4 h-4 text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-black font-semibold text-xs group-hover:text-gold transition-colors block">
                              {t('account.adminPanel', 'Admin Panel')}
                            </span>
                            <span className="text-black/50 text-[10px]">{t('account.adminPanelDesc', 'HR, IT, Support, All')}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gold" />
                        </Link>
                      )}
                      {/* Customer Happiness Hub */}
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

            {/* ═══ FULL-WIDTH DIVIDER — spans under both columns, under CRM ═══ */}
            <div className="h-[1px] bg-gradient-to-r from-gold/40 via-gold/50 to-gold/40 mt-4 mb-3" />

            {/* ═══ FULL-WIDTH: Preferences row with Search icon ═══ */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">
                {t('account.preferences', 'Preferences')}
              </p>
              <div className="flex items-center gap-2">
                {/* Search Icon with dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSearchDropdown(!showSearchDropdown); setShowLangDropdown(false); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-8 h-8 rounded-lg border border-gold/30 flex items-center justify-center hover:bg-gold/10 hover:border-gold transition-colors group"
                    title="Quick Search & Recent Activity"
                  >
                    <Search className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                  </button>
                  {showSearchDropdown && (
                    <div
                      className="absolute right-0 top-10 w-72 rounded-xl border-2 border-gold/30 shadow-2xl z-[10001] overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)' }}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {/* Tabs: Quick Search | Recent Activity */}
                      <div className="flex border-b border-gold/20">
                        <button
                          onClick={() => setSearchTab('search')}
                          className={cn(
                            "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1",
                            searchTab === 'search' ? "text-gold border-b-2 border-gold bg-gold/5" : "text-black/50 hover:text-gold"
                          )}
                        >
                          <Search className="w-3 h-3" /> Quick Search
                        </button>
                        <button
                          onClick={() => setSearchTab('recent')}
                          className={cn(
                            "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1",
                            searchTab === 'recent' ? "text-gold border-b-2 border-gold bg-gold/5" : "text-black/50 hover:text-gold"
                          )}
                        >
                          <Clock className="w-3 h-3" /> Recent Activity
                        </button>
                      </div>
                      <div className="p-3 max-h-64 overflow-y-auto">
                        {searchTab === 'search' ? (
                          <>
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search pages, tools, settings..."
                              className="w-full px-3 py-2 rounded-lg border border-gold/30 bg-white/80 text-xs text-black placeholder:text-black/40 focus:outline-none focus:border-gold mb-2"
                              autoFocus
                            />
                            <div className="space-y-0.5">
                              {quickSearchResults.length > 0 ? quickSearchResults.map((shortcut) => (
                                <button
                                  key={shortcut.path}
                                  onClick={() => { navigate(shortcut.path); onClose(); }}
                                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-black hover:bg-gold/10 hover:text-gold transition-colors flex items-center gap-2"
                                >
                                  <shortcut.icon className="w-3.5 h-3.5 text-gold/60 shrink-0" />
                                  <span className="truncate">{shortcut.label}</span>
                                </button>
                              )) : (
                                <p className="text-xs text-black/50 py-2 text-center">No matching shortcut found</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            {recentlyViewed.length > 0 ? (
                              <div className="space-y-0.5">
                                {recentlyViewed.map((item, i) => (
                                  <button
                                    key={i}
                                    onClick={() => { navigate(item.path); onClose(); }}
                                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-black hover:bg-gold/10 hover:text-gold transition-colors flex items-center gap-2"
                                  >
                                    <Clock className="w-3 h-3 text-gold/40 shrink-0" />
                                    <span className="truncate">{item.title || item.path}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-black/40 text-center py-4">No recent activity yet</p>
                            )}
                            <div className="h-[1px] bg-gold/20 my-2" />
                            <Link
                              to="/my-dashboard#activity"
                              onClick={onClose}
                              className="block text-center text-[10px] font-semibold text-gold hover:underline"
                            >
                              See all recent activity →
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ FULL-WIDTH: Currency | Divider | Area Unit ═══ */}
            <div className="flex items-start gap-0 mb-3">
              {/* Currency */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-black/50 mb-1.5 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Currency</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {SUPPORTED_CURRENCIES.map((cur) => (
                    <button
                      key={cur.code}
                      onClick={(e) => { e.stopPropagation(); handleCurrencyChange(cur.code); }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={cn(
                        "py-1.5 rounded-lg text-[10px] font-medium transition-colors text-center tracking-wide flex flex-col items-center gap-0.5",
                        activeCurrency === cur.code
                          ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C8A766]/60 shadow-sm"
                          : "bg-champagne-light text-black hover:bg-champagne"
                      )}
                    >
                      <span className="text-sm leading-none">{cur.flag}</span>
                      <span>{cur.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Gold Divider */}
              <div className="flex flex-col items-center mx-4 pt-5">
                <div className="w-[1px] h-10 bg-gradient-to-b from-gold/20 via-gold/50 to-gold/20" />
              </div>

              {/* Area Unit */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-black/50 mb-1.5 flex items-center gap-1.5"><Ruler className="w-3 h-3" /> Area Unit</p>
                <div className="flex gap-3">
                  {(['sqft', 'sqm'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={(e) => { e.stopPropagation(); handleAreaUnitChange(unit); }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors tracking-wider",
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

            {/* ═══ FULL-WIDTH: Select Your Language ═══ */}
            <div className="relative mb-3">
              <button
                onClick={(e) => { e.stopPropagation(); setShowLangDropdown(!showLangDropdown); setShowSearchDropdown(false); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gold/30 hover:border-gold hover:bg-gold/5 transition-all group"
              >
                <Globe className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                <span className="text-xs font-semibold text-black group-hover:text-gold transition-colors">
                  {t('account.selectLanguage', 'Select Your Language')}
                </span>
                <span className="ml-auto text-xs text-gold/70">
                  {SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag} {SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName}
                </span>
                <ChevronRight className={cn("w-3.5 h-3.5 text-gold transition-transform", showLangDropdown && "rotate-90")} />
              </button>
              {showLangDropdown && (
                <div
                  className="absolute left-0 right-0 bottom-full mb-1 rounded-xl border-2 border-gold/30 shadow-2xl z-[10001] p-2 max-h-64 overflow-y-auto"
                  style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)' }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={(e) => { e.stopPropagation(); setLanguage(lang.code as any); setShowLangDropdown(false); }}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors",
                        language === lang.code
                          ? "bg-gold/15 text-gold font-semibold border border-gold/30"
                          : "text-black hover:bg-gold/10 hover:text-gold"
                      )}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                      {language === lang.code && <Check className="w-3.5 h-3.5 ml-auto text-gold" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <div className="pt-3 border-t border-gold/30">
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
