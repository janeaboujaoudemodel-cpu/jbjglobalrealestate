import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { PearlButton } from "@/components/ui/pearl-button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Briefcase, 
  TrendingUp, 
  Eye, 
  ArrowRight, 
  Shield,
  AlertTriangle,
  Sparkles,
  GraduationCap,
  Brain,
  Award,
  CheckCircle,
  BookOpen,
  Settings,
  Home,
  Building2
} from "lucide-react";
import { JJLogoImage } from "./JJLogoImage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ROLE_SELECTION_KEY = "jj_role_selected";
const EMPLOYEE_WELCOMED_KEY = "jj_employee_welcomed";

// Single source of truth for brand name
const BRAND_NAME = "JBJ Global Real Estate";

type VisitorRole = 'broker' | 'investor' | 'visitor';

interface RoleOption {
  id: VisitorRole;
  title: string;
  subtitle: string;
  icon: typeof Briefcase;
  color: string;
  bgGradient: string;
  benefits: string[];
  showWarning?: boolean;
  welcomeTitle: string;
  welcomeMessage: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'broker',
    title: 'Real Estate Broker',
    subtitle: 'Join the JBJ Broker Circle',
    icon: Briefcase,
    color: 'text-[#1A1A1A]',
    bgGradient: 'from-gold/20 to-amber-500/10',
    benefits: [
      'Free AI-Powered Tools (Unlimited)',
      'Free Courses & Video Tutorials',
      'Dedicated HR Manager & Personal Assistant',
      'Personal Property Coach',
      'Developer Briefings Access',
      'Exclusive Invitations to Events & Workshops',
      'Priority Support'
    ],
    showWarning: true,
    welcomeTitle: 'Welcome to the Broker Circle!',
    welcomeMessage: 'You now have free access to all AI tools, courses, and a dedicated team to support your success.'
  },
  {
    id: 'investor',
    title: 'Buyer / Investor',
    subtitle: 'Looking to buy or invest in property',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    benefits: [
      'Premium Property Search',
      'Favorites & Comparison Tools',
      'Market Reports & Insights',
      'Property Comparison Tools',
      'Direct Consultation Booking'
    ],
    welcomeTitle: `Welcome to ${BRAND_NAME}!`,
    welcomeMessage: 'As a valued buyer, you have access to exclusive market insights and premium property listings.'
  },
  {
    id: 'visitor',
    title: 'Just Browsing',
    subtitle: 'Explore our platform first',
    icon: Eye,
    color: 'text-[#1A1A1A]/70',
    bgGradient: 'from-zinc-400/20 to-zinc-500/10',
    benefits: [
      'Browse Properties',
      'View Market Data',
      'Explore Available Features'
    ],
    welcomeTitle: `Welcome to ${BRAND_NAME}!`,
    welcomeMessage: 'We welcome you to explore our platform. Sign up to unlock AI tools and exclusive features.'
  }
];

interface RoleSelectionModalProps {
  onRoleSelected?: (role: VisitorRole) => void;
}

type ModalStep = 'selection' | 'broker-warning' | 'welcome' | 'employee-welcome';

const RoleSelectionModal = ({ onRoleSelected }: RoleSelectionModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<VisitorRole | null>(null);
  const [currentStep, setCurrentStep] = useState<ModalStep>('selection');
  const [warningCountdown, setWarningCountdown] = useState(5);
  const [canDismissWarning, setCanDismissWarning] = useState(false);
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeCheckDone, setEmployeeCheckDone] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const selectedRoleData = ROLES.find(r => r.id === selectedRole);

  // Check if user is a JBJ employee (has crm_users_profile)
  useEffect(() => {
    const checkEmployeeStatus = async () => {
      if (!user?.id) {
        setEmployeeCheckDone(true);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('crm_users_profile')
          .select('display_name, crm_role, job_title')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (data && !error) {
          // User is an employee - skip role selection, show employee welcome
          setIsEmployee(true);
          setEmployeeName(data.display_name || "Team Member");
          setEmployeeRole(data.job_title || data.crm_role || "Employee");
          
          // Check if already welcomed
          const wasWelcomed = localStorage.getItem(EMPLOYEE_WELCOMED_KEY);
          if (!wasWelcomed) {
            setCurrentStep('employee-welcome');
            setIsOpen(true);
          }
          // Mark role as selected so regular role modal doesn't show
          localStorage.setItem(ROLE_SELECTION_KEY, 'employee');
        }
      } catch (err) {
        console.error('Error checking employee status:', err);
      }
      setEmployeeCheckDone(true);
    };
    
    checkEmployeeStatus();
  }, [user?.id]);

  useEffect(() => {
    // Wait for employee check to complete before showing role selection
    if (!employeeCheckDone) return;
    
    // Don't show role selection for employees
    if (isEmployee) return;
    
    const hasSelectedRole = localStorage.getItem(ROLE_SELECTION_KEY);
    if (!hasSelectedRole) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEmployee, employeeCheckDone]);

  useEffect(() => {
    if (currentStep === 'broker-warning' && warningCountdown > 0) {
      const timer = setTimeout(() => {
        setWarningCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (warningCountdown === 0) {
      setCanDismissWarning(true);
    }
  }, [currentStep, warningCountdown]);

  const handleRoleSelect = (role: VisitorRole) => {
    setSelectedRole(role);
    if (role === 'broker') {
      setCurrentStep('broker-warning');
      setWarningCountdown(5);
      setCanDismissWarning(false);
    }
  };

  const handleConfirmRole = async () => {
    if (!selectedRole) return;
    
    // OPTIMISTIC UI: Immediately save to localStorage and show welcome screen
    localStorage.setItem(ROLE_SELECTION_KEY, selectedRole);
    setCurrentStep('welcome');
    
    // Background save to database (non-blocking)
    const saveToDatabase = async () => {
      try {
        const sessionId = !user ? `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;
        
        const insertData: {
          user_id?: string;
          session_id?: string;
          selected_role: string;
          confirmed_accurate: boolean;
        } = {
          selected_role: selectedRole,
          confirmed_accurate: confirmedAccurate
        };
        
        if (user?.id) {
          insertData.user_id = user.id;
        } else if (sessionId) {
          insertData.session_id = sessionId;
          localStorage.setItem('jj_session_id', sessionId);
        }

        const { error } = await supabase
          .from('user_role_selections')
          .insert(insertData as any);

        if (error) {
          console.error('Error saving role to database:', error);
          // Role is already saved locally, so user experience is preserved
          // Optionally show a subtle warning (not blocking)
        }
      } catch (err) {
        console.error('Background save error:', err);
        // Silent fail - local storage already has the role
      }
    };
    
    // Fire and forget - don't await
    saveToDatabase();
  };

  const handleBackFromWarning = () => {
    setCurrentStep('selection');
    setSelectedRole(null);
    setWarningCountdown(5);
    setCanDismissWarning(false);
  };

  const handleCloseWelcome = () => {
    setIsOpen(false);
    onRoleSelected?.(selectedRole!);
    
    if (selectedRole === 'broker') {
      toast.success('Complete your onboarding to unlock all broker tools!');
    } else if (selectedRole === 'investor') {
      toast.success('Explore our exclusive investment opportunities!');
    }
  };

  const handleEmployeeWelcomeClose = () => {
    localStorage.setItem(EMPLOYEE_WELCOMED_KEY, 'true');
    setIsOpen(false);
    // Navigate to CRM dashboard
    navigate('/crm');
    toast.success(`Welcome to the team, ${employeeName}!`);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-[#FDFBF7] border-0 text-[#1A1A1A] max-w-2xl p-0 overflow-hidden shadow-2xl rounded-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Select Your Role</DialogTitle>
        </VisuallyHidden.Root>

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

        <div className="relative p-8">
          <AnimatePresence mode="wait">
            {currentStep === 'selection' && (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <JJLogoImage variant="light" size="xl" showText={false} />
                  </div>
                  <h3 
                    className="text-lg md:text-xl font-bold tracking-[0.1em] text-[#1A1A1A] uppercase mb-3"
                  >
                    JBJ GLOBAL REAL ESTATE
                  </h3>
                  <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mb-2">
                    How Can We Help You?
                  </h2>
                  <p className="text-[#1A1A1A]/70 text-sm">
                    Select your role to personalize your experience
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    
                    return (
                      <motion.button
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                          isSelected 
                            ? 'border-[#B89555] bg-gradient-to-br from-gold/10 to-amber-500/5 shadow-lg shadow-gold/20' 
                            : 'border-[#B89555]/30 hover:border-[#B89555]/30 hover:bg-[#F7F2EA]'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-[#EFE6D6] rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.bgGradient} flex items-center justify-center mb-3`}>
                          <Icon className={`w-6 h-6 ${role.color}`} />
                        </div>

                        <h3 className="font-semibold text-[#1A1A1A] text-base mb-1">{role.title}</h3>
                        <p className="text-[#1A1A1A]/70 text-xs mb-3">{role.subtitle}</p>

                        <div className="space-y-1">
                          {role.benefits.slice(0, 3).map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-[#1A1A1A]/70">
                              <Sparkles className="w-3 h-3 text-[#1A1A1A] flex-shrink-0" />
                              <span className="truncate">{benefit}</span>
                            </div>
                          ))}
                          {role.benefits.length > 3 && (
                            <p className="text-xs text-[#1A1A1A]/70">+{role.benefits.length - 3} more</p>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <Button
                  onClick={handleConfirmRole}
                  disabled={!selectedRole}
                  className="w-full py-6 bg-[#1A1A1A] hover:bg-[#1A1A1A] text-[#1A1A1A] font-semibold text-base shadow-xl rounded-xl group border border-[#B89555]/20 disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}
            
            {currentStep === 'broker-warning' && (
              <motion.div
                key="broker-warning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
                  Important Notice for Brokers
                </h2>

                {!canDismissWarning && (
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                      <Shield className="w-4 h-4" />
                      Please read carefully: {warningCountdown}s
                    </div>
                  </div>
                )}

                <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-6 mb-6 text-left">
                  <p className="text-[#1A1A1A]/70 mb-4">
                    <strong className="text-[#1A1A1A]">We're excited to have you join us!</strong> As a Broker Circle member, you'll receive:
                  </p>
                  
                  <ul className="space-y-3 text-sm text-[#1A1A1A]/70">
                    <li className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Free AI Tools</strong> – Unlimited access to all AI-powered property tools</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Free Courses</strong> – Complete training library with videos & tutorials</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                      <span><strong>Dedicated Support</strong> – HR Manager, Personal Assistant, and Property Coach</span>
                    </li>
                  </ul>

                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-emerald-800 text-sm font-medium">
                      ✓ All benefits are completely free for JBJ Broker Circle members.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-6 text-left">
                  <Checkbox
                    id="confirm-accurate"
                    checked={confirmedAccurate}
                    onCheckedChange={(checked) => setConfirmedAccurate(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="confirm-accurate" className="text-sm text-[#1A1A1A]/70 cursor-pointer">
                    I confirm that I am a <strong>licensed real estate broker</strong> or work for a real estate agency, and I understand the onboarding requirements.
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleBackFromWarning}
                    variant="outline"
                    className="flex-1 py-5 border-[#B89555]/30"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleConfirmRole}
                    disabled={!canDismissWarning || !confirmedAccurate}
                    className="flex-1 py-5 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold disabled:opacity-50"
                  >
                    Join Broker Circle
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 'welcome' && selectedRoleData && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${selectedRoleData.bgGradient} border-2 border-[#B89555]/30 flex items-center justify-center`}>
                    <CheckCircle className="w-12 h-12 text-[#1A1A1A]" />
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-3">
                  {selectedRoleData.welcomeTitle}
                </h2>

                <p className="text-[#1A1A1A]/70 mb-8 max-w-md mx-auto">
                  {selectedRoleData.welcomeMessage}
                </p>

                {/* Quick Start Guide */}
                <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-6 mb-6 text-left">
                  <h3 className="font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#1A1A1A]" />
                    Quick Start Guide
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedRole === 'broker' && (
                      <>
                        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-xs font-bold text-[#1A1A1A]">1</div>
                          <span>Explore <strong>Free AI Tools</strong> in the JBJ Broker Hub</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-xs font-bold text-[#1A1A1A]">2</div>
                          <span>Access <strong>Free Courses</strong> in the Broker Toolkit</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-xs font-bold text-[#1A1A1A]">3</div>
                          <span>Your <strong>Dedicated HR & Coach</strong> will be in touch</span>
                        </div>
                      </>
                    )}
                    {selectedRole === 'investor' && (
                      <>
                        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-600">1</div>
                          <span>Browse <strong>Off-Plan Properties</strong> in Properties</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-600">2</div>
                          <span>Use <strong>Compare</strong> to shortlist your favorites</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-600">3</div>
                          <span>Book a <strong>Free Consultation</strong> with our experts</span>
                        </div>
                      </>
                    )}
                    {selectedRole === 'visitor' && (
                      <>
                        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-[#B89555]/20 flex items-center justify-center text-xs font-bold text-[#1A1A1A]/70">1</div>
                          <span>Explore <strong>Properties & Market Data</strong></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-[#B89555]/20 flex items-center justify-center text-xs font-bold text-[#1A1A1A]/70">2</div>
                          <span>Learn About <strong>UAE Real Estate Market</strong></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                          <div className="w-6 h-6 rounded-full bg-[#B89555]/20 flex items-center justify-center text-xs font-bold text-[#1A1A1A]/70">3</div>
                          <span>Access <strong>Tools Anytime</strong> from the Menu</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Change Role Hint */}
                <div className="flex items-center justify-center gap-2 text-sm text-[#1A1A1A]/70 mb-6">
                  <Settings className="w-4 h-4" />
                  <span>Made a mistake? Change your role anytime from the <strong>Menu → Settings</strong></span>
                </div>

                <PearlButton
                  onClick={handleCloseWelcome}
                  size="lg"
                  className="w-full"
                  leadingIcon={<Home strokeWidth={2.2} />}
                  trailingIcon={<ArrowRight strokeWidth={2.2} />}
                >
                  Start Exploring
                </PearlButton>

              </motion.div>
            )}

            {/* Employee Welcome Screen */}
            {currentStep === 'employee-welcome' && (
              <motion.div
                key="employee-welcome"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/10 border-2 border-[#B89555]/30 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-[#1A1A1A]" />
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">
                  Welcome Onboard!
                </h2>
                
                <p className="text-lg text-[#1A1A1A] font-semibold mb-4">{employeeName}</p>

                <p className="text-[#1A1A1A]/70 mb-6 max-w-md mx-auto">
                  Welcome to <strong>JBJ Global Real Estate</strong>! We're thrilled to have you join our team as <strong>{employeeRole}</strong>.
                </p>

                {/* What's Next Section */}
                <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-6 mb-6 text-left">
                  <h3 className="font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
                    Your CRM Dashboard Awaits
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                      <div className="w-6 h-6 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-xs font-bold text-[#1A1A1A]">1</div>
                      <span>Access your <strong>Leads & Pipeline</strong> dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                      <div className="w-6 h-6 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-xs font-bold text-[#1A1A1A]">2</div>
                      <span>Manage <strong>Tasks & Calendar</strong> from the sidebar</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                      <div className="w-6 h-6 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-xs font-bold text-[#1A1A1A]">3</div>
                      <span>Get AI assistance with <strong>Smart Reminders</strong></span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
                  <p className="text-emerald-800 text-sm font-medium">
                    ✓ Your account is ready. You can access your CRM anytime from the menu.
                  </p>
                </div>

                <Button
                  onClick={handleEmployeeWelcomeClose}
                  className="w-full py-6 bg-[#1A1A1A] hover:bg-[#1A1A1A] text-[#1A1A1A] font-semibold text-base shadow-xl rounded-xl group border border-[#B89555]/20"
                >
                  <Briefcase className="w-5 h-5 mr-2" />
                  Go to My CRM Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionModal;
