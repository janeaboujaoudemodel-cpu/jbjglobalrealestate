import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft, ArrowUpRight, Search, Phone, Mail, MessageCircle, Building2, BookOpen, Users, Briefcase, MapPin, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";


const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

// Popular destinations for quick navigation
const popularDestinations = [
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "Communities", href: "/communities", icon: MapPin },
  { label: "Services", href: "/services", icon: Briefcase },
  { label: "Guides Library", href: "/guides", icon: BookOpen },
  { label: "Meet the Team", href: "/team", icon: Users },
  { label: "Mortgage Calculator", href: "/mortgage-calculator", icon: Calculator },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to properties with search query
      navigate(`/properties?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Add top padding to account for fixed header (h-24 sm:h-28 lg:h-32) */}
      <div className="jj-hero-fullscreen min-h-screen bg-black relative overflow-hidden flex items-center justify-center py-12 pt-32 lg:pt-40">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/3 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 w-full px-4">
          {/* Active Layer wrapper */}
          <div className="jj-layer-2 max-w-4xl mx-auto">
            {/* Main card */}
            <motion.div
              className="jj-card-inner rounded-2xl text-center p-6 md:p-10"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Logo - Larger monogram */}
              <motion.div variants={fadeInUp} className="mb-6">
                <img
                  src={jbjMonogramLightBg}
                  alt="JBJ Global Real Estate"
                  className="w-28 h-28 md:w-32 md:h-32 mx-auto object-contain"
                />
              </motion.div>

              {/* 404 */}
              <motion.h1
                variants={fadeInUp}
                className="text-6xl md:text-[100px] font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold leading-none"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                404
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl md:text-2xl text-black font-semibold mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Page Not Found
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="text-black/70 text-sm md:text-base mb-6 max-w-md mx-auto"
              >
                The page you're looking for doesn't exist or has been moved. Use the search below or explore our popular destinations.
              </motion.p>

              {/* Search Bar */}
              <motion.form
                variants={fadeInUp}
                onSubmit={handleSearch}
                className="flex gap-2 max-w-md mx-auto mb-8"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
                  <Input
                    type="text"
                    placeholder="Search properties, areas, services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gold/30 focus:border-gold text-black placeholder:text-black/50"
                  />
                </div>
                <Button type="submit" variant="primary" size="default">
                  Search
                </Button>
              </motion.form>

              {/* Popular Destinations */}
              <motion.div variants={fadeInUp} className="mb-8">
                <p className="text-black/60 text-xs uppercase tracking-wider mb-3">Popular Destinations</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {popularDestinations.map((dest) => (
                    <Link
                      key={dest.href}
                      to={dest.href}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black/5 hover:bg-gold/20 border border-transparent hover:border-gold/30 transition-all group"
                    >
                      <dest.icon className="w-4 h-4 text-gold group-hover:text-gold" />
                      <span className="text-black text-sm font-medium">{dest.label}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Navigation Buttons */}
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center mb-6">
                <Button variant="primary" asChild>
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="secondary" onClick={() => window.history.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </motion.div>

              {/* Contact Details */}
              <motion.div variants={fadeInUp} className="pt-6 border-t border-gold/20">
                <p className="text-black/60 text-xs uppercase tracking-wider mb-3">Need Assistance?</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="secondary" size="sm" asChild>
                    <a href={getWhatsAppUrl()}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button variant="secondary" size="sm" asChild>
                    <a href={`tel:${CONTACT_INFO.phoneRaw}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call Us
                    </a>
                  </Button>
                  <Button variant="secondary" size="sm" asChild>
                    <a href={`mailto:${CONTACT_INFO.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                </div>
              </motion.div>

              {/* Attempted Path (for debugging) */}
              <motion.p variants={fadeInUp} className="mt-6 text-black/40 text-xs font-mono">
                Attempted path: {location.pathname}
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
