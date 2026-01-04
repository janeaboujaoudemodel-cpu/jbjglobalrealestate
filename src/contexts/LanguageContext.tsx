import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.founder': 'Founder & Leadership',
    'nav.about': 'About Us',
    'nav.properties': 'Properties',
    'nav.services': 'Services',
    'nav.awards': 'Awards',
    'nav.news': 'News & Insights',
    'nav.contact': 'Contact',
    'nav.signIn': 'Sign In',
    'nav.signOut': 'Sign Out',
    'nav.admin': 'Admin Panel',
    'nav.favorites': 'Favorites',
    
    // Homepage
    'home.hero.welcome': 'Welcome to JJ Global Capital',
    'home.hero.tagline': 'Your Gateway to Global Real Estate Investments & Concierge',
    'home.hero.subtitle': 'A founder-led advisory specializing in UAE and Dubai real estate',
    'home.hero.exclusive': 'Exclusive Properties',
    'home.cta.explore': 'Explore Our Services',
    'home.cta.properties': 'Explore Properties',
    'home.cta.contact': 'Contact Us',
    'home.cta.aiFinder': 'AI Home Finder',
    'home.cta.aiSubtitle': 'AI-Powered Property Matching',
    'home.cta.listProperty': 'List Your Property',
    'home.cta.concierge': 'Luxury Concierge',
    'home.cta.designBuild': 'Design & Build',
    'home.cta.lawFirm': 'Law Firm',
    'home.cta.marketReport': 'Market Report',
    'home.cta.mortgage': 'Mortgage Advisory',
    'home.cta.news': 'News & Insights',
    'home.cta.favorites': 'Favorites & Shortlist',
    'home.welcome.create': 'We Create',
    'home.welcome.elevate': 'We Elevate',
    'home.welcome.lead': 'We Lead',
    'home.discover': 'Discover',
    
    // Stats
    'home.stats.portfolio': 'Portfolio Value',
    'home.stats.years': 'Years Experience',
    'home.stats.propertiesSold': 'Properties Sold',
    'home.stats.propertiesManaged': 'Properties Managed',
    'home.stats.countries': 'Countries Served',
    'home.stats.trackRecord': 'Our Track Record',
    'home.stats.trusted': 'Trusted by',
    'home.stats.worldwide': 'Worldwide',
    
    // Founder Section
    'founder.leadership': 'Leadership',
    'founder.meetThe': 'Meet the',
    'founder.founder': 'Founder',
    'founder.divisions': 'Divisions',
    'founder.years': 'Years',
    'founder.countries': 'Countries',
    'founder.learnMore': 'Learn More About Our Founder',
    'founder.title': 'Founder & Chairwoman',
    'founder.description1': 'JJ Holding Group is a founder-led, multi-division holding built on unwavering standards, discretion, and long-term vision.',
    'founder.description2': 'Jane Abou Jaoude leads with a philosophy rooted in accountability and discretion, building organizations designed to endure rather than simply expand.',
    
    // Market Report
    'report.exclusive': 'Exclusive Free Download',
    'report.title': 'JJ Global Capital',
    'report.edition': 'Latest Edition 2026',
    'report.description': 'An exclusive educational book authored by Jane Abou Jaoude, covering the UAE real estate market with government-backed data and structured frameworks.',
    'report.download': 'Download Your Free Book Now',
    'report.highlight1': 'Market indicators & transaction analysis',
    'report.highlight2': 'Developer comparison framework',
    'report.highlight3': 'Investment due diligence checklist',
    'report.highlight4': 'Community ROI rankings',
    
    // Mortgage
    'mortgage.title': 'Mortgage Advisory',
    'mortgage.subtitle': 'Expert guidance for your property financing',
    'mortgage.calculator': 'Mortgage Calculator',
    'mortgage.financial': 'Financial Planning',
    'mortgage.estimate': 'Estimate your monthly payments and plan your investment with precision',
    'mortgage.propertyPrice': 'Property Price',
    'mortgage.downPayment': 'Down Payment',
    'mortgage.interestRate': 'Interest Rate',
    'mortgage.loanTerm': 'Loan Term',
    'mortgage.monthly': 'Monthly Payment',
    'mortgage.loanAmount': 'Loan Amount',
    'mortgage.totalInterest': 'Total Interest',
    'mortgage.total': 'Total Payment',
    'mortgage.getAdvisory': 'Get Mortgage Advisory',
    'mortgage.contactAdvisor': 'Contact Advisor',
    
    // Properties
    'properties.title': 'Properties',
    'properties.subtitle': 'Curated Listings. Global Standard.',
    'properties.search': 'Search',
    'properties.location': 'Location',
    'properties.developer': 'Developer',
    'properties.price': 'Price Range',
    'properties.bedrooms': 'Bedrooms',
    'properties.bathrooms': 'Bathrooms',
    'properties.type': 'Property Type',
    'properties.status': 'Status',
    'properties.clear': 'Clear Filters',
    'properties.noResults': 'No properties found',
    'properties.requestInfo': 'Request Information',
    'properties.browse': 'Browse Properties',
    
    // Contact Section
    'contact.title': 'Contact Us',
    'contact.subtitle': 'Get in touch with our team',
    'contact.readyToInvest': 'Ready to Invest?',
    'contact.getStarted': 'Get Started',
    'contact.connectDescription': 'Connect with our team to discover exclusive off-plan opportunities and start your UAE investment journey today.',
    'contact.location': 'Location',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.hours': 'Business Hours',
    'contact.whatsapp': 'WhatsApp',
    'contact.callNow': 'Call Now',
    
    // Inquiry Form
    'inquiry.title': 'Request Information',
    'inquiry.subtitle': 'Fill out the form below and our team will contact you shortly',
    'inquiry.fullName': 'Full Name',
    'inquiry.email': 'Email Address',
    'inquiry.phone': 'Phone Number',
    'inquiry.nationality': 'Nationality',
    'inquiry.language': 'Preferred Language',
    'inquiry.message': 'Message (Optional)',
    'inquiry.submit': 'Submit Inquiry',
    'inquiry.success': 'Thank you! We will contact you shortly.',
    'inquiry.error': 'Something went wrong. Please try again.',
    
    // Footer
    'footer.newsletter': 'Subscribe to Newsletter',
    'footer.stayInLoop': 'Stay in the Loop',
    'footer.joinCircle': 'Join our exclusive circle for market insights and premium opportunities',
    'footer.enterEmail': 'Enter your email',
    'footer.subscribe': 'Subscribe',
    'footer.menu': 'Menu',
    'footer.divisions': 'Our Divisions',
    'footer.getInTouch': 'Get In Touch',
    'footer.rights': 'All Rights Reserved',
    'footer.poweredBy': 'Powered by',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    
    // Welcome Modal
    'welcome.title': 'Welcome to JJ Global Capital',
    'welcome.titleReturning': 'Welcome Back!',
    'welcome.subtitle': 'Your gateway to global real estate investments with expertise in the UAE market',
    'welcome.subtitleReturning': 'We are glad you are back. Continue exploring premium properties.',
    'welcome.signIn': 'Sign In / Create Account',
    'welcome.guest': 'Continue as Guest',
    
    // AI Comparison
    'ai.title': 'AI Property Comparison',
    'ai.subtitle': 'Intelligent analysis powered by advanced AI',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.learnMore': 'Learn More',
    'common.viewAll': 'View All',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.required': 'Required',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.founder': 'المؤسس والقيادة',
    'nav.about': 'من نحن',
    'nav.properties': 'العقارات',
    'nav.services': 'الخدمات',
    'nav.awards': 'الجوائز',
    'nav.news': 'الأخبار والرؤى',
    'nav.contact': 'اتصل بنا',
    'nav.signIn': 'تسجيل الدخول',
    'nav.signOut': 'تسجيل الخروج',
    'nav.admin': 'لوحة الإدارة',
    'nav.favorites': 'المفضلة',
    
    // Homepage
    'home.hero.welcome': 'مرحباً بك في جي جي جلوبال كابيتال',
    'home.hero.tagline': 'بوابتك للاستثمارات العقارية العالمية والخدمات الفاخرة',
    'home.hero.subtitle': 'شركة استشارية متخصصة في العقارات الإماراتية والدبي',
    'home.hero.exclusive': 'عقارات حصرية',
    'home.cta.explore': 'استكشف خدماتنا',
    'home.cta.properties': 'استكشف العقارات',
    'home.cta.contact': 'اتصل بنا',
    'home.cta.aiFinder': 'مكتشف العقارات الذكي',
    'home.cta.aiSubtitle': 'مطابقة العقارات بالذكاء الاصطناعي',
    'home.cta.listProperty': 'أدرج عقارك',
    'home.cta.concierge': 'خدمات الكونسيرج الفاخرة',
    'home.cta.designBuild': 'التصميم والبناء',
    'home.cta.lawFirm': 'المكتب القانوني',
    'home.cta.marketReport': 'تقرير السوق',
    'home.cta.mortgage': 'الاستشارات العقارية',
    'home.cta.news': 'الأخبار والرؤى',
    'home.cta.favorites': 'المفضلة والقائمة المختصرة',
    'home.welcome.create': 'نبتكر',
    'home.welcome.elevate': 'نرتقي',
    'home.welcome.lead': 'نقود',
    'home.discover': 'اكتشف',
    
    // Stats
    'home.stats.portfolio': 'قيمة المحفظة',
    'home.stats.years': 'سنوات الخبرة',
    'home.stats.propertiesSold': 'العقارات المباعة',
    'home.stats.propertiesManaged': 'العقارات المُدارة',
    'home.stats.countries': 'دول نخدمها',
    'home.stats.trackRecord': 'سجل إنجازاتنا',
    'home.stats.trusted': 'موثوق من قبل',
    'home.stats.worldwide': 'حول العالم',
    
    // Founder Section
    'founder.leadership': 'القيادة',
    'founder.meetThe': 'تعرف على',
    'founder.founder': 'المؤسس',
    'founder.divisions': 'الأقسام',
    'founder.years': 'سنوات',
    'founder.countries': 'دول',
    'founder.learnMore': 'اعرف المزيد عن مؤسستنا',
    'founder.title': 'المؤسس والرئيس التنفيذي',
    'founder.description1': 'مجموعة جي جي القابضة هي مجموعة متعددة الأقسام تقودها المؤسس، مبنية على معايير ثابتة والتقدير والرؤية طويلة المدى.',
    'founder.description2': 'تقود جين أبو جودة بفلسفة متجذرة في المسؤولية والتقدير، وتبني منظمات مصممة للاستمرار بدلاً من التوسع فقط.',
    
    // Market Report
    'report.exclusive': 'تحميل مجاني حصري',
    'report.title': 'جي جي جلوبال كابيتال',
    'report.edition': 'أحدث إصدار 2026',
    'report.description': 'كتاب تعليمي حصري من تأليف جين أبو جودة، يغطي سوق العقارات الإماراتية ببيانات حكومية وأطر عمل منظمة.',
    'report.download': 'حمل كتابك المجاني الآن',
    'report.highlight1': 'مؤشرات السوق وتحليل المعاملات',
    'report.highlight2': 'إطار مقارنة المطورين',
    'report.highlight3': 'قائمة العناية الواجبة للاستثمار',
    'report.highlight4': 'تصنيفات عائد الاستثمار للمجتمعات',
    
    // Mortgage
    'mortgage.title': 'الاستشارات العقارية',
    'mortgage.subtitle': 'إرشادات متخصصة لتمويل عقارك',
    'mortgage.calculator': 'حاسبة التمويل العقاري',
    'mortgage.financial': 'التخطيط المالي',
    'mortgage.estimate': 'قدّر دفعاتك الشهرية وخطط لاستثمارك بدقة',
    'mortgage.propertyPrice': 'سعر العقار',
    'mortgage.downPayment': 'الدفعة المقدمة',
    'mortgage.interestRate': 'معدل الفائدة',
    'mortgage.loanTerm': 'مدة القرض',
    'mortgage.monthly': 'الدفعة الشهرية',
    'mortgage.loanAmount': 'مبلغ القرض',
    'mortgage.totalInterest': 'إجمالي الفوائد',
    'mortgage.total': 'إجمالي المدفوعات',
    'mortgage.getAdvisory': 'احصل على استشارة عقارية',
    'mortgage.contactAdvisor': 'تواصل مع مستشار',
    
    // Properties
    'properties.title': 'العقارات',
    'properties.subtitle': 'قوائم مختارة. معايير عالمية.',
    'properties.search': 'بحث',
    'properties.location': 'الموقع',
    'properties.developer': 'المطور',
    'properties.price': 'نطاق السعر',
    'properties.bedrooms': 'غرف النوم',
    'properties.bathrooms': 'الحمامات',
    'properties.type': 'نوع العقار',
    'properties.status': 'الحالة',
    'properties.clear': 'مسح الفلاتر',
    'properties.noResults': 'لم يتم العثور على عقارات',
    'properties.requestInfo': 'طلب معلومات',
    'properties.browse': 'تصفح العقارات',
    
    // Contact Section
    'contact.title': 'اتصل بنا',
    'contact.subtitle': 'تواصل مع فريقنا',
    'contact.readyToInvest': 'مستعد للاستثمار؟',
    'contact.getStarted': 'ابدأ الآن',
    'contact.connectDescription': 'تواصل مع فريقنا لاكتشاف فرص العقارات الحصرية وابدأ رحلتك الاستثمارية في الإمارات اليوم.',
    'contact.location': 'الموقع',
    'contact.phone': 'الهاتف',
    'contact.email': 'البريد الإلكتروني',
    'contact.hours': 'ساعات العمل',
    'contact.whatsapp': 'واتساب',
    'contact.callNow': 'اتصل الآن',
    
    // Inquiry Form
    'inquiry.title': 'طلب معلومات',
    'inquiry.subtitle': 'املأ النموذج أدناه وسيتواصل معك فريقنا قريباً',
    'inquiry.fullName': 'الاسم الكامل',
    'inquiry.email': 'البريد الإلكتروني',
    'inquiry.phone': 'رقم الهاتف',
    'inquiry.nationality': 'الجنسية',
    'inquiry.language': 'اللغة المفضلة',
    'inquiry.message': 'الرسالة (اختياري)',
    'inquiry.submit': 'إرسال الاستفسار',
    'inquiry.success': 'شكراً لك! سنتواصل معك قريباً.',
    'inquiry.error': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    
    // Footer
    'footer.newsletter': 'اشترك في النشرة الإخبارية',
    'footer.stayInLoop': 'ابق على اطلاع',
    'footer.joinCircle': 'انضم إلى دائرتنا الحصرية للحصول على رؤى السوق والفرص المميزة',
    'footer.enterEmail': 'أدخل بريدك الإلكتروني',
    'footer.subscribe': 'اشترك',
    'footer.menu': 'القائمة',
    'footer.divisions': 'أقسامنا',
    'footer.getInTouch': 'تواصل معنا',
    'footer.rights': 'جميع الحقوق محفوظة',
    'footer.poweredBy': 'مدعوم من',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.terms': 'شروط الخدمة',
    
    // Welcome Modal
    'welcome.title': 'مرحباً بك في جي جي جلوبال كابيتال',
    'welcome.titleReturning': 'مرحباً بعودتك!',
    'welcome.subtitle': 'بوابتك للاستثمارات العقارية العالمية مع خبرة في سوق الإمارات',
    'welcome.subtitleReturning': 'نحن سعداء بعودتك. استمر في استكشاف العقارات الفاخرة.',
    'welcome.signIn': 'تسجيل الدخول / إنشاء حساب',
    'welcome.guest': 'المتابعة كضيف',
    
    // AI Comparison
    'ai.title': 'مقارنة العقارات بالذكاء الاصطناعي',
    'ai.subtitle': 'تحليل ذكي مدعوم بالذكاء الاصطناعي المتقدم',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.learnMore': 'اعرف المزيد',
    'common.viewAll': 'عرض الكل',
    'common.close': 'إغلاق',
    'common.submit': 'إرسال',
    'common.cancel': 'إلغاء',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.required': 'مطلوب',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'jj_language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return (stored as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    // Keep layout stable (no mirroring); only change language.
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Set initial language only (keep LTR layout)
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const isRTL = false;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
