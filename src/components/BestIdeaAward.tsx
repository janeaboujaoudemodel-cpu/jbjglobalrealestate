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
    <section className="pb-12 md:pb-16 bg-black">
      {/* Active Champagne Section Layer - using global jj-layer-2 */}
      <div className="jj-layer-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Card - Champagne style inside active champagne layer */}
          <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 shadow-xl overflow-hidden relative">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <CardContent className="p-8 md:p-12 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left - Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Monthly Challenge</span>
                      <h2 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Best Idea Award
                      </h2>
                    </div>
                  </div>
                  
                  <p className="text-zinc-700 mb-6 leading-relaxed">
                    Have a brilliant idea that could improve our business, services, or customer experience? 
                    Share it with us and enter the monthly draw to win!
                  </p>

                  {/* Prize Display - Two Options */}
                  <div className="space-y-3 mb-6">
                    {/* iPad Pro M4 */}
                    <div className="bg-black rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent" />
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-gold/30 to-gold/10 rounded-xl flex items-center justify-center">
                          <Tablet className="w-7 h-7 text-gold" />
                        </div>
                        <div>
                          <p className="text-gold font-bold">iPad Pro with M4 chip (13-inch)</p>
                          <p className="text-zinc-400 text-xs">Ultra Retina XDR Display • Apple Pencil Pro Compatible • Space Black</p>
                        </div>
                      </div>
                    </div>
                    {/* iPhone 16 Pro Max */}
                    <div className="bg-black rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent" />
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-gold/30 to-gold/10 rounded-xl flex items-center justify-center">
                          <Gift className="w-7 h-7 text-gold" />
                        </div>
                        <div>
                          <p className="text-gold font-bold">iPhone 16 Pro Max</p>
                          <p className="text-zinc-400 text-xs">A18 Pro chip • 48MP Camera System • Titanium Design</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-zinc-500 text-xs italic text-center">Prize depends on the winning idea</p>
                  </div>

                  {/* Winner's Recognition */}
                  <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/40 rounded-xl p-4 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gold/20 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-black font-bold text-sm">Winner's Recognition Package</span>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-700">
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">✦</span>
                        <span>Your <span className="text-gold font-semibold">portrait framed</span> & featured on our website</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">✦</span>
                        <span>Free <span className="text-gold font-semibold">publication & recognition</span> across all platforms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">✦</span>
                        <span>Official <span className="text-gold font-semibold">Certificate of Creativity</span> from <span data-no-translate>JBJ Global Real Estate</span></span>
                      </li>
                    </ul>
                  </div>

                  <div className="text-xs text-zinc-500 space-y-1">
                    <p>• One winner selected monthly from all valid entries</p>
                    <p>• Anonymous submissions are welcome but won't enter the draw</p>
                    <p>• <span className="text-gold">Submit multiple unique ideas = Multiple draw tickets!</span></p>
                  </div>
                </div>

                {/* Right - CTA */}
                <div className="text-center md:text-right">
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border-2 border-gold/50 px-10 py-7 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 transform active:scale-95 group whitespace-nowrap"
                        style={{
                          textShadow: 'none',
                          boxShadow: `
                            0 10px 30px rgba(200,167,102,0.4),
                            0 6px 15px rgba(0,0,0,0.2),
                            inset 0 2px 4px rgba(255,255,255,0.9),
                            inset 0 -2px 4px rgba(200,167,102,0.2),
                            0 0 20px rgba(200,167,102,0.3)
                          `,
                        }}
                      >
                        {/* 3D Top highlight */}
                        <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                        {/* 3D Bottom shadow */}
                        <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
                        {/* Glow effect on hover */}
                        <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                        <span className="relative flex items-center gap-2 whitespace-nowrap">
                          <Lightbulb className="w-6 h-6 text-gold group-hover:text-black transition-colors" />
                          <span className="whitespace-nowrap"><span className="text-black group-hover:text-gold transition-colors">Drop Your </span><span className="text-gold group-hover:text-black transition-colors">Idea</span></span>
                          <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold ml-1 transition-colors" />
                        </span>
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="bg-white border-gold/30 max-w-lg max-h-[85vh] z-[100] mt-20 overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="text-black text-xl font-bold flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-gold" />
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
                          <h3 className="text-2xl font-bold text-black mb-3">Idea Received Successfully!</h3>
                          
                          {!formData.isAnonymous && (
                            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/40 rounded-xl p-5 mb-5">
                              <p className="text-sm text-zinc-600 mb-2">Your Draw Ticket Number</p>
                              <p className="text-xl font-bold text-gold tracking-wider mb-2">{drawTicketNumber}</p>
                              <p className="text-xs text-zinc-500">This ticket is linked to your account</p>
                            </div>
                          )}

                          <div className="bg-zinc-50 rounded-xl p-5 mb-5 text-left">
                            <p className="text-zinc-700 mb-3">
                              <span className="text-gold font-semibold">We deeply appreciate</span> your creativity and the time you took to share your idea with us.
                            </p>
                            {!formData.isAnonymous ? (
                              <>
                                <p className="text-zinc-600 text-sm mb-2">
                                  Your idea has been linked to your contact details. In case you are the winner, we will contact you accordingly.
                                </p>
                                <p className="text-zinc-600 text-sm">
                                  <Sparkles className="w-4 h-4 inline text-gold mr-1" />
                                  <span className="text-gold font-medium">Submit another unique idea</span> to get additional draw tickets!
                                </p>
                              </>
                            ) : (
                              <p className="text-zinc-500 text-sm">
                                Note: Anonymous submissions don't enter the draw, but your idea will still be considered.
                              </p>
                            )}
                          </div>

                          <Button
                            onClick={handleCloseSuccess}
                            className="bg-black text-gold hover:bg-zinc-900 border border-gold/30 px-8 py-5"
                          >
                            Close & Submit Another Idea
                          </Button>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                          {/* Anonymous Toggle */}
                          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                            <div className="flex items-center gap-3">
                              {formData.isAnonymous ? (
                                <EyeOff className="w-5 h-5 text-zinc-500" />
                              ) : (
                                <Eye className="w-5 h-5 text-gold" />
                              )}
                              <div>
                                <Label className="text-sm font-medium text-black">Post Anonymously</Label>
                                <p className="text-xs text-zinc-500">
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
                                <Label className="text-zinc-700 flex items-center gap-2">
                                  <User className="w-4 h-4 text-gold" />
                                  Full Name *
                                </Label>
                                <Input
                                  placeholder="John Doe"
                                  value={formData.fullName}
                                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                  className="mt-1 border-zinc-300 focus:border-gold"
                                />
                              </div>
                              <div>
                                <Label className="text-zinc-700 flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gold" />
                                  Email *
                                </Label>
                                <Input
                                  type="email"
                                  placeholder="john@example.com"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  className="mt-1 border-zinc-300 focus:border-gold"
                                />
                              </div>
                              <div>
                                <Label className="text-zinc-700 flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gold" />
                                  Phone Number *
                                </Label>
                                <Input
                                  type="tel"
                                  placeholder="+971 50 123 4567"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  className="mt-1 border-zinc-300 focus:border-gold"
                                />
                              </div>
                            </motion.div>
                          )}

                          {/* Idea Field */}
                          <div>
                            <Label className="text-zinc-700 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-gold" />
                              Your Idea *
                            </Label>
                            <Textarea
                              placeholder="Describe your idea in detail... How can we improve our services, processes, or customer experience?"
                              value={formData.idea}
                              onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                              className="mt-1 min-h-[120px] border-zinc-300 focus:border-gold"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-black text-gold hover:bg-zinc-900 border border-gold/30 py-6"
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

                  <p className="text-sm text-zinc-500 mt-4">
                    Next draw: <span className="text-gold font-semibold">February 1, 2026</span>
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
