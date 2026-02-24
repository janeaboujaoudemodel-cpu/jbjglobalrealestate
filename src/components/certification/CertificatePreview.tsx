import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface CertificatePreviewProps {
  isLocked?: boolean;
}

export function CertificatePreview({ isLocked = false }: CertificatePreviewProps) {
  const { user } = useAuth();
  const userName = isLocked ? 'Your Name Here' : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Broker');
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <Card className="bg-gradient-to-br from-gold/10 via-black/40 to-gold/5 border-gold/30 overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <Award className="w-12 h-12 text-gold mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white">
              {isLocked ? 'Certificate Preview' : 'Congratulations!'}
            </h3>
            <p className="text-white/70">
              {isLocked 
                ? 'Complete all certification phases to earn this certificate'
                : "You've completed the JBJ Broker Certification Program"}
            </p>
          </div>

          {/* Certificate Preview */}
          <div 
            className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl p-8 border-2 border-gold/50 relative overflow-hidden mb-6"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Corner Decorations */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-gold/60 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-gold/60 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-gold/60 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-gold/60 rounded-br-lg" />

            <div className="text-center relative z-10">
              <div 
                className="text-3xl font-bold mb-6"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 50%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                JBJ GLOBAL REAL ESTATE
              </div>

              <div className="text-gold/80 text-sm tracking-[0.3em] uppercase mb-4">
                Certificate of Achievement
              </div>

              <div className="text-white/80 text-sm mb-2">
                This is to certify that
              </div>

              <div 
                className="text-3xl font-serif mb-4"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 50%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {userName}
              </div>

              <div className="text-white/80 text-sm mb-6 max-w-md mx-auto">
                has successfully completed all phases of the JBJ Global Real Estate
                Broker Certification Program and is hereby recognized as a
              </div>

              <div 
                className="text-xl font-semibold tracking-[0.2em] mb-6"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 50%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CERTIFIED JBJ BROKER
              </div>

              <div className="flex justify-center items-center gap-8 text-white/50 text-xs">
                <div>
                  <div className="w-24 h-px bg-gold/40 mb-2" />
                  <span>Date: {currentDate}</span>
                </div>
                <div>
                  <div className="w-24 h-px bg-gold/40 mb-2" />
                  <span>Certificate ID</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLocked ? (
              <Button disabled className="bg-gold/50 text-black/50 cursor-not-allowed">
                <Lock className="w-4 h-4 mr-2" />
                Complete Certification to Download
              </Button>
            ) : (
              <>
                <Button className="bg-gold hover:bg-gold/90 text-black">
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Achievement
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}