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
    'home.hero.tagline': 'Your Gateway to Global Real Estate Investments & Concierge',
    'home.hero.subtitle': 'Premium properties and advisory services across the UAE and beyond',
    'home.cta.explore': 'Explore Our Services',
    'home.cta.properties': 'Explore Properties',
    'home.cta.contact': 'Contact Us',
    'home.cta.aiFinder': 'AI Home Finder',
    'home.welcome.create': 'We Create',
    'home.welcome.elevate': 'We Elevate',
    'home.welcome.lead': 'We Lead',
    'home.stats.portfolio': 'Portfolio Value',
    'home.stats.years': 'Years Experience',
    'home.stats.countries': 'Countries Served',
    'home.stats.clients': 'Happy Clients',
    
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
    
    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': 'Get in touch with our team',
    'contact.location': 'Location',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.hours': 'Business Hours',
    'contact.whatsapp': 'WhatsApp',
    'contact.callNow': 'Call Now',
    
    // Footer
    'footer.newsletter': 'Subscribe to Newsletter',
    'footer.enterEmail': 'Enter your email',
    'footer.subscribe': 'Subscribe',
    'footer.menu': 'Menu',
    'footer.divisions': 'Our Divisions',
    'footer.getInTouch': 'Get In Touch',
    'footer.rights': 'All Rights Reserved',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    
    // Welcome Modal
    'welcome.title': 'Welcome to JJ Global Capital',
    'welcome.titleReturning': 'Welcome Back!',
    'welcome.subtitle': 'Your gateway to global real estate investments with expertise in the UAE market',
    'welcome.subtitleReturning': 'We\'re glad you\'re back. Continue exploring premium properties.',
    'welcome.saveFavorites': 'Save your favorite properties:',
    'welcome.tapHeart': 'Tap heart to add to',
    'welcome.tapList': 'Tap list to add to',
    'welcome.favorites': 'Favorites',
    'welcome.shortlist': 'Shortlist',
    'welcome.comparison': 'for comparison',
    'welcome.signIn': 'Sign In / Create Account',
    'welcome.guest': 'Continue as Guest',
    'welcome.guestNote': 'Favorites & shortlist work even as a guest',
    
    // Mortgage
    'mortgage.title': 'Mortgage Advisory',
    'mortgage.subtitle': 'Expert guidance for your property financing',
    'mortgage.calculator': 'Mortgage Calculator',
    'mortgage.propertyPrice': 'Property Price',
    'mortgage.downPayment': 'Down Payment',
    'mortgage.interestRate': 'Interest Rate',
    'mortgage.loanTerm': 'Loan Term',
    'mortgage.monthly': 'Monthly Payment',
    'mortgage.total': 'Total Payment',
    'mortgage.contactAdvisor': 'Contact Advisor',
    
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
    'home.hero.tagline': 'بوابتك للاستثمارات العقارية العالمية والخدمات الفاخرة',
    'home.hero.subtitle': 'عقارات فاخرة وخدمات استشارية في الإمارات وخارجها',
    'home.cta.explore': 'استكشف خدماتنا',
    'home.cta.properties': 'استكشف العقارات',
    'home.cta.contact': 'اتصل بنا',
    'home.cta.aiFinder': 'مكتشف العقارات الذكي',
    'home.welcome.create': 'نبتكر',
    'home.welcome.elevate': 'نرتقي',
    'home.welcome.lead': 'نقود',
    'home.stats.portfolio': 'قيمة المحفظة',
    'home.stats.years': 'سنوات الخبرة',
    'home.stats.countries': 'دول نخدمها',
    'home.stats.clients': 'عملاء سعداء',
    
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
    
    // Contact
    'contact.title': 'اتصل بنا',
    'contact.subtitle': 'تواصل مع فريقنا',
    'contact.location': 'الموقع',
    'contact.phone': 'الهاتف',
    'contact.email': 'البريد الإلكتروني',
    'contact.hours': 'ساعات العمل',
    'contact.whatsapp': 'واتساب',
    'contact.callNow': 'اتصل الآن',
    
    // Footer
    'footer.newsletter': 'اشترك في النشرة الإخبارية',
    'footer.enterEmail': 'أدخل بريدك الإلكتروني',
    'footer.subscribe': 'اشترك',
    'footer.menu': 'القائمة',
    'footer.divisions': 'أقسامنا',
    'footer.getInTouch': 'تواصل معنا',
    'footer.rights': 'جميع الحقوق محفوظة',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.terms': 'شروط الخدمة',
    
    // Welcome Modal
    'welcome.title': 'مرحباً بك في جي جي جلوبال كابيتال',
    'welcome.titleReturning': 'مرحباً بعودتك!',
    'welcome.subtitle': 'بوابتك للاستثمارات العقارية العالمية مع خبرة في سوق الإمارات',
    'welcome.subtitleReturning': 'نحن سعداء بعودتك. استمر في استكشاف العقارات الفاخرة.',
    'welcome.saveFavorites': 'احفظ عقاراتك المفضلة:',
    'welcome.tapHeart': 'اضغط على القلب للإضافة إلى',
    'welcome.tapList': 'اضغط على القائمة للإضافة إلى',
    'welcome.favorites': 'المفضلة',
    'welcome.shortlist': 'القائمة المختصرة',
    'welcome.comparison': 'للمقارنة',
    'welcome.signIn': 'تسجيل الدخول / إنشاء حساب',
    'welcome.guest': 'المتابعة كضيف',
    'welcome.guestNote': 'المفضلة والقائمة المختصرة تعمل حتى كضيف',
    
    // Mortgage
    'mortgage.title': 'الاستشارات العقارية',
    'mortgage.subtitle': 'إرشادات متخصصة لتمويل عقارك',
    'mortgage.calculator': 'حاسبة التمويل العقاري',
    'mortgage.propertyPrice': 'سعر العقار',
    'mortgage.downPayment': 'الدفعة المقدمة',
    'mortgage.interestRate': 'معدل الفائدة',
    'mortgage.loanTerm': 'مدة القرض',
    'mortgage.monthly': 'الدفعة الشهرية',
    'mortgage.total': 'إجمالي المدفوعات',
    'mortgage.contactAdvisor': 'تواصل مع مستشار',
    
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
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Set initial direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const isRTL = language === 'ar';

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
