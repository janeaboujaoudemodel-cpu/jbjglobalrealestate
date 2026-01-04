import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      lines: ["Downtown Dubai", "United Arab Emirates"],
    },
    {
      icon: Phone,
      title: "Call Us",
      lines: ["+971-56-591-1000", "+971-4-XXX-XXXX"],
    },
    {
      icon: Mail,
      title: "Email Us",
      lines: ["invest@jjglobalcapital.com", "info@jjglobalcapital.com"],
    },
    {
      icon: Clock,
      title: "Business Hours",
      lines: ["Sun - Thu: 9:00 AM - 6:00 PM", "Fri - Sat: By Appointment"],
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />
        <div className="relative container mx-auto px-4">
          <p className="text-gold text-sm uppercase tracking-widest mb-4">Contact Us</p>
          <h1 
            className="text-white text-4xl md:text-6xl font-bold mb-6 max-w-3xl"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Let's Start Your Journey
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
            Our team of expert advisors is ready to guide you through your next investment. 
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
                {item.lines.map((line, i) => (
                  <p key={i} className="text-zinc-400 text-sm">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main CTA */}
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
            <a 
              href={INQUIRY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90 px-10 py-6 h-auto text-lg font-semibold">
                Start Your Inquiry
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-16 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Prefer WhatsApp?
              </h3>
              <p className="text-zinc-400">
                Connect with us instantly for immediate assistance.
              </p>
            </div>
            <a 
              href="https://wa.me/971565911000?text=Hi, I'm interested in learning more about investment opportunities with JJ Global Capital."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                variant="outline" 
                className="border-green-600 text-green-500 hover:bg-green-600 hover:text-white px-8 py-3 h-auto"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
