import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import {
  Key,
  User,
  Building,
  ArrowRight,
} from "lucide-react";
import rentGuideHero from "@/assets/images/rent-guide-hero.jpg";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";

const audienceOptions = [
  {
    label: "I'm a Tenant",
    description: "Renting a home — the process, Ejari, your rights, and how JBJ supports you.",
    href: "/guides/tenant",
    icon: User,
  },
  {
    label: "I'm a Landlord",
    description: "Listing a property for rent — tenant management, pricing, and legal obligations.",
    href: "/guides/landlord",
    icon: Building,
  },
];

const RentGuide = () => {
  return (
    <div data-neon-page className="min-h-screen bg-page">
      <SEOHead
        title="Renting in Dubai | Tenant or Landlord Guide | JBJ GLOBAL REAL ESTATE"
        description="Renting property in Dubai? Choose the guide that matches you — Tenant or Landlord — for the process, costs, and how JBJ GLOBAL REAL ESTATE can help."
      />

      <GuideHero
        badge="Renting in Dubai"
        badgeIcon={Key}
        title={<>Which Guide Do You Need?</>}
        description="Renting works differently depending on which side of the lease you're on. Pick the guide that matches you."
        backgroundImage={rentGuideHero}
      />

      {/* Audience Picker */}
      <section className="py-16 md:py-24 jj-section-champagne">
        <div className="jj-guide-content">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {audienceOptions.map((option) => (
              <Link
                key={option.href}
                to={option.href}
                className="group jj-card-inner rounded-2xl p-8 text-center hover:border-[#B89555] hover:shadow-lg transition-all duration-300"
              >
                <div className="jj-icon-box-active w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <option.icon className="w-8 h-8" />
                </div>
                <h2 className="text-xl md:text-2xl font-medium text-[#1A1A1A] mb-3">
                  {option.label}
                </h2>
                <p className="text-[#1A1A1A]/70 text-sm mb-5">{option.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] group-hover:gap-3 transition-all">
                  <span>View Guide</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guide Navigation - Active Champagne Layer */}
      <div className="jj-section-champagne py-12">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/rent-guide" guides={GUIDE_LINKS} />
        </div>
      </div>

      {/* Global CTA handled by MainLayout */}
    </div>
  );
};

export default RentGuide;
