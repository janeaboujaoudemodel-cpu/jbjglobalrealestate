import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Search, Plane, Car, Hotel, Sparkles, Gem, Ship, Utensils, Wine, Music, Camera, Heart, Star } from "lucide-react";
import { CONTACT_INFO } from "@/constants/stats";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import coupleJetRolls from "@/assets/couple-jet-rolls.png";
import luxuryJetCar from "@/assets/luxury-jet-car.png";
import coupleJetInterior from "@/assets/couple-jet-interior.png";
import dubaiPlaneView from "@/assets/dubai-plane-view.png";
import coupleYachtSunset from "@/assets/couple-yacht-sunset.png";
import yachtDeckChampagne from "@/assets/yacht-deck-champagne.png";
import coupleYachtDubai from "@/assets/couple-yacht-dubai.png";
import propertyConsultation from "@/assets/property-consultation.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  services: string[];
  image: string;
}

const conciergeCategories: ServiceCategory[] = [
  {
    id: "aviation",
    title: "Private Aviation",
    description: "Exclusive private jet and helicopter charter services for seamless global travel",
    icon: Plane,
    services: ["Private Jet Charter", "Helicopter Transfers", "VIP Airport Services", "Aircraft Management"],
    image: coupleJetInterior
  },
  {
    id: "automotive",
    title: "Luxury Automotive",
    description: "Premium limousine services and exotic car rentals for discerning clients",
    icon: Car,
    services: ["Limousine Service", "Exotic Car Rental", "Chauffeur Services", "Luxury Fleet Management"],
    image: luxuryJetCar
  },
  {
    id: "hospitality",
    title: "Hotel & Accommodations",
    description: "Access to the world's most exclusive hotels, resorts, and private residences",
    icon: Hotel,
    services: ["Luxury Hotel Bookings", "Private Villa Rentals", "Palace Reservations", "VIP Suite Access"],
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
  },
  {
    id: "wellness",
    title: "Spa & Wellness",
    description: "World-class spa experiences and personalized wellness programs",
    icon: Heart,
    services: ["Luxury Spa Retreats", "Private Wellness Programs", "Medical Tourism", "Holistic Treatments"],
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80"
  },
  {
    id: "yachting",
    title: "Yacht & Marine",
    description: "Luxury yacht charters and exclusive marine experiences",
    icon: Ship,
    services: ["Yacht Charter", "Superyacht Experiences", "Island Hopping", "Crew Services"],
    image: coupleYachtDubai
  },
  {
    id: "dining",
    title: "Fine Dining",
    description: "Priority reservations at Michelin-starred restaurants and private dining experiences",
    icon: Utensils,
    services: ["Restaurant Reservations", "Private Chef Services", "Wine Experiences", "Culinary Tours"],
    image: yachtDeckChampagne
  },
  {
    id: "entertainment",
    title: "Entertainment & Events",
    description: "VIP access to exclusive events, concerts, and entertainment experiences",
    icon: Music,
    services: ["Concert VIP Tickets", "Fashion Week Access", "Sports Events", "Exclusive Parties"],
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80"
  },
  {
    id: "luxury-shopping",
    title: "Luxury Shopping",
    description: "Personal shopping experiences and access to exclusive boutiques",
    icon: Gem,
    services: ["Personal Stylist", "Private Showings", "Bespoke Tailoring", "Jewelry Sourcing"],
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
  },
  {
    id: "experiences",
    title: "Unique Experiences",
    description: "Bespoke experiences and once-in-a-lifetime adventures",
    icon: Star,
    services: ["Desert Safari VIP", "Hot Air Balloon", "Cultural Tours", "Adventure Expeditions"],
    image: dubaiPlaneView
  }
];

const Concierge = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = conciergeCategories.filter(category => {
    const matchesSearch = category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || category.id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Video/Image */}
        <div className="absolute inset-0">
          <img 
            src={coupleJetRolls}
            alt="Luxury Concierge"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        </div>

        {/* Hero Content */}
        <motion.div 
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 text-gold text-xs md:text-sm uppercase tracking-[0.4em] mb-6">
              <Sparkles className="w-4 h-4" />
              Luxury Concierge Services
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide mb-6 leading-tight"
            variants={fadeInUp}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Your Personal{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              Lifestyle Manager
            </span>
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Experience the pinnacle of luxury with our bespoke concierge services. From private aviation to exclusive experiences, we curate the extraordinary.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base">
                Request Concierge Services
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Search & Filter Section */}
      <section className="py-12 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                type="text"
                placeholder="Search luxury services (e.g., private jet, spa, yacht...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 text-lg rounded-xl focus:border-gold/50 focus:ring-gold/20"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory 
                    ? "bg-gold text-black" 
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                All Services
              </button>
              {conciergeCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.id 
                      ? "bg-gold text-black" 
                      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  {category.title}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-zinc-950">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {filteredCategories.map((category) => (
              <motion.div
                key={category.id}
                className="group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-gold/30 transition-all duration-500"
                variants={fadeInUp}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  
                  {/* Icon Badge */}
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-gold/20 backdrop-blur-sm border border-gold/30 flex items-center justify-center">
                    <category.icon className="w-6 h-6 text-gold" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 
                    className="text-white text-xl font-bold mb-2 group-hover:text-gold transition-colors"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {category.title}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>

                  {/* Services List */}
                  <ul className="space-y-2 mb-6">
                    {category.services.map((service, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-zinc-300 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                        {service}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                    <Button 
                      variant="outline" 
                      className="w-full border-gold/30 text-gold hover:bg-gold hover:text-black hover:border-gold transition-all"
                    >
                      Request Service
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* No Results */}
          {filteredCategories.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">No services found</h3>
              <p className="text-zinc-400">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Why Choose Our Concierge */}
      <section className="py-20 bg-gradient-to-b from-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Why Choose Us</span>
            <h2 
              className="text-white text-3xl md:text-4xl lg:text-5xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">JJ Difference</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { icon: Star, title: "24/7 Availability", desc: "Round-the-clock service for your every need" },
              { icon: Gem, title: "Exclusive Access", desc: "VIP access to the world's most exclusive venues" },
              { icon: Heart, title: "Personalized Service", desc: "Tailored experiences crafted just for you" },
              { icon: Camera, title: "Discretion Guaranteed", desc: "Complete privacy and confidentiality" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="text-center p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:border-gold/20 transition-all"
                variants={fadeInUp}
              >
                <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Ready to Begin?</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Experience Luxury Without Limits
            </h2>
            <p className="text-zinc-400 mb-8">
              Our dedicated concierge team is ready to curate your perfect experience. Let us handle the extraordinary.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base">
                  Contact Concierge
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href={`tel:${CONTACT_INFO.phone}`}>
                <Button 
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold px-8 py-6 text-base"
                >
                  Call {CONTACT_INFO.phone}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </section>
  );
};

export default Concierge;
