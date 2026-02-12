import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, Heart, User, LogOut, Settings, Menu, 
  Phone, Building2, Newspaper, ClipboardCheck, FileText,
  Sparkles, Search, Users, BookOpen, ChevronDown, Briefcase, UserCircle, FolderOpen, Monitor,
  GraduationCap, BarChart3, MapPin, Award, UserPlus, Globe, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandMonogram } from "@/components/BrandMonogram";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import MobileMenuWalkthrough, { useAutoWalkthrough } from "@/components/MobileMenuWalkthrough";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useIsTouchLayout } from "@/hooks/use-touch-layout";
import jbjMonogramDarkBg from "@/assets/jbj-monogram-dark-bg.png";
import jbjMonogramTransparent from "@/assets/jbj-monogram-transparent.png";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";
import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";

// Mega Menu Components
import MegaMenuBuy from "@/components/header/MegaMenuBuy";
import MegaMenuSell from "@/components/header/MegaMenuSell";
import MegaMenuRent from "@/components/header/MegaMenuRent";
import MegaMenuProjects from "@/components/header/MegaMenuProjects";
import MegaMenuDevelopers from "@/components/header/MegaMenuDevelopers";
import MegaMenuAreas from "@/components/header/MegaMenuAreas";
import MegaMenuInsights from "@/components/header/MegaMenuInsights";
import MegaMenuMore from "@/components/header/MegaMenuMore";
// Utility Mega Menus
// MegaMenuSearch removed — search opens GlobalSearchModal directly
import MegaMenuLanguage from "@/components/header/MegaMenuLanguage";
import MegaMenuAccount from "@/components/header/MegaMenuAccount";

interface GlobalHeaderProps {
  forceSolid?: boolean;
}

const GlobalHeader = ({ forceSolid = false }: GlobalHeaderProps) => {
  const { user, isOwner, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState("");
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [filterBarActive, setFilterBarActive] = useState(false);
  const { t } = useLanguage();
  const isTouchLayout = useIsTouchLayout();

  // Listen for filter-bar-fixed class on body to hide header
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setFilterBarActive(document.body.classList.contains('filter-bar-fixed'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  
  // Mega menu hover + click states
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [pinnedMenu, setPinnedMenu] = useState<string | null>(null);
  const megaMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMegaMenuEnter = (menu: string) => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
    // Hover always switches the visible menu.
    setActiveMegaMenu(menu);
    // If the menu is pinned open, keep it pinned but allow hover to switch what is pinned.
    if (pinnedMenu && pinnedMenu !== menu) {
      setPinnedMenu(menu);
    }
  };

  const handleMegaMenuLeave = (e?: React.MouseEvent) => {
    // If a menu is pinned, keep it open; otherwise close after delay
    if (pinnedMenu) return;
    
    // Don't close if mouse moved to a Radix portal (dropdowns, popovers, dialogs)
    if (e?.relatedTarget instanceof HTMLElement) {
      const isMovingToPortal = e.relatedTarget.closest('[data-radix-portal]');
      if (isMovingToPortal) return;
    }
    
    // Also check if any Radix portal is currently open
    const openRadixPortal = document.querySelector('[data-radix-portal]');
    if (openRadixPortal) return;
    
    megaMenuTimeoutRef.current = setTimeout(() => {
      // Double-check portal isn't open when timeout fires
      const portalStillOpen = document.querySelector('[data-radix-portal]');
      if (portalStillOpen) return;
      setActiveMegaMenu(null);
    }, 80); // Fast close for snappy UX
  };

  // Clear any pending close timeout when entering mega menu panels
  const handleMegaMenuPanelEnter = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
  };

  const handleMegaMenuClick = (menu: string) => {
    if (pinnedMenu === menu) {
      // Un-pin
      setPinnedMenu(null);
      setActiveMegaMenu(null);
    } else {
      // Pin this menu
      setPinnedMenu(menu);
      setActiveMegaMenu(menu);
    }
  };

  const closeMegaMenu = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
    setPinnedMenu(null);
    setActiveMegaMenu(null);
  };

  // Cleanup any pending timer on unmount.
  useEffect(() => {
    return () => {
      if (megaMenuTimeoutRef.current) {
        clearTimeout(megaMenuTimeoutRef.current);
        megaMenuTimeoutRef.current = null;
      }
    };
  }, []);

  // Close any open/pinned mega menu on route changes AND reset scroll state to transparent
  useEffect(() => {
    closeMegaMenu();
    // Reset to transparent on navigation - ensures hero pages show transparent header immediately
    if (!forceSolid) {
      setIsSolid(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Close pinned menu on click outside or ESC
  useEffect(() => {
    if (!pinnedMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // IMPORTANT: Radix portals render outside headerViewportRef but should NOT close the mega menu
      // Check if click is inside a Radix portal (dropdowns, popovers, dialogs within the mega menu)
      if (target.closest('[data-radix-portal]')) return;
      // Close if click is outside the entire header (includes utility icon triggers + panels)
      // This prevents a pinned utility menu from immediately closing on the same click.
      if (headerViewportRef.current && !headerViewportRef.current.contains(target)) closeMegaMenu();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMegaMenu();
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [pinnedMenu]);

  // Locked rule:
  // - Desktop header (pill nav) must show on desktop-width screens.
  // - Only when the screen is reduced (below lg) do we switch to the mobile header.
  // - Touch/coarse-pointer devices always use the mobile header.
  const headerViewportRef = useRef<HTMLElement | null>(null);
  const headerContentRef = useRef<HTMLDivElement | null>(null);
  const [isDesktopWidth, setIsDesktopWidth] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1024;
  });

  useLayoutEffect(() => {
    const getViewportWidth = () =>
      headerViewportRef.current?.clientWidth ?? window.innerWidth;

    const recompute = () => {
      setIsDesktopWidth(getViewportWidth() >= 1024);
    };

    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);

  const shouldUseMobileHeader = isTouchLayout || !isDesktopWidth;

  // Apply transparent header globally on all pages (unless forceSolid is true)
  const isTransparentRoute = !forceSolid;

  // CRITICAL: Initialize to false (transparent) on first load, NOT based on scroll position
  // This ensures the transparent header is visible immediately on page load
  const [isSolid, setIsSolid] = useState(() => {
    // Only force solid if explicitly requested
    if (forceSolid) return true;
    // Default to transparent on initial render
    return false;
  });

  useEffect(() => {
    if (forceSolid) {
      setIsSolid(true);
      return;
    }
    
    // Scroll handler - only trigger solid after scrolling past threshold
    const onScroll = () => {
      const shouldBeSolid = window.scrollY > 80;
      setIsSolid(shouldBeSolid);
    };
    
    // Check initial scroll position after a brief delay to ensure proper hydration
    // This handles cases where user refreshes mid-page
    requestAnimationFrame(() => {
      if (window.scrollY > 80) {
        setIsSolid(true);
      }
    });
    
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [forceSolid]);

  // When transparent (hero visible), use minimal styling - no fills on nav/icons
  const isFullyTransparent = isTransparentRoute && !isSolid;

  const mobileHeaderIconButtonClassName =
    "inline-flex h-7 w-7 items-center justify-center p-0 bg-transparent border-0 rounded-none appearance-none transition-colors duration-300 focus:outline-none focus-visible:outline-none focus-visible:ring-0";
  
  const { data: favorites } = useFavorites();
  const { data: shortlist } = useShortlist();
  const { favorites: guestFavorites } = useGuestFavorites();
  const { shortlist: guestShortlist } = useGuestShortlist();

  const favCount = user ? (favorites?.length || 0) : guestFavorites.length;
  const shortlistCount = user ? (shortlist?.length || 0) : guestShortlist.length;
  const totalCount = favCount + shortlistCount;

  // Check if user has CRM access (owner_admin or broker_member)
  const { data: crmProfile } = useQuery({
    queryKey: ['crm-profile-header', user?.id],
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

  const { isFounderVisible } = useFounderVisibility();

  const authHref = `/auth?redirect=${encodeURIComponent(`${location.pathname}${location.search || ""}`)}`;
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

  // Properties dropdown (execution-only)
  const propertiesLinks = [
    { href: "/properties?transaction=buy", label: t('header.buyProperties') || "Buy Properties", icon: Home },
    { href: "/properties?transaction=rent", label: t('header.rentProperties') || "Rent Properties", icon: Building2 },
    { href: "/developers", label: "Developers", icon: Building2 },
    { href: "/seller-listing", label: t('header.listProperty') || "List Your Property", icon: ClipboardCheck },
  ];

  // Services dropdown
  const servicesLinks = [
    { href: "/services", label: "Explore Our Services", icon: Briefcase },
    { href: "/services/buying-advisory", label: t('header.buyingAdvisory') || "Buying Advisory", icon: UserCircle },
    { href: "/services/selling-advisory", label: t('header.sellingAdvisory') || "Selling Advisory", icon: ClipboardCheck },
    { href: "/services/rental-advisory", label: t('header.rentalAdvisory') || "Rental Advisory", icon: Building2 },
    { href: "/services/investment-advisory", label: t('header.investmentAdvisory') || "Investment Advisory", icon: BarChart3 },
    { href: "/partners", label: t('header.partnerIntroductions') || "Partner Introductions", icon: Users },
  ];

  // Guides dropdown (education-only, client-facing)
  const guidesLinks = [
    { href: "/buyer-guide", label: t('guides.buyer') || "Buyer Guide", icon: FileText },
    { href: "/seller-guide", label: t('guides.seller') || "Seller Guide", icon: FileText },
    { href: "/landlord-guide", label: t('guides.landlord') || "Landlord Guide", icon: FileText },
    { href: "/tenant-guide", label: t('guides.tenant') || "Tenant Guide", icon: FileText },
    { href: "/areas", label: t('areas.title') || "Area Guides", icon: MapPin },
    { href: "/guides/golden-visa-uae", label: t('guides.goldenVisa') || "Golden Visa Guide", icon: Globe },
    { href: "/investor-education", label: t('header.investorEducation') || "Investor Education", icon: GraduationCap },
    { href: "/faq", label: t('header.generalFaq') || "General FAQ", icon: ClipboardCheck },
    { href: "/investor-faq", label: t('header.investorFaq') || "Investor FAQ", icon: ClipboardCheck },
    { href: "/broker-faq", label: t('header.brokerFaq') || "Broker FAQ", icon: ClipboardCheck },
  ];

  // Market Intelligence dropdown (data-led, descriptive)
  const marketIntelLinks = [
    { href: "/market-intelligence/overview", label: t('intelligence.overview') || "Market Overview", icon: BarChart3 },
    { href: "/market-intelligence/areas", label: t('intelligence.areas') || "Area Intelligence", icon: MapPin },
    { href: "/market-intelligence/reports", label: t('intelligence.reports') || "Market Reports", icon: FileText },
    { href: "/market-intelligence/methodology", label: t('intelligence.methodology') || "Methodology & Sources", icon: ClipboardCheck },
  ];

  // Investor Hub dropdown (tools + dashboard)
  const investorHubLinks = [
    { href: "/my-dashboard", label: t('header.investorDashboard') || "Investor Dashboard", icon: UserCircle },
    { href: "/ai-hub", label: t('header.investorTools') || "Investor Tools", icon: Briefcase },
    { href: "/favorites", label: t('header.portfolioViews') || "Portfolio Views", icon: Heart },
    { href: "/market-intelligence/reports", label: t('header.reportsAccess') || "Reports Access", icon: FileText },
  ];

  // Broker Hub dropdown (internal)
  const brokerHubLinks = [
    { href: "/broker-dashboard", label: t('header.brokerDashboard') || "Broker Dashboard", icon: UserCircle },
    { href: "/broker-toolkit#tools", label: t('header.brokerTools') || "Broker Tools", icon: Briefcase },
    { href: "/broker-education", label: t('header.brokerEducation') || "Broker Education", icon: GraduationCap },
    { href: "/broker-resources", label: t('header.brokerResources') || "Broker Resources", icon: FolderOpen },
    { href: "/broker-faq", label: t('header.brokerFaq') || "Broker FAQ", icon: ClipboardCheck },
  ];

  // About dropdown - conditionally include Founder link
  const aboutLinks = [
    { href: "/about", label: t('about.title') || "About JBJ", icon: Building2 },
    ...(isFounderVisible ? [{ href: "/founder", label: t('nav.founder') || "Founder & Leadership", icon: UserCircle }] : []),
    { href: "/team", label: t('header.meetTeam') || "Meet the Team", icon: Users },
    { href: "/awards", label: t('awards.title') || "Awards & Recognition", icon: Award },
  ];

  // More dropdown
  const moreLinks = [
    { href: "/news", label: t('nav.news') || "News & Insights", icon: Newspaper },
    { href: "/join", label: t('nav.join') || "Join Our Team", icon: UserPlus },
  ];

  // Mobile menu links - Buy section
  const mobileBuyLinks = [
    { href: "/properties?transaction=buy", label: "Properties for Sale", icon: Home },
    { href: "/properties?type=apartment&transaction=buy", label: "Apartments", icon: Building2 },
    { href: "/properties?type=villa&transaction=buy", label: "Villas", icon: Home },
    { href: "/buyer-guide", label: "Buyer's Guide", icon: FileText },
    { href: "/mortgage-calculator", label: "Mortgage Calculator", icon: BarChart3 },
  ];

  // Mobile menu links - Sell section
  const mobileSellLinks = [
    { href: "/seller-listing", label: "List Your Property", icon: ClipboardCheck },
    { href: "/seller-guide", label: "Seller's Guide", icon: FileText },
    { href: "/sell/valuation", label: "Property Valuation", icon: BarChart3 },
    { href: "/services/selling-advisory", label: "Selling Advisory", icon: Briefcase },
  ];

  // Mobile menu links - Rent section
  const mobileRentLinks = [
    { href: "/properties?transaction=rent", label: "Properties for Rent", icon: Building2 },
    { href: "/tenant-guide", label: "Tenant's Guide", icon: FileText },
    { href: "/services/property-management", label: "Property Management", icon: ClipboardCheck },
  ];

  // Mobile menu links - Areas section
  const mobileAreaLinks = [
    { href: "/areas", label: "Explore All Areas", icon: MapPin },
  ];

  // Mobile menu links - Developers section  
  const mobileDeveloperLinks = [
    { href: "/developers", label: "All Developers", icon: Building2 },
    { href: "/developer/emaar", label: "Emaar Properties", icon: Building2 },
    { href: "/developer/damac", label: "DAMAC Properties", icon: Building2 },
    { href: "/developer/sobha", label: "Sobha Realty", icon: Building2 },
  ];

  // Mobile menu links - More section (comprehensive)
  const mobileMoreLinks = [
    // About & Company
    { href: "/about", label: "About Us", icon: Building2 },
    { href: "/team", label: "Meet the Team", icon: Users },
    { href: "/brokers", label: "Our Brokers", icon: Users },
    { href: "/join", label: "Careers", icon: Briefcase },
    { href: "/awards", label: "Our Awards", icon: Award },
    { href: "/contact", label: "Contact Us", icon: Phone },
    { href: "/services/complaint-procedures", label: "Complaint Procedure", icon: ClipboardCheck },
    { href: "/services/testimonials", label: "Testimonials", icon: Users },
    { href: "/press-kit", label: "Press Kit", icon: FileText },
    { href: "/company-profile", label: "Company Profile", icon: FileText },
    { href: "/philanthropy", label: "Philanthropy", icon: Users },
  ];

  // Mobile menu - Resources & Guides (consolidated - all individual guides are accessed as books within the hub pages)
  const mobileResourceLinks = [
    { href: "/guides", label: "Guides Library", icon: BookOpen },
    { href: "/market-intelligence/overview", label: "Market Intelligence", icon: BarChart3 },
    { href: "/news", label: "News & Insights", icon: Newspaper },
    { href: "/faq", label: "FAQ", icon: ClipboardCheck },
  ];

  // Mobile menu - Partners & Tools
  const mobilePartnerLinks = [
    { href: "/partners", label: "Partners Hub", icon: Users },
    { href: "/partners/mortgage", label: "Mortgage Partners", icon: BarChart3 },
    { href: "/partners/legal", label: "Legal Partners", icon: FileText },
    { href: "/partners/company-setup", label: "Company Setup", icon: Building2 },
    { href: "/partners/visa-services", label: "Visa Services", icon: Award },
    { href: "/referral-partner", label: "Referral Partner", icon: Users },
    { href: "/quiz", label: "AI Home Finder", icon: Sparkles },
    { href: "/map", label: "Property Map", icon: MapPin },
    { href: "/compare", label: "Compare Properties", icon: ClipboardCheck },
    { href: "/landlord-portal", label: "Landlord Portal", icon: Building2 },
    { href: "/seller-listing", label: "Sell Your Property", icon: ClipboardCheck },
  ];

  // Mobile menu - Creative Toolkit
  const mobileToolkitLinks = [
    { href: "/toolkit", label: "Toolkit Hub", icon: Sparkles },
    { href: "/toolkit/ai-video-studio", label: "AI Video Studio", icon: Building2 },
    { href: "/toolkit/video-resize-pack", label: "Video Resize Pack", icon: Building2 },
    { href: "/toolkit/voice-studio", label: "Voice Studio", icon: Building2 },
    { href: "/toolkit/pdf-from-photos", label: "Photo to PDF", icon: FileText },
    { href: "/toolkit/image-resize", label: "Image Resizer", icon: Building2 },
    { href: "/toolkit/captions-translate", label: "Captions & Translate", icon: Building2 },
    { href: "/toolkit/background-ai", label: "Background Remover", icon: Sparkles },
    { href: "/toolkit/beauty-filters", label: "Beauty Filters", icon: Building2 },
  ];

  // Mobile menu - Legal & Trust
  const mobileLegalLinks = [
    { href: "/terms", label: "Terms of Service", icon: FileText },
    { href: "/privacy", label: "Privacy Policy", icon: FileText },
    { href: "/cookies", label: "Cookies Policy", icon: FileText },
    { href: "/trust-and-audit-center", label: "Trust & Audit Center", icon: FileText },
    { href: "/intellectual-property", label: "Intellectual Property", icon: FileText },
    { href: "/investor-faq", label: "Investor FAQ", icon: ClipboardCheck },
    { href: "/broker-faq", label: "Broker FAQ", icon: ClipboardCheck },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Render dropdown menu helper - Premium styling with pill background
  // When fully transparent, remove pill backgrounds and use white/gold text
  const renderDropdown = (label: React.ReactNode, links: typeof propertiesLinks, isActiveCheck?: () => boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`flex items-center gap-0.5 lg:gap-1 px-1 lg:px-1.5 xl:px-2 py-1 text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all rounded-full ${
            isFullyTransparent
              ? isActiveCheck?.() 
                ? 'text-gold bg-transparent' 
                : 'text-white hover:text-gold bg-transparent'
              : isActiveCheck?.() 
                ? 'text-gold bg-gold/15' 
                : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
          }`}
          style={{ letterSpacing: '0.01em' }}
        >
          {label}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        sideOffset={16}
        className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border-2 border-gold/40 min-w-[260px] max-h-[70vh] overflow-y-auto shadow-2xl py-5 rounded-2xl"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,167,102,0.3), 0 0 60px -20px rgba(200,167,102,0.3)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="flex flex-col gap-2 px-3">
          {links.map((link) => (
            <DropdownMenuItem key={link.href} asChild className="p-0 focus:bg-gold/10 rounded-xl">
              <Link to={link.href} className="flex items-center gap-4 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-4 transition-all w-full group rounded-xl">
                <div 
                  className="w-9 h-9 rounded-lg bg-black/90 border border-gold/30 flex items-center justify-center transition-all group-hover:bg-black group-hover:border-gold/50"
                  style={{
                    boxShadow: '0 4px 12px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}
                >
                  <link.icon className="w-4 h-4 text-gold transition-colors" />
                </div>
                <span className="font-semibold text-sm">{link.label}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header
      ref={headerViewportRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] h-24 sm:h-28 lg:h-32 overflow-visible transition-all duration-300",
        filterBarActive && "-translate-y-full opacity-0 pointer-events-none"
      )}
      style={{ '--header-height': '128px' } as React.CSSProperties}
      data-tour-target="header"
    >
      {/* Ultra Premium Multi-Layer Background - Pure Black on scroll (same as footer) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${isSolid ? "opacity-100" : "opacity-0"}`}
        style={{
          background: 'linear-gradient(180deg, hsl(0 0% 0% / 0.98) 0%, hsl(0 0% 0% / 0.99) 50%, hsl(0 0% 0% / 1) 100%)',
        }}
      />
      
      {/* Subtle ambient gold glow at top */}
      <div 
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-24 pointer-events-none transition-opacity duration-300 ${isSolid ? "opacity-100" : "opacity-0"}`}
        style={{
          background: 'radial-gradient(ellipse at center top, hsl(var(--gold) / 0.08) 0%, transparent 70%)',
        }}
      />
      
      {/* Premium Bottom Border - 3D Effect when solid */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] z-10">
        {/* Main gold gradient line - shown when solid */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-gold/60 to-transparent transition-opacity duration-300 ${isSolid ? "opacity-100" : "opacity-0"}`} />
        {/* Highlight on top - shown when solid */}
        <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/80 to-transparent transition-opacity duration-300 ${isSolid ? "opacity-100" : "opacity-0"}`} />
      </div>
      
      {/* Thin white divider when transparent - separates header from hero */}
      <div className={`absolute bottom-0 left-0 right-0 h-[1px] z-10 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-opacity duration-300 ${isFullyTransparent ? "opacity-100" : "opacity-0"}`} />
      
      {/* Inner shadow for depth */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isSolid ? "opacity-100" : "opacity-0"}`}
        style={{
          boxShadow: 'inset 0 -20px 40px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}
      />
      
      {/* HEADER CONTENT */}
      <div
        ref={headerContentRef}
        className="relative z-10 h-full flex items-center justify-between pl-3 lg:pl-4 xl:pl-6 2xl:pl-10 pr-3 lg:pr-4 xl:pr-4 2xl:pr-8"
      >
        {/* LEFT: Premium Brand Logo - LOCKED */}
        <div className="shrink-0">
          <Link 
            to="/" 
            className="flex items-center gap-3 xl:gap-4 shrink-0 group transition-all duration-300"
            style={{ fontFamily: "Poppins, sans-serif" }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative shrink-0">
              {/* Logo glow backdrop */}
              <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, rgba(200,167,102,0.3) 0%, transparent 70%)',
                  transform: 'scale(1.5)',
                  filter: 'blur(10px)'
                }}
              />
              <img 
                src={jbjMonogramLightTransparent}
                alt="JBJ" 
                className={`w-24 h-24 md:w-28 md:h-28 xl:w-32 xl:h-32 object-contain relative z-10 transition-transform duration-300 ${
                  isFullyTransparent
                    ? "scale-[1.25] md:scale-[1.3] xl:scale-[1.35]"
                    : "scale-100"
                }`}
                style={{
                  filter: isFullyTransparent 
                    ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' 
                    : 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))'
                }}
              />
            </div>
            {/* Premium Typography - changes based on transparent state */}
            <div className="flex flex-col shrink-0">
              <span 
                className={`font-bold text-sm xl:text-base tracking-[0.12em] uppercase whitespace-nowrap leading-none transition-all duration-300`}
                style={isFullyTransparent ? {
                  color: '#FFFFFF',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                } : {
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 30%, #C8A766 70%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 10px rgba(200,167,102,0.3)',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                }}
              >
                JBJ Global Real Estate
              </span>
              <span 
                className="text-[9px] tracking-[0.25em] uppercase mt-1 transition-all duration-300"
                style={isFullyTransparent ? {
                  color: '#FFFFFF',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)'
                } : {
                  background: 'linear-gradient(90deg, #C8A766 0%, #D4AF37 50%, #C8A766 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Excellence in Real Estate
              </span>
            </div>
          </Link>
        </div>

          {/* MOBILE HEADER: touch devices OR when desktop can't fit */}
          {shouldUseMobileHeader && (
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {/* Mobile Menu Trigger - Larger hamburger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center bg-transparent border-0 rounded-none appearance-none transition-colors duration-300 focus:outline-none group"
                    aria-label="Open menu"
                    data-tour-target="mobile-menu"
                  >
                    <Menu className="w-6 h-6 text-gold group-hover:text-gold-light transition-colors" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="bg-gradient-to-b from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-l border-gold/30 w-[320px] sm:w-[360px] p-0 flex flex-col h-[100dvh] top-0 inset-y-0"
                >
                {/* Menu Header - Text only, no logo to avoid overlap with background header */}
                <div className="relative border-b border-gold/30 flex items-center px-5 h-16 sm:h-20 shrink-0">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <span 
                    className="text-black font-bold text-sm tracking-[0.06em] uppercase leading-tight"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    JBJ Global Real Estate
                  </span>
                </div>

                {/* Quick Actions Row - All aligned with fixed widths */}
                <div className="flex items-center justify-evenly px-4 py-3 border-b border-gold/20">
                  <button
                    className="flex flex-col items-center justify-center gap-1.5 text-black hover:text-gold py-2 w-16 transition-colors"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSearchInitialQuery("");
                      setSearchOpen(true);
                    }}
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-[9px] font-medium text-center">Search</span>
                  </button>
                  <Link
                    to={user ? "/my-account" : authHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center gap-1.5 text-black hover:text-gold py-2 w-16 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-[9px] font-medium text-center">{user ? "Account" : "Sign In"}</span>
                  </Link>
                  <LanguageSwitcher variant="mobile" />
                  <CurrencySwitcher variant="mobile" />
                </div>

                {/* Scrollable Navigation with Collapsible Sections */}
                <ScrollArea className="flex-1">
                  <nav className="flex flex-col p-4">
                    {/* 1. Buy - Collapsible */}
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Buy</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobileBuyLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 2. Sell - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Sell</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobileSellLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />
                    
                    {/* 3. Rent - Collapsible */}
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Rent</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobileRentLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 3. Projects - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Projects</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          <Link
                            to="/properties"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                          >
                            <Building2 className="w-4 h-4 text-gold" />
                            All Off-Plan Projects
                          </Link>
                          <Link
                            to="/properties?status=off-plan"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                          >
                            <Building2 className="w-4 h-4 text-gold" />
                            New Launches
                          </Link>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 4. Developers - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Developers</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobileDeveloperLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 5. Areas - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Areas</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobileAreaLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 6. Services - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Services</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {servicesLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 7. Creative Toolkit - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Creative Toolkit</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobileToolkitLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 8. About & Company - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>About & Company</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobileMoreLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 8. Resources & Guides - Collapsible (with walkthrough target) */}
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger 
                        className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors"
                        data-walkthrough-id="mobile-guides"
                      >
                        <span>Resources & Guides</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobileResourceLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 9. Partners & Tools - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Partners & Tools</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobilePartnerLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 10. Legal & Trust - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold hover:bg-gold/5 rounded-lg transition-colors">
                        <span>Legal & Trust</span>
                        <ChevronDown className="w-4 h-4 text-gold transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-2">
                          {mobileLegalLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <link.icon className="w-4 h-4 text-gold" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* Quick Links with walkthrough targets */}
                    <div className="flex flex-col gap-1">
                      <Link
                        to="/favorites"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                        data-walkthrough-id="mobile-favorites"
                      >
                        <Heart className="w-4 h-4 text-gold" />
                        Favorites
                        {totalCount > 0 && (
                          <span className="ml-auto bg-gold/20 text-gold text-xs font-medium px-2 py-0.5 rounded-full">
                            {totalCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/sitemap"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                        data-walkthrough-id="mobile-sitemap"
                      >
                        <MapPin className="w-4 h-4 text-gold" />
                        Sitemap
                      </Link>
                    </div>

                    <div className="h-px bg-gold/20 my-4" />

                    {/* User Section */}
                    {user ? (
                      <>
                        <div className="px-4 py-3 bg-gold/5 rounded-lg mb-2">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-medium text-black truncate">{accountDisplayName}</p>
                        </div>
                        
                        {/* My Dashboard - Always visible for logged in users */}
                        <Link
                          to="/my-dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                        >
                          <Home className="w-4 h-4 text-gold" />
                          My Dashboard
                        </Link>
                        
                        <Link
                          to="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                        >
                          <User className="w-4 h-4 text-gold" />
                          My Profile
                        </Link>
                        
                        <div className="h-px bg-gold/20 my-2" />
                        
                        {/* Owner Shortcuts - Same as desktop dropdown */}
                        {(isOwner || hasCRMAccess) && (
                          <>
                            <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">Owner Shortcuts</p>
                            
                            {/* My Assistant */}
                            <Link
                              to="/founder-assistant"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <Sparkles className="w-4 h-4 text-gold" />
                              My Assistant
                            </Link>
                            
                            {/* Employee Hub */}
                            <Link
                              to="/employee-hub"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <Briefcase className="w-4 h-4 text-gold" />
                              Employee Hub
                            </Link>
                            
                            {/* HR Hub */}
                            <Link
                              to="/hr-dashboard"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <Users className="w-4 h-4 text-gold" />
                              HR Hub
                            </Link>
                            
                            {/* Listing Admin */}
                            <Link
                              to="/listing-admin"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <FolderOpen className="w-4 h-4 text-gold" />
                              Listing Admin
                            </Link>
                            
                            {/* IT Department */}
                            <Link
                              to="/it-department"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <Monitor className="w-4 h-4 text-gold" />
                              IT Department
                            </Link>
                            
                            {/* Employee Management */}
                            <Link
                              to="/employee-management"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                            >
                              <UserCircle className="w-4 h-4 text-gold" />
                              Employee Management
                            </Link>
                            
                            {/* CRM Dashboard */}
                            {hasCRMAccess && (
                              <Link
                                to="/crm"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                              >
                                <Users className="w-4 h-4 text-gold" />
                                {t('nav.crm') || 'CRM Dashboard'}
                              </Link>
                            )}
                            
                            {/* Owner Panel */}
                            {isOwner && (
                              <Link
                                to="/admin"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                              >
                                <Settings className="w-4 h-4 text-gold" />
                                Owner Panel
                              </Link>
                            )}
                            
                            <div className="h-px bg-gold/20 my-2" />
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-zinc-700 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left rounded-lg"
                        >
                          <LogOut className="w-5 h-5" />
                          {t('nav.signOut')}
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/auth"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gold hover:bg-gold/10 transition-colors rounded-lg"
                      >
                        <User className="w-5 h-5" />
                        {t('nav.signIn')}
                      </Link>
                    )}
                    {/* Help & Navigation Guide Button */}
                    <div className="h-px bg-gold/20 my-2" />
                    <button
                      onClick={() => setShowWalkthrough(true)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold hover:bg-gold/10 transition-colors rounded-lg w-full text-left"
                    >
                      <HelpCircle className="w-4 h-4 text-gold" />
                      Help & Navigation Guide
                    </button>
                    
                    {/* Monogram Branding Footer */}
                    <div className="mt-4 pt-4 border-t border-gold/20 flex justify-center">
                      <img 
                        src={jbjMonogramLightBg}
                        alt="JBJ Global Real Estate"
                        className="w-12 h-12 object-contain opacity-60"
                      />
                    </div>
                  </nav>
                </ScrollArea>
                
                {/* Mobile Menu Walkthrough - show guided tour modal */}
                {showWalkthrough && (
                  <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4">
                    <div 
                      className="relative max-w-md w-full rounded-2xl p-6 border-2 border-gold/40 shadow-2xl"
                      style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}
                    >
                      {/* Close button */}
                      <button
                        onClick={() => setShowWalkthrough(false)}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gold/20 transition-colors"
                      >
                        <span className="text-zinc-600 text-xl">×</span>
                      </button>
                      
                      {/* Monogram */}
                      <div className="flex justify-center mb-4">
                        <img 
                          src={jbjMonogramLightBg}
                          alt="JBJ"
                          className="w-16 h-16 object-contain"
                        />
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-black font-bold text-xl text-center mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Welcome to JBJ Global Real Estate
                      </h3>
                      <p className="text-zinc-600 text-sm text-center mb-6 leading-relaxed">
                        Navigate our platform with ease. Use the menu sections above to explore properties, services, guides, and more. 
                        Need help? Contact us anytime.
                      </p>
                      
                      {/* Quick Tips */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs shrink-0">1</span>
                          <span className="text-zinc-700"><strong>Buy & Rent</strong> – Browse properties for sale or rent</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs shrink-0">2</span>
                          <span className="text-zinc-700"><strong>Services</strong> – Explore our brokerage services</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs shrink-0">3</span>
                          <span className="text-zinc-700"><strong>Contact</strong> – Reach us via WhatsApp, call, or email</span>
                        </div>
                      </div>
                      
                      {/* Got it button */}
                      <button
                        onClick={() => {
                          setShowWalkthrough(false);
                          localStorage.setItem('jj_mobile_walkthrough_done', 'true');
                        }}
                        className="w-full py-3 bg-black text-gold font-semibold rounded-xl hover:bg-zinc-900 transition-colors"
                      >
                        Got it!
                      </button>
                    </div>
                  </div>
                )}
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* DESKTOP HEADER (lg+): Premium Mega Menu Navigation */}
          {!shouldUseMobileHeader && (
            <nav
              className="flex-1 min-w-0 mx-2 lg:mx-4 xl:mx-6 flex justify-center relative"
              aria-label="Primary"
              onMouseLeave={handleMegaMenuLeave}
            >
              <div
                className={cn(
                  "min-w-0 flex items-center justify-evenly gap-1 lg:gap-2 xl:gap-3 2xl:gap-4 rounded-full px-3 lg:px-5 xl:px-7 py-2 lg:py-2.5 transition-all duration-300",
                  isFullyTransparent
                    ? 'bg-transparent border-transparent max-w-full'
                    : 'border-2 border-gold/40 w-full max-w-[900px]'
                )}
                style={!isFullyTransparent ? {
                  background: 'linear-gradient(135deg, rgba(245,235,215,0.98) 0%, rgba(232,220,200,0.95) 50%, rgba(212,196,168,0.98) 100%)',
                  boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,167,102,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.05)',
                } : {}}
              >
                {/* Buy */}
                <button
                  onPointerEnter={() => handleMegaMenuEnter('buy')}
                  onClick={() => handleMegaMenuClick('buy')}
                  className={`flex items-center gap-0.5 px-1 lg:px-1.5 xl:px-2 py-1 text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all rounded-full cursor-pointer ${
                    isFullyTransparent
                      ? activeMegaMenu === 'buy' ? 'text-gold' : 'text-white hover:text-gold'
                      : activeMegaMenu === 'buy' ? 'text-gold bg-gold/15' : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
                  }`}
                >
                  Buy
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeMegaMenu === 'buy' ? 'rotate-180' : ''}`} />
                </button>
                {isFullyTransparent && <span className="text-white/40 text-[10px] px-0.5 lg:px-1">|</span>}

                {/* Sell */}
                <button
                  onPointerEnter={() => handleMegaMenuEnter('sell')}
                  onClick={() => handleMegaMenuClick('sell')}
                  className={`flex items-center gap-0.5 px-1 lg:px-1.5 xl:px-2 py-1 text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all rounded-full cursor-pointer ${
                    isFullyTransparent
                      ? activeMegaMenu === 'sell' ? 'text-gold' : 'text-white hover:text-gold'
                      : activeMegaMenu === 'sell' ? 'text-gold bg-gold/15' : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
                  }`}
                >
                  Sell
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeMegaMenu === 'sell' ? 'rotate-180' : ''}`} />
                </button>
                {isFullyTransparent && <span className="text-white/40 text-[10px] px-0.5 lg:px-1">|</span>}

                {/* Rent */}
                <button
                  onPointerEnter={() => handleMegaMenuEnter('rent')}
                  onClick={() => handleMegaMenuClick('rent')}
                  className={`flex items-center gap-0.5 px-1 lg:px-1.5 xl:px-2 py-1 text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all rounded-full cursor-pointer ${
                    isFullyTransparent
                      ? activeMegaMenu === 'rent' ? 'text-gold' : 'text-white hover:text-gold'
                      : activeMegaMenu === 'rent' ? 'text-gold bg-gold/15' : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
                  }`}
                >
                  Rent
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeMegaMenu === 'rent' ? 'rotate-180' : ''}`} />
                </button>
                {isFullyTransparent && <span className="text-white/40 text-[10px] px-0.5 lg:px-1">|</span>}

                {/* Projects */}
                <button
                  onPointerEnter={() => handleMegaMenuEnter('projects')}
                  onClick={() => handleMegaMenuClick('projects')}
                  className={`flex items-center gap-0.5 px-1 lg:px-1.5 xl:px-2 py-1 text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all rounded-full cursor-pointer ${
                    isFullyTransparent
                      ? activeMegaMenu === 'projects' ? 'text-gold' : 'text-white hover:text-gold'
                      : activeMegaMenu === 'projects' ? 'text-gold bg-gold/15' : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
                  }`}
                >
                  Projects
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeMegaMenu === 'projects' ? 'rotate-180' : ''}`} />
                </button>
                {isFullyTransparent && <span className="text-white/40 text-[10px] px-0.5 lg:px-1">|</span>}

                {/* Areas */}
                <button
                  onPointerEnter={() => handleMegaMenuEnter('areas')}
                  onClick={() => handleMegaMenuClick('areas')}
                  className={`flex items-center gap-0.5 px-1 lg:px-1.5 xl:px-2 py-1 text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all rounded-full cursor-pointer ${
                    isFullyTransparent
                      ? activeMegaMenu === 'areas' ? 'text-gold' : 'text-white hover:text-gold'
                      : activeMegaMenu === 'areas' ? 'text-gold bg-gold/15' : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
                  }`}
                >
                  Areas
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeMegaMenu === 'areas' ? 'rotate-180' : ''}`} />
                </button>
                {isFullyTransparent && <span className="text-white/40 text-[10px] px-0.5 lg:px-1">|</span>}

                {/* Developers */}
                <button
                  onPointerEnter={() => handleMegaMenuEnter('developers')}
                  onClick={() => handleMegaMenuClick('developers')}
                  className={`flex items-center gap-0.5 px-1 lg:px-1.5 xl:px-2 py-1 text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all rounded-full cursor-pointer ${
                    isFullyTransparent
                      ? activeMegaMenu === 'developers' ? 'text-gold' : 'text-white hover:text-gold'
                      : activeMegaMenu === 'developers' ? 'text-gold bg-gold/15' : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
                  }`}
                >
                  Developers
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeMegaMenu === 'developers' ? 'rotate-180' : ''}`} />
                </button>
                {isFullyTransparent && <span className="text-white/40 text-[10px] px-0.5 lg:px-1">|</span>}

                {/* Insights (News & Market Intelligence) */}
                <button
                  onPointerEnter={() => handleMegaMenuEnter('insights')}
                  onClick={() => handleMegaMenuClick('insights')}
                  className={`flex items-center gap-0.5 px-1 lg:px-1.5 xl:px-2 py-1 text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all rounded-full cursor-pointer ${
                    isFullyTransparent
                      ? activeMegaMenu === 'insights' ? 'text-gold' : 'text-white hover:text-gold'
                      : activeMegaMenu === 'insights' ? 'text-gold bg-gold/15' : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
                  }`}
                >
                  Insights
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeMegaMenu === 'insights' ? 'rotate-180' : ''}`} />
                </button>
                {/* Insights is the last item - no trailing separator */}
              </div>

              {/* Mega Menu Panels - Enhanced bridge zone for stable hover transitions */}
              {activeMegaMenu && !['search', 'language', 'account'].includes(activeMegaMenu) && (
                <>
                  {/* Backdrop blur overlay - matches utility menus */}
                  <div 
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    style={{ top: 'var(--header-height, 128px)' }}
                    onClick={closeMegaMenu}
                  />
                  {/* Invisible bridge zone - catches mouse during transition from nav to panel */}
                  <div 
                    className="absolute left-0 right-0 h-4 z-50 pointer-events-auto"
                    style={{ top: '100%' }}
                    onPointerEnter={handleMegaMenuPanelEnter}
                  />
                  <div 
                    className="absolute left-0 right-0 z-50 pointer-events-auto"
                    style={{ top: 'calc(100% + 12px)' }} // 12px bridge gap for smoother transitions
                    onPointerEnter={handleMegaMenuPanelEnter}
                    onPointerLeave={handleMegaMenuLeave}
                  >
                    {activeMegaMenu === 'buy' && <MegaMenuBuy onClose={closeMegaMenu} />}
                    {activeMegaMenu === 'sell' && <MegaMenuSell onClose={closeMegaMenu} />}
                    {activeMegaMenu === 'rent' && <MegaMenuRent onClose={closeMegaMenu} />}
                    {activeMegaMenu === 'projects' && <MegaMenuProjects onClose={closeMegaMenu} />}
                    {activeMegaMenu === 'areas' && <MegaMenuAreas onClose={closeMegaMenu} />}
                    {activeMegaMenu === 'developers' && <MegaMenuDevelopers onClose={closeMegaMenu} />}
                    {activeMegaMenu === 'insights' && <MegaMenuInsights onClose={closeMegaMenu} />}
                  </div>
                </>
              )}
            </nav>
          )}

          {!shouldUseMobileHeader && (
            <div 
              className={`flex items-center gap-0.5 px-3 py-2 rounded-full shrink-0 transition-all duration-300 ${
                isFullyTransparent 
                  ? 'bg-transparent border-transparent' 
                  : 'border border-gold/30'
              }`}
              style={!isFullyTransparent ? {
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.9) 100%)',
                boxShadow: '0 4px 16px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px -10px rgba(200,167,102,0.15)'
              } : {}}
            >
              {/* Search Icon - triggers mega menu on hover (same as language dropdown) */}
              <button
                onMouseEnter={() => handleMegaMenuEnter('search')}
                onClick={() => handleMegaMenuClick('search')}
                className="w-9 h-9 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-white/10"
                aria-label="Search"
              >
                <Search 
                  className={`w-5 h-5 transition-colors duration-300 text-gold group-hover:text-white ${activeMegaMenu === 'search' ? '!text-gold' : ''}`}
                  style={{ filter: isFullyTransparent ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' : 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }} 
                />
              </button>

              {/* Divider */}
              <div className={`w-px h-5 bg-gradient-to-b from-transparent ${isFullyTransparent ? 'via-white/40' : 'via-gold/40'} to-transparent`} />

              {/* Language Icon - triggers mega menu on hover (desktop only) */}
              <button
                onMouseEnter={() => handleMegaMenuEnter('language')}
                onClick={() => handleMegaMenuClick('language')}
                className="w-9 h-9 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-white/10"
                aria-label="Language"
              >
                <Globe 
                  className={`w-5 h-5 transition-colors duration-300 text-gold group-hover:text-white ${activeMegaMenu === 'language' ? '!text-gold' : ''}`}
                  style={{ filter: isFullyTransparent ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' : 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }} 
                />
              </button>

              {/* Divider */}
              <div className={`w-px h-5 bg-gradient-to-b from-transparent ${isFullyTransparent ? 'via-white/40' : 'via-gold/40'} to-transparent`} />

              {/* Account Icon - triggers mega menu on hover (desktop only) */}
              <button
                onMouseEnter={() => handleMegaMenuEnter('account')}
                onClick={() => handleMegaMenuClick('account')}
                className="w-9 h-9 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-white/10"
                aria-label={user ? t('nav.myAccount') : t('nav.signIn')}
              >
                <User 
                  className={`w-5 h-5 transition-colors duration-300 text-gold group-hover:text-white ${activeMegaMenu === 'account' ? '!text-gold' : ''}`}
                  style={{ filter: isFullyTransparent ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' : 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }}
                />
              </button>
            </div>
          )}

          {/* Utility Mega Menu Panels (Language, Account, Search) */}
          {!shouldUseMobileHeader && (activeMegaMenu === 'language' || activeMegaMenu === 'account' || activeMegaMenu === 'search') && (
            <>
              {/* Backdrop only - click to close */}
              <div 
                className="fixed inset-0 z-[9997] bg-black/40 backdrop-blur-sm"
                style={{ top: 'var(--header-height, 128px)' }}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-radix-portal]')) return;
                  closeMegaMenu();
                }}
                onPointerDown={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-radix-portal]')) {
                    e.stopPropagation();
                  }
                }}
              />
              {/* Bridge zone between icons and panel */}
              <div 
                className="absolute right-0 h-4 z-[9998] pointer-events-auto"
                style={{ top: '100%' }}
                onPointerEnter={handleMegaMenuPanelEnter}
              />
              {/* Panel with real boundaries so pointer leave fires */}
              <div 
                className="absolute right-6 z-[9998] pointer-events-auto"
                style={{ top: 'calc(100% + 4px)' }}
                onPointerEnter={handleMegaMenuPanelEnter}
                onPointerLeave={handleMegaMenuLeave}
              >
                {activeMegaMenu === 'search' && (
                  <div
                    className="w-[620px] rounded-xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] relative"
                    style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}
                  >
                    {/* Gold border overlay */}
                    <div className="absolute inset-0 rounded-xl border-2 border-gold/40 pointer-events-none z-10" />
                    <div className="p-4">
                      <GlobalSearchModal
                        isOpen={true}
                        initialQuery=""
                        onClose={closeMegaMenu}
                        embedded
                      />
                    </div>
                    {/* Bottom gold accent bar */}
                    <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
                  </div>
                )}
                {activeMegaMenu === 'language' && <MegaMenuLanguage onClose={closeMegaMenu} />}
                {activeMegaMenu === 'account' && <MegaMenuAccount onClose={closeMegaMenu} />}
              </div>
            </>
          )}
      </div>

      {/* Global Search Modal - for mobile only now */}
      {shouldUseMobileHeader && (
        <GlobalSearchModal
          isOpen={searchOpen}
          initialQuery={searchInitialQuery}
          onClose={() => {
            setSearchOpen(false);
            setSearchInitialQuery("");
          }}
        />
      )}
    </header>
  );
};

export default GlobalHeader;
