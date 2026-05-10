import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Lightbulb, 
  Gift, 
  Tablet, 
  ArrowUpRight, 
  Send,
  User,
  Mail,
  Phone,
  CheckCircle,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface IdeaSubmission {
  fullName: string;
  email: string;
  phone: string;
  idea: string;
  isAnonymous: boolean;
}

const BestIdeaAward = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [drawTicketNumber, setDrawTicketNumber] = useState("");
  const [formData, setFormData] = useState<IdeaSubmission>({
    fullName: "",
    email: "",
    phone: "",
    idea: "",
    isAnonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.idea.trim()) {
      toast.error("Please enter your idea");
      return;
    }

    if (!formData.isAnonymous) {
      if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast.error("Please fill in all contact details to enter the draw");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Generate draw ticket number
      const ticketNum = `IDEA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Save to database
      const { error } = await supabase
        .from('best_idea_submissions')
        .insert({
          idea: formData.idea,
          full_name: formData.isAnonymous ? "Anonymous" : formData.fullName,
          email: formData.isAnonymous ? null : formData.email,
          phone: formData.isAnonymous ? null : formData.phone,
          is_anonymous: formData.isAnonymous,
          user_id: user?.id || null,
          actual_name: formData.fullName || null,
          actual_email: formData.email || user?.email || null,
          actual_phone: formData.phone || null,
          draw_ticket_number: formData.isAnonymous ? null : ticketNum,
        });

      if (error) throw error;
      
      setDrawTicketNumber(ticketNum);
      setIsSubmitted(true);

    } catch (error) {
      console.error("Failed to submit idea:", error);
      toast.error("Failed to submit idea. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setIsOpen(false);
    // Reset after dialog closes
    setTimeout(() => {
      setIsSubmitted(false);
      setDrawTicketNumber("");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        idea: "",
        isAnonymous: false,
      });
    }, 300);
  };

  return (
    <section className="bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] py-16 md:py-20">
      {/* Active Champagne Section Layer - using global jj-layer-2 */}
      <div className="jj-layer-2 max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className=""
        >
          {/* Main Card - Champagne style inside active champagne layer */}
          <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-xl md:rounded-2xl border border-[#B89555]/40 md:border-2 md:border-[#B89555] shadow-[0_8px_30px_rgba(200,167,102,0.35),0_4px_15px_rgba(0,0,0,0.15)] overflow-hidden relative">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#EFE6D6]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#EFE6D6]/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <CardContent className="p-6 sm:p-8 md:p-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                {/* Left - Info */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[hsl(32,28%,13%)] to-[hsl(33,28%,11%)] rounded-xl flex items-center justify-center border border-[#B89555]/30">
                      <Lightbulb className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A] font-semibold">Monthly Challenge</span>
                      <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] leading-tight">
                        Best Idea Award
                      </h2>
                    </div>
                  </div>
                  
                  <p className="text-[#1A1A1A]/70 text-sm mb-4 leading-relaxed">
                    Have a brilliant idea that could improve our business, services, or customer experience? 
                    Share it with us and enter the monthly draw to win!
                  </p>

                  {/* Prize Display - Two Options */}
                  <div className="space-y-2 mb-4">
                    {/* iPad Pro M4 */}
                    <div className="bg-gradient-to-br from-[hsl(32,28%,13%)] to-[hsl(33,28%,11%)] rounded-lg p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent" />
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold/30 to-gold/10 rounded-lg flex items-center justify-center shrink-0">
                          <Tablet className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                        <div>
                          <p className="text-[#1A1A1A] font-bold text-sm">iPad Pro with M4 chip (13-inch)</p>
                          <p className="text-white/70 text-[11px]">Ultra Retina XDR Display • Apple Pencil Pro Compatible • Space Black</p>
                        </div>
                      </div>
                    </div>
                    {/* iPhone 16 Pro Max */}
                    <div className="bg-gradient-to-br from-[hsl(32,28%,13%)] to-[hsl(33,28%,11%)] rounded-lg p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent" />
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold/30 to-gold/10 rounded-lg flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                        <div>
                          <p className="text-[#1A1A1A] font-bold text-sm">iPhone 16 Pro Max</p>
                          <p className="text-white/90 text-[11px]">A18 Pro chip • 48MP Camera System • Titanium Design</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] italic text-center" style={{ color: '#6b7280' }}>Prize depends on the winning idea</p>
                  </div>

                  {/* Winner's Recognition */}
                  <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-[#B89555]/40 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-[#EFE6D6]/20 rounded-md flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
                      </div>
                      <span className="text-[#1A1A1A] font-bold text-xs">Winner's Recognition Package</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px]" style={{ color: '#374151' }}>
                      <li className="flex items-start gap-2">
                        <span className="text-[#1A1A1A] mt-0.5">✦</span>
                        <span>Your <span className="text-[#1A1A1A] font-semibold">portrait framed</span> & featured on our website</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#1A1A1A] mt-0.5">✦</span>
                        <span>Free <span className="text-[#1A1A1A] font-semibold">publication & recognition</span> across all platforms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#1A1A1A] mt-0.5">✦</span>
                        <span>Official <span className="text-[#1A1A1A] font-semibold">Certificate of Creativity</span> from <span data-no-translate>JBJ Global Real Estate</span></span>
                      </li>
                    </ul>
                  </div>

                  <div className="text-[11px] space-y-0.5" style={{ color: '#6b7280' }}>
                    <p>• One winner selected monthly from all valid entries</p>
                    <p>• Anonymous submissions are welcome but won't enter the draw</p>
                    <p>• <span style={{ color: '#C8A766' }} className="font-semibold">Submit multiple unique ideas = Multiple draw tickets!</span></p>
                  </div>
                </div>

                {/* Right - CTA */}
                <div className="text-center md:text-right">
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                       <Button
                        className="relative bg-[#1A1A1A] text-white border-2 border-[#1A1A1A] px-7 py-5 text-base font-bold rounded-xl transition-all duration-300 hover:bg-[#1A1A1A] hover:border-[#1A1A1A] hover:-translate-y-0.5 active:translate-y-0 group whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                      >
                        <span className="relative flex items-center gap-2 whitespace-nowrap">
                          <Lightbulb className="w-5 h-5 text-white" />
                          <span className="whitespace-nowrap text-white font-bold">Drop Your Idea</span>
                          <ArrowUpRight className="w-4 h-4 text-white ml-1" />
                        </span>
                      </Button>
                    </DialogTrigger>

                    
                    <DialogContent className="bg-[#FDFBF7] border-[#B89555]/30 max-w-lg max-h-[85vh] z-[100] mt-20 overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="text-[#1A1A1A] text-xl font-bold flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-[#1A1A1A]" />
                          Submit Your Idea
                        </DialogTitle>
                      </DialogHeader>
                      <div className="overflow-y-auto flex-1 pr-2">

                      {isSubmitted ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="py-6 text-center"
                        >
                          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                          </div>
                          <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">Idea Received Successfully!</h3>
                          
                          {!formData.isAnonymous && (
                            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-[#B89555]/40 rounded-xl p-5 mb-5">
                              <p className="text-sm text-[#1A1A1A]/70 mb-2">Your Draw Ticket Number</p>
                              <p className="text-xl font-bold text-[#1A1A1A] tracking-wider mb-2">{drawTicketNumber}</p>
                              <p className="text-xs text-[#1A1A1A]/70">This ticket is linked to your account</p>
                            </div>
                          )}

                          <div className="bg-[#F7F2EA] rounded-xl p-5 mb-5 text-left">
                            <p className="text-[#1A1A1A]/70 mb-3">
                              <span className="text-[#1A1A1A] font-semibold">We deeply appreciate</span> your creativity and the time you took to share your idea with us.
                            </p>
                            {!formData.isAnonymous ? (
                              <>
                                <p className="text-[#1A1A1A]/70 text-sm mb-2">
                                  Your idea has been linked to your contact details. In case you are the winner, we will contact you accordingly.
                                </p>
                                <p className="text-[#1A1A1A]/70 text-sm">
                                  <Sparkles className="w-4 h-4 inline text-[#1A1A1A] mr-1" />
                                  <span className="text-[#1A1A1A] font-medium">Submit another unique idea</span> to get additional draw tickets!
                                </p>
                              </>
                            ) : (
                              <p className="text-[#1A1A1A]/70 text-sm">
                                Note: Anonymous submissions don't enter the draw, but your idea will still be considered.
                              </p>
                            )}
                          </div>

                          <Button
                            onClick={handleCloseSuccess}
                            className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A] border-2 border-[#1A1A1A] px-8 py-5 font-bold shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                          >
                            Close & Submit Another Idea
                          </Button>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                          {/* Anonymous Toggle */}
                          <div className="flex items-center justify-between p-4 bg-[#F7F2EA] rounded-lg border border-[#B89555]/30">
                            <div className="flex items-center gap-3">
                              {formData.isAnonymous ? (
                                <EyeOff className="w-5 h-5 text-[#1A1A1A]/70" />
                              ) : (
                                <Eye className="w-5 h-5 text-[#1A1A1A]" />
                              )}
                              <div>
                                <Label className="text-sm font-medium text-[#1A1A1A]">Post Anonymously</Label>
                                <p className="text-xs text-[#1A1A1A]/70">
                                  {formData.isAnonymous 
                                    ? "Your details won't be visible, but you won't enter the draw"
                                    : "Enter your details to join the iPad draw"
                                  }
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={formData.isAnonymous}
                              onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: checked })}
                            />
                          </div>

                          {/* Contact Fields - Only show if not anonymous */}
                          {!formData.isAnonymous && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-4"
                            >
                              <div>
                                <Label className="text-[#1A1A1A]/70 flex items-center gap-2">
                                  <User className="w-4 h-4 text-[#1A1A1A]" />
                                  Full Name *
                                </Label>
                                <Input
                                  placeholder="John Doe"
                                  value={formData.fullName}
                                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="mt-1 border-[#B89555]/30 focus:border-[#B89555]"
                                />
                              </div>
                              <div>
                                <Label className="text-[#1A1A1A]/70 flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-[#1A1A1A]" />
                                  Email *
                                </Label>
                                <Input
                                  type="email"
                                  placeholder="john@example.com"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 border-[#B89555]/30 focus:border-[#B89555]"
                                />
                              </div>
                              <div>
                                <Label className="text-[#1A1A1A]/70 flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-[#1A1A1A]" />
                                  Phone Number *
                                </Label>
                                <Input
                                  type="tel"
                                  placeholder="+971 50 123 4567"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  className="mt-1 border-[#B89555]/30 focus:border-[#B89555]"
                                />
                              </div>
                            </motion.div>
                          )}

                          {/* Idea Field */}
                          <div>
                            <Label className="text-[#1A1A1A]/70 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-[#1A1A1A]" />
                              Your Idea *
                            </Label>
                            <Textarea
                              placeholder="Describe your idea in detail... How can we improve our services, processes, or customer experience?"
                              value={formData.idea}
                              onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                              className="mt-1 min-h-[120px] border-[#B89555]/30 focus:border-[#B89555]"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A] border-2 border-[#1A1A1A] py-6 font-bold shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                          >
                            {isSubmitting ? (
                              <>Submitting...</>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Idea {!formData.isAnonymous && "& Enter Draw"}
                              </>
                            )}
                          </Button>
                        </form>
                      )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <p className="text-sm mt-4" style={{ color: '#6b7280' }}>
                    Next draw: <span style={{ color: '#C8A766' }} className="font-semibold">{(() => {
                      const now = new Date();
                      const nextDraw = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                      return nextDraw.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    })()}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default BestIdeaAward;
