import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Clock, Star, Users, FileCheck, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';
import HRAgentChat from '@/components/hr/HRAgentChat';

const features = [
  {
    icon: FileCheck,
    title: 'CV Collection',
    description: 'Automated CV collection and verification process'
  },
  {
    icon: Users,
    title: 'Qualification Screening',
    description: 'Smart qualification questions based on role requirements'
  },
  {
    icon: UserCheck,
    title: 'Interview Guidance',
    description: 'Professional interview support with role-specific questions'
  },
  {
    icon: Star,
    title: 'Assessment Report',
    description: 'Detailed scoring and recommendations for each candidate'
  }
];

export default function HRAgent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/hr-agent');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 border border-[#B89555]/45 bg-[#F7F2EA] text-[#1A1A1A] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <UserCheck className="w-4 h-4" />
              Available 24/7 to support you
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#1A1A1A]">
              Jessica Interview Consultant
            </h1>
            <p className="text-xl text-[#1A1A1A]/80 max-w-2xl mx-auto">
              Complete your broker partner application with Jessica.
              She will guide you through CV submission, qualification, and interview preparation.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Features sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold mb-4">What to Expect</h2>
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800 dark:text-amber-200">Time Required</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        The complete process takes approximately 15-20 minutes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="jj-emerald-soft dark:bg-green-950/20 border-[color:var(--emerald-1)]/30 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-[#1A1A1A]">Secure & Private</h3>
                      <p className="text-sm text-[#1A1A1A]">
                        Your data is encrypted and only shared with our HR team
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Chat interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <HRAgentChat />
            </motion.div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
