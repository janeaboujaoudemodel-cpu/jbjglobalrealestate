import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Home,
  ArrowLeft,
  ArrowUpRight,
  Search,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  BookOpen,
  Users,
  Briefcase,
  MapPin,
  Calculator,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jbjMonogramLightBg from "@/assets/jbj-monogram-nobuffer.png";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
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
    // Server-side observability only; never render the path to end users.
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    // Full-bleed light surface that fills the entire content lane (sidebar edge → right edge).
    // MainLayout already provides md:pt-[88px] for the header, so we only add comfortable inner padding.
    <div className="w-full bg-background min-h-[calc(100dvh-88px)] flex items-center justify-center px-4 sm:px-6 lg:px-10 py-12 sm:py-16 mb-8">
      <motion.div
        className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-sm text-center p-6 sm:p-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Logo */}
        <motion.div variants={fadeInUp} className="mb-5">
          <img
            src={jbjMonogramLightBg}
            alt="JBJ GLOBAL REAL ESTATE"
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto object-contain"
           loading="lazy" decoding="async" />
        </motion.div>

        {/* 404 number */}
        <motion.h1
          variants={fadeInUp}
          className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2 text-foreground leading-none tracking-tight"
        >
          404
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="text-lg sm:text-xl md:text-2xl text-foreground font-semibold mb-2"
        >
          Page Not Found
        </motion.p>

        <motion.p
          variants={fadeInUp}
          className="text-muted-foreground text-sm sm:text-base mb-6 max-w-md mx-auto"
        >
          The page you're looking for doesn't exist or has been moved. Use the search below or
          explore our popular destinations.
        </motion.p>

        {/* Search */}
        <motion.form
          variants={fadeInUp}
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search properties, areas, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" variant="primary" size="default">
            Search
          </Button>
        </motion.form>

        {/* Popular destinations */}
        <motion.div variants={fadeInUp} className="mb-8">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
            Popular Destinations
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {popularDestinations.map((dest) => (
              <Link
                key={dest.href}
                to={dest.href}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-all text-foreground"
              >
                <dest.icon className="w-4 h-4 text-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate">{dest.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Primary navigation */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center mb-6"
        >
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

        {/* Need assistance */}
        <motion.div variants={fadeInUp} className="pt-6 border-t border-border">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
            Need Assistance?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="secondary" size="sm" asChild>
              <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
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
      </motion.div>
    </div>
  );
};

export default NotFound;
