import { Link } from "react-router-dom";
import NavigationTabs from "@/components/NavigationTabs";
import DeveloperGrid from "@/components/DeveloperGrid";
import WhyDubaiSection from "@/components/WhyDubaiSection";
import ServicesSection from "@/components/ServicesSection";
import StatsCounter from "@/components/StatsCounter";
import Footer from "@/components/Footer";
import { Sparkles, ArrowUpRight, Building2, ClipboardCheck, Volume2, VolumeX, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import dubaiHeroVideo from "@/assets/dubai-hero-video.mp4";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
const propertyShortcuts = [
  { href: "/?status=off-plan", label: "Off-Plan Properties", icon: Building2 },
  { href: "/?status=ready", label: "Ready to Move", icon: ClipboardCheck },
];

const Index = () => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-[hsl(var(--premium-bg))]">
      {/* Hero Section with Video */}
      <div className="relative min-h-[70vh] md:min-h-[80vh] flex items-end">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={dubaiHeroVideo} type="video/mp4" />
          </video>
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
        </div>

        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 md:top-8 md:right-8 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center transition-colors group"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white group-hover:text-[#A8925A] transition-colors" />
          ) : (
            <Volume2 className="w-5 h-5 text-white group-hover:text-[#A8925A] transition-colors" />
          )}
        </button>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pb-12 md:pb-20">
          <div className="max-w-3xl">
            <div className="mb-4">
              <span className="inline-block bg-[#A8925A]/10 border border-[#A8925A]/30 text-[#A8925A] text-xs uppercase tracking-[0.2em] px-4 py-2 rounded-full backdrop-blur-sm">
                Premium Real Estate
              </span>
            </div>
            <h1 
              className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              UAE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A8925A] to-[#C4A962]">Real Estate</span>
            </h1>
            <p className="text-zinc-300 text-lg md:text-xl mb-8 max-w-2xl">
              Your trusted partner for premium properties across the UAE's most exclusive communities
            </p>

            {/* Quick Access Shortcuts */}
            <div className="flex flex-wrap gap-3">
              {propertyShortcuts.map((shortcut) => (
                <Link key={shortcut.href} to={shortcut.href}>
                  <Button 
                    variant="outline"
                    className="bg-black/40 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-[#A8925A]/50 h-12 px-6"
                  >
                    <shortcut.icon className="w-4 h-4 mr-2" />
                    {shortcut.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-white/50 z-10">
          <span className="text-xs uppercase tracking-widest">Explore</span>
          <div className="w-px h-10 bg-gradient-to-b from-[#A8925A] to-transparent animate-pulse" />
        </div>
      </div>

      {/* AI Property Matchmaker CTA */}
      <div className="container mx-auto px-4 -mt-8 md:-mt-12 relative z-20">
        <Link to="/quiz" className="block mb-10">
          <div className="w-full bg-gradient-to-r from-purple-900 via-purple-800 to-black hover:from-purple-800 hover:via-purple-700 hover:to-zinc-900 rounded-xl p-6 md:p-8 transition-all duration-300 shadow-2xl shadow-purple-900/40 hover:shadow-purple-700/50 group cursor-pointer border border-purple-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Exclusive by JJ Global Capital</p>
                  <h3 className="text-white text-xl md:text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Let AI Choose Your Home
                  </h3>
                  <p className="text-purple-200/80 text-sm md:text-base mt-1">
                    Complimentary • #1 AI Property Matchmaker in the World
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-purple-600 hover:bg-purple-500 rounded-lg px-5 py-2.5 transition-colors shadow-lg">
                <span className="text-white font-semibold">Start Now</span>
                <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation and Developer Grid */}
      <div className="container mx-auto px-4 pt-8">
        <NavigationTabs />
        <DeveloperGrid />
      </div>

      {/* Stats Counter Section */}
      <StatsCounter />

      {/* Why Dubai Section */}
      <WhyDubaiSection />

      {/* Services Section */}
      <ServicesSection />

      {/* Contact CTA Section with Direct Links */}
      <div className="container mx-auto px-4">
        <div className="text-center py-16 border-t border-zinc-800">
          <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Ready to Invest?
          </h3>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Get personalized investment advice from our expert team
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90 px-8 py-3 h-auto font-semibold">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
            </a>
            <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-green-600 text-green-500 hover:bg-green-600 hover:text-white px-8 py-3 h-auto">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </a>
            <a href={getCallUrl()}>
              <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold hover:text-black px-8 py-3 h-auto">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default Index;
