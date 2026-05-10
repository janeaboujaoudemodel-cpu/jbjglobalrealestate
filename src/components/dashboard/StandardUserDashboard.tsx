import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Home, 
  Briefcase,
  Eye,
  CheckCircle2,
  Loader2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLE_SELECTION_KEY = "jj_role_selected";

type SelectableRole = 'investor' | 'owner' | 'broker_partner' | 'visitor';

interface RoleOption {
  id: SelectableRole;
  title: string;
  subtitle: string;
  icon: typeof TrendingUp;
  color: string;
  bgGradient: string;
  benefits: string[];
  redirectPath: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'investor',
    title: 'I am an Investor',
    subtitle: 'Looking to buy or invest in property',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    benefits: [
      'Saved Properties & Portfolio',
      'Market Reports Access',
      'ROI Tools & Calculators',
      'Price Update Notifications'
    ],
    redirectPath: '/investor-dashboard'
  },
  {
    id: 'owner',
    title: 'I am a Property Owner',
    subtitle: 'Want to list or manage my properties',
    icon: Home,
    color: 'text-blue-500',
    bgGradient: 'from-blue-500/20 to-blue-600/10',
    benefits: [
      'My Listings Management',
      'Listing Status Timeline',
      'Messages from JBJ Team',
      'Document Upload Center'
    ],
    redirectPath: '/owner'
  },
  {
    id: 'broker_partner',
    title: 'I am a Broker Partner',
    subtitle: 'External broker collaborating with JBJ',
    icon: Briefcase,
    color: 'text-purple-500',
    bgGradient: 'from-purple-500/20 to-purple-600/10',
    benefits: [
      'Property Search Tools',
      'Client Shortlisting',
      'Saved Reports',
      'Broker Education (Read-only)'
    ],
    redirectPath: '/broker-partner-dashboard'
  },
  {
    id: 'visitor',
    title: 'I am just Exploring',
    subtitle: 'Browse the platform first',
    icon: Eye,
    color: 'text-[#1A1A1A]/70',
    bgGradient: 'from-zinc-400/20 to-zinc-500/10',
    benefits: [
      'Browse Properties',
      'View Market Data',
      'Explore Available Features'
    ],
    redirectPath: '/dashboard'
  }
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const StandardUserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = async (role: SelectableRole) => {
    if (isSubmitting) return;
    
    setSelectedRole(role);
    setIsSubmitting(true);

    try {
      // Save to localStorage immediately (optimistic)
      localStorage.setItem(ROLE_SELECTION_KEY, role);

      // Save to database in background
      if (user?.id) {
        // Map role to database-compatible value
        const dbRole = role as "broker" | "referral_partner" | "client" | "visitor" | "investor" | "owner" | "broker_partner";
        
        const { error } = await supabase
          .from('user_role_selections')
          .insert({
            user_id: user.id,
            selected_role: dbRole,
            confirmed_accurate: true
          } as any);

        // If duplicate key error, try update instead
        if (error && error.code === '23505') {
          await supabase
            .from('user_role_selections')
            .update({
              selected_role: dbRole,
              confirmed_accurate: true
            } as any)
            .eq('user_id', user.id);
        } else if (error) {
          console.error('Error saving role:', error);
          // Continue anyway - localStorage has the role
        }
      }

      // Find redirect path
      const roleData = ROLES.find(r => r.id === role);
      if (roleData) {
        toast.success(`Welcome! Redirecting to your ${roleData.title.replace('I am ', '').replace('a ', '').replace('an ', '')} dashboard...`);
        
        // Short delay for toast to show
        setTimeout(() => {
          navigate(roleData.redirectPath, { replace: true });
        }, 500);
      }
    } catch (err) {
      console.error('Role selection error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
      setSelectedRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] text-white">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30 mb-4">
              Welcome Back
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              How would you like to use <span className="text-[#1A1A1A]">JBJ Global Real Estate</span>?
            </h1>
            <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
              Select your role to customize your experience. You can change this anytime in your profile settings.
            </p>
          </motion.div>

          {/* Role Selection Cards */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              const isLoading = isSelected && isSubmitting;
              
              return (
                <Card 
                  key={role.id}
                  onClick={() => !isSubmitting && handleRoleSelect(role.id)}
                  className={`bg-[#FDFBF7]/50 border-2 transition-all duration-300 cursor-pointer group ${
                    isSelected 
                      ? 'border-[#B89555] bg-[#EFE6D6]/5 shadow-lg shadow-gold/20' 
                      : 'border-[#1A1A1A] hover:border-[#1A1A1A]'
                  } ${isSubmitting && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.bgGradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        {isLoading ? (
                          <Loader2 className="w-7 h-7 text-[#1A1A1A] animate-spin" />
                        ) : (
                          <Icon className={`w-7 h-7 ${role.color}`} />
                        )}
                      </div>
                      {isSelected && !isLoading && (
                        <CheckCircle2 className="w-6 h-6 text-[#1A1A1A]" />
                      )}
                    </div>
                    <CardTitle className={`text-xl mt-4 ${isSelected ? 'text-[#1A1A1A]' : 'text-white group-hover:text-[#1A1A1A]'} transition-colors`}>
                      {role.title}
                    </CardTitle>
                    <CardDescription className="text-[#1A1A1A]/70">
                      {role.subtitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {role.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-[#1A1A1A]/70">
                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#EFE6D6]' : 'bg-[#1A1A1A]'}`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-4 pt-4 border-t border-[#1A1A1A]">
                      <span className={`text-sm flex items-center gap-2 ${isSelected ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/70 group-hover:text-[#1A1A1A]'} transition-colors`}>
                        {isLoading ? 'Setting up...' : 'Select this role'} 
                        <ArrowRight className={`w-4 h-4 transition-transform ${!isLoading && 'group-hover:translate-x-1'}`} />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          {/* Note */}
          <motion.p variants={fadeInUp} className="text-center text-sm text-[#1A1A1A]/70">
            Selection is immediate. No approval required for Investor, Owner, or Broker Partner roles.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default StandardUserDashboard;
