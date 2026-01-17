import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Briefcase, Phone, Sparkles, Mail, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import jbjMonogramDark from "@/assets/jbj-monogram-dark-bg.png";
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

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/3 rounded-full blur-2xl" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(45, 32%, 39%) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        </div>
      </div>
      
      {/* Gold accent lines */}
      <motion.div 
        className="absolute left-0 top-1/3 w-48 md:w-80 h-px bg-gradient-to-r from-gold/40 to-transparent"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      <motion.div 
        className="absolute right-0 bottom-1/3 w-48 md:w-80 h-px bg-gradient-to-l from-gold/40 to-transparent"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
      />
      
      <motion.div 
        className="relative z-10 text-center px-4 max-w-2xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Logo */}
        <motion.div variants={fadeInUp} className="mb-8">
          <img 
            src={jbjMonogramDark} 
            alt="JBJ Global Real Estate" 
            className="w-20 h-20 mx-auto object-contain opacity-60"
          />
        </motion.div>
        
        {/* 404 Number with Gradient */}
        <motion.h1 
          variants={fadeInUp}
          className="text-8xl md:text-[150px] font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold leading-none" 
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          404
        </motion.h1>
        
        {/* Title */}
        <motion.p 
          variants={fadeInUp}
          className="text-2xl md:text-3xl text-white font-semibold mb-4"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Page Not Found
        </motion.p>
        
        {/* Description */}
        <motion.p 
          variants={fadeInUp}
          className="text-zinc-400 text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved. Let us help you find your way.
        </motion.p>
        
        {/* Navigation Buttons */}
        <motion.div 
          variants={fadeInUp}
          className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mb-12"
        >
          <Link to="/">
            <Button variant="gold" className="px-8 py-5 text-sm w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link to="/broker-toolkit">
            <Button variant="goldOutline" className="px-8 py-5 text-sm w-full sm:w-auto">
              <Briefcase className="w-4 h-4 mr-2" />
              Broker Tools
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="goldOutline" className="px-8 py-5 text-sm w-full sm:w-auto">
              <Phone className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </Link>
        </motion.div>
        
        {/* Go Back Button */}
        <motion.div variants={fadeInUp}>
          <Button 
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-zinc-500 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </motion.div>
        
        {/* Contact Info */}
        <motion.div 
          variants={fadeInUp}
          className="mt-12 pt-8 border-t border-zinc-800"
        >
          <p className="text-zinc-600 text-sm mb-4">Need assistance? Contact us directly:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href={`tel:${CONTACT_INFO.phoneRaw}`}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors text-sm"
            >
              <Phone className="w-4 h-4" />
              {CONTACT_INFO.phone}
            </a>
            <a 
              href={`mailto:${CONTACT_INFO.email}`}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              {CONTACT_INFO.email}
            </a>
            <a 
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;