import { AlertTriangle, Shield, Building2, Users, Scale, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

interface ComplianceDisclaimerProps {
  variant?: "full" | "compact" | "short" | "brokerage-cta" | "partners-intro";
  className?: string;
  language?: "en" | "ar";
}

/**
 * Compliance-safe disclaimers for JBJ Global Real Estate Brokerage
 * - Clarifies brokerage services
 * - Distinguishes partner introductions from direct services
 * - Meets UAE regulatory requirements
 */
const ComplianceDisclaimer = ({ variant = "compact", className = "", language = "en" }: ComplianceDisclaimerProps) => {
  const currentYear = new Date().getFullYear();

  // Short English Disclaimer - Updated compliant wording
  const shortDisclaimerEN = `JBJ Global Real Estate provides licensed brokerage support for buying, selling, and renting. For legal, mortgage, visa, and corporate support, we can introduce independent licensed partners. Clients contract directly with partners under their own licence and terms.`;

  // Short Arabic Disclaimer - Updated compliant wording
  const shortDisclaimerAR = `جي بي جي للعقارات تقدم خدمات وساطة مرخصة للبيع والشراء والإيجار. للخدمات القانونية أو التمويل العقاري أو التأشيرات أو الخدمات المؤسسية، يمكننا ربطك بشركاء مستقلين ومرخصين. يتم التعاقد مباشرة بين العميل والشريك وفق ترخيصه وشروطه.`;

  // Full Disclaimer Content
  const fullDisclaimerPoints = [
    {
      icon: Building2,
      title: language === "ar" ? "خدمات الوساطة العقارية" : "Real Estate Brokerage Services",
      content: language === "ar" 
        ? "جي بي جي جلوبال للعقارات متخصصة في المبيعات والإيجار وتنسيق المعاملات العقارية في دولة الإمارات العربية المتحدة."
        : "JBJ Global Real Estate specializes in property sales, rentals, and transaction coordination within the UAE."
    },
    {
      icon: Scale,
      title: language === "ar" ? "الخدمات القانونية" : "Legal Services",
      content: language === "ar"
        ? "للاستشارات القانونية، يمكننا تقديمك إلى مكاتب محاماة مستقلة ومرخصة تتعاقد معك مباشرة."
        : "For legal advice, we can introduce you to independent, licensed law firms who contract directly with you."
    },
    {
      icon: Wallet,
      title: language === "ar" ? "خدمات التمويل العقاري" : "Mortgage Services",
      content: language === "ar"
        ? "للتمويل العقاري، يمكننا تقديمك إلى بنوك ومتخصصين في التمويل العقاري يعملون تحت تراخيصهم الخاصة."
        : "For mortgage services, we can introduce you to banks and mortgage specialists who operate under their own licenses."
    },
    {
      icon: Users,
      title: language === "ar" ? "خدمات الشركاء المستقلين" : "Independent Partner Services",
      content: language === "ar"
        ? "جميع خدمات الأطراف الثالثة (القانونية، التمويل، إدارة الممتلكات) تُقدَّم من قبل متخصصين مرخصين مستقلين. يتعاقد العملاء مباشرة مع هؤلاء المزودين."
        : "All third-party services (legal, mortgage, property management) are provided by independent licensed professionals. Clients contract directly with these providers."
    }
  ];

  if (variant === "full") {
    return (
      <div className={`bg-[#FDFBF7]/80 backdrop-blur-md border border-[#1A1A1A] rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 jj-pill-emerald-metallic border-0 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div>
            <h4 className="text-white font-semibold">
              {language === "ar" ? "إشعار قانوني وإخلاء مسؤولية" : "Legal Notice & Disclaimer"}
            </h4>
            <p className="text-white/90 text-xs">
              {language === "ar" ? "جي بي جي جلوبال للعقارات | وساطة عقارية" : "JBJ Global Real Estate | Real Estate Brokerage"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {fullDisclaimerPoints.map((point) => (
            <div key={point.title} className="flex items-start gap-3">
              <point.icon className="w-4 h-4 text-[#1A1A1A] flex-shrink-0 mt-1" />
              <div>
                <p className="text-white text-sm font-medium mb-1">{point.title}</p>
                <p className="text-white/70 text-sm leading-relaxed">{point.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[#1A1A1A]">
          <p className="text-[#1A1A1A]/70 text-xs text-center">
            © {currentYear} JBJ Global Real Estate Brokerage | 
            <Link to="/privacy" className="text-[#1A1A1A] hover:underline ml-1">Privacy Policy</Link> | 
            <Link to="/terms" className="text-[#1A1A1A] hover:underline ml-1">Terms of Service</Link>
          </p>
        </div>
      </div>
    );
  }

  if (variant === "short") {
    return (
      <div className={`bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200/80 text-xs leading-relaxed">
            {language === "ar" ? shortDisclaimerAR : shortDisclaimerEN}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "brokerage-cta") {
    return (
      <div className={`bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-medium mb-1">
              {language === "ar" ? "استشارة وساطة عقارية" : "Real Estate Brokerage Consultation"}
            </p>
            <p className="text-white/70 text-xs leading-relaxed">
              {language === "ar" 
                ? "هذه الاستشارة لإرشادات الوساطة العقارية وتقديمات الشركاء فقط."
                : "This consultation is for real estate brokerage guidance and partner introductions."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "partners-intro") {
    return (
      <div className={`bg-[#064E3B]/5 border border-[#064E3B]/20 rounded-xl p-6 md:p-8 ${className}`}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#064E3B] flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#064E3B] text-base font-semibold mb-2">
              {language === "ar" ? "دليل الشركاء" : "Partner Directory"}
            </p>
            <p className="text-[#1A1A1A]/70 text-sm leading-relaxed mb-4">
              {language === "ar"
                ? "نقدم لك متخصصين مستقلين ومرخصين لخدمات خارج نطاق الوساطة. يعمل الشركاء بشكل مستقل ويتعاقدون مباشرة مع العملاء. جي بي جي تسهل التقديمات فقط."
                : "We introduce independent licensed professionals for services outside brokerage scope. Partners operate independently and contract directly with clients. JBJ facilitates introductions only."}
            </p>
            <div className="flex flex-wrap gap-2">
              {["Law Firms", "Mortgage Specialists", "Property Managers", "Conveyancers"].map((partner) => (
                <span
                  key={partner}
                  className="text-xs font-medium text-[#064E3B] bg-[#064E3B]/10 border border-[#064E3B]/20 px-3 py-1.5 rounded-full"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default compact variant
  return (
    <div className={`text-center ${className}`}>
      <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">
        © {currentYear} JBJ Global Real Estate Brokerage. All Rights Reserved.
        <span className="block mt-1">
          Licensed brokerage services. Partner services via independent professionals.
        </span>
      </p>
    </div>
  );
};

export default ComplianceDisclaimer;