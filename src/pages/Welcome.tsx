import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserModeContext, type UserMode } from '@/contexts/UserModeContext';
import { JJLogoImage } from '@/components/JJLogoImage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  User, Briefcase, Building2, Handshake,
  ArrowRight, CheckCircle2, Loader2,
  TrendingUp, FileText, CalendarClock, ClipboardCheck,
  BookOpen, Users, BarChart3, Sparkles,
} from 'lucide-react';

type SelectableCategory = 'investor' | 'broker' | 'developer' | 'visitor';

interface CategoryOption {
  id: SelectableCategory;
  label: string;
  description: string;
  icon: typeof User;
  features: string[];
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'investor',
    label: 'Investor',
    description: 'Browse properties, track investments, and access market insights',
    icon: TrendingUp,
    features: ['Property Search & Comparison', 'ROI Calculator', 'Market Intelligence', 'Portfolio Tracking'],
  },
  {
    id: 'broker',
    label: 'Broker',
    description: 'Access broker tools, CRM dashboard, guides, and professional resources',
    icon: Briefcase,
    features: ['CRM Dashboard', 'Lead Management', 'Broker Guides & Education', 'Client Tools'],
  },
  {
    id: 'developer',
    label: 'Developer',
    description: 'Submit projects, upload marketing materials, and manage your launches',
    icon: Building2,
    features: ['Submit New Projects', 'Event Calendar', 'Task Requests', 'Document Uploads'],
  },
  {
    id: 'visitor',
    label: 'Explorer / Partnership',
    description: 'Explore the platform and discover partnership opportunities',
    icon: Handshake,
    features: ['Full Platform Access', 'Partnership Opportunities', 'Market Reports', 'Property Browsing'],
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setMode } = useUserModeContext();
  const [selected, setSelected] = useState<SelectableCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If not logged in, redirect to auth
  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const handleContinue = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const actualMode: UserMode = selected === 'visitor' ? 'investor' : selected;
      await setMode(actualMode);

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Welcome to JBJ Global!</span>
          <span className="text-sm text-zinc-600">
            Your {CATEGORIES.find(c => c.id === selected)?.label} experience is ready.
          </span>
        </div>,
        { duration: 4000, icon: <CheckCircle2 className="w-5 h-5 text-gold" /> }
      );

      // Route based on category
      switch (selected) {
        case 'developer':
          navigate('/developer-portal', { replace: true });
          break;
        case 'broker':
          navigate('/broker-dashboard', { replace: true });
          break;
        case 'investor':
          navigate('/my-dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
          break;
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <JJLogoImage variant="light" size="md" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Welcome to <span className="text-gold">JBJ Global</span>
          </h1>
          <p className="text-zinc-600 text-sm">
            {user.email && (
              <span>Signed in as <span className="font-medium text-black">{user.email}</span> · </span>
            )}
            Select your category to personalize your experience
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selected === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelected(cat.id)}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all duration-300 text-left",
                  "hover:shadow-lg hover:scale-[1.01]",
                  isSelected
                    ? "bg-gradient-to-br from-[#F5EBD7] to-[#D4C4A8] border-gold shadow-md"
                    : "bg-white/90 backdrop-blur-sm border-gold/15 hover:border-gold/40"
                )}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
                    isSelected
                      ? "bg-gold/20 border-gold"
                      : "bg-gold/5 border-gold/20"
                  )}>
                    <Icon className={cn("w-5 h-5", isSelected ? "text-gold" : "text-gold/60")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn("font-bold text-base", isSelected ? "text-black" : "text-black/80")}>
                        {cat.label}
                      </h3>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-gold" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{cat.description}</p>
                  </div>
                </div>
                {/* Features */}
                <div className="space-y-1">
                  {cat.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-zinc-600">
                      <Sparkles className="w-3 h-3 text-gold/50 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <Button
          onClick={handleContinue}
          disabled={!selected || isSubmitting}
          className="w-full h-14 bg-gradient-to-r from-[#D4C4A8] via-gold to-[#D4C4A8] hover:from-gold hover:to-gold text-black font-bold rounded-2xl shadow-xl disabled:opacity-50 text-base"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-center text-zinc-400 text-xs mt-6">
          You can change your category anytime from your profile settings.
        </p>
        <p className="text-center text-zinc-300 text-xs mt-2">
          © {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
        </p>
      </div>
    </div>
  );
}
