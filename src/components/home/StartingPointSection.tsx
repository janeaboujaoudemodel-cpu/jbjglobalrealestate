import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Target, Home, User, Layers, Briefcase, Globe, Award, GraduationCap,
  FileText, BarChart3, Scale, Calculator, Palette, Building2, ArrowRight, Users
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type Tab = 'audience' | 'services' | 'professional';

const StartingPointSection = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('audience');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'audience', label: t('hero.iAmA', 'I Am A...') },
    { key: 'services', label: t('hero.servicesTab', 'Services') },
    { key: 'professional', label: t('hero.professionalTab', 'Professional') },
  ];

  const audienceCards = [
    { to: "/buyer-guide", icon: Heart, label: t('hero.buyers'), sub: t('hero.browseListings', 'Browse Listings') },
    { to: "/seller-guide", icon: Target, label: t('hero.sellers'), sub: t('hero.sellOrRent', 'Sell or Rent') },
    { to: "/landlord-guide", icon: Home, label: t('hero.landlords', 'Landlords'), sub: t('hero.manageProperty', 'Manage Property') },
    { to: "/tenant-guide", icon: User, label: t('hero.tenants', 'Tenants'), sub: t('hero.tenantGuide', 'Tenant Guide') },
    { to: "/investor-hub", icon: Layers, label: t('hero.investors'), sub: t('hero.investorPortal', 'Investor Portal') },
    { to: "/quiz", icon: Users, label: t('hero.visitors'), sub: t('hero.discoverDubai', 'Discover Dubai') },
    { to: "/join", icon: GraduationCap, label: t('hero.careers'), sub: t('hero.joinOurTeam', 'Join Our Team') },
  ];

  const serviceCards = [
    { to: "/properties", icon: Home, label: t('hero.exploreProperties'), sub: t('hero.browseListings', 'Browse Listings') },
    { to: "/list-property", icon: FileText, label: t('hero.listYourProperty'), sub: t('hero.sellOrRent', 'Sell or Rent') },
    { to: "/market-report", icon: BarChart3, label: t('hero.marketReport'), sub: t('hero.latestInsights', 'Latest Insights') },
    { to: "/partners/legal", icon: Scale, label: t('hero.legalPartners'), sub: t('hero.legalServices', 'Legal Services') },
    { to: "/partners/mortgage", icon: Calculator, label: t('hero.mortgagePartners'), sub: t('hero.financingOptions', 'Financing Options') },
    { to: "/services/design-build", icon: Palette, label: t('hero.designBuild'), sub: t('hero.constructionFitout', 'Construction & Fitout') },
    { to: "/guides/golden-visa-uae", icon: Globe, label: t('hero.goldenVisa', 'Golden Visa'), sub: t('hero.visaGuide', 'Visa Guide') },
  ];

  const professionalCards = [
    { to: "/broker-hub", icon: Building2, label: t('hero.jbjBrokerHub'), sub: t('hero.professionalTools', 'Professional Tools') },
    { to: "/investor-hub", icon: Layers, label: t('hero.jbjInvestorHub'), sub: t('hero.freeAiTools', 'Free AI Tools') },
    { to: "/partners", icon: Briefcase, label: t('hero.partners', 'Partners'), sub: t('hero.partnerWithUs', 'Partner With Us') },
    { to: "/referral", icon: Award, label: t('hero.referral'), sub: t('hero.earnRewards', 'Earn Rewards') },
    { to: "/join", icon: GraduationCap, label: t('hero.careers'), sub: t('hero.joinOurTeam', 'Join Our Team') },
  ];

  const activeCards = activeTab === 'audience' ? audienceCards : activeTab === 'services' ? serviceCards : professionalCards;

  return (
    <section className="bg-black">
      <div className="jj-layer-2">
        {/* Header badge */}
        <div className="text-center mb-6 md:mb-8">
          <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold shadow-md">
            <Users className="w-3 h-3 md:w-3.5 md:h-3.5 text-gold" />
            <span className="text-black">{t('hero.findStartingPoint')}</span>
          </span>
        </div>

        {/* Tab navigation — champagne pill style matching badge */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="inline-flex bg-black/40 border border-gold/30 rounded-full p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold tracking-wide transition-all duration-300",
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border-2 border-gold shadow-md"
                    : "text-white/60 hover:text-white hover:bg-white/5 border-2 border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid — uniform featured style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 w-full">
          {activeCards.map((card) => (
            <Link key={card.to + card.label} to={card.to} className="group">
              <div className={cn(
                "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 rounded-2xl p-4 md:p-5 text-center transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center min-h-[120px] md:min-h-[140px]",
                "border-gold/30 hover:border-gold",
                "hover:shadow-[0_12px_40px_rgba(200,167,102,0.5)] hover:-translate-y-1.5",
                "shadow-[0_4px_20px_rgba(200,167,102,0.2)]",
              )}>
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="relative flex flex-col items-center gap-2 md:gap-3 w-full">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(200,167,102,0.4)] transition-all duration-300 shadow-lg shrink-0 bg-gradient-to-br from-gold/20 to-gold/10 border-2 border-gold/40">
                    <card.icon className="w-7 h-7 text-gold" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-black group-hover:text-gold text-xs md:text-sm font-bold transition-colors leading-tight tracking-wide">{card.label}</h4>
                    <p className="text-black/45 text-[9px] md:text-[10px] mt-0.5 font-medium leading-tight">{card.sub}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StartingPointSection;
