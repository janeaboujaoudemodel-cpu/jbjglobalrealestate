import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Target, Home, User, Layers, Briefcase, Globe, Award, GraduationCap,
  FileText, BarChart3, Scale, Calculator, Palette, Building2, ArrowRight, Users, Key, Wrench
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';

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
    { to: "/landlord-guide", icon: Home, label: t('hero.landlords', 'Landlord'), sub: t('hero.manageProperty', 'Manage Property') },
    { to: "/tenant-guide", icon: User, label: t('hero.tenants', 'Tenant'), sub: t('hero.tenantGuide', 'Tenant Guide') },
    { to: "/investor-hub", icon: Layers, label: t('hero.investors'), sub: t('hero.investorPortal', 'Investor Portal') },
    { to: "/ai-home-finder", icon: Users, label: t('hero.visitors'), sub: t('hero.discoverDubai', 'Discover Dubai') },
    { to: "/partners", icon: Briefcase, label: t('hero.partners', 'Partner'), sub: t('hero.partnerWithUs', 'Partner With Us') },
    { to: "/join", icon: GraduationCap, label: t('hero.careers'), sub: t('hero.lookingForJob', 'Looking for a Job?') },
  ];

  const serviceCards = [
    { to: "/properties", icon: Home, label: t('hero.exploreProperties'), sub: t('hero.browseListings', 'Browse Listings') },
    { to: "/list-property", icon: FileText, label: t('hero.listYourProperty'), sub: t('hero.sellOrRent', 'Sell or Rent') },
    { to: "/services/property-management", icon: Building2, label: t('hero.propertyManagement', 'Property Management'), sub: t('hero.manageProperty', 'Manage Property') },
    { to: "/services/valuation", icon: BarChart3, label: t('hero.valuation', 'Valuation'), sub: t('hero.propertyValuation', 'Property Valuation') },
    { to: "/services/short-term-rental", icon: Key, label: t('hero.shortTermRental', 'Short-Term Rental'), sub: t('hero.holidayHomes', 'Holiday Homes') },
    { to: "/services/snagging", icon: Wrench, label: t('hero.snagging', 'Snagging'), sub: t('hero.inspectionService', 'Inspection Service') },
    { to: "/services/design-build", icon: Palette, label: t('hero.designBuild'), sub: t('hero.constructionFitout', 'Construction & Fitout') },
    { to: "/market-report", icon: BarChart3, label: t('hero.marketReport'), sub: t('hero.latestInsights', 'Latest Insights') },
    { to: "/partners/legal", icon: Scale, label: t('hero.legalPartners'), sub: t('hero.legalServices', 'Legal Services') },
    { to: "/partners/mortgage", icon: Calculator, label: t('hero.mortgagePartners'), sub: t('hero.financingOptions', 'Financing Options') },
    { to: "/guides/golden-visa-uae", icon: Globe, label: t('hero.goldenVisa', 'Golden Visa'), sub: t('hero.visaGuide', 'Visa Guide') },
  ];

  const professionalCards = [
    { to: "/broker/portal", icon: Building2, label: t('hero.jbjBrokerHub', 'JBJ Broker Portal'), sub: t('hero.professionalTools', 'Professional Tools') },
    { to: "/investor-hub", icon: Layers, label: t('hero.jbjInvestorHub'), sub: t('hero.freeAiTools', 'Free AI Tools') },
    { to: "/ai-hub", icon: Globe, label: t('hero.jbjAiToolsHub', 'JBJ Royal Tools Hub'), sub: t('hero.aiPoweredTools', 'AI-Powered Tools') },
    { to: "/partners", icon: Briefcase, label: t('hero.partners', 'Partner'), sub: t('hero.partnerWithUs', 'Partner With Us') },
    { to: "/referral", icon: Award, label: t('hero.referral'), sub: t('hero.earnRewards', 'Earn Rewards') },
    { to: "/join", icon: GraduationCap, label: t('hero.careers'), sub: t('hero.joinOurTeam', 'Join Our Team') },
  ];

  const activeCards = activeTab === 'audience' ? audienceCards : activeTab === 'services' ? serviceCards : professionalCards;

  return (
    <section className="bg-[#FDFBF7]">
      <div className="jj-layer-2">
        {/* Header badge */}
        <div className="text-center mb-6 md:mb-8">
          <SectionEyebrow icon={Users}>{t('hero.findStartingPoint')}</SectionEyebrow>
        </div>

        {/* Tab navigation */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="inline-flex bg-[#F7F2EA] border border-[#B89555]/30 rounded-full p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold tracking-wide transition-all duration-300 border",
                  activeTab === tab.key
                    ? "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 shadow-sm font-bold"
                    : "bg-transparent text-[#1A1A1A]/70 border-transparent hover:bg-[#FDFBF7]/60 hover:text-[#1A1A1A]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 w-full">
          {activeCards.map((card) => (
            <Link key={card.to + card.label} to={card.to} className="group">
              <div className={cn(
                "bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-4 md:p-5 text-center transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center min-h-[120px] md:min-h-[140px]",
                "hover:border-[#B89555] hover:shadow-xl hover:-translate-y-1"
              )}
            >
              <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shrink-0 bg-[#EFE6D6] border border-[#B89555]/30">
                    <card.icon className="w-7 h-7 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-[#1A1A1A] group-hover:text-[#1A1A1A] text-xs md:text-sm font-bold transition-colors leading-tight tracking-wide">{card.label}</h4>
                    <p className="text-[#1A1A1A]/70 text-[9px] md:text-[10px] mt-0.5 font-medium leading-tight">{card.sub}</p>
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
