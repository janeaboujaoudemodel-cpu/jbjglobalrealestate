import { Link } from "react-router-dom";
import { 
  Building, Calculator, Scale, Palette, 
  Briefcase, Home, Paintbrush, ChevronRight
} from "lucide-react";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

const services = [
  {
    icon: Building,
    title: "Property Management",
    description: "Professional property management services for your UAE investments",
  },
  {
    icon: Briefcase,
    title: "Investment Advisory",
    description: "Expert guidance on real estate investment strategies",
  },
  {
    icon: Calculator,
    title: "Mortgage Advisory",
    description: "Tailored mortgage solutions for property financing",
  },
  {
    icon: Scale,
    title: "Legal Services",
    description: "Real estate law firm expertise for transactions",
  },
  {
    icon: Palette,
    title: "Architecture",
    description: "Innovative architectural design solutions",
  },
  {
    icon: Paintbrush,
    title: "Interior Design & Fit Out",
    description: "Luxury interior design and complete fit-out services",
  },
];

const ServicesSection = () => {
  return (
    <section className="relative py-20 overflow-hidden jj-services">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-gold text-sm tracking-widest uppercase mb-2">
            Complete Solutions
          </p>
          <h2 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Our Services
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Beyond property sales, we offer comprehensive real estate services to support your investment journey
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <a
              key={index}
              href={INQUIRY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
            >
              <div className="jj-cube rounded-lg p-6 h-full flex flex-col transition-all duration-300 group-hover:border-gold/30 group-hover:-translate-y-1">
                <div className="jj-cube-topline rounded-t-lg" />
                
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center mb-4 group-hover:border-gold/40 transition-colors">
                  <service.icon className="w-6 h-6 text-gold" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-zinc-400 mb-4 flex-grow">
                  {service.description}
                </p>

                {/* CTA */}
                <div className="flex items-center text-gold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Inquire Now</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gold/3 rounded-full blur-3xl pointer-events-none" />
      </div>
    </section>
  );
};

export default ServicesSection;
