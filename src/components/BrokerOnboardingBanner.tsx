import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  ArrowRight,
  ArrowUpRight, 
  X, 
  CheckCircle2,
  Circle,
  Brain,
  GraduationCap,
  FileSignature,
  Building2,
  Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_SELECTION_KEY = "jj_role_selected";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Briefcase;
  link: string;
  completed: boolean;
}

const BrokerOnboardingBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const selectedRole = localStorage.getItem(ROLE_SELECTION_KEY);
    const dismissed = sessionStorage.getItem('broker_banner_dismissed');
    
    if (selectedRole === 'broker' && !dismissed) {
      setIsVisible(true);
      loadProgress();
    }
  }, [user]);

  const loadProgress = async () => {
    const defaultSteps: OnboardingStep[] = [
      {
        id: 'profile',
        title: 'Complete Profile',
        description: 'Fill in your details and credentials',
        icon: Briefcase,
        link: '/join',
        completed: false
      },
      {
        id: 'training',
        title: 'Company Training',
        description: 'Learn about JBJ Global Real Estate',
        icon: GraduationCap,
        link: '/onboarding',
        completed: false
      },
      {
        id: 'ai_tools',
        title: 'Access AI Tools',
        description: 'Unlock unlimited AI features',
        icon: Brain,
        link: '/ai-hub',
        completed: false
      },
      {
        id: 'developers',
        title: 'Developer Briefings',
        description: 'Schedule visits with top developers',
        icon: Building2,
        link: '/crm',
        completed: false
      },
      {
        id: 'contract',
        title: 'Sign Contract',
        description: 'Finalize your partnership',
        icon: FileSignature,
        link: '/join',
        completed: false
      }
    ];

    if (user) {
      try {
        const { data } = await supabase
          .from('broker_onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setSteps(defaultSteps.map(step => ({
            ...step,
            completed: 
              (step.id === 'profile' && data.profile_completed) ||
              (step.id === 'training' && data.company_training_completed) ||
              (step.id === 'contract' && data.contract_signed) ||
              (step.id === 'ai_tools' && data.hr_intro_completed) ||
              false
          })));
          return;
        }
      } catch (err) {
        console.log('No progress found, showing defaults');
      }
    }

    setSteps(defaultSteps);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('broker_banner_dismissed', 'true');
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  if (!isVisible || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border-b border-gold/30"
      >
        <div className="container mx-auto px-4 py-4">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/30 to-amber-500/20 border border-gold/40 flex items-center justify-center">
                <Award className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Welcome to the Broker Circle</h3>
                <p className="text-zinc-400 text-sm">Complete your onboarding to unlock all features</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-400">Onboarding Progress</span>
              <span className="text-gold font-semibold">{completedCount}/{steps.length} Complete</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-gold to-amber-500 rounded-full"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.id}
                  to={step.link}
                  className={`relative p-3 rounded-xl border transition-all ${
                    step.completed 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-gold/50 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className="text-xs text-zinc-500">Step {idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${step.completed ? 'text-emerald-400' : 'text-gold'}`} />
                    <span className={`text-sm font-medium ${step.completed ? 'text-emerald-400' : 'text-white'}`}>
                      {step.title}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{step.description}</p>
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-4 flex items-center justify-center">
            <Link to="/join">
              <Button variant="primary" className="px-6">
                Start Onboarding
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BrokerOnboardingBanner;
