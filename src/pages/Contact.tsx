import { useState } from "react";
import { MapPin, Phone, Mail, Clock, ArrowUpRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import InquiryFormModal from "@/components/InquiryFormModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";

const Contact = () => {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const { t } = useLanguage();

  const contactInfo = [
    {
      icon: MapPin,
      title: t('contact.location'),
      lines: ["Downtown Dubai", "United Arab Emirates"],
      action: null,
    },
    {
      icon: Phone,
      title: t('contact.phone'),
      lines: [CONTACT_INFO.phone],
      action: { type: "call", url: getCallUrl() },
    },
    {
      icon: Mail,
      title: t('contact.email'),
      lines: [CONTACT_INFO.emailCapitalized],
      action: { type: "email", url: getEmailUrl() },
    },
    {
      icon: Clock,
      title: t('contact.hours'),
      lines: ["Sun - Thu: 9:00 AM - 6:00 PM", "Fri - Sat: By Appointment"],
      action: null,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />
        <div className="relative container mx-auto px-4">
          <p className="text-gold text-sm uppercase tracking-widest mb-4">{t('contact.title')}</p>
          <h1 
            className="text-white text-4xl md:text-6xl font-bold mb-6 max-w-3xl"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Let's Start Your Journey
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
            {t('contact.subtitle')}. Our team of expert advisors is ready to guide you through your next investment. 
            Reach out today for a confidential consultation.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16 border-y border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((item) => (
              <div 
                key={item.title}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-gold/30 transition-colors"
              >
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-white font-semibold mb-3">{item.title}</h3>
                {item.action ? (
                  <a 
                    href={item.action.url}
                    className="text-zinc-400 hover:text-gold transition-colors text-sm block"
                  >
                    {item.lines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </a>
                ) : (
                  item.lines.map((line, i) => (
                    <p key={i} className="text-zinc-400 text-sm">{line}</p>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main CTA - Opens Inquiry Form */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Invest?
            </h2>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
              Complete our investment inquiry form and one of our senior advisors will 
              contact you within 24 hours to discuss your goals and opportunities.
            </p>
            <Button 
              onClick={() => setIsInquiryOpen(true)}
              className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90 px-10 py-6 h-auto text-lg font-semibold"
            >
              Start Your Inquiry
              <ArrowUpRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Direct Contact CTAs */}
      <section className="py-16 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* WhatsApp CTA */}
            <a 
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-6 bg-black border border-green-800/50 hover:border-green-600 rounded-xl p-6 transition-all group hover:shadow-lg hover:shadow-green-600/20"
            >
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {t('contact.whatsapp')}
                </h3>
                <p className="text-zinc-400 text-sm">
                  Connect instantly for immediate assistance
                </p>
              </div>
            </a>

            {/* Call CTA */}
            <a 
              href={getCallUrl()}
              className="flex items-center gap-6 bg-black border border-gold/30 hover:border-gold rounded-xl p-6 transition-all group hover:shadow-lg hover:shadow-gold/20"
            >
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {t('contact.callNow')}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {CONTACT_INFO.phone}
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Inquiry Form Modal */}
      <InquiryFormModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
        source="contact-page"
      />
    </div>
  );
};

export default Contact;
