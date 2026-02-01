import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, ArrowUpRight, Briefcase, Phone, Mail, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import jbjMonogramTransparent from "@/assets/jbj-monogram-transparent.png";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import Footer from "@/components/Footer";

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
    <>
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/3 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 w-full">
          {/* Active Layer wrapper (required for all 404s) */}
          <div className="jj-layer-2 max-w-5xl mx-auto">
            {/* Locked Champagne card holds EVERYTHING, including contact */}
            <motion.div
              className="jj-card-inner rounded-2xl text-center p-8 md:p-12"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Logo - transparent background version */}
              <motion.div variants={fadeInUp} className="mb-6">
                <img
                  src={jbjMonogramTransparent}
                  alt="JBJ Global Real Estate"
                  className="w-24 h-24 mx-auto object-contain"
                />
              </motion.div>

              {/* 404 */}
              <motion.h1
                variants={fadeInUp}
                className="text-7xl md:text-[140px] font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold leading-none"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                404
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-2xl md:text-3xl text-black font-semibold mb-3"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Page Not Found
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="text-black/70 text-base md:text-lg mb-8 max-w-md mx-auto leading-relaxed"
              >
                The page you are looking for does not exist or has been moved.
              </motion.p>

              {/* Navigation Buttons (Primary/Secondary only) */}
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
                <Button variant="primary" asChild>
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/broker-toolkit">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Broker Tools
                  </Link>
                </Button>
                <Button variant="secondary" onClick={() => window.history.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </motion.div>

              {/* Contact Details (inside SAME card) */}
              <motion.div variants={fadeInUp} className="mt-8 pt-6 border-t border-gold/20">
                <p className="text-black/70 text-sm mb-4">Need assistance? Contact us directly:</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="secondary" asChild>
                    <a href={getWhatsAppUrl()}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button variant="secondary" asChild>
                    <a href={`tel:${CONTACT_INFO.phoneRaw}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </a>
                  </Button>
                  <Button variant="secondary" asChild>
                    <a href={`mailto:${CONTACT_INFO.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    
      {/* Footer Section */}
      <Footer />
    </>
  );
};

export default NotFound;