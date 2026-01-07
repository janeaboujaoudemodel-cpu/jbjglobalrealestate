import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Briefcase, 
  Users, 
  UserCheck, 
  Eye, 
  ArrowRight, 
  Shield,
  AlertTriangle,
  Sparkles,
  GraduationCap,
  Brain,
  Award
} from "lucide-react";
import { JJLogoImage } from "./JJLogoImage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ROLE_SELECTION_KEY = "jj_role_selected";

type VisitorRole = 'broker' | 'referral_partner' | 'client' | 'visitor';

interface RoleOption {
  id: VisitorRole;
  title: string;
  subtitle: string;
  icon: typeof Briefcase;
  color: string;
  bgGradient: string;
  benefits: string[];
  showWarning?: boolean;
}

const ROLES: RoleOption[] = [
  {
    id: 'broker',
    title: 'Real Estate Broker',
    subtitle: 'Licensed professional or agency',
    icon: Briefcase,
    color: 'text-gold',
    bgGradient: 'from-gold/20 to-amber-500/10',
    benefits: [
      '3 AI Tools (Unlimited)',
      'Educational Courses',
      'HR Onboarding Portal',
      'Developer Briefings',
      'CRM Access'
    ],
    showWarning: true
  },
  {
    id: 'referral_partner',
    title: 'Referral Partner',
    subtitle: 'Earn referral commissions',
    icon: Users,
    color: 'text-purple-500',
    bgGradient: 'from-purple-500/20 to-purple-600/10',
    benefits: [
      'Partner Dashboard',
      'Referral Tracking',
      'Commission Reports',
      'Marketing Materials'
    ]
  },
  {
    id: 'client',
    title: 'Property Buyer/Investor',
    subtitle: 'Looking to buy or invest',
    icon: UserCheck,
    color: 'text-emerald-500',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    benefits: [
      'Property Search',
      'Favorites & Comparison',
      'Market Reports',
      'Consultation Booking'
    ]
  },
  {
    id: 'visitor',
    title: 'Just Browsing',
    subtitle: 'Explore our platform',
    icon: Eye,
    color: 'text-zinc-500',
    bgGradient: 'from-zinc-500/20 to-zinc-600/10',
    benefits: [
      'Browse Properties',
      'View Market Data',
      'Explore Tools'
    ]
  }
];

interface RoleSelectionModalProps {
  onRoleSelected?: (role: VisitorRole) => void;
}

const RoleSelectionModal = ({ onRoleSelected }: RoleSelectionModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<VisitorRole | null>(null);
  const [showBrokerWarning, setShowBrokerWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(5);
  const [canDismissWarning, setCanDismissWarning] = useState(false);
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if role already selected
    const hasSelectedRole = localStorage.getItem(ROLE_SELECTION_KEY);
    if (!hasSelectedRole) {
      // Show after welcome modal closes
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (showBrokerWarning && warningCountdown > 0) {
      const timer = setTimeout(() => {
        setWarningCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (warningCountdown === 0) {
      setCanDismissWarning(true);
    }
  }, [showBrokerWarning, warningCountdown]);

  const handleRoleSelect = (role: VisitorRole) => {
    setSelectedRole(role);
    if (role === 'broker') {
      setShowBrokerWarning(true);
      setWarningCountdown(5);
      setCanDismissWarning(false);
    }
  };

  const handleConfirmRole = async () => {
    if (!selectedRole) return;
    
    setIsSaving(true);
    try {
      // Generate session ID for guests
      const sessionId = !user ? `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;
      
      // Save to database
      const { error } = await supabase
        .from('user_role_selections')
        .upsert({
          user_id: user?.id || null,
          session_id: sessionId,
          selected_role: selectedRole,
          confirmed_accurate: confirmedAccurate
        }, {
          onConflict: user?.id ? 'user_id' : 'session_id'
        });

      if (error) {
        console.error('Error saving role:', error);
        // Continue anyway for guests
      }

      localStorage.setItem(ROLE_SELECTION_KEY, selectedRole);
      if (sessionId) {
        localStorage.setItem('jj_session_id', sessionId);
      }
      
      setIsOpen(false);
      onRoleSelected?.(selectedRole);
      
      if (selectedRole === 'broker') {
        toast.success('Welcome to the Broker Circle! Complete your onboarding to unlock all tools.');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackFromWarning = () => {
    setShowBrokerWarning(false);
    setSelectedRole(null);
    setWarningCountdown(5);
    setCanDismissWarning(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-white border-0 text-zinc-900 max-w-2xl p-0 overflow-hidden shadow-2xl rounded-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Select Your Role</DialogTitle>
        </VisuallyHidden.Root>

        {/* Gold accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

        <div className="relative p-8">
          <AnimatePresence mode="wait">
            {!showBrokerWarning ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <JJLogoImage variant="light" size="md" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-black mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    How Can We Help You?
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Select your role to personalize your experience
                  </p>
                </div>

                {/* Role Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    
                    return (
                      <motion.button
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                          isSelected 
                            ? 'border-gold bg-gradient-to-br from-gold/10 to-amber-500/5 shadow-lg shadow-gold/20' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.bgGradient} flex items-center justify-center mb-3`}>
                          <Icon className={`w-6 h-6 ${role.color}`} />
                        </div>

                        <h3 className="font-semibold text-black text-lg mb-1">{role.title}</h3>
                        <p className="text-gray-500 text-sm mb-3">{role.subtitle}</p>

                        {/* Benefits */}
                        <div className="space-y-1">
                          {role.benefits.slice(0, 3).map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                              <Sparkles className="w-3 h-3 text-gold" />
                              {benefit}
                            </div>
                          ))}
                          {role.benefits.length > 3 && (
                            <p className="text-xs text-gray-400">+{role.benefits.length - 3} more</p>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleConfirmRole}
                  disabled={!selectedRole || isSaving}
                  className="w-full py-6 bg-black hover:bg-zinc-900 text-gold font-semibold text-base shadow-xl rounded-xl group border border-gold/20 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Continue'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="broker-warning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                {/* Warning Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Important Notice for Brokers
                </h2>

                {/* Countdown or Continue */}
                {!canDismissWarning && (
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                      <Shield className="w-4 h-4" />
                      Please read carefully: {warningCountdown}s
                    </div>
                  </div>
                )}

                {/* Warning Content */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 text-left">
                  <p className="text-gray-700 mb-4">
                    <strong className="text-black">Select your role honestly.</strong> Your selection affects the features and tools you'll access:
                  </p>
                  
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Brokers</strong> get unlimited AI tools, CRM access, and HR onboarding</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Brokers</strong> must complete training and verification</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span><strong>Clients</strong> see buyer-focused features and consultation options</span>
                    </li>
                  </ul>

                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-sm font-medium">
                      ⚠️ Selecting "Broker" when you're a client will limit your access to client features.
                    </p>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="flex items-start gap-3 mb-6 text-left">
                  <Checkbox
                    id="confirm-accurate"
                    checked={confirmedAccurate}
                    onCheckedChange={(checked) => setConfirmedAccurate(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="confirm-accurate" className="text-sm text-gray-600 cursor-pointer">
                    I confirm that I am a <strong>licensed real estate broker</strong> or work for a real estate agency, and I understand the onboarding requirements.
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleBackFromWarning}
                    variant="outline"
                    className="flex-1 py-5 border-gray-300"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleConfirmRole}
                    disabled={!canDismissWarning || !confirmedAccurate || isSaving}
                    className="flex-1 py-5 bg-gold hover:bg-gold/90 text-black font-semibold disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Join Broker Circle'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionModal;
